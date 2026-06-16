<template>
    <div class="warehouse-supplier-container layout-padding">
        <el-card shadow="hover" class="layout-padding-auto">
            <div class="system-user-search mb15">
                <el-input size="default" v-model="state.tableData.param.supplierName" placeholder="请输入供应商名称"
                          style="max-width: 180px" clearable></el-input>
                <el-select size="default" v-model="state.tableData.param.supplierType" placeholder="供应商类型"
                           style="max-width: 150px; margin-left: 10px" clearable>
                    <el-option label="源头厂家" value="FACTORY"></el-option>
                    <el-option label="二道贩子" value="DEALER"></el-option>
                </el-select>
                <el-select size="default" v-model="state.tableData.param.status" placeholder="状态"
                           style="max-width: 120px; margin-left: 10px" clearable>
                    <el-option label="启用" :value="1"></el-option>
                    <el-option label="禁用" :value="0"></el-option>
                </el-select>
                <el-button size="default" type="primary" class="ml10" @click="fetchData()">
                    <el-icon>
                        <ele-Search/>
                    </el-icon>
                    查询
                </el-button>
                <el-button size="default" type="success" class="ml10" @click="onOpenAddOrEdit('add')">
                    <el-icon>
                        <ele-FolderAdd/>
                    </el-icon>
                    新增供应商
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column type="index" label="序号" width="60"/>
                <el-table-column prop="supplierId" label="供应商ID" show-overflow-tooltip></el-table-column>
                <el-table-column prop="supplierName" label="供应商名称" show-overflow-tooltip></el-table-column>
                <el-table-column prop="address" label="地址" show-overflow-tooltip></el-table-column>
                <el-table-column prop="contactPhone" label="联系电话" show-overflow-tooltip></el-table-column>
                <el-table-column prop="supplierTypeDesc" label="供应商类型" show-overflow-tooltip></el-table-column>
                <el-table-column prop="status" label="状态" show-overflow-tooltip>
                    <template #default="scope">
                        <el-tag type="success" v-if="scope.row.status == 1">启用</el-tag>
                        <el-tag type="info" v-else>禁用</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" show-overflow-tooltip></el-table-column>
                <el-table-column label="操作" width="280">
                    <template #default="scope">
                        <el-button size="small" text type="primary" @click="onViewDetail(scope.row)">详情
                        </el-button>
                        <el-button size="small" text type="primary" @click="onOpenAddOrEdit('edit', scope.row)">修改
                        </el-button>
                        <el-button size="small" text type="danger" @click="onRowDel(scope.row)">删除</el-button>
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
        <!-- 新增/编辑弹窗 -->
        <el-dialog :title="state.dialog.title" :visible.sync="state.dialog.isShowDialog" width="600px">
            <el-form ref="supplierDialogFormRef" :model="state.ruleForm" :rules="state.rules" size="default"
                     label-width="90px">
                <el-row :gutter="35">
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="供应商名称" prop="supplierName">
                            <el-input v-model="state.ruleForm.supplierName" placeholder="请输入供应商名称"
                                      clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="地址">
                            <el-input v-model="state.ruleForm.address" placeholder="请输入地址" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="联系电话">
                            <el-input v-model="state.ruleForm.contactPhone" placeholder="请输入联系电话"
                                      clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="供应商类型" prop="supplierType">
                            <el-select v-model="state.ruleForm.supplierType" placeholder="请选择供应商类型" class="w100">
                                <el-option label="源头厂家" value="FACTORY"></el-option>
                                <el-option label="二道贩子" value="DEALER"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20"
                            v-if="state.dialog.type === 'edit'">
                        <el-form-item label="状态">
                            <el-radio-group v-model="state.ruleForm.status">
                                <el-radio-button :label="1">启用</el-radio-button>
                                <el-radio-button :label="0">禁用</el-radio-button>
                            </el-radio-group>
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
        <!-- 详情弹窗 -->
        <el-dialog title="供应商详情" :visible.sync="state.detailDialog.isShowDialog" width="800px">
            <el-descriptions :column="2" border>
                <el-descriptions-item label="供应商ID">{{ state.detailData.supplierId }}</el-descriptions-item>
                <el-descriptions-item label="供应商名称">{{ state.detailData.supplierName }}</el-descriptions-item>
                <el-descriptions-item label="地址">{{ state.detailData.address }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ state.detailData.contactPhone }}</el-descriptions-item>
                <el-descriptions-item label="供应商类型">{{ state.detailData.supplierTypeDesc }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <el-tag type="success" v-if="state.detailData.status == 1">启用</el-tag>
                    <el-tag type="info" v-else>禁用</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ state.detailData.createTime }}</el-descriptions-item>
                <el-descriptions-item label="更新时间">{{ state.detailData.updateTime }}</el-descriptions-item>
            </el-descriptions>
            <el-divider content-position="left">关联货物</el-divider>
            <div class="mb15">
                <el-button size="small" type="primary" @click="onOpenBindGoods">绑定货物</el-button>
            </div>
            <el-table :data="state.detailData.goodsList" style="width: 100%" size="small">
                <el-table-column prop="goodsName" label="货物名称" show-overflow-tooltip></el-table-column>
                <el-table-column prop="goodsImage" label="图片" width="80">
                    <template #default="scope">
                        <el-image v-if="scope.row.goodsImage" :src="scope.row.goodsImage"
                                  :preview-src-list="[scope.row.goodsImage]"
                                  style="width: 40px; height: 40px; cursor: pointer;" fit="cover"></el-image>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                <el-table-column prop="productTypeDesc" label="商品分类"></el-table-column>
                <el-table-column prop="height" label="高度"></el-table-column>
                <el-table-column prop="weight" label="重量"></el-table-column>
                <el-table-column label="操作" width="100">
                    <template #default="scope">
                        <el-button size="mini" text type="danger" @click="onUnbindGoods(scope.row)">解绑</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>
        <!-- 绑定货物弹窗 -->
        <el-dialog title="绑定货物" :visible.sync="state.bindGoodsDialog.isShowDialog" width="800px">
            <el-transfer
                    v-model="state.bindGoodsDialog.selectedGoods"
                    :data="state.bindGoodsDialog.allGoods"
                    :titles="['可选货物', '已选货物']"
                    :props="{key: 'goodsId', label: 'goodsName'}"
                    filterable
                    filter-placeholder="搜索货物名称"
            >
                <span slot-scope="{ option }" class="transfer-item">
                    <el-image v-if="option.goodsImage" :src="option.goodsImage"
                              :preview-src-list="[option.goodsImage]"
                              style="width: 30px; height: 30px; vertical-align: middle; margin-right: 8px; cursor: pointer;"
                              fit="cover"></el-image>
                    {{ option.goodsName }}
                </span>
            </el-transfer>
            <template #footer>
				<span class="dialog-footer">
					<el-button @click="state.bindGoodsDialog.isShowDialog = false" size="default">取 消</el-button>
					<el-button type="primary" @click="onBindGoodsSubmit" :loading="state.bindGoodsDialog.loading"
                               size="default">确 定</el-button>
				</span>
            </template>
        </el-dialog>
    </div>
