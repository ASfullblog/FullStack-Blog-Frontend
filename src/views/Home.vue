<template>
  <div class="home">
    <h1 class="page-title">最新文章</h1>

    <!-- 文章列表 -->
    <div class="posts-grid">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @open="goTitile"
      />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 无文章提示 -->
    <div v-else-if="posts.length === 0" class="empty-state">
      <p>暂无文章</p>
    </div>

    <!-- 分页控件 -->
    <div v-else class="pagination">
      <nav class="pagination-nav">
        <button
          @click="prevPage"
          :disabled="page === 1"
          class="pagination-btn pagination-btn-first"
        >
          上一页
        </button>

        <button
          v-for="num in totalPages"
          :key="num"
          @click="goToPage(num)"
          :class="['pagination-btn', page === num ? 'pagination-btn-active' : '']"
        >
          {{ num }}
        </button>

        <button
          @click="nextPage"
          :disabled="page === totalPages"
          class="pagination-btn pagination-btn-last"
        >
          下一页
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { postApi } from '../api/post'
import PostCard from '../components/PostCard.vue'
import type { Post } from '../types'

// 路由实例
const router = useRouter()

// 响应式数据
const posts = ref<Post[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const loading = ref(false)

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(total.value / limit.value)
})

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 获取文章列表
const fetchPosts = async () => {
  loading.value = true
  try {
    const response = await postApi.getPosts({
      page: page.value,
      limit: limit.value,
      status: 'published'
    })
    posts.value = response.data.posts
    total.value = response.data.total
  } catch (error) {
    console.error('获取文章列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 上一页
const prevPage = () => {
  if (page.value > 1) {
    page.value--
    fetchPosts()
  }
}

// 下一页
const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    fetchPosts()
  }
}

// 跳转到指定页码
const goToPage = (num: number) => {
  page.value = num
  fetchPosts()
}

// 跳转到文章详情页
const goTitile = (slug: string) => {
  router.push(`/post/${slug}`)
}

// 页面挂载时获取文章列表
onMounted(() => {
  fetchPosts()
})
</script>

<style scoped>
/* 页面标题：左对齐的小标题，比居中大字更像“编辑过的页面” */
.page-title {
  margin: 0 0 1.25rem;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-align: left;
  color: var(--text-color, var(--text-primary));
}

/* 文章网格 */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
}

/* 卡片式列表：手机单列，平板两列，宽屏三列 */
@media (min-width: 640px) {
  .posts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1100px) {
  .posts-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 2rem 0;
}

.loading-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
  border-radius: 50%;
  height: 2rem;
  width: 2rem;
  border-top: 2px solid;
  border-bottom: 2px solid;
  border-color: var(--accent-color);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  margin-top: 0.5rem;
  color: var(--text-secondary);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 4rem 0;
}

.empty-state p {
  color: var(--text-secondary);
}

/* 分页 */
/* 分页：一组连在一起的方按钮，不做阴影堆叠 */
.pagination {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.pagination-nav {
  display: inline-flex;
  border-radius: var(--radius-control, 8px);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.pagination-btn {
  min-width: 38px;
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-right: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.pagination-btn:last-child {
  border-right: 0;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
  color: var(--text-color, var(--text-primary));
}

.pagination-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination-btn-active {
  background: var(--accent-color);
  color: var(--accent-contrast);
  font-weight: 600;
}

.pagination-btn-active:hover:not(:disabled) {
  background: var(--accent-color);
  color: var(--accent-contrast);
}

@media (prefers-reduced-motion: reduce) {
  .pagination-btn {
    transition: none;
  }
}
</style>