# 高性能 gRPC 文件上传系统架构设计

## 1. 整体架构图

```
┌─────────────────────────────────────────┐
│              客户端层                    │
├─────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   文件分片   │  │   并发上传池     │   │
│  │   管理器    │  │  (多个gRPC流)   │   │
│  └─────────────┘  └─────────────────┘   │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  断点续传   │  │   进度监控      │   │
│  │   控制器    │  │   & 重试机制    │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    │
                 gRPC 流
                    │
┌─────────────────────────────────────────┐
│              服务端层                    │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐ │
│  │        gRPC Service Layer          │ │
│  │  ┌──────────┐ ┌──────────────────┐ │ │
│  │  │流式上传接口│ │ 会话管理接口     │ │ │
│  │  └──────────┘ └──────────────────┘ │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │       业务逻辑层 (Service)          │ │
│  │  ┌──────────┐ ┌──────────────────┐ │ │
│  │  │上传会话管理│ │ 分片处理引擎     │ │ │
│  │  └──────────┘ └──────────────────┘ │ │
│  │  ┌──────────┐ ┌──────────────────┐ │ │
│  │  │文件完整性│ │  并发控制器      │ │ │
│  │  │验证引擎  │ │                  │ │ │
│  │  └──────────┘ └──────────────────┘ │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │         存储层 (Storage)           │ │
│  │  ┌──────────┐ ┌──────────────────┐ │ │
│  │  │临时文件存储│ │ 元数据存储       │ │ │
│  │  │(RandomFile)│ │ (内存+持久化)   │ │ │
│  │  └──────────┘ └──────────────────┘ │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 2. 核心设计理念

### 2.1 分层架构
- **接口层**: gRPC 服务定义，提供标准化 API
- **业务层**: 核心业务逻辑，会话管理和分片处理
- **存储层**: 文件存储和元数据管理

### 2.2 关键设计原则
- **高并发**: 支持多流并发上传，提升吞吐量
- **容错性**: 乱序接收、自动去重、断点续传
- **可扩展**: 模块化设计，易于扩展和维护
- **高性能**: 异步处理、内存优化、零拷贝

## 3. 技术组件详解

### 3.1 gRPC 协议设计
```protobuf
// 核心服务接口
service FileTransferService {
  rpc InitiateUpload(InitiateUploadRequest) returns (InitiateUploadResponse);
  rpc UploadChunk(stream UploadChunkRequest) returns (stream UploadChunkResponse);
  rpc GetUploadStatus(GetUploadStatusRequest) returns (GetUploadStatusResponse);
  rpc CompleteUpload(CompleteUploadRequest) returns (CompleteUploadResponse);
}
```

**设计亮点**:
- 分阶段上传：初始化 → 分片上传 → 完成验证
- 双向流式传输：支持并发分片和实时响应
- 状态查询接口：支持断点续传和进度监控

### 3.2 会话管理器 (UploadSessionManager)
```java
// 核心数据结构
public class UploadSession {
    private final Set<Integer> uploadedChunks = ConcurrentHashMap.newKeySet();
    private final Map<Integer, ChunkInfo> chunkInfoMap = new ConcurrentHashMap<>();
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
}
```

**核心功能**:
- **会话生命周期管理**: 创建、维护、清理
- **分片状态跟踪**: 记录已上传分片，支持去重
- **并发安全**: 读写锁保护，支持并发访问
- **断点续传**: 持久化上传状态

### 3.3 并发处理引擎
```java
// 异步处理线程池
private ExecutorService executorService = Executors.newFixedThreadPool(20);

// 分片异步处理
executorService.submit(() -> processChunk(request, responseObserver));
```

**性能优化**:
- **线程池管理**: 限制并发数，避免资源耗尽
- **异步处理**: 非阻塞分片处理
- **流式传输**: 支持多个 gRPC 流并发上传

## 4. 关键技术实现

### 4.1 分片乱序接收
```java
public boolean writeChunk(int chunkIndex, long offset, byte[] data, String chunkHash) {
    // 检查重复上传
    if (uploadedChunks.contains(chunkIndex)) {
        return true; // 幂等处理
    }
    
    // 随机位置写入
    RandomAccessFile raf = getRandomAccessFile();
    raf.seek(offset);
    raf.write(data);
    
    uploadedChunks.add(chunkIndex);
}
```

### 4.2 自动去重机制
```java
// 基于分片索引的去重
private final Set<Integer> uploadedChunks = ConcurrentHashMap.newKeySet();

// 基于内容哈希的验证
private boolean verifyChunkHash(byte[] data, String expectedHash) {
    // MD5 校验确保数据完整性
}
```

### 4.3 断点续传实现
```java
// 1. 客户端查询已上传分片
GetUploadStatusResponse status = stub.getUploadStatus(request);

// 2. 跳过已上传的分片
if (status.getUploadedChunksList().contains(chunkIndex)) {
    continue; // 跳过已上传分片
}

