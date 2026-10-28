<template>
  <div class="post-list">
    <div class="list-header">
      <el-button type="primary" @click="handleCreatePost">
        <el-icon><PlusIcon /></el-icon>
        创建文章
      </el-button>
    </div>
    
    <!-- 文章编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑文章' : '创建文章'"
      width="80%"
      :before-close="handleDialogClose"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <!-- 文章标题 -->
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" maxlength="200" show-word-limit />
        </el-form-item>
        
        <!-- 文章slug -->
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="form.slug" placeholder="请输入文章slug（可选，默认会根据标题生成）" />
        </el-form-item>
        
        <!-- 文章分类 -->
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类">
            <el-option 
              v-for="category in categories" 
              :key="category.id" 
              :label="category.name" 
              :value="category.id" 
            />
          </el-select>
        </el-form-item>
        
        <!-- 文章标签 -->
        <el-form-item label="标签" prop="tags">
          <el-select v-model="form.tags" multiple placeholder="请选择标签">
            <el-option 
              v-for="tag in tags" 
              :key="tag.id" 
              :label="tag.name" 
              :value="tag.id" 
            />
          </el-select>
        </el-form-item>
        
        <!-- 文章封面 -->
        <el-form-item label="封面图">
          <el-upload
            class="cover-upload"
            :action="'#'"
            :auto-upload="false"
            :file-list="coverFileList"
            :limit="1"
            :on-exceed="handleCoverExceed"
            :on-change="handleCoverChange"
            :on-preview="handleCoverPreview"
          >
            <template #trigger>
              <el-button type="primary">
                <el-icon><UploadIcon /></el-icon>
                选择封面
              </el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                请上传图片文件，建议尺寸为 1200x600
              </div>
            </template>
            <template #file="{ file }">
              <div class="file-item">
                <img
                  :src="file.url || file.preview"
                  class="file-preview"
                  @click="handleCoverPreview(file)"
                >
                <span class="file-name">{{ file.name }}</span>
                <el-button
                  type="link"
                  size="small"
                  class="file-delete"
                  @click.stop="removeCover"
                >
                  <el-icon><DeleteIcon /></el-icon>
                </el-button>
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <!-- AI 生成摘要 -->
        <el-form-item label="摘要">
          <div class="ai-excerpt">
            <el-button 
              type="info" 
              :loading="generatingExcerpt" 
              @click="generateExcerpt"
              :disabled="!form.content"
            >
              <el-icon><MagicStick /></el-icon>
              AI 生成摘要
            </el-button>
            <div v-if="form.excerpt" class="excerpt-preview">
              <p>{{ form.excerpt }}</p>
            </div>
          </div>
        </el-form-item>
        
        <!-- 文章状态 -->
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="draft">草稿</el-radio>
            <el-radio label="published">已发布</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <!-- 文章内容 -->
        <el-form-item label="内容" prop="content">
          <MdEditor
            v-model="form.content"
            :toolbars="toolbars"
            :preview="true"
            :upload-image-config="{
              url: 'https://jsonplaceholder.typicode.com/posts/',
              headers: {
                Authorization: `Bearer ${typeof localStorage !== 'undefined' ? localStorage.getItem('token') : ''}`
              },
              fieldName: 'file'
            }"
            @upload-image-success="handleImageUploadSuccess"
            @upload-image-error="handleImageUploadError"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            {{ isEdit ? '更新' : '发布' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 文章预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="文章预览"
      width="70%"
      :before-close="handlePreviewClose"
      top="5vh"
    >
      <div v-if="previewPost" class="post-preview grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 主内容区 -->
        <div class="lg:col-span-2">
          <!-- 文章标题 -->
          <h1 class="text-3xl font-bold mb-4">{{ previewPost.title }}</h1>

          <!-- 文章信息 -->
          <div class="flex flex-wrap items-center mb-6 text-sm text-gray-500">
            <div class="flex items-center mr-6 mb-2">
              <img v-if="previewPost.author?.avatar" :src="previewPost.author.avatar" :alt="previewPost.author.username" class="w-6 h-6 rounded-full mr-2">
              <span>{{ previewPost.author?.username || '未知作者' }}</span>
            </div>
            <div class="mr-6 mb-2">
              <span>{{ formatDate(previewPost.createdAt) }}</span>
            </div>
            <div class="mr-6 mb-2">
              <span>{{ previewPost.viewCount || 0 }} 阅读</span>
            </div>
            <div class="mb-2">
              <span>{{ previewPost.category?.name || '未分类' }}</span>
            </div>
          </div>

          <!-- 文章标签 -->
          <div class="flex flex-wrap mb-6">
            <span v-for="tag in previewPost.tags || []" :key="tag.id" class="tag">{{ tag.name }}</span>
          </div>

          <!-- 文章封面 -->
          <div class="mb-6">
            <img :src="getCoverImage(previewPost.coverImage)" :alt="previewPost.title" class="w-full h-64 object-cover rounded-lg shadow-md">
          </div>

          <!-- 文章内容 -->
          <div class="post-content" v-html="renderedPreviewContent" ref="contentRef"></div>
        </div>

        <!-- 侧边栏 -->
        <div class="lg:col-span-1">
          <!-- 作者信息 -->
          <div class="author-card" :style="{ background: authorCardColor }">
            <h3 class="author-title">作者信息</h3>
            <div class="flex items-center mb-3">
              <img v-if="previewPost.author?.avatar" :src="previewPost.author.avatar" :alt="previewPost.author.username" class="w-12 h-12 rounded-full mr-3">
              <div v-else class="w-12 h-12 rounded-full mr-3 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {{ (previewPost.author?.username || '未')[0].toUpperCase() }}
              </div>
              <div>
                <div class="font-medium">{{ previewPost.author?.username || '未知作者' }}</div>
                <div class="text-sm text-gray-500">作者</div>
              </div>
            </div>
            <p class="text-gray-600 text-sm">
              专注于技术分享，希望通过文章帮助更多人学习和成长。
            </p>
          </div>

          <!-- 目录 -->
          <div class="toc-card" v-if="tocItems.length > 0" :style="{ background: tocCardColor }">
            <h3 class="toc-title">文章目录</h3>
            <ul class="toc-list">
              <li
                v-for="(item, index) in tocItems"
                :key="index"
                :class="['toc-item', `toc-level-${item.level}`]"
              >
                <a
                  :href="`#${item.id}`"
                  class="toc-link"
                  @click.prevent="scrollToHeading(item.id)"
                >
                  {{ item.text }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 搜索和筛选 -->
    <div class="search-filter">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="搜索">
          <el-input v-model="searchForm.keyword" placeholder="请输入标题或内容" clearable style="width: 135px"/>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.categoryId" placeholder="请选择" clearable style="width: 90px">
            <el-option 
              v-for="category in categories" 
              :key="category.id" 
              :label="category.name" 
              :value="category.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 90px">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><SearchIcon /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 批量操作栏（勾选文章后出现） -->
    <div v-if="selectedPosts.length > 0" class="batch-actions">
      <span class="batch-count">已选 {{ selectedPosts.length }} 篇</span>
      <el-button type="warning" size="small" :loading="batchLoading" @click="handleBatchUnpublish">
        <el-icon><HideIcon /></el-icon>
        批量下架
      </el-button>
      <el-button type="danger" size="small" :loading="batchLoading" @click="handleBatchDelete">
        <el-icon><DeleteIcon /></el-icon>
        批量删除
      </el-button>
    </div>

    <!-- 文章列表 -->
    <el-table ref="tableRef" :data="posts" style="width: 100%" border @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" min-width="300">
        <template #default="{ row }">
          <div class="post-title">
            <a @click="handlePreviewPost(row)" class="title-link cursor-pointer">{{ row.title }}</a>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="category.name" label="分类" width="120" />
      <el-table-column prop="viewCount" label="浏览量" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'">
            {{ row.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleEditPost(row.id)">
            <el-icon><EditIcon /></el-icon>
            编辑
          </el-button>
          <el-button 
            :type="row.status === 'published' ? 'warning' : 'success'" 
            size="small" 
            @click="handleToggleStatus(row)"
          >
            <el-icon><component :is="row.status === 'published' ? HideIcon : ViewIcon" /></el-icon>
            {{ row.status === 'published' ? '下架' : '发布' }}
          </el-button>
          <el-button type="danger" size="small" @click="handleDeletePost(row.id)">
            <el-icon><DeleteIcon /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 图片预览组件 -->
    <el-image-viewer
      v-if="imageViewerVisible"
      :url-list="[imageViewerUrl]"
      @close="imageViewerVisible = false"
      :z-index="9999"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElImageViewer } from 'element-plus'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import MarkdownIt from 'markdown-it'
import { Plus as PlusIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, Hide as HideIcon, View as ViewIcon, Upload as UploadIcon, MagicStick } from '@element-plus/icons-vue'
import { postApi } from '../../api/post'
import request from '../../utils/request'
import { useUserStore } from '../../stores/userStore'
import type { Post, Category, Tag, CreatePostParams, UpdatePostParams } from '../../types'

// 目录项
interface TocItem {
  id: string
  text: string
  level: number
}
const tocItems = ref<TocItem[]>([])

// 响应式数据
const posts = ref<Post[]>([])
const router = useRouter()

// 搜索表单
const searchForm = reactive({
  keyword: '',
  categoryId: '',
  status: ''
})

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 分类数据
const categories = ref<Category[]>([])

// 响应式数据
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const loading = ref(false)
const coverFileList = ref<any[]>([])
const currentPostId = ref<number | null>(null)
const generatingExcerpt = ref(false)

// 上传头部信息
const uploadHeaders = computed(() => {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
    return {
      Authorization: token ? `Bearer ${token}` : ''
    }
  } catch (error) {
    return {}
  }
})

// 默认封面图片
const DEFAULT_COVER_IMAGE = 'https://picsum.photos/1200/600?random=1'

// 预览弹窗相关数据
const previewVisible = ref(false)
const previewPost = ref<Post | null>(null)
const contentRef = ref<HTMLElement | null>(null)

// 图片预览相关
const imageViewerVisible = ref(false)
const imageViewerUrl = ref('')

// 获取封面图片
const getCoverImage = (coverImage?: string): string => {
  return coverImage || DEFAULT_COVER_IMAGE
}

// 处理封面预览
const handleCoverPreview = (file: any) => {
  // 使用文件的URL或预览URL
  imageViewerUrl.value = file.url || file.preview || form.coverImage
  imageViewerVisible.value = true
}

// 马卡龙色系
const macaroonColors = [
  'linear-gradient(135deg, #FFD1DC 0%, #FFB6C1 100%)', // 浅粉色
  'linear-gradient(135deg, #B5EAD7 0%, #95E1D3 100%)', // 薄荷绿
  'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)', // 浅蓝色
  'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)', // 浅橙色
  'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)', // 浅紫色
  'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)', // 浅绿色
  'linear-gradient(135deg, #FFFDE7 0%, #FFF9C4 100%)', // 浅黄色
  'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)'  // 天蓝色
]

// 随机获取马卡龙色
const getRandomMacaroonColor = () => {
  return macaroonColors[Math.floor(Math.random() * macaroonColors.length)]
}

// 当前使用的颜色
const authorCardColor = ref(getRandomMacaroonColor())
const tocCardColor = ref(getRandomMacaroonColor())

// 重置颜色
const resetColors = () => {
  authorCardColor.value = getRandomMacaroonColor()
  tocCardColor.value = getRandomMacaroonColor()
}

// 用户存储
const userStore = useUserStore()

// Markdown实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// 生成唯一ID
const generateId = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
    .replace(/^|-$/g, '')
}

// 提取目录
const extractToc = (content: string): void => {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const items: TocItem[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = generateId(text)

    items.push({ id, text, level })
  }

  tocItems.value = items

  // 延迟添加ID到标题元素
  nextTick(() => {
    if (contentRef.value) {
      const headings = contentRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6')
      headings.forEach((heading) => {
        const text = heading.textContent || ''
        const id = generateId(text)
        heading.id = id
      })
    }
  })
}

// 渲染预览内容
const renderedPreviewContent = computed(() => {
  if (!previewPost.value) return ''
  const content = previewPost.value.content || ''
  // 提取目录
  extractToc(content)
  // 渲染内容
  return md.render(String(content))
})

// 平滑滚动到标题
const scrollToHeading = (id: string): void => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 标签数据
const tags = ref<Tag[]>([])

// 表单数据
const form = reactive({
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  coverImage: '',
  categoryId: '',
  status: 'draft',
  tags: [] as number[]
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 1, max: 200, message: '标题长度在 1 到 200 个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择文章分类', trigger: 'change' }
  ]
}

// AI 生成摘要（调用后端接口）
const generateExcerpt = async () => {
  if (!form.content) {
    ElMessage.warning('请先输入文章内容')
    return
  }
  
  generatingExcerpt.value = true
  try {
    const response = await fetch('/api/ai/excerpt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: form.content
      })
    })
    
    const result = await response.json()
    if (result.code === 200 && result.data) {
      form.excerpt = result.data
      ElMessage.success('摘要生成成功')
    } else {
      ElMessage.error(result.message || '摘要生成失败')
    }
  } catch (error) {
    console.error('生成摘要失败:', error)
    ElMessage.error('生成摘要失败，请稍后重试')
  } finally {
    generatingExcerpt.value = false
  }
}

