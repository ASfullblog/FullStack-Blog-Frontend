<template>
  <!-- 俄罗斯方块游戏组件 -->
  <div class="play-card tetris-play-card">
    <!-- 顶部信息栏 -->
    <div class="tetris-top-bar">
      <div class="tetris-title-section">
        <span class="tetris-game-icon">🧱</span>
        <span class="tetris-game-name">俄罗斯方块</span>
      </div>
      <div class="tetris-stats-row">
        <div class="tetris-stat-box">
          <span class="tetris-stat-icon">💎</span>
          <div class="tetris-stat-info">
            <span class="tetris-stat-label">分数</span>
            <span class="tetris-stat-num">{{ tetrisScore }}</span>
          </div>
        </div>
        <div class="tetris-stat-box">
          <span class="tetris-stat-icon">⭐</span>
          <div class="tetris-stat-info">
            <span class="tetris-stat-label">等级</span>
            <span class="tetris-stat-num level">{{ tetrisLevel }}</span>
          </div>
        </div>
        <div class="tetris-stat-box">
          <span class="tetris-stat-icon">🔥</span>
          <div class="tetris-stat-info">
            <span class="tetris-stat-label">消除</span>
            <span class="tetris-stat-num lines">{{ tetrisLines }}</span>
          </div>
        </div>
      </div>
      <button v-if="tetrisGameActive && !tetrisGamePaused" class="tetris-pause-btn" @click="pauseTetrisGame">
        <span class="pause-icon">⏸</span>
      </button>
    </div>

    <!-- 游戏主体区域 -->
    <div class="tetris-game-body">
      <!-- 左侧：下一个方块预览 -->
      <div class="tetris-preview-panel">
        <h4 class="preview-title">下一个</h4>
        <div class="preview-box">
          <canvas ref="nextPieceCanvas" class="next-piece-canvas" width="100" height="100"></canvas>
        </div>
      </div>

      <!-- 中间：游戏画布 -->
      <div class="tetris-canvas-area">
        <div class="tetris-canvas-wrapper">
          <canvas ref="tetrisCanvas" class="tetris-canvas" width="300" height="600" style="width: 300px; height: 600px;"></canvas>

          <!-- 开始遮罩 -->
          <div v-if="!tetrisGameActive" class="tetris-overlay">
            <div class="tetris-overlay-content">
              <div class="tetris-logo">🎮</div>
              <h3 class="tetris-overlay-title">俄罗斯方块</h3>
              <p class="tetris-overlay-subtitle">经典永不过时</p>
              <div class="tetris-overlay-buttons">
                <button class="tetris-btn tetris-btn-primary" @click="startTetrisGame">
                  <span>▶</span> 开始游戏
                </button>
                <button v-if="tetrisScore > 0" class="tetris-btn tetris-btn-secondary" @click="resetTetrisGame">
                  <span>↻</span> 重新开始
                </button>
              </div>
            </div>
          </div>

          <!-- 暂停遮罩 -->
          <div v-if="tetrisGamePaused" class="tetris-overlay tetris-pause-overlay">
            <div class="tetris-overlay-content">
              <div class="tetris-logo">⏸</div>
              <h3 class="tetris-overlay-title">游戏暂停</h3>
              <div class="tetris-overlay-buttons">
                <button class="tetris-btn tetris-btn-primary" @click="resumeTetrisGame">
                  <span>▶</span> 继续游戏
                </button>
                <button class="tetris-btn tetris-btn-danger" @click="endTetrisGame">
                  <span>✕</span> 结束游戏
                </button>
              </div>
            </div>
          </div>

          <!-- 游戏结束遮罩 -->
          <div v-if="tetrisGameOver" class="tetris-overlay tetris-gameover-overlay">
            <div class="tetris-overlay-content">
              <div class="tetris-logo">💀</div>
              <h3 class="tetris-overlay-title">游戏结束</h3>
              <div class="tetris-final-score">
                <span class="final-score-label">最终得分</span>
                <span class="final-score-value">{{ tetrisScore }}</span>
              </div>
              <div class="tetris-overlay-buttons">
                <button class="tetris-btn tetris-btn-primary" @click="resetTetrisGame">
                  <span>↻</span> 再来一局
                </button>
                <button class="tetris-btn tetris-btn-secondary" @click="endTetrisGame">
                  <span>←</span> 返回
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：操作说明 -->
      <div class="tetris-controls-panel">
        <h4 class="controls-title">🎮 操作说明</h4>
        <div class="controls-list">
          <div class="control-item">
            <div class="control-keys">
              <kbd class="control-key">←</kbd>
              <kbd class="control-key">→</kbd>
            </div>
            <span class="control-desc">左右移动</span>
          </div>
          <div class="control-item">
            <div class="control-keys">
              <kbd class="control-key">↑</kbd>
            </div>
            <span class="control-desc">旋转方块</span>
          </div>
          <div class="control-item">
            <div class="control-keys">
              <kbd class="control-key">↓</kbd>
            </div>
            <span class="control-desc">加速下落</span>
          </div>
          <div class="control-item">
            <div class="control-keys">
              <kbd class="control-key wide">空格</kbd>
            </div>
            <span class="control-desc">直接落地</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

