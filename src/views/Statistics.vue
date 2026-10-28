<script setup lang="ts">
/**
 * 数据统计（前台页面，非后台）
 * - 主题：全部使用站点 CSS 变量（--card-bg / --accent-color / --shadow-color …），跟随 themeStore
 * - 性能：GlobeChart(three) 与 TrendLine(echarts) 用 defineAsyncComponent 拆包，进页面才加载
 * - 数据：/api/stats/geo、/trend、/overview（公开聚合接口，无 IP/UA/path 明细）
 */
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import statsApi, { type GeoItem, type StatsOverview, type TrendPoint } from '../api/stats';
import { getProvinceCoord } from '../components/stats/provinceCoords';

// three / echarts 体积大：懒加载成独立 chunk，不进主包
const GlobeChart = defineAsyncComponent(() => import('../components/stats/GlobeChart.vue'));
const TrendLine = defineAsyncComponent(() => import('../components/stats/TrendLine.vue'));

const loading = ref(true);
const trendLoading = ref(false);
const errorMsg = ref('');
const geo = ref<GeoItem[]>([]);
const trend = ref<TrendPoint[]>([]);
const overview = ref<StatsOverview | null>(null);
const trendDays = ref(30);
const updatedAt = ref('');

const trendOptions = [
  { label: '近 7 天', value: 7 },
  { label: '近 30 天', value: 30 },
  { label: '近 90 天', value: 90 }
];

const fmt = (n?: number) => (typeof n === 'number' ? n.toLocaleString('zh-CN') : '--');

const totalViews = computed(() => overview.value?.totalViews ?? 0);
const hasData = computed(() => totalViews.value > 0 || geo.value.length > 0 || trend.value.some((t) => t.views > 0));

/** 能落到地球上的点位（有坐标的国内省份） */
const geoPoints = computed(() => geo.value.filter((g) => !!getProvinceCoord(g.province)));

/** 无法定位的（海外 / 其它）单独列，不上球也不冒充省份 */
const otherRegions = computed(() => geo.value.filter((g) => !getProvinceCoord(g.province)));

const maxCount = computed(() => geoPoints.value.reduce((m, g) => Math.max(m, g.count), 0));

const ranked = computed(() =>
  geoPoints.value.slice(0, 12).map((g) => ({
    ...g,
    pct: maxCount.value > 0 ? Math.round((g.count / maxCount.value) * 100) : 0
  }))
);

const topProvince = computed(() => geoPoints.value[0]);

const cards = computed(() => [
  { key: 'today', label: '今日访问', value: overview.value?.todayViews, unit: '人次', icon: '日' },
  { key: 'week', label: '近 7 天', value: overview.value?.last7Views, unit: '人次', icon: '周' },
  { key: 'month', label: '近 30 天', value: overview.value?.last30Views, unit: '人次', icon: '月' },
  { key: 'total', label: '累计访问', value: overview.value?.totalViews, unit: '人次', icon: '计' },
  { key: 'uv', label: '独立访客', value: overview.value?.uniqueIps, unit: '人', icon: '客' },
  { key: 'province', label: '覆盖地区', value: overview.value?.provinceCount, unit: '个', icon: '域' }
]);

const markUpdated = () => {
  const d = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  updatedAt.value = `${p(d.getHours())}:${p(d.getMinutes())}`;
};

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

