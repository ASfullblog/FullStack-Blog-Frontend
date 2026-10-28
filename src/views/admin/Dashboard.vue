<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon bg-blue-500">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.posts }}</div>
          <div class="stat-label">文章总数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon bg-green-500">
          <el-icon><Collection /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.categories }}</div>
          <div class="stat-label">分类总数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon bg-purple-500">
          <el-icon><ChatLineRound /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.comments }}</div>
          <div class="stat-label">评论总数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon bg-orange-500">
          <el-icon><View /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalViews }}</div>
          <div class="stat-label">总浏览量</div>
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
      <el-table :data="recentPosts" style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="320">
          <template #default="{ row }">
            <router-link :to="`/post/${row.slug}`" target="_blank" class="post-title">{{ row.title }}</router-link>
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
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editPost(row.id)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChatLineRound,
  Collection,
  Document,
  Edit,
  View
} from '@element-plus/icons-vue'
import request from '../../utils/request'
import { postApi } from '../../api/post'
import type { Post } from '../../types'

interface DashboardStats {
  posts: number
  categories: number
  comments: number
  postViews: number
  gameViews: number
  totalViews: number
}

const router = useRouter()
const recentPosts = ref<Post[]>([])
const stats = ref<DashboardStats>({
  posts: 0,
  categories: 0,
  comments: 0,
  postViews: 0,
  gameViews: 0,
  totalViews: 0
})

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

const editPost = (id: number) => {
  router.push(`/admin/posts/edit/${id}`)
}

const fetchData = async () => {
  try {
    const [postsResponse, statsResponse] = await Promise.all([
      postApi.getPosts({ limit: 5 }),
      request.get('/admin/dashboard/stats')
    ])

    recentPosts.value = postsResponse.data.posts
    stats.value = statsResponse.data
  } catch (error) {
    console.error('fetch dashboard data failed:', error)
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
  background-color: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
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
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: #fff;
  font-size: 1.5rem;
}

.stat-number,
.sub-stat-number {
  font-size: 1.5rem;
  font-weight: 600;
}

.stat-label,
.sub-stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
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
  color: #3b82f6;
  text-decoration: none;
}

.post-title:hover {
  text-decoration: underline;
}
</style>
