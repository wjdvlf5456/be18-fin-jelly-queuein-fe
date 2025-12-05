<template>
  <div>
    <!-- 헤더 -->
    <div class="header-row">
      <h2>예약 신청 목록 조회</h2>

    <el-input
      v-model="selectedFilters.assetName"
      placeholder="검색어를 입력해주세요"
      class="search-input"
      @keyup.enter="refreshTable"
    >
      <template #append>
        <el-button :icon="Search" @click="refreshTable" />
      </template>
    </el-input>


    </div>

    <ReservationTabs />

    <ReservationFilters @change="handleFilterChange" />

    <!-- 예약 목록 -->
    <ReservationTable 
      :rows="tableData"  
      :filters="selectedFilters"   
      :key="tableKey"
      @open-detail="openDetailModal"
      @approve="onApprove"
      @reject="onReject"
    />

    <ReservationDetailModal
      v-model:visible="modalOpen"
      :asset="reservationDetail"
      @close="closeModal"
      @save-reason="updateReason" 
    /><!-- 부모에서 emit reason 처리-->
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "@/api/axios"

import ReservationTabs from "@/components/reservation/ReservationTab.vue"
import ReservationFilters from "@/components/reservation/ReservationFilter.vue"
import ReservationTable from "@/components/reservation/AppliedReservationTable.vue"
import ReservationDetailModal from "@/components/reservation/ReservationApplyDetailModal.vue"
import { Search } from '@element-plus/icons-vue'


const handleFilterChange = (filters) => {
  selectedFilters.value = { ...filters } // 필터 전체 반영
  selectedDate.value = filters.date      // 날짜도 따로 필요하면 그대로
  refreshTable()
}
const selectedDate = ref(new Date().toISOString().split("T")[0])
// 테이블 갱신용 key
const tableKey = ref(0)
const refreshTable = () => {
  tableKey.value += 1
}

const selectedFilters = ref({
  date: selectedDate.value,
  assetName: "",       // 검색바 입력값 포함
  assetType: "",
  assetStatus: "",
  categoryName: "",
  layerZero: "",
  layerOne: ""
})

const tableData = ref([])
const total = ref(0)

const modalOpen = ref(false)
const reservationDetail = ref(null)
const currentUserName = ref("")

onMounted(async() => {
  selectedFilters.value.date = getKSTDateString()

  try {
    const res = await api.get("/users/me")
    currentUserName.value = res.data.userName
  } catch (e) {
    console.error("유저 정보 조회 실패:", e)
  }

  fetchAppliedReservations()
})


async function fetchAppliedReservations() {
  const params = buildParams()
  const res = await api.get("/reservations/pending", { params })

  tableData.value = res.data.content ?? []
  total.value = res.data.totalElements ?? 0
}

async function openDetailModal(reservationId) {
  try {
    const res = await api.get(`/reservations/${reservationId}`)
    const d = res.data

    reservationDetail.value = {
      id: d.reservationId,                       
      version: d.version,
      name: d.assetName,
      status: d.reservationStatus,
      date: d.date,
      reserver: d.applicantName,
      approver: d.respondentName,

      startAt: d.startAt,
      endAt: d.endAt,

      actualStartAt: d.actualStartAt,
      actualEndAt: d.actualEndAt,

      participants: d.attendants,
      reason: d.reason,
      note: d.note,
      usage: d.reservationStatus,
      description: d.description  
    }

    modalOpen.value = true
  } catch (err) {
    console.error("상세 조회 실패:", err)
  }
}

function closeModal() {
  modalOpen.value = false
  reservationDetail.value = null
}

// 부모 컴포넌트 (AppliedReservations.vue)
const updateReason = ({ reservationId, reason }) => {
  const row = tableData.value.find(r => r.id === reservationId) 
  if (row) row.reason = reason
}

async function onApprove(row) {
  try {
    await api.patch(`/reservations/${row.reservationId}/approve`, {
      version: row.version,
      approverName: currentUserName.value,
      reason: row.reason
    })

    // UI 반영
    row.isApproved = "APPROVED"
    row.respondentName = currentUserName.value

    fetchAppliedReservations() // 전체 갱신
  } catch (err) {
    console.error("승인 실패:", err)
  }
}

async function onReject(row) {
  try {
    await api.patch(`/reservations/${row.reservationId}/reject`, {
      version: row.version,
      approverName: currentUserName.value,
      reason: row.reason
    })

    // UI 반영
    row.isApproved = "REJECTED"
    row.respondentName = currentUserName.value

    fetchAppliedReservations()
  } catch (err) {
    console.error("거절 실패:", err)
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
    params[key] = value === "" ? null : value
  })
  return params
}


onMounted(async() => {
  searchParams.value.date = getKSTDateString()

  try {
    const res = await api.get("/users/me")
    currentUserName.value = res.data.userName
  } catch (e) {
    console.error("유저 정보 조회 실패:", e)
  }

  fetchAppliedReservations()
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