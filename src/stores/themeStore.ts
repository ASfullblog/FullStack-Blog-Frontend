import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 主题系统（v3）
 * - 三种静态主题：light（纸白）/ dark（石墨）/ dusk（暖炭），配色克制、单一强调色
 * - 一种动态主题：weather（天气实景）—— 背景由 Canvas 实时绘制当前天气与昼夜变化的动效，
 *   内容层保持中性底色，只让背景"活"起来（参考王者荣耀"天幕"：整屏氛围 + 内容只做轻量让位）
 * - 所有主题共用同一套 CSS 变量名，组件不感知主题
 */
export type ThemeType = 'light' | 'dark' | 'dusk' | 'weather'

export interface WeatherSnapshot {
  /** WMO weather code */
  code: number
  temperature: number | null
  isDay: boolean
  city: string | null
  updatedAt: number
}

type TokenMap = Record<string, string>

/** 纸白：接近纯白的纸面 + 墨色文字 + 一个沉静的靛蓝强调色 */
const LIGHT: TokenMap = {
  '--bg-primary': '#f7f7f5',
  '--bg-secondary': '#ffffff',
  '--bg-tertiary': '#f0f0ed',
  '--text-primary': '#1b1b1a',
  '--text-color': '#1b1b1a',
  '--text-secondary': '#5c5c58',
  '--text-tertiary': '#8e8e88',
  '--accent-color': '#2f5d8f',
  '--accent-secondary': '#3d6f9f',
  '--accent-contrast': '#ffffff',
  '--accent-soft': 'rgba(47, 93, 143, 0.08)',
  '--border-color': '#e3e3de',
  '--border-strong': '#cfcfc8',
  '--card-bg': '#ffffff',
  '--hover-bg': '#f2f2ef',
  '--shadow-color': 'rgba(24, 24, 22, 0.07)',
  '--radius-card': '10px',
  '--radius-control': '8px',
  // 后台侧边栏
  '--sidebar-bg-start': '#232320',
  '--sidebar-bg-end': '#1b1b19',
  '--sidebar-text': '#b8b8b2',
  '--sidebar-text-active': '#ffffff',
  '--sidebar-hover': '#2f2f2b',
  '--sidebar-border': '#33332f',
  '--sidebar-glow': 'rgba(47, 93, 143, 0.16)',
  '--header-shadow': '0 1px 0 var(--border-color)',
  // Element Plus
  '--el-color-primary': '#2f5d8f',
  '--el-color-primary-light-3': '#5780a9',
  '--el-color-primary-light-5': '#7d9cbc',
  '--el-color-primary-light-7': '#a4b9cf',
  '--el-color-primary-light-8': '#bccbdb',
  '--el-color-primary-light-9': '#e6ecf2',
  '--el-color-primary-dark-2': '#254a72',
  '--el-color-success': '#3f7d53',
  '--el-color-warning': '#a8721f',
  '--el-color-danger': '#a94a42',
  '--el-color-error': '#a94a42',
  '--el-color-info': '#6b6b66',
  '--el-bg-color': '#ffffff',
  '--el-bg-color-page': '#f7f7f5',
  '--el-bg-color-overlay': '#ffffff',
  '--el-text-color-primary': '#1b1b1a',
  '--el-text-color-regular': '#3d3d3a',
  '--el-text-color-secondary': '#5c5c58',
  '--el-text-color-placeholder': '#9a9a94',
  '--el-border-color': '#dcdcd6',
  '--el-border-color-light': '#e6e6e1',
  '--el-border-color-lighter': '#efefeb',
  '--el-border-color-extra-light': '#f5f5f2',
  '--el-fill-color': '#f2f2ef',
  '--el-fill-color-light': '#f7f7f5',
  '--el-fill-color-lighter': '#fafaf8',
  '--el-fill-color-extra-light': '#fcfcfa',
  '--el-box-shadow': '0 1px 2px rgba(24, 24, 22, 0.06)',
  '--el-box-shadow-light': '0 1px 2px rgba(24, 24, 22, 0.05)',
  '--el-box-shadow-lighter': '0 1px 1px rgba(24, 24, 22, 0.04)',
  '--el-box-shadow-dark': '0 8px 24px -8px rgba(24, 24, 22, 0.18)'
}

