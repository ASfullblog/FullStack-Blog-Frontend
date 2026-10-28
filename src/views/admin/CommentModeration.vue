<template>
  <!-- 评论审核管理页面 - 管理员审核用户评论 -->
  <div class="comment-moderation">
    <!-- 搜索和筛选 -->
    <div class="search-filter">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 120px" @change="handleSearch">
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索评论内容" clearable style="width: 200px" @keyup.enter="handleSearch" />
        </el-form-item>
      </el-form>
      <div class="filter-actions">
        <div class="filter-actions-left">
          <el-button type="success" @click="approveAllPending" :loading="approvingAll" :disabled="pendingCount === 0">
            <el-icon><Check /></el-icon>
            一键通过全部 ({{ pendingCount }})
          </el-button>
          <el-button type="primary" @click="fetchComments" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        <div class="filter-actions-right">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>
      </div>
    </div>

    <!-- 评论列表 -->
    <el-table :data="paginatedComments" style="width: 100%" border v-loading="loading" element-loading-text="加载中...">
      <el-table-column type="selection" width="55" />
      <el-table-column type="index" label="#" width="60" align="center" :index="indexMethod" />
      <el-table-column label="用户信息" width="150">
        <template #default="{ row }">
          <div class="user-cell">
            <el-avatar :src="resolveAvatar(row.user)" :size="32">
              {{ getAvatarText(row.user?.username) }}
            </el-avatar>
            <span class="username">{{ row.user?.username || '匿名' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="评论内容" min-width="300">
        <template #default="{ row }">
          <div class="comment-content-cell">
            {{ row.content }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="评论文章" width="200">
        <template #default="{ row }">
          <el-link type="primary" @click="viewPost(row.post?.slug)">
            {{ row.post?.title || '未知文章' }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="评论时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button type="success" size="small" @click="approveComment(row.id)" :loading="processingId === row.id">
              <el-icon><Check /></el-icon>
              通过
            </el-button>
            <el-button type="danger" size="small" @click="rejectComment(row.id)" :loading="processingId === row.id">
              <el-icon><Close /></el-icon>
              拒绝
            </el-button>
          </template>
          <template v-else>
            <el-button type="primary" size="small" link @click="viewPost(row.post?.slug)">
              查看
            </el-button>
            <el-button type="danger" size="small" link @click="deleteComment(row.id)">
              删除
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredComments.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 评论审核管理页面
 * 功能：管理员审核用户评论，支持通过/拒绝/删除操作
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Search,
  Check,
  Close
} from '@element-plus/icons-vue'
import request from '../../utils/request'
import { resolveAvatar } from '../../utils/avatar'

// 加载状态
const loading = ref(false)
const processingId = ref<number | null>(null)
const approvingAll = ref(false)

// 评论数据
const comments = ref<any[]>([])

// 搜索表单
const searchForm = ref({
  status: '',
  keyword: ''
})

// 分页配置
const pagination = ref({
  currentPage: 1,
  pageSize: 10
})

// 筛选后的评论
const filteredComments = computed(() => {
  let result = comments.value

  // 按状态筛选
  if (searchForm.value.status) {
    result = result.filter(c => c.status === searchForm.value.status)
  }

  // 按关键词搜索
  if (searchForm.value.keyword) {
    const keyword = searchForm.value.keyword.toLowerCase()
    result = result.filter(c =>
      c.content?.toLowerCase().includes(keyword) ||
      c.user?.username?.toLowerCase().includes(keyword) ||
      c.post?.title?.toLowerCase().includes(keyword)
    )
  }

  return result
})

// 分页后的评论
const paginatedComments = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return filteredComments.value.slice(start, end)
})

// 序号列：从 1 开始，跨分页连续编号（数据库真实 id 仍在 row.id 里，只是不展示）
const indexMethod = (index: number): number => {
  return (pagination.value.currentPage - 1) * pagination.value.pageSize + index + 1
}

// 待审核评论数量
const pendingCount = computed(() => {
  return comments.value.filter(c => c.status === 'pending').length
})

// 获取状态类型
const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return texts[status] || status
}

// 获取头像文本
const getAvatarText = (username: string) => {
  if (!username) return 'U'
  return username.charAt(0).toUpperCase()
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取所有评论
const fetchComments = async () => {
  loading.value = true
  try {
    const response = await request.get('/comments/pending')
    // 处理标准API响应格式：{ code, message, data }
    if (response && response.data && Array.isArray(response.data)) {
      comments.value = response.data
    } else if (Array.isArray(response)) {
      // 兼容直接返回数组的情况
      comments.value = response
    } else {
      comments.value = []
    }
  } catch (error: any) {
    console.error('获取评论失败:', error)
    ElMessage.error(error.message || '获取评论列表失败')
    comments.value = []
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.currentPage = 1
}

// 重置搜索
const resetSearch = () => {
  searchForm.value.status = ''
  searchForm.value.keyword = ''
  pagination.value.currentPage = 1
}

// 审核通过评论
const approveComment = async (commentId: number) => {
  processingId.value = commentId
  try {
    await request.put(`/comments/${commentId}/moderate`, {
      status: 'approved'
    })
    ElMessage.success('评论已通过')
    await fetchComments()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    processingId.value = null
  }
}

// 拒绝评论
const rejectComment = async (commentId: number) => {
  processingId.value = commentId
  try {
    await request.put(`/comments/${commentId}/moderate`, {
      status: 'rejected'
    })
    ElMessage.success('评论已拒绝')
    await fetchComments()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    processingId.value = null
  }
}

// 删除评论
const deleteComment = async (commentId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？删除后无法恢复！', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await request.delete(`/comments/${commentId}`)
    ElMessage.success('评论已删除')
    await fetchComments()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 一键通过所有待审核评论
const approveAllPending = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要通过全部 ${pendingCount.value} 条待审核评论吗？`,
      '确认一键通过',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    approvingAll.value = true
    const response = await request.put('/comments/approve-all', {})
    const updatedCount = response.data?.updatedCount || 0
    ElMessage.success(`已成功通过 ${updatedCount} 条评论`)
    await fetchComments()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('一键通过失败:', error)
      ElMessage.error(error.message || '一键通过失败')
    }
  } finally {
    approvingAll.value = false
  }
}

// 查看文章
const viewPost = (slug: string) => {
  if (slug) {
    window.open(`/post/${slug}`, '_blank')
  }
}

// 分页大小变化
const handleSizeChange = (val: number) => {
  pagination.value.pageSize = val
  pagination.value.currentPage = 1
}

// 页码变化
const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val
}

// 页面挂载
onMounted(() => {
  fetchComments()
})
</script>

<style scoped>
.comment-moderation {
  padding: 20px;
}

.search-filter {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--bg-secondary, #f5f7fa);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* 筛选区底部操作栏：左动作 / 右搜索重置 */
.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.filter-actions-left,
.filter-actions-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 表格样式适配主题 */
:deep(.el-table) {
  background-color: var(--card-bg, #ffffff);
  color: var(--text-primary, #1f2937);
}

:deep(.el-table__header-wrapper th) {
  background-color: var(--bg-secondary, #f5f7fa);
  color: var(--text-primary, #1f2937);
}

:deep(.el-table__row) {
  background-color: var(--card-bg, #ffffff);
}

:deep(.el-table__row:hover > td) {
  background-color: var(--hover-bg, #f5f7fa) !important;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-size: 14px;
  color: var(--text-primary, #1f2937);
}

.comment-content-cell {
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
  color: var(--text-secondary, #606266);
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
