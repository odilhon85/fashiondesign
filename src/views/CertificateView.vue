<template>
  <div class="certificate-page">
    <div class="certificate">
      <div class="stamp">🎓</div>

      <h1>Tabriklaymiz!</h1>

      <p class="name">{{ session.name || 'Foydalanuvchi' }}</p>

      <p style="color:var(--muted); margin-bottom: 16px;">
        Siz Fashion Dizayn kursini muvaffaqiyatli tugatdingiz!
      </p>

      <div class="stats-row">
        <div>
          <div class="stat-value">{{ progress.overallPercent }}%</div>
          <div class="stat-label">Umumiy progress</div>
        </div>
        <div style="width:1px; background:var(--line); margin:0 12px;"></div>
        <div>
          <div class="stat-value">{{ completedStages }}/8</div>
          <div class="stat-label">Tugatilgan bosqichlar</div>
        </div>
      </div>

      <button class="btn-primary" style="margin-top:16px;" @click="goToMap">
        Bosqich xaritasiga qaytish
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useProgressStore } from '@/stores/progress'

const router = useRouter()
const session = useSessionStore()
const progress = useProgressStore()

const completedStages = computed(() => {
  return Object.values(progress.stages).filter(s => !!s.completedAt).length
})

function goToMap() {
  router.push({ name: 'stage-map' })
}
</script>

<style scoped>
.certificate-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--muted);
}
</style>
