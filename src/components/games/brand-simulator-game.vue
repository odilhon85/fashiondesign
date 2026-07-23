<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  onComplete?: (score: number) => void
}>()

// Core state
const currentStep = ref(0) // 0..N
const brandName = ref('')
const segment = ref<'economy' | 'mid' | 'premium'>('mid')
const priceLevel = ref<'low' | 'medium' | 'high'>('medium')
const marketingStrategy = ref<string>('balanced_marketing')

// Scenarios and answers
type ScenarioOption = { value: string; label: string }
type Scenario = { key: string; title: string; prompt: string; options: ScenarioOption[] }

const scenarios: Scenario[] = [
  {
    key: 'scenario1',
    title: 'Vaziyat 1 — Narx bosimi',
    prompt: "Raqobatchilar narxlarni tushirdi. Mijozlar arzonroq so‘rayapti. Nima qilasiz?",
    options: [
      { value: 'cut_prices_aggressively', label: "Narxlarni keskin tushiraman." },
      { value: 'keep_quality_add_value', label: "Sifatni saqlab, qo‘shimcha qiymat (kafolat/sovg‘a) beraman." },
      { value: 'ignore_competition', label: "Hech narsa o‘zgartirmayman; bozor o‘z-o‘zidan tuzatiladi deb hisoblayman." }
    ]
  },
  {
    key: 'scenario2',
    title: 'Vaziyat 2 — Marketing tanlovi',
    prompt: "Sizda cheklangan marketing byudjeti bor. Qanday strategiyani tanlaysiz?",
    options: [
      { value: 'heavy_ads', label: 'Katta reklamaga katta investitsiya qilaman.' },
      { value: 'influencer_collab', label: "Influencerlar va hamkorlikka e’tibor beraman." },
      { value: 'minimal_marketing', label: "Minimal reklama; organik o‘sishga tayanaman." }
    ]
  },
  {
    key: 'scenario3',
    title: 'Vaziyat 3 — Ehtiyotkorlik yoki xavf?',
    prompt: "Yangi material arzonroq, lekin sifat biroz past. Qanday qaror qabul qilasiz?",
    options: [
      { value: 'switch_material', label: "Arzonroq materialga o‘taman; foyda ortadi." },
      { value: 'keep_original', label: "Asl sifatni saqlayman, narxni biroz ko‘tarishga tayyorman." },
      { value: 'test_small_batch', label: "Kichik partiyada sinab ko‘raman; natijaga qarab qaror qabul qilaman." }
    ]
  },
  {
    key: 'scenario4',
    title: 'Vaziyat 4 — Sifat muammosi',
    prompt: "Mijozlar bir nechta mahsulotda sifat kamchiligini bildirgan. Nima qilasiz?",
    options: [
      { value: 'full_recall_replace', label: "To‘liq almashtirish va ochiq izoh beraman." },
      { value: 'partial_discount', label: "Faqat og‘ir holatlarda chegirma beraman." },
      { value: 'ignore_issue', label: "Kichik muammo deb hisoblab, e’tiborsiz qoldiraman." }
    ]
  }
]

const answers = ref<Record<string, string>>({})

// Scoring
const maxScore = 100
const scoreValue = ref(0)

function addScore(delta: number) {
  scoreValue.value = Math.min(maxScore, Math.max(0, scoreValue.value + delta))
}

const score = computed(() => scoreValue.value)

// Step helpers
function goToSegment() {
  if (!brandName.value.trim()) return
  currentStep.value = 1
}

function goToPricing() {
  if (!segment.value) return
  addScore(5)
  currentStep.value = 2
}

function goToMarketing() {
  if (!priceLevel.value) return
  // Price scoring
  const goodPrice =
    (segment.value === 'economy' && priceLevel.value === 'low') ||
    (segment.value === 'mid' && priceLevel.value === 'medium') ||
    (segment.value === 'premium' && priceLevel.value === 'high')
  if (goodPrice) addScore(10)
  else addScore(3)

  currentStep.value = 3
}

function goToScenarios() {
  // Marketing scoring
  const m = marketingStrategy.value
  if (m === 'balanced_marketing' || m === 'influencer_collab') addScore(8)
  else if (m === 'heavy_ads') addScore(5)
  else addScore(2)

  currentStep.value = 4 // first scenario index
}

// Scenario handling
const scenarioIndex = computed(() => {
  if (currentStep.value < 4) return -1
  const idx = currentStep.value - 4
  return idx >= scenarios.length ? -1 : idx
})

function isScenariosFinished() {
  return scenarioIndex.value === -1 && Object.keys(answers.value).length >= scenarios.length
}

