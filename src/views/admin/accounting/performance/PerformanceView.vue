<template>
  <div class="usage-trend-page">

    <h2 class="page-title">운영 성과 분석</h2>

    <!-- 🔹오른쪽 상단 버튼 -->
    <button class="target-btn" @click="openTargetModal">
      {{ hasTargetThisYear ? "사용률 조회" : "사용률 등록" }}
    </button>

    <!-- 필터 -->
    <div class="filters">
      <select v-model="selectedBaseYear" @change="loadData">
        <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
      </select>

      <select v-model="selectedCompareYear" @change="loadData">
        <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
      </select>

      <div class="search-box">
        <input
          type="text"
          v-model="assetName"
          placeholder="자원명을 입력해주세요"
          @keyup.enter="loadData"
        />
        <i class="ri-search-line" @click="loadData"></i>
      </div>
    </div>

    <!-- 본문 -->
    <div class="content-wrapper">
      <div class="chart-box">
        <div class="chart-header">
          <span>{{ assetTitle }}</span>
        </div>

        <Chart
          type="bar"
          :data="chartData"
          :options="chartOptions"
          style="width: 100%; height: 360px;"
        />
      </div>

      <div class="right-cards">
        <div class="info-card">
          <h3>{{ formatMoney(summary.baseYearTotalSaving) }}</h3>
          <p>{{ selectedBaseYear }}년 총 절감 금액</p>
        </div>

        <div class="info-card">
          <h3>{{ formatMoney(summary.compareYearCurrentSaving) }}</h3>
          <p>{{ selectedCompareYear }}년 총 절감 금액</p>
        </div>

        <div class="info-card">
          <h3>{{ formatMoney(summary.accumulatedSaving) }}</h3>
          <p>누적 절감 금액</p>
        </div>
      </div>
    </div>

    <!-- ============================= -->
    <!-- 에러 모달 -->
    <!-- ============================= -->
    <transition name="fade">
      <div v-if="showErrorModal" class="modal-backdrop" @click="closeErrorModal"></div>
    </transition>

    <transition name="scale-fade">
      <div v-if="showErrorModal" class="modal-box">
        <p>{{ errorMessage }}</p>
        <button class="close-btn" @click="closeErrorModal">확인</button>
      </div>
    </transition>

    <!-- ============================= -->
    <!-- 사용률 등록 모달 (새 UI + ESC 지원) -->
    <!-- ============================= -->
    <transition name="fade">
      <div
        v-if="showRegisterModal"
        class="modal-backdrop-blur"
        @click="closeRegisterModal">
      </div>
    </transition>

    <transition name="scale-fade">
      <div v-if="showRegisterModal" class="target-modal" @click.stop>
        <button class="modal-close" @click="closeRegisterModal">✕</button>

        <h3 class="modal-title">{{ currentYear }} 목표 사용률</h3>

        <input
          type="number"
          min="0"
          max="100"
          v-model="registerRate"
          placeholder="0~100"
          class="modal-input"
          @input="limitRate"
        />

        <button class="modal-submit" @click="registerTarget">
          등록
        </button>
      </div>
    </transition>

    <!-- ============================= -->
    <!-- 사용률 조회 모달 -->
    <!-- ============================= -->
    <transition name="fade">
      <div
        v-if="showViewModal"
        class="modal-backdrop-blur"
        @click="closeViewModal">
      </div>
    </transition>

    <transition name="scale-fade">
      <div v-if="showViewModal" class="target-modal" @click.stop>
        <button class="modal-close" @click="closeViewModal">✕</button>

        <h3 class="modal-title">목표 사용률</h3>

        <select v-model="viewYear" @change="loadTargetByYear" class="year-select">
          <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
        </select>

        <p style="font-size: 20px; margin-top: 10px;">
          {{ viewYear }}년 → <b>{{ (viewTargetRate * 100).toFixed(0) }}%</b>
        </p>

        <button class="modal-submit" @click="closeViewModal">
          확인
        </button>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import api from "@/api/axios";

/* ================================
      연도 관련 설정
================================ */
const currentYear = new Date().getFullYear();
const yearList = ref([]);

const selectedBaseYear = ref(currentYear - 1);
const selectedCompareYear = ref(currentYear);

const assetName = ref("");
const assetTitle = ref("전체");

const summary = ref({});
const chartData = ref({});
const chartOptions = ref({});

/* ================================
      에러 모달
================================ */
const showErrorModal = ref(false);
const errorMessage = ref("");

function closeErrorModal() {
  showErrorModal.value = false;
}

/* ================================
      ESC / Enter 모달 제어
================================ */
function handleKeyPress(e) {
  // ESC: 모든 모달 닫기
  if (e.key === "Escape") {
    showRegisterModal.value = false;
    showViewModal.value = false;
    showErrorModal.value = false;
  }

  // Enter: 등록 모달이 열려 있을 때 등록 실행
  if (e.key === "Enter" && showRegisterModal.value) {
    registerTarget();
  }
}

/* ================================
      사용률 등록 & 조회 상태
================================ */
const hasTargetThisYear = ref(false);
const targetRate = ref(0);

const showRegisterModal = ref(false);
const showViewModal = ref(false);
const registerRate = ref("");

const viewYear = ref(currentYear);
const viewTargetRate = ref(0);

/* 입력값 0~100 */
function limitRate() {
  if (registerRate.value < 0) registerRate.value = 0;
  if (registerRate.value > 100) registerRate.value = 100;
}

