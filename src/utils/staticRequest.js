// src/utils/staticRequest.js
import axios from 'axios';

const staticRequest = axios.create({
    baseURL: '', // 不带任何前缀（不会拼接 /api）
    timeout: 3000,
});

export default staticRequest;
