// 内容处理模块

import { currentFileHeadings, currentFilePath } from './core.js';
import { cacheUtil, CACHE_CONFIG } from './cache.js';
import { addHeadingIds, generateId } from './utils.js';

let mermaidLoaded = false;
let markedLoaded = false;

function showLoadingProgress(text = '正在加载资源...', progress = 0) {
    const loadingProgress = document.getElementById('loading-progress');
    const loadingText = document.getElementById('loading-text');
    const loadingProgressBar = document.getElementById('loading-progress-bar');
    
    if (loadingProgress) {
        loadingProgress.style.display = 'block';
    }
    if (loadingText) {
        loadingText.textContent = text;
    }
    if (loadingProgressBar) {
        loadingProgressBar.style.width = `${progress}%`;
    }
}

function hideLoadingProgress() {
    const loadingProgress = document.getElementById('loading-progress');
    if (loadingProgress) {
        loadingProgress.style.display = 'none';
    }
}

function updateLoadingProgress(text, progress) {
    const loadingText = document.getElementById('loading-text');
    const loadingProgressBar = document.getElementById('loading-progress-bar');
    
    if (loadingText) {
        loadingText.textContent = text;
    }
    if (loadingProgressBar) {
        loadingProgressBar.style.width = `${progress}%`;
    }
}

export { updateLoadingProgress, hideLoadingProgress };

async function loadMarked() {
    if (markedLoaded) return;
    
    if (typeof window.marked !== 'undefined') {
        markedLoaded = true;
        return;
    }
    
    showLoadingProgress('正在加载 Markdown 解析库...', 30);
    
    await new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
            if (typeof window.marked !== 'undefined') {
                clearInterval(checkInterval);
                markedLoaded = true;
                updateLoadingProgress('Markdown 解析库加载完成', 60);
                resolve();
            }
        }, 50);
        
        setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('marked 库加载超时'));
        }, 10000);
    });
}

async function loadMermaid() {
    if (mermaidLoaded) return;
    
    const script = document.createElement('script');
    script.src = 'libs/mermaid.min.js';
    document.head.appendChild(script);
    
    await new Promise((resolve, reject) => {
        script.onload = () => {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'default',
                securityLevel: 'loose',
                flowchart: { useMaxWidth: true, htmlLabels: true },
                sequence: { showSequenceNumbers: true },
                throwOnError: false
            });
            mermaidLoaded = true;
            resolve();
        };
        script.onerror = reject;
    });
}

// 渲染内容的通用函数
export async function renderContent(contentArea, markdownText, headingId = '') {
    await loadMarked();
    
    updateLoadingProgress('正在解析 Markdown 内容...', 70);
    
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
    
    updateLoadingProgress('正在渲染 LaTeX 公式...', 80);
    
    // 为标题添加 ID，便于锚点跳转（在内容加载后立即添加）
    addHeadingIds(contentArea, currentFileHeadings);
    
    // 先渲染 LaTeX，因为公式渲染会改变 DOM 结构
    renderLaTeX(contentArea);
    
    updateLoadingProgress('正在渲染图表...', 90);
    await renderMermaid(contentArea);
    
    updateLoadingProgress('加载完成', 100);
    setTimeout(() => {
        hideLoadingProgress();
    }, 300);
    
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
}

// 加载内容
export async function loadContent(filePath, headingId = '') {
    const contentArea = document.getElementById('content-area');
    
    // 尝试从缓存获取内容
    const cacheKey = `${CACHE_CONFIG.content}_${filePath}`;
    const cachedContent = cacheUtil.get(cacheKey);
    
    if (cachedContent) {
        console.log('使用缓存的内容:', filePath);
        await renderContent(contentArea, cachedContent, headingId);
        return;
    }
    
    contentArea.innerHTML = '<div class="loading">加载中...</div>';
    showLoadingProgress('正在加载内容文件...', 10);
    
    try {
        const response = await fetch(filePath);
        
        if (!response.ok) {
            hideLoadingProgress();
            contentArea.innerHTML = `
                <h1>内容准备中</h1>
                <p>该部分内容正在编写中，敬请期待...</p>
                <p>文件路径：${filePath}</p>
            `;
            return;
        }
        
        updateLoadingProgress('正在读取文件内容...', 20);
        const markdownText = await response.text();
        
        // 缓存从服务器加载的内容
        cacheUtil.set(cacheKey, markdownText);
        
        // 使用统一的渲染函数
        await renderContent(contentArea, markdownText, headingId);
        
    } catch (error) {
        hideLoadingProgress();
        console.error('加载内容失败:', error);
        contentArea.innerHTML = `
            <h1>加载失败</h1>
            <p>无法加载内容，请稍后重试。</p>
            <p>错误信息：${error.message}</p>
        `;
    }
}

// 加载菜单标题（独立的进度条控制）
export async function loadMenuHeadings(filePath) {
    showLoadingProgress('正在加载菜单结构...', 10);
    
    try {
        const headings = await parseMarkdownHeadings(filePath);
        hideLoadingProgress();
        return headings;
    } catch (error) {
        hideLoadingProgress();
        console.error('加载菜单标题失败:', error);
        return [];
    }
}

// 渲染 LaTeX
export function renderLaTeX(container) {
    renderMathInElement(container, {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
        ],
        throwOnError: false
    });
}

// 渲染 Mermaid
export async function renderMermaid(container) {
    const mermaidElements = container.querySelectorAll('code.language-mermaid');
    
    for (const element of mermaidElements) {
        const code = element.textContent.trim();
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
    if (mermaidDivs.length > 0) {
        await loadMermaid();
        try {
            await mermaid.run({
                nodes: mermaidDivs
            });
        } catch (error) {
            console.error('Mermaid渲染失败:', error);
        }
    }
}

// 解析 Markdown 文件的标题结构（只解析一级标题 ##）
export async function parseMarkdownHeadings(filePath) {
    try {
        let text;
        
        // 先检查缓存
        const cacheKey = `${CACHE_CONFIG.content}_${filePath}`;
        const cachedContent = cacheUtil.get(cacheKey);
        
        if (cachedContent) {
            console.log('使用缓存的内容解析标题:', filePath);
            text = cachedContent;
        } else {
            // 缓存中没有，fetch 文件
            const response = await fetch(filePath);
            if (!response.ok) return [];
            
            text = await response.text();
            
            // 将内容缓存起来，避免重复传输
            cacheUtil.set(cacheKey, text);
        }
        
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
