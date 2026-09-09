<template>
  <div class="profile-container">
    <!-- 页面标题 -->
    <div class="profile-header">
      <h1 class="profile-title">{{ isOwnProfile ? '个人中心' : '博主主页' }}</h1>
    </div>

    <div class="profile-content">
      <!-- 左侧：个人信息展示 -->
      <div class="profile-left">
        <div class="profile-card">
          <!-- 头像区域 - 简洁风格 -->
          <div class="avatar-section">
            <div class="avatar-header">
              <div class="avatar-wrapper" @click="triggerAvatarUpload">
                <img :src="userAvatar" alt="用户头像" class="profile-avatar">
                <div class="avatar-overlay">
                  <el-icon :size="24" color="white"><Camera /></el-icon>
                </div>
              </div>
              <!-- 编辑按钮 - 铅笔图标（仅自己可见） -->
              <button v-if="isOwnProfile" class="edit-icon-btn" @click="showEditModal = true" title="编辑资料">
                <el-icon :size="18"><Edit /></el-icon>
              </button>
            </div>
            <h2 class="username">{{ editForm.username }}</h2>
            <p class="bio">{{ editForm.bio || '这个人很懒，什么都没写~' }}</p>
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              @change="handleAvatarChange"
              style="display: none"
            >
          </div>

          <!-- 联系方式 - 图标形式 -->
          <div class="contact-section">
            <a v-if="editForm.githubUrl" :href="editForm.githubUrl" target="_blank" class="contact-item">
              <div class="contact-icon-wrapper github">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
            </a>
            <a v-if="editForm.qqNumber" :href="`tencent://message/?uin=${editForm.qqNumber}`" class="contact-item">
              <div class="contact-icon-wrapper qq">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .686 4.078.43 6.29.43 2.21 0 6.287.257 6.287-.43 0-.687-1.768-1.182-1.768-1.182 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.746 2.072.111 0 .283-.36.283-1.025 0-2.514-2.164-6.954-2.164-6.954V9.325C18.29 3.364 14.268 2 12.003 2z"/>
                </svg>
              </div>
            </a>
            <a v-if="isOwnProfile && editForm.email" :href="`mailto:${editForm.email}`" class="contact-item">
              <div class="contact-icon-wrapper email">
                <el-icon :size="20"><Message /></el-icon>
              </div>
            </a>
          </div>

          <!-- 技术栈 - 椭圆标签样式 -->
          <div class="tags-section">
            <div class="section-header-row">
              <h3 class="section-subtitle">技术栈</h3>
              <button v-if="isOwnProfile" class="add-tag-btn" @click="showTechInput = !showTechInput">
                <el-icon><Plus /></el-icon>
              </button>
            </div>
            <div v-if="isOwnProfile && showTechInput" class="tag-input-wrapper">
              <input
                v-model="newTech"
                type="text"
                class="tag-input"
                placeholder="输入技术名称"
                @keyup.enter="addTech"
                @blur="showTechInput = false"
              >
            </div>
            <div class="tags-cloud">
              <span
                v-for="(tech, index) in editForm.techStack"
                :key="index"
                class="tag-item tech"
                :style="getTagStyle(index, 'tech')"
              >
                {{ tech }}
                <span v-if="isOwnProfile" class="remove-btn" @click.stop="removeTech(index)">
                  <el-icon :size="10"><Close /></el-icon>
                </span>
              </span>
            </div>
          </div>

          <!-- 去过的省市 - 椭圆标签样式 -->
          <div class="tags-section">
            <div class="section-header-row">
              <h3 class="section-subtitle">足迹</h3>
              <button v-if="isOwnProfile" class="add-tag-btn" @click="showPlaceInput = !showPlaceInput">
                <el-icon><Plus /></el-icon>
              </button>
            </div>
            <div v-if="isOwnProfile && showPlaceInput" class="tag-input-wrapper">
              <input
                v-model="newPlace"
                type="text"
                class="tag-input"
                placeholder="输入省市名称"
                @keyup.enter="addPlace"
                @blur="showPlaceInput = false"
              >
            </div>
            <div class="tags-cloud">
              <span
                v-for="(place, index) in editForm.visitedProvinces"
                :key="index"
                class="tag-item place"
                :style="getTagStyle(index, 'place')"
              >
                {{ place }}
                <span v-if="isOwnProfile" class="remove-btn" @click.stop="removePlace(index)">
                  <el-icon :size="10"><Close /></el-icon>
                </span>
              </span>
            </div>
          </div>

          <!-- 词云图 -->
          <div class="wordcloud-section">
            <h3 class="section-subtitle">个人词云</h3>
            <div class="wordcloud-container">
              <div
                v-for="(word, index) in wordCloudData"
                :key="index"
                class="wordcloud-item"
                :style="{
                  fontSize: word.size + 'px',
                  color: word.color,
                  left: word.x + '%',
                  top: word.y + '%',
                  transform: 'translate(-50%, -50%) rotate(' + word.rotate + 'deg)',
                  animationDelay: word.delay + 's'
                }"
              >
                {{ word.text }}
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- 右侧：内容展示 -->
      <div class="profile-right">
        <!-- 自己查看：显示我的发布 -->
        <template v-if="isOwnProfile">
          <!-- 发布的帖子 - 时间线式 -->
          <div class="posts-section">
            <div class="section-header">
              <h3 class="section-title">📝 我的发布</h3>
              <div class="header-actions">
                <div class="filter-container">
                  <select v-model="postFilter.category" class="filter-select">
                    <option value="">全部分类</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                      {{ category.name }}
                    </option>
                  </select>
                </div>
                <!-- 一键折叠/展开按钮 -->
                <button class="toggle-all-btn" @click="toggleAllPosts" :title="allPostsExpanded ? '一键折叠' : '一键展开'">
                  <el-icon :size="18">
                    <Fold v-if="allPostsExpanded" />
                    <Expand v-else />
                  </el-icon>
                </button>
              </div>
            </div>

            <div class="timeline-container">
              <div v-if="filteredUserPosts.length === 0" class="empty-state">
                <span class="empty-icon">📭</span>
                <p>还没有发布过帖子</p>
              </div>
              <div v-else class="timeline">
                <div v-for="post in filteredUserPosts" :key="post.id" class="timeline-item" :class="{ 'collapsed': collapsedPosts.has(post.id) }">
                  <!-- 左侧时间轴 -->
                  <div class="timeline-left" @click="togglePost(post.id)">
                    <div class="timeline-dot"></div>
                    <div class="timeline-date">
                      <span class="date-day">{{ getDay(post.createdAt) }}</span>
                      <span class="date-month">{{ getMonth(post.createdAt) }}</span>
                      <span class="date-year">{{ getYear(post.createdAt) }}</span>
                    </div>
                    <div class="timeline-line"></div>
                  </div>
                  <!-- 右侧内容 -->
                  <div class="timeline-content-wrapper">
                    <div class="timeline-content">
                      <router-link :to="`/post/${post.slug}`" class="post-title-link">
                        <h4 class="post-title">{{ post.title }}</h4>
                      </router-link>
                      <p class="post-excerpt">{{ post.content?.substring(0, 100) }}...</p>
                      <div class="post-meta">
                        <span class="post-category">{{ getCategoryName(post.categoryId) }}</span>
                        <router-link :to="`/post/${post.slug}`" class="read-more">阅读全文 →</router-link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 别人查看：显示摘抄语录和休闲小游戏 -->
        <template v-else>
          <!-- 摘抄语录 -->
          <QuotesSection class="profile-section-gap" />

          <!-- 休闲小游戏中心 -->
          <div class="games-preview-card profile-section-gap">
            <h3 class="section-subtitle">休闲小游戏中心</h3>
            <p class="games-preview-text">
              更完整的小游戏已经迁移到独立的 <code>/games</code> 页面，那里包含全部游戏入口和更丰富的玩法。
            </p>
            <router-link to="/games" class="games-preview-btn">
              前往小游戏中心
            </router-link>
          </div>
        </template>

      </div>
    </div>

    <!-- 编辑资料弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click="showEditModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑资料</h3>
          <button class="close-btn" @click="showEditModal = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>个人简介</label>
            <textarea v-model="editForm.bio" rows="3" placeholder="介绍一下自己..."></textarea>
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="editForm.email" type="email" placeholder="your@email.com">
          </div>
          <div class="form-group">
            <label>GitHub</label>
            <input v-model="editForm.githubUrl" type="text" placeholder="https://github.com/username">
          </div>
          <div class="form-group">
            <label>QQ</label>
            <input v-model="editForm.qqNumber" type="text" placeholder="QQ号码">
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showEditModal = false">取消</button>
          <button class="save-btn" @click="saveProfile" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useUserStore } from '../stores/userStore'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Camera, Plus, Close, Edit, Message, Fold, Expand } from '@element-plus/icons-vue'
