import { createApp } from 'vue';
import App from './App.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import router, { loadDynamicRoutes } from './router'; // 确保引入 loadDynamicRoutes()
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

loadDynamicRoutes().then(() => { // 🔹 确保加载完动态路由后再挂载应用
  app.use(router);
  app.use(ElementPlus);
  app.mount('#app');
}).catch(error => {
  console.error('加载动态路由失败：', error);
});
