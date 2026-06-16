<template>
    <div class="warehouse-stocktake-container layout-padding">
        <el-card shadow="hover" class="layout-padding-auto">
            <div class="system-user-search mb15">
                <el-select size="default" v-model="state.tableData.param.stockType" placeholder="库存类型"
                           style="max-width: 150px" clearable>
                    <el-option label="货物" value="GOODS"></el-option>
                    <el-option label="规格SKU" value="SKU"></el-option>
                </el-select>
                <el-button size="default" type="primary" class="ml10" @click="fetchData()">
                    <el-icon>
                        <ele-Search/>
                    </el-icon>
                    查询
                </el-button>
                <el-button size="default" type="warning" class="ml10" @click="onOpenAdjust">
                    <el-icon>
                        <ele-Edit/>
                    </el-icon>
                    盘点调整
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column type="index" label="序号" width="60"/>
                <el-table-column prop="recordId" label="记录ID" show-overflow-tooltip></el-table-column>
                <el-table-column prop="stockType" label="库存类型" show-overflow-tooltip>
                    <template #default="scope">
                        <el-tag :type="scope.row.stockType === 'GOODS' ? 'primary' : 'success'">
                            {{ scope.row.stockType === 'GOODS' ? '货物' : '规格SKU' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="sourceId" label="来源ID" show-overflow-tooltip></el-table-column>
                <el-table-column prop="beforeQuantity" label="盘点前数量" show-overflow-tooltip></el-table-column>
                <el-table-column prop="adjustQuantity" label="调整数量" show-overflow-tooltip>
                    <template #default="scope">
                        <span :style="{color: scope.row.adjustQuantity >= 0 ? '#67C23A' : '#F56C6C'}">
                            {{ scope.row.adjustQuantity >= 0 ? '+' : '' }}{{ scope.row.adjustQuantity }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="afterQuantity" label="盘点后数量" show-overflow-tooltip></el-table-column>
                <el-table-column prop="reason" label="盘点原因" show-overflow-tooltip></el-table-column>
                <el-table-column prop="isRollback" label="是否回滚" show-overflow-tooltip>
                    <template #default="scope">
                        <el-tag type="info" v-if="scope.row.isRollback === 1">已回滚</el-tag>
                        <el-tag type="success" v-else>未回滚</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" show-overflow-tooltip></el-table-column>
                <el-table-column label="操作" width="120">
                    <template #default="scope">
                        <el-button size="small" text type="warning" @click="onRollback(scope.row)"
                                   v-if="scope.row.isRollback !== 1">回滚
                        </el-button>
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
        <!-- 盘点调整弹窗 -->
        <el-dialog title="盘点调整" :visible.sync="state.adjustDialog.isShowDialog" width="500px">
            <el-form ref="adjustDialogFormRef" :model="state.adjustDialog.form" :rules="state.adjustDialog.rules"
                     size="default" label-width="100px">
                <el-row :gutter="35">
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="选择货物" prop="goodsId">
                            <el-select v-model="state.adjustDialog.form.goodsId" placeholder="请选择货物"
                                       class="w100" filterable>
                                <el-option v-for="item in state.goodsOptions" :key="item.goodsId"
                                           :label="item.goodsName" :value="item.goodsId">
                                    <span style="float: left">
                                        <el-image v-if="item.goodsImage" :src="item.goodsImage" 
                                                  :preview-src-list="[item.goodsImage]"
                                                  style="width: 30px; height: 30px; vertical-align: middle; margin-right: 8px; cursor: pointer;" 
                                                  fit="cover"></el-image>
                                        {{ item.goodsName }}
                                    </span>
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="调整数量" prop="adjustQuantity">
                            <el-input-number v-model="state.adjustDialog.form.adjustQuantity"
                                             controls-position="right" class="w100"></el-input-number>
                            <div class="el-form-item__tip mt5">
                                正数为增加库存，负数为减少库存
                            </div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="盘点原因">
                            <el-input v-model="state.adjustDialog.form.reason" type="textarea" :rows="3"
                                      placeholder="请输入盘点原因" clearable></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <template #footer>
				<span class="dialog-footer">
					<el-button @click="state.adjustDialog.isShowDialog = false" size="default">取 消</el-button>
					<el-button type="primary" @click="onAdjustSubmit" :loading="state.adjustDialog.loading"
                               size="default">确 定</el-button>
				</span>
            </template>
        </el-dialog>
    </div>
</template>

<script>
    import {useStocktakeApi} from '@/api/warehouse/stocktake';
    import {useGoodsApi} from '@/api/warehouse/goods';
    import {Message, MessageBox} from 'element-ui';

    export default {
        name: "warehouseStocktake",
        data() {
            return {
                state: {
                    goodsOptions: [],
                    tableData: {
                        data: [],
                        total: 0,
                        loading: false,
                        param: {
                            page: 1,
                            size: 10,
                            stockType: ''
                        }
                    },
                    adjustDialog: {
                        isShowDialog: false,
                        loading: false,
                        form: {
                            goodsId: '',
                            adjustQuantity: 0,
                            reason: ''
                        },
                        rules: {
                            goodsId: [{required: true, message: '请选择货物', trigger: 'change'}],
                            adjustQuantity: [{required: true, message: '请输入调整数量', trigger: 'blur'}]
                        }
                    }
                }
            }
        },
        methods: {
            fetchData() {
                this.state.tableData.loading = true
                useStocktakeApi().list(this.state.tableData.param).then(response => {
                    this.state.tableData.data = response.data.records
                    this.state.tableData.total = response.data.total
                    this.state.tableData.loading = false
                }).catch(() => {
                    this.state.tableData.loading = false
                })
            },
            fetchGoodsOptions() {
                useGoodsApi().options().then(response => {
                    this.state.goodsOptions = response.data
                })
            },
            onOpenAdjust() {
                this.state.adjustDialog.form = {
                    goodsId: '',
                    adjustQuantity: 0,
                    reason: ''
                }
                this.state.adjustDialog.isShowDialog = true
            },
            onAdjustSubmit() {
                this.$refs.adjustDialogFormRef.validate((valid) => {
                    if (valid) {
                        if (this.state.adjustDialog.form.adjustQuantity === 0) {
                            Message.warning('调整数量不能为0')
                            return
                        }
                        this.state.adjustDialog.loading = true
                        useStocktakeApi().adjustGoods(this.state.adjustDialog.form).then(() => {
                            this.state.adjustDialog.loading = false
                            this.state.adjustDialog.isShowDialog = false
                            Message.success('盘点调整成功')
                            this.fetchData()
                        }).catch(() => {
                            this.state.adjustDialog.loading = false
                        })
                    }
                })
            },
            onRollback(row) {
                MessageBox.confirm(`确定要回滚盘点记录："${row.recordId}"吗？此操作只能执行一次。`, '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    useStocktakeApi().rollback(row.recordId).then(() => {
                        Message.success('回滚成功')
                        this.fetchData()
                    })
                }).catch(() => {
                });
            },
            handleSizeChange(pageSize) {
                this.state.tableData.data = []
                this.state.tableData.param.size = pageSize
                this.fetchData()
            },
            handleCurrentChange(current) {
                this.state.tableData.data = []
                this.state.tableData.param.page = current
                this.fetchData()
            }
        },
        mounted() {
            this.fetchData()
            this.fetchGoodsOptions()
        }
    }
</script>

<style scoped>
.el-form-item__tip {
    font-size: 12px;
    color: #909399;
}
</style>
