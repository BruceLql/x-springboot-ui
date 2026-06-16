<template>
    <div class="ai-interview-container layout-padding">
        <!-- 面试未开始：选择方向 -->
        <el-card shadow="hover" class="layout-padding-auto" v-if="!state.started && !state.showSessions">
            <div class="interview-start">
                <h2>🤖 AI 模拟面试</h2>
                <p class="subtitle">选择面试方向，AI 将基于知识库内容进行深度追问和评分</p>
                <el-row :gutter="15" class="direction-grid">
                    <el-col :span="8" v-for="d in directions" :key="d.value">
                        <el-card shadow="hover" class="direction-card" @click.native="onStart(d.value)">
                            <div class="direction-icon">{{ d.icon }}</div>
                            <div class="direction-name">{{ d.label }}</div>
                            <div class="direction-desc">{{ d.desc }}</div>
                        </el-card>
                    </el-col>
                </el-row>
                <el-divider/>
                <el-button type="text" @click="fetchHistory">📋 查看历史面试记录</el-button>
            </div>
        </el-card>

        <!-- 历史记录 -->
        <el-card shadow="hover" class="layout-padding-auto" v-if="state.showSessions && !state.started">
            <div class="history-header">
                <h3>📋 面试历史记录</h3>
                <el-button type="primary" size="small" @click="state.showSessions = false">返回开始</el-button>
            </div>
            <el-table :data="state.interviewSessions" v-loading="state.loadingSessions">
                <el-table-column prop="title" label="面试标题" min-width="180"/>
                <el-table-column prop="interviewDirectionDesc" label="方向" width="100"/>
                <el-table-column prop="difficultyLevelDesc" label="最高难度" width="100"/>
                <el-table-column prop="totalScore" label="综合评分" width="100">
                    <template #default="{row}">
                        <el-tag :type="scoreColor(row.totalScore)">{{ row.totalScore || '-' }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="时间" width="170"/>
                <el-table-column label="操作" width="100">
                    <template #default="{row}">
                        <el-button size="small" text type="primary" @click="onViewReport(row)">查看报告</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 面试进行中 -->
        <el-card shadow="hover" class="layout-padding-auto interview-flow" v-if="state.started">
            <!-- 进度条 -->
            <div class="interview-progress mb20">
                <el-steps :active="state.questionIndex" finish-status="success" align-center>
                    <el-step v-for="i in state.totalQuestions" :key="i"
                        :title="'Q'+i" :description="i <= state.questionIndex ? (i < state.questionIndex ? '✅' : '🔄') : ''"/>
                </el-steps>
            </div>

            <!-- 面试标题 -->
            <div class="interview-info">
                <el-tag type="primary">{{ state.direction }}</el-tag>
                <el-tag class="ml10" :type="difficultyColor(state.difficulty)">{{ state.difficulty }}级</el-tag>
                <span class="ml10">第 {{ state.questionIndex }} / {{ state.totalQuestions }} 题</span>
            </div>

            <!-- 当前问题 -->
            <el-alert :title="'面试官提问'" type="warning" :closable="false" class="mt15"/>
            <div class="question-box mt10">
                <div class="question-text">{{ state.currentQuestion }}</div>
            </div>

            <!-- 追问标识 -->
            <el-alert v-if="state.isFollowUp" title="追问（请针对上一题深入回答）" type="info" :closable="false" class="mt10"/>

            <!-- 提交回答 -->
            <div class="answer-area mt20">
                <el-input v-model="state.answer" type="textarea" :rows="5" placeholder="输入你的回答...（支持Shift+Enter换行）"
                    :disabled="state.submitting" @keydown.enter.native="onSubmitAnswer($event)"/>
                <div class="answer-actions mt10">
                    <el-button @click="onSkip" :disabled="state.submitting">跳过</el-button>
                    <el-button type="danger" @click="onEndInterview" :disabled="state.submitting">结束面试</el-button>
                    <el-button type="primary" :loading="state.submitting" @click="onSubmitAnswer()"
                        :disabled="!state.answer.trim()">
                        提交回答
                    </el-button>
                </div>
            </div>

            <!-- 评价反馈 -->
            <div v-if="state.lastEvaluation" class="evaluation-area mt20">
                <el-card shadow="never">
                    <div class="eval-header">
                        <h4>📊 上题评分</h4>
                        <el-tag :type="scoreColor(state.lastEvaluation.total)" size="medium">
                            {{ state.lastEvaluation.total }} 分
                        </el-tag>
                    </div>
                    <el-row :gutter="20" class="mt10">
                        <el-col :span="8">
                            <div class="score-item">正确性 <strong>{{ state.lastEvaluation.correctness }}</strong>/10</div>
                        </el-col>
                        <el-col :span="8">
                            <div class="score-item">深度 <strong>{{ state.lastEvaluation.depth }}</strong>/10</div>
                        </el-col>
                        <el-col :span="8">
                            <div class="score-item">表达 <strong>{{ state.lastEvaluation.expression }}</strong>/10</div>
                        </el-col>
                    </el-row>
                    <div class="eval-comment mt10">{{ state.lastEvaluation.comment }}</div>
                    <div class="eval-reference mt10" v-if="state.lastEvaluation.referenceAnswer">
                        <strong>参考答案：</strong>{{ state.lastEvaluation.referenceAnswer }}
                    </div>
                </el-card>
            </div>
        </el-card>

        <!-- 面试报告弹窗 -->
        <el-dialog :visible.sync="state.reportShow" title="📊 面试评价报告" width="650px" :close-on-click-modal="false">
            <div v-if="state.report" class="report-content">
                <div class="report-score">
                    <span class="score-number">{{ state.report.totalScore }}</span>
                    <span class="score-label">综合评分</span>
                </div>
                <!-- 维度评分 -->
                <h4 class="mt20">知识维度评分</h4>
                <div v-for="(score, dim) in state.report.dimensions" :key="dim" class="dimension-item mt10">
                    <span class="dim-label">{{ dim }}</span>
                    <el-progress :percentage="score * 10" :color="progressColor(score)"/>
                </div>
                <!-- 优势/不足 -->
                <el-row :gutter="15" class="mt20">
                    <el-col :span="12">
                        <h4>✅ 优势</h4>
                        <el-tag v-for="t in state.report.strengthTags" :key="t" type="success" class="tag-item">{{ t }}</el-tag>
                        <span v-if="!state.report.strengthTags || state.report.strengthTags.length===0" class="text-muted">无</span>
                    </el-col>
                    <el-col :span="12">
                        <h4>📌 待提升</h4>
                        <el-tag v-for="t in state.report.weaknessTags" :key="t" type="danger" class="tag-item">{{ t }}</el-tag>
                        <span v-if="!state.report.weaknessTags || state.report.weaknessTags.length===0" class="text-muted">无</span>
                    </el-col>
                </el-row>
                <!-- 总结 -->
                <h4 class="mt20">📝 总结</h4>
                <p>{{ state.report.summary }}</p>
                <h4 class="mt10">💡 学习建议</h4>
                <p>{{ state.report.suggestions }}</p>
                <!-- 推荐文档 -->
                <h4 v-if="state.report.recommendedDocs && state.report.recommendedDocs.length" class="mt10">📚 推荐阅读</h4>
                <el-tag v-for="d in state.report.recommendedDocs" :key="d" type="info" class="tag-item">{{ d }}</el-tag>
            </div>
            <span slot="footer">
                <el-button @click="state.reportShow = false; state.started = false; fetchHistory()">关闭</el-button>
                <el-button type="primary" @click="state.reportShow = false; state.started = false; fetchHistory()">再来一次</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import { useInterviewApi } from '@/api/ai/index';

export default {
    name: 'aiInterview',
    data() {
        return {
            directions: [
                { value: 'JAVA_BASIC', label: 'Java基础', icon: '☕', desc: 'JVM、集合、并发、新特性' },
                { value: 'SPRING_ECOSYSTEM', label: 'Spring生态', icon: '🍃', desc: 'IOC/AOP、Boot、MVC、事务' },
                { value: 'DATABASE', label: '数据库', icon: '🗄️', desc: 'MySQL索引/锁、Redis缓存' },
                { value: 'DISTRIBUTED', label: '分布式系统', icon: '🌐', desc: '分布式理论、事务、MQ、微服务' },
                { value: 'SYSTEM_DESIGN', label: '系统设计', icon: '🏗️', desc: '秒杀、短链、限流、电商链路' },
                { value: 'COMPREHENSIVE', label: '综合', icon: '🎯', desc: '随机混合所有方向' },
            ],
            state: {
                started: false,
                showSessions: false,
                sessionId: null,
                direction: '',
                difficulty: '初级',
                questionIndex: 1,
                totalQuestions: 10,
                currentQuestion: '',
                isFollowUp: false,
                answer: '',
                submitting: false,
                lastEvaluation: null,
                report: null,
                reportShow: false,
                interviewSessions: [],
                loadingSessions: false,
            }
        };
    },
    methods: {
        async onStart(direction) {
            try {
                const res = await useInterviewApi().start({ direction });
                if (res.code === 0) {
                    const d = res.data;
                    this.state.started = true;
                    this.state.showSessions = false;
                    this.state.sessionId = d.sessionId;
                    this.state.direction = d.direction;
                    this.state.questionIndex = d.questionIndex;
                    this.state.totalQuestions = d.totalQuestions;
                    this.state.currentQuestion = d.question;
                    this.state.answer = '';
                    this.state.lastEvaluation = null;
                } else {
                    this.$message.error(res.msg || '启动失败');
                }
            } catch(e) { this.$message.error('请求失败'); }
        },
        async onSubmitAnswer(e) {
            if (e && e.shiftKey) return;
            if (e) e.preventDefault();
            if (!this.state.answer.trim()) return;

            this.state.submitting = true;
            try {
                const res = await useInterviewApi().answer({
                    sessionId: this.state.sessionId,
                    answer: this.state.answer.trim()
                });
                if (res.code === 0) {
                    const d = res.data;
                    if (d.type === 'end') {
                        // 面试结束
                        this.state.report = d.report;
                        this.state.reportShow = true;
                        this.state.started = false;
                    } else if (d.type === 'followUp') {
                        // 追问
                        this.state.currentQuestion = d.question;
                        this.state.isFollowUp = true;
                        this.state.lastEvaluation = d.scores;
                        this.state.answer = '';
                    } else {
                        // 下一题
                        this.state.questionIndex = d.questionIndex;
                        this.state.currentQuestion = d.question;
                        this.state.difficulty = d.difficulty || this.state.difficulty;
                        this.state.isFollowUp = false;
                        this.state.lastEvaluation = null;
                        this.state.answer = '';
                    }
                } else {
                    this.$message.error(res.msg);
                }
            } catch(e) { this.$message.error('请求失败'); }
            finally { this.state.submitting = false; }
        },
        async onSkip() {
            try {
                const res = await useInterviewApi().skip(this.state.sessionId);
                if (res.code === 0) {
                    const d = res.data;
                    if (d.type === 'end') {
                        this.state.report = d.report;
                        this.state.reportShow = true;
                        this.state.started = false;
                    } else {
                        this.state.questionIndex = d.questionIndex;
                        this.state.currentQuestion = d.question;
                        this.state.isFollowUp = false;
                        this.state.lastEvaluation = null;
                        this.state.answer = '';
                    }
                }
            } catch(e) { this.$message.error('请求失败'); }
        },
        async onEndInterview() {
            this.$confirm('确定结束面试并生成报告?', '提示', { type: 'warning' }).then(async () => {
                const res = await useInterviewApi().end(this.state.sessionId);
                if (res.code === 0 && res.data) {
                    this.state.report = res.data.report;
                    this.state.reportShow = true;
                    this.state.started = false;
                }
            }).catch(() => {});
        },
        async fetchHistory() {
            this.state.loadingSessions = true;
            this.state.showSessions = true;
            try {
                const res = await useInterviewApi().listSessions();
                if (res.code === 0) {
                    this.state.interviewSessions = (res.data || []).map(s => ({
                        ...s,
                        interviewDirectionDesc: s.interviewDirection || '-',
                        difficultyLevelDesc: s.difficultyLevel || '-'
                    }));
                }
            } finally { this.state.loadingSessions = false; }
        },
        async onViewReport(row) {
            try {
                const res = await useInterviewApi().getDetail(row.id);
                if (res.code === 0) {
                    const session = res.data.session;
                    if (session && session.report) {
                        try {
                            this.state.report = typeof session.report === 'string'
                                ? JSON.parse(session.report) : session.report;
                        } catch(e) {
                            this.state.report = { totalScore: session.totalScore, summary: session.report };
                        }
                        this.state.reportShow = true;
                    } else {
                        this.$message.info('该面试记录暂无报告');
                    }
                }
            } catch(e) { this.$message.error('请求失败'); }
        },
        scoreColor(score) {
            if (!score) return 'info';
            const s = Number(score);
            if (s >= 8) return 'success';
            if (s >= 6) return 'warning';
            return 'danger';
        },
        difficultyColor(level) {
            if (level === '高级') return 'danger';
            if (level === '中级') return 'warning';
            return 'success';
        },
        progressColor(score) {
            if (score >= 8) return '#67c23a';
            if (score >= 6) return '#e6a23c';
            return '#f56c6c';
        }
    }
};
</script>

<style scoped>
.interview-start { text-align: center; padding: 30px; }
.subtitle { color: #909399; margin-bottom: 30px; }
.direction-grid { padding: 0 40px; }
.direction-card { cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
.direction-card:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.direction-icon { font-size: 32px; margin-bottom: 8px; }
.direction-name { font-size: 16px; font-weight: bold; color: #303133; margin-bottom: 6px; }
.direction-desc { font-size: 12px; color: #909399; }

.history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }

.interview-flow .question-box {
    background: #fdf6ec; border: 1px solid #faecd8;
    border-radius: 8px; padding: 16px;
}
.question-text { font-size: 15px; color: #303133; white-space: pre-wrap; line-height: 1.6; }
.answer-actions { display: flex; justify-content: flex-end; gap: 10px; }

.evaluation-area .eval-header { display: flex; justify-content: space-between; align-items: center; }
.score-item { font-size: 13px; color: #606266; }
.score-item strong { color: #303133; }
.eval-comment { color: #409eff; font-size: 13px; }
.eval-reference { background: #f5f7fa; padding: 10px; border-radius: 4px; font-size: 13px; color: #606266; }

.report-content .report-score { text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: #fff; }
.score-number { font-size: 42px; font-weight: bold; display: block; }
.score-label { font-size: 14px; opacity: 0.8; }

.dimension-item { display: flex; align-items: center; gap: 10px; }
.dim-label { width: 80px; font-size: 13px; color: #606266; }

.tag-item { margin-right: 6px; margin-bottom: 6px; }
.text-muted { color: #c0c4cc; font-size: 13px; }
</style>
