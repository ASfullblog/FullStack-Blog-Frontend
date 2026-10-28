<template>
  <!-- 导航菜单组件 -->
  <nav :class="[
    'flex items-center',
    isMobile ? 'flex-1 justify-center' : 'flex-1 justify-center'
  ]">
    <ul :class="[
      'flex items-center',
      isMobile ? 'space-x-4' : 'space-x-6'
    ]">
      <li>
        <router-link to="/" class="nav-link" :class="{ active: isActive('/') }">
          首页
        </router-link>
      </li>
      <li>
        <router-link to="/archive" class="nav-link" :class="{ active: isActive('/archive') }">
          归档
        </router-link>
      </li>
      <li>
        <router-link to="/categories" class="nav-link" :class="{ active: isActive('/categories') }">
          分类
        </router-link>
      </li>
      <li>
        <router-link to="/about" class="nav-link" :class="{ active: isActive('/about') }">
          关于我
        </router-link>
      </li>
      <li>
        <router-link to="/stats" class="nav-link" :class="{ active: isActive('/stats') }">
          数据统计
        </router-link>
      </li>
      <li>
        <router-link to="/games" class="nav-link" :class="{ active: isActive('/games') }">
          小游戏
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
/**
 * 导航菜单组件
 * 功能：显示主导航链接，高亮当前页面
 */
import { useRoute } from 'vue-router'

// 接收props
const props = defineProps<{
  isMobile?: boolean
}>()

const isMobile = props.isMobile || false
const route = useRoute()

/**
 * 判断当前路由是否激活
 * @param path 路由路径
 * @returns 是否激活
 */
const isActive = (path: string): boolean => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<style scoped>
.nav-link {
  color: #4b5563;
  transition: all 0.3s ease;
  position: relative;
  padding: 4px 0;
  font-size: 14px;
}

/* 移动端样式 */
@media (max-width: 745px) {
  .nav-link {
    font-size: 12px;
  }
}

.nav-link:hover {
  color: #4f46e5;
}

.nav-link.active {
  color: #4f46e5;
  font-weight: 600;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;
}

/* 移动端移除下划线效果 */
@media (max-width: 745px) {
  .nav-link::after {
    display: none;
  }
}
</style>
