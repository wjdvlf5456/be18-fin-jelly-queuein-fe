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

      <!-- 메인 차트 박스 -->
      <div class="chart-box">
        <div class="chart-header">
          <span>{{ dataAssetName }}</span>
        </div>
        <div ref="mainChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 하단 차트 영역 -->
    <div class="bottom-charts">
      <!-- 사용 횟수 TOP 3 -->
      <div class="bottom-chart-card">
        <h3 class="chart-title">사용 횟수 TOP 3 ({{ selectedBaseYear }}년 vs {{ selectedCompareYear }}년)</h3>
        <div ref="usageCountChartRef" class="bottom-chart-container"></div>
      </div>
      <!-- 사용 시간 TOP 3 -->
      <div class="bottom-chart-card">
        <h3 class="chart-title">사용 시간 TOP 3 ({{ selectedBaseYear }}년 vs {{ selectedCompareYear }}년)</h3>
        <div ref="usageTimeChartRef" class="bottom-chart-container"></div>
      </div>
      <!-- 사용 증가율 (더 크게) -->
      <div class="bottom-chart-card large">
        <h3 class="chart-title">사용 증감률 ({{ selectedBaseYear }}년 vs {{ selectedCompareYear }}년)</h3>
        <div ref="increaseRateChartRef" class="bottom-chart-container large"></div>
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
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue"
import api from "@/api/axios"
import * as echarts from "echarts"

// ---------------------
// 상태
// ---------------------
const yearList = ref([])
const currentYear = new Date().getFullYear()

const selectedBaseYear = ref(currentYear - 1)   // 작년
const selectedCompareYear = ref(currentYear)    // 올해
const assetName = ref("")
const dataAssetName = ref("")

// 메인 라인 차트의 각 시리즈 visibility 상태
const mainChartVisible = ref({
  [selectedBaseYear.value]: true,
  [selectedCompareYear.value]: true,
})

watch([selectedBaseYear, selectedCompareYear], () => {
  // 연도가 변경되면 visible 상태도 초기화
  mainChartVisible.value = {
    [selectedBaseYear.value]: true,
    [selectedCompareYear.value]: true,
  }
  loadData()
})

// ECharts 인스턴스
const mainChartRef = ref(null)
const usageCountChartRef = ref(null)
const usageTimeChartRef = ref(null)
const increaseRateChartRef = ref(null)

let mainChart = null
let usageCountChart = null
let usageTimeChart = null
let increaseRateChart = null

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
// ECharts 초기화
// ---------------------
function initCharts() {
  if (mainChartRef.value && !mainChart) {
    mainChart = echarts.init(mainChartRef.value)
    // legend click event 등록 (메인 차트만 필요)
    mainChart.on('legendselectchanged', onMainChartLegendSelectChanged)
  }
  if (usageCountChartRef.value && !usageCountChart) {
    usageCountChart = echarts.init(usageCountChartRef.value)
  }
  if (usageTimeChartRef.value && !usageTimeChart) {
    usageTimeChart = echarts.init(usageTimeChartRef.value)
  }
  if (increaseRateChartRef.value && !increaseRateChart) {
    increaseRateChart = echarts.init(increaseRateChartRef.value)
  }
}
function resizeCharts() {
  mainChart?.resize()
  usageCountChart?.resize()
  usageTimeChart?.resize()
  increaseRateChart?.resize()
}

