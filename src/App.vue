<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from './stores/session'
import { useContentStore } from './stores/content'
import { useProgressStore } from './stores/progress'
import ConfirmDialog from './components/ConfirmDialog.vue'

const router = useRouter()
const session = useSessionStore()
const content = useContentStore()
const progress = useProgressStore()

onMounted(async () => {
  session.hydrate()
  progress.hydrate()

  if (session.isLoggedIn) {
    await content.loadAllStages()
  }
})

const name = computed(() => session.name || 'Foydalanuvchi')

const overallPercent = computed(() => {
  return progress.overallPercent ?? 0
})

const mobileMenuOpen = ref(false)
const showLogoutConfirm = ref(false)

function onMobileGlossaryClick() {
  router.push({ name: 'glossary' })
  mobileMenuOpen.value = false
}

async function performLogout() {
  session.logout()
  progress.clearAll()
  await content.resetStages()
  router.replace({ name: 'login' })
  mobileMenuOpen.value = false
  showLogoutConfirm.value = false
}

function onMobileLogoutClick() {
  showLogoutConfirm.value = true
}

function onHeaderGlossaryClick() {
  router.push({ name: 'glossary' })
}

function onHeaderLogoutClick() {
  showLogoutConfirm.value = true
}

function isOn(routeName: string): boolean {
  return router.currentRoute.value.name === routeName
}
</script>

<template>
  <div class="app-root">
    <!-- HEADER (always visible except on login) -->
    <header v-if="!isOn('login')" class="top-bar glass">
      <!-- Left: brand + subtitle -->
      <div class="left">
        <div class="brand">
          <div class="brand-title">Moda Dizayni Akademiyasi</div>
          <div class="brand-subtitle desktop-only">
            Fashion Design — oson va qiziqarli yo'l
          </div>
        </div>
      </div>

      <!-- Right: desktop actions + mobile hamburger -->
      <div class="right">
        <!-- Desktop items -->
        <div class="desktop-actions desktop-only">
          <div class="progress-pill">{{ overallPercent }}% tugallandi</div>
          <button class="btn-ghost btn-sm" @click="onHeaderGlossaryClick">
            Atamalar sinovi
          </button>
          <span class="username">{{ name }}</span>
          <button class="btn-danger btn-sm" @click="onHeaderLogoutClick">
            Chiqish
          </button>
        </div>

        <!-- Hamburger (mobile only, right side) -->
        <button
          class="hamburger mobile-only"
          @click="mobileMenuOpen = !mobileMenuOpen"
          aria-label="Menyu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>

    <!-- Mobile menu (slide-in) -->
    <template v-if="mobileMenuOpen && !isOn('login')">
      <div class="mobile-overlay mobile-only" @click="mobileMenuOpen=false"></div>
      <aside class="mobile-menu mobile-only">
        <div class="mm-header">
          <div class="mm-title">Moda Dizayni Akademiyasi</div>
          <div class="mm-subtitle">
            Fashion Design — oson va qiziqarli yo'l
          </div>
        </div>

        <div class="mm-stats">
          <span class="progress-pill">{{ overallPercent }}% tugallandi</span>
          <b>{{ name }}</b>
        </div>

        <button
          class="btn-ghost btn-sm full-width-btn"
          @click="onMobileGlossaryClick"
        >
          Atamalar sinovi
        </button>
        <button
          class="btn-danger btn-sm full-width-btn"
          @click="onMobileLogoutClick"
        >
          Chiqish
        </button>
      </aside>
    </template>

    <!-- LOGIN: full-screen, no extra padding -->
    <div v-if="isOn('login')" class="login-fullscreen">
      <router-view />
    </div>

    <!-- PROTECTED PAGES: normal layout with header/footer/padding -->
    <main v-else>
      <router-view />
    </main>

    <!-- FOOTER NOTE (visible on all pages except login) -->
    <div class="footer-note" v-if="!isOn('login')">
      Moda Dizayni Akademiyasi — har bir foydalanuvchining progressi shu brauzerda alohida saqlanadi (localStorage).
    </div>

    <!-- Logout confirmation dialog -->
    <ConfirmDialog
      :show="showLogoutConfirm"
      title="Chiqishni tasdiqlash"
      message="Rostdan ham akkauntdan chiqmoqchimisiz? Barcha progress shu brauzerda saqlanadi, lekin yangi kirishda tanlangan foydalanuvchi nomi bo‘yicha davom etadi."
      confirm-text="Ha, chiqish"
      cancel-text="Yo‘q, qolish"
      variant="danger"
      @confirm="performLogout"
      @cancel="showLogoutConfirm = false"
    />
  </div>
</template>

<style scoped>
/* Top bar layout */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  gap: 12px;

  /* Subtle background + shadow so it stands out */
  background: radial-gradient(circle at top, #ffffff, #f3f4ff);
  box-shadow: 0 4px 18px rgba(15, 15, 25, 0.16);
}

.left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.brand-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-subtitle {
  font-size: 0.72rem;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Right side container */
.right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-width: 0;
}

.desktop-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-size: 0.85rem;
  color: var(--ink);
  white-space: nowrap;
}

/* Hamburger button (right side on mobile) */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.hamburger span {
  display: block;
  height: 2px;
  background-color: var(--ink);
  border-radius: 999px;
}

/* Mobile overlay */
.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 15, 0.35);
  z-index: 40;
}

/* Mobile slide-in menu */
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: min(260px, 85vw);
  padding: 18px 14px 18px 14px;
  background: radial-gradient(circle at top, #ffffff, #f3f4ff);
  box-shadow: 10px 0 40px rgba(15, 15, 25, 0.35);
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 50;
  overflow-y: auto;
}

.mm-header {
  margin-bottom: 2px;
}

.mm-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent);
}

.mm-subtitle {
  font-size: 0.75rem;
  color: var(--muted);
  margin-top: 2px;
}

.mm-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--ink);
}

.full-width-btn {
  width: 100%;
  text-align: left;
  margin-top: 2px;
}

/* Responsive rules */
@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }

  .hamburger {
    display: flex;
  }

  .brand-title {
    font-size: 0.9rem;
  }
}
</style>
