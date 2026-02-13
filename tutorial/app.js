// 全局配置变量
let menuConfig = {};
let fileTitleMap = {};
let fileOrder = {};

let currentMenu = null;
let currentSubMenu = null;
let menuDataCache = null;
let currentFileHeadings = []; // 当前文件的标题数据

// 加载配置文件
async function loadMenuConfig() {
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
function setDefaultConfig() {
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

document.addEventListener('DOMContentLoaded', async function() {
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
    
    // 生成菜单数据
    menuDataCache = await generateMenuData();
    
    // 渲染主导航
    renderMainMenu();
    
    initMobileMenu();
    
    // 默认选中第一个菜单
    const firstMenu = document.querySelector('#main-menu li');
    if (firstMenu) {
        firstMenu.click();
    }
});

// 扫描 content 文件夹生成菜单数据
async function generateMenuData() {
    const menus = {};
    
    try {
        // 获取 content 目录下的所有文件夹
        const contentResponse = await fetch('content/');
        if (!contentResponse.ok) {
            // 如果无法获取目录列表，使用预定义的文件夹列表
            const folders = ['llm', 'ai-programming'];
            for (const folder of folders) {
                const menuData = await scanFolder(folder);
                if (menuData) {
                    menus[folder] = menuData;
                }
            }
        } else {
            // 如果能获取目录列表，动态扫描
            const folders = ['llm', 'ai-programming'];
            for (const folder of folders) {
                const menuData = await scanFolder(folder);
                if (menuData) {
                    menus[folder] = menuData;
                }
            }
        }
    } catch (error) {
        console.error('生成菜单数据失败:', error);
        // 使用默认配置作为后备
        return getDefaultMenuData();
    }
    
    return menus;
}

// 扫描单个文件夹
async function scanFolder(folderName) {
    const folderConfig = menuConfig[folderName] || { title: folderName, order: 999 };
    const items = [];
    
    // 获取当前文件夹的文件顺序配置
    const folderFileOrder = fileOrder[folderName] || {};
    
    // 尝试获取文件夹中的文件
    const filesToCheck = Object.keys(fileTitleMap).map(key => ({
        fileName: `${key}.md`,
        id: `${folderName}-${key}`,
        title: fileTitleMap[key],
        file: `content/${folderName}/${key}.md`,
        order: folderFileOrder[key] || 999
    }));
    
    for (const fileInfo of filesToCheck) {
        try {
            const response = await fetch(fileInfo.file, { method: 'HEAD' });
            if (response.ok) {
                // 文件存在，解析标题结构
                const headings = await parseMarkdownHeadings(fileInfo.file);
                items.push({
                    ...fileInfo,
                    headings: headings
                });
            }
        } catch (error) {
            // 文件不存在，跳过
        }
    }
    
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

// 解析 Markdown 文件的标题结构（只解析一级标题 ##）
async function parseMarkdownHeadings(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) return [];
        
        const text = await response.text();
        const headings = [];
        const lines = text.split('\n');
        
        for (const line of lines) {
            // 只匹配 ## 级别的标题（一级标题）
            const h2Match = line.match(/^##\s+(.+)$/);
            
            if (h2Match) {
                const titleText = h2Match[1].trim();
                headings.push({
                    level: 2,
                    title: titleText,
                    id: generateId(titleText)
                });
            }
        }
        
        return headings;
    } catch (error) {
        console.error(`解析文件失败 ${filePath}:`, error);
        return [];
    }
}

// 生成 ID
function generateId(title) {
    // 处理中文标题：将中文转换为拼音或使用Unicode编码
    // 对于纯中文标题，使用Unicode编码确保ID唯一性
    let processedTitle = title;
    
    // 如果标题包含中文，使用更安全的ID生成方式
    if (/[\u4e00-\u9fa5]/.test(title)) {
        // 中文标题：使用Unicode编码 + 简化处理
        processedTitle = Array.from(title)
            .map(char => {
                if (/[\u4e00-\u9fa5]/.test(char)) {
                    // 中文字符：使用Unicode编码
                    return 'u' + char.charCodeAt(0).toString(16);
                } else if (/[\w\s-]/.test(char)) {
                    // 保留字母数字、空格和连字符
                    return char;
                } else {
                    // 其他字符转换为连字符
                    return '-';
                }
            })
            .join('')
            .replace(/\s+/g, '-') // 将空格替换为连字符
            .replace(/-+/g, '-')  // 合并多个连字符
            .replace(/^-|-$/g, ''); // 去除首尾连字符
    } else {
        // 英文标题：使用原有逻辑
        processedTitle = title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
    }
    
    // 确保ID不为空，如果为空则使用fallback
    if (!processedTitle || processedTitle.trim() === '') {
        processedTitle = 'heading-' + Math.random().toString(36).substr(2, 9);
    }
    
    return processedTitle.substring(0, 50);
}

// 默认菜单数据（后备方案）
function getDefaultMenuData() {
    const defaultMenus = {};
    
    // 使用 menuConfig 构建默认菜单结构
    Object.keys(menuConfig).forEach(folderName => {
        const config = menuConfig[folderName];
        const folderFileOrder = fileOrder[folderName] || {};
        const items = [];
        
        // 根据 fileOrder 构建 items
        Object.keys(folderFileOrder).forEach(fileKey => {
            if (fileTitleMap[fileKey]) {
                items.push({
                    id: `${folderName}-${fileKey}`,
                    title: fileTitleMap[fileKey],
                    file: `content/${folderName}/${fileKey}.md`,
                    order: folderFileOrder[fileKey],
                    headings: []
                });
            }
        });
        
        // 按 order 排序
        items.sort((a, b) => a.order - b.order);
        
        defaultMenus[folderName] = {
            title: config.title,
            order: config.order,
            items: items
        };
    });
    
    return defaultMenus;
}

// 渲染主导航菜单
function renderMainMenu() {
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

function initMainMenu() {
    // 已由 renderMainMenu 处理
}

function selectMainMenu(menuKey, element) {
    document.querySelectorAll('#main-menu li').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
    
    currentMenu = menuKey;
    
    renderSubMenu(menuKey);
}

function renderSubMenu(menuKey) {
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
                
                li.addEventListener('click', function(e) {
                    e.stopPropagation();
                    selectSubMenu(item.id, item.file, heading.id, this);
                });
                
                subItemsContainer.appendChild(li);
            });
        }
        
        // 展开/收缩功能，同时点击标题也加载文件
        menuHeader.addEventListener('click', function() {
            const isExpanded = menuHeader.classList.contains('expanded');
            
            // 存储当前文件的标题数据和路径
            currentFileHeadings = item.headings || [];
            currentFilePath = item.file;
            
            // 加载文件内容
            currentSubMenu = item.id;
            loadContent(item.file, '');
            
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
            currentSubMenu = item.id;
            currentFileHeadings = item.headings || [];
            currentFilePath = item.file;
            loadContent(item.file, '');
            menuHeader.classList.add('active');
        }
    });
}

