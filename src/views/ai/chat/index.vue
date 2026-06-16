<template>
    <div class="chat-container" :class="{ 'theme-dark': theme === 'dark' }">
        <!-- ===== 侧边栏 ===== -->
        <div class="chat-sidebar" :class="{ collapsed: sidebarCollapsed }">
            <div class="sidebar-header">
                <el-button type="primary" size="small" class="new-chat-btn" @click="onNewSession">
                    <i class="el-icon-plus"></i> 新对话
                </el-button>
                <el-button
                    class="collapse-btn"
                    type="text"
                    size="small"
                    @click="sidebarCollapsed = !sidebarCollapsed">
                    <i :class="sidebarCollapsed ? 'el-icon-s-unfold' : 'el-icon-s-fold'"></i>
                </el-button>
            </div>
            <div class="session-list" v-show="!sidebarCollapsed">
                <div
                    v-for="session in state.sessions"
                    :key="session.id"
                    class="session-item"
                    :class="{ active: state.activeSessionId === session.id }"
                    @click="onSelectSession(session)">
                    <div class="session-title">{{ session.title || '新对话' }}</div>
                    <span class="session-time">{{ formatTime(session.updateTime || session.createTime) }}</span>
                    <i class="el-icon-close session-delete" @click.stop="onDeleteSession(session.id)"></i>
                </div>
                <div v-if="state.sessions.length === 0 && !sidebarCollapsed" class="empty-sessions">
                    暂无对话记录
                </div>
            </div>
            <div class="sidebar-footer">
                <div class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? '切换浅色模式' : '切换深色模式'">
                    <i :class="theme === 'dark' ? 'el-icon-sunny' : 'el-icon-moon'"></i>
                    <span v-show="!sidebarCollapsed">{{ theme === 'dark' ? '浅色模式' : '深色模式' }}</span>
                </div>
            </div>
        </div>

        <!-- ===== 主对话区 ===== -->
        <div class="chat-main">
            <!-- 顶部导航条 -->
            <div class="chat-topbar">
                <i v-if="sidebarCollapsed"
                    class="el-icon-s-unfold sidebar-toggle"
                    @click="sidebarCollapsed = false"></i>
                <div class="topbar-title">{{ currentSessionTitle }}</div>
            </div>

            <!-- 内容区 -->
            <div class="chat-body">
                <div v-show="!state.activeSessionId" class="chat-placeholder">
                    <div class="placeholder-content">
                        <div class="logo-icon">🤖</div>
                        <h2>AI 智能助手</h2>
                        <p>基于知识库的 RAG 智能问答，支持多轮对话和流式输出</p>
                        <el-button type="primary" round size="medium" @click="onNewSession">
                            开始新对话
                        </el-button>
                    </div>
                </div>

                <div v-show="state.activeSessionId" class="chat-content">
                    <!-- 消息列表 -->
                    <div class="message-list" ref="messageList">
                        <div v-for="(msg, idx) in state.messages" :key="msg._key || idx"
                            class="msg-row" :class="msg.role === 'USER' ? 'row-user' : 'row-ai'">
                            <div class="msg-icon">
                                {{ msg.role === 'USER' ? '👤' : '🤖' }}
                            </div>
                            <div class="msg-main">
                                <div class="msg-content markdown-body" v-html="renderContent(msg.content)"></div>
                                <div v-if="msg.sources && parseSources(msg.sources).length > 0" class="msg-sources">
                                    <span class="sources-label">📚 参考：</span>
                                    <span v-for="(s, si) in parseSources(msg.sources)" :key="si" class="source-chip">
                                        {{ s.title }} <em>({{ (s.score * 100).toFixed(0) }}%)</em>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- 流式输出 -->
                        <div v-if="state.streaming" class="msg-row row-ai">
                            <div class="msg-icon">🤖</div>
                            <div class="msg-main">
                                <div class="msg-content streaming-content" v-html="renderStream(state.streamText)"></div>
                                <span class="typing-cursor"></span>
                            </div>
                        </div>

                        <div class="scroll-anchor" ref="scrollAnchor"></div>
                    </div>

                    <!-- 输入区 -->
                    <div class="chat-input-area">
                        <div class="input-wrapper">
                            <textarea
                                ref="inputBox"
                                v-model="state.inputText"
                                class="chat-textarea"
                                :placeholder="state.streaming ? 'AI 正在回复...' : '输入你的问题，Enter 发送，Shift+Enter 换行'"
                                :disabled="state.streaming"
                                :rows="1"
                                @input="autoResize"
                                @keydown="onKeydown"></textarea>
                            <button
                                class="send-btn"
                                :class="{ loading: state.sending }"
                                :disabled="!state.inputText.trim() || state.streaming"
                                @click="onSend()">
                                <i v-if="!state.sending" class="el-icon-position"></i>
                                <i v-else class="el-icon-loading"></i>
                            </button>
                        </div>
                        <div class="input-hint">
                            AI 回答基于知识库内容生成，可能存在偏差，请以实际文档为准
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { useChatApi } from '@/api/ai/index';
import { Session } from '@/utils/storage';

