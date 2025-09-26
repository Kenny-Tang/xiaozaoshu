## MyBatis Insert SQL 执行流程详解

Insert 操作的执行流程与查询流程在整体架构上相似，但在细节处理上有其特殊性，特别是在主键生成、返回值处理和缓存清理等方面。

## 一、Insert 操作特点

与 Select 操作相比，Insert 操作有以下特点：
- 需要处理主键生成（自增主键、SelectKey等）
- 会清空一级缓存和二级缓存
- 返回值是影响的行数，而不是结果集
- 必须在事务中执行
- 可能需要批量执行优化

## 二、完整执行流程

### 1. Mapper 方法调用

```java
// Mapper接口定义
public interface UserMapper {
    // 返回影响行数
    int insert(User user);
    
    // 使用@Options注解指定主键策略
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertAndGetId(User user);
    
    // 批量插入
    int batchInsert(@Param("users") List<User> users);
}

// 调用示例
User user = new User();
user.setName("张三");
user.setAge(25);
int rows = userMapper.insert(user);
// 如果配置了主键生成，user.getId() 将获得生成的主键
```

### 2. MapperMethod 执行阶段

MapperMethod 根据 SQL 命令类型执行不同的逻辑：

```java
public class MapperMethod {
    
    public Object execute(SqlSession sqlSession, Object[] args) {
        Object result;
        switch (command.getType()) {
            case INSERT: {
                // 1. 转换参数
                Object param = method.convertArgsToSqlCommandParam(args);
                
                // 2. 执行insert并处理返回值
                result = rowCountResult(sqlSession.insert(command.getName(), param));
                break;
            }
            // ... 其他类型
        }
        return result;
    }
    
    private Object rowCountResult(int rowCount) {
        final Object result;
        if (method.returnsVoid()) {
            result = null;
        } else if (Integer.class.equals(method.getReturnType()) || Integer.TYPE.equals(method.getReturnType())) {
            result = rowCount;
        } else if (Long.class.equals(method.getReturnType()) || Long.TYPE.equals(method.getReturnType())) {
            result = (long) rowCount;
        } else if (Boolean.class.equals(method.getReturnType()) || Boolean.TYPE.equals(method.getReturnType())) {
            result = rowCount > 0;
        } else {
            throw new BindingException("Mapper method '" + command.getName() + "' has an unsupported return type");
        }
        return result;
    }
}
```

### 3. SqlSession 处理阶段

DefaultSqlSession 的 insert 实现：

```java
public class DefaultSqlSession implements SqlSession {
    
    @Override
    public int insert(String statement, Object parameter) {
        // Insert 操作实际上调用 update 方法
        return update(statement, parameter);
    }
    
    @Override
    public int update(String statement, Object parameter) {
        try {
            dirty = true;  // 标记会话为脏，需要提交或回滚
            MappedStatement ms = configuration.getMappedStatement(statement);
            
            // 通过Executor执行update（insert/update/delete都是update操作）
            return executor.update(ms, wrapCollection(parameter));
        } catch (Exception e) {
            throw ExceptionFactory.wrapException("Error updating database", e);
        }
    }
}
```

### 4. Executor 执行阶段

BaseExecutor 的 update 方法：

```java
public abstract class BaseExecutor implements Executor {
    
    @Override
    public int update(MappedStatement ms, Object parameter) throws SQLException {
        ErrorContext.instance()
            .resource(ms.getResource())
            .activity("executing an update")
            .object(ms.getId());
            
        if (closed) {
            throw new ExecutorException("Executor was closed.");
        }
        
        // 1. 清除本地缓存（一级缓存）
        clearLocalCache();
        
        // 2. 执行更新操作
        return doUpdate(ms, parameter);
    }
    
    @Override
    public void clearLocalCache() {
        if (!closed) {
            // 清空一级缓存
            localCache.clear();
            localOutputParameterCache.clear();
        }
    }
}
```

