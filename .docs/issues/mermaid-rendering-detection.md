# Mermaid图表渲染问题 - 代码检测逻辑错误

## 问题概述

**问题描述**: 网站中的Mermaid代码块在浏览器中没有显示为图片，而是以纯文本代码形式展示

**具体表现**: 
- Markdown中的 ` ```mermaid ` 代码块在页面上显示为原始代码文本
- Mermaid图表没有被渲染成可视化的图形
- 控制台没有报错，但图表不显示

**影响范围**: 所有包含Mermaid图表的教程页面（attention-mechanism.md、transformer-architecture.md、pretraining.md等）

---

## 根本原因分析

### 问题定位

在 `app.js` 的 `renderMermaid` 函数中，Mermaid代码的检测逻辑存在错误，导致无法正确识别和处理Mermaid代码块。

### 技术分析

1. **Markdown解析流程**:
   - marked.js 解析 ` ```mermaid ` 代码块
   - 生成 HTML: `<pre><code class="language-mermaid">graph TD...</code></pre>`
   - `renderMermaid` 函数查找并处理这些元素
   - 调用 `mermaid.run()` 渲染图表

2. **问题环节**: `renderMermaid` 函数中的代码检测逻辑错误

3. **原始问题代码**:
```javascript
const mermaidElements = container.querySelectorAll('code.language-mermaid, code.mermaid, pre code');

for (const element of mermaidElements) {
    const code = element.textContent.trim();
    if (code.startsWith('mermaid')) {  // ❌ 错误：代码内容以"graph TD"开头，不是"mermaid"
        const mermaidCode = code.replace(/^mermaid\n/, '').trim();  // ❌ 错误：试图移除不存在的"mermaid"前缀
        // ...
    }
}
```

### 问题详解

#### 问题1：选择器过于宽泛
原代码使用 `code.language-mermaid, code.mermaid, pre code`，会匹配所有 `<pre><code>` 元素，包括非Mermaid代码块，造成不必要的遍历。

#### 问题2：检测逻辑错误
原代码检查 `code.startsWith('mermaid')`，但实际情况是：
- Markdown中的 ` ```mermaid ` 是语法标记
- marked.js解析后，代码内容直接是Mermaid图表代码（如 `graph TD`、`sequenceDiagram` 等）
- 代码内容并不包含"mermaid"这个词

因此，`if (code.startsWith('mermaid'))` 条件永远为假，Mermaid代码块被跳过处理。

#### 问题3：不必要的前缀移除
原代码试图移除 `mermaid\n` 前缀，但实际上这个前缀并不存在。

---

## 解决方案

### 核心修复

修改 `renderMermaid` 函数，使用正确的检测逻辑：

```javascript
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
            wrapper.textContent = code;  // 直接使用原始代码，不移除任何前缀
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
        try {
            await mermaid.run({
                nodes: mermaidDivs
            });
        } catch (error) {
            console.error('Mermaid渲染失败:', error);
        }
    }
}
```

### 修复要点

| 修复项 | 原代码 | 修复后 |
|-------|-------|-------|
| 选择器 | `code.language-mermaid, code.mermaid, pre code` | `code.language-mermaid` |
| 检测方式 | `code.startsWith('mermaid')` | 检测Mermaid关键字列表 |
| 代码处理 | `code.replace(/^mermaid\n/, '')` | 直接使用原始代码 |

### 支持的关键字

修复后的代码支持以下Mermaid图表类型：
- `graph ` / `flowchart ` - 流程图
- `sequenceDiagram` - 时序图
- `classDiagram` - 类图
- `stateDiagram` - 状态图
- `erDiagram` - ER图
- `gantt` - 甘特图
- `pie` - 饼图
- `journey` - 用户旅程图
- `gitGraph` - Git图
- `mindmap` - 思维导图
- `timeline` - 时间线图

---

## 相关文件

- **问题文件**: `tutorial/app.js` (第256-275行)
- **修复文件**: `tutorial/app.js`
- **受影响文档**: 
  - `tutorial/content/llm/attention-mechanism.md`
  - `tutorial/content/llm/transformer-architecture.md`
  - `tutorial/content/llm/pretraining.md`
  - `tutorial/content/llm/generative-inference.md`
  - `tutorial/content/llm/text-representation.md`
  - `tutorial/content/llm/math-foundation.md`
- **文档文件**: `.docs/issues/mermaid-rendering-detection.md`

---

## 经验总结

### 关键教训

1. **理解Markdown解析器的行为**：marked.js会将 ` ```mermaid ` 解析为 `class="language-mermaid"`，代码内容不包含语言标识符
2. **验证假设**：不要假设代码内容会以某种特定格式开头，应该实际检查解析后的内容
3. **精确的选择器**：使用精确的CSS选择器，避免不必要的元素遍历

### 调试方法

1. 在浏览器开发者工具中检查解析后的HTML结构
2. 使用 `console.log()` 输出代码内容，验证检测条件
3. 检查Mermaid库是否正确加载（查看Network面板）

### 预防措施

1. 在添加新的图表类型时，更新关键字检测列表
2. 建立自动化测试，验证Mermaid图表是否正确渲染
3. 考虑使用Mermaid的API进行更健壮的检测

---

## 归档信息

- **创建日期**: 2026-02-13
- **问题类型**: 前端渲染 / Markdown解析 / Mermaid图表
- **严重程度**: 中
- **解决状态**: 已解决
- **相关技术**: JavaScript, Markdown, Mermaid.js, marked.js
