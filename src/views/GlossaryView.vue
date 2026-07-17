<template>
  <div class="d-flex flex-column" style="min-height: 100vh; padding: 20px;">
    <v-container class="flex-grow-1">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        @click="goBack"
        class="mb-4"
      />
      
      <h1 class="text-h3 font-weight-bold mb-6 animate-fade-in">
        Glossariy
      </h1>
      
      <v-text-field
        v-model="searchQuery"
        label="Qidirish"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        rounded="lg"
        class="mb-4"
      />
      
      <v-select
        v-model="selectedStage"
        :items="stageOptions"
        label="Bosqich bo'yicha filter"
        variant="outlined"
        rounded="lg"
        clearable
        class="mb-4"
      />
      
      <v-card class="glass-card pa-4">
        <v-list>
          <v-list-item
            v-for="term in filteredTerms"
            :key="term.term"
            class="mb-2"
          >
            <v-list-item-title class="font-weight-bold">
              {{ term.term }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ term.definition }}
            </v-list-item-subtitle>
            <v-list-item-subtitle class="text-primary mt-1">
              {{ term.stageTitle }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </v-container>
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
    const matchesSearch = term.term.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         term.definition.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStage = !selectedStage.value || term.stageTitle === selectedStage.value
    return matchesSearch && matchesStage
  })
})

function goBack() {
  router.push({ name: 'stage-map' })
}
</script>