// 3. 仅上传缺失分片
uploadMissingChunks(status.getMissingChunksList());
```

## 5. 客户端架构设计

### 5.1 并发上传控制器
```java
public class ConcurrentUploadController {
    private final ExecutorService uploadPool;
    private final Semaphore concurrencyLimit;
    private final List<ManagedChannel> channels;
    
    // 多通道并发上传
    public void startConcurrentUpload() {
        for (int i = 0; i < concurrency; i++) {
            uploadPool.submit(new ChunkUploadTask(channels.get(i % channels.size())));
        }
    }
}
```

### 5.2 智能重试机制
```java
public class RetryController {
    private final ExponentialBackoff backoff;
    private final Map<Integer, Integer> chunkRetryCount;
    
    // 指数退避重试
    public boolean shouldRetry(int chunkIndex, Exception error) {
        int retryCount = chunkRetryCount.getOrDefault(chunkIndex, 0);
        return retryCount < maxRetries && isRetriableError(error);
    }
}
```

## 6. 性能优化策略

### 6.1 内存优化
- **分片大小控制**: 默认 1MB，平衡内存和网络效率
- **流式处理**: 避免大文件全量加载
- **缓冲区复用**: 减少内存分配开销

### 6.2 网络优化
- **并发连接**: 多个 gRPC 通道并行传输
- **压缩传输**: gRPC 内置压缩支持
- **连接复用**: 长连接减少握手开销

### 6.3 存储优化
- **随机写入**: RandomAccessFile 支持任意位置写入
- **写入缓冲**: 操作系统级别的写缓冲优化
- **临时文件**: 上传完成后原子性移动到最终位置

## 7. 监控和运维

### 7.1 关键指标监控
```java
// 性能指标
- 上传速度 (MB/s)
- 并发连接数
- 分片成功率
- 平均响应时间

// 业务指标  
- 活跃上传会话数
- 断点续传成功率
- 文件完整性验证通过率
```

### 7.2 异常处理和恢复
```java
// 自动重试策略
@Retryable(value = {IOException.class}, maxAttempts = 3)

// 熔断保护
@CircuitBreaker(name = "file-upload", fallbackMethod = "fallbackUpload")

// 会话清理
@Scheduled(fixedRate = 300000) // 5分钟清理一次过期会话
```

## 8. 部署和扩展

### 8.1 水平扩展支持
- **无状态设计**: 会话信息可外部存储（Redis/数据库）
- **负载均衡**: 支持多实例部署
- **存储分离**: 文件存储可使用分布式存储系统

### 8.2 配置参数调优
```yaml
# 性能调优参数
grpc:
  server:
    max-inbound-message-size: 4MB
    max-concurrent-calls-per-connection: 10
    
file-upload:
  chunk-size: 1MB
  max-concurrent-uploads: 20
  session-timeout: 1h
  cleanup-interval: 5m
```

## 9. 安全考虑

### 9.1 数据完整性
- **分片级校验**: 每个分片 MD5 验证
- **文件级校验**: 完整文件哈希验证
- **传输加密**: gRPC TLS 支持

### 9.2 访问控制
- **会话隔离**: 基于客户端 ID 的会话隔离
- **权限验证**: 可集成认证授权机制
- **资源限制**: 防止恶意大文件上传

这个架构设计提供了企业级的高性能文件上传解决方案，具备高并发、高可用、易扩展的特点。



## 总结

通过将文件存储功能抽象出来，我们实现了一个灵活、可扩展的架构设计：

### 🏗️ 架构优势

1. **解耦合**: 业务逻辑与存储实现完全分离
2. **可扩展**: 轻松添加新的存储后端（S3、MinIO、HDFS等）
3. **可配置**: 通过Spring Profile动态切换存储类型
4. **高性能**: 支持本地高速存储和云存储的不同优势

### 📦 核心组件

**抽象层**:
- `FileStorageService` 接口：统一的存储操作API
- `StorageConfiguration` 接口：存储配置抽象

**实现层**:
- `LocalFileStorageService`：本地文件系统存储
- `OSSFileStorageService`：阿里云OSS存储
- `HybridFileStorageService`：混合存储策略

**业务层**:
- `FileTransferServiceImpl`：重构后的gRPC服务，专注业务逻辑

### 🚀 使用场景

1. **开发测试**: 使用本地存储，快速开发调试
2. **生产环境**: 使用云存储，保证可靠性和扩展性
3. **混合部署**: 小文件本地缓存，大文件云存储

### 🔧 配置示例

```yaml
# 本地开发
spring.profiles.active: local

# 生产环境  
spring.profiles.active: prod

# 混合存储
spring.profiles.active: hybrid
```

这个设计实现了真正的**存储无关性**，让文件上传系统能够适应不同的部署环境和业务需求，同时保持代码的整洁和可维护性。