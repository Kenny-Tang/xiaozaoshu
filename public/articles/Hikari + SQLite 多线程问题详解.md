# ⚠️ Hikari + SQLite 多线程问题详解

## 核心问题

**SQLite 本质上是单线程数据库，而 Hikari 连接池设计用于多线程并发访问，两者结合会产生严重的数据一致性和并发问题。**

## 问题根源分析

### 1. **SQLite 的线程模型限制**

```
SQLite 编译模式：
├── Single-thread (不安全)
├── Multi-thread (序列化访问)  
└── Serialized (默认，但仍有限制)
```

**关键限制：**
- SQLite 数据库文件同时只能有一个写入连接
- 多个读连接可以共存，但写入时会阻塞所有读取
- WAL 模式虽然改善了并发，但仍有写入瓶颈

### 2. **Hikari 连接池的假设**

Hikari 设计假设：
```java
// Hikari 的多连接设计理念
Connection conn1 = dataSource.getConnection(); // 线程1
Connection conn2 = dataSource.getConnection(); // 线程2
// 期望：两个连接可以并发执行不同事务
```

**但对 SQLite：**
```java
// 实际情况
Connection conn1 = dataSource.getConnection(); // 指向同一个 SQLite 文件
Connection conn2 = dataSource.getConnection(); // 指向同一个 SQLite 文件
// 结果：conn2 的写操作会被 conn1 阻塞
```

## 具体问题表现

### 1. **数据库锁定问题**

```java
// 线程1：长时间事务
@Transactional
public void longRunningTransaction() {
    sessionMapper.insert(session1);
    // 长时间处理...
    Thread.sleep(5000);
    sessionMapper.insert(session2);
    // 事务未提交，持有写锁
}

// 线程2：简单查询
public Optional<Session> getSession(String id) {
    // 被阻塞，直到线程1事务提交
    return sessionMapper.selectById(id);
}
```

**结果：** 线程2 会一直等待，甚至超时

### 2. **Dead Lock 死锁**

```java
// 场景：两个线程同时操作
Thread 1:                          Thread 2:
BEGIN TRANSACTION                  BEGIN TRANSACTION
UPDATE session SET ...             UPDATE chunk SET ...
↓                                 ↓
UPDATE chunk SET ...              UPDATE session SET ...
(等待 Thread 2 释放 chunk 锁)      (等待 Thread 1 释放 session 锁)
↓                                 ↓
DEADLOCK! 💀                      DEADLOCK! 💀
```

### 3. **Connection Pool Exhaustion**

```java
// 连接池配置
maximum-pool-size: 10

// 运行时状态
Active connections: 10/10
Waiting threads: 50+
All connections waiting for SQLite write lock

// 结果：整个应用假死
```

### 4. **事务隔离失效**

```java
// 线程1：创建会话
@Transactional
public void createSession() {
    sessionMapper.insert(session);
    // 事务未提交
}

// 线程2：查询会话（不同连接）
public Session getSession() {
    // SQLite WAL 模式下可能读到不一致的数据
    return sessionMapper.selectById(id);
}
```

## WAL 模式的陷阱

```yaml
# 你的配置
url: jdbc:sqlite:file:xxx.db?journal_mode=WAL
```

**WAL 模式问题：**

1. **读写分离的假象**
```
WAL 模式看起来支持并发：
Reader 1  ──→  Database File
Reader 2  ──→  Database File  
Writer    ──→  WAL File

但实际上：
- 只能有一个 Writer
- Writer 执行时，Reader 可能读到不一致状态
- Checkpoint 操作会阻塞所有连接
```

2. **连接池中的 WAL 混乱**
```java
Connection pool:
[Conn1: READ] [Conn2: WRITE] [Conn3: READ] [Conn4: WRITE-WAITING]

SQLite 实际状态：
- Conn2 持有写锁
- Conn4 等待写锁  
- Conn1, Conn3 可能读到不同版本的数据
```

## 性能问题

### 1. **False Concurrency**

```java
// 代码期望的并发
public void uploadChunk() {
    chunkProcessorPool.submit(() -> {
        // 50个线程并发处理
        processChunk();
    });
}

// 实际的执行
SQLite: [Thread-1: WRITE] 
        [Thread-2: WAITING]
        [Thread-3: WAITING]  
        [Thread-4: WAITING]
        ...
        [Thread-50: WAITING]

// 结果：串行执行，但有线程切换开销
```

### 2. **连接池开销**

```java
// 每个线程获取连接
Connection conn = dataSource.getConnection();

// Hikari 内部开销：
- 连接验证
- 连接代理创建  
- 连接状态管理
- 连接返回池中

// 但对 SQLite：这些连接本质上都指向同一个文件
// 白白消耗了内存和 CPU
```

## 内存泄露风险

```java
// Hikari 连接池
HikariPool connections: [
    Connection1 -> SQLite File Handle 1
    Connection2 -> SQLite File Handle 2  
    Connection3 -> SQLite File Handle 3
    ...
]

// SQLite 驱动内部
SQLite Native Library:
- File Handle 1: 文件描述符 + 缓存
- File Handle 2: 文件描述符 + 缓存  
- File Handle 3: 文件描述符 + 缓存
```

**问题：** 多个文件句柄指向同一文件，浪费内存且可能导致缓存不一致

## 正确的解决方案

### 1. **单连接模式**（推荐用于 SQLite）

```yaml
spring:
  datasource:
    url: jdbc:sqlite:file:xxx.db?journal_mode=WAL
    hikari:
      maximum-pool-size: 1
      minimum-idle: 1
      connection-timeout: 30000
```

### 2. **使用 SQLite 专用连接池**

```java
@Configuration
public class SQLiteConfig {
    
    @Bean
    @Primary
    public DataSource dataSource() {
        // 使用单连接包装器，而不是 Hikari
        return new SingleConnectionDataSource(
            "jdbc:sqlite:file:xxx.db", 
            true // suppress close
        );
    }
}
```

### 3. **改用适合多线程的数据库**

```yaml
# 生产环境推荐
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/filedb
    # 或
    url: jdbc:mysql://localhost:3306/filedb
```

### 4. **应用层串行化**

```java
@Service
public class SQLiteAwareService {
    
    private final Object sqliteLock = new Object();
    
    public void writeOperation() {
        synchronized (sqliteLock) {
            // 所有写操作串行化
            sessionMapper.insert(session);
        }
    }
    
    public Session readOperation() {
        // 读操作可以并发（在 WAL 模式下）
        return sessionMapper.selectById(id);
    }
}
```

## 总结

**Hikari + SQLite 的根本问题：**
1. SQLite 是单写入数据库，多连接池没有意义
2. 连接池开销 > 性能收益
3. 事务隔离和数据一致性问题
4. 容易产生死锁和连接耗尽
5. 内存浪费和潜在的缓存问题

**建议：**
- **测试/开发环境：** 使用单连接配置
- **生产环境：** 切换到 PostgreSQL/MySQL
- **如果必须用 SQLite：** 应用层实现串行化控制

这就是为什么几乎所有 SQLite 最佳实践都建议避免连接池的原因。