SimpleExecutor 的具体实现：

```java
public class SimpleExecutor extends BaseExecutor {
    
    @Override
    public int doUpdate(MappedStatement ms, Object parameter) throws SQLException {
        Statement stmt = null;
        try {
            Configuration configuration = ms.getConfiguration();
            
            // 1. 创建StatementHandler
            StatementHandler handler = configuration.newStatementHandler(
                this, ms, parameter, RowBounds.DEFAULT, null, null);
                
            // 2. 准备Statement
            stmt = prepareStatement(handler, ms.getStatementLog());
            
            // 3. 执行更新
            return handler.update(stmt);
        } finally {
            closeStatement(stmt);
        }
    }
    
    private Statement prepareStatement(StatementHandler handler, Log statementLog) throws SQLException {
        Statement stmt;
        Connection connection = getConnection(statementLog);
        
        // 准备Statement，这里会处理主键生成
        stmt = handler.prepare(connection, transaction.getTimeout());
        
        // 设置参数
        handler.parameterize(stmt);
        return stmt;
    }
}
```

### 5. 主键生成处理

PreparedStatementHandler 在准备 Statement 时处理主键生成：

```java
public class PreparedStatementHandler extends BaseStatementHandler {
    
    @Override
    protected Statement instantiateStatement(Connection connection) throws SQLException {
        String sql = boundSql.getSql();
        
        // 处理主键生成
        if (mappedStatement.getKeyGenerator() instanceof Jdbc3KeyGenerator) {
            String[] keyColumnNames = mappedStatement.getKeyColumns();
            if (keyColumnNames == null) {
                // 使用JDBC的主键返回功能
                return connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            } else {
                // 指定要返回的主键列
                return connection.prepareStatement(sql, keyColumnNames);
            }
        } else if (mappedStatement.getKeyGenerator() instanceof SelectKeyGenerator) {
            // SelectKey方式，在执行前或后执行额外的SQL获取主键
            return connection.prepareStatement(sql);
        } else {
            // 普通的PreparedStatement
            return connection.prepareStatement(sql);
        }
    }
    
    @Override
    public int update(Statement statement) throws SQLException {
        PreparedStatement ps = (PreparedStatement) statement;
        
        // 1. 执行SQL
        ps.execute();
        int rows = ps.getUpdateCount();
        
        // 2. 处理生成的主键
        Object parameterObject = boundSql.getParameterObject();
        KeyGenerator keyGenerator = mappedStatement.getKeyGenerator();
        keyGenerator.processAfter(executor, mappedStatement, ps, parameterObject);
        
        return rows;
    }
}
```

### 6. KeyGenerator 主键生成器

MyBatis 提供三种主键生成器：

#### Jdbc3KeyGenerator（使用JDBC的getGeneratedKeys）

```java
public class Jdbc3KeyGenerator implements KeyGenerator {
    
    @Override
    public void processAfter(Executor executor, MappedStatement ms, Statement stmt, Object parameter) {
        processBatch(ms, stmt, parameter);
    }
    
    public void processBatch(MappedStatement ms, Statement stmt, Object parameter) {
        try (ResultSet rs = stmt.getGeneratedKeys()) {
            final ResultSetMetaData rsmd = rs.getMetaData();
            final Configuration configuration = ms.getConfiguration();
            
            if (rsmd.getColumnCount() >= 1) {
                String[] keyProperties = ms.getKeyProperties();
                final TypeHandlerRegistry typeHandlerRegistry = configuration.getTypeHandlerRegistry();
                
                // 获取生成的主键并设置到参数对象中
                if (rs.next()) {
                    if (keyProperties != null && keyProperties.length == 1) {
                        // 单个主键
                        assignKeyToParameter(configuration, rs, keyProperties[0], parameter);
                    } else {
                        // 复合主键
                        assignKeysToParameter(configuration, rs, keyProperties, parameter);
                    }
                }
            }
        } catch (Exception e) {
            throw new ExecutorException("Error getting generated key or setting result to parameter object", e);
        }
    }
    
    private void assignKeyToParameter(Configuration configuration, ResultSet rs, 
                                     String keyProperty, Object parameter) throws SQLException {
        final MetaObject metaParam = configuration.newMetaObject(parameter);
        final TypeHandler<?> th = typeHandlerRegistry.getTypeHandler(metaParam.getSetterType(keyProperty));
        if (th != null) {
            Object value = th.getResult(rs, 1);
            metaParam.setValue(keyProperty, value);
        }
    }
}
```

