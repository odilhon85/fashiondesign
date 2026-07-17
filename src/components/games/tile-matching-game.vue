<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  config: {
    instructions: string
    gridCols: number
    gridRows: number
    repeatType?: string
    motifId?: string
  }
}>()

const emit = defineEmits<{
  finished: [score: number]
}>()

const placedTiles = ref<Array<{ row: number; col: number }>>([])
const showResult = ref(false)

function placeTile(row: number, col: number) {
  if (showResult.value) return
  const exists = placedTiles.value.some(t => t.row === row && t.col === col)
  if (!exists) {
    placedTiles.value.push({ row, col })
  }
}

function isPlaced(row: number, col: number) {
  return placedTiles.value.some(t => t.row === row && t.col === col)
}

function completeGame() {
  showResult.value = true
  // In fashion-design-academy.html: completing the pattern gives full score.
  emit('finished', 100)
}
</script>

<template>
  <div class="tile-matching-game">
    <p class="game-hint">{{ config.instructions }}</p>

    <div class="grid-area">
      <div v-for="row in config.gridRows" :key="'r' + row" class="grid-row">
        <div
          v-for="col in config.gridCols"
          :key="'c' + col"
          class="grid-cell"
          :class="{ placed: isPlaced(row, col) }"
          @click="placeTile(row, col)"
        >
          <span v-if="isPlaced(row, col)" class="check">✓</span>
        </div>
      </div>
    </div>

    <button class="btn-primary btn-block mt-2" @click="completeGame">
      Yakunlash
    </button>

    <p v-if="showResult" class="result-success">
      Repeat naqsh tayyor! 🎉
    </p>
  </div>
</template>

<style scoped>
.tile-matching-game {
  font-size: 0.95rem;
}
.game-hint {
  margin-bottom: 8px;
  color: var(--muted, #6b7280);
}
.grid-area {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}
.grid-row {
  display: flex;
  gap: 4px;
}
.grid-cell {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  border: 2px dashed #d1d5db;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
}
.grid-cell.placed {
  border-style: solid;
  background: var(--primary-soft, #eef2ff);
  color: var(--primary, #6366f1);
}
.check {
  font-weight: 700;
}
.result-success {
  margin-top: 4px;
  font-weight: 600;
  color: var(--good, #16a34a);
  text-align: center;
}
.mt-2 { margin-top: 4px; }
</style>
