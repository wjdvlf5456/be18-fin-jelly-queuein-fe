<template>
  <div class="tab-full-wrapper">
    <div class="custom-tabs">
      <div
        v-for="(tab, index) in availableTabs"
        :key="tab.name"
        :class="['tab-item', { active: activeIndex === index }]"
        @click="handleTabClick(index)"
      >
        {{ tab.label }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { hasRole } from '@/utils/role'

const router = useRouter()
const route = useRoute()

// MANAGER 이상 (예약 관리용)
const isAdminOrManager = computed(() => hasRole('MANAGER'))

// 역할에 따라 표시할 탭 목록 결정
const availableTabs = computed(() => {
  const tabs = [
    { label: '예약 현황', name: 'status' },
    { label: '자원 목록', name: 'available' },
  ]

  // MANAGER 이상만 "예약 관리" 탭 표시
  if (isAdminOrManager.value) {
    tabs.push({ label: '예약 관리', name: 'applied' })
  }

  return tabs
})

// 활성 탭 인덱스 설정
const activeIndex = ref(getTabIndexByRoute(route.path))

function getTabIndexByRoute(path) {
  if (path.includes('/app/reservations/me')) return 0
  if (path.includes('/app/reservations/available-assets')) return 1
  // MANAGER 이상만 'applied' 탭 접근 가능
  if (path.includes('/admin/reservations/applied') && hasRole('MANAGER')) {
    return 2
  }
  return 0
}

function getTabNameByIndex(index) {
  const tabs = availableTabs.value
  return tabs[index]?.name || 'status'
}

function handleTabClick(index) {
  const tabName = getTabNameByIndex(index)
  console.log('탭 클릭:', tabName, '현재 경로:', route.path)

  let targetPath = ''
  switch (tabName) {
    case 'status':
      targetPath = '/app/reservations/me'
      break
    case 'available':
      targetPath = '/app/reservations/available-assets'
      break
    case 'applied':
      targetPath = '/admin/reservations/applied'
      break
  }

  // 같은 경로에 있어도 이벤트를 발생시켜 데이터 새로고침
  if (route.path === targetPath) {
    console.log('📍 같은 경로 - 강제 새로고침')
    setTimeout(() => {
      console.log(
        '📢 reservation-tab-changed 이벤트 발생 (같은 경로):',
        tabName,
        targetPath,
      )
      window.dispatchEvent(
        new CustomEvent('reservation-tab-changed', {
          detail: { tab: tabName, path: targetPath },
        }),
      )
    }, 50)
  } else {
    router.push(targetPath).then(() => {
      setTimeout(() => {
        console.log('📢 reservation-tab-changed 이벤트 발생:', tabName, targetPath)
        window.dispatchEvent(
          new CustomEvent('reservation-tab-changed', {
            detail: { tab: tabName, path: targetPath },
          }),
        )
      }, 500)
    })
  }
}

watch(
  () => route.path,
  (newPath) => {
    activeIndex.value = getTabIndexByRoute(newPath)
  },
)
</script>

<style scoped>
.tab-full-wrapper {
  width: 100%;
  margin-bottom: 32px;
  display: block;
}

.custom-tabs {
  display: flex;
  width: 100%;
  border-bottom: 1px solid #e5e7eb;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  user-select: none;
}

.tab-item:hover {
  color: #00a950;
}

.tab-item.active {
  color: #00a950;
  font-weight: 600;
  border-bottom-color: #00a950;
}
</style>