// ==================== 常量 ====================
const COLS = 10
const ROWS = 20
const BLOCK_SIZE = 30
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE']

const SHAPES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1], [0, 1, 0]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]]
]

// ==================== 响应式数据 ====================
const tetrisCanvas = ref<HTMLCanvasElement | null>(null)
const nextPieceCanvas = ref<HTMLCanvasElement | null>(null)
let tetrisCtx: CanvasRenderingContext2D | null = null
let nextPieceCtx: CanvasRenderingContext2D | null = null

const tetrisScore = ref(0)
const tetrisLevel = ref(1)
const tetrisLines = ref(0)
const tetrisGameActive = ref(false)
const tetrisGamePaused = ref(false)
const tetrisGameOver = ref(false)

let tetrisGameLoop: number | null = null
let tetrisDropInterval: number | null = null
let board: number[][] = []
let currentPiece: { shape: number[][]; color: string; x: number; y: number } | null = null
let nextPiece: { shape: number[][]; color: string } | null = null

// ==================== 方法 ====================
/**
 * 初始化俄罗斯方块画布
 * 功能：获取canvas上下文，初始化游戏板
 */
const initTetrisCanvas = () => {
  if (tetrisCanvas.value) {
    tetrisCtx = tetrisCanvas.value.getContext('2d')
    initTetrisBoard()
  }
  if (nextPieceCanvas.value) {
    nextPieceCtx = nextPieceCanvas.value.getContext('2d')
  }
}

/**
 * 初始化游戏板
 * 功能：创建空的二维数组作为游戏板，重置分数
 */
const initTetrisBoard = () => {
  board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0))
  tetrisScore.value = 0
  tetrisLevel.value = 1
  tetrisLines.value = 0
}

/**
 * 开始俄罗斯方块游戏
 * 功能：重置游戏状态，启动游戏循环和下落定时器
 */
const startTetrisGame = () => {
  if (tetrisGameActive.value) return

  initTetrisBoard()
  tetrisGameActive.value = true
  tetrisGamePaused.value = false
  tetrisGameOver.value = false
  nextPiece = null
  spawnPiece()

  tetrisDropInterval = window.setInterval(() => {
    if (!tetrisGamePaused.value) {
      movePiece(0, 1)
    }
  }, 1000 / tetrisLevel.value)

  tetrisUpdate()
}

/**
 * 暂停游戏
 * 功能：暂停游戏状态，清除下落定时器
 */
const pauseTetrisGame = () => {
  tetrisGamePaused.value = true
  if (tetrisDropInterval) {
    clearInterval(tetrisDropInterval)
    tetrisDropInterval = null
  }
}

/**
 * 继续游戏
 * 功能：恢复游戏状态，重新启动下落定时器
 */
const resumeTetrisGame = () => {
  tetrisGamePaused.value = false
  tetrisDropInterval = window.setInterval(() => {
    if (!tetrisGamePaused.value) {
      movePiece(0, 1)
    }
  }, 1000 / tetrisLevel.value)
  tetrisUpdate()
}

/**
 * 结束游戏
 * 功能：停止游戏循环，清理状态
 */
const endTetrisGame = () => {
  tetrisGameActive.value = false
  tetrisGamePaused.value = false
  tetrisGameOver.value = false
  if (tetrisGameLoop) {
    cancelAnimationFrame(tetrisGameLoop)
    tetrisGameLoop = null
  }
  if (tetrisDropInterval) {
    clearInterval(tetrisDropInterval)
    tetrisDropInterval = null
  }
  currentPiece = null
  nextPiece = null
}

/**
 * 重置游戏
 * 功能：结束当前游戏并重新开始
 */
const resetTetrisGame = () => {
  endTetrisGame()
  initTetrisBoard()
  drawTetrisBoard()
  nextTick(() => {
    startTetrisGame()
  })
}

/**
 * 生成新方块
 * 功能：创建当前方块和下一个方块预览
 */
