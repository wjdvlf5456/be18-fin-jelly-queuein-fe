<template>
  <div class="tab-full-wrapper">
    <el-tabs v-model="active" class="reservation-tabs" @tab-click="onTabClick">
      <el-tab-pane
        v-for="tab in availableTabs"
        :key="tab.name"
        :label="tab.label"
        :name="tab.name"
      />
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { hasRole } from '@/utils/role'

const router = useRouter()
const route = useRoute()

// MANAGER 이상 (예약 관리용)
const isAdminOrManager = computed(() => hasRole('MANAGER'))

// 역할에 따라 표시할 탭 목록 결정
const availableTabs = computed(() => {
  const tabs = [
    { label: '예약 현황', name: 'status' },
    { label: '예약 가능 자원 목록', name: 'available' },
  ]

  // MANAGER 이상만 "예약 관리" 탭 표시
  if (isAdminOrManager.value) {
    tabs.push({ label: '예약 관리', name: 'applied' })
  }

  return tabs
})

// 활성 탭 설정
const active = ref(getTabNameByRoute(route.path))

function getTabNameByRoute(path) {
  if (path.includes('/app/reservations/me')) return 'status'
  if (path.includes('/app/reservations/available-assets')) return 'available'
  // MANAGER 이상만 'applied' 탭 접근 가능
  if (path.includes('/admin/reservations/applied') && hasRole('MANAGER')) {
    return 'applied'
  }
  return 'status'
}

function onTabClick(tab) {
  console.log('탭 클릭:', tab.props.name, '현재 경로:', route.path)

  let targetPath = ''
  switch (tab.props.name) {
    case 'status':
      targetPath = '/app/reservations/me'
      // 같은 경로에 있어도 이벤트를 발생시켜 데이터 새로고침
      if (route.path === targetPath) {
        console.log('📍 같은 경로 - 강제 새로고침')
        setTimeout(() => {
          console.log(
            '📢 reservation-tab-changed 이벤트 발생 (같은 경로):',
            tab.props.name,
            targetPath,
          )
          window.dispatchEvent(
            new CustomEvent('reservation-tab-changed', {
              detail: { tab: tab.props.name, path: targetPath },
            }),
          )
        }, 50)
      } else {
        router.push('/app/reservations/me').then(() => {
          // 라우터 이동 완료 후 이벤트 발생 (Transition 완료 후 컴포넌트가 마운트된 후)
          // Transition 애니메이션이 400ms이므로, 충분한 시간을 두고 이벤트 발생
          setTimeout(() => {
            console.log('📢 reservation-tab-changed 이벤트 발생:', tab.props.name, targetPath)
            window.dispatchEvent(
              new CustomEvent('reservation-tab-changed', {
                detail: { tab: tab.props.name, path: targetPath },
              }),
            )
          }, 500)
        })
      }
      break
    case 'available':
      targetPath = '/app/reservations/available-assets'
      router.push('/app/reservations/available-assets')
      break
    case 'applied':
      targetPath = '/admin/reservations/applied'
      router.push('/admin/reservations/applied')
      break
  }
}

onMounted(async () => {
  await nextTick()
})

watch(
  () => route.path,
  (newPath) => {
    active.value = getTabNameByRoute(newPath)
  },
)
</script>

<style scoped>
.tab-full-wrapper {
  width: 100%;
  margin-bottom: 32px;
}

/* 탭 헤더 전체 가로폭 확장 */
.reservation-tabs :deep(.el-tabs__header) {
  width: 100%;
  margin: 0 !important;
  padding: 0 !important;
}

/* nav flex 배치 */
.reservation-tabs :deep(.el-tabs__nav) {
  display: flex;
  width: 100%;
  margin: 0 !important;
}

/* ElementPlus 기본 스타일 완전 통일 */
.reservation-tabs :deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
  padding: 0 !important;

  font-size: 14px !important;
  font-weight: 500 !important;
  height: 40px !important;
  line-height: 40px !important;
  color: #6b7280;

  /* 부드러운 색상 전환 */
  transition:
    color 0.3s ease,
    font-weight 0.3s ease !important;
}

/* hover — 초록색 */
.reservation-tabs :deep(.el-tabs__item:hover) {
  color: #00a950 !important;
}

/* active — 초록색 + 굵게 */
.reservation-tabs :deep(.el-tabs__item.is-active) {
  color: #00a950 !important;
  font-weight: 600 !important;
}

/* 초록색 바 */
.reservation-tabs :deep(.el-tabs__active-bar) {
  background-color: #00a950 !important;
  height: 3px !important;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
}
</style>
