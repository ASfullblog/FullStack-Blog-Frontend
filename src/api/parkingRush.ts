/**
 * 闯关挪车游戏 API 接口
 * 对接后端关卡数据服务
 */
import request from '../utils/request'

// ==================== 类型定义 ====================

/** 车辆朝向 */
export type Orientation = 'horizontal' | 'vertical'

/** 车型 */
export type CarType = 'small' | 'truck' | 'fire' | 'police' | 'ambulance'

/** 一辆车 */
export interface CarData {
  id: number
  type: CarType
  orientation: Orientation
  length: number
  row: number
  col: number
  isTarget: boolean
  color: string
}

/** 关卡布局数据 */
export interface BoardData {
  gridSize: number
  exitRow: number
  cars: CarData[]
}

/** 关卡数据 */
export interface LevelData {
  id: number
  levelNumber: number
  mode: string
  difficulty: string
  gridSize: number
  exitRow: number
  boardData: BoardData
  minSteps: number
}

/** 关卡列表项 */
export interface LevelListItem {
  id: number
  level_number: number
  mode: string
  difficulty: string
  grid_size: number
  min_steps: number
  unlocked: boolean
  completed: boolean
  stars: number
  bestSteps: number | null
  completedAt: string | null
}

/** 通关结果 */
export interface SubmitResultData {
  stars: number
  unlocked: boolean
  nextLevel: number | null
}

/** 排行榜项 */
export interface LeaderboardItem {
  id: number
  username: string
  avatar: string | null
  completed_levels: number
  total_stars: number
}

/** 用户进度 */
export interface UserProgress {
  gamesData: {
    parkingRush?: {
      currentLevel: number
      totalStars: number
      selectedDifficulty?: string
      coins?: number
    }
  }
  records: Array<{
    level_id: number
    stars: number
    steps: number
    hint_used: number
    time_seconds: number
    completed_at: string
    level_number: number
    difficulty: string
    mode: string
  }>
}

// ==================== API 方法 ====================

/**
 * 获取关卡列表（含解锁状态）
 */
export const getLevelList = async (): Promise<LevelListItem[]> => {
  const res = await request.get('/parking-rush/levels')
  return res.data
}

/**
 * 获取单个关卡布局数据
 * @param levelNumber 关卡编号
 * @param mode 模式（classic）
 * @param difficulty 难度（easy / normal / medium / hard）
 */
export const getLevelData = async (levelNumber: number, mode: string = 'classic', difficulty: string = ''): Promise<LevelData> => {
  const res = await request.get(`/parking-rush/levels/${levelNumber}`, {
    params: { mode, difficulty }
  })
  return res.data
}

/**
 * 提交通关结果
 * @param data 通关数据
 */
export const submitResult = async (data: {
  levelId: number
  mode: string
  steps: number
  hintUsed: boolean
  timeSeconds: number
}): Promise<SubmitResultData> => {
  const res = await request.post('/parking-rush/submit', data)
  return res.data
}

/**
 * 获取通用排行榜（支持多游戏复用）
 * @param gameId 游戏ID
 * @param limit 返回条数
 */
export const getLeaderboard = async (gameId: string = 'parkingRush', limit: number = 10): Promise<LeaderboardItem[]> => {
  const res = await request.get('/parking-rush/leaderboard', {
    params: { game: gameId, limit }
  })
  return res.data.leaderboard
}

/**
 * 获取用户游戏进度
 */
export const getUserProgress = async (): Promise<UserProgress> => {
  const res = await request.get('/parking-rush/progress')
  return res.data
}
