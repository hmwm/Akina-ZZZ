import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // CSS入口
        style: resolve(__dirname, 'assets/css/tailwind.css'),
        // JS入口 - 分包处理
        main: resolve(__dirname, 'assets/js/main.js'),
        masonry: resolve(__dirname, 'assets/js/masonry.js'),
        modal: resolve(__dirname, 'assets/js/modal.js'),
        tabs: resolve(__dirname, 'assets/js/tabs.js'),
        like: resolve(__dirname, 'assets/js/like.js'),
        infinite: resolve(__dirname, 'assets/js/infinite.js')
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
      '@': resolve(__dirname, 'assets')
    }
  }
});