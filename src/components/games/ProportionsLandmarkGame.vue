<script setup lang="ts">
import { ref, computed } from 'vue'

interface Landmark {
  id: string
  label: string
  icon: string
  correctUnit: number // 1-9 on the 9-head scale
  explanationCorrect: string
  explanationWrong: string
}

const props = defineProps<{
  config: {
    landmarks: Landmark[]
  }
}>()

const emit = defineEmits<{
  finished: [score: number]
}>()

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const units = Array.from({ length: 9 }, (_, i) => i + 1) // 1..9
const landmarksOrder = ref(shuffle(props.config.landmarks))

// assignments: unit (1-9) -> landmarkId
const assignments = ref<Record<number, string>>({})
const selectedLandmarkId = ref<string | null>(null)
const checked = ref(false)
const feedbackData = ref<{ ok: boolean; text: string }[]>([])

function assignLandmarkToUnit(unit: number, landmarkId: string) {
  if (checked.value) return
  // If this landmark is already used in another unit, remove it.
  for (const [u, lid] of Object.entries(assignments.value)) {
    const numU = Number(u)
    if (lid === landmarkId && numU !== unit) {
      delete assignments.value[numU]
    }
  }

  // If another landmark was at this unit, allow overwrite.
  assignments.value[unit] = landmarkId
  selectedLandmarkId.value = null
}

function removeAssignment(unit: number) {
  if (checked.value) return
  delete assignments.value[unit]
}

const usedLandmarkIds = computed(() => new Set(Object.values(assignments.value)))

function checkAnswers() {
  const landmarks = props.config.landmarks
  let correctCount = 0
  const items: typeof feedbackData.value = []

  for (const lm of landmarks) {
    // Find where this landmark is placed
    let placedUnit: number | null = null
    for (const [u, lid] of Object.entries(assignments.value)) {
      if (lid === lm.id) {
        placedUnit = Number(u)
        break
      }
    }

    const isPlaced = placedUnit !== null
    const isCorrect = isPlaced && placedUnit === lm.correctUnit
    if (isCorrect) correctCount++

    let explanation = ''
    if (!isPlaced) {
      explanation = `Joylashtirilmagan. To‘g‘ri joy: ${lm.correctUnit}-bosh.`
    } else if (isCorrect) {
      explanation = lm.explanationCorrect
    } else {
      explanation = `${lm.explanationWrong} To‘g‘ri joy: ${lm.correctUnit}-bosh.`
    }

    items.push({
      ok: isCorrect,
      text: `${lm.label}: ${isPlaced ? placedUnit + '-bosh' : 'tanlanmagan'} — ${explanation}`
    })
  }

  feedbackData.value = items
  checked.value = true
  const score = Math.round((correctCount / landmarks.length) * 100)
  emit('finished', score)
}

function resetGame() {
  assignments.value = {}
  selectedLandmarkId.value = null
  checked.value = false
  feedbackData.value = []
  landmarksOrder.value = shuffle(props.config.landmarks)
}

// Drag-and-drop handlers
function onDragStart(event: MouseEvent, landmarkId: string) {
  if (!(event instanceof DragEvent)) return
  const dt = event.dataTransfer
  if (!dt) return
  dt.setData('text/plain', landmarkId)
}

function onDrop(event: MouseEvent, unit: number) {
  const drag = event as DragEvent
  drag.preventDefault()
  const dt = drag.dataTransfer
  if (!dt) return
  const landmarkId = dt.getData('text/plain')
  if (landmarkId) assignLandmarkToUnit(unit, landmarkId)
}
</script>

