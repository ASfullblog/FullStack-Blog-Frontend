<template>
  <!-- 闯关挪车游戏组件 - 华容道式滑动解谜 -->
  <div class="play-card parking-play-card">
    <!-- 游戏头部信息栏 -->
    <div class="parking-header">
      <div class="level-info">
        <span class="level-badge">关卡 {{ currentLevel }}</span>
        <div class="difficulty-selector">
          <select v-model="selectedDifficulty" @change="onDifficultyChange" class="difficulty-select">
            <option value="easy">容易</option>
            <option value="normal">普通</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>
      </div>
      <div class="game-stats">
        <div class="stat-item">
          <span class="stat-icon">⭐</span>
          <span class="stat-value">{{ stars }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🎯</span>
          <span class="stat-value">{{ moves }}</span>
        </div>
      </div>
    </div>

    <!-- 场景主题指示器 -->
    <div class="theme-indicator" :class="currentTheme">
      <span class="theme-icon">{{ themeIcon }}</span>
      <span class="theme-name">{{ themeName }}</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">🚗</div>
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 游戏主区域 - 停车场 -->
    <div class="parking-lot-container" v-show="!isLoading">
      <div class="parking-lot" :style="gridStyle">
        <!-- 出口标记 -->
        <div class="exit-gate" :class="{ open: isExitOpen }" :style="exitStyle">
          <span class="exit-icon">🚪</span>
          <span class="exit-text">EXIT</span>
        </div>

        <!-- 网格背景 -->
        <div class="grid-background" :style="gridBackgroundStyle">
          <div
            v-for="n in gridSize * gridSize"
            :key="n"
            class="grid-cell"
          ></div>
        </div>

        <!-- 车辆 -->
        <div
          v-for="car in cars"
          :key="car.id"
          class="car"
          :class="[
            car.type,
            car.orientation,
            { 'target-car': car.isTarget, 'angry': car.anger > 50, 'smoking': car.anger > 80, 'dragging': draggingCar?.id === car.id }
          ]"
          :style="getCarStyle(car)"
          @mousedown="startDrag(car, $event)"
          @touchstart.prevent="startDrag(car, $event)"
        >
          <div class="car-body">
            <div class="car-windows">
              <div class="window front"></div>
              <div class="window back"></div>
            </div>
            <div class="wheels">
              <div class="wheel front-left"></div>
              <div class="wheel front-right"></div>
              <div class="wheel back-left"></div>
              <div class="wheel back-right"></div>
            </div>
            <div class="lights">
              <div class="light left"></div>
              <div class="light right"></div>
            </div>
            <div class="car-face" v-if="car.anger > 30">
              <span class="face-icon">{{ getCarFace(car.anger) }}</span>
            </div>
          </div>
          <div v-if="car.anger > 50" class="anger-effects">
            <span class="anger-icon">💢</span>
            <div class="smoke" v-if="car.anger > 80"></div>
          </div>
        </div>

        <!-- 提示方向指示器 -->
        <div v-if="showHint" class="direction-hints">
          <div
            v-for="dir in availableDirections"
            :key="dir"
            class="direction-arrow"
            :class="dir"
            :style="getDirectionArrowStyle(dir)"
          >
            <span class="arrow-icon">{{ getArrowIcon(dir) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 控制按钮区 -->
    <div class="parking-controls">
      <button class="control-btn hint-btn" :class="{ disabled: hints <= 0 }" @click="useHint" :disabled="hints <= 0">
        <span class="btn-icon">💡</span>
        <span class="btn-text">提示({{ hints }})</span>
      </button>
      <button class="control-btn undo-btn" :class="{ disabled: moveHistory.length === 0 }" @click="undoMove">
        <span class="btn-icon">↩️</span>
        <span class="btn-text">撤销</span>
      </button>
      <button class="control-btn pause-btn" @click="togglePause">
        <span class="btn-icon">{{ isPaused ? '▶️' : '⏸️' }}</span>
        <span class="btn-text">{{ isPaused ? '继续' : '暂停' }}</span>
      </button>
      <button class="control-btn restart-btn" @click="restartLevel">
        <span class="btn-icon">🔄</span>
        <span class="btn-text">重开</span>
      </button>
    </div>

    <!-- 暂停遮罩 -->
    <div v-if="isPaused" class="pause-overlay" @click="togglePause">
      <div class="pause-modal" @click.stop>
        <h3>游戏暂停</h3>
        <p>当前进度已保存</p>
        <button class="resume-btn" @click="togglePause">继续游戏</button>
      </div>
    </div>

    <!-- 车辆驶出动画层 -->
    <div v-if="exitingCar" class="exit-animation-overlay">
      <div class="exit-trail"></div>
    </div>

    <!-- 关卡过渡提示 -->
    <div v-if="showLevelTransition" class="level-transition">
      <div class="transition-content">
        <span class="transition-icon">🚗</span>
        <span class="transition-text">第 {{ currentLevel }} 关</span>
      </div>
    </div>

    <!-- 闯关成功弹窗 -->
    <div v-if="showLevelComplete" class="level-complete-overlay">
      <div class="level-complete-modal" @click.stop>
        <div class="celebration">🎉</div>
        <h3>闯关成功！</h3>
        <div class="level-stats">
          <div class="stat">
            <span class="stat-label">步数</span>
            <span class="stat-value">{{ moves }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">获得星星</span>
            <span class="stat-value stars">{{ '⭐'.repeat(levelStars) }}</span>
          </div>
        </div>
        <div class="level-actions">
          <button class="action-btn share-btn" @click="handleShare">
            <span>📤</span>
            <span>分享</span>
          </button>
          <button class="action-btn next-btn" @click="nextLevelAndClose">
            <span>下一关</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  getParkingRushLevel as fetchLevelFromApi,
  submitParkingRushResult as submitResultToApi,
  getUserGameData,
  saveParkingRushDifficulty
} from '../../api/game'
import { useUserStore } from '../../stores/userStore'

// ==================== 类型定义 ====================
type CarType = 'small' | 'truck' | 'fire' | 'police' | 'ambulance'
type Orientation = 'horizontal' | 'vertical'
type ThemeType = 'residential' | 'mall' | 'airport'
type Difficulty = 'easy' | 'medium' | 'hard' | 'normal'
type Direction = 'up' | 'down' | 'left' | 'right'

interface Car {
  id: number
  type: CarType
  orientation: Orientation
  length: number
  row: number
  col: number
  isTarget: boolean
  anger: number
  color: string
}

interface MoveRecord {
  carId: number
  fromRow: number
  fromCol: number
  toRow: number
  toCol: number
}

// ==================== 游戏配置 ====================
const THEMES: Record<ThemeType, { name: string; icon: string; gridSize: number }> = {
  residential: { name: '住宅小区', icon: '🏘️', gridSize: 6 },
  mall: { name: '商场地库', icon: '🏬', gridSize: 7 },
  airport: { name: '机场停车场', icon: '✈️', gridSize: 8 }
}

const CAR_COLORS: Record<CarType, string> = {
  small: '#FF6B6B',
  truck: '#4ECDC4',
  fire: '#FF4757',
  police: '#3742FA',
  ambulance: '#FFFFFF'
}

// ==================== 关卡数据类型 ====================
/**
 * 后端返回的关卡数据结构
 */
interface LevelData {
  id: number
  levelNumber: number
  mode: string
  difficulty: Difficulty
  gridSize: number
  exitRow: number
  boardData: {
    cars: Array<{
      id: number
      col: number
      row: number
      type: CarType
      color: string
      length: number
      isTarget: boolean
      orientation: Orientation
    }>
    exitRow: number
    gridSize: number
  }
  minSteps: number
  evacuationConfig: null
}

// 根据屏幕大小和网格大小动态计算格子尺寸
/**
 * 根据容器宽度和网格大小动态计算格子尺寸
 * 优化格子大小，使车辆与正常车身比例更协调
 * 增大格子尺寸，减少间隙，使车辆更饱满
 */
const getCellSize = () => {
  const containerWidth = document.querySelector('.parking-lot-container')?.clientWidth || window.innerWidth - 48
  const gs = gridSize.value || 6

  // 计算可用宽度（减去padding）
  const availableWidth = containerWidth - 24

  // 根据网格大小计算合适的格子尺寸
  // 增大格子尺寸，使车辆更饱满，比例更协调
  if (gs <= 5) {
    // 4x4 ~ 5x5：小网格大格子
    return Math.min(availableWidth / gs, 72)
  } else if (gs <= 6) {
    return Math.min(availableWidth / gs, 64)
  } else if (gs <= 7) {
    return Math.min(availableWidth / gs, 58)
  } else if (gs <= 8) {
    return Math.min(availableWidth / gs, 52)
  } else if (gs <= 10) {
    return Math.min(availableWidth / gs, 44)
  } else if (gs <= 12) {
    return Math.min(availableWidth / gs, 38)
  } else {
    // 13x13 ~ 15x15
    return Math.min(availableWidth / gs, 32)
  }
}

// ==================== 游戏状态 ====================
const currentLevel = ref(1)
const moves = ref(0)
const stars = ref(0)
const hints = ref(3)
const isPaused = ref(false)
const showHint = ref(false)
const showLevelTransition = ref(false) // 关卡过渡动画
const showLevelComplete = ref(false) // 闯关成功弹窗
const exitingCar = ref<Car | null>(null) // 正在驶出的车辆
const availableDirections = ref<Direction[]>([])
const moveHistory = ref<MoveRecord[]>([])
const cars = ref<Car[]>([])
const gridSize = ref(6)
const exitRow = ref(2)
const isExitOpen = ref(false)
const cellSize = ref(getCellSize())
const selectedDifficulty = ref<Difficulty>('easy') // 用户选择的难度（从后端获取）
const userCoins = ref(0) // 用户金币数（从后端获取）
const isLoading = ref(false) // 加载状态

let exitAnimationTimer: number | null = null // 驶出动画定时器
let levelTransitionTimer: number | null = null // 关卡过渡定时器

// 拖拽相关
const draggingCar = ref<Car | null>(null)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragCurrentX = ref(0)
const dragCurrentY = ref(0)
const userStore = useUserStore()

let angerTimer: number | null = null
let hintTimer: number | null = null

// ==================== 计算属性 ====================
const currentDifficulty = computed((): Difficulty => {
  // 难度由后端返回的关卡数据决定，不再由前端循环决定
  return selectedDifficulty.value
})

const difficultyText = computed(() => {
  const map: Record<Difficulty, string> = {
    easy: '容易',
    medium: '中等',
    hard: '困难',
    normal: '普通'
  }
  return map[currentDifficulty.value]
})

const difficultyClass = computed(() => `difficulty-${currentDifficulty.value}`)

const currentTheme = computed((): ThemeType => {
  const themeIndex = Math.floor((currentLevel.value - 1) / 10) % 3
  return ['residential', 'mall', 'airport'][themeIndex] as ThemeType
})

const themeName = computed(() => THEMES[currentTheme.value].name)
const themeIcon = computed(() => THEMES[currentTheme.value].icon)

const gridStyle = computed(() => {
  const size = cellSize.value * gridSize.value + 8
  return {
    width: `${size}px`,
    height: `${size}px`
  }
})

const gridBackgroundStyle = computed(() => ({
  gridTemplateColumns: `repeat(${gridSize.value}, 1fr)`,
  gridTemplateRows: `repeat(${gridSize.value}, 1fr)`
}))

/**
 * 出口门样式 - 使用CSS变量确保响应式
 */
const exitStyle = computed(() => {
  const size = cellSize.value
  return {
    top: `${exitRow.value * size + 4}px`,
    height: `${size - 8}px`,
    '--cell-size': `${size}px`
  } as Record<string, string>
})

const levelStars = computed(() => {
  const optimalMoves = getOptimalMoves()
  if (moves.value <= optimalMoves) return 3
  if (moves.value <= optimalMoves * 1.5) return 2
  return 1
})

// ==================== 方法 ====================
/**
 * 获取车辆样式
 * 优化车辆大小和间隙，使车辆更饱满，比例更协调
 * @param car - 车辆对象
 * @returns 样式对象
 */
const getCarStyle = (car: Car) => {
  const size = cellSize.value
  const gap = 3 // 减小间隙，使车辆更饱满
  const unit = size

  // 如果正在拖拽这辆车，显示拖拽位置
  let offsetX = 0
  let offsetY = 0
  if (draggingCar.value?.id === car.id) {
    offsetX = dragCurrentX.value
    offsetY = dragCurrentY.value
  }

  // 计算车辆尺寸，保持与格子比例协调
  const carWidth = car.orientation === 'horizontal' ? car.length * unit - gap : unit - gap
  const carHeight = car.orientation === 'vertical' ? car.length * unit - gap : unit - gap

  return {
    width: `${carWidth}px`,
    height: `${carHeight}px`,
    left: `${car.col * unit + offsetX + gap / 2}px`,
    top: `${car.row * unit + offsetY + gap / 2}px`,
    backgroundColor: car.color,
    zIndex: draggingCar.value?.id === car.id ? 100 : 10
  }
}

const getCarFace = (anger: number): string => {
  if (anger > 80) return '😡'
  if (anger > 50) return '😤'
  return '😐'
}

const getArrowIcon = (dir: Direction): string => {
  const icons: Record<Direction, string> = {
    up: '⬆️',
    down: '⬇️',
    left: '⬅️',
    right: '➡️'
  }
  return icons[dir]
}

/**
 * 获取方向箭头样式 - 确保箭头显示在目标车辆上且不会超出游戏区域
 * @param dir - 方向
 * @returns 样式对象
 */
const getDirectionArrowStyle = (dir: Direction) => {
  const targetCar = cars.value.find(c => c.isTarget)
  if (!targetCar) return {}

  const size = cellSize.value
  const arrowSize = 16 // 箭头大小

  // 计算车辆的中心位置
  let centerLeft: number
  let centerTop: number

  if (targetCar.orientation === 'horizontal') {
    // 横向车辆：中心在车辆中间
    centerLeft = targetCar.col * size + (targetCar.length * size) / 2 - arrowSize / 2
    centerTop = targetCar.row * size + size / 2 - arrowSize / 2
  } else {
    // 竖向车辆：中心在车辆中间
    centerLeft = targetCar.col * size + size / 2 - arrowSize / 2
    centerTop = targetCar.row * size + (targetCar.length * size) / 2 - arrowSize / 2
  }

  // 根据方向偏移箭头位置
  const offset = size * 0.4
  let left = centerLeft
  let top = centerTop

  switch (dir) {
    case 'up':
      top = centerTop - offset
      break
    case 'down':
      top = centerTop + offset
      break
    case 'left':
      left = centerLeft - offset
      break
    case 'right':
      left = centerLeft + offset
      break
  }

  return { left: `${left}px`, top: `${top}px` }
}

const getOptimalMoves = (): number => {
  const baseMoves: Record<Difficulty, number> = {
    easy: 8,
    normal: 15,
    medium: 20,
    hard: 30
  }
  return baseMoves[currentDifficulty.value] + Math.floor(currentLevel.value / 5)
}

// ==================== 关卡生成 ====================
/**
 * 初始化关卡 - 优先从后端获取关卡数据，失败时使用本地生成
 */
const initLevel = async () => {
  isLoading.value = true
  try {
    // 尝试从后端API获取关卡数据，传入用户选择的难度
    const levelData = await fetchLevelFromApi(currentLevel.value, 'classic', selectedDifficulty.value)
    if (levelData) {
      // 设置网格大小和出口位置（完全由后端控制）
      gridSize.value = levelData.gridSize
      exitRow.value = levelData.exitRow
      cellSize.value = getCellSize()

      // 更新难度显示（后端返回的难度）
      if (levelData.difficulty) {
        selectedDifficulty.value = levelData.difficulty as Difficulty
      }

      // 重置游戏状态
      moves.value = 0
      moveHistory.value = []
      isExitOpen.value = false
      showHint.value = false
      availableDirections.value = []
      draggingCar.value = null
      exitingCar.value = null
      showLevelComplete.value = false

      // 生成车辆（从API返回的boardData）
      generateCarsFromApi(levelData.boardData)
      startAngerSystem()
      return
    }
  } catch (e) {
    console.warn('[ParkingRush] 后端API不可用:', e)
  } finally {
    isLoading.value = false
  }
}

/**
 * 从后端API返回的boardData生成车辆
 * @param boardData - 后端返回的关卡布局数据
 */
const generateCarsFromApi = (boardData: { gridSize: number; exitRow: number; cars: Array<{ id: number; type: CarType; orientation: Orientation; length: number; row: number; col: number; isTarget: boolean; color: string }> }) => {
  const newCars: Car[] = []
  boardData.cars.forEach(carData => {
    newCars.push({
      id: carData.id,
      type: carData.type,
      orientation: carData.orientation,
      length: carData.length,
      row: carData.row,
      col: carData.col,
      isTarget: carData.isTarget || false,
      anger: 0,
      color: carData.color || CAR_COLORS[carData.type]
    })
  })
  cars.value = newCars
}

// ==================== 拖拽处理 - 优化流畅度 ====================
// 拖拽状态跟踪
const dragStartCarRow = ref(0)
const dragStartCarCol = ref(0)
const isDragging = ref(false)
const dragThreshold = 5 // 开始拖拽的最小移动距离（像素）

/**
 * 开始拖拽车辆
 * @param car - 被拖拽的车辆
 * @param event - 鼠标或触摸事件
 */
const startDrag = (car: Car, event: MouseEvent | TouchEvent) => {
  if (isPaused.value || exitingCar.value) return

  draggingCar.value = car
  dragStartCarRow.value = car.row
  dragStartCarCol.value = car.col
  dragCurrentX.value = 0
  dragCurrentY.value = 0
  isDragging.value = false

  if (event instanceof MouseEvent) {
    dragStartX.value = event.clientX
    dragStartY.value = event.clientY
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
  } else {
    dragStartX.value = event.touches[0].clientX
    dragStartY.value = event.touches[0].clientY
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }
}

/**
 * 处理鼠标移动 - 实时更新车辆位置预览
 * @param event - 鼠标事件
 */
const handleDragMove = (event: MouseEvent) => {
  if (!draggingCar.value) return

  const deltaX = event.clientX - dragStartX.value
  const deltaY = event.clientY - dragStartY.value

  // 检查是否超过拖拽阈值
  if (!isDragging.value) {
    const totalDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    if (totalDelta > dragThreshold) {
      isDragging.value = true
    }
  }

  // 限制只能沿车辆方向移动，并限制在有效范围内
  const car = draggingCar.value
  const cell = cellSize.value

  if (car.orientation === 'horizontal') {
    // 计算最大可移动范围
    const maxMove = calculateMaxDragDistance(car, 'horizontal')
    dragCurrentX.value = Math.max(-maxMove.negative * cell, Math.min(maxMove.positive * cell, deltaX))
    dragCurrentY.value = 0
  } else {
    const maxMove = calculateMaxDragDistance(car, 'vertical')
    dragCurrentY.value = Math.max(-maxMove.negative * cell, Math.min(maxMove.positive * cell, deltaY))
    dragCurrentX.value = 0
  }
}

/**
 * 处理触摸移动 - 实时更新车辆位置预览
 * @param event - 触摸事件
 */
const handleTouchMove = (event: TouchEvent) => {
  if (!draggingCar.value) return
  event.preventDefault()

  const touch = event.touches[0]
  const deltaX = touch.clientX - dragStartX.value
  const deltaY = touch.clientY - dragStartY.value

  // 检查是否超过拖拽阈值
  if (!isDragging.value) {
    const totalDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    if (totalDelta > dragThreshold) {
      isDragging.value = true
    }
  }

  // 限制只能沿车辆方向移动，并限制在有效范围内
  const car = draggingCar.value
  const cell = cellSize.value

  if (car.orientation === 'horizontal') {
    const maxMove = calculateMaxDragDistance(car, 'horizontal')
    dragCurrentX.value = Math.max(-maxMove.negative * cell, Math.min(maxMove.positive * cell, deltaX))
    dragCurrentY.value = 0
  } else {
    const maxMove = calculateMaxDragDistance(car, 'vertical')
    dragCurrentY.value = Math.max(-maxMove.negative * cell, Math.min(maxMove.positive * cell, deltaY))
    dragCurrentX.value = 0
  }
}

/**
 * 计算车辆可以拖拽的最大距离 - 最多3格
 * @param car - 车辆
 * @param orientation - 方向
 * @returns 正负方向的最大格子数
 */
const calculateMaxDragDistance = (car: Car, orientation: 'horizontal' | 'vertical'): { positive: number; negative: number } => {
  let positive = 0
  let negative = 0
  const maxDragSteps = 3 // 最多拖拽3格

  if (orientation === 'horizontal') {
    // 向右最大距离（最多3格）
    for (let i = 1; i <= maxDragSteps; i++) {
      if (canMoveCar(car, car.row, car.col + i)) {
        positive = i
      } else {
        break
      }
    }
    // 向左最大距离（最多3格）
    for (let i = 1; i <= maxDragSteps; i++) {
      if (canMoveCar(car, car.row, car.col - i)) {
        negative = i
      } else {
        break
      }
    }
  } else {
    // 向下最大距离（最多3格）
    for (let i = 1; i <= maxDragSteps; i++) {
      if (canMoveCar(car, car.row + i, car.col)) {
        positive = i
      } else {
        break
      }
    }
    // 向上最大距离（最多3格）
    for (let i = 1; i <= maxDragSteps; i++) {
      if (canMoveCar(car, car.row - i, car.col)) {
        negative = i
      } else {
        break
      }
    }
  }

  return { positive, negative }
}

/**
 * 处理鼠标释放
 * @param event - 鼠标事件
 */
const handleDragEnd = (event: MouseEvent) => {
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)

  if (!draggingCar.value) return

  const deltaX = event.clientX - dragStartX.value
  const deltaY = event.clientY - dragStartY.value

  processMove(deltaX, deltaY)
}

/**
 * 处理触摸结束
 * @param event - 触摸事件
 */
const handleTouchEnd = (event: TouchEvent) => {
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)

  if (!draggingCar.value) return

  const touch = event.changedTouches[0]
  const deltaX = touch.clientX - dragStartX.value
  const deltaY = touch.clientY - dragStartY.value

  processMove(deltaX, deltaY)
}

