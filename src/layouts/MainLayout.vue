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
      class="fixed bottom-0 left-0 right-0 z-50 mobile-tabbar"
    >
      <div class="tabbar-inner">
        <router-link to="/" class="tab-item" :class="{ 'is-active': route.path === '/' }">
          <AppIcon name="home" :size="21" :stroke="1.7" />
          <span class="tab-label">首页</span>
        </router-link>

        <router-link to="/archive" class="tab-item" :class="{ 'is-active': route.path === '/archive' }">
          <AppIcon name="folder" :size="21" :stroke="1.7" />
          <span class="tab-label">归档</span>
        </router-link>

        <router-link to="/categories" class="tab-item" :class="{ 'is-active': route.path === '/categories' }">
          <AppIcon name="grid" :size="21" :stroke="1.7" />
          <span class="tab-label">分类</span>
        </router-link>

        <button type="button" class="tab-item" :class="{ 'is-active': showMobileSearch }" @click="toggleMobileSearch">
          <AppIcon name="search" :size="21" :stroke="1.7" />
          <span class="tab-label">搜索</span>
        </button>

        <router-link v-if="userStore.isLoggedIn" to="/about" class="tab-item" :class="{ 'is-active': route.path === '/about' }">
          <img :src="userAvatar" class="tab-avatar" alt="" />
          <span class="tab-label">关于我</span>
        </router-link>
        <router-link v-else to="/login" class="tab-item" :class="{ 'is-active': route.path === '/login' }">
          <AppIcon name="user" :size="21" :stroke="1.7" />
          <span class="tab-label">登录</span>
        </router-link>
      </div>
    </nav>

    <!-- 移动端搜索弹窗 -->
    <div v-if="showMobileSearch && isMobile" class="mobile-search-layer" @click="showMobileSearch = false">
      <div class="mobile-search-card" @click.stop>
        <SearchBox :full-width="true" :auto-focus="true" @select="closeMobileSearch" />
      </div>
    </div>

    <!-- 主内容区 -->
    <main class="main-content" :class="{'pt-3': !isMobile}">
      <router-view />
    </main>

    <!-- 页脚 -->
    <footer
      :class="[
        'footer',
        isScrolled ? 'footer-scrolled' : 'footer-transparent'
      ]"
    >
      <div class="container">
        <!-- 摘抄语录（紧凑版，全站页脚可见；图标与文案结构保持不变） -->
        <QuotesSection compact class="footer-quotes" />
        <p class="footer-text">© 2026 FullStack-Blog. All rights reserved.</p>
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
import AppIcon from '../components/icons/AppIcon.vue'
import SearchBox from '../components/SearchBox.vue'
import NavMenu from '../components/NavMenu.vue'
import UserActions from '../components/UserActions.vue'
import QuotesSection from '../components/QuotesSection.vue'
import { useUserStore } from '../stores/userStore'
import { resolveAvatar } from '../utils/avatar'

const route = useRoute()
const userStore = useUserStore()

// 滚动状态
const isScrolled = ref(false)
// 移动端状态（断点统一 768px，与 Tailwind md 断点及全站 @media 一致）
const isMobile = ref(window.innerWidth <= 768)
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
  isMobile.value = window.innerWidth <= 768
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
  position: relative;
  z-index: 1;
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
  margin: 0.5rem 0;
  transition: all 0.3s ease;
}

/* 页脚容器：与主内容区同宽，上下留一点呼吸 */
.container {
  max-width: 64rem;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

/* 页脚里的摘抄语录：限宽居中，作为页脚注脚出现，不喧宾夺主 */
.footer-quotes {
  max-width: 640px;
  text-align: center;
}

.footer-scrolled {
  background-color: var(--card-bg);
  backdrop-filter: blur(12px);
}

.footer-transparent {
  background-color: transparent;
}

.footer-text {
  text-align: right;
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

/* ---------- 移动端底部导航 ---------- */
.mobile-tabbar {
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.tabbar-inner {
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  padding: 6px 4px 7px;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  min-width: 0;
  padding: 2px 0;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.16s ease;
  -webkit-tap-highlight-color: transparent;
}

.tab-item.is-active {
  color: var(--accent-color);
}

.tab-label {
  font-size: 10px;
  line-height: 1.2;
  font-weight: 500;
  white-space: nowrap;
}

.tab-avatar {
  width: 21px;
  height: 21px;
  border-radius: 50%;
  object-fit: cover;
}

/* ---------- 移动端搜索弹层 ---------- */
.mobile-search-layer {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12px 12px 0;
  background: rgba(0, 0, 0, 0.42);
}

.mobile-search-card {
  width: 100%;
  max-width: 32rem;
  /* 卡片本身不裁剪，结果列表在自己的容器里滚动，白底始终包住结果 */
  padding: 12px;
  border-radius: var(--radius-card, 10px);
  background: var(--card-bg);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
}

/* 移动端：底栏是 fixed，给页面留出足够的下边距，footer 不再被压住 */
@media (max-width: 768px) {
  .main-layout {
    /* 底栏实际高度 + 安全区，再留 12px 呼吸 */
    padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px) + 12px);
  }

  .footer {
    margin-bottom: 0;
  }

  .footer-text {
    text-align: center;
    padding-bottom: 0.25rem;
  }
}
</style>
