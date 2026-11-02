<template>
  <!-- 摘抄语录组件 - 展示经典语录和名言（新排版设计） -->
  <!-- compact：页脚等窄场景使用，缩小内边距与字号，图标保持不变 -->
  <div class="quotes-section" :class="{ 'is-compact': compact }">
    <!-- 标题区域 -->
    <div class="section-header">
      <div class="title-wrapper">
        <AppIcon class="title-icon" name="sparkles" :size="18" :stroke="1.6" />
        <h3 class="section-title">摘抄语录</h3>
        <span class="title-decoration"></span>
      </div>
      <button class="refresh-btn" @click="refreshQuote" title="换一句">
        <AppIcon name="refresh" :size="15" />
      </button>
    </div>

    <!-- 主语录展示 - 卡片式设计 -->
    <div class="quote-main-card" :key="currentQuote.id">
      <!-- 装饰引号 -->
      <AppIcon class="quote-decoration quote-decoration-left" name="quote" :size="30" :stroke="1.4" />
      <AppIcon class="quote-decoration quote-decoration-right" name="quote" :size="30" :stroke="1.4" />

      <!-- 中文内容 -->
      <div class="quote-content-cn">
        <p class="quote-text-cn">{{ displayQuoteText }}</p>
      </div>

      <!-- 英文翻译 - 小字深灰色 -->
      <div class="quote-content-en">
        <p class="quote-text-en">{{ displayQuoteTextEn }}</p>
      </div>

      <!-- 作者信息 -->
      <div class="quote-author-section">
        <div class="author-divider">
          <span class="divider-line"></span>
          <span class="divider-dot"></span>
          <span class="divider-line"></span>
        </div>
        <div class="author-info">
          <span class="author-name-cn">{{ currentQuote.author }}</span>
          <span class="author-name-en">{{ currentQuote.authorEn }}</span>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
/**
 * 摘抄语录组件
 * 功能：展示经典语录和名言，支持中英文双语显示、手动刷新
 */
import { ref, computed, onMounted } from 'vue'
import AppIcon from './icons/AppIcon.vue'
import { ElMessage } from 'element-plus'
import {
  getQuotes,
  type Quote
} from '../api/quotes'

/**
 * compact：紧凑模式（用于全站页脚），只压缩尺寸，不改变图标与文案结构
 */
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

// 语录列表
const quotes = ref<Quote[]>([])
const currentQuoteIndex = ref(0)
const loading = ref(false)
const apiSuccess = ref(false)

// 点击速度限制
let lastClickTime = 0
const MIN_CLICK_INTERVAL = 2000 // 最小点击间隔2秒

// 当前显示的语录
const currentQuote = computed(() => {
  if (quotes.value.length > 0) {
    return quotes.value[currentQuoteIndex.value]
  }
  // 显示加载状态或默认内容
  return {
    id: 0,
    text: '加载中...',
    textEn: '',
    author: '',
    authorEn: '',
    category: ''
  }
})

// 中文内容（后端已处理敏感词）
const displayQuoteText = computed(() => {
  return currentQuote.value.text
})

// 英文内容（后端已处理敏感词）
const displayQuoteTextEn = computed(() => {
  return currentQuote.value.textEn
})

// 获取语录列表
const fetchQuotes = async () => {
  try {
    loading.value = true
    // 调用后端API获取一条语录
    const response = await getQuotes(1)
    if (response.data && response.data.length > 0) {
      quotes.value = response.data
      apiSuccess.value = true
      // 重置索引，防止越界
      currentQuoteIndex.value = 0
    } else {
      console.warn('未获取到语录数据')
      apiSuccess.value = false
    }
  } catch (error) {
    console.error('获取语录失败:', error)
    apiSuccess.value = false
  } finally {
    loading.value = false
  }
}

// 切换语录（带点击速度限制）
const refreshQuote = async () => {
  const now = Date.now()
  const timeSinceLastClick = now - lastClickTime
  
  // 检查点击间隔
  if (timeSinceLastClick < MIN_CLICK_INTERVAL) {
    const waitSeconds = Math.ceil((MIN_CLICK_INTERVAL - timeSinceLastClick) / 1000)
    ElMessage.warning(`点击太快了，请${waitSeconds}秒后再试`)
    return
  }
  
  lastClickTime = now
  
  // 重新调用API获取新语录
  await fetchQuotes()
}

// 页面挂载时获取数据
onMounted(() => {
  fetchQuotes()
})
</script>

<style scoped>
/* 语录区域容器 */
.quotes-section {
  background: var(--card-bg);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 8px 32px var(--shadow-color);
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.quotes-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: var(--accent-color);
  opacity: 0.03;
  filter: blur(80px);
  pointer-events: none;
}