/**
 * 处理移动逻辑 - 每次最多移动三格
 * @param deltaX - X方向移动距离
 * @param deltaY - Y方向移动距离
 */
const processMove = (deltaX: number, deltaY: number) => {
  if (!draggingCar.value) return

  const car = draggingCar.value
  const cell = cellSize.value
  // 使用30%格子大小作为阈值
  const threshold = cell * 0.3

  let direction = 0
  let moveSteps = 0

  // 判断移动方向和步数
  if (car.orientation === 'horizontal' && Math.abs(deltaX) > threshold) {
    direction = deltaX > 0 ? 1 : -1
    // 根据拖拽距离计算移动步数，最多3格
    moveSteps = Math.min(3, Math.floor((Math.abs(deltaX) + cell * 0.3) / cell))
    moveSteps = Math.max(1, moveSteps)
  } else if (car.orientation === 'vertical' && Math.abs(deltaY) > threshold) {
    direction = deltaY > 0 ? 1 : -1
    moveSteps = Math.min(3, Math.floor((Math.abs(deltaY) + cell * 0.3) / cell))
    moveSteps = Math.max(1, moveSteps)
  }

  // 最多移动3格
  if (direction !== 0 && moveSteps > 0) {
    // 计算实际可以移动的步数
    let actualSteps = 0
    for (let i = 1; i <= moveSteps; i++) {
      const testRow = car.orientation === 'vertical' ? car.row + direction * i : car.row
      const testCol = car.orientation === 'horizontal' ? car.col + direction * i : car.col
      if (canMoveCar(car, testRow, testCol)) {
        actualSteps = i
      } else {
        break
      }
    }

    if (actualSteps > 0) {
      const newRow = car.orientation === 'vertical' ? car.row + direction * actualSteps : car.row
      const newCol = car.orientation === 'horizontal' ? car.col + direction * actualSteps : car.col

      moveHistory.value.push({
        carId: car.id,
        fromRow: car.row,
        fromCol: car.col,
        toRow: newRow,
        toCol: newCol
      })

      car.row = newRow
      car.col = newCol
      moves.value++
      car.anger = Math.max(0, car.anger - 20)
      checkWinCondition()
    }
  }

  draggingCar.value = null
  dragCurrentX.value = 0
  dragCurrentY.value = 0
  isDragging.value = false
}

