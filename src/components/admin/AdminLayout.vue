<template>
  <div class="admin-layout" :class="{ 'is-dark': isDark }">
    <!-- 移动端：侧栏改为抽屉，遮罩点击关闭 -->
    <Transition name="mask-fade">
      <div
        v-if="isMobile && sidebarOpen"
        class="sidebar-mask"
        aria-hidden="true"
        @click="sidebarOpen = false"
      ></div>
    </Transition>

    <aside class="sidebar" :class="{ 'is-open': sidebarOpen }">
      <div class="sidebar-header">
        <h1 class="sidebar-brand">管理后台</h1>
        <button
          v-if="isMobile"
          type="button"
          class="sidebar-close"
          aria-label="关闭菜单"
          @click="sidebarOpen = false"
        >
          <AppIcon name="close" :size="18" :stroke="2" />
        </button>
      </div>

      <nav class="sidebar-nav">
        <ul>
          <li v-for="item in navItems" :key="item.to">
            <router-link :to="item.to" class="nav-item" active-class="active" @click="closeOnMobile">
              <AppIcon class="nav-icon" :name="item.icon" :size="18" :stroke="1.7" />
              <span class="nav-label">{{ item.label }}</span>
              <span v-if="item.to === '/admin/comments' && pendingCommentCount > 0" class="nav-badge">
                {{ pendingCommentCount > 99 ? '99+' : pendingCommentCount }}
              </span>
            </router-link>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <button type="button" class="user-info" @click="showUserMenu = !showUserMenu">
          <img v-if="user?.username" :src="resolveAvatar(user)" :alt="user.username" class="user-avatar" />
          <span v-else class="user-avatar-placeholder">{{ user?.username?.charAt(0) || 'U' }}</span>
          <span class="user-name">{{ user?.username || '管理员' }}</span>
          <AppIcon class="arrow-icon" name="chevron-up" :size="14" :stroke="2" />
        </button>

        <div v-if="showUserMenu" class="user-menu">
          <button type="button" class="menu-item" @click="goToFrontend">
            <AppIcon name="external" :size="16" :stroke="1.7" />
            <span>返回前台</span>
          </button>
          <button type="button" class="menu-item" @click="handleLogout">
            <AppIcon name="logout" :size="16" :stroke="1.7" />
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <header class="main-header">
        <div class="header-left">
          <button
            v-if="isMobile"
            type="button"
            class="toggle-sidebar"
            aria-label="打开菜单"
            @click="sidebarOpen = true"
          >
            <AppIcon name="menu" :size="20" :stroke="1.8" />
          </button>
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>

        <!-- 移动端把「返回前台 / 退出」放进顶栏，不必再开侧栏 -->
        <div v-if="isMobile" class="header-right">
          <router-link to="/" class="header-link" aria-label="返回前台">
            <AppIcon name="external" :size="16" :stroke="1.7" />
          </router-link>
          <button type="button" class="header-link" aria-label="退出登录" @click="handleLogout">
            <AppIcon name="logout" :size="16" :stroke="1.7" />
          </button>
        </div>
      </header>

      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 管理后台布局
 * - 桌面：固定侧栏（232px），内容区独立滚动
 * - 手机 / 平板：侧栏收成抽屉，顶栏汉堡按钮打开，遮罩或选中即关闭
 * - 图标全部走 AppIcon；侧栏保持深色（后台惯例），强调色统一一个灰蓝，不做霓虹渐变
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../icons/AppIcon.vue'
import request from '../../utils/request'
import { resolveAvatar } from '../../utils/avatar'
import { useThemeStore } from '../../stores/themeStore'
import { useUserStore } from '../../stores/userStore'

const showUserMenu = ref(false)
const pendingCommentCount = ref(0)
const sidebarOpen = ref(false)
const isMobile = ref(window.innerWidth <= 1024)

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const themeStore = useThemeStore()

/** 天气主题按昼夜决定后台明暗：白天走亮色工作区，夜间跟暗色一致 */
const isDark = computed(() => {
  const t = themeStore.currentTheme
  if (t === 'dark' || t === 'dusk') return true
  if (t === 'weather') return !!themeStore.weather && !themeStore.weather.isDay
  return false
})

const user = computed(() => userStore.currentUser)

const navItems = [
  { to: '/admin/dashboard', label: '仪表盘', icon: 'chart' },
  { to: '/admin/posts', label: '文章管理', icon: 'document' },
  { to: '/admin/categories', label: '分类管理', icon: 'folder' },
  { to: '/admin/games', label: '小游戏管理', icon: 'grid' },
  { to: '/admin/comments', label: '评论审核', icon: 'message' },
  { to: '/admin/users', label: '用户管理', icon: 'users' },
  { to: '/admin/settings', label: '系统设置', icon: 'settings' },
  { to: '/admin/announcement', label: '发布公告', icon: 'bell' }
]

const titleMap: Record<string, string> = {
  '/admin/dashboard': '仪表盘',
  '/admin/posts': '文章管理',
  '/admin/categories': '分类管理',
  '/admin/games': '小游戏管理',
  '/admin/comments': '评论审核',
  '/admin/users': '用户管理',
  '/admin/settings': '系统设置',
  '/admin/announcement': '发布公告'
}

const pageTitle = computed(() => titleMap[route.path] || '管理后台')

