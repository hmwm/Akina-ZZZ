
/* === main.js === */
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

/* === masonry.js === */
/**
 * Akina ZZZ 瀑布流布局模块
 * 基于CSS Columns实现，提供响应式瀑布流布局
 */

(function() {
  'use strict';

  // 确保AkinaZZZ命名空间存在
  if (!window.AkinaZZZ) {
    console.error('AkinaZZZ namespace not found. Make sure main.js is loaded first.');
    return;
  }

  const AkinaZZZ = window.AkinaZZZ;

  /**
   * 瀑布流模块
   */
  const MasonryModule = {
    // 配置选项
    options: {
      container: '.masonry-container',
      item: '.masonry-item',
      columnGap: '1.5rem',
      breakpoints: {
        mobile: 767,
        tablet: 1439,
        desktop: 1799
      },
      columns: {
        mobile: 1,
        tablet: 2,
        desktop: 3,
        wide: 4
      },
      debounceDelay: 250
    },

    // 内部状态
    state: {
      container: null,
      items: [],
      currentColumns: 0,
      initialized: false,
      observer: null
    },

    /**
     * 初始化瀑布流
     * @param {string|Element} container - 容器选择器或元素
     * @param {Object} options - 配置选项
     */
    init(container, options = {}) {
      try {
        // 合并选项
        this.options = { ...this.options, ...options };

        // 获取容器元素
        this.state.container = typeof container === 'string' 
          ? document.querySelector(container) 
          : container;

        if (!this.state.container) {
          console.warn('Masonry container not found:', container);
          return;
        }

        // 获取所有项目
        this.updateItems();

        if (this.state.items.length === 0) {
          console.log('No masonry items found');
          return;
        }

        // 初始化布局
        this.initLayout();

        // 绑定事件监听器
        this.bindEventListeners();

        // 设置Intersection Observer（用于新项目的检测）
        this.setupObserver();

        this.state.initialized = true;

        console.log(`Masonry initialized with ${this.state.items.length} items`);

        // 触发初始化事件
        AkinaZZZ.events.emit('masonry:initialized', {
          container: this.state.container,
          itemCount: this.state.items.length
        });

      } catch (error) {
        console.error('Failed to initialize masonry:', error);
      }
    },

    /**
     * 更新项目列表
     */
    updateItems() {
      this.state.items = Array.from(
        this.state.container.querySelectorAll(this.options.item)
      );
    },

    /**
     * 初始化布局
     */
    initLayout() {
      const breakpoint = AkinaZZZ.utils.getCurrentBreakpoint();
      const columns = this.getColumnsForBreakpoint(breakpoint);

      // 设置容器样式
      this.setContainerStyle(columns);

      // 应用项目样式
      this.applyItemStyles();

      this.state.currentColumns = columns;

      // 触发布局事件
      AkinaZZZ.events.emit('masonry:layout', {
        breakpoint,
        columns,
        itemCount: this.state.items.length
      });
    },

    /**
     * 获取断点对应的列数
     * @param {string} breakpoint - 断点名称
     * @returns {number} 列数
     */
    getColumnsForBreakpoint(breakpoint) {
      const settings = AkinaZZZ.utils.getSetting('masonryColumns') || this.options.columns;
      return settings[breakpoint] || this.options.columns[breakpoint];
    },

    /**
     * 设置容器样式
     * @param {number} columns - 列数
     */
    setContainerStyle(columns) {
      const container = this.state.container;
      
      // 设置CSS Columns属性
      container.style.columnCount = columns;
      container.style.columnGap = this.options.columnGap;
      container.style.columnFill = 'balance';

      // 添加CSS类
      container.classList.add('masonry-initialized');
      
      // 移除之前的列数类
      container.classList.forEach(className => {
        if (className.startsWith('columns-')) {
          container.classList.remove(className);
        }
      });
      
      // 添加当前列数类
      container.classList.add(`columns-${columns}`);
    },

    /**
     * 应用项目样式
     */
    applyItemStyles() {
      this.state.items.forEach((item, index) => {
        // 确保项目有正确的CSS类
        if (!item.classList.contains('masonry-item')) {
          item.classList.add('masonry-item');
        }

        // 设置break-inside避免分页
        item.style.breakInside = 'avoid';
        
        // 为新加载的项目添加淡入动画
        if (item.dataset.newItem === 'true') {
          item.classList.add('animate-fade-in');
          item.style.animationDelay = `${index * 50}ms`;
          item.dataset.newItem = 'false';
        }
      });
    },

    /**
     * 重新计算布局
     */
    relayout() {
      if (!this.state.initialized) {
        return;
      }

      // 更新项目列表
      this.updateItems();

      // 重新初始化布局
      this.initLayout();

      // 触发重新布局事件
      AkinaZZZ.events.emit('masonry:relayout', {
        itemCount: this.state.items.length
      });
    },

    /**
     * 添加新项目
     * @param {Element|Element[]} items - 新项目元素
     */
    addItems(items) {
      const itemsArray = Array.isArray(items) ? items : [items];
      
      itemsArray.forEach(item => {
        // 标记为新项目
        item.dataset.newItem = 'true';
        
        // 添加到容器
        this.state.container.appendChild(item);
      });

      // 重新计算布局
      this.relayout();

      console.log(`Added ${itemsArray.length} new items to masonry`);

      // 触发添加项目事件
      AkinaZZZ.events.emit('masonry:items-added', {
        items: itemsArray,
        totalCount: this.state.items.length
      });
    },

    /**
     * 移除项目
     * @param {Element|Element[]} items - 要移除的项目
     */
    removeItems(items) {
      const itemsArray = Array.isArray(items) ? items : [items];
      
      itemsArray.forEach(item => {
        // 添加移除动画
        item.classList.add('animate-fade-out');
        
        // 动画完成后移除元素
        item.addEventListener('animationend', () => {
          if (item.parentNode) {
            item.parentNode.removeChild(item);
          }
        }, { once: true });
      });

      // 延迟重新布局，等待动画完成
      setTimeout(() => {
        this.relayout();
      }, 300);

      // 触发移除项目事件
      AkinaZZZ.events.emit('masonry:items-removed', {
        items: itemsArray
      });
    },

    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
      // 响应断点变化
      AkinaZZZ.events.on('breakpoint:change', (breakpoint) => {
        const newColumns = this.getColumnsForBreakpoint(breakpoint);
        
        if (newColumns !== this.state.currentColumns) {
          this.setContainerStyle(newColumns);
          this.state.currentColumns = newColumns;
          
          console.log(`Masonry columns updated to ${newColumns} for ${breakpoint}`);
        }
      });

      // 响应窗口resize事件（防抖处理）
      const handleResize = AkinaZZZ.utils.debounce(() => {
        this.relayout();
      }, this.options.debounceDelay);

      window.addEventListener('resize', handleResize);

      // 响应密度变化
      document.addEventListener('density-change', (e) => {
        const density = e.detail;
        this.updateDensity(density);
      });

      // 响应图片加载完成
      this.state.container.addEventListener('load', (e) => {
        if (e.target.tagName === 'IMG') {
          // 图片加载完成后重新计算布局
          this.relayout();
        }
      }, true);
    },

    /**
     * 更新卡片密度
     * @param {string} density - 密度级别：tight/normal/loose
     */
    updateDensity(density) {
      const container = this.state.container;
      
      // 移除之前的密度类
      container.classList.remove('density-tight', 'density-normal', 'density-loose');
      
      // 添加新的密度类
      container.classList.add(`density-${density}`);
      
      // 更新间距
      const gapMap = {
        tight: '1rem',
        normal: '1.5rem',
        loose: '2rem'
      };
      
      container.style.columnGap = gapMap[density] || this.options.columnGap;
      
      console.log(`Masonry density updated to ${density}`);
    },

    /**
     * 设置Intersection Observer
     */
    setupObserver() {
      if (!('IntersectionObserver' in window)) {
        return;
      }

      this.state.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const item = entry.target;
            
            // 触发项目可见事件
            AkinaZZZ.events.emit('masonry:item-visible', {
              item,
              index: Array.from(this.state.items).indexOf(item)
            });
          }
        });
      }, {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      });

      // 观察所有项目
      this.state.items.forEach(item => {
        this.state.observer.observe(item);
      });
    },

    /**
     * 销毁瀑布流
     */
    destroy() {
      if (!this.state.initialized) {
        return;
      }

      // 移除事件监听器
      AkinaZZZ.events.off('breakpoint:change');

      // 断开Observer
      if (this.state.observer) {
        this.state.observer.disconnect();
      }

      // 重置容器样式
      const container = this.state.container;
      container.style.columnCount = '';
      container.style.columnGap = '';
      container.style.columnFill = '';
      container.classList.remove('masonry-initialized');

      // 重置状态
      this.state = {
        container: null,
        items: [],
        currentColumns: 0,
        initialized: false,
        observer: null
      };

      console.log('Masonry destroyed');

      // 触发销毁事件
      AkinaZZZ.events.emit('masonry:destroyed');
    },

    /**
     * 获取调试信息
     */
    getDebugInfo() {
      return {
        initialized: this.state.initialized,
        itemCount: this.state.items.length,
        currentColumns: this.state.currentColumns,
        currentBreakpoint: AkinaZZZ.utils.getCurrentBreakpoint(),
        containerElement: this.state.container,
        options: this.options
      };
    }
  };

  // 将模块添加到全局命名空间
  AkinaZZZ.modules.masonry = MasonryModule;

  console.log('Masonry module loaded');

})();

