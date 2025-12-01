// 역할 등급 정의 — 시스템 전체에서 공유
export const ROLE_LEVEL = {
  GENERAL: 1,
  MANAGER: 2,
  ADMIN: 3,
  MASTER: 4
}

// 현재 유저 role 가져오기
export function getUserRole() {
  return localStorage.getItem('role') || 'GENERAL'
}

// 현재 역할이 특정 역할 이상인지 체크
export function hasRole(required) {
  const role = getUserRole()
  return ROLE_LEVEL[role] >= ROLE_LEVEL[required]
}

// 범위형 체크
export function hasAnyRole(...roles) {
  const userRole = getUserRole()
  return roles.some(r => ROLE_LEVEL[userRole] >= ROLE_LEVEL[r])
}
