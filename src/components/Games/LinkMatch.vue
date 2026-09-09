<template>
  <!-- 趣味连连看游戏组件 - 经典三消连线+创新机制 -->
  <div class="play-card linkmatch-play-card">
    <!-- 游戏头部信息栏 -->
    <div class="linkmatch-header">
      <div class="level-info">
        <span class="level-badge">关卡 {{ currentLevel }}</span>
        <span class="difficulty-badge" :class="difficultyClass">{{ difficultyText }}</span>
      </div>
      <div class="game-mode-tabs">
        <button
          class="mode-tab"
          :class="{ active: gameMode === 'time' }"
          @click="switchMode('time')"
        >
          ⏱️ 限时
        </button>
        <button
          class="mode-tab"
          :class="{ active: gameMode === 'moves' }"
          @click="switchMode('moves')"
        >
          👣 限步
        </button>
      </div>
    </div>

    <!-- 游戏状态栏 -->
    <div class="status-bar">
      <div class="status-item" v-if="gameMode === 'time'">
        <span class="status-icon">⏱️</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: timeProgress + '%' }" :class="{ warning: timeLeft < 30 }"></div>
          <span class="progress-text">{{ formatTime(timeLeft) }}</span>
        </div>
      </div>
      <div class="status-item" v-else>
        <span class="status-icon">👣</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: movesProgress + '%' }" :class="{ warning: movesLeft < 10 }"></div>
          <span class="progress-text">{{ movesLeft }} 步</span>
        </div>
      </div>
      <div class="status-item score-display">
        <span class="status-icon">💎</span>
        <span class="score-value">{{ score }}</span>
      </div>
      <div class="status-item combo-display" v-if="combo > 1">
        <span class="combo-text">{{ combo }}连击!</span>
      </div>
    </div>

    <!-- 游戏主区域 - 连连看棋盘 -->
    <div class="game-board-container">
      <!-- 层数指示器 -->
      <div class="layer-indicator">
        <span class="layer-text">当前层数: {{ currentLayer }}/{{ maxLayers }}</span>
        <div class="layer-dots">
          <span
            v-for="layer in maxLayers"
            :key="layer"
            class="layer-dot"
            :class="{ active: layer <= currentLayer, current: layer === currentLayer }"
          ></span>
        </div>
      </div>

      <!-- 棋盘 -->
      <div class="game-board" :style="boardStyle">
        <!-- 连线层 -->
        <svg class="connection-layer" v-if="showConnection">
          <path
            :d="connectionPath"
            stroke="#FFD700"
            stroke-width="4"
            fill="none"
            stroke-linecap="round"
            stroke-dasharray="8,4"
            class="connection-line"
          />
        </svg>

        <!-- 特效层 -->
        <div class="effects-layer">
          <div
            v-for="effect in activeEffects"
            :key="effect.id"
            class="effect-item"
            :class="effect.type"
            :style="effect.style"
          >
            {{ effect.content }}
          </div>
        </div>

        <!-- 格子层 -->
        <div
          v-for="(cell, index) in visibleCells"
          :key="index"
          class="board-cell"
          :class="{
            empty: !cell,
            selected: selectedCells.includes(index),
            matched: matchedCells.includes(index),
            'can-match': canMatchCells.includes(index),
            'layer-top': cell?.layer === currentLayer,
            'layer-bottom': cell && cell.layer < currentLayer
          }"
          :style="getCellStyle(cell, index)"
          @click="handleCellClick(index)"
        >
          <template v-if="cell">
            <div class="tile" :class="{ 'has-gravity': hasGravity }">
              <span class="tile-icon">{{ cell.icon }}</span>
              <div class="tile-shine"></div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 道具栏 -->
    <div class="power-ups">
      <button
        class="power-up-btn"
        :class="{ active: activePowerUp === 'hint', disabled: powerUps.hint <= 0 }"
        @click="usePowerUp('hint')"
        :disabled="powerUps.hint <= 0"
      >
        <span class="power-icon">💡</span>
        <span class="power-count">{{ powerUps.hint }}</span>
        <span class="power-name">提示</span>
      </button>
      <button
        class="power-up-btn"
        :class="{ active: activePowerUp === 'shuffle', disabled: powerUps.shuffle <= 0 }"
        @click="usePowerUp('shuffle')"
        :disabled="powerUps.shuffle <= 0"
      >
        <span class="power-icon">🔀</span>
        <span class="power-count">{{ powerUps.shuffle }}</span>
        <span class="power-name">重排</span>
      </button>
      <button
        class="power-up-btn"
        :class="{ active: activePowerUp === 'time', disabled: powerUps.time <= 0 }"
        @click="usePowerUp('time')"
        :disabled="powerUps.time <= 0"
      >
        <span class="power-icon">⏰</span>
        <span class="power-count">{{ powerUps.time }}</span>
        <span class="power-name">+30秒</span>
      </button>
    </div>

    <!-- 控制按钮 -->
    <div v-if="statusMessage" class="status-toast">{{ statusMessage }}</div>

    <div class="game-controls">
      <button class="control-btn pause-btn" @click="togglePause">
        <span class="btn-icon">⏸️</span>
        <span class="btn-text">暂停</span>
      </button>
      <button
        class="control-btn restart-btn emphasized"
        title="重新生成当前关卡并回到开始面板"
        @click="restartLevel"
      >
        <span class="btn-icon">🔄</span>
        <span class="btn-text">重开</span>
      </button>
      <button class="control-btn end-btn" @click="endGame">
        <span class="btn-icon">🏠</span>
        <span class="btn-text">返回</span>
      </button>
    </div>

    <div v-if="showStartOverlay" class="pause-overlay start-overlay">
      <div class="pause-modal start-modal">
        <span class="overlay-tag">准备开始</span>
        <h3>趣味连连看</h3>
        <p>选择关卡后开始挑战，在不超过两次转弯的条件下消除所有相同图块。</p>
        <div class="level-select-strip">
          <button
            v-for="option in levelOptions"
            :key="option.level"
            class="level-chip"
            :class="{ active: option.active, locked: !option.unlocked }"
            :disabled="!option.unlocked"
            @click="selectLevel(option.level)"
          >
            <span class="level-chip-label">P{{ option.level }}</span>
            <span class="level-chip-stars">{{ option.stars ? '⭐'.repeat(option.stars) : '未通关' }}</span>
          </button>
        </div>
        <div class="pause-stats start-tips">
          <div class="pause-stat">
            <span>挑战模式</span>
            <strong>{{ gameMode === 'time' ? '限时' : '限步' }}</strong>
          </div>
          <div class="pause-stat">
            <span>目标条件</span>
            <strong>{{ gameMode === 'time' ? formatTime(timeLeft) : movesLeft + ' 步' }}</strong>
          </div>
        </div>
        <div class="overlay-actions">
          <button class="secondary-overlay-btn" @click="endGame">返回列表</button>
          <button class="resume-btn" @click="startGame">开始游戏</button>
        </div>
      </div>
    </div>

    <div v-if="isPaused" class="pause-overlay">
      <div class="pause-modal">
        <span class="overlay-tag">暂停中</span>
        <h3>游戏已暂停</h3>
        <p>当前进度会保留，继续后计时和操作会从这里恢复。</p>
        <div class="pause-stats">
          <div class="pause-stat">
            <span>当前得分</span>
            <strong>{{ score }}</strong>
          </div>
          <div class="pause-stat">
            <span>最高连击</span>
            <strong>{{ maxCombo }}</strong>
          </div>
        </div>
        <div class="overlay-actions">
          <button class="secondary-overlay-btn" @click="endGame">返回列表</button>
          <button class="secondary-overlay-btn warning" @click="restartLevel">重新开始</button>
          <button class="resume-btn" @click="resumeGame">继续游戏</button>
        </div>
      </div>
    </div>

    <div v-if="showLevelComplete" class="level-complete-overlay">
      <div class="level-complete-modal">
        <div class="celebration-effects">
          <span v-for="n in 20" :key="n" class="star-particle" :style="getParticleStyle(n)">⭐</span>
        </div>
        <div class="modal-content">
          <h2 class="complete-title">🎉 关卡完成! 🎉</h2>
          <div class="complete-stats">
            <div class="stat-row">
              <span>最终得分</span>
              <span class="highlight">{{ score }}</span>
            </div>
            <div class="stat-row">
              <span>最高连击</span>
              <span class="highlight">{{ maxCombo }}</span>
            </div>
            <div class="stat-row">
              <span>剩余{{ gameMode === 'time' ? '时间' : '步数' }}</span>
              <span class="highlight">{{ gameMode === 'time' ? formatTime(timeLeft) : movesLeft }}</span>
            </div>
          </div>
          <div class="star-rating">
            <span v-for="n in 3" :key="n" class="star" :class="{ earned: n <= earnedStars }">⭐</span>
          </div>
          <div class="complete-actions">
            <button class="action-btn share-btn" @click="shareResult">
              <span>📤</span> 分享
            </button>
            <button class="action-btn next-btn" @click="nextLevel">
              <span>{{ hasNextLevel ? '➡️' : '🏁' }}</span>
              {{ hasNextLevel ? '下一关' : '完成全部关卡' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏结束弹窗 -->
    <div v-if="showGameOver" class="game-over-overlay">
      <div class="game-over-modal">
        <h2>😢 游戏结束</h2>
        <p>{{ gameOverReason }}</p>
        <div class="final-score">
          <span>最终得分</span>
          <strong>{{ score }}</strong>
        </div>
        <div class="game-over-actions">
          <button class="action-btn restart-btn" @click="restartLevel">
            <span>🔄</span> 重试
          </button>
          <button class="action-btn end-btn" @click="endGame">
            <span>🏠</span> 返回
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getLinkMatchLevelConfig, type LinkMatchLevelConfig, type LinkMatchCellConfig } from '../../api/game'

// ==================== 类型定义 ====================
/**
 * 游戏模式
 */
type GameMode = 'time' | 'moves'

/**
 * 难度等级
 */
type Difficulty = 'easy' | 'normal' | 'medium' | 'hard'

const emit = defineEmits<{
  exit: []
}>()

/**
 * 连连看格子
 */
interface Cell {
  id: number
  icon: string
  type: number
  layer: number
  row: number
  col: number
}

/**
 * 特效对象
 */
interface Effect {
  id: number
  type: 'star' | 'rainbow' | 'combo'
  content: string
  style: Record<string, string>
}

interface LevelProgressState {
  unlockedLevel: number
  bestStars: Record<number, number>
}

// ==================== 游戏配置 ====================
/**
 * 难度循环配置
 */
const DIFFICULTY_CYCLE: Difficulty[] = ['easy', 'easy', 'easy', 'hard', 'medium', 'hard', 'normal']

/**
 * 可爱食物和动物图标
 */
const TILE_ICONS = [
  '🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝',
  '🥑', '🍆', '🥕', '🌽', '🥨', '🧀', '🥞', '🍩',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'
]

/**
 * 难度配置
 */
const DIFFICULTY_CONFIG: Record<Difficulty, { rows: number; cols: number; types: number; layers: number; time: number; moves: number }> = {
  easy: { rows: 6, cols: 6, types: 6, layers: 1, time: 120, moves: 50 },
  normal: { rows: 7, cols: 8, types: 8, layers: 2, time: 180, moves: 70 },
  medium: { rows: 8, cols: 9, types: 10, layers: 3, time: 240, moves: 90 },
  hard: { rows: 9, cols: 10, types: 12, layers: 4, time: 300, moves: 120 }
}

const LEVEL_STORAGE_KEY = 'link-match-progress'
const TOTAL_LEVELS = 12

// ==================== 响应式数据 ====================
const currentLevel = ref(1)
const gameMode = ref<GameMode>('time')
const score = ref(0)
const combo = ref(0)
const maxCombo = ref(0)
const timeLeft = ref(120)
const movesLeft = ref(50)
const isPaused = ref(false)
const hasStarted = ref(false)
const showStartOverlay = ref(true)
const statusMessage = ref('')
const statusMessageTimer = ref<number | null>(null)
const showLevelComplete = ref(false)
const showGameOver = ref(false)
const gameOverReason = ref('')
const earnedStars = ref(0)
const isLoadingLevel = ref(false)
const currentStageConfig = ref<LinkMatchLevelConfig | null>(null)
const unlockedLevel = ref(1)
const bestStarsMap = ref<Record<number, number>>({})

// 棋盘数据
const cells = ref<(Cell | null)[]>([])
const selectedCells = ref<number[]>([])
const matchedCells = ref<number[]>([])
const canMatchCells = ref<number[]>([])
const currentLayer = ref(1)
const maxLayers = ref(1)

// 游戏状态
const showConnection = ref(false)
const connectionPath = ref('')
const activeEffects = ref<Effect[]>([])
const activePowerUp = ref<string | null>(null)
const hasGravity = ref(false)

// 道具
const powerUps = ref({
  hint: 3,
  shuffle: 2,
  time: 1
})

// 定时器
let gameTimer: number | null = null
let effectIdCounter = 0

const clearStatusMessage = () => {
  if (statusMessageTimer.value) {
    clearTimeout(statusMessageTimer.value)
    statusMessageTimer.value = null
  }
  statusMessage.value = ''
}

const setStatusMessage = (message: string, duration = 1800) => {
  clearStatusMessage()
  statusMessage.value = message
  statusMessageTimer.value = window.setTimeout(() => {
    statusMessage.value = ''
    statusMessageTimer.value = null
  }, duration)
}

// ==================== 计算属性 ====================
/**
 * 当前难度
 */
const currentDifficulty = computed((): Difficulty => {
  if (
    currentStageConfig.value?.difficulty &&
    currentStageConfig.value.levelNumber === currentLevel.value &&
    currentStageConfig.value.mode === gameMode.value
  ) {
    return currentStageConfig.value.difficulty
  }
  const index = (currentLevel.value - 1) % DIFFICULTY_CYCLE.length
  return DIFFICULTY_CYCLE[index]
})

/**
 * 难度文本
 */
const difficultyText = computed(() => {
  const map: Record<Difficulty, string> = {
    easy: '容易',
    normal: '普通',
    medium: '中等',
    hard: '困难'
  }
  return map[currentDifficulty.value]
})

/**
 * 难度样式类
 */
const difficultyClass = computed(() => `difficulty-${currentDifficulty.value}`)

const hasNextLevel = computed(() => currentLevel.value < TOTAL_LEVELS)

const levelOptions = computed(() => {
  return Array.from({ length: TOTAL_LEVELS }, (_, index) => {
    const level = index + 1
    return {
      level,
      unlocked: level <= unlockedLevel.value,
      stars: bestStarsMap.value[level] || 0,
      active: level === currentLevel.value
    }
  })
})

/**
 * 棋盘配置
 */
const boardConfig = computed(() => {
  if (
    currentStageConfig.value &&
    currentStageConfig.value.levelNumber === currentLevel.value &&
    currentStageConfig.value.mode === gameMode.value
  ) {
    return {
      rows: currentStageConfig.value.rows,
      cols: currentStageConfig.value.cols,
      types: currentStageConfig.value.types,
      layers: currentStageConfig.value.layers,
      time: currentStageConfig.value.time,
      moves: currentStageConfig.value.moves
    }
  }
  return DIFFICULTY_CONFIG[currentDifficulty.value]
})

/**
 * 棋盘样式
 */
const boardStyle = computed(() => ({
  gridTemplateColumns: `repeat(${boardConfig.value.cols}, 1fr)`,
  gridTemplateRows: `repeat(${boardConfig.value.rows}, 1fr)`
}))

/**
 * 可见格子（考虑层数）
 */
const visibleCells = computed(() => {
  return cells.value.map((cell, index) => {
    if (!cell) return null
    // 只显示当前层及以下的格子
    if (cell.layer > currentLayer.value) return null
    return cell
  })
})

/**
 * 时间进度
 */
const timeProgress = computed(() => {
  const maxTime = boardConfig.value.time
  return (timeLeft.value / maxTime) * 100
})

/**
 * 步数进度
 */
const movesProgress = computed(() => {
  const maxMoves = boardConfig.value.moves
  return (movesLeft.value / maxMoves) * 100
})

// ==================== 方法 ====================
/**
 * 格式化时间
 * 功能：将秒数格式化为 MM:SS 格式
 * @param seconds - 秒数
 * @returns 格式化后的时间字符串
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 获取格子样式
 * 功能：根据格子状态返回对应的CSS样式
 * @param cell - 格子对象
 * @param index - 格子索引
 * @returns CSS样式对象
 */
const getCellStyle = (cell: Cell | null, index: number): Record<string, string> => {
  if (!cell) return {}

  const baseDelay = (index % 10) * 0.05
  const layerOffset = (cell.layer - 1) * 4

  return {
    transform: `translateY(-${layerOffset}px)`,
    zIndex: String(cell.layer * 10),
    animationDelay: `${baseDelay}s`
  }
}

/**
 * 获取粒子特效样式
 * 功能：生成随机位置的粒子样式
 * @param index - 粒子索引
 * @returns CSS样式对象
 */
const getParticleStyle = (index: number): Record<string, string> => {
  const angle = (index / 20) * Math.PI * 2
  const distance = 100 + Math.random() * 100
  const x = Math.cos(angle) * distance
  const y = Math.sin(angle) * distance

  return {
    left: '50%',
    top: '50%',
    '--tx': `${x}px`,
    '--ty': `${y}px`,
    animationDelay: `${index * 0.05}s`
  }
}

const normalizeCells = (rawCells: Array<LinkMatchCellConfig | null>): (Cell | null)[] => {
  return rawCells.map((cell, index) => {
    if (!cell) return null
    return {
      id: index,
      icon: cell.icon,
      type: cell.type,
      layer: cell.layer,
      row: cell.row,
      col: cell.col
    }
  })
}

const getInitialPowerUps = () => {
  switch (currentDifficulty.value) {
    case 'easy':
      return { hint: 3, shuffle: 2, time: 1 }
    case 'normal':
      return { hint: 2, shuffle: 2, time: 1 }
    case 'medium':
      return { hint: 2, shuffle: 1, time: 0 }
    case 'hard':
      return { hint: 1, shuffle: 1, time: 0 }
    default:
      return { hint: 2, shuffle: 1, time: 0 }
  }
}

const saveLevelProgress = () => {
  if (typeof localStorage === 'undefined') return
  const payload: LevelProgressState = {
    unlockedLevel: unlockedLevel.value,
    bestStars: bestStarsMap.value
  }
  localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(payload))
}

