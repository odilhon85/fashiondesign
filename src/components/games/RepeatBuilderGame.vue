<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{ config: any }>()
const emit = defineEmits<{ finished: [score: number] }>()

const GRID_COLS = 4
const GRID_ROWS = 4

// Motif SVGs (using project-friendly colors)
const MOTIFS: Record<string, string> = {
  A: `<svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#b5651d" stroke-width="2"/>
      <path d="M8 12 L12 8 L16 12 L12 16 Z" fill="#e9c9a8"/>
    </svg>`,
  B: `<svg viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="9" stroke="#b5651d" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="#b23b3b"/>
    </svg>`,
  C: `<svg viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 22,22 2,22" stroke="#b5651d" stroke-width="2" fill="none"/>
      <circle cx="12" cy="14" r="3" fill="#4a7c59"/>
    </svg>`
}

const modes = ['straight', 'half-drop', 'mirror'] as const

// Selected motif for tap-to-place (primary on mobile).
let selectedMotif: string | null = null

// Data per mode: gridData[mode][r][c] = motifId or null
const gridData: Record<string, (string | null)[][]> = {}
const undoStacks: Record<string, any[]> = {}

onMounted(() => {
  buildAllGrids()
  buildPalette()
  setupDragDrop()
  setupModeMotifButtons()
  setupButtons()
})

function buildAllGrids() {
  modes.forEach(mode => {
    const area = document.getElementById('grid-' + mode)
    if (!area) return
    ;(area as HTMLElement).innerHTML = ''
    ;(area as HTMLElement).style.gridTemplateColumns = 'repeat(' + GRID_COLS + ', 1fr)'

    gridData[mode] = []
    undoStacks[mode] = []

    for (let r = 0; r < GRID_ROWS; r++) {
      gridData[mode][r] = []
      for (let c = 0; c < GRID_COLS; c++) {
        gridData[mode][r][c] = null

        const cell = document.createElement('div')
        cell.className = 'grid-cell'
        ;(cell as any).dataset.mode = mode
        ;(cell as any).dataset.row = r
        ;(cell as any).dataset.col = c
        area.appendChild(cell)
      }
    }
  })
}

function buildPalette() {
  const palette = document.getElementById('paletteGrid')
  if (!palette) return
  ;(palette as HTMLElement).innerHTML = ''

  Object.keys(MOTIFS).forEach(id => {
    const tile = document.createElement('div')
    tile.className = 'motif-tile'
    ;(tile as any).draggable = true
    ;(tile as any).dataset.motifId = id
    ;(tile as HTMLElement).innerHTML = MOTIFS[id]

    // Tap/click on motif: select it for placement.
    tile.addEventListener('click', () => {
      if (selectedMotif === id) {
        selectedMotif = null
        tile.classList.remove('motif-tile-selected')
      } else {
        document.querySelectorAll('.motif-tile.motif-tile-selected').forEach(t => t.classList.remove('motif-tile-selected'))
        selectedMotif = id
        tile.classList.add('motif-tile-selected')
      }
    })

    palette.appendChild(tile)
  })
}

function getCell(mode: string, r: number, c: number) {
  return document.querySelector(
    '.grid-cell[data-mode="' + mode + '"][data-row="' + r + '"][data-col="' + c + '"]'
  ) as HTMLElement | null
}

function clearFeedback(mode: string) {
  const el = document.getElementById('feedback-' + mode)
  if (el) el.innerHTML = ''
  // Also remove highlights
  document.querySelectorAll('.grid-cell[data-mode="' + mode + '"]').forEach(cell => {
    cell.classList.remove('correct', 'wrong')
  })
}

