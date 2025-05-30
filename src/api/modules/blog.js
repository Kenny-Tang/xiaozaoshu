// api/modules/blog.js
import request from "@/utils/request.js";

export const getLinks = () => request.get('/api/users/article/list');

// 首页文章列表
export const getHomeArticleList = (param) => request.post('/api/users/article/homeView', JSON.stringify(param), {
    headers: {
        'Content-Type': 'application/json'
    }
});