<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSessionStore } from './stores/session'
import { useContentStore } from './stores/content'
import { useProgressStore } from './stores/progress'
import QuizRunner from './components/quiz/QuizRunner.vue'
import GameRunner from './components/games/GameRunner.vue'

const session = useSessionStore()
const content = useContentStore()
const progress = useProgressStore()

onMounted(async () => {
  session.hydrate()
  progress.hydrate()
  if (session.isLoggedIn) {
    view.value = 'map'
  }
  await content.loadAllStages()
  await content.loadTerms()
})

const view = ref<'login'|'map'|'stage'|'glossary'|'certificate'>('login')
const currentStageId = ref<string | null>(null)
const stageTab = ref<'learn'|'play'|'test'>('learn')
const openLessonId = ref<string | null>(null)
const mobileMenuOpen = ref(false)

const nameInput = ref(session.name || '')

function login() {
  const n = (nameInput.value || '').trim()
  if (!n) return
  session.login(n)
  view.value = 'map'
}

function logout() {
  session.logout()
  view.value = 'login'
  currentStageId.value = null
  nameInput.value = ''
}

function resetProgress() {
  if (!confirm("Butun progressni o'chirmoqchimisiz? Bu qaytarib bo'lmmaydi.")) return
  progress.reset()
}

function stageProgress(stageId: string) {
  return progress.getStageProgress(stageId)
}

function isUnlocked(order: number) {
  return progress.isStageUnlocked(order)
}

function stagePercent(stage: any) {
  return progress.getStagePercent(stage)
}

function openStage(stage: any) {
  if (!isUnlocked(stage.order)) return
  currentStageId.value = stage.id
  stageTab.value = 'learn'
  openLessonId.value = null
  view.value = 'stage'
}

function goMap() {
  view.value = 'map'
  currentStageId.value = null
}

const currentStage = computed(() => content.getStage(currentStageId.value || ''))

function toggleLesson(lessonId: string) {
  if (!currentStageId.value) return
  openLessonId.value = openLessonId.value === lessonId ? null : lessonId
  const stage = currentStage.value
  if (stage && stage.lessons) {
    const lesson = stage.lessons.find((l: any) => l.id === lessonId)
    if (lesson?.terms) {
      for (const t of lesson.terms as Array<{ term: string }>) {
        progress.markTermSeen(t.term)
      }
    }
  }
  progress.markLessonRead(currentStageId.value, lessonId)
}

function onGameFinished(score: number) {
  if (!currentStageId.value) return
  progress.markGameCompleted(currentStageId.value, score)
  if (allCompleted.value) {
    setTimeout(() => { view.value = 'certificate' }, 600)
  }
}

function onQuizFinished(score: number) {
  if (!currentStageId.value) return
  const stage = currentStage.value
  const totalLessons = (stage?.lessons?.length ?? 0)
  progress.markQuizCompleted(currentStageId.value, score)
  progress.completeStageIfReady(currentStageId.value, totalLessons)
  if (allCompleted.value) {
    setTimeout(() => { view.value = 'certificate' }, 600)
  }
}

function openGlossaryTest() {
  const allTerms = content.getAllTerms || []
  glossaryQuestions.value = progress.buildGlossaryTest(allTerms)
  view.value = 'glossary'
}

// Mobile menu helpers
function onMobileGlossaryClick() {
  mobileMenuOpen.value = false
  openGlossaryTest()
}

function onMobileLogoutClick() {
  mobileMenuOpen.value = false
  logout()
}

function onGlossaryFinished(score: number) {
  progress.updateGlossaryScore(score)
}

const name = computed(() => session.name || '')
const overallPercent = computed(() => progress.overallPercent)
const allCompleted = computed(() => progress.allCompleted)
const stages = computed(() => content.getAllStages)

const glossaryQuestions = ref<any[]>([])
</script>

