// 通用响应格式
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 用户类型
export interface User {
  id: number
  username: string
  email?: string | null
  role: string
  avatar?: string | null
  createdAt: string
}

// 登录响应
export interface LoginResponse {
  user: User
  token: string
}

// 分类类型
export interface Category {
  id: number
  name: string
  slug: string
  parentId?: number
}

// 标签类型
export interface Tag {
  id: number
  name: string
  slug: string
}

// 文章类型
export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  coverImage?: string
  author: User
  category: Category
  status: string
  viewCount: number
  createdAt: string
  updatedAt: string
  tags: Tag[]
  comments?: Comment[]
}

// 评论类型
export interface Comment {
  id: number
  postId: number
  userId: number
  content: string
  parentId?: number
  status: string
  user: User
  parent?: {
    id: number
    content: string
    user: {
      username: string
    }
  }
  children?: Comment[]
}

// 文章列表响应
export interface PostListResponse {
  posts: Post[]
  total: number
  page: number
  limit: number
}

// 分页参数
export interface PaginationParams {
  page?: number
  limit?: number
  categoryId?: string
  tagId?: string
  keyword?: string
  status?: string
}

// 创建文章参数
export interface CreatePostParams {
  title: string
  slug?: string
  content: string
  excerpt?: string
  coverImage?: string
  categoryId: number
  status?: string
  tags?: number[]
  authorId?: number
}

// 更新文章参数
export interface UpdatePostParams {
  id: number
  title?: string
  slug?: string
  content?: string
  excerpt?: string
  coverImage?: string
  categoryId?: number
  status?: string
  tags?: number[]
}

// 通知类型
export interface Notification {
  id: number
  userId: number
  type: 'comment_approved' | 'comment_rejected' | 'announcement' | 'reply'
  title: string
  content?: string
  relatedId?: number
  relatedType?: string
  isRead: boolean
  createdAt: string
  updatedAt: string
}

// 通知列表响应
export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
}