let currentFilePath = null; // 当前加载的文件路径

function selectSubMenu(subMenuId, filePath, headingId, element) {
    // 移除所有活动状态
    document.querySelectorAll('#sub-menu li').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
    
    currentSubMenu = subMenuId;
    
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
                currentFileHeadings = fileItem.headings || [];
                break;
            }
        }
        
        currentFilePath = filePath;
        loadContent(filePath, headingId);
    }
}

async function loadContent(filePath, headingId = '') {
    const contentArea = document.getElementById('content-area');
    
    // 更新当前文件路径
    currentFilePath = filePath;
    
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
        
        const mathPlaceholders = [];
        let placeholderIndex = 0;
        
        // 处理块级LaTeX公式 $$...$$
        const protectedMarkdown = markdownText.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
            const placeholder = `MATHBLOCK${placeholderIndex}PLACEHOLDER`;
            mathPlaceholders.push({ placeholder, original: match });
            placeholderIndex++;
            return placeholder;
        });
        
        // 使用改进的字符遍历方法处理行内LaTeX公式 $...$，正确处理大括号嵌套
        let protectedMarkdown2 = '';
        let insideFormula = false;
        let currentFormula = '';
        let braceDepth = 0;
        
        for (let j = 0; j < protectedMarkdown.length; j++) {
            const char = protectedMarkdown[j];
            
            // 检查是否是占位符的一部分，如果是则直接添加
            if (char === 'M' && protectedMarkdown.substr(j, 9) === 'MATHBLOCK') {
                // 这是一个块级公式占位符，直接添加到结果中
                let endPlaceholderPos = protectedMarkdown.indexOf('PLACEHOLDER', j);
                if (endPlaceholderPos !== -1) {
                    endPlaceholderPos += 9; // 'PLACEHOLDER'.length
                    protectedMarkdown2 += protectedMarkdown.substring(j, endPlaceholderPos);
                    j = endPlaceholderPos - 1; // -1是因为for循环会自动+1
                    continue;
                }
            }
            
            const nextChar = j + 1 < protectedMarkdown.length ? protectedMarkdown[j + 1] : '';
            
            if (char === '\\' && (nextChar === '{' || nextChar === '}' || nextChar === '$')) {
                // 转义字符，作为一个整体处理
                if (insideFormula) {
                    currentFormula += char + nextChar;
                    j++; // 跳过下一个字符
                } else {
                    protectedMarkdown2 += char + nextChar;
                    j++; // 跳过下一个字符
                }
                continue;
            }
            
            if (char === '$' && !insideFormula) {
                // 开始一个新的行内公式
                insideFormula = true;
                currentFormula = char;
                braceDepth = 0;
            } else if (char === '$' && insideFormula) {
                // 结束当前行内公式 - 只有当大括号平衡时才结束
                if (braceDepth === 0) {
                    currentFormula += char;
                    
                    const placeholder = `MATHINLINE${placeholderIndex}PLACEHOLDER`;
                    mathPlaceholders.push({ placeholder, original: currentFormula });
                    protectedMarkdown2 += placeholder;
                    placeholderIndex++;
                    
                    insideFormula = false;
                    currentFormula = '';
                } else {
                    // 大括号不平衡，继续当前公式
                    currentFormula += char;
                }
            } else if (insideFormula) {
                currentFormula += char;
                if (char === '{') {
                    braceDepth++;
                } else if (char === '}') {
                    braceDepth--;
                }
            } else {
                protectedMarkdown2 += char;
            }
        }
        
        // 添加剩余的非公式内容
        if (currentFormula && insideFormula) {
            protectedMarkdown2 += currentFormula; // 如果公式未闭合，按普通文本处理
        }
        
        marked.setOptions({
            gfm: true,
            breaks: true,
            mangle: false
        });
        
        const htmlContent = marked.parse(protectedMarkdown2);
        
        let processedHtml = htmlContent;
        mathPlaceholders.forEach(({ placeholder, original }) => {
            // 转义占位符中的特殊正则表达式字符
            const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // 对原始公式中的HTML特殊字符进行转义，防止被解析为HTML标签
            const escapedOriginal = original
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            processedHtml = processedHtml.replace(new RegExp(escapedPlaceholder, 'g'), escapedOriginal);
        });
        
        contentArea.innerHTML = processedHtml;
        
        // 为标题添加 ID，便于锚点跳转（在内容加载后立即添加）
        addHeadingIds(contentArea, currentFileHeadings);
        
        // 先渲染 LaTeX，因为公式渲染会改变 DOM 结构
        renderLaTeX(contentArea);
        await renderMermaid(contentArea);
        
        // 如果有指定标题，滚动到对应位置（在所有渲染完成后执行）
        if (headingId) {
            // 使用更可靠的滚动策略
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
            }, 200); // 增加延迟确保所有渲染完成
        }
        
    } catch (error) {
        console.error('加载内容失败:', error);
        contentArea.innerHTML = `
            <h1>加载失败</h1>
            <p>无法加载内容，请稍后重试。</p>
            <p>错误信息：${error.message}</p>
        `;
    }
}

