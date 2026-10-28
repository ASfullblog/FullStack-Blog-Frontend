<template>
  <div class="post-detail">
    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-16">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      <p class="mt-2 text-gray-600">加载中...</p>
    </div>

    <!-- 文章内容 -->
    <div v-else-if="post" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 主内容区 -->
      <div class="lg:col-span-2">
        <!-- 文章标题 -->
        <h1 class="text-3xl font-bold mb-4">{{ post.title }}</h1>

        <!-- 文章信息 -->
        <div class="flex flex-wrap items-center mb-6 text-sm text-gray-500">
          <div class="flex items-center mr-6 mb-2">
            <img :src="resolveAvatar(post.author)" :alt="post.author.username" class="w-6 h-6 rounded-full mr-2">
            <span>{{ post.author.username }}</span>
          </div>
          <div class="mr-6 mb-2">
            <span>{{ formatDate(post.createdAt) }}</span>
          </div>
          <div class="mr-6 mb-2">
            <span>{{ post.viewCount }} 阅读</span>
          </div>
          <div class="mb-2">
            <span>{{ post.category.name }}</span>
          </div>
        </div>

        <!-- 文章标签 -->
        <div class="flex flex-wrap mb-6">
          <span v-for="tag in post.tags" :key="tag.id" class="tag">{{ tag.name }}</span>
        </div>

        <!-- 文章封面 -->
        <div class="mb-6">
          <img :src="getCoverImage(post.coverImage)" :alt="post.title" class="w-full h-64 object-cover rounded-lg shadow-md">
        </div>

        <!-- 文章摘要 -->
        <div v-if="post.excerpt" class="excerpt-section mb-6">
          <div class="excerpt-content" :style="{ background: excerptBgColor }">
            <div class="excerpt-icon">
              <el-icon class="magic-icon"><MagicStick /></el-icon>
            </div>
            <p class="excerpt-text" ref="excerptRef">{{ displayExcerpt }}</p>
          </div>
        </div>

        <!-- 文章内容 -->
        <div class="post-content" v-html="renderedContent" ref="contentRef"></div>

        <!-- 评论区 -->
        <div class="comment-section">
          <h2 class="text-2xl font-bold mb-6">评论</h2>

          <!-- 评论表单 -->
          <div class="comment-form mb-6">
            <h3 class="text-lg font-semibold mb-3">发表评论</h3>

            <!-- 未登录时显示登录链接 -->
            <div v-if="!userStore.isLoggedIn" class="bg-white rounded-lg shadow-md p-4 text-center">
              <p class="mb-4">请登录后发表评论</p>
              <router-link :to="{ path: '/login', query: { redirect: `/post/${slug}` } }" class="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-300">
                去登录
              </router-link>
            </div>

            <!-- 已登录时显示评论输入框 -->
            <div v-else class="bg-white rounded-lg shadow-md p-4">
              <div class="flex items-center mb-3">
                <img :src="resolveAvatar(userStore.currentUser)" :alt="userStore.currentUser?.username" class="w-8 h-8 rounded-full mr-2">
                <span class="font-medium">{{ userStore.currentUser?.username }}</span>
              </div>
              <div class="relative">
                <textarea
                  v-model="commentContent"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="写下你的评论..."
                  rows="4"
                  maxlength="500"
                ></textarea>
                <div class="absolute bottom-2 right-2 text-xs text-gray-400">
                  {{ commentContent.length }}/500
                </div>
              </div>
              <div class="flex justify-between items-center mt-3">
                <span class="text-xs text-gray-400">友善的评论是交流的起点</span>
                <button
                  @click="handleSubmitComment"
                  :disabled="!commentContent.trim() || commentContent.length > 500"
                  class="btn btn-primary"
                >
                  发送
                </button>
              </div>
            </div>
          </div>

          <!-- 评论列表 - 使用楼层式组件 -->
          <div v-if="visibleComments.length > 0" class="comment-list">
            <CommentItem
              v-for="comment in visibleComments"
              :key="comment.id"
              :comment="comment"
              :level="0"
              :post-id="post?.id"
              :replying-to="replyingTo"
              @reply="handleReply"
              @delete="handleDeleteComment"
              @submit-reply="submitReply"
              @cancel-reply="cancelReply"
              @approve="handleApproveComment"
            />
          </div>

          <!-- 无评论提示 -->
          <div v-else class="comment-empty-state">
            <div class="comment-empty-icon">
              <el-icon :size="64" color="#ddd"><ChatDotRound /></el-icon>
            </div>
            <p class="comment-empty-text">暂无评论，快来抢沙发吧！</p>
          </div>
        </div>
      </div>

      <!-- 侧边栏 -->
      <div class="lg:col-span-1">
        <!-- 目录 -->
        <div class="toc mb-6" v-if="tocItems.length > 0">
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

        <!-- 作者信息 -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 class="text-lg font-bold mb-3">作者信息</h3>
          <div class="flex items-center mb-3">
            <img :src="resolveAvatar(post.author)" :alt="post.author.username" class="w-12 h-12 rounded-full mr-3">
            <div>
              <div class="font-medium">{{ post.author.username }}</div>
              <div class="text-sm text-gray-500">作者</div>
            </div>
          </div>
          <p class="text-gray-600 text-sm">
            专注于技术分享，希望通过文章帮助更多人学习和成长。
          </p>
        </div>

        <!-- 相关文章 -->
        <div class="bg-white rounded-lg shadow-md p-4">
          <h3 class="text-lg font-bold mb-3">相关文章</h3>
          <ul class="space-y-3" v-if="relatedPosts.length > 0">
            <li v-for="relatedPost in relatedPosts" :key="relatedPost.id">
              <div 
                class="flex items-start hover:text-primary-600 transition-colors cursor-pointer"
                @click="goToRelatedPost(relatedPost.slug)"
              >
                <img 
                  :src="relatedPost.coverImage || DEFAULT_COVER_IMAGE" 
                  :alt="relatedPost.title"
                  class="w-16 h-16 object-cover rounded mr-3 flex-shrink-0"
                >
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-sm line-clamp-2">{{ relatedPost.title }}</div>
                  <div class="text-xs text-gray-500 mt-1">{{ relatedPost.viewCount }} 阅读</div>
                </div>
              </div>
            </li>
          </ul>
          <div v-else class="text-gray-500 text-sm text-center py-4">
            暂无相关文章
          </div>
        </div>
      </div>
    </div>

    <!-- 文章不存在 -->
    <div v-else class="text-center py-16">
      <p class="text-gray-600">文章不存在</p>
      <router-link to="/" class="btn btn-primary mt-4">返回首页</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick, ChatDotRound, Edit, Delete, Timer, InfoFilled } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import { postApi } from '../api/post'
