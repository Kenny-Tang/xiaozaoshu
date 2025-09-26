# 国产数据库驱动Bug修复记录

## 项目背景

项目为传统行业项目，使用 SpringBoot 进行开发，数据库为 MySQL，数据库持久层框架使用 MyBatis。由于是国企项目，会受到一些限制：数据库和应用之间不能直接通信，需要通过一个隔离装置进行隔离。该装置会对发送到数据库的 SQL 进行审计。

如果 SQL 不符合安规，则会被拒绝。该装置会对 SQL 进行分析，如果 SQL 过于复杂，也会被拒绝。

隔离装置实际上是做了一个代理，使用隔离装置后不能使用通用的数据库驱动，只能使用隔离装置厂商提供的数据库驱动。

## 遇到的问题

驱动是国产厂商提供的，在实际使用中遇到了以下两个严重的问题。

### 问题一：不支持自增 ID 的获取

#### 问题描述

切换驱动后，所有涉及到 `useGeneratedKeys="true"` 的地方，如果需要使用返回的自增 ID，都会抛出 `NullPointerException` 异常，也就是无法获取到自增的 ID 对实体进行填充。

联系厂商后，厂商人员表示驱动没有问题，并提供了他们的测试代码：

```java
try {
    Class.forName("nds.jdbc.driver.NdsDriver");
    Connection conn = DriverManager.getConnection("jdbc:nds://jdbcurl", "test", "test");
    
    String[] u1 = {"id"};
    PreparedStatement pstmt1 = conn.prepareStatement(
        "insert into test(username, password) values (?, ?)", u1);
    pstmt1.setString(1, "zhangsan");
    pstmt1.setString(2, "lisi");
    pstmt1.executeUpdate();
    
    System.out.println("--------------getGeneratedKeys String---------------------");
    ResultSet rs1 = pstmt1.getGeneratedKeys();
    while (rs1.next()) {
        int no1 = rs1.getInt("GENERATED_KEY");
        System.out.println(no1);
        int no2 = rs1.getInt(1);
        System.out.println(no2);
    }
    rs1.close();
    pstmt1.close();
    
    int[] u2 = {1};
    PreparedStatement pstmt2 = conn.prepareStatement(
        "insert into test(username, password) values (?, ?)", u2);
    pstmt2.setString(1, "wangwu");
    pstmt2.setString(2, "zhaoliu");
    pstmt2.executeUpdate();
    
    System.out.println("--------------getGeneratedKeys int---------------------");
    ResultSet rs2 = pstmt2.getGeneratedKeys();
    while (rs2.next()) {
        int no1 = rs2.getInt("GENERATED_KEY");
        System.out.println(no1);
        int no2 = rs2.getInt(1);
        System.out.println(no2);
    }
    rs2.close();
    pstmt2.close();
    
    conn.close();
} catch (Exception e) {
    e.printStackTrace();
}
```

可以看出这是 JDBC 原生的代码，普通的项目中不会直接使用 JDBC 进行数据库操作，都是使用 ORM 框架。

在向厂商反馈后，得到如下回复：

> 是自增id插入失败吗？之前有业务修改方案是：将数据库的id字段由int改为varchar，然后用uuid指定id的值，可以解决。

这个方案显然不适用于已经上线的项目。如果项目是新建的，可以考虑使用 UUID 作为主键，但是对于一个已经上线的项目，直接把主键类型改为 String，会带来巨大的改造成本和风险。

#### 问题分析

经过多次沟通，虽然厂商没有提供有效的解决方案，但至少确认了一点：使用 `pstmt1.executeUpdate()` 执行 SQL 时，是可以获取到自增 ID 的。

现在的问题是，当使用 MyBatis 进行插入操作时，MyBatis 内部是如何获取自增 ID 的？

通过源码分析（可参见 [MyBatis SELECT 执行过程](./mybatis_select_execution_process.md) 和 [MyBatis INSERT 执行过程](./mybatis_insert_execution_process.md)），发现 SQL 最终在 `PreparedStatementHandler` 的 `update` 方法中被执行：

```java
@Override
public int update(Statement statement) throws SQLException {
    PreparedStatement ps = (PreparedStatement) statement;
    ps.execute();
    int rows = ps.getUpdateCount();
    Object parameterObject = boundSql.getParameterObject();
    KeyGenerator keyGenerator = mappedStatement.getKeyGenerator();
    keyGenerator.processAfter(executor, mappedStatement, ps, parameterObject);
    return rows;
}
```

