<template>
  <!-- 评论项组件 - 抖音风格 -->
  <div class="comment-wrapper">
    <!-- 主评论 -->
    <div v-if="level === 0" class="comment-main">
      <div class="comment-left">
        <img
          :src="resolveAvatar(comment.user)"
          :alt="comment.user.username"
          class="avatar"
        >
      </div>
      <div class="comment-right">
        <div class="comment-content-box">
          <div class="username">{{ comment.user.username }}</div>
          <div class="content">{{ comment.content }}</div>
          <div v-if="comment.status === 'pending'" class="pending-tag">待审核</div>
        </div>
        <div class="comment-footer">
          <span class="time">{{ formatDate(comment.createdAt) }}</span>
          <span class="action-btn" v-if="isLoggedIn" @click="onReplyClick">回复</span>
          <span class="action-btn" v-if="canDeleteComment(comment)" @click="onDeleteClick">删除</span>
          <span class="action-btn approve-btn" v-if="canModerateComment(comment)" @click="onApproveClick">通过审核</span>
        </div>

        <!-- 回复表单 -->
        <div v-if="isReplying" class="reply-form">
          <div class="relative">
            <textarea
              v-model="localReplyContent"
              :placeholder="`回复 ${comment.user.username}...`"
              class="reply-input"
              maxlength="500"
            ></textarea>
            <div class="char-count">{{ localReplyContent.length }}/500</div>
          </div>
          <div class="reply-actions">
            <button class="btn-cancel" @click="onCancelReply">取消</button>
            <button class="btn-submit" @click="onSubmitReply" :disabled="!localReplyContent.trim() || localReplyContent.length > 500">发送</button>
          </div>
        </div>

        <!-- 回复列表 - 只显示一级回复 -->
        <div v-if="comment.children && comment.children.length > 0" class="replies-list">
          <!-- 直接子评论（一级回复） -->
          <div
            v-for="childComment in comment.children"
            :key="childComment.id"
            class="reply-item"
          >
            <div class="reply-line"></div>
            <div class="reply-body">
              <!-- 回复内容行 -->
              <div class="reply-content-line">
                <span class="reply-username">{{ childComment.user.username }}</span>
                <template v-if="shouldShowReplyTarget(childComment)">
                  <span class="reply-text">回复</span>
                  <span class="reply-target">{{ getReplyTargetName(childComment) }}</span>
                </template>
                <span class="reply-colon">:</span>
                <span class="reply-content-text">{{ childComment.content }}</span>
                <span v-if="childComment.status === 'pending'" class="pending-dot" title="待审核"></span>
              </div>

              <!-- 回复操作栏 -->
              <div class="reply-actions-bar">
                <span class="reply-time">{{ formatDate(childComment.createdAt) }}</span>
                <span class="reply-action-btn" v-if="isLoggedIn" @click="onNestedReplyClick(childComment)">回复</span>
                <span class="reply-action-btn approve-btn" v-if="canModerateComment(childComment)" @click="onNestedApproveClick(childComment)">通过审核</span>
                <span class="reply-action-btn" v-if="canDeleteComment(childComment)" @click="onNestedDeleteClick(childComment)">删除</span>
              </div>

              <!-- 嵌套回复表单 -->
              <div v-if="isNestedReplying(childComment)" class="nested-reply-form">
                <div class="relative">
                  <textarea
                    v-model="nestedReplyContent"
                    :placeholder="`回复 ${childComment.user.username}...`"
                    class="reply-input"
                    maxlength="500"
                  ></textarea>
                  <div class="char-count">{{ nestedReplyContent.length }}/500</div>
                </div>
                <div class="reply-actions">
                  <button class="btn-cancel" @click="onCancelNestedReply">取消</button>
                  <button class="btn-submit" @click="onSubmitNestedReply(childComment)" :disabled="!nestedReplyContent.trim() || nestedReplyContent.length > 500">发送</button>
                </div>
              </div>

              <!-- 二级及以上回复 - 默认折叠 -->
              <div v-if="childComment.children && childComment.children.length > 0" class="nested-replies">
                <!-- 展开/收起按钮 -->
                <div
                  v-if="!isExpanded(childComment.id)"
                  class="expand-btn"
                  @click="toggleExpand(childComment.id)"
                >
                  <span>展开 {{ countAllChildren(childComment) }} 条回复</span>
                  <el-icon><ArrowDown /></el-icon>
                </div>

                <!-- 展开的深层回复 -->
                <div v-else class="expanded-replies">
                  <NestedReplies
                    :comments="childComment.children"
                    :parent-user-name="childComment.user.username"
                    :post-id="postId"
                    :replying-to="nestedReplyingTo"
                    @reply="onDeepReply"
                    @delete="onDeepDelete"
                    @submit-reply="onDeepSubmitReply"
                    @cancel-reply="onDeepCancelReply"
                    @approve="onDeepApprove"
                  />
                  <div class="collapse-btn" @click="toggleExpand(childComment.id)">
                    <span>收起</span>
                    <el-icon><ArrowUp /></el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 评论项组件 - 抖音风格
 * 主评论：头像+内容区域
 * 子回复：简洁行内样式，带竖线引导，二级及以上默认折叠
 */
