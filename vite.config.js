import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],

  server: {
    port: 3000,
    proxy: {
      '/api': {
        // target: 'https://www.xiaozaoshu.top/api/', // 目标 API 地址
        target: 'http://127.0.0.1:8081/', // 目标 API 地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Vite 使用 `rewrite` 而不是 `pathRewrite`
      },
    },
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    target: 'esnext', // 或 'es2022' / 'chrome89' 等

    chunkSizeWarningLimit: 1000, // 设置 chunk 大小警告限制为 1000kb

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('element-plus')) return 'element-plus'
            if (id.includes('axios')) return 'axios'
            if (id.includes('vue')) return 'vue'
            if (id.includes('echarts')) return 'echarts'
            return 'vendor'
          }
        },
      },
    },
  },
});