#### SelectKeyGenerator（通过额外的SQL查询获取主键）

```java
public class SelectKeyGenerator implements KeyGenerator {
    
    private final MappedStatement keyStatement;
    private final boolean executeBefore;
    
    @Override
    public void processBefore(Executor executor, MappedStatement ms, Statement stmt, Object parameter) {
        if (executeBefore) {
            processGeneratedKeys(executor, ms, parameter);
        }
    }
    
    @Override
    public void processAfter(Executor executor, MappedStatement ms, Statement stmt, Object parameter) {
        if (!executeBefore) {
            processGeneratedKeys(executor, ms, parameter);
        }
    }
    
    private void processGeneratedKeys(Executor executor, MappedStatement ms, Object parameter) {
        try {
            if (parameter != null && keyStatement != null && keyStatement.getKeyProperties() != null) {
                String[] keyProperties = keyStatement.getKeyProperties();
                final Configuration configuration = ms.getConfiguration();
                final MetaObject metaParam = configuration.newMetaObject(parameter);
                
                // 执行SelectKey配置的SQL
                Executor keyExecutor = configuration.newExecutor(executor.getTransaction(), ExecutorType.SIMPLE);
                List<Object> values = keyExecutor.query(keyStatement, parameter, RowBounds.DEFAULT, Executor.NO_RESULT_HANDLER);
                
                if (values.size() == 0) {
                    throw new ExecutorException("SelectKey returned no data.");
                } else if (values.size() > 1) {
                    throw new ExecutorException("SelectKey returned more than one value.");
                } else {
                    MetaObject metaResult = configuration.newMetaObject(values.get(0));
                    
                    // 将查询到的主键值设置到参数对象
                    if (keyProperties.length == 1) {
                        setValue(metaParam, keyProperties[0], metaResult.getValue(keyProperties[0]));
                    } else {
                        handleMultipleProperties(keyProperties, metaParam, metaResult);
                    }
                }
            }
        } catch (Exception e) {
            throw new ExecutorException("Error selecting key or setting result to parameter object", e);
        }
    }
}
```

### 7. 参数设置过程

ParameterHandler 设置 Insert 语句的参数：

```java
public class DefaultParameterHandler implements ParameterHandler {
    
    @Override
    public void setParameters(PreparedStatement ps) {
        ErrorContext.instance().activity("setting parameters").object(mappedStatement.getParameterMap().getId());
        
        List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();
        if (parameterMappings != null) {
            for (int i = 0; i < parameterMappings.size(); i++) {
                ParameterMapping parameterMapping = parameterMappings.get(i);
                
                // OUT类型的参数用于存储过程，不需要设置
                if (parameterMapping.getMode() != ParameterMode.OUT) {
                    Object value;
                    String propertyName = parameterMapping.getProperty();
                    
                    // 获取参数值
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
                    
                    // 使用TypeHandler设置参数
                    TypeHandler typeHandler = parameterMapping.getTypeHandler();
                    JdbcType jdbcType = parameterMapping.getJdbcType();
                    if (value == null && jdbcType == null) {
                        jdbcType = configuration.getJdbcTypeForNull();
                    }
                    
                    try {
                        typeHandler.setParameter(ps, i + 1, value, jdbcType);
                    } catch (SQLException e) {
                        throw new TypeException("Could not set parameters for mapping", e);
                    }
                }
            }
        }
    }
}
```

