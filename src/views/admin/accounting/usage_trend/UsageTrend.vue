<template>
  <div class="usage-trend-page">

    <h2 class="page-title">사용 추이</h2>

    <!-- 필터 -->
    <div class="filters">

      <!-- baseYear 선택 -->
      <select v-model="selectedBaseYear" @change="loadData">
        <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
      </select>

      <!-- compareYear 선택 -->
      <select v-model="selectedCompareYear" @change="loadData">
        <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
      </select>

      <!-- 검색 -->
      <div class="search-box">
        <input
          type="text"
          placeholder="자원명을 입력해주세요"
          v-model="assetName"
          @keyup.enter="loadData"
        />
        <i class="ri-search-line" style="cursor:pointer" @click="loadData"></i>
      </div>
    </div>

    <!-- 본문 -->
    <div class="content-wrapper">

      <!-- 차트 박스 -->
      <div class="chart-box">
        <div class="chart-header">
          <span>{{ dataAssetName }}</span>
        </div>

        <Chart
          type="line"
          :data="chartData"
          :options="chartOptions"
          style="width:100%; height:500px;"
        />
      </div>

      <!-- 오른쪽 카드 -->
      <div class="right-cards">
        <div class="info-card">
          <h3>{{ summary.usageRateIncrease }}%</h3>
          <p>{{ selectedBaseYear }}년 대비 {{ selectedCompareYear }}년<br/>예약 증가율</p>
        </div>

        <div class="info-card">
          <h3>{{ summary.actualUsageIncrease }}%</h3>
          <p>{{ selectedBaseYear }}년 대비 {{ selectedCompareYear }}년<br/>실 사용률 증가</p>
        </div>

        <div class="info-card">
          <h3>{{ summary.resourceUtilizationIncrease }}%</h3>
          <p>{{ selectedBaseYear }}년 대비 {{ selectedCompareYear }}년<br/>가동률 증가</p>
        </div>
      </div>

    </div>

    <!-- ======================= -->
    <!-- 에러 모달 -->
    <!-- ======================= -->
    <transition name="fade">
      <div v-if="showErrorModal" class="modal-backdrop"></div>
    </transition>

    <transition name="scale-fade">
      <div v-if="showErrorModal" class="modal-box">
        <p>{{ errorMessage }}</p>
        <button class="close-btn" @click="closeErrorModal">확인</button>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import api from "@/api/axios"

// ---------------------
// 상태
// ---------------------
const yearList = ref([])  
const currentYear = new Date().getFullYear()

const selectedBaseYear = ref(currentYear - 1)   // 작년
const selectedCompareYear = ref(currentYear)    // 올해
const assetName = ref("")

const dataAssetName = ref("")
const summary = ref({})
const chartData = ref({})
const chartOptions = ref({})

// ---------------------
// 모달 상태
// ---------------------
const showErrorModal = ref(false)
const errorMessage = ref("")

function closeErrorModal() {
  showErrorModal.value = false
}

function handleKeyPress(e) {
  // ESC 또는 Enter => 모달 닫기
  if ((e.key === "Escape" || e.key === "Enter") && showErrorModal.value) {
    closeErrorModal()
  }
}

onBeforeUnmount(() => {
  window.removeEventListener("keyup", handleKeyPress)
})

// ---------------------
// API 호출
// ---------------------
async function loadData() {

  // 모달 떠 있으면 재검색 금지
  if (showErrorModal.value) return

  try {
    const { data } = await api.get("/accounting/usage-history/trend", {
      params: {
        baseYear: selectedBaseYear.value,
        compareYear: selectedCompareYear.value,
        assetName: assetName.value
      }
    })

    // 데이터 반영
    dataAssetName.value = data.asset.assetName
    summary.value = data.summary

    const labels = data.monthlyData.map(m => `${m.month}월`)
    const baseValues = data.monthlyData.map(m => m.baseYearUsageRate)
    const compareValues = data.monthlyData.map(m => m.compareYearUsageRate)

    chartData.value = {
      labels,
      datasets: [
        {
          label: selectedBaseYear.value,
          data: baseValues,
          borderColor: "#E6A500",
          backgroundColor: "rgba(230,165,0,0.2)",
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: "#E6A500",
          pointBorderColor: "#E6A500",
          tension: 0
          
        },
        {
          label: selectedCompareYear.value,
          data: compareValues,
          borderColor: "#00A950",
          backgroundColor: "rgba(0,169,80,0.2)",
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: "#00A950",
          pointBorderColor: "#00A950",
          tension: 0
        }
      ]
    }

    chartOptions.value = {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          labels: {
            pointStyle: "line",      // 선(line) 모양
            boxWidth: 30,            // 선 길이
            boxHeight: 1,            // 선 두께
            color: "#333"
          }
        }
      },

      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20 }
        }
      }
    }

  } catch (err) {
    console.error("API 오류:", err)
    errorMessage.value = "등록되지 않은 자원입니다."
    showErrorModal.value = true
  }
}

// 연도 조회 API 추가

async function loadYears() {
  try {
    const { data } = await api.get("/accounting/usage-history/years")

    // data = { years: [2023, 2024] }
    yearList.value = data.years

    if (yearList.value.length > 0) {
      selectedBaseYear.value = yearList.value[0]   // 가장 앞 → 2023
      selectedCompareYear.value = yearList.value[yearList.value.length - 1] // 가장 뒤 → 2024
    }
  } catch (err) {
    console.error("연도 조회 실패:", err)
  }
}

onMounted(async () => {
  window.addEventListener("keyup", handleKeyPress)

  await loadYears()   // 먼저 연도 로딩
  await loadData()    // 그다음 사용 추이 로딩
})

</script>

<style scoped>
/* ---------------------------------- */
/* 기존 UI 스타일 */
/* ---------------------------------- */

.usage-trend-page { padding: 20px; }
.page-title { font-size: 22px; font-weight: 700; margin-bottom: 20px; }

.filters { display: flex; gap: 12px; margin-bottom: 20px; }
.filters select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.search-box input {
  border: none;
  outline: none;
}

.content-wrapper { display: flex; gap: 20px; }

.chart-box {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.right-cards {
  width: 240px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-card {
  background: white;
  padding: 18px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.info-card h3 { font-size: 26px; color: #00A950; }

/* ---------------------------------- */
/* 모달 스타일 */
/* ---------------------------------- */

.modal-backdrop {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.35);
  z-index: 998;
}

.modal-box {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 26px;
  width: 320px;
  border-radius: 12px;
  text-align: center;
  z-index: 999;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.close-btn {
  margin-top: 18px;
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  background: #00A950;
  color: white;
  cursor: pointer;
}

/* ---------------------------------- */
/* 모달 애니메이션 */
/* ---------------------------------- */

.fade-enter-active,
.fade-leave-active {
  transition: opacity .25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-fade-enter-active {
  animation: scaleIn .25s ease;
}
.scale-fade-leave-active {
  animation: scaleOut .2s ease forwards;
}

@keyframes scaleIn {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

@keyframes scaleOut {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
}
</style>
