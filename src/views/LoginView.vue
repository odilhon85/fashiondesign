<template>
  <div class="login-card-wrapper">
    <div class="card login-card">
      <!-- Hero image -->
      <div class="login-hero">
        <img src="/assets/images/stage-1/hero.jpg" alt="Hero" />
      </div>

      <h1>Xush kelibsiz!</h1>

      <!-- Recent users list -->
      <div v-if="recentUsers.length" class="mb-4">
        <p style="font-size:0.9rem; color:var(--muted); margin-bottom:6px;">
          Shu brauzerda oldin ishlatilgan:
        </p>
        <div class="recent-users-grid">
          <button
            v-for="user in recentUsers"
            :key="user"
            class="btn-ghost btn-sm"
            @click="continueAsUser(user)"
          >
            {{ user }}
          </button>
        </div>
      </div>

      <!-- New user input -->
      <form @submit.prevent="handleSubmit">
        <input
          v-model="name"
          type="text"
          placeholder="Ismingizni kiriting..."
          autofocus
          required
        />
        <button
          type="submit"
          class="btn-primary btn-block animate-pulse-glow"
        >
          Boshlash
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useProgressStore } from '@/stores/progress'
import { useContentStore } from '@/stores/content'

const name = ref('')
const session = useSessionStore()
const progress = useProgressStore()
const content = useContentStore()
const router = useRouter()

const recentUsers = computed(() => session.getRecentUsers)

async function handleSubmit() {
  const n = (name.value || '').trim()
  if (!n) return
  session.loginOrCreate(n)
  await ensureUserDataLoaded()
  router.push({ name: 'stage-map' })
}

async function continueAsUser(user: string) {
  if (!user) return
  session.loginOrCreate(user)
  await ensureUserDataLoaded()
  router.push({ name: 'stage-map' })
}

async function ensureUserDataLoaded() {
  // Reload this user's progress from localStorage.
  progress.hydrate()
  // Ensure all stage content is loaded (after logout/reset it may be empty).
  await content.loadAllStages()
}
</script>

<style scoped>
.login-card-wrapper {
  width: 100%;
  max-width: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Override card for login to look like previous glassmorphism */
.card.login-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-radius: 16px;
  box-shadow: 0 14px 35px rgba(15, 15, 15, 0.25);
  padding: 24px 22px 26px;
  text-align: center;
}

.login-card h1 {
  margin-top: 0;
  font-size: 1.4rem;
  color: var(--accent);
  margin-bottom: 8px;
}

.recent-users-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin-top: 4px;
  margin-bottom: 8px;
}

.login-hero {
  width: 100%;
  max-height: 180px;
  overflow: hidden;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.login-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