function handleScenarioChoice(optionValue: string) {
  const sIdx = scenarioIndex.value
  if (sIdx < 0 || sIdx >= scenarios.length) return
  const scenario = scenarios[sIdx]

  answers.value[scenario.key] = optionValue

  // Simple scoring per choice
  switch (scenario.key) {
    case 'scenario1':
      if (optionValue === 'keep_quality_add_value') addScore(10)
      else if (optionValue === 'cut_prices_aggressively') addScore(4)
      else addScore(2)
      break
    case 'scenario2':
      if (optionValue === 'influencer_collab' || optionValue === 'balanced_marketing') addScore(9)
      else if (optionValue === 'heavy_ads') addScore(6)
      else addScore(3)
      break
    case 'scenario3':
      if (optionValue === 'test_small_batch') addScore(10)
      else if (optionValue === 'keep_original') addScore(8)
      else addScore(4)
      break
    case 'scenario4':
      if (optionValue === 'full_recall_replace') addScore(12)
      else if (optionValue === 'partial_discount') addScore(6)
      else addScore(1)
      break
  }

  // Move to next scenario or finish
  const nextIdx = sIdx + 1
  if (nextIdx < scenarios.length) {
    currentStep.value = 4 + nextIdx
  } else {
    currentStep.value = 100 // results step
  }
}

function restartGame() {
  currentStep.value = 0
  brandName.value = ''
  segment.value = 'mid'
  priceLevel.value = 'medium'
  marketingStrategy.value = 'balanced_marketing'
  answers.value = {}
  scoreValue.value = 0
}

function notifyComplete() {
  props.onComplete?.(scoreValue.value)
  restartGame()
}
</script>

<template>
  <div class="brand-sim">
    <header class="brand-header">
      <h1 class="brand-title">Brend Qurish va Biznes Asoslari</h1>
      <div class="score-pill">
        Ball: {{ score }} / {{ maxScore }}
      </div>
    </header>

    <!-- Step 0: Enter brand name -->
    <section v-if="currentStep === 0" class="step-card">
      <h2>1. Brending — Nom Tanlash</h2>
      <p>O‘z brendingizga nom tanlang.</p>

      <label class="field-label">Brend nomi:</label>
      <input
        v-model="brandName"
        type="text"
        placeholder="Masalan: ModaLab, StyleCraft..."
        class="brand-input"
      />

      <button class="btn-primary" :disabled="!brandName.trim()" @click="goToSegment()">
        Davom etish
      </button>
    </section>

    <!-- Step 1: Segment -->
    <section v-if="currentStep === 1" class="step-card">
      <h2>2. Nishon Auditoriya</h2>
      <p>Sizning brendingiz kimlar uchun?</p>

      <div class="radio-group">
        <label class="radio-option">
          <input type="radio" v-model="segment" value="economy" />
          <span>Economy — arzon va qulay</span>
        </label>
        <label class="radio-option">
          <input type="radio" v-model="segment" value="mid" />
          <span>Mid — o‘rtacha sifat, o‘rtacha narx</span>
        </label>
        <label class="radio-option">
          <input type="radio" v-model="segment" value="premium" />
          <span>Premium — yuqori sifat va imidj</span>
        </label>
      </div>

      <button class="btn-primary" :disabled="!segment" @click="goToPricing()">
        Davom etish
      </button>
    </section>

    <!-- Step 2: Pricing -->
    <section v-if="currentStep === 2" class="step-card">
      <h2>3. Narx Strategiyasi</h2>
      <p>Sizning brendingiz qanday narx darajasida bo‘ladi?</p>

      <div class="radio-group">
        <label class="radio-option">
          <input type="radio" v-model="priceLevel" value="low" />
          <span>Past — raqobatda asosan narx bilan</span>
        </label>
        <label class="radio-option">
          <input type="radio" v-model="priceLevel" value="medium" />
          <span>O‘rtacha — sifat va narx muvozanati</span>
        </label>
        <label class="radio-option">
          <input type="radio" v-model="priceLevel" value="high" />
          <span>Yuqori — premium pozitsionlash</span>
        </label>
      </div>

      <button class="btn-primary" :disabled="!priceLevel" @click="goToMarketing()">
        Davom etish
      </button>
    </section>

    <!-- Step 3: Marketing -->
    <section v-if="currentStep === 3" class="step-card">
      <h2>4. Marketing Strategiyasi</h2>
      <p>Brendingizni qanday targ‘ib qilmoqchisiz?</p>

      <div class="radio-group">
        <label class="radio-option">
          <input type="radio" v-model="marketingStrategy" value="heavy_ads" />
          <span>Katta reklama kampaniyalari</span>
        </label>
        <label class="radio-option">
          <input type="radio" v-model="marketingStrategy" value="influencer_collab" />
          <span>Influencerlar va hamkorliklar orqali o‘sish</span>
        </label>
        <label class="radio-option">
          <input type="radio" v-model="marketingStrategy" value="balanced_marketing" />
          <span>Muvozanatli: onlayn + oflayn + mijozlar bilan ishonch</span>
        </label>
        <label class="radio-option">
          <input type="radio" v-model="marketingStrategy" value="minimal_marketing" />
          <span>Minimal reklama; organik o‘sishga tayanish</span>
        </label>
      </div>

      <button class="btn-primary" :disabled="!marketingStrategy" @click="goToScenarios()">
        Vaziyatlarga o‘tish
      </button>
    </section>

    <!-- Steps 4+: Scenarios -->
    <section v-if="currentStep >= 4 && scenarioIndex >= 0" class="step-card">
      <h2>{{ scenarios[scenarioIndex].title }}</h2>
      <p>{{ scenarios[scenarioIndex].prompt }}</p>

      <div class="scenario-options">
        <button
          v-for="opt in scenarios[scenarioIndex].options"
          :key="opt.value"
          class="option-btn"
          @click="handleScenarioChoice(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <!-- Results -->
    <section v-if="currentStep === 100 || isScenariosFinished()" class="step-card results">
      <h2>Natijalar</h2>
      <p>
        Sizning brendingiz: <strong>{{ brandName || "Noma'lum" }}</strong>.
      </p>

      <div class="results-row">
        <span>Jami ball:</span>
        <span class="score-value">{{ score }} / {{ maxScore }}</span>
      </div>

      <div v-if="score >= 80" class="feedback-good">
        Ajoyib! Siz professional brend menejeri darajasida qaror qabul qilyapsiz.
      </div>
      <div v-else-if="score >= 50" class="feedback-mid">
        Yaxshi boshlang‘ich, lekin ba’zi qarorlaringizda xavfli nuqsonlar bor.
      </div>
      <div v-else class="feedback-bad">
        Brendingiz hozircha zaif; strategiyangizni qayta ko‘rib chiqish kerak.
      </div>

      <button class="btn-primary" @click="notifyComplete()">
        Yakunlash
      </button>
    </section>
  </div>
