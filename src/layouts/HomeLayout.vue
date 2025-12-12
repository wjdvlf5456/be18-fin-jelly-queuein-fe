<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

import ReservationTabs from '@/components/reservation/ReservationTab.vue'
import AccountingTabs from '@/components/accounting/AccountingTabMenu.vue'
import ChatWidget from '@/components/chat/ChatWidget.vue'

/* ---------------------------
   🔥 경로 기반 탭 자동 표시
--------------------------- */
const route = useRoute()

const currentTabType = computed(() => {
  const path = route.path

  if (path.startsWith('/app/reservations/monthly')) return null
  if (path.startsWith('/app/reservations')) return 'reservation'
  if (path.startsWith('/admin/accounting')) return 'accounting'

  return null
})

/* ---------------------------
   🔥 사이드바 동작 (고정 + hover)
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
   🔥 페이지 전환 효과
--------------------------- */
const previousPath = ref(null)
const transitionName = ref('fade')

// 경로 변경 감지 및 Transition 이름 결정
watch(
  () => route.path,
  (newPath, oldPath) => {
    // 기본적으로 페이드 전환 사용
    transitionName.value = 'fade'
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

    <!-- 🔥 헤더 바로 아래 탭 메뉴 -->
    <div v-if="currentTabType" class="tab-wrapper">
      <ReservationTabs v-if="currentTabType === 'reservation'" />
      <AccountingTabs v-if="currentTabType === 'accounting'" />
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

  /* 🔥 모든 padding 제거 → 탭이 상단에 딱 붙음 */
  padding: 0;

  /* 정산 탭처럼 탭만 표시되도록 */
  border-bottom: 1px solid #e5e7eb;

  /* 화면 꽉 차게 */
  width: 100%;
  box-sizing: border-box;

  z-index: 10;
}

/* ===== 메인 컨텐츠 ===== */
.content {
  flex: 1;
  overflow-y: auto;

  /* 화면 내용은 적당히 padding 유지 */
  padding: 20px;
  background: white;
  box-sizing: border-box;
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
</style>