/** 石墨：深灰蓝底，文字略暖白，强调色是低饱和的青灰蓝 */
const DARK: TokenMap = {
  '--bg-primary': '#15171a',
  '--bg-secondary': '#1b1e22',
  '--bg-tertiary': '#23272c',
  '--text-primary': '#e8e7e3',
  '--text-color': '#e8e7e3',
  '--text-secondary': '#a3a5a6',
  '--text-tertiary': '#74777a',
  '--accent-color': '#7ea7c9',
  '--accent-secondary': '#5d8db5',
  '--accent-contrast': '#0f1113',
  '--accent-soft': 'rgba(126, 167, 201, 0.12)',
  '--border-color': '#2c3035',
  '--border-strong': '#3a3f45',
  '--card-bg': '#1b1e22',
  '--hover-bg': '#23272c',
  '--shadow-color': 'rgba(0, 0, 0, 0.45)',
  '--radius-card': '10px',
  '--radius-control': '8px',
  '--sidebar-bg-start': '#131518',
  '--sidebar-bg-end': '#0f1113',
  '--sidebar-text': '#a3a5a6',
  '--sidebar-text-active': '#f0efeb',
  '--sidebar-hover': '#22262b',
  '--sidebar-border': '#2a2e33',
  '--sidebar-glow': 'rgba(126, 167, 201, 0.18)',
  '--header-shadow': '0 1px 0 var(--border-color)',
  '--el-color-primary': '#7ea7c9',
  '--el-color-primary-light-3': '#94b7d3',
  '--el-color-primary-light-5': '#a8c6dd',
  '--el-color-primary-light-7': '#38424b',
  '--el-color-primary-light-8': '#2b333a',
  '--el-color-primary-light-9': '#222a31',
  '--el-color-primary-dark-2': '#5d8db5',
  '--el-color-success': '#7aa88a',
  '--el-color-warning': '#c9a661',
  '--el-color-danger': '#cf8079',
  '--el-color-error': '#cf8079',
  '--el-color-info': '#8b8f93',
  '--el-bg-color': '#15171a',
  '--el-bg-color-page': '#1b1e22',
  '--el-bg-color-overlay': '#1e2126',
  '--el-text-color-primary': '#e8e7e3',
  '--el-text-color-regular': '#c9c8c4',
  '--el-text-color-secondary': '#a3a5a6',
  '--el-text-color-placeholder': '#6d7073',
  '--el-border-color': '#2f3338',
  '--el-border-color-light': '#292d32',
  '--el-border-color-lighter': '#24282c',
  '--el-border-color-extra-light': '#202327',
  '--el-fill-color': '#23272c',
  '--el-fill-color-light': '#1e2126',
  '--el-fill-color-lighter': '#1b1e22',
  '--el-fill-color-extra-light': '#17191c',
  '--el-box-shadow': '0 1px 2px rgba(0, 0, 0, 0.4)',
  '--el-box-shadow-light': '0 1px 2px rgba(0, 0, 0, 0.35)',
  '--el-box-shadow-lighter': '0 1px 1px rgba(0, 0, 0, 0.3)',
  '--el-box-shadow-dark': '0 10px 28px -10px rgba(0, 0, 0, 0.7)'
}

