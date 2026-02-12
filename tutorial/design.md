# 网站设计文档

## 概述

本文档描述了晓柳科技AI原理与应用主题网站的设计要求、技术架构和实现细节。

## 一、设计要求

### 1.1 主题定位

- **主题**：AI原理与应用
- **目标受众**：对人工智能技术感兴趣的开发者和学习者
- **风格**：简洁、专业、易读

### 1.2 品牌标识

- **公司名称**：晓柳科技
- **色彩方案**：紫色渐变（#667eea 到 #764ba2）
- **设计风格**：现代化、扁平化

### 1.3 功能需求

#### 核心功能
- [x] 展示AI原理和应用相关内容
- [x] 支持Markdown格式的内容渲染
- [x] 易于扩展的导航菜单系统
- [x] 响应式设计（桌面端和移动端）

#### 用户交互
- [x] 点击主导航切换内容分类
- [x] 点击子菜单加载对应内容
- [x] 移动端菜单切换功能
- [x] 平滑的过渡动画

## 二、页面布局

### 2.1 整体结构

```
┌─────────────────────────────────────────────┐
│              页眉（Header）              │
│  [Logo]  [LLM原理]  [AI编程] [菜单]  │
├──────────┬────────────────────────────────┤
│          │                             │
│  左边栏  │      右边栏（内容区）        │
│          │                             │
│  子菜单   │      Markdown内容              │
│          │                             │
│          │                             │
└──────────┴────────────────────────────────┘
```

### 2.2 页眉（Header）

#### 桌面端
- **高度**：60px
- **背景**：紫色渐变（#667eea → #764ba2）
- **Logo**：左侧，20px字体，加粗
- **导航菜单**：右侧，横向排列
- **阴影**：底部2px阴影

#### 移动端
- **高度**：60px
- **Logo**：左侧，18px字体
- **菜单按钮**：右侧，汉堡图标
- **导航菜单**：侧滑菜单（右侧滑出）

### 2.3 左边栏（Sidebar）

#### 桌面端
- **宽度**：250px
- **位置**：固定，左侧
- **背景**：白色
- **边框**：右侧1px灰色边框
- **高度**：calc(100vh - 60px)

#### 移动端
- **宽度**：70%（最大300px）
- **位置**：侧滑菜单（左侧滑出）
- **层级**：z-index: 998
- **背景**：白色
- **阴影**：右侧阴影

### 2.4 右边栏（Content Area）

#### 桌面端
- **宽度**：calc(100% - 250px)
- **左边距**：250px
- **内边距**：30px 40px
- **背景**：白色

#### 移动端
- **宽度**：100%
- **左边距**：0
- **内边距**：20px 15px
- **背景**：白色

## 三、导航系统

### 3.1 主导航菜单

#### 菜单结构

```javascript
{
  'llm': {
    title: 'LLM原理',
    items: [
      { id: 'llm-intro', title: 'LLM概述', file: 'content/llm/intro.md' },
      { id: 'llm-transformer', title: 'Transformer架构', file: 'content/llm/transformer.md' },
      { id: 'llm-attention', title: '注意力机制', file: 'content/llm/attention.md' },
      { id: 'llm-training', title: '训练过程', file: 'content/llm/training.md' },
      { id: 'llm-finetune', title: '微调技术', file: 'content/llm/finetune.md' }
    ]
  },
  'ai-programming': {
    title: 'AI编程',
    items: [
      { id: 'ai-prompt', title: '提示工程', file: 'content/ai-programming/prompt.md' },
      { id: 'ai-api', title: 'API调用', file: 'content/ai-programming/api.md' },
      { id: 'ai-rag', title: 'RAG应用', file: 'content/ai-programming/rag.md' },
      { id: 'ai-agent', title: '智能体开发', file: 'content/ai-programming/agent.md' },
      { id: 'ai-best-practices', title: '最佳实践', file: 'content/ai-programming/best-practices.md' }
    ]
  }
}
```

