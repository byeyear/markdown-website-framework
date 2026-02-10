// 网站配置 - 方便扩展导航菜单和子菜单
const siteConfig = {
    menus: {
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
};

// 应用状态
let currentMenu = null;
let currentSubMenu = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initMainMenu();
    // 默认选择第一个菜单
    const firstMenu = document.querySelector('#main-menu li');
    if (firstMenu) {
        firstMenu.click();
    }
});

// 初始化主导航菜单
function initMainMenu() {
    const mainMenuItems = document.querySelectorAll('#main-menu li');
    
    mainMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            const menuKey = this.getAttribute('data-menu');
            selectMainMenu(menuKey, this);
        });
    });
}

// 选择主导航菜单
function selectMainMenu(menuKey, element) {
    // 更新活动状态
    document.querySelectorAll('#main-menu li').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
    
    currentMenu = menuKey;
    
    // 渲染子菜单
    renderSubMenu(menuKey);
    
    // 默认选择第一个子菜单
    const firstSubMenu = document.querySelector('#sub-menu li');
    if (firstSubMenu) {
        firstSubMenu.click();
    }
}

// 渲染子菜单
function renderSubMenu(menuKey) {
    const subMenuContainer = document.getElementById('sub-menu');
    const menuData = siteConfig.menus[menuKey];
    
    if (!menuData) return;
    
    subMenuContainer.innerHTML = '';
    
    menuData.items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.title;
        li.setAttribute('data-id', item.id);
        li.setAttribute('data-file', item.file);
        
        li.addEventListener('click', function() {
            selectSubMenu(item.id, item.file, this);
        });
        
        subMenuContainer.appendChild(li);
    });
}

// 选择子菜单
function selectSubMenu(subMenuId, filePath, element) {
    // 更新活动状态
    document.querySelectorAll('#sub-menu li').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
    
    currentSubMenu = subMenuId;
    
    // 加载内容
    loadContent(filePath);
}

// 加载Markdown内容
async function loadContent(filePath) {
    const contentArea = document.getElementById('content-area');
    
    // 显示加载提示
    contentArea.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        const response = await fetch(filePath);
        
        if (!response.ok) {
            // 如果文件不存在，显示默认内容
            contentArea.innerHTML = `
                <h1>内容准备中</h1>
                <p>该部分内容正在编写中，敬请期待...</p>
                <p>文件路径：${filePath}</p>
            `;
            return;
        }
        
        const markdownText = await response.text();
        
        // 使用 marked.js 解析 Markdown
        const htmlContent = marked.parse(markdownText);
        contentArea.innerHTML = htmlContent;
        
    } catch (error) {
        console.error('加载内容失败:', error);
        contentArea.innerHTML = `
            <h1>加载失败</h1>
            <p>无法加载内容，请稍后重试。</p>
            <p>错误信息：${error.message}</p>
        `;
    }
}

// 添加新的导航菜单（方便扩展）
function addMenu(menuKey, menuData) {
    siteConfig.menus[menuKey] = menuData;
    
    // 重新渲染主导航
    const mainMenu = document.getElementById('main-menu');
    const li = document.createElement('li');
    li.textContent = menuData.title;
    li.setAttribute('data-menu', menuKey);
    
    li.addEventListener('click', function() {
        selectMainMenu(menuKey, this);
    });
    
    mainMenu.appendChild(li);
}

// 添加新的子菜单项（方便扩展）
function addSubMenu(menuKey, subMenuItem) {
    if (!siteConfig.menus[menuKey]) {
        console.error(`菜单 ${menuKey} 不存在`);
        return;
    }
    
    siteConfig.menus[menuKey].items.push(subMenuItem);
    
    // 如果当前正在显示该菜单，刷新子菜单
    if (currentMenu === menuKey) {
        renderSubMenu(menuKey);
    }
}