const calculateMaxMoveSteps = (car: Car, direction: number): number => {
  let steps = 0
  const maxSteps = gridSize.value

  for (let i = 1; i <= maxSteps; i++) {
    const testRow = car.orientation === 'vertical' ? car.row + direction * i : car.row
    const testCol = car.orientation === 'horizontal' ? car.col + direction * i : car.col

    if (canMoveCar(car, testRow, testCol)) {
      steps = i
    } else {
      break
    }
  }

  return steps
}

/**
 * 检查车辆是否可以移动到指定位置
 * @param car - 车辆
 * @param newRow - 新行位置
 * @param newCol - 新列位置
 * @returns 是否可以移动
 */
/**
 * 检查车辆是否可以移动到指定位置
 * @param car - 车辆
 * @param newRow - 新行位置
 * @param newCol - 新列位置
 * @returns 是否可以移动
 */
const canMoveCar = (car: Car, newRow: number, newCol: number): boolean => {
  if (newRow < 0 || newCol < 0) return false

  if (car.orientation === 'horizontal') {
    // 横向车辆：只能水平移动
    // 所有车辆都不能移出网格边界
    if (newCol + car.length > gridSize.value) return false
  } else {
    // 竖向车辆：只能垂直移动，不能移出网格
    if (newRow + car.length > gridSize.value) return false
  }

  for (const otherCar of cars.value) {
    if (otherCar.id === car.id) continue

    for (let i = 0; i < car.length; i++) {
      const checkRow = car.orientation === 'vertical' ? newRow + i : newRow
      const checkCol = car.orientation === 'horizontal' ? newCol + i : newCol

      for (let j = 0; j < otherCar.length; j++) {
        const otherRow = otherCar.orientation === 'vertical' ? otherCar.row + j : otherCar.row
        const otherCol = otherCar.orientation === 'horizontal' ? otherCar.col + j : otherCar.col

        if (checkRow === otherRow && checkCol === otherCol) return false
      }
    }
  }

  return true
}

