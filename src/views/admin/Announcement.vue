<template>
  <!-- 公告管理页面 - 管理员发布公告并通知所有用户 -->
  <div class="announcement-page">
    
    <!-- 发布公告表单 -->
    <el-card class="announcement-form">
      <template #header>
        <div class="card-header">
          <span>发布公告</span>
        </div>
      </template>
      
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input 
            v-model="form.title" 
            placeholder="请输入公告标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="内容" prop="content">
          <el-input 
            v-model="form.content" 
            type="textarea" 
            :rows="6"
            placeholder="请输入公告内容"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item>
          <div class="form-actions-bar">
            <div class="form-actions-left">
              <el-button type="primary" @click="submitAnnouncement" :loading="submitting">
                <el-icon><Promotion /></el-icon>
                发布公告
              </el-button>
            </div>
            <div class="form-actions-right">
              <el-button @click="resetForm">重置</el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <el-alert
        v-if="submitSuccess"
        title="公告发布成功！所有用户将收到通知"
        type="success"
        show-icon
        :closable="false"
        class="success-alert"
      />
    </el-card>
    
    <!-- 公告说明 -->
    <el-card class="announcement-tips">
      <template #header>
        <div class="card-header">
          <span>使用说明</span>
        </div>
      </template>
      
      <ul class="tips-list">
        <li>公告发布后，所有注册用户都会收到通知</li>
        <li>公告内容会显示在用户的通知列表中</li>
        <li>建议公告内容简洁明了，重要信息突出显示</li>
        <li>避免频繁发布公告，以免打扰用户</li>
      </ul>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 公告管理页面
 * 功能：
 * 1. 管理员发布公告
 * 2. 公告自动通知所有用户
 * 3. 表单验证
 */
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Promotion } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import request from '../../utils/request'

// 表单引用
const formRef = ref<FormInstance>()

// 提交状态
const submitting = ref(false)
const submitSuccess = ref(false)

// 表单数据
const form = reactive({
  title: '',
  content: ''
})

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在2-100个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度在10-1000个字符之间', trigger: 'blur' }
  ]
}

/**
 * 提交公告
 */
const submitAnnouncement = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 确认发布
        await ElMessageBox.confirm(
          `确定要发布这条公告吗？所有用户都将收到通知。`,
          '确认发布',
          {
            confirmButtonText: '确定发布',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        submitting.value = true
        
        // 调用API发布公告
        await request.post('/notifications/announcement', {
          title: form.title,
          content: form.content
        })
        
        submitSuccess.value = true
        ElMessage.success('公告发布成功！所有用户已收到通知')
        
        // 3秒后隐藏成功提示
        setTimeout(() => {
          submitSuccess.value = false
        }, 3000)
        
        // 重置表单
        resetForm()
      } catch (error: any) {
        if (error !== 'cancel') {
          console.error('发布公告失败:', error)
          ElMessage.error(error.response?.data?.message || '发布公告失败')
        }
      } finally {
        submitting.value = false
      }
    }
  })
}

/**
 * 重置表单
 */
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  form.title = ''
  form.content = ''
}
</script>

<style scoped>
.announcement-page {
  padding: 20px;
}

.announcement-form {
  margin-bottom: 24px;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.success-alert {
  margin-top: 16px;
}

/* 表单底部操作栏：左动作 / 右重置（对齐后台筛选区规范） */
.form-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.form-actions-left,
.form-actions-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tips-list {
  padding-left: 20px;
  margin: 0;
  color: #606266;
  line-height: 2;
}

.tips-list li {
  margin-bottom: 8px;
}
</style>
