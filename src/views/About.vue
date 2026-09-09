<template>
  <!-- 关于我页面 - 展示博主个人信息、技术栈、足迹等 -->
  <div class="about-container">
    <!-- 页面标题 -->
    <div class="about-header">
      <h1 class="about-title">关于我</h1>
      <p class="about-subtitle">了解更多关于我的故事</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else class="about-content">
      <!-- 左侧：个人信息展示 -->
      <div class="about-left">
        <div class="profile-card">
          <!-- 头像区域 -->
          <div class="avatar-section">
            <div class="avatar-wrapper">
              <!-- 博主头像 - 使用默认头像，加载失败时显示备用头像 -->
              <img
                :src="userAvatar"
                alt="博主头像"
                class="profile-avatar"
                @error="handleAvatarError"
              >
            </div>
            <!-- <h2 class="username">{{ aboutInfo.username }}</h2> -->
            <p class="bio">{{ aboutInfo.bio || '这个人很懒，什么都没写~' }}</p>
          </div>

          <!-- 联系方式 -->
          <div class="contact-section">
            <a v-if="aboutInfo.githubUrl" :href="aboutInfo.githubUrl" target="_blank" class="contact-item">
              <div class="contact-icon-wrapper github">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <span class="contact-text">GitHub</span>
            </a>
            <a v-if="aboutInfo.qqNumber" :href="`tencent://message/?uin=${aboutInfo.qqNumber}`" class="contact-item">
              <div class="contact-icon-wrapper qq">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .686 4.078.43 6.29.43 2.21 0 6.287.257 6.287-.43 0-.687-1.768-1.182-1.768-1.182 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.746 2.072.111 0 .283-.36.283-1.025 0-2.514-2.164-6.954-2.164-6.954V9.325C18.29 3.364 14.268 2 12.003 2z"/>
                </svg>
              </div>
              <span class="contact-text">QQ</span>
            </a>
            <a v-if="aboutInfo.email" :href="`mailto:${aboutInfo.email}`" class="contact-item">
              <div class="contact-icon-wrapper email">
                <el-icon :size="20"><Message /></el-icon>
              </div>
              <span class="contact-text">邮箱</span>
            </a>
          </div>

          <!-- 技术栈 -->
          <div class="tags-section">
            <div class="section-header-row">
              <h3 class="section-subtitle">技术栈</h3>
            </div>
            <div class="tags-cloud">
              <span
                v-for="(tech, index) in aboutInfo.techStack"
                :key="index"
                class="tag-item tech"
                :style="getTagStyle(index, 'tech')"
              >
                {{ tech }}
              </span>
            </div>
          </div>

          <!-- 足迹 -->
          <!-- <div class="tags-section">
            <div class="section-header-row">
              <h3 class="section-subtitle">足迹</h3>
            </div>
            <div class="tags-cloud">
              <span
                v-for="(place, index) in aboutInfo.visitedProvinces"
                :key="index"
                class="tag-item place"
                :style="getTagStyle(index, 'place')"
              >
                {{ place }}
              </span>
            </div>
          </div> -->

          <!-- 词云图 - 3D球体形式，支持鼠标/手势旋转 -->
          <div class="wordcloud-section">
            <h3 class="section-subtitle">个人词云</h3>
            <div
              ref="wordcloudContainer"
              class="wordcloud-container"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"
              @mouseleave="handleMouseUp"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
            >
              <div
                v-for="(word, index) in wordCloudData"
                :key="index"
                class="wordcloud-item"
                :class="{ 'is-visible': word.visible }"
                :style="{
                  fontSize: word.size + 'px',
                  color: word.color,
                  transform: `translate(-50%, -50%) translate3d(${word.x3d}px, ${word.y3d}px, ${word.z3d}px) scale(${word.scale})`,
                  opacity: word.opacity,
                  zIndex: word.zIndex,
                  pointerEvents: word.visible ? 'auto' : 'none'
                }"
              >
                {{ word.text }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：详细介绍 -->
      <div class="about-right">
        <!-- 个人简介 -->
        <div class="intro-section">
          <!-- <h2 class="section-title">👋 你好，我是 {{ aboutInfo.username }}</h2> -->
          <div class="intro-content">
            <p>欢迎来到我的博客！这里是我记录学习、分享技术、表达想法的地方。</p>
            <p>我喜欢探索新技术，热爱编程，享受解决复杂问题的过程。</p>
            <p>如果你对我的文章感兴趣，欢迎通过上方的联系方式与我交流。</p>
          </div>
        </div>

        <!-- 摘抄语录 -->
        <QuotesSection class="about-section-gap" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 关于我页面
 * 功能：展示博主个人信息、技术栈、足迹、联系方式等
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { Message } from '@element-plus/icons-vue'
import { getBloggerInfo } from '../api/user'
import QuotesSection from '../components/QuotesSection.vue'

// 博主信息 - 初始为空，从API获取
const aboutInfo = ref({
  username: '',
  bio: '',
  email: '',
  githubUrl: '',
  qqNumber: '',
  techStack: [] as string[],
  visitedProvinces: [] as string[]
})

// 加载状态
const loading = ref(true)

// 默认头像 - 使用 DiceBear API 生成默认头像
const userAvatar = ref('https://api.dicebear.com/9.x/avataaars/svg?seed=1')

// 备用头像 - 当默认头像加载失败时使用
const fallbackAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'

/**
 * 处理头像加载错误
 * 功能：当头像图片加载失败时，切换到备用头像
 */
const handleAvatarError = () => {
  userAvatar.value = fallbackAvatar
}

// 3D球体词云数据类型
interface WordCloudItem {
  text: string
  size: number
  color: string
  // 原始球面角度（用于旋转计算）- 保存初始位置
  theta: number // 极角
  phi: number   // 方位角
  // 显示属性
  x3d: number   // 当前3D坐标X
  y3d: number   // 当前3D坐标Y
  z3d: number   // 当前3D坐标Z
  scale: number
  opacity: number
  zIndex: number
  visible: boolean
}

// 词云数据 - 3D球体形式
const wordCloudData = ref<WordCloudItem[]>([])
const wordcloudContainer = ref<HTMLElement | null>(null)

// 3D球体旋转状态
const sphereState = ref({
  rotationX: 0, // X轴旋转角度
  rotationY: 0, // Y轴旋转角度
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  velocityX: 0,
  velocityY: 0,
  autoRotate: true,
  radius: 80 // 球体半径（像素）
})

// 动画帧ID
let animationFrameId: number | null = null

/**
 * 获取词云颜色 - 2025年流行渐变色系
 * 功能：返回预设的现代感配色方案
 * @param index 索引用于循环取色
 * @returns 颜色字符串
 */
const getWordCloudColor = (index: number): string => {
  // 2025年流行的渐变色系 - 科技感/活力感配色
  const colorSchemes = [
    // 霓虹紫粉系
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
    // 活力橙黄系
    '#F97316', '#FBBF24', '#F59E0B', '#EAB308',
    // 清新青绿系
    '#06B6D4', '#14B8A6', '#10B981', '#22C55E',
    // 深海蓝系
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
    // 珊瑚红系
    '#EF4444', '#F97316', '#FB923C', '#FCA5A5'
  ]
  return colorSchemes[index % colorSchemes.length]
}

/**
 * 生成3D球体词云数据
 * 功能：根据技术栈和足迹在球面上均匀分布词语
 */
const generateWordCloud = () => {
  const words: WordCloudItem[] = []

  // 合并技术栈和足迹作为词云数据源
  const techWords = aboutInfo.value.techStack || []
  const placeWords = aboutInfo.value.visitedProvinces || []
  const allWords = [...techWords, ...placeWords]

  // 如果没有数据，显示空状态
  if (allWords.length === 0) {
    wordCloudData.value = []
    return
  }

  const total = allWords.length
  const radius = sphereState.value.radius

  // 使用黄金角螺旋算法在球面上均匀分布点
  allWords.forEach((text, index) => {
    // 黄金角螺旋分布 - 确保点在球面上均匀分布
    const phi = Math.acos(1 - 2 * (index + 0.5) / total) // 极角 0 ~ π
    const theta = Math.PI * (3 - Math.sqrt(5)) * index    // 方位角（黄金角）

    // 根据词的重要性计算大小
    const importance = 1 - (index / total)
    const size = Math.floor(12 + importance * 16) // 12-28px

    // 计算初始3D坐标
    const x0 = radius * Math.sin(phi) * Math.cos(theta)
    const y0 = radius * Math.sin(phi) * Math.sin(theta)
    const z0 = radius * Math.cos(phi)

    words.push({
      text,
      size,
      color: getWordCloudColor(index),
      theta,
      phi,
      x3d: x0,
      y3d: y0,
      z3d: z0,
      scale: 1,
      opacity: 1,
      zIndex: 0,
      visible: true
    })
  })

  wordCloudData.value = words
  // 开始自动旋转动画
  startAutoRotate()
}

/**
 * 更新词云3D位置
 * 功能：根据当前旋转角度计算每个词的显示位置和属性
 * 注意：每次从原始球面角度重新计算，避免坐标累积
 */
const updateWordCloudPositions = () => {
  const { rotationX, rotationY, radius } = sphereState.value
  const radX = (rotationX * Math.PI) / 180
  const radY = (rotationY * Math.PI) / 180

  wordCloudData.value = wordCloudData.value.map(word => {
    // 从原始球面角度计算初始3D坐标
    const x0 = radius * Math.sin(word.phi) * Math.cos(word.theta)
    const y0 = radius * Math.sin(word.phi) * Math.sin(word.theta)
    const z0 = radius * Math.cos(word.phi)

    // 应用旋转变换
    // 先绕Y轴旋转
    let x = x0 * Math.cos(radY) - z0 * Math.sin(radY)
    let z = x0 * Math.sin(radY) + z0 * Math.cos(radY)
    let y = y0

    // 再绕X轴旋转
    const newY = y * Math.cos(radX) - z * Math.sin(radX)
    const newZ = y * Math.sin(radX) + z * Math.cos(radX)
    y = newY
    z = newZ

    // 计算显示属性
    // z值决定缩放和透明度（透视效果）
    const normalizedZ = (z + radius) / (2 * radius) // 归一化到 0-1
    const scale = 0.6 + normalizedZ * 0.6 // 0.6 ~ 1.2
    const opacity = 0.4 + normalizedZ * 0.6 // 0.4 ~ 1.0
    const zIndex = Math.floor(normalizedZ * 100)

    // 只显示球体前方的词（z > -radius/2）
    const visible = z > -radius * 0.3

    return {
      ...word,
      x3d: x,
      y3d: y,
      z3d: z,
      scale,
      opacity,
      zIndex,
      visible
    }
  })
}

/**
 * 开始自动旋转动画
 * 功能：使用requestAnimationFrame实现平滑的自动旋转
 */
const startAutoRotate = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  const animate = () => {
    if (!sphereState.value.isDragging && sphereState.value.autoRotate) {
      // 应用速度衰减
      sphereState.value.velocityX *= 0.95
      sphereState.value.velocityY *= 0.95

      // 自动旋转（当速度很小时）
      if (Math.abs(sphereState.value.velocityX) < 0.05 && Math.abs(sphereState.value.velocityY) < 0.05) {
        sphereState.value.rotationY += 0.05 // 自动绕Y轴旋转 - 更慢的速度
      } else {
        // 应用惯性 - 降低惯性速度
        sphereState.value.rotationX += sphereState.value.velocityX * 0.5
        sphereState.value.rotationY += sphereState.value.velocityY * 0.5
      }

      // 限制X轴旋转角度（避免翻转）
      sphereState.value.rotationX = Math.max(-90, Math.min(90, sphereState.value.rotationX))

      updateWordCloudPositions()
    }

    animationFrameId = requestAnimationFrame(animate)
  }

  animate()
}

