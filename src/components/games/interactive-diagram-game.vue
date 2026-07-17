<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  config: {
    instructions: string
    baseShape?: string
    slashLines: number
    maxSpreadCm: number
  }
}>()

const emit = defineEmits<{
  finished: [score: number]
}>()

const activeLines = ref<number[]>([])
const spreadValue = ref(0)
const showResult = ref(false)

function toggleLine(index: number) {
  const pos = activeLines.value.indexOf(index)
  if (pos === -1) {
    activeLines.value.push(index)
  } else {
    activeLines.value.splice(pos, 1)
  }
}

function completeDiagram() {
  showResult.value = true
  // In fashion-design-academy.html: completing the diagram gives full score.
  emit('finished', 100)
}
</script>

<template>
  <div class="interactive-diagram-game">
    <p class="game-hint">{{ config.instructions }}</p>

    <div class="diagram-area">
      <div class="bodice-panel">
        <div
          v-for="index in config.slashLines"
          :key="index"
          class="slash-line"
          :class="{ active: activeLines.includes(index - 1) }"
          @click="toggleLine(index - 1)"
        ></div>
      </div>

      <div class="slider-row">
        <label class="text-sm">Spread (cm)</label>
        <input
          type="range"
          min="0"
          :max="config.maxSpreadCm"
          v-model.number="spreadValue"
          class="slider"
        />
        <span class="text-xs text-muted">{{ spreadValue }} cm</span>
      </div>

      <button class="btn-primary btn-block mt-2" @click="completeDiagram">
        Yakunlash
      </button>

      <p v-if="showResult" class="result-success">
        Slash-and-spread amalga oshirildi! 🎉
      </p>
    </div>
  </div>
</template>

<style scoped>
.interactive-diagram-game {
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
  gap: 10px;
}
.bodice-panel {
  width: 180px;
  height: 240px;
  border-radius: 999px;
  border: 2px solid var(--primary, #6366f1);
  background: radial-gradient(circle at center, #eef2ff, #ffffff);
  position: relative;
  overflow: hidden;
}
.slash-line {
  position: absolute;
  left: 30px;
  top: 15px;
  width: 2px;
  height: 200px;
  background: #d1d5db;
  cursor: pointer;
}
.slash-line.active {
  background: var(--accent, #f59e0b);
}
.slider-row {
  width: 100%;
  max-width: 260px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.slider {
  flex: 1;
}
.result-success {
  margin-top: 4px;
  font-weight: 600;
  color: var(--good, #16a34a);
  text-align: center;
}
.text-sm { font-size: 0.9rem; }
.text-xs { font-size: 0.75rem; }
.text-muted { color: var(--muted, #6b7280); }
.mt-2 { margin-top: 4px; }
</style>
