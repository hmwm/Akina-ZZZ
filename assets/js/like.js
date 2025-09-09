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