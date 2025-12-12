<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { authApi } from '@/api/authApi'
import { hasRole } from '@/utils/role'
import NotificationDropdown from '@/components/notification/NotificationDropdown.vue'

// Vue 3 + Vite 표준: 로고 이미지 import
import logoUrl from '@/assets/icons/logo.svg'

const route = useRoute()
const router = useRouter()

// 검색 관련
const searchQuery = ref('')
const showSearchResults = ref(false)
const selectedIndex = ref(-1)

// 검색 가능한 메뉴 목록 (권한별)
const searchableMenus = computed(() => {
  const menus = []
  const role = localStorage.getItem('role') || ''
  const isAdminOrManager = hasRole('MANAGER')
  const isAdminOnly = hasRole('ADMIN')

  // 공통 메뉴
  menus.push(
    {
      label: '대시보드',
      path: hasRole('ADMIN') ? '/admin' : '/app',
      keywords: ['대시보드', 'dashboard', '홈', '메인'],
    },
    {
      label: '예약 관리',
      path: '/app/reservations/me',
      keywords: ['예약', 'reservation', '예약관리', '내예약', '예약목록'],
    },
    {
      label: '일정 관리',
      path: '/app/reservations/monthly',
      keywords: ['일정', 'schedule', '일정관리', '스케줄', '캘린더', '월별', '주별'],
    },
    {
      label: '예약 가능 자원',
      path: '/app/reservations/available-assets',
      keywords: ['예약가능', '자원', 'available', 'asset', '예약가능자원'],
    },
    {
      label: '예약 신청',
      path: '/app/reservations/apply',
      keywords: ['예약신청', '신청', 'apply', '예약하기'],
    },
    {
      label: '마이페이지',
      path: '/app/users/me',
      keywords: ['마이페이지', 'mypage', '내정보', '프로필', '정보수정'],
    },
  )

  // MANAGER 이상
  if (isAdminOrManager) {
    menus.push(
      {
        label: '자원 관리',
        path: '/admin/assets',
        keywords: ['자원', 'asset', '자원관리', '리소스', '자원목록'],
      },
      {
        label: '카테고리 관리',
        path: '/admin/assets/categories',
        keywords: ['카테고리', 'category', '카테고리관리'],
      },
      {
        label: '신청 예약 관리',
        path: '/admin/reservations/applied',
        keywords: ['신청예약', 'applied', '예약승인', '승인대기'],
      },
      {
        label: '자원 사용 기록',
        path: '/admin/accounting/usage-history',
        keywords: ['사용기록', 'usage', 'history', '기록'],
      },
      {
        label: '사용 추이',
        path: '/admin/accounting/usage-trend',
        keywords: ['사용추이', 'trend', '추이', '통계'],
      },
      {
        label: '운영 성과 분석',
        path: '/admin/accounting/performance',
        keywords: ['성과', 'performance', '분석', '성과분석'],
      },
      {
        label: '분기 정산',
        path: '/admin/accounting/quarter',
        keywords: ['분기', 'quarter', '정산', '분기정산'],
      },
    )
  }

  // ADMIN 이상
  if (isAdminOnly) {
    menus.push(
      {
        label: '유저 관리',
        path: '/admin/users',
        keywords: ['유저', 'user', '사용자', '유저관리', '사용자관리', '사용자목록'],
      },
      {
        label: '역할 관리',
        path: '/admin/roles',
        keywords: ['역할', 'role', '역할관리', '역할목록'],
      },
      {
        label: '권한 관리',
        path: '/admin/permissions/list',
        keywords: ['권한', 'permission', '권한관리', '권한목록', '매핑'],
      },
      {
        label: '사용법 가이드',
        path: '/admin/guide',
        keywords: ['가이드', 'guide', '사용법', '설명서', '위키', '안내'],
      },
    )
  }

  // 일반 사용자용 가이드
  if (!isAdminOnly) {
    menus.push({
      label: '사용법 가이드',
      path: '/app/guide',
      keywords: ['가이드', 'guide', '사용법', '설명서', '위키'],
    })
  }

  return menus
})

// 필터링된 검색 결과
const filteredMenus = computed(() => {
  if (!searchQuery.value.trim()) {
    return []
  }

  const query = searchQuery.value.toLowerCase().trim()
  return searchableMenus.value.filter((menu) => {
    const labelMatch = menu.label.toLowerCase().includes(query)
    const keywordMatch = menu.keywords.some((keyword) => keyword.toLowerCase().includes(query))
    return labelMatch || keywordMatch
  })
})

// 검색어 입력 핸들러
function handleSearchInput(event) {
  searchQuery.value = event.target.value
  showSearchResults.value = searchQuery.value.trim().length > 0
  selectedIndex.value = -1
}

