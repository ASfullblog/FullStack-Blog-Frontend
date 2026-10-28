<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    top="5vh"
    class="post-preview-dialog"
  >
    <div
      v-loading="loading"
      class="preview-body"
      element-loading-text="加载文章详情中..."
    >
      <div v-if="displayPost" class="post-preview grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 主内容区 -->
        <div class="lg:col-span-2">
          <!-- 文章标题 -->
          <h1 class="text-3xl font-bold mb-4">{{ displayPost.title }}</h1>

          <!-- 文章信息 -->
          <div class="flex flex-wrap items-center mb-6 text-sm text-gray-500">
            <div class="flex items-center mr-6 mb-2">
              <img
                v-if="displayPost.author"
                :src="resolveAvatar(displayPost.author)"
                :alt="displayPost.author.username"
                class="w-6 h-6 rounded-full mr-2"
              >
              <span>{{ displayPost.author?.username || '未知作者' }}</span>
            </div>
            <div class="mr-6 mb-2">
              <span>{{ formatDate(displayPost.createdAt) }}</span>
            </div>
            <div class="mr-6 mb-2">
              <span>{{ displayPost.viewCount || 0 }} 阅读</span>
            </div>
            <div class="mb-2">
              <span>{{ displayPost.category?.name || '未分类' }}</span>
            </div>
          </div>

          <!-- 文章标签 -->
          <div class="flex flex-wrap mb-6">
            <span v-for="tag in displayPost.tags || []" :key="tag.id" class="tag">{{ tag.name }}</span>
          </div>

          <!-- 文章封面 -->
          <div class="mb-6">
            <img
              :src="getCoverImage(displayPost.coverImage)"
              :alt="displayPost.title"
              class="w-full h-64 object-cover rounded-lg shadow-md"
            >
          </div>

          <!-- 文章内容 -->
          <div ref="contentRef" class="post-content" v-html="renderedContent"></div>
        </div>

        <!-- 侧边栏 -->
        <div class="lg:col-span-1">
          <!-- 作者信息 -->
          <div class="author-card" :style="{ background: authorCardColor }">
            <h3 class="author-title">作者信息</h3>
            <div class="flex items-center mb-3">
              <img
                v-if="displayPost.author"
                :src="resolveAvatar(displayPost.author)"
                :alt="displayPost.author.username"
                class="w-12 h-12 rounded-full mr-3"
              >
              <div
                v-else
                class="w-12 h-12 rounded-full mr-3 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg"
              >
                {{ (displayPost.author?.username || '未')[0].toUpperCase() }}
              </div>
              <div>
                <div class="font-medium">{{ displayPost.author?.username || '未知作者' }}</div>
                <div class="text-sm text-gray-500">作者</div>
              </div>
            </div>
            <p class="text-gray-600 text-sm">
              专注于技术分享，希望通过文章帮助更多人学习和成长。
            </p>
          </div>

          <!-- 目录 -->
          <div v-if="tocItems.length > 0" class="toc-card" :style="{ background: tocCardColor }">
            <h3 class="toc-title">文章目录</h3>
            <ul class="toc-list">
              <li
                v-for="(item, index) in tocItems"
                :key="index"
                :class="['toc-item', `toc-level-${item.level}`]"
              >
                <a
                  :href="`#${item.id}`"
                  class="toc-link"
                  @click.prevent="scrollToHeading(item.id)"
                >
                  {{ item.text }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <el-empty v-else-if="!loading" description="暂无可预览的文章内容" />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * 文章预览弹窗（管理后台通用组件）
 *
 * 从 PostList.vue 已有的「文章预览」弹窗抽离出来的可复用实现：
 * 左侧标题 / 元信息（作者头像+名字、日期、阅读量、分类）/ 标签 / 封面 / markdown 正文，
 * 右侧「作者信息」马卡龙卡片 + 「文章目录」卡片，样式与文章管理页保持一致。
 *
 * 用法（PostList 将来直接复用即可）：
 *   <PostPreviewDialog v-model="previewVisible" :post="previewPost" />
 * 只有列表行数据、正文可能被接口裁剪时，也可以只给标识让它自己懒加载：
 *   <PostPreviewDialog v-model="previewVisible" :post-id="row.id" />
 */
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import request from '../../utils/request'
import { resolveAvatar } from '../../utils/avatar'
import type { ApiResponse, Post } from '../../types'

interface TocItem {
  id: string
  text: string
  level: number
}

interface Props {
  /** v-model 控制显隐 */
  modelValue: boolean
  /** 列表行数据（能直接给出完整正文时就免请求，秒开） */
  post?: Post | null
  /** 仅有 id 时按 id 懒加载详情（GET /posts/id/:id，不增加浏览量，草稿也可预览） */
  postId?: number | null
  /** 仅有 slug 时按 slug 懒加载详情（GET /posts/:slug，注意该接口会 +1 浏览量且只返回 published） */
  postSlug?: string | null
  /**
   * 拉取策略：
   * auto（默认）= 调用方传了 postId/postSlug，或 post 缺正文时才请求详情；
   * always = 每次打开都拉一次最新详情；
   * never  = 只用传入的 post 渲染，绝不请求。
   */
  fetchMode?: 'auto' | 'always' | 'never'
  /** 弹窗标题 */
  title?: string
  /** 弹窗宽度 */
  width?: string
}

const props = withDefaults(defineProps<Props>(), {
  post: null,
  postId: null,
  postSlug: null,
  fetchMode: 'auto',
  title: '文章预览',
  width: '70%'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'loaded', post: Post): void
  (e: 'error', message: string): void
}>()

// 默认封面图片
const DEFAULT_COVER_IMAGE = 'https://picsum.photos/1200/600?random=1'

const loading = ref(false)
const fetchedPost = ref<Post | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const tocItems = ref<TocItem[]>([])

// v-model 桥接
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const displayPost = computed<Post | null>(() => fetchedPost.value || props.post || null)

// Markdown 实例（与 PostList 预览保持一致的配置）
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// 马卡龙色系
const macaroonColors = [
  'linear-gradient(135deg, #FFD1DC 0%, #FFB6C1 100%)', // 浅粉色
  'linear-gradient(135deg, #B5EAD7 0%, #95E1D3 100%)', // 薄荷绿
  'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)', // 浅蓝色
  'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)', // 浅橙色
  'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)', // 浅紫色
  'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)', // 浅绿色
  'linear-gradient(135deg, #FFFDE7 0%, #FFF9C4 100%)', // 浅黄色
  'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)' // 天蓝色
]

const getRandomMacaroonColor = () => macaroonColors[Math.floor(Math.random() * macaroonColors.length)]

const authorCardColor = ref(getRandomMacaroonColor())
const tocCardColor = ref(getRandomMacaroonColor())

const resetColors = () => {
  authorCardColor.value = getRandomMacaroonColor()
  tocCardColor.value = getRandomMacaroonColor()
}

const getCoverImage = (coverImage?: string): string => coverImage || DEFAULT_COVER_IMAGE

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 生成唯一ID
const generateId = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^一-龥a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// 提取目录，并给渲染出来的标题补上 id（依赖 v-html 后的真实 DOM）
const extractToc = (content: string): void => {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const items: TocItem[] = []
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    items.push({ id: generateId(text), text, level })
  }

  tocItems.value = items

  nextTick(() => {
    if (contentRef.value) {
      const headings = contentRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6')
      headings.forEach((heading) => {
        const text = heading.textContent || ''
        heading.id = generateId(text)
      })
    }
  })
}

