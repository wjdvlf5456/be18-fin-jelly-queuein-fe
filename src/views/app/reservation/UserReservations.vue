<template>
  <div>
    <LoadingSpinner :visible="isLoading" message="예약 정보를 불러오는 중입니다." />

    <!-- 헤더 -->
    <h2 class="page-title">예약 현황</h2>

    <!-- 예약 신청 버튼 -->
    <button class="target-btn" @click="navigateToReservableAssets">
      <el-icon><Plus /></el-icon>
      예약 신청
    </button>

    <!-- 날짜 필터 -->
    <ReservationFilters @change="handleFilterChange" />

    <!-- 예약 목록 테이블 -->
    <div>
      <el-table :data="rows" border style="width: 100%" @row-click="openRow" highlight-current-row>
        <!-- 선택 -->
        <el-table-column type="selection" width="48" />

        <!-- 기본 컬럼들 -->
        <el-table-column prop="assetName" label="자원명" width="130" align="center" />
        <el-table-column prop="assetType" label="자원 유형" width="110" align="center" />
        <el-table-column prop="categoryName" label="카테고리" width="110" align="center" />

        <!-- 자원 상태 -->
        <el-table-column label="자원 상태" width="120" align="center">
          <template #default="{ row }">
            <StatusTag :status="convertAssetStatus(row.assetStatus)" />
          </template>
        </el-table-column>

        <!-- 승인 여부 -->
        <el-table-column label="승인 여부" width="220" align="center">
          <template #default="{ row }">
            {{ row.isApproved ? '승인' : '미승인' }}
          </template>
        </el-table-column>

        <!-- 예약 시간 -->
        <el-table-column label="예약 시작/종료 시간" width="200" align="center">
          <template #default="{ row }">
            {{ formatTime(row.startAt) }} ~ {{ formatTime(row.endAt) }}
          </template>
        </el-table-column>

        <!-- 실제 시간 -->
        <el-table-column label="실제 시작/종료 시간" width="200" align="center">
          <template #default="{ row }">
            <span v-if="row.actualStartAt">
              {{ formatTime(row.actualStartAt) }} ~ {{ formatTime(row.actualEndAt) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <!-- 예약 상태 -->
        <el-table-column label="예약 상태" min-width="150" align="center">
          <template #default="{ row }">
            <StatusTag :status="row.reservationStatus" />
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination">
        <el-pagination
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="page"
          @current-change="changePage"
        />
      </div>
    </div>

    <!-- 상세 모달 -->
    <ReservationDetailModal
      v-model:visible="modalOpen"
      :asset="reservationDetail"
      @close="closeModal"
      @start="handleStart"
      @end="handleEnd"
      @cancel="handleCancel"
      @save-note="handleSaveNote"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onActivated, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'

import ReservationFilters from '@/components/reservation/ReservationFilter.vue'
import ReservationDetailModal from '@/components/reservation/ReservationDetailModal.vue'
import StatusTag from '@/components/reservation/ReservationStatus.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { reservationApi } from '@/api/reservationApi'
import { Plus } from '@element-plus/icons-vue'

const route = useRoute()

// 기본 날짜 (오늘)
const selectedDate = ref(new Date().toISOString().split('T')[0])

// 필터 상태
const selectedFilters = ref({
  date: selectedDate.value,
  assetType: '',
  assetStatus: '',
  categoryId: '',
  layerZero: '',
  layerOne: '',
  assetName: '',
  keyword: '',
})

// 테이블 데이터
const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

// 모달 관련 상태
const modalOpen = ref(false)
const reservationDetail = ref(null)

// ============================================
// 중복 호출 방지 메커니즘
// ============================================
// isLoading: 현재 요청 진행 중인지 확인 (동시 호출 방지)
const isLoading = ref(false)
// lastRequestKey: 마지막 요청의 고유 키 (동일 요청 중복 방지)
let lastRequestKey = null
// requestCounter: 요청 카운터 (요청 순서 추적용)
let requestCounter = 0

// ----------------------------
// 시간 포맷터
// ----------------------------
const formatTime = (instant) => {
  if (!instant) return '-'

  const d = new Date(instant)
  if (isNaN(d.getTime())) return '-'

  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const convertAssetStatus = (status) => {
  if (!status) return '-'

  switch (status.toUpperCase()) {
    case 'AVAILABLE':
    case 'ASSET_AVAILABLE':
      return 'ASSET_AVAILABLE' // 이용 가능
    case 'UNAVAILABLE':
    case 'ASSET_UNAVAILABLE':
      return 'ASSET_UNAVAILABLE' // 이용 불가
    default:
      return status
  }
}

// ============================================
// 단일 진입점: fetchReservations
// ============================================
// 모든 예약 조회 요청은 이 함수를 통해서만 실행됩니다.
// 중복 호출 방지, 이전 요청 취소, 동일 요청 스킵 로직이 포함되어 있습니다.
const fetchReservations = async (options = {}) => {
  // 옵션: { skipIfLoading: true } - 로딩 중이면 스킵
  // 옵션: { force: true } - 강제 실행 (로딩 중이어도 실행)
  const { skipIfLoading = false, force = false } = options

  // Guard 1: 이미 로딩 중이고 skipIfLoading이 true면 스킵
  if (isLoading.value && skipIfLoading && !force) {
    console.log('fetchReservations: 이미 로딩 중이므로 스킵')
    return
  }

  // 현재 요청 파라미터로 고유 키 생성 (동일 요청 중복 방지)
  const params = {
    page: page.value - 1,
    size: pageSize.value,
    date: selectedFilters.value.date,
    assetType: selectedFilters.value.assetType || undefined,
    assetStatus: selectedFilters.value.assetStatus || undefined,
    categoryId: selectedFilters.value.categoryId || undefined,
    layerZero: selectedFilters.value.layerZero || undefined,
    layerOne: selectedFilters.value.layerOne || undefined,
    assetName: selectedFilters.value.assetName || undefined,
  }

  // 빈 값 제거
  Object.keys(params).forEach((key) => {
    if (params[key] === '' || params[key] === undefined || params[key] === null) {
      delete params[key]
    }
  })

  // 요청 고유 키 생성 (JSON.stringify로 파라미터 비교)
  const requestKey = JSON.stringify(params)

  // Guard 2: 동일한 요청이 이미 진행 중이면 스킵
  if (lastRequestKey === requestKey && isLoading.value && !force) {
    console.log('fetchReservations: 동일한 요청이 이미 진행 중이므로 스킵', params)
    return
  }

  // 현재 요청 번호 저장 (나중에 응답이 왔을 때 최신 요청인지 확인)
  const currentRequestId = ++requestCounter
  isLoading.value = true
  lastRequestKey = requestKey

  try {
    console.log('fetchReservations 시작', route.path, params)

    const res = await reservationApi.getUserReservations(params)

    // Guard: 응답이 왔을 때 이 요청이 여전히 최신 요청인지 확인
    // 중간에 다른 요청이 와서 requestCounter가 증가했을 수 있음
    if (currentRequestId !== requestCounter) {
      console.log('fetchReservations: 더 최신 요청이 있어서 이 응답을 무시')
      return
    }

    // 요청 키가 변경되었는지 확인 (다른 파라미터로 요청이 왔을 수 있음)
    if (lastRequestKey !== requestKey) {
      console.log('fetchReservations: 요청 파라미터가 변경되어 이 응답을 무시')
      return
    }

    console.log('API 응답:', res?.data)

    rows.value = res?.data?.content ?? []
    total.value = res?.data?.totalElements ?? 0

    console.log('fetchReservations 완료 - rows:', rows.value.length, 'total:', total.value)
  } catch (err) {
    // 요청이 취소되었거나 더 최신 요청이 있으면 에러 무시
    if (currentRequestId !== requestCounter || lastRequestKey !== requestKey) {
      console.log('fetchReservations: 요청이 무시됨 (더 최신 요청 존재)')
      return
    }

    console.error('예약 조회 실패:', err)
    rows.value = []
    total.value = 0
  } finally {
    // 현재 요청이 마지막 요청인지 확인 (중간에 다른 요청이 왔을 수 있음)
    if (currentRequestId === requestCounter && lastRequestKey === requestKey) {
      isLoading.value = false
    }
  }
}

// ----------------------------
// Row 클릭 이벤트
// ----------------------------
const openRow = (row, column) => {
  if (!column || column.type === 'selection') return
  if (!row?.reservationId) return
  openDetailModal(row.reservationId)
}

// ----------------------------
// 필터 변경 핸들러
// ----------------------------
// 필터 컴포넌트에서 직접 호출되므로 강제 실행
const handleFilterChange = (filters) => {
  selectedFilters.value = {
    ...selectedFilters.value,
    ...filters,
  }
  selectedDate.value = filters.date
  page.value = 1
  fetchReservations({ force: true }) // 필터 변경은 항상 실행
}

// ----------------------------
// 페이지 변경
// ----------------------------
// 사용자가 명시적으로 페이지를 변경했으므로 강제 실행
const changePage = (newPage) => {
  page.value = newPage
  fetchReservations({ force: true })
}

// ----------------------------
// 테이블 갱신
// ----------------------------
// 모달 액션 후 명시적 갱신이므로 강제 실행
const refreshTable = () => {
  page.value = 1
  fetchReservations({ force: true })
}

// ----------------------------
// 상세 조회 API 호출
// ----------------------------
const openDetailModal = async (reservationId) => {
  try {
    const res = await reservationApi.getReservationDetail(reservationId)
    const d = res.data

    reservationDetail.value = {
      id: d.reservationId,
      name: d.assetName,
      status: d.reservationStatus,
      usage: d.reservationStatus,
      isApproved: d.isApproved,
      reserver: d.applicantName,
      approver: d.respondentName,
      assetStatus: d.assetStatus,
      date: d.date,
      startAt: d.startAt,
      endAt: d.endAt,
      actualStartAt: d.actualStartAt,
      actualEndAt: d.actualEndAt,
      participants: d.attendants,
      reason: d.reason,
      note: d.description,
    }

    modalOpen.value = true
  } catch (err) {
    console.error('상세 조회 실패:', err)
  }
}

// ----------------------------
// 모달 액션 처리
// ----------------------------
const handleStart = async (id) => {
  try {
    await reservationApi.startUsing(id)
    modalOpen.value = false
    refreshTable()
  } catch (err) {
    console.error('사용 시작 실패:', err)
  }
}

const handleEnd = async (id) => {
  try {
    await reservationApi.endUsing(id)
    modalOpen.value = false
    refreshTable()
  } catch (err) {
    console.error('사용 종료 실패:', err)
  }
}

const handleCancel = async (id) => {
  try {
    await reservationApi.cancel(id)
    modalOpen.value = false
    refreshTable()
  } catch (err) {
    console.error('예약 취소 실패:', err)
  }
}

const handleSaveNote = async (note) => {
  if (!reservationDetail.value) return
  reservationDetail.value.note = note
  refreshTable()
}

const closeModal = () => {
  modalOpen.value = false
}

// 예약 신청 페이지로 이동
const router = useRouter()
function navigateToReservableAssets() {
  router.push('/app/reservations/available-assets')
}

// ============================================
// 라우트/이벤트 감지 (중복 방지 적용)
// ============================================

// 라우트 경로 변경 감지
// 목적: 다른 페이지에서 이 페이지로 이동할 때 데이터 갱신
// 중복 방지: 초기 로드가 완료된 후에만 실행, skipIfLoading으로 로딩 중이면 스킵
watch(
  () => route.path,
  (newPath) => {
    if ((newPath === '/app/reservations/me' || newPath.startsWith('/app/reservations/me')) && isInitialLoadDone) {
      page.value = 1
      fetchReservations({ skipIfLoading: true }) // 로딩 중이면 스킵
    }
  },
  { immediate: false },
)

// 라우트 업데이트 감지 (같은 라우트에서 파라미터만 변경될 때)
// 목적: 쿼리 파라미터 변경 시 데이터 갱신
// 중복 방지: 초기 로드가 완료된 후에만 실행, skipIfLoading으로 로딩 중이면 스킵
onBeforeRouteUpdate((to) => {
  if (to.path === '/app/reservations/me' && isInitialLoadDone) {
    page.value = 1
    fetchReservations({ skipIfLoading: true })
  }
})

// 라우트 전환 완료 이벤트 감지
// 목적: Transition 애니메이션 완료 후 데이터 갱신
// 중복 방지: 초기 로드가 완료된 후에만 실행, skipIfLoading으로 로딩 중이면 스킵
const handleRouteTransitionComplete = (event) => {
  const targetPath = event?.detail?.path || route.path
  if (targetPath === '/app/reservations/me' && isInitialLoadDone) {
    page.value = 1
    fetchReservations({ skipIfLoading: true })
  }
}

// 탭 변경 이벤트 감지
// 목적: 예약 탭 클릭 시 데이터 갱신
// 중복 방지: 초기 로드가 완료된 후에만 실행, skipIfLoading으로 로딩 중이면 스킵
const handleTabChanged = (event) => {
  const targetPath = event?.detail?.path
  if ((targetPath === '/app/reservations/me' || event?.detail?.tab === 'status') && isInitialLoadDone) {
    page.value = 1
    fetchReservations({ skipIfLoading: true })
  }
}

// 필터 변경 감지 (deep watch)
// 목적: 필터 값이 변경될 때 자동으로 데이터 갱신
// 중복 방지: handleFilterChange에서 이미 처리하므로 여기서는 스킵
// 주의: handleFilterChange와 중복되지 않도록 이 watch는 제거하거나 조건 추가
watch(
  () => selectedFilters.value,
  (newFilters, oldFilters) => {
    // 초기 로드 시에는 실행하지 않음 (onMounted에서 처리)
    if (!oldFilters || Object.keys(oldFilters).length === 0) return
    // handleFilterChange에서 이미 처리하므로 여기서는 스킵
    // 만약 다른 경로로 필터가 변경될 수 있다면 아래 주석 해제
    // page.value = 1
    // fetchReservations({ skipIfLoading: true })
  },
  { deep: true },
)

// 이벤트 리스너를 onMounted에서 등록하여 컴포넌트가 마운트된 후에만 작동하도록
// 이렇게 하면 Transition 완료 후 컴포넌트가 마운트된 후에 리스너가 등록됨

// ============================================
// Lifecycle Hooks (중복 방지 적용)
// ============================================

// 초기 로드 완료 플래그 (중복 호출 방지)
let isInitialLoadDone = false

// 컴포넌트 마운트 시 초기 데이터 로드
// 목적: 페이지 최초 진입 시 데이터 로드
// 중복 방지: 초기 로드 플래그로 한 번만 실행
onMounted(async () => {
  await nextTick()

  // 이벤트 리스너 등록
  window.removeEventListener('reservation-tab-changed', handleTabChanged)
  window.removeEventListener('route-transition-complete', handleRouteTransitionComplete)
  window.addEventListener('reservation-tab-changed', handleTabChanged)
  window.addEventListener('route-transition-complete', handleRouteTransitionComplete)

  // 초기 로드는 한 번만 실행 (다른 트리거와 중복 방지)
  if (!isInitialLoadDone) {
    isInitialLoadDone = true
    page.value = 1
    fetchReservations({ force: true })
  }
})

// keep-alive로 인한 재활성화 시 데이터 갱신
// 목적: keep-alive된 컴포넌트가 다시 활성화될 때 데이터 갱신
// 중복 방지: skipIfLoading으로 로딩 중이면 스킵 (onMounted와 중복 방지)
onActivated(async () => {
  await nextTick()

  // 이벤트 리스너 재등록
  window.removeEventListener('reservation-tab-changed', handleTabChanged)
  window.removeEventListener('route-transition-complete', handleRouteTransitionComplete)
  window.addEventListener('reservation-tab-changed', handleTabChanged)
  window.addEventListener('route-transition-complete', handleRouteTransitionComplete)

  // 재활성화 시에는 로딩 중이 아니면 갱신
  page.value = 1
  fetchReservations({ skipIfLoading: true })
})

// 컴포넌트 언마운트 시 정리
onBeforeUnmount(() => {
  // 이벤트 리스너 제거
  window.removeEventListener('route-transition-complete', handleRouteTransitionComplete)
  window.removeEventListener('reservation-tab-changed', handleTabChanged)

  // 상태 초기화
  isLoading.value = false
  lastRequestKey = null
  isInitialLoadDone = false
})
</script>

<style scoped>
.reservation-page {
  width: 100%;
}

/* 페이지 타이틀 - Accounting과 동일한 스타일 */
.page-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
}

/* 버튼 - Accounting PerformanceView와 유사한 스타일 */
.target-btn {
  position: absolute;
  right: 40px;
  top: 130px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.target-btn:hover {
  background: #f9fafb;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

/* 테이블 스타일 개선 */
:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.el-table__header) {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

:deep(.el-table th) {
  background: transparent;
  color: #374151;
  font-weight: 600;
  font-size: 14px;
  padding: 16px;
  border-bottom: 2px solid #e5e7eb;
}

:deep(.el-table td) {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

:deep(.el-table__row:hover) {
  background: #f9fafb;
}

:deep(.el-table__row) {
  transition: background 0.2s ease;
}

/* 테이블 가로 스크롤(유령 scrollbar) 제거 */
.el-table__body-wrapper {
  overflow-x: hidden !important;
}

.el-table table {
  table-layout: fixed !important;
}

/* element-plus가 오른쪽에 자동으로 추가하는 여백 제거 */
.el-table__inner-wrapper {
  width: 100% !important;
}

/* 오른쪽 유령 여백 제거 */
:deep(.el-table__inner-wrapper) {
  width: 100% !important;
}

/* 가로 스크롤 강제 제거 */
:deep(.el-table__body-wrapper) {
  overflow-x: hidden !important;
}

/* 컬럼 width 계산 정확하게 */
:deep(.el-table table) {
  table-layout: fixed !important;
}

/* Element Plus가 자동으로 넣는 padding-right 제거 */
:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper) {
  padding-right: 0 !important;
}

/* 임의로 붙는 scrollbar placeholder 제거 */
:deep(.el-table__footer-wrapper),
:deep(.el-table__append-wrapper) {
  padding-right: 0 !important;
}
</style>
