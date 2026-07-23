<template>
  <div class="stage-map-page">
    <header class="map-header">
      <h1 class="page-title">Moda Dizayn Yo'riqnoma</h1>
      <p class="subtitle">
        {{ session.name ? `Xush kelibsiz, ${session.name}!` : "O'rganishni boshlang" }}
      </p>
    </header>

    <div class="stage-grid">
      <div
        v-for="stage in stages"
        :key="stage.id"
        :class="[
          'stage-card',
          { locked: !isStageUnlocked(stage.order) }
        ]"
        @click="goToStage(stage.id)"
      >
        <!-- Hero image -->
        <img
          v-if="stage.heroImage || stage.id === 'stage-1'"
          class="stage-hero-img"
          :src="stage.heroImage || '/assets/images/stage-1/hero.jpg'"
          alt="Stage hero"
          loading="lazy"
        />

        <div class="stage-num">{{ stage.order }}</div>

        <div class="stage-title">{{ stage.title }}</div>
        <div class="stage-desc">{{ stage.description }}</div>

        <!-- Status chip -->
        <div class="status-row">
          <span class="term-chip" :class="getStageStatusClass(stage)">
            {{ getStageStatus(stage) }}
          </span>
          <span v-if="!isStageUnlocked(stage.order)" class="lock-icon">🔒</span>
        </div>

        <!-- Mini progress bar -->
        <div class="mini-bar">
          <div
            class="mini-bar-fill"
            :style="{ width: getMiniBarWidth(stage) + '%' }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useProgressStore } from '@/stores/progress'
import { useContentStore } from '@/stores/content'
import { useRouter } from 'vue-router'

const session = useSessionStore()
const progress = useProgressStore()
const content = useContentStore()
const router = useRouter()

onMounted(async () => {
  await content.loadAllStages()
})

const stages = computed(() => content.getAllStages)

function isStageUnlocked(order: number): boolean {
  // Delegate to the store logic so it matches everywhere.
  return progress.isStageUnlocked(order)
}

function getStageStatus(stage: { id: string; order: number }): string {
  if (progress.stages[stage.id]?.completedAt) return 'Tugatildi'
  if (
    progress.stages[stage.id]?.quizCompleted &&
    !progress.stages[stage.id]?.completedAt
  )
    return 'Test tugatildi'
  if (progress.stages[stage.id]?.gameCompleted) return "O'ynalgan"
  if ((progress.stages[stage.id]?.lessonsRead?.length || 0) > 0)
    return 'Boshlandi'
  return 'Yangi'
}

function getStageStatusClass(stage: { id: string }): string {
  const s = progress.stages[stage.id]
  if (s?.completedAt) return 'status-done'
  if (s?.quizCompleted && !s.completedAt) return 'status-quiz'
  if (s?.gameCompleted) return 'status-game'
  return ''
}

function getMiniBarWidth(stage: { id: string }): number {
  const s = progress.stages[stage.id]
  if (!s || !stage.id) return 0
  // Very rough but enough for visual bar.
  let parts = 3
  let done = 0
  if (s.lessonsRead?.length > 0) done++
  if (s.gameCompleted) done++
  if (s.quizCompleted) done++
  return Math.round((done / parts) * 100)
}

function goToStage(stageId: string) {
  const stage = stages.value.find(s => s.id === stageId)
  if (!stage || !isStageUnlocked(stage.order)) return
  router.push({ name: 'stage', params: { id: stageId } })
}
</script>

<style scoped>
.stage-map-page {
  min-height: 100vh;
  padding: 40px 20px 60px;
}

.map-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 4px;
}

.subtitle {
  color: var(--muted);
  margin-top: 2px;
  margin-bottom: 6px;
  font-size: 0.95rem;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  margin-bottom: 4px;
}

.term-chip.status-done {
  background: #eaf5ec;
  color: var(--good);
}

.term-chip.status-quiz {
  background: #e7f0ff;
  color: #2b6cb0;
}

.term-chip.status-game {
  background: #fff8e1;
  color: #b5651d;
}

.lock-icon {
  font-size: 1rem;
  margin-left: auto;
}
</style>