#### 交互行为
- 点击主导航项 → 加载对应子菜单
- 默认选中第一个主导航项
- 默认选中第一个子菜单项
- 活动状态显示底部边框（桌面端）

### 3.2 子菜单

#### 渲染规则
- 根据选中的主导航动态生成
- 显示菜单项的title
- 点击加载对应的Markdown文件
- 活动状态显示左侧边框和背景色

#### 交互行为
- 点击子菜单项 → 加载内容
- 移动端点击后自动关闭侧边栏
- 活动项高亮显示

## 四、内容展示

### 4.1 Markdown渲染

#### 使用库
- **marked.js** v9.1.6
- **CDN地址**：https://unpkg.com/marked@9.1.6/marked.min.js

#### 渲染元素
- 标题（h1-h6）
- 段落
- 列表（有序/无序）
- 代码块
- 表格
- 引用块
- 链接
- 图片

### 4.2 内容样式

#### 标题样式
- **h1**：32px，底部2px紫色边框
- **h2**：24px，上边距30px
- **h3**：20px，上边距25px
- **颜色**：深灰色渐变（#333 → #555）

#### 代码样式
- **行内代码**：浅灰背景，粉色文字（#e83e8c）
- **代码块**：深色背景（#2d2d2d），浅色文字（#f8f8f2）

#### 引用样式
- 左侧4px紫色边框
- 左侧20px内边距
- 斜体，灰色文字

#### 表格样式
- 宽度100%
- 边框1px灰色
- 表头浅灰背景
- 单元格12px内边距

### 4.3 加载状态

- 显示"加载中..."提示
- 加载失败显示错误信息
- 文件不存在显示"内容准备中"

## 五、响应式设计

### 5.1 断点设置

| 断点 | 设备类型 | 布局变化 |
|------|----------|----------|
| 768px | 平板/移动 | 左边栏变为侧滑菜单 |
| 480px | 小屏手机 | 字体和间距缩小 |

### 5.2 移动端特性

#### 菜单切换
- **汉堡按钮**：右上角，三条横线
- **主导航**：右侧滑出，70%宽度
- **子菜单**：左侧滑出，70%宽度
- **遮罩层**：半透明黑色背景

#### 浮动按钮
- **位置**：右下角固定
- **样式**：圆形，紫色渐变
- **图标**：☰
- **功能**：快速切换子菜单

#### 字体调整
- **h1**：24px（桌面32px）
- **h2**：20px（桌面24px）
- **h3**：18px（桌面20px）
- **正文**：14px（桌面默认）

### 5.3 过渡动画

- **主导航**：0.3s ease
- **子菜单**：0.3s ease
- **菜单按钮**：0.3s ease（汉堡到X）
- **遮罩层**：0.3s ease

## 六、技术架构

### 6.1 技术栈

#### 前端
- **HTML5**：语义化标签
- **CSS3**：Flexbox布局，媒体查询
- **JavaScript (ES6+)**：原生JS，无框架依赖

#### 第三方库
- **marked.js**：Markdown解析
- **无其他依赖**：保持轻量级

### 6.2 文件结构

```
tutorial/
├── index.html              # 主页面
├── styles.css              # 样式文件
├── app.js                 # JavaScript逻辑
└── content/               # Markdown内容目录
    ├── llm/              # LLM原理内容
    │   ├── intro.md
    │   ├── transformer.md
    │   ├── attention.md
    │   ├── training.md
    │   └── finetune.md
    └── ai-programming/    # AI编程内容
        ├── prompt.md
        ├── api.md
        ├── rag.md
        ├── agent.md
        └── best-practices.md
```

### 6.3 JavaScript架构

#### 核心对象

```javascript
// 网站配置
const siteConfig = {
  menus: {
    // 菜单配置
  }
};

// 应用状态
let currentMenu = null;
let currentSubMenu = null;
```

#### 主要函数

