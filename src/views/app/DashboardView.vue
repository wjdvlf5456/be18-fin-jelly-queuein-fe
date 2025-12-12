<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { userApi } from '@/api/iam/userApi.js'
import { reservationApi } from '@/api/reservationApi.js'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const router = useRouter()
const route = useRoute()

// 사용자 정보
const userInfo = ref(null)
const todayReservations = ref([])
const loading = ref(false)

// 오늘 날짜
const today = computed(() => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
})

// 통계
const stats = computed(() => {
  const total = todayReservations.value.length
  const approved = todayReservations.value.filter(r => r.status === 'APPROVED').length
  const pending = todayReservations.value.filter(r => r.status === 'PENDING').length
  const using = todayReservations.value.filter(r => r.status === 'USING').length
  
  return { total, approved, pending, using }
})

// 데이터 로드
async function loadData() {
  loading.value = true
  try {
    // 사용자 정보
    const userRes = await userApi.getMe()
    userInfo.value = userRes.data

    // 오늘 예약 조회
    const reservationRes = await reservationApi.getUserReservations({
      page: 0,
      size: 10,
      date: today.value
    })
    todayReservations.value = reservationRes.data.content || []
  } catch (e) {
    console.error('대시보드 데이터 로드 실패:', e)
  } finally {
    loading.value = false
  }
}

// 상태 태그 스타일
function getStatusSeverity(status) {
  const map = {
    APPROVED: 'success',
    PENDING: 'warning',
    REJECTED: 'danger',
    USING: 'info',
    COMPLETED: 'secondary',
    CANCELED: 'danger'
  }
  return map[status] || 'secondary'
}

function getStatusLabel(status) {
  const map = {
    APPROVED: '승인됨',
    PENDING: '대기중',
    REJECTED: '거부됨',
    USING: '사용중',
    COMPLETED: '완료',
    CANCELED: '취소됨'
  }
  return map[status] || status
}

// 날짜 포맷
function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// Transition 완료 이벤트 리스너
let transitionHandler = null

onMounted(() => {
  // 즉시 로드
  loadData()

  // Transition 완료 이벤트 리스너 등록
  transitionHandler = (event) => {
    const { path, previousPath } = event.detail
    // /app으로 돌아올 때
    if (path === '/app' && route.path === '/app') {
      if (previousPath && previousPath !== '/app') {
        console.log('[DashboardView] Transition 완료 - 다른 페이지에서 옴, 데이터 재로드')
        loadData()
      }
    }
  }

  window.addEventListener('route-transition-complete', transitionHandler)
})

onBeforeUnmount(() => {
  if (transitionHandler) {
    window.removeEventListener('route-transition-complete', transitionHandler)
  }
})

// 경로 변경 감지 (추가 보완)
watch(
  () => route.path,
  (newPath, oldPath) => {
    // /app으로 이동할 때
    if (newPath === '/app' && oldPath && oldPath !== '/app') {
      // 약간의 지연을 두어 transition 완료 후 로드
      setTimeout(() => {
        loadData()
      }, 100)
    }
  },
  { immediate: false }
)
</script>

<template>
  <div class="dashboard">
    <!-- 환영 메시지 -->
    <div class="welcome-section">
      <h1 class="welcome-title">
        안녕하세요, <span class="user-name">{{ userInfo?.userName || '사용자' }}</span>님! 👋
      </h1>
      <p class="welcome-subtitle">오늘도 QueueIn과 함께 효율적인 자원 관리를 시작하세요.</p>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-grid">
      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon total">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">오늘의 예약</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon approved">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.approved }}</div>
              <div class="stat-label">승인된 예약</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon pending">
              <i class="pi pi-clock"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pending }}</div>
              <div class="stat-label">대기중인 예약</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon using">
              <i class="pi pi-play-circle"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.using }}</div>
              <div class="stat-label">사용중</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- 빠른 액션 -->
    <Card class="quick-actions-card">
      <template #title>
        <div class="card-title">
          <i class="pi pi-bolt"></i>
          빠른 액션
        </div>
      </template>
      <template #content>
        <div class="quick-actions">
          <Button
            label="예약 신청"
            icon="pi pi-plus-circle"
            severity="success"
            @click="router.push('/app/reservations/apply')"
          />
          <Button
            label="예약 조회"
            icon="pi pi-list"
            severity="info"
            @click="router.push('/app/reservations/me')"
          />
          <Button
            label="예약 가능 자원"
            icon="pi pi-search"
            severity="secondary"
            @click="router.push('/app/reservations/available-assets')"
          />
          <Button
            label="일정 관리"
            icon="pi pi-calendar"
            severity="help"
            @click="router.push('/app/reservations/monthly')"
          />
        </div>
      </template>
    </Card>

    <!-- 오늘의 예약 -->
    <Card class="reservations-card">
      <template #title>
        <div class="card-title">
          <i class="pi pi-calendar-check"></i>
          오늘의 예약 ({{ today }})
        </div>
      </template>
      <template #content>
        <DataTable
          :value="todayReservations"
          :loading="loading"
          stripedRows
          class="p-datatable-sm"
          :emptyMessage="'오늘 예약된 항목이 없습니다.'"
        >
          <Column field="assetName" header="자원명" />
          <Column field="startTime" header="시작 시간">
            <template #body="{ data }">
              {{ formatDate(data.startTime) }}
            </template>
          </Column>
          <Column field="endTime" header="종료 시간">
            <template #body="{ data }">
              {{ formatDate(data.endTime) }}
            </template>
          </Column>
          <Column field="status" header="상태">
            <template #body="{ data }">
              <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- 사용법 가이드 -->
    <Card class="guide-card">
      <template #title>
        <div class="card-title">
          <i class="pi pi-book"></i>
          사용법 가이드
        </div>
      </template>
      <template #content>
        <div class="guide-content">
          <p>QueueIn 사용법이 궁금하신가요? 자세한 가이드를 확인해보세요.</p>
          <Button
            label="사용법 위키 보기"
            icon="pi pi-external-link"
            outlined
            @click="router.push('/app/guide')"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 환영 섹션 */
.welcome-section {
  margin-bottom: 32px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.user-name {
  color: #3b82f6;
}

.welcome-subtitle {
  font-size: 16px;
  color: #6b7280;
}

/* 통계 카드 그리드 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.approved {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.using {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

/* 카드 제목 */
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.card-title i {
  font-size: 20px;
}

/* 빠른 액션 */
.quick-actions-card {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* 예약 목록 */
.reservations-card {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 가이드 카드 */
.guide-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.guide-card :deep(.p-card-title) {
  color: white;
}

.guide-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.guide-content p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
}

.guide-card :deep(.p-button) {
  background: white;
  color: #667eea;
  border: none;
}

.guide-card :deep(.p-button:hover) {
  background: rgba(255, 255, 255, 0.9);
}

/* 반응형 */
@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .quick-actions {
    flex-direction: column;
  }

  .quick-actions :deep(.p-button) {
    width: 100%;
  }

  .guide-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
