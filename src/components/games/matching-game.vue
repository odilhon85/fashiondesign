<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  config: {
    pairs: Array<{ left: string; right: string }>
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

const pairs = props.config.pairs.map((p, i) => ({ id: i, left: p.left, right: p.right }))
const leftItems = ref(shuffle(pairs))
const rightItems = ref(shuffle(pairs))
const selectedLeft = ref<{id:number; left:string; right:string} | null>(null)
const matched = ref(new Set<number>())
const wrongFlashId = ref<number | null>(null)

function clickLeft(item: { id: number; left: string; right: string }) {
  if (matched.value.has(item.id)) return
  selectedLeft.value = item
}

function clickRight(item: { id: number; left: string; right: string }) {
  if (matched.value.has(item.id)) return
  if (!selectedLeft.value) return

  if (selectedLeft.value.id === item.id) {
    matched.value.add(item.id)
    // force reactivity
    matched.value = new Set(matched.value)
    selectedLeft.value = null
    if (matched.value.size === pairs.length) {
      emit('finished', 100)
    }
  } else {
    wrongFlashId.value = item.id
    setTimeout(() => { wrongFlashId.value = null }, 400)
    selectedLeft.value = null
  }
}

const done = computed(() => matched.value.size === pairs.length)
</script>

<template>
  <div class="matching-game">
    <p class="game-hint">Atamalar va tushuntirishlarni juftlashtiring.</p>

    <div class="match-columns">
      <div class="match-col">
        <div v-for="l in leftItems" :key="'l' + l.id"
             class="match-pill"
             :class="{ selected: selectedLeft && selectedLeft.id === l.id, matched: matched.has(l.id) }"
             @click="clickLeft(l)">
          {{ l.left }}
        </div>
      </div>

      <div class="match-col">
        <div v-for="r in rightItems" :key="'r' + r.id"
             class="match-pill match-right"
             :class="{ matched: matched.has(r.id), wrong: wrongFlashId === r.id }"
             @click="clickRight(r)">
          {{ r.right }}
        </div>
      </div>
    </div>

    <div v-if="done" class="game-success">Barcha juftlar topildi! 🎉</div>
  </div>
</template>

<style scoped>
.matching-game {
  font-size: 0.95rem;
}
.game-hint {
  margin-bottom: 8px;
  color: var(--muted, #6b7280);
}
.match-columns {
  display: flex;
  gap: 16px;
}
.match-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.match-pill {
  padding: 8px 10px;
  border-radius: 999px;
  background: #f5f5ff;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.15s ease;
}
.match-right {
  background: #fff7ed;
}
.selected {
  outline: 2px solid var(--primary, #6366f1);
  transform: translateX(2px);
}
.matched {
  opacity: 0.5;
  cursor: default;
}
.wrong {
  background: #fecaca !important;
  animation: shake 0.25s ease;
}
.game-success {
  margin-top: 8px;
  font-weight: 600;
  color: var(--good, #16a34a);
  text-align: center;
}

@keyframes shake {
  0% { transform: translateX(0) }
  25% { transform: translateX(-4px) }
  50% { transform: translateX(4px) }
  75% { transform: translateX(-3px) }
  100% { transform: translateX(0) }
}

@media (max-width: 600px) {
  .match-columns {
    flex-direction: column;
  }
}
</style>