/**
 * 检查是否过关 - 目标车到达出口即触发驶出动画
 * 车辆自动驶出后进入下一关，无弹窗确认
 */
const checkWinCondition = () => {
  const targetCar = cars.value.find(c => c.isTarget)
  if (!targetCar || exitingCar.value) return

  // 目标车到达出口位置即触发过关（到达最右侧格子）
  if (targetCar.row === exitRow.value && targetCar.col + targetCar.length === gridSize.value) {
    isExitOpen.value = true
    exitingCar.value = targetCar

    // 播放驶出动画
    playExitAnimation(targetCar)
  }
}

/**
 * 播放车辆驶出动画
 * @param car - 目标车辆
 */
const playExitAnimation = (car: Car) => {
  // 动画时长：根据车辆距离出口边缘的距离计算
  const exitDistance = (gridSize.value - car.col) * cellSize.value + 100
  const duration = 800 // 固定800ms驶出动画

  // 设置CSS变量用于动画
  const carElement = document.querySelector(`.car.target-car`) as HTMLElement
  if (carElement) {
    carElement.style.setProperty('--exit-distance', `${exitDistance}px`)
    carElement.classList.add('exiting')
  }

  // 清除之前的定时器
  if (exitAnimationTimer) clearTimeout(exitAnimationTimer)

  // 动画结束后显示闯关成功弹窗并提交结果
  exitAnimationTimer = window.setTimeout(async () => {
    exitingCar.value = null
    stars.value += levelStars.value
    showLevelComplete.value = true

    // 提交通关结果到后端，并更新前端状态
      try {
        const result = await submitResultToApi({
          levelId: currentLevel.value,
          mode: 'classic',
          steps: moves.value,
          hintUsed: hints.value < 3, // 如果提示少于初始值，说明使用了提示
          timeSeconds: 0 // TODO: 添加计时器
        })
        
        // 更新前端状态（使用后端返回的数据）
        if (result) {
          stars.value = result.totalStars || stars.value
          userCoins.value = result.coins || userCoins.value
          // 如果后端返回了下一关，更新当前关卡
          if (result.nextLevel && result.nextLevel > currentLevel.value) {
            currentLevel.value = result.nextLevel
          }
        }
      } catch (e) {
        console.warn('[ParkingRush] 提交结果失败:', e)
      }
  }, duration)
}

