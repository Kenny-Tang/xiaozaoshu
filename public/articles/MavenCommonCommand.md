<!-- 
@[TOC]
 -->
# Maven 常用命令

## 确保环境已配置
安装 Maven：确保系统已安装 Maven 并正确配置了 MAVEN_HOME 和 PATH。

安装 JDK：确保系统安装了支持的 JDK 并设置了 JAVA_HOME。

测试安装是否正确：
```bash
mvn -v
```
常见的项目结构：
```bash
parent-project/
├── pom.xml (父模块)
├── module-a/
│   └── pom.xml (子模块 A)
└── module-b/
    └── pom.xml (子模块 B)
```

父模块的 pom.xml 应包含以下内容：

```xml
<modules>
    <module>module-a</module>
    <module>module-b</module>
</modules>
```

## 指定打包子模块
在 Maven 多模块项目中，如果只想打包特定的子模块，可以使用以下方法：

1. 直接进入子模块目录
   进入目标子模块的目录后运行打包命令：
```shell
cd parent-project/module-a
mvn clean package
```
2. 使用 -pl 参数指定模块
   在父项目目录下使用 -pl 参数指定需要打包的子模块，同时使用 -am 参数（可选）构建其依赖模块：
```shell
mvn clean package -pl module-a  -am -Dmaven.test.skip=true
```
#### **参数说明**：
| 参数 | 作用 |
|------|------|
| `-pl` (--projects) | 指定要构建的子模块（`znpb-admin`） |
| `-am` (--also-make) | 同时构建该模块依赖的其他模块 |
| `-Dmaven.test.skip=true` | **完全跳过测试相关流程**（不编译、不执行） |
| `-DskipTests` | **跳过单元测试**（编译测试代码，但不执行测试） |
| `clean package` | 清理并打包 |

## 查看依赖关系
### 查看依赖树
使用 `dependency:tree` 查看依赖树

    mvn dependency:tree
输出示例：
```text
[INFO] --- maven-dependency-plugin:3.5.0:tree (default-cli) ---
[INFO] com.example:my-module:jar:1.0.0
[INFO] +- org.springframework:spring-core:jar:5.3.6:compile
[INFO] \- org.slf4j:slf4j-api:jar:1.7.30:compile
```

关键点：
- +：直接依赖。
- -：传递性依赖（由直接依赖引入）。
- Scope：依赖的范围，如 compile, test, provided, runtime。
### 分析冲突的依赖
如果怀疑有依赖冲突问题，可以使用 dependency:tree 加 verbose 模式：

    mvn dependency:tree -Dverbose

输出示例（详细版本信息和冲突）：
```text
[INFO] +- org.apache.logging.log4j:log4j-core:jar:2.14.0:compile
[INFO] \- org.slf4j:slf4j-api:jar:1.7.30:compile
[INFO]    \- (org.slf4j:log4j-over-slf4j:jar:1.7.30:compile - omitted for conflict with 1.7.25)
```


### 生成依赖报告
运行以下命令生成 HTML 格式的依赖报告：

```bash
mvn project-info-reports:dependencies
```
输出位置：

报告会生成在 target/site/dependencies.html 中，可以通过浏览器查看。