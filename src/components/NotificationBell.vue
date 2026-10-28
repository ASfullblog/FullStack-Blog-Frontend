<template>
  <!-- 通知铃铛组件 - 显示在导航栏中 -->
  <div class="notification-bell" ref="bellRef">
    <div class="bell-icon-wrapper" @click="toggleDropdown">
      <el-icon :size="22" class="bell-icon">
        <Bell />
      </el-icon>
      <!-- 未读消息红点 -->
      <span v-if="unreadCount > 0" class="unread-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </div>

    <!-- 通知下拉面板 -->
    <div v-show="showDropdown" class="notification-dropdown">
      <!-- 下拉面板头部 -->
      <div class="dropdown-header">
        <span class="title">通知消息</span>
        <div class="header-actions">
          <el-button
            v-if="notifications.length > 0"
            link
            type="danger"
            size="small"
            class="clear-all-btn"
            :loading="clearingAll"
            :disabled="clearingAll"
            @click="clearAllMessages"
          >
            清空消息
          </el-button>
          <el-button
            v-if="unreadCount > 0"
            link
            type="primary"
            size="small"
            @click="markAllAsRead"
          >
            全部已读
          </el-button>
        </div>
      </div>

      <!-- 通知列表 -->
      <div class="notification-list" v-if="notifications.length > 0">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.isRead }"
          @click.stop="handleNotificationClick(notification)"
        >
          <!-- 通知图标 -->
          <div class="notification-icon" :class="notification.type">
            <el-icon v-if="notification.type === 'comment_approved'" :size="18"><CircleCheck /></el-icon>
            <el-icon v-else-if="notification.type === 'comment_rejected'" :size="18"><CircleClose /></el-icon>
            <el-icon v-else-if="notification.type === 'announcement'" :size="18"><Bell /></el-icon>
            <el-icon v-else-if="notification.type === 'reply'" :size="18"><ChatDotRound /></el-icon>
            <el-icon v-else :size="18"><InfoFilled /></el-icon>
          </div>

          <!-- 通知内容 -->
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-text" v-if="notification.content">
              {{ notification.content.length > 50 ? notification.content.substring(0, 50) + '...' : notification.content }}
            </div>
            <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
          </div>

          <!-- 未读标记 -->
          <div v-if="!notification.isRead" class="unread-dot"></div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-icon :size="48" color="#ddd"><Bell /></el-icon>
        <p>暂无通知</p>
      </div>
    </div>

    <!-- 通知详情弹窗 - 使用 teleport 确保在 body 下渲染，避免 z-index 问题 -->
    <teleport to="body">
      <el-dialog
        v-model="detailDialogVisible"
        :title="selectedNotification?.title || '通知详情'"
        width="500px"
        :close-on-click-modal="true"
        destroy-on-close
        custom-class="notification-bell-dialog"
        append-to-body
      >
        <div v-if="selectedNotification" class="notification-detail">
          <div class="detail-time">{{ formatDateTime(selectedNotification.createdAt) }}</div>
          <div class="detail-content">{{ selectedNotification.content || '暂无详细内容' }}</div>
        </div>
        <div v-else class="notification-detail">
          <div class="detail-content">暂无详细内容</div>
        </div>
      </el-dialog>
    </teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * 通知铃铛组件
 * 功能：
 * 1. 显示未读通知数量红点
 * 2. 点击展开通知下拉列表
 * 3. 支持标记单条通知为已读
 * 4. 支持标记所有通知为已读
 * 5. 支持二次确认后清空当前用户全部通知
 * 6. 点击通知显示详情弹窗
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, CircleCheck, CircleClose, ChatDotRound, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { notificationApi } from '../api/notification'
import type { Notification } from '../types'

const router = useRouter()
const bellRef = ref<HTMLElement | null>(null)
const showDropdown = ref(false)
const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const total = ref(0)

// 详情弹窗相关
const detailDialogVisible = ref(false)
const selectedNotification = ref<Notification | null>(null)

// 清空消息请求中状态（防连点）
const clearingAll = ref(false)

/**
 * 切换下拉面板显示状态
 */
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    fetchNotifications()
  }
}

/**
 * 获取通知列表
 */
const fetchNotifications = async () => {
  try {
    const response = await notificationApi.getNotifications({ limit: 10 })
    notifications.value = response.data.notifications
    unreadCount.value = response.data.unreadCount
    total.value = response.data.total
  } catch (error) {
    console.error('获取通知失败:', error)
  }
}

/**
 * 获取未读数量
 */
