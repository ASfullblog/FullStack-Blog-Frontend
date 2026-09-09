<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="text-xl font-bold text-white">管理后台</h1>
      </div>

      <nav class="sidebar-nav">
        <ul>
          <li>
            <router-link to="/admin/dashboard" class="nav-item" active-class="active">
              <el-icon class="nav-icon"><Management /></el-icon>
              <span>仪表盘</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/posts" class="nav-item" active-class="active">
              <el-icon class="nav-icon"><Document /></el-icon>
              <span>文章管理</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/categories" class="nav-item" active-class="active">
              <el-icon class="nav-icon"><Collection /></el-icon>
              <span>分类管理</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/games" class="nav-item" active-class="active">
              <el-icon class="nav-icon"><Grid /></el-icon>
              <span>小游戏管理</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/comments" class="nav-item" active-class="active">
              <el-icon class="nav-icon"><ChatDotRound /></el-icon>
              <span>评论审核</span>
              <el-badge v-if="pendingCommentCount > 0" :value="pendingCommentCount" class="comment-badge" />
            </router-link>
          </li>
          <li>
            <router-link to="/admin/settings" class="nav-item" active-class="active">
              <el-icon class="nav-icon"><Setting /></el-icon>
              <span>系统设置</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/announcement" class="nav-item" active-class="active">
              <el-icon class="nav-icon"><Notification /></el-icon>
              <span>发布公告</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info" @click="showUserMenu = !showUserMenu">
          <img v-if="user?.avatar" :src="user.avatar" :alt="user.username" class="user-avatar">
          <div v-else class="user-avatar-placeholder">
            {{ user?.username?.charAt(0) || 'U' }}
          </div>
          <span class="user-name">{{ user?.username || '管理员' }}</span>
          <el-icon class="arrow-icon"><ArrowDown /></el-icon>
        </div>

        <div v-if="showUserMenu" class="user-menu">
          <div class="menu-item" @click="goToFrontend">
            <el-icon><TopLeft /></el-icon>
            <span>返回前台</span>
          </div>
          <div class="menu-item" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出登录</span>
          </div>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <header class="main-header">
        <div class="header-left">
          <button class="toggle-sidebar" @click="toggleSidebar">
            <el-icon><Menu /></el-icon>
          </button>
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
      </header>

      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowDown,
  ChatDotRound,
  Collection,
  Document,
  Grid,
  Management,
  Menu,
  Notification,
  Setting,
  SwitchButton,
  TopLeft
} from '@element-plus/icons-vue'
import request from '../../utils/request'
import { useThemeStore } from '../../stores/themeStore'
import { useUserStore } from '../../stores/userStore'

const isSidebarCollapsed = ref(false)
const showUserMenu = ref(false)
const pendingCommentCount = ref(0)

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const user = computed(() => userStore.currentUser)

const titleMap: Record<string, string> = {
  '/admin/dashboard': '仪表盘',
  '/admin/posts': '文章管理',
  '/admin/categories': '分类管理',
  '/admin/games': '小游戏管理',
  '/admin/comments': '评论审核',
  '/admin/settings': '系统设置',
  '/admin/announcement': '发布公告'
}

const pageTitle = computed(() => titleMap[router.currentRoute.value.path] || '管理后台')

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

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const goToFrontend = () => {
  showUserMenu.value = false
  router.push('/')
}

const handleLogout = () => {
  userStore.logout()
  themeStore.setLoginStatus(false)
  router.push('/')
}

onMounted(() => {
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  background-color: var(--bg-primary, #f5f7fa);
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
  color: #e5e7eb;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #374151;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  margin: 0.25rem 0.75rem;
  color: #e5e7eb;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background-color: #374151;
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(90deg, #3b82f6 0%, #6366f1 100%);
  color: #fff;
}

.nav-icon {
  font-size: 1.2rem;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #374151;
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.user-info:hover {
  background-color: #374151;
}

.user-avatar,
.user-avatar-placeholder {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
}

.user-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: #fff;
  font-weight: 700;
}

.user-name {
  flex: 1;
}

.user-menu {
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: calc(100% - 0.25rem);
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 0.75rem;
  overflow: hidden;
  z-index: 10;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  cursor: pointer;
}

.menu-item:hover {
  background: #374151;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-header {
  height: 3.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  background: var(--bg-secondary, #fff);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toggle-sidebar {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1.25rem;
}

.page-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}
</style>
