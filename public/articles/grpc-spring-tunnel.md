最近写了一个基于 `gRPC` 的开源项目, 可以在 `SpringBoot` 项目中引入, 实现客户端和服务端只见建立长连接通信,以便于从`服务端实时推送消息给客户端`, 实现双向通信.

项目地址: [https://github.com/redjujubetree/spring-grpc-tunnel](https://github.com/redjujubetree/spring-grpc-tunnel)


# Spring gRPC Tunnel

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Maven Central](https://img.shields.io/maven-central/v/top.redjujubetree/spring-grpc-tunnel.svg)](https://search.maven.org/search?q=g:top.redjujubetree%20AND%20a:spring-grpc-tunnel)

基于 gRPC 实现的 Spring Boot 双向通信隧道框架，支持服务端与客户端之间的实时消息互通。适用于需要长连接、实时推送、双向通信的应用场景。

## 特性

- 🚀 **双向通信**: 基于 gRPC 流式通信，服务端和客户端都可以主动发送消息
- 💓 **心跳机制**: 自动心跳检测，及时发现断线情况
- 🔄 **自动重连**: 客户端断线自动重连，支持指数退避策略
- 🎯 **消息路由**: 灵活的消息处理器机制，支持自定义消息类型和处理逻辑
- 📦 **Spring Boot 集成**: 提供 Spring Boot Starter，开箱即用
- 🔌 **多客户端支持**: 服务端支持同时管理多个客户端连接
- 📊 **连接管理**: 完善的连接生命周期管理和状态监控
- 🛡️ **注册过滤**: 支持客户端注册过滤器，实现认证授权等功能

## 快速开始

### Maven 依赖

#### 服务端

```xml
<dependency>
    <groupId>top.redjujubetree</groupId>
    <artifactId>grpc-tunnel-server-spring-boot-starter</artifactId>
    <version>${lastRelease }</version>
</dependency>
```

#### 客户端

```xml
<dependency>
    <groupId>top.redjujubetree</groupId>
    <artifactId>grpc-tunnel-client-spring-boot-starter</artifactId>
    <version>${lastRelease }</version>
</dependency>
```

### 服务端配置

#### application.yaml

```yaml
grpc:
  server:
    port: 9090
    reflection-service-enabled: true
    health-service-enabled: true
    max-inbound-message-size: 4MB
  tunnel:
    server:
      enabled: true
      heartbeat-timeout: 60000  # 心跳超时时间(毫秒)
      max-clients: 1000         # 最大客户端连接数
```

#### 消息推送示例

```java
@RestController
@RequestMapping("/api")
public class MessageController {
    
    @Resource
    private TunnelServerMessageService tunnelServerMessageService;
    
    // 向指定客户端发送消息
    @PostMapping("/send/{clientId}")
    public String sendToClient(@PathVariable String clientId, @RequestBody String message) {
        TunnelMessage tunnelMessage = TunnelMessage.newBuilder()
            .setMessageId(UUID.randomUUID().toString())
            .setClientId(clientId)
            .setType(MessageType.SERVER_REQUEST)
            .setRequest(RequestPayload.newBuilder()
                .setType("NOTIFY")
                .setData(ByteString.copyFromUtf8(message))
                .build())
            .build();
            
        boolean success = tunnelServerMessageService.sendToClient(clientId, tunnelMessage);
        return success ? "发送成功" : "发送失败";
    }
    
    // 广播消息给所有客户端
    @PostMapping("/broadcast")
    public String broadcast(@RequestBody String message) {
        TunnelMessage tunnelMessage = TunnelMessage.newBuilder()
            .setMessageId(UUID.randomUUID().toString())
            .setType(MessageType.SERVER_REQUEST)
            .setRequest(RequestPayload.newBuilder()
                .setType("BROADCAST")
                .setData(ByteString.copyFromUtf8(message))
                .build())
            .build();
            
        int count = tunnelServerMessageService.broadcast(tunnelMessage);
        return "广播成功，发送给 " + count + " 个客户端";
    }
}
```

#### 自定义消息处理器

```java
@Component
public class CustomServerMessageHandler extends AbstractClientRequestMessageHandler {
    
    @Override
    protected boolean supportRequestType(String requestType) {
        return "CUSTOM_MESSAGE".equals(requestType);
    }
    
    @Override
    protected ResponsePayload handleRequest(RequestPayload request) {
        String data = request.getData().toStringUtf8();
        log.info("收到客户端消息: {}", data);
        
        // 处理业务逻辑
        // ...
        
        // 返回响应（如果需要）
        return ResponsePayload.newBuilder()
            .setCode(200)
            .setType(request.getType())
            .setMessage("消息已处理")
            .setData(ByteString.copyFromUtf8("{\"result\":\"success\"}"))
            .build();
    }
}
```

### 客户端配置

#### application.yaml

```yaml
grpc:
  client:
    tunnel-service:
      address: static://localhost:9090
      negotiation-type: plaintext
      tunnel:
        enabled: true
        auto-connect: true         # 自动连接
        auto-reconnect: true        # 自动重连
        heartbeat-interval: 30000   # 心跳间隔(毫秒)
        reconnect-delay: 5000       # 重连延迟(毫秒)
        max-reconnect-delay: 300000 # 最大重连延迟(毫秒)
        exponential-backoff: true   # 指数退避
        request-timeout: 30000      # 请求超时(毫秒)
```

#### 发送消息示例

```java
@Service
public class ClientMessageService {
    
    @GrpcClientTunnel("tunnel-service")
    private GrpcTunnelClientService grpcTunnelClientService;
    
    // 发送请求并等待响应
    public void sendRequest() {
        CompletableFuture<TunnelMessage> future = grpcTunnelClientService.sendRequest(
            "CUSTOM_MESSAGE", 
            "{\"action\":\"getData\",\"params\":{}}"
        );
        
        future.whenComplete((response, error) -> {
            if (error != null) {
                log.error("请求失败", error);
            } else {
                log.info("收到响应: {}", response.getResponse().getMessage());
            }
        });
    }
    
    // 发送单向消息（不需要响应）
    public void sendOneWayMessage() {
        grpcTunnelClientService.sendOneWay(
            "LOG_MESSAGE",
            "{\"level\":\"info\",\"message\":\"客户端日志\"}"
        );
    }
}
```

#### 自定义消息处理器

```java
@Component
public class CustomClientMessageHandler extends AbstractServerRequestMessageHandler {
    
    @Override
    protected boolean supportRequestType(String requestType) {
        return "NOTIFY".equals(requestType);
    }
    
    @Override
    protected ResponsePayload handleServerCommand(RequestPayload request) {
        String data = TunnelMessagesUtil.deserializeRequest(request, String.class);
        log.info("收到服务端通知: {}", data);
        
        // 处理业务逻辑
        // ...
        
        // 返回确认响应（可选）
        return ResponsePayload.newBuilder()
            .setCode(200)
            .setType(request.getType())
            .setMessage("已收到通知")
            .build();
    }
}
```

## 高级特性

### 多客户端支持

客户端可以配置多个 tunnel 连接：

```yaml
grpc:
  client:
    tunnel-service1:
      address: static://server1:9090
      tunnel:
        enabled: true
    tunnel-service2:
      address: static://server2:9090
      tunnel:
        enabled: true
```

使用 `@GrpcClientTunnel` 注解注入不同的服务：

```java
@GrpcClientTunnel("tunnel-service1")
private GrpcTunnelClientService tunnelService1;

@GrpcClientTunnel("tunnel-service2")
private GrpcTunnelClientService tunnelService2;
```

### 客户端注册过滤器

服务端可以通过实现 `ClientRegisterFilter` 接口来过滤客户端连接：

```java
@Component
public class AuthenticationFilter implements ClientRegisterFilter {
    
    @Override
    public ConnectionResult doFilter(TunnelMessage message, RegisterRequest request) {
        // 验证客户端身份
        if (!isValidClient(request)) {
            return ConnectionResult.reject("认证失败");
        }
        
        // 添加元数据
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("userId", getUserId(request));
        
        return ConnectionResult.acceptWithMetadata("认证成功", metadata);
    }
    
    @Override
    public int getOrder() {
        return 0; // 优先级
    }
}
```

### 连接生命周期监听

监听客户端连接关闭事件：

```java
@Component
public class ClientOfflineHandler implements ClientConnectionCloseListener {
    
    @Override
    public void onClientConnectionClosed(String clientId) {
        log.info("客户端 {} 已断开连接", clientId);
        // 执行清理逻辑
    }
}
```

### 自定义心跳处理

```java
@Bean
public HeartbeatHandler customHeartbeatHandler() {
    return new HeartbeatHandler() {
        @Override
        public void handleHeartbeat(TunnelMessage message) {
            log.info("收到心跳: {}", message.getClientId());
        }
        
        @Override
        public void handleTimeout(String clientId) {
            log.error("客户端 {} 心跳超时", clientId);
            // 处理超时逻辑
        }
    };
}
```

### 自定义客户端 ID 生成器

```java
@Component
public class CustomClientIdGenerator implements ClientIdGenerator {
    
    @Override
    public String generate(String clientName, TunnelProperties properties) {
        // 自定义客户端 ID 生成逻辑
        return String.format("%s:%s:%s", 
            getHostName(), 
            clientName, 
            UUID.randomUUID().toString());
    }
}
```

## 消息结构

消息使用 Protocol Buffers 定义：

```protobuf
message TunnelMessage {
    string message_id = 1;      // 消息ID
    string client_id = 2;        // 客户端ID
    MessageType type = 3;        // 消息类型
    int64 timestamp = 4;         // 时间戳
    RequestPayload request = 5;  // 请求载荷
    ResponsePayload response = 6; // 响应载荷
    string correlation_id = 7;   // 关联ID
}

enum MessageType {
  SERVER_REQUEST = 0;   // 由服务端发起的请求
  SERVER_RESPONSE = 1;  // 对应服务端请求的响应
  CLIENT_REQUEST = 2;   // 由客户端发起的请求
  CLIENT_RESPONSE = 3;  // 对应客户端请求的响应
}

message RequestPayload {
    string type = 1;  // 业务类型
    bytes data = 2;   // 业务数据(JSON)
}

message ResponsePayload {
    string type = 1;    // 业务类型
    int32 code = 2;     // 响应码
    string message = 3; // 响应消息
    bytes data = 4;     // 响应数据(JSON)
}
```

## 监控与管理

### 连接状态查询

```java
@RestController
public class MonitorController {
    
    @Autowired
    private GrpcTunnelServerService tunnelServerService;
    
    @Autowired
    private ConnectionManager connectionManager;
    
    @GetMapping("/clients")
    public Set<String> getConnectedClients() {
        return tunnelServerService.getConnectedClients();
    }
    
    @GetMapping("/client/{clientId}")
    public ClientConnectionInfo getClientInfo(@PathVariable String clientId) {
        return tunnelServerService.getClientInfo(clientId)
            .orElseThrow(() -> new RuntimeException("客户端不存在"));
    }
    
    @GetMapping("/statistics")
    public Map<String, Object> getStatistics() {
        return connectionManager.getStatistics();
    }
}
```

### 客户端健康检查

```java
// 获取客户端连接健康状态
Map<String, Object> health = grpcTunnelClientService.getConnectionHealth();

// 获取重连状态
Map<String, Object> reconnectStatus = grpcTunnelClientService.getReconnectStatus();
```

## 示例项目

完整的示例代码请参考：
- 服务端示例：[grpc-tunnel-server-demo](./grpc-tunnel-server-demo)
- 客户端示例：[grpc-tunnel-client-demo](./grpc-tunnel-client-demo)

## 架构说明

```
┌─────────────────────────────────────────────────────────────┐
│                        Server Side                          │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐   ┌─────────────┐   ┌──────────────┐  │
│  │MessageHandlers│   │ Connection  │   │  Heartbeat   │  │
│  │               │   │  Manager    │   │   Checker    │  │
│  └───────┬───────┘   └──────┬──────┘   └──────┬───────┘  │
│          │                   │                  │          │
│          └───────────────────┴──────────────────┘          │
│                              │                              │
│                 ┌────────────┴────────────┐                │
│                 │ GrpcTunnelServerService │                │
│                 └────────────┬────────────┘                │
└─────────────────────────────┬───────────────────────────────┘
                              │
                         gRPC Stream
                              │
┌─────────────────────────────┬───────────────────────────────┐
│                 ┌────────────┴────────────┐                │
│                 │ GrpcTunnelClientService │                │
│                 └────────────┬────────────┘                │
│                              │                              │
│          ┌───────────────────┴──────────────────┐          │
│          │                   │                  │          │
│  ┌───────┴───────┐   ┌──────┴──────┐   ┌──────┴───────┐  │
│  │MessageHandlers│   │  Heartbeat  │   │Auto Reconnect│  │
│  │               │   │   Sender    │   │              │  │
│  └───────────────┘   └─────────────┘   └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                        Client Side                          │
└─────────────────────────────────────────────────────────────┘
```

## 性能优化建议

1. **心跳间隔**: 根据网络环境调整心跳间隔，局域网可设置较短间隔(10-30秒)，公网建议30-60秒
2. **消息大小**: 默认限制4MB，可通过 `max-inbound-message-size` 调整
3. **线程池**: 服务端可配置专门的线程池处理消息
4. **批量发送**: 高频消息场景建议批量打包发送
5. **连接复用**: 客户端应复用连接，避免频繁创建销毁

## 常见问题

### Q: 客户端如何处理断线重连？
A: 客户端默认开启自动重连，使用指数退避策略。可通过配置调整重连参数。

### Q: 如何实现认证授权？
A: 实现 `ClientRegisterFilter` 接口，在客户端注册时进行认证。也可以在消息处理器中实现权限检查。

### Q: 支持 TLS/SSL 吗？
A: 支持，配置 `grpc.client.{name}.negotiation-type=tls` 并提供证书即可。

### Q: 如何处理大量客户端连接？
A: 调整 `max-clients` 参数，优化线程池配置，考虑使用负载均衡分散连接。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 Apache License 2.0 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 作者: Kenny
- 邮箱: redjujubetree@gmail.com
- GitHub: [https://github.com/redjujubetree/spring-grpc-tunnel](https://github.com/redjujubetree/spring-grpc-tunnel)

## 相关项目 / Related Projects

本项目基于 [grpc-spring](https://github.com/grpc-ecosystem/grpc-spring) 实现，感谢原作者的贡献。