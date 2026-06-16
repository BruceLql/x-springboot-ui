<template>
    <div>
        <el-form :inline="true" :model="state.tableData.param" ref="queryForm" class="mb15">
            <el-form-item label="SKU名称">
                <el-input v-model="state.tableData.param.skuName" placeholder="请输入SKU名称"
                          clearable style="width: 200px;" @keyup.enter.native="fetchData"></el-input>
            </el-form-item>
            <el-form-item label="状态">
                <el-select v-model="state.tableData.param.status" placeholder="请选择" clearable style="width: 150px;">
                    <el-option label="已取消" :value="0"></el-option>
                    <el-option label="待布款" :value="1"></el-option>
                    <el-option label="已布款" :value="2"></el-option>
                    <el-option label="布款回滚" :value="3"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="small" @click="fetchData">搜索</el-button>
                <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-table :data="state.tableData.data" style="width: 100%" v-loading="state.tableData.loading" border>
            <el-table-column prop="skuId" label="SKU ID" width="180" show-overflow-tooltip></el-table-column>
            <el-table-column label="SKU图片" width="80">
                <template #default="scope">
                    <el-image v-if="scope.row.skuImage" :src="scope.row.skuImage"
                              :preview-src-list="[scope.row.skuImage]"
                              style="width: 40px; height: 40px; cursor: pointer;" fit="cover"></el-image>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column prop="skuName" label="SKU名称" show-overflow-tooltip></el-table-column>
            <el-table-column prop="preAllocateQuantity" label="预分配数量" width="120" align="center"></el-table-column>
            <el-table-column prop="statusDesc" label="状态" width="100">
                <template #default="scope">
                    <el-tag :type="getStatusType(scope.row.status)" size="small">
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
    name: "warehouseSkuInventory",
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
                        skuName: '',
                        status: ''
                    }
                }
            }
        }
    },
    methods: {
        getStatusType(status) {
            const typeMap = {
                0: 'info',
                1: 'warning',
                2: 'success',
                3: ''
            };
            return typeMap[status] || 'info';
        },
        fetchData() {
            this.state.tableData.loading = true
            useInventoryApi().skuList(this.state.tableData.param).then(response => {
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
                skuName: '',
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
