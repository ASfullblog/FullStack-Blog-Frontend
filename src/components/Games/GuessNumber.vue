<template>
  <!-- 猜数字游戏组件 -->
  <div class="play-card guess-play-card">
    <div class="play-header">
      <div class="play-title-group">
        <span class="play-icon">🔢</span>
        <span class="play-name">猜数字</span>
      </div>
      <div class="play-stats">
        <span class="stat-badge">已猜 {{ guessCount }} 次</span>
      </div>
    </div>
    <div class="play-content">
      <div class="guess-intro">
        <div class="guess-number-display">?</div>
        <p class="play-desc">我想了一个 1-100 的数字，你来猜！</p>
      </div>
      <div class="guess-input-area">
        <div class="guess-input-wrapper">
          <input
            v-model.number="guessNumberInput"
            type="number"
            min="1"
            max="100"
            placeholder="输入 1-100 的数字"
            class="guess-input"
            @keyup.enter="makeGuess"
          >
          <button class="guess-btn" @click="makeGuess">
            <span class="btn-icon">🎯</span>
            猜测
          </button>
        </div>
      </div>
      <transition name="fade">
        <div v-if="guessResult" class="guess-result-box" :class="guessResultType">
          <span class="result-icon">{{ guessResultType === 'correct' ? '🎉' : (guessResultType === 'low' ? '⬆️' : '⬇️') }}</span>
          <p class="guess-result-text">{{ guessResult }}</p>
        </div>
      </transition>
      <button v-if="guessResultType === 'correct'" class="restart-btn" @click="initGuessNumber">
        <span class="btn-icon">🔄</span>
        再玩一次
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// ==================== 响应式数据 ====================
const targetNumber = ref(0)
const guessNumberInput = ref<number | null>(null)
const guessResult = ref('')
const guessResultType = ref('')
const guessCount = ref(0)

// ==================== 方法 ====================
/**
 * 初始化猜数字游戏
 * 功能：生成1-100之间的随机目标数字，重置游戏状态
 */
const initGuessNumber = () => {
  targetNumber.value = Math.floor(Math.random() * 100) + 1
  guessNumberInput.value = null
  guessResult.value = ''
  guessResultType.value = ''
  guessCount.value = 0
}

/**
 * 进行猜测
 * 功能：比较用户输入与目标数字，给出提示信息
 */
const makeGuess = () => {
  if (!guessNumberInput.value) return

  guessCount.value++
  const guess = guessNumberInput.value

  if (guess < targetNumber.value) {
    guessResult.value = '太小了！再试试'
    guessResultType.value = 'low'
  } else if (guess > targetNumber.value) {
    guessResult.value = '太大了！再试试'
    guessResultType.value = 'high'
  } else {
    guessResult.value = `🎉 恭喜你猜对了！答案就是 ${targetNumber.value}`
    guessResultType.value = 'correct'
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  initGuessNumber()
})
</script>

<style scoped>
/* ==================== 猜数字游戏样式 ==================== */
.guess-play-card {
  max-width: 500px;
}

.guess-intro {
  text-align: center;
  margin-bottom: 28px;
}

.guess-number-display {
  width: 100px;
  height: 100px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.guess-input-area {
  margin-bottom: 24px;
}

.guess-input-wrapper {
  display: flex;
  gap: 12px;
}

.guess-input {
  flex: 1;
  padding: 16px 20px;
  border: 2px solid var(--border-color);
  border-radius: 14px;
  font-size: 1.2rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.3s ease;
  text-align: center;
}

.guess-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
}

.guess-btn {
  padding: 16px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.guess-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.guess-result-box {
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 24px;
  text-align: center;
  animation: slideIn 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.result-icon {
  font-size: 2.5rem;
}

.guess-result-text {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.guess-result-box.low,
.guess-result-box.high {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(245, 124, 0, 0.15) 100%);
  color: #f57c00;
}

.guess-result-box.correct {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(56, 142, 60, 0.15) 100%);
  color: #388e3c;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.play-desc {
  color: var(--text-secondary);
  font-size: 1.05rem;
  line-height: 1.6;
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
