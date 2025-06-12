// api/modules/blog.js
import request from "@/utils/request.js";

export const getLinks = () => request.get('/api/users/article/list');

// 首页文章列表
export const getHomeArticleList = (param) => request.post('/api/users/article/homeView', JSON.stringify(param), {
    headers: {
        'Content-Type': 'application/json'
    }
});
/**
 * 获取文章详情
 * @returns {Promise<ArticleInfo>}
 */
export const getArticleById = (id) => request.get(`/api/users/article/${id}`);
// 添加文章
export const postArticle = (param) => request.post('/api/users/article/', param, {
    headers: {
        'Content-Type': 'multipart/form-data'
    }
});

/**
 * 获取专栏
 * @returns {Promise<ColumnInfo[]>}
 */
export const getColumnInfoList = () => request.get('/api/users/columnInfo/list')