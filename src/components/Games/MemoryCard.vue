<template>
  <!-- 记忆翻牌游戏组件 -->
  <div class="play-card memory-play-card">
    <div class="play-header">
      <div class="play-title-group">
        <span class="play-icon">🧠</span>
        <span class="play-name">记忆翻牌</span>
      </div>
      <div class="play-stats">
        <span class="stat-badge">步数 {{ memoryMoves }}</span>
      </div>
    </div>
    <div class="play-content">
      <div class="memory-status-bar">
        <p class="memory-status-text">{{ memoryStatus }}</p>
        <div class="memory-progress">
          <div class="memory-progress-bar" :style="{ width: (memoryCards.filter(c => c.matched).length / memoryCards.length * 100) + '%' }"></div>
        </div>
      </div>
      <div class="memory-grid">
        <div
          v-for="(card, index) in memoryCards"
          :key="index"
          class="memory-card"
          :class="{ 'flipped': card.flipped || card.matched, 'matched': card.matched }"
          @click="flipCard(index)"
        >
          <div class="card-inner">
            <span class="card-front">{{ card.emoji }}</span>
            <span class="card-back">?</span>
          </div>
        </div>
      </div>
      <transition name="fade">
        <div v-if="memoryWon" class="memory-win-box">
          <span class="win-icon">🏆</span>
          <p class="win-text">恭喜完成！用了 {{ memoryMoves }} 步</p>
          <button class="restart-btn" @click="initMemoryGame">
            <span class="btn-icon">🔄</span>
            再玩一次
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// ==================== 常量 ====================
const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼']

// ==================== 响应式数据 ====================
interface MemoryCard {
  emoji: string
  flipped: boolean
  matched: boolean
}

const memoryCards = ref<MemoryCard[]>([])
const memoryMoves = ref(0)
const memoryWon = ref(false)
const memoryStatus = ref('点击卡片开始游戏')
let flippedCards: number[] = []

// ==================== 方法 ====================
/**
 * 初始化记忆翻牌游戏
 * 功能：创建成对的emoji卡片并随机排序
 */
const initMemoryGame = () => {
  const cards = [...emojis, ...emojis]
    .sort(() => Math.random() - 0.5)
    .map(emoji => ({ emoji, flipped: false, matched: false }))
  memoryCards.value = cards
  memoryMoves.value = 0
  memoryWon.value = false
  memoryStatus.value = '点击卡片开始游戏'
  flippedCards = []
}

/**
 * 翻牌逻辑
 * 功能：处理卡片翻转，检查匹配，更新游戏状态
 * @param index - 被点击卡片的索引
 */
const flipCard = (index: number) => {
  if (memoryCards.value[index].flipped || memoryCards.value[index].matched || flippedCards.length >= 2) return

  memoryCards.value[index].flipped = true
  flippedCards.push(index)

  if (flippedCards.length === 2) {
    memoryMoves.value++
    const [first, second] = flippedCards

    if (memoryCards.value[first].emoji === memoryCards.value[second].emoji) {
      memoryCards.value[first].matched = true
      memoryCards.value[second].matched = true
      flippedCards = []
      memoryStatus.value = '找到一对！继续加油！'

      if (memoryCards.value.every(card => card.matched)) {
        memoryWon.value = true
        memoryStatus.value = `🎉 恭喜完成！用了 ${memoryMoves.value} 步`
      }
    } else {
      memoryStatus.value = '不匹配，再试试'
      setTimeout(() => {
        memoryCards.value[first].flipped = false
        memoryCards.value[second].flipped = false
        flippedCards = []
        memoryStatus.value = '继续游戏'
      }, 1000)
    }
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  initMemoryGame()
})
</script>

<style scoped>
/* ==================== 记忆翻牌游戏样式 ==================== */
.memory-play-card {
  max-width: 500px;
}

.memory-status-bar {
  margin-bottom: 24px;
}

.memory-status-text {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 12px;
  font-size: 1rem;
}

.memory-progress {
  height: 8px;
  background: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;
}

.memory-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.memory-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
  perspective: 1000px;
}

.memory-card {
  aspect-ratio: 1;
  cursor: pointer;
  position: relative;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.memory-card.flipped .card-inner,
.memory-card.matched .card-inner {
  transform: rotateY(180deg);
}

.memory-card:hover .card-inner {
  transform: translateY(-4px);
}

.memory-card.flipped:hover .card-inner,
.memory-card.matched:hover .card-inner {
  transform: rotateY(180deg) translateY(-4px);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.card-back {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 700;
  font-size: 1.8rem;
}

.card-front {
  background: var(--bg-primary);
  border: 3px solid var(--accent-color);
  transform: rotateY(180deg);
  font-size: 2.2rem;
}

.memory-card.matched .card-front {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(56, 142, 60, 0.2) 100%);
  border: 3px solid #4caf50;
  animation: matchPulse 0.5s ease;
}

@keyframes matchPulse {
  0%, 100% {
    transform: rotateY(180deg) scale(1);
  }
  50% {
    transform: rotateY(180deg) scale(1.15);
  }
}

.memory-win-box {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%);
  border-radius: 16px;
  border: 2px solid rgba(76, 175, 80, 0.3);
}

.win-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
}

.win-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: #388e3c;
  margin-bottom: 16px;
}

/* 通用样式 */
.play-card {
  background: var(--card-bg);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  width: 100%;
  max-width: 800px;
  animation: cardAppear 0.5s ease-out;
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.play-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--border-color);
}

.play-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.play-icon {
  font-size: 2.2rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.play-name {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
}

.play-stats {
  display: flex;
  gap: 10px;
}

.stat-badge {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.btn-icon {
  margin-right: 6px;
}

.restart-btn {
  padding: 14px 32px;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(67, 233, 123, 0.3);
}

.restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(67, 233, 123, 0.4);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