从代码可以看出，MyBatis 调用的是驱动的 `PreparedStatement.execute()` 方法，而厂商提供的示例中执行的是 `PreparedStatement.executeUpdate()` 方法。

两个方法的区别在于：
- `execute` 方法可以执行任何 SQL
- `executeUpdate` 只能执行 DML 语句
- `executeUpdate` 会返回受影响的行数
- `execute` 需要通过 `getUpdateCount` 方法获取受影响的行数

MyBatis 之所以使用 `execute` 方法，是为了兼容更多的 SQL 语句。但是厂商的驱动在 `execute` 方法中没有实现获取自增 ID 的逻辑，导致 MyBatis 无法获取到自增 ID，只能返回 Null，这就是问题的根源。

#### 解决方案

既然问题的根源已经找到，解决方案就很明确了：在 MyBatis 执行插入操作时，使用 `executeUpdate` 方法替代 `execute` 方法。

MyBatis 允许在映射语句执行过程中的某些点进行拦截调用。通过插件（Interceptor）可以拦截的方法包括：

- Executor（update、query、flushStatements、commit、rollback、getTransaction、close、isClosed）
- ParameterHandler（getParameterObject、setParameters）
- ResultSetHandler（handleResultSets、handleOutputParameters）
- StatementHandler（prepare、parameterize、batch、update、query）

我们可以通过实现 `StatementHandler` 的 `update` 方法，来替换 MyBatis 默认的实现：

```java
/**
 * 拦截 MyBatis StatementHandler.update() 方法
 * 将 PreparedStatement.execute() 替换为 executeUpdate()
 */
@Intercepts({
        @Signature(type = StatementHandler.class, method = "update", args = {Statement.class})
})
public class CustomUpdateInterceptor implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Statement stmt = (Statement) invocation.getArgs()[0];

        if (stmt instanceof PreparedStatement) {
            StatementHandler statementHandler = (StatementHandler) PluginUtils.realTarget(invocation.getTarget());
            MetaObject metaObject = SystemMetaObject.forObject(statementHandler);

            MappedStatement ms = (MappedStatement) metaObject.getValue("delegate.mappedStatement");

            PreparedStatement ps = (PreparedStatement)stmt;
            if (ms.getSqlCommandType() != SqlCommandType.INSERT) {
                return invocation.proceed();
            }

            KeyGenerator keyGenerator = ms.getKeyGenerator();
            if (!(keyGenerator instanceof Jdbc3KeyGenerator)) {
                return invocation.proceed();
            }
            
            int rows = ps.executeUpdate();

            Executor executor = (Executor) metaObject.getValue("delegate.executor");
            BoundSql boundSql = (BoundSql) metaObject.getValue("delegate.boundSql");
            Object parameterObject = boundSql.getParameterObject();
            ms.getKeyGenerator().processAfter(executor, ms, ps, parameterObject);

            return rows;
        }

        // 如果不是 PreparedStatement，走原始逻辑
        return invocation.proceed();
    }

    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    @Override
    public void setProperties(Properties properties) {
    }
}
```

### 问题二：查询功能偶发数字溢出错误

#### 问题描述

系统中关于列表查询的功能会偶发报错：

