## MyBatis SQL 执行流程详细分析

让我从一个 Mapper 方法调用开始，详细分析 SQL 在 MyBatis 中的完整执行流程。

## 一、执行流程概览

```
Mapper接口方法调用
    ↓
MapperProxy 动态代理
    ↓
MapperMethod 执行
    ↓
SqlSession 执行
    ↓
Executor 执行器
    ↓
StatementHandler 语句处理
    ↓
ParameterHandler 参数处理
    ↓
JDBC 执行 SQL
    ↓
ResultSetHandler 结果处理
    ↓
返回结果
```

## 二、详细执行步骤

### 1. Mapper 接口调用阶段

当我们调用一个 Mapper 接口方法时：

```java
User user = userMapper.selectById(1L);
```

**MapperProxy 拦截**：
- Mapper 接口的实现类是 MyBatis 通过 JDK 动态代理生成的 MapperProxy
- MapperProxy 的 invoke 方法会拦截所有方法调用
- 对于非 Object 类的方法，会创建或获取缓存的 MapperMethod 对象

**MapperMethod 解析**：
- MapperMethod 封装了 Mapper 接口中方法的信息
- 包含 SqlCommand（SQL 语句的类型和 ID）和 MethodSignature（方法签名信息）
- 根据方法的返回类型和参数，选择合适的 SqlSession 方法

### 2. SqlSession 执行阶段

MapperMethod 会根据 SQL 类型调用 SqlSession 的相应方法：

```java
public class DefaultSqlSession implements SqlSession {
    
    public <E> List<E> selectList(String statement, Object parameter, RowBounds rowBounds) {
        try {
            // 1. 从 Configuration 中获取 MappedStatement
            MappedStatement ms = configuration.getMappedStatement(statement);
            
            // 2. 通过 Executor 执行查询
            return executor.query(ms, wrapCollection(parameter), rowBounds, Executor.NO_RESULT_HANDLER);
        } catch (Exception e) {
            throw ExceptionFactory.wrapException("Error querying database", e);
        }
    }
}
```

**MappedStatement 获取**：
- 根据 statement ID（namespace.methodName）获取对应的 MappedStatement
- MappedStatement 包含了 SQL 语句、参数映射、结果映射等所有配置信息

### 3. Executor 执行器阶段

Executor 是实际执行 SQL 的核心组件：

```java
public <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler) throws SQLException {
    // 1. 获取 BoundSql，包含可执行的 SQL 和参数信息
    BoundSql boundSql = ms.getBoundSql(parameter);
    
    // 2. 创建缓存 Key
    CacheKey key = createCacheKey(ms, parameter, rowBounds, boundSql);
    
    // 3. 执行查询
    return query(ms, parameter, rowBounds, resultHandler, key, boundSql);
}
```

**缓存处理**：

```java
// 先查一级缓存
List<E> list = resultHandler == null ? (List<E>) localCache.getObject(key) : null;
if (list != null) {
    handleLocallyCachedOutputParameters(ms, key, parameter, boundSql);
} else {
    // 缓存未命中，查询数据库
    list = queryFromDatabase(ms, parameter, rowBounds, resultHandler, key, boundSql);
}
```

**数据库查询**：

```java
private <E> List<E> queryFromDatabase(...) throws SQLException {
    List<E> list;
    // 1. 先在缓存中占位
    localCache.putObject(key, EXECUTION_PLACEHOLDER);
    try {
        // 2. 执行查询
        list = doQuery(ms, parameter, rowBounds, resultHandler, boundSql);
    } finally {
        // 3. 移除占位符
        localCache.removeObject(key);
    }
    // 4. 将结果放入缓存
    localCache.putObject(key, list);
    return list;
}
```

### 4. StatementHandler 处理阶段

SimpleExecutor 的 doQuery 方法会创建 StatementHandler：

```java
public <E> List<E> doQuery(...) throws SQLException {
    Statement stmt = null;
    try {
        Configuration configuration = ms.getConfiguration();
        
        // 1. 创建 StatementHandler
        StatementHandler handler = configuration.newStatementHandler(
            wrapper, ms, parameter, rowBounds, resultHandler, boundSql);
            
        // 2. 准备 Statement（创建 Statement 并设置参数）
        stmt = prepareStatement(handler, ms.getStatementLog());
        
        // 3. 执行查询
        return handler.query(stmt, resultHandler);
    } finally {
        closeStatement(stmt);
    }
}
```

**Statement 准备过程**：

```java
private Statement prepareStatement(StatementHandler handler, Log statementLog) throws SQLException {
    Statement stmt;
    // 1. 获取 Connection
    Connection connection = getConnection(statementLog);
    
    // 2. 创建 Statement（PreparedStatement）
    stmt = handler.prepare(connection, transaction.getTimeout());
    
    // 3. 设置参数
    handler.parameterize(stmt);
    
    return stmt;
}
```

### 5. ParameterHandler 参数处理

在 PreparedStatementHandler 中设置参数：

```java
public void parameterize(Statement statement) throws SQLException {
    // 使用 ParameterHandler 设置参数
    parameterHandler.setParameters((PreparedStatement) statement);
}
```

ParameterHandler 的参数设置过程：

