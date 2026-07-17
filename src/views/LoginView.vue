<template>
  <div class="d-flex align-center justify-center" style="min-height: 100vh; padding: 20px;">
    <v-card class="glass-card pa-8" max-width="420" width="100%">
      <v-card-title class="text-h4 font-weight-bold text-center mb-2">
        Xush kelibsiz!
      </v-card-title>

      <!-- Recent users list -->
      <div v-if="recentUsers.length" class="mb-4">
        <p class="text-center" style="font-size:0.9rem;">Shu brauzerda oldin ishlatilgan:</p>
        <v-row dense class="mt-2 mb-2">
          <v-col
            v-for="user in recentUsers"
            :key="user"
            cols="6"
          >
            <v-btn
              color="primary"
              size="small"
              rounded="lg"
              block
              class="glass-button"
              @click="continueAsUser(user)"
            >
              {{ user }}
            </v-btn>
          </v-col>
        </v-row>
      </div>

      <!-- Divider -->
      <div v-if="recentUsers.length" class="text-center mb-4" style="font-size:0.8rem; color:#6b7280;">
        yoki boshqa foydalanuvchi sifatida kirish
      </div>

      <!-- Register / login as another user -->
      <v-card-subtitle v-else class="text-center mb-6">
        Ismingizni kiriting, boshlaymiz
      </v-card-subtitle>

      <v-form @submit.prevent="handleSubmit">
        <v-text-field
          v-model="name"
          label="Ismingiz"
          variant="outlined"
          rounded="lg"
          autofocus
          required
          class="mb-4"
        />
        <v-btn
          type="submit"
          color="primary"
          size="large"
          rounded="lg"
          block
          class="glass-button animate-pulse-glow"
        >
          Boshlash
        </v-btn>
      </v-form>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const name = ref('')
const session = useSessionStore()
const router = useRouter()

const recentUsers = computed(() => session.getRecentUsers)

function handleSubmit() {
  const n = (name.value || '').trim()
  if (!n) return
  session.loginOrCreate(n)
  router.push({ name: 'stage-map' })
}

function continueAsUser(user: string) {
  if (!user) return
  session.loginOrCreate(user)
  router.push({ name: 'stage-map' })
}
</script>

<style scoped>
.v-card {
  background: rgba(255, 255, 255, 0.25) !important;
}
</style>
