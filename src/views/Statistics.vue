<script setup lang="ts">
/**
 * 数据统计（前台页面，非后台）
 * - 主题：全部使用站点 CSS 变量（--card-bg / --accent-color / --shadow-color …），跟随 themeStore
 * - 性能：TrendLine(echarts) 用 defineAsyncComponent 拆包，进页面才加载
 * - 数据：/api/stats/geo、/trend、/overview（公开聚合接口，无 IP/UA/path 明细）
 */
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import statsApi, { type GeoItem, type StatsOverview, type TrendPoint } from '../api/stats';
import { getProvinceCoord } from '../components/stats/provinceCoords';
import { getCountryCoord } from '../components/stats/countryCoords';
import AppIcon from '../components/icons/AppIcon.vue';

// echarts 体积大：懒加载成独立 chunk，不进主包
const TrendLine = defineAsyncComponent(() => import('../components/stats/TrendLine.vue'));

const loading = ref(true);
const trendLoading = ref(false);
const errorMsg = ref('');
const geo = ref<GeoItem[]>([]);
const trend = ref<TrendPoint[]>([]);
const overview = ref<StatsOverview | null>(null);
const trendDays = ref(30);
const trendType = ref<'line' | 'bar'>('line');

const trendOptions = [
  { label: '近 7 天', value: 7 },
  { label: '近 30 天', value: 30 },
  { label: '近 90 天', value: 90 }
];

const chartTypes = [
  { label: '折线', value: 'line' as const },
  { label: '柱状', value: 'bar' as const }
];

const fmt = (n?: number) => (typeof n === 'number' ? n.toLocaleString('zh-CN') : '--');

const totalViews = computed(() => overview.value?.totalViews ?? 0);
const hasData = computed(() => totalViews.value > 0 || geo.value.length > 0 || trend.value.some((t) => t.views > 0));

/** 能落到地球上的点位（有坐标的国内省份 + 海外国家） */
const geoPoints = computed(() =>
  geo.value.filter((g) => !!getProvinceCoord(g.province) || !!getCountryCoord(g.province))
);

/** 展示名：中国省份显示省名，海外显示国名 */
const displayName = (g: GeoItem) => (g.country === '中国' ? g.province : g.country || g.province);

const maxCount = computed(() => geoPoints.value.reduce((m, g) => Math.max(m, g.count), 0));

const ranked = computed(() =>
  geoPoints.value.slice(0, 12).map((g) => ({
    ...g,
    name: displayName(g),
    pct: maxCount.value > 0 ? Math.round((g.count / maxCount.value) * 100) : 0
  }))
);

const cards = computed(() => [
  { key: 'today', label: '今日访问', value: overview.value?.todayViews, unit: '人次', icon: 'sun' },
  { key: 'week', label: '近 7 天', value: overview.value?.last7Views, unit: '人次', icon: 'calendar' },
  { key: 'month', label: '近 30 天', value: overview.value?.last30Views, unit: '人次', icon: 'activity' },
  { key: 'total', label: '累计访问', value: overview.value?.totalViews, unit: '人次', icon: 'pulse' },
  { key: 'uv', label: '独立访客', value: overview.value?.uniqueIps, unit: '人', icon: 'users' },
  { key: 'province', label: '覆盖地区', value: overview.value?.provinceCount, unit: '个', icon: 'globe' }
]);

const loadTrend = async () => {
  trendLoading.value = true;
  try {
    const res = await statsApi.getTrend(trendDays.value);
    trend.value = Array.isArray(res?.data) ? res.data : [];
  } catch {
    trend.value = [];
  } finally {
    trendLoading.value = false;
  }
};

const switchDays = (d: number) => {
  if (trendDays.value === d) return;
  trendDays.value = d;
  loadTrend();
};

const switchType = (t: 'line' | 'bar') => {
  if (trendType.value === t) return;
  trendType.value = t;
};

const loadAll = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const [g, o] = await Promise.all([statsApi.getGeo(), statsApi.getOverview()]);
    geo.value = Array.isArray(g?.data) ? g.data : [];
    overview.value = o?.data || null;
    await loadTrend();
  } catch (e: any) {
    errorMsg.value = e?.message || '数据加载失败，稍后再试';
  } finally {
    loading.value = false;
  }
};

onMounted(loadAll);
</script>

