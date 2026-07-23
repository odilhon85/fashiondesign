# Navigation Refactor Plan (Vue Router as Single Source of Truth)

Goal:
- Make Vue Router the single source of truth.
- Preserve all existing design, layout, and workflow.
- Ensure refresh on any protected page keeps you there if logged in.
- On mobile, Back should navigate inside app via router history.

Legend:
- [ ] Not started
- [/] In progress
- [x] Done

## Step 1: Confirm current routing setup
[x] Inspect router/routes.ts and all views for navigation patterns.
[x] Confirmed named routes:
    - login (/login)
    - stage-map (/)
    - stage-learn (/stage/:id/learn)
    - stage-play (/stage/:id/play)
    - stage-test (/stage/:id/test)
    - glossary (/glossary)
    - certificate (/certificate)

## Step 2: Add route guard in main.ts (global auth)
[x] In src/main.ts, after creating router and app:
   - On initial load / navigation:
       - If not logged in and path != '/login' → redirect to '/login'.
       - If logged in → allow current route (do NOT force stage-map).

## Step 3: Make App.vue use <router-view /> as single source of truth
[x] In src/App.vue:
   - Already uses <router-view /> as single source of truth.
   - No internal "view" state overriding routes.
   - Keeps session.hydrate(), progress.hydrate(), content.loadAllStages().
   - On mount: if not logged in and current route is not '/login' → router.replace('/login').
   - Does NOT force /stage-map when logged in; URL decides.

## Step 4: Adapt LoginView integration with router
[x] Ensure LoginView:
   - Stays as a normal routed view at "/login".
   - Emits "login" event with username to parent (App.vue).
[x] In App.vue:
   - onLoginEvent(username):
       - Sets user, saves session via session.saveSession(username).
       - If current route is '/login' → router.replace('/stage-map').

## Step 5: Ensure all internal navigations use router.push with named routes
[x] StageMapView → uses router.push({ name: 'stage-learn' })
[x] StageLearnView → uses router.push for map/lessons
[x] StagePlayView → uses router.push for map/lessons
[x] StageTestView → uses router.push to stage-learn
[x] GlossaryView → uses router.push to stage-map
[x] CertificateView → uses router.push to stage-map

[x] Final scan: confirmed no file uses "view" or similar global state to control pages.

## Step 6: Verify behavior (no visual changes)
[ ] Confirm:
   - Opening app without login → /login shown.
   - After login from /login → go to /stage-map via router.replace.
   - Refresh on any protected page while logged in → same page stays open.
   - Back button inside app uses router history (no browser exit).
