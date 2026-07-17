<template>
  <div class="d-flex flex-column" style="min-height: 100vh; padding: 40px 20px;">
    <v-container class="flex-grow-1">
      <v-row>
        <v-col cols="12" class="text-center mb-8">
          <h1 class="text-h2 font-weight-bold mb-2 animate-fade-in">
            Moda Dizayn Yo'riqnoma
          </h1>
          <p class="text-subtitle-1 text-medium-emphasis">
            {{ session.name ? `Xush kelibsiz, ${session.name}!` : 'O\'rganishni boshlang' }}
          </p>
        </v-col>
      </v-row>

      <v-row>
        <v-col
          v-for="stage in stages"
          :key="stage.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            :class="[
              'glass-card',
              'pa-6',
              'd-flex',
              'flex-column',
              'animate-scale-in',
              { 'opacity-50': !isStageUnlocked(stage.order) }
            ]"
            :elevation="0"
            @click="goToStage(stage.id)"
            style="cursor: pointer; height: 100%;"
          >
            <img
              v-if="stage.id === 'stage-1'"
              src="/assets/images/stage-1/hero.jpg"
              alt="Stage hero"
              loading="lazy"
              style="
                width: 100%;
                height: 120px;
                object-fit: cover;
                border-radius: 999px;
                margin-bottom: 8px;
                display: block;
              "
            />

            <img
              v-else-if="stage.heroImage"
              :src="stage.heroImage"
              alt="Stage hero"
              loading="lazy"
              style="
                width: 100%;
                height: 120px;
                object-fit: cover;
                border-radius: 999px;
                margin-bottom: 8px;
                display: block;
              "
            />
            <v-card-title class="text-h5 font-weight-bold pb-2">
              {{ stage.title }}
            </v-card-title>
            <v-card-subtitle class="flex-grow-1">
              {{ stage.description }}
            </v-card-subtitle>
            <v-card-actions class="justify-space-between">
              <v-chip
                :color="getStageStatusColor(stage)"
                size="small"
                variant="flat"
              >
                {{ getStageStatus(stage) }}
              </v-chip>
              <v-icon
                v-if="isStageUnlocked(stage.order)"
                icon="mdi-arrow-right"
              />
              <v-icon
                v-else
                icon="mdi-lock"
              />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
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

function isStageUnlocked(order: number) {
  if (order === 1) return true
  const prevId = `stage-${order - 1}`
  return progress.stages[prevId]?.completedAt != null
}

function getStageStatus(stage: { id: string, order: number }) {
  if (progress.stages[stage.id]?.completedAt) return 'Tugatildi'
  if (progress.stages[stage.id]?.quizCompleted && !progress.stages[stage.id]?.completedAt) return 'Test tugatildi'
  if (progress.stages[stage.id]?.gameCompleted) return 'O\'ynalgan'
  if (progress.stages[stage.id]?.lessonsRead.length > 0) return 'Boshlandi'
  return 'Yangi'
}

function getStageStatusColor(stage: { id: string }) {
  if (progress.stages[stage.id]?.completedAt) return 'success'
  if (progress.stages[stage.id]?.quizCompleted && !progress.stages[stage.id]?.completedAt) return 'info'
  if (progress.stages[stage.id]?.gameCompleted) return 'warning'
  return 'primary'
}

function goToStage(stageId: string) {
  router.push({ name: 'stage-learn', params: { id: stageId } })
}
</script>

<style scoped>
.opacity-50 {
  opacity: 0.5;
  pointer-events: none;
}
</style>