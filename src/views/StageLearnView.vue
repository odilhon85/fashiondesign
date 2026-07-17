<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore } from '@/stores/content'
import { useProgressStore } from '@/stores/progress'

const route = useRoute()
const router = useRouter()
const contentStore = useContentStore()
const progressStore = useProgressStore()

const stageId = route.params.id as string
const stage = ref(contentStore.stages[stageId])
const loading = ref(!stage.value)
const openLessonId = ref<string | null>(null)

onMounted(async () => {
  if (!stage.value) {
    await contentStore.loadStage(stageId)
    stage.value = contentStore.stages[stageId]
    loading.value = false
  }
})

function goBack() {
  router.push({ name: 'stage-map' })
}

function toggleLesson(lessonId: string) {
  openLessonId.value = openLessonId.value === lessonId ? null : lessonId
  progressStore.markLessonRead(stageId, lessonId)
}

function goToGame() {
  router.push({ name: 'stage-play', params: { id: stageId } })
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
          {{ stage?.title }}
        </h1>
        <p class="subtitle mb-6">{{ stage?.description }}</p>

        <!-- Hero image -->
        <div
          v-if="stageId === 'stage-1' || stage?.heroImage"
          style="
            margin-bottom: 18px;
            border-radius: 14px;
            overflow: hidden;
            background: #000;
          "
        >
          <img
            v-if="stageId === 'stage-1'"
            src="/assets/images/stage-1/hero.jpg"
            alt="Bosqich rasmi"
            loading="lazy"
            style="
              width: 100%;
              height: 260px;
              object-fit: cover;
              display: block;
            "
          />

          <img
            v-else-if="stage?.heroImage"
            :src="stage.heroImage"
            alt="Bosqich rasmi"
            loading="lazy"
            style="
              width: 100%;
              height: 260px;
              object-fit: cover;
              display: block;
            "
          />
        </div>

        <!-- Lessons accordion (fashion-design-academy.html style) -->
        <div v-if="stage?.lessons && stage.lessons.length">
          <div v-for="lesson in stage.lessons" :key="lesson.id" class="lesson-item">
            <div class="lesson-head" @click="toggleLesson(lesson.id)">
              <div class="lesson-head-left">
                <div class="lesson-check read">
                  <span>✓</span>
                </div>
                <b>{{ lesson.title }}</b>
              </div>
              <span>{{ openLessonId === lesson.id ? '▲' : '▼' }}</span>
            </div>

            <div class="lesson-body" v-if="openLessonId === lesson.id">
              <!-- Lesson image -->
              <figure v-if="lesson.image" class="lesson-figure">
                <img :src="lesson.image" alt="Dars rasmi" loading="lazy" />
              </figure>

              <!-- Lesson content -->
              <p>{{ lesson.body }}</p>

              <!-- Exercise box -->
              <div class="exercise-box" v-if="lesson.exercise">
                <b>Amaliy mashq:</b> {{ lesson.exercise }}
              </div>

              <!-- Terms chips -->
              <div v-if="lesson.terms && lesson.terms.length">
                <div style="margin-top:12px; font-size:0.85rem; color:var(--muted);">Yangi atamalar:</div>
                <span class="term-chip" v-for="t in lesson.terms" :key="t.term" :title="t.definition">{{ t.term }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Go to game button -->
        <div style="margin-top:24px;">
          <button class="btn-primary btn-block" @click="goToGame">
            🎮 O'yin o'ynash
          </button>
        </div>
      </div>
    </v-container>
  </div>
</template>

<style scoped>
@import '@/glassmorphism.css';
</style>
