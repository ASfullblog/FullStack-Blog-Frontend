<template>
  <!-- 应用根组件 - 仅作为路由出口 -->
  <!-- 天气实景背景：仅在「天气」主题下挂载 -->
  <WeatherBackground v-if="isWeatherTheme" />
  <router-view />
  <!-- 全局工具栏组件 -->
  <Toolbar />
  <!-- 主题切换器 - 固定在页面右下角，登录/注册页面不显示 -->
  <ThemeSwitcher v-if="!isAuthPage" />
  <!-- 全局气泡通知组件 -->
  <ToastNotification ref="toastRef" />
</template>

<script setup lang="ts">
/**
 * 应用根组件
 * 功能：仅作为路由出口，具体布局由各页面自己决定
 * 布局说明：
 * - MainLayout: 主布局，包含导航栏、搜索框、页脚（用于首页、文章详情等）
 * - BlankLayout: 空白布局，无任何导航元素（用于登录、注册、后台管理等）
 */
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import Toolbar from './components/Toolbar.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'
import WeatherBackground from './components/weather/WeatherBackground.vue'
import ToastNotification from './components/ToastNotification.vue'
import { useThemeStore } from './stores/themeStore'
import { startWeatherService } from './services/weather'
import { setToastRef } from './utils/toast'

const themeStore = useThemeStore()
const route = useRoute()
const toastRef = ref<InstanceType<typeof ToastNotification> | null>(null)

/**
 * 判断当前是否为认证页面（登录/注册）
 * 用于控制主题切换器等全局组件的显示
 */
const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/register'
})

/** 天气主题才挂载背景画布，其他主题零成本 */
const isWeatherTheme = computed(() => themeStore.currentTheme === 'weather')

// 主题立刻生效（避免闪白），天气快照同步给一份，切到天气主题时立即可见
themeStore.initTheme()
startWeatherService()

onMounted(() => {
  // 设置全局 toast 引用
  if (toastRef.value) {
    setToastRef(toastRef.value)
  }
})
</script>
