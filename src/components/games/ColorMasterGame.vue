<script setup lang="ts">
import { ref, computed } from 'vue'

interface PerceptionRound {
  type: 'perception'
  color: string
  bgA: string
  bgB: string
  question: string
  options: [string, string] // e.g. ["Bir xil", "Farq qiladi"]
  correctIndex: number
  explanationCorrect: string
  explanationWrong: string
}

interface MoodTask {
  type: 'mood'
  scenario: string
  palettes: string[][] // each palette is array of color hexes
  correctIndex: number
  explanationCorrect: string
  explanationWrong: string
}

type Question = PerceptionRound | MoodTask

const props = defineProps<{
  config: {
    questions: (PerceptionRound | MoodTask)[]
  }
}>()

const emit = defineEmits<{
  finished: [score: number]
}>()

const currentQIndex = ref(0)
const selectedOption = ref<number | null>(null)
const score = ref(0)
const answers = ref<
  {
    questionText: string
    type: 'perception' | 'mood'
    userIndex: number
    correctIndex: number
    isCorrect: boolean
    explanation: string
  }[]
>([])

const finished = ref(false)

const totalQuestions = computed(() => props.config.questions.length)
const currentQ = computed(() => props.config.questions[currentQIndex.value])
const progressPct = computed(
  () => (currentQIndex.value / totalQuestions.value) * 100
)

function selectOption(index: number) {
  if (finished.value) return
  selectedOption.value = index
}

function next() {
  if (finished.value) return
  const q = currentQ.value
  if (selectedOption.value === null) return // will show warning in UI

  const isCorrect = selectedOption.value === q.correctIndex
  if (isCorrect) score.value++

  answers.value.push({
    questionText:
      q.type === 'perception' ? q.question : q.scenario,
    type: q.type,
    userIndex: selectedOption.value!,
    correctIndex: q.correctIndex,
    isCorrect,
    explanation: isCorrect ? (q as any).explanationCorrect : (q as any).explanationWrong
  })

  currentQIndex.value++
  selectedOption.value = null

  if (currentQIndex.value >= totalQuestions.value) {
    finished.value = true
    const finalScore = Math.round((score.value / totalQuestions.value) * 100)
    emit('finished', finalScore)
  }
}

function resetGame() {
  currentQIndex.value = 0
  selectedOption.value = null
  score.value = 0
  answers.value = []
  finished.value = false
}
</script>

<template>
  <div class="color-master-game">
    <!-- Progress bar -->
    <section class="progress-bar">
      <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
      <span class="progress-text">{{ currentQIndex }} / {{ totalQuestions }}</span>
    </section>

    <!-- Game area -->
    <main v-if="!finished && currentQ">
      <!-- Perception question -->
      <template v-if="currentQ.type === 'perception'">
        <section class="card">
          <div class="question-title">{{ currentQ.question }}</div>

          <div class="swatch-row">
            <div
              class="swatch-box"
              :style="{ background: currentQ.bgA }"
            >
              <div
                class="color-circle"
                :style="{ background: currentQ.color }"
              ></div>
            </div>
            <div
              class="swatch-box"
              :style="{ background: currentQ.bgB }"
            >
              <div
                class="color-circle"
                :style="{ background: currentQ.color }"
              ></div>
            </div>
          </div>

          <div class="options">
            <button
              v-for="(opt, i) in currentQ.options"
              :key="i"
              class="option-btn"
              :class="{ selected: selectedOption === i }"
              @click="selectOption(i)"
            >
              {{ opt }}
            </button>
          </div>
        </section>
      </template>

      <!-- Mood palette question -->
      <template v-else-if="currentQ.type === 'mood'">
        <section class="card">
          <div class="question-title">{{ currentQ.scenario }}</div>
          <p class="hint-text">Eng mos rang palitrani tanlang:</p>

          <div class="options">
            <button
              v-for="(pal, i) in currentQ.palettes"
              :key="i"
              class="option-btn palette-btn"
              :class="{ selected: selectedOption === i }"
              @click="selectOption(i)"
            >
              <span
                v-for="c in pal"
                :key="c"
                class="palette-swatch"
                :style="{ background: c }"
              ></span>
            </button>
          </div>
        </section>
      </template>

      <!-- No per-question feedback; all results shown at the end. -->
    </main>

    <!-- Final score + review -->
    <main v-else-if="finished">
      <section class="card final-card">
        <div class="score-line">
          Natija: {{ Math.round((score / totalQuestions) * 100) }}/100
        </div>
        <p class="hint-text">
          Siz {{ totalQuestions }} ta savoldan {{ score }} tasini to‘g‘ri javob berdingiz.
        </p>

        <ul class="review-list">
          <li
            v-for="(a, i) in answers"
            :key="i"
            class="review-item"
            :class="{ ok: a.isCorrect, fail: !a.isCorrect }"
          >
            <div class="review-header">
              {{ a.isCorrect ? '✅' : '❌' }} Savol {{ i + 1 }}:
              {{ a.isCorrect ? "To‘g‘ri" : "Noto‘g‘ri" }}
            </div>
            <div>{{ a.questionText }}</div>
            <div v-if="a.type === 'perception'" class="review-detail">
              Siz tanlagan: {{ answers[i].userIndex === 0 ? "Bir xil" : "Farq qiladi" }}
              <span v-if="!a.isCorrect">
                — To‘g‘ri javob:
                {{ a.correctIndex === 0 ? "Bir xil" : "Farq qiladi" }}
              </span>
            </div>
            <div v-else class="review-detail">
              Siz tanlagan palitra: {{ a.userIndex + 1 }}
              <span v-if="!a.isCorrect">
                — To‘g‘ri palitra: {{ a.correctIndex + 1 }}
              </span>
            </div>
            <div class="review-explanation">{{ a.explanation }}</div>
          </li>
        </ul>
      </section>
    </main>

    <!-- Actions -->
    <section class="actions">
      <button class="btn-secondary" @click="resetGame">Qayta boshlash</button>
      <button
        v-if="!finished"
        class="btn-primary"
        :disabled="selectedOption === null"
        @click="next"
      >Keyingi</button>
    </section>
  </div>
