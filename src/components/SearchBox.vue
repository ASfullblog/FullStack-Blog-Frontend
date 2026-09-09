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
      <el-icon class="search-icon"><Search /></el-icon>
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
      <el-icon v-if="searchQuery" class="clear-icon" @click="clearSearch"><CircleClose /></el-icon>
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
import { Search, CircleClose } from '@element-plus/icons-vue'
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
  background: #f5f5f5;
  border-radius: 20px;
  padding: 8px 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.search-container.search-expanded .search-input-wrapper {
  color: #000;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-icon {
  color: #999;
  font-size: 16px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  padding: 0 8px;
  font-size: 14px;
  width: 0;
  transition: all 0.3s ease;
}

.search-container.search-expanded .search-input {
  width: auto;
}

.search-container.search-full-width .search-input {
  width: auto;
}

.clear-icon {
  color: #999;
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.clear-icon:hover {
  color: #666;
}

/* 搜索结果下拉框 */
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
  overflow: visible;
  z-index: 1000;
}

.search-results.no-results {
  padding: 20px;
  text-align: center;
  color: #999;
}

.search-result-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s ease;
  position: relative;
  user-select: none;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
}

.search-result-item:active {
  background: linear-gradient(135deg, #667eea30 0%, #764ba230 100%);
  transform: scale(0.98);
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-excerpt {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
