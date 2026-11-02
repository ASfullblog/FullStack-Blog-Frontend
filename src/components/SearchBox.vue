<template>
  <!-- 搜索框组件 -->
  <div
    ref="searchContainerRef"
    class="search-container"
    :class="{
      'search-expanded': props.fullWidth || isSearchFocused || searchQuery,
      'search-full-width': props.fullWidth
    }"
  >
    <div class="search-input-wrapper"
        @click="isSearchFocused = true"
        @mouseenter="isSearchFocused = true"
        @mouseleave="handleSearchMouseLeave">
      <AppIcon class="search-icon" name="search" :size="16" :stroke="1.7" />
      <input
        ref="searchInputRef"
        v-model="searchQuery"
        type="text"
        placeholder="搜索文章..."
        class="search-input"
        @focus="handleSearchFocus"
        @blur="handleSearchBlur"
        @input="handleSearchInput"
        @keyup.enter="performSearch"
      />
      <button v-if="searchQuery" type="button" class="clear-icon" aria-label="清空搜索" @click="clearSearch">
        <AppIcon name="close" :size="14" :stroke="2" />
      </button>
    </div>
    
    <!-- 搜索结果下拉框 -->
    <div v-if="showSearchResults && searchResults.length > 0" class="search-results" @click.stop>
      <div
        v-for="post in searchResults"
        :key="post.id"
        class="search-result-item"
        @mousedown.prevent="goToPost(post.slug)"
        @click.stop="goToPost(post.slug)"
      >
        <div class="result-content">
          <h4 class="result-title">{{ post.title }}</h4>
          <p class="result-excerpt">{{ post.excerpt?.substring(0, 100) }}...</p>
        </div>
      </div>
    </div>
    
    <!-- 无搜索结果 -->
    <div v-if="showSearchResults && searchQuery && searchResults.length === 0 && !searchLoading" class="search-results no-results">
      <p>未找到相关文章</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 搜索框组件
 * 功能：文章搜索、搜索结果显示
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from './icons/AppIcon.vue'
import { postApi } from '../api/post'
import type { Post } from '../types'

const router = useRouter()
const searchContainerRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

const props = withDefaults(defineProps<{
  fullWidth?: boolean
  autoFocus?: boolean
}>(), {
  fullWidth: false,
  autoFocus: false
})

const emit = defineEmits<{
  select: [slug: string]
}>()

// 搜索相关状态
const searchQuery = ref('')
const searchResults = ref<Post[]>([])
const isSearchFocused = ref(false)
const showSearchResults = ref(false)
const searchLoading = ref(false)
let searchTimeout: NodeJS.Timeout | null = null

/**
 * 点击外部关闭搜索
 * @param event 鼠标事件
 */
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (searchContainerRef.value && !searchContainerRef.value.contains(target)) {
    isSearchFocused.value = false
    showSearchResults.value = false
    if (!searchQuery.value) {
      searchResults.value = []
    }
  }
}

// 组件挂载时添加mousedown事件监听（使用mousedown确保在click之前执行）
onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)

  if (props.autoFocus) {
    isSearchFocused.value = true
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

/**
 * 处理搜索输入
 * 延迟300ms执行搜索，避免频繁请求
 */
const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    showSearchResults.value = false
    return
  }
  
  searchTimeout = setTimeout(async () => {
    await performSearch()
  }, 300)
}

/**
 * 执行搜索请求
 */
const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  searchLoading.value = true
  try {
    const response = await postApi.getPosts({
      keyword: searchQuery.value,
      limit: 5
    })
    searchResults.value = response.data.posts
    showSearchResults.value = true
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    searchLoading.value = false
  }
}

/**
 * 处理搜索框失焦
 */
const handleSearchFocus = () => {
  isSearchFocused.value = true
  if (searchQuery.value.trim()) {
    showSearchResults.value = true
  }
}

const handleSearchBlur = () => {
  window.setTimeout(() => {
    isSearchFocused.value = false
    showSearchResults.value = false
  }, 120)
}

/**
 * 处理搜索框鼠标离开
 */
const handleSearchMouseLeave = () => {
  // 可以在这里添加额外的逻辑
}

/**
 * 清空搜索内容
 */
const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  showSearchResults.value = false
}

/**
 * 跳转到文章详情页
 * @param slug 文章slug
 */
const goToPost = (slug: string) => {
  clearSearch()
  emit('select', slug)
  router.push(`/post/${slug}`)
}
</script>

<style scoped>
/* 搜索框样式 */
.search-container {
  position: relative;
  width: 40px;
  transition: all 0.3s ease;
}

.search-container.search-expanded {
  width: 300px;
}

.search-container.search-full-width,
.search-container.search-full-width.search-expanded {
  width: 100%;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary, #f5f5f5);
  border: 1px solid transparent;
  border-radius: var(--radius-control, 8px);
  padding: 7px 10px;
  transition: background-color 0.16s ease, border-color 0.16s ease;
  cursor: pointer;
}

.search-container.search-expanded .search-input-wrapper {
  border-color: var(--border-color, #e5e5e3);
}

.search-container.search-expanded .search-input-wrapper {
  color: var(--text-color, #1b1b1a);
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #e5e5e3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-icon {
  color: var(--text-secondary, #8a8a85);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  padding: 0;
  font-size: 14px;
  color: var(--text-color, #1b1b1a);
  width: 0;
  transition: width 0.2s ease;
}

.search-input::placeholder {
  color: var(--text-secondary, #9a9a94);
}

.search-container.search-expanded .search-input {
  width: auto;
}

.search-container.search-full-width .search-input {
  width: auto;
}

.clear-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary, #8a8a85);
  cursor: pointer;
  flex-shrink: 0;
}

.clear-icon:hover {
  color: var(--text-color, #1b1b1a);
  background: var(--bg-secondary, #f1f1ee);
}

/* 搜索结果下拉框：整块一个白底容器，向下延伸，超高滚动 */
.search-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #ececea);
  border-radius: var(--radius-card, 10px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.04);
  /* 让容器包住搜索框足宽（展开态宽度），避免窄输入框把下拉挤成一条 */
  min-width: 100%;
  max-height: min(60vh, 420px);
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* 移动端弹层里铺满容器宽度，不溢出屏幕 */
.search-container.search-full-width .search-results {
  left: 0;
  right: 0;
}

.search-results::-webkit-scrollbar {
  width: 6px;
}

.search-results::-webkit-scrollbar-thumb {
  background: var(--border-strong, #d4d4d0);
  border-radius: 3px;
}

.search-results.no-results {
  display: block;
  padding: 20px 16px;
  text-align: center;
  color: var(--text-secondary, #8a8a85);
  font-size: 13px;
}

.search-result-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color, #f0f0ef);
  transition: background-color 0.14s ease;
  user-select: none;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover,
.search-result-item:active {
  background: var(--bg-secondary, #f5f5f3);
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color, #1b1b1a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-excerpt {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary, #6b6b66);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
