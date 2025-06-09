import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer';


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    visualizer({ open: true }), // 打包后自动打开图形分析
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [
        ElementPlusResolver({
          importStyle: 'css',
          resolveIcons: true, // ✅ 关键点：开启图标自动引入
        }), // ✅ 开启图标解析

      ],
    })
  ],

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8081/',
        // target: 'https://www.xiaozaoshu.top/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // 使用gateway访问时不需要重写路径
      },
    },
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,

    modulePreload: {
      resolveDependencies(filename, deps) {
        return deps.filter(dep => !dep.endsWith('.js'))
      }
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'), // 👈 新增管理端入口
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@element-plus/icons-vue')) return 'element-plus-icons'
            if (id.includes('element-plus')) return 'element-plus'
            if (id.includes('axios')) return 'axios'
            if (id.includes('vue-office')) return 'vue-office' // ✅ 拆出 vue-office
            if (id.includes('wangeditor')) return 'wangeditor';  // 新增拆包
            if (id.includes('highlight')) return 'highlight';  // 新增拆包
            if (id.includes('vue')) return 'vue'
            if (id.includes('echarts')) return 'echarts'
            return 'vendor'
          }
        },
      },
    },
  },
})
