<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore } from '@/stores/content'
import { useProgressStore } from '@/stores/progress'
import GameRunner from '@/components/games/GameRunner.vue'
import QuizRunner from '@/components/quiz/QuizRunner.vue'
import MarkdownReader from '@/components/MarkdownReader.vue'

const route = useRoute()
const router = useRouter()
const contentStore = useContentStore()
const progressStore = useProgressStore()

const stageId = (route.params.id as string) || ''
const activeTab = ref<'learn' | 'play' | 'test' | 'reading'>('learn')
const openLessonId = ref<string | null>(null)

// Mapping from stage ID to markdown file in public/assets/data/stage-md/
const mdFileMap: Record<string, string> = {
  'stage-1': '/assets/data/stage-md/1-Bosqich_Dizayn_Nazariyasi_va_Sanoat.md',
  'stage-2': '/assets/data/stage-md/2-Bosqich_Croquis_va_Fashion_Illustration.md',
  'stage-3': '/assets/data/stage-md/3-Bosqich_Rang_Nazariyasi.md',
  'stage-4': '/assets/data/stage-md/4-Bosqich_Pattern_Making_Asoslari.md',
  'stage-5': '/assets/data/stage-md/5-Bosqich_Draping_Asoslari.md',
  'stage-6': '/assets/data/stage-md/6-Bosqich_Couture_va_Pattern_Magic.md',
  'stage-7': '/assets/data/stage-md/7-Bosqich_Tekstil_Dizayni.md',
  'stage-8': '/assets/data/stage-md/8-Bosqich_Sanoat_va_Biznes.md'
}

const fullReadingText = ref<string | null>(null)
const readingLoading = ref(false)

const stage = ref(contentStore.stages[stageId])
const loading = ref(!stage.value)

onMounted(async () => {
  if (!stage.value) {
    await contentStore.loadStage(stageId)
    stage.value = contentStore.stages[stageId]
  }
  loading.value = false

  // If route includes a tab hint (e.g. ?tab=test), respect it:
  const queryTab = route.query.tab as string | undefined
  if (['learn', 'play', 'test', 'reading'].includes(queryTab || '')) {
    activeTab.value = queryTab as any
  }

  // Load full reading markdown for this stage (optional, no progress impact)
  await loadFullReading(stageId)
})

async function loadFullReading(id: string) {
  const url = mdFileMap[id]
  if (!url) return
  try {
    readingLoading.value = true
    const res = await fetch(url)
    if (res.ok) {
      fullReadingText.value = await res.text()
    } else {
      fullReadingText.value = null
    }
  } catch {
    fullReadingText.value = null
  } finally {
    readingLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'stage-map' })
}

function toggleLesson(lessonId: string) {
  openLessonId.value = openLessonId.value === lessonId ? null : lessonId
  progressStore.markLessonRead(stageId, lessonId)

  // If all parts are now done (lessons + game + quiz), finalize stage.
  const s = contentStore.stages[stageId]
  if (s) {
    const totalLessons = (s.lessons?.length ?? 0)
    progressStore.completeStageIfReady(stageId, totalLessons)
  }
}

function onGameFinished(score: number) {
  // Only mark game as completed; do NOT finalize stage yet.
  progressStore.markGameCompleted(stageId, score)
}

function onQuizFinished(score: number) {
  const s = contentStore.stages[stageId]
  if (s) {
    progressStore.recordQuizResult(
      stageId,
      score,
      s.quiz?.passThreshold || 70
    )

    // Finalize stage only when all 3 parts are done:
    // lessons + game + quiz.
    const totalLessons = (s.lessons?.length ?? 0)
    progressStore.completeStageIfReady(stageId, totalLessons)
  }
}
</script>

