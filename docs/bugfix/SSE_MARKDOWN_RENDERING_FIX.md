# BugFix: SSE 流式 Markdown 渲染失败

## 时间

2026-06-16

## 现象

AI 聊天流式响应完成后，消息内容显示为原始 markdown 文本（如 `## 标题`、`**粗体**`），而非格式化的 HTML。切换会话后重新加载同一消息即可正常渲染。

## 根因

SSE 协议规定连续多个 `data:` 行属于同一条事件，行之间应保留 `\n` 连接：

```
data:---
data:## 一、核心思想
```

正确拼接为 `---\n## 一、核心思想`（`##` 在行首，正则匹配）。

旧代码逐行 `.trim()` 后直接 `+=`：

```javascript
const text = line.substring(5).trim();
fullText += text;
```

结果变成 `---## 一、核心思想`，`##` 不在行首，标题正则 `^##` 匹配失败，全文被当作纯文本。

## 修复

文件：`src/views/ai/chat/index.vue`

收集完整 SSE 事件后 `join('\n')` 再追加：

```javascript
let eventLines = [];

for (const line of lines) {
    if (line.startsWith('data:')) {
        eventLines.push(line.substring(5));
    } else if (line === '' || line === '\r') {
        if (eventLines.length > 0) {
            fullText += eventLines.join('\n');
            eventLines = [];
        }
    }
}
if (eventLines.length > 0) {
    fullText += eventLines.join('\n');
}
```

## 教训

1. SSE `data:` 解析永远不要 `.trim()`，仅去掉行尾 `\r`
2. 多行 `data:` 必须用 `\n` 连接再追加
