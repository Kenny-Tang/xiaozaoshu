Python 魔术方法

Python 中的魔术方法（Magic Methods），又叫“**双下方法（dunder methods）**”，像 `__init__`、`__str__`、`__eq__` 这样的名字，是 Python 面向对象非常强大的特性。

---

## 常用魔术方法详解

最常见也最有用的几个魔术方法：

---

### 1. `__init__(self, ...)` —— 构造方法

**作用**：初始化对象属性
**何时触发**：`类名(...)` 创建实例时自动调用

同 `Java` 中的构造函数类似，`__init__` 方法在创建对象时被自动调用，用来设置初始状态。

```python
class Person:
    def __init__(self, name):
        self.name = name

p = Person("Alice")  # 自动调用 __init__
```

---

### 2. `__str__(self)` —— 字符串表示（给用户看的）

**作用**：定义 `print(obj)` 或 `str(obj)` 时的返回值（适合“人类可读”格式）
**何时触发**：`print(obj)` 或 `str(obj)`

同 `Java` 中的 `toString()` 方法，`__str__` 用于定义对象的“友好”字符串表示。

```python
class Person:
    def __init__(self, name):
        self.name = name

    def __str__(self):
        return f"👤 姓名：{self.name}"

p = Person("Bob")
print(p)  # 输出：👤 姓名：Bob
```

---

### 3. `__repr__(self)` —— 官方表示（给开发者看的）

**作用**：用于调试或交互环境中显示对象信息（“机器可读”格式）
**何时触发**：直接输入对象名、调用 `repr(obj)`，或没有定义 `__str__` 时 `print(obj)` 也会退回用 `__repr__`

给开发者看的，它通常返回一个可以用来重新创建该对象的字符串好吧，我并不能理解这个方法的实际意义。

```python
class Person:
    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return f"Person(name='{self.name}')"

p = Person("Bob")
p  # 输出：Person(name='Bob')（在 REPL/调试器中）
```

---

### 4. `__eq__(self, other)` —— 判断相等（==）

**作用**：自定义两个对象 `==` 的比较方式
**何时触发**：使用 `obj1 == obj2` 时

同 `Java` 中的 `equals()` 方法，`__eq__` 用于定义对象之间的相等比较, 不过 `Java` 中重写 `equals()` 还需要重写 `hashCode()` 方法，而 `Python` 中没有这个要求。

```python
class Person:
    def __init__(self, name):
        self.name = name

    def __eq__(self, other):
        return isinstance(other, Person) and self.name == other.name

p1 = Person("Alice")
p2 = Person("Alice")
print(p1 == p2)  # True
```

> 默认情况下 `==` 是比较地址（是否是同一个对象）。如果你要按值比较，需要重写 `__eq__`。

---

### 5. `__len__(self)` —— 支持 `len(obj)`

**作用**：让你的类对象可以用 `len()` 函数
**何时触发**：调用 `len(obj)` 时

`Java` 中的 `size()` 方法类似，不过 `Java` 中仅集合对象和数组有类似属性，普通对象没有，，但是感觉即使在 `Python` 中也主要是用于集合对象的操作，这种方法定义和使用和 `Javascript` 的语法更接近，可能这是是脚本语言共有的习惯。

```python
class Group:
    def __init__(self, members):
        self.members = members

    def __len__(self):
        return len(self.members)

g = Group(["Alice", "Bob"])
print(len(g))  # 输出 2
```

---

### 6. `__getitem__`, `__setitem__` —— 下标操作支持

让你的对象可以像列表一样用 `obj[i]` 访问：

```python
class MyList:
    def __init__(self):
        self.data = [1, 2, 3]

    def __getitem__(self, index):
        return self.data[index]

    def __setitem__(self, index, value):
        self.data[index] = value

ml = MyList()
print(ml[1])   # 输出 2
ml[1] = 100
print(ml[1])   # 输出 100
```

---

## 总结表：常见魔术方法

