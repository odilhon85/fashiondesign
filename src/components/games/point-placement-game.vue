<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  config: {
    instructions?: string
    points: Array<{ id: string; label: string }>
    toleranceRadiusPx?: number
  }
}>()

const emit = defineEmits<{
  finished: [score: number]
}>()

// Draping Xaritasi (Landmark Mapper + Ease Trainer)
const canvasWidth = 240
const canvasHeight = 380
const toleranceRadiusPx = props.config.toleranceRadiusPx ?? 25

interface LandmarkTarget {
  id: string
  label: string
  xRatio: number // relative to canvas width
  yRatio: number // relative to canvas height
}

// Ideal positions for landmarks (relative to dress form)
const landmarkTargets: LandmarkTarget[] = [
  { id: 'cf',       label: 'Center Front',     xRatio: 0.5,   yRatio: 0.12 },
  { id: 'cb',       label: 'Center Back',      xRatio: 0.5,   yRatio: 0.92 },
  { id: 'bust',     label: 'Bust Line',        xRatio: 0.5,   yRatio: 0.30 },
  { id: 'waist',    label: 'Waistline',        xRatio: 0.5,   yRatio: 0.52 },
  { id: 'hip',      label: 'Hip Line',         xRatio: 0.5,   yRatio: 0.70 },
  { id: 'shoulder', label: 'Shoulder Line',    xRatio: 0.3,   yRatio: 0.18 },
  { id: 'armhole',  label: 'Armhole',          xRatio: 0.25,  yRatio: 0.40 }
]

interface PlacedLandmark {
  id: string
  correct: boolean
  userX: number
  userY: number
}

const placedLandmarks = ref<PlacedLandmark[]>([])
const currentTargetIndex = ref(0) // which landmark to place next
const feedbackText = ref<string>('')
const showFinal = ref(false)
const easeSelectedOption = ref<number | null>(null)
const easeChecked = ref(false)

// Part B: Ease question (two-finger rule)
const easeQuestion = {
  text: "Ease tekshirish uchun qanday usul ishlatiladi?",
  options: [
    "Bir qo‘l usuli",
    "Ikki barmoq usuli",
    "Ko‘z bilan taxmin qilish",
    "Faqat o‘lchov lentasi"
  ],
  correctIndex: 1,
  explanationCorrect: "To‘g‘ri! Ikki barmoq usuli orqali mato va maneken orasidagi bo‘shliq tekshiriladi.",
  explanationWrong: "Noto‘g‘ri. To‘g‘ri javob — ikki barmoq usuli, chunki u qulaylikni aniq his qilishga yordam beradi."
}

const currentTarget = computed(() => {
  if (currentTargetIndex.value >= landmarkTargets.length) return null
  const t = landmarkTargets[currentTargetIndex.value]
  // Match with config label if exists, else use built-in
  const cfgPoint = props.config.points.find(p => p.id === t.id)
  return { ...t, label: cfgPoint?.label ?? t.label }
})

