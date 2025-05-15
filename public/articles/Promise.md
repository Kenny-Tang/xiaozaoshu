
JavaScript 中 **`Promise`**，从概念到使用，再到原理和错误处理，全面帮你掌握它。

---

## 🧠 什么是 Promise？

### ✅ Promise 是 JS 中用于**处理异步操作的对象**

它代表一个异步操作的最终完成（成功）或失败，并返回相应的值。

> 你可以把 Promise 想象成一个\*\*“承诺”**：
> 我现在还没完成任务，但**将来\*\*会告诉你结果，成功了给你数据，失败了告诉你原因。

---

## 🧱 Promise 的三种状态

| 状态          | 说明                      |
| ----------- | ----------------------- |
| `pending`   | 初始状态，等待中                |
| `fulfilled` | 操作成功，调用 `resolve()` 后变成 |
| `rejected`  | 操作失败，调用 `reject()` 后变成  |

状态一旦改变，就**不能再变**！

---

## ✅ Promise 的基本语法

```js
const promise = new Promise((resolve, reject) => {
  // 异步操作，比如请求接口、定时器等
  if (成功) {
    resolve(结果);  // 状态变成 fulfilled
  } else {
    reject(错误);   // 状态变成 rejected
  }
});
```

### 然后你可以这样使用：

```js
promise
  .then(result => {
    // 成功时执行
    console.log("成功结果:", result);
  })
  .catch(error => {
    // 失败时执行
    console.error("失败原因:", error);
  });
```

---

## 📌 示例一：使用 Promise 包装异步操作

```js
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("等到了！");
    }, ms);
  });
}

wait(1000).then(msg => {
  console.log(msg); // 1 秒后输出 "等到了！"
});
```

---

## 📌 示例二：模拟异步请求

```js
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    if (id === 1) {
      resolve({ id: 1, name: "Alice" });
    } else {
      reject("用户不存在");
    }
  });
}

fetchUser(1)
  .then(user => console.log("用户信息:", user))
  .catch(err => console.error("出错:", err));
```

---

## 🔁 Promise 链式调用（then 链）

```js
doSomething()
  .then(result1 => {
    return doSomethingElse(result1);
  })
  .then(result2 => {
    return doAnotherThing(result2);
  })
  .catch(error => {
    console.error("发生错误：", error);
  });
```

每个 `.then()` 都返回一个新的 Promise，这就实现了链式调用。

---

## 🧰 静态方法：`Promise.all`, `Promise.race`, `Promise.allSettled`, `Promise.any`

| 方法                       | 作用                |
| ------------------------ | ----------------- |
| `Promise.all([p1, p2])`  | 全部成功才成功，有一个失败就失败  |
| `Promise.race([p1, p2])` | 谁先完成就用谁的结果（成功或失败） |
| `Promise.allSettled`     | 无论成功失败都收集结果       |
| `Promise.any`            | 只要一个成功就成功，全部失败才失败 |

示例：

```js
Promise.all([p1, p2])
  .then(results => console.log(results))
  .catch(err => console.error(err));
```

---

## 🔥 async/await 与 Promise 的关系

```js
async function main() {
  try {
    const result = await fetchData();
    console.log(result);
  } catch (err) {
    console.error("出错:", err);
  }
}
```

✅ 本质上 `await` 的对象**必须是 Promise**，它只是让异步代码写起来更像同步。

---

## ❗ 错误处理要点

```js
fetchData()
  .then(res => JSON.parse(res))
  .catch(err => {
    console.error("统一处理错误:", err);
  });
```

* **最好只写一个 `.catch()`** 处理整个链的异常
* `reject()` 和代码运行错误（如 JSON 解析失败）都能被 `.catch()` 捕获

---

## 🎯 总结表格

| 特性              | 描述                                     |
| --------------- | -------------------------------------- |
| 状态              | `pending` → `fulfilled` 或 `rejected`   |
| 创建语法            | `new Promise((resolve, reject) => {})` |
| 使用方法            | `.then()`、`.catch()`、`.finally()`      |
| 常见用途            | 网络请求、文件读写、定时器包装等                       |
| 和 `async/await` | 搭配使用，写法更清晰                             |

---

## 🧪 想试试？一个简单可运行的例子

```js
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

delay(1000).then(() => {
  console.log("1 秒后打印");
});
```

---

如果你有某段异步代码（比如 fetch、axios、定时器、socket 等）想用 Promise 或 `async/await` 封装，我可以直接帮你写出来！只需告诉我用法或业务需求。
