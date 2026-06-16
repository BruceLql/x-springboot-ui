<template>
    <div class="warehouse-outbound-container layout-padding">
        <el-card shadow="hover" class="layout-padding-auto">
            <div class="system-user-search mb15">
                <el-select size="default" v-model="state.tableData.param.orderType" placeholder="出库类型"
                           style="max-width: 150px" clearable>
                    <el-option label="报损" value="DAMAGE"></el-option>
                    <el-option label="组货流转" value="COMBINATION"></el-option>
                    <el-option label="销售" value="SALE"></el-option>
                </el-select>
                <el-select size="default" v-model="state.tableData.param.sourceId" placeholder="选择货物"
                           style="max-width: 180px; margin-left: 10px" clearable filterable>
                    <el-option v-for="item in state.goodsOptions" :key="item.goodsId"
                               :label="item.goodsName" :value="item.goodsId"></el-option>
                </el-select>
                <el-button size="default" type="primary" class="ml10" @click="fetchData()">
                    <el-icon>
                        <ele-Search/>
                    </el-icon>
                    查询
                </el-button>
                <el-button size="default" type="danger" class="ml10" @click="onOpenDamageOutbound">
                    <el-icon>
                        <ele-Delete/>
                    </el-icon>
                    报损出库
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column type="index" label="序号" width="60"/>
                <el-table-column prop="orderId" label="订单ID" show-overflow-tooltip></el-table-column>
                <el-table-column prop="orderType" label="出库类型" show-overflow-tooltip>
                    <template #default="scope">
                        <el-tag :type="getOrderTypeStyle(scope.row.orderType)">{{ getOrderTypeText(scope.row.orderType) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="sourceType" label="来源类型" show-overflow-tooltip></el-table-column>
                <el-table-column prop="sourceId" label="货物ID" show-overflow-tooltip></el-table-column>
                <el-table-column prop="quantity" label="出库数量" show-overflow-tooltip></el-table-column>
                <el-table-column prop="reason" label="出库原因" show-overflow-tooltip></el-table-column>
                <el-table-column prop="relatedOrderNo" label="关联单号" show-overflow-tooltip></el-table-column>
                <el-table-column prop="status" label="状态" show-overflow-tooltip>
                    <template #default="scope">
                        <el-tag type="success" v-if="scope.row.status == 1">已完成</el-tag>
                        <el-tag type="info" v-else>已取消</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" show-overflow-tooltip></el-table-column>
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
        <!-- 报损出库弹窗 -->
        <el-dialog title="报损出库" :visible.sync="state.damageDialog.isShowDialog" width="500px">
            <el-form ref="damageDialogFormRef" :model="state.damageDialog.form" :rules="state.damageDialog.rules"
                     size="default" label-width="90px">
                <el-row :gutter="35">
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="选择货物" prop="goodsId">
                            <el-select v-model="state.damageDialog.form.goodsId" placeholder="请选择货物"
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
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="出库数量" prop="quantity">
                            <el-input-number v-model="state.damageDialog.form.quantity" :min="1"
                                             controls-position="right" class="w100"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="出库原因">
                            <el-input v-model="state.damageDialog.form.reason" type="textarea" :rows="3"
                                      placeholder="请输入报损原因" clearable></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <template #footer>
				<span class="dialog-footer">
					<el-button @click="state.damageDialog.isShowDialog = false" size="default">取 消</el-button>
					<el-button type="danger" @click="onDamageSubmit" :loading="state.damageDialog.loading"
                               size="default">确 定</el-button>
				</span>
            </template>
        </el-dialog>
    </div>
</template>

<script>
    import {useOutboundApi} from '@/api/warehouse/outbound';
    import {useGoodsApi} from '@/api/warehouse/goods';
    import {Message} from 'element-ui';

    export default {
        name: "warehouseOutbound",
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
                            orderType: '',
                            sourceId: ''
                        }
                    },
                    damageDialog: {
                        isShowDialog: false,
                        loading: false,
                        form: {
                            goodsId: '',
                            quantity: 1,
                            reason: ''
                        },
                        rules: {
                            goodsId: [{required: true, message: '请选择货物', trigger: 'change'}],
                            quantity: [{required: true, message: '请输入出库数量', trigger: 'blur'}]
                        }
                    }
                }
            }
        },
        methods: {
            getOrderTypeText(type) {
                const map = {
                    'DAMAGE': '报损',
                    'COMBINATION': '组货流转',
                    'SALE': '销售'
                }
                return map[type] || type
            },
            getOrderTypeStyle(type) {
                const map = {
                    'DAMAGE': 'danger',
                    'COMBINATION': 'warning',
                    'SALE': 'success'
                }
                return map[type] || 'info'
            },
            fetchData() {
                this.state.tableData.loading = true
                useOutboundApi().list(this.state.tableData.param).then(response => {
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
            onOpenDamageOutbound() {
                this.state.damageDialog.form = {
                    goodsId: '',
                    quantity: 1,
                    reason: ''
                }
                this.state.damageDialog.isShowDialog = true
            },
            onDamageSubmit() {
                this.$refs.damageDialogFormRef.validate((valid) => {
                    if (valid) {
                        this.state.damageDialog.loading = true
                        useOutboundApi().damage(this.state.damageDialog.form).then(() => {
                            this.state.damageDialog.loading = false
                            this.state.damageDialog.isShowDialog = false
                            Message.success('报损出库成功')
                            this.fetchData()
                        }).catch(() => {
                            this.state.damageDialog.loading = false
                        })
                    }
                })
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
</style>
