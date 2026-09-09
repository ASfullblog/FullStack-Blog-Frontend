<template>
  <div class="game-management">
    <div class="page-header">
      <h2 class="page-title">小游戏管理</h2>
      <el-button type="primary" @click="fetchGames" :loading="loading">刷新</el-button>
    </div>

    <el-table :data="games" v-loading="loading" style="width: 100%">
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
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
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

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}
</style>
