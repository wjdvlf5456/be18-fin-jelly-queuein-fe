// 역할 등급 정의
const ROLE_LEVEL = {
  'GENERAL': 1,
  'MANAGER': 2,
  'ADMIN': 3,
  'MASTER': 4
}

export function setupGuards(router) {
  router.beforeEach((to, from, next) => {

    if (!localStorage.getItem('accessToken')) localStorage.clear()

    const token = localStorage.getItem('accessToken')
    const role = localStorage.getItem('role')

    // 로그인 필요
    if (to.meta.requiresAuth && !token) {
      return next('/')
    }

    // 이미 로그인 했는데 로그인 페이지로 가면 리다이렉트
    if (to.path === '/' && token) {
      if (ROLE_LEVEL[role] >= ROLE_LEVEL['ADMIN']) {
        return next('/admin')
      }
      return next('/app')
    }

    // 권한 검증 (계층 구조 적용)
    if (to.meta.minRole) {
      const required = to.meta.minRole
      if (ROLE_LEVEL[role] < ROLE_LEVEL[required]) {
        return next('/403')
      }
    }

    next()
  })
}
