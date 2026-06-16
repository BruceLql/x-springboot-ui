<template>
    <div class="warehouse-combination-container layout-padding">
        <el-card shadow="hover" class="layout-padding-auto">
            <div class="system-user-search mb15">
                <el-input size="default" v-model="state.tableData.param.skuName" placeholder="请输入SKU名称"
                          style="max-width: 180px" clearable></el-input>
                <el-select size="default" v-model="state.tableData.param.status" placeholder="状态"
                           style="max-width: 150px; margin-left: 10px" clearable>
                    <el-option label="已取消" :value="0"></el-option>
                    <el-option label="待布款" :value="1"></el-option>
                    <el-option label="已布款" :value="2"></el-option>
                    <el-option label="布款回滚" :value="3"></el-option>
                </el-select>
                <el-button size="default" type="primary" class="ml10" @click="fetchData()">
                    <el-icon>
                        <ele-Search/>
                    </el-icon>
                    查询
                </el-button>
                <el-button size="default" type="success" class="ml10" @click="onOpenCreate">
                    <el-icon>
                        <ele-FolderAdd/>
                    </el-icon>
                    创建SKU搭配
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column type="index" label="序号" width="60"/>
                <el-table-column prop="skuId" label="SKU ID" show-overflow-tooltip></el-table-column>
                <el-table-column prop="skuName" label="SKU名称" show-overflow-tooltip></el-table-column>
                <el-table-column prop="skuImage" label="图片" width="80">
                    <template #default="scope">
                        <el-image v-if="scope.row.skuImage" :src="scope.row.skuImage"
                                  :preview-src-list="[scope.row.skuImage]"
                                  style="width: 50px; height: 50px; cursor: pointer;" fit="cover"></el-image>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                <el-table-column prop="preAllocateQuantity" label="预分配数量" show-overflow-tooltip></el-table-column>
                <el-table-column prop="goodsIds" label="货物ID" show-overflow-tooltip></el-table-column>
                <el-table-column prop="status" label="状态" show-overflow-tooltip>
                    <template #default="scope">
                        <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" show-overflow-tooltip></el-table-column>
                <el-table-column label="操作" width="320">
                    <template #default="scope">
                        <el-button size="small" text type="primary" @click="onViewDetail(scope.row)">详情</el-button>
                        <el-button size="small" text type="success" @click="onArrange(scope.row)"
                                   v-if="scope.row.status === 1">确定布款
                        </el-button>
                        <el-button size="small" text type="warning" @click="onCancel(scope.row)"
                                   v-if="scope.row.status === 1">取消布款
                        </el-button>
                        <el-button size="small" text type="info" @click="onRollback(scope.row)"
                                   v-if="scope.row.status === 2">布款回滚
                        </el-button>
                        <el-button size="small" text type="danger" @click="onDelete(scope.row)"
                                   v-if="scope.row.status === 1">删除
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
        <!-- 创建SKU弹窗 -->
        <el-dialog title="创建SKU搭配" :visible.sync="state.createDialog.isShowDialog" width="700px">
            <el-form ref="createDialogFormRef" :model="state.createDialog.form" :rules="state.createDialog.rules"
                     size="default" label-width="100px">
                <el-row :gutter="35">
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="SKU名称" prop="skuName">
                            <el-input v-model="state.createDialog.form.skuName" placeholder="请输入SKU名称"
                                      clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="SKU图片">
                            <el-upload
                                    class="sku-image-uploader"
                                    action="#"
                                    :http-request="customUpload"
                                    :show-file-list="false"
                                    :before-upload="beforeUpload"
                                    accept="image/*"
                            >
                                <el-image v-if="state.createDialog.form.skuImage" :src="state.createDialog.form.skuImage"
                                          :preview-src-list="[state.createDialog.form.skuImage]"
                                          style="width: 100px; height: 100px; object-fit: cover; display: block; cursor: pointer;"
                                          fit="cover"></el-image>
                                <i v-else class="el-icon-plus sku-image-uploader-icon"></i>
                            </el-upload>
                            <div class="upload-actions mt10">
                                <el-button size="mini" type="primary" @click="openCamera">
                                    <i class="el-icon-camera"></i> 拍照
                                </el-button>
                                <el-button v-if="state.createDialog.form.skuImage" size="mini" type="text" class="ml10"
                                           @click.stop="state.createDialog.form.skuImage = ''">移除图片
                                </el-button>
                            </div>
                            <input ref="cameraInput" type="file" accept="image/*" capture="environment" 
                                   style="display: none" @change="handleCameraCapture"/>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="预分配数量" prop="preAllocateQuantity">
                            <el-input-number v-model="state.createDialog.form.preAllocateQuantity" :min="1"
                                             controls-position="right" class="w100"></el-input-number>
                            <div v-if="getSelectedGoodsCount() > 0" class="el-form-item__hint">
                                选中货物最小库存：<span class="count-highlight">{{ getMinSelectedGoodsQuantity() }}</span>，预分配数量不能超过此值
                            </div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="选择货物" prop="goodsIds">
                            <div class="goods-selection-container">
                                <div class="mb10">
                                    <el-input v-model="state.createDialog.goodsSearchKeyword" 
                                              placeholder="搜索货物名称" 
                                              prefix-icon="el-icon-search"
                                              clearable
                                              style="width: 300px;">
                                    </el-input>
                                </div>
                                <el-table :data="filteredAvailableGoods" 
                                          style="width: 100%" 
                                          size="small"
                                          max-height="400"
                                          row-key="goodsId"
                                          ref="goodsTable"
                                          @select="handleGoodsSelect"
                                          @select-all="handleGoodsSelectAll">
                                    <el-table-column type="selection" width="55"
                                                     reserve-selection
                                                     :selectable="checkGoodsSelectable">
                                    </el-table-column>
                                    <el-table-column label="货物图片" width="80">
                                        <template #default="scope">
                                            <el-image v-if="scope.row.goodsImage" :src="scope.row.goodsImage"
                                                      :preview-src-list="[scope.row.goodsImage]"
                                                      style="width: 40px; height: 40px; cursor: pointer;" 
                                                      fit="cover"></el-image>
                                            <span v-else>-</span>
                                        </template>
                                    </el-table-column>
                                    <el-table-column prop="goodsName" label="货物名称" show-overflow-tooltip></el-table-column>
                                    <el-table-column label="库存" width="100" align="center">
                                        <template #default="scope">
                                            <span>{{ scope.row.quantity || '-' }}</span>
                                        </template>
                                    </el-table-column>
                                </el-table>
                                <div class="selected-summary mt10" v-if="getSelectedGoodsCount() > 0">
                                    已选择 <span class="count-highlight">{{ getSelectedGoodsCount() }}</span> 个货物
                                </div>
                            </div>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <template #footer>
				<span class="dialog-footer">
					<el-button @click="state.createDialog.isShowDialog = false" size="default">取 消</el-button>
					<el-button type="primary" @click="onCreateSubmit" :loading="state.createDialog.loading"
                               size="default">创 建</el-button>
				</span>
            </template>
        </el-dialog>
        <!-- SKU详情弹窗 -->
        <el-dialog title="SKU详情" :visible.sync="state.detailDialog.isShowDialog" width="800px">
            <el-descriptions :column="2" border>
                <el-descriptions-item label="SKU ID">{{ state.detailDialog.data.skuId }}</el-descriptions-item>
                <el-descriptions-item label="SKU名称">{{ state.detailDialog.data.skuName }}</el-descriptions-item>
                <el-descriptions-item label="预分配数量">{{ state.detailDialog.data.preAllocateQuantity }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <el-tag :type="getStatusType(state.detailDialog.data.status)">
                        {{ getStatusText(state.detailDialog.data.status) }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ state.detailDialog.data.createTime }}</el-descriptions-item>
                <el-descriptions-item label="更新时间">{{ state.detailDialog.data.updateTime }}</el-descriptions-item>
            </el-descriptions>
            <el-divider content-position="left">关联货物明细</el-divider>
            <el-table :data="state.detailDialog.data.goodsList || []" style="width: 100%" size="small" border>
                <el-table-column type="index" label="序号" width="60"/>
                <el-table-column prop="goodsName" label="货物名称" show-overflow-tooltip></el-table-column>
                <el-table-column prop="goodsImage" label="图片" width="80">
                    <template #default="scope">
                        <el-image v-if="scope.row.goodsImage" :src="scope.row.goodsImage"
                                  :preview-src-list="[scope.row.goodsImage]"
                                  style="width: 40px; height: 40px; cursor: pointer;" fit="cover"></el-image>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                <el-table-column prop="allocateQuantity" label="预分配数量">
                    <template #default="scope">
                        {{ scope.row.allocateQuantity || state.detailDialog.data.preAllocateQuantity }}
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>
    </div>
