import request from '../utils/request'
import type { ApiResponse, User, LoginResponse } from '../types'

/**
 * 认证API接口
 */
export const authApi = {
  /**
   * 用户注册
   * @param username 用户名
   * @param password 密码
   * @param email 邮箱
   * @returns 注册成功的用户信息
   */
  register: async (username: string, password: string, email: string): Promise<ApiResponse<User>> => {
    return request.post('/auth/register', { username, password, email })
  },

  /**
   * 用户登录
   * @param username 账号
   * @param password 密码
   * @returns 用户信息和token
   */
  login: async (username: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    return request.post('/auth/login', { username, password })
  },

  /**
   * 重置密码：用「用户名 + 注册邮箱」校验身份后直接改密码（不发邮件/短信）
   * @param username 用户名
   * @param email 注册邮箱
   * @param newPassword 新密码
   */
  resetPassword: async (username: string, email: string, newPassword: string): Promise<ApiResponse<null>> => {
    return request.post('/auth/reset-password', { username, email, newPassword })
  },


}