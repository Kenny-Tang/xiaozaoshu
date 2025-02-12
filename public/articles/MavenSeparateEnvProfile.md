在使用 Maven 时，可以通过配置 Maven 的 profile 来实现根据不同的环境打包不同目录下的配置文件。以下是一个常见的实现方案：


# 文件结构示例
假设项目目录如下：
```scss
src
├── main
│   ├── java
│   ├── resources
│   │   ├── application.properties (默认配置)
│   │   ├── dev
│   │   │   └── application.properties (开发环境配置)
│   │   ├── test
│   │   │   └── application.properties (测试环境配置)
│   │   ├── prod
│   │   │   └── application.properties (生产环境配置)
```

# 配置 Maven 的 pom.xml
在 pom.xml 中配置 profiles 和 build。 
- 默认特定环境的配置不出现在最终打包文件中 
- 如果指定环境中和主目录中含有相同文件配置，优先使用自定义的配置 
- 每个环境配置指定自己的打包资源配置 
  - 开发环境使用 dev 下的配置
  - 测试环境使用 test 下的配置
  - 生产环境使用 prod 下的配置
```xml
<project>
    <build>
        <resources>
            <!-- 默认资源文件目录 -->
            <resource>
                <directory>src/main/resources</directory>
                <filtering>false</filtering>
                <!-- 默认不打包特定环境下的资源-->
                <excludes>
                    <exclude>dev/**</exclude>
                    <exclude>test/**</exclude>
                    <exclude>prod/**</exclude>
                </excludes>
            </resource>
        </resources>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-resources-plugin</artifactId>
                <version>3.3.1</version>
                <configuration>
                    <!-- 强制覆盖目标文件， 如果指定环境中和主目录中含有相同文件配置，优先使用自定义的配置 -->
                    <overwrite>true</overwrite>
                </configuration>
            </plugin>
        </plugins>
    </build>
    
    <profiles>
        <!-- 开发环境 -->
        <profile>
            <id>dev</id>
            <activation>
                <activeByDefault>true</activeByDefault> <!-- 默认激活开发环境 -->
            </activation>
            <build>
                <resources>
                    <resource>
                        <directory>src/main/resources/dev</directory>
                        <filtering>false</filtering>
                    </resource>
                </resources>
            </build>
        </profile>
    
        <!-- 测试环境 -->
        <profile>
            <id>test</id>
            <build>
                <resources>
                    <resource>
                        <directory>src/main/resources/test</directory>
                        <filtering>false</filtering>
                    </resource>
                </resources>
            </build>
        </profile>
    
        <!-- 生产环境 -->
        <profile>
            <id>prod</id>
            <build>
                <resources>
                    <resource>
                        <directory>src/main/resources/prod</directory>
                        <filtering>false</filtering>
                    </resource>
                </resources>
            </build>
        </profile>
    </profiles>
    

</project>
```

# 打包命令
根据环境切换 profile，执行以下命令：

### 1. 开发环境（默认激活）：

```bash
mvn clean package
```

### 2. 测试环境：

```bash
mvn clean package -P test
```

### 生产环境：

```bash
mvn clean package -P prod
```

## 结果
1. 根据激活的 profile，application.properties 将从对应的环境目录复制到目标目录（如 target/classes）。
2. 最终打包的 jar 包会包含对应环境的配置文件。

## 注意事项
1. 资源覆盖：确保每个环境的配置文件中都有完整的配置，以避免某些配置缺失。
2. 动态环境加载：可以使用 Spring Boot 的 spring.profiles.active 配置结合，进一步控制不同环境下的行为。