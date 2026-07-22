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
// Match prototype: 400x600 viewBox, forgiving tolerance
const svgWidth = 400
const svgHeight = 600
const toleranceRadiusPx = props.config.toleranceRadiusPx ?? 35

interface LandmarkTarget {
  id: string
  label: string
  xRatio: number // relative to SVG width (400)
  yRatio: number // relative to SVG height (600)
}

// Ideal positions for landmarks (front-view dress form) — same as prototype
const landmarkTargets: LandmarkTarget[] = [
  { id: 'center_front',   label: 'Center Front (CF)',          xRatio: 200 / 400, yRatio: 300 / 600 },
  { id: 'neck_point',     label: "Neck Point (Bo'yin nuqtasi)", xRatio: 200 / 400, yRatio: 85 / 600 },
  { id: 'shoulder_end',   label: 'Shoulder End (Yelka uchi)',   xRatio: 250 / 400, yRatio: 100 / 600 },
  { id: 'bust_point',     label: 'Bust Point (BP)',             xRatio: 230 / 400, yRatio: 175 / 600 },
  { id: 'waistline',      label: "Waistline (Bel chizig'i)",   xRatio: 200 / 400, yRatio: 280 / 600 },
  { id: 'hip_line',       label: "Hip Line (Son chizig'i)",    xRatio: 200 / 400, yRatio: 360 / 600 },
  { id: 'armhole_depth',  label: "Armhole Depth (Qo'l chuqurligi)", xRatio: 245 / 400, yRatio: 125 / 600 }
]

interface PlacedLandmark {
  id: string
  correct: boolean
  svgX: number // in SVG viewBox coords
  svgY: number
}

const placedLandmarks = ref<PlacedLandmark[]>([])
const currentTargetIndex = ref(0) // which landmark to place next
const feedbackText = ref<string>('')
const showFinal = ref(false)

// Part B: Ease selection (two visual cards like prototype)
type EaseChoice = 'tight' | 'correct' | null
const selectedEaseId = ref<EaseChoice>(null)

const currentTarget = computed(() => {
  if (currentTargetIndex.value >= landmarkTargets.length) return null
  const t = landmarkTargets[currentTargetIndex.value]
  // Match with config label if exists, else use built-in
  const cfgPoint = props.config.points.find(p => p.id === t.id)
  return { ...t, label: cfgPoint?.label ?? t.label }
})

