# Fashion Design Learning Platform — Project Overview

## 1. Vision

Turn the 8 existing Uzbek-language markdown lessons into an interactive static web app that teaches a beginner fashion design curriculum through four layers per stage:

1. **Learn** — text + visual explanations (illustrations/diagrams per concept)
2. **Play** — a small stage-specific game that lets the learner *practice* the concept, not just read it
3. **Test** — a scored quiz covering the stage's content
4. **Glossary Test** — a cumulative terms/vocabulary check (spaced repetition style) pulling from all terms introduced so far

Target learner: a teenage beginner, self-paced, on desktop or mobile browser. Content is in Uzbek. No login required initially — progress can live in the browser, with an optional account layer later.

---

## 2. Scope (v1)

| In scope | Out of scope (v1) |
|---|---|
| 8 stages, each with lesson content, images, 1 game, 1 quiz | Multi-user classroom/teacher dashboard |
| Cumulative glossary/terms test | Real payment/subscription system |
| Progress tracking (local, later optional cloud sync) | Full CMS for non-technical content editors |
| Responsive static site (desktop + mobile browser) | Native mobile app (could be a v2 wrapper) |
| Certificate/summary screen at the end | Multiplayer or social features |

---

## 3. Content Architecture

Each of the 8 markdown files becomes a **Stage**. Each Stage is broken into **Lessons** (the QISM/sections already exist in the md files — these map naturally to lesson units).

### Content model (conceptual)

```
Stage
 ├─ id, title, description, order
 ├─ heroImage
 ├─ lessons[]
 │   ├─ id, title, bodyMarkdown, images[], keyTakeaways[]
 │   └─ terms[]   (term, definition — feeds the glossary)
 ├─ game
 │   ├─ type (matching | ordering | drag-drop | quiz-battle | simulation)
 │   ├─ config (game-specific data)
 ├─ quiz
 │   └─ questions[] (mcq | true-false | fill-blank | image-based)
 └─ glossaryTestPool   (auto-generated from all terms up to this stage)
```

This means: **before writing any UI code, the 8 markdown files need to be restructured into structured data (JSON)** — this is the single most important prerequisite step, covered in the Implementation Plan.

### Stage → Game type mapping (first draft, refined later)

| Stage | Core concept to gamify | Suggested game mechanic |
|---|---|---|
| 1. Design Theory & Industry | Target customer, design story | "Match the customer to the design brief" card matching |
| 2. Croquis & Illustration | 9-head proportions, balance line | Drag body-part blocks to build a correctly proportioned croquis |
| 3. Color Theory | Simultaneous contrast, warm/cool | "Same color, different background" perception challenge + color-mixing puzzle |
| 4. Pattern Making | Dart manipulation, grainline | Drag-and-rotate dart puzzle (pivot method simulation) |
| 5. Draping | Landmark lines, ease | Pin-placement simulation on a static dress-form image |
| 6. Couture & Pattern Magic | Slash-and-spread, cone geometry | Cut-and-spread interactive diagram → watch flat shape become 3D-ish |
| 7. Textile Design | Repeat types, seamless tiling | Tile-matching puzzle — arrange motifs into half-drop repeat |
| 8. Industry & Business | Pricing formula, market tiers | "Build your mini brand" decision simulator with a final price calculator |

---

## 4. Technology Stack (aligned to your existing skillset)

Since this is a **static site**, the frontend carries almost all the weight:

- **Frontend:** Vue 3 + Vuetify 3, built with Vite → outputs a static bundle deployable anywhere (Netlify, GitHub Pages, Nginx, Firebase Hosting)
- **Content storage:** JSON files (one per stage) generated from the markdown — no database needed for v1
- **State/progress:** Pinia store + `localStorage` persistence (no backend required for v1)
- **Diagrams/illustrations:** SVG-first (crisp, small file size, easy to theme/recolor) generated via the Visualizer/design tools, supplemented by AI-generated illustrations for anything non-diagrammatic (e.g., mood-board style imagery)
- **Games:** built as Vue components using plain drag-and-drop (native HTML5 DnD or a lightweight library like `vue-draggable-plus`) — no game engine needed, these are UI-interaction games, not 2D/3D games
- **Quiz engine:** a single reusable `<QuizRunner>` component driven by JSON question data, reused across all 8 stage quizzes + the glossary test
- **Optional v2 backend (only if cloud sync/accounts become a real need):** Spring Boot + PostgreSQL, exposing a small REST API for progress sync — this fits your existing stack and can be added without touching the frontend architecture, since progress is already abstracted behind a store

This keeps v1 **100% static and free to host**, while leaving a clean seam to add a Spring Boot backend later if you want progress to sync across devices (e.g., phone + laptop) or want to reuse this for other learners.

---

## 5. Non-functional requirements

- **Language:** UI chrome (buttons, nav, scores) and content both in Uzbek
- **Offline-friendly:** since it's static + localStorage, it should work with a simple PWA wrapper (installable, works with poor connectivity) — worth adding given mobile-first usage
- **Performance:** images optimized (SVG for diagrams, WebP for photos), lazy-loaded per stage
- **Accessibility:** large tap targets and readable font sizes (14-year-old on a phone), since this is a real usability constraint, not just a checkbox
- **No tracking/analytics needed for v1** — this is a private family project, not a public product

---

## 6. Success Criteria (what "done" looks like)

1. All 8 stages are browsable with lesson text + at least 3-5 supporting images each
2. Each stage has one working game that reinforces its core concept
3. Each stage has a scored quiz (pass/fail or percentage) with immediate feedback
4. A cumulative glossary test exists and grows as stages are completed
5. Progress persists across browser sessions (localStorage)
6. The whole thing runs as a static build — can literally be opened by double-clicking `index.html` after build, or deployed to any static host in one command
7. A final "certificate" or summary screen shows overall completion + score

---

## 7. Open Decisions (to confirm before implementation starts)

These affect early architecture choices, so worth deciding upfront:

1. **Hosting target** — do you want this on Netlify/Vercel (free, zero-ops), or self-hosted on your own server (more control, fits your Nginx setup)?
2. **Progress scope** — is this single-device only (localStorage is enough), or do you want it accessible from both her phone and a laptop (would justify the optional Spring Boot backend sooner)?
3. **Image style** — hand-illustrated/flat vector style (consistent, generated once) vs. a mix of photos and diagrams? This affects how many images need to be generated and how.
4. **Game fidelity** — simple/fast (2-3 days per game) vs. more polished/animated (1+ week per game)? This is the single biggest scope lever in the whole plan.