import request from '../utils/request'
import { getUserById } from '../api/user'
import QuotesSection from '../components/QuotesSection.vue'

// 用户存储
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

// 判断是否是查看自己的资料
const isOwnProfile = computed(() => {
  // 如果没有userId参数，或者是自己的id，就是查看自己的资料
  const userId = route.params.userId
  return !userId || (userStore.user && userStore.user.id === parseInt(userId as string))
})

// 输入框引用
const avatarInput = ref<HTMLInputElement | null>(null)

// 保存状态
const saving = ref(false)

// 弹窗显示状态
const showEditModal = ref(false)
const showTechInput = ref(false)
const showPlaceInput = ref(false)
const showEmailEdit = ref(false)

// 帖子折叠状态
const collapsedPosts = ref<Set<number>>(new Set())
const allPostsExpanded = ref(true)

// 编辑表单
const editForm = reactive({
  username: '',
  email: '',
  bio: '',
  githubUrl: '',
  qqNumber: '',
  techStack: [] as string[],
  visitedProvinces: [] as string[]
})

// 新添加项
const newTech = ref('')
const newPlace = ref('')

// 分类数据
const categories = ref([
  { id: 1, name: '技术' },
  { id: 2, name: '生活' },
  { id: 3, name: '学习' }
])

// 用户帖子数据
const userPosts = ref<any[]>([])

