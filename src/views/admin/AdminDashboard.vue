<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { userApi } from '@/api/iam/userApi.js'
import { reservationApi } from '@/api/reservationApi.js'
import { assetApi } from '@/api/assetApi.js'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

// 3D 효과를 위한 ref
const statCards = ref([])

// 3D 카드 효과 핸들러
function handleCard3D(event, card) {
  const rect = card.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const centerX = rect.width / 2
  const centerY = rect.height / 2

  const rotateX = (y - centerY) / 10
  const rotateY = (centerX - x) / 10

  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`
}

function resetCard3D(card) {
  card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)'
}

const router = useRouter()
const route = useRoute()

// 사용자 정보
const userInfo = ref(null)
const stats = ref({
  totalUsers: 0,
  totalReservations: 0,
  pendingReservations: 0,
  totalAssets: 0,
})
const loading = ref(false)

const role = computed(() => localStorage.getItem('role') || '')
const roleText = computed(() => {
  const map = {
    MASTER: '마스터',
    ADMIN: '관리자',
    MANAGER: '매니저',
  }
  return map[role.value] || '사용자'
})

// 데이터 로드
async function loadData() {
  loading.value = true
  try {
    // 사용자 정보
    const userRes = await userApi.getMe()
    userInfo.value = userRes.data

    // 통계 데이터 초기화
    stats.value = {
      totalUsers: 0,
      totalReservations: 0,
      pendingReservations: 0,
      totalAssets: 0,
    }

    // 전체 사용자 수 조회
    try {
      const usersRes = await userApi.searchUsers({
        page: 0,
        size: 1,
      })
      stats.value.totalUsers = usersRes.data.totalElements || 0
    } catch (e) {
      console.error('전체 사용자 수 조회 실패:', e)
    }

    // 전체 예약 수 조회
    // TODO: 백엔드에 전체 예약 수를 반환하는 전용 엔드포인트가 필요합니다.
    // 현재는 사용자별 예약 엔드포인트만 있어서 전체 예약 수를 정확히 가져올 수 없습니다.
    // 백엔드에 `/api/v1/reservations/stats` 또는 `/api/v1/admin/stats` 같은 통계 엔드포인트를 추가해야 합니다.
    try {
      // 임시로 대기중인 예약 수를 사용 (실제로는 전체 예약 수가 필요)
      // 전체 예약 수를 가져오려면 백엔드에 새 엔드포인트가 필요합니다.
      stats.value.totalReservations = 0
    } catch (e) {
      console.error('전체 예약 수 조회 실패:', e)
    }

    // 오늘 대기중인 예약 조회
    try {
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const res = await reservationApi.getAppliedReservations({
        page: 0,
        size: 1,
        date: todayStr,
      })
      stats.value.pendingReservations = res.data.totalElements || 0
    } catch (e) {
      console.error('대기 예약 조회 실패:', e)
    }

    // 전체 자원 수 조회
    try {
      const assetsRes = await assetApi.getDescendants({
        page: 0,
        size: 1,
      })
      stats.value.totalAssets = assetsRes.data.totalElements || 0
    } catch (e) {
      console.error('전체 자원 수 조회 실패:', e)
    }
  } catch (e) {
    console.error('대시보드 데이터 로드 실패:', e)
  } finally {
    loading.value = false
  }
}

// Transition 완료 이벤트 리스너
let transitionHandler = null

onMounted(() => {
  // 즉시 로드
  loadData()

  // Transition 완료 이벤트 리스너 등록
  transitionHandler = (event) => {
    const { path, previousPath } = event.detail
    // /admin으로 돌아올 때 (matrix에서 온 경우)
    if (path === '/admin' && route.path === '/admin') {
      if (previousPath && previousPath.startsWith('/admin/permissions')) {
        console.log('[AdminDashboard] Transition 완료 - permission에서 옴, 데이터 재로드')
        loadData()
      }
    }
  }

  window.addEventListener('route-transition-complete', transitionHandler)

  // 3D 효과를 위한 이벤트 리스너 등록
  nextTick(() => {
    const cards = document.querySelectorAll('.stat-card')
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => handleCard3D(e, card))
      card.addEventListener('mouseleave', () => resetCard3D(card))
    })
    statCards.value = Array.from(cards)
  })
})

onBeforeUnmount(() => {
  if (transitionHandler) {
    window.removeEventListener('route-transition-complete', transitionHandler)
  }

  // 3D 효과 이벤트 리스너 제거
  statCards.value.forEach((card) => {
    card.removeEventListener('mousemove', handleCard3D)
    card.removeEventListener('mouseleave', resetCard3D)
  })
})

// 경로 변경 감지 (추가 보완)
watch(
  () => route.path,
  (newPath, oldPath) => {
    // /admin으로 이동할 때 (다른 페이지에서)
    if (newPath === '/admin' && oldPath && oldPath.startsWith('/admin/permissions')) {
      // 약간의 지연을 두어 transition 완료 후 로드
      setTimeout(() => {
        loadData()
      }, 100)
    }
  },
  { immediate: false },
)
</script>

<template>
  <div class="admin-dashboard">
    <LoadingSpinner :visible="loading" message="대시보드 데이터를 불러오는 중입니다." />

    <!-- 환영 메시지 -->
    <div class="welcome-section">
      <h1 class="welcome-title">
        관리자 대시보드 <Tag :value="roleText" severity="info" class="role-tag" />
      </h1>
      <p class="welcome-subtitle">
        안녕하세요, <span class="user-name">{{ userInfo?.userName || '관리자' }}</span
        >님! 시스템을 관리하고 모니터링하세요.
      </p>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-grid">
      <Card class="stat-card users" @click="router.push('/admin/users')">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-users"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalUsers }}</div>
              <div class="stat-label">전체 사용자</div>
            </div>
            <Button icon="pi pi-arrow-right" text rounded @click.stop="router.push('/admin/users')" />
          </div>
        </template>
      </Card>

      <Card class="stat-card reservations" @click="router.push('/admin/reservations/applied')">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalReservations }}</div>
              <div class="stat-label">전체 예약</div>
            </div>
            <Button
              icon="pi pi-arrow-right"
              text
              rounded
              @click.stop="router.push('/admin/reservations/applied')"
            />
          </div>
        </template>
      </Card>

      <Card class="stat-card pending" @click="router.push('/admin/reservations/applied')">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-clock"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingReservations }}</div>
              <div class="stat-label">대기중인 예약</div>
            </div>
            <Button
              icon="pi pi-arrow-right"
              text
              rounded
              @click.stop="router.push('/admin/reservations/applied')"
            />
          </div>
        </template>
      </Card>

      <Card class="stat-card assets" @click="router.push('/admin/assets')">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-box"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalAssets }}</div>
              <div class="stat-label">전체 자원</div>
            </div>
            <Button icon="pi pi-arrow-right" text rounded @click.stop="router.push('/admin/assets')" />
          </div>
        </template>
      </Card>
    </div>

    <!-- 빠른 액션 -->
    <div class="actions-grid">
      <Card class="action-card" @click="router.push('/admin/users')">
        <template #title>
          <div class="card-title">
            <i class="pi pi-users"></i>
            사용자 관리
          </div>
        </template>
        <template #content>
          <div class="action-content">
            <p>사용자 계정 조회, 생성, 수정, 삭제</p>
            <Button
              label="사용자 관리"
              icon="pi pi-arrow-right"
              outlined
              @click.stop="router.push('/admin/users')"
            />
          </div>
        </template>
      </Card>

      <Card class="action-card" @click="router.push('/admin/roles')">
        <template #title>
          <div class="card-title">
            <i class="pi pi-shield"></i>
            역할 & 권한 관리
          </div>
        </template>
        <template #content>
          <div class="action-content">
            <p>역할 생성/수정 및 권한 매핑 관리</p>
            <div class="action-buttons">
              <Button
                label="역할 관리"
                icon="pi pi-arrow-right"
                outlined
                severity="info"
                @click.stop="router.push('/admin/roles')"
              />
              <Button
                label="권한 관리"
                icon="pi pi-arrow-right"
                outlined
                severity="help"
                @click.stop="router.push('/admin/permissions/list')"
              />
            </div>
          </div>
        </template>
      </Card>

      <Card class="action-card" @click="router.push('/admin/assets')">
        <template #title>
          <div class="card-title">
            <i class="pi pi-box"></i>
            자원 관리
          </div>
        </template>
        <template #content>
          <div class="action-content">
            <p>자원, 카테고리, 계층 구조 관리</p>
            <Button
              label="자원 관리"
              icon="pi pi-arrow-right"
              outlined
              severity="success"
              @click.stop="router.push('/admin/assets')"
            />
          </div>
        </template>
      </Card>

      <Card class="action-card" @click="router.push('/admin/accounting/usage-history')">
        <template #title>
          <div class="card-title">
            <i class="pi pi-chart-line"></i>
            정산 / 사용 관리
          </div>
        </template>
        <template #content>
          <div class="action-content">
            <p>사용 기록 조회, 정산 분석, 통계</p>
            <Button
              label="정산 관리"
              icon="pi pi-arrow-right"
              outlined
              severity="warning"
              @click.stop="router.push('/admin/accounting/usage-history')"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- 사용법 가이드 -->
    <Card class="guide-card" @click="router.push('/admin/guide')">
      <template #title>
        <div class="card-title">
          <i class="pi pi-book"></i>
          사용법 가이드
        </div>
      </template>
      <template #content>
        <div class="guide-content">
          <p>QueueIn 관리자 사용법이 궁금하신가요? 자세한 가이드를 확인해보세요.</p>
          <Button
            label="사용법 위키 보기"
            icon="pi pi-external-link"
            outlined
            @click.stop="router.push('/admin/guide')"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.admin-dashboard {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 70px);
}

/* 환영 섹션 */
.welcome-section {
  margin-bottom: 40px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-tag {
  font-size: 14px;
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
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.1s ease-out,
    box-shadow 0.3s ease;
  cursor: pointer;
  position: relative;
  transform-style: preserve-3d;
  will-change: transform;
}

.stat-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 4px;
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
  flex-shrink: 0;
}

.stat-card.users .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.reservations .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.pending .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card.assets .stat-icon {
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

/* 액션 그리드 */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.action-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  cursor: pointer;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

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

.action-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
}

.action-content p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 가이드 카드 */
.guide-card {
  margin-top: 200px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.guide-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
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
  .admin-dashboard {
    padding: 16px;
  }

  .stats-grid,
  .actions-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .guide-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
