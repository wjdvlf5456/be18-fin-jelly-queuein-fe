<template>
  <div class="asset-dashboard">
    <h2 class="page-title">자원 대시보드</h2>

    <!-- 차트 타입 선택 -->
    <div class="chart-type-selector">
      <button
        v-for="type in chartTypes"
        :key="type.value"
        :class="['chart-type-btn', { active: selectedChartType === type.value }]"
        @click="selectChartType(type.value)"
      >
        <i :class="type.icon"></i>
        {{ type.label }}
      </button>
    </div>

    <!-- 차트 컨테이너 -->
    <div class="chart-wrapper">
      <div ref="chartContainerRef" class="chart-container"></div>

      <!-- 로딩 오버레이 -->
      <div v-if="isLoading" class="loading-overlay">
        <i class="ri-loader-4-line spinning"></i>
        <p>데이터를 불러오는 중...</p>
      </div>
    </div>

    <!-- 새로고침 버튼 -->
    <div class="dashboard-actions">
      <button class="refresh-btn" @click="loadData" :disabled="isLoading">
        <i class="ri-refresh-line" :class="{ spinning: isLoading }"></i>
        새로고침
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { assetApi } from '@/api/assetApi'
import * as echarts from 'echarts'

// 차트 타입 정의
const chartTypes = [
  { value: 'tree', label: '트리', icon: 'ri-file-tree-line' },
  { value: 'treemap', label: '트리맵', icon: 'ri-node-tree' }
]

const selectedChartType = ref('treemap')
const chartContainerRef = ref(null)
let chartInstance = null
const isLoading = ref(false)
const treeData = ref([])

// 차트 타입 선택
function selectChartType(type) {
  if (selectedChartType.value === type) return
  selectedChartType.value = type
  updateChart()
}

// 자원 상세 정보를 재귀적으로 조회하여 비용 정보 추가
async function enrichTreeWithCosts(nodes) {
  if (!nodes || nodes.length === 0) return nodes

  // 병렬로 모든 자원의 상세 정보 조회 (성능 최적화)
  const assetIds = []
  function collectAssetIds(nodes) {
    for (const node of nodes) {
      if (node.assetId) {
        assetIds.push(node.assetId)
      }
      if (node.children && node.children.length > 0) {
        collectAssetIds(node.children)
      }
    }
  }
  collectAssetIds(nodes)

  // 모든 자원의 상세 정보를 병렬로 조회
  const detailPromises = assetIds.map(id =>
    assetApi.getDetail(id).catch(err => {
      // 조회 실패 시 null 반환
      console.warn(`자원 ${id} 상세 조회 실패:`, err)
      return null
    })
  )
  const detailResults = await Promise.all(detailPromises)

  // assetId를 키로 하는 맵 생성
  const costMap = new Map()
  detailResults.forEach((res, index) => {
    if (res?.data && assetIds[index]) {
      costMap.set(assetIds[index], {
        costPerHour: Number(res.data.costPerHour) || 0,
        periodCost: Number(res.data.periodCost) || 0
      })
    }
  })

  // 트리 데이터에 비용 정보 추가
  function addCostsToNodes(nodes) {
    return nodes.map(node => {
      const costs = costMap.get(node.assetId) || { costPerHour: 0, periodCost: 0 }
      return {
        ...node,
        costPerHour: costs.costPerHour,
        periodCost: costs.periodCost,
        children: node.children ? addCostsToNodes(node.children) : undefined
      }
    })
  }

  return addCostsToNodes(nodes)
}

// 트리 데이터 로드
async function loadData() {
  if (isLoading.value) return

  isLoading.value = true
  try {
    const res = await assetApi.getTree()
    const rawTreeData = res?.data || []

    // 비용 정보를 추가하기 위해 각 자원의 상세 정보 조회
    treeData.value = await enrichTreeWithCosts(rawTreeData)

    await nextTick()
    updateChart()
  } catch (error) {
    console.error('트리 데이터 로드 실패:', error)
  } finally {
    isLoading.value = false
  }
}

// 차트 초기화
function initChart() {
  if (!chartContainerRef.value) return false

  if (chartInstance) {
    chartInstance.dispose()
  }

  try {
    chartInstance = echarts.init(chartContainerRef.value)
    return true
  } catch (error) {
    console.error('차트 초기화 실패:', error)
    return false
  }
}

// 차트 업데이트
async function updateChart() {
  if (!chartInstance) {
    if (!initChart()) return
  }

  if (!treeData.value || treeData.value.length === 0) {
    chartInstance.setOption({
      title: {
        text: '자원 데이터가 없습니다',
        left: 'center',
        top: 'center',
        textStyle: { color: '#999', fontSize: 16 }
      }
    })
    return
  }

  chartInstance.showLoading()

  try {
    let option = {}

    switch (selectedChartType.value) {
      case 'tree':
        option = getTreeOption()
        break
      case 'treemap':
        option = getTreemapOption()
        break
      default:
        option = getTreemapOption()
    }

    chartInstance.setOption(option, true)
    chartInstance.hideLoading()
  } catch (error) {
    console.error('차트 업데이트 에러:', error)
    if (chartInstance) {
      chartInstance.hideLoading()
    }
  }
}


