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
  {
    path: '/stage/:id/learn',
    name: 'stage-learn',
    component: () => import('../views/StageLearnView.vue'),
    props: true,
  },
  {
    path: '/stage/:id/play',
    name: 'stage-play',
    component: () => import('../views/StagePlayView.vue'),
    props: true,
  },
  {
    path: '/stage/:id/test',
    name: 'stage-test',
    component: () => import('../views/StageTestView.vue'),
    props: true,
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