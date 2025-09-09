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