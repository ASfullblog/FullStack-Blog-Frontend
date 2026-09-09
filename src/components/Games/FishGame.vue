<template>
  <!-- 大鱼吃小鱼游戏组件 -->
  <div class="play-card fish-play-card">
    <!-- 顶部信息栏 -->
    <div class="fish-top-bar ocean-gradient">
      <div class="fish-title-section">
        <span class="fish-game-icon">🐟</span>
        <span class="fish-game-name">深海大冒险</span>
      </div>
      <div class="fish-stats-row">
        <div class="fish-stat-box">
          <span class="fish-stat-icon">💎</span>
          <div class="fish-stat-info">
            <span class="fish-stat-label">分数</span>
            <span class="fish-stat-num">{{ fishScore }}</span>
          </div>
        </div>
        <div class="fish-stat-box">
          <span class="fish-stat-icon">📏</span>
          <div class="fish-stat-info">
            <span class="fish-stat-label">大小</span>
            <span class="fish-stat-num size">{{ fishSize }}/{{ MAX_FISH_SIZE }}</span>
          </div>
        </div>
        <div class="fish-stat-box">
          <span class="fish-stat-icon">⭐</span>
          <div class="fish-stat-info">
            <span class="fish-stat-label">关卡</span>
            <span class="fish-stat-num level">{{ fishLevel }}/{{ LEVELS.length }}</span>
          </div>
        </div>
      </div>
      <button v-if="fishGameActive && !fishGamePaused" class="fish-pause-btn" @click="pauseFishGame">
        <span class="pause-icon">⏸</span>
      </button>
    </div>

    <!-- 游戏主体区域 -->
    <div class="fish-game-body">
      <!-- 中间：游戏画布 -->
      <div class="fish-canvas-area">
        <div class="fish-canvas-wrapper">
          <canvas
            ref="fishCanvas"
            class="fish-canvas"
            width="600"
            height="350"
            @mousemove="handleFishMousemove"
            @mouseenter="handleFishMouseEnter"
            @mouseleave="handleFishMouseLeave"
          ></canvas>

          <!-- 开始遮罩 -->
          <div v-if="!fishGameActive && fishScore === 0" class="fish-overlay ocean-start-overlay">
            <div class="fish-overlay-content">
              <div class="ocean-waves">🌊</div>
              <h3 class="fish-overlay-title ocean-title">深海大冒险</h3>
              <p class="fish-overlay-subtitle">在神秘的海底世界，控制小鱼成长，<br>吃掉比你小的鱼，避开危险的大鱼！</p>
              <div class="fish-overlay-buttons">
                <button class="fish-btn fish-btn-primary" @click="startFishGame">
                  <span>▶</span> 开始游戏
                </button>
              </div>
            </div>
          </div>

          <!-- 暂停遮罩 -->
          <div v-if="fishGamePaused" class="fish-overlay fish-pause-overlay">
            <div class="fish-overlay-content">
              <div class="fish-logo">⏸</div>
              <h3 class="fish-overlay-title">游戏暂停</h3>
              <div class="fish-overlay-buttons">
                <button class="fish-btn fish-btn-primary" @click="resumeFishGame">
                  <span>▶</span> 继续游戏
                </button>
                <button class="fish-btn fish-btn-danger" @click="endFishGame">
                  <span>✕</span> 结束游戏
                </button>
              </div>
            </div>
          </div>

          <!-- 游戏结束遮罩 -->
          <div v-if="!fishGameActive && fishScore > 0 && !fishGameWon" class="fish-overlay fish-gameover-overlay">
            <div class="fish-overlay-content compact">
              <div class="fish-logo gameover-icon">💀</div>
              <h3 class="fish-overlay-title tiny">游戏结束</h3>
              <p class="fish-overlay-subtitle tiny">被大鱼吃掉了！</p>
              <div class="fish-final-score-box compact gameover-box">
                <span class="final-score-label">最终得分</span>
                <span class="final-score-value gameover-score">{{ fishScore }}</span>
              </div>
              <div class="fish-overlay-buttons horizontal">
                <button class="fish-btn fish-btn-primary tiny" @click="resetFishGame">
                  <span>↻</span> 再来
                </button>
                <button class="fish-btn fish-btn-secondary tiny" @click="endFishGame">
                  <span>←</span> 返回
                </button>
              </div>
            </div>
          </div>

          <!-- 游戏胜利遮罩 -->
          <div v-if="fishGameWon" class="fish-overlay fish-win-overlay">
            <!-- 礼花容器 -->
            <div class="fireworks-container">
              <div v-for="n in 20" :key="n" class="firework" :style="getFireworkStyle(n)"></div>
            </div>
            <div class="fish-overlay-content compact">
              <div class="fish-logo large victory-icon">🏆</div>
              <h3 class="fish-overlay-title tiny victory-title">恭喜通关！</h3>
              <p class="fish-overlay-subtitle tiny">你已成为海洋霸主！</p>
              <div class="fish-final-score-box compact victory-box">
                <span class="final-score-label">最终得分</span>
                <span class="final-score-value victory-score">{{ fishScore }}</span>
              </div>
              <div class="fish-overlay-buttons horizontal">
                <button class="fish-btn fish-btn-primary tiny" @click="resetFishGame">
                  <span>↻</span> 再玩
                </button>
                <button class="fish-btn fish-btn-secondary tiny" @click="endFishGame">
                  <span>←</span> 返回
                </button>
              </div>
            </div>
          </div>

          <!-- 关卡完成遮罩 -->
          <div v-if="fishLevelComplete" class="fish-overlay fish-level-overlay">
            <div class="fish-overlay-content compact">
              <div class="fish-logo">⭐</div>
              <h3 class="fish-overlay-title tiny">关卡完成！</h3>
              <div class="fish-level-info">
                <div class="level-info-item">
                  <span class="info-label">当前关卡</span>
                  <span class="info-value">{{ fishLevel - 1 }}</span>
                </div>
                <div class="level-info-item">
                  <span class="info-label">下一关卡</span>
                  <span class="info-value">{{ fishLevel }}</span>
                </div>
                <div class="level-info-item">
                  <span class="info-label">当前分数</span>
                  <span class="info-value">{{ fishScore }}</span>
                </div>
              </div>
              <div class="fish-overlay-buttons">
                <button class="fish-btn fish-btn-primary" @click="nextLevel">
                  <span>▶</span> 下一关
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

