import { defineStore } from 'pinia'

export interface Term {
  term: string
  definition: string
  stageId: string
  stageOrder: number
  stageTitle: string
  lessonId: string
}

export interface Lesson {
  id: string
  title: string
  image: string
  body: string
  exercise: string
  terms: Term[]
  keyTakeaways?: string[]
  estimatedTimeMinutes?: number
}

export interface Question {
  id: string
  type: 'mcq' | 'true_false'
  question: string
  options?: string[]
  answerIndex?: number
  answer?: boolean
}

export interface Stage {
  id: string
  order: number
  title: string
  description: string
  sourceFile: string
  heroImage: string
  lessons: Lesson[]
  quiz: {
    passThreshold: number
    questions: Question[]
  }
  game: {
    type: string
    title: string
    instructions: string
    config: any
  }
}

export const useContentStore = defineStore('content', {
  state: () => ({
    stages: {} as Record<string, Stage>,
    terms: [] as Term[],
  }),

  getters: {
    getStage: (state) => (stageId: string) => state.stages[stageId],
    getAllStages: (state) => Object.values(state.stages).sort((a, b) => a.order - b.order),
    getAllTerms: (state) => state.terms,
    getTermsByStage: (state) => (stageId: string) => state.terms.filter(t => t.stageId === stageId),
  },

  actions: {
    async loadStage(stageId: string) {
      if (this.stages[stageId]) return this.stages[stageId]
      
      try {
        const module = await import(`../content/${stageId}.json`)
        const stage = module.default || module
        this.stages[stageId] = stage
        return stage
      } catch (error) {
        console.error(`Failed to load stage ${stageId}:`, error)
        return null
      }
    },

    async loadAllStages() {
      const stageIds = ['stage-1', 'stage-2', 'stage-3', 'stage-4', 'stage-5', 'stage-6', 'stage-7', 'stage-8']
      for (const id of stageIds) {
        await this.loadStage(id)
      }
    },

    async loadTerms() {
      if (this.terms.length > 0) return
      
      try {
        const { terms } = await import('../content/terms.json')
        this.terms = terms
      } catch (error) {
        console.error('Failed to load terms:', error)
      }
    },

    // Used by App.vue on logout.
    resetStages() {
      this.stages = {}
      this.terms = []
    },
  },
})