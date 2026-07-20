<script setup lang="ts">
import { ref, computed } from 'vue'

interface Customer {
  id: string
  name: string
  meta: string
  desc: string
  bestOutfitId: string
}

interface Outfit {
  id: string
  label: string
  icon: string
  explanationCorrect: string
  explanationWrong: string
}

const props = defineProps<{
  config: {
    customers: Customer[]
    outfits: Outfit[]
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

const customersOrder = ref(shuffle(props.config.customers))
const outfitsOrder = ref(shuffle(props.config.outfits))

// assignments: customerId -> outfitId
const assignments = ref<Record<string, string>>({})
const selectedOutfitId = ref<string | null>(null)
const checked = ref(false)
const feedbackData = ref<{ ok: boolean; text: string }[]>([])

function assignOutfitToCustomer(customerId: string, outfitId: string) {
  if (checked.value) return
  // If this outfit is already used by another customer, remove it.
  for (const [cid, oid] of Object.entries(assignments.value)) {
    if (oid === outfitId && cid !== customerId) {
      delete assignments.value[cid]
    }
  }
  assignments.value[customerId] = outfitId
  selectedOutfitId.value = null
}

function removeAssignment(customerId: string) {
  if (checked.value) return
  delete assignments.value[customerId]
}

const usedOutfitIds = computed(() => new Set(Object.values(assignments.value)))

function checkAnswers() {
  const customers = props.config.customers
  const outfits = props.config.outfits
  let correctCount = 0
  const items: typeof feedbackData.value = []

  for (const c of customers) {
    const assignedOutfitId = assignments.value[c.id] || null
    const isCorrect = assignedOutfitId === c.bestOutfitId
    if (isCorrect) correctCount++

    const outfit = outfits.find(o => o.id === assignedOutfitId)
    const label = outfit ? outfit.label : 'Tanlanmagan'
    let explanation = ''

    if (!assignedOutfitId) {
      const best = outfits.find(o => o.id === c.bestOutfitId)!
      explanation = `Hech qanday libos tanlanmagan. Eng mos variant: ${best.label}.`
    } else if (isCorrect) {
      explanation = outfit.explanationCorrect
    } else {
      const best = outfits.find(o => o.id === c.bestOutfitId)!
      explanation = `${outfit.explanationWrong} To‘g‘ri variant: ${best.label}.`
    }

    items.push({
      ok: isCorrect,
      text: `${c.name}: ${label} — ${explanation}`
    })
  }

  feedbackData.value = items
  checked.value = true
  const score = Math.round((correctCount / customers.length) * 100)
  emit('finished', score)
}

function resetGame() {
  assignments.value = {}
  selectedOutfitId.value = null
  checked.value = false
  feedbackData.value = []
  customersOrder.value = shuffle(props.config.customers)
  outfitsOrder.value = shuffle(props.config.outfits)
}

// Drag-and-drop handlers
function onDragStart(event: MouseEvent, outfitId: string) {
  if (!(event instanceof DragEvent)) return
  event.dataTransfer.setData('text/plain', outfitId)
}

function onDrop(event: MouseEvent, customerId: string) {
  const drag = event as DragEvent
  drag.preventDefault()
  const outfitId = drag.dataTransfer.getData('text/plain')
  if (outfitId) assignOutfitToCustomer(customerId, outfitId)
}
</script>

<template>
  <div class="stylist-game">
    <!-- Customers -->
    <section class="customers-grid">
      <article
        v-for="c in customersOrder"
        :key="c.id"
        class="customer-card"
      >
        <header class="customer-header">
          <strong class="customer-name">{{ c.name }}</strong>
          <span class="customer-meta">{{ c.meta }}</span>
        </header>
        <p class="customer-desc">{{ c.desc }}</p>

        <!-- Drop zone -->
        <div
          class="drop-zone"
          @dragover.prevent
          @click="() => { if (selectedOutfitId) assignOutfitToCustomer(c.id, selectedOutfitId) }"
          @drop="(e: any) => onDrop(e, c.id)"
        >
          <template v-if="assignments[c.id]">
            <span class="assigned-chip">
              {{ config.outfits.find(o => o.id === assignments[c.id])?.icon }}
              {{ config.outfits.find(o => o.id === assignments[c.id])?.label }}
              <button
                v-if="!checked"
                class="remove-btn"
                @click.stop="() => removeAssignment(c.id)"
              >✕</button>
            </span>
          </template>
          <template v-else>
            <span class="muted">Libosni shu yerga tashlang</span>
          </template>
        </div>
      </article>
    </section>

    <!-- Outfits -->
    <aside class="outfits-panel">
      <h3 class="outfits-title">Libos variantlari:</h3>
      <div
        v-for="o in outfitsOrder"
        :key="o.id"
        draggable="true"
        @dragstart="(e: any) => onDragStart(e, o.id)"
        @click="() => { if (!usedOutfitIds.has(o.id)) selectedOutfitId = (selectedOutfitId === o.id ? null : o.id) }"
        class="outfit-card"
        :class="{
          'selected': selectedOutfitId === o.id,
          'used': usedOutfitIds.has(o.id)
        }"
      >
        <span class="outfit-icon">{{ o.icon }}</span>
        <span>{{ o.label }}</span>
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
.stylist-game {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .stylist-game {
    grid-template-columns: 1fr;
  }
}

.customers-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.customer-card {
  padding: 10px 12px;
  border-radius: 14px;
  background: #f5f5ff;
  border: 1px solid #e5e7eb;
}

.customer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.customer-name {
  font-size: 0.95rem;
}

.customer-meta {
  font-size: 0.75rem;
  color: #6b7280;
}

.customer-desc {
  font-size: 0.8rem;
  margin: 0 0 4px;
  color: #111827;
}

.drop-zone {
  min-height: 32px;
  border-radius: 14px;
  padding: 4px 8px;
  background: #f9fafb;
  border: dashed 1px #d1d5db;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #6b7280;
}

.assigned-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 14px;
  background: linear-gradient(to right, #2563eb, #7c3aed);
  color: #fff;
  font-size: 0.7rem;
}

.remove-btn {
  margin-left: 4px;
  cursor: pointer;
  opacity: 0.9;
  font-size: 0.8rem;
  border: none;
  background: transparent;
  color: #fff;
}

.outfits-panel {
  padding: 10px;
  border-radius: 14px;
  background: #f5f5ff;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.outfits-title {
  font-size: 0.9rem;
  margin-bottom: 2px;
}

.outfit-card {
  padding: 6px 8px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #d1d5db;
  font-size: 0.75rem;
  cursor: grab;
  display: flex;
  align-items: center;
  gap: 6px;
}

.outfit-card.selected {
  outline: 2px solid #38bdf8;
}

.outfit-card.used {
  opacity: 0.4;
  pointer-events: none;
}

.outfit-icon {
  width: 18px;
  height: 18px;
  border-radius: 14px;
  background: linear-gradient(to right, #38bdf8, #6366f1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;
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
  color: #fff;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #d1d5db;
  color: #111827;
}

.feedback-area {
  grid-column: 1 / -1;
  padding: 10px;
  border-radius: 999px;
  background: #f5f5ff;
  font-size: 0.8rem;
}

.score-line {
  margin-bottom: 6px;
  font-weight: 600;
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
  border-radius: 999px;
  background: #f9fafb;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.feedback-item.ok {
  border-left: solid 3px #16a34a;
}

.feedback-item.fail {
  border-left: solid 3px #dc2626;
}

.muted {
  color: #6b7280;
  font-size: 0.75rem;
}
</style>