const loadLevelProgress = () => {
  if (typeof localStorage === 'undefined') return

  try {
    const raw = localStorage.getItem(LEVEL_STORAGE_KEY)
    if (!raw) return

    const parsed = JSON.parse(raw) as Partial<LevelProgressState>
    unlockedLevel.value = Math.max(1, Math.min(TOTAL_LEVELS, Number(parsed.unlockedLevel) || 1))
    bestStarsMap.value = Object.fromEntries(
      Object.entries(parsed.bestStars || {}).map(([level, stars]) => [Number(level), Number(stars) || 0])
    ) as Record<number, number>
  } catch (error) {
    console.error('[LinkMatch] failed to load level progress:', error)
  }
}

const updateLevelProgress = (stars: number) => {
  const nextBestStars = { ...bestStarsMap.value }
  nextBestStars[currentLevel.value] = Math.max(nextBestStars[currentLevel.value] || 0, stars)
  bestStarsMap.value = nextBestStars

  if (currentLevel.value < TOTAL_LEVELS) {
    unlockedLevel.value = Math.max(unlockedLevel.value, currentLevel.value + 1)
  }

  saveLevelProgress()
}

const hasRemainingCells = (): boolean => cells.value.some(cell => cell !== null)

const randomizeRemainingTiles = () => {
  const remainingTiles = cells.value
    .filter((cell): cell is Cell => cell !== null)
    .map(cell => ({
      icon: cell.icon,
      type: cell.type
    }))

  for (let i = remainingTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[remainingTiles[i], remainingTiles[j]] = [remainingTiles[j], remainingTiles[i]]
  }

  let tileIndex = 0
  cells.value = cells.value.map(cell => {
    if (!cell) return null
    const nextTile = remainingTiles[tileIndex]
    tileIndex++
    return {
      ...cell,
      icon: nextTile.icon,
      type: nextTile.type
    }
  })
}

