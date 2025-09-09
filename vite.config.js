import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // CSS入口
        style: resolve(fileURLToPath(new URL('.', import.meta.url)), 'assets/css/tailwind.css'),
        // JS入口 - 分包处理
        main: resolve(fileURLToPath(new URL('.', import.meta.url)), 'assets/js/main.js'),
        masonry: resolve(fileURLToPath(new URL('.', import.meta.url)), 'assets/js/masonry.js'),
        modal: resolve(fileURLToPath(new URL('.', import.meta.url)), 'assets/js/modal.js'),
        tabs: resolve(fileURLToPath(new URL('.', import.meta.url)), 'assets/js/tabs.js'),
        like: resolve(fileURLToPath(new URL('.', import.meta.url)), 'assets/js/like.js'),
        infinite: resolve(fileURLToPath(new URL('.', import.meta.url)), 'assets/js/infinite.js')
      },
      output: {
        dir: 'assets',
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    cssTarget: 'chrome80',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer')
      ]
    }
  },
  server: {
    port: 3000,
    open: false,
    cors: true
  },
  resolve: {
    alias: {
      '@': resolve(fileURLToPath(new URL('.', import.meta.url)), 'assets')
    }
  }
});