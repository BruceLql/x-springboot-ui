<template>
    <div class="warehouse-goods-container layout-padding">
        <el-card shadow="hover" class="layout-padding-auto">
            <div class="system-user-search mb15">
                <el-input size="default" v-model="state.tableData.param.goodsName" placeholder="请输入货物名称"
                          style="max-width: 180px" clearable></el-input>
                <el-select size="default" v-model="state.tableData.param.productType" placeholder="商品分类"
                           style="max-width: 150px; margin-left: 10px" clearable>
                    <el-option label="男款" value="MALE"></el-option>
                    <el-option label="女款" value="FEMALE"></el-option>
                    <el-option label="儿童款" value="CHILDREN"></el-option>
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
                    新增货物
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column type="index" label="序号" width="60"/>
                <el-table-column prop="goodsId" label="货物ID" show-overflow-tooltip></el-table-column>
                <el-table-column prop="goodsName" label="货物名称" show-overflow-tooltip></el-table-column>
                <el-table-column prop="goodsImage" label="货物图片" width="100">
                    <template #default="scope">
                        <el-image v-if="scope.row.goodsImage" :src="scope.row.goodsImage"
                                  :preview-src-list="[scope.row.goodsImage]"
                                  style="width: 50px; height: 50px; cursor: pointer;" fit="cover"></el-image>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                <el-table-column prop="height" label="高度(cm)" show-overflow-tooltip></el-table-column>
                <el-table-column prop="weight" label="重量(g)" show-overflow-tooltip></el-table-column>
                <el-table-column prop="category" label="类目" show-overflow-tooltip></el-table-column>
                <el-table-column prop="productTypeDesc" label="商品分类" show-overflow-tooltip></el-table-column>
                <el-table-column prop="status" label="状态" show-overflow-tooltip>
                    <template #default="scope">
                        <el-tag type="success" v-if="scope.row.status == 1">启用</el-tag>
                        <el-tag type="info" v-else>禁用</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" show-overflow-tooltip></el-table-column>
                <el-table-column label="操作" width="200">
                    <template #default="scope">
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
        <el-dialog :title="state.dialog.title" :visible.sync="state.dialog.isShowDialog" width="600px">
            <el-form ref="goodsDialogFormRef" :model="state.ruleForm" :rules="state.rules" size="default"
                     label-width="90px">
                <el-row :gutter="35">
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="货物名称" prop="goodsName">
                            <el-input v-model="state.ruleForm.goodsName" placeholder="请输入货物名称"
                                      clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="货物图片">
                            <el-upload
                                    class="goods-image-uploader"
                                    action="#"
                                    :http-request="customUpload"
                                    :show-file-list="false"
                                    :before-upload="beforeUpload"
                                    accept="image/*"
                            >
                                <el-image v-if="state.ruleForm.goodsImage" :src="state.ruleForm.goodsImage"
                                          :preview-src-list="[state.ruleForm.goodsImage]"
                                          style="width: 100px; height: 100px; object-fit: cover; display: block; cursor: pointer;"
                                          fit="cover"></el-image>
                                <i v-else class="el-icon-plus goods-image-uploader-icon"></i>
                            </el-upload>
                            <div class="upload-actions mt10">
                                <el-button size="mini" type="primary" @click="openCamera">
                                    <i class="el-icon-camera"></i> 拍照
                                </el-button>
                                <el-button v-if="state.ruleForm.goodsImage" size="mini" type="text" class="ml10"
                                           @click.stop="state.ruleForm.goodsImage = ''">移除图片
                                </el-button>
                            </div>
                            <input ref="cameraInput" type="file" accept="image/*" capture="environment" 
                                   style="display: none" @change="handleCameraCapture"/>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="高度(cm)">
                            <el-input-number v-model="state.ruleForm.height" :min="0" :precision="2"
                                             controls-position="right" class="w100"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="重量(kg)">
                            <el-input-number v-model="state.ruleForm.weight" :min="0" :precision="2"
                                             controls-position="right" class="w100"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="类目">
                            <el-input v-model="state.ruleForm.category" placeholder="请输入类目" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="商品分类" prop="productType">
                            <el-select v-model="state.ruleForm.productType" placeholder="请选择商品分类" class="w100">
                                <el-option label="男款" value="MALE"></el-option>
                                <el-option label="女款" value="FEMALE"></el-option>
                                <el-option label="儿童款" value="CHILDREN"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20" v-if="state.dialog.type === 'edit'">
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
    </div>
</template>

<script>
    import {useGoodsApi} from '@/api/warehouse/goods';
    import {useFileApi} from '@/api/warehouse/file';
    import {Message, MessageBox} from 'element-ui';

    export default {
        name: "warehouseGoods",
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
                    },
                    dialog: {
                        isShowDialog: false,
                        type: '',
                        title: '',
                        submitTxt: '',
                    },
                    ruleForm: {
                        goodsId: '',
                        goodsName: '',
                        goodsImage: '',
                        height: null,
                        weight: null,
                        category: '',
                        productType: '',
                        status: 1
                    },
                    rules: {
                        goodsName: [{required: true, message: '请输入货物名称', trigger: 'blur'}],
                        productType: [{required: true, message: '请选择商品分类', trigger: 'change'}]
                    },
                    submitBtn: {
                        loading: false,
                        type: ''
                    }
                }
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
                        this.state.ruleForm.goodsImage = imageUrl;
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
                            this.state.ruleForm.goodsImage = imageUrl;
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
            fetchData() {
                this.state.tableData.loading = true
                useGoodsApi().list(this.state.tableData.param).then(response => {
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
                    this.state.dialog.title = '修改货物';
                    this.state.dialog.submitTxt = '修 改';
                } else {
                    this.state.ruleForm = {
                        goodsId: '',
                        goodsName: '',
                        goodsImage: '',
                        height: null,
                        weight: null,
                        category: '',
                        productType: '',
                        status: 1
                    };
                    this.state.submitBtn.type = 'add';
                    this.state.dialog.title = '新增货物';
                    this.state.dialog.submitTxt = '新 增';
                }
                this.state.dialog.type = type;
                this.state.dialog.isShowDialog = true;
            },
            onRowDel(row) {
                MessageBox.confirm(`此操作将永久删除货物："${row.goodsName}"，是否继续?`, '提示', {
                    confirmButtonText: '确认',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    this.deleteInfo(row)
                }).catch(() => {
                });
            },
            deleteInfo(row) {
                useGoodsApi().delete(row.goodsId).then(() => {
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
                this.$refs.goodsDialogFormRef.validate((valid) => {
                    if (valid) {
                        this.state.submitBtn.loading = true;
                        if (this.state.submitBtn.type === 'edit') {
                            useGoodsApi().update(this.state.ruleForm).then(() => {
                                this.state.submitBtn.loading = false;
                                this.closeDialog();
                                Message.success('修改成功');
                                this.fetchData()
                            }).catch(() => {
                                this.state.submitBtn.loading = false
                            })
                        } else {
                            useGoodsApi().save(this.state.ruleForm).then(() => {
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
.goods-image-uploader {
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
.goods-image-uploader-icon {
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
</style>