</template>

<script>
    import {useSupplierApi} from '@/api/warehouse/supplier';
    import {useGoodsApi} from '@/api/warehouse/goods';
    import {Message, MessageBox} from 'element-ui';

    export default {
        name: "warehouseSupplier",
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
                            supplierName: '',
                            supplierType: '',
                            status: ''
                        }
                    },
                    dialog: {
                        isShowDialog: false,
                        type: '',
                        title: '',
                        submitTxt: '',
                    },
                    detailDialog: {
                        isShowDialog: false
                    },
                    bindGoodsDialog: {
                        isShowDialog: false,
                        allGoods: [],
                        selectedGoods: [],
                        loading: false
                    },
                    detailData: {
                        goodsList: []
                    },
                    ruleForm: {
                        supplierId: '',
                        supplierName: '',
                        address: '',
                        contactPhone: '',
                        supplierType: '',
                        status: 1
                    },
                    rules: {
                        supplierName: [{required: true, message: '请输入供应商名称', trigger: 'blur'}],
                        supplierType: [{required: true, message: '请选择供应商类型', trigger: 'change'}]
                    },
                    submitBtn: {
                        loading: false,
                        type: ''
                    }
                }
            }
        },
        methods: {
            fetchData() {
                this.state.tableData.loading = true
                useSupplierApi().list(this.state.tableData.param).then(response => {
                    this.state.tableData.data = response.data.records
                    this.state.tableData.total = response.data.total
                    this.state.tableData.loading = false
                }).catch(() => {
                    this.state.tableData.loading = false
                })
            },
            onOpenAddOrEdit(type, row) {
                if (type === 'edit') {
                    this.state.submitBtn.type = 'edit';
                    this.state.ruleForm = {...row};
                    this.state.dialog.title = '修改供应商';
                    this.state.dialog.submitTxt = '修 改';
                } else {
                    this.state.ruleForm = {
                        supplierId: '',
                        supplierName: '',
                        address: '',
                        contactPhone: '',
                        supplierType: '',
                        status: 1
                    };
                    this.state.submitBtn.type = 'add';
                    this.state.dialog.title = '新增供应商';
                    this.state.dialog.submitTxt = '新 增';
                }
                this.state.dialog.type = type;
                this.state.dialog.isShowDialog = true;
            },
            onViewDetail(row) {
                useSupplierApi().info(row.supplierId).then(response => {
                    this.state.detailData = response.data
                    this.state.detailDialog.isShowDialog = true
                })
            },
            onOpenBindGoods() {
                // 获取所有货物
                useGoodsApi().options().then(response => {
                    // 过滤已绑定的货物
                    const bindedIds = this.state.detailData.goodsList.map(item => item.goodsId)
                    this.state.bindGoodsDialog.allGoods = response.data
                    this.state.bindGoodsDialog.selectedGoods = bindedIds
                    this.state.bindGoodsDialog.isShowDialog = true
                })
            },
            onBindGoodsSubmit() {
                this.state.bindGoodsDialog.loading = true
                const data = {
                    supplierId: this.state.detailData.supplierId,
                    goodsIds: this.state.bindGoodsDialog.selectedGoods
                }
                useSupplierApi().bindGoods(data).then(() => {
                    this.state.bindGoodsDialog.loading = false
                    this.state.bindGoodsDialog.isShowDialog = false
                    Message.success('绑定成功')
                    // 刷新详情
                    useSupplierApi().info(this.state.detailData.supplierId).then(response => {
                        this.state.detailData = response.data
                    })
                }).catch(() => {
                    this.state.bindGoodsDialog.loading = false
                })
            },
            onUnbindGoods(row) {
                MessageBox.confirm(`确定要解绑货物："${row.goodsName}"吗?`, '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    const data = {
                        supplierId: this.state.detailData.supplierId,
                        goodsId: row.goodsId
                    }
                    useSupplierApi().unbindGoods(data).then(() => {
                        Message.success('解绑成功')
                        // 刷新详情
                        useSupplierApi().info(this.state.detailData.supplierId).then(response => {
                            this.state.detailData = response.data
                        })
                    })
                }).catch(() => {
                });
            },
            onRowDel(row) {
                MessageBox.confirm(`此操作将永久删除供应商："${row.supplierName}"，是否继续?`, '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    this.deleteInfo(row)
                }).catch(() => {
                });
            },
            deleteInfo(row) {
                useSupplierApi().delete(row.supplierId).then(() => {
                    Message.success('删除成功');
                    this.fetchData()
                }).catch(() => {
                    this.fetchData()
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
            },
            closeDialog() {
                this.state.dialog.isShowDialog = false;
            },
            onCancel() {
                this.closeDialog();
            },
            onSubmit() {
                this.$refs.supplierDialogFormRef.validate((valid) => {
                    if (valid) {
                        this.state.submitBtn.loading = true;
                        if (this.state.submitBtn.type === 'edit') {
                            useSupplierApi().update(this.state.ruleForm).then(() => {
                                this.state.submitBtn.loading = false;
                                this.closeDialog();
                                Message.success('修改成功');
                                this.fetchData()
                            }).catch(() => {
                                this.state.submitBtn.loading = false
                            })
                        } else {
                            useSupplierApi().save(this.state.ruleForm).then(() => {
                                this.state.submitBtn.loading = false;
                                this.closeDialog();
                                Message.success('新增成功');
                                this.fetchData()
                            }).catch(() => {
                                this.state.submitBtn.loading = false
                            })
                        }
                    }
                })
            }
        },
        mounted() {
            this.fetchData()
        }
    }
</script>

<style lang="scss" scoped>
.transfer-item {
    display: inline-flex;
    align-items: center;
    line-height: 1;
}
</style>
