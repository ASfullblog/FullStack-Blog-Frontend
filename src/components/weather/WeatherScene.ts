/**
 * 天气背景引擎（纯 Canvas 2D）
 *
 * 为什么不用 three.js：天气主题只要"整屏氛围"，2D 分层粒子已经足够，
 * 而且首包体积小（three.js ~600KB）、首帧即出（毫秒级），手机上更省电。
 *
 * 绘制原则（参考"天幕"的观感，但克制）：
 * - 天空底色跟随昼夜连续变化（黎明/白天/黄昏/夜晚），而不是硬切
 * - 云层是多层柔和噪声团，缓慢横向漂移，越靠近当前天气越厚
 * - 雨是斜向细线，雪是缓慢飘落的小点，雷暴有低频闪光（不做刺眼白闪）
 * - 首帧立即绘制静态天空，粒子随后渐进出现，避免"先黑屏再出画面"
 */

export interface WeatherSceneOptions {
  code: number
  isDay: boolean
  /** 日照强度 0..1，由时段推算，用于天空亮度 */
  daylight?: number
  reduced?: boolean
}

interface Cloud {
  x: number
  y: number
  r: number
  speed: number
  alpha: number
  puffs: { dx: number; dy: number; r: number }[]
}

interface Drop {
  x: number
  y: number
  len: number
  speed: number
  alpha: number
}

interface Flake {
  x: number
  y: number
  r: number
  speed: number
  drift: number
  phase: number
}

type Kind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm'

function kindOf(code: number): Kind {
  if (code === 0) return 'clear'
  if (code <= 2) return 'partly'
  if (code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if (code >= 61 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return 'rain'
  if (code >= 85 && code <= 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'partly'
}

/** 天空色板：[顶, 中, 底] */
function skyPalette(kind: Kind, isDay: boolean, daylight: number): string[] {
  const day = Math.max(0, Math.min(1, daylight))
  if (!isDay) {
    // 夜空：深蓝黑 → 墨蓝
    if (kind === 'storm') return ['#0b1018', '#151d29', '#202b3a']
    return ['#0d1219', '#17202c', '#232e3d']
  }
  switch (kind) {
    case 'clear':
      return [
        mix('#8796a6', '#5f86ad', day),
        mix('#c9cfd3', '#a8c6de', day),
        mix('#e4e6e6', '#dae6ef', day)
      ]
    case 'partly':
      return [mix('#8d99a5', '#6d8fae', day), mix('#c3c9ce', '#b3c7d6', day), mix('#e0e3e5', '#dfe7ec', day)]
    case 'cloudy':
      return [mix('#8a8f94', '#7b868f', day), mix('#b6bbbf', '#adbabf', day), mix('#dcdfe1', '#d9e1e3', day)]
    case 'fog':
      return [mix('#a9adad', '#9da8ac', day), mix('#c7cbcb', '#c3ccd0', day), mix('#e2e5e5', '#e2e8ea', day)]
    case 'rain':
    case 'drizzle':
      return [mix('#6f767c', '#5d6c78', day), mix('#9ea5aa', '#97a6b0', day), mix('#cdd2d5', '#ccd5da', day)]
    case 'snow':
      return [mix('#a7adb3', '#93a6b4', day), mix('#cdd2d6', '#c6d5df', day), mix('#e9ebec', '#eaf0f4', day)]
    case 'storm':
      return [mix('#4f555c', '#414c57', day), mix('#7d858c', '#74838f', day), mix('#bcc1c4', '#b9c6cf', day)]
  }
}

/** 十六进制颜色线性插值 */
function mix(a: string, b: string, t: number): string {
  const pa = hex(a)
  const pb = hex(b)
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t)
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t)
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t)
  return `rgb(${r},${g},${bl})`
}

function hex(h: string): [number, number, number] {
  const s = h.replace('#', '')
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
}

export class WeatherScene {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private opts: WeatherSceneOptions
  private w = 0
  private h = 0
  private dpr = 1
  private raf = 0
  private last = 0
  private clouds: Cloud[] = []
  private drops: Drop[] = []
  private flakes: Flake[] = []
  private stars: { x: number; y: number; r: number; phase: number }[] = []
  private lightning = 0
  private nextLightning = 2400
  private sinceLightning = 0
  private disposed = false
  private onResize = () => this.resize()