/**
 * 初始化关卡
 * 功能：根据当前关卡和难度生成棋盘
 */
const initLevel = async (regenerate = false) => {
  const fallbackDifficulty = DIFFICULTY_CYCLE[(currentLevel.value - 1) % DIFFICULTY_CYCLE.length]
  const fallbackConfig = DIFFICULTY_CONFIG[fallbackDifficulty]
  score.value = 0
  combo.value = 0
  isPaused.value = false
  clearStatusMessage()
  showLevelComplete.value = false
  showGameOver.value = false
  selectedCells.value = []
  matchedCells.value = []
  canMatchCells.value = []
  showConnection.value = false
  connectionPath.value = ''
  activeEffects.value = []
  activePowerUp.value = null
  isLoadingLevel.value = true
  powerUps.value = getInitialPowerUps()

  // 生成棋盘
  try {
    const remoteConfig = await getLinkMatchLevelConfig(currentLevel.value, {
      difficulty: fallbackDifficulty,
      mode: gameMode.value,
      regenerate
    })
    currentStageConfig.value = remoteConfig
    maxLayers.value = remoteConfig.layers
    currentLayer.value = 1
    timeLeft.value = remoteConfig.time
    movesLeft.value = remoteConfig.moves
    cells.value = normalizeCells(remoteConfig.cells)
  } catch (error) {
    console.error('[LinkMatch] failed to load level config, fallback to local generator:', error)
    currentStageConfig.value = null
    maxLayers.value = fallbackConfig.layers
    currentLayer.value = 1
    timeLeft.value = fallbackConfig.time
    movesLeft.value = fallbackConfig.moves
    generateBoard()
  } finally {
    isLoadingLevel.value = false
  }

  // 启动游戏计时器
  startGameTimer()
}

