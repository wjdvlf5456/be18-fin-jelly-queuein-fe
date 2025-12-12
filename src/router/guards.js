import { hasRole } from '@/utils/role'

export function setupGuards(router) {
  router.beforeEach((to, from, next) => {
    // 이전 경로를 sessionStorage에 저장 (컴포넌트 재생성 시 사용)
    if (from.path) {
      sessionStorage.setItem('previousRoutePath', from.path)
    }

    const token = localStorage.getItem('accessToken')

    // 로그인 필요
    if (to.meta.requiresAuth && !token) {
      return next('/')
    }

    // 로그인 후 "/" 접근 → 자동 redirect
    if (to.path === '/' && token) {
      // 첫 로그인 체크 (가이드 미방문 여부)
      const hasVisitedGuide = localStorage.getItem('hasVisitedGuide')
      if (!hasVisitedGuide) {
        if (hasRole('ADMIN')) return next('/admin/guide')
        return next('/app/guide')
      }
      if (hasRole('ADMIN')) return next('/admin')
      return next('/app')
    }

    // 권한 체크 (meta.minRole이 있으면 그것을 우선, 없으면 /admin 경로는 ADMIN 필요)
    if (to.meta.minRole) {
      // meta에 명시된 권한 체크
      if (!hasRole(to.meta.minRole)) {
        return next('/403')
      }
    } else if (to.path.startsWith('/admin')) {
      // meta.minRole이 없고 /admin 경로면 ADMIN 권한 필요
      if (!hasRole('ADMIN')) {
        return next('/403')
      }
    }

    next()
  })
}
