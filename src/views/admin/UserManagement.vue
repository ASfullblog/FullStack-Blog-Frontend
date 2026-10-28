<template>
  <!-- 用户管理页面 - 管理员查看/搜索/改角色/禁用/重置密码/删除用户 -->
  <div class="user-management">
    <!-- 筛选区：上半部分筛选条件，下半部分左下动作按钮 / 右下搜索重置 -->
    <div class="search-filter">
      <div class="filter-conditions">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索用户名 / 邮箱"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchForm.role"
          placeholder="全部角色"
          clearable
          style="width: 140px"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="管理员" value="admin" />
          <el-option label="普通用户" value="user" />
        </el-select>
      </div>
      <div class="filter-actions">
        <div class="actions-left">
          <el-button type="primary" plain :loading="loading" @click="fetchUsers">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        <div class="actions-right">
          <el-button type="primary" :disabled="loading" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button :disabled="loading" @click="resetSearch">重置</el-button>
        </div>
      </div>
    </div>

    <!-- 用户列表（列较多，允许横向滚动；序号/用户名左冻结，操作列右冻结） -->
    <el-table
      :data="users"
      border
      style="width: 100%"
      v-loading="loading"
      element-loading-text="加载中..."
      empty-text="暂无用户数据"
    >
      <el-table-column label="#" width="70" align="center" fixed="left">
        <!-- 序号跨分页连续，绝不展示数据库 id -->
        <template #default="{ $index }">
          {{ indexMethod($index) }}
        </template>
      </el-table-column>

      <el-table-column label="用户" min-width="180" fixed="left">
        <template #default="{ row }">
          <div class="user-cell">
            <el-avatar :src="resolveAvatar(row)" :size="36">
              {{ getAvatarText(row.username) }}
            </el-avatar>
            <div class="user-meta">
              <span class="username">{{ row.username }}</span>
              <span v-if="getProvinceCount(row) > 0" class="province-count">
                去过 {{ getProvinceCount(row) }} 个省份
              </span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="邮箱" min-width="200">
        <template #default="{ row }">
          {{ row.email || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="角色" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'warning' : 'info'" size="small">
            {{ row.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'disabled' ? 'danger' : 'success'" size="small">
            {{ row.status === 'disabled' ? '禁用' : '启用' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="postCount" label="文章数" width="90" align="center" />
      <el-table-column prop="commentCount" label="评论数" width="90" align="center" />
      <el-table-column prop="notificationCount" label="消息数" width="90" align="center" />

      <el-table-column label="游戏等级" width="100" align="center">
        <template #default="{ row }">
          {{ row.gameLevel === null || row.gameLevel === undefined ? '-' : `Lv.${row.gameLevel}` }}
        </template>
      </el-table-column>

      <el-table-column label="最近活跃" min-width="130">
        <template #default="{ row }">
          <span :title="formatFullDate(getActiveAt(row))">{{ formatRelative(getActiveAt(row)) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="注册时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <div class="action-cell">
            <el-dropdown trigger="click" @command="(cmd: string) => handleChangeRole(row, cmd)">
              <el-button type="primary" size="small" link :disabled="isProtectedRow(row)">
                改角色
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="admin" :disabled="row.role === 'admin'">设为管理员</el-dropdown-item>
                  <el-dropdown-item command="user" :disabled="row.role === 'user'">设为普通用户</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <el-button
              :type="row.status === 'disabled' ? 'success' : 'warning'"
              size="small"
              link
              :disabled="isProtectedRow(row)"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'disabled' ? '启用' : '禁用' }}
            </el-button>

            <el-button
              type="info"
              size="small"
              link
              :disabled="row.username === 'admin'"
              @click="openPasswordDialog(row)"
            >
              重置密码
            </el-button>

            <el-button
              type="danger"
              size="small"
              link
              :disabled="isProtectedRow(row)"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 重置密码弹窗 -->
    <el-dialog
      v-model="passwordDialog.visible"
      :title="`重置密码 - ${passwordDialog.username}`"
      width="420px"
      :close-on-click-modal="false"
      @closed="resetPasswordForm"
    >
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="90px">
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="passwordForm.password"
            type="password"
            placeholder="至少 6 位"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
      </el-form>
      <div class="password-tip">密码将加密后写入，仅本人可用新密码登录；admin 账号不支持在此重置。</div>
      <template #footer>
        <el-button @click="passwordDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="passwordDialog.submitting" @click="submitPassword">
          确认重置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 用户管理（后台）
 * 列：序号 | 头像+用户名 | 邮箱 | 角色 | 状态 | 文章数 | 评论数 | 消息数 | 游戏等级 | 最近活跃 | 注册时间 | 操作
 * 规范：序号跨分页连续、不展示数据库 id；服务端分页 + 单条 SQL 统计。
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Refresh, Search, ArrowDown } from '@element-plus/icons-vue'
import {
  getUserManageList,
  updateUserRole,
  updateUserStatus,
  resetUserPassword,
  deleteUser,
  type AdminUserItem
} from '../../api/user'
import { useUserStore } from '../../stores/userStore'
import { resolveAvatar } from '../../utils/avatar'

defineOptions({ name: 'UserManagement' })

const userStore = useUserStore()
if (!userStore.user) {
  userStore.initUser()
}

// 当前登录用户 id：用于"禁止删除/降级/禁用自己"
const currentUserId = computed(() => Number(userStore.user?.id ?? -1))

const loading = ref(false)
const users = ref<AdminUserItem[]>([])
const total = ref(0)

const searchForm = reactive({
  keyword: '',
  role: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 序号从 1 开始且跨分页连续（绝不使用数据库 id）
const indexMethod = (index: number) => (pagination.page - 1) * pagination.pageSize + index + 1

// 保护行：admin 账号与当前登录自己 —— 禁止删除/改角色/禁用
const isProtectedRow = (row: AdminUserItem) =>
  row.username === 'admin' || Number(row.id) === currentUserId.value

const getAvatarText = (username: string) => {
  if (!username) return 'U'
  return username.charAt(0).toUpperCase()
}

// 足迹省份数：visited_provinces 是 jsonb 数组，缺失/非数组按 0 处理（0 时模板里不显示）
const getProvinceCount = (row: AdminUserItem): number => {
  const v = row.visited_provinces
  return Array.isArray(v) ? v.length : 0
}

// 最近活跃：后端已做 last_login_at -> created_at 的回退，这里兜底
const getActiveAt = (row: AdminUserItem) => row.lastActiveAt || row.last_login_at || row.created_at || ''

const pad = (n: number) => String(n).padStart(2, '0')

const formatShortDate = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const formatDate = (date: string) => {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const formatFullDate = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('zh-CN')
}

// 相对 + 绝对混合：今天/昨天/N天前（7 天内），更早显示绝对日期
const formatRelative = (date: string) => {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diffDays <= 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return formatShortDate(date)
}

// 拉取列表（服务端分页，保持 loading）
const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUserManageList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword.trim(),
      role: searchForm.role
    })
    const data = res?.data
    users.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total ?? 0)

    // 当前页越界（如筛选变少 / 删完尾页）时回夹到最后一页重拉一次
    const maxPage = Math.max(1, Math.ceil(total.value / pagination.pageSize))
    if (pagination.page > maxPage) {
      pagination.page = maxPage
      const retryRes = await getUserManageList({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: searchForm.keyword.trim(),
        role: searchForm.role
      })
      const retryData = retryRes?.data
      users.value = Array.isArray(retryData?.list) ? retryData.list : []
      total.value = Number(retryData?.total ?? 0)
    }
  } catch (error: any) {
    console.error('获取用户列表失败:', error)
    ElMessage.error(error?.message || '获取用户列表失败')
    users.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchUsers()
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.role = ''
  pagination.page = 1
  fetchUsers()
}

const handleSizeChange = () => {
  pagination.page = 1
  fetchUsers()
}

const handleCurrentChange = () => {
  fetchUsers()
}

// 改角色（二次确认）
const handleChangeRole = async (row: AdminUserItem, newRole: string) => {
  if (isProtectedRow(row)) {
    ElMessage.warning('admin 账号与当前登录账号不允许修改角色')
    return
  }
  if (row.role === newRole) return

  const label = newRole === 'admin' ? '管理员' : '普通用户'
  try {
    await ElMessageBox.confirm(
      `确定把用户「${row.username}」设为${label}吗？${newRole === 'admin' ? '该账号将获得后台管理权限。' : ''}`,
      '确认修改角色',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  try {
    await updateUserRole(row.id, newRole as 'admin' | 'user')
    ElMessage.success(`已将 ${row.username} 设为${label}`)
    await fetchUsers()
  } catch (error: any) {
    ElMessage.error(error?.message || '修改角色失败')
  }
}

// 禁用 / 启用（二次确认）
const handleToggleStatus = async (row: AdminUserItem) => {
  if (isProtectedRow(row)) {
    ElMessage.warning('admin 账号与当前登录账号不允许修改状态')
    return
  }
  const nextStatus = row.status === 'disabled' ? 'active' : 'disabled'
  const actionText = nextStatus === 'disabled' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(
      nextStatus === 'disabled'
        ? `确定禁用用户「${row.username}」吗？禁用后该账号状态将标记为禁用。`
        : `确定重新启用用户「${row.username}」吗？`,
      `确认${actionText}`,
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  try {
    await updateUserStatus(row.id, nextStatus)
    ElMessage.success(`已${actionText}用户 ${row.username}`)
    await fetchUsers()
  } catch (error: any) {
    ElMessage.error(error?.message || `${actionText}失败`)
  }
}

// 重置密码弹窗（不在任何日志/提示中出现密码）
const passwordDialog = reactive({
  visible: false,
  submitting: false,
  userId: 0,
  username: ''
})
const passwordForm = reactive({ password: '' })
const passwordFormRef = ref<FormInstance>()
const passwordRules: FormRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 64, message: '密码长度不能少于 6 位', trigger: 'blur' }
  ]
}

const openPasswordDialog = (row: AdminUserItem) => {
  if (row.username === 'admin') {
    ElMessage.warning('admin 账号请走自己的改密流程')
    return
  }
  passwordDialog.userId = row.id
  passwordDialog.username = row.username
  passwordForm.password = ''
  passwordDialog.visible = true
}

const resetPasswordForm = () => {
  passwordForm.password = ''
  passwordFormRef.value?.clearValidate()
}

const submitPassword = async () => {
  if (!passwordFormRef.value) return
  try {
    await passwordFormRef.value.validate()
  } catch {
    return
  }

  passwordDialog.submitting = true
  try {
    await resetUserPassword(passwordDialog.userId, passwordForm.password)
    ElMessage.success(`已重置用户 ${passwordDialog.username} 的密码`)
    passwordDialog.visible = false
  } catch (error: any) {
    ElMessage.error(error?.message || '重置密码失败')
  } finally {
    passwordDialog.submitting = false
  }
}

// 删除（二次确认，提示连带删除评论/消息且不可恢复）
const handleDelete = async (row: AdminUserItem) => {
  if (isProtectedRow(row)) {
    ElMessage.warning('不能删除 admin 账号或当前登录账号')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定删除用户「${row.username}」吗？将连带删除 TA 的 ${row.commentCount ?? 0} 条评论和 ${row.notificationCount ?? 0} 条消息（及其等级/游戏记录），且无法恢复！若 TA 仍有文章需先转移或删除文章。`,
      '确认删除用户',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'error' }
    )
  } catch {
    return
  }

  try {
    await deleteUser(row.id)
    ElMessage.success(`用户 ${row.username} 已删除`)
    // 删掉当前页最后一条时回退一页，避免空页
    if (users.value.length === 1 && pagination.page > 1) {
      pagination.page -= 1
    }
    await fetchUsers()
  } catch (error: any) {
    ElMessage.error(error?.message || '删除失败')
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

/* 筛选卡片：上半筛选条件，下半两端对齐（左下动作 / 右下搜索重置） */
.search-filter {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--bg-secondary, #f5f7fa);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.filter-conditions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions-right {
  display: flex;
  gap: 10px;
}

/* 表格样式适配主题 */
:deep(.el-table) {
  background-color: var(--card-bg, #ffffff);
  color: var(--text-primary, #1f2937);
}

:deep(.el-table__header-wrapper th) {
  background-color: var(--bg-secondary, #f5f7fa);
  color: var(--text-primary, #1f2937);
}

:deep(.el-table__row) {
  background-color: var(--card-bg, #ffffff);
}

:deep(.el-table__row:hover > td) {
  background-color: var(--hover-bg, #f5f7fa) !important;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-size: 14px;
  color: var(--text-primary, #1f2937);
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.province-count {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  white-space: nowrap;
}

.action-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.password-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary, #909399);
  line-height: 1.5;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