// 为标题添加 ID
function addHeadingIds(container, expectedHeadings = []) {
    const headings = container.querySelectorAll('h2, h3');
    
    // 构建更精确的标题匹配映射
    const headingMatchMap = new Map();
    
    // 为每个预期标题创建多种可能的匹配键
    expectedHeadings.forEach(h => {
        const titleText = h.title.trim();
        
        // 创建多种匹配键以提高匹配成功率
        const keys = [
            // 精确匹配（保留标点符号）
            titleText.toLowerCase(),
            // 去除标点符号的匹配
            titleText.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s]/g, ''),
            // 去除所有空格的匹配
            titleText.toLowerCase().replace(/\s+/g, ''),
            // 去除标点和空格
            titleText.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '')
        ];
        
        // 去重后添加到映射
        [...new Set(keys)].forEach(key => {
            if (key && key.length > 0) {
                headingMatchMap.set(key, h.id);
            }
        });
    });
    
    headings.forEach((heading) => {
        // 使用 textContent 获取原始文本（避免innerText的格式化问题）
        const text = heading.textContent || '';
        const cleanText = text.replace(/\n/g, ' ').trim();
        
        if (!cleanText) return;
        
        // 创建多种可能的匹配键
        const possibleKeys = [
            cleanText.toLowerCase(),
            cleanText.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s]/g, ''),
            cleanText.toLowerCase().replace(/\s+/g, ''),
            cleanText.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '')
        ];
        
        let matchedId = null;
        
        // 尝试匹配各种可能的键
        for (const key of possibleKeys) {
            if (headingMatchMap.has(key)) {
                matchedId = headingMatchMap.get(key);
                break;
            }
        }
        
        if (matchedId) {
            heading.id = matchedId;
        } else {
            // 回退：使用文本生成ID
            heading.id = generateId(cleanText);
        }
    });
}