// 过滤器
const postFilter = ref({
  category: '',
  sort: 'latest'
})

// 默认头像数组
const defaultAvatars = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=1',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=2',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=3',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=4',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=5',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=6',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=7',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=8',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=9'
]

// 默认封面图片
const DEFAULT_COVER_IMAGE = 'https://picsum.photos/1200/600?random=1'

// 词云图数据
const wordCloudData = computed(() => {
  const words = [
    ...editForm.techStack.map(t => ({ text: t, type: 'tech' })),
    ...editForm.visitedProvinces.map(p => ({ text: p, type: 'place' })),
    { text: '代码', type: 'other' },
    { text: '学习', type: 'other' },
    { text: '分享', type: 'other' },
    { text: '探索', type: 'other' }
  ]
  
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#fa709a']
  
  return words.map((word, index) => ({
    text: word.text,
    size: Math.floor(Math.random() * 16) + 12,
    color: colors[Math.floor(Math.random() * colors.length)],
    x: Math.floor(Math.random() * 80) + 10,
    y: Math.floor(Math.random() * 80) + 10,
    rotate: Math.floor(Math.random() * 30) - 15,
    delay: index * 0.1
  }))
})

// 获取封面图片
const getCoverImage = (coverImage?: string): string => {
  return coverImage || DEFAULT_COVER_IMAGE
}

// 计算用户头像
const userAvatar = computed(() => {
  if (userStore.user?.avatar) {
    return userStore.user.avatar
  }
  const seed = userStore.user?.id || userStore.user?.username?.length || 0
  const avatarIndex = seed % defaultAvatars.length
  return defaultAvatars[avatarIndex]
})