/**
 * 生成棋盘
 * 功能：根据难度生成带有多层堆叠的连连看棋盘
 */
const generateBoard = () => {
  const config = boardConfig.value
  const totalCells = config.rows * config.cols
  const newCells: (Cell | null)[] = new Array(totalCells).fill(null)

  // 计算每种图标需要的数量（确保成对）
  const pairsNeeded = Math.floor(totalCells / 2)
  const icons: string[] = []

  for (let i = 0; i < pairsNeeded; i++) {
    const icon = TILE_ICONS[i % config.types]
    icons.push(icon, icon)
  }

  // 打乱图标顺序
  for (let i = icons.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[icons[i], icons[j]] = [icons[j], icons[i]]
  }

  // 填充格子
  let iconIndex = 0
  for (let layer = 1; layer <= config.layers; layer++) {
    const layerCells = Math.floor(totalCells * (0.6 + layer * 0.1))

    for (let i = 0; i < layerCells && iconIndex < icons.length; i++) {
      let position: number
      let attempts = 0

      do {
        position = Math.floor(Math.random() * totalCells)
        attempts++
      } while (attempts < 50 && newCells[position] !== null)

      if (attempts < 50) {
        const row = Math.floor(position / config.cols)
        const col = position % config.cols

        newCells[position] = {
          id: iconIndex,
          icon: icons[iconIndex],
          type: TILE_ICONS.indexOf(icons[iconIndex]),
          layer,
          row,
          col
        }
        iconIndex++
      }
    }
  }

  cells.value = newCells

  // 确保有可消除的组合
  ensureSolvable()
}

/**
 * 确保棋盘可解
 * 功能：检查并确保至少存在一对可连接的相同图标
 */
const ensureSolvable = () => {
  if (!hasRemainingCells()) {
    return
  }

  let attempts = 0
  while (!hasValidMoves() && attempts < 6) {
    randomizeRemainingTiles()
    attempts++
  }
}

const hasValidMoves = (): boolean => {
  const typeMap = new Map<number, number[]>()

  cells.value.forEach((cell, index) => {
    if (cell && cell.layer <= currentLayer.value) {
      if (!typeMap.has(cell.type)) {
        typeMap.set(cell.type, [])
      }
      typeMap.get(cell.type)?.push(index)
    }
  })

  for (const [, indices] of typeMap) {
    if (indices.length >= 2) {
      for (let i = 0; i < indices.length; i++) {
        for (let j = i + 1; j < indices.length; j++) {
          if (canConnect(indices[i], indices[j])) {
            return true
          }
        }
      }
    }
  }

  return false
}

/**
 * 处理格子点击
 * 功能：处理玩家点击格子的逻辑
 * @param index - 格子索引
 */
const handleCellClick = (index: number) => {
  if (isLoadingLevel.value) return
  if (!hasStarted.value || isPaused.value || showStartOverlay.value || showLevelComplete.value || showGameOver.value) return

  const cell = cells.value[index]
  if (!cell || cell.layer > currentLayer.value) return

  // 正常选择逻辑
  const selectedIndex = selectedCells.value.indexOf(index)

  if (selectedIndex > -1) {
    // 取消选择
    selectedCells.value.splice(selectedIndex, 1)
  } else if (selectedCells.value.length < 2) {
    // 添加选择
    selectedCells.value.push(index)

    // 检查是否匹配
    if (selectedCells.value.length === 2) {
      checkMatch()
    }
  }
}