/** 暖炭：偏棕的暗底 + 陶土橙作为唯一强调色，夜晚阅读更柔和 */
const DUSK: TokenMap = {
  '--bg-primary': '#1a1816',
  '--bg-secondary': '#21201d',
  '--bg-tertiary': '#2a2824',
  '--text-primary': '#ece6dd',
  '--text-color': '#ece6dd',
  '--text-secondary': '#a9a196',
  '--text-tertiary': '#7c7469',
  '--accent-color': '#c47a4e',
  '--accent-secondary': '#a85f38',
  '--accent-contrast': '#1a1008',
  '--accent-soft': 'rgba(196, 122, 78, 0.1)',
  '--border-color': '#33302b',
  '--border-strong': '#423e37',
  '--card-bg': '#21201d',
  '--hover-bg': '#2a2824',
  '--shadow-color': 'rgba(0, 0, 0, 0.4)',
  '--radius-card': '10px',
  '--radius-control': '8px',
  '--sidebar-bg-start': '#191715',
  '--sidebar-bg-end': '#141312',
  '--sidebar-text': '#a9a196',
  '--sidebar-text-active': '#f3ece1',
  '--sidebar-hover': '#27241f',
  '--sidebar-border': '#302c26',
  '--sidebar-glow': 'rgba(196, 122, 78, 0.18)',
  '--header-shadow': '0 1px 0 var(--border-color)',
  '--el-color-primary': '#c47a4e',
  '--el-color-primary-light-3': '#d19370',
  '--el-color-primary-light-5': '#dbab90',
  '--el-color-primary-light-7': '#45352b',
  '--el-color-primary-light-8': '#352a23',
  '--el-color-primary-light-9': '#2a231e',
  '--el-color-primary-dark-2': '#a85f38',
  '--el-color-success': '#87a57a',
  '--el-color-warning': '#c9a661',
  '--el-color-danger': '#c98072',
  '--el-color-error': '#c98072',
  '--el-color-info': '#92897d',
  '--el-bg-color': '#1a1816',
  '--el-bg-color-page': '#21201d',
  '--el-bg-color-overlay': '#252320',
  '--el-text-color-primary': '#ece6dd',
  '--el-text-color-regular': '#cdc5b9',
  '--el-text-color-secondary': '#a9a196',
  '--el-text-color-placeholder': '#7a7267',
  '--el-border-color': '#37332d',
  '--el-border-color-light': '#2f2c27',
  '--el-border-color-lighter': '#2a2723',
  '--el-border-color-extra-light': '#242220',
  '--el-fill-color': '#2a2824',
  '--el-fill-color-light': '#232119',
  '--el-fill-color-lighter': '#1f1d1a',
  '--el-fill-color-extra-light': '#1c1a18',
  '--el-box-shadow': '0 1px 2px rgba(0, 0, 0, 0.4)',
  '--el-box-shadow-light': '0 1px 2px rgba(0, 0, 0, 0.35)',
  '--el-box-shadow-lighter': '0 1px 1px rgba(0, 0, 0, 0.3)',
  '--el-box-shadow-dark': '0 10px 28px -10px rgba(0, 0, 0, 0.7)'
}

/** 天气主题的内容层：按昼夜在两套中性底色间切换（背景由 Canvas 负责） */
const WEATHER_DAY: TokenMap = {
  '--bg-primary': '#eef1f4',
  '--bg-secondary': '#ffffff',
  '--bg-tertiary': '#e9ecef',
  '--text-primary': '#1d2126',
  '--text-color': '#1d2126',
  '--text-secondary': '#565d66',
  '--text-tertiary': '#868d96',
  '--accent-color': '#3a6f8f',
  '--accent-secondary': '#2f5f7d',
  '--accent-contrast': '#ffffff',
  '--accent-soft': 'rgba(58, 111, 143, 0.08)',
  '--border-color': '#dcdfe3',
  '--border-strong': '#c6cad0',
  '--card-bg': 'rgba(255, 255, 255, 0.94)',
  '--hover-bg': '#f1f3f5',
  '--shadow-color': 'rgba(25, 30, 36, 0.10)',
  '--radius-card': '10px',
  '--radius-control': '8px',
  '--sidebar-bg-start': '#2a3138',
  '--sidebar-bg-end': '#21262b',
  '--sidebar-text': '#b9c0c6',
  '--sidebar-text-active': '#ffffff',
  '--sidebar-hover': '#353d44',
  '--sidebar-border': '#3a4249',
  '--sidebar-glow': 'rgba(58, 111, 143, 0.18)',
  '--header-shadow': '0 1px 0 var(--border-color)'
}

const WEATHER_NIGHT: TokenMap = {
  ...DARK,
  '--bg-primary': '#12161b',
  '--bg-secondary': '#1a1f25',
  '--card-bg': 'rgba(26, 31, 37, 0.92)',
  '--accent-color': '#86a9c4'
}

const THEME_TOKENS: Record<ThemeType, TokenMap> = {
  light: LIGHT,
  dark: DARK,
  dusk: DUSK,
  weather: WEATHER_DAY
}