function handleCanvasClick(e: MouseEvent) {
  if (showFinal.value || !currentTarget.value) return
  const svgEl = e.currentTarget as SVGElement
  const rect = svgEl.getBoundingClientRect()
  const scaleX = svgWidth / rect.width
  const scaleY = svgHeight / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  const target = currentTarget.value
  const idealX = target.xRatio * svgWidth
  const idealY = target.yRatio * svgHeight
  const dx = x - idealX
  const dy = y - idealY
  const dist = Math.sqrt(dx * dx + dy * dy)
  const correct = dist <= toleranceRadiusPx

  placedLandmarks.value.push({
    id: target.id,
    correct,
    svgX: x,
    svgY: y
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

function handleEaseSelect(choice: EaseChoice) {
  if (showFinal.value) return
  selectedEaseId.value = choice
}

// Check final answers and show score + feedback (like prototype)
function checkAnswers() {
  const totalLandmarks = landmarkTargets.length
  let correctLandmarks = 0
  const feedbackItems: Array<{ ok: boolean; text: string }> = []

  for (let i = 0; i < placedLandmarks.value.length; i++) {
    const p = placedLandmarks.value[i]
    if (p.correct) correctLandmarks++

    const lm = landmarkTargets.find(l => l.id === p.id)
    feedbackItems.push({
      ok: p.correct,
      text:
        lm.label + ": " +
          (p.correct ? "To'g'ri joylashtirildi" : "Noto'g'ri joylashtirildi")
    })
  }

  // Missing landmarks
  for (let i = placedLandmarks.value.length; i < totalLandmarks; i++) {
    const lm = landmarkTargets[i]
    feedbackItems.push({
      ok: false,
      text: lm.label + ": Belgilanmagan"
    })
  }

  // Ease part
  const easeCorrect = selectedEaseId.value === "correct"
  if (easeCorrect) {
    feedbackItems.push({
      ok: true,
      text: '"Ease" tanlovi: To\'g\'ri. Ikki barmoq qoidasi — matoda nafas olish va harakat uchun yetarli bo\'shliq bo\'ladi.'
    })
  } else if (selectedEaseId.value === "tight") {
    feedbackItems.push({
      ok: false,
      text: '"Ease" tanlovi: Noto\'g\'ri. Bu variant juda tor; ikki barmoq sig\'maydi, harakat cheklangan.'
    })
  } else {
    feedbackItems.push({
      ok: false,
      text: '"Ease" tanlovi: Tanlanmagan. To\'g\'ri javob — ozgina bo\'shliq (2 barmoq) varianti.'
    })
  }

  // Scoring:
  // - Each landmark: 10 points (7 * 10 = 70)
  // - Ease question: 30 points
  const scoreLandmarks = correctLandmarks * 10
  const scoreEase = easeCorrect ? 30 : 0
  const totalScore = Math.min(100, scoreLandmarks + scoreEase)

  showFinal.value = true
  feedbackText.value = "Natija: " + totalScore + "/100"
  emit('finished', totalScore)
}

// Build per-item feedback list for final UI (like prototype)
function getFeedbackItems(): Array<{ ok: boolean; text: string }> {
  const items: Array<{ ok: boolean; text: string }> = []
  const totalLandmarks = landmarkTargets.length

  for (let i = 0; i < placedLandmarks.value.length; i++) {
    const p = placedLandmarks.value[i]
    const lm = landmarkTargets.find(l => l.id === p.id)
    items.push({
      ok: p.correct,
      text:
        lm.label + ": " +
          (p.correct ? "To'g'ri joylashtirildi" : "Noto'g'ri joylashtirildi")
    })
  }

  for (let i = placedLandmarks.value.length; i < totalLandmarks; i++) {
    const lm = landmarkTargets[i]
    items.push({
      ok: false,
      text: lm.label + ": Belgilanmagan"
    })
  }

  const easeCorrect = selectedEaseId.value === "correct"
  if (easeCorrect) {
    items.push({
      ok: true,
      text: '"Ease" tanlovi: To\'g\'ri. Ikki barmoq qoidasi — matoda nafas olish va harakat uchun yetarli bo\'shliq bo\'ladi.'
    })
  } else if (selectedEaseId.value === "tight") {
    items.push({
      ok: false,
      text: '"Ease" tanlovi: Noto\'g\'ri. Bu variant juda tor; ikki barmoq sig\'maydi, harakat cheklangan.'
    })
  } else {
    items.push({
      ok: false,
      text: '"Ease" tanlovi: Tanlanmagan. To\'g\'ri javob — ozgina bo\'shliq (2 barmoq) varianti.'
    })
  }

  return items
}

function resetGame() {
  placedLandmarks.value = []
  currentTargetIndex.value = 0
  feedbackText.value = ''
  showFinal.value = false
  selectedEaseId.value = null
}
</script>

<template>
  <div class="point-placement-game">
    <!-- Header (matches prototype) -->
    <header class="game-header">
      <h1>Draping Xaritasi</h1>
      <p class="subtitle">Stage 5 — Draping Asoslari</p>
      <div class="instructions">
        Bu o‘yinda old ko'rinishdagi drapier manekenidagi asosiy nuqtalarni aniqlashingiz va to'g'ri “ease” (bo'shliq) tushunchasini qo'llashingiz kerak.
        <br>
        1-qism: Har bir nuqtani ketma-ket tanlang va maneken ustiga bosing.
        <br>
        2-qism: Ikkita variantdan to‘g‘ri “ease” ni tanlang.
      </div>
    </header>

    <!-- Game area (grid layout like prototype) -->
    <div class="game-area">
      <!-- Part A: Landmark placement -->
      <section class="section-card">
        <div class="section-title">1-qism — Asosiy nuqtalarni belgilash</div>
        <div class="section-desc">
          Quyidagi ro'yxatdan keyingi nuqtani tanlang, so'ngra maneken ustiga bosing. Qo'shimcha chiziqlar sizga taxminiy joylashuvni ko'rsatadi.
        </div>

        <!-- Dress form wrapper -->
        <div class="dress-form-wrapper">
          <svg
            class="dress-form-canvas"
            viewBox="0 0 400 600"
            @click="handleCanvasClick"
          >
            <!-- Simple mannequin outline (front view) -->
            <defs>
              <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#e5e7eb"/>
                <stop offset="100%" stop-color="#9ca3af"/>
              </linearGradient>
            </defs>

            <!-- Head -->
            <ellipse cx="200" cy="40" rx="28" ry="36" fill="url(#bodyGrad)" />

            <!-- Neck -->
            <rect x="185" y="70" width="30" height="20" rx="4" fill="url(#bodyGrad)" />

            <!-- Torso outline (simplified) -->
            <path d="M 160 90
              Q 140 100, 135 130
              Q 128 170, 130 210
              Q 132 250, 140 280
              Q 150 310, 160 340
              L 160 420
              Q 160 470, 170 520
              L 230 520
              Q 240 470, 240 420
              L 240 340
              Q 250 310, 260 280
              Q 268 250, 270 210
              Q 272 170, 265 130
              Q 260 100, 240 90
              Z"
              fill="url(#bodyGrad)" />

            <!-- Center front line (guide) -->
            <line x1="200" y1="70" x2="200" y2="520"
                  stroke="var(--accent, #6366f1)"
                  stroke-width="1.5" stroke-dasharray="4 4" opacity="0.9"/>

            <!-- Guide lines for user orientation -->
            <g opacity="0.7">
              <!-- Bust level guide -->
              <line x1="120" y1="175" x2="280" y2="175"
                    stroke="var(--accent, #6366f1)" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.6"/>
              <!-- Waistline guide -->
              <line x1="120" y1="280" x2="280" y2="280"
                    stroke="var(--accent, #6366f1)" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.6"/>
              <!-- Hip line guide -->
              <line x1="120" y1="360" x2="280" y2="360"
                    stroke="var(--accent, #6366f1)" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.6"/>
              <!-- Armhole depth guide -->
              <line x1="210" y1="125" x2="290" y2="125"
                    stroke="var(--accent, #6366f1)" stroke-width="1" stroke-dasharray="3 4" opacity="0.5"/>
              <!-- Shoulder end guide -->
              <line x1="210" y1="100" x2="290" y2="100"
                    stroke="var(--accent, #6366f1)" stroke-width="1" stroke-dasharray="3 4" opacity="0.5"/>
              <!-- Neck point guide -->
              <line x1="170" y1="85" x2="230" y2="85"
                    stroke="var(--accent, #6366f1)" stroke-width="1" stroke-dasharray="3 4" opacity="0.5"/>
            </g>

            <!-- Placed markers (SVG circles + labels like prototype) -->
            <g id="markersGroup">
              <template v-for="pl in placedLandmarks" :key="'c-' + pl.id">
                <circle
                  :cx="pl.svgX"
                  :cy="pl.svgY"
                  r="5"
                  :fill="pl.correct ? 'var(--good, #22c55e)' : 'var(--bad, #ef4444)'"
                />
              </template>
              <template v-for="(t, i) in landmarkTargets" :key="'l-' + t.id">
                <text
                  v-if="placedLandmarks[i]"
                  :x="placedLandmarks[i].svgX + 8"
                  :y="placedLandmarks[i].svgY - 6"
                  font-size="9"
                  :fill="placedLandmarks[i].correct ? 'var(--good, #22c55e)' : 'var(--bad, #ef4444)'"
                >
                  {{ t.label }}
                </text>
              </template>
            </g>
          </svg>
        </div>

        <!-- Landmarks list (pill-style like prototype) -->
        <div class="landmarks-list">
          <div
            v-for="(t, i) in landmarkTargets"
            :key="t.id"
            :class="[
              'landmark-item',
              placedLandmarks[i]
                ? (placedLandmarks[i].correct ? 'ok' : 'fail')
                : (i === currentTargetIndex ? 'pending' : '')
            ]"
          >
            <span>
              {{
                placedLandmarks[i]
                  ? (placedLandmarks[i].correct ? '✅' : '❌')
                  : (i === currentTargetIndex ? '⬜' : '⏳')
              }}
            </span>
            <span>{{ t.label }}{{ i === currentTargetIndex && !placedLandmarks[i] ? ' (hozirgi)' : '' }}</span>
          </div>
        </div>
      </section>

      <!-- Part B: Ease selection (visual cards like prototype) -->
      <section class="section-card">
        <div class="section-title">2-qism — “Ease” (bo‘shliq) tanlash</div>
        <div class="section-desc">
          Ko‘krak qismida ikkita variant ko‘rsatilgan. Qaysi biri to‘g‘ri “two-finger rule” ga mos keladi?
        </div>

        <div class="ease-options">
          <!-- Option A: Too tight -->
          <div
            :class="['ease-card', { selected: selectedEaseId === 'tight' }]"
            @click="handleEaseSelect('tight')"
          >
            <div class="ease-visual tight">
              Juda tor (ichkariga siqilgan)
            </div>
            <div>
              Matoni tanaga juda yaqin, deyarli hech qanday bo‘shliq yo‘q.
            </div>
          </div>

          <!-- Option B: Correct -->
          <div
            :class="['ease-card', { selected: selectedEaseId === 'correct' }]"
            @click="handleEaseSelect('correct')"
          >
            <div class="ease-visual correct">
              To‘g‘ri bo‘shliq (2 barmoq)
            </div>
            <div>
              Matoda ozgina bo‘shliq bor; qo‘lning 2 barmog‘i sig‘adi.
            </div>
          </div>
        </div>
      </section>

      <!-- Actions row -->
      <div class="actions">
        <button class="btn-secondary" @click="resetGame">Qayta boshlash</button>
        <button
          class="btn-primary"
          :disabled="currentTargetIndex < landmarkTargets.length || selectedEaseId == null"
          @click="checkAnswers"
        >
          Tekshirish
        </button>
      </div>

      <!-- Feedback area (final results like prototype) -->
      <section v-if="showFinal" class="feedback-area show">
        <div class="score-line">{{ feedbackText }}</div>
        <ul class="feedback-list">
          <li
            v-for="(item, i) in getFeedbackItems()"
            :key="i"
            :class="['feedback-item', item.ok ? 'ok' : 'fail']"
          >
            {{ item.ok ? '✅' : '❌' }} {{ item.text }}
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.point-placement-game {
  font-size: 0.95rem;
  color: var(--ink);
}

/* Header */
.game-header {
  text-align: center;
  margin-bottom: 16px;
}
.game-header h1 {
  margin: 0 0 4px;
  font-size: 1.5rem;
  color: var(--accent);
}
.subtitle {
  margin: 0 0 8px;
  font-size: 0.9rem;
  color: var(--muted);
}
.instructions {
  padding: 10px 12px;
  border-radius: var(--radius, 16px);
  background: var(--accent-soft, rgba(99,102,241,0.08));
  font-size: 0.85rem;
  color: var(--ink);
}

/* Game area grid */
.game-area {
  display: grid;
  gap: 16px;
}

/* Section card (Part A / Part B) */
.section-card {
  padding: 12px;
  border-radius: var(--radius, 16px);
  background: var(--paper, #0f172a);
  border: 1px solid var(--line, rgba(148,163,253,0.15));
  box-shadow: var(--shadow, 0 10px 30px rgba(15,23,42,0.7));
}
.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--ink);
}
.section-desc {
  font-size: 0.8rem;
  color: var(--muted);
  margin-bottom: 8px;
}