const loadAll = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const [g, o] = await Promise.all([statsApi.getGeo(), statsApi.getOverview()]);
    geo.value = Array.isArray(g?.data) ? g.data : [];
    overview.value = o?.data || null;
    await loadTrend();
    markUpdated();
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
    <!-- 页头 -->
    <header class="stats-head">
      <div class="head-text">
        <h1 class="head-title">数据统计</h1>
        <p class="head-sub">
          {{ hasData ? `这份小站一共被访问了 ${fmt(totalViews)} 次，来自 ${fmt(overview?.provinceCount)} 个地区` : '正在收集大家的脚印' }}
          <span v-if="updatedAt" class="head-time">· 更新于 {{ updatedAt }}</span>
        </p>
      </div>
      <button class="refresh-btn" type="button" :disabled="loading" @click="loadAll">
        <span :class="{ spin: loading }">⟳</span>
        {{ loading ? '加载中' : '刷新' }}
      </button>
    </header>

    <!-- 错误态 -->
    <div v-if="errorMsg" class="state-card">
      <p class="state-title">数据没取到</p>
      <p class="state-desc">{{ errorMsg }}</p>
      <button class="primary-btn" type="button" @click="loadAll">重试一下</button>
    </div>

    <!-- 空态：还没访问记录时，别给园长看一个空地球 + NaN -->
    <div v-else-if="!loading && !hasData" class="state-card">
      <div class="empty-globe" aria-hidden="true">🌏</div>
      <p class="state-title">暂无访问数据</p>
      <p class="state-desc">
        还没有人留下脚印。有人打开首页、翻文章、看留言板时，这里就会长出一个光点——
        <br />
        统计只记录「来自哪个省份、看了哪天」，不会留 IP 和浏览器信息。
      </p>
    </div>

    <template v-else>
      <!-- Hero：大地球 -->
      <section class="hero-card">
        <div class="hero-inner">
          <GlobeChart v-if="!loading" :data="geoPoints" />
          <div v-else class="hero-skeleton" />

          <!-- 左上角浮层：概览 -->
          <div class="hero-badge">
            <div class="badge-num">{{ fmt(overview?.provinceCount) }}</div>
            <div class="badge-label">个地区留下脚印</div>
          </div>

          <!-- 右下角图例 -->
          <div class="hero-legend">
            <span class="legend-dot" />
            <span>光柱高度 = 该地区访问人次</span>
          </div>

          <div v-if="topProvince" class="hero-top">
            TOP1 · {{ topProvince.province }}
            <b>{{ fmt(topProvince.count) }}</b> 人次
          </div>
        </div>
      </section>

      <!-- 概览卡片栅格 -->
      <section class="card-grid">
        <article v-for="c in cards" :key="c.key" class="stat-card">
          <div class="stat-icon">{{ c.icon }}</div>
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
        <div class="panel-body" :class="{ dim: trendLoading }">
          <TrendLine :data="trend" :height="340" />
        </div>
      </section>

      <!-- 排行 + 其它地区 -->
      <section class="two-col">
        <article class="panel">
          <div class="panel-head">
            <h2 class="panel-title">地区排行</h2>
            <span class="panel-tip">只统计能定位到省份的访问</span>
          </div>
          <div class="panel-body">
            <ol v-if="ranked.length" class="rank-list">
              <li v-for="(r, i) in ranked" :key="r.province" class="rank-item">
                <span class="rank-no" :class="{ hot: i < 3 }">{{ i + 1 }}</span>
                <span class="rank-name">{{ r.province }}</span>
                <span class="rank-bar">
                  <i class="rank-fill" :style="{ width: r.pct + '%' }" />
                </span>
                <span class="rank-num">{{ fmt(r.count) }}</span>
              </li>
            </ol>
            <p v-else class="inline-empty">暂无省份数据</p>
          </div>
        </article>

        <article class="panel">
          <div class="panel-head">
            <h2 class="panel-title">其它 / 海外</h2>
            <span class="panel-tip">无法归到省份的部分</span>
          </div>
          <div class="panel-body">
            <div v-if="otherRegions.length" class="chip-list">
              <span v-for="o in otherRegions" :key="o.province" class="chip">
                {{ o.province }}<b>{{ fmt(o.count) }}</b>
              </span>
            </div>
            <p v-else class="inline-empty">没有来源不明的访问，干净 👌</p>
            <ul class="note-list">
              <li>光点按<b>省份人次</b>聚合，同一个人多次访问只算人次。</li>
              <li>统计口径为北京时间（{{ overview?.timezone || 'UTC+8' }}）。</li>
              <li>这里看不到、也不存储任何访客的 IP、设备或具体页面。</li>
            </ul>
          </div>
        </article>
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

/* ---------------- 页头 ---------------- */
.stats-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.head-title {
  margin: 0;
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-secondary));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.head-sub {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.head-time {
  color: var(--text-tertiary);
  font-size: 0.82rem;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--card-bg);
  color: var(--text-secondary);
  font-size: 0.86rem;
  cursor: pointer;
  transition: all 0.22s ease;
}

.refresh-btn:hover:not(:disabled) {
  color: var(--accent-color);
  border-color: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-color);
}