// Markdown编辑器工具栏配置
const toolbars = computed(() => [
  'bold',
  'italic',
  'strikeThrough',
  'underline',
  'title',
  'sub',
  'sup',
  'quote',
  'unorderedList',
  'orderedList',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'revoke',
  'next',
  'fullscreen',
  'preview',
  'htmlPreview',
  'catalog'
]);

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 创建文章
const handleCreatePost = () => {
  // 重置表单
  resetForm()
  isEdit.value = false
  currentPostId.value = null
  dialogVisible.value = true
}

// 编辑文章
const handleEditPost = async (id: number) => {
  try {
    // 重置表单
    resetForm()
    isEdit.value = true
    currentPostId.value = id
    
    // 查找对应文章
    const post = posts.value.find(p => p.id === id)
    if (!post) {
      ElMessage.error('文章不存在')
      return
    }
    
    // 检查slug是否为空
    if (!post.slug) {
      // 如果slug为空，直接使用本地数据
      form.title = post.title
      form.slug = post.slug
      form.content = post.content
      form.excerpt = post.excerpt || ''
      form.coverImage = post.coverImage || ''
      form.categoryId = post.categoryId
      form.status = post.status
      form.tags = post.tags?.map((tag: Tag) => tag.id) || []
      
      if (form.coverImage) {
        coverFileList.value = [{ url: form.coverImage }]
      }
      
      dialogVisible.value = true
      return
    }
    
    // 获取文章详情
    const response = await postApi.getPostBySlug(post.slug)
    const postData = response.data
    
    form.title = postData.title
    form.slug = postData.slug
    form.content = postData.content
    form.excerpt = postData.excerpt || ''
    form.coverImage = postData.coverImage || ''
    form.categoryId = postData.categoryId
    form.status = postData.status
    form.tags = postData.tags?.map((tag: Tag) => tag.id) || []
    
    if (form.coverImage) {
      coverFileList.value = [{ url: form.coverImage }]
    }
    
    dialogVisible.value = true
  } catch (error) {
    console.error('获取文章详情失败:', error)
    ElMessage.error('获取文章详情失败')
  }
}

