<template>
  <div class="settings" v-loading="pageLoading" element-loading-text="加载中...">
    
    <!-- 站点设置 -->
    <el-card class="settings-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>站点设置</span>
        </div>
      </template>
      <el-form :model="siteSettings" :rules="siteSettingsRules" ref="siteSettingsRef" label-width="100px">
        <el-form-item label="站点标题" prop="siteTitle">
          <el-input v-model="siteSettings.siteTitle" placeholder="请输入站点标题" />
        </el-form-item>
        <el-form-item label="站点描述" prop="siteDescription">
          <el-input
            v-model="siteSettings.siteDescription"
            type="textarea"
            placeholder="请输入站点描述"
            rows="3"
          />
        </el-form-item>
        <el-form-item label="站点版权" prop="siteCopyright">
          <el-input v-model="siteSettings.siteCopyright" placeholder="请输入站点版权信息" />
        </el-form-item>
        <el-form-item label="站点Logo">
          <el-upload
            class="logo-upload"
            action="https://jsonplaceholder.typicode.com/posts/"
            :on-success="handleLogoUploadSuccess"
            :on-error="handleLogoUploadError"
            :file-list="logoFileList"
            :auto-upload="false"
            :limit="1"
            :on-exceed="handleLogoExceed"
          >
            <template #trigger>
              <el-button type="primary">
                <el-icon><UploadIcon /></el-icon>
                选择 Logo
              </el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                请上传图片文件，建议尺寸为 200x60
              </div>
            </template>
          </el-upload>
          <div v-if="siteSettings.siteLogo" class="logo-preview">
            <img :src="siteSettings.siteLogo" alt="Logo预览" class="logo-image">
            <el-button type="danger" size="small" @click="removeLogo">删除Logo</el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveSiteSettings" :loading="loading" :disabled="pageLoading">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 其他设置 -->
    <el-card class="settings-card" shadow="hover" style="margin-top: 1.5rem">
      <template #header>
        <div class="card-header">
          <span>其他设置</span>
        </div>
      </template>
      <el-form :model="otherSettings" :rules="otherSettingsRules" ref="otherSettingsRef" label-width="150px">
        <el-form-item label="每页文章数量" prop="postsPerPage">
          <el-input-number v-model="otherSettings.postsPerPage" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="评论审核" prop="commentApproval">
          <el-switch v-model="otherSettings.commentApproval" />
        </el-form-item>
        <el-form-item label="开启注册" prop="allowRegistration">
          <el-switch v-model="otherSettings.allowRegistration" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveOtherSettings" :loading="loading" :disabled="pageLoading">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload as UploadIcon } from '@element-plus/icons-vue'
import { useConfigStore } from '../../stores/configStore'
import request from '../../utils/request'

// 响应式数据
const siteSettingsRef = ref()
const otherSettingsRef = ref()
const logoFileList = ref<any[]>([])
const configStore = useConfigStore()
const loading = ref(false)
// 首屏拉取设置的 loading（Neon 冷启动慢，避免空表单误导操作）
const pageLoading = ref(false)

// 站点设置
const siteSettings = reactive({
  siteTitle: '',
  siteDescription: '',
  siteCopyright: '',
  siteLogo: ''
})

// 其他设置
const otherSettings = reactive({
  postsPerPage: 10,
  commentApproval: true,
  allowRegistration: true
})

// 站点设置验证规则
const siteSettingsRules = {
  siteTitle: [
    { required: true, message: '请输入站点标题', trigger: 'blur' },
    { min: 1, max: 100, message: '站点标题长度在 1 到 100 个字符之间', trigger: 'blur' }
  ],
  siteDescription: [
    { max: 255, message: '站点描述长度不超过 255 个字符', trigger: 'blur' }
  ],
  siteCopyright: [
    { max: 255, message: '站点版权信息长度不超过 255 个字符', trigger: 'blur' }
  ]
}

// 其他设置验证规则
const otherSettingsRules = {
  postsPerPage: [
    { required: true, message: '请输入每页文章数量', trigger: 'blur' }
  ]
}

