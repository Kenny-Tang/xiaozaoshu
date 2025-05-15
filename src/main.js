import { createApp } from 'vue';
import App from './App.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import router, { loadDynamicRoutes } from './router';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { getClientId } from '@/utils/fingerPrintHelper.js';

// 初始化客户端ID
await getClientId('vId');

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
