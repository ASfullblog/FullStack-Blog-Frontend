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
              <!-- 博主头像 - 站长固定本地头像（统一走 utils/avatar，admin 映射 assets/avatar.png） -->
              <img
                :src="userAvatar"
                alt="博主头像"
                class="profile-avatar"
              >
            </div>
            <!-- <h2 class="username">{{ aboutInfo.username }}</h2> -->
            <p class="bio">{{ aboutInfo.bio || '一名前端工程师，自学路线起步，平时把踩坑过程写成博客收在这个站里。' }}</p>
          </div>

          <!-- 联系方式 -->
          <div class="contact-section">
            <a :href="GITHUB_URL" target="_blank" rel="noopener" class="contact-item">
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
                v-for="(tech, index) in coreTechTags"
                :key="index"
                class="tag-item tech"
                :style="getTagStyle(index, 'tech')"
              >
                {{ tech }}
              </span>
            </div>
          </div>

          <!-- 足迹 -->
          <div v-if="aboutInfo.visitedProvinces.length" class="tags-section">
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
          </div>

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
          <h2 class="section-title">👋 你好，我是这个博客的站长</h2>
          <div class="intro-content">
            <p>一名前端工程师，专业方向是软件技术，走的是非科班自驱路线——把啃不动的知识点拆成小块，一块块啃下来，再把啃的过程写成博客。这个站就是我的「外部大脑」：学习笔记、踩坑复盘、摘抄的句子都收在这里。</p>
            <p>日常围着 Vue 全家桶转，最近更多在 Vue3 + TypeScript + Vite。做过后台管理系统里权限、标签、接入配置这类核心模块，也独立交付过电商类 App 的四十多个页面和整套前台 UI 设计稿；小程序 / H5 / App 多端适配、活动页埋点同样不陌生。</p>
            <p>最近在把 AI 编码工具变成日常：重复劳动尽量自动化，生成的代码严格校验，再沉淀提示词和组件规范去约束输出质量。如果你也在学前端，或者对某篇文章有不同的做法，欢迎点左侧的 GitHub / QQ / 邮箱图标来找我唠。</p>
          </div>
        </div>

        <!-- 能力 & 方向 -->
        <div class="intro-section">
          <h2 class="section-title">🧭 能力 &amp; 方向</h2>
          <ul class="focus-list">
            <li v-for="(point, index) in focusPoints" :key="index">{{ point }}</li>
          </ul>
        </div>

        <!-- 技术栈详情 -->
        <div class="intro-section">
          <h2 class="section-title">🛠 技术栈</h2>
          <div v-for="group in skillGroups" :key="group.name" class="skill-group">
            <h3 class="section-subtitle skill-group-title">{{ group.name }}</h3>
            <div class="tags-cloud">
              <span
                v-for="(tech, index) in group.items"
                :key="tech"
                class="tag-item tech"
                :style="getTagStyle(index, 'tech')"
              >
                {{ tech }}
              </span>
            </div>
          </div>
        </div>

        <!-- 开源 & 探索 -->
        <div class="intro-section">
          <h2 class="section-title">🌱 开源 &amp; 探索</h2>
          <div class="intro-content">
            <p>一直觉得「重复劳动就该被自动化」，所以喜欢折腾小工具。公开仓库不算多，但每个都解决过我实际遇到的麻烦：</p>
          </div>
          <div class="intro-content repo-link-row">
            <p>全部折腾记录都在 <a :href="GITHUB_URL" target="_blank" rel="noopener" class="github-link">GitHub：asfre</a>，欢迎围观、提 Issue，或者一起改。</p>
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
import { resolveAvatar, adminAvatar } from '../utils/avatar'

// 站长 GitHub 主页（公开账号，页面固定指向这里）
const GITHUB_URL = 'https://github.com/asfre'

// 博主信息 - 全部来自后台 users 表（公开字段），页面不再硬编码任何个人资料
const aboutInfo = ref({
  username: '',
  email: '',
  qqNumber: '',
  bio: '',
  githubUrl: '',
  techStack: [] as string[],
  visitedProvinces: [] as string[]
})

// 加载状态
const loading = ref(true)

// 博主头像 - 统一走 utils/avatar：admin 固定本地 assets/avatar.png，不再用远程生成头像
const userAvatar = ref(adminAvatar)

// 去标识化：库内字段理论上已是通用文案，这里再兜底一层，避免任何公司名/真名/手机号漏出
const sanitize = (text: string): string => {
  if (!text) return ''
  return text
    .replace(/[\u4e00-\u9fa5]{2,4}(?:公司|集团|科技|网络|信息|软件|技术|有限|股份)/g, '某家公司')
    .replace(/1[3-9]\d{9}/g, '138****0000')
}

