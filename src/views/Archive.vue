<template>
  <div class="archive">
    <!-- 页头 -->
    <header class="arc-head">
      <p class="arc-kicker">TECH ARCHIVE</p>
      <h1 class="page-title">技术归档</h1>
      <p class="arc-sub">
        共 <strong>{{ posts.length }}</strong> 篇 · 跨越 <strong>{{ yearCount }}</strong> 个年度
      </p>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-spinner type="chasing-dots" size="40" />
      <p class="loading-text">加载中...</p>
    </div>

    <!-- 内容区域 -->
    <div v-else class="content-wrapper">
      <section
        v-for="group in groupedPosts"
        :key="group.year"
        class="year-block"
        :class="{ 'is-collapsed': collapsed[group.year] }"
      >
        <!-- 年份分隔：艺术字 -->
        <div class="year-head">
          <button
            type="button"
            class="year-btn"
            :aria-expanded="String(!collapsed[group.year])"
            :aria-label="collapsed[group.year] ? `展开 ${group.year} 年` : `收起 ${group.year} 年`"
            @click="toggleYear(group.year)"
          >
            <span class="year-word">{{ group.year }}</span>
            <span class="year-count">{{ group.months.reduce((n, m) => n + m.posts.length, 0) }} 篇</span>
            <!-- 折叠箭头：只在点击按钮时切换，避免整行误触 -->
            <svg class="year-caret" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <span class="year-rule"></span>
        </div>

        <div v-show="!collapsed[group.year]" class="year-body">
          <div v-for="month in group.months" :key="month.key" class="month">
            <div class="month-head">
              <span class="month-num">{{ month.month }}</span>
              <span class="month-unit">月</span>
              <span class="month-count">{{ month.posts.length }} 篇</span>
            </div>

            <ol class="entries">
              <li v-for="post in month.posts" :key="post.id" class="entry">
                <!-- 条目标题 + 关键字；点整张卡片进正文 -->
                <router-link :to="`/post/${post.slug}`" class="entry-link">
                  <!-- 有封面显示照片，没有则显示标题；照片盖在标题上，加载失败/未加载时露出标题 -->
                  <div class="entry-media">
                    <span class="entry-media-title">{{ post.title }}</span>
                    <img
                      v-if="showCover(post)"
                      :src="post.coverImage"
                      :alt="post.title"
                      loading="lazy"
                      @error="onImgError(post.id)"
                    />
                  </div>

                  <div class="entry-text">
                    <h3 class="entry-title">{{ post.title }}</h3>
                    <p v-if="post.excerpt" class="entry-excerpt">{{ post.excerpt }}</p>
                    <div class="entry-meta">
                      <span class="entry-date">{{ formatDate(post.createdAt) }}</span>
                      <span v-if="post.category" class="entry-cat">{{ post.category.name }}</span>
                      <span class="entry-views">{{ post.viewCount ?? 0 }} 阅读</span>
                    </div>
                  </div>
                </router-link>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <!-- 无文章提示 -->
      <div v-if="groupedPosts.length === 0" class="empty-container">
        <p class="empty-text">暂无文章</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { postApi } from '../api/post'
import type { Post } from '../types'

interface MonthGroup {
  key: string
  month: number
  posts: Post[]
}
interface YearGroup {
  year: number
  months: MonthGroup[]
}

const posts = ref<Post[]>([])
const loading = ref(true)
// 已失效（404 / 损坏）的封面：源站换过图、老链接可能打不开，直接回落到标题
const brokenCovers = reactive<Record<number, boolean>>({})
// 年度收起状态：最新一年默认展开
const collapsed = reactive<Record<number, boolean>>({})
// 封面地址：空值、data URL、http(s) 绝对地址都算「有照片」
const hasCover = (post: Post) => !!post.coverImage && post.coverImage.trim() !== ''

const showCover = (post: Post) => hasCover(post) && !brokenCovers[post.id]

const onImgError = (id: number) => {
  brokenCovers[id] = true
}

// 按 年 → 月 分组，全部降序
const groupedPosts = computed<YearGroup[]>(() => {
  const yearMap = new Map<number, Map<number, Post[]>>()

  posts.value.forEach(post => {
    const date = new Date(post.createdAt)
    const y = date.getFullYear()
    const m = date.getMonth() + 1
    if (!yearMap.has(y)) yearMap.set(y, new Map())
    const monthMap = yearMap.get(y)!
    if (!monthMap.has(m)) monthMap.set(m, [])
    monthMap.get(m)!.push(post)
  })

  return [...yearMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, monthMap]) => ({
      year,
      months: [...monthMap.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([month, list]) => ({
          key: `${year}-${month}`,
          month,
          posts: [...list].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        }))
    }))
})

const yearCount = computed(() => groupedPosts.value.length)

