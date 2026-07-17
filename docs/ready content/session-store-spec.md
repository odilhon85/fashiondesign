# Local-Only Session & Progress — Spec + Implementation

No backend, no accounts. The person types their **name only** once; everything after that is read from `localStorage` on load, so reopening the same browser resumes exactly where they left off. A different browser/device starts fresh (expected, since this is intentionally local-only).

---

## 1. Data Model (what lives in localStorage)

Two keys, both plain JSON strings:

```
fashion_app_session   → { name, createdAt }
fashion_app_progress  → { ...per-stage progress, glossary stats, updatedAt }
```

### `fashion_app_session`
```json
{
  "name": "Madina",
  "createdAt": "2026-07-10T08:00:00.000Z"
}
```

### `fashion_app_progress`
```json
{
  "version": 1,
  "currentStageId": "stage-3",
  "stages": {
    "stage-1": {
      "lessonsRead": ["s1-l1", "s1-l2", "s1-l3"],
      "gameCompleted": true,
      "gameBestScore": 100,
      "quizBestScore": 83,
      "quizPassed": true,
      "completedAt": "2026-07-10T09:15:00.000Z"
    },
    "stage-2": { "lessonsRead": [], "gameCompleted": false, "gameBestScore": null, "quizBestScore": null, "quizPassed": false, "completedAt": null }
  },
  "glossary": {
    "termStats": {
      "Target Customer": { "seen": 3, "correct": 2, "lastResult": "correct" }
    },
    "bestScorePercent": 75
  },
  "updatedAt": "2026-07-10T09:15:00.000Z"
}
```

**Why two separate keys instead of one:** the session (name/identity) rarely changes, while progress writes frequently (every lesson view, every quiz answer). Keeping them separate avoids re-serializing the whole progress blob just to check "is someone logged in," and makes a future "log out / switch name" action trivial (clear one key, keep or wipe the other — your choice).

---

## 2. Login Flow

1. On app load, check `localStorage.getItem('fashion_app_session')`.
2. **If present and valid** → skip the name screen, go straight to the stage map, greet by name ("Xush kelibsiz, Madina!").
3. **If missing** → show a single-field "Ismingiz?" screen. On submit: write the session key, then proceed.
4. No password, no validation beyond "not empty." This is a name tag, not authentication.
5. Optional: a small "Ism emasmi? O'zgartirish" link in the nav lets her reset the name without wiping progress (only overwrites the session key).

---

## 3. Progress Rules

- **Lesson read:** mark when a lesson screen is opened (not just scrolled) — simplest reliable signal.
- **Game completed:** mark `gameCompleted: true` + store `gameBestScore` (keep the *best*, not the *last*, so replaying to improve never looks like a regression).
- **Quiz:** store `quizBestScore`; `quizPassed` flips true once any attempt clears the stage's `passThreshold` (from the stage JSON, e.g. 70%). Passing is what unlocks the next stage.
- **Stage completed:** all lessons read + game completed + quiz passed → set `completedAt`.
- **Glossary:** every answered glossary question updates `termStats[term]` (seen/correct/lastResult). Terms answered wrong should resurface sooner in future glossary sessions (simple weighting: sort candidate pool by `correct/seen` ascending before picking questions).

---

## 4. Pinia Store Implementation

```ts
// src/stores/session.ts
import { defineStore } from 'pinia'

const SESSION_KEY = 'fashion_app_session'

interface SessionState {
  name: string | null
  createdAt: string | null
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({ name: null, createdAt: null }),

  getters: {
    isLoggedIn: (state) => !!state.name,
  },

  actions: {
    hydrate() {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return
      try {
        const parsed = JSON.parse(raw)
        this.name = parsed.name ?? null
        this.createdAt = parsed.createdAt ?? null
      } catch {
        // corrupted value — ignore, treat as logged out
        localStorage.removeItem(SESSION_KEY)
      }
    },

    login(name: string) {
      const trimmed = name.trim()
      if (!trimmed) return
      this.name = trimmed
      this.createdAt = this.createdAt ?? new Date().toISOString()
      localStorage.setItem(SESSION_KEY, JSON.stringify({ name: this.name, createdAt: this.createdAt }))
    },

    renameOnly(newName: string) {
      // changes display name without touching progress
      this.login(newName)
    },

    logout() {
      // clears identity only; progress store is untouched unless caller also clears it
      this.name = null
      this.createdAt = null
      localStorage.removeItem(SESSION_KEY)
    },
  },
})
```

