<template>
  <div class="applied-reservations-wrapper">
    <div>
      <!-- 탭 네비게이션 -->
     

      <!-- 헤더 -->
      <div class="header-row">
        <h2>예약 관리</h2>

        <!-- <el-input
        v-model="selectedFilters.assetName"
        placeholder="검색어를 입력해주세요"
        class="search-input"
        @keyup.enter="refreshTable"
      >
        <template #append>
          <el-button :icon="Search" @click="refreshTable" />
        </template>
      </el-input> -->
      </div>

      <ReservationFilters @change="handleFilterChange" />

      <!-- 예약 목록 -->
      <ReservationTable :filters="selectedFilters" :key="tableKey" @open-detail="openDetailModal" />

      <ReservationDetailModal
        v-model:visible="modalOpen"
        :asset="reservationDetail"
        @close="closeModal"
        @save-reason="updateReason"
        @approve="onApprove"
        @reject="onReject"
      /><!-- 부모에서 emit reason 처리-->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '@/api/axios'

import ReservationTab from '@/components/reservation/ReservationTab.vue'
import ReservationFilters from '@/components/reservation/ReservationFilter.vue'
import ReservationTable from '@/components/reservation/AppliedReservationTable.vue'
import ReservationDetailModal from '@/components/reservation/ReservationApplyDetailModal.vue'
import { ElMessage } from 'element-plus'

const handleFilterChange = (filters) => {
  selectedFilters.value = { ...filters } // 필터 전체 반영
  selectedDate.value = filters.date // 날짜도 따로 필요하면 그대로
  refreshTable()
}
const selectedDate = ref(new Date().toISOString().split('T')[0])
// 테이블 갱신용 key
const tableKey = ref(0)
const refreshTable = () => {
  tableKey.value += 1
}

const selectedFilters = ref({
  date: selectedDate.value,
  assetName: '', // 검색바 입력값 포함
  assetType: '',
  assetStatus: '',
  categoryId: '',
  layerZero: '',
  layerOne: '',
})

const tableData = ref([])
const total = ref(0)

const modalOpen = ref(false)
const reservationDetail = ref(null)
const currentUserName = ref('')

