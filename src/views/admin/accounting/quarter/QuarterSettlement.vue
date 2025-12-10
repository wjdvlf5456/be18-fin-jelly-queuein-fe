<template>
  <div class="quarter-settlement-page">

    <h2 class="page-title">분기 정산</h2>

    <!-- 🔹 필터 영역 -->
    <div class="filter-wrapper">

      <!-- 왼쪽 : 검색/연도/분기 -->
      <div class="filters">

        <!-- 연도 선택 -->
        <select v-model="selectedYear" @change="loadData" class="filter-select">
          <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
        </select>

        <!-- 분기 선택 -->
        <select v-model="selectedQuarter" @change="loadData" class="filter-select">
          <option :value="null">전체</option>
          <option v-for="q in [1,2,3,4]" :key="q" :value="q">{{ q }}분기</option>
        </select>

        <!-- 검색 -->
        <div class="search-box">
          <input
            type="text"
            v-model="assetName"
            placeholder="자원명을 입력해주세요"
            @keyup.enter="loadData"
          />
          <i class="ri-search-line search-icon" @click="loadData"></i>
        </div>
      </div>

      <!-- 오른쪽 : Excel 버튼 -->
      <button class="excel-btn" :disabled="excelLoading" @click="downloadExcel">
        <i class="ri-download-line download-icon"></i>
        <span v-if="!excelLoading"> Excel로 내보내기</span>
        <span v-else class="loading-spinner"></span>
      </button>
    </div>

    <!-- 🔹 데이터 테이블 -->
    <table class="settlement-table">
      <thead>
        <tr>
          <th>연도</th>
          <th>분기</th>
          <th>자원명</th>
          <th>예약시간</th>
          <th>실사용시간</th>
          <th>활용률</th>
          <th>이행률</th>
          <th>총비용</th>
          <th>실비용</th>
          <th>손익비용</th>
          <th>활용 등급</th>
          <th>이행 등급</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(row, index) in rows" :key="row.assetId + '-' + row.quarter + '-' + index">
          <td>{{ row.year }}</td>
          <td>{{ row.quarter }} 분기</td>
          <td>{{ row.assetName }}</td>
          <td>{{ formatHours(row.reservedHours) }}</td>
          <td>{{ formatHours(row.actualHours) }}</td>
          <td>{{ formatPercent(row.utilizationRate) }}</td>
          <td>{{ formatPercent(row.performRate) }}</td>
          <td>{{ formatNumber(row.totalUsageCost) }}</td>
          <td>{{ formatNumber(row.actualUsageCost) }}</td>
          <td>{{ formatNumber(row.usageGapCost) }}</td>
          <td>{{ row.utilizationGrade }}</td>
          <td>{{ row.performGrade }}</td>
        </tr>
      </tbody>
    </table>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "@/api/axios"

// -----------------------------
// 상태
// -----------------------------
const rows = ref([])

const yearList = ref([])   // 백엔드에서 받아올 연도 리스트
const selectedYear = ref(null)

const selectedQuarter = ref(null)
const assetName = ref("")

const excelLoading = ref(false)

// -----------------------------
// 연도 조회 API
// -----------------------------
async function loadYears() {
  try {
    const { data } = await api.get("/accounting/usage-history/years")

    // ➜ data = { years: [2023, 2024] }
    yearList.value = data.years

    if (yearList.value.length > 0) {
      selectedYear.value = yearList.value[yearList.value.length - 1] // 가장 최신 연도 기본 선택
    }

  } catch (err) {
    console.error("연도 조회 실패:", err)
  }
}

// -----------------------------
// 분기 정산 데이터 조회
// -----------------------------
async function loadData() {

  if (!selectedYear.value) return

  const params = {
    year: Number(selectedYear.value)
  }

  if (selectedQuarter.value !== null) {
    params.quarter = Number(selectedQuarter.value)
  }

  if (assetName.value.trim() !== "") {
    params.assetName = assetName.value.trim()
  }

  console.log("GET params:", params)

  const res = await api.get("/accounting/settlement/quarter", { params })
  rows.value = res.data.rows
}

// -----------------------------
// 숫자 포맷
// -----------------------------
function formatPercent(v) {
  return (v * 100).toFixed(1) + "%"
}

function formatNumber(v) {
  return v.toLocaleString()
}

function formatHours(h) {
  return h.toLocaleString() + " 시간"
}

// -----------------------------
// Excel 다운로드
// -----------------------------
async function downloadExcel() {
  try {
    excelLoading.value = true

    const params = new URLSearchParams()
    params.append("year", Number(selectedYear.value))

    if (selectedQuarter.value !== null) {
      params.append("quarter", Number(selectedQuarter.value))
    }

    if (assetName.value.trim() !== "") {
      params.append("assetName", assetName.value.trim())
    }

    const quarterName =
      selectedQuarter.value !== null ? `${selectedQuarter.value}분기` : "전체분기"

    const filename = `${selectedYear.value}_${quarterName}_정산.xlsx`

    const url = `/accounting/settlement/quarter/excel?${params.toString()}`

    const res = await api.get(url, {
      responseType: "blob"
    })

    const blobUrl = URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement("a")
    link.href = blobUrl
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(blobUrl)

  } catch (err) {
    console.error("Excel 다운로드 실패:", err)
  } finally {
    excelLoading.value = false
  }
}

// -----------------------------
// 초기 실행
// -----------------------------
onMounted(async () => {
  await loadYears()
  await loadData()
})
</script>

<style scoped>
.quarter-settlement-page {
  padding: 20px;
}

.page-title {
  font-size: 20px;
  margin-bottom: 20px;
  font-weight: bold;
}

.download-icon {
  font-size: 18px;
  margin-right: 6px;
  color: white; /* 흐린 초록 배경에서 잘 보이도록 */
}

/* 필터 전체 */
.filter-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

/* 왼쪽 필터 */
.filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-select {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 12px;
  background: #fff;
  font-size: 14px;
}

.search-box {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 6px 10px;
  width: 200px;
}

.search-box input {
  border: none;
  outline: none;
  width: 100%;
}

.search-icon {
  cursor: pointer;
  font-size: 18px;
}

/* Excel 버튼 */
.excel-btn {
  padding: 6px 14px;
  background: #217346;       /* 초록색 */
  border: 1px solid #217346;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* 버튼 로딩 상태 */
.excel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 로딩 스피너 */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #3b82f6;
  border-top: 2px solid transparent;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 테이블 */
.settlement-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.settlement-table thead tr {
  background: #D9E9CF;
}

.settlement-table th,
.settlement-table td {
  border: 1px solid #ddd;
  padding: 6px 8px;
  text-align: center;
}
</style>
