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
  <div class="d-flex flex-column" style="min-height: 100vh; padding: 20px;">
    <v-container class="flex-grow-1">
      <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" class="mb-4" />

      <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 400px;">
        <v-progress-circular indeterminate color="primary" size="64" />
      </div>

      <div v-else>
        <h1 class="text-h3 font-weight-bold mb-2 animate-fade-in">
          {{ stage?.title }} - Test
        </h1>
        <p class="subtitle mb-6">{{ stage?.description }}</p>

        <QuizRunner
          v-if="stage"
          :questions="stage.quiz.questions"
          :passThreshold="stage.quiz.passThreshold"
          @finished="onQuizFinished"
          :key="stage.id"
        />
      </div>
    </v-container>
  </div>
</template>

<style scoped>
@import '@/glassmorphism.css';
</style>
