<template>
  <div class="glossary-page">
    <!-- Back button -->
    <button class="btn-ghost btn-sm backbar" @click="goBack">
      ← Orqaga
    </button>

    <h1 class="page-title">Glossariy</h1>

    <!-- Search input -->
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Qidirish..."
      style="margin-bottom: 12px;"
    />

    <!-- Stage filter select -->
    <select
      v-model="selectedStage"
      class="stage-filter-select"
    >
      <option value="">Barcha bosqichlar</option>
      <option
        v-for="opt in stageOptions"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.title }}
      </option>
    </select>

    <!-- Terms list -->
    <div class="glossary-list">
      <div
        v-for="term in filteredTerms"
        :key="term.term"
        class="glossary-term-card"
      >
        <b>{{ term.term }}</b>
        <span>{{ term.definition }}</span>
        <div style="margin-top:4px; font-size:0.78rem; color:var(--accent);">
          {{ term.stageTitle }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContentStore } from '@/stores/content'

const router = useRouter()
const contentStore = useContentStore()

const searchQuery = ref('')
const selectedStage = ref<string | null>(null)

onMounted(async () => {
  await contentStore.loadTerms()
})

const stageOptions = computed(() => {
  const stages = [...new Set(contentStore.terms.map((t: { stageTitle: string }) => t.stageTitle))]
  return stages.map(s => ({ title: s, value: s }))
})

const filteredTerms = computed(() => {
  return contentStore.terms.filter((term: { term: string; definition: string; stageTitle: string }) => {
    const matchesSearch =
      term.term.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStage = !selectedStage.value || term.stageTitle === selectedStage.value
    return matchesSearch && matchesStage
  })
})

function goBack() {
  router.push({ name: 'stage-map' })
}
</script>

<style scoped>
.glossary-page {
  min-height: 100vh;
  padding: 20px 16px 40px;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 12px;
}

.backbar {
  margin-bottom: 16px;
}

.stage-filter-select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1.5px solid var(--line);
  font-size: 0.95rem;
  margin-bottom: 14px;
  background: #fff;
  color: var(--ink);
}

.stage-filter-select:focus {
  outline: 2px solid var(--accent-soft);
  border-color: var(--accent);
}
</style>
