<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  config: {
    instructions: string
    steps?: Array<{ question: string; options: string[] }>
  }
}>()

const emit = defineEmits<{
  finished: [score: number]
}>()

const decisions = ref<Record<string, string>>({})
const showPricing = ref(false)
const pricing = ref({ cost: 0, wholesale: 0, retail: 0 })

function calculatePricing() {
  // Simple fixed model like fashion-design-academy.html demo.
  pricing.value = {
    cost: 25,
    wholesale: 50,
    retail: 100
  }
  showPricing.value = true
}

function completeGame() {
  emit('finished', 100)
}
</script>

<template>
  <div class="brand-simulator-game">
    <p class="game-hint">{{ config.instructions }}</p>

    <div class="card-box">
      <p class="label">Brend Qarorlari</p>

      <div v-if="config.steps && config.steps.length" class="steps">
        <div v-for="(step, i) in config.steps" :key="i" class="step">
          <p class="question">{{ step.question }}</p>
          <div class="options">
            <button
              v-for="(opt, idx) in step.options"
              :key="idx"
              class="pill-btn"
              :class="{ active: decisions[step.question] === opt }"
              @click="decisions[step.question] = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>
      </div>

      <button class="btn-primary btn-block mt-2" @click="calculatePricing">
        Narxlarni hisoblash
      </button>
    </div>

    <div v-if="showPricing" class="pricing-box">
      <p class="label">Narx Strukturasi</p>
      <div class="row"><span>Tannarx:</span><span>${{ pricing.cost }}</span></div>
      <div class="row"><span>Wholesale:</span><span>${{ pricing.wholesale }}</span></div>
      <div class="row"><span>Retail:</span><span>${{ pricing.retail }}</span></div>

      <button class="btn-success btn-block mt-2" @click="completeGame">
        Brendni yakunlash
      </button>
    </div>
  </div>
</template>

<style scoped>
.brand-simulator-game {
  font-size: 0.95rem;
}
.game-hint {
  margin-bottom: 8px;
  color: var(--muted, #6b7280);
}
.card-box, .pricing-box {
  padding: 10px;
  border-radius: 14px;
  background: radial-gradient(circle at top left, rgba(99,102,241,0.06), #ffffff);
  border: 1px solid #e5e7eb;
}
.pricing-box {
  margin-top: 8px;
}
.label {
  font-weight: 600;
  margin-bottom: 6px;
}
.steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.step .question {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 4px;
}
.options {
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
.row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 2px;
}
.mt-2 { margin-top: 4px; }
</style>
