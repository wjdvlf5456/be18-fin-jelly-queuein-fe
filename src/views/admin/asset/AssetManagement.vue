<template>
  <div class="asset-wrapper">
    <div class="page-header">
      <h2 class="page-title">자원 목록 조회</h2>
      <button class="dashboard-header-btn" @click="goDashboard">
        <i class="ri-dashboard-line"></i>
        대시보드
      </button>
    </div>

    <!-- 상단 필터 영역 -->
    <div class="filters">
      <div class="cell">
        <RootDropDownMenu v-model="building">
          <option value="">전체</option>
        </RootDropDownMenu>
      </div>
      <div class="cell"><OneDepthDropDownMenu v-model="location" :buildingId="building" /></div>
      <div class="cell"><CategoryDropDownMenu v-model="category" /></div>
      <div class="cell"><AssetTypeDropdown v-model="type" /></div>
      <div class="cell"><AssetStatusDropdown v-model="status" /></div>

      <div class="cell search-box">
        <input class="search-input" v-model="keyword" placeholder="자원명 검색" />
      </div>

      <button class="search-btn" @click="loadAssets">검색</button>
    </div>

    <!-- 테이블 -->
    <DataTable
      :value="assets"
      stripedRows
      showGridlines
      class="asset-table"
      :emptyMessage="'데이터가 없습니다.'"
      @row-click="goAssetDetail"
      :sortField="sortField"
      :sortOrder="sortOrder"
      @sort="onSort"
      :pt="{
        root: { class: 'custom-datatable' },
        header: { class: 'custom-header' },
        thead: { class: 'custom-thead' },
        tbody: { class: 'custom-tbody' },
        column: { class: 'custom-column' },
      }"
    >
      <!-- 자원명 -->
      <Column field="name" header="자원명" sortable class="name-column" />

      <!-- 자원유형 -->
      <Column field="type" header="자원유형" sortable class="auto-width-column">
        <template #body="{ data }">
          {{ typeMap[data.type] || data.type }}
        </template>
      </Column>

      <!-- 자원상태 -->
      <Column field="status" header="자원상태" sortable class="auto-width-column">
        <template #body="{ data }">
          <Tag
            :value="statusMap[data.status] || data.status"
            :severity="getStatusSeverity(data.status)"
          />
        </template>
      </Column>

      <!-- 카테고리 -->
      <Column field="categoryName" header="카테고리" sortable class="auto-width-column" />

      <!-- 승인 유무 -->
      <Column field="needApproval" header="승인 유무" sortable class="auto-width-column">
        <template #body="{ data }">
          <Tag
            :value="data.needApproval ? '승인 필요' : '승인 생략'"
            :severity="data.needApproval ? 'warning' : 'success'"
          />
        </template>
      </Column>

      <!-- 예약 가능 -->
      <Column field="status" header="예약 가능" sortable class="auto-width-column">
        <template #body="{ data }">
          <Tag
            :value="data.status === 'AVAILABLE' ? '가능' : '불가'"
            :severity="data.status === 'AVAILABLE' ? 'success' : 'danger'"
          />
        </template>
      </Column>

      <!-- 버전 -->
      <Column field="version" header="버전" sortable class="auto-width-column">
        <template #body="{ data }">
          {{ data.version || '-' }}
        </template>
      </Column>

      <!-- 편집 메뉴 -->
      <Column header="" :exportable="false" class="action-column">
        <template #body="{ data }">
          <Button
            icon="pi pi-ellipsis-v"
            text
            rounded
            @click.stop="(e) => openMenu(e, data)"
            class="menu-button"
          />
        </template>
      </Column>
    </DataTable>

    <!-- 페이지네이션 (팀원 스타일) -->
    <div class="pagination">
      <el-pagination
        layout="prev, pager, next"
        :total="total"
        :page-size="size"
        :current-page="page + 1"
        @current-change="changePageFromEl"
      />
    </div>

    <!-- 하단 버튼 -->
    <div class="bottom-actions">
      <button class="dashboard-btn" @click="goDashboard">자원 대시보드</button>
      <button class="category-btn" @click="goCategory">카테고리 관리</button>
      <button class="create-btn" @click="createAsset">자원 등록</button>
    </div>

    <!-- 모달 -->
    <ConfirmModal
      v-if="showDeleteModal"
      title="자원 삭제"
      message="정말 삭제하시겠습니까?"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />

    <AssetMoveModal v-if="showMoveModal" :onConfirm="confirmMove" :onClose="closeMoveModal" />

    <!-- 편집 메뉴 -->
    <Menu ref="menuRef" :model="menuItems" popup />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api/axios'
import { assetApi } from '@/api/assetApi'

// PrimeVue
import Menu from 'primevue/menu'

