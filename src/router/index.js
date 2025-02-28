import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import MdViewer from '../views/MdViewer.vue';
import axios from 'axios';

const routes = [
  { path: '/home', name: 'home', component: HomeView },
  { path: '/about', name: 'Vue Anki', component: () => import('../views/AboutView.vue') },
  { path: '/md-view', name: 'MdViewer', component: MdViewer }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// 🚀 **动态加载 links.json 并添加到路由**
export async function loadDynamicRoutes() {
  try {
//    const response = await axios.get('/api/article/list');
    const response = await axios.get('/links.json');

    const mdLinks = response.data;
		var timestamp = Date.parse(new Date()); 
    mdLinks.forEach(link => {
      const dynamicRoute = {
        path: link.path,//+'?version='+timestamp, // 例如 "/articles/application-deploy-strategy"
        name: link.name,
        component: () => import(`../views/${link.component}.vue`),
        props: { url: link.url } // 把 URL 作为参数传递
      };

      // 检查路由是否已存在
      if (!router.hasRoute(link.name)) {
        router.addRoute(dynamicRoute);
      }
    });

    console.log('✅ 动态路由已加载:', router.getRoutes());
  } catch (error) {
    console.error('❌ 加载动态路由失败:', error);
  }
}

export default router;
