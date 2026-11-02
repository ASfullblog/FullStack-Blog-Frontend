<script setup lang="ts">
/**
 * AppIcon —— 全站统一的线性图标组件
 * - 纯内联 SVG（见 ./paths.ts），无图标字体、无 CDN、无 npm 图标包，离线可用
 * - 颜色跟随 currentColor，所以直接读父级文字颜色（含四种主题）
 * - 装饰性图标默认 aria-hidden；需要可读语义时传 label
 */
import { computed } from 'vue';
import { ICON_PATHS } from './paths';

const props = withDefaults(
  defineProps<{
    name: string;
    size?: string | number;
    stroke?: number | string;
    label?: string;
    /** 计算尺寸时相对谁：1em（默认，跟随字号）或 px */
    unit?: 'em' | 'px';
  }>(),
  { size: '1em', stroke: 1.6, label: '', unit: 'em' }
);

const markup = computed(() => ICON_PATHS[props.name] ?? ICON_PATHS.info ?? '');

const px = computed(() => {
  const s = props.size;
  if (typeof s === 'number') return `${s}px`;
  if (/^[0-9]+(\.[0-9]+)?$/.test(s)) return props.unit === 'px' ? `${s}px` : `${s}em`;
  return s;
});
</script>

<template>
  <svg
    class="app-icon"
    :width="px"
    :height="px"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="label ? undefined : 'true'"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    focusable="false"
    v-html="markup"
  />
</template>

<style scoped>
.app-icon {
  display: inline-block;
  flex: none;
  vertical-align: -0.14em;
  overflow: visible;
}
</style>