// 공용 드롭다운
import RootDropDownMenu from '@/components/common/RootDropDownMenu.vue'
import OneDepthDropDownMenu from '@/components/common/OneDepthDropDownMenu.vue'
import CategoryDropDownMenu from '@/components/common/CategoryDropDownMenu.vue'
import AssetTypeDropdown from '@/components/common/AssetTypeDropdown.vue'
import AssetStatusDropdown from '@/components/common/AssetStatusDropdown.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import AssetMoveModal from './components/AssetMoveModal.vue'

const building = ref('')
const location = ref('')
const category = ref('')
const type = ref('')
const status = ref('')
const keyword = ref('')
const router = useRouter()

const page = ref(0)
const size = ref(10)
const total = ref(0)
const assets = ref([])
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const showMoveModal = ref(false)
const moveTarget = ref(null)

// 정렬 상태
const sortField = ref(null)
const sortOrder = ref(null)

// 편집 메뉴
const menuRef = ref()
const selectedAsset = ref(null)

function openMenu(event, asset) {
  selectedAsset.value = asset
  menuRef.value.toggle(event)
}

const menuItems = computed(() => [
  {
    label: '수정',
    icon: 'pi pi-pencil',
    command: () => {
      if (selectedAsset.value) {
        editAsset(selectedAsset.value)
      }
    },
  },
  {
    label: '이동',
    icon: 'pi pi-arrows-h',
    command: () => {
      if (selectedAsset.value) {
        openMoveModal(selectedAsset.value)
      }
    },
  },
  {
    label: '삭제',
    icon: 'pi pi-trash',
    command: () => {
      if (selectedAsset.value) {
        deleteAsset(selectedAsset.value)
      }
    },
  },
])

const typeMap = {
  STATIC: '정적 자원',
  DYNAMIC: '동적 자원',
}

const statusMap = {
  AVAILABLE: '사용 가능',
  UNAVAILABLE: '사용 불가',
  MAINTENANCE: '점검중',
}

// 상태별 Tag 색상
function getStatusSeverity(status) {
  const map = {
    AVAILABLE: 'success',
    UNAVAILABLE: 'danger',
    MAINTENANCE: 'warning',
  }
  return map[status] || 'secondary'
}

// 프론트엔드 필드명을 백엔드 필드명으로 매핑
function mapSortField(field) {
  const fieldMap = {
    name: 'name',
    type: 'type',
    status: 'status',
    categoryName: 'categoryName',
    needApproval: 'needApproval',
    version: 'version',
  }
  return fieldMap[field] || field
}

