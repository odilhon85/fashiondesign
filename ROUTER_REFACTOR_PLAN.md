# Vue Router Refactor Plan (Single Source of Truth)

Goal:
- Make Vue Router the single source of truth for navigation and page rendering.
- Keep all existing design, layout, and workflow unchanged.
- Ensure refresh keeps user on current protected page if logged in.
- Ensure mobile Back button navigates inside app via router history.

Status Legend:
- [ ] Not started
- [/] In progress
- [x] Done

## Step 1 – Make App.vue use <router-view /> as single source of truth
[ ] Replace all internal “view” based conditional rendering in App.vue template with a single <router-view />.
[ ] Keep header, navigation UI, and layout exactly the same; only remove view-based switching logic.

## Step 2 – Clean up internal navigation logic in App.vue script
[ ] Remove or reduce:
    - The “view” ref used to switch screens.
    - Related routing-style state (currentStageId, stageTab, openLessonId) if they are only for screen switching.
[ ] Update functions like goLogin(), goMap(), openStage(), etc.:
    - Use router.push({ name: '...' }) instead of setting view.value.
[ ] Keep:
    - Session/progress hydration.
    - Content loading.
    - Login/user handling (use router.replace('/login') only when needed).

## Step 3 – Add a simple, safe route guard in main.ts
[ ] In beforeEach:
    - If user NOT logged in and tries any protected route → redirect to /login.
    - If user IS logged in → allow current route so refresh keeps you on that exact page.
[ ] Keep it minimal; no extra logic beyond protecting non-login routes.

## Step 4 – Ensure all internal navigations use router.push with named routes
[ ] In StageLearnView.vue:
    - Use router.push({ name: 'stage-map' }) for going back to map.
    - Use proper named routes instead of props/events that change App.vue state.
[ ] In StagePlayView.vue:
    - Same: use router.push with named routes (e.g., stage-map, certificate).
[ ] In StageTestView.vue:
    - Same: use router.push with named routes.
[ ] In any other view doing similar navigation:
    - Align to router-based navigation only.

## Step 5 – Verify behavior (no visual/workflow changes)
[ ] Confirm:
    - Login flow works exactly the same.
    - Stage map → learn/play/test flows work via routes.
    - Refreshing any protected page keeps you there if logged in.
    - No layout/design changes; only navigation/refresh behavior improved.

## Notes for future sessions (if continuing from another chat)
- Do NOT change visual design or component structure.
- Only adjust:
  - How screens are chosen (via router-view, not internal state).
  - How navigation happens (router.push with named routes).
  - Route guard logic in main.ts to respect login and current URL.
