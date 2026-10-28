<template>
  <div class="home">
    <h1 class="page-title">最新文章</h1>

    <!-- 文章列表 -->
    <div class="posts-grid">
      <div v-for="post in posts" :key="post.id" class="post-card" @click="goTitile(post.slug)">
        <!-- 文章封面 -->
        <div class="post-cover">
          <img :src="getCoverImage(post.coverImage)" :alt="post.title">
        </div>

        <!-- 文章内容 -->
        <div class="post-content">
          <!-- 文章分类 -->
          <div class="post-category">
            <span>{{ post.category.name }}</span>
          </div>

          <!-- 文章标题 -->
          <h2 class="post-title">
            <p>{{ post.title }}</p>
          </h2>

          <!-- 文章摘要 -->
          <p class="post-excerpt">{{ post.excerpt }}</p>

          <!-- 文章标签 -->
          <div class="post-tags">
            <span v-for="tag in post.tags" :key="tag.id" class="tag">{{ tag.name }}</span>
          </div>

          <!-- 文章信息 - 固定在卡片底部 -->
          <div class="post-meta">
            <div class="post-meta-content">
              <div class="post-author">
                <img :src="resolveAvatar(post.author)" :alt="post.author.username">
                <span>{{ post.author.username }}</span>
              </div>
              <div class="post-stats">
                <span>{{ formatDate(post.createdAt) }}</span>
                <span class="separator">•</span>
                <span>{{ post.viewCount }} 阅读</span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
import { resolveAvatar } from '../utils/avatar'
import type { Post } from '../types'

// 路由实例
const router = useRouter()

// 默认封面图片
const DEFAULT_COVER_IMAGE = 'https://picsum.photos/1200/600?random=1'

// 响应式数据
const posts = ref<Post[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const loading = ref(false)

// 获取封面图片
const getCoverImage = (coverImage?: string): string => {
  return coverImage || DEFAULT_COVER_IMAGE
}

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
/* 页面标题 */
.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--text-primary);
}

/* 文章网格 */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .posts-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 文章卡片 */
.post-card {
  background: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px var(--shadow-color);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.post-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px var(--shadow-color);
}

/* 文章封面 */
.post-cover {
  height: 12rem;
  overflow: hidden;
  position: relative;
}

.post-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.post-card:hover .post-cover img {
  transform: scale(1.1);
}

/* 文章内容 */
.post-content {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* 文章分类 */
.post-category {
  margin-bottom: 0.5rem;
}

.post-category span {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* 文章标题 - 记号笔效果 */
.post-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  position: relative;
  display: block;
  /* 文字溢出处理 - 最多显示2行 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  max-height: 2.8em;
}

.post-title p {
  color: var(--text-primary);
  position: relative;
  display: inline;
}

/* 记号笔下划线效果 */
.post-title p::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-secondary));
  opacity: 0;
  z-index: -1;
  transform: rotate(-1deg) scaleX(0);
  transform-origin: left;
  transition: all 0.3s ease;
  border-radius: 2px;
}

/* 卡片hover时显示记号笔效果 */
.post-card:hover .post-title p::after {
  opacity: 0.6;
  transform: rotate(-1deg) scaleX(1);
}

/* 文章摘要 - 文字溢出处理 */
.post-excerpt {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  /* 最多显示3行 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  max-height: 4.5em;
}

/* 文章标签 */
.post-tags {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  font-size: 12px;
  margin-right: 8px;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

/* 文章信息 */
.post-meta {
  margin-top: auto;
  padding-bottom: 5px;
}

.post-meta-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.post-author {
  display: flex;
  align-items: center;
}

.post-author img {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.post-stats {
  display: flex;
  align-items: center;
}

.separator {
  margin: 0 0.5rem;
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
.pagination {
  margin-top: 2.5rem;
  display: flex;
  justify-content: center;
}

.pagination-nav {
  display: inline-flex;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px var(--shadow-color);
}

.pagination-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--hover-bg);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn-first {
  border-radius: 0.375rem 0 0 0.375rem;
  border-right: none;
}

.pagination-btn-last {
  border-radius: 0 0.375rem 0.375rem 0;
  border-left: none;
}

.pagination-btn-active {
  background: var(--bg-tertiary);
  color: var(--accent-color);
  font-weight: 500;
}
</style>