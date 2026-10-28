<template>
  <div class="category-list">
    <!-- 筛选区：上半筛选条件，下半左"添加分类"、右"搜索/重置" -->
    <div class="filter-card">
      <div class="filter-conditions">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索分类名称 / Slug"
          clearable
          style="width: 260px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
      </div>
      <div class="filter-actions">
        <div class="filter-actions-left">
          <el-button type="primary" @click="handleAddCategory">
            <el-icon><PlusIcon /></el-icon>
            添加分类
          </el-button>
        </div>
        <div class="filter-actions-right">
          <el-button type="primary" @click="handleSearch">
            <el-icon><SearchIcon /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleResetSearch">重置</el-button>
        </div>
      </div>
    </div>
    
    <!-- 分类列表 -->
    <el-table
      :data="categories"
      v-loading="loading"
      element-loading-text="加载中..."
      style="width: 100%"
      border
    >
      <el-table-column type="index" label="#" width="70" align="center" />
      <el-table-column prop="name" label="分类名称" min-width="200" />
      <el-table-column prop="slug" label="Slug" width="200" />
      <el-table-column prop="parent.name" label="父分类" width="150">
        <template #default="{ row }">
          {{ row.parent?.name || '无' }}
        </template>
      </el-table-column>
      <el-table-column label="文章数量" width="110" align="center">
        <template #default="{ row }">
          {{ row.postCount ?? 0 }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleEditCategory(row)">
            <el-icon><EditIcon /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="handleDeleteCategory(row.id)">
            <el-icon><DeleteIcon /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分类编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditCategory ? '编辑分类' : '添加分类'"
      width="500px"
    >
      <el-form :model="categoryForm" :rules="categoryRules" ref="categoryFormRef" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="categoryForm.slug" placeholder="请输入分类slug" />
        </el-form-item>
        <el-form-item label="父分类">
          <el-select v-model="categoryForm.parentId" placeholder="请选择父分类" clearable>
            <el-option 
              v-for="category in parentCategories" 
              :key="category.id" 
              :label="category.name" 
              :value="category.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveCategory">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus as PlusIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@element-plus/icons-vue'
import request from '../../utils/request'
import type { Category } from '../../types'

// 响应式数据
const categories = ref<Category[]>([])
const loading = ref(false)

// 筛选条件
const searchForm = reactive({
  keyword: ''
})

const dialogVisible = ref(false)
const isEditCategory = ref(false)
const categoryFormRef = ref()

// 分类表单
const categoryForm = reactive({
  id: 0,
  name: '',
  slug: '',
  parentId: null as number | null
})

// 表单验证规则
const categoryRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 50, message: '分类名称长度在 1 到 50 个字符之间', trigger: 'blur' }
  ],
  slug: [
    { required: true, message: '请输入分类slug', trigger: 'blur' },
    { min: 1, max: 100, message: '分类slug长度在 1 到 100 个字符之间', trigger: 'blur' }
  ]
}

// 父分类列表（排除当前编辑的分类）
const parentCategories = computed(() => {
  return categories.value.filter(category => category.id !== categoryForm.id)
})

// 添加分类
const handleAddCategory = () => {
  isEditCategory.value = false
  categoryForm.id = 0
  categoryForm.name = ''
  categoryForm.slug = ''
  categoryForm.parentId = null
  dialogVisible.value = true
}

// 编辑分类
const handleEditCategory = (row: Category) => {
  isEditCategory.value = true
  categoryForm.id = row.id
  categoryForm.name = row.name
  categoryForm.slug = row.slug
  categoryForm.parentId = row.parentId
  dialogVisible.value = true
}

// 保存分类
const handleSaveCategory = async () => {
  if (!categoryFormRef.value) return
  await categoryFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (isEditCategory.value) {
          // 编辑分类
          await request.put(`/categories/${categoryForm.id}`, {
            name: categoryForm.name,
            slug: categoryForm.slug,
            parentId: categoryForm.parentId
          })
          ElMessage.success('分类更新成功')
        } else {
          // 添加分类
          await request.post('/categories', {
            name: categoryForm.name,
            slug: categoryForm.slug,
            parentId: categoryForm.parentId
          })
          ElMessage.success('分类添加成功')
        }
        dialogVisible.value = false
        fetchCategories()
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      }
    }
  })
}

// 删除分类
const handleDeleteCategory = (id: number) => {
  ElMessageBox.confirm(
    '确定要删除这个分类吗？此操作不可恢复。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(async () => {
    try {
      // 检查是否有子分类
      const hasChildren = categories.value.some(cat => cat.parentId === id)
      if (hasChildren) {
        ElMessage.error('该分类下有子分类，无法删除')
        return
      }
      
      // 调用API删除分类
      await request.delete(`/categories/${id}`)
      ElMessage.success('分类已删除')
      fetchCategories()
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 获取分类列表（带关键字筛选 + loading 状态）
const fetchCategories = async () => {
  loading.value = true
  try {
    const keyword = searchForm.keyword.trim()
    const response = await request.get('/categories', {
      params: keyword ? { keyword } : {}
    })
    categories.value = response.data
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  fetchCategories()
}

// 重置筛选条件并重新加载
const handleResetSearch = () => {
  searchForm.keyword = ''
  fetchCategories()
}

// 页面挂载时获取数据
onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.category-list {
  padding: 1rem 0;
}

/* 筛选卡片：上半筛选条件，下半左新增 / 右搜索重置 */
.filter-card {
  background-color: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-color, 0 1px 3px rgba(0, 0, 0, 0.1));
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
}

.filter-conditions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.filter-actions-right {
  display: flex;
  gap: 0.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .filter-actions-right {
    align-self: flex-end;
  }
}
</style>