</template>

<script>
    import {useCombinationApi} from '@/api/warehouse/combination';
    import {useFileApi} from '@/api/warehouse/file';
    import {Message, MessageBox} from 'element-ui';

    export default {
        name: "warehouseCombination",
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
                    },
                    createDialog: {
                        isShowDialog: false,
                        loading: false,
                        availableGoods: [],
                        goodsSearchKeyword: '',
                        form: {
                            skuName: '',
                            skuImage: '',
                            preAllocateQuantity: 1,
                            goodsIds: []
                        },
                        rules: {
                            skuName: [{required: true, message: '请输入SKU名称', trigger: 'blur'}],
                            preAllocateQuantity: [{required: true, message: '请输入预分配数量', trigger: 'blur'}]
                        }
                    },
                    detailDialog: {
                        isShowDialog: false,
                        data: {}
                    }
                }
            }
        },
        computed: {
            filteredAvailableGoods() {
                if (!this.state.createDialog.goodsSearchKeyword) {
                    return this.state.createDialog.availableGoods;
                }
                const keyword = this.state.createDialog.goodsSearchKeyword.toLowerCase();
                return this.state.createDialog.availableGoods.filter(item => 
                    item.goodsName.toLowerCase().includes(keyword)
                );
            }
        },
        methods: {
            customUpload(options) {
                const {file, onSuccess, onError} = options;
                useFileApi().upload(file).then(response => {
                    if (response.code === 0) {
                        const imageUrl = typeof response.data === 'string' 
                            ? response.data 
                            : (response.data?.url || response.data?.filePath || response.data);
                        this.state.createDialog.form.skuImage = imageUrl;
                        Message.success('上传成功');
                        onSuccess(response, file);
                    } else {
                        Message.error(response.msg || '上传失败');
                        onError(new Error(response.msg || '上传失败'), file);
                    }
                }).catch(error => {
                    Message.error('上传失败');
                    onError(error, file);
                });
            },
            beforeUpload(file) {
                const isImage = file.type.startsWith('image/')
                const isLt2M = file.size / 1024 / 1024 < 2
                if (!isImage) {
                    Message.error('只能上传图片文件!')
                }
                if (!isLt2M) {
                    Message.error('图片大小不能超过 2MB!')
                }
                return isImage && isLt2M
            },
            openCamera() {
                this.$refs.cameraInput.click();
            },
            compressImage(file, maxSize = 2 * 1024 * 1024) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = (e) => {
                        const img = new Image();
                        img.src = e.target.result;
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let width = img.width;
                            let height = img.height;
                            
                            // 如果图片尺寸过大，先缩小尺寸
                            const maxWidth = 1920;
                            const maxHeight = 1920;
                            
                            if (width > maxWidth || height > maxHeight) {
                                const ratio = Math.min(maxWidth / width, maxHeight / height);
                                width = Math.floor(width * ratio);
                                height = Math.floor(height * ratio);
                            }
                            
                            canvas.width = width;
                            canvas.height = height;
                            
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            
                            // 逐步降低质量直到文件大小符合要求
                            let quality = 0.9;
                            let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                            
                            // 如果压缩后仍然过大，继续降低质量
                            while (compressedDataUrl.length * 0.75 > maxSize && quality > 0.1) {
                                quality -= 0.1;
                                compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                            }
                            
                            // 将 base64 转换为 Blob
                            const arr = compressedDataUrl.split(',');
                            const mime = arr[0].match(/:(.*?);/)[1];
                            const bstr = atob(arr[1]);
                            let n = bstr.length;
                            const u8arr = new Uint8Array(n);
                            while (n--) {
                                u8arr[n] = bstr.charCodeAt(n);
                            }
                            const blob = new Blob([u8arr], { type: mime });
                            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                            
                            resolve(compressedFile);
                        };
                        img.onerror = reject;
                    };
                    reader.onerror = reject;
                });
            },
            handleCameraCapture(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                    Message.error('只能拍摄照片!');
                    event.target.value = '';
                    return;
                }
                
                // 显示加载提示
                const loading = Message({
                    message: '正在压缩图片...',
                    type: 'info',
                    duration: 0
                });
                
                // 压缩图片
                this.compressImage(file, 2 * 1024 * 1024).then(compressedFile => {
                    loading.close();
                    
                    const originalSize = (file.size / 1024).toFixed(2);
                    const compressedSize = (compressedFile.size / 1024).toFixed(2);
                    console.log(`图片压缩: ${originalSize}KB -> ${compressedSize}KB`);
                    
                    useFileApi().upload(compressedFile).then(response => {
                        if (response.code === 0) {
                            const imageUrl = typeof response.data === 'string' 
                                ? response.data 
                                : (response.data?.url || response.data?.filePath || response.data);
                            this.state.createDialog.form.skuImage = imageUrl;
                            Message.success(`拍照上传成功 (已压缩至${compressedSize}KB)`);
                        } else {
                            Message.error(response.msg || '上传失败');
                        }
                    }).catch(() => {
                        Message.error('上传失败');
                    }).finally(() => {
                        event.target.value = '';
                    });
                }).catch(() => {
                    loading.close();
                    Message.error('图片压缩失败');
                    event.target.value = '';
                });
            },
            getStatusType(status) {
                const map = {
                    0: 'info',
                    1: 'warning',
                    2: 'success',
                    3: 'danger'
                }
                return map[status] || 'info'
            },
            getStatusText(status) {
                const map = {
                    0: '已取消',
                    1: '待布款',
                    2: '已布款',
                    3: '布款回滚'
                }
                return map[status] || '未知'
            },
            fetchData() {
                this.state.tableData.loading = true
                useCombinationApi().list(this.state.tableData.param).then(response => {
                    this.state.tableData.data = response.data.records
                    this.state.tableData.total = response.data.total
                    this.state.tableData.loading = false
                }).catch(() => {
                    this.state.tableData.loading = false
                })
            },
            onOpenCreate() {
                this.state.createDialog.form = {
                    skuName: '',
                    skuImage: '',
                    preAllocateQuantity: 1,
                    goodsIds: []
                }
                this.state.createDialog.goodsSearchKeyword = '';
                // 获取可搭配货物
                useCombinationApi().availableGoods().then(response => {
                    this.state.createDialog.availableGoods = response.data;
                    this.state.createDialog.isShowDialog = true
                    
                    // 等待 DOM 更新后清除表格选择状态
                    this.$nextTick(() => {
                        if (this.$refs.goodsTable) {
                            this.$refs.goodsTable.clearSelection();
                        }
                    });
                })
            },
            checkGoodsSelectable(row) {
                return true; // 所有货物都可选
            },
            handleGoodsSelect(selection, row) {
                // selection 是当前所有选中行的数组
                const isSelected = selection.some(item => item.goodsId === row.goodsId);
                if (isSelected) {
                    // 选中：添加到 goodsIds（避免重复）
                    if (!this.state.createDialog.form.goodsIds.includes(row.goodsId)) {
                        this.state.createDialog.form.goodsIds.push(row.goodsId);
                    }
                } else {
                    // 取消选中：从 goodsIds 移除
                    const index = this.state.createDialog.form.goodsIds.indexOf(row.goodsId);
                    if (index > -1) {
                        this.state.createDialog.form.goodsIds.splice(index, 1);
                    }
                }
                console.log('当前选中的货物IDs:', this.state.createDialog.form.goodsIds);
            },
            handleGoodsSelectAll(selection) {
                // 全选当前筛选后的货物
                const allGoodsIds = this.filteredAvailableGoods.map(item => item.goodsId);
                this.state.createDialog.form.goodsIds = [...new Set([...this.state.createDialog.form.goodsIds, ...allGoodsIds])];
            },
            isGoodsSelected(goodsId) {
                return this.state.createDialog.form.goodsIds.includes(goodsId);
            },
            getSelectedGoodsCount() {
                return this.state.createDialog.form.goodsIds.length;
            },
            getGoodsQuantity(row) {
                return row.quantity || 0;
            },
            getMinSelectedGoodsQuantity() {
                if (this.state.createDialog.form.goodsIds.length === 0) return 0;
                let minQty = Infinity;
                this.state.createDialog.form.goodsIds.forEach(goodsId => {
                    const goods = this.state.createDialog.availableGoods.find(item => item.goodsId === goodsId);
                    if (goods) {
                        const qty = this.getGoodsQuantity(goods);
                        if (qty < minQty) minQty = qty;
                    }
                });
                return minQty === Infinity ? 0 : minQty;
            },
            onCreateSubmit() {
                this.$refs.createDialogFormRef.validate((valid) => {
                    if (valid) {
                        if (this.state.createDialog.form.goodsIds.length === 0) {
                            Message.warning('请选择货物')
                            return
                        }
                        
                        const minQty = this.getMinSelectedGoodsQuantity();
                        if (this.state.createDialog.form.preAllocateQuantity > minQty) {
                            Message.warning(`预分配数量不能大于选中货物的最小库存(${minQty})`)
                            return
                        }
                        
                        const submitData = {
                            skuName: this.state.createDialog.form.skuName,
                            skuImage: this.state.createDialog.form.skuImage,
                            preAllocateQuantity: this.state.createDialog.form.preAllocateQuantity,
                            goodsIds: this.state.createDialog.form.goodsIds
                        };
                        
                        this.state.createDialog.loading = true
                        useCombinationApi().create(submitData).then(() => {
                            this.state.createDialog.loading = false
                            this.state.createDialog.isShowDialog = false
                            Message.success('创建成功')
                            this.fetchData()
                        }).catch(() => {
                            this.state.createDialog.loading = false
                        })
                    }
                })
            },
            onViewDetail(row) {
                useCombinationApi().info(row.skuId).then(response => {
                    this.state.detailDialog.data = response.data
                    this.state.detailDialog.isShowDialog = true
                })
            },
            onArrange(row) {
                MessageBox.confirm(`确定要布款SKU："${row.skuName}"吗?`, '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    useCombinationApi().arrange(row.skuId).then(() => {
                        Message.success('布款成功')
                        this.fetchData()
                    })
                }).catch(() => {
                });
            },
            onCancel(row) {
                MessageBox.confirm(`确定要取消布款SKU："${row.skuName}"吗?`, '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    useCombinationApi().cancel(row.skuId).then(() => {
                        Message.success('取消成功')
                        this.fetchData()
                    })
                }).catch(() => {
                });
            },
            onRollback(row) {
                MessageBox.confirm(`确定要回滚SKU："${row.skuName}"吗?`, '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    useCombinationApi().rollback(row.skuId).then(() => {
                        Message.success('回滚成功')
                        this.fetchData()
                    })
                }).catch(() => {
                });
            },
            onDelete(row) {
                MessageBox.confirm(`确定要删除SKU："${row.skuName}"吗?`, '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    useCombinationApi().delete(row.skuId).then(() => {
                        Message.success('删除成功')
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
        }
    }
</script>

<style lang="scss" scoped>
.sku-image-uploader {
    ::v-deep .el-upload {
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
    }
    ::v-deep .el-upload:hover {
        border-color: #409EFF;
    }
}
.sku-image-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 100px;
    height: 100px;
    line-height: 100px;
    text-align: center;
}
.upload-actions {
    display: flex;
    align-items: center;
}
.goods-selection-container {
    border: 1px solid #DCDFE6;
    border-radius: 4px;
    padding: 15px;
    background-color: #fff;
}
.selected-summary {
    text-align: right;
    font-size: 14px;
    color: #606266;
    .count-highlight {
        color: #409EFF;
        font-weight: bold;
        font-size: 16px;
        margin: 0 3px;
    }
}
</style>
