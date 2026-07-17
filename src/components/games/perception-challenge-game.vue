<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  config: {
    instructions?: string
    rounds: Array<{
      color: string
      backgroundA: string
      backgroundB: string
      correctAnswer: string // e.g. "different_perception_same_color"
    }>
    scoringNote?: string
  }
}>()

const emit = defineEmits<{
  finished: [score: number]
}>()

const currentRound = ref(0)
// Store user's choice per round: 'same' | 'different'
const answers = ref<string[]>([])
const showResult = ref(false)

function selectAnswer(choice: 'same' | 'different') {
  if (showResult.value) return
  answers.value[currentRound.value] = choice
  if (currentRound.value < props.config.rounds.length - 1) {
    currentRound.value++
  } else {
    finishGame()
  }
}

function finishGame() {
  showResult.value = true
  // For perception_challenge: correctAnswer is like "different_perception_same_color".
  // User answers 'same' or 'different'. We treat it as:
  // - If answer includes "different", expected user choice is "different"
  // - Else if includes "same", expected is "same"
  const correct = answers.value.filter((a, i) => {
    const key = props.config.rounds[i].correctAnswer || ''
    return (key.includes('different') && a === 'different') ||
           (key.includes('same') && a === 'same')
  }).length
  const score = Math.round((correct / props.config.rounds.length) * 100)
  emit('finished', score)
}
</script>

<template>
  <div class="perception-challenge-game">
    <p class="game-hint">{{ config.instructions }}</p>

    <div v-if="currentRound < config.rounds.length" class="round-container">
      <p class="text-sm mb-2">Savol {{ currentRound + 1 }}/{{ config.rounds.length }}</p>

      <div class="color-row">
        <div
          class="color-box"
          :style="{ backgroundColor: config.rounds[currentRound].backgroundA }"
        >
          <span
            class="swatch"
            :style="{ backgroundColor: config.rounds[currentRound].color }"
          ></span>
        </div>
        <div
          class="color-box"
          :style="{ backgroundColor: config.rounds[currentRound].backgroundB }"
        >
          <span
            class="swatch"
            :style="{ backgroundColor: config.rounds[currentRound].color }"
          ></span>
        </div>
      </div>

      <p class="text-xs text-muted">
        Bu ikki kvadratdagi rang bir xilmi yoki har xil? (faqat ko'rganingizga qarab javob bering)
      </p>

      <div class="btn-row">
        <button
          class="pill-btn"
          :class="{ active: answers[currentRound] === 'same' }"
          @click="selectAnswer('same')"
        >
          Bir xil
        </button>
        <button
          class="pill-btn"
          :class="{ active: answers[currentRound] === 'different' }"
          @click="selectAnswer('different')"
        >
          Har xil
        </button>
      </div>
    </div>

    <div v-else-if="showResult" class="result-box">
      <p class="text-sm mb-1">Test yakunlandi!</p>
      <p v-if="config.scoringNote" class="text-xs text-muted">{{ config.scoringNote }}</p>
    </div>
  </div>
</template>

<style scoped>
.perception-challenge-game {
  font-size: 0.95rem;
}
.game-hint {
  margin-bottom: 8px;
  color: var(--muted, #6b7280);
}
.round-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.color-row {
  display: flex;
  gap: 14px;
}
.color-box {
  width: 80px;
  height: 80px;
  border-radius: 999px;
  border: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}
.swatch {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 2px solid rgba(15,23,42,0.18);
}
.btn-row {
  display: flex;
  gap: 10px;
}
.pill-btn {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  cursor: pointer;
  font-size: 0.85rem;
}
.pill-btn.active {
  background: var(--primary, #6366f1);
  color: #fff;
  border-color: var(--primary, #6366f1);
}
.result-box {
  margin-top: 8px;
  text-align: center;
  font-weight: 500;
  color: var(--good, #16a34a);
}
.text-sm { font-size: 0.9rem; }
.text-xs { font-size: 0.75rem; }
.text-muted { color: var(--muted, #6b7280); }
</style>
