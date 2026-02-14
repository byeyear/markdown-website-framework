// 核心配置模块

// 全局配置变量
export let menuConfig = {};
export let fileTitleMap = {};
export let fileOrder = {};

export let currentMenu = null;
export let currentSubMenu = null;
export let menuDataCache = null;
export let currentFileHeadings = []; // 当前文件的标题数据
export let currentFilePath = null; // 当前加载的文件路径

// 设置菜单数据缓存
export function setMenuDataCache(data) {
    menuDataCache = data;
    console.log('菜单数据缓存已更新');
}

// 设置当前菜单
export function setCurrentMenu(menu) {
    currentMenu = menu;
}

// 设置当前子菜单
export function setCurrentSubMenu(subMenu) {
    currentSubMenu = subMenu;
}

// 设置当前文件标题
export function setCurrentFileHeadings(headings) {
    currentFileHeadings = headings;
}

// 设置当前文件路径
export function setCurrentFilePath(path) {
    currentFilePath = path;
}

// 加载配置文件
export async function loadMenuConfig() {
    try {
        const response = await fetch('menu-config.json');
        if (response.ok) {
            const config = await response.json();
            menuConfig = config.menuConfig || {};
            fileTitleMap = config.fileTitleMap || {};
            fileOrder = config.fileOrder || {};
            console.log('菜单配置加载成功');
        } else {
            console.error('加载菜单配置失败');
            menuConfig = {};
            fileTitleMap = {};
            fileOrder = {};
        }
    } catch (error) {
        console.error('加载菜单配置失败:', error);
        menuConfig = {};
        fileTitleMap = {};
        fileOrder = {};
    }
}
