SpringBoot可以集成AI模型，实现智能化应用开发

SpringAI2.0 + SpringBoot4.0 进行集成

## pom
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="
           http://maven.apache.org/POM/4.0.0
           http://maven.apache.org/xsd/maven-4.0.0.xsd">

    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>spring-ai-deepseek-boot4</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <!-- Spring Boot 4 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.1</version>
        <relativePath/>
    </parent>

    <properties>
        <java.version>17</java.version>
        <spring-ai.version>2.0.0-M1</spring-ai.version>
    </properties>

    <!-- Spring AI BOM -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.ai</groupId>
                <artifactId>spring-ai-bom</artifactId>
                <version>${spring-ai.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>

        <!-- Web (MVC) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring AI - OpenAI Compatible (DeepSeek) -->
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-starter-model-openai</artifactId>
        </dependency>

        <!-- JSON -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>

        <!-- 必须显式补：Boot 4 下常见缺失 -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context-support</artifactId>
        </dependency>

    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```

## application.yml

使用openai的接口规范, 具体的模型选择DeepSeek配置

这里以DeepSeek为例, 如果你使用的是阿里千问等其他OpenAI兼容模型, 只需修改 base-url 和 api-key 即可
```yaml
server:
  port: 8080


spring:
  ai:
    openai:
      # 使用openai的接口规范, 具体的模型选择DeepSeek配置
      # 这里以DeepSeek为例, 如果你使用的是阿里千问等其他OpenAI兼容模型, 只需修改 base-url 和 api-key 即可
      base-url: https://api.deepseek.com
      api-key: sk-********388
      chat:
        options:
          temperature: 0.7
          max-tokens: 1024
    models:
      deepseek:
        provider: openai
        model: deepseek-coder

    retry:
      enabled: false

# 开启调试日志（学习阶段很有用）
logging:
  level:
    root: INFO

    # Spring AI 核心
    org.springframework.ai: DEBUG
    org.springframework.ai.chat: DEBUG
    org.springframework.ai.openai: DEBUG

    # HTTP 客户端（最关键）
    org.springframework.web.client: DEBUG

    # Reactor Netty（真正发请求的地方）
    reactor.netty.http.client: DEBUG

```

## 示例代码

AiModelType:
- DEEPSEEK("deepseek-chat"),
- DEEPSEEK_CODER("deepseek-coder");
- 这里可以配置使用的不同的模型ID

```java
@Component
public class AiChatClientFactory {

    private final Map<AiModelType, ChatClient> clientMap = new EnumMap<>(AiModelType.class);

    public AiChatClientFactory(ChatClient.Builder builder) {
        // 通过构建器创建不同模型的 ChatClient 实例
        for (AiModelType type : AiModelType.values()) {
            ChatClient client = builder.clone()
                    .defaultOptions(
                            ChatOptions.builder().model(type.modelId()).build()
                    ).build();

            clientMap.put(type, client);
        }
    }

    public ChatClient getClient(AiModelType type) {
        return clientMap.get(type);
    }
}
```