/**
 * 进入下一关并关闭弹窗
 */
const nextLevelAndClose = () => {
  showLevelComplete.value = false
  nextLevel()
}

/**
 * 处理分享功能
 */
const handleShare = () => {
  // 复制分享文本到剪贴板
  const shareText = `我在《停车大挑战》第${currentLevel.value}关获得了${levelStars.value}颗⭐，用了${moves.value}步！快来挑战吧！`
  navigator.clipboard.writeText(shareText).then(() => {
    alert('分享内容已复制到剪贴板！')
  }).catch(() => {
    alert('复制失败，请手动分享：' + shareText)
  })
}

const startAngerSystem = () => {
  if (angerTimer) clearInterval(angerTimer)

  angerTimer = window.setInterval(() => {
    if (isPaused.value) return

    cars.value.forEach(car => {
      if (!car.isTarget && isCarBlocked(car)) {
        car.anger = Math.min(100, car.anger + 5)
      } else {
        car.anger = Math.max(0, car.anger - 2)
      }
    })
  }, 1000)
}

const isCarBlocked = (car: Car): boolean => {
  const canMoveForward = car.orientation === 'horizontal'
    ? canMoveCar(car, car.row, car.col + 1)
    : canMoveCar(car, car.row + 1, car.col)

  const canMoveBackward = car.orientation === 'horizontal'
    ? canMoveCar(car, car.row, car.col - 1)
    : canMoveCar(car, car.row - 1, car.col)

  return !canMoveForward && !canMoveBackward
}

/**
 * 使用提示功能
 * 显示目标车辆可以移动的方向
 * 提示只显示在目标车辆上，且只显示能通往出口的方向
 */
const useHint = () => {
  if (hints.value <= 0 || isPaused.value) return
  hints.value--
  showHint.value = true

  const targetCar = cars.value.find(c => c.isTarget)
  if (targetCar) {
    const directions: Direction[] = []

    // 目标车是横向的，只能左右移动
    if (targetCar.orientation === 'horizontal') {
      // 检查是否能向右移动（通往出口的方向）
      if (canMoveCar(targetCar, targetCar.row, targetCar.col + 1)) {
        directions.push('right')
      }
      // 如果右边被挡住，检查左边是否有移动空间
      else if (canMoveCar(targetCar, targetCar.row, targetCar.col - 1)) {
        directions.push('left')
      }
    } else {
      // 竖向车辆只能上下移动
      if (canMoveCar(targetCar, targetCar.row - 1, targetCar.col)) directions.push('up')
      if (canMoveCar(targetCar, targetCar.row + 1, targetCar.col)) directions.push('down')
    }

    availableDirections.value = directions
  }

  if (hintTimer) clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => {
    showHint.value = false
    availableDirections.value = []
  }, 3000)
}

const undoMove = () => {
  if (moveHistory.value.length === 0 || isPaused.value) return

  const lastMove = moveHistory.value.pop()
  if (!lastMove) return

  const car = cars.value.find(c => c.id === lastMove.carId)
  if (car) {
    car.row = lastMove.fromRow
    car.col = lastMove.fromCol
    moves.value--
  }
}

const togglePause = () => {
  isPaused.value = !isPaused.value
}

/**
 * 重新开始当前关卡 - 从后端重新生成新关卡布局
 * 使用 regenerate 参数确保获取全新的关卡数据
 */
const restartLevel = async () => {
  // 显示加载状态
  isLoading.value = true

  // 清除所有定时器
  if (angerTimer) {
    clearInterval(angerTimer)
    angerTimer = null
  }
  if (exitAnimationTimer) {
    clearTimeout(exitAnimationTimer)
    exitAnimationTimer = null
  }
  if (levelTransitionTimer) {
    clearTimeout(levelTransitionTimer)
    levelTransitionTimer = null
  }

  // 重置所有游戏状态
  moves.value = 0
  moveHistory.value = []
  isExitOpen.value = false
  showHint.value = false
  availableDirections.value = []
  draggingCar.value = null
  exitingCar.value = null
  isPaused.value = false
  showLevelComplete.value = false

  // 尝试从后端重新生成新关卡数据
  // 传入 regenerate=true 确保获取全新的关卡布局
  try {
    const levelData = await fetchLevelFromApi(currentLevel.value, 'classic', selectedDifficulty.value, true)
    if (levelData) {
      gridSize.value = levelData.gridSize
      exitRow.value = levelData.exitRow
      cellSize.value = getCellSize()
      generateCarsFromApi(levelData.boardData)
      startAngerSystem()
      return
    }
  } catch (e) {
    // 后端API调用失败，显示错误提示
    console.error('[ParkingRush] 无法从后端获取关卡数据')
  } finally {
    // 无论成功或失败，都关闭加载状态
    isLoading.value = false
  }
}

/**
 * 进入下一关 - 重置通关弹窗状态
 * 通关后更新用户数据并从后端获取下一关
 */
