<template>
  <!-- 小游戏页面 - 4399风格游戏盒 -->
  <div class="games-container">
    <!-- 页面标题 -->
    <div class="games-header">
      <h1 class="games-title">🎮 小游戏中心</h1>
      <p class="games-subtitle">海量休闲小游戏，即点即玩！</p>
    </div>

    <!-- 游戏列表视图 -->
    <div v-if="!isPlaying" class="games-list-view">
      <!-- 分类标签 -->
      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="category-btn"
          :class="{ active: currentCategory === cat.id }"
          @click="currentCategory = cat.id"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载游戏列表...</p>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="loadError" class="error-state">
        <p>{{ loadError }}</p>
        <button class="retry-btn" @click="loadGameList">重新加载</button>
      </div>

      <!-- 游戏卡片网格 -->
      <div v-else class="games-grid">
        <div
          v-for="game in filteredGames"
          :key="game.id"
          class="game-box-card"
          @click="selectGame(game.id)"
        >
          <!-- 游戏封面 -->
          <div class="game-box-cover" :style="{ background: game.gradient }">
            <span class="game-box-icon">{{ game.icon }}</span>
            <div class="game-box-overlay">
              <button class="play-btn">开始游戏</button>
            </div>
          </div>
          <!-- 游戏信息 -->
          <div class="game-box-info">
            <h3 class="game-box-title">{{ game.name }}</h3>
            <p class="game-box-desc">{{ game.description }}</p>
            <div class="game-box-tags">
              <span v-for="tag in game.tags" :key="tag" class="game-tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏进行视图 -->
    <div v-else class="game-play-view">
      <!-- 返回按钮 -->
      <button class="back-btn" @click="exitGame">
        <span class="back-icon">←</span>
        返回游戏列表
      </button>

      <!-- 游戏内容区域 -->
      <div class="game-play-area">
        <!-- 猜数字游戏 -->
        <GuessNumber v-if="currentGame === 'guess'" />

        <!-- 记忆翻牌游戏 -->
        <MemoryCard v-if="currentGame === 'memory'" />

        <!-- 点击挑战游戏 -->
        <ClickChallenge v-if="currentGame === 'click'" ref="clickChallengeRef" />

        <!-- 俄罗斯方块游戏 -->
        <TetrisGame v-if="currentGame === 'tetris'" ref="tetrisGameRef" />

        <!-- 大鱼吃小鱼游戏 -->
        <FishGame v-if="currentGame === 'fish'" ref="fishGameRef" />

        <!-- 闯关挪车游戏 -->
        <ParkingRush v-if="currentGame === 'parking'" ref="parkingRushRef" />

        <!-- 趣味连连看游戏 -->
        <LinkMatch v-if="currentGame === 'linkmatch'" ref="linkMatchRef" @exit="exitGame" />

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import GuessNumber from '../components/Games/GuessNumber.vue'
import MemoryCard from '../components/Games/MemoryCard.vue'
import ClickChallenge from '../components/Games/ClickChallenge.vue'
import TetrisGame from '../components/Games/TetrisGame.vue'
import FishGame from '../components/Games/FishGame.vue'
import ParkingRush from '../components/Games/ParkingRush.vue'
import LinkMatch from '../components/Games/LinkMatch.vue'
import { getGameList, trackGameView, type GameListItem } from '../api/game'

// ==================== 游戏列表数据 ====================
/**
 * 游戏分类列表
 */
const categories = [
  { id: 'all', name: '全部游戏' },
  { id: '益智', name: '益智' },
  { id: '动作', name: '动作' },
  { id: '休闲', name: '休闲' }
]

const currentCategory = ref('all')

/**
 * 从API获取的游戏列表
 */
const apiGameList = ref<GameListItem[]>([])
const isLoading = ref(false)
const loadError = ref('')

/**
 * slug到游戏ID的映射
 */
const slugToGameId: Record<string, string> = {
  'guess-number': 'guess',
  'memory-card': 'memory',
  'click-challenge': 'click',
  'tetris': 'tetris',
  'fish-game': 'fish',
  'parking-rush': 'parking',
  'link-match': 'linkmatch'
}

const gameIdToSlug: Record<string, string> = Object.fromEntries(
  Object.entries(slugToGameId).map(([slug, gameId]) => [gameId, slug])
) as Record<string, string>

/**
 * 游戏ID到图标的映射
 */
const gameIcons: Record<string, string> = {
  'guess': '🔢',
  'memory': '🧠',
  'click': '👆',
  'tetris': '🧱',
  'fish': '🐟',
  'parking': '🚗',
  'linkmatch': '🍎',
  'screw': '🔧'
}

/**
 * 游戏ID到渐变色背景的映射
 */
const gameGradients: Record<string, string> = {
  'guess': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'memory': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'click': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'tetris': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'fish': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'parking': 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
  'linkmatch': 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
  'screw': 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)'
}

/**
 * 转换API游戏数据为页面使用的格式
 */