// ==================== 常量 ====================
const MAX_FISH_SIZE = 100

const LEVELS = [
  { level: 1, targetScore: 300, enemySpeed: 1.5, spawnRate: 0.04, maxEnemies: 12, bigFishChance: 0.3 },
  { level: 2, targetScore: 800, enemySpeed: 2.2, spawnRate: 0.055, maxEnemies: 15, bigFishChance: 0.4 },
  { level: 3, targetScore: 1500, enemySpeed: 2.8, spawnRate: 0.07, maxEnemies: 20, bigFishChance: 0.5 },
  { level: 4, targetScore: 2500, enemySpeed: 3.5, spawnRate: 0.085, maxEnemies: 25, bigFishChance: 0.6 },
  { level: 5, targetScore: 4000, enemySpeed: 4.5, spawnRate: 0.1, maxEnemies: 30, bigFishChance: 0.7 }
]

const EDIBLE_EMOJIS = ['🐟', '🐠', '🦐', '🦑', '🐡', '🦀']
const DANGEROUS_EMOJIS = ['🦈', '🐋', '🐊', '🦖', '🐙', '🦞']
const BOMB_EMOJI = '💣'

// ==================== 类型定义 ====================
interface EnemyFish {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  emoji: string
  type: 'edible' | 'dangerous' | 'bomb'
  bombTimer?: number
  bombMaxTime?: number
}

interface FireworkParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface Bubble {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
}

// ==================== 响应式数据 ====================
const fishCanvas = ref<HTMLCanvasElement | null>(null)
let fishCtx: CanvasRenderingContext2D | null = null

const fishScore = ref(0)
const fishSize = ref(20)
const fishGameActive = ref(false)
const fishGamePaused = ref(false)
const fishLevel = ref(1)
const fishGameWon = ref(false)
const fishLevelComplete = ref(false)

let fishGameLoop: number | null = null
let playerFish: { x: number; y: number; size: number } | null = null
let enemyFishes: EnemyFish[] = []
let mouseX = 0
let mouseY = 0
let bubbles: Bubble[] = []
let fireworks: FireworkParticle[] = []
let isLevelUpPending = false

// ==================== 方法 ====================
/**
 * 初始化大鱼吃小鱼画布
 * 功能：获取canvas上下文并绘制初始画面
 */
const initFishCanvas = () => {
  if (fishCanvas.value) {
    fishCtx = fishCanvas.value.getContext('2d')
    drawFishGame()
  }
}

/**
 * 初始化气泡
 * 功能：创建海洋背景气泡
 */
const initBubbles = () => {
  bubbles = []
  for (let i = 0; i < 15; i++) {
    bubbles.push({
      x: Math.random() * 700,
      y: Math.random() * 450,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.3 + 0.1
    })
  }
}

/**
 * 更新气泡位置
 * 功能：让气泡向上飘动
 */
const updateBubbles = () => {
  bubbles.forEach(bubble => {
    bubble.y -= bubble.speed
    if (bubble.y < -10) {
      bubble.y = 460
      bubble.x = Math.random() * 700
    }
  })
}

/**
 * 绘制气泡
 * 功能：在画布上绘制海洋气泡
 */
const drawBubbles = (ctx: CanvasRenderingContext2D) => {
  bubbles.forEach(bubble => {
    ctx.beginPath()
    ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity})`
    ctx.fill()
    ctx.beginPath()
    ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.3, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 1.5})`
    ctx.fill()
  })
}

