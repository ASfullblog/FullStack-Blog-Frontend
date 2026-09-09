/**
 * 通用游戏 API 接口
 * 支持多游戏复用的数据查询、排行榜、用户进度管理
 */
import request from '../utils/request'

const hasToken = () => typeof localStorage !== 'undefined' && !!localStorage.getItem('token')

// ==================== 类型定义 ====================

/** 游戏类型 */
export type GameType = 'parkingRush' | 'snake' | 'tetris' | 'minesweeper'

/** 难度等级 */
export type Difficulty = 'easy' | 'normal' | 'medium' | 'hard'
export type LinkMatchMode = 'time' | 'moves'

/** 游戏列表项（从数据库查询） */
export interface GameListItem {
  id: number
  name: string
  slug: string
  description: string | null
  shortDesc: string | null
  imageUrl: string | null
  tags: string[]
  isPublished: boolean
  viewCount: number
  likeCount: number
  ratingAvg: number
  sortOrder: number
  createdAt: string
}

/** 游戏元数据 */
export interface GameMeta {
  id: GameType
  name: string
  hasDifficulty: boolean
  hasLevels: boolean
  scoreField: string
}

/** 用户游戏数据 */
export interface UserGameData {
  currentLevel: number
  totalStars: number
  selectedDifficulty: string
  coins: number
  playCount: number
  totalPlayTime: number
  lastPlayedAt: string | null
  [key: string]: any
}

/** 排行榜项 */
export interface LeaderboardItem {
  rank: number
  userId: number
  username: string
  avatar: string | null
  score: number
  level: number
  playCount: number
  bestRecord: any
}

/** 排行榜数据 */
export interface LeaderboardData {
  gameId: GameType
  difficulty?: string
  total: number
  list: LeaderboardItem[]
  updatedAt: string
}

/** 同步离线数据结果 */
export interface SyncResult {
  synced: boolean
  conflicts: any[]
  finalData: UserGameData
}

export interface LinkMatchCellConfig {
  icon: string
  type: number
  layer: number
  row: number
  col: number
}

export interface LinkMatchLevelConfig {
  gameId: 'linkMatch'
  levelNumber: number
  mode: LinkMatchMode
  difficulty: Difficulty
  rows: number
  cols: number
  types: number
  layers: number
  time: number
  moves: number
  cells: Array<LinkMatchCellConfig | null>
}

// ==================== API 方法 ====================

/**
 * 获取所有游戏列表
 */
export const getGameList = async (): Promise<GameListItem[]> => {
  const res = await request.get('/games')
  return res.data
}

export const trackGameView = async (gameSlug: string): Promise<void> => {
  await request.post(`/games/${gameSlug}/view`)
}

export const getLinkMatchLevelConfig = async (
  levelNumber: number,
  params?: {
    difficulty?: Difficulty
    mode?: LinkMatchMode
    regenerate?: boolean
  }
): Promise<LinkMatchLevelConfig> => {
  const res = await request.get(`/games/link-match/levels/${levelNumber}`, { params })
  return res.data
}

/**
 * 获取指定游戏的元数据
 * @param gameId 游戏ID
 */
export const getGameMeta = async (gameId: GameType): Promise<GameMeta> => {
  const res = await request.get(`/games/${gameId}/meta`)
  return res.data
}

/**
 * 获取当前用户在指定游戏中的数据
 * @param gameId 游戏ID
 */
export const getUserGameData = async (gameId: GameType): Promise<UserGameData> => {
  if (!hasToken()) {
    return {
      currentLevel: 1,
      totalStars: 0,
      selectedDifficulty: 'easy',
      coins: 0,
      playCount: 0,
      totalPlayTime: 0,
      lastPlayedAt: null
    }
  }
  const res = await request.get(`/games/${gameId}/user-data`)
  return res.data
}

/**
 * 保存/更新用户游戏数据
 * @param gameId 游戏ID
 * @param data 要保存的数据
 */
export const saveUserGameData = async (
  gameId: GameType,
  data: Partial<UserGameData>
): Promise<UserGameData> => {
  if (!hasToken()) {
    return {
      currentLevel: 1,
      totalStars: 0,
      selectedDifficulty: 'easy',
      coins: 0,
      playCount: 0,
      totalPlayTime: 0,
      lastPlayedAt: null,
      ...data
    }
  }
  const res = await request.post(`/games/${gameId}/user-data`, data)
  return res.data
}

/**
 * 获取游戏排行榜（通用接口，支持多游戏）
 * @param gameId 游戏ID
 * @param params 查询参数
 */
export const getLeaderboard = async (
  gameId: GameType,
  params?: {
    difficulty?: string
    limit?: number
    offset?: number
  }
): Promise<LeaderboardData> => {
  const res = await request.get(`/games/${gameId}/leaderboard`, { params })
  return res.data
}

/**
 * 同步离线数据
 * @param gameId 游戏ID
 * @param offlineData 离线期间的数据
 */
export const syncOfflineData = async (
  gameId: GameType,
  offlineData: {
    levels?: Array<{
      levelId: number
      stars: number
      steps: number
      timeSeconds: number
    }>
    totalStars?: number
    playCount?: number
    lastPlayedAt?: string
  }
): Promise<SyncResult> => {
  const res = await request.post(`/games/${gameId}/sync`, offlineData)
  return res.data
}

// ==================== 停车闯关专用 API ====================

/**
 * 获取停车闯关关卡列表
 */
export const getParkingRushLevelList = async () => {
  const res = await request.get('/parking-rush/levels')
  return res.data
}

/**
 * 获取停车闯关单个关卡数据
 * @param levelNumber 关卡编号
 * @param mode 模式
 * @param difficulty 难度
 * @param regenerate 是否重新生成关卡（用于重开按钮）
 */
export const getParkingRushLevel = async (
  levelNumber: number,
  mode: string = 'classic',
  difficulty: string = '',
  regenerate: boolean = false
) => {
  const res = await request.get(`/parking-rush/levels/${levelNumber}`, {
    params: { mode, difficulty, regenerate }
  })
  return res.data
}

/**
 * 提交停车闯关通关结果
 * @param data 通关数据
 */
export const submitParkingRushResult = async (data: {
  levelId: number
  mode: string
  steps: number
  hintUsed: boolean
  timeSeconds: number
}) => {
  const res = await request.post('/parking-rush/submit', data)
  return res.data
}

/**
 * 保存停车闯关难度选择
 * @param difficulty 难度
 */
export const saveParkingRushDifficulty = async (
  difficulty: string
): Promise<UserGameData> => {
  if (!hasToken()) {
    return {
      currentLevel: 1,
      totalStars: 0,
      selectedDifficulty: difficulty,
      coins: 0,
      playCount: 0,
      totalPlayTime: 0,
      lastPlayedAt: null
    }
  }
  const res = await request.post('/parking-rush/difficulty', { difficulty })
  return res.data
}
