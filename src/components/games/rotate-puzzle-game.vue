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

// Step states:
// 0 – original side dart shown
// 1 – guide line drawn (shoulder point → bust point)
// 2 – cut line highlighted
// 3 – side dart closed, shoulder dart opened
const currentStep = ref(0)
const showResult = ref(false)

function nextStep() {
  if (showResult.value) return
  if (currentStep.value < 3) {
    currentStep.value++
  } else {
    finishGame()
  }
}

function finishGame() {
  showResult.value = true
  emit('finished', 100)
}

const stepLabels = [
  "Boshlang'ich holat: yon dart ko'rsatilgan.",
  "1. Yangi nuqtadan (yelka) ko'krak nuqtasigacha chiziq torting.",
  "2. Bu chiziq bo‘ylab qirqing (ko‘krak nuqtasi — pivot).",
  "3. Yon dartni yoping → yelkada yangi dart ochiladi."
]

const stepHint = computed(() => {
  if (currentStep.value === 0) return "Boshlash uchun 'Keyingi qadam' tugmasini bosing."
  if (currentStep.value < 3) return "Davom etish uchun 'Keyingi qadam' tugmasini bosing."
  return "Jarayon yakunlandi. 'Yakunlash' tugmasini bosing."
})

// Use provided steps from config or fallback to built-in labels
const instructionText = computed(() => {
  if (props.config.instructions) return props.config.instructions
  return "Dartni yon tomondan yelkaga ko‘chiring — bodice shakli o‘zgarmasligini kuzating."
})
</script>

<template>
  <div class="rotate-puzzle-game">
    <p class="game-hint">{{ instructionText }}</p>

    <!-- Diagram -->
    <div class="diagram-area">
      <svg viewBox="0 0 240 360" class="bodice-svg">
        <!-- Bodice outline (simplified) -->
        <path
          d="M95,10
             C110,8 130,8 145,10
             L170,25
             C180,35 190,60 195,90
             L195,260
             C195,290 180,310 145,310
             L95,310
             C60,310 45,290 45,260
             L45,90
             C50,60 60,35 70,25
             Z"
          fill="#f5f5ff"
          stroke="var(--primary, #6366f1)"
          stroke-width="2.5"
        />

        <!-- Bust point (pivot) -->
        <circle cx="140" cy="110" r="4" fill="#ef4444" />
        <text x="150" y="113" font-size="9" fill="#6b7280">BP</text>

        <!-- Step 0: Original side dart (visible from start) -->
        <g :opacity="currentStep >= 3 ? 0.25 : 1">
          <polygon
            points="45,110 90,70 90,150"
            fill="#fde68a"
            stroke="#f59e0b"
            stroke-width="2"
          />
          <text x="55" y="113" font-size="8" fill="#7c2d12">Yon dart</text>
        </g>

        <!-- Step 1: Guide line from shoulder point to bust point -->
        <line
          v-if="currentStep >= 1"
          x1="160" y1="30"
          x2="140" y2="110"
          stroke="#3b82f6"
          stroke-width="2.5"
          stroke-dasharray="6,3"
        />

        <!-- Step 2: Highlight cut line -->
        <line
          v-if="currentStep >= 2"
          x1="160" y1="30"
          x2="140" y2="110"
          stroke="#ef4444"
          stroke-width="3.5"
        />

        <!-- Step 3: New shoulder dart (opened) -->
        <g v-if="currentStep >= 3">
          <polygon
            points="160,30 190,20 190,45"
            fill="#bbf7d0"
            stroke="#16a34a"
            stroke-width="2.5"
          />
          <text x="195" y="38" font-size="8" fill="#166534">Yangi dart</text>
        </g>

      </svg>

      <!-- Status text -->
      <p class="step-status">{{ stepLabels[currentStep] }}</p>
    </div>

    <!-- Controls -->
    <div class="controls">
      <button
        v-if="!showResult"
        class="btn-primary btn-block mt-2"
        @click="nextStep"
      >
        {{ currentStep === 3 ? "Jarayonni ko'rib chiqish" : "Keyingi qadam" }}
      </button>

      <button
        v-if="showResult || currentStep === 3"
        class="btn-success btn-block mt-2"
        @click="finishGame"
      >
        Yakunlash
      </button>
    </div>

    <!-- Hint -->
    <p class="hint-text">{{ stepHint }}</p>

    <!-- Success message -->
    <p v-if="showResult" class="result-success">
      Dart muvaffaqiyatli ko'chirildi! 🎉
    </p>
  </div>
</template>

<style scoped>
.rotate-puzzle-game {
  font-size: 0.95rem;
}
.game-hint {
  margin-bottom: 8px;
  color: var(--muted, #6b7280);
}
.diagram-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.bodice-svg {
  width: 180px;
  height: 270px;
}
.step-status {
  font-size: 0.9rem;
  color: #111827;
  text-align: center;
  margin-top: 4px;
}
.controls {
  width: 100%;
  max-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}
.hint-text {
  font-size: 0.8rem;
  color: var(--muted, #6b7280);
  text-align: center;
  margin-top: 2px;
}
.result-success {
  margin-top: 4px;
  font-weight: 600;
  color: var(--good, #16a34a);
  text-align: center;
}
.mt-2 { margin-top: 4px; }
</style>