// 处理Logo上传成功
const handleLogoUploadSuccess = (response: any, uploadFile: any) => {
  // 模拟上传成功，实际项目中应该根据后端返回的URL设置
  siteSettings.siteLogo = 'https://picsum.photos/200/60'
  logoFileList.value = [uploadFile]
  ElMessage.success('Logo上传成功')
}

// 处理Logo上传失败
const handleLogoUploadError = () => {
  ElMessage.error('Logo上传失败')
}

// 处理Logo超出限制
const handleLogoExceed = () => {
  ElMessage.warning('只能上传一张Logo')
}

// 删除Logo
const removeLogo = () => {
  siteSettings.siteLogo = ''
  logoFileList.value = []
}

// 保存站点设置
const saveSiteSettings = async () => {
  if (!siteSettingsRef.value) return
  await siteSettingsRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        // 调用API保存设置
        await request.put('/settings', {
          site_title: siteSettings.siteTitle,
          site_description: siteSettings.siteDescription,
          site_copyright: siteSettings.siteCopyright,
          site_logo: siteSettings.siteLogo
        })
        
        // 更新Pinia存储
        configStore.updateSiteTitle(siteSettings.siteTitle)
        configStore.updateSiteDescription(siteSettings.siteDescription)
        configStore.updateSiteCopyright(siteSettings.siteCopyright)
        
        ElMessage.success('站点设置保存成功')
      } catch (error: any) {
        ElMessage.error(error.message || '保存失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 保存其他设置
const saveOtherSettings = async () => {
  if (!otherSettingsRef.value) return
  await otherSettingsRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        // 调用API保存设置
        await request.put('/settings', {
          posts_per_page: otherSettings.postsPerPage.toString(),
          comment_approval: otherSettings.commentApproval.toString(),
          allow_registration: otherSettings.allowRegistration.toString()
        })
        
        ElMessage.success('其他设置保存成功')
      } catch (error: any) {
        ElMessage.error(error.message || '保存失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 获取设置
const fetchSettings = async () => {
  pageLoading.value = true
  try {
    const settings = await request.get('/settings')

    // 站点设置
    siteSettings.siteTitle = settings.data.site_title || ''
    siteSettings.siteDescription = settings.data.site_description || ''
    siteSettings.siteCopyright = settings.data.site_copyright || ''
    siteSettings.siteLogo = settings.data.site_logo || ''

    // 其他设置
    otherSettings.postsPerPage = parseInt(settings.data.posts_per_page) || 10
    otherSettings.commentApproval = settings.data.comment_approval === 'true'
    otherSettings.allowRegistration = settings.data.allow_registration === 'true'
  } catch (error) {
    console.error('获取设置失败:', error)
    ElMessage.error('获取设置失败')
  } finally {
    pageLoading.value = false
  }
}

// 页面挂载时获取数据
onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
.settings {
  padding: 1rem 0;
}

.settings-card {
  margin-bottom: 1.5rem;
  background-color: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  transition: all 0.3s ease;
}

.settings-card :deep(.el-card__header) {
  background-color: var(--bg-secondary, #ffffff);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  transition: all 0.3s ease;
}

.card-header {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  transition: color 0.3s ease;
}

/* 表单样式适配主题 */
.settings-card :deep(.el-form-item__label) {
  color: var(--text-secondary, #606266);
  transition: color 0.3s ease;
}

.settings-card :deep(.el-input__wrapper) {
  background-color: var(--bg-secondary, #ffffff);
  box-shadow: 0 0 0 1px var(--border-color, #dcdfe6) inset;
  transition: all 0.3s ease;
}

.settings-card :deep(.el-input__inner) {
  color: var(--text-primary, #1f2937);
  background-color: transparent;
}

/* Logo上传样式 */
.logo-upload {
  margin-bottom: 1rem;
}

.logo-preview {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-image {
  height: 40px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.375rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-card {
    margin-bottom: 1rem;
  }

  .logo-image {
    height: 30px;
  }
}
</style>