/**
 * 检查匹配
 * 功能：检查选中的两个格子是否可以连接消除
 */
const checkMatch = () => {
  const [index1, index2] = selectedCells.value
  const cell1 = cells.value[index1]
  const cell2 = cells.value[index2]

  if (!cell1 || !cell2 || cell1.type !== cell2.type) {
    // 不匹配，延迟清除选择
    setTimeout(() => {
      selectedCells.value = []
      combo.value = 0
    }, 500)
    return
  }

  // 检查是否可以连接
  if (canConnect(index1, index2)) {
    // 匹配成功
    handleMatchSuccess(index1, index2)
  } else {
    // 无法连接
    setTimeout(() => {
      selectedCells.value = []
      combo.value = 0
    }, 500)
  }
}

/**
 * 检查是否可以连接
 * 功能：检查两个格子之间是否可以通过不超过两次转弯的路径连接
 * @param index1 - 第一个格子索引
 * @param index2 - 第二个格子索引
 * @returns 是否可以连接
 */
const canConnect = (index1: number, index2: number): boolean => {
  const config = boardConfig.value
  const row1 = Math.floor(index1 / config.cols)
  const col1 = index1 % config.cols
  const row2 = Math.floor(index2 / config.cols)
  const col2 = index2 % config.cols

  // 直接连接（直线）
  if (canConnectDirectly(row1, col1, row2, col2)) {
    return true
  }

  // 一次转弯
  if (canConnectWithOneTurn(row1, col1, row2, col2)) {
    return true
  }

  // 两次转弯
  if (canConnectWithTwoTurns(row1, col1, row2, col2)) {
    return true
  }

  return false
}

/**
 * 直接连接检查
 * 功能：检查两个格子是否可以在一条直线上连接
 */
const canConnectDirectly = (row1: number, col1: number, row2: number, col2: number): boolean => {
  const config = boardConfig.value

  if (row1 === row2) {
    // 同一行
    const minCol = Math.min(col1, col2)
    const maxCol = Math.max(col1, col2)
    for (let c = minCol + 1; c < maxCol; c++) {
      const index = row1 * config.cols + c
      if (cells.value[index] && cells.value[index]!.layer <= currentLayer.value) {
        return false
      }
    }
    return true
  }

  if (col1 === col2) {
    // 同一列
    const minRow = Math.min(row1, row2)
    const maxRow = Math.max(row1, row2)
    for (let r = minRow + 1; r < maxRow; r++) {
      const index = r * config.cols + col1
      if (cells.value[index] && cells.value[index]!.layer <= currentLayer.value) {
        return false
      }
    }
    return true
  }

  return false
}

/**
 * 一次转弯连接检查
 * 功能：检查两个格子是否可以通过一个转角点连接
 */
const canConnectWithOneTurn = (row1: number, col1: number, row2: number, col2: number): boolean => {
  const config = boardConfig.value

  // 尝试两个转角点
  const corner1 = row1 * config.cols + col2
  const corner2 = row2 * config.cols + col1

  // 检查转角点1
  if (!cells.value[corner1] || cells.value[corner1]!.layer > currentLayer.value) {
    if (canConnectDirectly(row1, col1, row1, col2) && canConnectDirectly(row1, col2, row2, col2)) {
      return true
    }
  }

  // 检查转角点2
  if (!cells.value[corner2] || cells.value[corner2]!.layer > currentLayer.value) {
    if (canConnectDirectly(row1, col1, row2, col1) && canConnectDirectly(row2, col1, row2, col2)) {
      return true
    }
  }

  return false
}

/**
 * 两次转弯连接检查
 * 功能：检查两个格子是否可以通过两个转角点连接
 */
const canConnectWithTwoTurns = (row1: number, col1: number, row2: number, col2: number): boolean => {
  const config = boardConfig.value

  // 尝试所有可能的中间路径
  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      if (r === row1 && c === col1) continue
      if (r === row2 && c === col2) continue

      const midIndex = r * config.cols + c
      if (cells.value[midIndex] && cells.value[midIndex]!.layer <= currentLayer.value) continue

      if (canConnectWithOneTurn(row1, col1, r, c) && canConnectDirectly(r, c, row2, col2)) {
        return true
      }
      if (canConnectDirectly(row1, col1, r, c) && canConnectWithOneTurn(r, c, row2, col2)) {
        return true
      }
    }
  }

  return false
}

/**
 * 处理匹配成功
 * 功能：处理匹配成功后的得分、特效和状态更新
 * @param index1 - 第一个格子索引
 * @param index2 - 第二个格子索引
 */
const handleMatchSuccess = (index1: number, index2: number) => {
  // 更新连击
  combo.value++
  if (combo.value > maxCombo.value) {
    maxCombo.value = combo.value
  }

  // 计算得分
  const baseScore = 10
  const comboBonus = Math.min(combo.value * 5, 50)
  const layerBonus = currentLayer.value * 5
  score.value += baseScore + comboBonus + layerBonus

  // 显示连线路径
  showConnectionLine(index1, index2)

  // 播放消除特效
  addMatchEffect(index1, index2)

  // 标记已匹配格子
  matchedCells.value.push(index1, index2)

  // 延迟移除格子
  setTimeout(() => {
    cells.value[index1] = null
    cells.value[index2] = null
    matchedCells.value = []
    selectedCells.value = []

    // 应用重力
    applyGravity()

    // 更新层状态
    checkLayerComplete()

    // 检查是否已通关
    checkLevelComplete()
    if (showLevelComplete.value) {
      return
    }

    if (hasRemainingCells() && !hasValidMoves()) {
      ensureSolvable()
      addEffect({
        id: effectIdCounter++,
        type: 'rainbow',
        content: '🔀 已自动重排',
        style: {
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }
      })
      setStatusMessage('没有可连接的组合，已自动重排。')
    }

    // 检查是否失败
    checkGameOver()
  }, 300)

  // 限步模式消耗一步
  if (gameMode.value === 'moves') {
    movesLeft.value--
  }
}

const showConnectionLine = (index1: number, index2: number) => {
  // 简化实现：显示一条直线连接
  showConnection.value = true
  setTimeout(() => {
    showConnection.value = false
  }, 300)
}

/**
 * 添加匹配特效
 * 功能：在匹配位置添加视觉特效
 * @param index1 - 第一个格子索引
 * @param index2 - 第二个格子索引
 */
