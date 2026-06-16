<template>
  <div class="short-link-container layout-padding">
    <el-card shadow="hover" class="layout-padding-auto">
      <div class="short-link-search mb15">
        <el-input
          size="default"
          v-model="state.tableData.param.keyword"
          placeholder="请输入原始链接或备注"
          style="max-width: 250px"
          clearable
        ></el-input>
        <el-select
          v-model="state.tableData.param.status"
          placeholder="状态"
          size="default"
          clearable
          style="max-width: 120px; margin-left: 10px"
        >
          <el-option label="启用" :value="1"></el-option>
          <el-option label="禁用" :value="0"></el-option>
        </el-select>
        <el-button size="default" type="primary" class="ml10" @click="fetchData()">
          <el-icon><ele-Search /></el-icon>
          查询
        </el-button>
        <el-button size="default" type="success" @click="handleGenerate">
          <el-icon><ele-Plus /></el-icon>
          生成短链
        </el-button>
      </div>
      <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="shortCode" label="短链编码" width="120" show-overflow-tooltip>
          <template #default="scope">
            <el-link type="success" @click="handleRedirect(scope.row)" :underline="false" style="cursor: pointer;">
              {{ scope.row.shortCode }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="originalUrl" label="原始链接" min-width="300" show-overflow-tooltip></el-table-column>
        <el-table-column prop="remark" label="备注" width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="visitCount" label="访问次数" width="100" align="center">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.visitCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" text type="primary" @click="handleViewDetail(scope.row)">
              <el-icon><ele-View /></el-icon>
              详情
            </el-button>
            <el-button size="small" text type="success" @click="handleCopyLink(scope.row)">
              <el-icon><ele-DocumentCopy /></el-icon>
              复制
            </el-button>
            <el-button size="small" text type="warning" @click="handleViewStats(scope.row)">
              <el-icon><ele-DataAnalysis /></el-icon>
              统计
            </el-button>
            <el-button size="small" text type="danger" @click="handleDelete(scope.row)">
              <el-icon><ele-Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="mt15"
        :pager-count="5"
        :page-sizes="[10, 20, 30, 50]"
        :current-page="state.tableData.param.current"
        background
        :page-size="state.tableData.param.limit"
        layout="total, sizes, prev, pager, next, jumper"
        :total="state.tableData.total"
      >
      </el-pagination>
    </el-card>

    <el-dialog title="生成短链" :visible.sync="state.dialog.isShowGenerate" width="600px">
      <el-form ref="generateFormRef" :model="state.generateForm" size="default" label-width="100px">
        <el-form-item label="原始链接" prop="originalUrl" :rules="[{ required: true, message: '请输入原始链接', trigger: 'blur' }]">
          <el-input
            v-model="state.generateForm.originalUrl"
            placeholder="请输入需要缩短的URL地址"
            type="textarea"
            :rows="3"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="state.generateForm.remark"
            placeholder="请输入备注信息（可选）"
            maxlength="200"
            show-word-limit
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="state.dialog.isShowGenerate = false" size="default">取 消</el-button>
          <el-button type="primary" @click="submitGenerate" :loading="state.generateLoading" size="default">
            生 成
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog title="短链详情" :visible.sync="state.dialog.isShowDetail" width="700px">
      <el-descriptions :column="1" border v-if="state.detailData">
        <el-descriptions-item label="短链编码">
          <el-tag type="success">{{ state.detailData.shortCode }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="完整短链">
          <el-link type="primary" :href="state.detailData.fullShortUrl" target="_blank">
            {{ state.detailData.fullShortUrl }}
          </el-link>
          <el-button size="mini" type="text" @click="copyText(state.detailData.fullShortUrl)" style="margin-left: 10px">
            复制
          </el-button>
        </el-descriptions-item>
        <el-descriptions-item label="原始链接">
          <el-link type="primary" :href="state.detailData.originalUrl" target="_blank">
            {{ state.detailData.originalUrl }}
          </el-link>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ state.detailData.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="state.detailData.status === 1 ? 'success' : 'danger'">
            {{ state.detailData.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="访问次数">
          <el-tag type="info">{{ state.detailData.visitCount || 0 }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ state.detailData.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog title="短链统计" :visible.sync="state.dialog.isShowStats" width="500px">
      <div v-if="state.statsData" class="stats-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="stat-card">
              <div class="stat-label">总访问次数</div>
              <div class="stat-value">{{ state.statsData.visitCount || 0 }}</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="stat-card">
              <div class="stat-label">当前状态</div>
              <div class="stat-value">
                <el-tag :type="state.statsData.status === 1 ? 'success' : 'danger'">
                  {{ state.statsData.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </div>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20" class="mt20">
          <el-col :span="24">
            <div class="stat-card">
              <div class="stat-label">创建时间</div>
              <div class="stat-value stat-text">{{ state.statsData.createTime }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { useShortLinkApi } from '@/api/shortLink';

export default {
  name: 'shortLink',
  data() {
    return {
      state: {
        tableData: {
          data: [],
          total: 0,
          loading: false,
          param: {
            current: 1,
            limit: 10,
            keyword: '',
            status: null
          }
        },
        dialog: {
          isShowGenerate: false,
          isShowDetail: false,
          isShowStats: false
        },
        generateForm: {
          originalUrl: '',
          remark: ''
        },
        generateLoading: false,
        detailData: null,
        statsData: null
      }
    };
  },
  methods: {
    fetchData() {
      this.state.tableData.loading = true;
      useShortLinkApi()
        .list(this.state.tableData.param)
        .then((response) => {
          this.state.tableData.data = response.data.records || [];
          this.state.tableData.total = response.data.total || 0;
          this.state.tableData.loading = false;
        })
        .catch(() => {
          this.state.tableData.loading = false;
        });
    },
    handleGenerate() {
      this.state.generateForm = {
        originalUrl: '',
        remark: ''
      };
      this.state.dialog.isShowGenerate = true;
    },
    submitGenerate() {
      if (!this.state.generateForm.originalUrl) {
        this.$message.warning('请输入原始链接');
        return;
      }
      if (!this.isValidUrl(this.state.generateForm.originalUrl)) {
        this.$message.error('请输入有效的URL地址');
        return;
      }
      this.state.generateLoading = true;
      useShortLinkApi()
        .generate(this.state.generateForm)
        .then((response) => {
          this.$message.success('短链生成成功！');
          this.state.generateLoading = false;
          this.state.dialog.isShowGenerate = false;
          this.fetchData();
        })
        .catch(() => {
          this.state.generateLoading = false;
        });
    },
    handleViewDetail(row) {
      useShortLinkApi()
        .detail(row.linkId)
        .then((response) => {
          this.state.detailData = response.data;
          this.state.dialog.isShowDetail = true;
        });
    },
    handleViewStats(row) {
      useShortLinkApi()
        .stats(row.linkId)
        .then((response) => {
          this.state.statsData = response.data;
          this.state.dialog.isShowStats = true;
        });
    },
    handleStatusChange(row) {
      useShortLinkApi()
        .updateStatus({
          linkId: row.linkId,
          status: row.status
        })
        .then(() => {
          this.$message.success(`短链已${row.status === 1 ? '启用' : '禁用'}`);
        })
        .catch(() => {
          row.status = row.status === 1 ? 0 : 1;
        });
    },
    handleDelete(row) {
      this.$confirm('确定要删除该短链吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          useShortLinkApi()
            .delete(row.linkId)
            .then(() => {
              this.$message.success('删除成功');
              this.fetchData();
            });
        })
        .catch(() => {});
    },
    handleCopyLink(row) {
      const fullUrl = `${window.location.origin}/shortlink/${row.shortCode}`;
      this.copyText(fullUrl);
    },
    handleRedirect(row) {
      window.open(`/shortlink/${row.shortCode}`, '_blank');
    },
    copyText(text) {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.$message.success('复制成功！');
    },
    handleSizeChange(pageSize) {
      this.state.tableData.data = [];
      this.state.tableData.param.limit = pageSize;
      this.fetchData();
    },
    handleCurrentChange(current) {
      this.state.tableData.data = [];
      this.state.tableData.param.current = current;
      this.fetchData();
    },
    isValidUrl(string) {
      try {
        new URL(string);
        return true;
      } catch (_) {
        return false;
      }
    }
  },
  mounted() {
    this.fetchData();
  }
};
</script>

<style scoped lang="scss">
.short-link-container {
  .short-link-search {
    display: flex;
    align-items: center;
  }
}

.stats-content {
  padding: 10px;

  .stat-card {
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    color: #fff;
    text-align: center;
    transition: transform 0.3s;

    &:hover {
      transform: translateY(-5px);
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 10px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: bold;

      &.stat-text {
        font-size: 16px;
      }
    }
  }
}

.mt20 {
  margin-top: 20px;
}
</style>