function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
let _msgSeq = 0; function msgKey() { return 'm' + (++_msgSeq) + '_' + Date.now(); }

// 内联轻量 Markdown 渲染器（占位符分离：先提取代码块再处理正文，防止 # 被误转标题）
function md2html(text) {
    if (!text) return '';
    const codeBlocks = [];
    // 1. 提取代码块 → 占位符，保护内部内容不被后续规则污染
    text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        const idx = codeBlocks.length;
        codeBlocks.push('<pre><code>' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre>');
        return '%%CODEBLOCK_' + idx + '%%';
    });
    // 2. 表格（连续 | 开头的行）
    text = text.replace(/((?:^\|.+\|\n?)+)/gm, function(block) {
        const rows = block.trim().split('\n');
        if (rows.length < 2) return block;
        let html = '<table>';
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].split('|').filter(c => c.trim());
            const tag = i === 0 ? 'th' : 'td';
            // 跳过分隔行 |---|---|
            if (cells.every(c => /^[-:]+$/.test(c.trim()))) continue;
            html += '<tr>' + cells.map(c => '<' + tag + '>' + c.trim() + '</' + tag + '>').join('') + '</tr>';
        }
        html += '</table>';
        return html;
    });
    // 3. 行内代码
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    // 3. 粗体和斜体
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // 4. 标题
    text = text.replace(/^####\s*(.+)$/gm, '<h4>$1</h4>');
    text = text.replace(/^###\s*(.+)$/gm, '<h3>$1</h3>');
    text = text.replace(/^##\s*(.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^#\s*(.+)$/gm, '<h1>$1</h1>');
    // 5. 无序列表
    text = text.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
    text = text.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
    // 6. 有序列表
    text = text.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
    // 7. 引用
    text = text.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');
    // 8. 分割线（也匹配 ---后面紧跟内容的情况，如 ---##）
    text = text.replace(/^---$/gm, '<hr>');
    text = text.replace(/^---(?=\S)/gm, '<hr>');
    // 9. 链接
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    // 10. 还原代码块占位符
    text = text.replace(/%%CODEBLOCK_(\d+)%%/g, (_, i) => codeBlocks[i]);
    // 11. 换行
    text = text.replace(/\n\n/g, '</p><p>');
    text = text.replace(/\n/g, '<br>');
    return '<p>' + text + '</p>';
}

export default {
    name: 'aiChat',
    data() {
        return {
            theme: (localStorage.getItem('ai_chat_theme') || 'light'),
            sidebarCollapsed: false,
            state: {
                sessions: [],
                activeSessionId: null,
                messages: [],
                inputText: '',
                sending: false,
                streaming: false,
                streamText: '',
                renderKey: 0,
            }
        };
    },
    computed: {
        currentSessionTitle() {
            if (!this.state.activeSessionId) return '';
            const cur = this.state.sessions.find(s => s.id === this.state.activeSessionId);
            return cur ? (cur.title || '新对话') : '';
        }
    },
    watch: {
        'state.activeSessionId'(val) {
            if (val) sessionStorage.setItem('ai_chat_active_session', val);
            else sessionStorage.removeItem('ai_chat_active_session');
        },
    },
    mounted() {
        this.fetchSessions();
        const savedId = sessionStorage.getItem('ai_chat_active_session');
        const savedMsgs = sessionStorage.getItem('ai_chat_messages');
        if (savedId) {
            this.state.activeSessionId = savedId;
            if (savedMsgs) {
                try { this.state.messages = JSON.parse(savedMsgs).map(m => (m._key = m._key || msgKey(), m)); this.state.renderKey++; } catch(e) {}
            }
        }
        this.$nextTick(() => this.scrollToBottom());
    },
    methods: {
        // ===== 主题 =====
        toggleTheme() {
            this.theme = this.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('ai_chat_theme', this.theme);
        },

        // ===== 消息持久化 =====
        persistMessages() {
            if (this.state.activeSessionId && this.state.messages.length > 0) {
                sessionStorage.setItem('ai_chat_messages',
                    JSON.stringify(this.state.messages.slice(-30)));
            }
        },

        // ===== 会话管理 =====
        async fetchSessions() {
            try {
                const res = await useChatApi().listSessions();
                if (res.code === 0) this.state.sessions = res.data || [];
            } catch(e) {}
        },
        async onNewSession() {
            const res = await useChatApi().createSession({});
            if (res.code === 0) {
                this.state.sessions.unshift(res.data);
                this.state.activeSessionId = res.data.id;
                this.state.messages = [];
                this.state.renderKey++;
                this.state.inputText = '';
                sessionStorage.removeItem('ai_chat_messages');
                this.$nextTick(() => { if (this.$refs.inputBox) this.$refs.inputBox.focus(); });
            }
        },
        async onSelectSession(session) {
            this.state.activeSessionId = session.id;
            this.state.inputText = '';
            const res = await useChatApi().getMessages(session.id);
            if (res.code === 0) {
                this.state.messages = (res.data || []).map(m => (m._key = m._key || m.id || msgKey(), m));
                this.state.renderKey++;
                this.persistMessages();
            }
            this.$nextTick(() => this.scrollToBottom());
        },
        async onDeleteSession(id) {
            this.$confirm('确定删除该对话?', '提示', { type: 'warning' }).then(async () => {
                const res = await useChatApi().deleteSession(id);
                if (res.code === 0) {
                    this.$message.success('已删除');
                    if (this.state.activeSessionId === id) {
                        this.state.activeSessionId = null;
                        this.state.messages = [];
                        this.state.renderKey++;
                        sessionStorage.removeItem('ai_chat_active_session');
                        sessionStorage.removeItem('ai_chat_messages');
                    }
                    this.fetchSessions();
                }
            }).catch(() => {});
        },

        // ===== 发送消息 =====
        onKeydown(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.onSend();
            }
        },
        autoResize() {
            const el = this.$refs.inputBox;
            if (!el) return;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 200) + 'px';
        },
        async onSend(e) {
            if (e && e.preventDefault) e.preventDefault();
            const content = this.state.inputText.trim();
            if (!content || this.state.streaming) return;

            this.state.inputText = '';
            this.state.sending = true;
            this.state.messages.push({ _key: msgKey(), role: 'USER', content });
            this.$nextTick(() => { this.scrollToBottom(); this.resetInputHeight(); });

            this.state.streaming = true;
            this.state.streamText = '';

            let timeoutId = null;
            try {
                const token = Session.get('token');
                const url = (process.env.VUE_APP_BASE_API || '') + useChatApi().streamUrl();
                const controller = new AbortController();
                timeoutId = setTimeout(() => controller.abort(), 120000);
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'token': token || '' },
                    body: JSON.stringify({ sessionId: this.state.activeSessionId, content }),
                    signal: controller.signal
                });

                if (!response.ok) throw new Error('HTTP ' + response.status);

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullText = '';
                let eventLines = []; // 当前 SSE 事件的 data 行缓冲

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data:')) {
                            eventLines.push(line.substring(5));
                        } else if (line === '' || line === '\r') {
                            // 空行 = SSE 事件结束，拼接多行 data 用 \n 连接
                            if (eventLines.length > 0) {
                                fullText += eventLines.join('\n');
                                eventLines = [];
                                this.state.streamText = fullText;
                            }
                        }
                    }
                    this.$nextTick(() => this.scrollToBottom());
                }
                // 流结束处理最后一个事件
                if (eventLines.length > 0) {
                    fullText += eventLines.join('\n');
                }

                // 先存结果，等 finally 中 streaming 关闭后再插入消息，避免流式渲染冲掉 DOM 更新
                this._pendingMessage = fullText ? { _key: msgKey(), role: 'ASSISTANT', content: fullText } : null;
            } catch (err) {
                if (err.name === 'AbortError') {
                    this._pendingMessage = this.state.streamText ? { _key: msgKey(), role: 'ASSISTANT', content: this.state.streamText } : null;
                } else {
                    try {
                        const res = await useChatApi().send({ sessionId: this.state.activeSessionId, content });
                        if (res.code === 0 && res.data) {
                            this._pendingMessage = {
                                _key: msgKey(),
                                role: 'ASSISTANT',
                                content: res.data.answer,
                                sources: JSON.stringify(res.data.sources || [])
                            };
                        }
                    } catch (fbErr) {
                        this.$message.error('请求失败，请重试');
                    }
                }
            } finally {
                clearTimeout(timeoutId);
                this.state.streaming = false;
                this.state.sending = false;
                this.state.streamText = '';
                // 用数组引用替换代替 push()，强制 Vue 重建 v-for 保证 v-html 执行
                if (this._pendingMessage) {
                    this.state.messages = [...this.state.messages, this._pendingMessage];
                    this.state.renderKey++;
                    this.persistMessages();
                    this._pendingMessage = null;
                    this.$nextTick(() => {
                        this.$forceUpdate();
                        this.scrollToBottom();
                    });
                }
                this.updateSessionTitleLocally();
            }
        },
        resetInputHeight() {
            const el = this.$refs.inputBox;
            if (el) el.style.height = 'auto';
        },
        updateSessionTitleLocally() {
            if (this.state.activeSessionId && this.state.messages.length) {
                const first = this.state.messages.find(m => m.role === 'USER');
                if (first) {
                    const cur = this.state.sessions.find(s => s.id === this.state.activeSessionId);
                    if (cur && (!cur.title || cur.title === '新对话')) {
                        cur.title = first.content.substring(0, 40) +
                            (first.content.length > 40 ? '…' : '');
                    }
                }
            }
        },

        // ===== 渲染 =====
        // 完整消息：全量 markdown → HTML
        renderContent(content) {
            if (!content) return '';
            try { return md2html(content); }
            catch(e) { return escapeHtml(content).replace(/\n/g, '<br/>'); }
        },
        // 流式文本：检测未闭合代码块 → 原样保留；已闭合部分 → 正常渲染
        renderStream(text) {
            if (!text) return '';
            const ticks = (text.match(/```/g) || []).length;
            if (ticks % 2 !== 0) {
                // 代码块未闭合：找到最后一个 ``` 之后的内容作为流式代码块
                const lastTick = text.lastIndexOf('```');
                const before = text.substring(0, lastTick);
                const streaming = text.substring(lastTick + 3);
                const langEnd = streaming.indexOf('\n');
                const code = langEnd > -1 ? streaming.substring(langEnd + 1) : streaming;
                return (before ? md2html(before + '\n```') : '')
                    + '<pre class="streaming-code"><code>' + escapeHtml(code) + '</code></pre>';
            }
            // 所有代码块都已闭合，直接渲染
            try { return md2html(text); }
            catch(e) { return escapeHtml(text).replace(/\n/g, '<br/>'); }
        },
        parseSources(str) {
            try { return typeof str === 'string' ? JSON.parse(str) : (str || []); }
            catch(e) { return []; }
        },
        scrollToBottom() {
            const el = this.$refs.scrollAnchor;
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' });
        },
        formatTime(t) {
            if (!t) return '';
            const d = new Date(t);
            const now = new Date();
            if (d.toDateString() === now.toDateString())
                return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            if (d.getFullYear() === now.getFullYear())
                return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
            return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
        },
    }
};
</script>