/**
 * 停止自动旋转
 */
const stopAutoRotate = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// ========== 鼠标事件处理 ==========

/**
 * 处理鼠标按下事件
 * 功能：开始拖拽旋转
 */
const handleMouseDown = (e: MouseEvent) => {
  sphereState.value.isDragging = true
  sphereState.value.autoRotate = false
  sphereState.value.lastMouseX = e.clientX
  sphereState.value.lastMouseY = e.clientY
  sphereState.value.velocityX = 0
  sphereState.value.velocityY = 0
}

/**
 * 处理鼠标移动事件
 * 功能：实时更新旋转角度
 */
const handleMouseMove = (e: MouseEvent) => {
  if (!sphereState.value.isDragging) return

  const deltaX = e.clientX - sphereState.value.lastMouseX
  const deltaY = e.clientY - sphereState.value.lastMouseY

  // 计算旋转速度（用于惯性效果）
  sphereState.value.velocityY = deltaX * 0.3
  sphereState.value.velocityX = -deltaY * 0.3

  // 更新旋转角度
  sphereState.value.rotationY += deltaX * 0.5
  sphereState.value.rotationX -= deltaY * 0.5

  // 限制X轴旋转角度
  sphereState.value.rotationX = Math.max(-90, Math.min(90, sphereState.value.rotationX))

  // 更新位置
  updateWordCloudPositions()

  // 记录当前位置
  sphereState.value.lastMouseX = e.clientX
  sphereState.value.lastMouseY = e.clientY
}

