# Fashion Design Learning Platform - Implementation Plan

## Project Overview
Vue 3 + Vuetify 3 fashion design learning platform with glassmorphism design, covering 8 stages of fashion education. No backend - all data stored in localStorage.

## Architecture

### Data Model
Two localStorage keys:
- `fashion_app_session` → `{ name, createdAt }`
- `fashion_app_progress` → `{ version, currentStageId, stages, glossary, updatedAt }`

### Authentication Flow
1. On app load, check localStorage for session
2. If present → skip login, go to stage map
3. If missing → show name input screen
4. No password, just name for personalization

## Implementation Phases

### Phase 1: Project Setup ✅
- [x] Vite scaffold with Vue 3 + TypeScript
- [x] Vuetify 3 installation and configuration
- [x] Pinia state management setup
- [x] Vue Router configuration with guards
- [x] PWA support via vite-plugin-pwa
- [x] Netlify deployment configuration

### Phase 2: Core Stores ✅
- [x] Session store (login/logout/hydrate)
- [x] Progress store (stage tracking, quiz scores, glossary stats)
- [x] Content store (stage loading, terms)

### Phase 3: View Components ✅
- [x] LoginView.vue - User authentication with name input
- [x] StageMapView.vue - Stage selection grid with locked/unlocked states
- [x] StageLearnView.vue - Lesson viewer with tabs
- [x] StagePlayView.vue - Game wrapper with dynamic component loading
- [x] StageTestView.vue - Quiz/test interface
- [x] GlossaryView.vue - Term browser with search/filter
- [x] CertificateView.vue - Completion certificate

### Phase 4: Game Components ✅
- [x] matching-game.vue - Client-design matching (stage-1)
- [x] drag-build-game.vue - Croquis body parts placement (stage-2)
- [x] perception-challenge-game.vue - Color illusion test (stage-3)
- [x] rotate-puzzle-game.vue - Dart pivot puzzle (stage-4)
- [x] point-placement-game.vue - Landmark point placement (stage-5)
- [x] interactive-diagram-game.vue - Slash-and-spread simulator (stage-6)
- [x] tile-matching-game.vue - Repeat pattern matching (stage-7)
- [x] brand-simulator-game.vue - Brand pricing simulator (stage-8)

### Phase 5: Content & Assets ✅
- [x] 8 stage JSON content files (src/content/)
- [x] Terms JSON file (src/content/terms.json)
- [x] SVG placeholder images for all stages (public/assets/images/)

### Phase 6: Styling ✅
- [x] Glassmorphism CSS theme (src/glassmorphism.css)
- [x] Animations (fade-in, scale-in, float)
- [x] Responsive design

### Phase 7: Deployment ✅
- [x] Netlify configuration (netlify.toml)
- [x] SPA redirects configured
- [x] PWA manifest and service worker

## Progress Tracking Rules
- Lesson read: marked when lesson screen is opened
- Game completed: marks `gameCompleted: true` + stores `gameBestScore`
- Quiz: stores `quizBestScore`, `quizPassed` when score >= threshold
- Stage completed: all lessons read + game completed + quiz passed

## Testing Strategy
- Manual testing via `npm run dev`
- Build verification via `npm run build`
- PWA functionality testing in browser

## Accessibility
- Vuetify components provide built-in accessibility
- Glassmorphism design maintains contrast ratios
- Keyboard navigation support