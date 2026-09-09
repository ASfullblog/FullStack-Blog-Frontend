<template>
  <!-- 工具栏组件 - 圆形悬浮按钮固定在页面右下角 -->
  <button
    class="back-to-top"
    :class="{ 'is-visible': showScrollTop }"
    @click="scrollToTop"
    aria-label="回到顶部"
    title="回到顶部"
  >
    <el-icon :size="20"><ArrowUp /></el-icon>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowUp } from '@element-plus/icons-vue'

// 显示回到顶部按钮
const showScrollTop = ref(false)

// 滚动到顶部
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 处理滚动事件
const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  // 滚动超过200px显示回到顶部按钮
  showScrollTop.value = scrollTop > 200
}

// 组件挂载时添加滚动监听
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  // 初始检查
  handleScroll()
})

// 组件卸载时移除滚动监听
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* 回到顶部按钮 - 简约设计 */
.back-to-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.9);
  transition: all 0.3s ease;
  pointer-events: none;
}

/* 显示状态 */
.back-to-top.is-visible {
  opacity: 1;
  visibility: visible;
  transform: scale(1);
  pointer-events: auto;
}

/* 悬停效果 */
.back-to-top:hover {
  background: var(--bg-secondary);
}

/* 点击效果 */
.back-to-top:active {
  transform: scale(0.95);
}

/* 响应式 - 移动端适配底部导航栏 */
@media (max-width: 768px) {
  .back-to-top {
    right: 16px;
    /* 避开底部导航栏 (约 50px) + 间距 */
    bottom: 70px;
    width: 36px;
    height: 36px;
  }
}
</style>
