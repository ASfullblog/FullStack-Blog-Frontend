<template>
  <!-- 点击挑战游戏组件 -->
  <div class="play-card click-play-card">
    <div class="play-header">
      <div class="play-title-group">
        <span class="play-icon">👆</span>
        <span class="play-name">点击挑战</span>
      </div>
    </div>
    <div class="play-content">
      <div class="click-stats-board">
        <div class="click-stat-item">
          <span class="click-stat-label">剩余时间</span>
          <span class="click-stat-value timer" :class="{ 'warning': clickTimeLeft <= 3 }">{{ clickTimeLeft }}s</span>
        </div>
        <div class="click-stat-divider"></div>
        <div class="click-stat-item">
          <span class="click-stat-label">点击次数</span>
          <span class="click-stat-value score">{{ clickScore }}</span>
        </div>
      </div>
      <div class="click-game-area">
        <button
          v-if="clickGameActive"
          class="click-main-btn"
          @click="handleClick"
        >
          <span class="click-btn-text">点我！</span>
          <span class="click-btn-hint">疯狂点击</span>
        </button>
        <div v-else class="click-idle-state">
          <div v-if="clickScore === 0" class="click-start-panel">
            <p class="click-intro">10秒极限挑战，测试你的手速！</p>
            <button class="click-start-btn" @click="startClickGame">
              <span class="btn-icon">▶️</span>
              开始挑战
            </button>
          </div>
          <div v-else class="click-result-panel">
            <span class="result-emoji">{{ clickScore >= 80 ? '🏆' : (clickScore >= 50 ? '👍' : '💪') }}</span>
            <p class="click-result-text">{{ clickScore >= 80 ? '手速惊人！' : (clickScore >= 50 ? '不错的成绩！' : '继续加油！') }}</p>
            <p class="click-final-score">最终成绩: {{ clickScore }} 次</p>
            <button class="restart-btn" @click="startClickGame">
              <span class="btn-icon">🔄</span>
              再玩一次
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

// ==================== 响应式数据 ====================
const clickScore = ref(0)
const clickTimeLeft = ref(10)
const clickGameActive = ref(false)
let clickTimer: number | null = null

// ==================== 方法 ====================
/**
 * 开始点击游戏
 * 功能：重置分数和时间，启动倒计时定时器
 */
const startClickGame = () => {
  clickScore.value = 0
  clickTimeLeft.value = 10
  clickGameActive.value = true

  if (clickTimer) clearInterval(clickTimer)

  clickTimer = window.setInterval(() => {
    clickTimeLeft.value--
    if (clickTimeLeft.value <= 0) {
      if (clickTimer) {
        clearInterval(clickTimer)
        clickTimer = null
      }
      clickGameActive.value = false
    }
  }, 1000)
}

/**
 * 处理点击
 * 功能：在游戏激活状态下增加点击分数
 */
const handleClick = () => {
  if (clickGameActive.value) {
    clickScore.value++
  }
}

/**
 * 清理游戏状态
 * 功能：组件卸载时清理定时器
 */
const cleanup = () => {
  if (clickTimer) {
    clearInterval(clickTimer)
    clickTimer = null
  }
  clickGameActive.value = false
}

// ==================== 生命周期 ====================
onUnmounted(() => {
  cleanup()
})

// 暴露方法给父组件
defineExpose({
  cleanup
})
</script>

<style scoped>
/* ==================== 点击挑战游戏样式 ==================== */
.click-play-card {
  max-width: 500px;
}

.click-stats-board {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  margin-bottom: 32px;
  padding: 24px;
  background: var(--bg-primary);
  border-radius: 20px;
}

.click-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.click-stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.click-stat-value {
  font-size: 2.5rem;
  font-weight: 700;
}

.click-stat-value.timer {
  color: var(--accent-color);
}

.click-stat-value.timer.warning {
  color: #f5576c;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.click-stat-value.score {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.click-stat-divider {
  width: 2px;
  height: 60px;
  background: var(--border-color);
}

.click-game-area {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.click-main-btn {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
  transition: all 0.15s ease;
  animation: clickBtnPulse 1s infinite;
}

@keyframes clickBtnPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
  }
  50% {
    transform: scale(1.03);
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.5);
  }
}

.click-main-btn:active {
  transform: scale(0.92);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.click-btn-text {
  font-size: 1.8rem;
  font-weight: 700;
}

.click-btn-hint {
  font-size: 0.85rem;
  opacity: 0.9;
}

.click-idle-state {
  text-align: center;
}

.click-start-panel,
.click-result-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.click-intro {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.click-start-btn {
  padding: 18px 40px;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  box-shadow: 0 6px 20px rgba(67, 233, 123, 0.3);
}

.click-start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(67, 233, 123, 0.4);
}

.result-emoji {
  font-size: 4rem;
}

.click-result-text {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}

.click-final-score {
  font-size: 1.1rem;
  color: var(--text-secondary);
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
</style>