</template>

<style scoped>
.brand-sim {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
  color: #e5e7eb;
}

/* Header */
.brand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.brand-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f0f0f;
}

.score-pill {
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(75, 85, 99, 0.9);
  font-size: 10px;
  color: #9ca3af;
}

/* Step card */
.step-card {
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(75, 85, 99, 0.9);
  box-shadow: 0 8px 25px rgba(15, 23, 42, 0.9);
}

.step-card h2 {
  margin-bottom: 6px;
  font-size: 14px;
  color: #e5e7eb;
}

.step-card p {
  margin-bottom: 8px;
  font-size: 11px;
  color: #9ca3af;
}

/* Inputs */
.field-label {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  color: #e5e7eb;
}

.brand-input {
  width: 100%;
  padding: 8px 9px;
  border-radius: 6px;
  border: 1px solid rgba(75, 85, 99, 0.9);
  background: #020817;
  color: #e5e7eb;
  font-size: 11px;
  outline: none;
}

.brand-input:focus {
  border-color: #6366f1;
}

/* Radio group */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 8px;
  border-radius: 6px;
  border: 1px solid rgba(75, 85, 99, 0.9);
  background: #020817;
  font-size: 11px;
  color: #e5e7eb;
  cursor: pointer;
}

.radio-option input[type='radio'] {
  accent-color: #6366f1;
}

/* Buttons */
.btn-primary {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(to right, #6366f1, #22c55e);
  color: #020817;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.95;
}

/* Scenario options */
.scenario-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.option-btn {
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(75, 85, 99, 0.9);
  background: #020817;
  color: #e5e7eb;
  font-size: 11px;
  text-align: left;
  cursor: pointer;
}

.option-btn:hover {
  border-color: #6366f1;
}

/* Results */
.results-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.score-value {
  font-weight: 600;
  color: #22c55e;
}

.feedback-good,
.feedback-mid,
.feedback-bad {
  margin-top: 6px;
  padding: 6px 8px;
  border-radius: 999px;
  font-size: 10px;
}

.feedback-good {
  background: rgba(34, 197, 94, 0.15);
  color: #bbf7d0;
}

.feedback-mid {
  background: rgba(234, 179, 8, 0.15);
  color: #fef08a;
}

.feedback-bad {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}
</style>
