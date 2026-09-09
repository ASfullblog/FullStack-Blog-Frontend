import axios from 'axios'
import { clearAuthStorage, handleAuthExpired, isTokenExpired } from './auth'

const getBaseURL = () => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL || '/api'
  }

  return '/api'
}

const request = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      if (isTokenExpired(token)) {
        handleAuthExpired()
        return Promise.reject(new Error('Token has expired'))
      }

      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data.code !== 200 && data.code !== 201) {
      return Promise.reject(new Error(data.message || 'Request failed'))
    }

    return data
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || ''

    if (status === 401) {
      const lowerMessage = String(message).toLowerCase()
      const isTokenIssue =
        lowerMessage.includes('token') ||
        lowerMessage.includes('authorization') ||
        lowerMessage.includes('expired')

      if (isTokenIssue) {
        handleAuthExpired()
      } else {
        clearAuthStorage()
      }
    }

    if (error.response?.data) {
      return Promise.reject(new Error(error.response.data.message || 'Request failed'))
    }

    return Promise.reject(new Error(error.message || 'Network error'))
  }
)

export default request
