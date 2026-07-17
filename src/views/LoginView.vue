<template>
  <div class="d-flex align-center justify-center" style="min-height: 100vh; padding: 20px;">
    <v-card class="glass-card pa-8" max-width="420" width="100%">
      <v-card-title class="text-h4 font-weight-bold text-center mb-2">
        Xush kelibsiz!
      </v-card-title>
      <v-card-subtitle class="text-center mb-6">
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

<style scoped>
.v-card {
  background: rgba(255, 255, 255, 0.25) !important;
}
</style>