/**
 * 下一关
 * 进入下一关并刷新用户数据
 */
const nextLevel = async () => {
  showLevelComplete.value = false
  currentLevel.value++

  // 重新获取用户进度（更新星星、金币等）
  try {
    const userData = await getUserGameData('parkingRush')
    // getUserGameData 返回的是后端 data 字段的内容
    if (userData) {
      stars.value = userData.totalStars || stars.value
      userCoins.value = userData.coins || userCoins.value
    }
  } catch (e) {
    console.warn('[ParkingRush] 更新进度失败:', e)
  }

  await initLevel()
}

/**
 * 难度切换处理
 * 当用户选择新难度时，保存到后端并重新生成关卡
 * 保存后使用后端返回的最新用户数据更新前端状态
 */
/**
 * 难度切换处理
 * 当用户选择新难度时，保存到后端并重新生成关卡
 * 保存后使用后端返回的最新用户数据更新前端状态
 */
const onDifficultyChange = async () => {
  // 保存用户选择的难度到后端，并获取最新用户进度
  try {
    const userData = await saveParkingRushDifficulty(selectedDifficulty.value)

    // 使用后端返回的最新数据更新前端状态
    // saveParkingRushDifficulty 返回的是后端 data 字段的内容
    if (userData) {
      currentLevel.value = userData.currentLevel || 1
      stars.value = userData.totalStars || 0
      selectedDifficulty.value = (userData.selectedDifficulty as Difficulty) || selectedDifficulty.value
      userCoins.value = userData.coins || 0
    }
  } catch (e) {
    console.warn('[ParkingRush] 保存难度失败:', e)
  }

  // 重置关卡为1，使用选定的难度
  currentLevel.value = 1

  // 重置游戏状态
  moves.value = 0
  moveHistory.value = []
  isExitOpen.value = false
  showHint.value = false
  availableDirections.value = []
  draggingCar.value = null
  exitingCar.value = null
  isPaused.value = false
  showLevelComplete.value = false

  // 重新初始化关卡（会从后端获取新难度的关卡）
  await initLevel()
}

/**
 * 检查位置是否被占用
 * @param row - 行位置
 * @param col - 列位置
 * @param orientation - 方向
 * @param length - 车辆长度
 * @param existingCars - 已存在的车辆列表
 * @returns 是否被占用
 */
const isPositionOccupied = (
  row: number,
  col: number,
  orientation: Orientation,
  length: number,
  existingCars: Car[]
): boolean => {
  if (orientation === 'horizontal' && col + length > gridSize.value) return true
  if (orientation === 'vertical' && row + length > gridSize.value) return true

  for (const car of existingCars) {
    for (let i = 0; i < length; i++) {
      const checkRow = orientation === 'vertical' ? row + i : row
      const checkCol = orientation === 'horizontal' ? col + i : col

      for (let j = 0; j < car.length; j++) {
        const carRow = car.orientation === 'vertical' ? car.row + j : car.row
        const carCol = car.orientation === 'horizontal' ? car.col + j : car.col

        if (checkRow === carRow && checkCol === carCol) return true
      }
    }
  }

  return false
}

const cleanup = () => {
  if (angerTimer) {
    clearInterval(angerTimer)
    angerTimer = null
  }
  if (hintTimer) {
    clearTimeout(hintTimer)
    hintTimer = null
  }
  if (exitAnimationTimer) {
    clearTimeout(exitAnimationTimer)
    exitAnimationTimer = null
  }
  if (levelTransitionTimer) {
    clearTimeout(levelTransitionTimer)
    levelTransitionTimer = null
  }
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
}

const handleResize = () => {
  cellSize.value = getCellSize()
}

/**
 * 组件挂载
 * 初始化游戏，从后端获取用户数据
 */
onMounted(async () => {
  // 尝试从后端获取用户进度
  try {
    isLoading.value = true
    const userData = await getUserGameData('parkingRush')
    // getUserGameData 返回的是后端 data 字段的内容
    if (userData) {
      currentLevel.value = userData.currentLevel || 1
      stars.value = userData.totalStars || 0
      selectedDifficulty.value = (userData.selectedDifficulty as Difficulty) || 'easy'
      userCoins.value = userData.coins || 0
    }
  } catch (e) {
    console.warn('[ParkingRush] 获取用户进度失败，使用默认值:', e)
  } finally {
    isLoading.value = false
  }

  initLevel()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cleanup()
  window.removeEventListener('resize', handleResize)
})

defineExpose({
  cleanup
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

/* ==================== 游戏卡片容器 ==================== */
.parking-play-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 240, 245, 0.9) 50%, rgba(224, 255, 255, 0.9) 100%);
  border-radius: 20px;
  padding: 16px;
  max-width: 100%;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(255, 182, 193, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

/* ==================== 游戏头部 ==================== */
.parking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 2px dashed rgba(168, 230, 207, 0.4);
}

.level-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.level-badge {
  background: linear-gradient(135deg, rgba(168, 230, 207, 0.9) 0%, rgba(144, 220, 190, 0.9) 100%);
  color: #5d5d7a;
  padding: 6px 12px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 0.85rem;
  box-shadow: 0 4px 12px rgba(168, 230, 207, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.5);
  font-family: var(--font-handwritten);
}

