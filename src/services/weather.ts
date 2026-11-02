import request from '../utils/request'
import { useThemeStore, type WeatherSnapshot } from '../stores/themeStore'

/**
 * 天气服务
 * - 先按「本地时段 + 浏览器缓存」快速给出一份快照，让天气主题立刻有画面（不等网络）
 * - 同时请求后端 /api/weather/current（后端按 IP 定位城市、代理 Open-Meteo），拿到后热更新
 * - 15 分钟刷新一次；页面从后台切回可见时若已过期也刷新
 */

const CACHE_KEY = 'weather-snapshot-v1'
const TTL = 15 * 60 * 1000

interface CachedSnapshot extends WeatherSnapshot {
  /** 快照所属的「本地分钟数」，用于离线时按时间推算昼夜 */
  minutes: number
}

let timer: ReturnType<typeof setInterval> | null = null
let started = false

/** 按本地时段估算日照强度 0..1（日照 5-7 点渐亮，17-19 点渐暗） */
export function daylightOf(date = new Date()): number {
  const h = date.getHours() + date.getMinutes() / 60
  if (h < 5 || h >= 19) return 0
  if (h < 7) return (h - 5) / 2
  if (h > 17) return (19 - h) / 2
  return 1
}

/** 无网络时的兜底：按本地时间给「晴/夜」 */
function localFallback(): WeatherSnapshot {
  const now = new Date()
  const h = now.getHours()
  const day = h >= 6 && h < 18
  return {
    code: day ? 1 : 0,
    temperature: null,
    isDay: day,
    city: null,
    updatedAt: Date.now()
  }
}

function readCache(): WeatherSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as CachedSnapshot
    if (!data || Date.now() - data.updatedAt > 6 * 60 * 60 * 1000) return null
    // 缓存太久时用本地时段修正昼夜（避免白天打开还是夜景）
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const drift = Math.abs(nowMinutes - (data.minutes ?? 0))
    const isDay = drift > 120 ? now.getHours() >= 6 && now.getHours() < 18 : data.isDay
    return { ...data, isDay }
  } catch {
    return null
  }
}

function writeCache(snap: WeatherSnapshot) {
  try {
    const now = new Date()
    const data: CachedSnapshot = { ...snap, minutes: now.getHours() * 60 + now.getMinutes() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    /* localStorage 不可用（隐私模式）时忽略 */
  }
}

async function refresh(store: ReturnType<typeof useThemeStore>) {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai'
    const res = await request.get<any>('/weather/current', { params: { tz } })
    const d = res?.data
    if (!d) return
    const snap: WeatherSnapshot = {
      code: Number(d.code ?? 3),
      temperature: d.temperature == null ? null : Number(d.temperature),
      isDay: Boolean(d.isDay),
      city: d.city || null,
      updatedAt: Date.now()
    }
    store.setWeather(snap)
    writeCache(snap)
  } catch {
    // 后端不可达：保留本地快照 / 兜底晴夜
    if (!store.weather) store.setWeather(localFallback())
  }
}

/** 启动天气服务（全站只启动一次） */
export function startWeatherService() {
  if (started) return
  started = true
  const store = useThemeStore()

  // 1) 立即给一份（缓存或本地兜底），不等网络 → 切到天气主题零等待
  const cached = readCache()
  store.setWeather(cached ?? localFallback())

  // 2) 网络刷新
  void refresh(store)

  // 3) 定时刷新 + 回到前台时刷新
  timer = setInterval(() => {
    if (document.visibilityState === 'visible') void refresh(store)
  }, TTL)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const cur = store.weather
      if (!cur || Date.now() - cur.updatedAt > TTL) void refresh(store)
    }
  })
}

export function stopWeatherService() {
  if (timer) clearInterval(timer)
  timer = null
  started = false
}