const addMatchEffect = (index1: number, index2: number) => {
  const config = boardConfig.value

  // 星星特效
  const positions = [index1, index2]
  positions.forEach((index, i) => {
    const row = Math.floor(index / config.cols)
    const col = index % config.cols

    activeEffects.value.push({
      id: effectIdCounter++,
      type: 'star',
      content: '✨',
      style: {
        left: `${col * 50 + 25}px`,
        top: `${row * 50 + 25}px`,
        animationDelay: `${i * 0.1}s`
      }
    })
  })

  // 连击特效
  if (combo.value >= 3) {
    activeEffects.value.push({
      id: effectIdCounter++,
      type: 'combo',
      content: `${combo.value}连击!`,
      style: {
        left: '50%',
        top: '40%',
        transform: 'translate(-50%, -50%)'
      }
    })
  }

  // 清理特效
  setTimeout(() => {
    activeEffects.value = []
  }, 1000)
}

/**
 * 应用重力下落
 * 功能：让上方的格子下落到空位
 */
const applyGravity = () => {
  hasGravity.value = true
  const config = boardConfig.value

  for (let col = 0; col < config.cols; col++) {
    let writePos = config.rows - 1

    for (let row = config.rows - 1; row >= 0; row--) {
      const index = row * config.cols + col
      if (cells.value[index]) {
        if (writePos !== row) {
          cells.value[writePos * config.cols + col] = {
            ...cells.value[index]!,
            row: writePos
          }
          cells.value[index] = null
        }
        writePos--
      }
    }
  }

  setTimeout(() => {
    hasGravity.value = false
  }, 300)
}

/**
 * 检查层数完成
 * 功能：检查当前层是否已消除完毕，进入下一层
 */
const checkLayerComplete = () => {
  const currentLayerCells = cells.value.filter(
    cell => cell && cell.layer === currentLayer.value
  )

  if (currentLayerCells.length === 0 && currentLayer.value < maxLayers.value) {
    currentLayer.value++
    // 层数切换特效
    addEffect({
      id: effectIdCounter++,
      type: 'rainbow',
      content: '🌈 进入第' + currentLayer.value + '层!',
      style: {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }
    })
  }
}

/**
 * 添加特效
 * 功能：添加一个特效到特效列表
 * @param effect - 特效对象
 */
const addEffect = (effect: Effect) => {
  activeEffects.value.push(effect)
  setTimeout(() => {
    activeEffects.value = activeEffects.value.filter(e => e.id !== effect.id)
  }, 2000)
}

/**
 * 检查关卡完成
 * 功能：检查是否所有格子都已消除
 */
const checkLevelComplete = () => {
  const remainingCells = cells.value.filter(cell => cell !== null)
  if (remainingCells.length === 0) {
    earnedStars.value = calculateStars()
    updateLevelProgress(earnedStars.value)
    showGameOver.value = false
    showLevelComplete.value = true
    stopGameTimer()
  }
}

/**
 * 计算星星数
 * 功能：根据得分和表现计算获得的星星数
 * @returns 星星数（1-3）
 */
const calculateStars = (): number => {
  const config = boardConfig.value
  const maxScore = config.rows * config.cols * 20
  const ratio = score.value / maxScore

  if (ratio >= 0.8) return 3
  if (ratio >= 0.5) return 2
  return 1
}

/**
 * 检查游戏结束
 * 功能：检查是否满足游戏结束条件
 */
const checkGameOver = () => {
  if (showLevelComplete.value || !hasRemainingCells()) {
    return
  }

  // 时间用完
  if (gameMode.value === 'time' && timeLeft.value <= 0) {
    gameOverReason.value = '时间到！'
    showGameOver.value = true
    stopGameTimer()
    return
  }

  // 步数用完
  if (gameMode.value === 'moves' && movesLeft.value <= 0) {
    gameOverReason.value = '步数用完！'
    showGameOver.value = true
    stopGameTimer()
    return
  }

  // 没有可移动的格子
  if (!hasValidMoves()) {
    gameOverReason.value = '没有可消除的组合了！'
    showGameOver.value = true
    stopGameTimer()
  }
}

/**
 * 启动游戏计时器
 * 功能：启动游戏的主计时器
 */
const startGameTimer = () => {
  stopGameTimer()

  if (!hasStarted.value || showStartOverlay.value || isPaused.value || showLevelComplete.value || showGameOver.value) {
    return
  }

  if (gameMode.value === 'time') {
    gameTimer = window.setInterval(() => {
      if (!isPaused.value) {
        timeLeft.value--
        if (timeLeft.value <= 0) {
          checkGameOver()
        }
      }
    }, 1000)
  }
}

/**
 * 停止游戏计时器
 * 功能：停止游戏的主计时器
 */
const stopGameTimer = () => {
  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }
}

/**
 * 切换游戏模式
 * 功能：在限时模式和限步模式之间切换
 * @param mode - 目标模式
 */
const switchMode = (mode: GameMode) => {
  gameMode.value = mode
  void restartLevel()
}

/**
 * 使用道具
 * 功能：使用选中的道具
 * @param type - 道具类型
 */
const usePowerUp = (type: string) => {
  if (powerUps.value[type as keyof typeof powerUps.value] <= 0) return

  if (type === 'hint') {
    showHint()
  } else if (type === 'shuffle') {
    shuffleBoard()
    setStatusMessage('棋盘已重新排列。')
  } else if (type === 'time') {
    timeLeft.value += 30
  }

  powerUps.value[type as keyof typeof powerUps.value]--
  activePowerUp.value = null
}

/**
 * 显示提示
 * 功能：高亮显示一对可匹配的格子
 */
const showHint = () => {
  const typeMap = new Map<number, number[]>()

  cells.value.forEach((cell, index) => {
    if (cell && cell.layer <= currentLayer.value) {
      if (!typeMap.has(cell.type)) {
        typeMap.set(cell.type, [])
      }
      typeMap.get(cell.type)?.push(index)
    }
  })

  for (const [, indices] of typeMap) {
    for (let i = 0; i < indices.length; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        if (canConnect(indices[i], indices[j])) {
          canMatchCells.value = [indices[i], indices[j]]
          setTimeout(() => {
            canMatchCells.value = []
          }, 2000)
          return
        }
      }
    }
  }
}

/**
 * 打乱棋盘
 * 功能：重新排列棋盘上的图标
 */
const shuffleBoard = () => {
  randomizeRemainingTiles()
  ensureSolvable()
}

/**
 * 切换暂停状态
 * 功能：暂停或继续游戏
 */
