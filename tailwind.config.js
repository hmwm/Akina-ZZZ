/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.{html,js}",
    "./assets/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        // 深色系基础色彩
        'dark': {
          0: '#0b0b0e',    // 深黑背景
          50: '#141418',   // 浅黑背景
          100: '#1b1b21',  // 卡片背景
          200: '#2a2a32',  // 悬浮背景
          300: '#3a3a44',  // 边框色
          400: '#52525b',  // 分隔线
          500: '#71717a',  // 次要文字
          600: '#a1a1aa',  // 主要文字
          700: '#d4d4d8',  // 高亮文字
          800: '#f4f4f5',  // 纯白文字
          900: '#ffffff'   // 最高对比
        },
        // 主题强调色
        'accent': {
          DEFAULT: '#d8ff39',
          50: '#f8ffe6',
          100: '#f0ffcc',
          200: '#e3ff9d',
          300: '#d0ff5e',
          400: '#beff2b',
          500: '#d8ff39',  // 主色
          600: '#a6d800',
          700: '#7da600',
          800: '#5c7d00',
          900: '#3a5100'
        },
        // 警示色
        'danger': {
          DEFAULT: '#ff3b3b',
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc8c8',
          300: '#ffa3a3',
          400: '#ff6b6b',
          500: '#ff3b3b',  // 主色
          600: '#f31919',
          700: '#cc0e0e',
          800: '#a60f0f',
          900: '#891414'
        },
        // 品牌蓝色
        'brand': {
          DEFAULT: '#2962ff',
          50: '#f0f4ff',
          100: '#e1eaff',
          200: '#c7d8ff',
          300: '#a5bfff',
          400: '#8aa1ff',
          500: '#2962ff',  // 主色
          600: '#1e4ed8',
          700: '#1d3fb3',
          800: '#1e3a8a',
          900: '#1e3a8a'
        }
      },
      borderRadius: {
        'xl': '18px',
        '2xl': '24px',
        '3xl': '32px'
      },
      boxShadow: {
        'card': '0 4px 16px -2px rgba(0, 0, 0, 0.3), 0 2px 8px -1px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 24px -4px rgba(0, 0, 0, 0.4), 0 4px 16px -2px rgba(0, 0, 0, 0.5)',
        'modal': '0 20px 64px -8px rgba(0, 0, 0, 0.6), 0 8px 32px -4px rgba(0, 0, 0, 0.4)',
        'pill': '0 2px 8px -1px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
        'mono': ['SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '12px',
        'lg': '24px',
        'xl': '40px',
        '2xl': '64px'
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.2s ease-in',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.3s ease-out',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-out': 'scale-out 0.2s ease-in',
        'shimmer': 'shimmer 1.5s infinite linear'
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        'slide-up': {
          '0%': { 
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'slide-down': {
          '0%': { 
            opacity: '0',
            transform: 'translateY(-20px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'scale-in': {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.9)'
          },
          '100%': { 
            opacity: '1',
            transform: 'scale(1)'
          }
        },
        'scale-out': {
          '0%': { 
            opacity: '1',
            transform: 'scale(1)'
          },
          '100%': { 
            opacity: '0',
            transform: 'scale(0.9)'
          }
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}