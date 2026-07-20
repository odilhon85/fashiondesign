<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  config: {
    instructions?: string
    startDartPosition?: string
    targetDartPosition?: string
    pivotPoint?: string
    steps?: Array<{ action: string; description: string }>
  }
}>()

const emit = defineEmits<{
  finished: [score: number]
}>()

// Interactive Dart Pivot Simulator (based on stage-4-dart-pivot.html)
const currentStep = ref(0)
const selectedOption = ref<number | null>(null)
const score = ref(0)
const showFinal = ref(false)

interface AnswerRecord {
  step: number
  isCorrect: boolean
  userAnswer: string
  correctAnswer: string
  explanation: string
}
const answers = ref<AnswerRecord[]>([])

function getStepData(step: number) {
  switch (step) {
    case 0:
      return {
        mode: 'initial' as const,
        question: "1-qadam: Hozir yon dart mavjud. Uni qayerga ko‘chiramiz?",
        options: [
          "Yelka (Shoulder)",
          "Markaziy old chiziq (CF)",
          "Qo‘l teshigi (Armhole)"
        ],
        correctIndex: 0,
        explanationCorrect: "To‘g‘ri! Yelkaga dart ko‘chirish bodice shaklini saqlaydi.",
        explanationWrong: "Noto‘g‘ri. Bu vaziyatda yelka eng mos variant."
      }
    case 1:
      return {
        mode: 'cutLine' as const,
        question: "2-qadam: Yangi nuqtadan bust pointga chiziq tortamiz. Qaysi chiziq to‘g‘ri?",
        options: ["Yangi nuqtadan bust pointgacha", "Dart o‘zi bo‘ylab"],
        correctIndex: 0,
        explanationCorrect: "To‘g‘ri! Bu chiziq kesish va aylantirish uchun yo‘l bo‘ladi.",
        explanationWrong: "Noto‘g‘ri. Yangi nuqtadan bust pointga chiziq tortish shart."
      }
    case 2:
      return {
        mode: 'rotation' as const,
        question: "3-qadam: Parchani qanday harakat qilamiz?",
        options: [
          "Bust point atrofida aylantirib eski dartni yopamiz",
          "Parchani to‘liq ochib tashlaymiz"
        ],
        correctIndex: 0,
        explanationCorrect: "To‘g‘ri! Bust point pivot nuqtasi sifatida ishlatiladi.",
        explanationWrong: "Noto‘g‘ri. Biz parchani bust point atrofida aylantirishimiz kerak."
      }
    case 3:
      return {
        mode: 'final' as const,
        question: "4-qadam: Yakuniy shakl qanday bo‘lishi kerak?",
        options: [
          "Bodice umumiy shakli o‘zgarmasligi kerak",
          "Bodice kengayishi kerak"
        ],
        correctIndex: 0,
        explanationCorrect: "To‘g‘ri! Dart faqat joyini o‘zgartiradi, asosiy shakl saqlanadi.",
        explanationWrong: "Noto‘g‘ri. To‘g‘ri dart pivotda bodice umumiy shakli o‘zgarmasligi lozim."
      }
    case 4:
      return {
        mode: 'principle' as const,
        question: "5-qadam: Dart pivot usulining asosiy qoidasi nima?",
        options: [
          "Dart faqat joyini o‘zgartiradi, shakl saqlanadi",
          "Har safar yangi dart yaratiladi"
        ],
        correctIndex: 0,
        explanationCorrect: "To‘g‘ri! Dart pivot usulida faqat joy o‘zgaradi, shakl saqlanadi.",
        explanationWrong: "Noto‘g‘ri. Asosiy qoida: dart faqat joyini o‘zgartiradi."
      }
    default:
      return null
  }
}

const stepData = computed(() => getStepData(currentStep.value))
const totalSteps = 5

function selectOption(index: number) {
  if (showFinal.value) return
  selectedOption.value = index
}

function handleNext() {
  if (showFinal.value) return
  const data = stepData.value
  if (!data) return

  if (selectedOption.value === null) {
    // Show a small inline hint instead of per-step feedback panel
    alert("Iltimos, bir variantni tanlang.")
    return
  }

  const isCorrect = selectedOption.value === data.correctIndex
  const explanation = isCorrect ? data.explanationCorrect : data.explanationWrong
  const userAnswer = data.options[selectedOption.value]
  const correctAnswer = data.options[data.correctIndex]

  if (isCorrect) score.value++

  answers.value.push({
    step: currentStep.value + 1,
    isCorrect,
    userAnswer,
    correctAnswer,
    explanation
  })

  // Move to next step or show final results
  if (currentStep.value < totalSteps - 1) {
    currentStep.value++
    selectedOption.value = null
  } else {
    showFinalScore()
  }
}

function showFinalScore() {
  showFinal.value = true
  const finalScore = Math.round((score.value / totalSteps) * 100)
  emit('finished', finalScore)
}

function resetGame() {
  currentStep.value = 0
  selectedOption.value = null
  score.value = 0
  answers.value = []
  showFinal.value = false
}
</script>

