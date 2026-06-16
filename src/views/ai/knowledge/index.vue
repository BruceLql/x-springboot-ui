<template>
    <div class="ai-knowledge-container layout-padding">
        <el-card shadow="hover" class="layout-padding-auto">
            <!-- 工具栏 -->
            <div class="toolbar mb15">
                <el-select v-model="state.category" placeholder="分类筛选" style="width:180px" clearable size="default">
                    <el-option label="Java基础" value="01-Java基础"/>
                    <el-option label="Spring生态" value="02-Spring生态"/>
                    <el-option label="数据库" value="03-数据库"/>
                    <el-option label="分布式系统" value="04-分布式系统"/>
                    <el-option label="系统设计" value="05-系统设计"/>
                    <el-option label="AI知识" value="12-AI知识"/>
                </el-select>
                <el-button type="primary" size="default" class="ml10" @click="fetchData">
                    <el-icon><ele-Search/></el-icon> 查询
                </el-button>
                <el-button type="success" size="default" class="ml10" :loading="state.importing" @click="onImport">
                    <el-icon><ele-FolderAdd/></el-icon> 导入知识库
                </el-button>
                <el-button type="warning" size="default" class="ml10" :loading="state.reloading" @click="onReload">
                    <el-icon><ele-RefreshRight/></el-icon> 重新加载
                </el-button>
            </div>

            <!-- 搜索框 -->
            <div class="search-bar mb15">
                <el-input v-model="state.searchQuery" placeholder="语义搜索：输入关键词搜索相关知识..." style="max-width:400px" size="default" clearable
                    @keyup.enter.native="onSearch"/>
                <el-button type="primary" size="default" class="ml10" :loading="state.searching" @click="onSearch">
                    <el-icon><ele-Search/></el-icon> 语义搜索
                </el-button>
            </div>

            <!-- 搜索结果 -->
            <el-alert v-if="state.searchResults !== null" :title="'搜到 ' + state.searchResultCount + ' 条结果'" type="info" closable @close="state.searchResults=null" class="mb15"/>
            <div v-if="state.searchResults && state.searchResults.length > 0" class="search-results mb15">
                <el-card v-for="(item, idx) in state.searchResults" :key="idx" shadow="never" class="mb10 result-card">
                    <div class="result-header">
                        <el-tag size="small">{{ item.category }}</el-tag>
                        <strong class="ml10">{{ item.title }}</strong>
                        <span class="score">相关度: {{ (item.score * 100).toFixed(1) }}%</span>
                    </div>
                    <div class="result-content mt10 markdown-body" v-html="renderContent(truncate(item.content, 500))"></div>
                </el-card>
            </div>

            <!-- 文档列表 -->
            <el-table :data="state.tableData" v-loading="state.loading" style="width:100%">
                <el-table-column type="index" label="序号" width="60"/>
                <el-table-column prop="title" label="文档标题" show-overflow-tooltip min-width="180"/>
                <el-table-column prop="category" label="分类" width="120">
                    <template #default="{row}">
                        <el-tag size="small">{{ row.category }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="chunkCount" label="分块数" width="80"/>
                <el-table-column prop="wordCount" label="字数" width="100"/>
                <el-table-column prop="status" label="状态" width="80">
                    <template #default="{row}">
                        <el-tag :type="row.status==='ACTIVE'?'success':'info'" size="small">{{ row.status==='ACTIVE'?'正常':'已删除' }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="导入时间" width="170"/>
                <el-table-column label="操作" width="120">
                    <template #default="{row}">
                        <el-button size="small" text type="primary" @click="onViewDetail(row)">详情</el-button>
                        <el-button size="small" text type="danger" @click="onDelete(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                class="mt15" :pager-count="5" :page-sizes="[10,20,30]"
                :current-page="state.page" background
                :page-size="state.size"
                layout="total, sizes, prev, pager, next, jumper"
                :total="state.total"/>
        </el-card>

        <!-- 导入结果弹窗 -->
        <el-dialog :visible.sync="state.importDialogShow" title="导入结果" width="400px">
            <el-result icon="success" title="导入完成">
                <template #subTitle>
                    文件数: {{ state.importResult.totalFiles }} | 分块数: {{ state.importResult.totalChunks }}
                </template>
            </el-result>
        </el-dialog>

        <!-- 文档详情弹窗 -->
        <el-dialog :visible.sync="state.detailShow" :title="state.detailTitle" width="800px" top="5vh">
            <div v-if="state.detailLoading" style="text-align:center;padding:40px;">
                <i class="el-icon-loading" style="font-size:24px;"></i>
            </div>
            <div v-else class="detail-body markdown-body" v-html="state.detailContent"></div>
        </el-dialog>
    </div>
</template>

<script>
import { useKnowledgeApi } from '@/api/ai/index';

function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function md2html(text) {
    if (!text) return '';
    const codeBlocks = [];
    text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        const idx = codeBlocks.length;
        codeBlocks.push('<pre><code>' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre>');
        return '%%CODEBLOCK_' + idx + '%%';
    });
    text = text.replace(/((?:^\|.+\|\n?)+)/gm, function(block) {
        const rows = block.trim().split('\n'); if (rows.length < 2) return block;
        let html = '<table>';
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].split('|').filter(c => c.trim());
            if (cells.every(c => /^[-:]+$/.test(c.trim()))) continue;
            const tag = i === 0 ? 'th' : 'td';
            html += '<tr>' + cells.map(c => '<' + tag + '>' + c.trim() + '</' + tag + '>').join('') + '</tr>';
        }
        return html + '</table>';
    });
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/^####\s*(.+)$/gm, '<h4>$1</h4>');
    text = text.replace(/^###\s*(.+)$/gm, '<h3>$1</h3>');
    text = text.replace(/^##\s*(.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^#\s*(.+)$/gm, '<h1>$1</h1>');
    text = text.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
    text = text.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
    text = text.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');
    text = text.replace(/^---$/gm, '<hr>');
    text = text.replace(/^---(?=\S)/gm, '<hr>');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    text = text.replace(/%%CODEBLOCK_(\d+)%%/g, (_, i) => codeBlocks[i]);
    text = text.replace(/\n\n/g, '</p><p>');
    text = text.replace(/\n/g, '<br>');
    return '<p>' + text + '</p>';
}

export default {
    name: 'aiKnowledge',
    data() {
        return {
            state: {
                tableData: [],
                loading: false,
                page: 1, size: 10, total: 0,
                category: '',
                importing: false, reloading: false,
                searchQuery: '', searching: false,
                searchResults: null, searchResultCount: 0,
                importDialogShow: false, importResult: {},
                detailShow: false, detailTitle: '', detailContent: '', detailLoading: false,
            }
        };
    },
    mounted() { this.fetchData(); },
    methods: {
        async fetchData() {
            this.state.loading = true;
            try {
                const res = await useKnowledgeApi().list({
                    page: this.state.page, size: this.state.size, category: this.state.category
                });
                if (res.code === 0) {
                    this.state.tableData = res.data || [];
                    this.state.total = res.page?.total || 0;
                }
            } finally { this.state.loading = false; }
        },
        async onImport() {
            this.state.importing = true;
            try {
                const res = await useKnowledgeApi().importAll();
                if (res.code === 0) {
                    this.state.importResult = res.data;
                    this.state.importDialogShow = true;
                    this.fetchData();
                }
            } finally { this.state.importing = false; }
        },
        async onReload() {
            this.$confirm('将清空所有知识库并重新导入，确认?', '提示', { type: 'warning' }).then(async () => {
                this.state.reloading = true;
                try {
                    const res = await useKnowledgeApi().reload();
                    if (res.code === 0) {
                        this.$message.success('重载成功');
                        this.fetchData();
                    }
                } finally { this.state.reloading = false; }
            }).catch(() => {});
        },
        async onSearch() {
            if (!this.state.searchQuery) { this.$message.warning('请输入搜索关键词'); return; }
            this.state.searching = true;
            this.state.searchResults = null;
            try {
                const res = await useKnowledgeApi().search({
                    query: this.state.searchQuery, topK: 5
                });
                if (res.code === 0) {
                    this.state.searchResults = res.data || [];
                    this.state.searchResultCount = this.state.searchResults.length;
                }
            } finally { this.state.searching = false; }
        },
        async onViewDetail(row) {
            this.state.detailShow = true;
            this.state.detailTitle = row.title;
            this.state.detailLoading = true;
            this.state.detailContent = '';
            try {
                const res = await useKnowledgeApi().info(row.id);
                if (res.code === 0 && res.data) {
                    const info = res.data;
                    let content = '';
                    if (info.content) {
                        content = info.content;
                    } else if (info.chunks && Array.isArray(info.chunks)) {
                        content = info.chunks.map(c => c.text || c.content || '').join('\n\n---\n\n');
                    } else {
                        content = JSON.stringify(info, null, 2);
                    }
                    this.state.detailContent = this.renderContent(content);
                } else {
                    this.state.detailContent = '<p style="color:#909399;">无法加载文档内容</p>';
                }
            } catch(e) {
                this.state.detailContent = '<p style="color:#f56c6c;">加载失败</p>';
            } finally {
                this.state.detailLoading = false;
            }
        },
        async onDelete(row) {
            this.$confirm('确定删除该文档?', '提示', { type: 'warning' }).then(async () => {
                const res = await useKnowledgeApi().delete(row.id);
                if (res.code === 0) { this.$message.success('删除成功'); this.fetchData(); }
            }).catch(() => {});
        },
        handleSizeChange(val) { this.state.size = val; this.fetchData(); },
        handleCurrentChange(val) { this.state.page = val; this.fetchData(); },
        truncate(str, len) { return str && str.length > len ? str.substring(0, len) + '...' : str; },
        renderContent(content) {
            if (!content) return '';
            try { return md2html(content); }
            catch(e) { return escapeHtml(content).replace(/\n/g, '<br/>'); }
        },
    }
};
</script>

<style scoped>
.ai-knowledge-container .toolbar { display: flex; align-items: center; }
.search-results .result-card { border-left: 3px solid #409eff; }
.result-header { display: flex; align-items: center; }
.result-header .score { margin-left: auto; color: #909399; font-size: 12px; }
.result-content { color: #606266; font-size: 13px; line-height: 1.6; }
.result-content >>> p { margin: 0 0 6px; }
.result-content >>> pre { background: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 12px; line-height: 1.5; }
.result-content >>> code { background: #f0f2f5; color: #e03e3e; padding: 1px 5px; border-radius: 3px; font-family: monospace; font-size: 12px; }
.result-content >>> pre code { background: transparent; color: inherit; padding: 0; }
.result-content >>> ul, .result-content >>> ol { padding-left: 20px; margin: 4px 0; }
.result-content >>> blockquote { border-left: 3px solid #dcdfe6; padding: 4px 10px; margin: 6px 0; color: #909399; }

/* 详情弹窗 markdown 样式 */
.detail-body { color: #303133; font-size: 14px; line-height: 1.8; }
.detail-body >>> h1, .detail-body >>> h2, .detail-body >>> h3, .detail-body >>> h4 { margin: 16px 0 8px; font-weight: 600; }
.detail-body >>> h1 { font-size: 1.6em; border-bottom: 1px solid #eee; padding-bottom: 8px; }
.detail-body >>> h2 { font-size: 1.4em; border-bottom: 1px solid #eee; padding-bottom: 6px; }
.detail-body >>> h3 { font-size: 1.2em; }
.detail-body >>> h4 { font-size: 1.1em; }
.detail-body >>> p { margin: 8px 0; }
.detail-body >>> a { color: #409eff; }
.detail-body >>> ul, .detail-body >>> ol { padding-left: 24px; margin: 8px 0; }
.detail-body >>> li { margin: 4px 0; }
.detail-body >>> blockquote { border-left: 4px solid #409eff; padding: 8px 16px; margin: 12px 0; color: #606266; background: #f5f7fa; border-radius: 0 4px 4px 0; }
.detail-body >>> table { border-collapse: collapse; width: 100%; margin: 12px 0; }
.detail-body >>> th, .detail-body >>> td { border: 1px solid #dcdfe6; padding: 8px 12px; text-align: left; }
.detail-body >>> th { background: #f5f7fa; font-weight: 600; }
.detail-body >>> tr:nth-child(even) { background: #fafafa; }
.detail-body >>> img { max-width: 100%; border-radius: 4px; }
.detail-body >>> hr { border: none; border-top: 1px solid #eee; margin: 16px 0; }

/* 代码块样式 */
.detail-body >>> pre { background: #0d1117; border-radius: 8px; padding: 16px; overflow-x: auto; margin: 12px 0; line-height: 1.6; font-size: 13px; border: 1px solid #30363d; }
.detail-body >>> pre code { background: transparent; color: #c9d1d9; padding: 0; font-family: 'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace; font-size: 13px; white-space: pre; }
.detail-body >>> code:not(pre code) { background: #f0f2f5; color: #e03e3e; padding: 2px 6px; border-radius: 3px; font-family: 'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace; font-size: 0.9em; }
</style>
