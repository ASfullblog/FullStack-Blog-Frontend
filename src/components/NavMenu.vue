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
/* 导航链接：跟随主题的文字色，激活用一条短下划线 + 加粗，不加渐变 */
.nav-link {
  position: relative;
  display: inline-block;
  padding: 6px 0;
  font-size: 14px;
  color: var(--text-secondary, #5c5c58);
  transition: color 0.16s ease;
}

.nav-link:hover {
  color: var(--text-color, #1b1b1a);
}

.nav-link.active {
  color: var(--text-color, #1b1b1a);
  font-weight: 600;
}

.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 1px;
  background: var(--accent-color, #2f5d8f);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.18s ease;
}

.nav-link:hover::after {
  transform: scaleX(0.4);
  opacity: 0.5;
}

.nav-link.active::after {
  transform: scaleX(1);
  opacity: 1;
}

@media (max-width: 768px) {
  .nav-link {
    font-size: 12px;
  }

  .nav-link::after {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-link,
  .nav-link::after {
    transition: none;
  }
}
</style>