// 渲染预览内容
const renderedContent = computed(() => {
  const content = displayPost.value?.content || ''
  extractToc(String(content))
  return md.render(String(content))
})

// 平滑滚动到标题
const scrollToHeading = (id: string): void => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const hasFullBody = (post: Post | null | undefined): boolean =>
  !!post && typeof post.content === 'string' && post.content.trim().length > 0

// 本次要加载的文章标识
const targetKey = computed(() => {
  const id = props.postId ?? props.post?.id ?? ''
  const slug = props.postSlug ?? props.post?.slug ?? ''
  return `${id}|${slug}`
})

const needFetch = (): boolean => {
  if (props.fetchMode === 'never') return false
  if (props.fetchMode === 'always') return true
  if (props.postId || props.postSlug) return true
  return !hasFullBody(props.post)
}

const loadDetail = async (): Promise<Post | null> => {
  const id = props.postId ?? props.post?.id ?? null
  const slug = props.postSlug ?? props.post?.slug ?? ''

  // 优先按 id 取详情：不增加浏览量，草稿同样可预览
  if (id) {
    const res = await request.get<any, ApiResponse<Post>>(`/posts/id/${id}`)
    return res?.data ?? null
  }

  if (slug) {
    const res = await request.get<any, ApiResponse<Post>>(`/posts/${encodeURIComponent(slug)}`)
    return res?.data ?? null
  }

  return null
}

