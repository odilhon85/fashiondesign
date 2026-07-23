import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import routes from './router/routes'
import { useSessionStore } from './stores/session'
import './glassmorphism.css'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Simple route guard: protect all non-login pages and ensure content is loaded.
router.beforeEach(async (to) => {
  const publicRoutes = ['login']
  const isPublic = publicRoutes.includes(to.name as string)

  // Use the session store inside the guard (after Pinia is installed).
  const session = useSessionStore()
  // Ensure hydration so isLoggedIn reflects persisted state.
  if (!session.username && !session.isLoggedIn) {
    session.hydrate()
  }

  if (!isPublic && !session.isLoggedIn) {
    return { name: 'login' }
  }

  // For protected routes, make sure all stage content is loaded (e.g., after login).
  if (!isPublic && session.isLoggedIn) {
    const { useContentStore } = await import('./stores/content')
    const content = useContentStore()
    await content.loadAllStages()
  }
})

app.mount('#app')
