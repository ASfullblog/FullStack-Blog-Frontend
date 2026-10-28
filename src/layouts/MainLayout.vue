<template>
  <!-- 主布局 - 包含导航栏和页脚 -->
  <div class="main-layout">
    <!-- 桌面端头部导航 -->
    <header
      v-if="!isMobile"
      :class="[
        'sticky top-0 left-0 right-0 z-50',
        'transition-all duration-500 ease-in-out',
        // 滚动状态：白色高斯玻璃，未滚动状态：透明
        isScrolled ? 'header-scrolled' : 'header-transparent',
        'py-4'
      ]"
    >
      <div class="container mx-auto px-4 flex items-center justify-between">
        <!-- 桌面端Logo -->
        <router-link 
          to="/" 
          class="text-2xl font-bold text-primary-600 mr-6"
        >
          FullStack-Blog
        </router-link>
        
        <!-- 搜索框组件 -->
        <SearchBox :is-showMobile="isMobile" />
        
        <!-- 导航菜单组件 -->
        <NavMenu :is-mobile="isMobile" />

        <!-- 用户操作区组件 -->
        <UserActions :is-mobile="isMobile" />
      </div>
    </header>

    <!-- 移动端底部导航栏 -->
    <nav
      v-if="isMobile"
      class="fixed bottom-0 left-0 right-0 z-50"
    >
      <!-- 简约底部导航 -->
      <div class="bg-[var(--card-bg)] border-t border-[var(--border-color)] py-2 px-2">
        <div class="flex items-center justify-around">
          <!-- 首页 -->
          <router-link to="/" class="flex flex-col items-center py-1 px-3 min-w-[3rem]" :class="{'text-primary-600': route.path === '/', 'text-gray-500': route.path !== '/'}">
            <el-icon :size="22"><HomeFilled /></el-icon>
            <span class="text-[10px] mt-1 font-medium">首页</span>
          </router-link>
          
          <!-- 归档 -->
          <router-link to="/archive" class="flex flex-col items-center py-1 px-3 min-w-[3rem]" :class="{'text-primary-600': route.path === '/archive', 'text-gray-500': route.path !== '/archive'}">
            <el-icon :size="22"><Folder /></el-icon>
            <span class="text-[10px] mt-1 font-medium">归档</span>
          </router-link>
          
          <!-- 分类 -->
          <router-link to="/categories" class="flex flex-col items-center py-1 px-3 min-w-[3rem]" :class="{'text-primary-600': route.path === '/categories', 'text-gray-500': route.path !== '/categories'}">
            <el-icon :size="22"><Grid /></el-icon>
            <span class="text-[10px] mt-1 font-medium">分类</span>
          </router-link>
          
          <!-- 搜索 -->
          <button @click="toggleMobileSearch" class="flex flex-col items-center py-1 px-3 min-w-[3rem] text-gray-500">
            <el-icon :size="22"><Search /></el-icon>
            <span class="text-[10px] mt-1 font-medium">搜索</span>
          </button>
          
          <!-- 我的 -->
          <router-link v-if="userStore.isLoggedIn" to="/about" class="flex flex-col items-center py-1 px-3 min-w-[3rem]" :class="{'text-primary-600': route.path === '/about', 'text-gray-500': route.path !== '/about'}">
            <img :src="userAvatar" class="w-5 h-5 rounded-full" />
            <span class="text-[10px] mt-1 font-medium">关于我</span>
          </router-link>
          <router-link v-else to="/login" class="flex flex-col items-center py-1 px-3 min-w-[3rem]" :class="{'text-primary-600': route.path === '/login', 'text-gray-500': route.path !== '/login'}">
            <el-icon :size="22"><User /></el-icon>
            <span class="text-[10px] mt-1 font-medium">登录</span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- 移动端搜索弹窗 -->
    <div v-if="showMobileSearch && isMobile" class="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20" @click="showMobileSearch = false">
      <div class="bg-white rounded-lg p-4 w-11/12 max-w-md" @click.stop>
        <SearchBox :full-width="true" :auto-focus="true" @select="closeMobileSearch" />
      </div>
    </div>

    <!-- 主内容区 -->
    <main class="main-content" :class="{'pt-3': !isMobile, 'pb-10': isMobile}">
      <router-view />
    </main>

    <!-- 页脚 -->
    <footer
      :class="[
        'footer',
        isScrolled ? 'footer-scrolled' : 'footer-transparent'
      ]"
    >
      <div class="container mx-auto px-4 footer-text">
        <p>© 2026 FullStack-Blog. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
/**
 * 主布局组件
 * 功能：包含导航栏、搜索框、页脚的完整布局
 * 用于：首页、文章详情、归档、分类等普通页面
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, Folder, Grid, Search, User } from '@element-plus/icons-vue'
import SearchBox from '../components/SearchBox.vue'
import NavMenu from '../components/NavMenu.vue'
import UserActions from '../components/UserActions.vue'
import { useUserStore } from '../stores/userStore'
import { resolveAvatar } from '../utils/avatar'

const route = useRoute()
const userStore = useUserStore()

// 滚动状态
const isScrolled = ref(false)
// 移动端状态
const isMobile = ref(window.innerWidth <= 745)
// 移动端搜索弹窗状态
const showMobileSearch = ref(false)
// 移动端搜索弹窗中的搜索框是否显示
const isMobileSearchBoxShow = ref(false)

/**
 * 用户头像
 * admin（站长）固定使用本地头像，其他用户保持原逻辑（自定义头像 -> 按 ID 取默认头像）
 * 统一走 utils/avatar，避免每个组件各维护一份头像池
 */
const userAvatar = computed(() => resolveAvatar(userStore.user))

/**
 * 处理滚动事件
 */
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

/**
 * 切换移动端搜索弹窗显示/隐藏
 */
const toggleMobileSearch = () => {
  showMobileSearch.value = !showMobileSearch.value
  isMobileSearchBoxShow.value = !isMobileSearchBoxShow.value
}

const closeMobileSearch = () => {
  showMobileSearch.value = false
  isMobileSearchBoxShow.value = false
}

/**
 * 处理窗口 resize 事件
 */
const handleResize = () => {
  isMobile.value = window.innerWidth <= 745
}

// 组件挂载时添加事件监听
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', handleResize)
  // 初始检查
  handleScroll()
  handleResize()
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* 主布局样式 - 使用CSS变量 */
.main-layout {
  min-height: 100vh;
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease;
}

/* 头部导航样式 */
.header-scrolled {
  background-color: var(--card-bg);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 3px var(--shadow-color);
}

.header-transparent {
  background-color: transparent;
  backdrop-filter: none;
  box-shadow: none;
}

/* 主内容区样式 */
.main-content {
  width: 100%;
  max-width: 64rem;
  margin-left: auto;
  margin-right: auto;
  flex: 1;
}

/* 页脚样式 */
.footer {
  text-align: center;
  padding: 1rem 0;
  transition: all 0.3s ease;
}

.footer-scrolled {
  background-color: var(--card-bg);
  backdrop-filter: blur(12px);
}

.footer-transparent {
  background-color: transparent;
}

.footer-text {
  color: var(--text-tertiary);
  font-size: 0.875rem;
}
</style>