const spawnPiece = () => {
  if (nextPiece) {
    currentPiece = {
      shape: nextPiece.shape,
      color: nextPiece.color,
      x: Math.floor(COLS / 2) - Math.floor(nextPiece.shape[0].length / 2),
      y: 0
    }
  } else {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length)
    const color = COLORS[shapeIndex]
    currentPiece = {
      shape: SHAPES[shapeIndex],
      color: color,
      x: Math.floor(COLS / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2),
      y: 0
    }
  }

  const nextShapeIndex = Math.floor(Math.random() * SHAPES.length)
  nextPiece = {
    shape: SHAPES[nextShapeIndex],
    color: COLORS[nextShapeIndex]
  }
  drawNextPiece()

  if (isCollision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
    tetrisGameOver.value = true
    tetrisGameActive.value = false
    if (tetrisDropInterval) {
      clearInterval(tetrisDropInterval)
      tetrisDropInterval = null
    }
  }
}

/**
 * 绘制下一个方块预览
 * 功能：在预览canvas上绘制下一个方块
 */
const drawNextPiece = () => {
  if (!nextPieceCtx || !nextPiece) return

  nextPieceCtx.fillStyle = '#0a0a1a'
  nextPieceCtx.fillRect(0, 0, 100, 100)

  const blockSize = 20
  const offsetX = (100 - nextPiece.shape[0].length * blockSize) / 2
  const offsetY = (100 - nextPiece.shape.length * blockSize) / 2

  for (let row = 0; row < nextPiece.shape.length; row++) {
    for (let col = 0; col < nextPiece.shape[row].length; col++) {
      if (nextPiece.shape[row][col]) {
        const x = offsetX + col * blockSize
        const y = offsetY + row * blockSize

        nextPieceCtx.fillStyle = nextPiece.color
        nextPieceCtx.fillRect(x, y, blockSize - 2, blockSize - 2)

        nextPieceCtx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        nextPieceCtx.fillRect(x, y, blockSize - 2, 3)
        nextPieceCtx.fillRect(x, y, 3, blockSize - 2)
      }
    }
  }
}

/**
 * 碰撞检测
 * 功能：检查方块移动后是否与边界或其他方块碰撞
 */
const isCollision = (shape: number[][], x: number, y: number) => {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = x + col
        const newY = y + row

        if (newX < 0 || newX >= COLS || newY >= ROWS) return true
        if (newY >= 0 && board[newY][newX]) return true
      }
    }
  }
  return false
}

/**
 * 移动方块
 * 功能：根据方向移动方块，碰撞时锁定
 */
const movePiece = (dx: number, dy: number) => {
  if (!currentPiece) return

  const newX = currentPiece.x + dx
  const newY = currentPiece.y + dy

  if (!isCollision(currentPiece.shape, newX, newY)) {
    currentPiece.x = newX
    currentPiece.y = newY
  } else if (dy > 0) {
    lockPiece()
  }
}

/**
 * 旋转方块
 * 功能：顺时针旋转当前方块
 */
const rotatePiece = () => {
  if (!currentPiece) return

  const rotated = currentPiece.shape[0].map((_, i) =>
    currentPiece!.shape.map(row => row[i]).reverse()
  )

  if (!isCollision(rotated, currentPiece.x, currentPiece.y)) {
    currentPiece.shape = rotated
  }
}

/**
 * 锁定方块
 * 功能：将当前方块固定到游戏板上
 */
const lockPiece = () => {
  if (!currentPiece) return

  for (let row = 0; row < currentPiece.shape.length; row++) {
    for (let col = 0; col < currentPiece.shape[row].length; col++) {
      if (currentPiece.shape[row][col]) {
        const y = currentPiece.y + row
        const x = currentPiece.x + col
        if (y >= 0) {
          board[y][x] = COLORS.indexOf(currentPiece.color) + 1
        }
      }
    }
  }

  clearLines()
  spawnPiece()
}

/**
 * 清除完整行
 * 功能：检查并消除已填满的行，更新分数和等级
 */
const clearLines = () => {
  let linesCleared = 0

  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every(cell => cell !== 0)) {
      board.splice(row, 1)
      board.unshift(Array(COLS).fill(0))
      linesCleared++
      row++
    }
  }

  if (linesCleared > 0) {
    tetrisLines.value += linesCleared
    tetrisScore.value += linesCleared * 100 * tetrisLevel.value
    tetrisLevel.value = Math.floor(tetrisLines.value / 10) + 1
  }
}

/**
 * 绘制俄罗斯方块游戏
 * 功能：绘制网格、已锁定方块和当前方块
 */
