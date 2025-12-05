<template>
  <div class="header-row">
    <h2>예약 가능 자원 조회</h2>

    <el-input
      v-model="searchParams.assetName"
      placeholder="검색어를 입력해주세요"
      class="search-input"
      @keyup.enter="fetchReservableAssets"
    >
      <template #append>
        <el-button :icon="Search" @click="fetchReservableAssets" />
      </template>
    </el-input>
  </div>
  <ReservationTabs
    @change="(type) => {
      searchParams.assetType = type
      fetchReservableAssets()
    }"
  />
  <ReservationFilters
    @change="(f) => { 
      if (f.date) searchParams.date = f.date  
      searchParams.categoryName = f.categoryName
      searchParams.assetType = f.assetType
      searchParams.assetStatus = f.assetStatus
      searchParams.layerZero = f.layerZero
      searchParams.layerOne = f.layerOne
      fetchReservableAssets()
    }"
  />


  <ReservationTable
    @select="openCreatePage"
    :rows="tableData"
    :total="total"
    :date="searchParams.date"
    @page-change="(p) => {
      searchParams.page = p
      fetchReservableAssets()
    }"
  />

</template>

<script setup>
import ReservationTabs from '@/components/reservation/ReservationTab.vue'
import ReservationFilters from '@/components/reservation/ReservationFilter.vue'
import ReservationTable from '@/components/reservation/ReservableAssetsTable.vue'
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import api from '@/api/axios'


const searchParams = ref({
  date: '',           // 반드시 yyyy-MM-dd 형태
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
const today = new Date().toISOString().slice(0, 10)
searchParams.value.date = today



async function fetchReservableAssets() {

  // 기존 params 생성 방식 대신, 빈 값 제거 처리
  const params = {
    date: searchParams.value.date,
    assetName: searchParams.value.assetName,
    assetType: searchParams.value.assetType,
    categoryName: searchParams.value.categoryName,
    assetStatus: searchParams.value.assetStatus,
    layerZero: searchParams.value.layerZero,
    layerOne: searchParams.value.layerOne,
    page: searchParams.value.page,
    size: searchParams.value.size
  }

  // 빈 문자열("")은 서버로 보내지 않도록 제거
  Object.keys(params).forEach(key => {
    if (params[key] === '' || params[key] === undefined || params[key] === null) {
      delete params[key]
    }
  })

  const res = await api.get('/reservations/reservable-assets', { params })

  tableData.value = res.data.content
  total.value = res.data.totalElements

  console.log("응답:", res.data)
  console.log("컨텐츠:", res.data.content)
}


function openCreatePage(asset) {
  router.push({
    path: `/app/reservations/create`,
    query: {
      assetId: asset.id,
      date: searchParams.value.date
    }
  })
}

onMounted(() => {
  const today = new Date().toLocaleDateString("en-CA")  // YYYY-MM-DD 형식 + 로컬(KST) 기준

  searchParams.value.date = today
  fetchReservableAssets()
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

.reservation-view {
  padding: 20px 30px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin-top: 10px;
}
</style>