/**
 * 处理鼠标松开事件
 * 功能：结束拖拽，启用惯性动画
 */
const handleMouseUp = () => {
  if (sphereState.value.isDragging) {
    sphereState.value.isDragging = false
    sphereState.value.autoRotate = true
  }
}

// ========== 触摸事件处理（移动端支持） ==========

/**
 * 处理触摸开始事件
 */
const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1) {
    sphereState.value.isDragging = true
    sphereState.value.autoRotate = false
    sphereState.value.lastMouseX = e.touches[0].clientX
    sphereState.value.lastMouseY = e.touches[0].clientY
    sphereState.value.velocityX = 0
    sphereState.value.velocityY = 0
  }
}

/**
 * 处理触摸移动事件
 */
const handleTouchMove = (e: TouchEvent) => {
  if (!sphereState.value.isDragging || e.touches.length !== 1) return

  e.preventDefault() // 防止页面滚动

  const deltaX = e.touches[0].clientX - sphereState.value.lastMouseX
  const deltaY = e.touches[0].clientY - sphereState.value.lastMouseY

  sphereState.value.velocityY = deltaX * 0.3
  sphereState.value.velocityX = -deltaY * 0.3

  sphereState.value.rotationY += deltaX * 0.5
  sphereState.value.rotationX -= deltaY * 0.5
  sphereState.value.rotationX = Math.max(-90, Math.min(90, sphereState.value.rotationX))

  updateWordCloudPositions()

  sphereState.value.lastMouseX = e.touches[0].clientX
  sphereState.value.lastMouseY = e.touches[0].clientY
}

