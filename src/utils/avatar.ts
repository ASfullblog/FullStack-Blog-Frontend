import adminAvatar from '../assets/avatar.png'

/**
 * 全站头像解析中心
 *
 * 规则：
 * 1. admin（站长）固定使用本地资源 src/assets/avatar.png，
 *    因为数据库里存的是第三方外链（已失效导致裂图），换成本地图片保证稳定显示。
 * 2. 其他用户保持原有逻辑：有自定义头像用自定义，没有则按用户 ID 取固定默认头像。
 */

const ADMIN_USERNAME = 'admin'

// 默认头像池（固定 seed，保证同一个用户永远拿到同一张，不会刷新就换脸）
const defaultAvatars = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=user1&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=user2&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=user3&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=user4&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=user5&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=user6&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=user7&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=user8&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=user9&backgroundColor=ffd5dc'
]

interface AvatarSource {
  username?: string | null
  avatar?: string | null
  id?: number | string | null
}

/**
 * 按用户 ID 取固定默认头像
 */
export const getDefaultAvatar = (seed: number | string | null | undefined): string => {
  const num = Math.abs(Number(seed)) || 1
  return defaultAvatars[(num - 1) % defaultAvatars.length]
}

/**
 * 是否是站长账号
 */
export const isAdminUser = (user?: AvatarSource | null): boolean =>
  user?.username === ADMIN_USERNAME

/**
 * 解析头像地址：admin 走本地固定头像，其他用户保持原逻辑
 */
export const resolveAvatar = (user?: AvatarSource | null): string => {
  if (!user) return getDefaultAvatar(1)
  if (isAdminUser(user)) return adminAvatar
  return user.avatar || getDefaultAvatar(user.id ?? 1)
}

export { adminAvatar }
export default resolveAvatar
