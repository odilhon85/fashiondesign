<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore } from '@/stores/content'
import { useProgressStore } from '@/stores/progress'
import GameRunner from '@/components/games/GameRunner.vue'

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

function onGameFinished(score: number) {
  const s = contentStore.stages[stageId]
  const totalLessons = (s?.lessons?.length ?? 0)
  progressStore.markGameCompleted(stageId, score)
  progressStore.completeStageIfReady(stageId, totalLessons)
  router.push({ name: 'stage-test', params: { id: stageId } })
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
          {{ stage?.title }} - O'yin
        </h1>
        <p class="subtitle mb-6">{{ stage?.description }}</p>

        <GameRunner
          v-if="stage"
          :game="stage.game"
          @finished="onGameFinished"
          :key="stage.id"
        />
      </div>
    </v-container>
  </div>
</template>

<style scoped>
@import '@/glassmorphism.css';
</style>