const togglePause = () => {
  if (!hasStarted.value || showStartOverlay.value || showLevelComplete.value || showGameOver.value) return

  isPaused.value = !isPaused.value
  if (isPaused.value) {
    stopGameTimer()
  } else {
    startGameTimer()
  }
}

/**
 * 重新开始关卡
 * 功能：重置当前关卡
 */
const restartLevel = async () => {
  stopGameTimer()
  hasStarted.value = false
  showStartOverlay.value = true
  await initLevel(true)
}

/**
 * 下一关
 * 功能：进入下一关卡
 */
const nextLevel = async () => {
  if (!hasNextLevel.value) {
    hasStarted.value = false
    showStartOverlay.value = true
    return
  }
  currentLevel.value++
  hasStarted.value = false
  showStartOverlay.value = true
  await initLevel()
}

const selectLevel = async (level: number) => {
  if (level < 1 || level > unlockedLevel.value || level === currentLevel.value) return

  stopGameTimer()
  currentLevel.value = level
  hasStarted.value = false
  showStartOverlay.value = true
  isPaused.value = false
  showGameOver.value = false
  showLevelComplete.value = false
  await initLevel()
}

/**
 * 结束游戏
 * 功能：结束当前游戏并返回
 */
const endGame = () => {
  stopGameTimer()
  clearStatusMessage()
  hasStarted.value = false
  showStartOverlay.value = true
  isPaused.value = false
  showGameOver.value = false
  showLevelComplete.value = false
  emit('exit')
}

/**
 * 分享结果
 * 功能：分享当前关卡成绩
 */
const shareResult = () => {
  alert(`我在趣味连连看第${currentLevel.value}关获得了${score.value}分，${earnedStars.value}颗星！`)
}

/**
 * 清理资源
 * 功能：清理定时器等资源
 */
const startGame = () => {
  hasStarted.value = true
  showStartOverlay.value = false
  isPaused.value = false
  startGameTimer()
}

const resumeGame = () => {
  if (!hasStarted.value) return
  isPaused.value = false
  startGameTimer()
}

const cleanup = () => {
  clearStatusMessage()
  stopGameTimer()
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadLevelProgress()
  void initLevel()
})

onUnmounted(() => {
  cleanup()
})

// 暴露方法给父组件
defineExpose({
  cleanup
})
</script>

<style scoped>
/* ==================== 游戏卡片容器 ==================== */
.linkmatch-play-card {
  background: linear-gradient(135deg, #FFF9E6 0%, #FFF0F5 100%);
  border-radius: 24px;
  padding: 20px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(255, 182, 193, 0.3);
}

/* ==================== 游戏头部 ==================== */
.linkmatch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.level-info {
  display: flex;
  gap: 10px;
  align-items: center;
}

.level-badge {
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(255, 182, 193, 0.4);
}

.difficulty-badge {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
}

.difficulty-easy { background: #90EE90; color: #2D5A3D; }
.difficulty-normal { background: #87CEEB; color: #1E3A5F; }
.difficulty-medium { background: #FFD700; color: #8B6914; }
.difficulty-hard { background: #FF6B6B; color: white; }

.game-mode-tabs {
  display: flex;
  gap: 8px;
}

.mode-tab {
  padding: 8px 16px;
  background: white;
  border: 2px solid #E0E0E0;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-tab:hover {
  border-color: #FFB6C1;
}

.mode-tab.active {
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  color: white;
  border-color: transparent;
}

/* ==================== 状态栏 ==================== */
.status-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 10px 16px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex: 1;
  min-width: 120px;
}

.status-icon {
  font-size: 1.3rem;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background: #F0F0F0;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ECDC4 0%, #44A08D 100%);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-fill.warning {
  background: linear-gradient(90deg, #FF6B6B 0%, #FF8E8E 100%);
  animation: pulse-warning 1s infinite;
}

@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: 700;
  color: #333;
}

.score-display {
  flex: 0 0 auto;
  min-width: 100px;
}

.score-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #FF69B4;
}

.combo-display {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  animation: combo-pulse 0.5s infinite;
}

@keyframes combo-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.combo-text {
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* ==================== 游戏棋盘区域 ==================== */
.game-board-container {
  background: white;
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.layer-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  border-radius: 12px;
}

.layer-text {
  font-weight: 600;
  color: #2E7D32;
}

.layer-dots {
  display: flex;
  gap: 6px;
}

.layer-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #E0E0E0;
  transition: all 0.3s ease;
}

.layer-dot.active {
  background: #81C784;
}

.layer-dot.current {
  background: #4CAF50;
  transform: scale(1.3);
  box-shadow: 0 0 8px #4CAF50;
}

/* 棋盘 */
.game-board {
  display: grid;
  gap: 6px;
  position: relative;
}

/* 连线层 */
.connection-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.connection-line {
  animation: dash 0.3s linear;
}

@keyframes dash {
  to { stroke-dashoffset: -12; }
}

/* 特效层 */
.effects-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 20;
}

.effect-item {
  position: absolute;
  font-size: 1.5rem;
  animation: effect-fade 1s ease forwards;
  pointer-events: none;
}

.effect-item.star {
  animation: star-burst 1s ease forwards;
}

.effect-item.combo {
  font-size: 2rem;
  font-weight: 700;
  color: #FFD700;
  text-shadow: 0 2px 8px rgba(255, 215, 0, 0.5);
  animation: combo-pop 1s ease forwards;
}

@keyframes star-burst {
  0% { transform: scale(0) rotate(0deg); opacity: 1; }
  50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
  100% { transform: scale(0) rotate(360deg); opacity: 0; }
}

@keyframes combo-pop {
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1) translateY(-30px); opacity: 0; }
}

/* 格子 */
.board-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.board-cell.empty {
  background: transparent;
  cursor: default;
}

.board-cell:not(.empty):hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.board-cell.selected {
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  animation: selected-pulse 0.5s infinite;
}

@keyframes selected-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 182, 193, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(255, 182, 193, 0); }
}

.board-cell.matched {
  animation: matched-fade 0.3s ease forwards;
}

@keyframes matched-fade {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0); opacity: 0; }
}

.board-cell.can-match {
  animation: hint-glow 1s infinite;
}

