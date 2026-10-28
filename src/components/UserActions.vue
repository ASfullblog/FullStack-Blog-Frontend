<template>
  <!-- 用户操作区组件 -->
  <div :class="[
    'flex items-center',
    isMobile ? 'space-x-2' : 'space-x-4'
  ]">
    <!-- 通知铃铛（仅登录用户可见） -->
    <NotificationBell v-if="userStore.isLoggedIn" />

    <!-- 后台管理链接（仅管理员可见） -->
    <router-link
      v-if="userStore.isLoggedIn && userStore.user?.role === 'admin'"
      to="/admin"
      class="admin-link"
      :class="{'text-xs': isMobile}"
    >
      <el-icon :size="isMobile ? 16 : 18"><Setting /></el-icon>
      <span v-if="!isMobile">后台</span>
    </router-link>

    <!-- 游客状态 -->
    <router-link v-if="!userStore.isLoggedIn" to="/login" class="guest-link">
      <span v-if="!isMobile">登录</span>
      <el-icon v-else :size="16"><User /></el-icon>
    </router-link>

    <!-- 用户信息（已登录） -->
    <div v-else class="relative">
      <div class="user-avatar-container" @click="toggleUserMenu">
        <img
          :src="userAvatar"
          alt="用户头像"
          class="user-avatar"
          :class="{'w-8 h-8': isMobile, 'w-10 h-10': !isMobile}"
        >
      </div>
      <!-- 用户下拉菜单 - 带过渡动画 -->
      <Transition name="menu-popover">
        <div v-if="showUserMenu" class="user-menu" :class="{'right-0': !isMobile, 'bottom-full mb-2 right-0': isMobile}">
          <!-- <router-link to="/profile" class="menu-item" @click="closeMenu">
            个人信息
          </router-link> -->
          <button @click="handleLogout" class="menu-item logout-item">
            退出
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 用户操作区组件
 * 功能：显示登录/头像、后台管理入口、用户菜单
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Setting, User } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/userStore'
import { useThemeStore } from '../stores/themeStore'
import { resolveAvatar } from '../utils/avatar'
import NotificationBell from './NotificationBell.vue'

// 接收props
const props = defineProps<{
  isMobile?: boolean
}>()

const isMobile = props.isMobile || false
const userStore = useUserStore()
const themeStore = useThemeStore()
const router = useRouter()

// 下拉菜单状态
const showUserMenu = ref(false)

/**
 * 切换用户菜单显示/隐藏
 */
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

/**
 * 关闭用户菜单
 */
const closeMenu = () => {
  showUserMenu.value = false
}

/**
 * 点击外部关闭菜单
 * @param event 鼠标事件
 */
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-avatar-container') && !target.closest('.user-menu')) {
    showUserMenu.value = false
  }
}

// 组件挂载时添加点击事件监听
onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

/**
 * 用户头像
 * admin（站长）固定使用本地头像，其他用户保持原逻辑：有自定义头像用自定义，否则按 ID 取固定默认头像
 * 统一走 utils/avatar，避免每个组件各写一份头像池
 */
const userAvatar = computed(() => resolveAvatar(userStore.user))

/**
 * 处理退出登录
 */
const handleLogout = () => {
  userStore.logout()
  // 更新主题状态（锁定个性情感模式）
  themeStore.setLoginStatus(false)
  ElMessage.success('退出登录成功')
  router.push('/')
  showUserMenu.value = false
}
</script>

<style scoped>
/* 后台管理链接样式 */
.admin-link {
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 12px;
}

.admin-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  color: white;
}

/* 游客链接样式 */
.guest-link {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 12px;
  display: flex;
  align-items: center;
}

.guest-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  color: white;
}

/* 用户头像容器 */
.user-avatar-container {
  position: relative;
  cursor: pointer;
}

/* 用户头像 */
.user-avatar {
  border-radius: 50%;
  border: 2px solid #667eea;
  transition: all 0.3s ease;
}

.user-avatar-container:hover .user-avatar {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* 用户下拉菜单 */
.user-menu {
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 120px;
  z-index: 1000;
  overflow: hidden;
}

/* 菜单项目 */
.menu-item {
  display: block;
  padding: 10px 16px;
  color: #333;
  text-decoration: none;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background: #f5f5f5;
  color: #667eea;
}

/* 退出按钮 */
.logout-item {
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.logout-item:hover {
  color: #ff4d4f;
  background: #fff2f0;
}

/* 移动端样式 */
@media (max-width: 745px) {
  .admin-link,
  .guest-link {
    padding: 4px 8px;
  }
}

/* 菜单气泡框动画 - 从小变大出现，从大变小消失 */
.menu-popover-enter-active {
  animation: menu-popover-in 0.3s ease-out;
  transform-origin: top right;
}

.menu-popover-leave-active {
  animation: menu-popover-out 0.25s ease-in;
  transform-origin: top right;
}

/* 出现动画 - 从小变大 */
@keyframes menu-popover-in {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 消失动画 - 从大变小回缩 */
@keyframes menu-popover-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
}
</style>