/**
 * 处理触摸结束事件
 */
const handleTouchEnd = () => {
  if (sphereState.value.isDragging) {
    sphereState.value.isDragging = false
    sphereState.value.autoRotate = true
  }
}

// 获取标签样式
const getTagStyle = (index: number, type: 'tech' | 'place') => {
  const techColors = [
    { bg: '#e3f2fd', border: '#2196f3', text: '#1976d2' },
    { bg: '#f3e5f5', border: '#9c27b0', text: '#7b1fa2' },
    { bg: '#e8f5e9', border: '#4caf50', text: '#388e3c' },
    { bg: '#fff3e0', border: '#ff9800', text: '#f57c00' },
    { bg: '#fce4ec', border: '#e91e63', text: '#c2185b' },
    { bg: '#e0f2f1', border: '#009688', text: '#00796b' }
  ]

  const placeColors = [
    { bg: '#fff8e1', border: '#ffc107', text: '#ffa000' },
    { bg: '#e8eaf6', border: '#3f51b5', text: '#303f9f' },
    { bg: '#fbe9e7', border: '#ff5722', text: '#e64a19' },
    { bg: '#e0f7fa', border: '#00bcd4', text: '#0097a7' },
    { bg: '#f3e5f5', border: '#9c27b0', text: '#7b1fa2' }
  ]

  const colors = type === 'tech' ? techColors : placeColors
  const color = colors[index % colors.length]

  return {
    backgroundColor: color.bg,
    borderColor: color.border,
    color: color.text
  }
}

// 获取博主信息
const fetchAboutInfo = async () => {
  try {
    loading.value = true
    // 从API获取博主信息
    const response = await getBloggerInfo()
    if (response.data) {
      const user = response.data
      aboutInfo.value.username = user.username || ''
      aboutInfo.value.bio = (user as any).bio || ''
      aboutInfo.value.email = user.email || ''
      aboutInfo.value.githubUrl = (user as any).github_url || ''
      aboutInfo.value.qqNumber = (user as any).qq_number || ''
      userAvatar.value = user.avatar || userAvatar.value

      // 处理技术栈 - 后端可能返回数组或JSON字符串
      try {
        const techStack = (user as any).tech_stack
        if (techStack) {
          if (Array.isArray(techStack)) {
            aboutInfo.value.techStack = techStack
          } else if (typeof techStack === 'string') {
            aboutInfo.value.techStack = JSON.parse(techStack)
          } else {
            aboutInfo.value.techStack = []
          }
        } else {
          aboutInfo.value.techStack = []
        }
      } catch {
        aboutInfo.value.techStack = []
      }

      // 处理足迹 - 后端可能返回数组或JSON字符串
      try {
        const visitedProvinces = (user as any).visited_provinces
        if (visitedProvinces) {
          if (Array.isArray(visitedProvinces)) {
            aboutInfo.value.visitedProvinces = visitedProvinces
          } else if (typeof visitedProvinces === 'string') {
            aboutInfo.value.visitedProvinces = JSON.parse(visitedProvinces)
          } else {
            aboutInfo.value.visitedProvinces = []
          }
        } else {
          aboutInfo.value.visitedProvinces = []
        }
      } catch {
        aboutInfo.value.visitedProvinces = []
      }

      // 生成词云数据
      generateWordCloud()
    }
  } catch (error) {
    console.error('获取博主信息失败:', error)
    // 使用默认数据生成词云
    generateWordCloud()
  } finally {
    loading.value = false
  }
}

