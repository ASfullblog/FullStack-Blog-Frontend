<script setup lang="ts">
/**
 * 访问量折线图（echarts 6 按需引入，只注册用到的组件，不整包 import 'echarts'）
 * 颜色全部读主题 CSS 变量，themeStore 切换时重设 option；卸载时 dispose + 断开 ResizeObserver
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useThemeStore } from '../../stores/themeStore';
import type { TrendPoint } from '../../api/stats';

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer]);

const props = withDefaults(
  defineProps<{
    data?: TrendPoint[];
    height?: number;
    type?: 'line' | 'bar';
  }>(),
  { data: () => [], height: 320, type: 'line' }
);

const el = ref<HTMLDivElement | null>(null);
const themeStore = useThemeStore();
let chart: echarts.ECharts | null = null;
let ro: ResizeObserver | null = null;

const cssVar = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

/** #rrggbb / rgb() → 带 alpha 的颜色（用于面积渐变） */
const withAlpha = (color: string, alpha: number) => {
  const c = color.trim();
  const hex = c.replace('#', '');
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    const n = parseInt(hex, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (c.startsWith('rgb(')) return c.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  return c;
};

const buildOption = (): Record<string, unknown> => {
  const accent = cssVar('--accent-color', '#667eea');
  const secondary = cssVar('--accent-secondary', '#764ba2');
  const textMain = cssVar('--text-primary', '#1f2937');
  const textSub = cssVar('--text-secondary', '#6b7280');
  const textDim = cssVar('--text-tertiary', '#9ca3af');
  const border = cssVar('--border-color', '#e5e7eb');
  const cardBg = cssVar('--bg-secondary', '#ffffff');

  const dates = props.data.map((d) => d.date);
  const views = props.data.map((d) => d.views);
  const isNarrow = (el.value?.clientWidth || 600) < 520;
  const isBar = props.type === 'bar';

  return {
    animationDuration: 520,
    grid: { left: isNarrow ? 40 : 52, right: isNarrow ? 16 : 24, top: 28, bottom: isNarrow ? 44 : 34, containLabel: false },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        lineStyle: { color: withAlpha(accent, 0.45), width: 1 },
        crossStyle: { color: withAlpha(accent, 0.35) },
        label: { backgroundColor: accent, color: '#fff', fontSize: 11 }
      },
      backgroundColor: cardBg,
      borderColor: border,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: textMain, fontSize: 13 },
      extraCssText: 'border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.12);',
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params;
        const full = String(p.axisValue || '');
        const md = full.slice(5).replace('-', '/');
        return `<div style="font-weight:600;margin-bottom:2px">${md}</div>
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="width:8px;height:8px;border-radius:50%;background:${accent};display:inline-block"></span>
                  <span style="color:${textSub}">访问量</span>
                  <b style="color:${textMain};font-variant-numeric:tabular-nums">${p.data ?? 0}</b>
                  <span style="color:${textSub}">人次</span>
                </div>`;
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: isBar,
      data: dates,
      axisLine: { lineStyle: { color: border } },
      axisTick: { show: false },
      axisLabel: {
        color: textDim,
        fontSize: 11,
        hideOverlap: true,
        rotate: isNarrow && dates.length > 14 ? 45 : 0,
        formatter: (v: string) => (v ? v.slice(5).replace('-', '/') : v)
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: withAlpha(border, 0.8), type: 'dashed' } },
      axisLabel: { color: textDim, fontSize: 11 }
    },
    series: [
      {
        name: '访问量',
        type: isBar ? 'bar' : 'line',
        smooth: !isBar,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 7,
        data: views,
        barMaxWidth: 28,
        lineStyle: { width: 2.4, color: accent, shadowColor: withAlpha(accent, 0.35), shadowBlur: 8, shadowOffsetY: 3 },
        itemStyle: isBar
          ? { color: accent, borderRadius: [4, 4, 0, 0] }
          : { color: accent, borderColor: cardBg, borderWidth: 2 },
        emphasis: { focus: 'series', scale: 1.4 },
        areaStyle: isBar
          ? undefined
          : {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: withAlpha(accent, 0.34) },
                  { offset: 0.55, color: withAlpha(accent, 0.12) },
                  { offset: 1, color: withAlpha(secondary, 0.02) }
                ]
              }
            },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: withAlpha(secondary, 0.55), type: 'dashed', width: 1 },
          label: {
            formatter: '均值 {c}',
            color: textDim,
            fontSize: 11,
            position: 'insideEndTop'
          },
          data: [{ type: 'average', name: '均值' }]
        }
      }
    ]
  };
};

const render = () => {
  if (!chart) return;
  chart.setOption(buildOption(), true);
};

const setup = () => {
  if (!el.value) return;
  chart = echarts.init(el.value, undefined, { renderer: 'canvas' });
  render();
  ro = new ResizeObserver(() => chart?.resize());
  ro.observe(el.value);
};

onMounted(setup);

watch(() => props.data, render, { deep: false });
watch(() => props.type, render);
watch(() => themeStore.currentTheme, () => {
  // 主题变了：重读 CSS 变量并整图重绘
  render();
});

onBeforeUnmount(() => {
  ro?.disconnect();
  ro = null;
  chart?.dispose();
  chart = null;
});
</script>

<template>
  <div class="trend-wrap">
    <div ref="el" class="trend-chart" :style="{ height: height + 'px' }" />
    <p v-if="!data.length" class="trend-empty">暂无趋势数据</p>
  </div>
</template>

<style scoped>
.trend-wrap {
  position: relative;
  width: 100%;
}

.trend-chart {
  width: 100%;
}

.trend-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-size: 13px;
  color: var(--text-tertiary, #9ca3af);
}
</style>