function setupDragDrop() {
  const tiles = document.querySelectorAll('.motif-tile')
  const cells = document.querySelectorAll('.grid-cell')

  // Drag start from palette
  tiles.forEach(tile => {
    tile.addEventListener('dragstart', e => {
      ;(e.dataTransfer as any).setData('text/plain', (tile as any).dataset.motifId)
    })
  })

  // Tap/click on cell: place selected motif if any.
  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      const mode = (cell as any).dataset.mode
      const r = parseInt((cell as any).dataset.row)
      const c = parseInt((cell as any).dataset.col)

      if (!selectedMotif) return // No motif selected yet.

      const currentVal = gridData[mode][r][c]

      // If same motif is already placed, tapping again clears the cell (for easy correction).
      if (currentVal === selectedMotif) {
        undoStacks[mode].push({ mode, r, c, prev: currentVal, next: null })
        gridData[mode][r][c] = null
        ;(cell as HTMLElement).innerHTML = ''
        clearFeedback(mode)
        return
      }

      // Save previous state for undo
      undoStacks[mode].push({ mode, r, c, prev: currentVal, next: selectedMotif })

      // Place motif
      gridData[mode][r][c] = selectedMotif
      ;(cell as HTMLElement).innerHTML = '<div class="placed-motif">' + MOTIFS[selectedMotif] + '</div>'

      // Clear feedback for this mode when user changes something
      clearFeedback(mode)
    })
  })

  // Drag-and-drop onto cells
  cells.forEach(cell => {
    cell.addEventListener('dragover', e => {
      e.preventDefault()
      ;(cell as HTMLElement).classList.add('drag-over')
    })

    cell.addEventListener('dragleave', () => {
      ;(cell as HTMLElement).classList.remove('drag-over')
    })

    cell.addEventListener('drop', e => {
      e.preventDefault()
      ;(cell as HTMLElement).classList.remove('drag-over')

      const motifId = (e.dataTransfer as any).getData('text/plain')
      if (!motifId) return

      const mode = (cell as any).dataset.mode
      const r = parseInt((cell as any).dataset.row)
      const c = parseInt((cell as any).dataset.col)

      // Save previous state for undo
      undoStacks[mode].push({ mode, r, c, prev: gridData[mode][r][c], next: motifId })

      // Place motif
      gridData[mode][r][c] = motifId
      ;(cell as HTMLElement).innerHTML = '<div class="placed-motif">' + MOTIFS[motifId] + '</div>'

      // Clear feedback for this mode when user changes something
      clearFeedback(mode)
    })
  })
}

// Wire per-mode motif buttons (mobile convenience).
function setupModeMotifButtons() {
  document.querySelectorAll('.motif-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = (btn as any).dataset.motifId

      if (selectedMotif === id) {
        selectedMotif = null
        // Deselect all motif-tile highlights.
        document.querySelectorAll('.motif-tile.motif-tile-selected').forEach(t => t.classList.remove('motif-tile-selected'))
      } else {
        selectedMotif = id
        // Highlight corresponding main palette tile if exists.
        const mainTile = document.querySelector('.motif-tile[data-motif-id="' + id + '"]')
        if (mainTile) {
          document.querySelectorAll('.motif-tile.motif-tile-selected').forEach(t => t.classList.remove('motif-tile-selected'))
          ;(mainTile as HTMLElement).classList.add('motif-tile-selected')
        }
      }
    })
  })
}

function resetMode(mode: string) {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      gridData[mode][r][c] = null
      const cell = getCell(mode, r, c)
      if (cell) cell.innerHTML = ''
    }
  }
  undoStacks[mode] = []
  clearFeedback(mode)
}

function renderFeedback(score: number, messages: { ok: boolean; text: string }[]) {
  let html = '<div class="score-line">Natija: ' + score + '/100</div>'
  if (messages.length > 0) {
    html += '<ul class="feedback-list">'
    for (const m of messages) {
      const cls = m.ok ? 'ok' : 'fail'
      html += '<li class="feedback-item ' + cls + '">' + m.text + '</li>'
    }
    html += '</ul>'
  }
  return html
}

function setupButtons() {
  // Undo buttons
  document.querySelectorAll('.undo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = (btn as any).dataset.mode
      if (!undoStacks[mode] || undoStacks[mode].length === 0) return

      const last = undoStacks[mode].pop()
      gridData[last.mode][last.r][last.c] = last.prev

      const cell = getCell(last.mode, last.r, last.c)
      if (!cell) return

      if (last.prev === null) {
        cell.innerHTML = ''
      } else {
        cell.innerHTML = '<div class="placed-motif">' + MOTIFS[last.prev] + '</div>'
      }

      clearFeedback(mode)
    })
  })

  // Reset buttons per mode
  document.querySelectorAll('.reset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = (btn as any).dataset.mode
      resetMode(mode)
    })
  })

  // Check buttons per mode
  document.querySelectorAll('.check-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = (btn as any).dataset.mode
      if (mode === 'straight') runStraightCheck()
      else if (mode === 'half-drop') runHalfDropCheck()
      else if (mode === 'mirror') runMirrorCheck()
    })
  })
}