/* Dress form wrapper */
.dress-form-wrapper {
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 6px;
  border-radius: var(--radius, 16px);
  background: radial-gradient(circle at top, rgba(99,102,241,0.08), var(--paper, #0f172a));
  border: 1px solid var(--line, rgba(148,163,253,0.15));
}

/* Dress form canvas (SVG) */
.dress-form-canvas {
  width: 100%;
  height: auto;
  display: block;
  cursor: crosshair;
}
.landmarks-list {
  margin-top: 10px;
  display: grid;
  gap: 6px;
  font-size: 0.8rem;
}
.landmark-item {
  padding: 8px 10px;
  border-radius: 999px;
  background: var(--paper, #0f172a);
  display: flex;
  align-items: center;
  gap: 6px;
}
.landmark-item.pending {
  border-left: solid 3px var(--accent-soft, #818cf8);
}
.landmark-item.ok {
  border-left: solid 3px var(--good, #22c55e);
}
.landmark-item.fail {
  border-left: solid 3px var(--bad, #ef4444);
}
.ease-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 8px;
}
@media (max-width: 600px) {
  .ease-options {
    grid-template-columns: 1fr;
  }
}
.ease-card {
  padding: 10px;
  border-radius: var(--radius, 16px);
  background: var(--paper, #0f172a);
  border: 1px solid rgba(75,85,99,0.6);
  cursor: pointer;
  font-size: 0.8rem;
}
.ease-card.selected {
  border-color: var(--accent-soft, #38bdf8);
  box-shadow: 0 0 16px rgba(56,189,248,0.4);
}
.ease-visual {
  height: 70px;
  border-radius: 999px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: #e5e7eb;
}
.ease-visual.tight {
  background: linear-gradient(to right, #dc2626, #f97316);
}
.ease-visual.correct {
  background: linear-gradient(to right, var(--good, #22c55e), var(--accent-soft, #38bdf8));
}

.actions {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.btn-primary,
.btn-secondary {
  padding: 9px 18px;
  border-radius: 999px;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
}
.btn-primary {
  background: linear-gradient(to right, var(--accent-soft, #38bdf8), var(--accent, #6366f1));
  color: #020817;
  font-weight: 600;
}
.btn-secondary {
  border-radius: 999px;
  border: 1px solid rgba(148,163,253,0.3);
  background: transparent;
  color: var(--ink);
}

.feedback-area {
  margin-top: 18px;
  padding: 14px;
  border-radius: var(--radius, 16px);
  background: radial-gradient(circle at top, rgba(99,102,241,0.15), var(--paper, #0f172a));
  font-size: 0.85rem;
  color: var(--ink);
  display: none;
}
.feedback-area.show {
  display: block;
}
.score-line {
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 1rem;
  color: var(--accent);
}
.feedback-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 6px;
}
.feedback-item {
  padding: 8px 10px;
  border-radius: 999px;
  background: var(--paper, #0f172a);
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 6px;
}
.feedback-item.ok {
  border-left: solid 3px var(--good, #22c55e);
}
.feedback-item.fail {
  border-left: solid 3px var(--bad, #ef4444);
}
</style>
