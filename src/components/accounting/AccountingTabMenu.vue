<template>
  <div class="tab-full-wrapper">
    <el-tabs v-model="active" class="accounting-tabs" @tab-click="onTabClick">
      <el-tab-pane label="자원 사용 기록" name="history" />
      <el-tab-pane label="사용 추이" name="trend" />
      <el-tab-pane label="운영 성과 분석" name="performance" />
      <el-tab-pane label="분기 정산" name="quarter" />
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 라우트 기반으로 활성 탭 매칭
const active = ref(getTabName(route.path))

function getTabName(path) {
  if (path.includes('/admin/accounting/usage-history')) return 'history'
  if (path.includes('/admin/accounting/usage-trend')) return 'trend'
  if (path.includes('/admin/accounting/performance')) return 'performance'
  if (path.includes('/admin/accounting/quarter')) return 'quarter'
  return 'history'
}

// 탭 클릭 시 라우팅 처리
function onTabClick(tab) {
  switch (tab.props.name) {
    case 'history':
      router.push('/admin/accounting/usage-history')
      break
    case 'trend':
      router.push('/admin/accounting/usage-trend')
      break
    case 'performance':
      router.push('/admin/accounting/performance')
      break
    case 'quarter':
      router.push('/admin/accounting/quarter')
      break
  }
}

// 탭 active-bar 재계산
onMounted(async () => {
  await nextTick()
})

// 라우팅 변경되면 탭 활성 상태 갱신
watch(
  () => route.path,
  (newPath) => {
    active.value = getTabName(newPath)
  },
)
</script>

<style scoped>
/* Element Plus 탭 전체 넓이 */
/* Element Plus 탭 전체 넓이 */
.accounting-tabs :deep(.el-tabs__header) {
  width: 100%;
}

/* nav flex로 확장 */
.accounting-tabs :deep(.el-tabs__nav) {
  display: flex;
  width: 100%;
}

/* Element Plus 기본 탭 스타일과 동일하게 설정 */
.accounting-tabs :deep(.el-tabs__item) {
  flex: 1;
  text-align: center;

  /* 예약 탭과 동일하게 맞춘 값 */
  font-size: 14px !important;
  font-weight: 500 !important;
  line-height: 40px !important;
  height: 40px !important;
  padding: 0 !important;

  color: #6b7280;
}

/* hover 초록색 */
.accounting-tabs :deep(.el-tabs__item:hover) {
  color: #00a950 !important;
}

/* active 초록색 */
.accounting-tabs :deep(.el-tabs__item.is-active) {
  color: #00a950 !important;
  font-weight: 600 !important; /* 활성 탭만 조금 더 강조 */
}

/* active bar 초록색 */
.accounting-tabs :deep(.el-tabs__active-bar) {
  background-color: #00a950 !important;
  height: 3px !important;
}
</style>
