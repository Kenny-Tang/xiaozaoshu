// src/api/modules/static.js
import staticRequest from '@/utils/staticRequest';

export const getLinks = () => staticRequest.get('/links.json').then(res => res.data);
