<script setup lang="ts">
import { ref, computed } from 'vue'
import { watchEffect, nextTick, onMounted } from 'vue'

// Base skirt points (before spread)
const basePoints = {
  waistLeft:   { x: 100, y: 60 },
  waistMidL:   { x: 150, y: 60 },
  waistCenter: { x: 200, y: 60 },
  waistMidR:   { x: 250, y: 60 },
  waistRight:  { x: 300, y: 60 },

  hemLeft:     { x: 110, y: 420 },
  hemMidL:     { x: 170, y: 420 },
  hemCenter:   { x: 230, y: 420 },
  hemMidR:     { x: 290, y: 420 },
  hemRight:    { x: 350, y: 420 }
}

function updateSkirtShape() {
  const a = sliderA.value
  const b = sliderB.value
  const c = sliderC.value

  const spreadFactor = (v) => v / 100 * 40
  const sA = spreadFactor(a)
  const sB = spreadFactor(b)
  const sC = spreadFactor(c)

  // Deep copy points so basePoints is never mutated
  const p = {
    waistLeft:   { x: basePoints.waistLeft.x,   y: basePoints.waistLeft.y },
    waistMidL:   { x: basePoints.waistMidL.x,   y: basePoints.waistMidL.y },
    waistCenter: { x: basePoints.waistCenter.x, y: basePoints.waistCenter.y },
    waistMidR:   { x: basePoints.waistMidR.x,   y: basePoints.waistMidR.y },
    waistRight:  { x: basePoints.waistRight.x,  y: basePoints.waistRight.y },

    hemLeft:     { x: basePoints.hemLeft.x,     y: basePoints.hemLeft.y },
    hemMidL:     { x: basePoints.hemMidL.x,     y: basePoints.hemMidL.y },
    hemCenter:   { x: basePoints.hemCenter.x,   y: basePoints.hemCenter.y },
    hemMidR:     { x: basePoints.hemMidR.x,     y: basePoints.hemMidR.y },
    hemRight:    { x: basePoints.hemRight.x,    y: basePoints.hemRight.y }
  }

  // Move hem points outward based on sliders
  p.hemLeft.x     -= sA * 0.9
  p.hemMidL.x     -= (sA + sB) * 0.35
  p.hemCenter.x    += (sB - sC) * 0.1
  p.hemMidR.x     += (sB + sC) * 0.35
  p.hemRight.x    += sC * 0.9

  // Build skirt outline path
  const d = 'M ' + p.waistLeft.x + ' ' + p.waistLeft.y +
            ' L ' + p.waistMidL.x + ' ' + p.waistMidL.y +
            ' L ' + p.waistCenter.x + ' ' + p.waistCenter.y +
            ' L ' + p.waistMidR.x + ' ' + p.waistMidR.y +
            ' L ' + p.waistRight.x + ' ' + p.waistRight.y +

            ' Q ' + ((p.waistRight.x + p.hemRight.x) / 2 + 10) + ' ' + ((p.waistRight.y + p.hemRight.y) / 2) +
              ', ' + p.hemRight.x + ' ' + p.hemRight.y +

            ' L ' + p.hemMidR.x + ' ' + p.hemMidR.y +
            ' L ' + p.hemCenter.x + ' ' + p.hemCenter.y +
            ' L ' + p.hemMidL.x + ' ' + p.hemMidL.y +
            ' L ' + p.hemLeft.x + ' ' + p.hemLeft.y +

            ' Q ' + ((p.waistLeft.x + p.hemLeft.x) / 2 - 10) + ' ' + ((p.waistLeft.y + p.hemLeft.y) / 2) +
              ', ' + p.waistLeft.x + ' ' + p.waistLeft.y +

            ' Z'

  nextTick(() => {
    const mainSvg = document.getElementById('mainSvg')
    if (!mainSvg) return

    const skirtPath = mainSvg.querySelector('path')
    if (skirtPath) {
      skirtPath.setAttribute('d', d)
    }

    const lines = mainSvg.querySelectorAll('line')
    if (lines.length >= 3) {
      lines[0].setAttribute('x2', p.hemMidL.x)
      lines[1].setAttribute('x2', p.hemCenter.x)
      lines[2].setAttribute('x2', p.hemMidR.x)
    }
  })
}



const emit = defineEmits<{
  finished: [score: number]
}>()

// Slider values
const sliderA = ref(0)
const sliderB = ref(0)
const sliderC = ref(0)

// Watch slider changes and update skirt shape dynamically
watchEffect(() => {
  // Depend on sliders by reading them
  const _ = sliderA.value + sliderB.value + sliderC.value
  updateSkirtShape()
})

// Feedback state
const showFeedback = ref(false)
const feedbackItems = ref<
  { ok: boolean; text: string }[]
>([])
const finalScore = ref(0)

// Target ranges (can be overridden via config later if needed)
const targetRanges = {
  A: { min: 50, max: 70 },
  B: { min: 60, max: 80 },
  C: { min: 50, max: 70 }
}