<style scoped>
/* ================================================================
   CSS 变量 — 浅色 / 深色主题
   ================================================================ */
.chat-container {
    --bg-primary: #ffffff;
    --bg-secondary: #f7f7f8;
    --bg-sidebar: #f9fafb;
    --bg-hover: #ececf1;
    --bg-user-msg: #e8f0fe;
    --bg-ai-msg: #ffffff;
    --bg-input: #ffffff;
    --border-color: #e5e5e5;
    --text-primary: #1a1a2e;
    --text-secondary: #6b7280;
    --text-muted: #9ca3af;
    --accent: #2563eb;
    --accent-hover: #1d4ed8;
    --shadow: 0 1px 3px rgba(0,0,0,.08);
    --code-bg: #f3f4f6;
    --pre-bg: #1e1e2e;
    --pre-text: #cdd6f4;
    display: flex;
    height: 100vh;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    transition: background 0.3s, color 0.3s;
}

/* 深色主题 */
.chat-container.theme-dark {
    --bg-primary: #1e1e2e;
    --bg-secondary: #181825;
    --bg-sidebar: #11111b;
    --bg-hover: #313244;
    --bg-user-msg: #2a3a5c;
    --bg-ai-msg: #1e1e2e;
    --bg-input: #181825;
    --border-color: #313244;
    --text-primary: #cdd6f4;
    --text-secondary: #a6adc8;
    --text-muted: #6c7086;
    --accent: #89b4fa;
    --accent-hover: #74c7ec;
    --shadow: 0 1px 3px rgba(0,0,0,.3);
    --code-bg: #313244;
    --pre-bg: #11111b;
    --pre-text: #cdd6f4;
}

