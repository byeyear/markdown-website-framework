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

let currentMenu = null;
let currentSubMenu = null;

document.addEventListener('DOMContentLoaded', function() {
    initMainMenu();
    initMobileMenu();
    const firstMenu = document.querySelector('#main-menu li');
    if (firstMenu) {
        firstMenu.click();
    }
});

function initMainMenu() {
    const mainMenuItems = document.querySelectorAll('#main-menu li');
    
    mainMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            const menuKey = this.getAttribute('data-menu');
            selectMainMenu(menuKey, this);
        });
    });
}

function selectMainMenu(menuKey, element) {
    document.querySelectorAll('#main-menu li').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
    
    currentMenu = menuKey;
    
    renderSubMenu(menuKey);
    
    const firstSubMenu = document.querySelector('#sub-menu li');
    if (firstSubMenu) {
        firstSubMenu.click();
    }
    
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('overlay');
        sidebar.classList.add('active');
        overlay.classList.add('active');
    }
}

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

function selectSubMenu(subMenuId, filePath, element) {
    document.querySelectorAll('#sub-menu li').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
    
    currentSubMenu = subMenuId;
    
    loadContent(filePath);
}

async function loadContent(filePath) {
    const contentArea = document.getElementById('content-area');
    
    contentArea.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        const response = await fetch(filePath);
        
        if (!response.ok) {
            contentArea.innerHTML = `
                <h1>内容准备中</h1>
                <p>该部分内容正在编写中，敬请期待...</p>
                <p>文件路径：${filePath}</p>
            `;
            return;
        }
        
        const markdownText = await response.text();
        
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

function addMenu(menuKey, menuData) {
    siteConfig.menus[menuKey] = menuData;
    
    const mainMenu = document.getElementById('main-menu');
    const li = document.createElement('li');
    li.textContent = menuData.title;
    li.setAttribute('data-menu', menuKey);
    
    li.addEventListener('click', function() {
        selectMainMenu(menuKey, this);
    });
    
    mainMenu.appendChild(li);
}

function addSubMenu(menuKey, subMenuItem) {
    if (!siteConfig.menus[menuKey]) {
        console.error(`菜单 ${menuKey} 不存在`);
        return;
    }
    
    siteConfig.menus[menuKey].items.push(subMenuItem);
    
    if (currentMenu === menuKey) {
        renderSubMenu(menuKey);
    }
}

function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');
    
    menuToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        mainNav.classList.toggle('active');
        overlay.classList.toggle('active');
        
        if (mainNav.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });
    
    overlay.addEventListener('click', function() {
        menuToggle.classList.remove('active');
        mainNav.classList.remove('active');
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
    
    const mainMenuItems = document.querySelectorAll('#main-menu li');
    mainMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth > 768) {
                menuToggle.classList.remove('active');
                mainNav.classList.remove('active');
                overlay.classList.remove('active');
            }
        });
    });
    
    document.getElementById('sub-menu').addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    });
    
    const sidebarToggle = document.createElement('button');
    sidebarToggle.className = 'sidebar-toggle';
    sidebarToggle.innerHTML = '☰';
    sidebarToggle.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        z-index: 996;
        display: none;
    `;
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });
    
    document.body.appendChild(sidebarToggle);
    
    function checkMobile() {
        if (window.innerWidth <= 768) {
            sidebarToggle.style.display = 'block';
        } else {
            sidebarToggle.style.display = 'none';
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    }
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
}