.refresh-btn:disabled {
  opacity: 0.65;
  cursor: default;
}

.refresh-btn .spin {
  display: inline-block;
  animation: rot 1s linear infinite;
}

@keyframes rot {
  to {
    transform: rotate(360deg);
  }
}

/* ---------------- 状态卡 ---------------- */
.state-card,
.hero-card,
.panel,
.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 6px var(--shadow-color);
  border-radius: 12px 16px 14px 10px;
}

.state-card {
  padding: 3rem 1.5rem;
  text-align: center;
}

.empty-globe {
  font-size: 2.6rem;
  margin-bottom: 0.5rem;
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
  padding: 0.5rem 1.4rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-secondary));
  color: #fff;
  font-size: 0.88rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--shadow-color);
}

/* ---------------- Hero 地球 ---------------- */
.hero-card {
  padding: 0;
  overflow: hidden;
}

.hero-inner {
  position: relative;
  width: 100%;
  /* 大屏 hero：≥60vh，自适应夹在 520–680px */
  height: clamp(520px, 62vh, 680px);
  /* 不支持 color-mix 的浏览器退回纯色，不会白屏 */
  background: var(--bg-secondary);
  background: radial-gradient(
    120% 90% at 50% 40%,
    color-mix(in srgb, var(--accent-color) 12%, var(--bg-secondary)) 0%,
    var(--bg-secondary) 62%,
    var(--bg-tertiary) 100%
  );
}

.hero-skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    100deg,
    var(--bg-tertiary) 30%,
    var(--hover-bg) 50%,
    var(--bg-tertiary) 70%
  );
  background-size: 200% 100%;
  animation: shine 1.35s ease-in-out infinite;
}

@keyframes shine {
  to {
    background-position: -200% 0;
  }
}

.hero-badge {
  position: absolute;
  top: 1.1rem;
  left: 1.2rem;
  z-index: 2;
  padding: 0.6rem 0.9rem;
  border-radius: 12px;
  background: var(--bg-secondary);
  background: color-mix(in srgb, var(--bg-secondary) 78%, transparent);
  border: 1px solid var(--border-color);
  backdrop-filter: blur(6px);
}

.badge-num {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--accent-color);
  font-variant-numeric: tabular-nums;
}

.badge-label {
  font-size: 0.76rem;
  color: var(--text-secondary);
}

.hero-legend {
  position: absolute;
  right: 1.1rem;
  bottom: 1rem;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-color);
  box-shadow: 0 0 8px var(--accent-color);
}

.hero-top {
  position: absolute;
  left: 1.2rem;
  bottom: 1rem;
  z-index: 2;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.hero-top b {
  color: var(--accent-color);
  font-variant-numeric: tabular-nums;
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
  gap: 0.8rem;
  padding: 1rem 1.1rem;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px var(--shadow-color);
}

.stat-icon {
  flex: none;
  width: 2.4rem;
  height: 2.4rem;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-secondary));
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
  padding: 0.22rem;
  gap: 0.2rem;
  border-radius: 999px;
  background: var(--bg-tertiary);
}

.days-tab {
  padding: 0.32rem 0.85rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.days-tab.active {
  background: linear-gradient(135deg, var(--accent-color), var(--accent-secondary));
  color: #fff;
  box-shadow: 0 2px 8px var(--shadow-color);
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
  color: #fff;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-secondary));
}

.rank-name {
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-bar {
  position: relative;
  height: 7px;
  border-radius: 999px;
  background: var(--bg-tertiary);
  overflow: hidden;
}

.rank-fill {
  position: absolute;
  inset: 0 auto 0 0;
  display: block;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-secondary));
  transition: width 0.5s ease;
}

.rank-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 1rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
}

.chip b {
  color: var(--accent-color);
  font-variant-numeric: tabular-nums;
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
  .hero-inner {
    /* 移动端 62vh 会把内容全顶走，压到 56vh，仍 ≥ 半屏 */
    height: clamp(420px, 56vh, 560px);
  }

  .head-title {
    font-size: 1.5rem;
  }

  .hero-badge {
    top: 0.8rem;
    left: 0.8rem;
    padding: 0.45rem 0.7rem;
  }

  .badge-num {
    font-size: 1.2rem;
  }

  .stat-value {
    font-size: 1.15rem;
  }
}
</style>
