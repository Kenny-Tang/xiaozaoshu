MyBatis 是一个优秀的持久层框架，它的架构设计清晰、模块化程度高。让我为您详细介绍 MyBatis 的整体架构。

## MyBatis 架构总体设计

MyBatis 的架构可以分为三个主要层次：

### 1. 接口层
接口层是 MyBatis 暴露给开发者的编程接口，主要包括两种方式：

**基于 Statement ID 的方式**：通过传入 Statement ID 和参数来执行 SQL，这是传统的使用方式。开发者直接调用 SqlSession 的方法（如 selectOne、selectList、insert、update、delete 等）。

**基于 Mapper 接口的方式**：这是推荐的方式，通过定义 Mapper 接口，MyBatis 会自动生成接口的动态代理实现。开发者只需调用接口方法即可执行对应的 SQL。

### 2. 数据处理层
数据处理层是 MyBatis 的核心，负责具体的 SQL 查找、SQL 解析、SQL 执行和执行结果映射处理等。它主要的目的是根据调用的请求完成一次数据库操作。

### 3. 基础支撑层
负责最基础的功能支撑，包括连接管理、事务管理、配置加载和缓存处理等。这些都是共用的基础模块，为上层的数据处理层提供最基础的支撑。

## 核心组件详解

### SqlSessionFactory
SqlSessionFactory 是 MyBatis 的核心对象，它是创建 SqlSession 的工厂。应用程序通过 SqlSessionFactoryBuilder 从配置文件或配置类构建 SqlSessionFactory。SqlSessionFactory 一旦创建就应该在应用执行期间一直存在，通常使用单例模式。

### SqlSession
SqlSession 是 MyBatis 工作的主要接口，代表和数据库交互的会话。它提供了执行 SQL 命令、获取映射器和管理事务的方法。SqlSession 是线程不安全的，因此不能被共享，每个线程都应该有自己的 SqlSession 实例。

### Executor（执行器）
Executor 是 MyBatis 执行器，负责 SQL 语句的生成和查询缓存的维护。它有三种实现：

- **SimpleExecutor**：每执行一次 update 或 select 就开启一个 Statement 对象，用完立刻关闭
- **ReuseExecutor**：重用预处理语句（PreparedStatement）
- **BatchExecutor**：批量执行所有更新语句

### StatementHandler
StatementHandler 负责处理 JDBC Statement 操作，如设置参数、将 Statement 结果集转换成 List 集合。它有四种实现：

- SimpleStatementHandler：对应 JDBC 的 Statement
- PreparedStatementHandler：对应 PreparedStatement
- CallableStatementHandler：对应 CallableStatement
- RoutingStatementHandler：路由功能，根据配置来决定使用哪种 StatementHandler

### ParameterHandler
ParameterHandler 负责对用户传递的参数转换成 JDBC Statement 所需要的参数。它负责将用户传入的 Java 对象设置到 PreparedStatement 的参数中。

### ResultSetHandler
ResultSetHandler 负责将 JDBC 返回的 ResultSet 结果集对象转换成 List 类型的集合，或者将结果映射到对应的 Java 对象中。

### TypeHandler
TypeHandler 负责 Java 数据类型和 JDBC 数据类型之间的映射和转换。MyBatis 内置了很多 TypeHandler，同时也支持自定义 TypeHandler。

### MappedStatement
MappedStatement 维护了一条 <select|update|delete|insert> 节点的封装，包含了 SQL 语句、输入参数映射、输出结果映射等信息。

### Configuration
Configuration 是 MyBatis 的配置信息类，它保存了所有的配置信息，包括数据源、事务管理器、映射器、类型处理器等。整个 MyBatis 的配置信息都保存在这个对象中。

## 工作流程

MyBatis 的典型工作流程如下：

1. **加载配置**：通过 XML 配置文件或 Java 配置类创建 SqlSessionFactory

2. **创建会话**：从 SqlSessionFactory 中获取 SqlSession

3. **获取 Mapper**：通过 SqlSession 获取 Mapper 接口的代理对象

4. **执行操作**：
    - 调用 Mapper 方法，触发代理对象的 invoke 方法
    - 代理对象找到对应的 MappedStatement
    - 创建相应的 Executor 执行器
    - Executor 通过 StatementHandler 创建 Statement
    - ParameterHandler 设置参数
    - 执行 SQL 语句
    - ResultSetHandler 处理结果集

5. **返回结果**：将处理后的结果返回给调用方

## 缓存机制

MyBatis 提供了两级缓存：

**一级缓存（本地缓存）**：
- SqlSession 级别的缓存，默认开启
- 在同一个 SqlSession 中，执行相同的查询会从缓存中获取结果
- 当 SqlSession 关闭或执行增删改操作时，缓存会被清空

**二级缓存（全局缓存）**：
- Mapper 级别的缓存，需要手动开启
- 多个 SqlSession 可以共享二级缓存
- 以 namespace 为单位进行管理
- 可以配置缓存策略（如 LRU、FIFO 等）

## 插件机制

MyBatis 允许在映射语句执行过程中的某些点进行拦截调用。通过插件（Interceptor）可以拦截的方法包括：

- Executor（update、query、flushStatements、commit、rollback、getTransaction、close、isClosed）
- ParameterHandler（getParameterObject、setParameters）
- ResultSetHandler（handleResultSets、handleOutputParameters）
- StatementHandler（prepare、parameterize、batch、update、query）

插件的实现基于 JDK 的动态代理，通过在目标对象创建代理对象的方式来实现方法拦截。

这种分层架构设计使得 MyBatis 具有良好的扩展性和灵活性，各个组件职责明确，便于维护和定制。开发者可以根据需要替换或扩展某些组件，实现自定义的功能。