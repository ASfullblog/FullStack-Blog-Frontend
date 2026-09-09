import { defineStore } from 'pinia'
import type { User } from '../types'

type StoredUser = Pick<User, 'id' | 'username' | 'role' | 'avatar' | 'createdAt'>

const toStoredUser = (user: User): StoredUser => ({
  id: user.id,
  username: user.username,
  role: user.role,
  avatar: user.avatar ?? null,
  createdAt: user.createdAt
})

// 用户登录状态存储
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('token') || null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    currentUser: (state) => state.user
  },

  actions: {
    // 登录
    login(user: User, token: string, remember: boolean = true) {
      this.user = user
      this.token = token
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(toStoredUser(user)))
    },

    // 登出
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    // 设置用户信息
    setUser(user: User) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(toStoredUser(user)))
    },

    // 初始化用户信息
    initUser() {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          this.user = JSON.parse(savedUser) as User
        } catch (error) {
          console.error('Failed to parse saved user:', error)
        }
      }
    }
  }
})