<template>
  <div>
    <div class="topbar" v-if="view!=='login'">
      <div class="brand" @click="goMap">Moda Dizayni Akademiyasi<span>8 bosqichlik interaktiv kurs</span></div>

      <!-- Desktop right side -->
      <div class="user-chip desktop-only">
        <span class="progress-pill">{{ overallPercent }}% tugallandi</span>
        <b>{{ name }}</b>
        <button class="btn-ghost btn-sm" @click="openGlossaryTest">Atamalar sinovi</button>
        <button class="btn-ghost btn-sm" @click="logout">Chiqish</button>
      </div>

      <!-- Mobile menu button -->
      <button class="mobile-menu-btn mobile-only" @click="mobileMenuOpen = !mobileMenuOpen">
        ☰
      </button>

      <!-- Mobile dropdown with overlay -->
      <template v-if="mobileMenuOpen">
        <div class="mobile-overlay mobile-only" @click="mobileMenuOpen=false"></div>
        <div class="mobile-menu mobile-only">
          <span class="progress-pill">{{ overallPercent }}% tugallandi</span>
          <b>{{ name }}</b>
          <button class="btn-ghost btn-sm full-width-btn" @click="onMobileGlossaryClick">Atamalar sinovi</button>
          <button class="btn-ghost btn-sm full-width-btn" @click="onMobileLogoutClick">Chiqish</button>
        </div>
      </template>
    </div>

    <main>
      <!-- LOGIN -->
      <div v-if="view==='login'" class="center-screen">
        <div class="card login-card">
          <img
            src="/assets/images/stage-1/hero.jpg"
            alt="Test image"
            style="width:100%; height:120px; object-fit:cover; border-radius:999px; margin-bottom:14px; display:block; background:#000;"
          />
          <h1>Xush kelibsiz! 🌸</h1>
          <p>Ismingizni kiriting, boshlaymiz</p>
          <input type="text" v-model="nameInput" placeholder="Ismingiz" @keyup.enter="login" autofocus>
          <button class="btn-primary btn-block" @click="login">Boshlash</button>
        </div>
      </div>

      <!-- STAGE MAP -->
      <div v-else-if="view==='map'">
        <h2 class="page-title">Salom, {{ name }}!</h2>
        <p class="subtitle">Quyidagi 8 bosqichdan birini tanlang.</p>
        <div class="stage-grid">
          <div v-for="stage in stages" :key="stage.id"
               class="stage-card"
               :class="{locked: !isUnlocked(stage.order), done: progress.stages[stage.id] && progress.stages[stage.id].completedAt}"
               @click="openStage(stage)">
            <div class="lock-icon" v-if="!isUnlocked(stage.order)">🔒</div>
            <div class="lock-icon" v-else-if="progress.stages[stage.id] && progress.stages[stage.id].completedAt">✅</div>

            <!-- Hero image inside card -->
            <img
              v-if="stage.heroImage"
              :src="stage.heroImage"
              alt="Stage hero"
              loading="lazy"
              class="stage-hero-img"
            />

            <div class="stage-num">{{ stage.order }}</div>
            <div class="stage-title">{{ stage.title }}</div>
            <div class="stage-desc">{{ stage.description }}</div>
            <div class="mini-bar"><div class="mini-bar-fill" :style="{width: stagePercent(stage)+'%'}"></div></div>
          </div>
        </div>
        <div style="text-align:center; margin-top:30px;">
          <button class="btn-secondary" @click="resetProgress">Progressni tozalash</button>
        </div>
      </div>

      <!-- STAGE DETAIL -->
      <div v-else-if="view==='stage' && currentStage">
        <div class="backbar"><button class="btn-ghost btn-sm" @click="goMap">← Bosqichlar xaritasi</button></div>

        <!-- Hero banner at top of stage -->
        <img
          v-if="currentStage.heroImage"
          :src="currentStage.heroImage"
          alt="Bosqich rasmi"
          loading="lazy"
          class="stage-hero-banner"
        />

        <h2 class="page-title">{{ currentStage.order }}-Bosqich: {{ currentStage.title }}</h2>
        <p class="subtitle">{{ currentStage.description }}</p>
        <div class="tabs">
          <div class="tab" :class="{active: stageTab==='learn'}" @click="stageTab='learn'">📖 O'rganish</div>
          <div class="tab" :class="{active: stageTab==='play'}" @click="stageTab='play'">🎮 O'yin</div>
          <div class="tab" :class="{active: stageTab==='test'}" @click="stageTab='test'">📝 Test</div>
        </div>

        <div v-if="stageTab==='learn'">
          <div v-for="lesson in currentStage.lessons" :key="lesson.id" class="lesson-item">
            <div class="lesson-head" @click="toggleLesson(lesson.id)">
              <div class="lesson-head-left">
                <div class="lesson-check" :class="{read: stageProgress(currentStage.id).lessonsRead.includes(lesson.id)}">
                  <span v-if="stageProgress(currentStage.id).lessonsRead.includes(lesson.id)">✓</span>
                </div>
                <b>{{ lesson.title }}</b>
              </div>
              <span>{{ openLessonId===lesson.id ? '▲' : '▼' }}</span>
            </div>
            <div class="lesson-body" v-if="openLessonId===lesson.id">
              <figure v-if="lesson.image" class="lesson-figure">
                <img :src="lesson.image" alt="Dars rasmi" loading="lazy" />
              </figure>
              <p>{{ lesson.body }}</p>
              <div class="exercise-box" v-if="lesson.exercise"><b>Amaliy mashq:</b> {{ lesson.exercise }}</div>
              <div v-if="lesson.terms && lesson.terms.length">
                <div style="margin-top:12px; font-size:0.85rem; color:var(--muted);">Yangi atamalar:</div>
                <span class="term-chip" v-for="t in lesson.terms" :key="t.term" :title="t.definition">{{ t.term }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="stageTab==='play'">
          <GameRunner :game="currentStage.game" @finished="onGameFinished" :key="currentStage.id" />
        </div>

        <div v-else-if="stageTab==='test'">
          <QuizRunner :questions="currentStage.quiz.questions" :passThreshold="currentStage.quiz.passThreshold" @finished="onQuizFinished" :key="currentStage.id" />
        </div>
      </div>

      <!-- GLOSSARY TEST -->
      <div v-else-if="view==='glossary'">
        <div class="backbar"><button class="btn-ghost btn-sm" @click="goMap">← Bosqichlar xaritasi</button></div>
        <h2 class="page-title">Atamalar Sinovi</h2>
        <p class="subtitle">Hozirgacha ochilgan bosqichlardagi barcha atamalar bo'yicha bilimingizni sinang.</p>
        <QuizRunner v-if="glossaryQuestions.length" :questions="glossaryQuestions" :passThreshold="70" @finished="onGlossaryFinished" />
        <p v-else>Hali yetarli atama mavjud emas.</p>
      </div>

      <!-- CERTIFICATE -->
      <div v-else-if="view==='certificate'" class="center-screen">
        <div class="certificate">
          <div class="stamp">🏆</div>
          <h1>Tabriklaymiz!</h1>
          <p>Siz Moda Dizayni Akademiyasining barcha 8 bosqichini muvaffaqiyatli tugatdingiz.</p>
          <div class="name">{{ name }}</div>
          <p style="color:var(--muted);">Endi o'z g'oyalaringizni real dunyoga olib chiqish vaqti keldi!</p>
          <button class="btn-primary" @click="goMap">Bosqichlarni qayta ko'rish</button>
        </div>
      </div>
    </main>

    <div class="footer-note" v-if="view!=='login'">Moda Dizayni Akademiyasi — barcha progress faqat shu brauzerda, localStorage'da saqlanadi.</div>
  </div>
</template>

<style>
@import './glassmorphism.css';
</style>
