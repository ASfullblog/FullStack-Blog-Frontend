<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div v-for="item in statCards" :key="item.label" class="stat-card">
        <div class="stat-icon">
          <AppIcon :name="item.icon" :size="18" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ item.value }}</div>
          <div class="stat-label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <div class="sub-stats-grid">
      <div class="sub-stat-card">
        <div class="sub-stat-label">文章浏览量</div>
        <div class="sub-stat-number">{{ stats.postViews }}</div>
      </div>
      <div class="sub-stat-card">
        <div class="sub-stat-label">小游戏浏览量</div>
        <div class="sub-stat-number">{{ stats.gameViews }}</div>
      </div>
    </div>

    <div class="recent-posts">
      <h3 class="section-title">最近文章</h3>
      <el-table
        v-loading="tableLoading"
        element-loading-text="加载中..."
        :data="recentPosts"
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="title" label="标题" min-width="320">
          <template #default="{ row }">
            <a class="post-title" @click="handlePreviewPost(row)">{{ row.title }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="category.name" label="分类" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 文章预览弹窗（与文章管理页同款交互） -->
    <PostPreviewDialog v-model="previewVisible" :post="previewPost" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppIcon from '../../components/icons/AppIcon.vue'
import request from '../../utils/request'
import { postApi } from '../../api/post'
import PostPreviewDialog from '../../components/admin/PostPreviewDialog.vue'
import type { Post } from '../../types'

interface DashboardStats {
  posts: number
  categories: number
  comments: number
  postViews: number
  gameViews: number
  totalViews: number
}

// 最近文章只取最新发布的 5 条
const RECENT_POST_LIMIT = 5

const recentPosts = ref<Post[]>([])
const tableLoading = ref(false)
const previewVisible = ref(false)
const previewPost = ref<Post | null>(null)
const stats = ref<DashboardStats>({
  posts: 0,
  categories: 0,
  comments: 0,
  postViews: 0,
  gameViews: 0,
  totalViews: 0
})

// 统计卡：与前台统计页同一套中性图标语言，不再用彩色圆点
const statCards = computed(() => [
  { label: '文章总数', value: stats.value.posts, icon: 'document' },
  { label: '分类总数', value: stats.value.categories, icon: 'folder' },
  { label: '评论总数', value: stats.value.comments, icon: 'message' },
  { label: '总浏览量', value: stats.value.totalViews, icon: 'eye' }
])

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

const handlePreviewPost = (row: Post) => {
  previewPost.value = row
  previewVisible.value = true
}

const fetchData = async () => {
  tableLoading.value = true
  try {
    const [postsResponse, statsResponse] = await Promise.all([
      // 最新发布（created_at DESC，接口默认）的 5 条已发布文章
      postApi.getPosts({ page: 1, limit: RECENT_POST_LIMIT, status: 'published' }),
      request.get('/admin/dashboard/stats')
    ])

    recentPosts.value = (postsResponse.data.posts || []).slice(0, RECENT_POST_LIMIT)
    stats.value = statsResponse.data
  } catch (error) {
    console.error('fetch dashboard data failed:', error)
  } finally {
    tableLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.dashboard {
  padding: 1rem 0;
}

.stats-grid,
.sub-stats-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.sub-stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.stat-card,
.sub-stat-card,
.recent-posts {
  background-color: var(--adm-surface, #fff);
  border: 1px solid var(--adm-border, #e5e7eb);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 1.5rem;
}

.sub-stat-card {
  padding: 1rem 1.25rem;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 2.25rem;
  height: 2.25rem;
  margin-right: 0.875rem;
  border-radius: 8px;
  background: var(--adm-surface-2, #fafbfc);
  border: 1px solid var(--adm-border, #e4e7eb);
  color: var(--adm-text-2, #5c636b);
}

.stat-number,
.sub-stat-number {
  font-size: 1.5rem;
  font-weight: 600;
}

.stat-label,
.sub-stat-label {
  font-size: 0.875rem;
  color: var(--adm-text-2, #5c636b);
}

.stat-number,
.sub-stat-number {
  color: var(--adm-text, #1f2328);
}

.recent-posts {
  padding: 1.5rem;
}

.section-title {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.post-title {
  color: var(--adm-text, #1f2328);
  border-bottom: 1px solid var(--adm-border, #e4e7eb);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.post-title:hover {
  color: var(--adm-text-2, #5c636b);
}
@media (max-width: 768px) {
  .dashboard {
    padding: 0;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 12px;
  }

  .sub-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 12px;
  }

  .stat-card {
    padding: 12px;
    gap: 0;
  }

  .stat-icon {
    width: 28px;
    height: 28px;
    margin-right: 8px;
    border-radius: 6px;
  }

  .stat-number,
  .sub-stat-number {
    font-size: 1.125rem;
    line-height: 1.3;
  }

  .stat-label,
  .sub-stat-label {
    font-size: 0.75rem;
  }

  .sub-stat-card {
    padding: 10px 12px;
  }

  .recent-posts {
    padding: 12px;
  }

  .section-title {
    margin: 0 0 8px;
    font-size: 0.9375rem;
  }
}
</style>