import { useUserStore } from '../stores/userStore'
import { resolveAvatar } from '../utils/avatar'
import CommentItem from '../components/CommentItem.vue'
import { validateComment, detectXSS } from '../utils/security'
import { showSuccess, showInfo, showError } from '../utils/toast'
import type { Post, Comment } from '../types'

// 轮询间隔（毫秒）
const POLLING_INTERVAL = 5000

// 路由参数
const route = useRoute()
const router = useRouter()
const slug = computed(() => route.params.slug as string)

// 默认封面图片
const DEFAULT_COVER_IMAGE = 'https://picsum.photos/1200/600?random=1'

// 默认头像逻辑统一收敛到 utils/avatar（resolveAvatar）

// 响应式数据
const post = ref<Post | null>(null)
const loading = ref(false)
const comments = ref<Comment[]>([])
const commentContent = ref('')
const userStore = useUserStore()
const contentRef = ref<HTMLElement | null>(null)
const excerptRef = ref<HTMLElement | null>(null)

// 回复相关
const replyingTo = ref<number | null>(null)
const replyContent = ref('')

// 相关文章
const relatedPosts = ref<Post[]>([])

/**
 * 将扁平评论列表转换为树形结构
 * @param comments 评论列表
 * @returns 树形结构的评论列表
 */
const buildCommentTree = (comments: Comment[]): Comment[] => {
  const commentMap = new Map<number, Comment & { children?: Comment[] }>()
  const rootComments: Comment[] = []

  // 首先创建所有评论的映射
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, children: [] })
  })

  // 然后构建树形结构
  comments.forEach(comment => {
    const commentWithChildren = commentMap.get(comment.id)!
    if (comment.parentId && commentMap.has(comment.parentId)) {
      // 这是一个回复，添加到父评论的children中
      const parent = commentMap.get(comment.parentId)!
      if (!parent.children) {
        parent.children = []
      }
      // 添加parentUser信息用于显示
      ;(commentWithChildren as any).parentUser = parent.user
      parent.children.push(commentWithChildren)
    } else {
      // 这是一个根评论
      rootComments.push(commentWithChildren)
    }
  })

  return rootComments
}

