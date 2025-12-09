<template>
  <div class="asset-wrapper">
    <h2 class="page-title">자원 목록 조회</h2>

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
    <el-table
      :data="assets"
      stripe
      border
      style="width: 100%"
      :empty-text="'데이터가 없습니다.'"
      @row-click="goAssetDetail"
    >
      <!-- 자원유형 -->
      <el-table-column label="자원유형">
        <template #default="scope">
          {{ typeMap[scope.row.type] || scope.row.type }}
        </template>
      </el-table-column>

      <!-- 자원상태 -->
      <el-table-column label="자원상태">
        <template #default="scope">
          {{ statusMap[scope.row.status] || scope.row.status }}
        </template>
      </el-table-column>

      <!-- 자원명 -->
      <el-table-column prop="name" label="자원명" />

      <!-- 카테고리 -->
      <el-table-column prop="categoryName" label="카테고리" />

      <!-- 승인 유무 -->
      <el-table-column label="승인 유무">
        <template #default="scope">
          <el-tag :type="scope.row.needApproval ? 'warning' : 'success'" size="small">
            {{ scope.row.needApproval ? '승인 필요' : '승인 생략' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 예약 가능 -->
      <el-table-column label="예약 가능">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'AVAILABLE' ? 'success' : 'danger'" size="small">
            {{ scope.row.status === 'AVAILABLE' ? '가능' : '불가' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 버전 -->
      <el-table-column prop="version" label="버전" />

      <!-- 편집 버튼 -->
      <el-table-column label="편집">
        <template #default="scope">
          <div class="actions">
            <el-button type="primary" text size="small" @click.stop="editAsset(scope.row)"
              >수정</el-button
            >
            <el-button type="success" text size="small" @click.stop="openMoveModal(scope.row)"
              >이동</el-button
            >
            <el-button type="danger" text size="small" @click.stop="deleteAsset(scope.row)"
              >삭제</el-button
            >
          </div>
        </template>
      </el-table-column>
    </el-table>

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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import { assetApi } from '@/api/assetApi'

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

const typeMap = {
  STATIC: '정적 자원',
  DYNAMIC: '동적 자원',
}

const statusMap = {
  AVAILABLE: '사용 가능',
  UNAVAILABLE: '사용 불가',
  MAINTENANCE: '점검중',
}

async function loadAssets() {
  const res = await api.get('/assets/descendants', {
    params: {
      page: page.value,
      size: size.value,
      root: building.value || null,
      oneDepth: location.value || null,
      categoryId: category.value || null,
      type: type.value || null,
      status: status.value || null,
      keyword: keyword.value || null,
    },
  })
  assets.value = res.data.content
  total.value = res.data.totalElements
}

async function confirmDelete() {
  try {
    await assetApi.delete(deleteTarget.value.assetId)
    showDeleteModal.value = false
    loadAssets()
  } catch (err) {
    alert(err.response?.data?.message || '삭제 실패')
  }
}

async function confirmMove(newParentName) {
  try {
    await assetApi.move(moveTarget.value.assetId, newParentName)
    alert('자원이 이동되었습니다.')
    closeMoveModal()
    loadAssets()
  } catch (err) {
    alert(err.response?.data?.message || '이동 실패')
  }
}

function changePageFromEl(newPage) {
  page.value = newPage - 1
  loadAssets()
}

function goCategory() {
  router.push('/admin/assets/categories')
}

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

function goAssetDetail(row) {
  router.push(`/admin/assets/${row.assetId}`) // 상세 페이지 경로
}

onMounted(loadAssets)
</script>

<style scoped>
.asset-wrapper {
  width: 100%;
  overflow-x: auto; /* 가로 스크롤 허용 */
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 20px;
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
  gap: 8px; /* 버튼 간 간격 */
  white-space: nowrap; /* 줄 바꿈 방지 */
}
.actions button {
  flex-shrink: 0; /* 버튼이 줄어들지 않도록 */
}
</style>
