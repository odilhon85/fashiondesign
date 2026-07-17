import { defineStore } from 'pinia'

export interface StageProgress {
  unlocked: boolean
  lessonsRead: string[]
  quizCompleted: boolean
  gameCompleted: boolean
  completedAt?: number | null
  gameScore?: number
}

export interface GlossaryStats {
  seen: number
  correct: number
  lastResult: 'correct' | 'incorrect' | null
  difficultyScore: number // 0..1, higher = easier for user (more correct)
}

export const useProgressStore = defineStore('progress', {
  state: () => ({
    stages: {} as Record<string, StageProgress>,
    glossary: {
      termStats: {} as Record<string, GlossaryStats>,
      bestScorePercent: null as number | null,
    },
  }),

  getters: {
    overallPercent: (state) => {
      const allStages = state.stages ? Object.values(state.stages) : []
      if (!allStages.length) return 0

      let totalTasks = 0
      let doneTasks = 0

      for (const sp of allStages) {
        // lessonsRead + quizCompleted + gameCompleted as tasks.
        totalTasks += sp.lessonsRead.length + 1 + 1
        doneTasks += sp.lessonsRead.length
        if (sp.quizCompleted) doneTasks++
        if (sp.gameCompleted) doneTasks++
      }

      return totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
    },

    allCompleted: (state) => {
      const ids = ['stage-1', 'stage-2', 'stage-3', 'stage-4', 'stage-5', 'stage-6', 'stage-7', 'stage-8']
      if (!state.stages) return false
      return ids.every(id => {
        const sp = state.stages[id]
        return !!(sp?.unlocked && sp.quizCompleted && sp.completedAt)
      })
    },
  },

  actions: {
    ensureStage(stageId: string) {
      if (!this.stages) this.stages = {}
      if (!this.stages[stageId]) {
        this.stages[stageId] = {
          unlocked: false,
          lessonsRead: [],
          quizCompleted: false,
          gameCompleted: false,
        }
      }
    },

    unlockStage(stageId: string) {
      this.ensureStage(stageId)
      this.stages[stageId].unlocked = true
      this.persist()
    },

    markLessonRead(stageId: string, lessonId: string) {
      this.ensureStage(stageId)
      const sp = this.stages[stageId]
      if (!sp.lessonsRead.includes(lessonId)) {
        sp.lessonsRead.push(lessonId)
        this.persist()
      }
    },

    markQuizCompleted(stageId: string, _score?: number) {
      this.ensureStage(stageId)
      this.stages[stageId].quizCompleted = true
      this.persist()
    },

    // Call after quiz completion to finalize stage if all lessons are read.
    completeStageIfReady(stageId: string, totalLessons: number) {
      const sp = this.stages?.[stageId]
      if (!sp || !sp.quizCompleted) return
      if (sp.lessonsRead.length >= totalLessons && !sp.completedAt) {
        sp.completedAt = Date.now()
        this.persist()
      }
    },

    markGameCompleted(stageId: string, score?: number) {
      this.ensureStage(stageId)
      const sp = this.stages[stageId]
      sp.gameCompleted = true
      if (score != null) sp.gameScore = score
      this.persist()
    },

    // Mark a term as "seen" when its lesson is read, so it can be used in glossary tests.
    markTermSeen(term: string) {
      const t = this.glossary.termStats[term]
        ?? { seen: 0, correct: 0, lastResult: null, difficultyScore: 0 }
      if (t.seen === 0) {
        t.seen += 1
        this.glossary.termStats[term] = t
        this.persist()
      }
    },

    // Record a glossary test answer for a term.
    recordGlossaryAnswer(term: string, wasCorrect: boolean) {
      const t = this.glossary.termStats[term]
        ?? { seen: 0, correct: 0, lastResult: null, difficultyScore: 0 }
      if (t.seen === 0) t.seen += 1
      t.seen += 1
      if (wasCorrect) t.correct += 1
      t.lastResult = wasCorrect ? 'correct' : 'incorrect'
      t.difficultyScore = t.seen > 0 ? t.correct / t.seen : 0
      this.glossary.termStats[term] = t
      this.persist()
    },

    // Backwards-compatible with App.vue: updateGlossaryScore(score)
    updateGlossaryScore(percent: number) {
      if (typeof percent === 'number') {
        this.glossary.bestScorePercent = Math.max(
          this.glossary.bestScorePercent ?? 0,
          percent
        )
        this.persist()
      }
    },

    // Build a glossary test from known terms (like fashion-design-academy.html).
    buildGlossaryTest(allTerms: Array<{ term: string; definition: string }>) {
      const seenTerms = Object.keys(this.glossary.termStats).filter(
        t => this.glossary.termStats[t].seen > 0
      )

      if (seenTerms.length === 0) return []

      // Map definitions for quick lookup.
      const defMap = new Map<string, string>()
      for (const item of allTerms) {
        defMap.set(item.term, item.definition)
      }

      // Filter to terms that are both seen and have a definition.
      const available = seenTerms
        .filter(term => defMap.has(term))
        .map(term => ({
          term,
          ...this.glossary.termStats[term]
        }))

      if (available.length === 0) return []

      // Use up to 10 terms; prioritize weaker ones.
      const selected = available
        .sort((a, b) => (a.difficultyScore ?? 1) - (b.difficultyScore ?? 1))
        .slice(0, 10)

      // All definitions for generating wrong options.
      const allDefs = Array.from(defMap.entries())

      return selected.map((t, i) => {
        const correctDef = defMap.get(t.term)! || ''

        // Pick up to 3 different wrong definitions.
        const wrongOptions: string[] = []
        const usedIndices = new Set<number>()
        for (let attempts = 0; attempts < 20 && wrongOptions.length < 3; attempts++) {
          const idx = Math.floor(Math.random() * allDefs.length)
          if (usedIndices.has(idx)) continue
          const [term, def] = allDefs[idx]
          if (def === correctDef || term === t.term) continue
          usedIndices.add(idx)
          wrongOptions.push(def)
        }

        const options = [correctDef, ...wrongOptions].sort(() => Math.random() - 0.5)
        const answerIndex = options.indexOf(correctDef)

        return {
          id: `glossary-q-${i}`,
          type: 'mcq' as const,
          question: `"${t.term}" atamasi nimani anglatadi?`,
          options,
          answerIndex
        }
      })
    },

    // Helpers used by App.vue (compatibility)
    getStageProgress(stageId: string): StageProgress {
      return this.stages?.[stageId] ?? {
        unlocked: false,
        lessonsRead: [],
        quizCompleted: false,
        gameCompleted: false,
      }
    },

    isStageUnlocked(order: number): boolean {
      const ids = ['stage-1', 'stage-2', 'stage-3', 'stage-4', 'stage-5', 'stage-6', 'stage-7', 'stage-8']
      if (order <= 0 || order > ids.length) return false

      // If first stage, always unlocked.
      if (order === 1) {
        this.ensureStage(ids[0])
        if (!this.stages[ids[0]].unlocked) {
          this.unlockStage(ids[0])
        }
        return true
      }

      const prevId = ids[order - 2]
      const currId = ids[order - 1]
      this.ensureStage(currId)

      const prev = this.stages?.[prevId]
      if (!prev || !prev.unlocked) return false

      // Unlock current if previous is unlocked.
      this.unlockStage(currId)
      return true
    },

    getStagePercent(stage: { id: string; lessons?: Array<any>; quiz?: any }): number {
      const sp = this.stages?.[stage.id]
      if (!sp || !sp.unlocked) return 0

      const totalLessons = (stage.lessons?.length ?? 0) + (stage.quiz ? 1 : 0)
      let done = 0
      done += sp.lessonsRead.length
      if (sp.quizCompleted) done += 1

      return totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0
    },

    reset() {
      this.stages = {}
      this.glossary = { termStats: {}, bestScorePercent: null }
      this.persist()
    },

    persist() {
      try {
        localStorage.setItem(
          'fashion_academy_progress',
          JSON.stringify({ stages: this.stages, glossary: this.glossary })
        )
      } catch (e) {
        console.warn('Failed to persist progress:', e)
      }
    },

    // Alias for App.vue onMounted call.
    hydrate() {
      try {
        const raw = localStorage.getItem('fashion_academy_progress')
        if (!raw) return
        const data = JSON.parse(raw)
        if (data.stages) this.stages = data.stages
        if (data.glossary) this.glossary = data.glossary
      } catch (e) {
        console.warn('Failed to load progress:', e)
      }
    },
  },
})