/* ================================
      올해 목표 조회
================================ */
async function loadTargetStatus() {
  try {
    const { data } = await api.get("/accounting/usage-targets/current");

    hasTargetThisYear.value = data.exists;

    if (data.exists) {
      targetRate.value = data.targetRate;
      viewTargetRate.value = data.targetRate;
      viewYear.value = data.year;
    }
  } catch (err) {
    console.error(err);
  }
}

// 년도 리스트 호출 api
async function loadYears() {
  try {
    const { data } = await api.get("/accounting/usage-history/years");

    // DTO 구조: { years: [...] }
    yearList.value = data.years;

    // 기본 비교 연도 설정
    if (yearList.value.length > 0) {
      selectedBaseYear.value = yearList.value[0]; // 첫 번째 연도
      selectedCompareYear.value = yearList.value[yearList.value.length - 1]; // 마지막 연도
    }
  } catch (err) {
    console.error("연도 조회 실패:", err);
  }
}

/* ================================
      특정 연도 목표 조회
================================ */
async function loadTargetByYear() {
  try {
    const { data } = await api.get("/accounting/usage-history/years");
    yearList.value = data.years;
  } catch (e) {
    console.error("연도별 목표 조회 실패:", e);
    viewTargetRate.value = 0;
  }
}

/* ================================
      모달 열기
================================ */
function openTargetModal() {
  if (hasTargetThisYear.value) {
    showViewModal.value = true;
  } else {
    showRegisterModal.value = true;
  }
}

function closeRegisterModal() {
  showRegisterModal.value = false;
}
function closeViewModal() {
  showViewModal.value = false;
}

/* ================================
      목표 등록
================================ */
async function registerTarget() {
  if (!registerRate.value) return;

  try {
    const payload = { targetRate: Number(registerRate.value) / 100 };
    const { data } = await api.post("/accounting/usage-targets", payload);

    hasTargetThisYear.value = true;
    targetRate.value = data.targetRate;

    viewYear.value = currentYear;
    viewTargetRate.value = data.targetRate;

    showRegisterModal.value = false;
  } catch (e) {
    console.error("등록 실패:", e);
  }
}

/* ================================
      KPI 데이터 조회
================================ */
async function loadData() {
  try {
    const { data } = await api.get("/accounting/settlement/performance", {
      params: {
        baseYear: selectedBaseYear.value,
        compareYear: selectedCompareYear.value,
        assetName: assetName.value || null,
      },
    });

    assetTitle.value = data.asset.assetName;
    summary.value = data.summary;

    const labels = data.monthlyData.map((m) => `${m.month}월`);
    const base = data.monthlyData.map((m) => m.baseYearSaving);
    const compare = data.monthlyData.map((m) => m.compareYearSaving);

    chartData.value = {
      labels,
      datasets: [
        { label: selectedBaseYear.value, backgroundColor: "#8B5401", data: base },
        { label: selectedCompareYear.value, backgroundColor: "#00A950", data: compare },
      ],
    };

    chartOptions.value = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          ticks: {
            callback: (v) => v.toLocaleString("ko-KR") + "원",
          },
        },
      },
    };
  } catch (err) {
    errorMessage.value = "등록되지 않은 자원입니다.";
    showErrorModal.value = true;
  }
}

/* ================================
      금액 포맷팅
================================ */
function formatMoney(v) {
  if (v === undefined || v === null) return "-";
  return Math.floor(v).toLocaleString("ko-KR") + "원";
}

/* ================================
      초기 실행
================================ */
onMounted(async () => {
  window.addEventListener("keyup", handleKeyPress);

  await loadYears();       // 먼저 연도 목록 불러옴
  await loadData();        // 그 다음 KPI 데이터 불러옴
  loadTargetStatus();
});

onBeforeUnmount(() => {
  window.removeEventListener("keyup", handleKeyPress);
});
</script>

<style scoped>
/* ======================
    기본 레이아웃
====================== */
.usage-trend-page {
  padding: 20px;
}
.page-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
}

/* 버튼 */
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
}

/* 필터 */
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
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
  box-shadow: none;
}


.content-wrapper {
  display: flex;
  gap: 20px;
}

.chart-box {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
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
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
.info-card h3 {
  font-size: 26px;
  color: #00A950;
}

/* ======================
    모달 공통 스타일
====================== */
.modal-backdrop-blur {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  z-index: 998;
}

.target-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  padding: 30px 32px;
  width: 360px;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  text-align: center;
  z-index: 999;
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 16px;
  font-size: 20px;
  cursor: pointer;
  border: none;
  background: none;
  color: #333;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
}

.modal-input {
  width: 120px;
  height: 42px;
  margin: 0 auto 18px auto;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid #d4d8e0;
  background: #f5f6fa;
  text-align: center;
  font-size: 16px;
}

.modal-submit {
  width: 80px;
  height: 30px;
  border-radius: 10px;
  border: 2px solid #ccd1d9;
  background: #fff;
  cursor: pointer;
  font-size: 16px;
}
.modal-submit:hover {
  background: #f2f2f2;
}

/* 연도 선택 모달 */
.year-select {
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 15px;
}

/* ======================
    모달 애니메이션
====================== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-fade-enter-active {
  animation: scaleIn 0.25s ease;
}
.scale-fade-leave-active {
  animation: scaleOut 0.2s ease forwards;
}

@keyframes scaleIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.85);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes scaleOut {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.85);
  }
}
</style>