// Status text based on average spread
const statusText = computed(() => {
  const avg = (sliderA.value + sliderB.value + sliderC.value) / 3
  if (avg < 20) return "Hozirgi holat: yubka deyarli to‘g‘ri (kengaytirilmagan)."
  if (avg < 50) return "Hozirgi holat: ozgina kengaygan, lekin hali yetarli emas."
  if (avg <= 90) return "Hozirgi holat: yubka ancha kengaygan — maqsadga yaqinlashtiring."
  return "Hozirgi holat: juda ko‘p ochilgan, ehtimol ortiqcha hajm."
})

function resetGame() {
  sliderA.value = 0
  sliderB.value = 0
  sliderC.value = 0
  showFeedback.value = false
  feedbackItems.value = []
  finalScore.value = 0
}

function checkAnswers() {
  const a = sliderA.value
  const b = sliderB.value
  const c = sliderC.value

  const inRange = (v: number, r: { min: number; max: number }) => v >= r.min && v <= r.max

  const okA = inRange(a, targetRanges.A)
  const okB = inRange(b, targetRanges.B)
  const okC = inRange(c, targetRanges.C)

  function scoreFor(v: number, r: { min: number; max: number }) {
    if (v >= r.min && v <= r.max) return 30
    const mid = (r.min + r.max) / 2
    const dist = Math.abs(v - mid)
    const penalty = Math.min(30, (dist - 10) * 2)
    return Math.max(0, 30 - penalty)
  }

  const totalScore = Math.round(
    Math.min(100, scoreFor(a, targetRanges.A) +
              scoreFor(b, targetRanges.B) +
              scoreFor(c, targetRanges.C))
  )

  finalScore.value = totalScore
  showFeedback.value = true
  feedbackItems.value = []

  if (okA) {
    feedbackItems.value.push({ ok: true, text: "Slash A: To'g'ri ochilgan — chap tomon hajmi mos." })
  } else {
    feedbackItems.value.push({ ok: false, text: "Slash A: Noto'g'ri. Maqsad: biroz kengroq yoki torroq sozlang." })
  }

  if (okB) {
    feedbackItems.value.push({ ok: true, text: "Slash B: Markaziy chiziq to'g'ri — muvozanat saqlangan." })
  } else {
    feedbackItems.value.push({ ok: false, text: "Slash B: Noto'g'ri. Markaziy ochilish maqsadga mos emas." })
  }

  if (okC) {
    feedbackItems.value.push({ ok: true, text: "Slash C: To'g'ri — o'ng tomon ham muvozanatli kengaygan." })
  } else {
    feedbackItems.value.push({ ok: false, text: "Slash C: Noto'g'ri. O'ng tomondagi hajm noto'g'ri sozlangan." })
  }

  if (totalScore >= 80) {
    feedbackItems.value.push({ ok: true, text: "Umumiy: Ajoyib! Siz slash-and-spread texnikasini yaxshi tushundingiz." })
  } else if (totalScore >= 50) {
    feedbackItems.value.push({ ok: false, text: "Umumiy: Yaxshi boshlang'ich. Qadamlarni biroz sozlab qayta urinib ko'ring." })
  } else {
    feedbackItems.value.push({ ok: false, text: "Umumiy: Hali yetarli emas. Maqsadli siluetga e'tibor berib qayta urining." })
  }

  emit('finished', totalScore)
}
</script>

