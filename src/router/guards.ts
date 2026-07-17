import { useSessionStore } from '@/stores/session'

export const routerGuards = (to: any, from: any) => {
  const session = useSessionStore()
  if (!session.isLoggedIn && to.name !== 'login') {
    return { name: 'login' }
  } else if (session.isLoggedIn && to.name === 'login') {
    return { name: 'stage-map' }
  }
  return true
}