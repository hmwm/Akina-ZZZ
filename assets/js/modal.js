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