// 筛选后的用户帖子
const filteredUserPosts = computed(() => {
  let posts = [...userPosts.value]
  
  // 分类筛选
  if (postFilter.value.category) {
    posts = posts.filter(post => post.categoryId === parseInt(postFilter.value.category))
  }
  
  // 排序
  if (postFilter.value.sort === 'latest') {
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else {
    posts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }
  
  return posts
})

// 获取标签样式
const getTagStyle = (index: number, type: 'tech' | 'place') => {
  const colors = type === 'tech' 
    ? ['#667eea', '#764ba2', '#f093fb', '#f5576c']
    : ['#4facfe', '#00f2fe', '#43e97b', '#fa709a']
  const color = colors[index % colors.length]
  return {
    backgroundColor: color + '20',
    color: color,
    borderColor: color + '40'
  }
}

// 添加技术栈
const addTech = () => {
  if (newTech.value.trim()) {
    if (!editForm.techStack.includes(newTech.value.trim())) {
      editForm.techStack.push(newTech.value.trim())
    }
    newTech.value = ''
    showTechInput.value = false
  }
}

// 移除技术栈
const removeTech = (index: number) => {
  editForm.techStack.splice(index, 1)
}

// 添加省市
const addPlace = () => {
  if (newPlace.value.trim()) {
    if (!editForm.visitedProvinces.includes(newPlace.value.trim())) {
      editForm.visitedProvinces.push(newPlace.value.trim())
    }
    newPlace.value = ''
    showPlaceInput.value = false
  }
}

// 移除省市
const removePlace = (index: number) => {
  editForm.visitedProvinces.splice(index, 1)
}

// 触发头像上传
const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

// 处理头像更换
const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const newAvatar = e.target?.result as string
      userStore.setUser({
        ...userStore.user!,
        avatar: newAvatar
      } as any)
      ElMessage.success('头像更换成功')
    }
    reader.readAsDataURL(file)
  }
}

// 保存个人信息
const saveProfile = async () => {
  if (!editForm.email) {
    ElMessage.warning('请输入邮箱')
    return
  }

  saving.value = true
  try {
    // 调用API保存用户信息
    await request.put(`/users/${userStore.user?.id}`, {
      email: editForm.email,
      bio: editForm.bio,
      githubUrl: editForm.githubUrl,
      qqNumber: editForm.qqNumber,
      techStack: JSON.stringify(editForm.techStack),
      visitedProvinces: JSON.stringify(editForm.visitedProvinces)
    })

    userStore.setUser({
      ...userStore.user!,
      email: editForm.email
    } as any)

    ElMessage.success('保存成功')
    showEditModal.value = false
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 获取用户文章
const fetchUserPosts = async () => {
  try {
    const response = await request.get(`/posts?authorId=${userStore.user?.id}`)
    userPosts.value = response.data.posts || []
  } catch (error) {
    console.error('获取用户文章失败:', error)
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await request.get('/categories')
    categories.value = response.data
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 格式化日期
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 获取日期中的日
const getDay = (dateString: string | undefined) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.getDate().toString().padStart(2, '0')
}

// 获取日期中的月
const getMonth = (dateString: string | undefined) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return (date.getMonth() + 1).toString().padStart(2, '0') + '月'
}

// 获取日期中的年
const getYear = (dateString: string | undefined) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.getFullYear().toString()
}

// 切换单个帖子的折叠状态
const togglePost = (postId: number) => {
  if (collapsedPosts.value.has(postId)) {
    collapsedPosts.value.delete(postId)
  } else {
    collapsedPosts.value.add(postId)
  }
}

// 一键折叠/展开所有帖子
const toggleAllPosts = () => {
  if (allPostsExpanded.value) {
    // 全部折叠
    filteredUserPosts.value.forEach(post => {
      collapsedPosts.value.add(post.id)
    })
    allPostsExpanded.value = false
  } else {
    // 全部展开
    collapsedPosts.value.clear()
    allPostsExpanded.value = true
  }
}

// 获取分类名称
const getCategoryName = (categoryId: number) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : '未分类'
}