### 8. 批量插入优化

对于批量插入，可以使用 BatchExecutor：

```java
public class BatchExecutor extends BaseExecutor {
    
    private final List<Statement> statementList = new ArrayList<>();
    private final List<BatchResult> batchResultList = new ArrayList<>();
    private String currentSql;
    private MappedStatement currentStatement;
    
    @Override
    public int doUpdate(MappedStatement ms, Object parameterObject) throws SQLException {
        final Configuration configuration = ms.getConfiguration();
        final StatementHandler handler = configuration.newStatementHandler(this, ms, parameterObject, RowBounds.DEFAULT, null, null);
        final BoundSql boundSql = handler.getBoundSql();
        final String sql = boundSql.getSql();
        final Statement stmt;
        
        // 如果SQL相同，复用Statement
        if (sql.equals(currentSql) && ms.equals(currentStatement)) {
            int last = statementList.size() - 1;
            stmt = statementList.get(last);
            applyTransactionTimeout(stmt);
            handler.parameterize(stmt);
            
            BatchResult batchResult = batchResultList.get(last);
            batchResult.addParameterObject(parameterObject);
        } else {
            Connection connection = getConnection(ms.getStatementLog());
            stmt = handler.prepare(connection, transaction.getTimeout());
            handler.parameterize(stmt);
            
            currentSql = sql;
            currentStatement = ms;
            statementList.add(stmt);
            batchResultList.add(new BatchResult(ms, sql, parameterObject));
        }
        
        // 添加到批处理
        handler.batch(stmt);
        return BATCH_UPDATE_RETURN_VALUE;
    }
    
    @Override
    public List<BatchResult> doFlushStatements(boolean isRollback) throws SQLException {
        try {
            List<BatchResult> results = new ArrayList<>();
            
            if (isRollback) {
                return Collections.emptyList();
            }
            
            // 执行所有批处理
            for (int i = 0, n = statementList.size(); i < n; i++) {
                Statement stmt = statementList.get(i);
                applyTransactionTimeout(stmt);
                BatchResult batchResult = batchResultList.get(i);
                
                try {
                    // 执行批处理
                    int[] counts = stmt.executeBatch();
                    batchResult.setUpdateCounts(counts);
                    
                    // 处理主键生成
                    MappedStatement ms = batchResult.getMappedStatement();
                    List<Object> parameterObjects = batchResult.getParameterObjects();
                    KeyGenerator keyGenerator = ms.getKeyGenerator();
                    if (Jdbc3KeyGenerator.class.equals(keyGenerator.getClass())) {
                        Jdbc3KeyGenerator jdbc3KeyGenerator = (Jdbc3KeyGenerator) keyGenerator;
                        jdbc3KeyGenerator.processBatch(ms, stmt, parameterObjects);
                    } else if (!NoKeyGenerator.class.equals(keyGenerator.getClass())) {
                        for (Object parameter : parameterObjects) {
                            keyGenerator.processAfter(this, ms, stmt, parameter);
                        }
                    }
                    
                    // 关闭Statement
                    closeStatement(stmt);
                } catch (BatchUpdateException e) {
                    throw new BatchExecutorException(e.getMessage(), e, results, batchResult);
                }
                
                results.add(batchResult);
            }
            return results;
        } finally {
            // 清理资源
            for (Statement stmt : statementList) {
                closeStatement(stmt);
            }
            currentSql = null;
            statementList.clear();
            batchResultList.clear();
        }
    }
}
```

## 三、XML 配置示例

### 1. 基本 Insert 配置