```java
2000-00-22 11:02:35.556 ERROR 22612 --- [io-19013-exec-8] c.l.c.z.controller.ProjectController     : Error attempting to get column 'status' from result set.  Cause: java.sql.SQLException: 数字溢出
; uncategorized SQLException; SQL state [null]; error code [0]; 数字溢出; nested exception is java.sql.SQLException: 数字溢出

org.springframework.jdbc.UncategorizedSQLException: Error attempting to get column 'status' from result set.  Cause: java.sql.SQLException: 数字溢出
; uncategorized SQLException; SQL state [null]; error code [0]; 数字溢出; nested exception is java.sql.SQLException: 数字溢出
	at org.springframework.jdbc.support.AbstractFallbackSQLExceptionTranslator.translate(AbstractFallbackSQLExceptionTranslator.java:89)
	.....

Caused by: java.sql.SQLException: 数字溢出
	at sgcc.nds.jdbc.driver.NdsGetValue.getInt(NdsGetValue.java:857)
	at sgcc.nds.jdbc.driver.NdsResultSet.getInt(NdsResultSet.java:687)
	at sgcc.nds.jdbc.driver.NdsResultSet.getInt(NdsResultSet.java:1261)
	at com.alibaba.druid.filter.FilterChainImpl.resultSet_getInt(FilterChainImpl.java:1173)
	at com.alibaba.druid.filter.FilterAdapter.resultSet_getInt(FilterAdapter.java:1645)
	at com.alibaba.druid.filter.FilterChainImpl.resultSet_getInt(FilterChainImpl.java:1169)
	at com.alibaba.druid.proxy.jdbc.ResultSetProxyImpl.getInt(ResultSetProxyImpl.java:492)
	at com.alibaba.druid.pool.DruidPooledResultSet.getInt(DruidPooledResultSet.java:292)
	at sun.reflect.GeneratedMethodAccessor411.invoke(Unknown Source)
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
	at java.lang.reflect.Method.invoke(Method.java:498)
	at org.apache.ibatis.logging.jdbc.ResultSetLogger.invoke(ResultSetLogger.java:69)
	at com.sun.proxy.$Proxy196.getInt(Unknown Source)
	at org.apache.ibatis.type.IntegerTypeHandler.getNullableResult(IntegerTypeHandler.java:37)
	at org.apache.ibatis.type.IntegerTypeHandler.getNullableResult(IntegerTypeHandler.java:26)
	at org.apache.ibatis.type.BaseTypeHandler.getResult(BaseTypeHandler.java:85)
	at org.apache.ibatis.executor.resultset.DefaultResultSetHandler.applyAutomaticMappings(DefaultResultSetHandler.java:561)
	at org.apache.ibatis.executor.resultset.DefaultResultSetHandler.getRowValue(DefaultResultSetHandler.java:403)
	at org.apache.ibatis.executor.resultset.DefaultResultSetHandler.handleRowValuesForSimpleResultMap(DefaultResultSetHandler.java:355)
	at org.apache.ibatis.executor.resultset.DefaultResultSetHandler.handleRowValues(DefaultResultSetHandler.java:329)
	at org.apache.ibatis.executor.resultset.DefaultResultSetHandler.handleResultSet(DefaultResultSetHandler.java:302)
	at org.apache.ibatis.executor.resultset.DefaultResultSetHandler.handleResultSets(DefaultResultSetHandler.java:195)
	at org.apache.ibatis.executor.statement.PreparedStatementHandler.query(PreparedStatementHandler.java:65)
	at org.apache.ibatis.executor.statement.RoutingStatementHandler.query(RoutingStatementHandler.java:79)
    ...
```

通过日志可以看出，是在获取 `status` 字段时数字太大造成了数字溢出的异常。但是查询数据库实际的值为 `1` 或者 `0`，这根本不可能溢出。而且并不是每一次查询都会报错，是偶发的，并且只有在更换了驱动之后才出现该异常。

#### 问题分析

关键异常堆栈显示，实体中字段使用的是 Integer 类型，MyBatis 使用 IntegerTypeHandler 进行类型转换：

```java
public class IntegerTypeHandler extends BaseTypeHandler<Integer> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, 
                                   Integer parameter, JdbcType jdbcType)
            throws SQLException {
        ps.setInt(i, parameter);
    }

    @Override
    public Integer getNullableResult(ResultSet rs, String columnName) 
            throws SQLException {
        int result = rs.getInt(columnName);
        return result == 0 && rs.wasNull() ? null : result;
    }
    
    // ... 其他方法
}
```

MyBatis 最终调用的是 `rs.getInt(columnName)` 方法，也就是驱动的 `NdsResultSet.getInt(String columnLabel)` 方法：

```java
public int getInt(String columnName) throws SQLException {
    return this.connection.autoGeneratedKeys == 1 ? 
        this.getInt(1) : 
        this.getInt(this.findColumn(columnName));
}
```

这里有一个分支判断：如果 `this.connection.autoGeneratedKeys == 1`，则会调用 `this.getInt(1)` 方法获取第一列的值，否则根据列名获取对应列的值。

这个变量是在 `NdsConnection.prepareStatement(String sql, int autoGeneratedKeys)` 方法中被赋值的：

```java
public PreparedStatement prepareStatement(String sql, int autoGeneratedKeys) 
        throws SQLException {
    this.autoGeneratedKeys = autoGeneratedKeys;
    return this.prepareStatement(sql, 1004, 1007, this.holdability);
}
```

#### 问题根源

重新审视这段逻辑，`this.connection.autoGeneratedKeys` 变量属于 `NdsConnection` 对象，只要执行过 `prepareStatement(String sql, int autoGeneratedKeys)` 方法，这个变量就会被赋值，并且这个值会一直保留。如果这个值在下次执行 SQL 前没有被重置，下次执行 SQL 时就会继续沿用。

