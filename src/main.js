import { createApp } from 'vue';
import App from './App.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import router, { loadDynamicRoutes } from './router'; // 确保引入 loadDynamicRoutes()

const app = createApp(App);

loadDynamicRoutes().then(() => { // 🔹 确保加载完动态路由后再挂载应用
  app.use(router);
  app.use(ElementPlus);
  app.mount('#app');
});
