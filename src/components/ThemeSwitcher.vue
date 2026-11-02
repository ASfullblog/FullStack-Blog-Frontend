<template>
  <!-- 主题切换器：右下角一枚克制的小按钮，点开是一张带色彩样本的清单 -->
  <div ref="rootRef" class="theme-switch" :class="{ 'is-open': open }">
    <!-- 收起态：显示当前主题 -->
    <button
      class="ts-trigger"
      type="button"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-label="`外观：${currentLabel}，点击切换`"
      @click="toggle"
    >
      <AppIcon :name="currentIcon" :size="16" :stroke="1.7" />
      <span class="ts-trigger-label">{{ currentLabel }}</span>
    </button>

    <Transition name="ts-pop">
      <div v-if="open" class="ts-panel" role="listbox" aria-label="选择主题">
        <div class="ts-panel-title">外观</div>
        <button
          v-for="theme in themeStore.availableThemes"
          :key="theme.value"
          type="button"
          class="ts-item"
          :class="{ 'is-active': themeStore.currentTheme === theme.value }"
          role="option"
          :aria-selected="themeStore.currentTheme === theme.value"
          @click="selectTheme(theme.value)"
        >
          <!-- 色样：用主题自己的三色代表这套风格，比图标更直观 -->
          <span class="ts-swatch" :class="`sw-${theme.value}`" aria-hidden="true">
            <i></i><i></i><i></i>
          </span>
          <span class="ts-item-text">
            <span class="ts-item-label">{{ theme.label }}</span>
            <span class="ts-item-hint">{{ theme.hint }}</span>
          </span>
          <AppIcon
            v-if="themeStore.currentTheme === theme.value"
            class="ts-item-check"
            name="check"
            :size="14"
            :stroke="2"
          />
          <AppIcon v-else class="ts-item-glyph" :name="theme.icon" :size="14" :stroke="1.7" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * 主题切换器
 * - 收起时只占一颗按钮的位置，不抢版面；展开是一张清单（不再做放射状画板）
 * - 色样直接映射四种主题的主色/纸色，用户不用点开就知道会长什么样
 * - 天气主题额外显示所在城市与当前天气（来自 useThemeStore.weather）
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useThemeStore, type ThemeType } from '../stores/themeStore'
import AppIcon from './icons/AppIcon.vue'

const themeStore = useThemeStore()
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const currentThemeMeta = computed(
  () => themeStore.availableThemes.find((t) => t.value === themeStore.currentTheme) ?? themeStore.availableThemes[0]
)
const currentLabel = computed(() => currentThemeMeta.value?.label ?? '外观')
const currentIcon = computed(() => currentThemeMeta.value?.icon ?? 'palette')

const toggle = () => {
  open.value = !open.value
}

const selectTheme = (theme: ThemeType) => {
  themeStore.setTheme(theme)
  // 选完即收，移动端点一下就走
  open.value = false
}

// 点外部 / Esc 关闭
const onDocClick = (e: MouseEvent) => {
  if (!open.value) return
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) open.value = false
}
const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.theme-switch {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 1200;
}

/* 触发按钮：中性描边小胶囊，跟四套主题都协调 */
.ts-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px 0 10px;
  border-radius: var(--radius-control, 8px);
  border: 1px solid var(--border-color, #e5e5e3);
  background: var(--card-bg, #fff);
  color: var(--text-secondary, #555);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: color 0.16s ease, border-color 0.16s ease, background-color 0.16s ease;
}

.ts-trigger:hover {
  color: var(--text-color, #1b1b1a);
  border-color: var(--border-strong, #d4d4d0);
}

.ts-trigger:focus-visible {
  outline: 2px solid var(--accent-color, #2f5d8f);
  outline-offset: 2px;
}

.ts-trigger-label {
  max-width: 92px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 展开面板 */
.ts-panel {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  width: 208px;
  padding: 6px;
  border-radius: var(--radius-card, 10px);
  border: 1px solid var(--border-color, #e5e5e3);
  background: var(--card-bg, #fff);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.05);
}

.ts-panel-title {
  padding: 4px 8px 6px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--text-secondary, #8a8a85);
}

.ts-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--text-color, #1b1b1a);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.14s ease;
}

.ts-item:hover {
  background: var(--bg-secondary, #f1f1ee);
}

.ts-item:focus-visible {
  outline: 2px solid var(--accent-color, #2f5d8f);
  outline-offset: -2px;
}

.ts-item.is-active {
  background: var(--accent-soft, rgba(47, 93, 143, 0.08));
}

/* 色样：三个小方块代表 底色/纸色/强调色 */
.ts-swatch {
  display: inline-grid;
  grid-template-columns: repeat(3, 1fr);
  flex: none;
  width: 30px;
  height: 20px;
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid var(--border-color, #e5e5e3);
}

.ts-swatch i {
  display: block;
}

.sw-light i:nth-child(1) { background: #f7f7f5; }
.sw-light i:nth-child(2) { background: #ffffff; }
.sw-light i:nth-child(3) { background: #2f5d8f; }

.sw-dark i:nth-child(1) { background: #15171a; }
.sw-dark i:nth-child(2) { background: #1d2024; }
.sw-dark i:nth-child(3) { background: #7ea7c9; }

.sw-dusk i:nth-child(1) { background: #1a1816; }
.sw-dusk i:nth-child(2) { background: #232019; }
.sw-dusk i:nth-child(3) { background: #c47a4e; }

.sw-weather i:nth-child(1) { background: #cfe0ee; }
.sw-weather i:nth-child(2) { background: #f6f8fa; }
.sw-weather i:nth-child(3) { background: #4a7ba7; }

.ts-item-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.ts-item-label {
  font-size: 13px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ts-item-hint {
  font-size: 11px;
  line-height: 1.3;
  color: var(--text-secondary, #8a8a85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ts-item-glyph,
.ts-item-check {
  flex: none;
  color: var(--text-secondary, #8a8a85);
}

.ts-item-check {
  color: var(--accent-color, #2f5d8f);
}

/* 弹出动画：短、克制，不做弹簧 */
.ts-pop-enter-active,
.ts-pop-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
  transform-origin: bottom right;
}

.ts-pop-enter-from,
.ts-pop-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .ts-pop-enter-active,
  .ts-pop-leave-active {
    transition: none;
  }
}

/* 移动端：贴着底部导航上方，避开底栏 */
@media (max-width: 768px) {
  .theme-switch {
    right: 12px;
    bottom: calc(60px + env(safe-area-inset-bottom, 0px) + 12px);
  }

  .ts-trigger {
    height: 32px;
    padding: 0 10px;
    font-size: 12px;
  }

  .ts-trigger-label {
    max-width: 72px;
  }
}
</style>