/**
 * 过滤评论树
 * 递归过滤评论及其子评论
 * @param comments 评论列表
 * @param currentUserId 当前用户ID
 * @param isAdmin 是否为管理员
 * @returns 过滤后的评论列表
 */
const filterCommentTree = (comments: Comment[], currentUserId?: number, isAdmin?: boolean): Comment[] => {
  return comments.filter(comment => {
    // 管理员可以看到所有评论
    if (isAdmin) return true

    // 已通过审核的评论所有人可见
    if (comment.status === 'approved') return true

    // 待审核评论只有作者自己可见
    if (comment.status === 'pending') {
      return comment.userId === currentUserId
    }

    return false
  }).map(comment => {
    // 递归过滤子评论
    if (comment.children && comment.children.length > 0) {
      return {
        ...comment,
        children: filterCommentTree(comment.children, currentUserId, isAdmin)
      }
    }
    return comment
  })
}

/**
 * 过滤后的评论列表
 * 规则：
 * 1. 管理员可以看到所有评论
 * 2. 普通用户只能看到：
 *    - 已通过审核的评论
 *    - 自己发布的待审核评论
 */
const visibleComments = computed(() => {
  const currentUserId = userStore.currentUser?.id
  const isAdmin = userStore.currentUser?.role === 'admin'

  // 后端返回的已经是树形结构，直接递归过滤即可
  return filterCommentTree(comments.value, currentUserId, isAdmin)
})

// 获取封面图片
const getCoverImage = (coverImage?: string): string => {
  return coverImage || DEFAULT_COVER_IMAGE
}

// 摘要相关
const displayExcerpt = ref('')
const currentExcerptIndex = ref(0)
const excerptBgColor = ref('')

// 马卡龙色系
const macaroonColors = [
  'linear-gradient(135deg, #FFD1DC 0%, #FFB6C1 100%)', // 浅粉色
  'linear-gradient(135deg, #B5EAD7 0%, #95E1D3 100%)', // 薄荷绿
  'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)', // 浅蓝色
  'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)', // 浅橙色
  'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)', // 浅紫色
  'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)', // 浅绿色
  'linear-gradient(135deg, #FFFDE7 0%, #FFF9C4 100%)', // 浅黄色
  'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)'  // 天蓝色
]

// 随机获取马卡龙色
const getRandomMacaroonColor = () => {
  return macaroonColors[Math.floor(Math.random() * macaroonColors.length)]
}

// 逐字显示摘要
const typeExcerpt = () => {
  if (!post.value || !post.value.excerpt) return
  
  const excerpt = post.value.excerpt
  if (currentExcerptIndex.value < excerpt.length) {
    displayExcerpt.value += excerpt[currentExcerptIndex.value]
    currentExcerptIndex.value++
    setTimeout(typeExcerpt, 50) // 50ms per character
  }
}

// 监听摘要变化
watch(
  () => post.value?.excerpt,
  (newExcerpt) => {
    if (newExcerpt) {
      // 重置状态
      displayExcerpt.value = ''
      currentExcerptIndex.value = 0
      // 随机背景色
      excerptBgColor.value = getRandomMacaroonColor()
      // 开始逐字显示
      setTimeout(typeExcerpt, 500) // 延迟500ms开始
    }
  },
  { immediate: true }
)

// 目录项
interface TocItem {
  id: string
  text: string
  level: number
}
const tocItems = ref<TocItem[]>([])

// 生成唯一ID
const generateId = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
    .replace(/^|-$/g, '')
}

// 提取目录
const extractToc = (content: string): void => {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const items: TocItem[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = generateId(text)

    items.push({ id, text, level })
  }

  tocItems.value = items

  // 延迟添加ID到标题元素
  nextTick(() => {
    if (contentRef.value) {
      const headings = contentRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6')
      headings.forEach((heading) => {
        const text = heading.textContent || ''
        const id = generateId(text)
        heading.id = id
      })
    }
  })
}