// Straight Match check: each column must have same motif top to bottom.
function runStraightCheck() {
  const mode = 'straight'
  const feedbackEl = document.getElementById('feedback-' + mode)
  if (!feedbackEl) return
  const messages = []

  let hasEmpty = false
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (!gridData[mode][r][c]) { hasEmpty = true; break }
    }
    if (hasEmpty) break
  }
  if (hasEmpty) {
    feedbackEl.innerHTML = renderFeedback(0, [{ ok: false, text: 'Barcha katakchalar to‘ldirilmagan. Bo‘sh joylarni motif bilan to‘ldiring.' }])
    return
  }

  let correctCols = 0

  for (let c = 0; c < GRID_COLS; c++) {
    const firstMotif = gridData[mode][0][c]
    let colOk = true

    if (!firstMotif) {
      colOk = false
    } else {
      for (let r = 1; r < GRID_ROWS; r++) {
        if (gridData[mode][r][c] !== firstMotif) {
          colOk = false
          break
        }
      }
    }

    // Mark cells in this column
    for (let r = 0; r < GRID_ROWS; r++) {
      const cell = getCell(mode, r, c)
      if (!cell) continue
      if (colOk && gridData[mode][r][c]) {
        cell.classList.add('correct')
      } else {
        cell.classList.add('wrong')
      }
    }

    if (colOk) correctCols++
  }

  const score = Math.round((correctCols / GRID_COLS) * 100)

  if (score === 100) {
    messages.push({ ok: true, text: 'To‘g‘ri! Barcha ustunlar to‘g‘ri mos keladi — Straight Match muvaffaqiyatli.' })
  } else {
    messages.push({ ok: false, text: 'Natija: ' + score + '/100. Ba’zi ustunlarda naqsh noto‘g‘ri joylashgan.' })
  }

  feedbackEl.innerHTML = renderFeedback(score, messages)
}

// Half-Drop Repeat check: strict shift rule + all cells must be filled.
function runHalfDropCheck() {
  const mode = 'half-drop'
  const feedbackEl = document.getElementById('feedback-' + mode)
  if (!feedbackEl) return
  const messages = []

  let hasEmpty = false
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (!gridData[mode][r][c]) { hasEmpty = true; break }
    }
    if (hasEmpty) break
  }

  if (hasEmpty) {
    feedbackEl.innerHTML = renderFeedback(0, [{ ok: false, text: 'Barcha katakchalar to‘ldirilmagan. Bo‘sh joylarni motif bilan to‘ldiring.' }])
    return
  }

  // Require at least 2 different motifs (no single-motif fill).
  const usedMotifs = new Set()
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (gridData[mode][r][c]) {
        usedMotifs.add(gridData[mode][r][c])
      }
    }
  }
  if (usedMotifs.size < 2) {
    feedbackEl.innerHTML = renderFeedback(0, [
      { ok: false, text: 'Kamida ikki xil motif ishlatish kerak. Barcha kataklarni bitta naqsh bilan to‘ldirib bo‘lmaydi.' }
    ])
    return
  }

  // Strict Half-Drop Repeat rule:
  // Row 0 is baseline.
  // For r > 0: cell[r][c] must equal cell[r-1][(c - 1 + GRID_COLS) % GRID_COLS].
  let correctRows = 0

  for (let r = 0; r < GRID_ROWS; r++) {
    if (r === 0) {
      // First row is always considered correct baseline.
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = getCell(mode, r, c)
        if (!cell) continue
        cell.classList.add('correct')
      }
      correctRows++
    } else {
      let rowOk = true

      for (let c = 0; c < GRID_COLS; c++) {
        const prevCol = (c - 1 + GRID_COLS) % GRID_COLS
        if (gridData[mode][r][c] !== gridData[mode][r - 1][prevCol]) {
          rowOk = false
          break
        }
      }

      for (let c = 0; c < GRID_COLS; c++) {
        const cell = getCell(mode, r, c)
        if (!cell) continue
        if (rowOk) {
          cell.classList.add('correct')
        } else {
          cell.classList.add('wrong')
        }
      }

      if (rowOk) correctRows++
    }
  }

  const score = Math.round((correctRows / GRID_ROWS) * 100)

  if (score === 100) {
    messages.push({ ok: true, text: 'To‘g‘ri! Half-Drop Repeat muvaffaqiyatli yaratildi.' })
  } else {
    messages.push({ ok: false, text: 'Natija: ' + score + '/100. Ba’zi qatorlarda naqsh noto‘g‘ri joylashgan.' })
  }

  feedbackEl.innerHTML = renderFeedback(score, messages)
}