const gameList = computed(() => {
  return apiGameList.value.map(game => {
    const gameId = slugToGameId[game.slug] || game.slug
    // 从tags中确定分类，默认为puzzle
    const category = game.tags.includes('动作') ? 'action' : 
                     game.tags.includes('休闲') ? 'casual' : 'puzzle'
    return {
      id: gameId,
      name: game.name,
      icon: gameIcons[gameId] || '🎮',
      description: game.shortDesc || game.description || '',
      category: category,
      tags: game.tags,
      gradient: gameGradients[gameId] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      imageUrl: game.imageUrl,
      viewCount: game.viewCount,
      likeCount: game.likeCount,
      ratingAvg: game.ratingAvg
    }
  })
})

/**
 * 根据分类筛选游戏
 * 功能：根据当前选中的分类过滤游戏列表
 */
const filteredGames = computed(() => {
  if (currentCategory.value === 'all') {
    return gameList.value
  }
  // 根据标签筛选
  return gameList.value.filter(game => game.tags.includes(currentCategory.value))
})

// ==================== 游戏状态管理 ====================
const isPlaying = ref(false)
const currentGame = ref('')

// 组件引用
const clickChallengeRef = ref<InstanceType<typeof ClickChallenge> | null>(null)
const tetrisGameRef = ref<InstanceType<typeof TetrisGame> | null>(null)
const fishGameRef = ref<InstanceType<typeof FishGame> | null>(null)
const parkingRushRef = ref<InstanceType<typeof ParkingRush> | null>(null)
const linkMatchRef = ref<InstanceType<typeof LinkMatch> | null>(null)

/**
 * 选择游戏
 * 功能：设置当前游戏并切换到游戏视图
 * @param gameId - 游戏ID
 */
const selectGame = (gameId: string) => {
  currentGame.value = gameId
  isPlaying.value = true
  const slug = gameIdToSlug[gameId]
  if (slug) {
    trackGameView(slug).catch((error) => {
      console.error('[Games] trackGameView failed:', error)
    })
  }
}

/**
 * 退出游戏
 * 功能：清理当前游戏状态，返回游戏列表
 */
const exitGame = () => {
  // 清理需要清理的游戏状态
  if (currentGame.value === 'click' && clickChallengeRef.value) {
    clickChallengeRef.value.cleanup()
  } else if (currentGame.value === 'tetris' && tetrisGameRef.value) {
    tetrisGameRef.value.endTetrisGame()
  } else if (currentGame.value === 'fish' && fishGameRef.value) {
    fishGameRef.value.endFishGame()
  } else if (currentGame.value === 'parking' && parkingRushRef.value) {
    parkingRushRef.value.cleanup()
  } else if (currentGame.value === 'linkmatch' && linkMatchRef.value) {
    linkMatchRef.value.cleanup()
  }

  isPlaying.value = false
  currentGame.value = ''
}

/**
 * 加载游戏列表
 * 功能：从后端API获取游戏列表数据
 */
const loadGameList = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const games = await getGameList()
    apiGameList.value = games
  } catch (error: any) {
    console.error('[Games] 加载游戏列表失败:', error)
    loadError.value = error.message || '加载游戏列表失败'
  } finally {
    isLoading.value = false
  }
}

// 页面挂载时加载游戏列表
onMounted(() => {
  loadGameList()
})
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.games-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================== 页面标题 ==================== */
.games-header {
  text-align: center;
  margin-bottom: 40px;
  animation: slideDown 0.6s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.games-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.games-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
}

/* ==================== 游戏列表视图 ==================== */

/* 分类标签 */
.category-tabs {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.category-btn {
  padding: 10px 24px;
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-btn:hover {
  border-color: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.category-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  text-align: center;
}

.error-state p {
  margin-bottom: 16px;
  color: #e74c3c;
}

.retry-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 游戏卡片网格 - 4399风格 */
.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 20px 0;
}

/* 游戏盒子卡片 */
.game-box-card {
  background: var(--card-bg);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
}

.game-box-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

/* 游戏封面 */
.game-box-cover {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.game-box-icon {
  font-size: 4rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  transition: transform 0.3s ease;
}

.game-box-card:hover .game-box-icon {
  transform: scale(1.1);
}

/* 悬停遮罩层 */
.game-box-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.game-box-card:hover .game-box-overlay {
  opacity: 1;
}

.play-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transform: translateY(20px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.game-box-card:hover .play-btn {
  transform: translateY(0);
}

.play-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

/* 游戏信息 */
.game-box-info {
  padding: 20px;
}

.game-box-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.game-box-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
}

/* 游戏标签 */
.game-box-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.game-tag {
  padding: 4px 12px;
  background: rgba(102, 126, 234, 0.1);
  color: var(--accent-color);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* ==================== 游戏进行视图 ==================== */

/* 返回按钮 */
.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 24px;
}

.back-btn:hover {
  border-color: var(--accent-color);
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.back-icon {
  font-size: 1.2rem;
}

/* 游戏进行区域 */
.game-play-area {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 768px) {
  .games-container {
    padding: 16px;
  }

  .games-header {
    margin-bottom: 24px;
  }

  .games-title {
    font-size: 2rem;
  }

  .games-subtitle {
    font-size: 1rem;
  }

  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
  }

  .game-box-cover {
    height: 140px;
  }

  .game-box-icon {
    font-size: 3rem;
  }

  .game-box-title {
    font-size: 1.1rem;
  }
}
</style>
