<template>
  <div class="d-flex flex-column align-center justify-center" style="min-height: 100vh; padding: 20px;">
    <v-card class="glass-card pa-12 text-center" max-width="600">
      <v-icon icon="mdi-certificate" size="96" color="primary" class="mb-6 animate-float" />
      
      <h1 class="text-h2 font-weight-bold mb-4">
        Tabriklaymiz!
      </h1>
      
      <p class="text-h5 mb-6">
        Siz {{ session.name }} — Fashion Dizayn kursini muvaffaqiyatli tugatdingiz!
      </p>
      
      <v-divider class="my-6" />
      
      <div class="d-flex justify-center gap-8 mb-6">
        <div>
          <p class="text-h4 font-weight-bold">{{ progress.overallPercent }}%</p>
          <p class="text-body-1">Umumiy progress</p>
        </div>
        <v-divider vertical />
        <div>
          <p class="text-h4 font-weight-bold">{{ completedStages }}/8</p>
          <p class="text-body-1">Tugatilgan bosqichlar</p>
        </div>
      </div>
      
      <v-btn color="primary" size="large" @click="goToMap">
        Bosqich xaritasiga qaytish
      </v-btn>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useProgressStore } from '@/stores/progress'

const router = useRouter()
const session = useSessionStore()
const progress = useProgressStore()

const completedStages = computed(() => {
  return Object.values(progress.stages).filter(s => !!s.completedAt).length
})

function goToMap() {
  router.push({ name: 'stage-map' })
}
</script>