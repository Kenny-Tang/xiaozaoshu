import { createApp } from 'vue';
import App from './App.vue';
import router, { loadDynamicRoutes } from './router';
import { getClientId } from '@/utils/fingerPrintHelper.js';

const app = createApp(App)

async function bootstrap() {
  await getClientId('vId'); // 初始化客户端ID

  try {
    await loadDynamicRoutes();
    app.use(router);
    app.mount('#app');
  } catch (err) {
    console.error('加载动态路由失败：', err);
  }
}

bootstrap();
