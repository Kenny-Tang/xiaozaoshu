在使用 MyBatis-Plus 时，分页功能是其非常常用的一个特性，配置简单，使用方便。以下是 **MyBatis-Plus 分页的完整使用教程**，适用于 Spring Boot 项目。

---

## ✅ 一、依赖配置

确保你已经引入了 MyBatis-Plus 的依赖：

```xml
<dependency>
  <groupId>com.baomidou</groupId>
  <artifactId>mybatis-plus-boot-starter</artifactId>
  <version>3.5.5</version> <!-- 或最新版 -->
</dependency>
```

---

## ✅ 二、分页插件配置（MyBatis-Plus 3.4 以后）

从 MyBatis-Plus 3.4.0 开始，分页插件的配置方式变了（老版本的 `PaginationInterceptor` 被废弃）。

### 🛠 示例：配置类

```java
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MyBatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 指定数据库类型
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor());
        return interceptor;
    }
}
```

如果你使用的是 MySQL，可以写为：

```java
interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
```

---

## ✅ 三、Service 层分页查询示例

```java
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

public IPage<User> getUserPage(int pageNum, int pageSize) {
    Page<User> page = new Page<>(pageNum, pageSize);
    return userMapper.selectPage(page, null); // 第二个参数为 QueryWrapper，可传入条件
}
```

---

## ✅ 四、Controller 示例

```java
@GetMapping("/users")
public IPage<User> getUsers(@RequestParam int page, @RequestParam int size) {
    return userService.getUserPage(page, size);
}
```

---

## ✅ 五、返回结果结构说明

`selectPage()` 返回的是 `IPage<T>` 对象，包含以下信息：

* `getRecords()`：当前页数据
* `getTotal()`：总记录数
* `getPages()`：总页数
* `getCurrent()`：当前页码
* `getSize()`：每页记录数

---

## ✅ 六、使用 QueryWrapper 条件分页（可选）

```java
QueryWrapper<User> wrapper = new QueryWrapper<>();
wrapper.like("name", "张三");

Page<User> page = new Page<>(1, 10);
IPage<User> result = userMapper.selectPage(page, wrapper);
```

---

## ✅ 七、动态前端分页（Vue 示例）

配合前端（如 Element Plus 表格）：

```js
axios.get('/users', { params: { page: 1, size: 10 } }).then(res => {
  console.log(res.data.records); // 当前页数据
});
```

---

如你想使用更复杂的条件分页、自定义 SQL 分页或封装响应数据结构，也可以告诉我，我可以提供更详细的模板。
