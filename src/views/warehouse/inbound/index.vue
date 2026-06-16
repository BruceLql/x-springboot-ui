<template>
    <div class="warehouse-inbound-container layout-padding">
        <el-card shadow="hover" class="layout-padding-auto">
            <div class="system-user-search mb15">
                <el-input size="default" v-model="state.tableData.param.batchNo" placeholder="请输入批次号"
                          style="max-width: 180px" clearable></el-input>
                <el-select size="default" v-model="state.tableData.param.supplierId" placeholder="选择供应商"
                           style="max-width: 180px; margin-left: 10px" clearable>
                    <el-option v-for="item in state.supplierOptions" :key="item.supplierId"
                               :label="item.supplierName" :value="item.supplierId"></el-option>
                </el-select>
                <el-select size="default" v-model="state.tableData.param.status" placeholder="状态"
                           style="max-width: 120px; margin-left: 10px" clearable>
                    <el-option label="已完成" :value="1"></el-option>
                    <el-option label="已取消" :value="0"></el-option>
                </el-select>
                <el-button size="default" type="primary" class="ml10" @click="fetchData()">
                    <el-icon>
                        <ele-Search/>
                    </el-icon>
                    查询
                </el-button>
                <el-button size="default" type="success" class="ml10" @click="onOpenBatchInbound">
                    <el-icon>
                        <ele-FolderAdd/>
                    </el-icon>
                    批量入库
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column type="index" label="序号" width="60"/>
                <el-table-column prop="orderId" label="订单ID" show-overflow-tooltip></el-table-column>
                <el-table-column prop="batchNo" label="批次号" show-overflow-tooltip></el-table-column>
                <el-table-column prop="supplierId" label="供应商" show-overflow-tooltip>
                    <template #default="scope">
                        {{ getSupplierName(scope.row.supplierId) }}
                    </template>
                </el-table-column>
                <el-table-column prop="totalQuantity" label="总数量" show-overflow-tooltip></el-table-column>
                <el-table-column prop="totalCost" label="总成本(元)" show-overflow-tooltip></el-table-column>
                <el-table-column prop="status" label="状态" show-overflow-tooltip>
                    <template #default="scope">
                        <el-tag type="success" v-if="scope.row.status == 1">已完成</el-tag>
                        <el-tag type="info" v-else>已取消</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" show-overflow-tooltip></el-table-column>
                <el-table-column prop="createTime" label="创建时间" show-overflow-tooltip></el-table-column>
                <el-table-column label="操作" width="200">
                    <template #default="scope">
                        <el-button size="small" text type="primary" @click="onViewDetail(scope.row)">查看明细
                        </el-button>
                        <el-button size="small" text type="danger" @click="onCancelInbound(scope.row)"
                                   v-if="scope.row.status == 1">取消
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
        <!-- 批量入库弹窗 -->
        <el-dialog title="批量入库" :visible.sync="state.batchDialog.isShowDialog" width="800px">
            <el-form ref="batchDialogFormRef" :model="state.batchDialog.form" :rules="state.batchDialog.rules"
                     size="default" label-width="90px">
                <el-row :gutter="35">
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="供应商" prop="supplierId">
                            <el-select v-model="state.batchDialog.form.supplierId" placeholder="请选择供应商"
                                       class="w100" @change="onSupplierChange">
                                <el-option v-for="item in state.supplierOptions" :key="item.supplierId"
                                           :label="item.supplierName" :value="item.supplierId"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="备注">
                            <el-input v-model="state.batchDialog.form.remark" placeholder="请输入备注"
                                      clearable></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-divider content-position="left">入库明细</el-divider>
                <div class="mb15">
                    <el-button size="small" type="primary" @click="addInboundItem" :disabled="!state.batchDialog.form.supplierId">
                        添加货物
                    </el-button>
                </div>
                <el-table :data="state.batchDialog.form.items" style="width: 100%" size="small">
                    <el-table-column label="货物" show-overflow-tooltip min-width="200">
                        <template #default="scope">
                            <div v-if="scope.row.goodsId" class="goods-display">
                                <el-image v-if="getGoodsImage(scope.row.goodsId)" 
                                          :src="getGoodsImage(scope.row.goodsId)"
                                          :preview-src-list="[getGoodsImage(scope.row.goodsId)]"
                                          style="width: 40px; height: 40px; margin-right: 8px; flex-shrink: 0; cursor: pointer;" 
                                          fit="cover"></el-image>
                                <span class="goods-name-text">{{ getGoodsName(scope.row.goodsId) }}</span>
                            </div>
                            <el-select v-else v-model="scope.row.goodsId" placeholder="请选择货物" size="small"
                                       @change="(val) => onGoodsSelect(val, scope.$index)">
                                <el-option v-for="item in state.batchDialog.availableGoods" :key="item.goodsId"
                                           :label="item.goodsName" :value="item.goodsId">
                                    <span class="goods-option">
                                        <el-image v-if="item.goodsImage" :src="item.goodsImage" 
                                                  style="width: 30px; height: 30px; vertical-align: middle; margin-right: 8px;" 
                                                  fit="cover"></el-image>
                                        {{ item.goodsName }}
                                    </span>
                                </el-option>
                            </el-select>
                        </template>
                    </el-table-column>
                    <el-table-column prop="quantity" label="数量" width="150">
                        <template #default="scope">
                            <el-input-number v-model="scope.row.quantity" :min="1" size="small"
                                             controls-position="right"></el-input-number>
                        </template>
                    </el-table-column>
                    <el-table-column prop="unitCost" label="单价(元)" width="150">
                        <template #default="scope">
                            <el-input-number v-model="scope.row.unitCost" :min="0" :precision="2" size="small"
                                             controls-position="right"></el-input-number>
                        </template>
                    </el-table-column>
                    <el-table-column label="小计(元)" width="120">
                        <template #default="scope">
                            {{ (scope.row.quantity * scope.row.unitCost).toFixed(2) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="80">
                        <template #default="scope">
                            <el-button size="mini" text type="danger" @click="removeInboundItem(scope.$index)">删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <div class="mt15 total-cost-display" v-if="state.batchDialog.form.items.length > 0">
                    <span class="total-label">入库总成本：</span>
                    <span class="total-value">{{ getTotalCost }}</span>
                    <span class="total-unit">元</span>
                </div>
            </el-form>
            <template #footer>
				<span class="dialog-footer">
					<el-button @click="state.batchDialog.isShowDialog = false" size="default">取 消</el-button>
					<el-button type="primary" @click="onBatchSubmit" :loading="state.batchDialog.loading"
                               size="default">确 定</el-button>
				</span>
            </template>
        </el-dialog>
        <!-- 入库明细弹窗 -->
        <el-dialog title="入库明细" :visible.sync="state.detailDialog.isShowDialog" width="800px">
            <el-descriptions :column="2" border class="mb20">
                <el-descriptions-item label="批次号">{{ state.detailDialog.orderInfo.batchNo }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <el-tag type="success" v-if="state.detailDialog.orderInfo.status == 1">已完成</el-tag>
                    <el-tag type="info" v-else>已取消</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="总数量">{{ state.detailDialog.orderInfo.totalQuantity }}</el-descriptions-item>
                <el-descriptions-item label="总成本">{{ state.detailDialog.orderInfo.totalCost }} 元</el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">{{ state.detailDialog.orderInfo.remark }}</el-descriptions-item>
            </el-descriptions>
            <el-table :data="state.detailDialog.items" style="width: 100%" size="small">
                <el-table-column type="index" label="序号" width="60"/>
                <el-table-column prop="goodsId" label="货物ID" show-overflow-tooltip></el-table-column>
                <el-table-column prop="goodsName" label="货物名称" show-overflow-tooltip></el-table-column>
                <el-table-column prop="goodsImage" label="货物图片" width="80">
                    <template #default="scope">
                        <el-image v-if="scope.row.goodsImage" :src="scope.row.goodsImage"
                                  :preview-src-list="[scope.row.goodsImage]"
                                  style="width: 50px; height: 50px; cursor: pointer;" fit="cover"></el-image>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                <el-table-column prop="quantity" label="数量"></el-table-column>
                <el-table-column prop="unitCost" label="单价(元)"></el-table-column>
                <el-table-column prop="totalCost" label="小计(元)"></el-table-column>
                <el-table-column prop="createTime" label="入库时间" show-overflow-tooltip></el-table-column>
            </el-table>
        </el-dialog>
    </div>
</template>

<script>
    import {useInboundApi} from '@/api/warehouse/inbound';
    import {useSupplierApi} from '@/api/warehouse/supplier';
    import {Message, MessageBox} from 'element-ui';

    export default {
        name: "warehouseInbound",
        data() {
            return {
                state: {
                    supplierOptions: [],
                    tableData: {
                        data: [],
                        total: 0,
                        loading: false,
                        param: {
                            page: 1,
                            size: 10,
                            batchNo: '',
                            supplierId: '',
                            status: ''
                        }
                    },
                    batchDialog: {
                        isShowDialog: false,
                        loading: false,
                        availableGoods: [],
                        form: {
                            supplierId: '',
                            remark: '',
                            items: []
                        },
                        rules: {
                            supplierId: [{required: true, message: '请选择供应商', trigger: 'change'}]
                        }
                    },
                    detailDialog: {
                        isShowDialog: false,
                        orderInfo: {},
                        items: []
                    }
                }
            }
        },
        computed: {
            getTotalCost() {
                return this.state.batchDialog.form.items.reduce((sum, item) => {
                    return sum + (item.quantity * item.unitCost)
                }, 0).toFixed(2)
            }
        },
        methods: {
            getSupplierName(supplierId) {
                const supplier = this.state.supplierOptions.find(item => item.supplierId === supplierId)
                return supplier ? supplier.supplierName : supplierId
            },
            fetchData() {
                this.state.tableData.loading = true
                useInboundApi().list(this.state.tableData.param).then(response => {
                    this.state.tableData.data = response.data.records
                    this.state.tableData.total = response.data.total
                    this.state.tableData.loading = false
                }).catch(() => {
                    this.state.tableData.loading = false
                })
            },
            fetchSupplierOptions() {
                useSupplierApi().options().then(response => {
                    this.state.supplierOptions = response.data
                })
            },
            onOpenBatchInbound() {
                this.state.batchDialog.form = {
                    supplierId: '',
                    remark: '',
                    items: []
                }
                this.state.batchDialog.availableGoods = []
                this.state.batchDialog.isShowDialog = true
            },
            onSupplierChange(supplierId) {
                // 获取供应商关联的货物
                useSupplierApi().getGoods(supplierId).then(response => {
                    this.state.batchDialog.availableGoods = response.data
                    this.state.batchDialog.form.items = []
                })
            },
            addInboundItem() {
                this.state.batchDialog.form.items.push({
                    goodsId: '',
                    quantity: 1,
                    unitCost: 0
                })
            },
            removeInboundItem(index) {
                this.state.batchDialog.form.items.splice(index, 1)
            },
            onGoodsSelect(goodsId, index) {
                // 选择货物后，可以自动填充单价等信息
                const goods = this.state.batchDialog.availableGoods.find(item => item.goodsId === goodsId);
                if (goods) {
                    // 如果需要，可以在这里设置默认单价
                    // this.state.batchDialog.form.items[index].unitCost = goods.defaultPrice || 0;
                }
            },
            getGoodsName(goodsId) {
                const goods = this.state.batchDialog.availableGoods.find(item => item.goodsId === goodsId);
                return goods ? goods.goodsName : goodsId;
            },
            getGoodsImage(goodsId) {
                const goods = this.state.batchDialog.availableGoods.find(item => item.goodsId === goodsId);
                return goods ? goods.goodsImage : '';
            },
            onBatchSubmit() {
                this.$refs.batchDialogFormRef.validate((valid) => {
                    if (valid) {
                        if (this.state.batchDialog.form.items.length === 0) {
                            Message.warning('请添加入库明细')
                            return
                        }
                        // 验证明细
                        for (const item of this.state.batchDialog.form.items) {
                            if (!item.goodsId) {
                                Message.warning('请选择货物')
                                return
                            }
                            if (!item.quantity || item.quantity < 1) {
                                Message.warning('请输入有效的数量')
                                return
                            }
                            if (item.unitCost < 0) {
                                Message.warning('单价不能为负数')
                                return
                            }
                        }
                        this.state.batchDialog.loading = true
                        useInboundApi().batch(this.state.batchDialog.form).then((response) => {
                            this.state.batchDialog.loading = false
                            this.state.batchDialog.isShowDialog = false
                            Message.success('入库成功，批次号：' + response.data)
                            this.fetchData()
                        }).catch(() => {
                            this.state.batchDialog.loading = false
                        })
                    }
                })
            },
            onViewDetail(row) {
                useInboundApi().detail(row.orderId).then(response => {
                    this.state.detailDialog.orderInfo = response.data
                })
                useInboundApi().items(row.orderId).then(response => {
                    this.state.detailDialog.items = response.data
                    this.state.detailDialog.isShowDialog = true
                })
            },
            onCancelInbound(row) {
                MessageBox.confirm(`确定要取消入库批次："${row.batchNo}"吗?`, '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    useInboundApi().cancel(row.batchNo).then(() => {
                        Message.success('取消成功')
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
            this.fetchSupplierOptions()
        }
    }
</script>

<style scoped>
</style>
