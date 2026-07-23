<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore } from '@/stores/content'
import { useProgressStore } from '@/stores/progress'
import QuizRunner from '@/components/quiz/QuizRunner.vue'

const route = useRoute()
const router = useRouter()
const contentStore = useContentStore()
const progressStore = useProgressStore()

const stageId = route.params.id as string
const stage = ref(contentStore.stages[stageId])
const loading = ref(!stage.value)

onMounted(async () => {
  if (!stage.value) {
    await contentStore.loadStage(stageId)
    stage.value = contentStore.stages[stageId]
    loading.value = false
  }
})

function goBack() {
  router.push({ name: 'stage-learn', params: { id: stageId } })
}

function onQuizFinished(score: number) {
  progressStore.recordQuizResult(stageId, score, stage.value?.quiz.passThreshold || 70)
}
</script>

<template>
  <div class="test-page">
    <!-- Back button -->
    <button class="btn-ghost btn-sm backbar" @click="goBack">
      ← Orqaga
    </button>

    <!-- Loading state -->
    <div v-if="loading" class="center-screen">
      <div class="spinner"></div>
    </div>

    <!-- Quiz content -->
    <div v-else>
      <h1 class="page-title">{{ stage?.title }} - Test</h1>
      <p class="subtitle mb-6">{{ stage?.description }}</p>

      <QuizRunner
        v-if="stage"
        :questions="stage.quiz.questions"
        :passThreshold="stage.quiz.passThreshold"
        @finished="onQuizFinished"
        :key="stage.id"
      />
    </div>
  </div>
</template>

<style scoped>
.test-page {
  min-height: 100vh;
  padding: 20px 16px 40px;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 4px;
}

.subtitle.mb-6 {
  color: var(--muted);
  margin-top: 2px;
  margin-bottom: 18px;
  font-size: 0.95rem;
}

.backbar {
  margin-bottom: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 4px solid var(--line);
  border-top-color: var(--accent);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