// 平滑滚动到标题
const scrollToHeading = (id: string): void => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Markdown实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// 渲染Markdown内容
const renderedContent = computed(() => {
  if (!post.value) return ''
  const content = post.value.content
  // 先提取目录
  extractToc(content)
  // 渲染内容
  return md.render(content)
})

/**
 * 格式化日期为友好格式
 * @param dateString 日期字符串
 * @returns 格式化后的日期字符串
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  // 小于24小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }
  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  }
  
  // 超过7天显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取相关文章
const fetchRelatedPosts = async (categoryId: number, currentPostId: number) => {
  try {
    // 获取同分类的文章，按阅读量排序，排除当前文章
    const response = await postApi.getPosts({
      categoryId: categoryId,
      limit: 3,
      sortBy: 'viewCount',
      order: 'desc'
    })
    
    // 过滤掉当前文章，并限制为3篇
    let posts = response.data.posts.filter((p: Post) => p.id !== currentPostId).slice(0, 3)
    
    // 如果同分类文章不足3篇，获取其他分类的文章补充
    if (posts.length < 3) {
      const otherResponse = await postApi.getPosts({
        limit: 3 - posts.length,
        sortBy: 'viewCount',
        order: 'desc'
      })
      const otherPosts = otherResponse.data.posts.filter((p: Post) => 
        p.id !== currentPostId && !posts.find((rp: Post) => rp.id === p.id)
      )
      posts = [...posts, ...otherPosts].slice(0, 3)
    }
    
    relatedPosts.value = posts
  } catch (error) {
    console.error('获取相关文章失败:', error)
    relatedPosts.value = []
  }
}

// 获取文章详情
const fetchPost = async () => {
  loading.value = true
  try {
    const response = await postApi.getPostBySlug(slug.value)
    post.value = response.data
    // 获取评论列表和相关文章
    if (post.value) {
      fetchComments(post.value.id)
      fetchRelatedPosts(post.value.category.id, post.value.id)
      // 开始实时评论轮询
      startCommentsPolling()
    }
  } catch (error) {
    console.error('获取文章详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取评论列表
const fetchComments = async (postId: number, showNotification: boolean = false) => {
  try {
    const response = await postApi.getComments(postId)
    const newComments = response.data || []

    // 检查是否有新评论（用于实时通知）
    if (showNotification && comments.value.length > 0 && newComments.length > comments.value.length) {
      const newCount = newComments.length - comments.value.length
      showInfo(`收到 ${newCount} 条新评论`, 3000)
    }

    comments.value = newComments
  } catch (error) {
    console.error('获取评论失败:', error)
  }
}

// 实时评论轮询
let commentsPollingTimer: NodeJS.Timeout | null = null
let lastCommentCount = 0

/**
 * 开始评论轮询
 */
const startCommentsPolling = () => {
  if (commentsPollingTimer || !post.value) return

  // 立即获取一次
  fetchComments(post.value.id)

  // 设置定时轮询
  commentsPollingTimer = setInterval(() => {
    if (post.value) {
      fetchComments(post.value.id, true)
    }
  }, POLLING_INTERVAL)
}

/**
 * 停止评论轮询
 */
const stopCommentsPolling = () => {
  if (commentsPollingTimer) {
    clearInterval(commentsPollingTimer)
    commentsPollingTimer = null
  }
}

// 提交评论
const handleSubmitComment = async () => {
  const content = commentContent.value.trim()

  // 前端安全校验
  const validation = validateComment(content)
  if (!validation.valid) {
    ElMessage.warning(validation.message)
    return
  }

  // 检测XSS攻击
  if (detectXSS(content)) {
    ElMessage.error('评论内容包含非法代码，请修改后重试')
    return
  }

  if (!post.value) return

  try {
    const response = await postApi.createComment({
      postId: post.value.id,
      content: content
    })

    ElMessage.success('评论发表成功')
    commentContent.value = ''
    // 重新获取评论列表
    fetchComments(post.value.id)
  } catch (error: any) {
    ElMessage.error(error.message || '评论发表失败')
  }
}

// 跳转到相关文章
const goToRelatedPost = (relatedSlug: string) => {
  if (relatedSlug) {
    router.push(`/post/${relatedSlug}`)
  }
}