// Mirror Repeat check: each row must be symmetric around center.
function runMirrorCheck() {
  const mode = 'mirror'
  const feedbackEl = document.getElementById('feedback-' + mode)
  if (!feedbackEl) return
  const messages = []

  let hasEmpty = false
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (!gridData[mode][r][c]) { hasEmpty = true; break }
    }
    if (hasEmpty) break
  }

  if (hasEmpty) {
    feedbackEl.innerHTML = renderFeedback(0, [{ ok: false, text: 'Barcha katakchalar to‘ldirilmagan. Bo‘sh joylarni motif bilan to‘ldiring.' }])
    return
  }

  let correctRows = 0

  for (let r = 0; r < GRID_ROWS; r++) {
    let rowOk = true

    // For each column, compare with its mirror: c vs (GRID_COLS - 1 - c)
    for (let c = 0; c < Math.floor(GRID_COLS / 2); c++) {
      const mirrorC = GRID_COLS - 1 - c
      if (gridData[mode][r][c] !== gridData[mode][r][mirrorC]) {
        rowOk = false
        break
      }
    }

    // Mark cells in this row
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = getCell(mode, r, c)
      if (!cell) continue
      if (rowOk && gridData[mode][r][c]) {
        cell.classList.add('correct')
      } else {
        cell.classList.add('wrong')
      }
    }

    if (rowOk) correctRows++
  }

  const score = Math.round((correctRows / GRID_ROWS) * 100)

  if (score === 100) {
    messages.push({ ok: true, text: 'To‘g‘ri! Mirror Repeat muvaffaqiyatli yaratildi.' })
  } else {
    messages.push({ ok: false, text: 'Natija: ' + score + '/100. Ba’zi qatorlarda simmetriya buzilgan.' })
  }

  feedbackEl.innerHTML = renderFeedback(score, messages)
}
</script>