// 重置表单
const resetForm = () => {
  form.title = ''
  form.slug = ''
  form.content = ''
  form.excerpt = ''
  form.coverImage = ''
  form.categoryId = ''
  form.status = 'draft'
  form.tags = []
  coverFileList.value = []
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 处理弹窗关闭
const handleDialogClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 处理封面图超出限制
const handleCoverExceed = () => {
  ElMessage.warning('只能上传一张封面图')
}

// 处理封面文件变化 - 转换为Base64存储
const handleCoverChange = (file: any, fileList: any[]) => {
  if (file.status === 'ready') {
    // 当选择文件时，转换为Base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64Result = e.target?.result as string
      // 将完整的Base64数据存入form
      form.coverImage = base64Result
      // 更新文件列表，使用Base64预览
      coverFileList.value = [{
        ...file,
        status: 'success',
        url: base64Result,
        preview: base64Result
      }]
      ElMessage.success('封面选择成功')
    }
    reader.readAsDataURL(file.raw)
  }
}

// 封面上传前验证
const beforeCoverUpload = (file: any) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJpgOrPng) {
    ElMessage.error('只能上传 JPG/PNG 图片!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 删除封面
const removeCover = () => {
  form.coverImage = ''
  coverFileList.value = []
}

// 处理图片上传成功
const handleImageUploadSuccess = (res: any) => {
  // 模拟上传成功，实际项目中应该根据后端返回的URL设置
  return 'https://picsum.photos/800/600'
}

// 处理图片上传失败
const handleImageUploadError = () => {
  ElMessage.error('图片上传失败')
}

// 处理预览文章
const handlePreviewPost = async (row: Post) => {
  try {
    // 重置颜色
    resetColors()
    
    // 检查slug是否为空
    if (!row.slug) {
      // 如果slug为空，直接使用传入的row数据作为预览数据
      previewPost.value = row
      previewVisible.value = true
      return
    }
    
    // 获取文章详情
    const response = await postApi.getPostBySlug(row.slug)
    previewPost.value = response.data
    previewVisible.value = true
  } catch (error) {
    console.error('获取文章详情失败:', error)
    ElMessage.error('获取文章详情失败')
  }
}

// 处理预览弹窗关闭
const handlePreviewClose = () => {
  previewVisible.value = false
  previewPost.value = null
  tocItems.value = []
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        if (isEdit.value && currentPostId.value) {
          // 更新文章
          const updateData = {
            id: currentPostId.value,
            title: form.title,
            slug: form.slug,
            content: form.content,
            excerpt: form.excerpt,
            coverImage: form.coverImage,
            categoryId: Number(form.categoryId),
            status: form.status,
            tags: form.tags
          }
          await postApi.updatePost(updateData)
          ElMessage.success('文章更新成功')
        } else {
          // 创建文章
          const createData = {
            title: form.title,
            slug: form.slug,
            content: form.content,
            excerpt: form.excerpt,
            coverImage: form.coverImage,
            categoryId: Number(form.categoryId),
            status: form.status,
            tags: form.tags,
            authorId: userStore.currentUser?.id
          }
          await postApi.createPost(createData as CreatePostParams)
          ElMessage.success('文章创建成功')
        }

        dialogVisible.value = false
        resetForm()
        fetchPosts()
      } catch (error) {
        console.error('保存文章失败:', error)
        ElMessage.error('保存文章失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1
  fetchPosts()
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.categoryId = ''
  searchForm.status = ''
  pagination.currentPage = 1
  fetchPosts()
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchPosts()
}

// 处理页码变化
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  fetchPosts()
}

// ===== 批量操作 =====
const tableRef = ref()
const selectedPosts = ref<Post[]>([])
const batchLoading = ref(false)

const handleSelectionChange = (rows: Post[]) => {
  selectedPosts.value = rows
}

// 批量下架：只传 status，后端对缺省字段有 existing 兜底，不会清空正文
const handleBatchUnpublish = async () => {
  const targets = selectedPosts.value.filter(p => p.status === 'published')
  if (targets.length === 0) {
    ElMessage.warning('所选文章中没有已发布的')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要下架选中的 ${targets.length} 篇文章吗？`, '批量下架', {
      confirmButtonText: '确定下架',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  batchLoading.value = true
  const results = await Promise.allSettled(
    targets.map(p => request.put(`/posts/${p.id}`, { status: 'draft' }))
  )
  batchLoading.value = false
  const ok = results.filter(r => r.status === 'fulfilled').length
  const fail = targets.length - ok
  if (fail === 0) {
    ElMessage.success(`已下架 ${ok} 篇文章`)
  } else {
    ElMessage.warning(`下架完成：成功 ${ok} 篇，失败 ${fail} 篇`)
  }
  fetchPosts()
}

// 批量删除
const handleBatchDelete = async () => {
  const targets = [...selectedPosts.value]
  if (targets.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${targets.length} 篇文章吗？删除后不可恢复！`,
      '批量删除',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'error' }
    )
  } catch {
    return
  }
  batchLoading.value = true
  const results = await Promise.allSettled(
    targets.map(p => request.delete(`/posts/${p.id}`))
  )
  batchLoading.value = false
  const ok = results.filter(r => r.status === 'fulfilled').length
  const fail = targets.length - ok
  if (fail === 0) {
    ElMessage.success(`已删除 ${ok} 篇文章`)
  } else {
    ElMessage.warning(`删除完成：成功 ${ok} 篇，失败 ${fail} 篇`)
  }
  fetchPosts()
}

