import { defineStore } from 'pinia'

const DATA_KEY = 'fashion_app_data'

interface UserData {
  createdAt: string
  lastLogin: string
}

const MAX_RECENT_USERS = 5

interface AppData {
  users: Record<string, UserData>
  currentUsername: string | null
  recentUsers: string[] // up to MAX_RECENT_USERS most recently used usernames
}

function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (!raw) return { users: {}, currentUsername: null, recentUsers: [] }
    const parsed = JSON.parse(raw)
    return {
      users: parsed.users || {},
      currentUsername: parsed.currentUsername ?? null,
      recentUsers: Array.isArray(parsed.recentUsers) ? parsed.recentUsers : [],
    }
  } catch {
    return { users: {}, currentUsername: null, recentUsers: [] }
  }
}

function saveAppData(data: AppData) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to persist session data:', e)
  }
}

interface SessionState {
  username: string | null
  createdAt: string | null
  lastLogin: string | null
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    username: null,
    createdAt: null,
    lastLogin: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.username,
    name: (state) => state.username || '',
    getLastUser: () => {
      const data = loadAppData()
      return data.recentUsers[0] || null
    },
    getRecentUsers: () => {
      const data = loadAppData()
      // Ensure only valid users are in the list
      const filtered = (data.recentUsers || []).filter(u => data.users[u])
      return filtered.slice(0, MAX_RECENT_USERS)
    },
  },

  actions: {
    hydrate() {
      const data = loadAppData()
      if (!data.currentUsername) {
        this.username = null
        this.createdAt = null
        this.lastLogin = null
        return
      }

      const user = data.users[data.currentUsername]
      if (user) {
        this.username = data.currentUsername
        this.createdAt = user.createdAt
        this.lastLogin = user.lastLogin
      } else {
        // invalid currentUsername -> clear
        data.currentUsername = null
        saveAppData(data)
        this.username = null
        this.createdAt = null
        this.lastLogin = null
      }
    },

    loginOrCreate(username: string) {
      const trimmed = (username || '').trim()
      if (!trimmed) return

      const data = loadAppData()
      const now = new Date().toISOString()

      // If user doesn't exist, register them.
      if (!data.users[trimmed]) {
        data.users[trimmed] = { createdAt: now, lastLogin: now }
      } else {
        data.users[trimmed].lastLogin = now
      }

      // Set as current logged-in user
      data.currentUsername = trimmed

      // Update recentUsers list (most recent first)
      let recent = [...(data.recentUsers || [])]
      recent = recent.filter(u => u !== trimmed)
      recent.unshift(trimmed)
      if (recent.length > MAX_RECENT_USERS) {
        recent = recent.slice(0, MAX_RECENT_USERS)
      }
      data.recentUsers = recent

      saveAppData(data)

      this.username = trimmed
      this.createdAt = data.users[trimmed].createdAt
      this.lastLogin = now
    },

    logout() {
      // Keep all users and recentUsers, but clear current session.
      const data = loadAppData()
      data.currentUsername = null
      saveAppData(data)

      this.username = null
      this.createdAt = null
      this.lastLogin = null
    },
  },
})