.difficulty-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.difficulty-easy { background: rgba(168, 230, 207, 0.9); color: #5d5d7a; border: 2px solid rgba(255, 255, 255, 0.5); }
.difficulty-normal { background: rgba(199, 206, 234, 0.9); color: #5d5d7a; border: 2px solid rgba(255, 255, 255, 0.5); }
.difficulty-medium { background: rgba(255, 211, 182, 0.9); color: #5d5d7a; border: 2px solid rgba(255, 255, 255, 0.5); }
.difficulty-hard { background: rgba(255, 170, 165, 0.9); color: #5d5d7a; border: 2px solid rgba(255, 255, 255, 0.5); }

/* 难度选择器 */
.difficulty-selector {
  position: relative;
}

.difficulty-select {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 2px solid rgba(168, 230, 207, 0.8);
  background: rgba(255, 255, 255, 0.9);
  color: #5d5d7a;
  cursor: pointer;
  outline: none;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235d5d7a' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
  padding-right: 22px;
  font-family: var(--font-handwritten);
}

.difficulty-select:hover {
  background: rgba(255, 240, 245, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(168, 230, 207, 0.2);
}

.difficulty-select:focus {
  box-shadow: 0 0 0 3px rgba(168, 230, 207, 0.3);
}

.game-stats {
  display: flex;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.7);
  padding: 6px 10px;
  border-radius: 12px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.stat-icon {
  font-size: 0.9rem;
}

.stat-value {
  font-weight: 700;
  color: #5d5d7a;
  font-size: 0.85rem;
  font-family: var(--font-handwritten);
}

/* ==================== 主题指示器 ==================== */
.theme-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  width: 100%;
}

.theme-indicator.residential {
  background: linear-gradient(135deg, #A8E6CF 0%, #88D8A3 100%);
  color: #2D5A3D;
}

.theme-indicator.mall {
  background: linear-gradient(135deg, #FFD3E1 0%, #FFC4D6 100%);
  color: #8B4557;
}

.theme-indicator.airport {
  background: linear-gradient(135deg, #C7CEEA 0%, #B8C5E8 100%);
  color: #4A5568;
}

.theme-icon {
  font-size: 1.1rem;
}

/* ==================== 停车场区域 ==================== */
.parking-lot-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  padding: 8px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}

.parking-lot {
  position: relative;
  background: #E8E8E8;
  border-radius: 12px;
  padding: 4px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 100%;
  box-sizing: border-box;
}

/* 网格背景 - 优化间隙 */
.grid-background {
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  bottom: 3px;
  display: grid;
  gap: 1.5px;
}

.grid-cell {
  background: #F5F5F5;
  border-radius: 4px;
}

/* 出口门 - 第一版样式 */
.exit-gate {
  position: absolute;
  right: -28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px 6px;
  background: #FF6B6B;
  border-radius: 6px;
  transition: all 0.3s ease;
  min-width: 24px;
  box-sizing: border-box;
  z-index: 5;
}

.exit-gate.open {
  background: #4ECDC4;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.exit-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.exit-text {
  font-size: 0.55rem;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  line-height: 1;
}

/* ==================== 车辆驶出动画 ==================== */
.car.exiting {
  animation: car-exit 0.8s ease-in forwards;
  z-index: 200;
}

@keyframes car-exit {
  0% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateX(calc(var(--exit-distance) * 0.5)) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translateX(var(--exit-distance)) scale(0.9);
    opacity: 0;
  }
}

/* 驶出动画层 */
.exit-animation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 50;
}

.exit-trail {
  position: absolute;
  right: -20px;
  top: 50%;
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(78,205,196,0.5) 50%, rgba(78,205,196,0) 100%);
  transform: translateY(-50%);
  animation: trail-fade 0.8s ease-out;
}

@keyframes trail-fade {
  0% { opacity: 0; transform: translateY(-50%) scaleX(0); }
  50% { opacity: 1; transform: translateY(-50%) scaleX(1); }
  100% { opacity: 0; transform: translateY(-50%) scaleX(1.5); }
}

/* ==================== 关卡过渡提示 ==================== */
.level-transition {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: fade-in 0.2s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.transition-content {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
  padding: 24px 48px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  box-shadow: 0 12px 40px rgba(255, 107, 107, 0.4);
  animation: pop-in 0.3s ease;
}

@keyframes pop-in {
  0% { transform: scale(0.8); opacity: 0; }
  70% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.transition-icon {
  font-size: 2.5rem;
  animation: car-bounce 0.6s ease infinite alternate;
}

@keyframes car-bounce {
  from { transform: translateX(-5px); }
  to { transform: translateX(5px); }
}

.transition-text {
  color: white;
  font-size: 1.3rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

@media (max-width: 480px) {
  .transition-content {
    padding: 20px 36px;
  }

  .transition-icon {
    font-size: 2rem;
  }

  .transition-text {
    font-size: 1.1rem;
  }
}

/* ==================== 车辆样式 ==================== */
.car {
  position: absolute;
  border-radius: 10px;
  cursor: grab;
  transition: none;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  user-select: none;
  touch-action: none;
}

.car.dragging {
  cursor: grabbing;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.car-body {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

/* 车窗 - 横向车辆 */
.car.horizontal .car-windows {
  position: absolute;
  top: 12%;
  left: 8%;
  right: 8%;
  height: 40%;
  display: flex;
  gap: 3px;
}

/* 车窗 - 竖向车辆 */
.car.vertical .car-windows {
  position: absolute;
  left: 12%;
  top: 8%;
  bottom: 8%;
  width: 40%;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.window {
  flex: 1;
  background: linear-gradient(135deg, #87CEEB 0%, #5DADE2 100%);
  border-radius: 3px;
  opacity: 0.8;
}

/* 车轮 - 横向车辆 */
.car.horizontal .wheels {
  position: absolute;
  bottom: 8%;
  left: 8%;
  right: 8%;
  height: 22%;
}

.car.horizontal .wheel {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #333;
  border-radius: 50%;
  border: 1px solid #666;
}

.car.horizontal .wheel.front-left,
.car.horizontal .wheel.front-right { top: 0; }
.car.horizontal .wheel.back-left,
.car.horizontal .wheel.back-right { bottom: 0; }
.car.horizontal .wheel.front-left,
.car.horizontal .wheel.back-left { left: 10%; }
.car.horizontal .wheel.front-right,
.car.horizontal .wheel.back-right { right: 10%; }

/* 车轮 - 竖向车辆 */
.car.vertical .wheels {
  position: absolute;
  right: 8%;
  top: 8%;
  bottom: 8%;
  width: 22%;
}

.car.vertical .wheel {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #333;
  border-radius: 50%;
  border: 1px solid #666;
}

.car.vertical .wheel.front-left,
.car.vertical .wheel.front-right { left: 0; }
.car.vertical .wheel.back-left,
.car.vertical .wheel.back-right { right: 0; }
.car.vertical .wheel.front-left,
.car.vertical .wheel.back-left { top: 10%; }
.car.vertical .wheel.front-right,
.car.vertical .wheel.back-right { bottom: 10%; }

/* 车灯 */
.lights {
  position: absolute;
  top: 8%;
  left: 8%;
  right: 8%;
  height: 12%;
}

.light {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #FFD700;
  border-radius: 50%;
  box-shadow: 0 0 6px #FFD700;
}

.light.left { left: 5%; }
.light.right { right: 5%; }

/* 目标车辆 */
.target-car .car-body {
  border: 2px solid #FFD700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

/* 车辆表情 */
.car-face {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.face-icon {
  font-size: 0.9rem;
}

/* 怒气效果 */
.anger-effects {
  position: absolute;
  top: -12px;
  right: -6px;
}

.anger-icon {
  font-size: 0.9rem;
  animation: bounce 0.5s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.smoke {
  position: absolute;
  top: -6px;
  left: 50%;
  width: 12px;
  height: 12px;
  background: radial-gradient(circle, rgba(128, 128, 128, 0.8) 0%, transparent 70%);
  border-radius: 50%;
  animation: smoke-rise 1s infinite;
}

@keyframes smoke-rise {
  0% { transform: translateX(-50%) scale(0.5); opacity: 0.8; }
  100% { transform: translateX(-50%) translateY(-12px) scale(1.2); opacity: 0; }
}

/* ==================== 方向提示箭头 ==================== */
.direction-hints {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
  overflow: hidden;
}

.direction-arrow {
  position: absolute;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 215, 0, 0.9);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: arrow-pulse 0.8s infinite alternate;
}

.arrow-icon {
  font-size: 0.8rem;
}

@keyframes arrow-pulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.15); opacity: 1; }
}

.direction-arrow.up { animation: arrow-up 0.8s infinite alternate; }
.direction-arrow.down { animation: arrow-down 0.8s infinite alternate; }
.direction-arrow.left { animation: arrow-left 0.8s infinite alternate; }
.direction-arrow.right { animation: arrow-right 0.8s infinite alternate; }

@keyframes arrow-up {
  0% { transform: translateY(0); }
  100% { transform: translateY(-4px); }
}

@keyframes arrow-down {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

@keyframes arrow-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-4px); }
}

@keyframes arrow-right {
  0% { transform: translateX(0); }
  100% { transform: translateX(4px); }
}

/* ==================== 控制按钮区域 ==================== */
.parking-controls {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: 100%;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 4px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover:not(.disabled) {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-btn:active:not(.disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.control-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.2rem;
}

.btn-text {
  font-size: 0.7rem;
  font-weight: 600;
  color: #666;
}

/* ==================== 暂停遮罩 - 手绘涂鸦风格 ==================== */
.pause-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.pause-modal {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  padding: 32px;
  border-radius: 20px;
  text-align: center;
  animation: slide-up-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  border: 2px solid transparent;
  background-clip: padding-box;
  box-shadow: 0 8px 32px rgba(255, 182, 193, 0.15);
}

/* 手绘描边效果 */
.pause-modal::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.6), rgba(168, 230, 207, 0.6));
  z-index: -1;
  animation: hand-drawn-border 3s ease-in-out infinite;
}

@keyframes hand-drawn-border {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.pause-modal h3 {
  font-size: 1.5rem;
  margin-bottom: 8px;
  color: #5d5d7a;
  font-family: var(--font-handwritten);
  font-weight: 600;
}

.pause-modal p {
  color: #7a7a9a;
  margin-bottom: 20px;
  font-size: 0.9rem;
  font-family: var(--font-handwritten);
}

.resume-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, rgba(168, 230, 207, 0.9) 0%, rgba(144, 220, 190, 0.9) 100%);
  color: #5d5d7a;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: var(--font-handwritten);
  box-shadow: 0 4px 15px rgba(168, 230, 207, 0.3);
}

.resume-btn:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.resume-btn:active {
  transform: translateY(2px);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* ==================== 闯关成功弹窗 - 手绘涂鸦风格 ==================== */
.level-complete-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
  box-sizing: border-box;
  border-radius: 12px;
}

.level-complete-modal {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  padding: 24px 20px;
  border-radius: 20px;
  text-align: center;
  animation: slide-up-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  width: 90%;
  max-width: 280px;
  box-sizing: border-box;
  box-shadow: 0 0 30px rgba(168, 230, 207, 0.4);
  border: 2px solid transparent;
  background-clip: padding-box;
  animation: slide-up-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, soft-glow-green 2s ease-in-out infinite;
}

/* 手绘描边效果 */
.level-complete-modal::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(168, 230, 207, 0.8), rgba(255, 182, 193, 0.6));
  z-index: -1;
  animation: hand-drawn-border 3s ease-in-out infinite;
}

@keyframes soft-glow-green {
  0%, 100% { box-shadow: 0 0 30px rgba(168, 230, 207, 0.4); }
  50% { box-shadow: 0 0 50px rgba(168, 230, 207, 0.6); }
}

.celebration {
  font-size: 3rem;
  margin-bottom: 12px;
  animation: bounce 1s infinite;
}

.level-complete-modal h3 {
  font-size: 1.5rem;
  margin-bottom: 16px;
  color: #5d5d7a;
  font-family: var(--font-handwritten);
  font-weight: 600;
}

.level-complete-modal .celebration {
  font-size: 2.5rem;
  margin-bottom: 8px;
  animation: bounce 1s infinite;
}

.level-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 0.85rem;
  color: #7a7a9a;
  font-family: var(--font-handwritten);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #5d5d7a;
  font-family: var(--font-handwritten);
}

.stat-value.stars {
  color: #ffd700;
  text-shadow: 2px 2px 4px rgba(255, 215, 0, 0.3);
}

.level-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  border: none;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: var(--font-handwritten);
}

.share-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #5d5d7a;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.share-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.next-btn {
  background: linear-gradient(135deg, rgba(168, 230, 207, 0.9) 0%, rgba(144, 220, 190, 0.9) 100%);
  color: #5d5d7a;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 15px rgba(168, 230, 207, 0.3);
}