```java
public void setParameters(PreparedStatement ps) {
    List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();
    if (parameterMappings != null) {
        for (int i = 0; i < parameterMappings.size(); i++) {
            ParameterMapping parameterMapping = parameterMappings.get(i);
            if (parameterMapping.getMode() != ParameterMode.OUT) {
                Object value;
                String propertyName = parameterMapping.getProperty();
                
                // 1. 获取参数值
                if (boundSql.hasAdditionalParameter(propertyName)) {
                    value = boundSql.getAdditionalParameter(propertyName);
                } else if (parameterObject == null) {
                    value = null;
                } else if (typeHandlerRegistry.hasTypeHandler(parameterObject.getClass())) {
                    value = parameterObject;
                } else {
                    MetaObject metaObject = configuration.newMetaObject(parameterObject);
                    value = metaObject.getValue(propertyName);
                }
                
                // 2. 使用 TypeHandler 设置参数
                TypeHandler typeHandler = parameterMapping.getTypeHandler();
                typeHandler.setParameter(ps, i + 1, value, parameterMapping.getJdbcType());
            }
        }
    }
}
```

### 6. SQL 执行阶段

PreparedStatementHandler 执行查询：

```java
public <E> List<E> query(Statement statement, ResultHandler resultHandler) throws SQLException {
    PreparedStatement ps = (PreparedStatement) statement;
    // 1. 执行 SQL
    ps.execute();
    
    // 2. 处理结果集
    return resultSetHandler.handleResultSets(ps);
}
```

### 7. ResultSetHandler 结果处理

结果集处理是 SQL 执行的最后一步：

```java
public List<Object> handleResultSets(Statement stmt) throws SQLException {
    final List<Object> multipleResults = new ArrayList<>();
    int resultSetCount = 0;
    
    // 1. 获取第一个 ResultSet
    ResultSetWrapper rsw = getFirstResultSet(stmt);
    
    // 2. 获取 ResultMap
    List<ResultMap> resultMaps = mappedStatement.getResultMaps();
    
    while (rsw != null && resultMapCount > resultSetCount) {
        ResultMap resultMap = resultMaps.get(resultSetCount);
        
        // 3. 处理结果集
        handleResultSet(rsw, resultMap, multipleResults, null);
        rsw = getNextResultSet(stmt);
        resultSetCount++;
    }
    
    return collapseSingleResultList(multipleResults);
}
```

**结果映射过程**：

```java
private void handleRowValues(ResultSetWrapper rsw, ResultMap resultMap, 
                            ResultHandler<?> resultHandler, RowBounds rowBounds, 
                            ResultMapping parentMapping) throws SQLException {
    if (resultMap.hasNestedResultMaps()) {
        // 处理嵌套结果映射
        handleRowValuesForNestedResultMap(rsw, resultMap, resultHandler, rowBounds, parentMapping);
    } else {
        // 处理简单结果映射
        handleRowValuesForSimpleResultMap(rsw, resultMap, resultHandler, rowBounds, parentMapping);
    }
}
```

**对象创建和属性填充**：

```java
private Object createResultObject(ResultSetWrapper rsw, ResultMap resultMap, ...) throws SQLException {
    // 1. 创建结果对象
    Object resultObject = createResultObject(rsw, resultMap, constructorArgTypes, constructorArgs);
    
    // 2. 填充属性
    if (resultObject != null && !hasTypeHandlerForResultObject(rsw, resultMap.getType())) {
        final List<ResultMapping> propertyMappings = resultMap.getPropertyResultMappings();
        for (ResultMapping propertyMapping : propertyMappings) {
            // 获取列值
            Object value = getPropertyMappingValue(rsw.getResultSet(), metaObject, propertyMapping, lazyLoader, columnPrefix);
            
            // 设置属性值
            if (value != null || configuration.isCallSettersOnNulls()) {
                String property = propertyMapping.getProperty();
                metaObject.setValue(property, value);
            }
        }
    }
    
    return resultObject;
}
```

## 三、关键组件协作

### BoundSql 的生成

BoundSql 是实际可执行的 SQL 对象，包含：
- 参数化后的 SQL 语句
- 参数映射列表
- 额外的参数（动态 SQL 产生的）

```java
public class BoundSql {
    private final String sql;
    private final List<ParameterMapping> parameterMappings;
    private final Object parameterObject;
    private final Map<String, Object> additionalParameters;
    private final MetaObject metaParameters;
}
```

### 动态 SQL 的处理

如果配置了动态 SQL，会在获取 BoundSql 时进行解析：

```java
public BoundSql getBoundSql(Object parameterObject) {
    // 1. 处理动态 SQL 节点
    DynamicContext context = new DynamicContext(configuration, parameterObject);
    rootSqlNode.apply(context);
    
    // 2. 处理 SQL 中的 #{} 占位符
    SqlSourceBuilder sqlSourceParser = new SqlSourceBuilder(configuration);
    Class<?> parameterType = parameterObject == null ? Object.class : parameterObject.getClass();
    SqlSource sqlSource = sqlSourceParser.parse(context.getSql(), parameterType, context.getBindings());
    
    // 3. 生成 BoundSql
    BoundSql boundSql = sqlSource.getBoundSql(parameterObject);
    return boundSql;
}
```

## 四、事务处理

整个 SQL 执行过程都在事务的控制之下：

```java
// 1. 开启会话时创建事务
SqlSession session = sqlSessionFactory.openSession();

// 2. 执行 SQL（自动参与事务）
List<User> users = session.selectList("selectUsers");

// 3. 提交或回滚
session.commit(); // 或 session.rollback();

// 4. 关闭会话
session.close();
```

## 五、性能优化点

1. **连接复用**：通过数据源连接池管理连接
2. **Statement 复用**：ReuseExecutor 可以复用 PreparedStatement
3. **批处理**：BatchExecutor 支持批量执行
4. **缓存机制**：一级缓存和二级缓存减少数据库访问
5. **懒加载**：支持关联对象的延迟加载
6. **预编译**：使用 PreparedStatement 提高执行效率

整个执行流程设计精妙，各组件职责单一、协作紧密，既保证了功能的完整性，又提供了良好的扩展性。通过插件机制，我们可以在执行流程的关键点进行拦截和增强，实现自定义功能。