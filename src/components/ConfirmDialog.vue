<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  show: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary' // default: danger for logout
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const confirmVariant = computed(() => props.variant ?? 'danger')
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="confirm-overlay" @click.self="emit('cancel')">
      <div class="confirm-dialog glass-card">
        <header class="confirm-header">
          <h2 class="confirm-title">{{ title ?? 'Tasdiqlash' }}</h2>
        </header>

        <p v-if="message" class="confirm-message">
          {{ message }}
        </p>

        <footer class="confirm-footer">
          <button
            class="btn-ghost confirm-cancel"
            @click="emit('cancel')"
          >
            {{ cancelText ?? 'Yo‘q' }}
          </button>
          <button
            :class="[
              'confirm-action',
              confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'
            ]"
            @click="emit('confirm')"
          >
            {{ confirmText ?? 'Ha, davom etish' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 15, 25, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.confirm-dialog {
  width: min(380px, 90vw);
  background: radial-gradient(circle at top, #ffffff, #f3f4ff);
  border-radius: 16px;
  padding: 16px 16px 14px;
  box-shadow: 0 18px 50px rgba(15, 15, 25, 0.45);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.confirm-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--accent);
}

.confirm-message {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ink);
  line-height: 1.5;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.confirm-cancel,
.confirm-action {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  cursor: pointer;
  border: none;
}

.confirm-cancel.btn-ghost {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--line, #e5e7eb);
}

.confirm-action.btn-danger {
  background: linear-gradient(to right, #dc2626, #b91c1c);
  color: #ffffff;
}

.confirm-action.btn-primary {
  background: linear-gradient(to right, var(--accent), #8b5cf6);
  color: #ffffff;
}
</style>

<style>
/* For dynamically created or global usage if needed */
.glass-card {
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
}
</style>
