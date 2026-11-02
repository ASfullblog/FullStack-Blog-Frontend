<template>
  <!-- 文章卡片：鼠标移入时轻微 3D 倾斜，移出回正；触屏设备不启用 -->
  <article
    ref="cardRef"
    class="post-card"
    :class="{ 'is-tilting': tilting }"
    :style="cardStyle"
    @mousemove="onMove"
    @mouseleave="onLeave"
    @click="$emit('open', post.slug)"
  >
    <!-- 文章封面 -->
    <div class="post-cover">
      <img :src="coverSrc" :alt="post.title" loading="lazy" />
    </div>

    <!-- 文章内容 -->
    <div class="post-content">
      <div class="post-category">{{ post.category?.name }}</div>

      <h2 class="post-title">{{ post.title }}</h2>

      <p class="post-excerpt">{{ post.excerpt }}</p>

      <div class="post-tags">
        <span v-for="tag in post.tags" :key="tag.id" class="tag">{{ tag.name }}</span>
      </div>

      <div class="post-meta">
        <div class="post-author">
          <img :src="resolveAvatar(post.author)" :alt="post.author.username" />
          <span>{{ post.author.username }}</span>
        </div>
        <div class="post-stats">
          <span>{{ formatDate(post.createdAt) }}</span>
          <span class="separator">·</span>
          <span>{{ post.viewCount }} 阅读</span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
/**
 * 文章卡片
 * - 3D 倾斜：跟随指针在卡片内位置，映射成 ±MAX_TILT 度的 rotateX/rotateY，
 *   幅度很小（默认 5°），保持阅读时页面安静；指针移出用短缓动回正
 * - 高 DPI 下用 rAF 合并写入，避免 mousemove 事件频率过高导致掉帧
 * - 触屏 / prefers-reduced-motion 环境自动不启用
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { resolveAvatar } from '../utils/avatar'
import type { Post } from '../types'

const props = defineProps<{ post: Post }>()
defineEmits<{ open: [slug: string] }>()

const DEFAULT_COVER_IMAGE = 'https://picsum.photos/1200/600?random=1'
const MAX_TILT = 5
const LIFT = 4

const cardRef = ref<HTMLElement | null>(null)
const tilt = ref({ x: 0, y: 0 })
const tilting = ref(false)
const enabled = ref(false)

let raf = 0
let pending: { x: number; y: number } | null = null

const coverSrc = computed(() => props.post.coverImage || DEFAULT_COVER_IMAGE)

const cardStyle = computed(() => {
  const t = tilt.value
  return {
    transform: `perspective(900px) rotateX(${t.y.toFixed(2)}deg) rotateY(${t.x.toFixed(2)}deg) translateY(${tilting.value ? -LIFT : 0}px)`
  }
})

function flush() {
  raf = 0
  if (!pending) return
  tilt.value = pending
  pending = null
}

function onMove(e: MouseEvent) {
  if (!enabled.value || !cardRef.value) return
  const r = cardRef.value.getBoundingClientRect()
  const px = (e.clientX - r.left) / r.width
  const py = (e.clientY - r.top) / r.height
  // 指针位置 → 倾斜角：向右移时卡片右侧往下压，符合真实光影直觉
  pending = {
    x: (px - 0.5) * 2 * MAX_TILT,
    y: -(py - 0.5) * 2 * MAX_TILT
  }
  if (!tilting.value) tilting.value = true
  if (!raf) raf = requestAnimationFrame(flush)
}

function onLeave() {
  pending = null
  tilting.value = false
  tilt.value = { x: 0, y: 0 }
  if (raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
}

function formatDate(date: string | Date): string {
  const d = new Date(date)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}/${m}/${day}`
}

onMounted(() => {
  const fine = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  enabled.value = Boolean(fine) && !reduced
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
})
</script>

<style scoped>
.post-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card, 10px);
  background: var(--card-bg);
  cursor: pointer;
  will-change: transform;
  transform-style: preserve-3d;
  transition: transform 0.28s cubic-bezier(0.22, 0.61, 0.36, 1), box-shadow 0.28s ease, border-color 0.28s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

/* 倾斜中：过渡时间缩短，跟手；阴影轻微加深，制造“抬起”感 */
.post-card.is-tilting {
  transition: transform 0.08s linear, box-shadow 0.28s ease, border-color 0.28s ease;
  box-shadow: 0 14px 28px -12px rgba(0, 0, 0, 0.22);
}

.post-card:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 3px;
}

/* 封面 */
.post-cover {
  height: 11.5rem;
  overflow: hidden;
  background: var(--bg-secondary);
}

.post-cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.post-card:hover .post-cover img {
  transform: scale(1.04);
}

/* 内容 */
.post-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 14px 16px 12px;
}

.post-category {
  margin-bottom: 6px;
  font-size: 12px;
  letter-spacing: 0.02em;
  color: var(--accent-color);
}

.post-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--text-color, var(--text-primary));
}

.post-excerpt {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--text-secondary);
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.tag {
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-secondary);
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* 底部信息 */
.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-secondary);
}

.post-author {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.post-author span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-author img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex: none;
}

.post-stats {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
  font-variant-numeric: tabular-nums;
}

.separator {
  opacity: 0.6;
}

@media (prefers-reduced-motion: reduce) {
  .post-card,
  .post-card.is-tilting {
    transition: none;
  }
}
</style>