const fetchUnreadCount = async () => {
  try {
    const response = await notificationApi.getUnreadCount()
    unreadCount.value = response.data.unreadCount
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

/**
 * 标记所有通知为已读
 */
const markAllAsRead = async () => {
  try {
    await notificationApi.markAllAsRead()
    ElMessage.success('已全部标记为已读')
    fetchNotifications()
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

/**
 * 清空当前用户的全部通知（二次确认后执行）
 */
const clearAllMessages = async () => {
  if (clearingAll.value) return

  try {
    await ElMessageBox.confirm(
      '将删除你收到的全部消息，不可恢复。确定要清空吗？',
      '清空消息',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    // 用户取消，保持现状
    return
  }

  clearingAll.value = true
  try {
    const response = await notificationApi.clearAllNotifications()
    const deleted = response.data?.deleted ?? 0
    // 本地状态同步：列表清空、未读红点归零
    notifications.value = []
    unreadCount.value = 0
    total.value = 0
    ElMessage.success(`已清空 ${deleted} 条消息`)
  } catch (error: any) {
    console.error('清空消息失败:', error)
    ElMessage.error(error?.response?.data?.message || '清空消息失败，请稍后重试')
    // 失败不动本地列表，拉一次服务端真实状态，避免 UI 与后端不一致
    fetchNotifications()
  } finally {
    clearingAll.value = false
  }
}

/**
 * 处理通知点击 - 显示详情弹窗
 * @param notification 通知对象
 */
const handleNotificationClick = async (notification: Notification) => {
  console.log('点击通知:', notification)

  // 标记为已读
  if (!notification.isRead) {
    try {
      await notificationApi.markAsRead(notification.id)
      notification.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  // 关闭下拉面板（先关闭，避免遮挡）
  showDropdown.value = false

  // 显示详情弹窗
  selectedNotification.value = { ...notification } // 创建副本避免引用问题
  detailDialogVisible.value = true
  console.log('弹窗状态:', detailDialogVisible.value, '选中通知:', selectedNotification.value)
}

/**
 * 格式化时间显示
 * @param time 时间字符串
 * @returns 格式化后的时间
 */
const formatTime = (time: string): string => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  // 小于24小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }
  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  }

  // 超过7天显示具体日期
  return date.toLocaleDateString('zh-CN')
}

/**
 * 格式化完整日期时间
 * @param time 时间字符串
 * @returns 格式化后的日期时间
 */
const formatDateTime = (time: string): string => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 点击外部关闭下拉面板
 * @param event 鼠标事件
 */
const handleClickOutside = (event: MouseEvent) => {
  if (bellRef.value && !bellRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

// 组件挂载时获取未读数量
onMounted(() => {
  fetchUnreadCount()
  document.addEventListener('click', handleClickOutside)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.notification-bell {
  position: relative;
}

.bell-icon-wrapper {
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.bell-icon-wrapper:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.bell-icon {
  color: #606266;
}

.unread-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: #f56c6c;
  color: white;
  font-size: 12px;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  border-radius: 9px;
  min-width: 18px;
  text-align: center;
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 360px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 8px;
  z-index: 1000;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.dropdown-header .title {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 清空消息按钮：danger 醒目色，字号与"全部已读"对齐 */
.clear-all-btn {
  font-size: 13px;
  font-weight: 500;
}

.clear-all-btn:hover {
  color: #f78989;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
}

.notification-item.unread:hover {
  background-color: #e6f4ff;
}

.notification-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.notification-icon.reply {
  background-color: #e6f7ff;
  color: #1890ff;
}

.notification-icon.announcement {
  background-color: #fff7e6;
  color: #fa8c16;
}

.notification-icon.comment_approved {
  background-color: #f6ffed;
  color: #52c41a;
}

.notification-icon.comment_rejected {
  background-color: #fff1f0;
  color: #f5222d;
}

.notification-icon.system {
  background-color: #f5f5f5;
  color: #8c8c8c;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.notification-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background-color: #f56c6c;
  border-radius: 50%;
  margin-left: 8px;
  flex-shrink: 0;
  margin-top: 4px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
}

.empty-state p {
  margin-top: 12px;
}

/* 详情弹窗样式 */
.notification-detail {
  padding: 10px 0;
}

.detail-time {
  font-size: 13px;
  color: #909399;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.detail-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

<style>
/* 全局样式 - 确保弹窗在最上层 */
.notification-bell-dialog .el-overlay {
  z-index: 9998 !important;
}

.notification-bell-dialog .el-dialog {
  z-index: 9999 !important;
}
</style>