/**
 * 判断当前用户是否可以删除评论
 * @param comment 评论对象
 * @returns 是否可以删除
 */
const canDeleteComment = (comment: Comment): boolean => {
  // 管理员可以删除所有评论，普通用户只能删除自己的评论
  return userStore.currentUser?.role === 'admin' || userStore.currentUser?.id === comment.userId
}

/**
 * 处理回复评论
 * @param comment 要回复的评论
 */
const handleReply = (comment: Comment) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再回复')
    return
  }
  replyingTo.value = comment.id
  replyContent.value = ''
}

/**
 * 取消回复
 */
const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
}

/**
 * 提交回复
 * @param parentComment 父级评论
 * @param content 回复内容（从子组件传递）
 */
const submitReply = async (parentComment: Comment, content: string) => {
  const trimmedContent = content.trim()

  // 前端安全校验
  const validation = validateComment(trimmedContent)
  if (!validation.valid) {
    ElMessage.warning(validation.message)
    return
  }

  // 检测XSS攻击
  if (detectXSS(trimmedContent)) {
    ElMessage.error('回复内容包含非法代码，请修改后重试')
    return
  }

  if (!post.value) return

  try {
    await postApi.createComment({
      postId: post.value.id,
      content: trimmedContent,
      parentId: parentComment.id
    })

    ElMessage.success('回复发表成功')
    replyContent.value = ''
    replyingTo.value = null
    // 重新获取评论列表
    fetchComments(post.value.id)
  } catch (error: any) {
    // 处理父评论不存在的情况
    if (error.code === 'PARENT_COMMENT_NOT_FOUND' || error.message?.includes('已被删除')) {
      showError('该评论已被删除或不存在，无法回复', 4000)
      // 刷新评论列表以更新UI
      fetchComments(post.value.id)
    } else {
      ElMessage.error(error.message || '回复发表失败')
    }
  }
}

/**
 * 处理删除评论
 * @param comment 要删除的评论
 */
const handleDeleteComment = async (comment: Comment) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 调用删除评论API
    await postApi.deleteComment(comment.id)
    ElMessage.success('评论删除成功')
    // 重新获取评论列表
    if (post.value) {
      fetchComments(post.value.id)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评论失败:', error)
      ElMessage.error('删除评论失败')
    }
  }
}

/**
 * 处理审核通过评论
 * @param comment 要通过审核的评论
 */
const handleApproveComment = async (comment: Comment) => {
  try {
    await postApi.moderateComment(comment.id, 'approved')
    ElMessage.success('评论已通过审核')
    // 重新获取评论列表
    if (post.value) {
      fetchComments(post.value.id)
    }
  } catch (error) {
    console.error('审核评论失败:', error)
    ElMessage.error('审核评论失败')
  }
}

// 监听路由参数变化，当slug改变时重新加载文章
watch(() => route.params.slug, (newSlug, oldSlug) => {
  if (newSlug && newSlug !== oldSlug) {
    fetchPost()
  }
})

// 页面挂载时获取文章详情
onMounted(() => {
  fetchPost()
})

// 页面卸载时停止轮询
onUnmounted(() => {
  stopCommentsPolling()
})
</script>

<style scoped>
/* 目录样式 */
.toc {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.toc-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #667eea;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin: 8px 0;
}

.toc-link {
  display: block;
  color: #666;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-size: 14px;
}

.toc-link:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
  transform: translateX(5px);
}

.toc-level-1 {
  font-weight: bold;
  font-size: 16px;
}

.toc-level-2 {
  padding-left: 20px;
}

.toc-level-3 {
  padding-left: 30px;
  font-size: 13px;
}

.toc-level-4 {
  padding-left: 40px;
  font-size: 12px;
}

.toc-level-5,
.toc-level-6 {
  padding-left: 50px;
  font-size: 12px;
  color: #999;
}
/* 摘要样式 */
.excerpt-section {
  margin: 1.5rem 0;
}

.excerpt-content {
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  color: #374151;
}

.excerpt-icon {
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.magic-icon {
  font-size: 1.5rem;
  color: #667eea;
  animation: pulse 2s infinite;
}

.excerpt-text {
  flex: 1;
  margin: 0;
  line-height: 1.6;
  font-size: 0.95rem;
  font-weight: 500;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>