/**
 * 开始大鱼吃小鱼游戏
 * 功能：重置游戏状态并启动游戏循环
 */
const startFishGame = () => {
  if (fishGameActive.value) return

  fishScore.value = 0
  fishSize.value = 20
  fishLevel.value = 1
  fishGamePaused.value = false
  fishGameWon.value = false
  fishLevelComplete.value = false
  playerFish = { x: 350, y: 225, size: 20 }
  enemyFishes = []
  mouseX = 350
  mouseY = 225

  initBubbles()
  drawFishGame()

  setTimeout(() => {
    fishGameActive.value = true
    fishGamePaused.value = false
    fishLevelComplete.value = false
    fishUpdate()
  }, 100)
}

/**
 * 暂停大鱼吃小鱼游戏
 * 功能：暂停游戏循环
 */
const pauseFishGame = () => {
  if (!fishGameActive.value) return
  fishGamePaused.value = true
  if (fishGameLoop) {
    cancelAnimationFrame(fishGameLoop)
    fishGameLoop = null
  }
}

/**
 * 继续大鱼吃小鱼游戏
 * 功能：恢复游戏循环
 */
const resumeFishGame = () => {
  if (!fishGameActive.value || !fishGamePaused.value) return
  fishGamePaused.value = false
  fishUpdate()
}

/**
 * 结束大鱼吃小鱼游戏
 * 功能：停止游戏循环，重置所有状态
 */
const endFishGame = () => {
  fishGameActive.value = false
  fishGamePaused.value = false
  fishGameWon.value = false
  fishLevelComplete.value = false
  if (fishGameLoop) {
    cancelAnimationFrame(fishGameLoop)
    fishGameLoop = null
  }
  fishScore.value = 0
  fishSize.value = 20
  fishLevel.value = 1
  playerFish = null
  enemyFishes = []
  drawFishGame()
}

/**
 * 进入下一关
 * 功能：清空敌人，继续游戏
 */
const nextLevel = () => {
  fishLevelComplete.value = false
  fishGamePaused.value = false
  isLevelUpPending = false
  enemyFishes = []
  fishUpdate()
}

/**
 * 重置大鱼吃小鱼游戏
 * 功能：结束当前游戏并重新开始
 */
const resetFishGame = () => {
  endFishGame()
  setTimeout(() => {
    startFishGame()
  }, 100)
}

/**
 * 获取当前关卡配置
 * 功能：返回当前关卡的游戏参数
 */
const getCurrentLevel = () => {
  return LEVELS[Math.min(fishLevel.value - 1, LEVELS.length - 1)]
}

/**
 * 检查是否升级
 * 功能：检查分数是否达到升级条件
 */
const checkLevelUp = () => {
  if (isLevelUpPending) return false

  const currentLevel = getCurrentLevel()
  if (fishScore.value >= currentLevel.targetScore && fishLevel.value < LEVELS.length) {
    isLevelUpPending = true
    fishLevel.value++
    fishLevelComplete.value = true
    fishGamePaused.value = true
    if (fishGameLoop) {
      cancelAnimationFrame(fishGameLoop)
      fishGameLoop = null
    }
    return true
  }
  return false
}

/**
 * 检查是否获胜
 * 功能：检查是否达到最大尺寸和最后一关目标分数
 */
const checkWin = () => {
  const currentLevel = getCurrentLevel()
  if (fishSize.value >= MAX_FISH_SIZE && fishScore.value >= currentLevel.targetScore) {
    fishGameWon.value = true
    fishGameActive.value = false
    if (fishGameLoop) {
      cancelAnimationFrame(fishGameLoop)
      fishGameLoop = null
    }
    return true
  }
  return false
}

/**
 * 创建炸弹烟花爆炸效果
 * 功能：在指定位置生成烟花粒子
 */
const createFirework = (x: number, y: number) => {
  const colors = ['#ff0000', '#ff6600', '#ffcc00', '#ff3300', '#ff9900', '#ffff00']
  const particleCount = 30

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5
    const speed = 2 + Math.random() * 4
    fireworks.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 60,
      maxLife: 60,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 4
    })
  }
}

/**
 * 更新烟花粒子
 * 功能：更新粒子位置和生命值
 */
const updateFireworks = () => {
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const p = fireworks[i]
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.1
    p.life--

    if (p.life <= 0) {
      fireworks.splice(i, 1)
    }
  }
}

/**
 * 绘制烟花粒子
 * 功能：在画布上绘制所有活跃的烟花粒子
 */
