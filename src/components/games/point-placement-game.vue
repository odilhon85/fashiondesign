<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  config: {
    instructions: string
    points: Array<{ id: string; label: string }>
    toleranceRadiusPx?: number
  }
}>()

const emit = defineEmits<{
  finished: [score: number]
}>()

const placedPoints = ref<string[]>([])
const showResult = ref(false)

function placePoint(id: string) {
  if (showResult.value) return
  if (!placedPoints.value.includes(id)) {
    placedPoints.value.push(id)
  }
}

function checkPoints() {
  const allPlaced = placedPoints.value.length === props.config.points.length
  showResult.value = true

  if (allPlaced) {
    emit('finished', 100)
  } else {
    // reset after short delay like fashion-design-academy.html behavior.
    setTimeout(() => {
      placedPoints.value = []
      showResult.value = false
    }, 1500)
  }
}

function getPointPosition(id: string): { x: number; y: number } {
  const positions: Record<string, { x: number; y: number }> = {
    cf: { x: 120, y: 20 },
    cb: { x: 120, y: 340 },
    bust: { x: 120, y: 90 },
    waist: { x: 120, y: 170 },
    hip: { x: 120, y: 230 },
    shoulder: { x: 80, y: 70 },
    armhole: { x: 60, y: 130 }
  }
  return positions[id] || { x: 40 + Math.random() * 160, y: 40 + Math.random() * 280 }
}
</script>

<template>
  <div class="point-placement-game">
    <p class="game-hint">{{ config.instructions }}</p>

    <div class="diagram-area">
      <div class="dress-form-diagram">
        <div
          v-for="point in config.points"
          :key="point.id"
          class="point-marker"
          :class="{ placed: placedPoints.includes(point.id) }"
          :style="{ left: getPointPosition(point.id).x + 'px', top: getPointPosition(point.id).y + 'px' }"
          @click="placePoint(point.id)"
        >
          <span class="dot"></span>
          <span class="label">{{ point.label }}</span>
        </div>
      </div>

      <button
        class="btn-primary btn-block mt-2"
        :disabled="placedPoints.length < config.points.length"
        @click="checkPoints"
      >
        Tekshirish
      </button>

      <p v-if="showResult && placedPoints.length === config.points.length" class="result-success">
        Barcha nuqtalar to'g'ri joylashtirildi! 🎉
      </p>
    </div>
  </div>
</template>

<style scoped>
.point-placement-game {
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
.dress-form-diagram {
  width: 240px;
  height: 380px;
  border-radius: 999px;
  border: 2px solid var(--primary, #6366f1);
  background: radial-gradient(circle at center, #eef2ff, #ffffff);
  position: relative;
}
.point-marker {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--primary, #6366f1);
  border: 2px solid #fff;
}
.point-marker.placed .dot {
  background: var(--good, #16a34a);
}
.label {
  color: #111827;
}
.result-success {
  margin-top: 4px;
  font-weight: 600;
  color: var(--good, #16a34a);
  text-align: center;
}
.mt-2 { margin-top: 4px; }
</style>