/* ================================================================
   侧边栏
   ================================================================ */
.chat-sidebar {
    display: flex;
    flex-direction: column;
    width: 280px;
    flex-shrink: 0;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border-color);
    transition: width 0.25s ease, background 0.3s;
    overflow: hidden;
}
.chat-sidebar.collapsed { width: 56px; }

.sidebar-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 12px;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
}
.new-chat-btn {
    flex: 1;
    min-width: 0;
    border-radius: 8px;
    font-size: 13px;
}
.collapse-btn {
    padding: 4px;
    color: var(--text-secondary);
    font-size: 16px;
    flex-shrink: 0;
}

.session-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    min-height: 0;
}
.session-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    transition: background 0.15s;
    margin-bottom: 2px;
}
.session-item:hover { background: var(--bg-hover); }
.session-item.active { background: var(--bg-hover); }
.session-item .session-title {
    flex: 1;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-primary);
}
.session-item .session-time {
    font-size: 11px;
    color: var(--text-muted);
    margin-left: 8px;
    flex-shrink: 0;
}
.session-item .session-delete {
    display: none;
    font-size: 12px;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    margin-left: 4px;
}
.session-item:hover .session-delete { display: inline-block; }
.session-item .session-delete:hover { color: #ef4444; background: rgba(239,68,68,.1); }

.empty-sessions {
    text-align: center;
    padding: 30px 0;
    color: var(--text-muted);
    font-size: 13px;
}

.sidebar-footer {
    padding: 10px 12px;
    border-top: 1px solid var(--border-color);
    flex-shrink: 0;
}
.theme-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-secondary);
    transition: background 0.15s;
}
.theme-toggle:hover { background: var(--bg-hover); }
.theme-toggle i { font-size: 16px; }