const drawFireworks = (ctx: CanvasRenderingContext2D) => {
  fireworks.forEach(p => {
    const alpha = p.life / p.maxLife
    const r = parseInt(p.color.slice(1, 3), 16)
    const g = parseInt(p.color.slice(3, 5), 16)
    const b = parseInt(p.color.slice(5, 7), 16)

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
    ctx.fill()

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * alpha * 2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`
    ctx.fill()
  })
}

/**
 * 绘制大鱼吃小鱼游戏
 * 功能：绘制海洋背景、玩家鱼和敌人鱼
 */
const drawFishGame = () => {
  if (!fishCtx || !fishCanvas.value) return

  const ctx = fishCtx
  const width = fishCanvas.value.width
  const height = fishCanvas.value.height

  // 绘制海洋渐变背景
  const oceanGradient = ctx.createLinearGradient(0, 0, 0, height)
  oceanGradient.addColorStop(0, '#006994')
  oceanGradient.addColorStop(0.3, '#005a7a')
  oceanGradient.addColorStop(0.6, '#003d5c')
  oceanGradient.addColorStop(1, '#001f3f')
  ctx.fillStyle = oceanGradient
  ctx.fillRect(0, 0, width, height)

  // 绘制海底光线效果
  ctx.save()
  ctx.globalCompositeOperation = 'overlay'
  for (let i = 0; i < 5; i++) {
    const rayGradient = ctx.createLinearGradient(
      i * 150 + 50, 0,
      i * 150 - 50, height
    )
    rayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)')
    rayGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)')
    rayGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = rayGradient
    ctx.beginPath()
    ctx.moveTo(i * 150 + 30, 0)
    ctx.lineTo(i * 150 + 70, 0)
    ctx.lineTo(i * 150 + 20, height)
    ctx.lineTo(i * 150 - 20, height)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  // 绘制海底沙地
  const sandGradient = ctx.createLinearGradient(0, height - 40, 0, height)
  sandGradient.addColorStop(0, 'rgba(194, 178, 128, 0.3)')
  sandGradient.addColorStop(1, 'rgba(194, 178, 128, 0.6)')
  ctx.fillStyle = sandGradient
  ctx.fillRect(0, height - 40, width, 40)

  // 绘制气泡
  drawBubbles(ctx)

  // 绘制玩家鱼
  if (playerFish) {
    const { x, y, size } = playerFish

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 1.8)
    gradient.addColorStop(0, 'rgba(46, 204, 64, 0.4)')
    gradient.addColorStop(1, 'rgba(46, 204, 64, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, size * 1.8, 0, Math.PI * 2)
    ctx.fill()

    ctx.font = '40px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🐳', x, y)
  }

  // 绘制敌人鱼
  enemyFishes.forEach(fish => {
    const enemy = fish as EnemyFish
    const { x, y, size, emoji, type, bombTimer, bombMaxTime } = enemy

    if (type === 'bomb') {
      const countdown = bombTimer !== undefined ? Math.ceil(bombTimer / 60) : 3
      const pulseIntensity = bombTimer !== undefined && bombMaxTime !== undefined
        ? (bombTimer / bombMaxTime) * 0.5 + 0.2
        : 0.5
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2)
      gradient.addColorStop(0, `rgba(255, 0, 0, ${pulseIntensity})`)
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, size * 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.font = '36px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(emoji, x, y)

      ctx.font = 'bold 20px Arial'
      ctx.fillStyle = countdown <= 1 ? '#ff0000' : '#ffff00'
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.strokeText(String(countdown), x, y - 15)
      ctx.fillText(String(countdown), x, y - 15)
    } else if (type === 'dangerous') {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5)
      gradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)')
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, size * 1.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.font = '40px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(emoji, x, y)
    } else {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 1.3)
      gradient.addColorStop(0, 'rgba(0, 255, 0, 0.3)')
      gradient.addColorStop(1, 'rgba(0, 255, 0, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, size * 1.3, 0, Math.PI * 2)
      ctx.fill()

      ctx.font = '32px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(emoji, x, y)
    }
  })

  // 绘制烟花效果
  drawFireworks(ctx)
}

/**
 * 更新大鱼吃小鱼游戏
 * 功能：更新游戏状态，处理碰撞和生成敌人
 */
const fishUpdate = () => {
  if (!fishGameActive.value || fishGamePaused.value || !playerFish) return

  if (checkWin()) {
    return
  }

  updateBubbles()

  const currentLevel = getCurrentLevel()

  // 玩家鱼跟随鼠标
  const dx = mouseX - playerFish.x
  const dy = mouseY - playerFish.y
  playerFish.x += dx * 0.05
  playerFish.y += dy * 0.05

  // 限制玩家在画布内
  playerFish.x = Math.max(playerFish.size, Math.min(fishCanvas.value!.width - playerFish.size, playerFish.x))
  playerFish.y = Math.max(playerFish.size, Math.min(fishCanvas.value!.height - playerFish.size, playerFish.y))

  // 生成敌人鱼
  if (enemyFishes.length < currentLevel.maxEnemies && Math.random() < currentLevel.spawnRate && playerFish) {
    const canvasHeight = fishCanvas.value!.height
    const canvasWidth = fishCanvas.value!.width

    const fromLeft = Math.random() < 0.5
    const rand = Math.random()
    let enemyType: EnemyFish['type'] = 'edible'
    let size: number
    let speedMultiplier = 1

    if (rand < 0.15) {
      enemyType = 'bomb'
      size = 25
      speedMultiplier = 1.2
      const bombEmoji = BOMB_EMOJI
      const startX = fromLeft ? -size : canvasWidth + size

      let y: number
      let attempts = 0
      do {
        y = Math.random() * (canvasHeight - size * 2) + size
        attempts++
      } while (attempts < 5 && Math.abs(y - playerFish.y) < 80)

      enemyFishes.push({
        x: startX,
        y: y,
        size: size,
        speedX: (fromLeft ? 1 : -1) * (Math.random() * currentLevel.enemySpeed + 0.5) * speedMultiplier,
        speedY: (Math.random() - 0.5) * 0.3,
        emoji: bombEmoji,
        type: enemyType,
        bombTimer: 180,
        bombMaxTime: 180
      } as EnemyFish)
    } else if (rand < currentLevel.bigFishChance + 0.2) {
      enemyType = 'dangerous'
      size = Math.random() * 15 + 25
      speedMultiplier = 0.7
      const emoji = DANGEROUS_EMOJIS[Math.floor(Math.random() * DANGEROUS_EMOJIS.length)]

      const startX = fromLeft ? -size : canvasWidth + size

      let y: number
      let attempts = 0
      do {
        y = Math.random() * (canvasHeight - size * 2) + size
        attempts++
      } while (attempts < 5 && Math.abs(y - playerFish.y) < 80)

      enemyFishes.push({
        x: startX,
        y: y,
        size: size,
        speedX: (fromLeft ? 1 : -1) * (Math.random() * currentLevel.enemySpeed + 0.5) * speedMultiplier,
        speedY: (Math.random() - 0.5) * 0.3,
        emoji: emoji,
        type: enemyType
      } as EnemyFish)
    } else {
      enemyType = 'edible'
      size = Math.random() * 12 + 10
      const emoji = EDIBLE_EMOJIS[Math.floor(Math.random() * EDIBLE_EMOJIS.length)]

      const startX = fromLeft ? -size : canvasWidth + size

      let y: number
      let attempts = 0
      do {
        y = Math.random() * (canvasHeight - size * 2) + size
        attempts++
      } while (attempts < 5 && Math.abs(y - playerFish.y) < 80)

      enemyFishes.push({
        x: startX,
        y: y,
        size: size,
        speedX: (fromLeft ? 1 : -1) * (Math.random() * currentLevel.enemySpeed + 0.5) * speedMultiplier,
        speedY: (Math.random() - 0.5) * 0.3,
        emoji: emoji,
        type: enemyType
      } as EnemyFish)
    }
  }

  // 更新敌人鱼位置
  enemyFishes.forEach(fish => {
    const enemy = fish as EnemyFish

    if (enemy.type === 'bomb' && enemy.bombTimer !== undefined) {
      enemy.bombTimer--
      if (enemy.bombTimer <= 0) {
        createFirework(enemy.x, enemy.y)

        if (playerFish) {
          const dx = enemy.x - playerFish.x
          const dy = enemy.y - playerFish.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < enemy.size + playerFish.size + 80) {
            fishGameActive.value = false
            if (fishGameLoop) {
              cancelAnimationFrame(fishGameLoop)
              fishGameLoop = null
            }
            return
          }
        }

        enemyFishes.splice(enemyFishes.indexOf(fish), 1)
      }
    }

    enemy.x += enemy.speedX
    enemy.y += enemy.speedY
  })

  // 碰撞检测
  if (playerFish) {
    for (let i = enemyFishes.length - 1; i >= 0; i--) {
      const enemy = enemyFishes[i] as EnemyFish
      const dx = enemy.x - playerFish.x
      const dy = enemy.y - playerFish.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < enemy.size + playerFish.size) {
        if (enemy.type === 'bomb') {
          fishGameActive.value = false
          if (fishGameLoop) {
            cancelAnimationFrame(fishGameLoop)
            fishGameLoop = null
          }
          return
        } else if (enemy.type === 'edible') {
          fishScore.value += Math.floor(enemy.size * 2)

          if (playerFish.size < MAX_FISH_SIZE) {
            playerFish.size = Math.min(MAX_FISH_SIZE, playerFish.size + 1)
          }
          fishSize.value = Math.floor(playerFish.size)
          enemyFishes.splice(i, 1)

          checkLevelUp()

          if (checkWin()) {
            return
          }
        } else if (enemy.type === 'dangerous') {
          fishGameActive.value = false
          if (fishGameLoop) {
            cancelAnimationFrame(fishGameLoop)
            fishGameLoop = null
          }
          return
        }
      }
    }
  }

  // 移除超出边界的鱼
  enemyFishes = enemyFishes.filter(fish => fish.x > -fish.size * 3 && fish.x < fishCanvas.value!.width + fish.size * 3)

  // 更新烟花
  updateFireworks()

  drawFishGame()
  fishGameLoop = requestAnimationFrame(fishUpdate)
}

/**
 * 大鱼吃小鱼鼠标控制
 * 功能：更新鼠标位置用于玩家鱼跟随
 */
const handleFishMousemove = (e: MouseEvent) => {
  if (!fishGameActive.value || fishGamePaused.value) return
  const rect = fishCanvas.value?.getBoundingClientRect()
  if (rect) {
    mouseX = e.clientX - rect.left
    mouseY = e.clientY - rect.top
  }
}

/**
 * 鼠标进入画布
 * 功能：隐藏鼠标光标
 */
const handleFishMouseEnter = () => {
  if (fishCanvas.value) {
    fishCanvas.value.style.cursor = 'none'
  }
}

/**
 * 鼠标离开画布
 * 功能：恢复鼠标光标
 */
const handleFishMouseLeave = () => {
  if (fishCanvas.value) {
    fishCanvas.value.style.cursor = 'default'
  }
}

/**
 * 生成礼花样式
 * 功能：为胜利界面生成随机礼花样式
 */
const getFireworkStyle = (n: number) => {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#00b894']
  const color = colors[n % colors.length]
  const angle = (n / 20) * Math.PI * 2
  const distance = 100 + Math.random() * 150
  const tx = Math.cos(angle) * distance
  const ty = Math.sin(angle) * distance
  const left = 50 + (Math.random() - 0.5) * 60
  const top = 40 + (Math.random() - 0.5) * 40
  const delay = Math.random() * 0.5

  return {
    backgroundColor: color,
    left: `${left}%`,
    top: `${top}%`,
    '--tx': `${tx}px`,
    '--ty': `${ty}px`,
    animationDelay: `${delay}s`,
    boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  nextTick(() => {
    initFishCanvas()
  })
})

onUnmounted(() => {
  endFishGame()
})

// 暴露方法给父组件
defineExpose({
  endFishGame
})
</script>

<style scoped>
/* ==================== 手绘涂鸦风格变量 ==================== */
:root {
  --hand-drawn-radius: 20px;
  --pill-radius: 50px;
  --color-bg-glass: rgba(255, 255, 255, 0.95);
  --color-bg-tint-pink: rgba(255, 240, 245, 0.9);
  --color-bg-tint-mint: rgba(224, 255, 255, 0.9);
  --color-bg-tint-blue: rgba(199, 206, 234, 0.9);
  --color-success: #a8e6cf;
  --color-success-glow: rgba(168, 230, 207, 0.4);
  --color-warning: #ffaaa5;
  --color-warning-glow: rgba(255, 170, 165, 0.4);
  --color-progress: #ffd3b6;
  --color-progress-glow: rgba(255, 211, 182, 0.4);
  --shadow-glass: 0 8px 32px rgba(255, 182, 193, 0.15);
  --shadow-inset-soft: inset 0 2px 8px rgba(0, 0, 0, 0.05);
  --color-text-primary: #5d5d7a;
  --color-text-secondary: #7a7a9a;
  --font-handwritten: 'Comic Sans MS', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif;
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ==================== 大鱼吃小鱼游戏样式 - 手绘涂鸦风格 ==================== */
.fish-play-card {
  max-width: 750px;
  background: linear-gradient(180deg, rgba(199, 206, 234, 0.95) 0%, rgba(224, 255, 255, 0.9) 50%, rgba(255, 240, 245, 0.9) 100%);
  border-radius: 20px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(255, 182, 193, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

/* 海洋渐变顶部栏 - 手绘涂鸦风格 */
.ocean-gradient {
  background: linear-gradient(90deg, rgba(168, 230, 207, 0.9) 0%, rgba(199, 206, 234, 0.9) 50%, rgba(224, 255, 255, 0.9) 100%) !important;
  position: relative;
  overflow: hidden;
  border-bottom: 2px solid rgba(255, 255, 255, 0.5);
}

.ocean-gradient::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  right: -100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: wave-shimmer 3s ease-in-out infinite;
}

@keyframes wave-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* 顶部信息栏 - 手绘涂鸦风格 */
.fish-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 2px solid rgba(255, 255, 255, 0.5);
}

.fish-game-icon {
  font-size: 1.5rem;
}

.fish-game-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: #5d5d7a;
  letter-spacing: 1px;
  font-family: var(--font-handwritten);
}

.fish-stats-row {
  display: flex;
  gap: 12px;
}

.fish-stat-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
}

.fish-stat-icon {
  font-size: 1.1rem;
}

.fish-stat-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.fish-stat-label {
  font-size: 0.65rem;
  color: #7a7a9a;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: var(--font-handwritten);
}

.fish-stat-num {
  font-size: 1.1rem;
  font-weight: 700;
  color: #5d5d7a;
  font-family: var(--font-handwritten);
}

.fish-stat-num.size {
  color: #5d5d7a;
}

.fish-stat-num.level {
  color: #5d5d7a;
}

.fish-pause-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 211, 182, 0.9) 0%, rgba(255, 200, 160, 0.9) 100%);
  color: #5d5d7a;
  border: 2px solid rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 15px rgba(255, 211, 182, 0.4);
}

.fish-pause-btn:hover {
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.fish-pause-btn:active {
  transform: translateY(2px);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

.fish-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 游戏主体区域 */
.fish-game-body {
  display: flex;
  justify-content: center;
  padding: 16px;
}

/* 海洋开始界面 - 手绘涂鸦风格 */
.ocean-start-overlay {
  background: linear-gradient(180deg, rgba(199, 206, 234, 0.98) 0%, rgba(224, 255, 255, 0.98) 50%, rgba(255, 240, 245, 0.98) 100%) !important;
}

.ocean-waves {
  font-size: 5rem;
  animation: wave-float 2s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(168, 230, 207, 0.5));
  margin-bottom: 16px;
}

@keyframes wave-float {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-15px) rotate(5deg); }
}

.ocean-title {
  color: #5d5d7a !important;
  font-size: 1.8rem !important;
  font-weight: 800;
  letter-spacing: 3px;
  font-family: var(--font-handwritten);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1) !important;
  animation: title-glow 2s ease-in-out infinite;
}

@keyframes title-glow {
  0%, 100% { filter: drop-shadow(0 0 10px rgba(168, 230, 207, 0.5)); }
  50% { filter: drop-shadow(0 0 25px rgba(168, 230, 207, 0.8)); }
}

/* 中间画布区域 - 手绘涂鸦风格 */
.fish-canvas-area {
  display: flex;
  justify-content: center;
}

.fish-canvas-wrapper {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(255, 182, 193, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.6);
}

.fish-canvas {
  display: block;
  background: linear-gradient(180deg, rgba(199, 206, 234, 0.5) 0%, rgba(224, 255, 255, 0.3) 100%);
  cursor: none;
  width: 600px;
  height: 350px;
}

/* 遮罩层通用样式 - 手绘涂鸦风格 */
.fish-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fish-overlay-content {
  text-align: center;
  padding: 40px;
  position: relative;
}

/* 手绘描边效果 */
.fish-overlay-content::before {
  content: '';
  position: absolute;
  inset: -20px;
  border-radius: 30px;
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.6), rgba(168, 230, 207, 0.6));
  z-index: -1;
  animation: hand-drawn-border 3s ease-in-out infinite;
}

@keyframes hand-drawn-border {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.fish-logo {
  font-size: 5rem;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.fish-overlay-title {
  font-size: 2rem;
  font-weight: 700;
  color: #5d5d7a;
  margin-bottom: 8px;
  letter-spacing: 2px;
  font-family: var(--font-handwritten);
}

.fish-overlay-subtitle {
  font-size: 1rem;
  color: #7a7a9a;
  margin-bottom: 32px;
  font-family: var(--font-handwritten);
}

.fish-overlay-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.fish-btn {
  padding: 14px 32px;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;
  justify-content: center;
  font-family: var(--font-handwritten);
}

.fish-btn span {
  font-size: 1.2rem;
}

.fish-btn-primary {
  background: linear-gradient(135deg, rgba(168, 230, 207, 0.9) 0%, rgba(144, 220, 190, 0.9) 100%);
  color: #5d5d7a;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 15px rgba(168, 230, 207, 0.3);
}

.fish-btn-primary:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.fish-btn-primary:active {
  transform: translateY(2px);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

.fish-btn-secondary {
  background: rgba(255, 255, 255, 0.9);
  color: #5d5d7a;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.fish-btn-secondary:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.fish-btn-secondary:active {
  transform: translateY(2px);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

.fish-btn-danger {
  background: linear-gradient(135deg, rgba(255, 170, 165, 0.9) 0%, rgba(255, 150, 145, 0.9) 100%);
  color: #5d5d7a;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 15px rgba(255, 170, 165, 0.3);
}

.fish-btn-danger:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.fish-btn-danger:active {
  transform: translateY(2px);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 游戏结束遮罩特殊样式 - 手绘涂鸦风格 */
.fish-gameover-overlay {
  background: linear-gradient(135deg, rgba(255, 240, 245, 0.98) 0%, rgba(255, 211, 182, 0.98) 100%) !important;
}

.fish-gameover-overlay .gameover-icon {
  font-size: 4rem;
  animation: skull-shake 0.8s ease-in-out;
  filter: drop-shadow(0 0 20px rgba(255, 170, 165, 0.5));
}

@keyframes skull-shake {
  0%, 100% { transform: rotate(0deg) scale(1); }
  20% { transform: rotate(-10deg) scale(1.1); }
  40% { transform: rotate(10deg) scale(1.1); }
  60% { transform: rotate(-5deg) scale(1.05); }
  80% { transform: rotate(5deg) scale(1.05); }
}

.fish-gameover-overlay .gameover-box {
  background: rgba(255, 170, 165, 0.2);
  border-color: rgba(255, 170, 165, 0.4);
}

.fish-gameover-overlay .gameover-score {
  color: #5d5d7a;
  text-shadow: 0 0 10px rgba(255, 170, 165, 0.5);
}

.fish-final-score-box {
  margin: 24px 0;
  padding: 16px 32px;
  background: rgba(168, 230, 207, 0.2);
  border-radius: 20px;
  border: 2px solid rgba(168, 230, 207, 0.4);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 暂停遮罩特殊样式 - 手绘涂鸦风格 */
.fish-pause-overlay .fish-logo {
  animation: logo-pulse 2s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 胜利遮罩特殊样式 - 手绘涂鸦风格 */
.fish-win-overlay .fish-logo {
  animation: trophy-bounce 1s ease-in-out infinite;
}

@keyframes trophy-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-15px) scale(1.1); }
}

.fish-win-overlay {
  background: linear-gradient(135deg, rgba(168, 230, 207, 0.98) 0%, rgba(199, 206, 234, 0.98) 100%) !important;
  overflow: hidden;
}

/* 礼花容器 */
.fireworks-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.firework {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: firework-explode 1.5s ease-out forwards;
}

@keyframes firework-explode {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) scale(0);
    opacity: 0;
  }
}

.fish-win-overlay .victory-icon {
  animation: trophy-glow 1.5s ease-in-out infinite;
  filter: drop-shadow(0 0 30px rgba(168, 230, 207, 0.8));
}

@keyframes trophy-glow {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 20px rgba(168, 230, 207, 0.6));
  }
  50% {
    transform: scale(1.1);
    filter: drop-shadow(0 0 40px rgba(168, 230, 207, 1));
  }
}

.fish-win-overlay .victory-title {
  color: #5d5d7a !important;
  font-weight: 700;
  font-family: var(--font-handwritten);
}

.fish-win-overlay .victory-box {
  background: rgba(168, 230, 207, 0.2);
  border-color: rgba(168, 230, 207, 0.4);
  box-shadow: 0 0 20px rgba(168, 230, 207, 0.2);
}

.fish-win-overlay .victory-score {
  color: #5d5d7a;
  text-shadow: 0 0 15px rgba(168, 230, 207, 0.8);
  font-size: 1.5rem;
  font-family: var(--font-handwritten);
}

/* 紧凑版遮罩内容 - 手绘涂鸦风格 */
.fish-overlay-content.compact {
  padding: 24px;
  max-width: 320px;
}

.fish-logo.small {
  font-size: 3rem;
  margin-bottom: 8px;
}

.fish-overlay-title.small {
  font-size: 1.4rem;
  margin-bottom: 4px;
}

.fish-overlay-subtitle.small {
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.fish-final-score-box.compact {
  margin: 12px 0;
  padding: 12px 20px;
  border-radius: 16px;
}

.fish-overlay-buttons.horizontal {
  flex-direction: row;
  gap: 12px;
}

.fish-btn.small {
  padding: 10px 20px;
  font-size: 0.95rem;
  min-width: auto;
  border-radius: 40px;
}

/* 超小按钮 */
.fish-btn.tiny {
  padding: 8px 16px;
  font-size: 0.85rem;
  min-width: auto;
  border-radius: 30px;
}

/* 大图标 */
.fish-logo.large {
  font-size: 4rem;
  margin-bottom: 12px;
}

/* 超小标题 */
.fish-overlay-title.tiny {
  font-size: 1.1rem;
  margin-bottom: 2px;
}

.fish-overlay-subtitle.tiny {
  font-size: 0.8rem;
  margin-bottom: 12px;
}

/* 关卡过渡遮罩 - 手绘涂鸦风格 */
.fish-level-overlay {
  background: linear-gradient(135deg, rgba(199, 206, 234, 0.95) 0%, rgba(224, 255, 255, 0.95) 100%) !important;
}

.fish-level-overlay .fish-logo {
  animation: bounce-in 0.5s ease-out;
}

@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.fish-level-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 12px 0;
  padding: 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.level-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
}

.info-label {
  font-size: 0.75rem;
  color: #7a7a9a;
  font-family: var(--font-handwritten);
}

.info-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: #5d5d7a;
  font-family: var(--font-handwritten);
}

.final-score-label {
  display: block;
  font-size: 0.85rem;
  color: #7a7a9a;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-family: var(--font-handwritten);
}

.final-score-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #5d5d7a;
  font-family: var(--font-handwritten);
}
</style>
