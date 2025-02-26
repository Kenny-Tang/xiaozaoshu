import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
	server: {
		port:3000
	},
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
	build: {
	    rollupOptions: {
	      output: {
	        manualChunks: {
	          vendor: ['element-plus', 'axios'],  // You can specify the libraries or files to be bundled separately
	        }
	      }
	    }
	  }
})