/* ================================================================
   主对话区
   ================================================================ */
.chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--bg-primary);
}

.chat-topbar {
    display: flex;
    align-items: center;
    height: 52px;
    padding: 0 20px;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
    gap: 12px;
}
.sidebar-toggle {
    font-size: 18px;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 4px;
    border-radius: 6px;
    transition: background 0.15s;
}
.sidebar-toggle:hover { background: var(--bg-hover); }
.topbar-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ================================================================
   对话主体
   ================================================================ */
.chat-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    position: relative;
}

/* -- 空白占位 -- */
.chat-placeholder {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}
.placeholder-content {
    text-align: center;
    max-width: 400px;
}
.placeholder-content .logo-icon { font-size: 56px; margin-bottom: 16px; }
.placeholder-content h2 {
    font-size: 24px;
    margin: 0 0 8px;
    color: var(--text-primary);
}
.placeholder-content p {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 24px;
    line-height: 1.5;
}

/* -- 对话内容 -- */
.chat-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

/* 消息列表 */
.message-list {
    flex: 1;
    overflow-y: auto;
    padding: 20px 0;
    min-height: 0;
    scroll-behavior: smooth;
}
.scroll-anchor { height: 1px; }

/* 消息行 */
.msg-row {
    display: flex;
    gap: 12px;
    max-width: 820px;
    margin: 0 auto;
    padding: 16px 24px;
    transition: background 0.15s;
}
.msg-row:hover { background: var(--bg-secondary); }
.row-user { background: transparent; }
.row-user:hover { background: transparent; }

