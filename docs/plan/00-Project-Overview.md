# Fashion Design Learning Platform - Project Overview

## Description
Vue 3 + Vuetify 3 based fashion design learning platform with glassmorphism design. No backend - all data stored in localStorage.

## Tech Stack
- **Framework**: Vue 3 + TypeScript + Vite
- **UI Library**: Vuetify 3
- **State Management**: Pinia
- **Routing**: Vue Router
- **PWA**: vite-plugin-pwa
- **Deployment**: Netlify

## Features
- 8 learning stages covering fashion design fundamentals
- Interactive games for each stage
- Quiz system with pass thresholds
- Glossary with search and filtering
- Progress tracking via localStorage
- Glassmorphism UI design
- Progressive Web App support

## Project Structure
```
src/
  components/
    games/           # Game components (matching, drag-build, etc.)
    common/          # Reusable components
    lesson/          # Lesson display components
    quiz/            # Quiz components
  stores/
    session.ts       # User session management
    progress.ts      # Learning progress tracking
    content.ts       # Stage content loading
  views/
    LoginView.vue    # Name input screen
    StageMapView.vue # Stage selection
    StageLearnView.vue # Lesson viewer
    StagePlayView.vue # Game interface
    StageTestView.vue # Quiz interface
    GlossaryView.vue # Term browser
    CertificateView.vue # Completion certificate
  content/           # JSON content files
    stage-1.json - stage-8.json
    terms.json
  router/
    index.ts
    routes.ts
    guards.ts
  glassmorphism.css  # Glassmorphism styling
```

## Deployment
Push to main branch triggers Netlify deployment automatically.