// 处理上下架
const handleToggleStatus = async (row: Post) => {
  try {
    const newStatus = row.status === 'published' ? 'draft' : 'published'
    await postApi.updatePost({
      id: row.id,
      title: row.title,
      slug: row.slug,
      content: row.content,
      excerpt: row.excerpt,
      coverImage: row.coverImage,
      categoryId: row.categoryId,
      status: newStatus,
      tags: row.tags?.map((tag: Tag) => tag.id) || []
    })
    
    ElMessage.success(newStatus === 'published' ? '文章已发布' : '文章已下架')
    fetchPosts()
  } catch (error) {
    console.error('更新文章状态失败:', error)
    ElMessage.error('更新文章状态失败')
  }
}

// 处理删除
const handleDeletePost = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await postApi.deletePost(id)
    ElMessage.success('文章删除成功')
    fetchPosts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文章失败:', error)
      ElMessage.error('删除文章失败')
    }
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await postApi.getCategories()
    categories.value = response.data
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 获取标签列表
const fetchTags = async () => {
  try {
    const response = await postApi.getTags()
    tags.value = response.data
  } catch (error) {
    console.error('获取标签列表失败:', error)
  }
}

// 获取文章列表
const fetchPosts = async () => {
  try {
    // 调用API获取文章列表
    const response = await postApi.getPosts({
      page: pagination.currentPage,
      limit: pagination.pageSize,
      categoryId: searchForm.categoryId,
      status: searchForm.status,
      keyword: searchForm.keyword
    })
    posts.value = response.data.posts
    pagination.total = response.data.total
  } catch (error) {
    console.error('获取文章列表失败:', error)
    ElMessage.error('获取文章列表失败')
  }
}

