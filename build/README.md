# Akina ZZZ - Halo 2.x 深色系瀑布流主题

> 一个专为内容展示和交互优化设计的深色系瀑布流主题，适用于 Halo 2.10.0+

![主题预览](https://via.placeholder.com/1200x600/0b0b0e/d8ff39?text=Akina+ZZZ+Theme)

## ✨ 特性

### 🎨 视觉设计
- **深色系设计**：全局深色背景，带有斜向纹理质感
- **高对比配色**：荧光黄强调色、亮红警示色、高饱和蓝品牌色
- **大圆角设计**：18-24px 圆角，营造现代厚实 UI 感觉
- **柔和投影**：多层次阴影系统，增强视觉层次
- **玻璃态效果**：弹层遮罩背景虚化，提升视觉体验

### 📱 响应式布局
- **瀑布流布局**：基于 CSS Columns 实现，零依赖
- **自适应列数**：
  - 移动端：1列
  - 平板端：2列  
  - 桌面端：3列
  - 宽屏端：4列
- **多尺寸卡片**：小、中、大三种规格，自动分配

### 🚀 交互功能
- **模态框详情**：点击卡片弹出详情页，无需跳转
- **无限滚动**：滚动到底部自动加载更多内容
- **标签页导航**：支持键盘、触摸滑动切换
- **点赞系统**：乐观更新，支持本地状态持久化
- **搜索弹层**：实时搜索，支持文章、标签、作者

### ⚡ 性能优化
- **图片懒加载**：使用 Intersection Observer
- **模块化加载**：按需加载 JavaScript 模块
- **CSS 优化**：使用 CSS Custom Properties
- **缓存友好**：合理的文件组织和版本控制

### 🔧 开发特性
- **TypeScript 支持**：类型安全的开发体验
- **模块化架构**：清晰的代码组织结构  
- **调试友好**：开发模式下的详细日志
- **热更新**：开发时支持热重载

## 📦 安装

### 方式 1：下载安装

1. 下载主题包 `akina-zzz.zip`
2. 在 Halo 后台进入「外观」->「主题」
3. 点击「安装主题」上传 zip 文件
4. 安装完成后启用主题

### 方式 2：Git 安装

```bash
cd /path/to/halo/themes
git clone https://github.com/halo-dev/akina-zzz.git
```

然后在 Halo 后台启用主题。

## 🛠️ 开发

### 环境要求

- Node.js 16+
- npm 或 yarn
- Halo 2.10.0+

### 开发设置

```bash
# 克隆项目
git clone https://github.com/halo-dev/akina-zzz.git
cd akina-zzz

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

### 项目结构

```
akina-zzz/
├── assets/                 # 静态资源
│   ├── css/                # 样式文件
│   │   ├── tokens.css      # 设计令牌
│   │   ├── tailwind.css    # 主样式文件
│   │   └── style.css       # 构建输出
│   ├── js/                 # JavaScript 模块
│   │   ├── main.js         # 主脚本
│   │   ├── masonry.js      # 瀑布流模块
│   │   ├── modal.js        # 模态框模块
│   │   ├── infinite.js     # 无限滚动模块
│   │   ├── like.js         # 点赞模块
│   │   └── tabs.js         # 标签页模块
│   └── img/                # 图片资源
├── templates/              # 模板文件
│   ├── layout/             # 布局模板
│   │   ├── base.html       # 基础布局
│   │   ├── header.html     # 页面头部
│   │   └── footer.html     # 页面底部
│   ├── _fragments/         # 组件片段
│   │   ├── card.html       # 卡片组件
│   │   ├── modal.html      # 模态框组件
│   │   ├── skeleton.html   # 骨架屏组件
│   │   └── stat-badge.html # 统计徽章
│   ├── index.html          # 首页模板
│   ├── post.html           # 文章页模板
│   ├── categories.html     # 分类页模板
│   ├── tags.html           # 标签页模板
│   └── archives.html       # 归档页模板
├── theme.yaml              # 主题配置
├── settings.yaml           # 主题设置
└── README.md              # 说明文档
```

## ⚙️ 配置

主题提供了丰富的配置选项，可在 Halo 后台「外观」->「主题」->「设置」中进行配置：

### 基础设置
- **主题强调色**：自定义荧光黄强调色
- **启用弹层详情**：是否使用模态框显示文章详情
- **启用无限滚动**：是否自动加载更多内容
- **瀑布流列数**：不同屏幕尺寸下的列数设置

### 头部设置
- **站点 Logo**：自定义头部 Logo
- **显示用户信息**：是否显示用户信息区域
- **导航标签**：自定义导航标签的名称和链接

### 交互功能
- **启用点赞功能**：是否显示点赞按钮
- **显示浏览量**：是否显示浏览量统计
- **图片懒加载**：是否延迟加载图片

### 视觉效果
- **背景纹理**：是否启用深色背景纹理
- **卡片阴影强度**：调整卡片阴影的强度
- **边框圆角大小**：调整界面圆角的大小

## 🎯 使用指南

### 内容展示

主题采用瀑布流布局展示文章，支持三种卡片尺寸：

- **小卡片**：适合短文本内容或信息类文章
- **中卡片**：适合常规图文混排文章  
- **大卡片**：适合重点推荐或多媒体内容

卡片会根据内容自动选择合适的尺寸。

### 导航系统

- **药丸标签页**：顶部横向导航，支持自定义标签
- **键盘导航**：支持方向键切换标签页
- **触摸导航**：移动端支持滑动切换

### 搜索功能

按下搜索按钮或使用快捷键 `Cmd/Ctrl + K` 打开搜索弹层，支持：

- 实时搜索文章标题和内容
- 按作者搜索
- 按标签搜索
- 智能建议和高亮

### 阅读体验

- **沉浸式阅读**：模态框详情页提供沉浸式阅读体验
- **阅读进度**：底部进度条显示阅读进度
- **目录导航**：长文章自动生成目录导航
- **无障碍支持**：完整的键盘导航和屏幕阅读器支持

## 🔌 扩展开发

主题提供了完整的 JavaScript API，方便扩展功能：

### 事件系统

```javascript
// 监听主题事件
AkinaZZZ.events.on('masonry:initialized', (data) => {
  console.log('瀑布流初始化完成', data);
});

AkinaZZZ.events.on('modal:post-shown', (data) => {
  console.log('文章模态框显示', data);
});
```

### 模块扩展

```javascript
// 扩展现有模块
AkinaZZZ.modules.myCustomModule = {
  init() {
    console.log('自定义模块初始化');
  }
};

// 在主题初始化后加载
AkinaZZZ.events.on('theme:init', () => {
  AkinaZZZ.modules.myCustomModule.init();
});
```

## 🐛 问题反馈

如果您在使用过程中遇到问题，请：

1. 查看 [常见问题](https://github.com/halo-dev/akina-zzz/wiki/FAQ)
2. 搜索 [已有 Issues](https://github.com/halo-dev/akina-zzz/issues)
3. 提交 [新的 Issue](https://github.com/halo-dev/akina-zzz/issues/new)

提交 Issue 时请提供：
- Halo 版本
- 主题版本
- 浏览器版本
- 详细的问题描述和截图

## 📄 许可证

本主题基于 [MIT License](LICENSE) 开源协议发布。

## 🙏 致谢

- [Halo](https://halo.run/) - 优秀的 Java 博客系统
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Alpine.js](https://alpinejs.dev/) - 轻量级响应式框架
- [Lucide](https://lucide.dev/) - 美观的图标库

---

## 🌟 支持项目

如果这个主题对您有帮助，请考虑：

- ⭐ 给项目点个星
- 🐛 报告问题和建议
- 💡 提交功能请求  
- 🔀 提交 Pull Request
- 📢 推荐给其他人

您的支持是我们持续改进的动力！