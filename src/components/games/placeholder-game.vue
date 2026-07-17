<script setup lang="ts">
const emit = defineEmits<{
  finished: [score: number]
}>()

function completeGame() {
  emit('finished', 100)
}
</script>

<template>
  <div class="placeholder-game">
    <p>O'yin tayyorlanmoqda...</p>
    <button class="btn-primary btn-block" @click="completeGame">
      Test sinovini o'tkazish
    </button>
  </div>
</template>

<style scoped>
.placeholder-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 0;
  font-size: 0.95rem;
}
</style>