@keyframes hint-glow {
  0%, 100% { box-shadow: 0 0 0 0 #FFD700; }
  50% { box-shadow: 0 0 20px 4px #FFD700; }
}

.board-cell.layer-bottom {
  opacity: 0.5;
  filter: grayscale(0.5);
}

/* 方块 */
.tile {
  width: 90%;
  height: 90%;
  background: linear-gradient(135deg, #FFF8E7 0%, #FFEFD5 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.tile.has-gravity {
  animation: gravity-fall 0.3s ease;
}

@keyframes gravity-fall {
  0% { transform: translateY(-20px); opacity: 0.5; }
  100% { transform: translateY(0); opacity: 1; }
}

.tile-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.tile-shine {
  position: absolute;
  top: 5%;
  left: 5%;
  width: 30%;
  height: 30%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%);
  border-radius: 50%;
}

/* ==================== 道具栏 ==================== */
.power-ups {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.power-up-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: white;
  border: 2px solid #E0E0E0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.power-up-btn:hover:not(.disabled) {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.power-up-btn.active {
  border-color: #FFD700;
  background: #FFFEF0;
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.4);
}

.power-up-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.power-icon {
  font-size: 1.6rem;
}

.power-count {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: #FF6B6B;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.power-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: #666;
}

/* ==================== 控制按钮 ==================== */
.game-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: white;
  border: 2px solid #E0E0E0;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.pause-btn:hover { border-color: #4ECDC4; }
.restart-btn:hover { border-color: #FF6B6B; }
.restart-btn.emphasized {
  background: linear-gradient(135deg, #FFEDD5 0%, #FECACA 100%);
  border-color: #FB7185;
  color: #9F1239;
  box-shadow: 0 8px 18px rgba(251, 113, 133, 0.22);
}
.restart-btn.emphasized:hover {
  box-shadow: 0 10px 22px rgba(251, 113, 133, 0.28);
}
.end-btn:hover { border-color: #999; }

.btn-icon {
  font-size: 1.2rem;
}

/* ==================== 暂停遮罩 ==================== */
.pause-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.pause-modal {
  background: linear-gradient(180deg, #fffef7 0%, #fff7fb 100%);
  padding: 40px;
  border-radius: 24px;
  text-align: center;
  animation: popIn 0.3s ease;
  width: min(92vw, 440px);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
}

.overlay-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 182, 193, 0.24);
  color: #9f1239;
  font-size: 0.78rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.overlay-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.secondary-overlay-btn {
  padding: 14px 24px;
  border: 1px solid #f9a8d4;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
  color: #9f1239;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.secondary-overlay-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(244, 114, 182, 0.18);
}

.secondary-overlay-btn.warning {
  border-color: #fb7185;
  color: #9f1239;
}

.start-tips {
  margin-bottom: 28px;
}

.level-select-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 20px;
}

.level-chip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(244, 114, 182, 0.28);
  background: rgba(255, 255, 255, 0.86);
  color: #7c2d12;
  cursor: pointer;
  transition: all 0.25s ease;
}

.level-chip:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(244, 114, 182, 0.16);
}

.level-chip.active {
  border-color: #fb7185;
  background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
  box-shadow: 0 10px 20px rgba(251, 113, 133, 0.18);
}

.level-chip.locked {
  opacity: 0.45;
  cursor: not-allowed;
}

.level-chip-label {
  font-size: 0.85rem;
  font-weight: 700;
}

.level-chip-stars {
  font-size: 0.72rem;
  color: #9f1239;
}

.start-modal p {
  line-height: 1.7;
}

.pause-modal h3 {
  font-size: 1.6rem;
  margin-bottom: 12px;
  color: #333;
}

.pause-modal p {
  color: #666;
  margin-bottom: 24px;
}

.pause-stats {
  display: flex;
  gap: 32px;
  justify-content: center;
  margin-bottom: 24px;
}

.pause-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pause-stat span {
  font-size: 0.85rem;
  color: #666;
}

.pause-stat strong {
  font-size: 1.5rem;
  color: #FF69B4;
}

.resume-btn {
  padding: 14px 32px;
  background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 132px;
}

.resume-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(78, 205, 196, 0.4);
}

/* ==================== 关卡完成弹窗 ==================== */
.level-complete-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.level-complete-modal {
  background: white;
  border-radius: 24px;
  padding: 40px;
  position: relative;
  overflow: hidden;
  animation: celebrate-in 0.5s ease;
}

@keyframes celebrate-in {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.celebration-effects {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.star-particle {
  position: absolute;
  font-size: 1.5rem;
  animation: particle-fly 1.5s ease forwards;
}

@keyframes particle-fly {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1); opacity: 0; }
}

.modal-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.complete-title {
  font-size: 1.8rem;
  margin-bottom: 24px;
  color: #333;
}

.complete-stats {
  margin-bottom: 24px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #F0F0F0;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row .highlight {
  font-weight: 700;
  color: #FF69B4;
}

.star-rating {
  margin-bottom: 24px;
}

.star {
  font-size: 2.5rem;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.star.earned {
  opacity: 1;
  animation: star-pop 0.5s ease;
}

@keyframes star-pop {
  0% { transform: scale(0) rotate(-180deg); }
  100% { transform: scale(1) rotate(0); }
}

.complete-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.share-btn {
  background: #F0F0F0;
  color: #333;
}

.share-btn:hover {
  background: #E0E0E0;
}

.next-btn {
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  color: white;
}

.next-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(255, 182, 193, 0.4);
}

/* ==================== 游戏结束弹窗 ==================== */
.game-over-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.game-over-modal {
  background: white;
  padding: 40px;
  border-radius: 24px;
  text-align: center;
  animation: popIn 0.3s ease;
}

.game-over-modal h2 {
  font-size: 1.6rem;
  margin-bottom: 12px;
  color: #666;
}

.game-over-modal p {
  color: #999;
  margin-bottom: 24px;
}

.final-score {
  margin-bottom: 24px;
}

.final-score span {
  display: block;
  color: #666;
  margin-bottom: 8px;
}

.final-score strong {
  font-size: 2rem;
  color: #FF69B4;
}

.game-over-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 600px) {
  .linkmatch-play-card {
    padding: 12px;
  }

  .linkmatch-header {
    flex-direction: column;
    align-items: stretch;
  }

  .game-mode-tabs {
    justify-content: center;
  }

  .status-bar {
    flex-direction: column;
  }

  .power-ups {
    grid-template-columns: repeat(2, 1fr);
  }

  .game-controls {
    flex-wrap: wrap;
  }

  .overlay-actions {
    flex-direction: column;
  }

  .level-select-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .secondary-overlay-btn,
  .resume-btn {
    width: 100%;
  }

  .tile-icon {
    font-size: 1.4rem;
  }
}
</style>