function handleCanvasClick(e: MouseEvent) {
  if (showFinal.value || !currentTarget.value) return
  const rect = (e.target as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const target = currentTarget.value
  const idealX = target.xRatio * canvasWidth
  const idealY = target.yRatio * canvasHeight
  const dx = x - idealX
  const dy = y - idealY
  const dist = Math.sqrt(dx * dx + dy * dy)
  const correct = dist <= toleranceRadiusPx

  placedLandmarks.value.push({
    id: target.id,
    correct,
    userX: x,
    userY: y
  })

  if (correct) {
    feedbackText.value = `✅ ${target.label}: To‘g‘ri joylashtirildi.`
  } else {
    feedbackText.value = `❌ ${target.label}: Noto‘g‘ri. Bu chiziq yaqinroq bo‘lishi kerak edi.`
  }

  currentTargetIndex.value++

  // If all landmarks placed, prepare for Part B (ease question)
  if (currentTargetIndex.value >= landmarkTargets.length) {
    feedbackText.value = "Barcha landmark chiziqlar belgilandi. Endi ease savoliga javob bering."
  }
}

function handleEaseSelect(index: number) {
  if (showFinal.value || easeChecked.value) return
  easeSelectedOption.value = index
}

function checkEaseAndFinish() {
  if (easeChecked.value || showFinal.value) return
  const isCorrect = easeSelectedOption.value === easeQuestion.correctIndex
  const explanation = isCorrect ? easeQuestion.explanationCorrect : easeQuestion.explanationWrong

  // Compute score:
  // - Each landmark: up to ~80% of total (e.g., 11.4 each for 7 points)
  // - Ease question: remaining ~20%
  const correctLandmarks = placedLandmarks.value.filter(p => p.correct).length
  const landmarkScorePart = (correctLandmarks / landmarkTargets.length) * 80
  const easeScorePart = isCorrect ? 20 : 0
  const finalScore = Math.round(landmarkScorePart + easeScorePart)

  showFinal.value = true
  feedbackText.value = explanation
  emit('finished', finalScore)
}

function resetGame() {
  placedLandmarks.value = []
  currentTargetIndex.value = 0
  feedbackText.value = ''
  showFinal.value = false
  easeSelectedOption.value = null
  easeChecked.value = false
}
</script>

<template>
  <div class="point-placement-game">
    <!-- Header -->
    <header class="game-header">
      <h2>Draping Xaritasi</h2>
      <p v-if="config.instructions" class="subtitle">
        {{ config.instructions }}
      </p>
      <p v-else class="subtitle">
        Manekendagi asosiy landmark chiziqlarni to‘g‘ri joyga bosing.
      </p>
    </header>

    <!-- Final results screen -->
    <div v-if="showFinal" class="final-screen">
      <div class="score-line">
        Natija: {{ Math.round((placedLandmarks.filter(p => p.correct).length / landmarkTargets.length) * 80 + (easeSelectedOption === easeQuestion.correctIndex ? 20 : 0)) }}/100
      </div>
      <p>Siz jami {{ placedLandmarks.length }} ta nuqtadan {{ placedLandmarks.filter(p => p.correct).length }} tasini to‘g‘ri belgiladingiz.</p>

      <div v-for="pl in placedLandmarks" :key="pl.id" :class="['answer-item', { 'answer-correct': pl.correct, 'answer-wrong': !pl.correct }]">
        <div class="step-title">{{ pl.correct ? '✅' : '❌' }} {{ landmarkTargets.find(t => t.id === pl.id)?.label || pl.id }}</div>
      </div>

      <button class="btn-secondary mt-3" @click="resetGame">Qayta boshlash</button>
    </div>

    <!-- Game area -->
    <template v-else>
      <!-- Dress form canvas -->
      <div class="card">
        <p class="task-label">
          Hozirgi nuqta: {{ currentTarget?.label || '—' }}
        </p>

        <div
          class="dress-form-canvas"
          :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
          @click="handleCanvasClick"
        >
          <!-- Dress form silhouette -->
          <svg viewBox="0 0 240 380" class="silhouette-svg">
            <path
              d="M120,15 C140,15 160,30 170,50 C180,70 190,100 190,140
                 C190,180 180,210 170,240 C160,270 160,310 155,340 L140,370
                 L100,370 L85,340 C80,310 80,270 70,240
                 C60,210 50,180 50,140 C50,100 60,70 70,50
                 C80,30 100,15 120,15 Z"
              fill="rgba(79,70,229,0.06)"
              stroke="#6366f1"
              stroke-width="2.5"
            />
          </svg>

          <!-- Placed landmarks -->
          <div
            v-for="pl in placedLandmarks"
            :key="pl.id"
            class="placed-point"
            :class="{ 'point-correct': pl.correct, 'point-wrong': !pl.correct }"
            :style="{ left: (pl.userX - 8) + 'px', top: (pl.userY - 8) + 'px' }"
          >
            <span class="dot"></span>
          </div>
        </div>

        <!-- Landmark list -->
        <ul class="landmark-list">
          <li v-for="(t, i) in landmarkTargets" :key="t.id" :class="['landmark-item', { done: placedLandmarks.some(p => p.id === t.id), active: i === currentTargetIndex }]">
            {{ t.label }}
          </li>
        </ul>
      </div>

      <!-- Feedback -->
      <div v-if="feedbackText" class="feedback-area">
        {{ feedbackText }}
      </div>

      <!-- Part B: Ease question (after all landmarks placed) -->
      <div v-if="currentTargetIndex >= landmarkTargets.length && !showFinal" class="card ease-section">
        <p class="ease-title">Ease savoli:</p>
        <p>{{ easeQuestion.text }}</p>
        <div class="options">
          <button
            v-for="(opt, i) in easeQuestion.options"
            :key="i"
            :class="['option-btn', { selected: easeSelectedOption === i }]"
            @click="handleEaseSelect(i)"
          >
            {{ opt }}
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button class="btn-secondary" @click="resetGame">Qayta boshlash</button>
        <button
          v-if="currentTargetIndex >= landmarkTargets.length && !showFinal"
          class="btn-primary"
          :disabled="easeSelectedOption === null"
          @click="checkEaseAndFinish"
        >
          Yakunlash
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.point-placement-game {
  font-size: 0.95rem;
  color: #111827;
}
.game-header {
  margin-bottom: 8px;
}
.game-header h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
}
.subtitle {
  margin: 4px 0 0;
  font-size: 0.9rem;
  color: #6b7280;
}
.card {
  padding: 10px;
  border-radius: 14px;
  background: #f5f5ff;
  border: 1px solid #e5e7eb;
  margin-bottom: 8px;
}
.task-label {
  font-size: 0.9rem;
  color: #111827;
  margin-bottom: 6px;
}
.dress-form-canvas {
  position: relative;
  border-radius: 999px;
  border: 2px solid #6366f1;
  background: radial-gradient(circle at center, #eef2ff, #ffffff);
  margin: 0 auto;
  overflow: visible;
}
.silhouette-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.placed-point {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.placed-point .dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #6366f1;
  border: 2px solid #fff;
}
.point-correct .dot {
  background: #16a34a;
}
.point-wrong .dot {
  background: #dc2626;
}
.landmark-list {
  margin-top: 8px;
  padding-left: 18px;
  font-size: 0.85rem;
  color: #111827;
}
.landmark-item {
  margin-bottom: 2px;
}
.landmark-item.done {
  text-decoration: line-through;
  color: #6b7280;
}
.landmark-item.active {
  font-weight: 600;
  color: #111827;
}
.feedback-area {
  margin-top: 4px;
  padding: 8px;
  border-radius: 999px;
  background: #f5f5ff;
  font-size: 0.8rem;
  color: #111827;
}
.ease-section {
  margin-top: 4px;
}
.ease-title {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 0.95rem;
}
.options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.option-btn {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  font-size: 0.8rem;
  cursor: pointer;
}
.option-btn.selected {
  border-color: #38bdf8;
  box-shadow: 0 0 14px rgba(56,189,248,0.25);
}
.actions {
  margin-top: 6px;
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
.mt-3 { margin-top: 12px; }

/* Final screen */
.final-screen {
  padding: 10px;
  border-radius: 14px;
  background: #f5f5ff;
  font-size: 0.9rem;
  color: #111827;
}
.score-line {
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 1.05rem;
}
.answer-item {
  padding: 4px 6px;
  border-radius: 999px;
  background: #f9fafb;
  margin-bottom: 3px;
  font-size: 0.85rem;
}
.step-title {
  display: flex;
  align-items: center;
  gap: 4px;
}
.answer-correct {
  border-left: solid 3px #16a34a;
}
.answer-wrong {
  border-left: solid 3px #dc2626;
}
</style>
