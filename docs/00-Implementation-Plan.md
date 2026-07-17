# Fashion Design Learning Platform — Implementation Plan

*Companion to 00-Project-Overview.md. Read that first — this file assumes its decisions.*

---

## Phase 0: Content Structuring (do this before any code)

This is the most underestimated phase. The 8 markdown files are written for human reading, not for a UI to consume — they need to become structured data first.

**Tasks:**
1. For each stage, split the existing QISM/sections into discrete **lesson units** (each stage currently has 5-10 sections — most map 1:1 to a lesson screen)
2. For each lesson, extract:
   - A short title
   - The explanation text (can mostly be reused/lightly trimmed from the existing md)
   - The "Amaliy mashq" (practical exercise) as a separate callout block
   - A list of terms introduced (for the glossary)
3. For each stage, draft:
   - 5-10 quiz questions (mix of multiple-choice and true/false at minimum)
   - The game's specific data (e.g., Stage 2's croquis proportions as draggable pieces; Stage 4's dart pivot values)
4. Output format: one `stage-N.json` per stage, following the content model in the Project Overview

**Deliverable:** `/content/stage-1.json` … `stage-8.json`, plus a `terms.json` aggregating every term across all stages (for the cumulative glossary test).

**Estimate:** This is largely content-authoring work, not engineering — budget 1-2 hours per stage (8-16 hours total) since the source material already exists.

---

## Phase 1: Project Scaffold

**Tasks:**
1. `npm create vite@latest` → Vue 3 + TypeScript template
2. Add Vuetify 3 (`vue add vuetify` or manual plugin setup)
3. Add Pinia for state management
4. Set up routing (`vue-router`): 
   - `/` — stage map/home
   - `/stage/:id/learn`
   - `/stage/:id/play`
   - `/stage/:id/test`
   - `/glossary-test`
   - `/certificate`
5. Set up folder structure:
```
src/
 ├─ content/          (the JSON files from Phase 0)
 ├─ components/
 │   ├─ lesson/        (LessonViewer, ImageBlock, ExerciseCallout)
 │   ├─ games/          (one component per game type)
 │   ├─ quiz/           (QuizRunner, QuestionCard, ResultSummary)
 │   └─ common/         (StageCard, ProgressBar, NavHeader)
 ├─ stores/            (progress.ts, content.ts)
 ├─ router/
 └─ assets/images/     (organized by stage: assets/images/stage-1/...)
```

**Deliverable:** Empty-but-running app with routing and Vuetify theme configured (recommend a warm, editorial color palette — this is a design app, it should look designed).

**Estimate:** 1 day.

---

## Phase 2: Lesson Viewer (the "Learn" layer)

**Tasks:**
1. Build `LessonViewer.vue` — renders a lesson's text, images, and exercise callout from JSON
2. Build `StageMap.vue` (home screen) — shows all 8 stages as cards, locked/unlocked based on progress, with completion badges
3. Build stage navigation — lesson-by-lesson progression within a stage, with a "next" button that unlocks after minimum scroll/time (optional — prevents just clicking through)
4. Wire up the progress store: mark a lesson "read" when visited

**Deliverable:** Fully browsable content for all 8 stages, text + images, no games/quizzes yet.

**Estimate:** 2-3 days (mostly component work, content is already structured from Phase 0).

---

## Phase 3: Visual Assets (Images)

This runs **in parallel** with Phase 2, since it doesn't block component development (placeholders can be used first).

**Approach by image type:**

| Image type | Best source | Example use |
|---|---|---|
| Technical diagrams (9-head croquis grid, dart pivot, balance line, repeat-type grids) | SVG, built with the Visualizer/diagram tool — precise, small, easy to recolor/theme consistently | Stage 2, 4, 7 |
| Conceptual/mood illustrations (mood board example, fabric texture examples, color contrast demo) | AI-generated illustration, flat/editorial style, one consistent style guide applied across all 8 stages | Stage 1, 3, 6 |
| Real reference photos (fabric weave close-ups, historical garment examples) | Curated stock/reference photography — use sparingly, only where a real photo genuinely adds understanding | Stage 4, 5 |

**Tasks:**
1. Define one consistent **visual style guide** first (palette, line weight, illustration style) — do this before generating 40+ images, or the site will look inconsistent
2. Build the SVG diagrams for the "hard" technical concepts (these are the highest-value images — proportion grids, dart manipulation, repeat patterns)
3. Generate supporting illustrations for conceptual sections
4. Optimize all assets (SVG minification, WebP conversion for raster images) before adding to `assets/images/`

**Estimate:** Highest-variance phase. Budget 3-5 images per stage minimum (24-40 images total). With a defined style guide, expect 2-4 hours per stage.

---

## Phase 4: Games (the "Play" layer)

Build one reusable **game shell** first, then 8 game-specific implementations plugged into it.

**Tasks:**
1. Build `GameShell.vue` — common wrapper (instructions screen → play area → result screen → "retry" or "continue")
2. Implement games roughly in this priority order (easiest → hardest, so early wins build momentum):

