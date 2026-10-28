import request from '../utils/request'
import type { ApiResponse, Notification, NotificationListResponse } from '../types'

/**
 * 通知API接口
 */
export const notificationApi = {
  /**
   * 获取通知列表
   * @param params 查询参数
   * @returns 通知列表和分页信息
   */
  getNotifications: async (params?: { page?: number; limit?: number; isRead?: boolean }): Promise<ApiResponse<NotificationListResponse>> => {
    return request.get('/notifications', { params })
  },

  /**
   * 获取未读通知数量
   * @returns 未读数量
   */
  getUnreadCount: async (): Promise<ApiResponse<{ unreadCount: number }>> => {
    return request.get('/notifications/unread-count')
  },

  /**
   * 标记通知为已读
   * @param id 通知ID
   * @returns 操作结果
   */
  markAsRead: async (id: number): Promise<ApiResponse<null>> => {
    return request.put(`/notifications/${id}/read`)
  },

  /**
   * 标记所有通知为已读
   * @returns 操作结果
   */
  markAllAsRead: async (): Promise<ApiResponse<{ count: number }>> => {
    return request.put('/notifications/read-all')
  },

  /**
   * 删除通知
   * @param id 通知ID
   * @returns 操作结果
   */
  deleteNotification: async (id: number): Promise<ApiResponse<null>> => {
    return request.delete(`/notifications/${id}`)
  },

  /**
   * 清空当前用户的全部通知
   * @returns 删除的条数
   */
  clearAllNotifications: async (): Promise<ApiResponse<{ deleted: number }>> => {
    return request.delete('/notifications/all')
  }
}
