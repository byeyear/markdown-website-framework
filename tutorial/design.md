# 网站设计文档

## 概述

晓柳科技AI原理与应用主题网站 - 静态内容展示平台，采用原生JavaScript实现，支持Markdown内容渲染。

## 一、设计要求

### 1.1 主题定位
- **主题**：AI原理与应用
- **风格**：简洁、专业、响应式
- **品牌**：晓柳科技，紫色渐变主题（#667eea → #764ba2）

### 1.2 核心功能
- 双级导航系统（主导航 + 子菜单）
- Markdown内容动态加载与渲染
- 响应式布局（桌面端/移动端）
- 移动端侧滑菜单

## 二、页面布局

### 2.1 整体结构
```
Header (固定顶部)
├─ Logo
└─ 主导航菜单

Main Container
├─ Sidebar (左侧边栏/移动端侧滑)
│  └─ 子菜单
└─ Content Area (内容区)
   └─ Markdown渲染内容
```

### 2.2 响应式断点
- **桌面端**：> 768px - 固定左侧边栏（250px）
- **移动端**：≤ 768px - 侧滑菜单（70%宽度，最大300px）

## 三、导航系统

### 3.1 主导航菜单
配置位于`app.js`的`siteConfig.menus`，支持动态扩展。

```javascript
{
  'llm': {
    title: 'LLM原理',
    items: [
      { id: 'llm-intro', title: 'LLM概述', file: 'content/llm/intro.md' }
    ]
  }
}
```

### 3.2 交互行为
- 点击主导航项 → 加载对应子菜单和默认内容
- 默认选中第一个主导航项和第一个子菜单项
- **移动端**：点击主导航项后直接展示内容，不自动弹出子菜单
- 桌面端活动状态显示底部边框

### 3.3 子菜单
- 根据选中的主导航动态生成
- 点击加载对应的Markdown文件
- 移动端点击后自动关闭侧边栏
- 活动项显示左侧边框和背景色

## 四、内容展示

### 4.1 Markdown渲染
- **库**：marked.js v9.1.6
- **CDN**：https://unpkg.com/marked@9.1.6/marked.min.js
- **支持元素**：标题、段落、列表、代码块、表格、引用、链接、图片

### 4.2 内容加载
- 使用`fetch` API异步加载Markdown文件
- 加载失败显示错误信息
- 文件不存在显示"内容准备中"

## 五、技术架构

### 5.1 技术栈
- **HTML5**：语义化标签
- **CSS3**：Flexbox布局，媒体查询
- **JavaScript (ES6+)**：原生JS，无框架依赖
- **第三方库**：marked.js（Markdown解析）

### 5.2 文件结构
```
tutorial/
├── index.html              # 主页面
├── styles.css              # 样式文件
├── app.js                 # JavaScript逻辑
└── content/               # Markdown内容目录
    ├── llm/              # LLM原理内容
    └── ai-programming/    # AI编程内容
```

### 5.3 JavaScript核心函数

| 函数名 | 功能 |
|--------|------|
| `initMainMenu()` | 初始化主导航事件 |
| `selectMainMenu()` | 选择主导航项 |
| `renderSubMenu()` | 渲染子菜单 |
| `selectSubMenu()` | 选择子菜单项 |
| `loadContent()` | 加载Markdown内容 |
| `initMobileMenu()` | 初始化移动端菜单 |

### 5.4 扩展机制

```javascript
// 添加新菜单
addMenu('new-menu', {
  title: '新菜单',
  items: [
    { id: 'item1', title: '子菜单1', file: 'content/new-menu/item1.md' }
  ]
});

// 添加子菜单项
addSubMenu('llm', {
  id: 'new-item',
  title: '新内容',
  file: 'content/llm/new-item.md'
});
```

## 六、样式规范

### 6.1 色彩方案
- **主题渐变**：#667eea → #764ba2
- **背景**：#f5f5f5（页面）、#fff（内容区）
- **文字**：#333（主色）、#555（次色）
- **代码**：#e83e8c（行内）、#2d2d2d（代码块背景）

### 6.2 响应式特性
- **过渡动画**：0.3s ease
- **移动端菜单**：侧滑 + 遮罩层
- **浮动按钮**：右下角圆形按钮（仅移动端）

## 七、浏览器兼容性

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| 移动端 | iOS 14+, Android 10+ |

## 八、维护指南

### 8.1 添加新内容
1. 在`content/`对应目录下创建`.md`文件
2. 在`app.js`的`siteConfig`中添加菜单项
3. 刷新页面即可

### 8.2 修改样式
编辑`styles.css`，使用CSS变量便于主题定制。

### 8.3 修改布局
编辑`index.html`调整HTML结构，编辑`app.js`调整交互逻辑。

## 九、部署

### 9.1 本地开发
```bash
cd tutorial
python -m http.server 3000
```

### 9.2 服务器部署
静态文件部署至Web服务器（Nginx/Apache），配置适当的缓存策略。

### 9.3 Nginx配置建议
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

## 十、未来扩展

- 搜索功能
- 深色模式
- 静态站点生成器集成（Hugo/Jekyll）
- CI/CD自动部署
