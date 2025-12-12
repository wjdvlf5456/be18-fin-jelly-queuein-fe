<template>
  <div class="page-container">

    <h2 class="page-title">자원 사용 기록</h2>

    <!-- 검색 필터 -->
    <UsageHistoryFilter @search="loadData" />

    <!-- 테이블 + 페이징 -->
    <UsageHistoryTable
      :rows="rows"
      :loading="loading"
      :pageInfo="pageInfo"
      @changePage="changePage"
    />

  </div>
</template>

<script setup>
import { ref } from "vue"
import UsageHistoryFilter from "./UsageHistoryFilter.vue"
import UsageHistoryTable from "./UsageHistoryTable.vue"
import api from "@/api/axios.js"

const rows = ref([])
const loading = ref(false)

const pageInfo = ref({
  page: 0,
  size: 10,
  totalPages: 0,
})

// 마지막 검색조건 저장
let lastFilter = {
  startDate: null,
  endDate: null,
  keyword: null
}

async function loadData(filter) {
  lastFilter = filter
  await fetchData(0)
}

async function fetchData(page) {
  loading.value = true

  try {
    const res = await api.get("/accounting/usage-history", {
      params: {
        startDate: lastFilter.startDate,
        endDate: lastFilter.endDate,
        keyword: lastFilter.keyword,
        page,
        size: pageInfo.value.size,
      }
    })

    rows.value = res.data.content

    pageInfo.value = {
      page: res.data.page,
      size: res.data.size,
      totalPages: res.data.totalPages,
    }

  } catch (err) {
    console.error("조회 실패", err)
  }

  loading.value = false
}

function changePage(newPage) {
  fetchData(newPage)
}

// 초기 1회 조회
fetchData(0)
</script>

<style scoped>
.page-container {
  padding: 24px 32px;
}

.page-title {
  margin: 10px 0 20px;
  font-size: 20px;
  font-weight: 700;
}
</style>