async function loadAssets() {
  try {
    const params = {
      page: page.value,
      size: size.value,
      root: building.value || null,
      oneDepth: location.value || null,
      categoryId: category.value || null,
      type: type.value || null,
      status: status.value || null,
      keyword: keyword.value || null,
    }

    // 정렬 파라미터 추가 (Spring Data JPA 형식)
    if (sortField.value) {
      const direction = sortOrder.value === 1 ? 'asc' : 'desc'
      const mappedField = mapSortField(sortField.value)
      params.sort = `${mappedField},${direction}`
    }

    const res = await api.get('/assets/descendants', { params })

    if (res?.data) {
      assets.value = res.data.content || []
      total.value = res.data.totalElements || 0
    } else {
      console.warn('응답 데이터 형식이 올바르지 않습니다.')
      assets.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('자원 목록 조회 실패:', error)
    ElMessage.error('자원 목록을 불러오는데 실패했습니다.')
    assets.value = []
    total.value = 0
  }
}

function onSort(event) {
  sortField.value = event.sortField
  sortOrder.value = event.sortOrder
  page.value = 0 // 정렬 시 첫 페이지로 이동
  loadAssets()
}

async function confirmDelete() {
  try {
    if (!deleteTarget.value?.assetId) {
      ElMessage.warning('삭제할 자원을 선택해주세요.')
      showDeleteModal.value = false
      return
    }

    await assetApi.delete(deleteTarget.value.assetId)
    ElMessage.success('자원이 삭제되었습니다.')
    showDeleteModal.value = false
    await loadAssets()
  } catch (err) {
    console.error('자원 삭제 실패:', err)

    let errorMessage = '자원 삭제에 실패했습니다.'

    if (err.response) {
      const status = err.response.status
      const data = err.response.data

      if (status === 403) {
        errorMessage = data?.message || '자원 삭제 권한이 없습니다.'
      } else if (status === 404) {
        errorMessage = data?.message || '자원을 찾을 수 없습니다.'
      } else if (status === 409) {
        errorMessage = data?.message || '자원을 사용 중이어서 삭제할 수 없습니다.'
      } else {
        errorMessage = data?.message || `자원 삭제에 실패했습니다. (${status})`
      }
    } else if (err.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
  }
}

async function confirmMove(newParentName) {
  try {
    if (!moveTarget.value?.assetId) {
      ElMessage.warning('이동할 자원을 선택해주세요.')
      closeMoveModal()
      return
    }

    if (!newParentName || newParentName.trim() === '') {
      ElMessage.warning('부모 자원명을 입력해주세요.')
      return
    }

    await assetApi.move(moveTarget.value.assetId, newParentName.trim())
    ElMessage.success('자원이 이동되었습니다.')
    closeMoveModal()
    await loadAssets()
  } catch (err) {
    console.error('자원 이동 실패:', err)

    let errorMessage = '자원 이동에 실패했습니다.'

    if (err.response) {
      const status = err.response.status
      const data = err.response.data

      if (status === 400) {
        errorMessage = data?.message || '요청 정보가 올바르지 않습니다.'
      } else if (status === 403) {
        errorMessage = data?.message || '자원 이동 권한이 없습니다.'
      } else if (status === 404) {
        errorMessage = data?.message || '자원을 찾을 수 없습니다.'
      } else if (status === 409) {
        errorMessage = data?.message || '이동할 수 없는 상태입니다.'
      } else {
        errorMessage = data?.message || `자원 이동에 실패했습니다. (${status})`
      }
    } else if (err.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
  }
}

function changePageFromEl(newPage) {
  page.value = newPage - 1
  loadAssets()
}

function goCategory() {
  router.push('/admin/assets/categories')
}

function goDashboard() {
  router.push('/admin/assets/dashboard')
}

onMounted(loadAssets)

function editAsset(asset) {
  router.push(`/admin/assets/${asset.assetId}/edit`)
}

function createAsset() {
  router.push('/admin/assets/create')
}

function deleteAsset(asset) {
  deleteTarget.value = asset
  showDeleteModal.value = true
}

function openMoveModal(asset) {
  moveTarget.value = asset
  showMoveModal.value = true
}

function closeMoveModal() {
  showMoveModal.value = false
}

function goAssetDetail(event) {
  const row = event.data
  if (row && row.assetId) {
    router.push(`/admin/assets/${row.assetId}`)
  }
}
</script>

<style scoped>
.asset-wrapper {
  width: 100%;
  overflow-x: auto; /* 가로 스크롤 허용 */
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.dashboard-header-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #00A950;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
  font-size: 14px;
}

.dashboard-header-btn:hover {
  background: #008f42;
}

.dashboard-header-btn i {
  font-size: 18px;
}

/* 필터 영역 */
.filters {
  display: flex;
  gap: 12px;
  width: 100%;
  align-items: center;
  margin-bottom: 20px;
}

.cell {
  flex: 1;
  min-width: 120px;
}

.cell select,
.search-box input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.search-btn {
  padding: 10px 18px;
  background: #c7dbcc;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

/* ===== 페이지네이션 팀원 스타일 ===== */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.bottom-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.dashboard-btn {
  padding: 10px 18px;
  background: #00A950;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.dashboard-btn:hover {
  background: #008f42;
}

.category-btn {
  padding: 10px 18px;
  background: #ddd;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.create-btn {
  padding: 10px 18px;
  background: #c7dbcc;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
  justify-content: center;
}

.actions button {
  flex-shrink: 0;
}

/* PrimeVue DataTable 커스텀 스타일 */
.asset-table {
  width: 100%;
  margin-top: 20px;
}

:deep(.custom-datatable) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.custom-datatable .p-datatable-table) {
  table-layout: auto;
  width: 100%;
}

:deep(.custom-header) {
  background: #8ba3f5;
  color: white;
  font-weight: 600;
  padding: 16px;
}

:deep(.custom-thead th) {
  background: #8ba3f5;
  color: white;
  font-weight: 600;
  padding: 16px 12px;
  text-align: left;
  border: none;
  font-size: 14px;
}

:deep(.custom-thead th:hover) {
  background: #7c94f0;
}

:deep(.custom-tbody tr) {
  transition: background-color 0.2s ease;
}

:deep(.custom-tbody tr:hover) {
  background-color: #f5f7fa;
  cursor: pointer;
}

:deep(.custom-tbody td) {
  padding: 14px 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
}

:deep(.p-datatable .p-sortable-column-icon) {
  color: white;
  margin-left: 8px;
}

:deep(.p-datatable .p-sortable-column:not(.p-highlight):hover) {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.p-datatable .p-sortable-column.p-highlight) {
  background: rgba(255, 255, 255, 0.2);
}

:deep(.p-tag) {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
}

/* 자원명 컬럼 - 제일 크게 차지 */
:deep(.name-column) {
  min-width: 300px;
  width: 40%;
}

:deep(.name-column th),
:deep(.name-column td) {
  font-size: 16px;
  font-weight: 600;
  padding: 14px 16px;
}

/* 자원명 컬럼 정렬 아이콘 크게 */
:deep(.name-column .p-sortable-column-icon) {
  font-size: 18px;
  margin-left: 8px;
}

/* 나머지 컬럼들 - 글씨 크기에 맞게 너비 차지 */
:deep(.auto-width-column) {
  width: auto;
  white-space: nowrap;
}

:deep(.auto-width-column th),
:deep(.auto-width-column td) {
  padding: 14px 16px;
  width: auto;
}

/* 편집 메뉴 버튼 스타일 */
.menu-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-column {
  width: 60px;
  text-align: center;
  white-space: nowrap;
}

</style>
