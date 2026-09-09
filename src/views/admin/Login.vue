<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <div class="login-header">
        <h1 class="login-title">管理后台登录</h1>
        <p class="login-subtitle">请输入您的账号和密码</p>
      </div>
      <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="UserFilled" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-button" @click="handleLogin" :loading="loading">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/userStore'
import { authApi } from '../../api/auth'
import { ElMessage } from 'element-plus'
import { useThemeStore } from '../../stores/themeStore'
import { clearAuthRedirectFlag } from '../../utils/auth'

// 响应式数据
const loginFormRef = ref()
const loading = ref(false)
const userStore = useUserStore()
const themeStore = useThemeStore()
const router = useRouter()

clearAuthRedirectFlag()

// 登录表单
const loginForm = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度在 2 到 50 个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为 6 个字符', trigger: 'blur' }
  ]
}

// 登录方法
const handleLogin = async () => {
  // 表单验证
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        // 调用登录API
        const response = await authApi.login(loginForm.username, loginForm.password)
        const { user, token } = response.data
        
        // 存储用户信息和token
        userStore.login(user, token)
        
        // 更新主题登录状态（解锁个性情感模式）
        themeStore.setLoginStatus(true)
        
        // 跳转到后台首页
        router.push('/admin/dashboard')
      } catch (error: any) {
        // 登录失败提示
        ElMessage.error(error.message || '登录失败，请检查用户名和密码')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-form-wrapper {
  background-color: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-form-wrapper {
    padding: 1.5rem;
  }
  
  .login-title {
    font-size: 1.25rem;
  }
}
</style>
