// 菜单处理模块

import { menuConfig, fileTitleMap, fileOrder, currentMenu, currentSubMenu, menuDataCache, currentFileHeadings, currentFilePath, setCurrentMenu, setCurrentSubMenu, setCurrentFileHeadings, setCurrentFilePath } from './core.js';
import { cacheUtil, CACHE_CONFIG } from './cache.js';
import { parseMarkdownHeadings, loadContent, loadMenuHeadings } from './content.js';

// 扫描 content 文件夹生成菜单数据
export async function generateMenuData() {
    // 首先尝试从缓存获取
    const cachedMenuData = cacheUtil.get(CACHE_CONFIG.menuData);
    if (cachedMenuData) {
        console.log('使用缓存的菜单数据');
        return cachedMenuData;
    }
    
    const menus = {};
    
    // 从 menuConfig 动态获取文件夹列表
    const folders = Object.keys(menuConfig);
    for (const folder of folders) {
        const menuData = await scanFolder(folder);
        if (menuData) {
            menus[folder] = menuData;
        }
    }
    
    // 缓存菜单数据
    cacheUtil.set(CACHE_CONFIG.menuData, menus);
    
    return menus;
}

// 扫描单个文件夹（首次加载不解析标题）
export async function scanFolder(folderName) {
    const folderConfig = menuConfig[folderName] || { title: folderName, order: 999 };
    const items = [];
    
    // 获取当前文件夹的文件顺序配置
    const folderFileOrder = fileOrder[folderName] || {};
    
    // 尝试获取文件夹中的文件
    const folderFiles = Object.keys(folderFileOrder);
    const filesToCheck = folderFiles.map(key => ({
        fileName: `${key}.md`,
        id: `${folderName}-${key}`,
        title: fileTitleMap[key],
        file: `content/${folderName}/${key}.md`,
        order: folderFileOrder[key] || 999,
        headings: null,  // 首次加载不解析标题
        headingsLoaded: false  // 标记标题是否已加载
    }));
    
    // 直接使用配置中的文件，不检查文件是否存在
    // 文件不存在的情况会在用户点击时处理
    items.push(...filesToCheck);
    
    // 按 order 排序
    items.sort((a, b) => a.order - b.order);
    
    if (items.length === 0) {
        return null;
    }
    
    return {
        title: folderConfig.title,
        order: folderConfig.order,
        items: items
    };
}

// 渲染主导航菜单
export function renderMainMenu() {
    const mainMenu = document.getElementById('main-menu');
    mainMenu.innerHTML = '';
    
    // 按 order 排序
    const sortedMenus = Object.entries(menuDataCache)
        .sort((a, b) => a[1].order - b[1].order);
    
    for (const [menuKey, menuData] of sortedMenus) {
        const li = document.createElement('li');
        li.textContent = menuData.title;
        li.setAttribute('data-menu', menuKey);
        
        li.addEventListener('click', function() {
            selectMainMenu(menuKey, this);
        });
        
        mainMenu.appendChild(li);
    }
}

// 选择主导航菜单
export function selectMainMenu(menuKey, element) {
    document.querySelectorAll('#main-menu li').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
    
    setCurrentMenu(menuKey);
    
    renderSubMenu(menuKey);
}