/* === modal.js === */
/**
 * Akina ZZZ 模态框模块
 * 处理文章详情弹层、搜索弹层等模态框交互
 */

(function() {
  'use strict';

  // 确保AkinaZZZ命名空间存在
  if (!window.AkinaZZZ) {
    console.error('AkinaZZZ namespace not found. Make sure main.js is loaded first.');
    return;
  }

  const AkinaZZZ = window.AkinaZZZ;

  /**
   * 模态框模块
   */
  const ModalModule = {
    // 配置选项
    options: {
      enableModal: true,
      enableBackdropClose: true,
      enableEscapeClose: true,
      animationDuration: 300,
      zIndex: 1000
    },

    // 内部状态
    state: {
      activeModal: null,
      modalStack: [],
      bodyScrollPosition: 0,
      initialized: false
    },

    /**
     * 初始化模态框模块
     * @param {Object} options - 配置选项
     */
    init(options = {}) {
      try {
        // 合并选项
        this.options = { ...this.options, ...options };

        // 检查是否启用模态框
        if (!AkinaZZZ.utils.getSetting('enableModal')) {
          console.log('Modal disabled in theme settings');
          return;
        }

        // 创建模态框容器
        this.createModalContainer();

        // 绑定全局事件监听器
        this.bindGlobalEventListeners();

        this.state.initialized = true;

        console.log('Modal module initialized');

        // 触发初始化事件
        AkinaZZZ.events.emit('modal:initialized');

      } catch (error) {
        console.error('Failed to initialize modal module:', error);
      }
    },

    /**
     * 创建模态框容器
     */
    createModalContainer() {
      let container = document.getElementById('modal-container');
      
      if (!container) {
        container = document.createElement('div');
        container.id = 'modal-container';
        container.className = 'modal-container';
        document.body.appendChild(container);
      }

      this.state.modalContainer = container;
    },

    /**
     * 显示文章详情模态框
     * @param {string} postId - 文章ID
     * @param {string} title - 文章标题
     */
    async showPost(postId, title) {
      if (!this.state.initialized) {
        console.warn('Modal module not initialized');
        return;
      }

      try {
        console.log('Showing post modal:', postId, title);

        // 创建模态框HTML
        const modalHTML = this.createPostModalHTML();
        
        // 显示模态框
        const modal = this.showModal(modalHTML, 'post-modal');
        
        // 触发Alpine.js事件来加载内容
        window.dispatchEvent(new CustomEvent('modal:show-post', {
          detail: { postId, title }
        }));

        // 触发显示事件
        AkinaZZZ.events.emit('modal:post-shown', { postId, title });

        return modal;

      } catch (error) {
        console.error('Failed to show post modal:', error);
        
        // 降级到直接跳转
        window.location.href = `/posts/${postId}`;
      }
    },

    /**
     * 显示搜索模态框
     */
    showSearch() {
      if (!this.state.initialized) {
        console.warn('Modal module not initialized');
        return;
      }

      try {
        console.log('Showing search modal');

        // 创建搜索模态框HTML
        const modalHTML = this.createSearchModalHTML();
        
        // 显示模态框
        const modal = this.showModal(modalHTML, 'search-modal');
        
        // 触发Alpine.js事件
        window.dispatchEvent(new CustomEvent('modal:show-search'));

        // 触发显示事件
        AkinaZZZ.events.emit('modal:search-shown');

        return modal;

      } catch (error) {
        console.error('Failed to show search modal:', error);
      }
    },

    /**
     * 通用模态框显示方法
     * @param {string} html - 模态框HTML内容
     * @param {string} id - 模态框ID
     * @returns {Element} 模态框元素
     */
    showModal(html, id) {
      // 保存当前滚动位置
      this.saveScrollPosition();

      // 创建模态框元素
      const modalElement = document.createElement('div');
      modalElement.innerHTML = html;
      const modal = modalElement.firstElementChild;
      modal.id = id;

      // 添加到容器
      this.state.modalContainer.appendChild(modal);

      // 设置样式
      modal.style.zIndex = this.options.zIndex + this.state.modalStack.length;

      // 显示模态框
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      // 阻止页面滚动
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = this.getScrollbarWidth() + 'px';

      // 添加到模态框栈
      this.state.modalStack.push(modal);
      this.state.activeModal = modal;

      // 绑定模态框事件
      this.bindModalEvents(modal);

      // 焦点管理
      this.manageFocus(modal);

      return modal;
    },

    /**
     * 关闭模态框
     * @param {Element} modal - 要关闭的模态框元素，不传则关闭当前活动模态框
     */
    closeModal(modal = null) {
      const targetModal = modal || this.state.activeModal;
      
      if (!targetModal) {
        return;
      }

      console.log('Closing modal:', targetModal.id);

      // 添加关闭动画
      targetModal.classList.add('animate-fade-out');

      // 动画完成后移除元素
      setTimeout(() => {
        // 从栈中移除
        const index = this.state.modalStack.indexOf(targetModal);
        if (index > -1) {
          this.state.modalStack.splice(index, 1);
        }

        // 移除DOM元素
        if (targetModal.parentNode) {
          targetModal.parentNode.removeChild(targetModal);
        }

        // 更新活动模态框
        this.state.activeModal = this.state.modalStack[this.state.modalStack.length - 1] || null;

        // 如果没有模态框了，恢复页面滚动
        if (this.state.modalStack.length === 0) {
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
          this.restoreScrollPosition();
        }

        // 触发关闭事件
        AkinaZZZ.events.emit('modal:closed', { modal: targetModal });

      }, this.options.animationDuration);
    },

    /**
     * 关闭所有模态框
     */
    closeAllModals() {
      while (this.state.modalStack.length > 0) {
        this.closeModal();
      }
    },

    /**
     * 绑定全局事件监听器
     */
    bindGlobalEventListeners() {
      // ESC键关闭
      if (this.options.enableEscapeClose) {
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.state.activeModal) {
            this.closeModal();
          }
        });
      }

      // 全局模态框事件
      window.addEventListener('modal:close', () => {
        this.closeModal();
      });

      window.addEventListener('modal:close-all', () => {
        this.closeAllModals();
      });
    },

    /**
     * 绑定模态框特定事件
     * @param {Element} modal - 模态框元素
     */
    bindModalEvents(modal) {
      // 背景点击关闭
      if (this.options.enableBackdropClose) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModal(modal);
          }
        });
      }

      // 关闭按钮
      const closeButtons = modal.querySelectorAll('[data-modal-close], .modal-close');
      closeButtons.forEach(button => {
        button.addEventListener('click', () => {
          this.closeModal(modal);
        });
      });
    },

    /**
     * 焦点管理
     * @param {Element} modal - 模态框元素
     */
    manageFocus(modal) {
      // 保存之前的活动元素
      this.state.previousActiveElement = document.activeElement;

      // 查找可聚焦的元素
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        // 聚焦第一个元素
        focusableElements[0].focus();

        // Tab键循环焦点
        modal.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
              }
            }
          }
        });
      }
    },

    /**
     * 保存滚动位置
     */
    saveScrollPosition() {
      this.state.bodyScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    },

    /**
     * 恢复滚动位置
     */
    restoreScrollPosition() {
      window.scrollTo(0, this.state.bodyScrollPosition);
    },

    /**
     * 获取滚动条宽度
     * @returns {number} 滚动条宽度
     */
    getScrollbarWidth() {
      const scrollDiv = document.createElement('div');
      scrollDiv.style.cssText = 'width: 100px; height: 100px; overflow: scroll; position: absolute; top: -9999px;';
      document.body.appendChild(scrollDiv);
      const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
      document.body.removeChild(scrollDiv);
      return scrollbarWidth;
    },

    /**
     * 创建文章详情模态框HTML
     * @returns {string} HTML字符串
     */
    createPostModalHTML() {
      return `
        <div class="modal-overlay flex items-center justify-center p-4" id="post-modal">
          <div class="modal-content animate-scale-in w-full max-w-6xl">
            <!-- 模态框内容将通过Alpine.js和模板片段加载 -->
            <div class="flex items-center justify-center h-64">
              <div class="text-center">
                <div class="w-16 h-16 mx-auto mb-4 text-dark-400 animate-pulse">
                  <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <p class="text-dark-500">加载文章内容中...</p>
                <button class="mt-4 pill-btn-secondary" onclick="window.dispatchEvent(new CustomEvent('modal:close'))">
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * 创建搜索模态框HTML
     * @returns {string} HTML字符串
     */
    createSearchModalHTML() {
      return `
        <div class="modal-overlay flex items-center justify-start pt-20" id="search-modal">
          <div class="w-full max-w-2xl mx-auto px-4">
            <div class="bg-dark-50 rounded-3xl shadow-modal border border-dark-200">
              <div class="p-6">
                <div class="relative">
                  <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-500">
                    <path fill="none" stroke="currentColor" stroke-width="2" 
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <input type="text" 
                         placeholder="搜索文章、标签或作者..."
                         class="w-full pl-12 pr-4 py-3 bg-dark-100 border border-dark-200 rounded-xl text-dark-800 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                         autofocus>
                </div>
                <div class="mt-4 text-center text-dark-500">
                  <p>输入关键词开始搜索</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * 获取调试信息
     */
    getDebugInfo() {
      return {
        initialized: this.state.initialized,
        activeModal: this.state.activeModal ? this.state.activeModal.id : null,
        modalCount: this.state.modalStack.length,
        options: this.options
      };
    }
  };

  // 将模块添加到全局命名空间
  AkinaZZZ.modules.modal = ModalModule;

  console.log('Modal module loaded');

})();