// ---------------------
// 메인 라인 차트 설정
// ---------------------
function updateMainChart(labels, baseValues, compareValues) {
  if (!mainChart) return

  // 각 연도별로 고유한 이름 보장 (문자열로 명시적 변환)
  const baseYearName = String(selectedBaseYear.value)
  const compareYearName = String(selectedCompareYear.value)

  // legend의 selected(등장여부) option을 만들어서 차트에 적용
  // 각 범례 항목이 독립적으로 작동하도록 명시적으로 설정
  const legendSelected = {
    [baseYearName]: mainChartVisible.value[selectedBaseYear.value] !== false,
    [compareYearName]: mainChartVisible.value[selectedCompareYear.value] !== false,
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: [baseYearName, compareYearName],
      selected: legendSelected,
      top: 10,
      right: 20,
      textStyle: {
        color: '#333'
      },
      // ECharts 클릭 이벤트 핸들링 가능: legendselectchanged 사용(mainChart.on에서 등록함)
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      interval: 20,
      axisLabel: {
        formatter: '{value}',
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    series: [
      {
        name: baseYearName,
        type: 'line',
        data: baseValues,
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#E6A500',
          width: 2
        },
        itemStyle: {
          color: '#E6A500'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(230, 165, 0, 0.2)' },
              { offset: 1, color: 'rgba(230, 165, 0, 0)' }
            ]
          }
        }
      },
      {
        name: compareYearName,
        type: 'line',
        data: compareValues,
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#00A950',
          width: 2
        },
        itemStyle: {
          color: '#00A950'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 169, 80, 0.2)' },
              { offset: 1, color: 'rgba(0, 169, 80, 0)' }
            ]
          }
        }
      }
    ]
  }

  // 범례 선택 상태를 명시적으로 설정하기 위해 notMerge를 사용
  // 하지만 범례와 시리즈는 완전히 교체하여 각 항목이 독립적으로 작동하도록 보장
  mainChart.setOption(option, true)
}

// ---------------------------
// 메인차트 legend 클릭 이벤트
// ---------------------------
function onMainChartLegendSelectChanged(params) {
  // params.selected: { [legend name]: true/false }
  const selectedStates = params.selected
  
  // 각 연도별로 고유한 이름 보장 (문자열로 명시적 변환)
  const baseYearName = String(selectedBaseYear.value)
  const compareYearName = String(selectedCompareYear.value)
  
  // 각 범례 항목의 선택 상태를 독립적으로 확인
  const baseYearSelected = selectedStates[baseYearName] !== undefined 
    ? !!selectedStates[baseYearName] 
    : mainChartVisible.value[selectedBaseYear.value] !== false
  const compareYearSelected = selectedStates[compareYearName] !== undefined 
    ? !!selectedStates[compareYearName] 
    : mainChartVisible.value[selectedCompareYear.value] !== false
  
  // 현재 선택된 시리즈 수 계산
  const visibleCount = (baseYearSelected ? 1 : 0) + (compareYearSelected ? 1 : 0)
  
  // 최소 하나의 시리즈가 항상 보이도록 보장
  if (visibleCount === 0) {
    // 선택된 시리즈가 없으면 이전 상태로 되돌림
    // 차트 옵션을 이전 상태로 다시 설정하여 선택 상태 복원
    if (mainChartLastLabels.length > 0) {
      updateMainChart([...mainChartLastLabels], [...mainChartLastBase], [...mainChartLastCompare])
    }
    // mainChartVisible.value는 변경하지 않음 (이미 이전 값이 유지됨)
    return
  }
  
  // 정상적인 경우에만 상태 갱신 (각 연도별로 독립적으로)
  mainChartVisible.value = {
    [selectedBaseYear.value]: baseYearSelected,
    [selectedCompareYear.value]: compareYearSelected
  }
  
  // 차트 option 다시 설정 (labels/data 등은 그대로, visible만 조정)
  // 다시 그릴 때 loadData를 새로 부르지 않고, 차트만 조정: 현재 차트 데이터 기억 필요
  // best effort로, data를 store
  if (mainChartLastLabels.length > 0) {
    updateMainChart([...mainChartLastLabels], [...mainChartLastBase], [...mainChartLastCompare])
  }
}

// 차트용 데이터 메모리 저장(legend 토글 시 다시 그릴 때 사용)
let mainChartLastLabels = []
let mainChartLastBase = []
let mainChartLastCompare = []

