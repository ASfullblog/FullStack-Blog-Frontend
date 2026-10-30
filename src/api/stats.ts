import request from '../utils/request'
import type { ApiResponse } from '../types'

/** 地理分布：country + province 两级；中国=省，海外=国家（province 即中文国名） */
export interface GeoItem {
  country: string
  province: string
  count: number
  total: number
}

/** 每日访问趋势（后端已用 generate_series 补齐，长度恒等于 days，缺失日为 0） */
export interface TrendPoint {
  date: string
  views: number
}

/** 概览卡片 */
export interface StatsOverview {
  totalViews: number
  uniqueIps: number
  todayViews: number
  last7Views: number
  last30Views: number
  provinceCount: number
  timezone?: string
}

export const statsApi = {
  /** 地理分布（按人次倒序，含国家/省份与总人次） */
  getGeo: async (): Promise<ApiResponse<GeoItem[]>> => {
    return (await request.get('/stats/geo')) as unknown as ApiResponse<GeoItem[]>
  },

  /** 近 N 天访问趋势 */
  getTrend: async (days = 30): Promise<ApiResponse<TrendPoint[]>> => {
    return (await request.get('/stats/trend', {
      params: { days }
    })) as unknown as ApiResponse<TrendPoint[]>
  },

  /** 概览统计 */
  getOverview: async (): Promise<ApiResponse<StatsOverview>> => {
    return (await request.get('/stats/overview')) as unknown as ApiResponse<StatsOverview>
  }
}

export default statsApi
