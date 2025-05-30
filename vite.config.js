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
    // Vite 构建时会调用 esbuild 做转译和优化。你的构建目标环境（比如 "chrome87", "firefox78" 等）不支持 Top-Level Await，所以构建失败。
    // Top-Level Await 只有在较新的环境中才支持
    // Chrome 要到 v89+
    // Firefox 要到 v89+
    target: 'esnext', // 或 'es2022' / 'chrome89' 等

    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['element-plus', 'axios'], // 单独打包 element-plus 和 axios
        },
      },
    },
  },
});
