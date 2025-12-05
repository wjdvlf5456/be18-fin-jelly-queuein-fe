<template>
  <div class="tabs-full-row">
    <ReservationTabs
      @change="
        (type) => {
          selectedFilters.assetType = type
          refreshTable()
        }
      "
    />
  </div>

  <div class="header-row">
    <h2>예약 가능 자원 조회</h2>
  </div>

  <!-- 🔹 ReservationFilters 사용 + @change 핸들러 연결 -->
  <ReservationFilters @change="handleFilterChange" />

  <ReservationTable
    @select="openCreatePage"
    :rows="tableData"
    :total="total"
    :date="selectedFilters.date"
    @page-change="
      (p) => {
        selectedFilters.page = p
        refreshTable()
      }
    "
  />
</template>

<script setup>
import ReservationTabs from '@/components/reservation/ReservationTab.vue'
import ReservationFilters from '@/components/reservation/ReservationFilter.vue'
import ReservationTable from '@/components/reservation/ReservableAssetsTable.vue'
import { ref, onMounted } from 'vue'
import router from '@/router'
import api from '@/api/axios'

const today = new Date().toISOString().slice(0, 10)

// 🔹 UserReservation 방식: selectedFilters 사용
const selectedFilters = ref({
  date: today,
  assetName: '',
  assetType: '',
  categoryName: '',
  assetStatus: '',
  layerZero: '',
  layerOne: '',
  page: 0,
  size: 10,
})

const tableData = ref([])
const total = ref(0)

// 🔹 UserReservation 방식: handleFilterChange 정의
const handleFilterChange = (filters) => {
  selectedFilters.value = { ...filters } // 필터 전체 반영
  refreshTable()
}

// 🔹 UserReservation 방식: refreshTable 정의
const refreshTable = () => {
  fetchReservableAssets()
  selectedFilters.value.page = 0 // 페이지 초기화
}

// API 호출
async function fetchReservableAssets() {
  const params = { ...selectedFilters.value }

  // 빈 값 제거
  Object.keys(params).forEach((key) => {
    if (params[key] === '' || params[key] === undefined || params[key] === null) {
      delete params[key]
    }
  })

  const res = await api.get('/reservations/reservable-assets', { params })

  tableData.value = res.data.content
  total.value = res.data.totalElements

  console.log('응답:', res.data)
  console.log('컨텐츠:', res.data.content)
}

// 예약 생성 페이지 이동
function openCreatePage(asset) {
  router.push({
    path: `/app/reservations/create`,
    query: {
      assetId: asset.id,
      date: selectedFilters.value.date,
    },
  })
}

// 초기 로드 시 호출
onMounted(() => {
  refreshTable()
})
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tabs-full-row {
  margin-bottom: 15px;
}
</style>
