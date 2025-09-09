#!/usr/bin/env node

/**
 * Akina ZZZ 主题简化构建脚本
 * 处理CSS和JS文件的合并和优化
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, 'assets');
const CSS_DIR = path.join(BUILD_DIR, 'css');
const JS_DIR = path.join(BUILD_DIR, 'js');

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 合并CSS文件
function buildCSS() {
  console.log('Building CSS...');
  
  ensureDir(CSS_DIR);
  
  // 读取tokens.css和tailwind.css
  const tokensCSS = fs.readFileSync(path.join(CSS_DIR, 'tokens.css'), 'utf8');
  const tailwindCSS = fs.readFileSync(path.join(CSS_DIR, 'tailwind.css'), 'utf8');
  
  // 简单的CSS处理：移除注释，压缩空白
  const processCSS = (css) => {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
      .replace(/\s+/g, ' ') // 压缩空白
      .replace(/;\s*}/g, '}') // 优化分号
      .trim();
  };
  
  // 合并CSS
  const combinedCSS = `
/* Akina ZZZ Theme - Built at ${new Date().toISOString()} */
${tokensCSS}

${tailwindCSS}
  `.trim();
  
  const outputPath = path.join(CSS_DIR, 'style.css');
  fs.writeFileSync(outputPath, combinedCSS);
  
  console.log(`✅ CSS built successfully: ${outputPath}`);
  console.log(`📊 Size: ${Math.round(combinedCSS.length / 1024)}KB`);
}

// 合并和优化JavaScript文件
function buildJS() {
  console.log('Building JavaScript...');
  
  ensureDir(JS_DIR);
  
  const jsFiles = [
    'main.js',
    'masonry.js', 
    'modal.js',
    'infinite.js',
    'like.js',
    'tabs.js'
  ];
  
  let combinedJS = '';
  let totalSize = 0;
  
  jsFiles.forEach(file => {
    const filePath = path.join(JS_DIR, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      combinedJS += `\n/* === ${file} === */\n${content}\n`;
      totalSize += content.length;
      console.log(`  ✓ Added ${file} (${Math.round(content.length / 1024)}KB)`);
    }
  });
  
  // 添加初始化代码
  combinedJS += `
/* === Theme Initialization === */
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🎨 Akina ZZZ Theme v1.0.0', 'color: #d8ff39; font-weight: bold; font-size: 16px;');
  console.log('Theme initialized successfully');
});
`;
  
  const outputPath = path.join(JS_DIR, 'bundle.js');
  fs.writeFileSync(outputPath, combinedJS);
  
  console.log(`✅ JavaScript built successfully: ${outputPath}`);
  console.log(`📊 Total size: ${Math.round(totalSize / 1024)}KB`);
}

// 创建资源清单
function createManifest() {
  console.log('Creating asset manifest...');
  
  const manifest = {
    name: 'akina-zzz',
    version: '1.0.0',
    built: new Date().toISOString(),
    assets: {
      css: 'css/style.css',
      js: 'js/bundle.js',
      jsModules: [
        'js/main.js',
        'js/masonry.js',
        'js/modal.js', 
        'js/infinite.js',
        'js/like.js',
        'js/tabs.js'
      ]
    }
  };
  
  fs.writeFileSync(
    path.join(BUILD_DIR, 'manifest.json'), 
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('✅ Asset manifest created');
}

// 复制其他必要文件
function copyAssets() {
  console.log('Copying additional assets...');
  
  // 创建默认图片占位符
  const imgDir = path.join(BUILD_DIR, 'img');
  ensureDir(imgDir);
  
  // 创建简单的SVG占位符
  const placeholderSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#1b1b21"/>
  <text x="200" y="150" text-anchor="middle" fill="#71717a" font-family="sans-serif" font-size="16">
    Akina ZZZ
  </text>
</svg>`;
  
  fs.writeFileSync(path.join(imgDir, 'placeholder.svg'), placeholderSVG);
  
  // 创建默认头像
  const avatarSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="16" fill="#2a2a32"/>
  <circle cx="16" cy="12" r="4" fill="#71717a"/>
  <path d="M8 24c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="#71717a"/>
</svg>`;
  
  fs.writeFileSync(path.join(imgDir, 'default-avatar.svg'), avatarSVG);
  
  console.log('✅ Assets copied');
}

// 主构建函数
function build() {
  console.log('🚀 Building Akina ZZZ Theme...\n');
  
  try {
    buildCSS();
    buildJS();
    createManifest();
    copyAssets();
    
    console.log('\n🎉 Build completed successfully!');
    console.log('📁 Build output: ./assets/');
    console.log('🔗 Main files:');
    console.log('   - CSS: assets/css/style.css');
    console.log('   - JS:  assets/js/bundle.js (combined)');
    console.log('   - JS:  assets/js/*.js (individual modules)');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// 运行构建
if (require.main === module) {
  build();
}

module.exports = { build };