import request from '../utils/request'
import type { ApiResponse, User } from '../types'

/**
 * 用户API接口
 * 用于获取用户信息、编辑资料等
 */

/**
 * 获取用户信息
 * @param userId 用户ID
 * @returns 用户信息
 */
export const getUserById = async (userId: number): Promise<ApiResponse<User>> => {
  return request.get(`/users/${userId}`)
}

/**
 * 获取博主信息（用于关于我页面）
 * 默认获取ID为1的用户（博主）
 * @returns 博主信息
 */
export const getBloggerInfo = async (): Promise<ApiResponse<User>> => {
  return request.get('/users/1')
}

/**
 * 更新用户信息
 * @param userId 用户ID
 * @param data 用户数据
 * @returns 更新后的用户信息
 */
export const updateUser = async (userId: number, data: Partial<User>): Promise<ApiResponse<User>> => {
  return request.put(`/users/${userId}`, data)
}

/**
 * 获取用户总数
 * 用于登录页面显示站点创作者数量
 * @returns 用户总数
 */
export const getUserCount = async (): Promise<ApiResponse<{ total: number }>> => {
  return request.get('/users/count')
}

/**
 * ========== 管理后台 · 用户管理 ==========
 * 说明：以下接口全部走后端管理模式（携带 page 等参数），list 永不返回 password_hash
 */

// 管理端用户行（含统计与活跃信息，字段名与后端 SQL 别名一致）
export interface AdminUserItem {
  id: number
  username: string
  email?: string | null
  role: 'admin' | 'user' | string
  status?: 'active' | 'disabled' | string
  avatar?: string | null
  bio?: string | null
  github_url?: string | null
  qq_number?: string | null
  tech_stack?: unknown
  visited_provinces?: unknown
  created_at?: string | null
  last_login_at?: string | null
  lastActiveAt?: string | null
  postCount: number
  commentCount: number
  notificationCount: number
  gameLevel: number | null
}

export interface UserManageParams {
  page?: number
  pageSize?: number
  keyword?: string
  role?: string
}

export interface UserManageResult {
  list: AdminUserItem[]
  total: number
  page: number
  pageSize: number
}

/**
 * 管理端用户列表（分页 + 关键字 + 角色过滤，单条 SQL 带统计）
 */
export const getUserManageList = async (
  params: UserManageParams = {}
): Promise<ApiResponse<UserManageResult>> => {
  return request.get('/users', {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      keyword: params.keyword ?? '',
      role: params.role ?? ''
    }
  })
}

/**
 * 修改用户角色（仅管理员；不能改自己 / admin 账号）
 */
export const updateUserRole = async (
  userId: number,
  role: 'admin' | 'user'
): Promise<ApiResponse<AdminUserItem>> => {
  return request.put(`/users/${userId}/role`, { role })
}

/**
 * 启用 / 禁用用户（仅管理员；不能动自己 / admin 账号）
 */
export const updateUserStatus = async (
  userId: number,
  status: 'active' | 'disabled'
): Promise<ApiResponse<AdminUserItem>> => {
  return request.put(`/users/${userId}/status`, { status })
}

/**
 * 重置用户密码（仅管理员；不能重置 admin 账号；后端与注册一致 bcrypt cost=10）
 */
export const resetUserPassword = async (
  userId: number,
  password: string
): Promise<ApiResponse<{ id: number; username: string }>> => {
  return request.put(`/users/${userId}/password`, { password })
}

/**
 * 删除用户（仅管理员；admin 账号 / 自己有文章用户会被后端拒绝；评论会被显式清理）
 */
export const deleteUser = async (userId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/users/${userId}`)
}