import { ref, computed } from 'vue'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/userStore'
import { resolveAvatar } from '../utils/avatar'
import type { Comment } from '../types'
import NestedReplies from './NestedReplies.vue'

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)

const props = defineProps<{
  comment: Comment & { children?: Comment[] }
  level?: number
  postId?: number
  replyingTo?: number | null
  parentUserName?: string
}>()

const level = props.level || 0

const emit = defineEmits<{
  (e: 'reply', comment: Comment): void
  (e: 'delete', comment: Comment): void
  (e: 'submit-reply', comment: Comment, content: string): void
  (e: 'cancel-reply'): void
  (e: 'approve', comment: Comment): void
}>()

const localReplyContent = ref('')
const nestedReplyContent = ref('')
const nestedReplyingTo = ref<number | null>(null)
const expandedIds = ref<Set<number>>(new Set())
const isReplying = computed(() => props.replyingTo === props.comment.id)

/**
 * 判断是否展开
 */
const isExpanded = (id: number): boolean => {
  return expandedIds.value.has(id)
}

/**
 * 切换展开/折叠
 */
const toggleExpand = (id: number) => {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

/**
 * 计算所有子评论数量（递归）
 */
const countAllChildren = (comment: Comment): number => {
  let count = 0
  const countChildren = (children: Comment[]) => {
    children.forEach(child => {
      count++
      if (child.children?.length) {
        countChildren(child.children)
      }
    })
  }
  if (comment.children) {
    countChildren(comment.children)
  }
  return count
}

/**
 * 判断是否显示回复目标
 * 当回复自己时不显示
 */
const shouldShowReplyTarget = (childComment: Comment): boolean => {
  const targetName = getReplyTargetName(childComment)
  return !!targetName && targetName !== childComment.user.username
}

/**
 * 获取回复目标的用户名
 */
const getReplyTargetName = (childComment: Comment): string => {
  if (childComment.parent?.user?.username) {
    return childComment.parent.user.username
  }
  return props.comment.user.username
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

const canDeleteComment = (comment: Comment): boolean => {
  return userStore.currentUser?.role === 'admin' || userStore.currentUser?.id === comment.userId
}

/**
 * 判断是否可以审核评论（仅管理员可以审核待审核的评论）
 */
const canModerateComment = (comment: Comment): boolean => {
  return userStore.currentUser?.role === 'admin' && comment.status === 'pending'
}

// 主评论回复
const onReplyClick = () => emit('reply', props.comment)
const onDeleteClick = () => emit('delete', props.comment)
const onApproveClick = () => emit('approve', props.comment)
const onSubmitReply = () => {
  if (!localReplyContent.value.trim()) return
  emit('submit-reply', props.comment, localReplyContent.value)
  localReplyContent.value = ''
}
const onCancelReply = () => {
  localReplyContent.value = ''
  emit('cancel-reply')
}

// 嵌套回复
const isNestedReplying = (comment: Comment): boolean => {
  return nestedReplyingTo.value === comment.id
}

const onNestedReplyClick = (comment: Comment) => {
  nestedReplyingTo.value = comment.id
  nestedReplyContent.value = ''
  emit('reply', comment)
}

const onNestedDeleteClick = (comment: Comment) => {
  emit('delete', comment)
}

const onNestedApproveClick = (comment: Comment) => {
  emit('approve', comment)
}

const onCancelNestedReply = () => {
  nestedReplyingTo.value = null
  nestedReplyContent.value = ''
  emit('cancel-reply')
}

const onSubmitNestedReply = (comment: Comment) => {
  if (!nestedReplyContent.value.trim()) return
  emit('submit-reply', comment, nestedReplyContent.value)
  nestedReplyContent.value = ''
  nestedReplyingTo.value = null
}

// 深层递归事件处理
const onDeepReply = (comment: Comment) => {
  nestedReplyingTo.value = comment.id
  emit('reply', comment)
}

const onDeepDelete = (comment: Comment) => {
  emit('delete', comment)
}

const onDeepSubmitReply = (comment: Comment, content: string) => {
  emit('submit-reply', comment, content)
  nestedReplyingTo.value = null
}

const onDeepCancelReply = () => {
  nestedReplyingTo.value = null
  emit('cancel-reply')
}

const onDeepApprove = (comment: Comment) => {
  emit('approve', comment)
}
</script>

<style scoped>
/* 主评论 */
.comment-main {
  display: flex;
  gap: 12px;
  padding: 12px 0;
}

.comment-left {
  flex-shrink: 0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-right {
  flex: 1;
  min-width: 0;
}

.comment-content-box {
  background: #f7f8fa;
  padding: 10px 14px;
  border-radius: 12px;
  display: inline-block;
  max-width: 100%;
}

.username {
  font-size: 14px;
  font-weight: 600;
  color: #576b95;
  margin-bottom: 4px;
}

.content {
  font-size: 14px;
  color: #161823;
  line-height: 1.5;
  word-break: break-word;
}

.pending-tag {
  display: inline-block;
  font-size: 11px;
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  padding-left: 4px;
}

.time {
  font-size: 12px;
  color: #999;
}

.action-btn {
  font-size: 12px;
  color: #576b95;
  cursor: pointer;
  font-weight: 500;
}

.action-btn:hover {
  opacity: 0.8;
}

.approve-btn {
  color: #67c23a;
}

.approve-btn:hover {
  color: #85ce61;
}

/* 回复列表 */
.replies-list {
  margin-top: 8px;
}

/* 回复项 */
.reply-item {
  display: flex;
  gap: 8px;
  padding: 6px 0;
}

.reply-line {
  width: 2px;
  background: #e0e0e0;
  border-radius: 1px;
  margin-left: 19px;
  flex-shrink: 0;
  min-height: 20px;
}

.reply-body {
  flex: 1;
  min-width: 0;
}

.reply-content-line {
  font-size: 14px;
  line-height: 1.5;
  color: #161823;
  word-break: break-word;
}

.reply-username {
  color: #576b95;
  font-weight: 600;
  cursor: pointer;
}

.reply-text {
  color: #999;
  margin: 0 4px;
}

.reply-target {
  color: #576b95;
  font-weight: 600;
  cursor: pointer;
}

.reply-colon {
  margin-right: 4px;
}

.reply-content-text {
  color: #161823;
}

.pending-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #ff6b6b;
  border-radius: 50%;
  margin-left: 6px;
  vertical-align: middle;
}

.reply-actions-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.reply-time {
  font-size: 12px;
  color: #999;
}

.reply-action-btn {
  font-size: 12px;
  color: #576b95;
  cursor: pointer;
  font-weight: 500;
}

.reply-action-btn:hover {
  opacity: 0.8;
}

/* 嵌套回复 */
.nested-replies {
  margin-top: 4px;
}

/* 展开按钮 */
.expand-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  color: #576b95;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.expand-btn:hover {
  opacity: 0.8;
}

/* 收起按钮 */
.collapse-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  color: #576b95;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.collapse-btn:hover {
  opacity: 0.8;
}

/* 展开的回复 */
.expanded-replies {
  margin-top: 4px;
}

/* 回复表单 */
.reply-form {
  margin-top: 10px;
  background: #f7f8fa;
  padding: 12px;
  border-radius: 8px;
}

.nested-reply-form {
  margin-top: 8px;
  background: #f7f8fa;
  padding: 10px;
  border-radius: 8px;
}

.reply-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  resize: none;
  min-height: 60px;
  background: #fff;
}

.reply-input:focus {
  outline: none;
  border-color: #576b95;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.btn-cancel, .btn-submit {
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  border: none;
}

.btn-cancel {
  background: #e0e0e0;
  color: #666;
}

.btn-submit {
  background: #576b95;
  color: #fff;
}

.btn-submit:hover {
  background: #4a5d85;
}

.btn-submit:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.relative {
  position: relative;
}

.char-count {
  position: absolute;
  bottom: 8px;
  right: 10px;
  font-size: 12px;
  color: #999;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