async function fetchAppliedReservations() {
  try {
    if (!selectedFilters.value.date) {
      console.warn('날짜가 없습니다.')
      tableData.value = []
      total.value = 0
      return
    }

    const params = buildParams()
    const res = await api.get('/reservations/pending', { params })

    if (res?.data) {
      tableData.value = res.data.content ?? []
      total.value = res.data.totalElements ?? 0
    } else {
      console.warn('응답 데이터 형식이 올바르지 않습니다.')
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('승인 대기 예약 조회 실패:', error)
    ElMessage.error('승인 대기 예약을 불러오는데 실패했습니다.')
    tableData.value = []
    total.value = 0
  }
}

async function openDetailModal(reservationId) {
  try {
    if (!reservationId || isNaN(reservationId)) {
      ElMessage.warning('유효하지 않은 예약 ID입니다.')
      return
    }

    const res = await api.get(`/reservations/${reservationId}`)

    if (!res?.data) {
      ElMessage.error('예약 정보를 불러올 수 없습니다.')
      return
    }

    const d = res.data

    reservationDetail.value = {
      id: d.reservationId,
      version: d.version,
      name: d.assetName || '',
      status: d.reservationStatus || '',
      date: d.date || '',
      reserver: d.applicantName || '',
      approver: d.respondentName || '',

      startAt: d.startAt || '',
      endAt: d.endAt || '',

      actualStartAt: d.actualStartAt || '',
      actualEndAt: d.actualEndAt || '',

      participants: d.attendants || [],
      reason: d.reason || '',
      note: d.note || '',
      usage: d.reservationStatus || '',
      description: d.description || '',
    }

    modalOpen.value = true
  } catch (err) {
    console.error('상세 조회 실패:', err)

    let errorMessage = '예약 상세 정보를 불러오는데 실패했습니다.'

    if (err.response) {
      const status = err.response.status
      const data = err.response.data

      if (status === 404) {
        errorMessage = data?.message || '예약을 찾을 수 없습니다.'
      } else if (status === 403) {
        errorMessage = data?.message || '예약 조회 권한이 없습니다.'
      } else {
        errorMessage = data?.message || `예약 상세 정보를 불러오는데 실패했습니다. (${status})`
      }
    } else if (err.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
  }
}

function closeModal() {
  modalOpen.value = false
  reservationDetail.value = null
}

const updateReason = ({ reservationId, reason }) => {
  console.log('부모에서 받은 reason:', reason, 'reservationId:', reservationId)
  tableData.value = tableData.value.map((r) => (r.id === reservationId ? { ...r, reason } : r))
}

// 부모 컴포넌트
async function onApprove(payload) {
  try {
    // 유효성 검사
    if (!payload.reservationId) {
      ElMessage.warning('예약 ID가 없습니다.')
      return
    }

    if (payload.version === undefined || payload.version === null) {
      ElMessage.warning('예약 버전 정보가 없습니다.')
      return
    }

    if (!currentUserName.value) {
      ElMessage.warning('승인자 정보를 불러올 수 없습니다.')
      return
    }

    await api.patch(`/reservations/${payload.reservationId}/approve`, {
      version: payload.version,
      approverName: currentUserName.value,
      reason: payload.reason || '', // 모달에서 입력한 reason
    })

    ElMessage.success('예약이 승인되었습니다.')
    await fetchAppliedReservations() // 갱신
    closeModal()
  } catch (err) {
    console.error('승인 실패:', err)

    let errorMessage = '예약 승인에 실패했습니다.'

    if (err.response) {
      const status = err.response.status
      const data = err.response.data

      if (status === 400) {
        errorMessage = data?.message || '요청 정보가 올바르지 않습니다.'
      } else if (status === 403) {
        errorMessage = data?.message || '승인 권한이 없습니다.'
      } else if (status === 404) {
        errorMessage = data?.message || '예약을 찾을 수 없습니다.'
      } else if (status === 409) {
        errorMessage = data?.message || '예약 상태가 변경되었습니다. 새로고침 후 다시 시도해주세요.'
      } else {
        errorMessage = data?.message || `예약 승인에 실패했습니다. (${status})`
      }
    } else if (err.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
  }
}

async function onReject(payload) {
  try {
    // 유효성 검사
    if (!payload.reservationId) {
      ElMessage.warning('예약 ID가 없습니다.')
      return
    }

    if (payload.version === undefined || payload.version === null) {
      ElMessage.warning('예약 버전 정보가 없습니다.')
      return
    }

    if (!currentUserName.value) {
      ElMessage.warning('승인자 정보를 불러올 수 없습니다.')
      return
    }

    if (!payload.reason || payload.reason.trim() === '') {
      ElMessage.warning('거절 사유를 입력해주세요.')
      return
    }

    await api.patch(`/reservations/${payload.reservationId}/reject`, {
      version: payload.version,
      approverName: currentUserName.value,
      reason: payload.reason.trim(),
    })

    ElMessage.success('예약이 거절되었습니다.')
    await fetchAppliedReservations()
    closeModal()
  } catch (err) {
    console.error('거절 실패:', err)

    let errorMessage = '예약 거절에 실패했습니다.'

    if (err.response) {
      const status = err.response.status
      const data = err.response.data

      if (status === 400) {
        errorMessage = data?.message || '요청 정보가 올바르지 않습니다.'
      } else if (status === 403) {
        errorMessage = data?.message || '거절 권한이 없습니다.'
      } else if (status === 404) {
        errorMessage = data?.message || '예약을 찾을 수 없습니다.'
      } else if (status === 409) {
        errorMessage = data?.message || '예약 상태가 변경되었습니다. 새로고침 후 다시 시도해주세요.'
      } else {
        errorMessage = data?.message || `예약 거절에 실패했습니다. (${status})`
      }
    } else if (err.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
  }
}

function getKSTDateString() {
  const offset = 9 * 60 * 60 * 1000
  const kst = new Date(Date.now() + offset)
  return kst.toISOString().slice(0, 10)
}
function buildParams() {
  const params = {}
  Object.entries(selectedFilters.value).forEach(([key, value]) => {
    params[key] = value === '' ? null : value
  })
  return params
}
onMounted(async () => {
  selectedFilters.value.date = getKSTDateString()

  try {
    const res = await api.get('/users/me')
    if (res?.data) {
      currentUserName.value = res.data.userName || ''
    } else {
      console.error('사용자 정보 응답 형식이 올바르지 않습니다.')
    }
  } catch (e) {
    console.error('유저 정보 조회 실패:', e)
    ElMessage.error('사용자 정보를 불러오는데 실패했습니다.')
  }

  try {
    await fetchAppliedReservations()
  } catch (error) {
    console.error('초기 데이터 로딩 실패:', error)
  }
})
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
</style>
