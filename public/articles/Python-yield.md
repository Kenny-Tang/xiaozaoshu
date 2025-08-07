# yield

---

## 什么是 `yield`？

`yield` 是 Python 的关键字，用于创建 **生成器（generator）函数**。

它的作用是：

> 暂停函数执行、保留当前状态，下次再从这个位置继续执行。

**举个例子：**

```python
def my_gen():
    print("开始")
    yield 1
    print("继续")
    yield 2
    print("结束")
```

调用这个生成器：

```python
g = my_gen()
next(g)  # 输出 "开始"，返回 1
next(g)  # 输出 "继续"，返回 2
next(g)  # 输出 "结束"，StopIteration 异常
```

---

### 和 `return` 的区别

| return     | yield               |
| ---------- | ------------------- |
| 返回值并结束函数   | 暂停函数，保留状态           |
| 下一次调用重新执行  | 下一次调用从上次 `yield` 继续 |
| 普通函数       | 生成器函数               |
| 一次只能返回一个结果 | 可以一个一个“生成”多个结果      |

### StopIteration

当你调用 `next(g)` 并且**生成器函数（`yield`）已经执行完毕**后，Python 会抛出一个 `StopIteration` 异常。这其实是 **生成器正常结束的信号**，不是错误。

第三次 `next(g)` 调用时：

* 所有 `yield` 已经执行完了
* 函数运行到末尾或执行了 `return`
* Python 自动抛出 `StopIteration`，告诉你：“这个生成器没有更多的值了”

**为什么是抛出异常而不是返回 None？**

因为这符合 **迭代器协议（iterator protocol）** 的设计：

| 协议要求               | 含义                      |
| ------------------ | ----------------------- |
| 使用 `next()` 获取下一个值 | 正常运行时返回值                |
| 没有更多值时             | 抛出 `StopIteration` 表示结束 |

Python 的 `for` 循环等语法其实内部也是这么做的：

```python
for i in my_gen():
    print(i)
```

等价于：

```python
g = my_gen()
while True:
    try:
        i = next(g)
        print(i)
    except StopIteration:
        break
```

**如果你自己写 `return`，还能传值回来吗？**

是的，你可以这样：

```python
def g():
    yield 1
    return "done"
```

```python
gen = g()
try:
    print(next(gen))  # 输出 1
    print(next(gen))  # 抛出 StopIteration("done")
except StopIteration as e:
    print("异常值：", e.value)  # 获取 return 的值
```

输出：

```
1
异常值： done
```
通过 `StopIteration.value` 可以获取到返回的值


---
## FastAPI 中的 `yield`
### FastAPI 中的 `yield` 有什么特别的？

FastAPI 把 `yield` 用作**依赖管理的上下文**，比如数据库连接、事务管理、权限控制等。

比如我们写：

```python
def get_db():
    db = SessionLocal()
    try:
        yield db  # 提供数据库 session
    finally:
        db.close()  # 在请求结束后自动关闭
```

你可以把它理解为：

```text
调用 get_db() → 提供 db → 路由函数用完后 → 自动执行 finally 中的 db.close()
```

---

### FastAPI 中 yield 生命周期场景

| 场景    | 使用 yield 后的行为           |
| ----- | ----------------------- |
| 数据库连接 | 打开连接，路由用完后关闭连接          |
| 事务控制  | 提交成功或回滚错误               |
| 权限验证  | 使用上下文实现用户身份传递           |
| 日志收集  | 请求开始日志 → yield → 请求结束日志 |

---

### 为什么不用 `return db`？

如果你写：

```python
def get_db():
    db = SessionLocal()
    return db
```

FastAPI 只能拿到 db，但**无法自动关闭它**，也就不会执行 `db.close()`，容易造成连接泄露、资源浪费。
