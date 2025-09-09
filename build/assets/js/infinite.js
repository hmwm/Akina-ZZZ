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

      
    }
  };

  // 将模块添加到全局命名空间
  AkinaZZZ.modules.infinite = InfiniteScrollModule;

  

})();