<template>
  <div class="rotate-puzzle-game">
    <!-- Header -->
    <header class="game-header">
      <h2>Dart Ko‘chirish Simulyatori</h2>
      <p v-if="config.instructions" class="subtitle">
        {{ config.instructions }}
      </p>
      <p v-else class="subtitle">
        Bu o‘yinda siz bodicedagi dartni boshqa joyga ko‘chirasiz. Har bir qadamda to‘g‘ri harakatni tanlang va vizual natijani kuzating.
      </p>
    </header>

    <!-- Final score screen -->
    <div v-if="showFinal" class="final-screen">
      <div class="score-line">
        Natija: {{ Math.round((score / totalSteps) * 100) }}/100
      </div>
      <p>Siz {{ totalSteps }} ta qadamdan {{ score }} tasini to‘g‘ri bajardingiz.</p>

      <div v-for="a in answers" :key="a.step" :class="['answer-item', { 'answer-correct': a.isCorrect, 'answer-wrong': !a.isCorrect }]">
        <div class="step-title">
          Qadam {{ a.step }}: {{ a.isCorrect ? 'To‘g‘ri' : 'Noto‘g‘ri' }}
        </div>
        <div v-if="!a.isCorrect" class="detail">
          Sizning javobingiz: {{ a.userAnswer }}<br />
          To‘g‘ri javob: {{ a.correctAnswer }}
        </div>
        <div class="explanation">{{ a.explanation }}</div>
      </div>

      <button class="btn-secondary mt-3" @click="resetGame">Qayta boshlash</button>
    </div>

    <!-- Game steps -->
    <template v-else-if="stepData">
      <div class="card">
        <div class="question-title">{{ stepData.question }}</div>

        <!-- SVG diagram per mode -->
        <svg viewBox="0 0 240 260" class="bodice-svg">
          <!-- Bodice outline -->
          <path
            d="M100,20 L145,30 C160,35 170,55 170,80
               C170,120 165,160 160,190 L140,210 L100,215
               L60,210 L40,190 C35,160 30,120 30,80
               C30,55 40,35 55,30 Z"
            fill="rgba(79,70,229,0.06)"
            stroke="#6366f1"
            stroke-width="2.5"
          />

          <!-- Bust point -->
          <circle cx="100" cy="110" r="4" fill="#ef4444" />
          <text x="110" y="107" font-size="9" fill="#111827">Bust Point</text>

          <!-- Original side dart -->
          <g v-if="stepData.mode === 'initial' || stepData.mode === 'cutLine'" class="side-dart">
            <polygon points="40,70 100,110 40,130" fill="rgba(239,68,68,0.15)" stroke="#ef4444" stroke-width="2" />
          </g>

          <!-- Cut line (shoulder point to bust point) -->
          <line v-if="stepData.mode === 'cutLine'" x1="145" y1="30" x2="100" y2="110" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="6,4" />

          <!-- Rotation arc -->
          <g v-if="stepData.mode === 'rotation'">
            <path d="M 145 30 Q 130 70 40 70" fill="none" stroke="#22c55e" stroke-width="2.5" />
          </g>

          <!-- Final: new shoulder dart -->
          <g v-if="stepData.mode === 'final'">
            <polygon points="130,30 145,30 100,110" fill="rgba(34,197,94,0.18)" stroke="#22c55e" stroke-width="2" />
          </g>

          <!-- Principle: both darts -->
          <g v-if="stepData.mode === 'principle'">
            <polygon points="40,70 100,110 40,130" fill="rgba(239,68,68,0.08)" stroke="#ef4444" stroke-width="2" />
            <polygon points="130,30 145,30 100,110" fill="rgba(34,197,94,0.08)" stroke="#22c55e" stroke-width="2" />
          </g>
        </svg>

        <!-- Options -->
        <div class="options">
          <button
            v-for="(opt, i) in stepData.options"
            :key="i"
            :class="['option-btn', { selected: selectedOption === i }]"
            @click="selectOption(i)"
          >
            {{ opt }}
          </button>
        </div>
      </div>

      <!-- Next button -->
      <div class="actions">
        <button class="btn-secondary" @click="resetGame">Qayta boshlash</button>
        <button class="btn-primary" @click="handleNext">Keyingi qadam</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.rotate-puzzle-game {
  font-size: 0.95rem;
  color: #111827;
}
.game-header h2 {
  margin: 0 0 4px;
  font-size: 1.3rem;
  color: #111827;
}
.subtitle {
  margin-top: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

/* Card */
.card {
  background: #f9fafb;
  border-radius: 14px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 6px 18px rgba(15,23,42,0.06);
}
.question-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #111827;
}

/* SVG */
.bodice-svg {
  width: 100%;
  max-width: 320px;
  height: auto;
  display: block;
  margin: 8px auto;
}

/* Options */
.options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}
.option-btn {
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  font-size: 0.8rem;
  cursor: pointer;
}
.option-btn:hover {
  border-color: #6366f1;
}
.option-btn.selected {
  border-color: #38bdf8;
  background: linear-gradient(to right, rgba(56,189,248,0.1), rgba(99,102,241,0.1));
  box-shadow: 0 0 14px rgba(56,189,248,0.25);
}

/* Actions */
.actions {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.btn-primary {
  padding: 10px 24px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(to right, #38bdf8, #6366f1);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary {
  padding: 9px 18px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
}

/* Final screen */
.final-screen {
  margin-top: 14px;
  padding: 12px;
  border-radius: 14px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}
.score-line {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 4px;
  color: #111827;
}
.answer-item {
  margin-top: 8px;
  padding: 8px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  font-size: 0.8rem;
}
.answer-correct {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.06);
}
.answer-wrong {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.06);
}
.step-title {
  font-weight: 600;
  margin-bottom: 2px;
  color: #111827;
}
.detail {
  color: #4b5563;
  font-size: 0.75rem;
  margin-bottom: 2px;
}
.explanation {
  color: #6b7280;
  font-size: 0.75rem;
}

.mt-3 {
  margin-top: 12px;
}
</style>