// 页面挂载时获取数据
onMounted(() => {
  fetchCategories()
  fetchTags()
  fetchPosts()
})
</script>

<style scoped>
.post-list {
  padding: 1rem 0;
}

.list-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 1.5rem;
}

/* 批量操作栏 */
.batch-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  margin-bottom: 1rem;
  background-color: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-left: 4px solid #f59e0b;
  border-radius: 0.5rem;
}

.batch-count {
  margin-right: auto;
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
}

/* 搜索和筛选样式 */
.search-filter {
  background-color: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-color, 0 1px 3px rgba(0, 0, 0, 0.1));
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

/* 封面上传样式 */
.cover-upload {
  margin-bottom: 1rem;
}

/* 文件项样式 */
.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  margin-top: 0.5rem;
}

.file-preview {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-preview:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.file-name {
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-delete {
  color: #ef4444;
  transition: color 0.2s ease;
}

.file-delete:hover {
  color: #dc2626;
}

/* 封面预览样式 */
.cover-preview {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cover-image {
  width: 200px;
  height: 100px;
  object-fit: cover;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* AI 摘要样式 */
.ai-excerpt {
  margin-top: 0.5rem;
}

.excerpt-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 0.5rem;
  border-left: 4px solid #3b82f6;
}

.excerpt-preview p {
  margin: 0;
  line-height: 1.5;
  color: #374151;
}

/* 分页样式 */
.pagination {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

/* 文章标题链接样式 */
.post-title {
  display: flex;
  align-items: center;
}

.title-link {
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s ease;
}

.title-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

/* 标签样式 */
.tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #f3f4f6;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: #4b5563;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

/* 编辑器样式 */
:deep(.md-editor) {
  min-height: 400px;
}

/* 预览弹窗样式 */
.post-preview {
  padding: 1rem;
  max-height: 75vh;
  overflow-y: auto;
}

.post-preview h1 {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.post-preview .post-content {
  line-height: 1.75;
  color: #374151;
}

.post-preview .post-content h1,
.post-preview .post-content h2,
.post-preview .post-content h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.post-preview .post-content h1 {
  font-size: 1.5rem;
}

.post-preview .post-content h2 {
  font-size: 1.25rem;
}

.post-preview .post-content h3 {
  font-size: 1.125rem;
}

.post-preview .post-content p {
  margin-bottom: 1rem;
}

.post-preview .post-content img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.post-preview .post-content pre {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.post-preview .post-content code {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.post-preview .post-content blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #6b7280;
}

.post-preview .post-content a {
  color: #3b82f6;
  text-decoration: none;
}

.post-preview .post-content a:hover {
  text-decoration: underline;
}

/* 作者信息卡片样式 */
.author-card {
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  color: #374151;
}

.author-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary, #374151);
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
  padding-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.author-card .font-medium {
  color: var(--text-primary, #1f2937);
  font-weight: 600;
  transition: color 0.3s ease;
}

.author-card .text-gray-500 {
  color: var(--text-secondary, #6b7280) !important;
  transition: color 0.3s ease;
}

.author-card .text-gray-600 {
  color: var(--text-secondary, #4b5563) !important;
  transition: color 0.3s ease;
}

/* 目录卡片样式 */
.toc-card {
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 1rem;
  color: #374151;
}

.toc-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #374151;
  border-bottom: 2px solid #3b82f6;
  padding-bottom: 0.5rem;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin-bottom: 0.375rem;
}

.toc-link {
  display: block;
  padding: 0.375rem 0.5rem;
  color: #4b5563;
  text-decoration: none;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  border-left: 3px solid transparent;
}

.toc-link:hover {
  color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
  border-left-color: #3b82f6;
  padding-left: 0.75rem;
}

.toc-level-1 {
  padding-left: 0;
}

.toc-level-2 {
  padding-left: 1rem;
}

.toc-level-3 {
  padding-left: 2rem;
}

.toc-level-4 {
  padding-left: 3rem;
}

.toc-level-5 {
  padding-left: 4rem;
}

.toc-level-6 {
  padding-left: 5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .pagination {
    justify-content: center;
  }
  
  .cover-image {
    width: 150px;
    height: 75px;
  }
}
</style>