// 트리 옵션
function getTreeOption() {
  const data = convertToTreeData(treeData.value)

  return {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
    series: [{
      type: 'tree',
      data: data,
      top: '5%',
      left: '7%',
      bottom: '5%',
      right: '20%',
      symbolSize: 7,
      label: {
        position: 'left',
        verticalAlign: 'middle',
        align: 'right',
        fontSize: 12
      },
      leaves: {
        label: {
          position: 'right',
          verticalAlign: 'middle',
          align: 'left'
        }
      },
      emphasis: {
        focus: 'descendant'
      },
      expandAndCollapse: true,
      animationDuration: 550,
      animationDurationUpdate: 750
    }]
  }
}

// 트리맵 옵션 (obama 스타일 - 비용 총합)
function getTreemapOption() {
  const data = convertToTreemapData(treeData.value)

  return {
    tooltip: {
      trigger: 'item',
      formatter: function(info) {
        const data = info.data
        if (!data) return ''
        const name = data.name || info.name
        const totalCost = data.totalCost || 0
        const costPerHour = data.costPerHour || 0
        const periodCost = data.periodCost || 0
        const childCount = data.childCount || 0

        return [
          '<div style="font-weight: bold; margin-bottom: 8px; color: #fff;">' +
          echarts.format.encodeHTML(name) + '</div>',
          '<div style="margin-bottom: 4px;">총 비용: ' + echarts.format.addCommas(totalCost) + '원</div>',
          costPerHour > 0 ? '<div style="margin-bottom: 4px;">시간당 비용: ' + echarts.format.addCommas(costPerHour) + '원</div>' : '',
          periodCost > 0 ? '<div style="margin-bottom: 4px;">고정비: ' + echarts.format.addCommas(periodCost) + '원</div>' : '',
          childCount > 0 ? '<div>하위 자원: ' + childCount + '개</div>' : ''
        ].filter(Boolean).join('')
      }
    },
    series: [{
      name: '자원 비용',
      type: 'treemap',
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
      label: {
        show: true,
        formatter: '{b}',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
        textShadowBlur: 3,
        textShadowColor: 'rgba(0,0,0,0.8)',
        overflow: 'break'
      },
      labelLayout: function(params) {
        if (params.rect.width < 5 || params.rect.height < 5) {
          return {
            fontSize: 0
          }
        }
        return {
          fontSize: Math.min(Math.sqrt(params.rect.width * params.rect.height) / 10, 16)
        }
      },
      upperLabel: {
        show: true,
        height: 30,
        fontSize: 11,
        fontWeight: 'bold',
        color: '#fff',
        textShadowBlur: 3,
        textShadowColor: 'rgba(0,0,0,0.8)',
        formatter: function(params) {
          const data = params.data
          if (!data) return ''
          const totalCost = data.totalCost || 0
          if (totalCost > 0) {
            return echarts.format.addCommas(totalCost) + '원'
          }
          return ''
        }
      },
      itemStyle: {
        borderColor: 'rgba(100, 100, 200, 0.2)',
        borderWidth: 2,
        borderRadius: 5
      },
      emphasis: {
        itemStyle: {
          borderColor: '#00A950',
          borderWidth: 4
        },
        label: {
          fontSize: 14
        }
      },
      levels: [
        {
          // 최상위 레벨: 집단별 색상은 itemStyle에서 이미 설정됨
          itemStyle: {
            borderWidth: 3,
            gapWidth: 3,
            borderRadius: 5,
            shadowBlur: 20,
            shadowColor: 'rgba(20, 20, 40, 0.5)'
          }
        },
        {
          // 두 번째 레벨
          itemStyle: {
            borderWidth: 2,
            gapWidth: 1,
            borderRadius: 5,
            shadowBlur: 5,
            shadowColor: 'rgba(20, 20, 40, 0.3)'
          }
        },
        {
          // 세 번째 레벨 이하
          upperLabel: {
            show: false
          },
          itemStyle: {
            borderWidth: 0,
            gapWidth: 0,
            borderRadius: 1
          }
        }
      ],
      data: data
    }]
  }
}


// 데이터 변환 함수들

function convertToTreeData(treeNodes) {
  if (!treeNodes || treeNodes.length === 0) return []
  return treeNodes.map(node => ({
    name: node.name,
    value: countChildren(node),
    assetId: node.assetId,
    children: node.children ? convertToTreeData(node.children) : undefined
  }))
}

// 색상 유틸리티: HEX 색상을 밝게 또는 어둡게 조정
function adjustColorBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent))
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}