</template>

<style scoped>
.color-master-game {
  font-size: 0.95rem;
  color: #111827;
}

/* Progress */
.progress-bar {
  margin-bottom: 10px;
  height: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #38bdf8, #6366f1);
  transition: width 0.25s ease;
}

.progress-text {
  font-size: 10px;
  color: #6b7280;
  display: block;
  text-align: right;
  margin-top: 4px;
}

/* Card */
.card {
  padding: 12px;
  border-radius: 14px;
  background: #f5f5ff;
  border: 1px solid #e5e7eb;
  margin-bottom: 8px;
}

.question-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #111827;
}

.hint-text {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

/* Perception swatches */
.swatch-row {
  display: flex;
  gap: 14px;
  margin-top: 8px;
}

.swatch-box {
  width: 90px;
  height: 90px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
}

.color-circle {
  width: 50px;
  height: 50px;
  border-radius: 999px;
}

/* Options */
.options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.option-btn {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  font-size: 11px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.option-btn.selected {
  border-color: #38bdf8;
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.25);
}

.palette-btn {
  gap: 4px;
}

.palette-swatch {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  display: inline-block;
  border: 1px solid #e5e7eb;
}

/* Mini feedback */
.feedback-mini {
  margin-top: 8px;
  font-size: 11px;
  color: #111827;
}

.feedback-mini .ok {
  border-left: solid 3px #22c55e;
  padding: 4px 6px;
  background: #f0fdf4;
  border-radius: 999px;
}

.feedback-mini .fail {
  border-left: solid 3px #ef4444;
  padding: 4px 6px;
  background: #fef2f2;
  border-radius: 999px;
}

/* Final */
.final-card {
  font-size: 13px;
}

.score-line {
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 15px;
}

.review-list {
  list-style: none;
  padding: 0;
  margin-top: 8px;
  display: grid;
  gap: 6px;
}

.review-item {
  padding: 8px;
  border-radius: 12px;
  background: #f9fafb;
  font-size: 11px;
  color: #111827;
}

.review-item.ok {
  border-left: solid 3px #22c55e;
}

.review-item.fail {
  border-left: solid 3px #ef4444;
}

.review-header {
  font-weight: 600;
  margin-bottom: 2px;
}

.review-detail,
.review-explanation {
  margin-top: 2px;
  color: #6b7280;
}

/* Actions */
.actions {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: linear-gradient(to right, #38bdf8, #6366f1);
  color: #ffffff;
  font-weight: 600;
}

.btn-secondary {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: transparent;
  color: #111827;
}
</style>