<template>
  <div class="repeat-builder-game">
    <header class="game-header">
      <h1 class="game-title">Repeat Quruvchi</h1>
      <p class="game-subtitle">Stage 7 — Naqsh va Repeat Turlari</p>
      <div class="instructions">
        Har bir repeat turi uchun alohida katak berilgan. Motiflarni pastdagi palitradan sudrab tashlang yoki bosing, so‘ng katakni bosing. Agar xato qo‘yib qo‘ysangiz, “Undo” tugmasini bosing.
      </div>
    </header>

    <!-- Shared motif palette -->
    <section class="palette-area">
      <div class="palette-title">Motiflar (bularni sudrab tashlang yoki tanlang)</div>
      <div id="paletteGrid" class="palette-grid"></div>
    </section>

    <!-- Three modes: Straight, Half-Drop, Mirror -->
    <section class="modes-wrapper">

      <!-- Straight Match -->
      <article class="mode-card" data-mode="straight">
        <div class="mode-title">Straight Match</div>
        <p class="mode-desc">Har bir ustunda yuqoridan pastgacha bir xil motif bo‘lishi kerak.</p>

        <!-- Mobile convenience buttons -->
        <div class="mode-motifs">
          <button class="motif-btn" data-motif-id="A">A</button>
          <button class="motif-btn" data-motif-id="B">B</button>
          <button class="motif-btn" data-motif-id="C">C</button>
        </div>

        <div id="grid-straight" class="grid-area"></div>

        <div class="mode-actions">
          <button class="btn-secondary undo-btn" data-mode="straight">Undo</button>
          <button class="btn-secondary reset-btn" data-mode="straight">Tozalash</button>
          <button class="btn-primary check-btn" data-mode="straight">Tekshirish</button>
        </div>

        <section class="feedback-area" id="feedback-straight"></section>
      </article>

      <!-- Half-Drop Repeat -->
      <article class="mode-card" data-mode="half-drop">
        <div class="mode-title">Half-Drop Repeat</div>
        <p class="mode-desc">Har bir qator oldingi qatorga nisbatan 1 katakka siljigan bo‘lishi kerak.</p>

        <div class="mode-motifs">
          <button class="motif-btn" data-motif-id="A">A</button>
          <button class="motif-btn" data-motif-id="B">B</button>
          <button class="motif-btn" data-motif-id="C">C</button>
        </div>

        <div id="grid-half-drop" class="grid-area"></div>

        <div class="mode-actions">
          <button class="btn-secondary undo-btn" data-mode="half-drop">Undo</button>
          <button class="btn-secondary reset-btn" data-mode="half-drop">Tozalash</button>
          <button class="btn-primary check-btn" data-mode="half-drop">Tekshirish</button>
        </div>

        <section class="feedback-area" id="feedback-half-drop"></section>
      </article>

      <!-- Mirror Repeat -->
      <article class="mode-card" data-mode="mirror">
        <div class="mode-title">Mirror Repeat</div>
        <p class="mode-desc">Har bir qator chap va o‘ng tomonda simmetrik (oyna) bo‘lishi kerak.</p>

        <div class="mode-motifs">
          <button class="motif-btn" data-motif-id="A">A</button>
          <button class="motif-btn" data-motif-id="B">B</button>
          <button class="motif-btn" data-motif-id="C">C</button>
        </div>

        <div id="grid-mirror" class="grid-area"></div>

        <div class="mode-actions">
          <button class="btn-secondary undo-btn" data-mode="mirror">Undo</button>
          <button class="btn-secondary reset-btn" data-mode="mirror">Tozalash</button>
          <button class="btn-primary check-btn" data-mode="mirror">Tekshirish</button>
        </div>

        <section class="feedback-area" id="feedback-mirror"></section>
      </article>

    </section>
  </div>
</template>

<style scoped>
.repeat-builder-game {
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  color: var(--ink);
}

.game-header {
  margin-bottom: 14px;
}

.game-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--accent);
  margin: 0 0 2px;
}

.game-subtitle {
  font-size: 0.95rem;
  color: var(--muted);
  margin: 0 0 4px;
}

.instructions {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--muted);
}

/* Three grids layout */
.modes-wrapper {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 12px;
}

.mode-card {
  background: var(--paper);
  border-radius: var(--radius);
  padding: 12px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}

.mode-title {
  font-weight: 700;
  margin-bottom: 2px;
  color: var(--accent);
  font-size: 0.95rem;
}

.mode-desc {
  font-size: 0.85rem;
  color: var(--muted);
  margin-bottom: 6px;
}



/* Motif palette (shared) */
.palette-area {
  margin-top: 10px;
  margin-bottom: 10px;
}

.palette-title {
  font-size: 0.9rem;
  color: var(--muted);
  margin-bottom: 4px;
}

.palette-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.motif-tile-selected {
  outline: 3px solid var(--accent);
  box-shadow: 0 0 12px rgba(181, 101, 29, 0.45);
  transform: scale(1.05);
}