// ---------------------
// 사용 횟수 TOP 3 막대 차트
// ---------------------
function updateUsageCountChart(data) {
  if (!usageCountChart) return

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'category',
      data: data.categories || ['회의실 A', '회의실 B', '회의실 C'],
      axisLabel: {
        color: '#666'
      }
    },
    series: [
      {
        name: selectedBaseYear.value,
        type: 'bar',
        data: data.baseYear || [120, 100, 80],
        itemStyle: {
          color: '#4A90E2'
        }
      },
      {
        name: selectedCompareYear.value,
        type: 'bar',
        data: data.compareYear || [80, 60, 50],
        itemStyle: {
          color: '#00A950'
        }
      }
    ]
  }

  usageCountChart.setOption(option)
}

// ---------------------
// 사용 시간 TOP 3 막대 차트
// ---------------------
function updateUsageTimeChart(data) {
  if (!usageTimeChart) return

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: '#666',
        formatter: '{value}시간'
      }
    },
    yAxis: {
      type: 'category',
      data: data.categories || ['회의실 A', '회의실 B', '회의실 C'],
      axisLabel: {
        color: '#666'
      }
    },
    series: [
      {
        name: selectedBaseYear.value,
        type: 'bar',
        data: data.baseYear || [240, 200, 160],
        itemStyle: {
          color: '#4A90E2'
        }
      },
      {
        name: selectedCompareYear.value,
        type: 'bar',
        data: data.compareYear || [160, 120, 100],
        itemStyle: {
          color: '#00A950'
        }
      }
    ]
  }

  usageTimeChart.setOption(option)
}