.msg-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
    background: var(--bg-secondary);
}
.row-user .msg-icon { background: var(--accent); }

.msg-main {
    flex: 1;
    min-width: 0;
}

.msg-content.markdown-body {
    font-size: 14px;
    line-height: 1.75;
    color: var(--text-primary);
}
.row-user .msg-content.markdown-body {
    background: var(--bg-user-msg);
    padding: 12px 16px;
    border-radius: 12px;
    display: inline-block;
    max-width: 100%;
}

/* 流式输出 */
.streaming-content { opacity: 0.9; }
.typing-cursor {
    display: inline-block;
    width: 6px;
    height: 16px;
    background: var(--accent);
    margin-left: 2px;
    vertical-align: text-bottom;
    animation: blink 0.8s infinite;
}

/* 引用来源 */
.msg-sources {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
}
.sources-label { font-size: 11px; color: var(--text-muted); }
.source-chip {
    font-size: 11px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 2px 8px;
    border-radius: 10px;
    color: var(--text-secondary);
}
.source-chip em { font-style: normal; color: var(--text-muted); }

/* ================================================================
   输入区
   ================================================================ */
.chat-input-area {
    flex-shrink: 0;
    padding: 0 24px 20px;
    max-width: 820px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
}
.input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 8px 12px;
    box-shadow: var(--shadow);
    transition: border-color 0.2s, box-shadow 0.2s;
}
.input-wrapper:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(37,99,235,.15);
}
.chat-textarea {
    flex: 1;
    border: none;
    outline: none;
    resize: none;
    font-size: 14px;
    line-height: 1.5;
    font-family: inherit;
    color: var(--text-primary);
    background: transparent;
    padding: 4px 0;
    max-height: 200px;
}
.chat-textarea::placeholder { color: var(--text-muted); }
.chat-textarea:disabled { opacity: 0.6; }
.send-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: var(--accent);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s, opacity 0.15s;
    font-size: 16px;
}
.send-btn:hover:not(:disabled) { background: var(--accent-hover); }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.send-btn.loading i { animation: spin 1s linear infinite; }
.input-hint {
    text-align: center;
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 8px;
}