// 渲染子菜单
export function renderSubMenu(menuKey) {
    const subMenuContainer = document.getElementById('sub-menu');
    const menuData = menuDataCache[menuKey];
    
    if (!menuData) return;
    
    subMenuContainer.innerHTML = '';
    
    menuData.items.forEach((item, index) => {
        // 创建一级菜单项容器（文档本身）
        const menuItemDiv = document.createElement('div');
        menuItemDiv.className = 'menu-item';
        
        // 创建一级菜单标题（可点击展开/收缩，点击也加载文件）
        const menuHeader = document.createElement('div');
        menuHeader.className = 'menu-header';
        if (index === 0) {
            menuHeader.classList.add('expanded');
        }
        
        // 展开/收缩图标
        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'toggle-icon';
        toggleIcon.innerHTML = index === 0 ? '▼' : '▶';
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'menu-title';
        titleSpan.textContent = item.title;
        
        menuHeader.appendChild(toggleIcon);
        menuHeader.appendChild(titleSpan);
        
        // 创建子菜单容器（二级：文档的一级标题）
        const subItemsContainer = document.createElement('ul');
        subItemsContainer.className = 'sub-items';
        if (index === 0) {
            subItemsContainer.style.display = 'block';
        } else {
            subItemsContainer.style.display = 'none';
        }
        
        // 添加文档的一级标题作为二级子菜单
        if (item.headings && item.headings.length > 0) {
            item.headings.forEach(heading => {
                const li = document.createElement('li');
                li.textContent = heading.title;
                li.setAttribute('data-id', item.id);
                li.setAttribute('data-file', item.file);
                li.setAttribute('data-heading', heading.id);
                
                li.addEventListener('click', function() {
                    selectSubMenu(item.id, item.file, heading.id, this);
                });
                
                subItemsContainer.appendChild(li);
            });
        }
        
        // 展开/收缩功能，同时点击标题也加载文件
        menuHeader.addEventListener('click', async function() {
            const isExpanded = menuHeader.classList.contains('expanded');
            
            // 如果标题还未加载，动态加载标题
            if (!item.headingsLoaded && !isExpanded) {
                try {
                    item.headings = await loadMenuHeadings(item.file);
                    item.headingsLoaded = true;
                    
                    // 清空并重新填充子菜单
                    subItemsContainer.innerHTML = '';
                    
                    if (item.headings && item.headings.length > 0) {
                        item.headings.forEach(heading => {
                            const li = document.createElement('li');
                            li.textContent = heading.title;
                            li.setAttribute('data-id', item.id);
                            li.setAttribute('data-file', item.file);
                            li.setAttribute('data-heading', heading.id);
                            
                            li.addEventListener('click', function() {
                                selectSubMenu(item.id, item.file, heading.id, this);
                            });
                            
                            subItemsContainer.appendChild(li);
                        });
                    }
                } catch (error) {
                    console.error('加载标题失败:', error);
                }
            }
            
            // 存储当前文件的标题数据和路径
            setCurrentFileHeadings(item.headings || []);
            setCurrentFilePath(item.file);
            
            // 加载文件内容
            setCurrentSubMenu(item.id);
            loadContent(item.file, '');
            
            // 移动端：点击菜单标题后隐藏侧边栏
            if (window.innerWidth <= 768) {
                const sidebar = document.querySelector('.sidebar');
                const overlay = document.getElementById('overlay');
                if (sidebar) sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
            }
            
            // 收缩其他所有展开的菜单
            const allMenuHeaders = document.querySelectorAll('.menu-header');
            allMenuHeaders.forEach(header => {
                if (header !== menuHeader) {
                    const isOtherExpanded = header.classList.contains('expanded');
                    if (isOtherExpanded) {
                        const otherToggleIcon = header.querySelector('.toggle-icon');
                        const otherSubItemsContainer = header.nextElementSibling;
                        
                        header.classList.remove('expanded');
                        otherToggleIcon.innerHTML = '▶';
                        otherSubItemsContainer.style.display = 'none';
                    }
                }
            });
            
            // 移除其他所有活动状态
            document.querySelectorAll('#sub-menu li').forEach(li => {
                li.classList.remove('active');
            });
            
            // 切换展开/收缩状态
            if (isExpanded) {
                menuHeader.classList.remove('expanded');
                toggleIcon.innerHTML = '▶';
                subItemsContainer.style.display = 'none';
            } else {
                menuHeader.classList.add('expanded');
                toggleIcon.innerHTML = '▼';
                subItemsContainer.style.display = 'block';
            }
        });
        
        menuItemDiv.appendChild(menuHeader);
        menuItemDiv.appendChild(subItemsContainer);
        subMenuContainer.appendChild(menuItemDiv);
        
        // 默认加载第一个文件并展开
        if (index === 0) {
            // 异步加载第一个文件的标题
            loadHeadingsForFirstItem(item, subItemsContainer, menuHeader, toggleIcon).then(() => {
                setCurrentSubMenu(item.id);
                setCurrentFileHeadings(item.headings || []);
                setCurrentFilePath(item.file);
                loadContent(item.file, '');
                menuHeader.classList.add('active');
            });
        }
    });
}

// 异步加载第一个文件的标题
async function loadHeadingsForFirstItem(item, subItemsContainer, menuHeader, toggleIcon) {
    if (!item.headingsLoaded) {
        try {
            item.headings = await loadMenuHeadings(item.file);
            item.headingsLoaded = true;
            
            // 清空并重新填充子菜单
            subItemsContainer.innerHTML = '';
            
            if (item.headings && item.headings.length > 0) {
                item.headings.forEach(heading => {
                    const li = document.createElement('li');
                    li.textContent = heading.title;
                    li.setAttribute('data-id', item.id);
                    li.setAttribute('data-file', item.file);
                    li.setAttribute('data-heading', heading.id);
                    
                    li.addEventListener('click', function() {
                        selectSubMenu(item.id, item.file, heading.id, this);
                    });
                    
                    subItemsContainer.appendChild(li);
                });
            }
        } catch (error) {
            console.error('加载标题失败:', error);
        }
    }
}

// 选择子菜单
export function selectSubMenu(subMenuId, filePath, headingId, element) {
    // 移除所有活动状态
    document.querySelectorAll('#sub-menu li').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
    
    setCurrentSubMenu(subMenuId);
    
    // 移动端：点击子菜单后隐藏侧边栏
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }
    
    // 点击子菜单后自动收回其他展开的菜单
    const allMenuHeaders = document.querySelectorAll('.menu-header');
    const currentMenuHeader = element.closest('.menu-item').querySelector('.menu-header');
    
    allMenuHeaders.forEach(header => {
        if (header !== currentMenuHeader) {
            const isExpanded = header.classList.contains('expanded');
            if (isExpanded) {
                const toggleIcon = header.querySelector('.toggle-icon');
                const subItemsContainer = header.nextElementSibling;
                
                header.classList.remove('expanded');
                toggleIcon.innerHTML = '▶';
                subItemsContainer.style.display = 'none';
            }
        }
    });
    
    // 如果是同一个文件，直接滚动到标题，不需要重新加载
    if (currentFilePath === filePath && headingId) {
        // 使用与loadContent相同的可靠滚动策略
        setTimeout(() => {
            const heading = document.getElementById(headingId);
            if (heading) {
                // 确保标题在视图中可见
                const headerHeight = document.querySelector('.header').offsetHeight;
                const headingTop = heading.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = headingTop - headerHeight - 20; // 额外留出20px间距
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            } else {
                console.warn(`未找到标题元素: ${headingId}`);
                // 回退到页面顶部
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 100); // 延迟 100ms 确保页面稳定
    } else {
        // 找到新文件对应的标题数据
        for (const menuKey in menuDataCache) {
            const menuData = menuDataCache[menuKey];
            const fileItem = menuData.items.find(item => item.file === filePath);
            if (fileItem) {
                setCurrentFileHeadings(fileItem.headings || []);
                break;
            }
        }
        
        setCurrentFilePath(filePath);
        loadContent(filePath, headingId);
    }
}
