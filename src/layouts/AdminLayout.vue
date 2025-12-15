<template>
  <div class="layout">
    <!-- 상단 헤더 -->
    <AppHeader @toggle-sidebar="toggleSidebar" />

    <!-- 사이드바 오버레이(모바일/좁은 화면일 때) -->
    <div v-if="isSidebarOpen" class="overlay" @click="isFixedOpen = false" />

    <!-- 사이드바 -->
    <AppSidebar
      :open="isSidebarOpen"
      @hover-open="openHover"
      @hover-close="closeHover"
      @close-sidebar="isFixedOpen = false"
    />

    <!-- 회계 메뉴 탭 (항상 헤더 밑에 위치) -->
    <AccountingTabMenu v-if="isAccountingPage" />

    <ReservationTabMenu v-if="isReservationPage" />

    <!-- 메인 컨텐츠 -->
    <main class="content">
      <RouterView v-slot="{ Component }">
        <Transition :name="transitionName" mode="out-in" @after-enter="onTransitionEnter">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>

    <!-- 푸터 -->
    <!-- <AppFooter /> -->
    <ChatWidget />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
// import AppFooter from '@/components/layout/AppFooter.vue'
import AccountingTabMenu from '@/components/accounting/AccountingTabMenu.vue'
import ChatWidget from '@/components/chat/ChatWidget.vue'
import ReservationTabMenu from '@/components/reservation/ReservationTab.vue'
const route = useRoute()

/* ✔ 경로가 /admin/accounting/** 일 때만 탭 메뉴 표시 */
const isAccountingPage = computed(() => route.path.startsWith('/admin/accounting'))

/* ✔ 사이드바 동작 상태 */
const isFixedOpen = ref(false)
const isHoverOpen = ref(false)
const isSidebarOpen = computed(() => isFixedOpen.value || isHoverOpen.value)
/* ✔ 경로가 /admin/reservations/** 일 때만 예약 탭 표시 */
const isReservationPage = computed(() =>
  route.path.startsWith('/admin/reservations'),
)


function toggleSidebar() {
  isFixedOpen.value = !isFixedOpen.value
}

function openHover() {
  if (!isFixedOpen.value) isHoverOpen.value = true
}

function closeHover() {
  if (!isFixedOpen.value) isHoverOpen.value = false
}

// IAM 페이지 경로 순서 정의 (슬라이드 방향 결정용)
const iamRouteOrder = {
  '/admin/users': 1,
  '/admin/roles': 2,
  '/admin/permissions/list': 3,
}

// 이전 경로 추적
const previousPath = ref(null)
const transitionName = ref('fade')

// 경로 변경 감지 및 Transition 이름 결정
watch(
  () => route.path,
  (newPath, oldPath) => {
    // IAM 페이지 간 이동인지 확인
    const currentOrder = iamRouteOrder[newPath]
    const prevOrder = oldPath ? iamRouteOrder[oldPath] : null

    if (currentOrder && prevOrder) {
      // 순서가 증가하면 우측 슬라이드, 감소하면 좌측 슬라이드
      transitionName.value = currentOrder > prevOrder ? 'slide-right' : 'slide-left'
    } else {
      // IAM 페이지가 아니면 기본 페이드
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

// Transition 완료 후 이벤트 발생 (약간의 지연을 두어 컴포넌트 마운트 완료 보장)
function onTransitionEnter() {
  // nextTick과 약간의 지연을 두어 컴포넌트가 완전히 마운트된 후 이벤트 발생
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

<style scoped>
/* ===== 레이아웃 전체 ===== */
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 화면 전체 고정 */
  overflow: hidden; /* 전체 페이지 스크롤 방지 */
}

/* ===== 메인 컨텐츠 ===== */
.content {
  flex: 1;
  background: white;

  /* 화면이 넘치지 않도록 내부만 스크롤 */
  overflow-y: auto;

  /* 더 넓은 여백으로 일관성 유지 */
  padding: 32px;

  box-sizing: border-box;
}

/* ===== 사이드바 오버레이 ===== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 20;
}

/* ===== 페이지 전환 애니메이션 ===== */

/* 우측 슬라이드 (사용자 → 역할, 역할 → 권한) */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-to,
.slide-right-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* 좌측 슬라이드 (역할 → 사용자, 권한 → 역할) */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-enter-to,
.slide-left-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* 기본 페이드 (IAM 페이지가 아닌 경우) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