| 函数名 | 功能 |
|--------|------|
| `initMainMenu()` | 初始化主导航事件 |
| `selectMainMenu()` | 选择主导航项 |
| `renderSubMenu()` | 渲染子菜单 |
| `selectSubMenu()` | 选择子菜单项 |
| `loadContent()` | 加载Markdown内容 |
| `initMobileMenu()` | 初始化移动端菜单 |
| `addMenu()` | 添加新导航菜单 |
| `addSubMenu()` | 添加新子菜单项 |

#### 扩展机制

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

## 七、性能优化

### 7.1 加载优化

- **CDN加速**：使用unpkg CDN加载marked.js
- **代码压缩**：生产环境压缩CSS和JS
- **图片优化**：使用WebP格式，适当尺寸
- **懒加载**：图片懒加载（如需要）

### 7.2 缓存策略

#### Nginx配置

```nginx
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.html$ {
    expires 1h;
    add_header Cache-Control "public";
}
```

### 7.3 代码优化

- **避免重复渲染**：只在需要时更新DOM
- **事件委托**：使用事件委托减少监听器
- **CSS优化**：使用transform和opacity代替top/left

## 八、可访问性

### 8.1 语义化HTML

```html
<header>     <!-- 页眉 -->
<nav>        <!-- 导航 -->
<aside>       <!-- 侧边栏 -->
<main>        <!-- 主内容 -->
```

### 8.2 键盘导航

- [ ] Tab键可访问所有交互元素
- [ ] Enter/Space键可激活按钮
- [ ] 焦点状态清晰可见

### 8.3 屏幕阅读器

- [ ] 添加适当的ARIA标签
- [ ] 图片添加alt属性
- [ ] 链接添加描述性文本

## 九、浏览器兼容性

### 9.1 支持的浏览器

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| 移动浏览器 | iOS 14+, Android 10+ |

### 9.2 Polyfill

- **无需要**：使用现代CSS和JavaScript特性
- **可选**：如需支持旧浏览器，可添加polyfill

## 十、未来扩展

### 10.1 功能扩展

- [ ] 搜索功能
- [ ] 深色模式
- [ ] 打印样式
- [ ] 分享功能
- [ ] 评论系统

### 10.2 内容扩展

- [ ] 添加更多LLM相关内容
- [ ] 添加更多AI编程内容
- [ ] 添加实战案例
- [ ] 添加视频教程

### 10.3 技术升级

- [ ] 考虑使用静态站点生成器（如Hugo、Jekyll）
- [ ] 添加CI/CD自动部署
- [ ] 添加性能监控
- [ ] 添加错误追踪

## 十一、部署说明

### 11.1 本地开发

```bash
# 启动本地服务器
cd tutorial
python -m http.server 3000

# 访问
http://localhost:3000/
```

### 11.2 服务器部署

```bash
# 使用SFTP上传文件
sftp webdeploy@your-server-ip
cd /var/www/html
put -r *

# 或者使用rsync
rsync -avz tutorial/ webdeploy@your-server-ip:/var/www/html/
```

### 11.3 Nginx配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/html;
    index index.html;

    # 启用gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

## 十二、维护指南

### 12.1 添加新内容

1. 在 `content/` 对应目录下创建 `.md` 文件
2. 在 `app.js` 的 `siteConfig` 中添加菜单项
3. 刷新页面即可看到新内容

### 12.2 修改样式

1. 编辑 `styles.css`
2. 修改对应的CSS规则
3. 刷新页面查看效果

### 12.3 修改布局

1. 编辑 `index.html` 调整HTML结构
2. 编辑 `styles.css` 调整样式
3. 编辑 `app.js` 调整交互逻辑

## 十三、总结

本网站设计遵循以下原则：

1. **简洁性**：界面简洁，易于使用
2. **可扩展性**：通过配置文件轻松添加内容
3. **响应式**：完美适配桌面端和移动端
4. **性能**：轻量级，快速加载
5. **可维护性**：代码结构清晰，易于维护

通过合理的技术选型和架构设计，实现了一个功能完善、体验良好的静态网站。
