// 应用入口模块

import { loadMenuConfig, setMenuDataCache, currentMenu, currentSubMenu } from './core.js';
import { cacheUtil } from './cache.js';

// 模块加载状态
const moduleStatus = {
    menu: false,
    content: false,
    utils: false
};

// 动态加载菜单模块
async function loadMenuModule() {
    if (!moduleStatus.menu) {
        try {
            const menuModule = await import('./menu.js');
            moduleStatus.menu = true;
            console.log('菜单模块加载成功');
            return menuModule;
        } catch (error) {
            console.error('加载菜单模块失败:', error);
            return null;
        }
    }
    return await import('./menu.js');
}

// 动态加载内容模块
async function loadContentModule() {
    if (!moduleStatus.content) {
        try {
            const contentModule = await import('./content.js');
            moduleStatus.content = true;
            console.log('内容模块加载成功');
            return contentModule;
        } catch (error) {
            console.error('加载内容模块失败:', error);
            return null;
        }
    }
    return await import('./content.js');
}

// 动态加载工具模块
async function loadUtilsModule() {
    if (!moduleStatus.utils) {
        try {
            const utilsModule = await import('./utils.js');
            moduleStatus.utils = true;
            console.log('工具模块加载成功');
            return utilsModule;
        } catch (error) {
            console.error('加载工具模块失败:', error);
            return null;
        }
    }
    return await import('./utils.js');
}

// 初始化应用
async function initApp() {
    console.log('初始化应用...');
    
    // 初始化 mermaid（如果已加载）
    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
        });
    }
    
    // 先加载菜单配置
    await loadMenuConfig();
    
    // 加载菜单模块并生成菜单数据
    const menuModule = await loadMenuModule();
    if (menuModule) {
        const menuData = await menuModule.generateMenuData();
        setMenuDataCache(menuData);
        
        // 渲染主导航
        menuModule.renderMainMenu();
        
        // 初始化移动端菜单
        initMobileMenu();
        
        // 默认选中第一个菜单 - 使用 setTimeout 确保 DOM 已渲染
        setTimeout(() => {
            const firstMenu = document.querySelector('#main-menu li');
            if (firstMenu) {
                firstMenu.click();
            }
        }, 0);
    }
    
    console.log('应用初始化完成');
}

// 初始化移动端菜单
function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');
    const submenuFloatBtn = document.getElementById('submenu-float-btn');
    
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
    
    submenuFloatBtn.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });
    
    document.getElementById('main-menu').addEventListener('click', async function(e) {
        if (e.target.tagName === 'LI') {
            const menuModule = await loadMenuModule();
            if (menuModule) {
                const menuKey = e.target.getAttribute('data-menu');
                menuModule.selectMainMenu(menuKey, e.target);
            }
            
            if (window.innerWidth <= 768) {
                menuToggle.classList.remove('active');
                mainNav.classList.remove('active');
                overlay.classList.remove('active');
                sidebar.classList.remove('active');
            }
        }
    });
    
    document.getElementById('sub-menu').addEventListener('click', async function(e) {
        if (e.target.tagName === 'LI') {
            await loadContentModule();
            
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        }
    });
}

// 暴露公共接口
export {
    initApp,
    loadMenuModule,
    loadContentModule,
    loadUtilsModule,
    moduleStatus
};

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