const applyUserProfile = (user: any) => {
  editForm.username = user?.username || ''
  editForm.email = user?.email || ''
  editForm.bio = user?.bio || ''
  editForm.githubUrl = user?.githubUrl || user?.github_url || 'https://github.com/asfre'
  editForm.qqNumber = user?.qqNumber || user?.qq_number || '414898182'

  try {
    const techStack = user?.techStack ?? user?.tech_stack
    editForm.techStack = techStack ? (Array.isArray(techStack) ? techStack : JSON.parse(techStack)) : ['Vue.js', 'Node.js', 'TypeScript']
  } catch {
    editForm.techStack = ['Vue.js', 'Node.js', 'TypeScript']
  }

  try {
    const visitedProvinces = user?.visitedProvinces ?? user?.visited_provinces
    editForm.visitedProvinces = visitedProvinces ? (Array.isArray(visitedProvinces) ? visitedProvinces : JSON.parse(visitedProvinces)) : ['北京市', '上海市']
  } catch {
    editForm.visitedProvinces = ['北京市', '上海市']
  }
}

const fetchCurrentUserProfile = async () => {
  if (!userStore.user?.id) {
    return
  }

  try {
    const response = await getUserById(userStore.user.id)
    if (response.data) {
      userStore.setUser({
        ...userStore.user,
        ...response.data
      } as any)
      applyUserProfile(response.data)
    }
  } catch (error) {
    console.error('获取用户资料失败:', error)
  }
}

// 跳转到创建文章页面
const goToCreatePost = () => {
  router.push('/admin/posts/create')
}

// 跳转到文章管理页面
const goToManagePosts = () => {
  router.push('/admin/posts')
}

// 滚动到我的发布区域
const scrollToPosts = () => {
  const postsSection = document.querySelector('.posts-section')
  if (postsSection) {
    postsSection.scrollIntoView({ behavior: 'smooth' })
  }
}

// 检查登录状态
onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }

  applyUserProfile(userStore.user)
  void fetchCurrentUserProfile()

  fetchUserPosts()
  fetchCategories()
})
</script>

<style scoped>
/* 页面容器 */
.profile-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

/* 页面标题 */
.profile-header {
  margin-bottom: 30px;
}

.profile-title {
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

/* 内容区域 */
.profile-content {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 30px;
}

/* 左侧 */
.profile-left {
  position: sticky;
  top: 20px;
  height: fit-content;
}

/* 个人信息卡片 */
.profile-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  padding: 30px;
}

/* 头像区域 - 简洁风格 */
.avatar-section {
  text-align: center;
  margin-bottom: 24px;
}

.avatar-header {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.avatar-wrapper:hover {
  transform: scale(1.05);
}

/* 编辑图标按钮 */
.edit-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  
  position: absolute;
  top: 8px;
  right: 8px;
}