<template>
  <div class="stage-page">
    <!-- Back button -->
    <button class="btn-ghost btn-sm backbar" @click="goBack">
      ← Orqaga
    </button>

    <!-- Loading state -->
    <div v-if="loading" class="center-screen">
      <div class="spinner"></div>
    </div>

    <!-- Main content -->
    <template v-else-if="stage">
      <h1 class="page-title">{{ stage.title }}</h1>
      <p class="subtitle mb-6">{{ stage.description }}</p>

      <!-- Hero image (if exists) -->
      <div
        v-if="stage.heroImage"
        style="margin-bottom: 18px; border-radius: 14px; overflow: hidden; background: #000;"
      >
        <img
          :src="stage.heroImage"
          alt="Bosqich rasmi"
          loading="lazy"
          style="width: 100%; height: 260px; object-fit: cover; display: block;"
        />
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          :class="['tab', activeTab === 'learn' ? 'active' : '']"
          @click="activeTab = 'learn'"
        >
          📖 O‘qish
        </button>
        <button
          :class="['tab', activeTab === 'play' ? 'active' : '']"
          @click="activeTab = 'play'"
        >
          🎮 O‘yin
        </button>
        <button
          :class="['tab', activeTab === 'test' ? 'active' : '']"
          @click="activeTab = 'test'"
        >
          ✅ Test
        </button>
        <button
          :class="['tab', activeTab === 'reading' ? 'active' : '']"
          @click="activeTab = 'reading'"
        >
          📚 To‘liq darslik
        </button>
      </div>

      <!-- LEARN TAB -->
      <section v-if="activeTab === 'learn'">
        <div v-if="stage.lessons && stage.lessons.length">
          <div v-for="lesson in stage.lessons" :key="lesson.id" class="lesson-item">
            <div class="lesson-head" @click="toggleLesson(lesson.id)">
              <div class="lesson-head-left">
                <div
                  :class="['lesson-check', progressStore.stages[stageId]?.lessonsRead?.includes(lesson.id) ? 'read' : '']"
                >
                  <span v-if="progressStore.stages[stageId]?.lessonsRead?.includes(lesson.id)">✓</span>
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
                <div style="margin-top:12px; font-size:0.85rem; color:var(--muted);">
                  Yangi atamalar:
                </div>
                <span
                  class="term-chip"
                  v-for="t in lesson.terms"
                  :key="t.term"
                  :title="t.definition"
                >
                  {{ t.term }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PLAY TAB -->
      <section v-if="activeTab === 'play'">
        <GameRunner
          :game="stage.game"
          @finished="onGameFinished"
          :key="stage.id + '-game'"
        />
      </section>

      <!-- TEST TAB -->
      <section v-if="activeTab === 'test'">
        <QuizRunner
          :questions="stage.quiz?.questions || []"
          :passThreshold="stage.quiz?.passThreshold || 70"
          @finished="onQuizFinished"
          :key="stage.id + '-quiz'"
        />
      </section>

      <!-- FULL READING TAB (optional, no progress impact) -->
      <section v-if="activeTab === 'reading'">
        <div class="full-reading-header">
          <p style="font-size:0.9rem; color:var(--muted); margin-bottom:8px;">
            Bu bosqich bo‘yicha to‘liq darslik (ixtiyoriy o‘qish). Ushbu qismni o‘qish yoki o‘qimaslik sizning progressingizga ta’sir qilmaydi.
          </p>
        </div>

        <div v-if="readingLoading" class="center-screen">
          <div class="spinner"></div>
        </div>

        <MarkdownReader
          v-else-if="fullReadingText"
          :source="fullReadingText"
        />

        <div v-else style="padding:16px; color:var(--muted); font-size:0.9rem;">
          Hozircha bu bosqich uchun to‘liq darslik hali yuklanmagan. Tez orada qo‘shiladi.
        </div>
      </section>
    </template>

    <!-- Fallback if stage not found -->
    <div v-else class="center-screen">
      <p>Bu bosqich topilmadi.</p>
      <button class="btn-primary" @click="goBack">Bosqichlar xaritasiga qaytish</button>
    </div>
  </div>
</template>

<style scoped>
.stage-page {
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

/* Spinner */
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

.lesson-check {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  flex-shrink: 0;
  border: 1.5px solid var(--line, #d1d5db);
  color: transparent;
}

.lesson-check.read {
  background: var(--good, #16a34a);
  color: #fff;
  border-color: var(--good, #16a34a);
}
</style>
