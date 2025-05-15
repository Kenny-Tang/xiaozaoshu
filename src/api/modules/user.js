// api/modules/user.js
import request from '@/utils/request';

export const getLinks = () => request.get('/api/users/article/list');

export const traceUserAction = (data) => request.post('/api/users/userVisitTrace', data);

export const logUserAction = (data) => console.log(data);

export const getVirMac = () => request.get('/api/guest/mac');

export const login = (data) => request.post('/user/login', data);

export const getUserInfo = () => request.get('/user/info');

export const logout = () => request.post('/user/logout');
