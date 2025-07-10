JavaScript 的解构（Destructuring）语法是一种 **从数组或对象中快速提取值并赋值给变量** 的方式。它能让代码更简洁、清晰，常用于函数参数、变量赋值等场景。

The destructuring syntax in JavaScript is a powerful feature that makes it possible to unpack values from arrays or properties from objects into distinct variables. 
It can be used to simplify code, especially when dealing with complex data structures.



---
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring

阅读原文 [https://www.xiaozaoshu.top/articles/operator-destructure](https://www.xiaozaoshu.top/articles/operator-destructure)

# 语法

## 一、数组解构（Array Destructuring）

### 基本语法：

```js
const arr = [1, 2, 3];
const [a, b, c] = arr;

console.log(a); // 1
console.log(b); // 2
console.log(c); // 3
```

### 忽略某些元素：

```js
const [x, , y] = [10, 20, 30];
console.log(x); // 10
console.log(y); // 30
```

### 赋默认值：

```js
const [a = 1, b = 2] = [undefined, 5];
console.log(a); // 1
console.log(b); // 5
```

### 嵌套解构：

```js
const [a, [b, c]] = [1, [2, 3]];
console.log(b); // 2
```

### 使用剩余运算符：

```js
const [a, ...rest] = [1, 2, 3, 4];
console.log(rest); // [2, 3, 4]
```

---

## 二、对象解构（Object Destructuring）

### 基本语法：

```js
const obj = { name: 'Tom', age: 25 };
const { name, age } = obj;

console.log(name); // 'Tom'
console.log(age);  // 25
```

### 重命名变量：

```js
const { name: userName } = obj;
console.log(userName); // 'Tom'
```

### 默认值：

```js
const { gender = 'male' } = obj;
console.log(gender); // 'male'
```

### 嵌套对象解构：

```js
const person = {
  name: 'Alice',
  address: {
    city: 'Beijing',
    zip: '100000'
  }
};

const { address: { city } } = person;
console.log(city); // 'Beijing'
```

> ⚠️注意：嵌套解构中，`address` 本身并不会成为变量

---

## 三、函数参数解构

### 解构数组参数：

```js
function sum([a, b]) {
  return a + b;
}
console.log(sum([3, 4])); // 7
```

### 解构对象参数（常用于配置项）：

```js
function greet({ name = 'Guest', age }) {
  console.log(`Hello, ${name}. Age: ${age}`);
}
greet({ age: 18 }); // Hello, Guest. Age: 18
```

---

## 四、常见用途示例

### 1. 交换变量

```js
let a = 1, b = 2;
[a, b] = [b, a];
console.log(a, b); // 2 1
```

### 2. 提取 JSON 数据

```js
const json = { id: 42, status: 'ok' };
const { id, status } = json;
```

### 3. 多返回值函数

```js
function useUser() {
  return ['Tom', 18];
}
const [name, age] = useUser();
```

### 4. 设置函数默认参数

```js
function createUser({ name = 'Anonymous', age = 0 } = {}) {
  console.log(name, age);
}
createUser(); // Anonymous 0
```
注意以下两种方式的区别：

```js
function greet1({ name = 'Guest', age }) {
  console.log(`Hello, ${name}. Age: ${age}`);
}

function greet2({ name = 'Guest', age } = {}) {
  console.log(`Hello, ${name}. Age: ${age}`);
}
// for Java 
// public void greet2(User user) {
//   if (user == null) {
//       user = new User(); // 确保 user 不为 null
//   }
//   System.out.println("Hello, " + name + ". Age: " + age);
// }
```

---

## 总结

| 类型     | 示例语法                     | 特点说明               |
| ------ | ------------------------ | ------------------ |
| 数组解构   | `const [a, b] = [1, 2];` | 按顺序匹配位置            |
| 对象解构   | `const {x, y} = obj;`    | 按属性名匹配             |
| 默认值    | `const {x = 1} = {};`    | 值为 `undefined` 时生效 |
| 重命名    | `const {x: newX} = obj;` | 变量名与属性名不同时使用       |
| 嵌套解构   | `const {a: {b}} = obj;`  | 多层结构中提取字段          |
| 函数参数解构 | `function({a, b}) {}`    | 常用于传递结构化参数         |

---

# 练习

以下是关于 JavaScript 解构语法的 **习题 + 答案解析**，共分为三部分，适合练习与理解。

---

## **一、基础练习题（数组解构）**

### 题目 1：

```js
const [a, b, c] = [1, 2];
console.log(a, b, c);
```

> 输出结果为？

---

### 题目 2：

```js
const arr = [10, 20, 30, 40];
const [first, , third] = arr;
console.log(first, third);
```

> 输出结果为？

---

### 题目 3：

```js
const [a = 100, b = 200] = [undefined, null];
console.log(a, b);
```

> 输出结果为？

---

## **二、对象解构练习题**

### 题目 4：

```js
const obj = { x: 10, y: 20 };
const { x, y, z = 30 } = obj;
console.log(x, y, z);
```

> 输出结果为？

---

### 题目 5：

```js
const person = { name: 'Tom', age: 25 };
const { name: userName, age: userAge } = person;
console.log(userName, userAge);
```

> 输出结果为？

---

### 题目 6：

```js
const user = {
  info: {
    id: 1,
    role: 'admin'
  }
};

const {
  info: { role }
} = user;

console.log(role);
```

> 输出结果为？

---

## **三、函数参数解构练习**

### 题目 7：

```js
function printUser({ name = 'Guest', age }) {
  console.log(name, age);
}

printUser({ age: 18 });
```

> 输出结果为？

---

### 题目 8：

```js
function sum([a, b]) {
  return a + b;
}

console.log(sum([5, 10]));
```

> 输出结果为？

---

### 题目 9（稍难）：

```js
function setup({ port = 3000, host = 'localhost' } = {}) {
  console.log(port, host);
}

setup(); // 调用
```

> 输出结果为？

---

## 📘 **参考答案**

| 题号 | 输出结果             | 说明                             |
| -- | ---------------- | ------------------------------ |
| 1  | `1 2 undefined`  | `c` 未赋值，默认为 undefined          |
| 2  | `10 30`          | 忽略第二个元素，取第一个和第三个               |
| 3  | `100 null`       | `undefined` 才会触发默认值，`null` 不触发 |
| 4  | `10 20 30`       | `z` 没有定义，使用默认值 30              |
| 5  | `Tom 25`         | 使用解构重命名变量                      |
| 6  | `admin`          | 嵌套解构提取 `role`，`info` 本身不会变成变量  |
| 7  | `Guest 18`       | `name` 没有传入，用默认值，`age` 直接使用传入值 |
| 8  | `15`             | 解构数组 `[a, b] = [5, 10]`，求和     |
| 9  | `3000 localhost` | 没有传入参数时，解构默认值生效                |

---

## 挑战题

你可以尝试：

```js
const response = {
  status: 200,
  data: {
    list: [1, 2, 3],
    pageInfo: { page: 1, pageSize: 10 }
  }
};

// 用一行代码提取：list 和 pageSize
```