.motif-tile {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid var(--accent-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
}

.motif-tile svg {
  width: 26px;
  height: 26px;
}

/* Placed motif in grid */
.placed-motif {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.placed-motif svg {
  width: 22px;
  height: 22px;
}

/* Actions per mode */
.mode-actions {
  display: flex;
  gap: 6px;
  justify-content: space-between;
  margin-top: 4px;
  flex-wrap: wrap;
}

button.btn-primary,
button.btn-secondary {
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 0.78rem;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--muted);
}

/* Feedback area per mode */
.feedback-area {
  margin-top: 6px;
  font-size: 0.8rem;
}

.score-line {
  font-weight: 700;
  margin-bottom: 1px;
  color: var(--accent);
}

.feedback-list {
  list-style: none;
  padding-left: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

/* Scoped fallback (for static elements) */
.feedback-item.ok {
  color: var(--good, #16a34a);
}

.feedback-item.fail {
  color: var(--bad, #dc2626);
}

/* Motif button base style (for per-grid mobile buttons) */
.motif-btn {
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--accent-soft);
  background: #fff;
  color: var(--ink);
  font-size: 0.85rem;
  cursor: pointer;
}

.motif-btn:active {
  transform: scale(0.95);
}

/* Per-mode motif buttons (visible only on small screens) */
.mode-motifs {
  display: none;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 3px;
}

@media (max-width: 600px) {
  .mode-motifs {
    display: flex;
  }
}

/* Tablet: 2 columns */
@media (max-width: 900px) {
  .modes-wrapper {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .mode-card {
    padding: 10px;
  }

  .grid-area {
    gap: 3px;
  }

  .motif-tile {
    width: 42px;
    height: 42px;
  }

  button.btn-primary,
  button.btn-secondary {
    padding: 5px 8px;
    font-size: 0.75rem;
  }
}

/* Mobile: 1 column, compact and touch-friendly */
@media (max-width: 600px) {
  .repeat-builder-game {
    font-size: 13px;
  }

  .game-title {
    font-size: 1.2rem;
  }

  .game-subtitle,
  .instructions {
    font-size: 0.85rem;
  }

  /* Stack grids vertically */
  .modes-wrapper {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .mode-card {
    padding: 9px;
    border-radius: 12px;
  }

  .grid-area {
    gap: 3px;
  }

  /* Make cells a bit smaller but still tappable */
  .grid-cell {
    min-width: 0;
    font-size: 0;
  }

  .placed-motif svg {
    width: 18px;
    height: 18px;
  }

  /* Palette on mobile: smaller tiles, still easy to tap */
  .palette-area {
    margin-top: 6px;
    margin-bottom: 6px;
  }

  .palette-title {
    font-size: 0.85rem;
  }

  .motif-tile {
    width: 38px;
    height: 38px;
    border-radius: 999px;
  }

  .motif-tile svg {
    width: 22px;
    height: 22px;
  }

  /* Buttons more compact */
  .mode-actions {
    gap: 4px;
    flex-wrap: wrap;
  }

  button.btn-primary,
  button.btn-secondary {
    padding: 5px 8px;
    font-size: 0.7rem;
    border-radius: 999px;
  }

  /* Feedback text smaller */
  .feedback-area {
    font-size: 0.8rem;
  }
}
</style>

<style>
/*
 * Unscoped styles for dynamically created grid elements.
 * Vue's scoped CSS does not apply to nodes inserted via JS (innerHTML/appendChild),
 * so these must be global within this file.
 */
:root {
  --good: #16a34a; /* green for correct messages */
  --bad: #dc2626;  /* red for wrong messages */
}

.repeat-builder-game .grid-area {
  display: grid;
  gap: 3px;
  margin-bottom: 6px;
}

.repeat-builder-game .grid-cell {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background: #fff;
  border: 1px dashed var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
}

.repeat-builder-game .grid-cell.drag-over {
  outline: 2px solid var(--accent-soft);
}

/* Edge feedback highlights */
.repeat-builder-game .grid-cell.correct {
  outline: 2px solid var(--good);
  background: #eaf5ec;
}

.repeat-builder-game .grid-cell.wrong {
  outline: 2px solid var(--bad);
  background: #fbeaea;
}

/* Palette area and items */
.repeat-builder-game .palette-area {
  display: grid;
  gap: 8px;
  margin-bottom: 10px;
}

.repeat-builder-game .palette-item {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: #111827;
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Ensure SVG motifs are visible inside cells and palette */
.repeat-builder-game .grid-cell svg,
.repeat-builder-game .palette-item svg {
  width: 80%;
  height: 80%;
  display: block;
}

/* Motif tiles in palette (created via JS) */
.repeat-builder-game .motif-tile {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid var(--accent-soft, #b5651d);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
}

.repeat-builder-game .motif-tile svg {
  width: 24px;
  height: 24px;
  display: block;
}

/* Placed motif inside grid cells (created via JS) */
.repeat-builder-game .placed-motif {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.repeat-builder-game .placed-motif svg {
  width: 22px;
  height: 22px;
  display: block;
}

/* Feedback colors for dynamically created elements */
.repeat-builder-game .feedback-item.ok {
  color: #16a34a !important; /* green */
}

.repeat-builder-game .feedback-item.fail {
  color: #dc2626 !important; /* red */
}
</style>
