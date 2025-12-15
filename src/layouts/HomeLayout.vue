<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

import AccountingTabs from '@/components/accounting/AccountingTabMenu.vue'
import ReservationTabs from '@/components/reservation/ReservationTab.vue'
import ChatWidget from '@/components/chat/ChatWidget.vue'

/* ---------------------------
   경로 기반 탭 자동 표시
--------------------------- */
const route = useRoute()

const currentTabType = computed(() => {
  const path = route.path

  if (path.startsWith('/app/reservations/monthly')) return null
  if (path.startsWith('/app/reservations')) return 'reservation'
  if (path.startsWith('/admin/reservations/applied')) return 'reservation'
  if (path.startsWith('/admin/accounting')) return 'accounting'

  return null
})

/* ---------------------------
   사이드바 동작 (고정 + hover)
--------------------------- */
const isFixedOpen = ref(false)
const isHoverOpen = ref(false)

const isSidebarOpen = computed(() => isFixedOpen.value || isHoverOpen.value)

function toggleSidebar() {
  isFixedOpen.value = !isFixedOpen.value
}

function openHover() {
  if (!isFixedOpen.value) isHoverOpen.value = true
}

function closeHover() {
  if (!isFixedOpen.value) isHoverOpen.value = false
}

/* ---------------------------
   페이지 전환 효과
--------------------------- */
const previousPath = ref(null)
const transitionName = ref('fade')

// 예약 탭 경로 순서 정의 (슬라이드 방향 결정용)
const reservationRouteOrder = {
  '/app/reservations/me': 1,
  '/app/reservations/available-assets': 2,
  '/app/reservations/create-reservation': 3,
  '/app/reservations/apply': 3,
  '/admin/reservations/applied': 4,
}

// 경로 변경 감지 및 Transition 이름 결정
watch(
  () => route.path,
  (newPath, oldPath) => {
    // 예약 탭 간 이동인지 확인
    const currentOrder = reservationRouteOrder[newPath]
    const prevOrder = oldPath ? reservationRouteOrder[oldPath] : null

    if (currentOrder && prevOrder) {
      // 순서가 증가하면 우측 슬라이드, 감소하면 좌측 슬라이드
      transitionName.value = currentOrder > prevOrder ? 'slide-left' : 'slide-right'
    } else {
      // 예약 탭이 아니면 기본 페이드
      transitionName.value = 'fade'
    }

    previousPath.value = oldPath

    // 경로 변경 정보를 sessionStorage에 저장 (컴포넌트 재생성 시 사용)
    if (oldPath) {
      sessionStorage.setItem('previousRoutePath', oldPath)
    }
  },
  { immediate: false },
)

// Transition 완료 후 이벤트 발생
function onTransitionEnter() {
  setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent('route-transition-complete', {
        detail: {
          path: route.path,
          previousPath: previousPath.value || sessionStorage.getItem('previousRoutePath'),
        },
      }),
    )
  }, 50)
}
</script>

<template>
  <div class="layout">
    <!-- 상단 헤더 -->
    <AppHeader @toggle-sidebar="toggleSidebar" />

    <!-- 사이드바 오버레이 -->
    <div v-if="isSidebarOpen" class="overlay" @click="isFixedOpen = false"></div>

    <!-- 사이드바 -->
    <AppSidebar
      :open="isSidebarOpen"
      @hover-open="openHover"
      @hover-close="closeHover"
      @close-sidebar="isFixedOpen = false"
    />

    <!-- 헤더 바로 아래 탭 메뉴 -->
    <div v-if="currentTabType === 'accounting'" class="tab-wrapper">
      <AccountingTabs />
    </div>
    <div v-if="currentTabType === 'reservation'" class="tab-wrapper">
      <ReservationTabs />
    </div>

    <!-- 메인 컨텐츠 -->
    <main class="content">
      <RouterView v-slot="{ Component }">
        <Transition :name="transitionName" mode="out-in" @after-enter="onTransitionEnter">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>

    <AppFooter />
    <ChatWidget />
  </div>
</template>

<style scoped>
/* ===== 전체 레이아웃 ===== */
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #fff;
}

/* ===== 상단 탭 메뉴 ===== */
.tab-wrapper {
  background: white;

  /* 모든 padding 제거 → 탭이 상단에 딱 붙음 */
  padding: 0;

  /* 화면 꽉 차게 */
  width: 100%;
  box-sizing: border-box;

  z-index: 10;
}

/* ===== 메인 컨텐츠 ===== */
.content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden; /* 슬라이드 애니메이션을 위한 overflow-x 숨김 */

  /* 화면 내용은 적당히 padding 유지 - 더 넓은 간격 */
  padding: 32px;
  background: white;
  box-sizing: border-box;

  /* 전환 효과를 위한 position 설정 */
  position: relative;
}

/* ===== 오버레이 ===== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 20;
}

/* ===== 페이지 전환 애니메이션 ===== */

/* 기본 페이드 전환 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 슬라이드 전환 (좌측에서 우측으로) */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 슬라이드 전환 (우측에서 좌측으로) */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