<template>
  <div class="proportions-game">
    <!-- Proportion grid -->
    <section class="grid-panel">
      <header class="panel-header">
        9-bosh shkalasi (nuqtalarni shu yerga tashlang):
      </header>

      <div class="grid-container">
        <!-- Each row: left label + right drop zone -->
        <div
          v-for="unit in units"
          :key="'row-' + unit"
          class="scale-row"
        >
          <div class="scale-label">{{ unit }}-bosh</div>
          <div
            class="drop-zone-cell"
            @dragover.prevent
            @click="() => { if (selectedLandmarkId) assignLandmarkToUnit(unit, selectedLandmarkId) }"
            @drop="(e: any) => onDrop(e, unit)"
          >
            <template v-if="assignments[unit]">
              <span class="assigned-chip">
                {{ config.landmarks.find(l => l.id === assignments[unit])?.icon }}
                <span class="chip-label">{{ config.landmarks.find(l => l.id === assignments[unit])?.label }}</span>
                <button
                  v-if="!checked"
                  class="remove-btn"
                  @click.stop="() => removeAssignment(unit)"
                >✕</button>
              </span>
            </template>
            <template v-else>
              <span class="muted">Shu yerga nuqtani tashlang</span>
            </template>
          </div>
        </div>
      </div>
    </section>

    <!-- Landmarks panel -->
    <aside class="landmarks-panel">
      <header class="panel-header">
        Tana nuqtalari (bittasini tortib tashlang):
      </header>

      <div
        v-for="lm in landmarksOrder"
        :key="lm.id"
        draggable="true"
        @dragstart="(e: any) => onDragStart(e, lm.id)"
        @click="() => { if (!usedLandmarkIds.has(lm.id)) selectedLandmarkId = (selectedLandmarkId === lm.id ? null : lm.id) }"
        class="landmark-card"
        :class="{
          'selected': selectedLandmarkId === lm.id,
          'used': usedLandmarkIds.has(lm.id)
        }"
      >
        <span class="landmark-icon">{{ lm.icon }}</span>
        <span>{{ lm.label }}</span>
      </div>
    </aside>

    <!-- Actions -->
    <section class="actions">
      <button class="btn-secondary" @click="resetGame">Qayta boshlash</button>
      <button
        v-if="!checked"
        class="btn-primary"
        :disabled="Object.keys(assignments).length === 0"
        @click="checkAnswers"
      >Tekshirish</button>
    </section>

    <!-- Feedback -->
    <section v-if="feedbackData.length" class="feedback-area">
      <div class="score-line">
        Natija: {{ Math.round((feedbackData.filter(f => f.ok).length / feedbackData.length) * 100) }}/100
      </div>
      <ul class="feedback-list">
        <li
          v-for="(item, i) in feedbackData"
          :key="i"
          class="feedback-item"
          :class="{ ok: item.ok, fail: !item.ok }"
        >
          {{ item.ok ? '✅' : '❌' }} {{ item.text }}
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.proportions-game {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  font-size: 0.95rem;
  color: #111827;
}

@media (max-width: 768px) {
  .proportions-game {
    grid-template-columns: 1fr;
  }
}

.panel-header {
  font-size: 0.9rem;
  margin-bottom: 8px;
  color: #111827;
}

/* Grid panel */
.grid-panel {
  padding: 10px;
  border-radius: 14px;
  background: #f5f5ff;
  border: 1px solid #e5e7eb;
}

.grid-container {
  min-height: 360px;
  background: #ffffff;
  border-radius: 14px;
  padding: 8px;
  display: grid;
  grid-template-rows: repeat(9, minmax(28px, auto));
  gap: 4px;
}

/* Each row: label + drop zone */
.scale-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.scale-label {
  width: 52px;
  flex-shrink: 0;
  font-size: 9px;
  color: #6b7280;
  display: flex;
  align-items: center;
}

.drop-zone-cell {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: 8px;
  background: #f9fafb;
  border: dashed 1px #d1d5db;
  font-size: 9px;
  color: #6b7280;
  flex-wrap: wrap;
  overflow: hidden;
}

.drop-zone-cell.over {
  border-color: #22c55e;
  background: rgba(34,197,94,0.06);
}

.assigned-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 8px;
  background: linear-gradient(to right, #2563eb, #7c3aed);
  font-size: 9px;
  color: #ffffff;
  flex: 1 1 auto;
  min-width: 0;
}

.remove-btn {
  margin-left: auto;
  cursor: pointer;
  opacity: 0.9;
  font-size: 10px;
  border: none;
  background: transparent;
  color: #ffffff;
}

.chip-label {
  display: inline-block;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Landmarks panel */
.landmarks-panel {
  padding: 10px;
  border-radius: 14px;
  background: #f5f5ff;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.landmark-card {
  padding: 7px 9px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  font-size: 11px;
  color: #111827;
  cursor: grab;
  display: flex;
  align-items: center;
  gap: 6px;
}

.landmark-card.selected {
  border-color: #38bdf8;
  box-shadow: 0 0 14px rgba(56,189,248,0.25);
}

.landmark-card.used {
  opacity: 0.4;
  pointer-events: none;
}

.landmark-icon {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: linear-gradient(to right, #38bdf8, #6366f1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
}

/* Actions */
.actions {
  grid-column: 1 / -1;
  margin-top: 4px;
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

/* Feedback */
.feedback-area {
  grid-column: 1 / -1;
  padding: 10px;
  border-radius: 14px;
  background: #f5f5ff;
  font-size: 13px;
  color: #111827;
}

.score-line {
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 15px;
}

.feedback-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 4px;
}

.feedback-item {
  padding: 6px 8px;
  border-radius: 12px;
  background: #f9fafb;
  font-size: 11px;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 4px;
}

.feedback-item.ok {
  border-left: solid 3px #22c55e;
}

.feedback-item.fail {
  border-left: solid 3px #ef4444;
}

.muted {
  color: #6b7280;
  font-size: 10px;
}
</style>
