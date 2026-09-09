<template>
  <!-- 主题切换器组件 - 画板形式，hover时半围绕展开 -->
  <div class="theme-palette-container" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <!-- 画板主体 - 始终显示 -->
    <div class="palette-main" :class="{ 'expanded': isExpanded }">
      <span class="palette-icon">🎨</span>
    </div>

    <!-- 主题选项 - 半围绕画板展开 -->
    <div class="palette-options">
      <button
        v-for="(theme, index) in themeStore.availableThemes"
        :key="theme.value"
        class="palette-option"
        :class="{
          'active': themeStore.currentTheme === theme.value,
          'locked': !theme.unlocked,
          'show': isExpanded
        }"
        :style="getOptionStyle(index)"
        @click="selectTheme(theme.value, theme.unlocked)"
        :title="theme.label + (theme.unlocked ? '' : ' (登录解锁)')"
      >
        <span class="option-icon">{{ theme.icon }}</span>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThemeStore, type ThemeType } from '../stores/themeStore'
import { ElMessage } from 'element-plus'

const themeStore = useThemeStore()

// 展开状态
const isExpanded = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null

const handleMouseEnter = () => {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  isExpanded.value = true
}

const handleMouseLeave = () => {
  closeTimer = setTimeout(() => {
    isExpanded.value = false
  }, 800)
}

// 计算半围绕展开的位置
const getOptionStyle = (index: number) => {
  const total = themeStore.availableThemes.length
  const startAngle = -90
  const endAngle = 90
  const angle = startAngle + (index / (total - 1)) * (endAngle - startAngle)
  const radius = 50

  const rad = (angle * Math.PI) / 180
  const x = -Math.abs(Math.cos(rad) * radius)
  const y = Math.sin(rad) * radius

  return {
    '--x': `${x}px`,
    '--y': `${y}px`,
    '--delay': `${index * 0.05}s`
  }
}

// 选择主题
const selectTheme = async (theme: ThemeType, unlocked: boolean) => {
  if (!unlocked) {
    ElMessage.warning('请先登录以解锁此主题')
    return
  }

  if (themeStore.currentTheme === theme) {
    return
  }

  const success = themeStore.setTheme(theme)
  if (success) {
    ElMessage.success(`已切换到${themeStore.availableThemes.find(t => t.value === theme)?.label}`)
  }
}
</script>

<style scoped>
/* 画板容器 - 固定在右侧 */
.theme-palette-container {
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  width: 60px;
  height: 60px;
  will-change: transform;
}

/* 画板主体 - 田园风格配色 */
.palette-main {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%) translateZ(0);
  border-radius: 50%;
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #FDE047 0%, #FACC15 30%, #A3E635 70%, #4ADE80 100%);
  box-shadow:
    0 4px 15px rgba(250, 204, 21, 0.4),
    0 0 0 3px rgba(255, 255, 255, 0.3) inset,
    0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 10;
  will-change: transform;
}

.palette-main:hover {
  transform: translateY(-50%) translateZ(0) scale(1.1);
  box-shadow:
    0 6px 20px rgba(250, 204, 21, 0.5),
    0 0 0 4px rgba(255, 255, 255, 0.4) inset;
}

.palette-main.expanded {
  transform: translateY(-50%) translateZ(0) scale(0.95);
}

.palette-icon {
  font-size: 28px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

/* 主题选项容器 */
.palette-options {
  position: absolute;
  right: 26px;
  top: 50%;
  transform: translateY(-50%) translateZ(0);
  width: 0;
  height: 0;
  will-change: contents;
}

/* 主题选项 - 半围绕画板展开 */
.palette-option {
  position: absolute;
  right: 0;
  top: 50%;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translate(0, -50%) scale(0) translateZ(0);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: var(--delay);
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%);
  box-shadow:
    0 3px 10px rgba(251, 191, 36, 0.3),
    0 0 0 2px rgba(255, 255, 255, 0.5) inset;
  will-change: transform, opacity;
}

.palette-option.show {
  opacity: 1;
  transform: translate(var(--x), calc(var(--y) - 50%)) scale(1) translateZ(0);
}

.palette-option:hover:not(:disabled) {
  transform: translate(var(--x), calc(var(--y) - 50%)) scale(1.15) translateZ(0);
  box-shadow:
    0 5px 15px rgba(251, 191, 36, 0.5),
    0 0 0 3px rgba(255, 255, 255, 0.6) inset;
  z-index: 20;
}

.palette-option.active {
  background: linear-gradient(135deg, #86EFAC 0%, #4ADE80 50%, #22C55E 100%);
  box-shadow:
    0 3px 12px rgba(74, 222, 128, 0.4),
    0 0 0 2px rgba(255, 255, 255, 0.6) inset;
}

.palette-option.locked {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.option-icon {
  font-size: 20px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
}

/* 响应式 - 移动端简约样式 */
@media (max-width: 768px) {
  .theme-palette-container {
    right: 12px;
    top: auto;
    bottom: 120px;
    transform: none;
    width: 40px;
    height: 40px;
  }

  .palette-main {
    width: 40px;
    height: 40px;
    background: var(--card-bg);
    box-shadow: 0 2px 8px var(--shadow-color);
    border: 1px solid var(--border-color);
  }

  .palette-main:hover {
    transform: translateY(-50%) scale(1.05);
    box-shadow: 0 2px 8px var(--shadow-color);
  }

  .palette-icon {
    font-size: 20px;
  }

  .palette-options {
    right: 20px;
  }

  .palette-option {
    width: 32px;
    height: 32px;
    background: var(--card-bg);
    box-shadow: 0 2px 6px var(--shadow-color);
    border: 1px solid var(--border-color);
  }

  .palette-option:hover:not(:disabled) {
    box-shadow: 0 2px 6px var(--shadow-color);
  }

  .palette-option.active {
    background: var(--bg-secondary);
    box-shadow: 0 2px 6px var(--shadow-color);
  }

  .option-icon {
    font-size: 16px;
  }
}
</style>
