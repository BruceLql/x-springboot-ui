<template>
    <div class="live-task-container layout-padding">
        <el-card shadow="hover" class="layout-padding-auto">
            <div class="system-user-search mb15">
                <el-select size="default" v-model="state.tableData.param.platform" placeholder="平台"
                           style="max-width: 130px" clearable>
                    <el-option label="抖音" value="DOUYIN"></el-option>
                    <el-option label="TikTok" value="TIKTOK"></el-option>
                </el-select>
                <el-select size="default" v-model="state.tableData.param.taskStatus" placeholder="状态"
                           style="max-width: 140px; margin-left: 10px" clearable>
                    <el-option label="待监控" value="PENDING"></el-option>
                    <el-option label="监控中" value="MONITORING"></el-option>
                    <el-option label="已停止" value="STOPPED"></el-option>
                    <el-option label="异常中断" value="INTERRUPTED"></el-option>
                    <el-option label="已过期" value="EXPIRED"></el-option>
                </el-select>
                <el-input size="default" v-model="state.tableData.param.roomUrl" placeholder="直播间URL"
                          style="max-width: 200px; margin-left: 10px" clearable></el-input>
                <el-input size="default" v-model="state.tableData.param.anchorName" placeholder="主播名称"
                          style="max-width: 160px; margin-left: 10px" clearable></el-input>
                <el-button size="default" type="primary" class="ml10" @click="fetchData()">
                    <el-icon><ele-Search/></el-icon>
                    查询
                </el-button>
                <el-button size="default" type="success" class="ml10" @click="onOpenCreate">
                    <el-icon><ele-FolderAdd/></el-icon>
                    新增任务
                </el-button>
                <el-button size="default" type="warning" class="ml10" @click="onOpenCompare"
                           :disabled="state.selectedRows.length < 2 || state.selectedRows.length > 3">
                    <el-icon><ele-DataLine/></el-icon>
                    对比选中 ({{ state.selectedRows.length }})
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%"
                      @selection-change="handleSelectionChange" ref="tableRef">
                <el-table-column type="selection" width="55" :selectable="selectableCheck"></el-table-column>
                <el-table-column type="index" label="序号" width="60"/>
                <el-table-column prop="taskId" label="任务ID" width="180" show-overflow-tooltip></el-table-column>
                <el-table-column prop="platformDesc" label="平台" width="90"></el-table-column>
                <el-table-column prop="taskName" label="任务名称" width="150" show-overflow-tooltip></el-table-column>
                <el-table-column prop="roomUrl" label="直播间URL" min-width="200" show-overflow-tooltip></el-table-column>
                <el-table-column prop="anchorName" label="主播" width="120" show-overflow-tooltip>
                    <template #default="scope">
                        {{ scope.row.anchorName || '-' }}
                    </template>
                </el-table-column>
                <el-table-column prop="taskStatusDesc" label="状态" width="100">
                    <template #default="scope">
                        <el-tag :type="getStatusTagType(scope.row.taskStatus)">{{ scope.row.taskStatusDesc }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="当前在线" width="100">
                    <template #default="scope">
                        <span class="online-num">{{ scope.row.onlineDisplay || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="实时采集数据" min-width="340">
                    <template #default="scope">
                        <div class="metric-inline">
                            <span v-if="scope.row.collectChat" class="metric-item" :class="{ 'metric-zero': !(scope.row.statistics && scope.row.statistics.chatCount) }">
                                <i class="metric-dot" style="background:#00b8d4"></i>聊天
                                <em>{{ scope.row.statistics && scope.row.statistics.chatCount || 0 }}</em>
                            </span>
                            <span v-if="scope.row.collectGift" class="metric-item" :class="{ 'metric-zero': !(scope.row.statistics && scope.row.statistics.giftCount) }">
                                <i class="metric-dot" style="background:#f56c6c"></i>礼物
                                <em>{{ scope.row.statistics && scope.row.statistics.giftCount || 0 }}</em>
                            </span>
                            <span v-if="scope.row.collectLike" class="metric-item" :class="{ 'metric-zero': !(scope.row.statistics && scope.row.statistics.likeCount) }">
                                <i class="metric-dot" style="background:#e6a23c"></i>点赞
                                <em>{{ scope.row.statistics && scope.row.statistics.likeCount || 0 }}</em>
                            </span>
                            <span v-if="scope.row.collectUser" class="metric-item" :class="{ 'metric-zero': !(scope.row.statistics && scope.row.statistics.userEnterCount) }">
                                <i class="metric-dot" style="background:#909399"></i>进入
                                <em>{{ scope.row.statistics && scope.row.statistics.userEnterCount || 0 }}</em>
                            </span>
                            <span v-if="scope.row.collectEcom" class="metric-item" :class="{ 'metric-zero': !(scope.row.statistics && scope.row.statistics.ecomOrderCount) }">
                                <i class="metric-dot" style="background:#ff3d71"></i>下单
                                <em>{{ scope.row.statistics && scope.row.statistics.ecomOrderCount || 0 }}</em>
                            </span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="startTime" label="开始时间" width="160" show-overflow-tooltip></el-table-column>
                <el-table-column prop="createTime" label="创建时间" width="160" show-overflow-tooltip></el-table-column>
                <el-table-column label="操作" width="280" fixed="right">
                    <template #default="scope">
                        <el-button size="small" text type="primary" @click="onViewDetail(scope.row)">详情</el-button>
                        <el-button v-if="scope.row.taskStatus === 'PENDING' || scope.row.taskStatus === 'STOPPED' || scope.row.taskStatus === 'INTERRUPTED'"
                                   size="small" text type="success" @click="onStartTask(scope.row)">启动</el-button>
                        <el-button v-if="scope.row.taskStatus === 'MONITORING'"
                                   size="small" text type="warning" @click="onStopTask(scope.row)">停止</el-button>
                        <el-button v-if="scope.row.taskStatus !== 'MONITORING'"
                                   size="small" text type="primary" @click="onOpenEdit(scope.row)">编辑</el-button>
                        <el-button v-if="scope.row.taskStatus !== 'MONITORING'"
                                   size="small" text type="danger" @click="onRowDel(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                    class="mt15"
                    :pager-count="5"
                    :page-sizes="[10, 20, 30]"
                    :current-page="state.tableData.param.page"
                    background
                    :page-size="state.tableData.param.size"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="state.tableData.total"
            >
            </el-pagination>
        </el-card>

        <!-- 创建/编辑任务弹窗 -->
        <el-dialog :title="state.dialog.title" :visible.sync="state.dialog.isShowDialog" width="600px">
            <el-form ref="taskFormRef" :model="state.ruleForm" :rules="state.rules" size="default" label-width="120px">
                <el-row :gutter="35">
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="平台" prop="platform">
                            <el-select v-model="state.ruleForm.platform" placeholder="请选择平台" class="w100"
                                       :disabled="state.dialog.type === 'edit'">
                                <el-option label="抖音" value="DOUYIN"></el-option>
                                <el-option label="TikTok" value="TIKTOK"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="任务名称" prop="taskName">
                            <el-input v-model="state.ruleForm.taskName" placeholder="请输入任务名称" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="直播间URL" prop="roomUrl">
                            <el-input v-model="state.ruleForm.roomUrl" placeholder="请输入直播间URL" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="采集配置">
                            <el-checkbox v-model="state.ruleForm.collectChat">聊天</el-checkbox>
                            <el-checkbox v-model="state.ruleForm.collectGift">礼物</el-checkbox>
                            <el-checkbox v-model="state.ruleForm.collectLike">点赞</el-checkbox>
                            <el-checkbox v-model="state.ruleForm.collectFollow">关注</el-checkbox>
                            <el-checkbox v-model="state.ruleForm.collectUser">用户进入</el-checkbox>
                            <el-checkbox v-model="state.ruleForm.collectEcom">下单</el-checkbox>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="最大时长(分钟)">
                            <el-input-number v-model="state.ruleForm.maxDuration" :min="30" :max="480" :step="30"
                                             controls-position="right" class="w100"></el-input-number>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <template #footer>
				<span class="dialog-footer">
					<el-button @click="onCancel" size="default">取 消</el-button>
					<el-button type="primary" @click="onSubmit" :loading="state.submitBtn.loading" size="default">
                        {{ state.dialog.submitTxt }}
                    </el-button>
				</span>
            </template>
        </el-dialog>

        <!-- 多直播间对比弹窗 -->
        <el-dialog title="直播间数据对比" :visible.sync="state.compareDialog.isShowDialog" width="95%" top="3vh" @close="onCompareClose">
            <div v-loading="state.compareDialog.loading" class="compare-container">
                <el-row :gutter="20">
                    <el-col v-for="(item, index) in state.compareDialog.items" :key="index" :span="24 / state.compareDialog.items.length">
                        <el-card shadow="hover" class="compare-column">
                            <div slot="header" class="compare-header">
                                <span class="compare-title">直播间 {{ index + 1 }}</span>
                                <div>
                                    <el-tag :type="getStatusTagType(item.data.taskStatus)" size="small" style="margin-right: 8px">{{ item.data.taskStatusDesc }}</el-tag>
                                    <el-button v-if="item.data.taskStatus === 'PENDING' || item.data.taskStatus === 'STOPPED'"
                                               size="small" type="success" plain @click="onCompareStartTask(item)">启动</el-button>
                                    <el-button v-if="item.data.taskStatus === 'MONITORING'"
                                               size="small" type="warning" plain @click="onCompareStopTask(item)">停止</el-button>
                                </div>
                            </div>

                            <!-- 基本信息 -->
                            <el-descriptions :column="1" border size="small" class="mb15">
                                <el-descriptions-item label="平台">{{ item.data.platformDesc }}</el-descriptions-item>
                                <el-descriptions-item label="主播">{{ item.data.anchorName || '-' }}</el-descriptions-item>
                                <el-descriptions-item label="URL" :span="1">
                                    <el-link type="primary" :href="item.data.roomUrl" target="_blank" :underline="false">
                                        {{ item.data.roomUrl }}
                                    </el-link>
                                </el-descriptions-item>
                                <el-descriptions-item label="时长">{{ item.data.maxDuration }}分钟</el-descriptions-item>
                            </el-descriptions>

                            <!-- 统计数据 -->
                            <div class="compare-stats" v-if="item.data.statistics">
                                <div class="stat-item">
                                    <div class="stat-value">{{ item.data.statistics.chatCount || 0 }}</div>
                                    <div class="stat-label">聊天</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">{{ item.data.statistics.giftCount || 0 }}</div>
                                    <div class="stat-label">礼物</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">{{ item.data.statistics.likeCount || 0 }}</div>
                                    <div class="stat-label">点赞</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">{{ item.data.statistics.followCount || 0 }}</div>
                                    <div class="stat-label">关注</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">{{ item.data.statistics.userEnterCount || 0 }}</div>
                                    <div class="stat-label">用户进入</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">{{ item.data.statistics.ecomOrderCount || 0 }}</div>
                                    <div class="stat-label">下单</div>
                                </div>
                            </div>

                            <!-- 直播间实时数据（在线人数+排行榜） -->
                            <el-row :gutter="10" class="mb15" v-if="item.liveData">
                                <!-- 在线人数 -->
                                <el-col :span="12">
                                    <el-card shadow="hover" class="live-data-card compare-live-data">
                                        <div slot="header" class="live-data-header">
                                            <span class="live-data-title">
                                                <el-icon class="live-data-icon"><ele-View/></el-icon>
                                                在线
                                            </span>
                                            <el-tag v-if="item.liveData.onlineUpdateTime" type="success" size="mini">
                                                实时
                                            </el-tag>
                                        </div>
                                        <div class="live-data-body">
                                            <div class="live-data-value">
                                                {{ item.liveData.onlineDisplay || '0' }}
                                            </div>
                                            <div class="live-data-empty" v-if="!item.liveData.onlineDisplay">
                                                暂无
                                            </div>
                                        </div>
                                    </el-card>
                                </el-col>
                                <!-- 排行榜 -->
                                <el-col :span="12">
                                    <el-card shadow="hover" class="live-data-card compare-live-data">
                                        <div slot="header" class="live-data-header">
                                            <span class="live-data-title">
                                                <el-icon class="live-data-icon"><ele-Trophy/></el-icon>
                                                榜单
                                            </span>
                                            <el-tag v-if="item.liveData.rankUpdateTime" type="success" size="mini">
                                                实时
                                            </el-tag>
                                        </div>
                                        <div class="live-data-body live-rank-list">
                                            <div v-if="item.liveData.ranks && item.liveData.ranks.length > 0">
                                                <div v-for="(rank, idx) in item.liveData.ranks.slice(0, 5)" :key="idx" class="live-rank-item">
                                                    <div class="live-rank-index">
                                                        <el-tag :type="idx < 3 ? 'warning' : 'info'" size="mini" circle>{{ idx + 1 }}</el-tag>
                                                    </div>
                                                    <div class="live-rank-user">
                                                        <el-avatar :size="24" :src="rank.userAvatar">
                                                            <span class="avatar-fallback">{{ rank.userNickname ? rank.userNickname.charAt(0) : '?' }}</span>
                                                        </el-avatar>
                                                        <span class="live-rank-name">{{ rank.userNickname || '未知' }}</span>
                                                    </div>
                                                    <div class="live-rank-score">{{ rank.scoreStr || '0' }}</div>
                                                </div>
                                            </div>
                                            <div class="live-data-empty" v-else>
                                                暂无
                                            </div>
                                        </div>
                                    </el-card>
                                </el-col>
                            </el-row>

                            <!-- 采集数据Tab -->
                            <el-tabs v-model="item.activeTab" @tab-click="() => onCompareTabClick(item)" size="small">
                                <el-tab-pane label="聊天" name="chat">
                                    <el-table :data="item.tabData.chat.records" v-loading="item.tabLoading" size="small" max-height="250">
                                        <el-table-column label="头像" width="50">
                                            <template #default="scope">
                                                <el-avatar :size="28" :src="scope.row.userAvatar">
                                                    <span class="avatar-fallback">{{ scope.row.userNickname ? scope.row.userNickname.charAt(0) : '?' }}</span>
                                                </el-avatar>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="userId" label="用户ID" width="120" show-overflow-tooltip></el-table-column>
                                        <el-table-column prop="userNickname" label="用户昵称" width="90" show-overflow-tooltip></el-table-column>
                                        <el-table-column prop="content" label="内容" show-overflow-tooltip></el-table-column>
                                        <el-table-column prop="chatTime" label="时间" width="140"></el-table-column>
                                    </el-table>
                                    <el-pagination small layout="prev, pager, next" :total="item.tabData.chat.total"
                                                   :page-size="5" :current-page="item.tabData.chat.page"
                                                   @current-change="(p) => onComparePageChange(item, 'chat', p)"
                                                   class="mt10"></el-pagination>
                                </el-tab-pane>
                                <el-tab-pane label="礼物" name="gift">
                                    <el-table :data="item.tabData.gift.records" v-loading="item.tabLoading" size="small" max-height="250">
                                        <el-table-column label="头像" width="50">
                                            <template #default="scope">
                                                <el-avatar :size="28" :src="scope.row.userAvatar">
                                                    <span class="avatar-fallback">{{ scope.row.userNickname ? scope.row.userNickname.charAt(0) : '?' }}</span>
                                                </el-avatar>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="userId" label="用户ID" width="120" show-overflow-tooltip></el-table-column>
                                        <el-table-column prop="userNickname" label="用户昵称" width="90" show-overflow-tooltip></el-table-column>
                                        <el-table-column prop="giftName" label="礼物" width="100"></el-table-column>
                                        <el-table-column prop="giftCount" label="数量" width="60"></el-table-column>
                                        <el-table-column prop="giftTime" label="时间" width="140"></el-table-column>
                                    </el-table>
                                    <el-pagination small layout="prev, pager, next" :total="item.tabData.gift.total"
                                                   :page-size="5" :current-page="item.tabData.gift.page"
                                                   @current-change="(p) => onComparePageChange(item, 'gift', p)"
                                                   class="mt10"></el-pagination>
                                </el-tab-pane>
                                <el-tab-pane label="点赞" name="like">
                                    <el-table :data="item.tabData.like.records" v-loading="item.tabLoading" size="small" max-height="250">
                                        <el-table-column label="头像" width="50">
                                            <template #default="scope">
                                                <el-avatar :size="28" :src="scope.row.userAvatar">
                                                    <span class="avatar-fallback">{{ scope.row.userNickname ? scope.row.userNickname.charAt(0) : '?' }}</span>
                                                </el-avatar>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="userId" label="用户ID" width="120" show-overflow-tooltip></el-table-column>
                                        <el-table-column prop="userNickname" label="用户昵称" width="90" show-overflow-tooltip></el-table-column>
                                        <el-table-column prop="likeCount" label="点赞数" width="80"></el-table-column>
                                        <el-table-column prop="likeTime" label="时间" width="140"></el-table-column>
                                    </el-table>
                                    <el-pagination small layout="prev, pager, next" :total="item.tabData.like.total"
                                                   :page-size="5" :current-page="item.tabData.like.page"
                                                   @current-change="(p) => onComparePageChange(item, 'like', p)"
                                                   class="mt10"></el-pagination>
                                </el-tab-pane>
                                <el-tab-pane label="关注" name="follow">
                                    <el-table :data="item.tabData.follow.records" v-loading="item.tabLoading" size="small" max-height="250">
                                        <el-table-column label="头像" width="50">
                                            <template #default="scope">
                                                <el-avatar :size="28" :src="scope.row.userAvatar">
                                                    <span class="avatar-fallback">{{ scope.row.userNickname ? scope.row.userNickname.charAt(0) : '?' }}</span>
                                                </el-avatar>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="userId" label="用户ID" width="120" show-overflow-tooltip></el-table-column>
                                        <el-table-column prop="userNickname" label="用户昵称" width="90" show-overflow-tooltip></el-table-column>
                                        <el-table-column prop="followTime" label="时间" width="140"></el-table-column>
                                    </el-table>
                                    <el-pagination small layout="prev, pager, next" :total="item.tabData.follow.total"
                                                   :page-size="5" :current-page="item.tabData.follow.page"
                                                   @current-change="(p) => onComparePageChange(item, 'follow', p)"
                                                   class="mt10"></el-pagination>
                                </el-tab-pane>
                                <el-tab-pane label="用户进入" name="userEnter">
                                    <el-table :data="item.tabData.userEnter.records" v-loading="item.tabLoading" size="small" max-height="250">
                                        <el-table-column label="头像" width="50">
                                            <template #default="scope">
                                                <el-avatar :size="28" :src="scope.row.userAvatar">
                                                    <span class="avatar-fallback">{{ scope.row.userNickname ? scope.row.userNickname.charAt(0) : '?' }}</span>
                                                </el-avatar>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="userId" label="用户ID" width="120" show-overflow-tooltip></el-table-column>
                                        <el-table-column prop="userNickname" label="用户昵称" width="90" show-overflow-tooltip></el-table-column>
                                        <el-table-column prop="enterTime" label="时间" width="140"></el-table-column>
                                    </el-table>
                                    <el-pagination small layout="prev, pager, next" :total="item.tabData.userEnter.total"
                                                   :page-size="5" :current-page="item.tabData.userEnter.page"
                                                   @current-change="(p) => onComparePageChange(item, 'userEnter', p)"
                                                   class="mt10"></el-pagination>
                                </el-tab-pane>
                                <el-tab-pane label="下单" name="ecom">
                                    <el-table :data="item.tabData.ecom.records" v-loading="item.tabLoading" size="small" max-height="250">
                                        <el-table-column prop="ecomType" label="类型" width="80">
                                            <template #default="scope">
                                                <el-tag :type="scope.row.ecomType === 'SHOPPING' ? 'danger' : 'info'" size="mini">
                                                    {{ scope.row.ecomType === 'SHOPPING' ? '下单' : '其他' }}
                                                </el-tag>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="rawJson" label="数据" show-overflow-tooltip min-width="200">
                                            <template #default="scope">
                                                <span style="font-family: monospace; font-size:11px;">{{ scope.row.rawJson || '-' }}</span>
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                    <el-pagination small layout="prev, pager, next" :total="item.tabData.ecom.total"
                                                   :page-size="5" :current-page="item.tabData.ecom.page"
                                                   @current-change="(p) => onComparePageChange(item, 'ecom', p)"
                                                   class="mt10"></el-pagination>
                                </el-tab-pane>
                            </el-tabs>
                        </el-card>
                    </el-col>
                </el-row>
            </div>
        </el-dialog>

        <!-- 任务详情弹窗 -->
        <el-dialog title="任务详情" :visible.sync="state.detailDialog.isShowDialog" width="900px" top="5vh" @close="onDetailClose">
            <div v-if="state.detailDialog.data" v-loading="state.detailDialog.loading">
                <!-- 基本信息 -->
                <el-descriptions title="基本信息" :column="3" border size="default" class="mb20">
                    <el-descriptions-item label="任务ID">{{ state.detailDialog.data.taskId }}</el-descriptions-item>
                    <el-descriptions-item label="平台">{{ state.detailDialog.data.platformDesc }}</el-descriptions-item>
                    <el-descriptions-item label="状态">
                        <el-tag :type="getStatusTagType(state.detailDialog.data.taskStatus)">{{ state.detailDialog.data.taskStatusDesc }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="直播间URL" :span="3">{{ state.detailDialog.data.roomUrl }}</el-descriptions-item>
                    <el-descriptions-item label="主播">{{ state.detailDialog.data.anchorName || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="最大时长">{{ state.detailDialog.data.maxDuration }}分钟</el-descriptions-item>
                    <el-descriptions-item label="错误信息">
                        <span v-if="state.detailDialog.data.errorMsg" style="color: #F56C6C">{{ state.detailDialog.data.errorMsg }}</span>
                        <span v-else>-</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="开始时间">{{ state.detailDialog.data.startTime || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="停止时间">{{ state.detailDialog.data.stopTime || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="过期时间">{{ state.detailDialog.data.expireTime || '-' }}</el-descriptions-item>
                </el-descriptions>

                <!-- 统计数据 -->
                <el-descriptions v-if="state.detailDialog.data.statistics" title="统计数据" :column="5" border size="default" class="mb20">
                    <el-descriptions-item label="聊天条数">{{ state.detailDialog.data.statistics.chatCount || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="礼物条数">{{ state.detailDialog.data.statistics.giftCount || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="点赞条数">{{ state.detailDialog.data.statistics.likeCount || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="关注条数">{{ state.detailDialog.data.statistics.followCount || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="用户进入">{{ state.detailDialog.data.statistics.userEnterCount || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="下单">{{ state.detailDialog.data.statistics.ecomOrderCount || 0 }}</el-descriptions-item>
                </el-descriptions>

                <!-- 直播间实时数据（在线人数+排行榜） -->
                <el-row :gutter="20" class="mb20" v-if="state.detailDialog.liveData">
                    <!-- 在线人数 -->
                    <el-col :span="12">
                        <el-card shadow="hover" class="live-data-card">
                            <div slot="header" class="live-data-header">
                                <span class="live-data-title">
                                    <el-icon class="live-data-icon"><ele-View/></el-icon>
                                    在线人数
                                </span>
                                <el-tag v-if="state.detailDialog.liveData.onlineUpdateTime" type="success" size="mini">
                                    实时
                                </el-tag>
                            </div>
                            <div class="live-data-body">
                                <div class="live-data-value">
                                    {{ state.detailDialog.liveData.onlineDisplay || '0' }}
                                </div>
                                <div class="live-data-sub" v-if="state.detailDialog.liveData.onlineTotal">
                                    总数：{{ state.detailDialog.liveData.onlineTotal.toLocaleString() }}
                                </div>
                                <div class="live-data-empty" v-if="!state.detailDialog.liveData.onlineDisplay">
                                    暂无数据
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <!-- 排行榜 -->
                    <el-col :span="12">
                        <el-card shadow="hover" class="live-data-card">
                            <div slot="header" class="live-data-header">
                                <span class="live-data-title">
                                    <el-icon class="live-data-icon"><ele-Trophy/></el-icon>
                                    贡献排行榜
                                </span>
                                <el-tag v-if="state.detailDialog.liveData.rankUpdateTime" type="success" size="mini">
                                    实时
                                </el-tag>
                            </div>
                            <div class="live-data-body live-rank-list">
                                <div v-if="state.detailDialog.liveData.ranks && state.detailDialog.liveData.ranks.length > 0">
                                    <div v-for="(rank, index) in state.detailDialog.liveData.ranks.slice(0, 10)" :key="index" class="live-rank-item">
                                        <div class="live-rank-index">
                                            <el-tag :type="index < 3 ? 'warning' : 'info'" size="mini" circle>{{ index + 1 }}</el-tag>
                                        </div>
                                        <div class="live-rank-user">
                                            <el-avatar :size="28" :src="rank.userAvatar">
                                                <span class="avatar-fallback">{{ rank.userNickname ? rank.userNickname.charAt(0) : '?' }}</span>
                                            </el-avatar>
                                            <span class="live-rank-name">{{ rank.userNickname || '未知' }}</span>
                                        </div>
                                        <div class="live-rank-score">{{ rank.scoreStr || '0' }}</div>
                                    </div>
                                </div>
                                <div class="live-data-empty" v-else>
                                    暂无排行榜数据
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>

                <!-- 电商榜单实时数据 -->
                <el-card shadow="never" class="mb20" v-if="state.detailDialog.rankData">
                    <div slot="header" class="live-data-header">
                        <span class="live-data-title">
                            <i class="el-icon-s-data" style="color:#e6a23c;margin-right:6px"></i>电商榜单
                        </span>
                        <el-tag type="warning" size="mini">实时</el-tag>
                    </div>
                    <el-descriptions :column="3" border size="small">
                        <el-descriptions-item label="榜单名称">{{ state.detailDialog.rankData.rankName || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="消息类型">{{ state.detailDialog.rankData.msgType || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="更新时间">{{ state.detailDialog.rankData.updateTime ? new Date(Number(state.detailDialog.rankData.updateTime)).toLocaleString() : '-' }}</el-descriptions-item>
                    </el-descriptions>
                </el-card>

                <!-- 采集数据Tab -->
                <el-tabs v-model="state.detailDialog.activeTab" @tab-click="onTabClick">
                    <el-tab-pane label="聊天" name="chat">
                        <!-- 搜索条件 -->
                        <div class="search-bar mb10">
                            <el-input 
                                v-model="state.detailDialog.chatSearch.userNickname" 
                                placeholder="用户昵称" 
                                size="small"
                                clearable
                                style="width: 150px; margin-right: 10px">
                            </el-input>
                            <el-input 
                                v-model="state.detailDialog.chatSearch.content" 
                                placeholder="聊天内容" 
                                size="small"
                                clearable
                                style="width: 200px; margin-right: 10px">
                            </el-input>
                            <el-button size="small" type="primary" @click="onChatSearch">搜索</el-button>
                            <el-button size="small" @click="onChatSearchReset">重置</el-button>
                        </div>
                        <el-table :data="state.detailDialog.chatData" v-loading="state.detailDialog.tabLoading" size="small" max-height="300">
                            <el-table-column label="头像" width="60">
                                <template #default="scope">
                                    <el-avatar :size="32" :src="scope.row.userAvatar">
                                        <span class="avatar-fallback">{{ scope.row.userNickname ? scope.row.userNickname.charAt(0) : '?' }}</span>
                                    </el-avatar>
                                </template>
                            </el-table-column>
                            <el-table-column prop="userId" label="用户ID" width="140" show-overflow-tooltip></el-table-column>
                            <el-table-column prop="userNickname" label="用户昵称" width="120" show-overflow-tooltip></el-table-column>
                            <el-table-column prop="content" label="内容" show-overflow-tooltip></el-table-column>
                            <el-table-column prop="chatTime" label="时间" width="160"></el-table-column>
                        </el-table>
                        <el-pagination small layout="prev, pager, next" :total="state.detailDialog.chatTotal"
                                       :page-size="5" :current-page="state.detailDialog.chatPage"
                                       @current-change="(p) => { state.detailDialog.chatPage = p; fetchDetailTabData(); }"
                                       class="mt10"></el-pagination>
                    </el-tab-pane>
                    <el-tab-pane label="礼物" name="gift">
                        <el-table :data="state.detailDialog.giftData" v-loading="state.detailDialog.tabLoading" size="small" max-height="300">
                            <el-table-column label="头像" width="60">
                                <template #default="scope">
                                    <el-avatar :size="32" :src="scope.row.userAvatar">
                                        <span class="avatar-fallback">{{ scope.row.userNickname ? scope.row.userNickname.charAt(0) : '?' }}</span>
                                    </el-avatar>
                                </template>
                            </el-table-column>
                            <el-table-column prop="userId" label="用户ID" width="140" show-overflow-tooltip></el-table-column>
                            <el-table-column prop="userNickname" label="用户昵称" width="120" show-overflow-tooltip></el-table-column>
                            <el-table-column prop="giftName" label="礼物" width="120"></el-table-column>
                            <el-table-column prop="giftCount" label="数量" width="80"></el-table-column>
                            <el-table-column prop="giftTime" label="时间" width="160"></el-table-column>
                        </el-table>
                        <el-pagination small layout="prev, pager, next" :total="state.detailDialog.giftTotal"
                                       :page-size="5" :current-page="state.detailDialog.giftPage"
                                       @current-change="(p) => { state.detailDialog.giftPage = p; fetchDetailTabData(); }"
                                       class="mt10"></el-pagination>
                    </el-tab-pane>
                    <el-tab-pane label="点赞" name="like">
                        <el-table :data="state.detailDialog.likeData" v-loading="state.detailDialog.tabLoading" size="small" max-height="300">
                            <el-table-column label="头像" width="60">
                                <template #default="scope">
                                    <el-avatar :size="32" :src="scope.row.userAvatar">
                                        <span class="avatar-fallback">{{ scope.row.userNickname ? scope.row.userNickname.charAt(0) : '?' }}</span>
                                    </el-avatar>
                                </template>
                            </el-table-column>
                            <el-table-column prop="userId" label="用户ID" width="140" show-overflow-tooltip></el-table-column>
                            <el-table-column prop="userNickname" label="用户昵称" width="120" show-overflow-tooltip></el-table-column>
                            <el-table-column prop="likeCount" label="点赞数" width="100"></el-table-column>
                            <el-table-column prop="likeTime" label="时间" width="160"></el-table-column>
                        </el-table>
                        <el-pagination small layout="prev, pager, next" :total="state.detailDialog.likeTotal"
                                       :page-size="5" :current-page="state.detailDialog.likePage"
                                       @current-change="(p) => { state.detailDialog.likePage = p; fetchDetailTabData(); }"
                                       class="mt10"></el-pagination>
                    </el-tab-pane>
                    <el-tab-pane label="关注" name="follow">
                        <el-table :data="state.detailDialog.followData" v-loading="state.detailDialog.tabLoading" size="small" max-height="300">
                            <el-table-column label="头像" width="60">
                                <template #default="scope">
                                    <el-avatar :size="32" :src="scope.row.userAvatar">
                                        <span class="avatar-fallback">{{ scope.row.userNickname ? scope.row.userNickname.charAt(0) : '?' }}</span>
                                    </el-avatar>
                                </template>
                            </el-table-column>
                            <el-table-column prop="userId" label="用户ID" width="140" show-overflow-tooltip></el-table-column>
                            <el-table-column prop="userNickname" label="用户昵称" width="120" show-overflow-tooltip></el-table-column>
                            <el-table-column prop="followTime" label="时间" width="160"></el-table-column>
                        </el-table>
                        <el-pagination small layout="prev, pager, next" :total="state.detailDialog.followTotal"
                                       :page-size="5" :current-page="state.detailDialog.followPage"
                                       @current-change="(p) => { state.detailDialog.followPage = p; fetchDetailTabData(); }"
                                       class="mt10"></el-pagination>
                    </el-tab-pane>
                    <el-tab-pane label="用户进入" name="userEnter">
                        <el-table :data="state.detailDialog.userEnterData" v-loading="state.detailDialog.tabLoading" size="small" max-height="300">
                            <el-table-column label="头像" width="60">
                                <template #default="scope">
                                    <el-avatar :size="32" :src="scope.row.userAvatar">
                                        <span class="avatar-fallback">{{ scope.row.userNickname ? scope.row.userNickname.charAt(0) : '?' }}</span>
                                    </el-avatar>
                                </template>
                            </el-table-column>
                            <el-table-column prop="userId" label="用户ID" width="140" show-overflow-tooltip></el-table-column>
                            <el-table-column prop="userNickname" label="用户昵称" width="120" show-overflow-tooltip></el-table-column>
                            <el-table-column prop="enterTime" label="时间" width="160"></el-table-column>
                        </el-table>
                        <el-pagination small layout="prev, pager, next" :total="state.detailDialog.userEnterTotal"
                                       :page-size="5" :current-page="state.detailDialog.userEnterPage"
                                       @current-change="(p) => { state.detailDialog.userEnterPage = p; fetchDetailTabData(); }"
                                       class="mt10"></el-pagination>
                    </el-tab-pane>
                    <el-tab-pane label="下单" name="ecom">
                        <el-table :data="state.detailDialog.ecomData" v-loading="state.detailDialog.tabLoading" size="small" max-height="300">
                            <el-table-column prop="ecomType" label="类型" width="80">
                                <template #default="scope">
                                    <el-tag :type="scope.row.ecomType === 'SHOPPING' ? 'danger' : 'info'" size="mini">
                                        {{ scope.row.ecomType === 'SHOPPING' ? '下单' : scope.row.ecomType === 'RANK' ? '榜单' : '其他' }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="msgType" label="子类型" width="80"></el-table-column>
                            <el-table-column prop="rawJson" label="数据" show-overflow-tooltip min-width="300">
                                <template #default="scope">
                                    <span style="font-family: monospace; font-size:12px;">{{ scope.row.rawJson || '-' }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="时间" width="160">
                                <template #default="scope">
                                    {{ scope.row.timestamp ? new Date(Number(scope.row.timestamp)).toLocaleString() : '-' }}
                                </template>
                            </el-table-column>
                        </el-table>
                        <el-pagination small layout="prev, pager, next" :total="state.detailDialog.ecomTotal"
                                       :page-size="5" :current-page="state.detailDialog.ecomPage"
                                       @current-change="(p) => { state.detailDialog.ecomPage = p; fetchDetailTabData(); }"
                                       class="mt10"></el-pagination>
                    </el-tab-pane>
                </el-tabs>

                <!-- 操作按钮 -->
                <div class="mt20" style="text-align: right;">
                    <el-button v-if="state.detailDialog.data.taskStatus === 'MONITORING'" type="warning" size="small"
                               @click="onStopTask(state.detailDialog.data); state.detailDialog.isShowDialog = false;">停止监控</el-button>
                    <el-button v-if="state.detailDialog.data.taskStatus !== 'MONITORING'" type="danger" size="small"
                               @click="onClearData(state.detailDialog.data)">清空数据</el-button>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script>
    import {useLiveTaskApi} from '@/api/live/task';
    import {Message, MessageBox} from 'element-ui';
    import liveWebSocket from '@/utils/liveWebSocket';

    export default {
        name: "liveTask",
        data() {
            return {
                state: {
                    tableData: {
                        data: [],
                        total: 0,
                        loading: false,
                        param: {
                            page: 1,
                            size: 10,
                            platform: '',
                            taskStatus: '',
                            roomUrl: '',
                            anchorName: ''
                        }
                    },
                    dialog: {
                        isShowDialog: false,
                        type: '',
                        title: '',
                        submitTxt: '',
                    },
                    ruleForm: {
                        taskId: '',
                        platform: 'DOUYIN',
                        taskName: '',
                        roomUrl: '',
                        collectChat: true,
                        collectGift: true,
                        collectLike: false,
                        collectFollow: false,
                        collectUser: false,
                        collectEcom: true,
                        maxDuration: 240
                    },
                    rules: {
                        platform: [{required: true, message: '请选择平台', trigger: 'change'}],
                        taskName: [{required: true, message: '请输入任务名称', trigger: 'blur'}],
                        roomUrl: [{required: true, message: '请输入直播间URL', trigger: 'blur'}]
                    },
                    submitBtn: {
                        loading: false,
                        type: ''
                    },
                    detailDialog: {
                        isShowDialog: false,
                        loading: false,
                        tabLoading: false,
                        data: null,
                        activeTab: 'chat',
                        taskId: '',
                        chatData: [],
                        chatTotal: 0,
                        chatPage: 1,
                        chatSearch: {
                            userNickname: '',
                            content: ''
                        },
                        giftData: [],
                        giftTotal: 0,
                        giftPage: 1,
                        likeData: [],
                        likeTotal: 0,
                        likePage: 1,
                        followData: [],
                        followTotal: 0,
                        followPage: 1,
                        userEnterData: [],
                        userEnterTotal: 0,
                        userEnterPage: 1,
                        ecomData: [],
                        ecomTotal: 0,
                        ecomPage: 1,
                        rankData: null,
                        liveData: {
                            onlineDisplay: '',
                            onlineTotal: 0,
                            onlineUpdateTime: null,
                            ranks: [],
                            rankUpdateTime: null
                        }
                    },
                    selectedRows: [],
                    compareDialog: {
                        isShowDialog: false,
                        loading: false,
                        items: []
                    }
                }
            }
        },
    methods: {
            getStatusTagType(status) {
                const map = {
                    'PENDING': 'info',
                    'MONITORING': 'success',
                    'STOPPED': 'warning',
                    'INTERRUPTED': 'danger',
                    'EXPIRED': 'danger'
                };
                return map[status] || 'info';
            },
            selectableCheck(row) {
                const selectedCount = this.state.selectedRows.length;
                const isSelected = this.state.selectedRows.some(r => r.taskId === row.taskId);
                return isSelected || selectedCount < 3;
            },
            handleSelectionChange(selection) {
                if (selection.length > 3) {
                    Message.warning('最多只能选择3个直播间进行对比');
                    // 恢复到只保留前3个选中的状态
                    const rowsToSelect = selection.slice(0, 3);
                    this.$refs.tableRef.clearSelection();
                    rowsToSelect.forEach(row => {
                        this.$refs.tableRef.toggleRowSelection(row, true);
                    });
                    this.state.selectedRows = rowsToSelect;
                } else {
                    this.state.selectedRows = selection;
                }
            },
            onOpenCompare() {
                const rows = this.state.selectedRows;
                if (rows.length < 2) {
                    Message.warning('请至少选择2个直播间进行对比');
                    return;
                }
                if (rows.length > 3) {
                    Message.warning('最多只能选择3个直播间进行对比');
                    return;
                }
                this.state.compareDialog.loading = true;
                this.state.compareDialog.isShowDialog = true;
                this.state.compareDialog.items = rows.map(row => this.createCompareItem(row));

                // 加载每个任务的详情
                const api = useLiveTaskApi();
                Promise.all(rows.map(row => api.info(row.taskId))).then(results => {
                    results.forEach((res, index) => {
                        this.state.compareDialog.items[index].data = res.data;
                    });
                    this.state.compareDialog.loading = false;
                    // 加载每个任务的Tab数据
                    this.state.compareDialog.items.forEach(item => {
                        this.fetchCompareItemTabData(item);
                    });
                    this.connectCompareWebSocket();
                }).catch(() => {
                    this.state.compareDialog.loading = false;
                });
            },
            createCompareItem(row) {
                return {
                    taskId: row.taskId,
                    data: row,
                    activeTab: 'chat',
                    tabLoading: false,
                    tabData: {
                        chat: { records: [], total: 0, page: 1 },
                        gift: { records: [], total: 0, page: 1 },
                        like: { records: [], total: 0, page: 1 },
                        follow: { records: [], total: 0, page: 1 },
                        userEnter: { records: [], total: 0, page: 1 },
                        ecom: { records: [], total: 0, page: 1 }
                    },
                    liveData: {
                        onlineDisplay: '',
                        onlineTotal: 0,
                        onlineUpdateTime: null,
                        ranks: [],
                        rankUpdateTime: null
                    }
                };
            },
            fetchCompareItemTabData(item) {
                const taskId = item.taskId;
                item.tabLoading = true;
                const tab = item.activeTab;
                const api = useLiveTaskApi();
                let apiMethod;

                switch (tab) {
                    case 'chat': apiMethod = api.chatList; break;
                    case 'gift': apiMethod = api.giftList; break;
                    case 'like': apiMethod = api.likeList; break;
                    case 'follow': apiMethod = api.followList; break;
                    case 'userEnter': apiMethod = api.userEnterList; break;
                    case 'ecom': apiMethod = api.ecomList; break;
                }
                const page = item.tabData[tab].page;

                apiMethod({taskId, page, size: 5}).then(response => {
                    item.tabData[tab].records = response.data.records;
                    item.tabData[tab].total = response.data.total;
                    item.tabLoading = false;
                }).catch(() => {
                    item.tabLoading = false;
                });
            },
            onCompareTabClick(item) {
                this.fetchCompareItemTabData(item);
            },
            onCompareStartTask(item) {
                MessageBox.confirm(`确定启动任务："${item.data.roomUrl}"？`, '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    useLiveTaskApi().start(item.taskId).then(() => {
                        Message.success('任务启动成功');
                        this.fetchData();
                        // 刷新该直播间详情
                        useLiveTaskApi().info(item.taskId).then(response => {
                            item.data = response.data;
                            this.fetchCompareItemTabData(item);
                            this.connectCompareWebSocket();
                        });
                    });
                }).catch(() => {});
            },
            onCompareStopTask(item) {
                MessageBox.confirm(`确定停止任务："${item.data.roomUrl}"？`, '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    useLiveTaskApi().stop(item.taskId).then(() => {
                        Message.success('任务停止成功');
                        this.fetchData();
                        // 刷新该直播间详情
                        useLiveTaskApi().info(item.taskId).then(response => {
                            item.data = response.data;
                            this.fetchCompareItemTabData(item);
                        });
                    });
                }).catch(() => {});
            },
            onComparePageChange(item, tab, page) {
                item.tabData[tab].page = page;
                item.activeTab = tab;
                this.fetchCompareItemTabData(item);
            },
            onCompareClose() {
                this.state.compareDialog.items.forEach(item => {
                    liveWebSocket.unsubscribe(item.taskId);
                });
            },
            connectCompareWebSocket() {
                const items = this.state.compareDialog.items;
                items.forEach(item => {
                    liveWebSocket.subscribe(item.taskId,
                        ['statistics', 'liveData', 'chat', 'gift', 'like', 'follow', 'userEnter', 'ecom'],
                        (type, data) => {
                            if (!this.state.compareDialog.isShowDialog) return;
                            switch (type) {
                                case 'statistics':
                                    if (item.data) item.data.statistics = data;
                                    break;
                                case 'liveData':
                                    item.liveData = data || {};
                                    break;
                                case 'chat':
                                    if (item.activeTab === 'chat') {
                                        item.tabData.chat.records.unshift(data);
                                        if (item.tabData.chat.records.length > 50) item.tabData.chat.records.pop();
                                        item.tabData.chat.total = (item.tabData.chat.total || 0) + 1;
                                    }
                                    break;
                                case 'gift':
                                    if (item.activeTab === 'gift') {
                                        item.tabData.gift.records.unshift(data);
                                        if (item.tabData.gift.records.length > 50) item.tabData.gift.records.pop();
                                        item.tabData.gift.total = (item.tabData.gift.total || 0) + 1;
                                    }
                                    break;
                                case 'like':
                                    if (item.activeTab === 'like') {
                                        item.tabData.like.records.unshift(data);
                                        if (item.tabData.like.records.length > 50) item.tabData.like.records.pop();
                                        item.tabData.like.total = (item.tabData.like.total || 0) + 1;
                                    }
                                    break;
                                case 'follow':
                                    if (item.activeTab === 'follow') {
                                        item.tabData.follow.records.unshift(data);
                                        if (item.tabData.follow.records.length > 50) item.tabData.follow.records.pop();
                                        item.tabData.follow.total = (item.tabData.follow.total || 0) + 1;
                                    }
                                    break;
                                case 'userEnter':
                                    if (item.activeTab === 'userEnter') {
                                        item.tabData.userEnter.records.unshift(data);
                                        if (item.tabData.userEnter.records.length > 50) item.tabData.userEnter.records.pop();
                                        item.tabData.userEnter.total = (item.tabData.userEnter.total || 0) + 1;
                                    }
                                    break;
                                case 'ecom':
                                    if (item.activeTab === 'ecom') {
                                        item.tabData.ecom.records.unshift(data);
                                        if (item.tabData.ecom.records.length > 50) item.tabData.ecom.records.pop();
                                        item.tabData.ecom.total = (item.tabData.ecom.total || 0) + 1;
                                    }
                                    break;
                            }
                        }
                    );
                });
            },
            fetchData() {
                this.state.tableData.loading = true;
                useLiveTaskApi().list(this.state.tableData.param).then(response => {
                    this.state.tableData.data = (response.data.records || []).map(item => ({
                        ...item,
                        onlineDisplay: item.onlineDisplay || '',
                        onlineTotal: item.onlineTotal || 0,
                        onlineUpdateTime: item.onlineUpdateTime || null
                    }));
                    this.state.tableData.total = response.data.total;
                    this.state.tableData.loading = false;
                    this.connectListWebSocket();
                }).catch(() => {
                    this.state.tableData.loading = false;
                });
            },
            connectListWebSocket() {
                const monitoringRows = this.state.tableData.data.filter(row => row.taskStatus === 'MONITORING');
                monitoringRows.forEach(row => {
                    liveWebSocket.subscribe(row.taskId, ['statistics', 'liveData', 'ecom'], (type, data) => {
                        const tableRow = this.state.tableData.data.find(r => r.taskId === row.taskId);
                        if (!tableRow) return;
                        if (type === 'statistics') {
                            tableRow.statistics = data;
                        } else if (type === 'liveData') {
                            tableRow.onlineDisplay = data.onlineDisplay || '';
                            tableRow.onlineTotal = data.onlineTotal || 0;
                            tableRow.onlineUpdateTime = data.onlineUpdateTime || null;
                        }
                    });
                });
            },
            onOpenCreate() {
                this.state.ruleForm = {
                    taskId: '',
                    platform: 'DOUYIN',
                    taskName: '',
                    roomUrl: '',
                    collectChat: true,
                    collectGift: true,
                    collectLike: false,
                    collectFollow: false,
                    collectUser: false,
                    collectEcom: true,
                    maxDuration: 240
                };
                this.state.submitBtn.type = 'add';
                this.state.dialog.type = 'add';
                this.state.dialog.title = '新增直播任务';
                this.state.dialog.submitTxt = '新 增';
                this.state.dialog.isShowDialog = true;
            },
            onOpenEdit(row) {
                this.state.ruleForm = {
                    taskId: row.taskId,
                    platform: row.platform,
                    taskName: row.taskName,
                    roomUrl: row.roomUrl,
                    collectChat: row.collectChat,
                    collectGift: row.collectGift,
                    collectLike: row.collectLike,
                    collectFollow: row.collectFollow,
                    collectUser: row.collectUser,
                    collectEcom: row.collectEcom,
                    maxDuration: row.maxDuration
                };
                this.state.submitBtn.type = 'edit';
                this.state.dialog.type = 'edit';
                this.state.dialog.title = '编辑直播任务';
                this.state.dialog.submitTxt = '修 改';
                this.state.dialog.isShowDialog = true;
            },
            onViewDetail(row) {
                this.state.detailDialog.taskId = row.taskId;
                this.state.detailDialog.activeTab = 'chat';
                this.state.detailDialog.isShowDialog = true;
                this.state.detailDialog.loading = true;
                this.state.detailDialog.chatPage = 1;
                this.state.detailDialog.giftPage = 1;
                this.state.detailDialog.likePage = 1;
                this.state.detailDialog.followPage = 1;
                this.state.detailDialog.userEnterPage = 1;
                // 重置搜索条件
                this.state.detailDialog.chatSearch.userNickname = '';
                this.state.detailDialog.chatSearch.content = '';

                useLiveTaskApi().info(row.taskId).then(response => {
                    this.state.detailDialog.data = response.data;
                    this.state.detailDialog.loading = false;
                    this.fetchDetailTabData();
                    this.fetchLiveData();
                    if (response.data.taskStatus === 'MONITORING') {
                        this.connectDetailWebSocket(row.taskId);
                    }
                }).catch(() => {
                    this.state.detailDialog.loading = false;
                });
            },
            onDetailClose() {
                const taskId = this.state.detailDialog.taskId;
                if (taskId) {
                    liveWebSocket.unsubscribe(taskId);
                }
            },
            connectDetailWebSocket(taskId) {
                const dialog = this.state.detailDialog;
                liveWebSocket.subscribe(taskId,
                    ['statistics', 'liveData', 'chat', 'gift', 'like', 'follow', 'userEnter', 'ecom', 'rankData'],
                    (type, data) => {
                        if (!this.state.detailDialog.isShowDialog) return;
                        switch (type) {
                            case 'statistics':
                                if (dialog.data) {
                                    dialog.data.statistics = data;
                                }
                                break;
                            case 'liveData':
                                dialog.liveData = data || {};
                                break;
                            case 'chat':
                                if (dialog.activeTab === 'chat') {
                                    dialog.chatData.unshift(data);
                                    if (dialog.chatData.length > 100) dialog.chatData.pop();
                                    dialog.chatTotal = (dialog.chatTotal || 0) + 1;
                                }
                                break;
                            case 'gift':
                                if (dialog.activeTab === 'gift') {
                                    dialog.giftData.unshift(data);
                                    if (dialog.giftData.length > 100) dialog.giftData.pop();
                                    dialog.giftTotal = (dialog.giftTotal || 0) + 1;
                                }
                                break;
                            case 'like':
                                if (dialog.activeTab === 'like') {
                                    dialog.likeData.unshift(data);
                                    if (dialog.likeData.length > 100) dialog.likeData.pop();
                                    dialog.likeTotal = (dialog.likeTotal || 0) + 1;
                                }
                                break;
                            case 'follow':
                                if (dialog.activeTab === 'follow') {
                                    dialog.followData.unshift(data);
                                    if (dialog.followData.length > 100) dialog.followData.pop();
                                    dialog.followTotal = (dialog.followTotal || 0) + 1;
                                }
                                break;
                            case 'userEnter':
                                if (dialog.activeTab === 'userEnter') {
                                    dialog.userEnterData.unshift(data);
                                    if (dialog.userEnterData.length > 100) dialog.userEnterData.pop();
                                    dialog.userEnterTotal = (dialog.userEnterTotal || 0) + 1;
                                }
                                break;
                            case 'ecom':
                                if (dialog.activeTab === 'ecom') {
                                    dialog.ecomData.unshift(data);
                                    if (dialog.ecomData.length > 100) dialog.ecomData.pop();
                                    dialog.ecomTotal = (dialog.ecomTotal || 0) + 1;
                                }
                                break;
                            case 'rankData':
                                dialog.rankData = data || {};
                                break;
                        }
                    }
                );
            },
            fetchLiveData() {
                const taskId = this.state.detailDialog.taskId;
                if (!taskId) return;
                useLiveTaskApi().liveData(taskId).then(response => {
                    this.state.detailDialog.liveData = response.data || {
                        onlineDisplay: '',
                        onlineTotal: 0,
                        onlineUpdateTime: null,
                        ranks: [],
                        rankUpdateTime: null
                    };
                });
            },
            fetchDetailTabData() {
                const taskId = this.state.detailDialog.taskId;
                this.state.detailDialog.tabLoading = true;
                const tab = this.state.detailDialog.activeTab;
                const api = useLiveTaskApi();
                let apiMethod, page;

                switch (tab) {
                    case 'chat':
                        apiMethod = api.chatList;
                        page = this.state.detailDialog.chatPage;
                        break;
                    case 'gift':
                        apiMethod = api.giftList;
                        page = this.state.detailDialog.giftPage;
                        break;
                    case 'like':
                        apiMethod = api.likeList;
                        page = this.state.detailDialog.likePage;
                        break;
                    case 'follow':
                        apiMethod = api.followList;
                        page = this.state.detailDialog.followPage;
                        break;
                    case 'userEnter':
                        apiMethod = api.userEnterList;
                        page = this.state.detailDialog.userEnterPage;
                        break;
                    case 'ecom':
                        apiMethod = api.ecomList;
                        page = this.state.detailDialog.ecomPage;
                        break;
                }

                // 构建查询参数
                const params = {taskId, page, size: 5};
                
                // 搜索条件
                if (tab === 'chat') {
                    if (this.state.detailDialog.chatSearch.userNickname) {
                        params.userNickname = this.state.detailDialog.chatSearch.userNickname;
                    }
                    if (this.state.detailDialog.chatSearch.content) {
                        params.content = this.state.detailDialog.chatSearch.content;
                    }
                }
                apiMethod(params).then(response => {
                    const data = response.data;
                    switch (tab) {
                        case 'chat':
                            this.state.detailDialog.chatData = data.records;
                            this.state.detailDialog.chatTotal = data.total;
                            break;
                        case 'gift':
                            this.state.detailDialog.giftData = data.records;
                            this.state.detailDialog.giftTotal = data.total;
                            break;
                        case 'like':
                            this.state.detailDialog.likeData = data.records;
                            this.state.detailDialog.likeTotal = data.total;
                            break;
                        case 'follow':
                            this.state.detailDialog.followData = data.records;
                            this.state.detailDialog.followTotal = data.total;
                            break;
                        case 'userEnter':
                            this.state.detailDialog.userEnterData = data.records;
                            this.state.detailDialog.userEnterTotal = data.total;
                            break;
                        case 'ecom':
                            this.state.detailDialog.ecomData = data.records;
                            this.state.detailDialog.ecomTotal = data.total;
                            break;
                    }
                    this.state.detailDialog.tabLoading = false;
                }).catch(() => {
                    this.state.detailDialog.tabLoading = false;
                });
            },
            onTabClick() {
                this.fetchDetailTabData();
            },
            onChatSearch() {
                // 重置到第一页
                this.state.detailDialog.chatPage = 1;
                this.fetchDetailTabData();
            },
            onChatSearchReset() {
                this.state.detailDialog.chatSearch.userNickname = '';
                this.state.detailDialog.chatSearch.content = '';
                this.state.detailDialog.chatPage = 1;
                this.fetchDetailTabData();
            },
            onStartTask(row) {
                MessageBox.confirm(`确定启动任务："${row.roomUrl}"？`, '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    useLiveTaskApi().start(row.taskId).then(() => {
                        Message.success('任务启动成功');
                        this.fetchData();
                    });
                }).catch(() => {});
            },
            onStopTask(row) {
                MessageBox.confirm(`确定停止任务："${row.roomUrl}"？`, '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    useLiveTaskApi().stop(row.taskId).then(() => {
                        Message.success('任务停止成功');
                        this.fetchData();
                    });
                }).catch(() => {});
            },
            onClearData(row) {
                MessageBox.confirm('确定清空该任务的所有采集数据？此操作不可恢复！', '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    useLiveTaskApi().clearData(row.taskId).then(() => {
                        Message.success('数据清空成功');
                        // 刷新详情
                        if (this.state.detailDialog.isShowDialog) {
                            this.onViewDetail(row);
                        }
                    });
                }).catch(() => {});
            },
            onRowDel(row) {
                MessageBox.confirm(`此操作将永久删除任务及数据，是否继续?`, '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    useLiveTaskApi().delete(row.taskId).then(() => {
                        Message.success('删除成功');
                        this.fetchData();
                    });
                }).catch(() => {});
            },
            handleSizeChange(pageSize) {
                this.state.tableData.data = [];
                this.state.tableData.param.size = pageSize;
                this.fetchData();
            },
            handleCurrentChange(current) {
                this.state.tableData.data = [];
                this.state.tableData.param.page = current;
                this.fetchData();
            },
            closeDialog() {
                this.state.dialog.isShowDialog = false;
            },
            onCancel() {
                this.closeDialog();
            },
            onSubmit() {
                this.$refs.taskFormRef.validate((valid) => {
                    if (valid) {
                        this.state.submitBtn.loading = true;
                        if (this.state.submitBtn.type === 'edit') {
                            useLiveTaskApi().update(this.state.ruleForm).then(() => {
                                this.state.submitBtn.loading = false;
                                this.closeDialog();
                                Message.success('修改成功');
                                this.fetchData();
                            }).catch(() => {
                                this.state.submitBtn.loading = false;
                            });
                        } else {
                            useLiveTaskApi().create(this.state.ruleForm).then(() => {
                                this.state.submitBtn.loading = false;
                                this.closeDialog();
                                Message.success('创建成功');
                                this.fetchData();
                            }).catch(() => {
                                this.state.submitBtn.loading = false;
                            });
                        }
                    }
                });
            }
        },
        mounted() {
            this.fetchData();
        },
        beforeDestroy() {
            liveWebSocket.disconnect();
        }
    }
</script>

<style lang="scss" scoped>
.online-num {
    font-weight: 700;
    font-size: 15px;
    font-family: 'Fira Code', 'SF Mono', monospace;
    color: var(--prev-color-primary);
}
.metric-inline {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
}
.metric-item {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 8px;
    font-size: 12px;
    border-radius: 6px;
    background: rgba(0,184,212,.05);
    border: 1px solid rgba(0,184,212,.1);
    color: var(--prev-color-text-regular);
    white-space: nowrap;
    transition: all .2s;
}
.metric-item:hover {
    background: rgba(0,184,212,.1);
    border-color: rgba(0,184,212,.2);
}
.metric-item.metric-zero {
    opacity: 0.45;
}
.metric-item em {
    font-style: normal;
    font-weight: 700;
    font-size: 13px;
    font-family: 'Fira Code', 'SF Mono', monospace;
    margin-left: 1px;
    color: var(--prev-color-text-primary);
}
.metric-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
}
.search-bar {
    display: flex;
    align-items: center;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
}
.compare-container {
    .compare-column {
        height: 100%;
        .compare-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            .compare-title {
                font-weight: bold;
                font-size: 16px;
            }
        }
        .compare-stats {
            display: flex;
            justify-content: space-around;
            padding: 15px 0;
            margin-bottom: 15px;
            background-color: #f5f7fa;
            border-radius: 4px;
            .stat-item {
                text-align: center;
                .stat-value {
                    font-size: 22px;
                    font-weight: bold;
                    color: #409eff;
                    line-height: 1.2;
                }
                .stat-label {
                    font-size: 12px;
                    color: #606266;
                    margin-top: 4px;
                }
            }
        }
    }
}
.live-data-card {
    .live-data-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .live-data-title {
            display: flex;
            align-items: center;
            font-weight: bold;
            font-size: 14px;
            .live-data-icon {
                margin-right: 6px;
                color: #409eff;
            }
        }
    }
    .live-data-body {
        .live-data-value {
            font-size: 32px;
            font-weight: bold;
            color: #409eff;
            line-height: 1.3;
        }
        .live-data-sub {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
        }
        .live-data-empty {
            font-size: 12px;
            color: #c0c4cc;
            text-align: center;
            padding: 10px 0;
        }
        &.live-rank-list {
            max-height: 260px;
            overflow-y: auto;
            .live-rank-item {
                display: flex;
                align-items: center;
                padding: 6px 0;
                border-bottom: 1px solid #f0f0f0;
                &:last-child {
                    border-bottom: none;
                }
                .live-rank-index {
                    width: 32px;
                    text-align: center;
                }
                .live-rank-user {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    .live-rank-name {
                        margin-left: 8px;
                        font-size: 13px;
                        color: #303133;
                    }
                }
                .live-rank-score {
                    font-size: 12px;
                    color: #e6a23c;
                    font-weight: bold;
                    min-width: 60px;
                    text-align: right;
                }
            }
        }
    }
    &.compare-live-data {
        .live-data-value {
            font-size: 24px;
        }
        .live-data-header .live-data-title {
            font-size: 13px;
        }
        .live-rank-list {
            max-height: 180px;
            .live-rank-item {
                padding: 4px 0;
            }
        }
    }
}
</style>