// ---------------------
// 사용 증가율 도넛 차트
// ---------------------
function updateIncreaseRateChart(rate) {
  if (!increaseRateChart) return

  // 소수점 한 자리까지 표기하도록 수정
  let value = rate ?? 0
  value = typeof value === 'number' ? value : 0

  const formattedLabel = typeof value === 'number'
    ? (Math.abs(value) < 1 && value !== 0
        ? value.toFixed(1)
        : Number.isInteger(value)
          ? value
          : value.toFixed(1)
      ) + '%'
    : '0%'

  // 절댓값을 사용하여 채우기 비율 계산
  const absValue = Math.abs(value)
  // 부호에 따라 색상 결정: 양수는 녹색, 음수는 빨간색
  const fillColor = value >= 0 ? '#00D4AA' : '#FF4444'

  const option = {
    tooltip: {
      trigger: 'item',
      // "기타" segment에는 tooltip 자체가 안 보이도록
      show: true,
      formatter: (params) => {
        if (params.name === '증가율') {
          // 값 표기는 부호 포함, 소수점 1자리까지
          let displayValue = typeof value === 'number'
            ? (Math.abs(value) < 1 && value !== 0
                ? value.toFixed(1)
                : Number.isInteger(value)
                  ? value
                  : value.toFixed(1)
              )
            : '0'
          // '증가율' 세그먼트는 실제 증가율 값을 보여준다 (+/- 등)
          return `증감률: ${displayValue}%`
        }
        // 기타는 아무 반응도 없게! (반응형, 툴팁 모두 제거)
        return ''
      }
    },
    series: [
      {
        name: '사용 증감률',
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 3
        },
        label: {
          show: true,
          position: 'center',
          formatter: formattedLabel,
          fontSize: 42,
          fontWeight: 'bold',
          color: '#333',
          fontFamily: 'Arial, sans-serif'
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: absValue,
            name: '증가율',
            itemStyle: {
              color: fillColor
            },
            emphasis: {
              scale: true,
              scaleSize: 5,
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              },
              label: {
                show: false
              }
            }
          },
          {
            value: 100 - absValue,
            name: '기타',
            itemStyle: {
              color: '#E8E8F0'
            },
            emphasis: {
              // 완전히 모든 hover/interactivity OFF
              disabled: true,
              scale: false,
              scaleSize: 1,
              itemStyle: {
                shadowBlur: 0,
                shadowOffsetX: 0,
                shadowColor: 'transparent'
              },
              label: {
                show: false
              }
            },
            tooltip: {
              show: false
            },
            // 완전히 상호작용 끔 (ECharts 5.x+)
            // 이 속성으로 마우스 이벤트 자체도 컷
            silent: true,
            selected: false // 혹시나 클릭 선택 없음 명시
          }
        ],
        // 가장 마지막으로 강조된 파이 조각 위에 이미지를 올려서 가릴 수 있는 이펙트 방지
        // (echarts 5.x+ 에서 hoverLayer 속성 지원)
        // hoverLayer: false (기본값이 false이긴 함)
      }
    ]
  }
  increaseRateChart.setOption(option)
}

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

    dataAssetName.value = data.asset.assetName

    const labels = data.monthlyData.map(m => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return monthNames[m.month - 1] || `${m.month}월`
    })
    const baseValues = data.monthlyData.map(m => m.baseYearUsageRate)
    const compareValues = data.monthlyData.map(m => m.compareYearUsageRate)

    // 메인 차트용 데이터 메모리 (legend 토글 연속사용 가능)
    mainChartLastLabels = [...labels]
    mainChartLastBase = [...baseValues]
    mainChartLastCompare = [...compareValues]

    await nextTick()
    updateMainChart(labels, baseValues, compareValues)

    // 하단 차트 데이터 - API에서 받은 데이터 사용
    if (data.popularByCount) {
      const baseYearCount = data.popularByCount.baseYear || []
      const compareYearCount = data.popularByCount.compareYear || []
      updateUsageCountChart({
        categories: baseYearCount.map(item => item.assetName).slice(0, 3),
        baseYear: baseYearCount.map(item => item.count).slice(0, 3),
        compareYear: compareYearCount.map(item => item.count).slice(0, 3)
      })
    }

    if (data.popularByTime) {
      const baseYearTime = data.popularByTime.baseYear || []
      const compareYearTime = data.popularByTime.compareYear || []
      updateUsageTimeChart({
        categories: baseYearTime.map(item => item.assetName).slice(0, 3),
        baseYear: baseYearTime.map(item => Math.round(item.totalMinutes / 60)).slice(0, 3),
        compareYear: compareYearTime.map(item => Math.round(item.totalMinutes / 60)).slice(0, 3)
      })
    }

    let increaseRate = 0
    if (typeof data.actualUsageIncrease === 'number') {
      increaseRate = data.actualUsageIncrease
      increaseRate = Math.round(increaseRate * 10) / 10
    }
    updateIncreaseRateChart(increaseRate)
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
    yearList.value = data.years

    if (yearList.value.length > 0) {
      selectedBaseYear.value = yearList.value[0]
      selectedCompareYear.value = yearList.value[yearList.value.length - 1]
      mainChartVisible.value = {
        [yearList.value[0]]: true,
        [yearList.value[yearList.value.length - 1]]: true,
      }
    }
  } catch (err) {
    console.error("연도 조회 실패:", err)
  }
}

onMounted(async () => {
  window.addEventListener("keyup", handleKeyPress)
  window.addEventListener("resize", resizeCharts)
  await loadYears()
  await nextTick()
  initCharts()
  await loadData()
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCharts)
  mainChart?.dispose()
  usageCountChart?.dispose()
  usageTimeChart?.dispose()
  increaseRateChart?.dispose()
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
.content-wrapper {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}
.chart-box {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.chart-header {
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
.chart-container {
  width: 100%;
  height: 500px;
}
/* 하단 차트 영역 */
.bottom-charts {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 20px;
  margin-top: 20px;
}
.bottom-chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.bottom-chart-card.large {
  grid-column: span 1;
}
.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  text-align: center;
}
.bottom-chart-container {
  width: 100%;
  height: 250px;
}
.bottom-chart-container.large {
  height: 350px;
}
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
