<template>
  <!-- 天气实景背景：只在「天气」主题下挂载，切走即销毁，零额外开销 -->
  <div class="weather-bg" :class="{ 'is-ready': ready }" aria-hidden="true">
    <canvas ref="canvasRef" class="weather-canvas"></canvas>
    <!-- 轻微暗角，让内容卡片边缘更清楚，但不压暗画面 -->
    <div class="weather-vignette"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * 天气背景组件
 * - 纯 Canvas 2D 绘制（见 ./WeatherScene.ts），首帧立即出图，不阻塞交互
 * - 跟随 themeStore 的天气快照与昼夜实时更新，不需要重新挂载
 * - 尊重 prefers-reduced-motion：减少动效时只画静态天空
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useThemeStore } from '../../stores/themeStore'
import { daylightOf } from '../../services/weather'
import { WeatherScene } from './WeatherScene'

const themeStore = useThemeStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)
let scene: WeatherScene | null = null

const reduced = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false

const snapshot = computed(() => themeStore.weather)

function mountScene() {
  const el = canvasRef.value
  if (!el) return
  const snap = snapshot.value
  scene = new WeatherScene(el, {
    code: snap?.code ?? 1,
    isDay: snap?.isDay ?? true,
    daylight: daylightOf(),
    reduced
  })
  // 下一帧再淡入，避免画布出现前的白闪
  requestAnimationFrame(() => (ready.value = true))
}

watch(
  () => [snapshot.value?.code, snapshot.value?.isDay] as const,
  ([code, isDay]) => {
    if (!scene) return
    scene.update({ code: code ?? 1, isDay: isDay ?? true, daylight: daylightOf() })
  }
)

onMounted(mountScene)
onBeforeUnmount(() => {
  scene?.destroy()
  scene = null
})
</script>

<style scoped>
.weather-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.weather-bg.is-ready {
  opacity: 1;
}

.weather-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* 暗角：四周极轻度的压暗，让浮在上面的卡片有依附感 */
.weather-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 90% at 50% 40%, rgba(0, 0, 0, 0) 55%, rgba(10, 16, 24, 0.16) 100%);
}

@media (prefers-reduced-motion: reduce) {
  .weather-bg {
    transition: none;
  }
}
</style>