// 滚动到指定标题
function scrollToHeading(headingId) {
    const heading = document.getElementById(headingId);
    if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderLaTeX(container) {
    renderMathInElement(container, {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
        ],
        throwOnError: false
    });
}

async function renderMermaid(container) {
    // 查找所有带有 language-mermaid 类名的 code 元素
    const mermaidElements = container.querySelectorAll('code.language-mermaid');
    
    for (const element of mermaidElements) {
        const code = element.textContent.trim();
        // 检查是否是有效的 mermaid 代码（以常见的 mermaid 关键字开头）
        const mermaidKeywords = ['graph ', 'flowchart ', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie', 'journey', 'gitGraph', 'mindmap', 'timeline'];
        const isMermaidCode = mermaidKeywords.some(keyword => code.startsWith(keyword));
        
        if (isMermaidCode) {
            const wrapper = document.createElement('div');
            wrapper.className = 'mermaid';
            wrapper.textContent = code;
            const preElement = element.closest('pre');
            if (preElement) {
                preElement.parentNode.replaceChild(wrapper, preElement);
            } else {
                element.parentNode.replaceChild(wrapper, element);
            }
        }
    }
    
    const mermaidDivs = container.querySelectorAll('.mermaid');
    if (mermaidDivs.length > 0 && typeof mermaid !== 'undefined') {
        try {
            await mermaid.run({
                nodes: mermaidDivs
            });
        } catch (error) {
            console.error('Mermaid渲染失败:', error);
        }
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
    
    document.getElementById('main-menu').addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            if (window.innerWidth <= 768) {
                menuToggle.classList.remove('active');
                mainNav.classList.remove('active');
                overlay.classList.remove('active');
            }
        }
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