也就是说，如果上一次执行的是插入操作，并且使用了 `prepareStatement(String sql, int autoGeneratedKeys)` 方法，`autoGeneratedKeys` 就会被设置为 1。当下次执行查询操作时，`getInt(String columnName)` 方法会走错误的分支，直接调用 `this.getInt(1)` 获取第一列的值，而不是根据列名获取对应列的值。第一列通常是 ID，如果 ID 是一个比较大的 Long 类型数据，就会导致数字溢出异常。

由于数据库连接是通过连接池获取的，连接池中的连接是被复用的，所以这个问题是偶发的。只有当恰好上一次执行的是插入操作，并且使用了 `prepareStatement(String sql, int autoGeneratedKeys)` 方法，下次执行查询操作时才会出现这个问题。

#### 问题复现

为了稳定复现该问题，需要确保复用到上一次执行插入操作的连接。将连接池的最大连接数设置为 1：

```yaml
spring:
  datasource:
    hikari:
      minimum-idle: 1          # 最小空闲连接数
      maximum-pool-size: 1     # 最大连接池数量
      idle-timeout: 30000      # 空闲连接存活时间（毫秒）
      max-lifetime: 1800000
      connection-timeout: 30000
```

编写测试方法：

```java
@Test
public void testInsertProject() {
    Project project = new Project();
    project.setProjectName("测试项目");
    project.setProjectCode("200806002990");
    int rows = projectMapper.insert(project);
    System.out.println("插入行数: " + rows);
    System.out.println("插入后ID: " + project.getId());
    
    List<Project> projects = projectMapper.selectList(Wrappers.lambdaQuery());
    System.out.println(JSONUtil.toJsonPrettyStr(projects));
}
```

不出所料，成功复现了问题。

#### 解决方案

最初考虑不再使用自增 ID，改用雪花算法生成 ID。但发现修改后依然会有问题，虽然业务上不再依赖自增 ID，但 MyBatis 在某些地方执行插入语句时仍会设置 `useGeneratedKeys=true`，导致问题依然存在。

为了确保万无一失，最好的方案是修改 `NdsResultSet.getInt(String columnLabel)` 方法：

```java
public int getInt(String columnName) throws SQLException {
    return this.getInt(this.findColumn(columnName));
}
```

但这个类是驱动提供的，不能直接修改源码。需要使用 Java 的字节码增强技术，这里使用 ByteBuddy：

```java
@Configuration
public class MengdongNdsBugFixConfiguration {

    @PostConstruct
    public void fixNdsDriver() {
        try {
            ByteBuddyAgent.install();
            
            new ByteBuddy()
                .redefine(Class.forName("nds.jdbc.driver.NdsResultSet"))
                .method(ElementMatchers.named("getInt")
                    .and(ElementMatchers.takesArguments(String.class)))
                .intercept(MethodDelegation.to(NdsGetIntInterceptor.class))
                .make()
                .load(
                    Thread.currentThread().getContextClassLoader(),
                    ClassReloadingStrategy.fromInstalledAgent()
                );
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            throw new RuntimeException(e.getCause());
        }
    }
    
    public static class NdsGetIntInterceptor {
        
        @RuntimeType
        public static int intercept(@This Object self, 
                                   @Argument(0) String columnName) 
                throws SQLException {
            ResultSet rs = (ResultSet) self;
            return rs.getInt(rs.findColumn(columnName));
        }
    }
}
```

至此，两个驱动导致的 Bug 都被成功修复。

## 总结与思考

通过这次的驱动问题排查和修复，得到以下几点启示：

1. **不要盲目相信第三方组件**：在使用第三方组件时，一定要谨慎，进行充分的测试，尤其是对于关键组件，不要把希望完全寄托在厂商身上。

2. **深入理解框架原理的重要性**：如果不了解 MyBatis 的执行原理，很难定位到问题的根源。深入理解所使用框架的原理，对于解决复杂问题至关重要。

3. **字节码增强技术的应用**：当无法修改第三方库源码时，字节码增强技术提供了一个强大的解决方案。

4. **规范的重要性**：该驱动在设计时没有严格遵循 JDBC 规范，只考虑了最简单的使用场景，这是导致问题的根本原因。

这次经历再次证明，在企业级应用开发中，对待每一个组件都需要保持谨慎的态度，具备深入分析和解决问题的能力。