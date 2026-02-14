// 工具函数模块

// 生成 ID
export function generateId(title) {
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

// 为标题添加 ID
export function addHeadingIds(container, expectedHeadings = []) {
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
export function scrollToHeading(headingId) {
    const heading = document.getElementById(headingId);
    if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