const toggleYear = (year: number) => {
  collapsed[year] = !collapsed[year]
}

// 中文年月日：2026.11.03
const formatDate = (dateString: string): string => {
  const d = new Date(dateString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

const fetchPosts = async () => {
  try {
    const response = await postApi.getPosts({ limit: 100, status: 'published' })
    posts.value = response.data.posts
  } catch (error) {
    console.error('获取文章列表失败:', error)
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await fetchPosts()
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.archive {
  max-width: 62rem;
  margin: 0 auto;
}

/* ---------- 页头 ---------- */
.arc-head {
  text-align: center;
  margin-bottom: 2.5rem;
}

.arc-kicker {
  font-size: 11px;
  letter-spacing: 0.32em;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.page-title {
  font-size: 30px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.04em;
}

.arc-sub {
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-secondary);
}

.arc-sub strong {
  color: var(--text-primary);
  font-weight: 600;
}

.loading-container {
  text-align: center;
  padding: 4rem 0;
}

.loading-text {
  margin-top: 1rem;
  color: var(--text-secondary);
}

/* ---------- 年度块 ---------- */
.year-block {
  margin-bottom: 3rem;
}

.year-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 6px 0;
}

/* 年份 + 篇数 + 箭头 组成一个按钮，点击收起/展开这一年 */
.year-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: inherit;
}

.year-btn:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 4px;
  border-radius: 6px;
}

.year-caret {
  width: 13px;
  height: 13px;
  color: var(--text-tertiary);
  transition: transform 0.2s ease;
}

.is-collapsed .year-caret {
  transform: rotate(-90deg);
}

.year-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.16s ease;
}

.year-head:hover .year-hint,
.year-btn:focus-visible ~ .year-hint {
  opacity: 1;
}

.year-rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--border-color), transparent);
}

.year-count {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

/* 年份艺术字：不用字体包，只用 CSS 做出「描边 + 渐变 + 错位阴影」的字形 */
.year-word {
  position: relative;
  user-select: none;
  font-family: 'Georgia', 'Times New Roman', 'Songti SC', 'STSong', serif;
  font-size: 56px;
  font-weight: 700;
  font-style: italic;
  line-height: 1;
  letter-spacing: -0.03em;
  padding-right: 6px;
  color: transparent;
  background: linear-gradient(160deg, var(--text-primary) 0%, var(--accent-color) 90%);
  -webkit-background-clip: text;
  background-clip: text;
  filter: drop-shadow(3px 3px 0 color-mix(in srgb, var(--accent-color) 16%, transparent));
  transition: transform 0.25s ease;
}

.year-head:hover .year-word {
  transform: translateX(2px) skewX(-3deg);
}

.year-body {
  padding-left: 10px;
  border-left: 1px solid var(--border-color);
  margin-left: 8px;
  padding-top: 6px;
}

/* ---------- 月份 ---------- */
.month {
  padding-left: 24px;
  position: relative;
  margin-bottom: 2rem;
}

.month::before {
  content: '';
  position: absolute;
  left: -5px;
  top: 4px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--card-bg);
  border: 2px solid var(--accent-color);
}

.month-head {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 12px;
}

.month-num {
  font-family: 'Georgia', serif;
  font-size: 22px;
  font-weight: 700;
  font-style: italic;
  color: var(--text-primary);
}

.month-unit {
  font-size: 12px;
  color: var(--text-secondary);
}

.month-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* ---------- 条目 ---------- */
.entries {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.entry-link {
  display: flex;
  align-items: stretch;
  gap: 14px;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid transparent;
  text-decoration: none;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

.entry-link:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

/* 照片 / 标题二选一：照片定位盖在标题上，二者同一格子 */
.entry-media {
  position: relative;
  flex: none;
  width: 96px;
  height: 64px;
  border-radius: 7px;
  overflow: hidden;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.entry-media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: var(--bg-tertiary);
}

.entry-media-title {
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-secondary);
  padding: 6px;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.entry-text {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.entry-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.entry-link:hover .entry-title {
  color: var(--accent-color);
}

.entry-excerpt {
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.entry-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-tertiary);
  flex-wrap: wrap;
}

.entry-date {
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

.entry-cat {
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.empty-container {
  text-align: center;
  padding: 4rem 0;
}

.empty-text {
  color: var(--text-secondary);
}

/* ---------- 移动端 ---------- */
@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }

  .year-word {
    font-size: 40px;
  }

  .year-count {
    display: none;
  }

  .year-body {
    margin-left: 4px;
    padding-left: 6px;
  }

  .month {
    padding-left: 16px;
  }

  .entry-link {
    gap: 10px;
    padding: 6px;
  }

  .entry-media {
    width: 76px;
    height: 56px;
  }

  .entry-title {
    font-size: 14px;
  }

  .month-count {
    display: none;
  }
}
</style>