// 검색 결과 클릭 또는 엔터
function navigateToMenu(menu) {
  if (menu) {
    router.push(menu.path)
    searchQuery.value = ''
    showSearchResults.value = false
    selectedIndex.value = -1
  }
}

// 엔터 키 핸들러
function handleKeyDown(event) {
  if (event.key === 'Enter') {
    if (selectedIndex.value >= 0 && filteredMenus.value[selectedIndex.value]) {
      navigateToMenu(filteredMenus.value[selectedIndex.value])
    } else if (filteredMenus.value.length > 0) {
      navigateToMenu(filteredMenus.value[0])
    }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (selectedIndex.value < filteredMenus.value.length - 1) {
      selectedIndex.value++
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (selectedIndex.value > 0) {
      selectedIndex.value--
    }
  } else if (event.key === 'Escape') {
    searchQuery.value = ''
    showSearchResults.value = false
    selectedIndex.value = -1
  }
}

// 외부 클릭 시 검색 결과 닫기
function handleClickOutside(event) {
  const searchBox = event.target.closest('.search-box-wrapper')
  if (!searchBox) {
    showSearchResults.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

//const emit = defineEmits(['toggle-sidebar'])

// ===============================
// 🧩 로그인 사용자 정보 가져오기
// ===============================
const role = localStorage.getItem('role') || ''
const name = (localStorage.getItem('userName') || '').trim()

// ===============================
// 🧑 이름 우선 표시 + 역할 보조 처리
// ===============================
const roleText = computed(() => {
  if (name) return name // DB 이름이 있으면 가장 우선!
  return (
    {
      MASTER: '마스터',
      ADMIN: '관리자',
      MANAGER: '매니저',
    }[role] || '사용자'
  )
})

// ===============================
// 🏷️ 역할 텍스트 (역할만 표시)
// ===============================
const currentRoleText = computed(() => {
  return (
    {
      MASTER: '마스터',
      ADMIN: '관리자',
      MANAGER: '매니저',
      GENERAL: '일반 사용자',
    }[role] || '사용자'
  )
})

// ===============================
// 👤 아바타 글자 (이름 첫글자 · 김민준 → 김)
// ===============================
const avatarText = computed(() => {
  return name ? name.trim().charAt(0) : roleText.value.charAt(0)
})

// 마이페이지로 이동
function goMyPage() {
  router.push({ name: 'MyPage' })
}

// 로고 클릭 시 역할에 맞는 대시보드로 이동
function goToDashboard() {
  if (hasRole('ADMIN')) {
    // 이미 /admin 경로에 있으면 리로드, 아니면 이동
    if (route.path === '/admin' || route.path.startsWith('/admin/')) {
      router.push('/admin').then(() => {
        // 페이지 리로드를 위해 window.location 사용 (선택적)
        // 또는 그냥 push만 해도 redirect로 /admin/users로 이동
      })
    } else {
      router.push('/admin')
    }
  } else {
    // 이미 /app 경로에 있으면 리로드, 아니면 이동
    if (route.path === '/app' || route.path.startsWith('/app/')) {
      router.push('/app').then(() => {
        // 페이지 리로드 (선택적)
      })
    } else {
      router.push('/app')
    }
  }
}

// ===============================
// 🔐 로그아웃
// ===============================
async function logout() {
  await authApi.logout()
  localStorage.removeItem('accessToken')
  localStorage.removeItem('role')
  localStorage.removeItem('userName')
  router.push('/')
}

// ===================================
// 🧭 Breadcrumb 매핑 테이블
// ===================================
const breadcrumbMap = {
  assets: '자원',
  list: '자원 목록 조회',
  create: '자원 등록',
  edit: '자원 수정',
  'usage-history': '자원 사용 기록 조회',
  'usage-trend': '사용 추이',
  performance: '운영 성과 분석',
  quarter: '분기 정산',
  reservations: '예약',
  'available-assets': '가능 자원',
  me: '사용자 예약',
  applied: '신청 예약',
  monthly: '스케쥴 확인',
  apply: '신청하기',
  'create-reservation': '예약하기',

  // 기타
  categories: '카테고리 관리',
  accounting: '정산 관리',
  usage: '정산 관리',
  users: '유저 관리',
  roles: '역할 관리',
  permissions: '권한 관리',
  list: '권한 관리',
  schedule: '일정 관리',
  reservation: '예약 관리',
  guide: '설명서',
}

// ===============================
// 📌 Breadcrumb 경로 매핑 함수
// ===============================
function getBreadcrumbPath(label, currentPath) {
  const pathMap = {
    '유저 관리': '/admin/users',
    '역할 관리': '/admin/roles',
    '권한 관리': '/admin/permissions/list',
    자원: '/admin/assets',
    '자원 목록 조회': '/admin/assets',
    '자원 등록': '/admin/assets/create',
    '자원 사용 기록 조회': '/admin/accounting/usage-history',
    '사용 추이': '/admin/accounting/usage-trend',
    '운영 성과 분석': '/admin/accounting/performance',
    '분기 정산': '/admin/accounting/quarter',
    예약: '/app/reservations/me',
    '가능 자원': '/app/reservations/available-assets',
    '사용자 예약': '/app/reservations/me',
    '마이 페이지': '/app/users/me',
    '신청 예약': '/admin/reservations/applied',
    '스케쥴 확인': '/app/reservations/monthly',
    신청하기: '/app/reservations/apply',
    예약하기: '/app/reservations/create-reservation',
    '카테고리 관리': '/admin/assets/categories',
    '정산 관리': '/admin/accounting/usage-history',
    '일정 관리': '/app/reservations/monthly',
    '예약 관리': '/app/reservations/me',
    설명서: hasRole('ADMIN') ? '/admin/guide' : '/app/guide',
  }

  // 자원 수정은 동적 경로이므로 현재 경로 사용
  if (label === '자원 수정') {
    return currentPath
  }

  return pathMap[label] || currentPath
}

// ===============================
// 📌 Breadcrumb 항목 생성
// ===============================
const breadcrumbItems = computed(() => {
  let segments = route.path.split('/').filter(Boolean)

  // 기술 경로 제거 (admin/app)
  const basePath = segments[0] === 'admin' ? '/admin' : segments[0] === 'app' ? '/app' : ''
  if (segments[0] === 'admin' || segments[0] === 'app') {
    segments = segments.slice(1)
  }

  if (segments.length === 0) return []

  // 중복 제거: permissions와 list가 연속으로 오면 permissions만 표시
  // 숫자 세그먼트(PK)는 breadcrumb에서 제외
  const filtered = []
  for (let i = 0; i < segments.length; i++) {
    const current = segments[i]
    const next = segments[i + 1]

    // permissions 다음에 list가 오면 list는 건너뛰기
    if (current === 'permissions' && next === 'list') {
      filtered.push(current)
      i++ // list도 건너뛰기
    }
    // 숫자 세그먼트(PK)는 breadcrumb에서 제외
    else if (/^\d+$/.test(current)) {
      // 숫자 세그먼트는 건너뛰기 (PK이므로 표시하지 않음)
      continue
    } else {
      filtered.push(current)
    }
  }

  // IAM 관련 페이지 처리: users, roles, permissions를 "유저 관리"로 통합
  const items = []
  let currentPath = basePath

  for (let i = 0; i < filtered.length; i++) {
    const current = filtered[i]
    const prev = i > 0 ? filtered[i - 1] : null
    currentPath += '/' + current

    // users 다음에 me가 오는 경우 "마이 페이지"로 표시
    if (prev === 'users' && current === 'me') {
      items.push({
        label: '마이 페이지',
        path: currentPath,
      })
      continue
    }

    // users 다음에 숫자(userId)가 오는 경우 "사용자 상세 조회"로 표시
    if (prev === 'users' && /^\d+$/.test(current)) {
      items.push({
        label: '사용자 상세 조회',
        path: currentPath,
      })
      continue
    }

    // IAM 관련 페이지인 경우
    if (current === 'users' || current === 'roles' || current === 'permissions') {
      // 첫 번째 IAM 페이지면 "유저 관리" 추가
      if (items.length === 0 || items[items.length - 1].label !== '유저 관리') {
        items.push({
          label: '유저 관리',
          path: '/admin/users',
        })
      }

      // 현재 페이지에 맞는 하위 항목 추가
      if (current === 'users') {
        // users는 이미 "유저 관리"로 표시되므로 추가하지 않음
      } else if (current === 'roles') {
        items.push({
          label: '역할 관리',
          path: '/admin/roles',
        })
      } else if (current === 'permissions') {
        items.push({
          label: '권한 관리',
          path: '/admin/permissions/list',
        })
      }
    } else {
      // IAM 관련이 아니면 기존 로직대로 매핑
      const label = breadcrumbMap[current] || current
      const path = getBreadcrumbPath(label, currentPath)
      items.push({ label, path })
    }
  }

  return items
})
</script>

<template>
  <header class="header">
    <div class="left">
      <button class="menu-btn" @click="$emit('toggle-sidebar')">
        <i class="ri-menu-line"></i>
      </button>

      <div class="logo" @click="goToDashboard" style="cursor: pointer">
        <img :src="logoUrl" alt="QueueIn Logo" class="logo-img" />
      </div>

      <div class="breadcrumb">
        <template v-for="(item, index) in breadcrumbItems" :key="index">
          <router-link
            v-if="item.path && index < breadcrumbItems.length - 1"
            :to="item.path"
            class="breadcrumb-item"
          >
            {{ item.label }}
          </router-link>
          <span
            v-else
            class="breadcrumb-item"
            :class="{ current: index === breadcrumbItems.length - 1 }"
          >
            {{ item.label }}
          </span>
          <span v-if="index < breadcrumbItems.length - 1" class="breadcrumb-divider"> / </span>
        </template>
      </div>
    </div>

    <div class="right">
      <div class="search-box-wrapper">
        <div
          class="search-box"
          :class="{ 'has-results': showSearchResults && filteredMenus.length > 0 }"
        >
          <i class="ri-search-line"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="메뉴 검색..."
            @input="handleSearchInput"
            @keydown="handleKeyDown"
            @focus="showSearchResults = searchQuery.trim().length > 0"
          />
        </div>

        <!-- 검색 결과 드롭다운 -->
        <div v-if="showSearchResults && filteredMenus.length > 0" class="search-results">
          <div
            v-for="(menu, index) in filteredMenus"
            :key="menu.path"
            class="search-result-item"
            :class="{ selected: selectedIndex === index }"
            @click="navigateToMenu(menu)"
            @mouseenter="selectedIndex = index"
          >
            <i class="ri-arrow-right-s-line"></i>
            <span>{{ menu.label }}</span>
          </div>
        </div>

        <!-- 검색 결과 없음 -->
        <div
          v-if="showSearchResults && searchQuery.trim() && filteredMenus.length === 0"
          class="search-results"
        >
          <div class="search-no-results">
            <span>검색 결과가 없습니다</span>
          </div>
        </div>
      </div>

      <NotificationDropdown />

      <div class="profile" @click="goMyPage" style="cursor: pointer">
        <div class="avatar">{{ avatarText }}</div>
        <div class="profile-info">
          <span class="profile-name">{{ roleText }}</span>
          <span class="profile-role">{{ currentRoleText }}</span>
        </div>
      </div>

      <i class="ri-question-line icon"></i>

      <button class="logout" @click="logout">
        <i class="ri-logout-box-line"></i>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  height: 70px;
  width: 100%;
  background: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;
  position: sticky;
  top: 0;
  z-index: 50;
}

/* LEFT */
.left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: opacity 0.2s;
}

.logo:hover {
  opacity: 0.8;
}

.logo-img {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.menu-btn {
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
}

/* Breadcrumb */
.breadcrumb {
  font-size: 15px;
  color: #777;
  margin-left: 50px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-item {
  color: #4b5563;
  background: #f3f4f6;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 500;
  display: inline-block;
  transition: all 0.2s ease;
  text-decoration: none;
  cursor: pointer;
}

.breadcrumb-item:first-child {
  color: #1f2937;
  background: #e5e7eb;
  font-weight: 600;
}

.breadcrumb-item:hover {
  background: #e5e7eb;
}

.breadcrumb-item.current {
  color: #1f2937;
  background: #e5e7eb;
  font-weight: 600;
  cursor: default;
}

.breadcrumb-item.router-link-active {
  color: #1f2937;
  background: #e5e7eb;
}

::v-deep .breadcrumb-divider {
  color: #9ca3af;
  margin: 0 4px;
  font-size: 12px;
}

/* RIGHT */
.right {
  display: flex;
  align-items: center;
  gap: 18px;
}

.search-box-wrapper {
  position: relative;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  padding: 6px 10px;
  border-radius: 8px;
  width: 220px;
  gap: 8px;
  transition: all 0.2s ease;
}

.search-box.has-results {
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #e5e7eb;
}

.search-box input {
  border: none;
  outline: none;
  width: 100%;
  background: transparent;
  font-size: 14px;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
  margin-top: -1px;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover,
.search-result-item.selected {
  background: #f3f4f6;
}

.search-result-item i {
  color: #6b7280;
  font-size: 16px;
}

.search-result-item span {
  color: #1f2937;
  font-weight: 500;
  font-size: 14px;
}

.search-no-results {
  padding: 16px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.icon {
  font-size: 20px;
  cursor: pointer;
  color: #444;
}

.profile {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.2;
}

.profile-role {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.2;
}

.avatar {
  width: 32px;
  height: 32px;
  background: #b8a57a;
  border-radius: 50%;
  color: white;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 20px;
}
</style>