const fetchPendingCommentCount = async () => {
  try {
    const response = await request.get('/comments/pending')
    pendingCommentCount.value = Array.isArray(response.data) ? response.data.length : 0
  } catch (error) {
    console.error('fetchPendingCommentCount failed:', error)
  }
}

let pollInterval: number | null = null

const startPolling = () => {
  fetchPendingCommentCount()
  pollInterval = window.setInterval(fetchPendingCommentCount, 60000)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

/** 移动端选中菜单后收起抽屉 */
const closeOnMobile = () => {
  if (isMobile.value) sidebarOpen.value = false
}

const goToFrontend = () => {
  showUserMenu.value = false
  router.push('/')
}

const handleLogout = () => {
  showUserMenu.value = false
  userStore.logout()
  router.push('/')
}

const handleResize = () => {
  isMobile.value = window.innerWidth <= 1024
  if (!isMobile.value) sidebarOpen.value = false
}

// 路由变化时收起抽屉与用户菜单
watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
    showUserMenu.value = false
  }
)

onMounted(() => {
  startPolling()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  stopPolling()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.admin-layout {
  /* 后台是工作区，不是阅读页：用自成一体的中性灰阶，不吃前台主题变量，
     否则天气主题的透明卡片 / 背景动效会直接透到表格里 */
  --adm-bg: #f4f5f7;
  --adm-surface: #ffffff;
  --adm-surface-2: #fafbfc;
  --adm-border: #e4e7eb;
  --adm-text: #1f2328;
  --adm-text-2: #5c636b;
  --adm-text-3: #8b929a;

  position: relative;
  z-index: 20;
  display: flex;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background-color: var(--adm-bg);
  color: var(--adm-text);
}

/* 暗色后台：整体压暗一档 */
.admin-layout.is-dark {
  --adm-bg: #14161a;
  --adm-surface: #1b1e23;
  --adm-surface-2: #20242a;
  --adm-border: #2b3038;
  --adm-text: #e8e9eb;
  --adm-text-2: #a6adb6;
  --adm-text-3: #7c848e;
}



/* ---------- 侧栏 ---------- */
.sidebar {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 232px;
  background: #171a20;
  color: #c8ccd2;
  transition: transform 0.24s ease;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 18px 14px;
  border-bottom: 1px solid #262b33;
}

.sidebar-brand {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #f2f3f5;
  letter-spacing: 0.02em;
}

.sidebar-close {
  display: inline-flex;
  padding: 4px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #a5abb4;
  cursor: pointer;
}

.sidebar-close:hover {
  background: #262b33;
  color: #fff;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.sidebar-nav ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 1px 10px;
  padding: 10px 12px;
  border-radius: 7px;
  color: #c8ccd2;
  font-size: 14px;
  text-decoration: none;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.nav-item:hover {
  background: #23272f;
  color: #f2f3f5;
}

/* 选中态：淡底 + 左侧短竖条，不用整条渐变 */
.nav-item.active {
  position: relative;
  background: #262b34;
  color: #ffffff;
  font-weight: 500;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 50%;
  width: 2px;
  height: 16px;
  border-radius: 1px;
  background: #6e9ec9;
  transform: translateY(-50%);
}

.nav-icon {
  flex: none;
  color: #8d949e;
}

.nav-item:hover .nav-icon,
.nav-item.active .nav-icon {
  color: #cfe1f0;
}

.nav-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-badge {
  flex: none;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #b4453a;
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}

.sidebar-footer {
  position: relative;
  padding: 10px;
  border-top: 1px solid #262b33;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #c8ccd2;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.user-info:hover {
  background: #23272f;
}

.user-avatar,
.user-avatar-placeholder {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2f3a47;
  color: #dbe4ee;
  font-weight: 600;
}

.user-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow-icon {
  color: #8d949e;
}

.user-menu {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: calc(100% - 2px);
  z-index: 10;
  padding: 4px;
  border: 1px solid #2b313a;
  border-radius: 8px;
  background: #1d2127;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #d3d7dd;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.menu-item:hover {
  background: #262b33;
  color: #fff;
}

/* ---------- 主区域 ---------- */
.main-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.main-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 52px;
  padding: 0 20px;
  border-bottom: 1px solid var(--adm-border);
  background: var(--adm-surface);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary, #5c5c58);
  cursor: pointer;
}

.header-link:hover {
  background: var(--bg-secondary, #f1f1ee);
  color: var(--text-color, #1b1b1a);
}

.toggle-sidebar {
  display: inline-flex;
  padding: 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-color, #1b1b1a);
  cursor: pointer;
}

.toggle-sidebar:hover {
  background: var(--bg-secondary, #f1f1ee);
}

.page-title {
  margin: 0;
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  color: var(--adm-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 20px;
  background: var(--adm-bg);
  color: var(--adm-text);
}

/* ---------- 移动端 / 平板：抽屉式侧栏 ---------- */
.sidebar-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.45);
}

.mask-fade-enter-active,
.mask-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mask-fade-enter-from,
.mask-fade-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 50;
    width: 260px;
    max-width: 82vw;
    transform: translateX(-100%);
    box-shadow: none;
  }

  .sidebar.is-open {
    transform: translateX(0);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.06);
  }

  .main-header {
    padding: 0 12px;
  }

  .content-wrapper {
    padding: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar {
    transition: none;
  }
}
</style>
