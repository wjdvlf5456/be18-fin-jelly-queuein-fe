<template>
  <div>

    <!-- 헤더 -->
    <div class="header-row">
      <h2>사용자 예약 내용 조회</h2>
    </div>

    <!-- 날짜 필터 -->
    <ReservationFilters @change="handleFilterChange" />

    <!-- 예약 목록 -->
    <ReservationTable
      :filters="selectedFilters"
      :key="tableKey"
      @open-detail="openDetailModal"
    />

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
import { ref, watch } from 'vue'


import ReservationFilters from '@/components/reservation/ReservationFilter.vue'
import ReservationTable from '@/components/reservation/UserReservationTable.vue'
import ReservationDetailModal from '@/components/reservation/ReservationDetailModal.vue'
import { reservationApi } from '@/api/reservationApi'
import { Search } from '@element-plus/icons-vue'
// 검색어
const search = ref('')
const tableData = ref([])
const total = ref(0)
// 기본 날짜 (오늘)
const selectedDate = ref(new Date().toISOString().split('T')[0])

const handleSaveNote = async (note) => {
  if (!reservationDetail.value) return
  reservationDetail.value.note = note
  refreshTable()
}
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
const refreshTable = () => {
  fetchUserReservations()
  tableKey.value += 1
}

const handleFilterChange = (filters) => {
  selectedFilters.value = {
    ...selectedFilters.value, // 기존 key 유지
    ...filters,               // 변경된 필터 적용
  }

  selectedDate.value = filters.date
  refreshTable()
}

// 모달 관련 상태
const modalOpen = ref(false)
const reservationDetail = ref(null)

// 테이블 갱신용 key
const tableKey = ref(0)

// 날짜 변경 handler
const handleDateChange = (filters) => {
  selectedDate.value = filters.date
  refreshTable()
}

/* ------------------------------------
   상세 조회 API 호출
------------------------------------ */
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

/* ------------------------------------
   모달 액션 처리
------------------------------------ */
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

/* 모달 닫기 */
const closeModal = () => {
  modalOpen.value = false
}
watch(
  () => selectedFilters.value.assetName,
  () => {
    fetchUserReservations()
  },
)
async function fetchUserReservations() {
  try {
    const params = buildParams()
    const res = await reservationApi.getUserReservations(params)
    tableData.value = res.data.content ?? []
    total.value = res.data.totalElements ?? 0
  } catch (err) {
    console.error('예약 조회 실패:', err)
  }
}
function buildParams() {
  const params = {}
  Object.entries(selectedFilters.value).forEach(([key, value]) => {
    if (value === '' || value === undefined || value === null) {
      return   // -> key 자체를 생략 (delete 효과)
    }
    params[key] = value
  })
  return params
}

</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-input {
  width: 260px;
}

.tabs-full-row {
  margin-bottom: 15px;
}
</style>