| 魔术方法           | 功能描述         | 示例触发方式             |
| -------------- | ------------ | ------------------ |
| `__init__`     | 构造方法         | `obj = Class(...)` |
| `__str__`      | 用户可读的字符串表示   | `print(obj)`       |
| `__repr__`     | 开发者调试用的字符串表示 | `repr(obj)` / 直接输入 |
| `__eq__`       | 等值判断（==）     | `obj1 == obj2`     |
| `__len__`      | 长度支持         | `len(obj)`         |
| `__getitem__`  | 下标读取         | `obj[i]`           |
| `__setitem__`  | 下标写入         | `obj[i] = x`       |
| `__delitem__`  | 下标删除         | `del obj[i]`       |
| `__contains__` | 成员判断         | `x in obj`         |

---



## 🧙‍♂️ 进阶魔术方法详解（高级篇）

### 1. `__call__(self, ...)` —— 让对象“像函数一样”被调用

**作用**：让对象实例像函数一样可以被“调用”。

 **触发方式**：`obj(...)`

```python
class Greeter:
    def __init__(self, name):
        self.name = name

    def __call__(self):
        print(f"Hello, I’m {self.name}")

g = Greeter("Alice")
g()  # 输出：Hello, I’m Alice
```

🔍 常用于：

* 封装函数逻辑
* 实现“可调用对象”/“行为参数”

---

### 2. `__iter__(self)` + `__next__(self)` —— 让对象可以被 `for` 遍历

**作用**：让你的类支持迭代（`for x in obj:`）

**触发方式**：`for` 循环、列表推导、`list(obj)`

在这一方面，`Python' 比 `Java' 更加灵活和简洁，更贴近面向对象的概念。

```python
class Counter:
    def __init__(self, limit):
        self.limit = limit
        self.current = 0

    def __iter__(self):
        return self  # 返回一个迭代器对象（通常是 self）

    def __next__(self):
        if self.current < self.limit:
            self.current += 1
            return self.current
        raise StopIteration  # 迭代结束

for num in Counter(3):
    print(num)  # 输出 1, 2, 3
```

更常见用法是让 `__iter__` 返回一个生成器或迭代器对象。

---

### 3. `__enter__` + `__exit__` —— 上下文管理器（支持 `with` 语句）

**作用**：支持 `with` 语法，常用于资源管理（如文件、数据库、锁等）

 **触发方式**：`with obj as x: ...`

```python
class FileMock:
    def __enter__(self):
        print("🔓 打开资源")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print("🔒 关闭资源")

with FileMock() as f:
    print("处理中...")
```

📝 输出：

```
🔓 打开资源
处理中...
🔒 关闭资源
```

---

### 4. `__contains__(self, item)` —— 支持 `in` 操作

**作用**：让 `x in obj` 成立

```python
class Bag:
    def __init__(self, items):
        self.items = items

    def __contains__(self, item):
        return item in self.items

bag = Bag(["apple", "banana"])
print("apple" in bag)   # True
print("orange" in bag)  # False
```

---

## 总结：进阶魔术方法能力表

| 魔术方法           | 用途            | 示例                  |
| -------------- | ------------- | ------------------- |
| `__call__`     | 让对象像函数一样调用    | `obj()`             |
| `__iter__`     | 返回迭代器         | `for x in obj:`     |
| `__next__`     | 获取下一个值        | 通常与 `__iter__` 配套使用 |
| `__enter__`    | 进入 `with` 语句块 | `with obj as x:`    |
| `__exit__`     | 离开 `with` 语句块 | 自动释放资源              |
| `__contains__` | 支持 `in` 操作    | `x in obj`          |

---

### 实用建议：

* 如果你写的是**工具类 / 数据模型类 / 框架中的组件类**，这些魔术方法可以让你的代码更优雅、简洁、Pythonic。
* 熟练掌握这些方法，也能更容易看懂 Flask、Django、Pandas、FastAPI 等框架的底层设计。