| Order | Stage | Game | Core mechanic |
|---|---|---|---|
| 1 | 1 | Customer-brief matching | Drag cards to match pairs — simplest mechanic, good template for others |
| 2 | 3 | Color contrast challenge | Click/select the "correct" perception answer, timed rounds |
| 3 | 7 | Repeat-tile puzzle | Drag tiles into a grid, snap-to-check for seamless alignment |
| 4 | 2 | Croquis builder | Drag proportion blocks onto a 9-unit grid, validate against correct ratios |
| 5 | 8 | Mini-brand simulator | Multi-step decision form feeding into a live price calculator |
| 6 | 4 | Dart pivot puzzle | Rotate/drag a dart segment, visually "close" one dart and "open" another |
| 7 | 6 | Slash-and-spread interactive | Click slash lines, drag to spread, watch flat shape gain implied volume |
| 8 | 5 | Dress-form pin placement | Click landmark points on a static form image, validate against correct positions |

3. Each game reports a score/completion event to the progress store

**Deliverable:** 8 working games, each 2-10 minutes of play time.

**Estimate:** 1-3 days per game depending on complexity — budget ~15-20 days total for all 8. This is the largest single phase; consider shipping v1 with 3-4 simpler games and adding the rest incrementally rather than blocking launch on all 8.

---

## Phase 5: Quizzes (the "Test" layer)

**Tasks:**
1. Build `QuizRunner.vue` — takes a `questions[]` array, handles MCQ/true-false/fill-blank rendering, scoring, and immediate feedback per question
2. Build `ResultSummary.vue` — shows score, which questions were missed, and a "review lesson" link back to the relevant content
3. Wire stage quizzes (from Phase 0 content) into this runner
4. Set a pass threshold (e.g., 70%) that determines whether the next stage unlocks

**Deliverable:** All 8 stage quizzes functional, gating progression.

**Estimate:** 1-2 days for the engine (reused everywhere), + content is already drafted in Phase 0.

---

## Phase 6: Cumulative Glossary Test

**Tasks:**
1. Aggregate `terms.json` — every term/definition pair introduced across completed stages
2. Build a glossary test mode: term → pick correct definition (or reverse), pulling only from terms in stages already unlocked
3. Optionally implement simple spaced repetition: terms answered wrong reappear sooner in future glossary tests (can store a per-term "difficulty" score in the progress store)
4. Add a standalone `/glossary` browse page (not just a test) — useful as a reference she can revisit

**Deliverable:** A growing, cumulative vocabulary test that stays relevant as she progresses.

**Estimate:** 2-3 days.

---

## Phase 7: Progress, Certificate & Polish

**Tasks:**
1. Finalize the progress store: per-lesson read status, per-game completion, per-quiz score, glossary mastery
2. Build a `/certificate` or summary screen — visually satisfying completion state once all 8 stages are done
3. Add a persistent nav showing overall % completion
4. QA pass: check Uzbek text rendering, mobile responsiveness, image loading performance
5. (Optional) Wrap as a installable PWA for offline use

**Estimate:** 2-3 days.

---

## Phase 8: Deployment

**Tasks:**
1. `npm run build` → static `dist/` folder
2. Deploy target per your decision in the Project Overview's open questions:
   - **Netlify/Vercel:** connect repo, zero-config deploy, free tier is enough
   - **Self-hosted (Nginx):** copy `dist/` to your server, serve as static files — fits your existing Linux/Nginx setup from earlier projects
3. Set up a simple CI step (optional) so future content updates (new images, tweaked quiz questions) auto-deploy on push

**Estimate:** Half a day.

---

## Suggested Build Order (v1 Minimum Viable Version)

If you want something usable quickly rather than all 8 stages fully polished at once, this order gets a real end-to-end experience fastest:

1. Phase 0 for **Stage 1 only**
2. Phase 1 (scaffold)
3. Phase 2 (lesson viewer) — for Stage 1
4. Phase 5 (quiz engine) — for Stage 1
5. Phase 4 — **one simple game** (the customer-matching game) for Stage 1
6. Phase 8 (deploy) — get Stage 1 fully live end-to-end

Once this full vertical slice works and feels right, repeat Phases 0/2/4/5 for Stages 2-8 — by then all the reusable components (LessonViewer, QuizRunner, GameShell) already exist, so each additional stage is much faster than the first.

---

## Rough Total Timeline

| Phase | Estimate |
|---|---|
| 0 — Content structuring | 2 days |
| 1 — Scaffold | 1 day |
| 2 — Lesson viewer | 3 days |
| 3 — Visual assets | 5-8 days (parallel) |
| 4 — Games (all 8) | 15-20 days |
| 5 — Quizzes | 2 days |
| 6 — Glossary test | 3 days |
| 7 — Progress/certificate/polish | 3 days |
| 8 — Deployment | 0.5 day |
| **Total (all 8 stages, all games)** | **~5-6 weeks of focused solo work** |
| **MVP (Stage 1 vertical slice only)** | **~1 week** |

---

## Next Step

Before writing any code, the highest-leverage next action is **Phase 0 for Stage 1**: turning `1-Bosqich_Dizayn_Nazariyasi_va_Sanoat.md` into a `stage-1.json` following the content model. Once that shape is proven for one stage, the same pattern repeats mechanically for the other 7 — and I can generate that JSON directly from the markdown files already created, whenever you're ready to start.
