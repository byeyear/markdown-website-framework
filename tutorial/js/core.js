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
            console.error('加载菜单配置失败，使用默认配置');
            setDefaultConfig();
        }
    } catch (error) {
        console.error('加载菜单配置失败:', error);
        setDefaultConfig();
    }
}

// 设置默认配置
export function setDefaultConfig() {
    menuConfig = {
        'llm': { title: 'LLM原理', order: 1 },
        'ai-programming': { title: 'AI编程', order: 2 }
    };
    fileTitleMap = {
        'intro': 'LLM概述',
        'text-representation': '文本的数学表示与编码',
        'attention-mechanism': '注意力机制的原理剖析',
        'transformer-architecture': 'Transformer架构深度解析',
        'pretraining': '大规模预训练的原理',
        'generative-inference': '生成式推理的数学原理',
        'emergence': '模型能力涌现的机制',
        'prompt': '提示工程',
        'api': 'API调用',
        'rag': 'RAG应用',
        'agent': '智能体开发',
        'best-practices': '最佳实践'
    };
    fileOrder = {
        'llm': {
            'intro': 1,
            'text-representation': 2,
            'attention-mechanism': 3,
            'transformer-architecture': 4,
            'pretraining': 5,
            'generative-inference': 6,
            'emergence': 7
        },
        'ai-programming': {
            'prompt': 1,
            'api': 2,
            'rag': 3,
            'agent': 4,
            'best-practices': 5
        }
    };
}
