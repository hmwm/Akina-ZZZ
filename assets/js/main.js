/**
 * Akina ZZZ 主题主脚本
 * 负责主题的基础功能和模块加载
 */

// 全局配置
window.AkinaZZZ = {
  version: '1.0.0',
  settings: {
    enableModal: true,
    enableInfiniteScroll: true,
    enableLike: true,
    lazyLoadImages: true,
    masonryColumns: {
      mobile: 1,
      tablet: 2, 
      desktop: 3,
      wide: 4
    }
  },
  modules: {},
  utils: {}
};

/**
 * 工具函数
 */
AkinaZZZ.utils = {
  /**
   * 防抖函数
   * @param {Function} func 
   * @param {number} wait 
   * @param {boolean} immediate 
   */
  debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  /**
   * 节流函数
   * @param {Function} func 
   * @param {number} limit 
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * 获取当前断点
   */
  getCurrentBreakpoint() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';  
    if (width < 1440) return 'desktop';
    return 'wide';
  },

  /**
   * 异步加载脚本
   * @param {string} src 
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  /**
   * 格式化数字
   * @param {number} num 
   */
  formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    return (num / 1000000).toFixed(1) + 'M';
  },

  /**
   * 生成唯一ID
   */
  generateId() {
    return 'akina-' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * 元素是否在视口内
   * @param {Element} element 
   */
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  },

  /**
   * 平滑滚动到元素
   * @param {Element} element 
   * @param {number} offset 
   */
  scrollToElement(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  },

  /**
   * 获取主题设置
   * @param {string} key 
   */
  getSetting(key) {
    const settings = document.querySelector('meta[name="theme-settings"]');
    if (!settings) return AkinaZZZ.settings[key];
    
    try {
      const themeSettings = JSON.parse(settings.content);
      return themeSettings[key] !== undefined ? themeSettings[key] : AkinaZZZ.settings[key];
    } catch (e) {
      console.warn('Failed to parse theme settings:', e);
      return AkinaZZZ.settings[key];
    }
  },

  /**
   * 发送API请求
   * @param {string} url 
   * @param {object} options 
   */
  async apiRequest(url, options = {}) {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin'
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
};

/**
 * 事件系统
 */
AkinaZZZ.events = {
  listeners: {},

  /**
   * 添加事件监听器
   * @param {string} event 
   * @param {Function} callback 
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  /**
   * 移除事件监听器
   * @param {string} event 
   * @param {Function} callback 
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    
    const index = this.listeners[event].indexOf(callback);
    if (index > -1) {
      this.listeners[event].splice(index, 1);
    }
  },

  /**
   * 触发事件
   * @param {string} event 
   * @param {*} data 
   */
  emit(event, data) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    });
  }
};

/**
 * 初始化函数
 */
AkinaZZZ.init = function() {
  console.log(`Akina ZZZ Theme v${this.version} initializing...`);

  // 设置全局事件监听器
  this.setupGlobalEventListeners();
  
  // 初始化懒加载
  if (this.utils.getSetting('lazyLoadImages')) {
    this.initLazyLoading();
  }

  // 根据设置加载模块
  this.loadModules();

  // 触发初始化完成事件
  this.events.emit('theme:init', { version: this.version });
  
  console.log('Akina ZZZ Theme initialized successfully');
};

/**
 * 设置全局事件监听器
 */
AkinaZZZ.setupGlobalEventListeners = function() {
  // 响应式断点变化
  const handleResize = this.utils.debounce(() => {
    const breakpoint = this.utils.getCurrentBreakpoint();
    this.events.emit('breakpoint:change', breakpoint);
  }, 250);

  window.addEventListener('resize', handleResize);

  // 页面滚动
  const handleScroll = this.utils.throttle(() => {
    const scrollY = window.pageYOffset;
    const scrollPercent = scrollY / (document.body.scrollHeight - window.innerHeight);
    this.events.emit('scroll', { scrollY, scrollPercent });
  }, 16);

  window.addEventListener('scroll', handleScroll, { passive: true });

  // 页面可见性变化
  document.addEventListener('visibilitychange', () => {
    this.events.emit('visibility:change', !document.hidden);
  });

  // 键盘导航
  document.addEventListener('keydown', (e) => {
    this.events.emit('keyboard', e);
  });
};

/**
 * 初始化懒加载
 */
AkinaZZZ.initLazyLoading = function() {
  if (!('IntersectionObserver' in window)) {
    // 不支持IntersectionObserver则直接加载所有图片
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    img.classList.add('lazy');
    imageObserver.observe(img);
  });
};

/**
 * 加载模块
 */
AkinaZZZ.loadModules = async function() {
  const modules = [];

  // 瀑布流模块（总是加载）
  modules.push(this.utils.loadScript('/themes/akina-zzz/assets/js/masonry.js'));

  // 标签页模块（总是加载）
  modules.push(this.utils.loadScript('/themes/akina-zzz/assets/js/tabs.js'));

  // 弹层模块
  if (this.utils.getSetting('enableModal')) {
    modules.push(this.utils.loadScript('/themes/akina-zzz/assets/js/modal.js'));
  }

  // 无限滚动模块
  if (this.utils.getSetting('enableInfiniteScroll')) {
    modules.push(this.utils.loadScript('/themes/akina-zzz/assets/js/infinite.js'));
  }

  // 点赞模块
  if (this.utils.getSetting('enableLike')) {
    modules.push(this.utils.loadScript('/themes/akina-zzz/assets/js/like.js'));
  }

  try {
    await Promise.all(modules);
    this.events.emit('modules:loaded');
  } catch (error) {
    console.error('Failed to load some modules:', error);
  }
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AkinaZZZ.init());
} else {
  AkinaZZZ.init();
}