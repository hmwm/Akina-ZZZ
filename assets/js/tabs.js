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