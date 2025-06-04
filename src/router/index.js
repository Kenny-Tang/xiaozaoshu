import { createRouter, createWebHistory } from 'vue-router';
import * as blog from "@/api/modules/blog.js";

const routes = [
  { path: '/about', name: 'Vue Anki', component: () => import('../views/AboutView.vue') },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

function addRoutesRecursively(links, parentRoute = null) {
  links.forEach(link => {

    if (link.url) {
      const dynamicRoute = {
        path: link.path, 
        name: link.name,
        component: () => import(`../views/${link.component}.vue`),
        props: { url: link.url } // 把 URL 作为参数传递
      };

      // 检查路由是否已存在
      if (!router.hasRoute(link.name)) {
        router.addRoute(dynamicRoute);
      }
    }
    // 递归处理子路由
    if (link.children && link.children.length > 0) {
      const dynamicRoute = {
        path: link.path, 
        name: link.name
      }
      addRoutesRecursively(link.children, dynamicRoute);
    } 
  });
}

// 🚀 **动态加载 links.json 并添加到路由**
export async function loadDynamicRoutes() {
  try {
    const mdLinks = await blog.getLinks();
    addRoutesRecursively(mdLinks);
    // console.log('✅ 动态路由已加载:', router.getRoutes());
  } catch (error) {
    console.error('❌ 加载动态路由失败:', error);
  }
}

export default router;
