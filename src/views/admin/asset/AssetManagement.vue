<template>
  <div class="asset-wrapper">
    <h2 class="page-title">자원 목록 조회</h2>
    <!-- 🔹 상단 필터 영역 -->
    <div class="filters">
      <div class="cell"><RootDropDownMenu v-model="building" /></div>
      <div class="cell"><OneDepthDropDownMenu v-model="location" :buildingId="building" /></div>
      <div class="cell"><CategoryDropDownMenu v-model="category" /></div>
      <div class="cell"><AssetTypeDropdown v-model="type" /></div>
      <div class="cell"><AssetStatusDropdown v-model="status" /></div>

      <div class="cell search-box">
        <input class="search-input" v-model="keyword" placeholder="자원명 검색" />
      </div>

      <button class="search-btn" @click="loadAssets">검색</button>
    </div>

    <!-- 🔹 자원 목록 테이블 -->
    <table class="asset-table">
      <thead>
        <tr>
          <th>자원유형</th>
          <th>자원상태</th>
          <th>자원명</th>
          <th>카테고리</th>
          <th>승인 유무</th>
          <th>예약 가능</th>
          <th>버전</th>
          <th>편집</th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="assets.length === 0">
          <td colspan="8" class="empty">데이터가 없습니다.</td>
        </tr>

        <tr v-for="a in assets" :key="a.assetId" @click="goDetail(a.assetId)">
          <td>{{ a.type }}</td>
          <td>{{ a.status }}</td>
          <td>{{ a.name }}</td>
          <td>{{ a.categoryName }}</td>
          <td>{{ a.approved ? '승인됨' : '미승인' }}</td>
          <td>{{ a.available ? '가능' : '불가' }}</td>
          <td>{{ a.version }}</td>

          <!-- 편집 버튼 -->
          <td>
            <button class="edit-btn" @click.stop="editAsset(a)">수정</button>
            /
            <button class="move-btn" @click.stop="openMoveModal(a)">이동</button>
            /
            <button class="delete-btn" @click.stop="deleteAsset(a)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 🔹 페이지네이션 -->
    <div class="pagination">
      <button :disabled="page === 0" @click="changePage(page - 1)">〈</button>

      <button
        v-for="i in totalPages"
        :key="i"
        :class="['page-btn', { active: page === i - 1 }]"
        @click="changePage(i - 1)"
      >
        {{ i }}
      </button>

      <button :disabled="page + 1 >= totalPages" @click="changePage(page + 1)">〉</button>
    </div>

    <!-- 🔹 하단 버튼 -->
    <div class="bottom-actions">
      <button class="category-btn" @click="goCategory">카테고리 관리</button>
      <button class="create-btn" @click="createAsset">자원 등록</button>
    </div>

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
// import { categoryApi } from '@/api/categoryApi'
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

const assets = ref([])
const totalPages = ref(1)

const showDeleteModal = ref(false)
const deleteTarget = ref(null)

// 자원 이동에 필요한 변수
const showMoveModal = ref(false)
const moveTarget = ref(null)

async function loadAssets() {
  const res = await api.get('/assets/descendants', {
    params: {
      page: page.value,
      size: size.value,
      buildingId: building.value || null,
      locationId: location.value || null,
      categoryId: category.value || null,
      type: type.value || null,
      status: status.value || null,
      keyword: keyword.value || null,
    },
  })

  assets.value = res.data.content
  totalPages.value = res.data.totalPages
}

async function confirmDelete() {
  try {
    await assetApi.delete(deleteTarget.value.assetId)
    showDeleteModal.value = false
    loadAssets() // 목록 새로고침
  } catch (err) {
    alert(err.response?.data?.message || '삭제 실패')
  }
}

async function confirmMove(newParentName) {
  try {
    await assetApi.move(moveTarget.value.assetId, newParentName)

    alert('자원이 이동되었습니다.')
    closeMoveModal()
    loadAssets() // 목록 새로고침
  } catch (err) {
    alert(err.response?.data?.message || '이동 실패')
    console.error(err)
  }
}

function changePage(p) {
  page.value = p
  loadAssets()
}

function goCategory() {
  router.push('/admin/categories')
}

function editAsset(asset) {
  router.push(`/admin/assets/${asset.assetId}/edit`)
}

function createAsset() {
  router.push('/admin/assets/create')
}

function goDetail(assetId) {
  router.push(`/admin/assets/${assetId}`)
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

onMounted(loadAssets)
</script>

<style scoped>
.asset-wrapper {
  width: 100%;
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
}

/* 드롭다운/검색창 공통 비율 */
.cell {
  flex: 1; /* 비율 기반으로 확대/축소 */
  min-width: 120px; /* 최소 폭만 지정 */
}

/* 드롭다운 내부의 select 는 셀 폭에 맞게 꽉 채움 */
.cell select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

/* 검색 입력창 비율 처리 */
.search-box input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

/* 검색 버튼은 고정폭 */
.search-btn {
  padding: 10px 18px;
  background: #c7dbcc;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

/* 테이블 */
.asset-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.asset-table tbody tr:hover {
  background-color: #f5f5f5;
  cursor: pointer;
}

.asset-table th {
  background: #f1f1f1;
  padding: 10px;
  text-align: left;
}

.asset-table td {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.empty {
  text-align: center;
  color: #888;
}

/* 페이지네이션 */
.pagination {
  margin-top: 20px;
  text-align: center;
}

.page-btn {
  margin: 0 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.page-btn.active {
  background: #c7dbcc;
}

/* 하단 버튼들 */
.bottom-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
}

.create-btn {
  padding: 10px 18px;
  background: #c7dbcc;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.category-btn {
  padding: 10px 18px;
  background: #ddd;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.edit-btn {
  color: #2d6cdf;
  cursor: pointer;
  background: none;
  border: none;
  outline: none;
}

.delete-btn {
  color: #d9534f;
  cursor: pointer;
  background: none;
  border: none;
  outline: none;
}

.move-btn {
  color: #2f5d2f;
  cursor: pointer;
  background: none;
  border: none;
  outline: none;
}

/* .move-btn:hover {
  background-color: #cfe3cf;
} */
</style>
