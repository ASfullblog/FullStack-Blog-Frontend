const TOKEN_STORAGE_KEY = 'token'
const USER_STORAGE_KEY = 'user'
const AUTH_REDIRECT_FLAG = 'auth_redirect_in_progress'

type JwtPayload = {
  exp?: number
  [key: string]: unknown
}

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=')
  return atob(padded)
}

export const parseJwtPayload = (token: string): JwtPayload | null => {
  try {
    const [, payload] = token.split('.')
    if (!payload) {
      return null
    }

    return JSON.parse(decodeBase64Url(payload)) as JwtPayload
  } catch {
    return null
  }
}

export const isTokenExpired = (token: string): boolean => {
  const payload = parseJwtPayload(token)
  if (!payload?.exp) {
    return true
  }

  return payload.exp * 1000 <= Date.now()
}

export const clearAuthStorage = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

export const handleAuthExpired = (redirectPath?: string): void => {
  clearAuthStorage()

  if (typeof window === 'undefined') {
    return
  }

  if (sessionStorage.getItem(AUTH_REDIRECT_FLAG) === '1') {
    return
  }

  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const loginPath = redirectPath || '/login'

  if (window.location.pathname === loginPath) {
    return
  }

  sessionStorage.setItem(AUTH_REDIRECT_FLAG, '1')

  const target = `${loginPath}?redirect=${encodeURIComponent(currentPath)}&reason=expired`
  window.location.replace(target)
}

export const clearAuthRedirectFlag = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  sessionStorage.removeItem(AUTH_REDIRECT_FLAG)
}
