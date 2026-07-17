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
      this.login(newName)
    },

    logout() {
      this.name = null
      this.createdAt = null
      localStorage.removeItem(SESSION_KEY)
    },
  },
})