// 左侧技术标签：优先读后台 tech_stack，空时给一组兜底（不指向任何单位）
const coreTechTags = ref<string[]>([])

// 词云关键词 - 通用技术方向（去标识化，不指向任何单位或项目）
const wordCloudKeywords = [
  'Vue3', 'TypeScript', 'Vite', 'uni-app', 'Element Plus', 'Pinia',
  'Composition API', '性能优化', 'AI 提效', '组件化', 'Git', '响应式',
  'Webpack', '小程序', '多端适配', '懒加载', 'Tree-shaking', 'CI/CD',
  '首屏优化', '长列表渲染', 'Core Web Vitals', '跨域联调', 'React', '可访问性'
]

// 能力与方向 - 经历抽象为能力描述，不指向具体单位或项目
const focusPoints = [
  '熟悉 Vue2 / Vue3 全家桶与 Composition API，习惯把功能逻辑拆解成可复用组件',
  '主导过多个后台管理系统核心模块的前端开发（权限 / 标签 / 接入配置类业务方向）',
  '独立交付过电商类 App 的 40+ 页面与整套前台 UI 设计稿',
  '做过小程序 / H5 / App 多端一致体验适配，以及活动页埋点',
  '关注性能与体验：首屏优化、长列表渲染、接口缓存、Core Web Vitals、可访问性',
  '日常用 AI 编码工具辅助重构提效：校验生成代码，沉淀提示词与组件化规范约束输出质量'
]

// 技术栈分组明细 - 全部读自后台 tech_stack（不硬编码任何清单）
const skillGroups = ref<{ name: string; items: string[] }[]>([])
const buildSkillGroups = () => {
  const list = aboutInfo.value.techStack?.length
    ? aboutInfo.value.techStack
    : ['Vue.js', 'TypeScript', 'Node.js', 'UniApp', 'Element Plus', 'Vite']
  skillGroups.value = [{ name: '技术栈', items: list }]
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

  // 词云数据源 - 使用页面内置的技术方向关键词（不再读库里的旧配置）
  const allWords = wordCloudKeywords

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

// 获取博主信息 - 只取联系方式与头像（原有数据源），展示文案不依赖库内旧配置
const fetchAboutInfo = async () => {
  try {
    loading.value = true
    const response = await getBloggerInfo()
    if (response.data) {
      const user = response.data
      aboutInfo.value.username = user.username || ''
      aboutInfo.value.email = user.email || ''
      aboutInfo.value.qqNumber = (user as any).qq_number || ''
      aboutInfo.value.githubUrl = (user as any).github_url || ''
      // bio / 技术栈 / 足迹 全部来自后台，并走去标识化兜底
      aboutInfo.value.bio = sanitize(user.bio || '')
      const ts = (user as any).tech_stack
      aboutInfo.value.techStack = Array.isArray(ts) ? ts : (typeof ts === 'string' ? safeParseArray(ts) : [])
      const vp = (user as any).visited_provinces
      aboutInfo.value.visitedProvinces = Array.isArray(vp) ? vp : (typeof vp === 'string' ? safeParseArray(vp) : [])
      // admin 由 resolveAvatar 固定映射到本地头像，其他用户保持原逻辑
      userAvatar.value = resolveAvatar(user)
      // 左侧技术标签 + 右侧技术栈分组，都从后台 tech_stack 派生
      coreTechTags.value = aboutInfo.value.techStack.length
        ? aboutInfo.value.techStack
        : ['Vue.js', 'TypeScript', 'Node.js', 'UniApp', 'Element Plus', 'Vite']
      buildSkillGroups()
    }
  } catch (error) {
    console.error('获取博主信息失败:', error)
  } finally {
    loading.value = false
  }
}

// 安全的 JSON 数组解析（兼容后台返回字符串或数组两种形态）
const safeParseArray = (raw: string): string[] => {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// 页面挂载时：先用内置关键词渲染词云，再拉取联系方式
onMounted(() => {
  generateWordCloud()
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

/* 右侧新增区块：列表与分组（沿用现有卡片风格与主题变量） */
.focus-list {
  margin: 0;
  padding-left: 1.2em;
  color: var(--text-secondary);
  line-height: 1.9;
}

.focus-list li {
  margin-bottom: 8px;
}

.focus-list li:last-child {
  margin-bottom: 0;
}

.skill-group {
  margin-bottom: 16px;
}

.skill-group:last-child {
  margin-bottom: 0;
}

.skill-group-title {
  margin-bottom: 8px;
}

.repo-link-row {
  margin-top: 14px;
}

.github-link {
  color: var(--accent-color);
  text-decoration: underline;
  word-break: break-all;
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