```xml
<!-- 基本插入 -->
<insert id="insert" parameterType="com.example.User">
    INSERT INTO user (name, age, email, create_time)
    VALUES (#{name}, #{age}, #{email}, #{createTime})
</insert>

<!-- 使用自增主键 -->
<insert id="insertAndGetId" parameterType="com.example.User" 
        useGeneratedKeys="true" keyProperty="id">
    INSERT INTO user (name, age, email, create_time)
    VALUES (#{name}, #{age}, #{email}, #{createTime})
</insert>

<!-- 使用SelectKey获取主键（适用于Oracle等） -->
<insert id="insertWithSelectKey" parameterType="com.example.User">
    <selectKey keyProperty="id" resultType="long" order="BEFORE">
        SELECT seq_user.nextval FROM dual
    </selectKey>
    INSERT INTO user (id, name, age, email, create_time)
    VALUES (#{id}, #{name}, #{age}, #{email}, #{createTime})
</insert>

<!-- 批量插入 -->
<insert id="batchInsert" parameterType="list">
    INSERT INTO user (name, age, email, create_time)
    VALUES
    <foreach collection="list" item="user" separator=",">
        (#{user.name}, #{user.age}, #{user.email}, #{user.createTime})
    </foreach>
</insert>
```

### 2. 动态 Insert

```xml
<!-- 动态插入非空字段 -->
<insert id="insertSelective" parameterType="com.example.User">
    INSERT INTO user
    <trim prefix="(" suffix=")" suffixOverrides=",">
        <if test="id != null">id,</if>
        <if test="name != null">name,</if>
        <if test="age != null">age,</if>
        <if test="email != null">email,</if>
        create_time,
    </trim>
    <trim prefix="VALUES (" suffix=")" suffixOverrides=",">
        <if test="id != null">#{id},</if>
        <if test="name != null">#{name},</if>
        <if test="age != null">#{age},</if>
        <if test="email != null">#{email},</if>
        NOW(),
    </trim>
</insert>
```

## 四、事务和缓存处理

### 1. 事务管理

```java
SqlSession session = sqlSessionFactory.openSession(false); // 手动提交事务
try {
    UserMapper mapper = session.getMapper(UserMapper.class);
    
    // 执行多个插入
    User user1 = new User("张三", 25);
    mapper.insert(user1);
    
    User user2 = new User("李四", 30);
    mapper.insert(user2);
    
    // 提交事务
    session.commit();
} catch (Exception e) {
    // 回滚事务
    session.rollback();
    throw e;
} finally {
    session.close();
}
```

### 2. 缓存清理

Insert 操作会自动清理相关缓存：

```java
public class CachingExecutor implements Executor {
    
    @Override
    public int update(MappedStatement ms, Object parameterObject) throws SQLException {
        // 清除二级缓存
        flushCacheIfRequired(ms);
        
        // 委托给被包装的Executor执行（会清理一级缓存）
        return delegate.update(ms, parameterObject);
    }
    
    private void flushCacheIfRequired(MappedStatement ms) {
        Cache cache = ms.getCache();
        
        // 如果配置了二级缓存且需要刷新
        if (cache != null && ms.isFlushCacheRequired()) {
            tcm.clear(cache);
        }
    }
}
```

## 五、性能优化建议

1. **批量插入优化**
   - 使用批处理执行器
   - 使用 foreach 构建批量 SQL
   - 控制批量大小，避免 SQL 过长

2. **主键生成策略选择**
   - 优先使用数据库自增主键
   - Oracle 等使用序列时考虑缓存序列值
   - UUID 主键在应用层生成，避免数据库压力

3. **连接和事务管理**
   - 合理控制事务边界
   - 使用连接池管理连接
   - 避免长事务

4. **SQL 优化**
   - 使用 insertSelective 避免插入 null 值
   - 合理使用索引
   - 避免触发器等影响性能的数据库特性

Insert 操作的执行流程虽然与 Select 类似，但在主键处理、缓存管理、事务控制等方面有其特殊性。理解这些细节对于正确使用 MyBatis 和性能优化非常重要。