<template>
  <div class="stats-page">
    <!-- 错误态 -->
    <div v-if="errorMsg" class="state-card">
      <p class="state-title">数据没取到</p>
      <p class="state-desc">{{ errorMsg }}</p>
      <button class="primary-btn" type="button" @click="loadAll">重试一下</button>
    </div>

    <!-- 空态：还没访问记录时，别给园长看一个空地球 + NaN -->
    <div v-else-if="!loading && !hasData" class="state-card">
      <div class="empty-globe" aria-hidden="true"><AppIcon name="globe" :size="34" :stroke="1.3" /></div>
      <p class="state-title">暂无访问数据</p>
      <p class="state-desc">
        还没有人留下脚印。有人打开首页、翻文章、看留言板时，这里就会长出一个光点——
        <br />
        统计只记录「来自哪个省份、看了哪天」，不会留 IP 和浏览器信息。
      </p>
    </div>

    <template v-else>
      <!-- 概览卡片栅格 -->
      <section class="card-grid">
        <article v-for="c in cards" :key="c.key" class="stat-card">
          <div class="stat-icon"><AppIcon :name="c.icon" :size="17" :stroke="1.7" /></div>
          <div class="stat-body">
            <div class="stat-value">
              <template v-if="loading">--</template>
              <template v-else>{{ fmt(c.value) }}</template>
              <span class="stat-unit">{{ c.unit }}</span>
            </div>
            <div class="stat-label">{{ c.label }}</div>
          </div>
        </article>
      </section>

      <!-- 趋势 -->
      <section class="panel">
        <div class="panel-head">
          <h2 class="panel-title">访问量趋势</h2>
          <div class="head-tools">
            <div class="days-tabs">
              <button
                v-for="opt in chartTypes"
                :key="opt.value"
                type="button"
                class="days-tab"
                :class="{ active: trendType === opt.value }"
                @click="switchType(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
            <div class="days-tabs">
              <button
                v-for="opt in trendOptions"
                :key="opt.value"
                type="button"
                class="days-tab"
                :class="{ active: trendDays === opt.value }"
                @click="switchDays(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
        <div class="panel-body" :class="{ dim: trendLoading }">
          <TrendLine :data="trend" :height="340" :type="trendType" />
        </div>
      </section>

      <!-- 地区排行 -->
      <section class="panel">
        <div class="panel-head">
          <h2 class="panel-title">地区排行</h2>
          <span class="panel-tip">中国到省、海外到国家，按访问人次排序</span>
        </div>
        <div class="panel-body">
          <ol v-if="ranked.length" class="rank-list">
            <li v-for="(r, i) in ranked" :key="r.country + r.province" class="rank-item">
              <span class="rank-no" :class="{ hot: i < 3 }">{{ i + 1 }}</span>
              <span class="rank-name">{{ r.name }}</span>
              <span class="rank-bar">
                <i class="rank-fill" :style="{ width: r.pct + '%' }" />
              </span>
              <span class="rank-num">{{ fmt(r.count) }}</span>
            </li>
          </ol>
          <p v-else class="inline-empty">暂无地区数据</p>
          <ul class="note-list" style="margin-top: 0.9rem">
            <li>光点按<b>地区人次</b>聚合，同一个人多次访问只算人次。</li>
            <li>统计口径为北京时间（{{ overview?.timezone || 'UTC+8' }}）。</li>
            <li>这里看不到、也不存储任何访客的 IP、设备或具体页面。</li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.stats-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: var(--text-primary);
}

/* ---------------- 状态卡 ---------------- */
.state-card,
.panel,
.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card, 10px);
}

.state-card {
  padding: 3rem 1.5rem;
  text-align: center;
}

.empty-globe {
  display: flex;
  justify-content: center;
  margin-bottom: 0.6rem;
  color: var(--text-tertiary);
}

.state-title {
  margin: 0 0 0.6rem;
  font-size: 1.15rem;
  font-weight: 600;
}

.state-desc {
  margin: 0 auto 1.2rem;
  max-width: 34rem;
  font-size: 0.88rem;
  line-height: 1.8;
  color: var(--text-secondary);
}

.primary-btn {
  padding: 0.45rem 1.2rem;
  border: 1px solid var(--accent-color);
  border-radius: var(--radius-control, 8px);
  background: var(--accent-color);
  color: var(--accent-contrast);
  font-size: 0.85rem;
  cursor: pointer;
  transition: filter 0.16s ease;
}

.primary-btn:hover {
  filter: brightness(1.08);
}

.primary-btn:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

/* ---------------- 概览卡片 ---------------- */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.9rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  transition: border-color 0.16s ease;
}

.stat-card:hover {
  border-color: var(--border-strong);
}

/* 图标只在强调色淡底上，不再整块铺满渐变 */
.stat-icon {
  flex: none;
  width: 2.2rem;
  height: 2.2rem;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--accent-color);
  background: var(--accent-soft);
}

.stat-value {
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.stat-unit {
  margin-left: 0.2rem;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-tertiary);
}

.stat-label {
  margin-top: 0.15rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* ---------------- 面板 ---------------- */
.panel {
  padding: 1.1rem 1.2rem 1.3rem;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
}

.panel-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
}

.panel-tip {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.panel-body.dim {
  opacity: 0.55;
  transition: opacity 0.2s ease;
}

.days-tabs {
  display: inline-flex;
  gap: 0.2rem;
  padding: 0.2rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-control, 8px);
  background: var(--bg-secondary);
}

.head-tools {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.days-tab {
  padding: 0.28rem 0.7rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.78rem;
  cursor: pointer;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.days-tab:hover {
  color: var(--text-color, var(--text-primary));
}

.days-tab.active {
  background: var(--accent-color);
  color: var(--accent-contrast);
}

.two-col {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 0.9rem;
  align-items: start;
}

/* ---------------- 排行 ---------------- */
.rank-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.rank-item {
  display: grid;
  grid-template-columns: 1.5rem 3.6rem 1fr 3.2rem;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
}

.rank-no {
  display: grid;
  place-items: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
}

.rank-no.hot {
  color: var(--accent-contrast);
  background: var(--accent-color);
}

.rank-name {
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-bar {
  position: relative;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-secondary);
  overflow: hidden;
}

.rank-fill {
  position: absolute;
  inset: 0 auto 0 0;
  display: block;
  border-radius: 3px;
  background: var(--accent-color);
  opacity: 0.75;
  transition: width 0.4s ease;
}

.rank-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

.note-list {
  margin: 0;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.78rem;
  line-height: 1.7;
  color: var(--text-tertiary);
}

.note-list b {
  color: var(--text-secondary);
}

.inline-empty {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-tertiary);
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stat-value {
    font-size: 1.15rem;
  }
}
</style>