const THEME_BODY_CLASS: Record<ThemeType, string[]> = {
  light: ['theme-light'],
  dark: ['theme-dark'],
  dusk: ['theme-dusk'],
  weather: ['theme-weather']
}

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeType>('light')
  /** 天气主题下的当前天气快照（由 WeatherBackground / 天气服务写入） */
  const weather = ref<WeatherSnapshot | null>(null)
  /** 是否已拿到天气（未拿到时用默认晴/夜） */
  const weatherReady = ref(false)

  const availableThemes = computed(() => [
    { value: 'light' as ThemeType, label: '纸白', icon: 'sun', hint: '明亮、干净' },
    { value: 'dark' as ThemeType, label: '石墨', icon: 'moon', hint: '夜间低光' },
    { value: 'dusk' as ThemeType, label: '暖炭', icon: 'sunset', hint: '暖色暗调' },
    {
      value: 'weather' as ThemeType,
      label: weather.value?.city ? `天气·${weather.value.city}` : '天气实景',
      icon: weatherIconName(weather.value),
      hint: weather.value ? `${Math.round(weather.value.temperature ?? 0)}° ${weatherLabel(weather.value.code)}` : '跟随当地天气'
    }
  ])

  /** WMO code → 展示名 */
  function weatherLabel(code: number): string {
    if (code === 0) return '晴'
    if (code <= 2) return '少云'
    if (code === 3) return '阴'
    if (code === 45 || code === 48) return '雾'
    if (code >= 51 && code <= 57) return '毛毛雨'
    if (code >= 61 && code <= 67) return '雨'
    if (code >= 71 && code <= 77) return '雪'
    if (code >= 80 && code <= 82) return '阵雨'
    if (code >= 85 && code <= 86) return '阵雪'
    if (code >= 95) return '雷雨'
    return '多云'
  }

  /** WMO code → 图标名（对应 AppIcon 的 icon 集合） */
  function weatherIconName(w: WeatherSnapshot | null): string {
    const code = w?.code ?? 0
    const isDay = w?.isDay ?? true
    if (code === 0) return isDay ? 'sun' : 'moon'
    if (code <= 2) return isDay ? 'partly-cloudy' : 'cloud-moon'
    if (code === 3) return 'cloud'
    if (code === 45 || code === 48) return 'fog'
    if (code >= 51 && code <= 57) return 'rain'
    if (code >= 61 && code <= 67) return 'rain'
    if (code >= 71 && code <= 77) return 'snow'
    if (code >= 80 && code <= 82) return 'rain'
    if (code >= 85 && code <= 86) return 'snow'
    if (code >= 95) return 'storm'
    return 'cloud'
  }

  /**
   * 应用主题：写入 CSS 变量 + body 类名
   * 天气主题额外需要根据昼夜选择内容层色板
   */
  const applyTheme = (theme: ThemeType) => {
    const body = document.body
    const root = document.documentElement
    // 清理所有主题类
    Object.values(THEME_BODY_CLASS).flat().forEach((c) => body.classList.remove(c))
    body.classList.add(...THEME_BODY_CLASS[theme])
    body.classList.toggle('weather-night', theme === 'weather' && weather.value ? !weather.value.isDay : false)

    const tokens =
      theme === 'weather'
        ? weather.value && !weather.value.isDay
          ? WEATHER_NIGHT
          : WEATHER_DAY
        : THEME_TOKENS[theme]

    // 先清掉上一套主题可能多出来的变量（例如天气夜间自定义的少量键）
    Object.keys({ ...LIGHT }).forEach((k) => {
      if (!(k in tokens)) root.style.removeProperty(k)
    })
    Object.entries(tokens).forEach(([k, v]) => root.style.setProperty(k, v))

    document.documentElement.style.colorScheme = theme === 'dark' || theme === 'dusk' ? 'dark' : 'light'
  }

  // 设置主题
  const setTheme = (theme: ThemeType) => {
    currentTheme.value = theme
    localStorage.setItem('theme', theme)
    applyTheme(theme)
    return true
  }

  /** 天气数据更新（供天气服务写入）：主题是 weather 时立即重绘内容层色板 */
  const setWeather = (snap: WeatherSnapshot) => {
    weather.value = snap
    weatherReady.value = true
    if (currentTheme.value === 'weather') applyTheme('weather')
  }

  // 初始化主题
  const initTheme = () => {
    const enabled: ThemeType[] = ['light', 'dark', 'dusk', 'weather']
    const saved = localStorage.getItem('theme') as ThemeType | null
    const theme = saved && enabled.includes(saved) ? saved : 'light'
    setTheme(theme)
  }

  return {
    currentTheme,
    weather,
    weatherReady,
    availableThemes,
    setTheme,
    setWeather,
    initTheme,
    applyTheme,
    weatherLabel,
    weatherIconName
  }
})