const drawTetrisBoard = () => {
  if (!tetrisCtx) return

  tetrisCtx.fillStyle = '#1a1a2e'
  tetrisCtx.fillRect(0, 0, tetrisCanvas.value!.width, tetrisCanvas.value!.height)

  // 绘制网格
  tetrisCtx.strokeStyle = '#2a2a4e'
  tetrisCtx.lineWidth = 1
  for (let i = 0; i <= COLS; i++) {
    tetrisCtx.beginPath()
    tetrisCtx.moveTo(i * BLOCK_SIZE, 0)
    tetrisCtx.lineTo(i * BLOCK_SIZE, ROWS * BLOCK_SIZE)
    tetrisCtx.stroke()
  }
  for (let i = 0; i <= ROWS; i++) {
    tetrisCtx.beginPath()
    tetrisCtx.moveTo(0, i * BLOCK_SIZE)
    tetrisCtx.lineTo(COLS * BLOCK_SIZE, i * BLOCK_SIZE)
    tetrisCtx.stroke()
  }

  // 绘制已锁定的方块
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col]) {
        tetrisCtx.fillStyle = COLORS[board[row][col] - 1]
        tetrisCtx.fillRect(col * BLOCK_SIZE + 1, row * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2)
        tetrisCtx.strokeStyle = '#fff'
        tetrisCtx.lineWidth = 2
        tetrisCtx.strokeRect(col * BLOCK_SIZE + 1, row * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2)
      }
    }
  }

  // 绘制当前方块
  if (currentPiece) {
    tetrisCtx.fillStyle = currentPiece.color
    for (let row = 0; row < currentPiece.shape.length; row++) {
      for (let col = 0; col < currentPiece.shape[row].length; col++) {
        if (currentPiece.shape[row][col]) {
          const x = (currentPiece.x + col) * BLOCK_SIZE
          const y = (currentPiece.y + row) * BLOCK_SIZE
          tetrisCtx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2)
          tetrisCtx.strokeStyle = '#fff'
          tetrisCtx.lineWidth = 2
          tetrisCtx.strokeRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2)
        }
      }
    }
  }
}

/**
 * 俄罗斯方块游戏更新循环
 * 功能：持续绘制游戏画面
 */
const tetrisUpdate = () => {
  if (!tetrisGameActive.value || tetrisGamePaused.value) return

  drawTetrisBoard()
  tetrisGameLoop = requestAnimationFrame(tetrisUpdate)
}

/**
 * 键盘控制处理
 * 功能：响应键盘事件控制方块移动和旋转
 */
const handleTetrisKeydown = (e: KeyboardEvent) => {
  if (!tetrisGameActive.value || tetrisGamePaused.value) return

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault()
      movePiece(-1, 0)
      break
    case 'ArrowRight':
      e.preventDefault()
      movePiece(1, 0)
      break
    case 'ArrowDown':
      e.preventDefault()
      movePiece(0, 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      rotatePiece()
      break
    case ' ':
      e.preventDefault()
      hardDrop()
      break
  }
}

/**
 * 直接落地（硬降）
 * 功能：将当前方块直接落到底部
 */