// 页面挂载时获取数据
onMounted(() => {
  fetchAboutInfo()
})

// 页面卸载时清理动画
onUnmounted(() => {
  stopAutoRotate()
})
</script>

<style scoped>
/* 页面容器 */
.about-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 页面标题 */
.about-header {
  text-align: center;
  margin-bottom: 40px;
}

.about-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.about-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
}

/* 内容区域 */
.about-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

@media (min-width: 1024px) {
  .about-content {
    grid-template-columns: 350px 1fr;
  }
}

/* 左侧卡片 */
.about-left {
  position: relative;
  height: fit-content;
}

/* 桌面端使用 sticky 定位 */
@media (min-width: 1024px) {
  .about-left {
    position: sticky;
    top: 20px;
  }
}

.profile-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px var(--shadow-color);
}

/* 头像区域 */
.avatar-section {
  text-align: center;
  margin-bottom: 24px;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--accent-color);
  object-fit: cover;
}

/* .username {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
} */

.bio {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 联系方式 */
.contact-section {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.contact-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  transition: transform 0.3s ease;
}

.contact-item:hover {
  transform: translateY(-3px);
}

.contact-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.contact-icon-wrapper svg,
.contact-icon-wrapper .el-icon {
  width: 22px;
  height: 22px;
  color: white;
}

.contact-icon-wrapper.github {
  background: linear-gradient(135deg, #333 0%, #666 100%);
}

.contact-icon-wrapper.qq {
  background: linear-gradient(135deg, #12b7f5 0%, #0099ff 100%);
}

.contact-icon-wrapper.email {
  background: linear-gradient(135deg, #ea4335 0%, #fbbc05 100%);
}

.contact-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* 标签区域 */
.tags-section {
  margin-bottom: 24px;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-subtitle {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid;
  transition: all 0.3s ease;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-color);
}

/* 词云图 - 3D球体设计 */
.wordcloud-section {
  margin-bottom: 0;
}

/* 词云容器 - 3D球体场景 */
.wordcloud-container {
  position: relative;
  height: 220px;
  background: radial-gradient(
    ellipse at center,
    rgba(99, 102, 241, 0.08) 0%,
    rgba(168, 85, 247, 0.05) 40%,
    transparent 70%
  );
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: grab;
  user-select: none;
  touch-action: none; /* 防止触摸滚动 */
  perspective: 1000px; /* 3D透视 */
}

.wordcloud-container:active {
  cursor: grabbing;
}

/* 3D球体词云项 */
.wordcloud-item {
  position: absolute;
  left: 50%;
  top: 50%;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: transform 0.1s linear, opacity 0.1s linear;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  letter-spacing: 0.3px;
  padding: 2px 6px;
  border-radius: 6px;
  will-change: transform, opacity;
  /* 缩小hover响应范围 */
  pointer-events: none; /* 默认不响应鼠标事件 */
}

/* 只有可见的词才响应hover */
.wordcloud-item.is-visible {
  pointer-events: auto;
}

/* 悬停效果 - 优化阴影透明度和放大效果 */
.wordcloud-item.is-visible:hover {
  /* 降低阴影透明度，使用rgba让字更清晰 */
  text-shadow:
    0 0 6px rgba(255, 255, 255, 0.8),
    0 0 12px currentColor,
    0 0 20px rgba(currentColor, 0.4);
  filter: brightness(1.2);
  z-index: 1000 !important;
}

/* 词云空状态 */
.wordcloud-container:empty::after {
  content: '暂无数据';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: var(--text-secondary);
  font-size: 0.9rem;
  opacity: 0.6;
}

/* 右侧内容 */
.about-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.intro-section {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px var(--shadow-color);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.intro-content {
  color: var(--text-secondary);
  line-height: 1.8;
}

.intro-content p {
  margin-bottom: 12px;
}

.intro-content p:last-child {
  margin-bottom: 0;
}

.about-section-gap {
  margin-top: 0;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-state p {
  margin-top: 16px;
  color: var(--text-secondary);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