/* 标题区域 */
.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 28px;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.title-icon {
  font-size: 20px;
  color: var(--accent-color);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.title-decoration {
  width: 32px;
  height: 2px;
  background: var(--accent-color);
  opacity: 0.35;
  border-radius: 1px;
}

.refresh-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  color: var(--accent-color);
  border-color: var(--border-strong);
}

.refresh-btn:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

/* 主语录卡片 - 新设计 */
.quote-main-card {
  background: var(--card-bg);
  border-radius: var(--radius-card, 10px);
  padding: 40px 32px;
  position: relative;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
}

/* 装饰引号 */
/* 引号：用统一的线性图标，大小克制，只作提示不作装饰 */
.quote-decoration {
  position: absolute;
  color: var(--accent-color);
  opacity: 0.18;
  pointer-events: none;
}

.quote-decoration-left {
  top: 16px;
  left: 18px;
}

.quote-decoration-right {
  right: 18px;
  bottom: 14px;
  transform: rotate(180deg);
}

/* 中文内容 */
.quote-content-cn {
  position: relative;
  z-index: 1;
  margin-bottom: 16px;
}

.quote-text-cn {
  font-size: 18px;
  line-height: 1.8;
  color: var(--text-primary);
  margin: 0;
  text-align: center;
  font-weight: 500;
}

/* 英文翻译 - 小字深灰色 */
.quote-content-en {
  position: relative;
  z-index: 1;
  margin-bottom: 24px;
}

.quote-text-en {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-tertiary);
  margin: 0;
  text-align: center;
  font-style: italic;
}

/* 作者区域 */
.quote-author-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.author-divider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.divider-line {
  width: 48px;
  height: 1px;
  background: var(--border-color);
}

/* 分隔点：纯 CSS 小圆点，不用字符符号 */
.divider-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--accent-color);
  opacity: 0.5;
}

.author-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.author-name-cn {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.author-name-en {
  font-size: 12px;
  color: var(--text-tertiary);
  font-style: italic;
}

/* ===== 紧凑模式：用于全站页脚，缩小尺寸但保留图标与结构 ===== */
.quotes-section.is-compact {
  border-radius: 12px;
  padding: 10px 16px;
  box-shadow: none;
  background: transparent;
}

.quotes-section.is-compact::before {
  display: none;
}

.quotes-section.is-compact .section-header {
  margin-bottom: 6px;
}

.quotes-section.is-compact .title-wrapper {
  gap: 6px;
}

.quotes-section.is-compact .section-title {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

/* 图标尺寸不变，只去掉脉冲动画 */
.quotes-section.is-compact .title-icon {
  animation: none;
  opacity: 0.85;
}

.quotes-section.is-compact .title-decoration {
  width: 18px;
  height: 1px;
}

.quotes-section.is-compact .refresh-btn {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 11px;
  margin-left: 20px;
  box-shadow: 1px 2px 2px #eee;
}

.quotes-section.is-compact .quote-main-card {
  border-radius: 0;
  padding: 4px 12px;
  margin-bottom: 0;
  background: transparent;
  border: none;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 0 8px;
}

.quotes-section.is-compact .quote-decoration {
  font-size: 30px;
  opacity: 0.06;
}

.quotes-section.is-compact .quote-decoration-left {
  top: -4px;
  left: 0;
}

.quotes-section.is-compact .quote-decoration-right {
  bottom: -12px;
  right: 0;
}

.quotes-section.is-compact .quote-content-cn {
  margin-bottom: 0;
}

.quotes-section.is-compact .quote-text-cn {
  font-size: 12px;
  line-height: 1.6;
  font-weight: 400;
  display: inline;
}

.quotes-section.is-compact .quote-content-en {
  margin-bottom: 0;
  display: none;
}

.quotes-section.is-compact .quote-text-en {
  font-size: 10px;
  line-height: 1.4;
}

.quotes-section.is-compact .quote-author-section {
  display: inline;
  gap: 0;
}

.quotes-section.is-compact .author-divider {
  display: none;
}

.quotes-section.is-compact .author-info {
  display: inline;
  flex-direction: row;
  gap: 0;
}

.quotes-section.is-compact .author-name-cn {
  font-size: 11px;
  color: var(--text-tertiary);
}

.quotes-section.is-compact .author-name-cn::before {
  content: '— ';
}

.quotes-section.is-compact .author-name-en {
  display: none;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .quotes-section {
    padding: 24px;
  }

  .quote-main-card {
    padding: 28px 20px;
  }

  .quote-text-cn {
    font-size: 16px;
  }

  .quote-text-en {
    font-size: 12px;
  }

  .quote-decoration {
    font-size: 80px;
  }

  /* 移动端调整引号位置，避免溢出 */
  .quote-decoration-left {
    top: 5px;
    left: 10px;
  }

  .quote-decoration-right {
    bottom: 5px;
    right: 10px;
  }
}
</style>