```ts
// src/stores/progress.ts
import { defineStore } from 'pinia'

const PROGRESS_KEY = 'fashion_app_progress'
const SCHEMA_VERSION = 1

interface StageProgress {
  lessonsRead: string[]
  gameCompleted: boolean
  gameBestScore: number | null
  quizBestScore: number | null
  quizPassed: boolean
  completedAt: string | null
}

interface TermStat {
  seen: number
  correct: number
  lastResult: 'correct' | 'incorrect' | null
}

interface ProgressState {
  version: number
  currentStageId: string
  stages: Record<string, StageProgress>
  glossary: {
    termStats: Record<string, TermStat>
    bestScorePercent: number | null
  }
  updatedAt: string | null
}

function emptyStage(): StageProgress {
  return { lessonsRead: [], gameCompleted: false, gameBestScore: null, quizBestScore: null, quizPassed: false, completedAt: null }
}

export const useProgressStore = defineStore('progress', {
  state: (): ProgressState => ({
    version: SCHEMA_VERSION,
    currentStageId: 'stage-1',
    stages: {},
    glossary: { termStats: {}, bestScorePercent: null },
    updatedAt: null,
  }),

  getters: {
    stageOrDefault: (state) => (stageId: string) => state.stages[stageId] ?? emptyStage(),

    isStageUnlocked: (state) => (stageOrder: number, stageIdByOrder: (n: number) => string) => {
      if (stageOrder === 1) return true
      const prevId = stageIdByOrder(stageOrder - 1)
      return state.stages[prevId]?.completedAt != null
    },

    overallPercent: (state) => {
      const stages = Object.values(state.stages)
      if (stages.length === 0) return 0
      const done = stages.filter((s) => s.completedAt != null).length
      return Math.round((done / 8) * 100)
    },
  },

  actions: {
    hydrate() {
      const raw = localStorage.getItem(PROGRESS_KEY)
      if (!raw) return
      try {
        const parsed = JSON.parse(raw)
        if (parsed.version === SCHEMA_VERSION) {
          Object.assign(this.$state, parsed)
        }
        // if version mismatch in the future: write a migration step here instead of discarding
      } catch {
        localStorage.removeItem(PROGRESS_KEY)
      }
    },

    persist() {
      this.updatedAt = new Date().toISOString()
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(this.$state))
    },

    ensureStage(stageId: string) {
      if (!this.stages[stageId]) this.stages[stageId] = emptyStage()
    },

    markLessonRead(stageId: string, lessonId: string) {
      this.ensureStage(stageId)
      const s = this.stages[stageId]
      if (!s.lessonsRead.includes(lessonId)) s.lessonsRead.push(lessonId)
      this.persist()
    },

    recordGameResult(stageId: string, score: number) {
      this.ensureStage(stageId)
      const s = this.stages[stageId]
      s.gameCompleted = true
      s.gameBestScore = Math.max(s.gameBestScore ?? 0, score)
      this.checkStageCompletion(stageId)
      this.persist()
    },

    recordQuizResult(stageId: string, scorePercent: number, passThreshold: number) {
      this.ensureStage(stageId)
      const s = this.stages[stageId]
      s.quizBestScore = Math.max(s.quizBestScore ?? 0, scorePercent)
      if (scorePercent >= passThreshold) s.quizPassed = true
      this.checkStageCompletion(stageId)
      this.persist()
    },

    checkStageCompletion(stageId: string) {
      const s = this.stages[stageId]
      if (s.gameCompleted && s.quizPassed && !s.completedAt) {
        s.completedAt = new Date().toISOString()
      }
    },

    recordGlossaryAnswer(term: string, wasCorrect: boolean) {
      const t = this.glossary.termStats[term] ?? { seen: 0, correct: 0, lastResult: null }
      t.seen += 1
      if (wasCorrect) t.correct += 1
      t.lastResult = wasCorrect ? 'correct' : 'incorrect'
      this.glossary.termStats[term] = t
      this.persist()
    },

    recordGlossaryTestScore(percent: number) {
      this.glossary.bestScorePercent = Math.max(this.glossary.bestScorePercent ?? 0, percent)
      this.persist()
    },

    resetAll() {
      // full wipe — use for a "start over" button, not on every logout
      localStorage.removeItem(PROGRESS_KEY)
      this.$reset()
    },
  },
})
```

```ts
// src/main.ts (relevant excerpt)
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useSessionStore } from './stores/session'
import { useProgressStore } from './stores/progress'

const app = createApp(App)
app.use(createPinia())

// hydrate BEFORE mounting so the router guard below sees correct state
const session = useSessionStore()
const progress = useProgressStore()
session.hydrate()
progress.hydrate()

app.mount('#app')
```

```ts
// src/router/guards.ts — redirect to the name screen if not logged in
import { useSessionStore } from '@/stores/session'

router.beforeEach((to) => {
  const session = useSessionStore()
  if (!session.isLoggedIn && to.name !== 'login') {
    return { name: 'login' }
  }
  if (session.isLoggedIn && to.name === 'login') {
    return { name: 'stage-map' }
  }
})
```

```vue
<!-- src/views/LoginView.vue -->
<template>
  <v-container class="d-flex align-center justify-center" style="min-height: 100vh">
    <v-card max-width="420" class="pa-6" elevation="4">
      <v-card-title class="text-h5 mb-2">Xush kelibsiz!</v-card-title>
      <v-card-subtitle class="mb-4">Ismingizni kiriting, boshlaymiz</v-card-subtitle>
      <v-form @submit.prevent="handleSubmit">
        <v-text-field v-model="name" label="Ismingiz" autofocus required />
        <v-btn type="submit" color="primary" block class="mt-4">Boshlash</v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const name = ref('')
const session = useSessionStore()
const router = useRouter()

function handleSubmit() {
  if (!name.value.trim()) return
  session.login(name.value)
  router.push({ name: 'stage-map' })
}
</script>
```

---

## 5. Practical Notes

- **Resuming on the same browser:** works automatically — `hydrate()` runs on app boot, reads both keys, and the router guard sends her straight past the login screen.
- **Different browser/device:** intentionally starts fresh, per your requirement (local-only, no sync). If cross-device sync becomes wanted later, the Spring Boot backend mentioned in the Project Overview is the natural next step — the store shape above barely changes, `persist()` would just also POST to an API.
- **Clearing data:** if the browser's site data is cleared (or private/incognito mode is used), both keys disappear and it behaves like a first-time visit. Worth a one-line note in the UI so it isn't confusing.
- **Multiple people, one browser:** not handled in v1 — `fashion_app_session` holds one name at a time. If needed later, keys could be namespaced by name (`fashion_app_progress__Madina`), but that's unnecessary complexity for a single-learner use case.