.next-btn:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.next-btn:active {
  transform: translateY(2px);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* ==================== 加载状态 - 手绘涂鸦风格 ==================== */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 20px;
}

.loading-spinner {
  font-size: 2.5rem;
  animation: car-drive 1s infinite linear;
}

@keyframes car-drive {
  0% { transform: translateX(-10px) rotate(-5deg); }
  50% { transform: translateX(10px) rotate(5deg); }
  100% { transform: translateX(-10px) rotate(-5deg); }
}

.loading-text {
  margin-top: 12px;
  font-size: 1rem;
  color: #5d5d7a;
  font-weight: 600;
  font-family: var(--font-handwritten);
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 480px) {
  .parking-play-card {
    padding: 12px;
    border-radius: 16px;
  }

  .parking-header {
    margin-bottom: 8px;
    padding-bottom: 8px;
  }

  .level-badge {
    padding: 4px 10px;
    font-size: 0.8rem;
  }

  .stat-item {
    padding: 4px 8px;
  }

  .stat-icon {
    font-size: 0.8rem;
  }

  .stat-value {
    font-size: 0.8rem;
  }

  .theme-indicator {
    padding: 6px 12px;
    margin-bottom: 8px;
    font-size: 0.85rem;
  }

  .parking-lot-container {
    margin-bottom: 12px;
    padding: 6px;
  }

  /* 修复移动端出口位置 */
  .exit-gate {
    right: -24px;
    min-width: 20px;
    padding: 2px 4px;
    gap: 1px;
  }

  .exit-icon {
    font-size: 0.9rem;
  }

  .exit-text {
    font-size: 0.45rem;
  }

  .control-btn {
    padding: 8px 2px;
    border-radius: 10px;
  }

  .btn-icon {
    font-size: 1rem;
  }

  .btn-text {
    font-size: 0.65rem;
  }

  .direction-arrow {
    width: 16px;
    height: 16px;
  }

  .arrow-icon {
    font-size: 0.7rem;
  }

  /* 修复移动端过关弹窗 */
  .level-complete-overlay {
    padding: 12px;
  }

  .level-complete-modal {
    padding: 0 16px 20px;
    max-width: calc(100vw - 24px);
    min-width: auto;
    width: 80%;
  }

}
</style>
