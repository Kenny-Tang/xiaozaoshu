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