// 트리맵 데이터 변환 (비용 총합 계산)
function convertToTreemapData(treeNodes, parentPath = [], depth = 0, parentColor = null) {
  const result = []

  // 최상위 레벨(집단)별 기본 색상 팔레트
  const baseColors = [
    '#5793f3', // 파란색
    '#d14a61', // 빨간색
    '#fd9c35', // 주황색
    '#675bba', // 보라색
    '#fec42c', // 노란색
    '#dd4444', // 진한 빨간색
    '#d4df5a', // 연두색
    '#cd4870', // 분홍색
    '#00A950', // 녹색
    '#8ba3f5', // 밝은 파란색
    '#4ecdc4', // 청록색
    '#ff6b6b', // 산호색
    '#95e1d3', // 민트색
    '#f38181', // 연한 빨간색
    '#a8e6cf'  // 연한 녹색
  ]

  for (let i = 0; i < treeNodes.length; i++) {
    const node = treeNodes[i]
    const currentPath = [...parentPath, node.name]
    const hasChildren = node.children && node.children.length > 0

    // 비용 계산: costPerHour + periodCost
    const costPerHour = Number(node.costPerHour) || Number(node.cost_per_hour) || Number(node.pricePerHour) || 0
    const periodCost = Number(node.periodCost) || Number(node.period_cost) || Number(node.fixedCost) || 0
    const nodeCost = costPerHour + periodCost

    // 색상 결정: 최상위 레벨은 기본 색상, 하위는 부모 색상 기반으로 변형
    let nodeColor
    if (depth === 0) {
      // 최상위 레벨: 집단별 고유 색상
      nodeColor = baseColors[i % baseColors.length]
    } else if (parentColor) {
      // 하위 레벨: 부모 색상을 기반으로 약간 밝게 또는 어둡게 조정
      // 깊이에 따라 밝기 조정 (깊을수록 약간 어둡게)
      const brightnessAdjust = -10 * depth + (i % 3) * 5 // -10 ~ +10 범위
      nodeColor = adjustColorBrightness(parentColor, brightnessAdjust)
    } else {
      // 폴백
      nodeColor = baseColors[i % baseColors.length]
    }

    // 하위 자원들의 비용 합산
    let totalCost = nodeCost
    let childCount = 0
    let childrenData = []

    if (hasChildren) {
      childrenData = convertToTreemapData(node.children, currentPath, depth + 1, nodeColor)
      const childCost = childrenData.reduce((sum, child) => sum + (child.totalCost || 0), 0)
      totalCost += childCost
      childCount = countChildren(node)
    }

    // 비용이 0이면 자식 수를 값으로 사용 (최소 1)
    const value = totalCost > 0 ? totalCost : (childCount > 0 ? childCount : 1)

    const treemapNode = {
      name: node.name,
      value: value,
      totalCost: totalCost,
      costPerHour: costPerHour,
      periodCost: periodCost,
      childCount: childCount,
      assetId: node.assetId,
      path: currentPath.join('/'),
      id: node.assetId?.toString() || `node_${i}_${Date.now()}`,
      itemStyle: {
        color: nodeColor
      },
      children: hasChildren ? childrenData : undefined
    }

    result.push(treemapNode)
  }
  return result
}



function countChildren(node) {
  if (!node.children || node.children.length === 0) return 1
  return node.children.reduce((sum, child) => sum + countChildren(child), 0)
}

// 리사이즈 핸들러
function resizeChart() {
  chartInstance?.resize()
}

// 차트 클릭 이벤트
function setupChartEvents() {
  if (!chartInstance) return

  chartInstance.off('click')
  chartInstance.on('click', function(params) {
    // 차트 클릭 시 자원 상세 페이지로 이동
    if (params.data && params.data.assetId) {
      setTimeout(() => {
        window.location.href = `/admin/assets/${params.data.assetId}`
      }, 0)
    }
  })
}

watch(selectedChartType, () => {
  updateChart()
  setupChartEvents()
})

onMounted(async () => {
  await nextTick()
  if (initChart()) {
    await loadData()
    setupChartEvents()
  }
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chartInstance?.dispose()
})
</script>

<style scoped>
.asset-dashboard {
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #333;
}

.chart-type-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.chart-type-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s;
}

.chart-type-btn:hover {
  border-color: #00A950;
  color: #00A950;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 169, 80, 0.2);
}

.chart-type-btn.active {
  background: #00A950;
  border-color: #00A950;
  color: white;
}

.chart-type-btn i {
  font-size: 18px;
}

.chart-wrapper {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 600px;
}

.chart-container {
  width: 100%;
  height: 600px;
  min-height: 600px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  z-index: 10;
}

.loading-overlay i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #00A950;
}

.loading-overlay p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.dashboard-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #c7dbcc;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: #b5cbb8;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn i.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
