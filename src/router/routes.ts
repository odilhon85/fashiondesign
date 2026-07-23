const routes = [
  {
    path: '/',
    name: 'stage-map',
    component: () => import('../views/StageMapView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
  },
  // Main stage view with tabs (default)
  {
    path: '/stage/:id',
    name: 'stage',
    component: () => import('../views/StageView.vue'),
    props: true,
  },
  // Backward-compatible routes that open the same page with a specific tab via query
  {
    path: '/stage/:id/learn',
    redirect: (to: any) => ({ name: 'stage', params: to.params, query: { tab: 'learn' } }),
  },
  {
    path: '/stage/:id/play',
    redirect: (to: any) => ({ name: 'stage', params: to.params, query: { tab: 'play' } }),
  },
  {
    path: '/stage/:id/test',
    redirect: (to: any) => ({ name: 'stage', params: to.params, query: { tab: 'test' } }),
  },
  {
    path: '/glossary',
    name: 'glossary',
    component: () => import('../views/GlossaryView.vue'),
  },
  {
    path: '/certificate',
    name: 'certificate',
    component: () => import('../views/CertificateView.vue'),
  },
]

export default routes