<template>
  <div class="slash-spread-game">
    <header class="game-header">
      <h1 class="game-title">Slash & Spread Laboratoriyasi</h1>
      <p class="game-subtitle">Stage 6 — Slash-and-Spread Texnikasi</p>
      <div class="game-instructions">
        Bu o‘yinda siz yubka shaklini “slash-and-spread” usuli bilan kengaytirasiz.
        <br />
        Har bir kesilgan chiziq uchun slider orqali ochilish miqdorini sozlang va maqsadli siluetga yaqinlashtiring.
      </div>
    </header>

    <section class="card">
      <div class="section-title">1-qism — Yubkani kengaytirish</div>
      <p class="section-desc">
        Quyidagi yubka shaklida 3 ta slash chiziq bor. Har birini ochib, yubkani maqsadli hajmga yetkazing.
      </p>

      <!-- Workspace: SVG + target -->
      <div class="workspace">
        <!-- Main canvas with SVG skirt -->
        <div class="canvas-wrapper">
          <svg id="mainSvg" class="canvas-svg" viewBox="0 0 400 500">
            <!-- Skirt base shape (straight) -->
            <path d="M 100 60
                     L 150 60
                     L 200 60
                     L 250 60
                     L 300 60
                     Q 340 240, 350 420
                     L 290 420
                     L 230 420
                     L 170 420
                     L 110 420
                     Q 60 240, 100 60 Z"
                  fill="var(--bg-soft, #111827)" stroke="var(--accent, #6366f1)" stroke-width="2" />

            <!-- Slash A -->
            <line x1="150" y1="60" x2="170" y2="420"
                  stroke="var(--accent-soft, #38bdf8)" stroke-width="2" stroke-dasharray="6 4" />
            <text x="155" y="240" fill="var(--text-primary, #e5e7eb)" font-size="9">Slash A</text>

            <!-- Slash B -->
            <line x1="200" y1="60" x2="230" y2="420"
                  stroke="var(--accent-soft, #38bdf8)" stroke-width="2" stroke-dasharray="6 4" />
            <text x="205" y="240" fill="var(--text-primary, #e5e7eb)" font-size="9">Slash B</text>

            <!-- Slash C -->
            <line x1="250" y1="60" x2="290" y2="420"
                  stroke="var(--accent-soft, #38bdf8)" stroke-width="2" stroke-dasharray="6 4" />
            <text x="255" y="240" fill="var(--text-primary, #e5e7eb)" font-size="9">Slash C</text>
          </svg>
        </div>

        <!-- Target silhouette -->
        <div class="target-panel">
          <div class="target-title">Maqsadli siluet</div>
          <p class="target-desc">
            Yubka etagida kengroq, lekin muvozanatli shaklga ega bo‘lishi kerak.
          </p>

          <!-- Simple A-line target silhouette -->
          <svg id="targetSvg" class="target-svg" viewBox="0 0 200 300">
            <path d="M 40 10
                     L 80 10
                     Q 95 10, 100 20
                     L 160 270
                     Q 165 280, 150 280
                     L 40 280
                     Q 30 280, 35 270
                     Z"
                  fill="none" stroke="var(--accent, #6366f1)" stroke-width="2" />
            <text x="90" y="150" fill="var(--text-primary, #e5e7eb)" font-size="8">Maqsad: A-line</text>
          </svg>
        </div>
      </div>

      <!-- Sliders -->
      <div class="controls">
        <div class="slider-row">
          <span class="slider-label">Slash chiziq A (chap)</span>
          <input id="sliderA" type="range" min="0" max="100" v-model.number="sliderA">
          <span class="slider-value">{{ sliderA }}</span>
        </div>

        <div class="slider-row">
          <span class="slider-label">Slash chiziq B (markaz)</span>
          <input id="sliderB" type="range" min="0" max="100" v-model.number="sliderB">
          <span class="slider-value">{{ sliderB }}</span>
        </div>

        <div class="slider-row">
          <span class="slider-label">Slash chiziq C (o‘ng)</span>
          <input id="sliderC" type="range" min="0" max="100" v-model.number="sliderC">
          <span class="slider-value">{{ sliderC }}</span>
        </div>

        <div class="status-line">
          {{ statusText }}
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button class="btn-secondary" @click="resetGame">Qayta boshlash</button>
        <button class="btn-primary" @click="checkAnswers">Tekshirish</button>
      </div>

      <!-- Feedback area (shown after check) -->
      <section v-if="showFeedback" class="feedback-area">
        <div class="score-line">Natija: {{ finalScore }}/100</div>
        <ul class="feedback-list">
          <li v-for="(item, i) in feedbackItems" :key="i"
              class="feedback-item"
              :class="{ ok: item.ok, fail: !item.ok }">
            {{ item.text }}
          </li>
        </ul>
      </section>
    </section>
  </div>
</template>

<style scoped>
.slash-spread-game {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  color: var(--text-primary, #e5e7eb);
}

.game-header {
  margin-bottom: 10px;
}

.game-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  color: var(--accent, #6366f1);
}

.game-subtitle {
  font-size: 0.95rem;
  color: var(--muted, #6b7280);
  margin: 2px 0 4px;
}

.game-instructions {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-secondary, #9ca3af);
}

.section-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.section-desc {
  font-size: 0.95rem;
  color: var(--text-secondary, #9ca3af);
  margin-bottom: 8px;
}

.workspace {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.canvas-wrapper {
  background: radial-gradient(circle at center, #111827 0, #020817 100%);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  justify-content: center;
}

.canvas-svg {
  width: 100%;
  max-width: 320px;
  height: auto;
}

.target-panel {
  background: radial-gradient(circle at top, #111827 0, #020817 100%);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.target-title {
  font-weight: 600;
  margin-bottom: 2px;
  color: var(--accent, #6366f1);
}

.target-desc {
  font-size: 0.85rem;
  color: var(--text-secondary, #9ca3af);
  text-align: center;
  margin-bottom: 4px;
}

.target-svg {
  width: 100%;
  max-width: 160px;
  height: auto;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-label {
  font-size: 0.9rem;
  min-width: 140px;
}

input[type="range"] {
  flex: 1;
  accent-color: var(--accent, #6366f1);
}

.slider-value {
  min-width: 24px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary, #9ca3af);
}

.status-line {
  font-size: 0.85rem;
  color: var(--muted, #6b7280);
  margin-top: 4px;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.feedback-area {
  margin-top: 6px;
}

.score-line {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--accent, #6366f1);
}

.feedback-list {
  list-style: none;
  padding-left: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feedback-item.ok {
  color: var(--success, #22c55e);
}

.feedback-item.fail {
  color: var(--danger, #ef4444);
}

@media (max-width: 600px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  /* On mobile: target silhouette on top, canvas below */
  .target-panel {
    order: -1;
  }
}
</style>
