<template>
  <div class="game-management">
    <!-- 搜索和筛选 -->
    <div class="search-filter">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索游戏名称或 Slug"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="上架状态">
          <el-select
            v-model="searchForm.published"
            placeholder="请选择"
            clearable
            style="width: 120px"
            @change="handleSearch"
          >
            <el-option label="已上架" :value="true" />
            <el-option label="已下架" :value="false" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="filter-actions">
        <div class="filter-actions-left">
          <el-button type="primary" @click="fetchGames" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        <div class="filter-actions-right">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>
      </div>
    </div>

    <el-table
      :data="filteredGames"
      v-loading="loading"
      element-loading-text="加载中..."
      style="width: 100%"
      border
    >
      <el-table-column type="index" label="#" width="60" align="center" />
      <el-table-column prop="name" label="游戏名称" min-width="180" />
      <el-table-column prop="slug" label="Slug" min-width="160" />
      <el-table-column prop="shortDesc" label="简介" min-width="240" show-overflow-tooltip />
      <el-table-column prop="viewCount" label="浏览量" width="100" />
      <el-table-column prop="ratingAvg" label="评分" width="100" />
      <el-table-column prop="sortOrder" label="排序" width="90" />
      <el-table-column label="上架状态" width="140">
        <template #default="{ row }">
          <el-switch
            :model-value="row.isPublished"
            :loading="switchingId === row.id"
            inline-prompt
            active-text="上架"
            inactive-text="下架"
            @change="togglePublish(row)"
          />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import request from '../../utils/request'

interface AdminGameItem {
  id: number
  name: string
  slug: string
  shortDesc: string | null
  isPublished: boolean
  viewCount: number
  ratingAvg: number
  sortOrder: number
}

const loading = ref(false)
const switchingId = ref<number | null>(null)
const games = ref<AdminGameItem[]>([])

// 筛选表单（本地过滤，不请求接口）
const searchForm = ref<{ keyword: string; published: '' | boolean | undefined }>({
  keyword: '',
  published: ''
})

// 点击搜索后真正生效的条件
const appliedFilters = ref<{ keyword: string; published: '' | boolean | undefined }>({
  keyword: '',
  published: ''
})

const filteredGames = computed(() => {
  const keyword = appliedFilters.value.keyword.trim().toLowerCase()
  const published = appliedFilters.value.published
  return games.value.filter((game) => {
    const keywordOk =
      !keyword ||
      game.name?.toLowerCase().includes(keyword) ||
      game.slug?.toLowerCase().includes(keyword)
    const publishedOk = typeof published !== 'boolean' || game.isPublished === published
    return keywordOk && publishedOk
  })
})

const handleSearch = () => {
  appliedFilters.value = {
    keyword: searchForm.value.keyword,
    published: searchForm.value.published
  }
}

const resetSearch = () => {
  searchForm.value = { keyword: '', published: '' }
  appliedFilters.value = { keyword: '', published: '' }
}

const fetchGames = async () => {
  loading.value = true
  try {
    const response = await request.get('/admin/games')
    games.value = response.data
  } catch (error: any) {
    ElMessage.error(error.message || '获取小游戏列表失败')
  } finally {
    loading.value = false
  }
}

const togglePublish = async (game: AdminGameItem) => {
  switchingId.value = game.id
  try {
    const response = await request.put(`/admin/games/${game.id}/publish`, {
      isPublished: !game.isPublished
    })
    const index = games.value.findIndex((item) => item.id === game.id)
    if (index >= 0) {
      games.value[index] = response.data
    }
    ElMessage.success('状态已更新')
  } catch (error: any) {
    ElMessage.error(error.message || '更新上架状态失败')
  } finally {
    switchingId.value = null
  }
}

onMounted(() => {
  fetchGames()
})
</script>

<style scoped>
.game-management {
  padding: 1rem 0;
}

/* 筛选卡片 */
.search-filter {
  background-color: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

/* 筛选区底部操作栏：左动作 / 右搜索重置 */
.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.filter-actions-left,
.filter-actions-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .filter-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
