# LaTeX公式渲染问题 - HTML特殊字符转义

## 问题概述

**问题描述**: 网站中的LaTeX公式在浏览器中显示不完整，公式在 `<` 字符处被截断

**具体表现**: 
- 公式 `$$\mathcal{L}_{\text{PLM}} = -\sum_{t=1}^{T} \log P(x_{z_t} | x_{z_{<t}})$$` 显示为 `$$\mathcal{L}_{\text{PLM}} = -\sum_{t=1}^{T} \log P(x_{z_t} | x_{z_{`
- 公式在 `<` 字符处被截断，后续内容丢失

**影响范围**: 所有包含HTML特殊字符（`<`, `>`, `&`, `"`, `'`）的LaTeX公式

---

## 根本原因分析

### 问题定位

公式 `x_{z_{<t}}` 中包含 `<` 字符，当公式通过 `contentArea.innerHTML = processedHtml` 插入DOM时，浏览器将 `<` 解析为HTML标签的开始，导致后续内容被当作错误的HTML标签处理而丢失。

### 技术分析

1. **Markdown解析流程**:
   - 提取LaTeX公式 → 用占位符替换 → marked.js解析 → 还原公式 → 插入DOM

2. **问题环节**: 还原公式后直接插入 `innerHTML`，未对HTML特殊字符转义

3. **浏览器行为**: HTML解析器将 `<t}})$$` 解析为不完整的标签，导致内容截断

---

## 解决方案

### 核心修复

在将LaTeX公式插入HTML之前，对HTML特殊字符进行转义：

```javascript
mathPlaceholders.forEach(({ placeholder, original }) => {
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // 对原始公式中的HTML特殊字符进行转义
    const escapedOriginal = original
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    processedHtml = processedHtml.replace(new RegExp(escapedPlaceholder, 'g'), escapedOriginal);
});
```

### HTML特殊字符映射

| 原始字符 | 转义序列 | 说明 |
|---------|---------|------|
| `&` | `&amp;` | 和符号 |
| `<` | `&lt;` | 小于号 |
| `>` | `&gt;` | 大于号 |
| `"` | `&quot;` | 双引号 |
| `'` | `&#39;` | 单引号 |

---

## 相关文件

- **问题文件**: `tutorial/content/llm/pretraining.md` (第186行)
- **修复文件**: `tutorial/app.js`
- **文档文件**: `.docs/issues/latex-rendering-html-escape.md`

---

## 经验总结

### 关键教训

1. **插入 `innerHTML` 前必须转义HTML特殊字符**，这是安全要求也是功能要求
2. **不要假设库会自动处理HTML转义**，需要显式处理
3. **调试时检查DOM中的实际内容**，确认截断位置和原因

### 预防措施

1. 建立通用的HTML转义工具函数
2. 在测试用例中包含含特殊字符的LaTeX公式
3. 内容审查时关注HTML特殊字符

---

## 归档信息

- **创建日期**: 2026-02-12
- **问题类型**: 前端渲染 / HTML安全 / LaTeX处理
- **严重程度**: 高
- **解决状态**: 已解决
- **相关技术**: JavaScript, HTML, LaTeX, KaTeX