const hardDrop = () => {
  if (!currentPiece) return
  while (!isCollision(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
    currentPiece.y++
  }
  lockPiece()
}

// ==================== 生命周期 ====================
onMounted(() => {
  nextTick(() => {
    initTetrisCanvas()
  })
  window.addEventListener('keydown', handleTetrisKeydown)
})

onUnmounted(() => {
  endTetrisGame()
  window.removeEventListener('keydown', handleTetrisKeydown)
})

// 暴露方法给父组件
defineExpose({
  endTetrisGame
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

/* ==================== 俄罗斯方块游戏样式 - 手绘涂鸦风格 ==================== */
.tetris-play-card {
  max-width: 750px;
  background: linear-gradient(145deg, rgba(255, 240, 245, 0.95) 0%, rgba(224, 255, 255, 0.9) 50%, rgba(199, 206, 234, 0.9) 100%);
  border-radius: 24px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(255, 182, 193, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

/* 顶部信息栏 - 手绘涂鸦风格 */
.tetris-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 2px solid rgba(255, 255, 255, 0.5);
}

.tetris-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tetris-game-icon {
  font-size: 2rem;
}

.tetris-game-name {
  font-size: 1.4rem;
  font-weight: 700;
  color: #5d5d7a;
  letter-spacing: 1px;
  font-family: var(--font-handwritten);
}

.tetris-stats-row {
  display: flex;
  gap: 16px;
}

.tetris-stat-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tetris-stat-icon {
  font-size: 1.3rem;
}

.tetris-stat-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.tetris-stat-label {
  font-size: 0.7rem;
  color: #7a7a9a;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: var(--font-handwritten);
}

.tetris-stat-num {
  font-size: 1.3rem;
  font-weight: 700;
  color: #5d5d7a;
  font-family: var(--font-handwritten);
}

.tetris-stat-num.level {
  color: #5d5d7a;
}

.tetris-stat-num.lines {
  color: #5d5d7a;
}

.tetris-pause-btn {
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

.tetris-pause-btn:hover {
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.tetris-pause-btn:active {
  transform: translateY(2px);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 游戏主体区域 */
.tetris-game-body {
  display: flex;
  gap: 20px;
  padding: 24px;
  align-items: flex-start;
}

/* 左侧预览面板 - 手绘涂鸦风格 */
.tetris-preview-panel {
  width: 120px;
  flex-shrink: 0;
}

.preview-title {
  font-size: 0.85rem;
  color: #7a7a9a;
  text-align: center;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-family: var(--font-handwritten);
}

.preview-box {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 20px;
  padding: 16px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.next-piece-canvas {
  display: block;
}

/* 中间画布区域 - 手绘涂鸦风格 */
.tetris-canvas-area {
  flex: 1;
  display: flex;
  justify-content: center;
}

.tetris-canvas-wrapper {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(255, 182, 193, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.6);
}

.tetris-canvas {
  display: block;
  background: linear-gradient(180deg, rgba(199, 206, 234, 0.5) 0%, rgba(224, 255, 255, 0.3) 100%);
}

/* 遮罩层通用样式 - 手绘涂鸦风格 */
.tetris-overlay {
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

.tetris-overlay-content {
  text-align: center;
  padding: 40px;
  position: relative;
}

/* 手绘描边效果 */
.tetris-overlay-content::before {
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

.tetris-logo {
  font-size: 5rem;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.tetris-overlay-title {
  font-size: 2rem;
  font-weight: 700;
  color: #5d5d7a;
  margin-bottom: 8px;
  letter-spacing: 2px;
  font-family: var(--font-handwritten);
}

.tetris-overlay-subtitle {
  font-size: 1rem;
  color: #7a7a9a;
  margin-bottom: 32px;
  font-family: var(--font-handwritten);
}

.tetris-overlay-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.tetris-btn {
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

.tetris-btn span {
  font-size: 1.2rem;
}

.tetris-btn-primary {
  background: linear-gradient(135deg, rgba(168, 230, 207, 0.9) 0%, rgba(144, 220, 190, 0.9) 100%);
  color: #5d5d7a;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 15px rgba(168, 230, 207, 0.3);
}

.tetris-btn-primary:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.tetris-btn-primary:active {
  transform: translateY(2px);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tetris-btn-secondary {
  background: rgba(255, 255, 255, 0.9);
  color: #5d5d7a;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.tetris-btn-secondary:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.tetris-btn-secondary:active {
  transform: translateY(2px);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tetris-btn-danger {
  background: linear-gradient(135deg, rgba(255, 170, 165, 0.9) 0%, rgba(255, 150, 145, 0.9) 100%);
  color: #5d5d7a;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 15px rgba(255, 170, 165, 0.3);
}

.tetris-btn-danger:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.tetris-btn-danger:active {
  transform: translateY(2px);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 游戏结束遮罩特殊样式 - 手绘涂鸦风格 */
.tetris-gameover-overlay .tetris-logo {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.tetris-final-score {
  margin: 24px 0;
  padding: 16px 32px;
  background: rgba(168, 230, 207, 0.2);
  border-radius: 20px;
  border: 2px solid rgba(168, 230, 207, 0.4);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
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
  font-size: 2.5rem;
  font-weight: 700;
  color: #5d5d7a;
  font-family: var(--font-handwritten);
}

/* 右侧控制面板 - 手绘涂鸦风格 */
.tetris-controls-panel {
  width: 140px;
  flex-shrink: 0;
}

.controls-title {
  font-size: 0.85rem;
  color: #7a7a9a;
  text-align: center;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-family: var(--font-handwritten);
}

.controls-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
}

.control-keys {
  display: flex;
  gap: 6px;
}

.control-key {
  padding: 6px 10px;
  background: rgba(168, 230, 207, 0.3);
  border: 1px solid rgba(168, 230, 207, 0.5);
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #5d5d7a;
  font-family: var(--font-handwritten);
  min-width: 28px;
  text-align: center;
}

.control-key.wide {
  padding: 6px 16px;
}

.control-desc {
  font-size: 0.8rem;
  color: #7a7a9a;
  font-family: var(--font-handwritten);
}

/* 暂停遮罩特殊样式 - 手绘涂鸦风格 */
.tetris-pause-overlay .tetris-logo {
  animation: logo-pulse 2s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
