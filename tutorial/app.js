const siteConfig = {
    menus: {
        'llm': {
            title: 'LLM原理',
            items: [
                { id: 'llm-text-representation', title: '文本的数学表示与编码', file: 'content/llm/text-representation.md' },
                { id: 'llm-attention-mechanism', title: '注意力机制的原理剖析', file: 'content/llm/attention-mechanism.md' },
                { id: 'llm-transformer-architecture', title: 'Transformer架构深度解析', file: 'content/llm/transformer-architecture.md' },
                { id: 'llm-pretraining', title: '大规模预训练的原理', file: 'content/llm/pretraining.md' },
                { id: 'llm-generative-inference', title: '生成式推理的数学原理', file: 'content/llm/generative-inference.md' },
                { id: 'llm-emergence', title: '模型能力涌现的机制', file: 'content/llm/emergence.md' }
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
        // 并确保不会处理已经被块级公式占位符替代的部分
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
        
        renderLaTeX(contentArea);
        renderMermaid(contentArea);
        
    } catch (error) {
        console.error('加载内容失败:', error);
        contentArea.innerHTML = `
            <h1>加载失败</h1>
            <p>无法加载内容，请稍后重试。</p>
            <p>错误信息：${error.message}</p>
        `;
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

function renderMermaid(container) {
    const mermaidElements = container.querySelectorAll('code');
    mermaidElements.forEach(element => {
        const code = element.textContent;
        if (code.trim().startsWith('mermaid')) {
            const mermaidCode = code.replace(/^mermaid\n/, '');
            const wrapper = document.createElement('div');
            wrapper.className = 'mermaid';
            wrapper.textContent = mermaidCode.trim();
            element.parentNode.replaceChild(wrapper, element);
        }
    });
    
    mermaid.init(undefined, container.querySelectorAll('.mermaid'));
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
            if (window.innerWidth <= 768) {
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
