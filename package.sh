#!/bin/bash

# Akina ZZZ 主题打包脚本
# 用于创建可直接安装到 Halo 的主题包

set -e

THEME_NAME="akina-zzz"
VERSION="1.0.0"
BUILD_DIR="build"
DIST_DIR="dist"

echo "🚀 开始打包 Akina ZZZ 主题..."
echo "📦 主题名称: $THEME_NAME"
echo "🏷️  版本: $VERSION"
echo ""

# 清理之前的构建
echo "🧹 清理构建目录..."
rm -rf "$BUILD_DIR" "$DIST_DIR"
mkdir -p "$BUILD_DIR" "$DIST_DIR"

# 复制必要文件
echo "📁 复制主题文件..."

# 复制配置文件
cp theme.yaml "$BUILD_DIR/"
cp settings.yaml "$BUILD_DIR/"
cp README.md "$BUILD_DIR/"

# 复制模板文件
echo "  📄 复制模板文件..."
cp -r templates/ "$BUILD_DIR/"

# 复制资源文件
echo "  🎨 复制资源文件..."
mkdir -p "$BUILD_DIR/assets"

# 复制CSS文件（只复制必要的）
mkdir -p "$BUILD_DIR/assets/css"
cp assets/css/style.css "$BUILD_DIR/assets/css/"
cp assets/css/tokens.css "$BUILD_DIR/assets/css/"

# 复制JavaScript文件
mkdir -p "$BUILD_DIR/assets/js"
cp assets/js/*.js "$BUILD_DIR/assets/js/"

# 复制图片文件
mkdir -p "$BUILD_DIR/assets/img"
cp assets/img/*.svg "$BUILD_DIR/assets/img/" 2>/dev/null || echo "  ⚠️  没有找到 SVG 图片文件"

# 复制其他资源
if [ -f "assets/manifest.json" ]; then
    cp assets/manifest.json "$BUILD_DIR/assets/"
fi

# 创建许可证文件
echo "📃 创建许可证文件..."
cat > "$BUILD_DIR/LICENSE" << 'EOF'
MIT License

Copyright (c) 2024 Akina ZZZ Theme

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# 创建变更日志
echo "📝 创建变更日志..."
cat > "$BUILD_DIR/CHANGELOG.md" << 'EOF'
# 变更日志

## [1.0.0] - 2024-01-01

### 新增
- 🎨 深色系瀑布流布局
- 📱 响应式设计，支持多种屏幕尺寸
- 🔥 模态框文章详情页
- ♾️ 无限滚动加载
- 💖 点赞功能
- 🔍 实时搜索
- 🏷️ 标签页导航
- 📊 文章统计徽章
- 🎭 骨架屏加载状态
- ♿ 无障碍支持

### 技术特性
- 使用 Tailwind CSS 构建
- 模块化 JavaScript 架构
- CSS Columns 瀑布流实现
- Intersection Observer 图片懒加载
- Web API 集成（点赞、搜索）

### 性能优化
- 图片懒加载
- JavaScript 按需加载
- CSS 优化和压缩
- 合理的缓存策略
EOF

# 验证必要文件
echo "🔍 验证主题文件..."
required_files=(
    "theme.yaml"
    "settings.yaml" 
    "templates/index.html"
    "templates/layout/base.html"
    "assets/css/style.css"
    "assets/js/main.js"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$BUILD_DIR/$file" ]; then
        echo "❌ 缺少必要文件: $file"
        exit 1
    fi
done

echo "✅ 所有必要文件验证通过"

# 优化文件大小
echo "⚡ 优化文件大小..."

# 移除 JavaScript 中的 console.log（生产环境）
find "$BUILD_DIR/assets/js" -name "*.js" -exec sed -i 's/console\.log.*;//g' {} \; 2>/dev/null || true

# 计算文件大小
total_size=$(du -sh "$BUILD_DIR" | cut -f1)
echo "📊 构建完成，总大小: $total_size"

# 创建 ZIP 包
echo "📦 创建主题包..."
cd "$BUILD_DIR"
zip -r "../$DIST_DIR/$THEME_NAME-$VERSION.zip" . -x "*.DS_Store" "*.git*" > /dev/null
cd ..

# 输出统计信息
echo ""
echo "🎉 打包完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 构建目录: $BUILD_DIR"
echo "📦 安装包: $DIST_DIR/$THEME_NAME-$VERSION.zip"
echo "📊 包大小: $(du -sh "$DIST_DIR/$THEME_NAME-$VERSION.zip" | cut -f1)"
echo ""

# 显示安装指南
echo "🔧 安装指南:"
echo "1. 下载 $THEME_NAME-$VERSION.zip"
echo "2. 登录 Halo 后台"  
echo "3. 进入「外观」->「主题」"
echo "4. 点击「安装主题」上传 ZIP 文件"
echo "5. 安装完成后启用主题"
echo ""

# 显示文件结构
echo "📋 主题文件结构:"
echo "$(tree "$BUILD_DIR" -L 3 2>/dev/null || find "$BUILD_DIR" -type f | head -20)"
echo ""

echo "✨ 感谢使用 Akina ZZZ 主题！"