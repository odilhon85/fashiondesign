<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  config: {
    instructions?: string
    steps?: Array<{ id: number; label: string }>
    pieces?: Array<{ id: string; label: string; correctUnit: number }>
    gridUnits?: number
  }
}>()

const emit = defineEmits<{
  finished: [score: number]
}>()

// Detect mode:
// - "drag_build" (Croquis Quruvchi): pieces + gridUnits, user selects unit per piece.
// - "ordering_game": steps list, user orders them.
const isDragBuild = computed(() => Boolean(props.config.pieces?.length))
const isOrdering = computed(() => Boolean(props.config.steps?.length))

/* ---------- Drag Build (Croquis Quruvchi) ---------- */
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pieces = ref(
  shuffle(
    (props.config.pieces ?? []).map(p => ({
      id: p.id,
      label: p.label,
      correctUnit: p.correctUnit,
      chosenUnit: null as number | null
    }))
  )
)
const submitted = ref(false)
const maxUnit = computed(() => props.config.gridUnits ?? 9)

function submitDragBuild() {
  if (!allAssigned.value) return
  submitted.value = true
  const correctCount = pieces.value.filter(
    p => p.chosenUnit === p.correctUnit
  ).length
  const score = Math.round((correctCount / pieces.value.length) * 100)
  emit('finished', score)
}

function retryDragBuild() {
  submitted.value = false
  pieces.value = pieces.value.map(p => ({ ...p, chosenUnit: null }))
}

const allAssigned = computed(
  () => !isDragBuild.value || pieces.value.every(p => p.chosenUnit !== null)
)

/* ---------- Ordering Game (steps) ---------- */
const steps = props.config.steps ?? []
const placedOrder = ref<number[]>([])
const showResult = ref(false)

function selectStep(id: number) {
  if (showResult.value) return
  const idx = placedOrder.value.indexOf(id)
  if (idx === -1) {
    placedOrder.value.push(id)
  } else {
    placedOrder.value.splice(idx, 1)
    placedOrder.value.push(id)
  }
}

function checkCompletion() {
  const expected = steps.map(s => s.id)
  const isCorrect = JSON.stringify(expected) === JSON.stringify(placedOrder.value)
  showResult.value = true
  if (isCorrect) {
    emit('finished', 100)
  } else {
    setTimeout(() => {
      placedOrder.value = []
      showResult.value = false
    }, 1500)
  }
}
</script>

<template>
  <div class="drag-build-game">
    <!-- Drag Build (Croquis Quruvchi) -->
    <template v-if="isDragBuild">
      <p class="game-hint">{{ config.instructions }}</p>

      <div
        v-for="piece in pieces"
        :key="piece.id"
        class="order-item row"
        :class="{
          'item-correct': submitted && piece.chosenUnit === piece.correctUnit,
          'item-incorrect': submitted && piece.chosenUnit !== piece.correctUnit
        }"
      >
        <span class="label">{{ piece.label }}</span>
        <select
          :disabled="submitted"
          @change="piece.chosenUnit = Number(($event.target as HTMLSelectElement).value)"
          class="unit-select"
        >
          <option value="" selected disabled>Birlik?</option>
          <option v-for="n in maxUnit" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <button
        v-if="!submitted"
        class="btn-primary btn-block mt-2"
        :disabled="!allAssigned"
        @click="submitDragBuild"
      >
        Tekshirish
      </button>

      <button
        v-else
        class="btn-secondary btn-block mt-2"
        @click="retryDragBuild"
      >
        Qayta urinish
      </button>
    </template>

    <!-- Ordering Game (steps) -->
    <template v-if="isOrdering">
      <p class="game-hint">{{ config.instructions }}</p>

      <div class="ordering-area">
        <p class="text-sm mb-2">Tartibni tanlang (1 dan boshlab):</p>

        <div class="order-list">
          <div
            v-for="(id, index) in placedOrder"
            :key="id"
            class="step-chip"
          >
            {{ index + 1 }}. {{ steps.find(s => s.id === id)?.label }}
          </div>
        </div>

        <div class="steps-row">
          <button
            v-for="s in steps"
            :key="s.id"
            class="pill-btn"
            :class="{ active: placedOrder.includes(s.id) }"
            @click="selectStep(s.id)"
          >
            {{ s.label }}
          </button>
        </div>

        <button
          class="btn-primary btn-block mt-2"
          :disabled="placedOrder.length !== steps.length"
          @click="checkCompletion"
        >
          Tekshirish
        </button>

        <p v-if="showResult" class="result-success">
          Ajoyib! Tartib to'g'ri. 🎉
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.drag-build-game {
  font-size: 0.95rem;
}
.game-hint {
  margin-bottom: 8px;
  color: var(--muted, #6b7280);
}

/* Drag Build (Croquis Quruvchi) */
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 999px;
  background: #f9fafb;
  margin-bottom: 4px;
}
.label {
  font-size: 0.9rem;
}
.unit-select {
  padding: 4px 6px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #fff;
  font-size: 0.8rem;
}
.item-correct {
  outline: 2px solid var(--good, #16a34a);
  background: #ecfdf5;
}
.item-incorrect {
  outline: 2px solid var(--danger, #dc2626);
  background: #fef2f2;
}

/* Ordering Game */
.ordering-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.order-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.step-chip {
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--primary-soft, #eef2ff);
  font-size: 0.8rem;
  color: var(--primary, #6366f1);
}
.steps-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pill-btn {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  font-size: 0.8rem;
  cursor: pointer;
}
.pill-btn.active {
  background: var(--primary, #6366f1);
  color: #fff;
  border-color: var(--primary, #6366f1);
}
.result-success {
  margin-top: 4px;
  font-weight: 600;
  color: var(--good, #16a34a);
  text-align: center;
}
.text-sm { font-size: 0.9rem; }
.mb-2 { margin-bottom: 4px; }
.mt-2 { margin-top: 4px; }
</style>
