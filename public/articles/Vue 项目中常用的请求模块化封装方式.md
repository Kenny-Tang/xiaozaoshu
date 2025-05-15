
**最实用+防重复提交+loading+错误提示**的【专业版】API封装。

---

# 🌟 最佳实践：Vue 项目 API 封装

---

## 1. `utils/request.js` 完整版

```javascript
// utils/request.js
import axios from 'axios';
import { ElLoading, ElMessage } from 'element-plus';

let loadingInstance;

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  timeout: 10000,
});

// 防止重复提交
const pendingRequests = new Map();

function generateReqKey(config) {
  const { method, url, params, data } = config;
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&');
}

function addPendingRequest(config) {
  const key = generateReqKey(config);
  if (pendingRequests.has(key)) {
    throw new Error('重复请求被拦截'); // 直接抛错，可以在组件中 catch 到
  } else {
    pendingRequests.set(key, config);
  }
}

function removePendingRequest(config) {
  const key = generateReqKey(config);
  pendingRequests.delete(key);
}

// 请求拦截器
service.interceptors.request.use(config => {
  loadingInstance = ElLoading.service({ fullscreen: true, text: '加载中...' });

  addPendingRequest(config);

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  loadingInstance?.close();
  return Promise.reject(error);
});

// 响应拦截器
service.interceptors.response.use(response => {
  loadingInstance?.close();
  removePendingRequest(response.config);

  const res = response.data;
  if (res.code !== 0) {
    ElMessage.error(res.message || '请求出错');
    return Promise.reject(new Error(res.message || 'Error'));
  }
  return res.data;
}, error => {
  loadingInstance?.close();
  if (error.message !== '重复请求被拦截') {
    ElMessage.error(error.message || '请求失败');
  }
  removePendingRequest(error.config || {});
  return Promise.reject(error);
});

export default service;
```

---

✅ 说明：

| 部分        | 作用                                          |
| :-------- | :------------------------------------------ |
| 防重复提交     | 通过 `pendingRequests` 检测，如果同一个请求正在进行中，直接抛出错误 |
| loading效果 | 每次请求自动打开、结束自动关闭                             |
| 统一错误提示    | 失败弹出 toast，不需要手动处理                          |

---

## 2. `api/modules/user.js` 示例

```javascript
// api/modules/user.js
import request from '@/utils/request';

export const login = (data) => request.post('/user/login', data);

export const getUserInfo = () => request.get('/user/info');

export const logout = () => request.post('/user/logout');
```

---

## 3. `api/index.js` 暴漏模块

```javascript
// api/index.js
import * as user from './modules/user';

export default {
    user,
};
```

---

## 4. 组件中调用示例

```vue
<script setup>
import api from '@/api/index.js';
  
const handleLogin = async () => {
  try {
    const res = await api.user.login({ username: 'admin', password: '123456' });
    console.log('登录成功', res);
  } catch (error) {
    console.error('登录失败', error.message);
  }
};

const handleFetchUser = async () => {
  try {
    const userInfo = await api.user.getUserInfo();
    console.log('用户信息', userInfo);
  } catch (error) {
    console.error('获取用户失败', error.message);
  }
};
</script>
```

---

# 🚀 最终效果

* 🔹 **loading 自动管理**（不需要自己开关）
* 🔹 **防止重复点按钮导致多次提交**
* 🔹 **统一弹出错误提示**
* 🔹 **接口模块统一管理**

---

# ✅ 整理总结一版图

```bash
src/
├── api/
│   ├── index.js  # 模块导入
│   └── modules/
│       ├── user.js
│       └── product.js
├── utils/
│   └── request.js  # 核心封装
├── main.js
```

---

# 🔥 结尾

这种封装，适合：

* **Vue2 + Vite**
* **Vue3 + Vite**
* **小型到中大型前端项目**

基本可以满足绝大部分**企业级项目**开发标准！


