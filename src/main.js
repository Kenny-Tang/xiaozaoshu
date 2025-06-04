import { createApp } from 'vue';
import App from './App.vue';
import ElementPlus from 'element-plus';
import router, { loadDynamicRoutes } from './router';
import { getClientId } from '@/utils/fingerPrintHelper.js';

// import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const app = createApp(App)

// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   // app.component(key, component)
// }

async function bootstrap() {
  await getClientId('vId'); // 初始化客户端ID

  try {
    await loadDynamicRoutes();
    app.use(router);
    app.use(ElementPlus);
    app.mount('#app');
  } catch (err) {
    console.error('加载动态路由失败：', err);
  }
}

bootstrap();