let loadedKey = ''

const ensureLoaded = async (): Promise<void> => {
  if (!props.modelValue) return

  const key = targetKey.value

  // 同一篇文章已经加载过，直接复用，避免重复请求
  if (loadedKey === key && (fetchedPost.value || !needFetch())) return

  if (!needFetch()) {
    loadedKey = key
    fetchedPost.value = null
    return
  }

  loading.value = true
  try {
    const detail = await loadDetail()
    if (detail) {
      fetchedPost.value = detail
      loadedKey = key
      emit('loaded', detail)
    } else if (!props.post) {
      tocItems.value = []
      emit('error', '文章不存在或已删除')
    }
  } catch (error: any) {
    const message = error?.message || '获取文章详情失败'
    console.error('[PostPreviewDialog] fetch detail failed:', error)
    ElMessage.error(message)
    emit('error', message)
  } finally {
    loading.value = false
  }
}

const resetState = () => {
  fetchedPost.value = null
  tocItems.value = []
  loadedKey = ''
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetColors()
      resetState()
      ensureLoaded()
    } else {
      resetState()
    }
  },
  { immediate: true }
)

// 弹窗打开期间切换文章（例如连续点不同行）
watch(
  () => targetKey.value,
  () => {
    if (props.modelValue) {
      resetState()
      ensureLoaded()
    }
  }
)
</script>

<style scoped>
/* 预览弹窗主体 */
.preview-body {
  min-height: 260px;
}

/* 预览弹窗样式（与 PostList.vue 保持一致） */
.post-preview {
  padding: 1rem;
  max-height: 75vh;
  overflow-y: auto;
}

.post-preview h1 {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.post-preview .post-content {
  line-height: 1.75;
  color: var(--text-secondary, #374151);
}

.post-preview .post-content h1,
.post-preview .post-content h2,
.post-preview .post-content h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.post-preview .post-content h1 {
  font-size: 1.5rem;
}

.post-preview .post-content h2 {
  font-size: 1.25rem;
}

.post-preview .post-content h3 {
  font-size: 1.125rem;
}

.post-preview .post-content p {
  margin-bottom: 1rem;
}

.post-preview .post-content img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.post-preview .post-content pre {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.post-preview .post-content code {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.post-preview .post-content blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #6b7280;
}

.post-preview .post-content a {
  color: #3b82f6;
  text-decoration: none;
}

.post-preview .post-content a:hover {
  text-decoration: underline;
}

/* 标签样式 */
.tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #f3f4f6;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: #4b5563;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

/* 作者信息卡片样式 */
.author-card {
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  color: #374151;
}

.author-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary, #374151);
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
  padding-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.author-card .font-medium {
  color: var(--text-primary, #1f2937);
  font-weight: 600;
  transition: color 0.3s ease;
}

.author-card .text-gray-500 {
  color: var(--text-secondary, #6b7280) !important;
  transition: color 0.3s ease;
}

.author-card .text-gray-600 {
  color: var(--text-secondary, #4b5563) !important;
  transition: color 0.3s ease;
}

/* 目录卡片样式 */
.toc-card {
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 1rem;
  color: #374151;
}

.toc-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #374151;
  border-bottom: 2px solid #3b82f6;
  padding-bottom: 0.5rem;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin-bottom: 0.375rem;
}

.toc-link {
  display: block;
  padding: 0.375rem 0.5rem;
  color: #4b5563;
  text-decoration: none;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  border-left: 3px solid transparent;
}

.toc-link:hover {
  color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
  border-left-color: #3b82f6;
  padding-left: 0.75rem;
}

.toc-level-1 {
  padding-left: 0;
}

.toc-level-2 {
  padding-left: 1rem;
}

.toc-level-3 {
  padding-left: 2rem;
}

.toc-level-4 {
  padding-left: 3rem;
}

.toc-level-5 {
  padding-left: 4rem;
}

.toc-level-6 {
  padding-left: 5rem;
}
</style>
