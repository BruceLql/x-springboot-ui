<template>
    <div>
        <el-form :inline="true" :model="state.tableData.param" ref="queryForm" class="mb15">
            <el-form-item label="货物名称">
                <el-input v-model="state.tableData.param.goodsName" placeholder="请输入货物名称"
                          clearable style="width: 200px;" @keyup.enter.native="fetchData"></el-input>
            </el-form-item>
            <el-form-item label="类目">
                <el-input v-model="state.tableData.param.category" placeholder="请输入类目"
                          clearable style="width: 150px;" @keyup.enter.native="fetchData"></el-input>
            </el-form-item>
            <el-form-item label="商品分类">
                <el-select v-model="state.tableData.param.productType" placeholder="请选择" clearable style="width: 150px;">
                    <el-option label="男款" value="MALE"></el-option>
                    <el-option label="女款" value="FEMALE"></el-option>
                    <el-option label="儿童款" value="CHILDREN"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="状态">
                <el-select v-model="state.tableData.param.status" placeholder="请选择" clearable style="width: 120px;">
                    <el-option label="启用" :value="1"></el-option>
                    <el-option label="禁用" :value="0"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="small" @click="fetchData">搜索</el-button>
                <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-table :data="state.tableData.data" style="width: 100%" v-loading="state.tableData.loading" border>
            <el-table-column prop="goodsId" label="货物ID" width="180" show-overflow-tooltip></el-table-column>
            <el-table-column label="货物图片" width="80">
                <template #default="scope">
                    <el-image v-if="scope.row.goodsImage" :src="scope.row.goodsImage"
                              :preview-src-list="[scope.row.goodsImage]"
                              style="width: 40px; height: 40px; cursor: pointer;" fit="cover"></el-image>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column prop="goodsName" label="货物名称" show-overflow-tooltip></el-table-column>
            <el-table-column prop="category" label="类目" width="100"></el-table-column>
            <el-table-column prop="productTypeDesc" label="商品分类" width="100"></el-table-column>
            <el-table-column prop="statusDesc" label="状态" width="80">
                <template #default="scope">
                    <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small">
                        {{ scope.row.statusDesc }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="实际库存" width="100" align="center">
                <template #default="scope">
                    <span class="inventory-number">{{ scope.row.realQuantity }}</span>
                </template>
            </el-table-column>
            <el-table-column label="锁定库存" width="100" align="center">
                <template #default="scope">
                    <span class="inventory-number warning">{{ scope.row.withholdQuantity }}</span>
                </template>
            </el-table-column>
            <el-table-column label="占用库存" width="100" align="center">
                <template #default="scope">
                    <span class="inventory-number info">{{ scope.row.occupyQuantity }}</span>
                </template>
            </el-table-column>
            <el-table-column label="可售库存" width="100" align="center">
                <template #default="scope">
                    <span class="inventory-number success">{{ scope.row.sellableQuantity }}</span>
                </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
        </el-table>

        <el-pagination class="mt15"
                       :current-page="state.tableData.param.page"
                       :page-sizes="[10, 20, 50, 100]"
                       :page-size="state.tableData.param.size"
                       layout="total, sizes, prev, pager, next, jumper"
                       :total="state.tableData.total"
                       background
                       @size-change="handleSizeChange"
                       @current-change="handleCurrentChange">
        </el-pagination>
    </div>
</template>

<script>
import {useInventoryApi} from '@/api/warehouse/inventory';

export default {
    name: "warehouseGoodsInventory",
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
                        goodsName: '',
                        category: '',
                        productType: '',
                        status: ''
                    }
                }
            }
        }
    },
    methods: {
        fetchData() {
            this.state.tableData.loading = true
            useInventoryApi().goodsList(this.state.tableData.param).then(response => {
                this.state.tableData.loading = false
                // 兼容不同的返回格式
                if (Array.isArray(response.data)) {
                    this.state.tableData.data = response.data
                    this.state.tableData.total = response.data.length
                } else if (response.data && response.data.records) {
                    this.state.tableData.data = response.data.records
                    this.state.tableData.total = response.data.total || 0
                } else if (response.data && response.data.list) {
                    this.state.tableData.data = response.data.list
                    this.state.tableData.total = response.data.total || 0
                } else {
                    this.state.tableData.data = []
                    this.state.tableData.total = 0
                }
            }).catch(() => {
                this.state.tableData.loading = false
            })
        },
        resetQuery() {
            this.state.tableData.param = {
                page: 1,
                size: 10,
                goodsName: '',
                category: '',
                productType: '',
                status: ''
            }
            this.fetchData()
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
    }
}
</script>

<style lang="scss" scoped>
.inventory-number {
    font-weight: bold;
    font-size: 14px;
    &.success {
        color: #67C23A;
    }
    &.warning {
        color: #E6A23C;
    }
    &.info {
        color: #909399;
    }
}
</style>