.edit-icon-btn:hover {
  background: #f3f4f6;
  color: #374151;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.profile-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.username {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.bio {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

/* 联系方式 */
.contact-section {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.contact-item {
  text-decoration: none;
}

.contact-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  cursor: pointer;
}

.contact-icon-wrapper:hover {
  transform: translateY(-3px);
}

.contact-icon-wrapper svg,
.contact-icon-wrapper .el-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.contact-icon-wrapper.github {
  background: linear-gradient(135deg, #333 0%, #24292e 100%);
}

.contact-icon-wrapper.qq {
  background: linear-gradient(135deg, #12b7f5 0%, #0099ff 100%);
}

.contact-icon-wrapper.email {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 标签区域 */
.tags-section {
  margin-bottom: 24px;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.add-tag-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: #f0f0f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-tag-btn:hover {
  background: #667eea;
  color: white;
}

.tag-input-wrapper {
  margin-bottom: 12px;
}

.tag-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.3s ease;
}

.tag-input:focus {
  border-color: #667eea;
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
  transition: all 0.3s ease;
  cursor: default;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tag-item .remove-btn {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.tag-item .remove-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

/* 词云图 */
.wordcloud-section {
  margin-bottom: 24px;
}

.wordcloud-container {
  position: relative;
  height: 200px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px;
  overflow: hidden;
}

.wordcloud-item {
  position: absolute;
  font-weight: 600;
  white-space: nowrap;
  animation: float 3s ease-in-out infinite;
  cursor: default;
  transition: transform 0.3s ease;
}

.wordcloud-item:hover {
  transform: translate(-50%, -50%) scale(1.2) !important;
  z-index: 10;
}

@keyframes float {
  0%, 100% {
    transform: translate(-50%, -50%) translateY(0);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-5px);
  }
}

/* 右侧内容 */
.profile-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.posts-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.filter-container {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  outline: none;
}

/* 头部操作区域 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 一键折叠/展开按钮 */
.toggle-all-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.toggle-all-btn:hover {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

/* 时间线容器 */
.timeline-container {
  padding: 8px 0;
}

.timeline {
  position: relative;
}

/* 时间线项 */
.timeline-item {
  display: flex;
  position: relative;
  margin-bottom: 0;
}

.timeline-item:last-child .timeline-line {
  display: none;
}

/* 左侧时间轴 */
.timeline-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 70px;
  flex-shrink: 0;
  cursor: pointer;
  padding: 16px 0;
  position: relative;
  transition: all 0.3s ease;
}

.timeline-left:hover {
  background: rgba(102, 126, 234, 0.05);
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #667eea;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #667eea;
  z-index: 2;
  transition: all 0.3s ease;
}

.timeline-left:hover .timeline-dot {
  transform: scale(1.2);
  background: #764ba2;
  box-shadow: 0 0 0 3px #764ba2;
}

.timeline-line {
  position: absolute;
  top: 28px;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #e5e7eb, #e5e7eb);
  z-index: 1;
}

.timeline-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 8px;
  text-align: center;
}

.date-day {
  font-size: 24px;
  font-weight: 700;
  color: #374151;
  line-height: 1;
}

.date-month {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.date-year {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

/* 右侧内容区域 */
.timeline-content-wrapper {
  flex: 1;
  padding: 16px 0 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  overflow: hidden;
  transition: all 0.3s ease;
}

.timeline-content {
  transition: all 0.3s ease;
}

/* 折叠状态 */
.timeline-item.collapsed .timeline-content {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.timeline-item.collapsed .timeline-content-wrapper {
  padding: 8px 0 8px 20px;
}

.timeline-item.collapsed .timeline-dot {
  background: #d1d5db;
  box-shadow: 0 0 0 2px #d1d5db;
}

/* 文章标题链接 */
.post-title-link {
  text-decoration: none;
  color: inherit;
}

.post-title-link:hover .post-title {
  color: #667eea;
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.post-excerpt {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.post-category {
  font-size: 12px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
}

.read-more {
  font-size: 13px;
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.read-more:hover {
  color: #764ba2;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #e0e0e0;
}

.modal-body {
  padding: 24px;
}

.modal-body .form-group {
  margin-bottom: 16px;
}

.modal-body .form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.modal-body .form-group input,
.modal-body .form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s ease;
}

.modal-body .form-group input:focus,
.modal-body .form-group textarea:focus {
  border-color: #667eea;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px;
}

.modal-footer button {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f5f5f5;
  border: none;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.modal-footer .save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.modal-footer .save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.modal-footer .save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 模块间距 */
.profile-section-gap {
  margin-bottom: 24px;
}

.games-preview-card {
  padding: 24px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%);
  border: 1px solid rgba(102, 126, 234, 0.18);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.08);
}

.games-preview-text {
  margin: 12px 0 18px;
  color: #4b5563;
  line-height: 1.7;
  font-size: 14px;
}

.games-preview-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.24);
}

.games-preview-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.3);
}

/* 响应式 */
@media (max-width: 1024px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
  
  .profile-left {
    position: static;
  }
}

@media (max-width: 768px) {
  .profile-container {
    padding: 20px 16px;
  }

  .profile-card {
    padding: 20px;
  }

  /* 时间线响应式 */
  .timeline-left {
    width: 60px;
    padding: 12px 0;
  }

  .date-day {
    font-size: 20px;
  }

  .timeline-content-wrapper {
    padding: 12px 0 12px 16px;
  }

  .post-title {
    font-size: 15px;
  }

  .post-excerpt {
    font-size: 13px;
    -webkit-line-clamp: 1;
  }
}
</style>