  constructor(canvas: HTMLCanvasElement, opts: WeatherSceneOptions) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('canvas 2d unavailable')
    this.ctx = ctx
    this.opts = opts
    this.resize()
    this.build()
    // 首帧：先画出静态天空，避免切换瞬间的空白
    this.drawSky(0)
    window.addEventListener('resize', this.onResize)
    if (!opts.reduced) this.start()
  }

  /** 天气 / 昼夜变化时热更新，不重建画布 */
  update(opts: Partial<WeatherSceneOptions>) {
    this.opts = { ...this.opts, ...opts }
    this.build()
    this.drawSky(0)
  }

  private resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.w = this.canvas.clientWidth || window.innerWidth
    this.h = this.canvas.clientHeight || window.innerHeight
    this.canvas.width = Math.round(this.w * this.dpr)
    this.canvas.height = Math.round(this.h * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    if (this.drops.length || this.flakes.length || this.clouds.length) this.build()
  }

  private build() {
    const kind = kindOf(this.opts.code)
    const area = this.w * this.h
    const rand = mulberry32(20260101 + this.opts.code * 7 + (this.opts.isDay ? 0 : 1))

    // 云：晴天只有 2 层淡云，阴/雨/雾逐渐增多且更暗
    const cloudCount =
      kind === 'clear' ? 2 : kind === 'partly' ? 4 : kind === 'cloudy' ? 7 : kind === 'fog' ? 6 : kind === 'storm' ? 8 : 6
    this.clouds = []
    for (let i = 0; i < cloudCount; i++) {
      const r = (0.16 + rand() * 0.22) * this.w
      const puffs = []
      const n = 5 + Math.floor(rand() * 4)
      for (let p = 0; p < n; p++) {
        puffs.push({
          dx: (rand() - 0.5) * r * 1.9,
          dy: (rand() - 0.5) * r * 0.45,
          r: r * (0.38 + rand() * 0.34)
        })
      }
      this.clouds.push({
        x: rand() * this.w,
        y: this.h * (0.06 + rand() * 0.42),
        r,
        speed: (0.008 + rand() * 0.02) * (1 + i * 0.25),
        alpha: (kind === 'clear' ? 0.18 : 0.28) + rand() * 0.22,
        puffs
      })
    }

    // 雨
    const rainTarget =
      kind === 'drizzle' ? Math.round(area / 26000) : kind === 'rain' ? Math.round(area / 9000) : kind === 'storm' ? Math.round(area / 6500) : 0
    this.drops = []
    for (let i = 0; i < rainTarget; i++) {
      this.drops.push({
        x: rand() * this.w,
        y: rand() * this.h,
        len: 10 + rand() * (kind === 'drizzle' ? 8 : 18),
        speed: (kind === 'storm' ? 950 : kind === 'drizzle' ? 420 : 720) * (0.75 + rand() * 0.5),
        alpha: 0.18 + rand() * 0.32
      })
    }

    // 雪
    const snowTarget = kind === 'snow' ? Math.round(area / 12000) : 0
    this.flakes = []
    for (let i = 0; i < snowTarget; i++) {
      this.flakes.push({
        x: rand() * this.w,
        y: rand() * this.h,
        r: 0.8 + rand() * 2.2,
        speed: 22 + rand() * 48,
        drift: 0.4 + rand() * 0.8,
        phase: rand() * Math.PI * 2
      })
    }

    // 星空（夜间）
    this.stars = []
    if (!this.opts.isDay && (kind === 'clear' || kind === 'partly')) {
      const n = Math.min(140, Math.round(area / 9000))
      for (let i = 0; i < n; i++) {
        this.stars.push({
          x: rand() * this.w,
          y: rand() * this.h * 0.6,
          r: 0.5 + rand() * 1.1,
          phase: rand() * Math.PI * 2
        })
      }
    }
  }

  private start() {
    const loop = (t: number) => {
      if (this.disposed) return
      const dt = Math.min(64, t - (this.last || t))
      this.last = t
      this.step(dt, t)
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  private step(dt: number, t: number) {
    const s = dt / 1000
    const kind = kindOf(this.opts.code)

    // 天空
    this.drawSky(t)

    // 云
    const cloudColor = this.opts.isDay ? '255,255,255' : '190,205,220'
    for (const c of this.clouds) {
      c.x += c.speed * s * 60 * 0.35
      if (c.x - c.r * 2 > this.w) c.x = -c.r * 2
      this.ctx.save()
      this.ctx.globalAlpha = c.alpha * (kind === 'storm' ? 0.55 : 1)
      const g = this.ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 1.1)
      g.addColorStop(0, `rgba(${cloudColor},0.85)`)
      g.addColorStop(1, `rgba(${cloudColor},0)`)
      this.ctx.fillStyle = g
      for (const p of c.puffs) {
        this.ctx.beginPath()
        this.ctx.ellipse(c.x + p.dx, c.y + p.dy, p.r, p.r * 0.62, 0, 0, Math.PI * 2)
        this.ctx.fill()
      }
      this.ctx.restore()
    }

    // 雾：底部一层发光白雾
    if (kind === 'fog') {
      const g = this.ctx.createLinearGradient(0, this.h * 0.45, 0, this.h)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(1, this.opts.isDay ? 'rgba(255,255,255,0.55)' : 'rgba(160,175,190,0.28)')
      this.ctx.fillStyle = g
      this.ctx.fillRect(0, this.h * 0.45, this.w, this.h * 0.55)
    }

    // 雨
    if (this.drops.length) {
      this.ctx.lineCap = 'round'
      this.ctx.strokeStyle = this.opts.isDay ? 'rgba(70,90,110,0.55)' : 'rgba(170,190,210,0.45)'
      this.ctx.lineWidth = 1
      const slant = kind === 'storm' ? 0.42 : 0.22
      for (const d of this.drops) {
        d.y += d.speed * s
        d.x += d.speed * s * slant
        if (d.y > this.h + 20) {
          d.y = -20
          d.x = Math.random() * this.w
        }
        if (d.x > this.w + 20) d.x = -20
        this.ctx.globalAlpha = d.alpha
        this.ctx.beginPath()
        this.ctx.moveTo(d.x, d.y)
        this.ctx.lineTo(d.x - d.len * slant, d.y - d.len)
        this.ctx.stroke()
      }
      this.ctx.globalAlpha = 1
    }

    // 雪
    if (this.flakes.length) {
      this.ctx.fillStyle = 'rgba(255,255,255,0.85)'
      for (const f of this.flakes) {
        f.y += f.speed * s
        f.x += Math.sin(t / 1400 + f.phase) * f.drift * 0.4
        if (f.y > this.h + 6) {
          f.y = -6
          f.x = Math.random() * this.w
        }
        this.ctx.beginPath()
        this.ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        this.ctx.fill()
      }
    }

    // 雷暴：低频微闪（不做整屏白闪）
    if (kind === 'storm') {
      this.sinceLightning += dt
      if (this.sinceLightning > this.nextLightning) {
        this.lightning = 1
        this.sinceLightning = 0
        this.nextLightning = 3500 + Math.random() * 6000
      }
      if (this.lightning > 0) {
        this.lightning = Math.max(0, this.lightning - s * 1.8)
        this.ctx.fillStyle = `rgba(226,235,255,${0.16 * this.lightning})`
        this.ctx.fillRect(0, 0, this.w, this.h)
      }
    }
  }

  private drawSky(t: number) {
    const kind = kindOf(this.opts.code)
    const daylight = this.opts.daylight ?? (this.opts.isDay ? 1 : 0)
    const [top, mid, bottom] = skyPalette(kind, this.opts.isDay, daylight)
    const g = this.ctx.createLinearGradient(0, 0, 0, this.h)
    g.addColorStop(0, top)
    g.addColorStop(0.55, mid)
    g.addColorStop(1, bottom)
    this.ctx.fillStyle = g
    this.ctx.fillRect(0, 0, this.w, this.h)

    // 极淡的大气光晕（晴/少云时，太阳方位）
    if (this.opts.isDay && (kind === 'clear' || kind === 'partly')) {
      const sunX = this.w * 0.78
      const sunY = this.h * 0.16
      const halo = this.ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, this.w * 0.5)
      halo.addColorStop(0, 'rgba(255,246,225,0.30)')
      halo.addColorStop(1, 'rgba(255,246,225,0)')
      this.ctx.fillStyle = halo
      this.ctx.fillRect(0, 0, this.w, this.h)
    }

    // 星空
    if (this.stars.length) {
      for (const st of this.stars) {
        const tw = 0.35 + 0.35 * Math.sin(t / 900 + st.phase)
        this.ctx.fillStyle = `rgba(230,238,248,${tw})`
        this.ctx.beginPath()
        this.ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2)
        this.ctx.fill()
      }
    }

    // 底部轻微压暗，保证页脚与内容边缘有层次
    const foot = this.ctx.createLinearGradient(0, this.h * 0.72, 0, this.h)
    foot.addColorStop(0, 'rgba(0,0,0,0)')
    foot.addColorStop(1, this.opts.isDay ? 'rgba(30,40,50,0.10)' : 'rgba(0,0,0,0.22)')
    this.ctx.fillStyle = foot
    this.ctx.fillRect(0, this.h * 0.72, this.w, this.h * 0.28)
  }

  destroy() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.onResize)
  }
}

/** 可复现的伪随机数（同一天气每次构建的云朵排布一致，切换主题不会"跳一下"） */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
