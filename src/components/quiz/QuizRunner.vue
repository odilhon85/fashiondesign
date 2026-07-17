<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  questions: Array<{
    id: string
    type: 'mcq' | 'true_false'
    question: string
    options?: string[]
    answerIndex?: number
    answer?: boolean
  }>
  passThreshold: number
}>()

const emit = defineEmits<{
  finished: [score: number]
}>()

const answers = ref<Record<string, number | boolean>>({})
const submitted = ref(false)
const score = ref(0)

function select(qid: string, idx: number) {
  if (submitted.value) return
  answers.value[qid] = idx
}

function selectBool(qid: string, val: boolean) {
  if (submitted.value) return
  answers.value[qid] = val
}

function submit() {
  let correct = 0
  props.questions.forEach(q => {
    if (q.type === 'mcq') {
      if (answers.value[q.id] === q.answerIndex) correct++
    } else if (q.type === 'true_false') {
      if (answers.value[q.id] === q.answer) correct++
    }
  })
  score.value = Math.round((correct / props.questions.length) * 100)
  submitted.value = true
  emit('finished', score.value)
}

function retry() {
  Object.keys(answers.value).forEach(k => delete answers.value[k])
  submitted.value = false
  score.value = 0
}

const allAnswered = computed(() => props.questions.every(q => answers.value[q.id] !== undefined))
const passed = computed(() => score.value >= props.passThreshold)
</script>

<template>
  <div>
    <div v-if="submitted" :class="['quiz-result-banner', passed ? 'pass' : 'fail']">
      Natija: {{ score }}% — {{ passed ? "O'tdingiz! 🎉" : "O'tmadingiz, qayta urinib ko'ring" }}
      <div style="font-weight:400; font-size:0.85rem; margin-top:4px;">O'tish balli: {{ passThreshold }}%</div>
    </div>
    <div v-for="q in questions" :key="q.id" class="quiz-question">
      <div style="font-weight:600; margin-bottom:6px;">{{ q.question }}</div>
      <template v-if="q.type === 'mcq'">
        <div v-for="(opt, idx) in q.options" :key="idx"
             class="quiz-option"
             :class="{
               selected: answers[q.id] === idx && !submitted,
               correct: submitted && idx === q.answerIndex,
               incorrect: submitted && answers[q.id] === idx && idx !== q.answerIndex
             }"
             @click="select(q.id, idx)">
          {{ opt }}
        </div>
      </template>
      <template v-else-if="q.type === 'true_false'">
        <div class="quiz-option"
             :class="{
               selected: answers[q.id] === true && !submitted,
               correct: submitted && q.answer === true,
               incorrect: submitted && answers[q.id] === true && q.answer !== true
             }"
             @click="selectBool(q.id, true)">To'g'ri</div>
        <div class="quiz-option"
             :class="{
               selected: answers[q.id] === false && !submitted,
               correct: submitted && q.answer === false,
               incorrect: submitted && answers[q.id] === false && q.answer !== false
             }"
             @click="selectBool(q.id, false)">Noto'g'ri</div>
      </template>
    </div>
    <button v-if="!submitted" class="btn-primary btn-block" :disabled="!allAnswered" @click="submit">Tekshirish</button>
    <button v-else class="btn-secondary btn-block" @click="retry">Qayta urinish</button>
  </div>
</template>