/* ================================================================
   动画
   ================================================================ */
@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>

<!-- 非 scoped：Markdown 渲染样式，v-html 注入的 HTML 需要全局样式才能生效 -->
<style>
.chat-container .markdown-body p { margin: 0 0 10px; }
.chat-container .markdown-body p:last-child { margin-bottom: 0; }
.chat-container .markdown-body strong { font-weight: 700; color: var(--text-primary); }
.chat-container .markdown-body a { color: var(--accent); text-decoration: none; }
.chat-container .markdown-body a:hover { text-decoration: underline; }
.chat-container .markdown-body h1, .chat-container .markdown-body h2,
.chat-container .markdown-body h3, .chat-container .markdown-body h4 {
    margin: 16px 0 8px; font-weight: 600; line-height: 1.35; color: var(--text-primary);
}
.chat-container .markdown-body h1 { font-size: 22px; font-weight: 700; margin: 18px 0 10px; color: var(--text-primary); }
.chat-container .markdown-body h2 { font-size: 18px; font-weight: 700; padding-bottom: 6px; border-bottom: 2px solid var(--accent); margin: 18px 0 10px; color: var(--text-primary); }
.chat-container .markdown-body h3 { font-size: 16px; font-weight: 600; margin: 14px 0 8px; }
.chat-container .markdown-body h4 { font-size: 14px; font-weight: 600; }
.chat-container .markdown-body ul, .chat-container .markdown-body ol { padding-left: 22px; margin: 6px 0; }
.chat-container .markdown-body li { margin-bottom: 4px; }
.chat-container .markdown-body blockquote {
    border-left: 3px solid var(--accent); padding: 6px 14px; margin: 10px 0;
    color: var(--text-secondary); background: var(--bg-secondary); border-radius: 0 6px 6px 0;
}
.chat-container .markdown-body table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 13px; }
.chat-container .markdown-body th, .chat-container .markdown-body td {
    border: 1px solid var(--border-color); padding: 8px 12px; text-align: left;
}
.chat-container .markdown-body th { background: var(--bg-secondary); font-weight: 600; }
.chat-container .markdown-body code {
    background: var(--code-bg); color: #e03e3e; padding: 2px 6px; border-radius: 4px;
    font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace; font-size: 0.88em;
}
.chat-container .markdown-body pre {
    background: var(--pre-bg); color: var(--pre-text); padding: 16px; border-radius: 10px;
    overflow-x: auto; margin: 12px 0; line-height: 1.55; font-size: 13px;
}
.chat-container .markdown-body pre code { background: transparent; color: inherit; padding: 0; border-radius: 0; font-size: inherit; }
.chat-container .markdown-body hr { border: none; border-top: 1px solid var(--border-color); margin: 16px 0; }

.chat-container .row-user .markdown-body code { background: rgba(255,255,255,0.2); color: #fff; }
.chat-container .row-user .markdown-body blockquote { border-left-color: rgba(255,255,255,0.4); color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.1); }
.chat-container .row-user .markdown-body a { color: #ffd04b; }
.chat-container .row-user .markdown-body th { background: rgba(255,255,255,0.15); }
.chat-container .row-user .markdown-body td, .chat-container .row-user .markdown-body table { border-color: rgba(255,255,255,0.2); }
.chat-container .streaming-code {
    background: var(--pre-bg); color: var(--pre-text); padding: 16px; border-radius: 10px;
    overflow-x: auto; margin: 12px 0; line-height: 1.55; font-size: 13px;
}
.chat-container .streaming-code code { background: transparent; color: inherit; padding: 0; font-size: inherit; }
</style>