/* === infinite.js === */
/**
 * Akina ZZZ 无限滚动模块
 * 实现瀑布流的无限滚动加载
 */

(function() {
  'use strict';

  // 确保AkinaZZZ命名空间存在
  if (!window.AkinaZZZ) {
    console.error('AkinaZZZ namespace not found. Make sure main.js is loaded first.');
    return;
  }

  const AkinaZZZ = window.AkinaZZZ;

  /**
   * 无限滚动模块
   */
  const InfiniteScrollModule = {
    // 配置选项
    options: {
      enabled: true,
      threshold: 200, // 距离底部多少像素时触发加载
      debounceDelay: 300,
      maxPages: 50, // 最大加载页数
      loadingDelay: 1000, // 加载延迟，防止过于频繁的请求
      batchSize: 6 // 每次加载的项目数量
    },

    // 内部状态
    state: {
      container: null,
      trigger: null,
      loadMoreBtn: null,
      loadingIndicator: null,
      currentPage: 1,
      totalPages: 1,
      loading: false,
      hasMore: true,
      initialized: false,
      observer: null,
      lastLoadTime: 0
    },

    /**
     * 初始化无限滚动
     * @param {string|Element} trigger - 触发器选择器或元素
     * @param {Object} options - 配置选项
     */
    init(trigger, options = {}) {
      try {
        // 合并选项
        this.options = { ...this.options, ...options };

        // 检查是否启用无限滚动
        if (!AkinaZZZ.utils.getSetting('enableInfiniteScroll')) {
          console.log('Infinite scroll disabled in theme settings');
          this.showLoadMoreButton(trigger, options);
          return;
        }

        // 获取触发器元素
        this.state.trigger = typeof trigger === 'string' 
          ? document.querySelector(trigger) 
          : trigger;

        if (!this.state.trigger) {
          console.warn('Infinite scroll trigger not found:', trigger);
          return;
        }

        // 获取相关元素
        this.state.container = options.container 
          ? document.querySelector(options.container)
          : document.querySelector('.masonry-container');

        this.state.loadMoreBtn = options.loadMoreBtn 
          ? document.querySelector(options.loadMoreBtn) 
          : this.state.trigger.querySelector('#load-more-btn');

        this.state.loadingIndicator = options.loadingIndicator 
          ? document.querySelector(options.loadingIndicator) 
          : this.state.trigger.querySelector('#loading-indicator');

        // 从触发器获取初始数据
        this.parseInitialData();

        // 设置Intersection Observer
        this.setupObserver();

        // 绑定手动加载按钮
        this.bindLoadMoreButton();

        this.state.initialized = true;

        console.log('Infinite scroll initialized', this.getStatus());

        // 触发初始化事件
        AkinaZZZ.events.emit('infinite:initialized', this.getStatus());

      } catch (error) {
        console.error('Failed to initialize infinite scroll:', error);
        // 降级到手动加载按钮
        this.showLoadMoreButton(trigger, options);
      }
    },

    /**
     * 解析初始数据
     */
    parseInitialData() {
      const trigger = this.state.trigger;
      
      this.state.currentPage = parseInt(trigger.dataset.nextPage || '1');
      this.state.totalPages = parseInt(trigger.dataset.totalPages || '1');
      this.state.hasMore = trigger.dataset.hasNext === 'true';

      console.log('Initial data:', {
        currentPage: this.state.currentPage,
        totalPages: this.state.totalPages,
        hasMore: this.state.hasMore
      });
    },

    /**
     * 设置Intersection Observer
     */
    setupObserver() {
      if (!('IntersectionObserver' in window)) {
        console.log('IntersectionObserver not supported, falling back to manual loading');
        this.showLoadMoreButton();
        return;
      }

      this.state.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && this.shouldLoadMore()) {
            this.loadMore();
          }
        });
      }, {
        root: null,
        rootMargin: `${this.options.threshold}px`,
        threshold: 0.1
      });

      this.state.observer.observe(this.state.trigger);
    },

    /**
     * 检查是否应该加载更多
     * @returns {boolean}
     */
    shouldLoadMore() {
      const now = Date.now();
      
      return !this.state.loading && 
             this.state.hasMore && 
             this.state.currentPage < this.state.totalPages &&
             this.state.currentPage < this.options.maxPages &&
             (now - this.state.lastLoadTime) > this.options.loadingDelay;
    },

    /**
     * 加载更多内容
     */
    async loadMore() {
      if (!this.shouldLoadMore()) {
        return;
      }

      console.log(`Loading more content, page ${this.state.currentPage + 1}`);

      this.setLoadingState(true);
      this.state.lastLoadTime = Date.now();

      try {
        // 构建请求URL
        const url = this.buildRequestUrl();
        
        // 发送请求
        const response = await this.fetchContent(url);
        
        // 处理响应数据
        await this.handleLoadResponse(response);

        // 触发加载成功事件
        AkinaZZZ.events.emit('infinite:loaded', {
          page: this.state.currentPage,
          itemCount: response.items?.length || 0
        });

      } catch (error) {
        console.error('Failed to load more content:', error);
        
        // 显示错误信息
        this.showError('加载失败，请稍后重试');
        
        // 触发加载失败事件
        AkinaZZZ.events.emit('infinite:error', { error });

        // 显示手动加载按钮作为降级方案
        this.showLoadMoreButton();

      } finally {
        this.setLoadingState(false);
      }
    },

    /**
     * 构建请求URL
     * @returns {string}
     */
    buildRequestUrl() {
      const currentUrl = new URL(window.location);
      const nextPage = this.state.currentPage + 1;
      
      // 添加分页参数
      currentUrl.searchParams.set('page', nextPage);
      
      // 添加AJAX标识
      currentUrl.searchParams.set('ajax', 'true');
      
      return currentUrl.toString();
    },

    /**
     * 获取内容
     * @param {string} url - 请求URL
     * @returns {Promise<Object>}
     */
    async fetchContent(url) {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    },

    /**
     * 处理加载响应
     * @param {Object} data - 响应数据
     */
    async handleLoadResponse(data) {
      const { items = [], pagination = {} } = data;

      if (items.length === 0) {
        this.state.hasMore = false;
        this.showNoMoreMessage();
        return;
      }

      // 更新分页信息
      this.state.currentPage = pagination.number + 1 || this.state.currentPage + 1;
      this.state.totalPages = pagination.totalPages || this.state.totalPages;
      this.state.hasMore = pagination.hasNext !== false;

      // 创建新的项目元素
      const newItems = await this.createItemElements(items);

      // 添加到瀑布流
      if (AkinaZZZ.modules.masonry) {
        AkinaZZZ.modules.masonry.addItems(newItems);
      } else {
        // 如果没有瀑布流模块，直接添加到容器
        newItems.forEach(item => {
          this.state.container.appendChild(item);
        });
      }

      // 更新触发器数据
      this.updateTriggerData();

      console.log(`Loaded ${items.length} new items, page ${this.state.currentPage}`);
    },

    /**
     * 创建项目元素
     * @param {Array} items - 数据项目
     * @returns {Promise<Array>} DOM元素数组
     */
    async createItemElements(items) {
      const elements = [];

      for (const item of items) {
        try {
          // 这里应该根据实际的模板结构创建元素
          const element = await this.createCardElement(item);
          elements.push(element);
        } catch (error) {
          console.error('Failed to create item element:', error);
        }
      }

      return elements;
    },

    /**
     * 创建卡片元素
     * @param {Object} item - 数据项
     * @returns {Promise<Element>}
     */
    async createCardElement(item) {
      // 创建临时容器
      const temp = document.createElement('div');
      
      // 基本的卡片HTML结构
      temp.innerHTML = `
        <article class="masonry-item card cursor-pointer group" 
                 data-post-id="${item.metadata?.name || ''}"
                 data-post-url="/posts/${item.status?.slug || ''}">
          ${item.spec?.cover ? `
            <div class="relative overflow-hidden aspect-video">
              <img data-src="${item.spec.cover}"
                   alt="${item.spec?.title || ''}"
                   class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 lazy"
                   loading="lazy">
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div class="absolute top-3 right-3">
                <span class="stat-badge bg-black/40 text-white backdrop-blur-sm">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <span>${AkinaZZZ.utils.formatNumber(item.status?.visit || 0)}</span>
                </span>
              </div>
              <div class="absolute bottom-0 left-0 right-0 p-4">
                <h2 class="text-white text-lg font-semibold mb-2 line-clamp-2 text-shadow">
                  ${item.spec?.title || '无标题'}
                </h2>
                ${item.status?.excerpt ? `
                  <p class="text-white/90 text-sm line-clamp-2 text-shadow-light">
                    ${item.status.excerpt}
                  </p>
                ` : ''}
              </div>
            </div>
          ` : `
            <div class="card-content">
              <h2 class="text-dark-800 text-lg font-semibold mb-3 line-clamp-2 group-hover:text-accent transition-colors duration-200">
                ${item.spec?.title || '无标题'}
              </h2>
              ${item.status?.excerpt ? `
                <p class="text-dark-500 text-sm line-clamp-3 mb-4 leading-relaxed">
                  ${item.status.excerpt}
                </p>
              ` : ''}
            </div>
          `}
          
          <div class="border-t border-dark-200 px-4 py-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <img src="${item.owner?.avatar || '/themes/akina-zzz/assets/img/default-avatar.svg'}" 
                     alt="${item.owner?.displayName || '匿名'}"
                     class="w-8 h-8 rounded-full">
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-dark-700">
                    ${item.owner?.displayName || '匿名'}
                  </span>
                  <time class="text-xs text-dark-400" datetime="${item.spec?.publishTime || ''}">
                    ${item.spec?.publishTime ? new Date(item.spec.publishTime).toLocaleDateString() : ''}
                  </time>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;

      const element = temp.firstElementChild;

      // 绑定点击事件
      element.addEventListener('click', () => {
        const event = new CustomEvent('card-click', {
          detail: {
            postId: item.metadata?.name || '',
            url: `/posts/${item.status?.slug || ''}`,
            title: item.spec?.title || ''
          }
        });
        element.dispatchEvent(event);
      });

      return element;
    },

    /**
     * 更新触发器数据
     */
    updateTriggerData() {
      const trigger = this.state.trigger;
      
      trigger.dataset.nextPage = this.state.currentPage + 1;
      trigger.dataset.hasNext = this.state.hasMore;
      trigger.dataset.totalPages = this.state.totalPages;
    },

    /**
     * 设置加载状态
     * @param {boolean} loading - 是否加载中
     */
    setLoadingState(loading) {
      this.state.loading = loading;

      if (this.state.loadingIndicator) {
        this.state.loadingIndicator.classList.toggle('hidden', !loading);
      }

      if (this.state.loadMoreBtn) {
        this.state.loadMoreBtn.style.display = loading ? 'none' : 'block';
      }

      // 更新触发器状态
      this.state.trigger.classList.toggle('loading', loading);
    },

    /**
     * 显示手动加载按钮
     */
    showLoadMoreButton(trigger, options) {
      const triggerElement = trigger || this.state.trigger;
      
      if (!triggerElement) return;

      const loadMoreBtn = triggerElement.querySelector('#load-more-btn') || 
                         document.querySelector('#load-more-btn');

      if (loadMoreBtn) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.addEventListener('click', () => {
          this.loadMore();
        });
      }
    },

    /**
     * 绑定手动加载按钮
     */
    bindLoadMoreButton() {
      if (this.state.loadMoreBtn) {
        this.state.loadMoreBtn.addEventListener('click', () => {
          this.loadMore();
        });
      }
    },

    /**
     * 显示没有更多内容的消息
     */
    showNoMoreMessage() {
      const trigger = this.state.trigger;
      
      trigger.innerHTML = `
        <div class="text-center py-8 text-dark-500">
          <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>已经到底部了 ~</p>
          <p class="text-sm mt-1">共加载了 ${this.state.currentPage} 页内容</p>
        </div>
      `;
    },

    /**
     * 显示错误信息
     * @param {string} message - 错误消息
     */
    showError(message) {
      const trigger = this.state.trigger;
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'text-center py-4 text-danger bg-danger/10 rounded-xl border border-danger/20';
      errorDiv.innerHTML = `
        <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <p class="text-sm">${message}</p>
        <button class="mt-2 pill-btn-secondary text-xs" onclick="this.parentElement.remove()">
          关闭
        </button>
      `;

      trigger.appendChild(errorDiv);

      // 3秒后自动消失
      setTimeout(() => {
        if (errorDiv.parentElement) {
          errorDiv.remove();
        }
      }, 3000);
    },

    /**
     * 重新加载（重置状态并重新开始）
     * @param {Object} params - 新的参数
     */
    reload(params = {}) {
      console.log('Reloading infinite scroll with params:', params);

      // 重置状态
      this.state.currentPage = 0;
      this.state.loading = false;
      this.state.hasMore = true;

      // 清空容器
      if (this.state.container) {
        this.state.container.innerHTML = '';
      }

      // 添加加载骨架屏
      this.showSkeletonCards();

      // 构建新的URL
      const url = this.buildReloadUrl(params);

      // 加载新内容
      this.fetchContent(url)
        .then(data => this.handleReloadResponse(data))
        .catch(error => {
          console.error('Reload failed:', error);
          this.showError('重新加载失败');
        });
    },

    /**
     * 构建重新加载的URL
     * @param {Object} params - 参数
     * @returns {string}
     */
    buildReloadUrl(params) {
      const url = new URL(window.location);
      
      // 添加参数
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined) {
          url.searchParams.set(key, params[key]);
        }
      });

      url.searchParams.set('page', 1);
      url.searchParams.set('ajax', 'true');

      return url.toString();
    },

    /**
     * 处理重新加载响应
     * @param {Object} data - 响应数据
     */
    async handleReloadResponse(data) {
      // 隐藏骨架屏
      this.hideSkeletonCards();

      // 处理数据
      await this.handleLoadResponse(data);
    },

    /**
     * 显示骨架屏卡片
     */
    showSkeletonCards() {
      const skeletonContainer = document.getElementById('skeleton-cards');
      if (skeletonContainer) {
        skeletonContainer.classList.remove('hidden');
        skeletonContainer.style.display = 'block';
      }
    },

    /**
     * 隐藏骨架屏卡片
     */
    hideSkeletonCards() {
      const skeletonContainer = document.getElementById('skeleton-cards');
      if (skeletonContainer) {
        skeletonContainer.classList.add('hidden');
        skeletonContainer.style.display = 'none';
      }
    },

    /**
     * 获取当前状态
     * @returns {Object}
     */
    getStatus() {
      return {
        initialized: this.state.initialized,
        loading: this.state.loading,
        currentPage: this.state.currentPage,
        totalPages: this.state.totalPages,
        hasMore: this.state.hasMore
      };
    },

    /**
     * 销毁无限滚动
     */
    destroy() {
      if (this.state.observer) {
        this.state.observer.disconnect();
      }

      // 重置状态
      this.state = {
        container: null,
        trigger: null,
        loadMoreBtn: null,
        loadingIndicator: null,
        currentPage: 1,
        totalPages: 1,
        loading: false,
        hasMore: true,
        initialized: false,
        observer: null,
        lastLoadTime: 0
      };

      console.log('Infinite scroll destroyed');
    }
  };

  // 将模块添加到全局命名空间
  AkinaZZZ.modules.infinite = InfiniteScrollModule;

  console.log('Infinite scroll module loaded');

})();

/* === like.js === */
/**
 * Akina ZZZ 点赞模块
 * 处理文章和评论的点赞功能
 */

(function() {
  'use strict';

  // 确保AkinaZZZ命名空间存在
  if (!window.AkinaZZZ) {
    console.error('AkinaZZZ namespace not found. Make sure main.js is loaded first.');
    return;
  }

  const AkinaZZZ = window.AkinaZZZ;

  /**
   * 点赞模块
   */
  const LikeModule = {
    // 配置选项
    options: {
      enabled: true,
      apiEndpoint: '/api/v1alpha1/posts/{id}/like',
      animationDuration: 300,
      cooldownTime: 1000, // 防抖时间
      maxRetries: 3,
      retryDelay: 1000
    },

    // 内部状态
    state: {
      likedPosts: new Set(),
      pendingRequests: new Map(),
      cooldowns: new Map(),
      initialized: false
    },

    /**
     * 初始化点赞模块
     * @param {Object} options - 配置选项
     */
    init(options = {}) {
      try {
        // 合并选项
        this.options = { ...this.options, ...options };

        // 检查是否启用点赞功能
        if (!AkinaZZZ.utils.getSetting('enableLike')) {
          console.log('Like feature disabled in theme settings');
          return;
        }

        // 从本地存储恢复点赞状态
        this.restoreLikedState();

        // 绑定全局点赞事件
        this.bindGlobalEvents();

        this.state.initialized = true;

        console.log('Like module initialized');

        // 触发初始化事件
        AkinaZZZ.events.emit('like:initialized');

      } catch (error) {
        console.error('Failed to initialize like module:', error);
      }
    },

    /**
     * 切换点赞状态
     * @param {string} postId - 文章ID
     * @param {boolean} liked - 目标状态
     * @returns {Promise<Object>} 包含最新点赞状态的对象
     */
    async toggle(postId, liked) {
      if (!this.state.initialized) {
        throw new Error('Like module not initialized');
      }

      if (!postId) {
        throw new Error('Post ID is required');
      }

      // 检查冷却时间
      if (this.isInCooldown(postId)) {
        throw new Error('操作太频繁，请稍后再试');
      }

      // 检查是否有待处理的请求
      if (this.state.pendingRequests.has(postId)) {
        console.log('Like request already pending for post:', postId);
        return this.state.pendingRequests.get(postId);
      }

      console.log(`Toggling like for post ${postId}, liked: ${liked}`);

      // 设置冷却时间
      this.setCooldown(postId);

      // 创建请求Promise
      const requestPromise = this.performLikeRequest(postId, liked);
      
      // 存储待处理的请求
      this.state.pendingRequests.set(postId, requestPromise);

      try {
        const result = await requestPromise;
        
        // 更新本地状态
        this.updateLocalState(postId, result.liked);
        
        // 触发成功事件
        AkinaZZZ.events.emit('like:success', {
          postId,
          liked: result.liked,
          count: result.count
        });

        return result;

      } catch (error) {
        console.error('Like operation failed:', error);
        
        // 触发失败事件
        AkinaZZZ.events.emit('like:error', {
          postId,
          error: error.message
        });

        throw error;

      } finally {
        // 清理待处理的请求
        this.state.pendingRequests.delete(postId);
      }
    },

    /**
     * 执行点赞请求
     * @param {string} postId - 文章ID
     * @param {boolean} liked - 点赞状态
     * @returns {Promise<Object>}
     */
    async performLikeRequest(postId, liked) {
      const url = this.options.apiEndpoint.replace('{id}', postId);
      const method = liked ? 'POST' : 'DELETE';

      let lastError;
      
      // 重试机制
      for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
        try {
          const response = await AkinaZZZ.utils.apiRequest(url, {
            method,
            headers: {
              'Content-Type': 'application/json'
            }
          });

          // 处理响应数据
          const result = this.processLikeResponse(response, liked);
          
          console.log(`Like operation successful for post ${postId}:`, result);
          
          return result;

        } catch (error) {
          lastError = error;
          console.warn(`Like request attempt ${attempt} failed:`, error);

          // 如果不是最后一次尝试，等待后重试
          if (attempt < this.options.maxRetries) {
            await this.delay(this.options.retryDelay * attempt);
          }
        }
      }

      // 所有重试都失败了
      throw new Error(`点赞操作失败: ${lastError.message}`);
    },

    /**
     * 处理点赞响应
     * @param {Object} response - API响应
     * @param {boolean} expectedLiked - 预期的点赞状态
     * @returns {Object}
     */
    processLikeResponse(response, expectedLiked) {
      // 根据实际的Halo API响应格式调整
      return {
        liked: expectedLiked,
        count: response.likeCount || response.count || 0,
        timestamp: Date.now()
      };
    },

    /**
     * 检查是否在冷却时间内
     * @param {string} postId - 文章ID
     * @returns {boolean}
     */
    isInCooldown(postId) {
      const lastAction = this.state.cooldowns.get(postId);
      if (!lastAction) return false;

      return (Date.now() - lastAction) < this.options.cooldownTime;
    },

    /**
     * 设置冷却时间
     * @param {string} postId - 文章ID
     */
    setCooldown(postId) {
      this.state.cooldowns.set(postId, Date.now());
    },

    /**
     * 更新本地状态
     * @param {string} postId - 文章ID
     * @param {boolean} liked - 点赞状态
     */
    updateLocalState(postId, liked) {
      if (liked) {
        this.state.likedPosts.add(postId);
      } else {
        this.state.likedPosts.delete(postId);
      }

      // 保存到本地存储
      this.saveLikedState();

      // 更新页面上的所有相关按钮
      this.updateLikeButtons(postId, liked);
    },

    /**
     * 更新页面上的点赞按钮
     * @param {string} postId - 文章ID
     * @param {boolean} liked - 点赞状态
     */
    updateLikeButtons(postId, liked) {
      const buttons = document.querySelectorAll(`[data-post-id="${postId}"]`);
      
      buttons.forEach(button => {
        if (button.querySelector('svg')) {
          const svg = button.querySelector('svg');
          const path = svg.querySelector('path');
          
          if (liked) {
            svg.classList.add('text-danger', 'fill-current');
            path.setAttribute('fill', 'currentColor');
          } else {
            svg.classList.remove('text-danger', 'fill-current');
            path.setAttribute('fill', 'none');
          }
        }

        // 更新按钮状态
        button.dataset.liked = liked;
      });
    },

    /**
     * 获取文章的点赞状态
     * @param {string} postId - 文章ID
     * @returns {boolean}
     */
    isLiked(postId) {
      return this.state.likedPosts.has(postId);
    },

    /**
     * 批量检查点赞状态
     * @param {string[]} postIds - 文章ID数组
     * @returns {Promise<Object>} 点赞状态映射
     */
    async checkLikeStatus(postIds) {
      if (!Array.isArray(postIds) || postIds.length === 0) {
        return {};
      }

      try {
        // 构建查询参数
        const params = new URLSearchParams();
        postIds.forEach(id => params.append('postIds', id));

        const response = await AkinaZZZ.utils.apiRequest(
          `/api/v1alpha1/posts/likes?${params.toString()}`
        );

        // 更新本地状态
        Object.keys(response).forEach(postId => {
          if (response[postId]) {
            this.state.likedPosts.add(postId);
          } else {
            this.state.likedPosts.delete(postId);
          }
        });

        this.saveLikedState();
        return response;

      } catch (error) {
        console.error('Failed to check like status:', error);
        return {};
      }
    },

    /**
     * 绑定全局事件
     */
    bindGlobalEvents() {
      // 监听页面上的点赞按钮点击
      document.addEventListener('click', (e) => {
        const likeBtn = e.target.closest('[data-post-id][data-like-count]');
        if (likeBtn && likeBtn.classList.contains('stat-badge-like')) {
          e.preventDefault();
          e.stopPropagation();
          
          const postId = likeBtn.dataset.postId;
          const currentLiked = this.isLiked(postId);
          
          this.handleButtonClick(likeBtn, postId, !currentLiked);
        }
      });

      // 监听页面可见性变化，恢复点赞状态
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.refreshVisibleLikeButtons();
        }
      });
    },

    /**
     * 处理按钮点击
     * @param {Element} button - 按钮元素
     * @param {string} postId - 文章ID
     * @param {boolean} liked - 目标状态
     */
    async handleButtonClick(button, postId, liked) {
      // 添加点击动画
      this.addClickAnimation(button);

      // 乐观更新UI
      const currentCount = parseInt(button.dataset.likeCount || '0');
      const newCount = currentCount + (liked ? 1 : -1);
      
      this.updateButtonDisplay(button, liked, newCount);

      try {
        const result = await this.toggle(postId, liked);
        
        // 更新为实际的计数
        this.updateButtonDisplay(button, result.liked, result.count);
        button.dataset.likeCount = result.count;

      } catch (error) {
        // 回滚UI状态
        this.updateButtonDisplay(button, !liked, currentCount);
        
        // 显示错误提示
        AkinaZZZ.utils.showNotification?.(error.message, 'error');
      }
    },

    /**
     * 更新按钮显示
     * @param {Element} button - 按钮元素
     * @param {boolean} liked - 点赞状态
     * @param {number} count - 点赞数
     */
    updateButtonDisplay(button, liked, count) {
      const svg = button.querySelector('svg');
      const countSpan = button.querySelector('span');

      if (svg) {
        if (liked) {
          svg.classList.add('text-danger', 'fill-current', 'scale-110');
        } else {
          svg.classList.remove('text-danger', 'fill-current', 'scale-110');
        }
      }

      if (countSpan) {
        countSpan.textContent = AkinaZZZ.utils.formatNumber(count);
      }

      button.dataset.liked = liked;
    },

    /**
     * 添加点击动画
     * @param {Element} button - 按钮元素
     */
    addClickAnimation(button) {
      const svg = button.querySelector('svg');
      if (svg) {
        svg.classList.add('animate-pulse');
        setTimeout(() => {
          svg.classList.remove('animate-pulse');
        }, this.options.animationDuration);
      }
    },

    /**
     * 刷新可见的点赞按钮状态
     */
    refreshVisibleLikeButtons() {
      const buttons = document.querySelectorAll('[data-post-id][data-like-count]');
      
      buttons.forEach(button => {
        const postId = button.dataset.postId;
        const liked = this.isLiked(postId);
        
        this.updateButtonDisplay(button, liked, parseInt(button.dataset.likeCount || '0'));
      });
    },

    /**
     * 从本地存储恢复点赞状态
     */
    restoreLikedState() {
      try {
        const stored = localStorage.getItem('akina-zzz-liked-posts');
        if (stored) {
          const likedArray = JSON.parse(stored);
          this.state.likedPosts = new Set(likedArray);
          console.log(`Restored ${likedArray.length} liked posts from storage`);
        }
      } catch (error) {
        console.error('Failed to restore liked state:', error);
      }
    },

    /**
     * 保存点赞状态到本地存储
     */
    saveLikedState() {
      try {
        const likedArray = Array.from(this.state.likedPosts);
        localStorage.setItem('akina-zzz-liked-posts', JSON.stringify(likedArray));
      } catch (error) {
        console.error('Failed to save liked state:', error);
      }
    },

    /**
     * 延迟函数
     * @param {number} ms - 毫秒数
     * @returns {Promise}
     */
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 获取调试信息
     */
    getDebugInfo() {
      return {
        initialized: this.state.initialized,
        likedCount: this.state.likedPosts.size,
        pendingRequests: this.state.pendingRequests.size,
        cooldowns: this.state.cooldowns.size,
        options: this.options
      };
    },

    /**
     * 清理状态
     */
    cleanup() {
      // 清理冷却时间（保留最近1分钟的）
      const cutoff = Date.now() - 60000;
      for (const [postId, timestamp] of this.state.cooldowns.entries()) {
        if (timestamp < cutoff) {
          this.state.cooldowns.delete(postId);
        }
      }

      // 限制点赞状态存储的大小
      if (this.state.likedPosts.size > 1000) {
        const array = Array.from(this.state.likedPosts);
        this.state.likedPosts = new Set(array.slice(-500));
        this.saveLikedState();
      }
    }
  };

  // 将模块添加到全局命名空间
  AkinaZZZ.modules.like = LikeModule;

  // 定期清理状态
  setInterval(() => {
    if (AkinaZZZ.modules.like.state.initialized) {
      AkinaZZZ.modules.like.cleanup();
    }
  }, 300000); // 每5分钟清理一次

  console.log('Like module loaded');

})();

/* === tabs.js === */
/**
 * Akina ZZZ 标签页模块
 * 处理导航标签页的切换和状态管理
 */

(function() {
  'use strict';

  // 确保AkinaZZZ命名空间存在
  if (!window.AkinaZZZ) {
    console.error('AkinaZZZ namespace not found. Make sure main.js is loaded first.');
    return;
  }

  const AkinaZZZ = window.AkinaZZZ;

  /**
   * 标签页模块
   */
  const TabsModule = {
    // 配置选项
    options: {
      container: '.nav-tabs',
      tabSelector: '.nav-tab',
      activeClass: 'active',
      animationDuration: 300,
      enableKeyboard: true,
      enableSwipe: true, // 移动端滑动切换
      swipeThreshold: 50
    },

    // 内部状态
    state: {
      container: null,
      tabs: [],
      activeTab: null,
      activeIndex: 0,
      initialized: false,
      touchStart: null,
      swipeDirection: null
    },

    /**
     * 初始化标签页模块
     * @param {string|Element} container - 标签页容器
     * @param {Object} options - 配置选项
     */
    init(container, options = {}) {
      try {
        // 合并选项
        this.options = { ...this.options, ...options };

        // 获取容器元素
        this.state.container = typeof container === 'string' 
          ? document.querySelector(container) 
          : container;

        if (!this.state.container) {
          console.warn('Tabs container not found:', container);
          return;
        }

        // 获取所有标签页
        this.updateTabs();

        if (this.state.tabs.length === 0) {
          console.warn('No tabs found in container');
          return;
        }

        // 设置初始活动标签页
        this.setInitialActiveTab();

        // 绑定事件监听器
        this.bindEventListeners();

        // 设置键盘导航
        if (this.options.enableKeyboard) {
          this.setupKeyboardNavigation();
        }

        // 设置触摸导航（移动端）
        if (this.options.enableSwipe && 'ontouchstart' in window) {
          this.setupTouchNavigation();
        }

        this.state.initialized = true;

        console.log(`Tabs initialized with ${this.state.tabs.length} tabs`);

        // 触发初始化事件
        AkinaZZZ.events.emit('tabs:initialized', {
          container: this.state.container,
          tabCount: this.state.tabs.length,
          activeIndex: this.state.activeIndex
        });

      } catch (error) {
        console.error('Failed to initialize tabs:', error);
      }
    },

    /**
     * 更新标签页列表
     */
    updateTabs() {
      this.state.tabs = Array.from(
        this.state.container.querySelectorAll(this.options.tabSelector)
      );
    },

    /**
     * 设置初始活动标签页
     */
    setInitialActiveTab() {
      // 查找已经标记为活动的标签页
      const activeTab = this.state.tabs.find(tab => 
        tab.classList.contains(this.options.activeClass)
      );

      if (activeTab) {
        this.state.activeTab = activeTab;
        this.state.activeIndex = this.state.tabs.indexOf(activeTab);
      } else if (this.state.tabs.length > 0) {
        // 如果没有活动标签页，激活第一个
        this.setActiveTab(0);
      }
    },

    /**
     * 设置活动标签页
     * @param {number|Element} tabOrIndex - 标签页元素或索引
     * @param {boolean} silent - 是否静默切换（不触发事件）
     */
    setActiveTab(tabOrIndex, silent = false) {
      let targetTab, targetIndex;

      if (typeof tabOrIndex === 'number') {
        targetIndex = tabOrIndex;
        targetTab = this.state.tabs[targetIndex];
      } else {
        targetTab = tabOrIndex;
        targetIndex = this.state.tabs.indexOf(targetTab);
      }

      if (!targetTab || targetIndex === -1) {
        console.warn('Invalid tab or index:', tabOrIndex);
        return;
      }

      // 如果已经是活动标签页，直接返回
      if (targetTab === this.state.activeTab) {
        return;
      }

      const previousTab = this.state.activeTab;
      const previousIndex = this.state.activeIndex;

      // 更新视觉状态
      this.updateTabVisualState(targetTab, previousTab);

      // 更新内部状态
      this.state.activeTab = targetTab;
      this.state.activeIndex = targetIndex;

      // 更新URL（如果标签页有对应路径）
      this.updateUrl(targetTab);

      console.log(`Active tab changed to index ${targetIndex}:`, targetTab.textContent);

      if (!silent) {
        // 触发切换事件
        AkinaZZZ.events.emit('tabs:changed', {
          activeTab: targetTab,
          activeIndex: targetIndex,
          previousTab: previousTab,
          previousIndex: previousIndex,
          tabName: this.getTabName(targetTab),
          tabPath: this.getTabPath(targetTab)
        });

        // 触发内容更新
        this.triggerContentUpdate(targetTab);
      }
    },

    /**
     * 更新标签页视觉状态
     * @param {Element} activeTab - 新的活动标签页
     * @param {Element} previousTab - 之前的活动标签页
     */
    updateTabVisualState(activeTab, previousTab) {
      // 移除之前的活动状态
      if (previousTab) {
        previousTab.classList.remove(this.options.activeClass);
        previousTab.setAttribute('aria-selected', 'false');
        previousTab.setAttribute('tabindex', '-1');
      }

      // 设置新的活动状态
      activeTab.classList.add(this.options.activeClass);
      activeTab.setAttribute('aria-selected', 'true');
      activeTab.setAttribute('tabindex', '0');

      // 添加切换动画
      activeTab.style.transform = 'scale(0.95)';
      setTimeout(() => {
        activeTab.style.transform = '';
      }, 100);
    },

    /**
     * 获取标签页名称
     * @param {Element} tab - 标签页元素
     * @returns {string}
     */
    getTabName(tab) {
      return tab.textContent.trim() || tab.getAttribute('data-tab-name') || '';
    },

    /**
     * 获取标签页路径
     * @param {Element} tab - 标签页元素
     * @returns {string}
     */
    getTabPath(tab) {
      return tab.getAttribute('data-tab-path') || 
             tab.getAttribute('href') || 
             tab.querySelector('a')?.getAttribute('href') || '';
    },

    /**
     * 更新URL
     * @param {Element} tab - 活动标签页
     */
    updateUrl(tab) {
      const path = this.getTabPath(tab);
      
      if (path && path !== '#' && path !== window.location.pathname) {
        // 检查是否应该更新URL
        const shouldUpdateUrl = tab.getAttribute('data-update-url') !== 'false';
        
        if (shouldUpdateUrl) {
          try {
            // 使用History API更新URL，不刷新页面
            history.replaceState({ tabPath: path }, '', path);
          } catch (error) {
            console.warn('Failed to update URL:', error);
          }
        }
      }
    },

    /**
     * 触发内容更新
     * @param {Element} tab - 活动标签页
     */
    triggerContentUpdate(tab) {
      const tabName = this.getTabName(tab);
      const tabPath = this.getTabPath(tab);

      // 如果有无限滚动模块，重新加载内容
      if (AkinaZZZ.modules.infinite) {
        const params = this.buildContentParams(tab);
        AkinaZZZ.modules.infinite.reload(params);
      }

      // 触发自定义事件，让其他模块响应
      document.dispatchEvent(new CustomEvent('tab-change', {
        detail: {
          tab: tabName,
          path: tabPath,
          element: tab
        }
      }));
    },

    /**
     * 构建内容参数
     * @param {Element} tab - 标签页元素
     * @returns {Object}
     */
    buildContentParams(tab) {
      const params = {};
      
      // 从data属性获取参数
      Object.keys(tab.dataset).forEach(key => {
        if (key.startsWith('param')) {
          const paramName = key.replace('param', '').toLowerCase();
          params[paramName] = tab.dataset[key];
        }
      });

      return params;
    },

    /**
     * 切换到下一个标签页
     */
    nextTab() {
      const nextIndex = (this.state.activeIndex + 1) % this.state.tabs.length;
      this.setActiveTab(nextIndex);
    },

    /**
     * 切换到上一个标签页
     */
    previousTab() {
      const prevIndex = this.state.activeIndex === 0 
        ? this.state.tabs.length - 1 
        : this.state.activeIndex - 1;
      this.setActiveTab(prevIndex);
    },

    /**
     * 根据名称查找并激活标签页
     * @param {string} name - 标签页名称
     */
    activateTabByName(name) {
      const tab = this.state.tabs.find(tab => 
        this.getTabName(tab).toLowerCase() === name.toLowerCase()
      );

      if (tab) {
        this.setActiveTab(tab);
      } else {
        console.warn('Tab not found by name:', name);
      }
    },

    /**
     * 根据路径查找并激活标签页
     * @param {string} path - 路径
     */
    activateTabByPath(path) {
      const tab = this.state.tabs.find(tab => 
        this.getTabPath(tab) === path
      );

      if (tab) {
        this.setActiveTab(tab);
      } else {
        console.warn('Tab not found by path:', path);
      }
    },

    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
      // 点击事件
      this.state.tabs.forEach((tab, index) => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          this.setActiveTab(index);
        });

        // 设置ARIA属性
        tab.setAttribute('role', 'tab');
        tab.setAttribute('tabindex', index === this.state.activeIndex ? '0' : '-1');
        tab.setAttribute('aria-selected', index === this.state.activeIndex ? 'true' : 'false');
      });

      // 设置容器ARIA属性
      this.state.container.setAttribute('role', 'tablist');
    },

    /**
     * 设置键盘导航
     */
    setupKeyboardNavigation() {
      this.state.container.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            this.nextTab();
            this.state.activeTab.focus();
            break;
            
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            this.previousTab();
            this.state.activeTab.focus();
            break;
            
          case 'Home':
            e.preventDefault();
            this.setActiveTab(0);
            this.state.activeTab.focus();
            break;
            
          case 'End':
            e.preventDefault();
            this.setActiveTab(this.state.tabs.length - 1);
            this.state.activeTab.focus();
            break;
        }
      });
    },

    /**
     * 设置触摸导航
     */
    setupTouchNavigation() {
      let startX = 0;
      let startY = 0;
      let moving = false;

      this.state.container.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        moving = false;
      }, { passive: true });

      this.state.container.addEventListener('touchmove', (e) => {
        if (!moving) {
          const touch = e.touches[0];
          const deltaX = touch.clientX - startX;
          const deltaY = touch.clientY - startY;

          // 只有水平滑动才处理
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            moving = true;
            e.preventDefault();
          }
        }
      }, { passive: false });

      this.state.container.addEventListener('touchend', (e) => {
        if (moving) {
          const touch = e.changedTouches[0];
          const deltaX = touch.clientX - startX;

          if (Math.abs(deltaX) > this.options.swipeThreshold) {
            if (deltaX > 0) {
              // 向右滑动，切换到上一个标签页
              this.previousTab();
            } else {
              // 向左滑动，切换到下一个标签页
              this.nextTab();
            }
          }
        }
        moving = false;
      }, { passive: true });
    },

    /**
     * 添加新标签页
     * @param {Object} tabData - 标签页数据
     */
    addTab(tabData) {
      const { name, path, element } = tabData;
      
      let tabElement;
      
      if (element) {
        tabElement = element;
      } else {
        // 创建新的标签页元素
        tabElement = document.createElement('div');
        tabElement.className = this.options.tabSelector.replace('.', '');
        tabElement.textContent = name;
        
        if (path) {
          tabElement.setAttribute('data-tab-path', path);
        }
      }

      // 添加到容器
      this.state.container.appendChild(tabElement);
      
      // 更新标签页列表
      this.updateTabs();
      
      // 重新绑定事件
      this.bindTabEvents(tabElement, this.state.tabs.length - 1);

      console.log(`Added new tab: ${name}`);

      // 触发添加事件
      AkinaZZZ.events.emit('tabs:added', {
        tab: tabElement,
        name,
        path,
        index: this.state.tabs.length - 1
      });
    },

    /**
     * 移除标签页
     * @param {number|Element} tabOrIndex - 标签页或索引
     */
    removeTab(tabOrIndex) {
      let targetTab, targetIndex;

      if (typeof tabOrIndex === 'number') {
        targetIndex = tabOrIndex;
        targetTab = this.state.tabs[targetIndex];
      } else {
        targetTab = tabOrIndex;
        targetIndex = this.state.tabs.indexOf(targetTab);
      }

      if (!targetTab || targetIndex === -1) {
        console.warn('Invalid tab or index:', tabOrIndex);
        return;
      }

      // 如果移除的是活动标签页，激活另一个
      if (targetTab === this.state.activeTab) {
        if (this.state.tabs.length > 1) {
          const newActiveIndex = targetIndex === 0 ? 1 : targetIndex - 1;
          this.setActiveTab(newActiveIndex, true);
        }
      }

      // 移除元素
      targetTab.remove();

      // 更新标签页列表
      this.updateTabs();

      console.log(`Removed tab at index ${targetIndex}`);

      // 触发移除事件
      AkinaZZZ.events.emit('tabs:removed', {
        tab: targetTab,
        index: targetIndex
      });
    },

    /**
     * 绑定单个标签页事件
     * @param {Element} tab - 标签页元素
     * @param {number} index - 索引
     */
    bindTabEvents(tab, index) {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        this.setActiveTab(index);
      });

      // 设置ARIA属性
      tab.setAttribute('role', 'tab');
      tab.setAttribute('tabindex', '-1');
      tab.setAttribute('aria-selected', 'false');
    },

    /**
     * 获取调试信息
     */
    getDebugInfo() {
      return {
        initialized: this.state.initialized,
        tabCount: this.state.tabs.length,
        activeIndex: this.state.activeIndex,
        activeTabName: this.state.activeTab ? this.getTabName(this.state.activeTab) : null,
        options: this.options
      };
    },

    /**
     * 销毁标签页模块
     */
    destroy() {
      if (!this.state.initialized) {
        return;
      }

      // 移除事件监听器
      this.state.tabs.forEach(tab => {
        tab.removeEventListener('click', () => {});
      });

      // 重置状态
      this.state = {
        container: null,
        tabs: [],
        activeTab: null,
        activeIndex: 0,
        initialized: false,
        touchStart: null,
        swipeDirection: null
      };

      console.log('Tabs destroyed');

      // 触发销毁事件
      AkinaZZZ.events.emit('tabs:destroyed');
    }
  };

  // 将模块添加到全局命名空间
  AkinaZZZ.modules.tabs = TabsModule;

  console.log('Tabs module loaded');

})();

/* === Theme Initialization === */
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🎨 Akina ZZZ Theme v1.0.0', 'color: #d8ff39; font-weight: bold; font-size: 16px;');
  console.log('Theme initialized successfully');
});
