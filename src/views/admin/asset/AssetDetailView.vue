<template>
  <div class="detail-wrapper">
    <h3 class="tree-title">자원 상세 정보</h3>
    <!-- 왼쪽: 계층 구조 트리 -->
    <div class="tree-panel">
      <AssetTreeView :currentId="assetId" />
    </div>

    <!-- 오른쪽: 상세 정보 -->
    <div class="detail-panel">
      <!-- 이미지 -->
      <div class="image-area">
        <div class="image-box" @click="openImageModal" v-if="asset.image">
          <img :src="asset.image" alt="asset image" />
          <div class="image-overlay">
            <i class="pi pi-search-plus"></i>
            <span>클릭하여 확대</span>
          </div>
        </div>
        <div v-else class="image-box">
          <div class="image-placeholder">이미지 없음</div>
        </div>
      </div>

      <!-- 이미지 확대 모달 -->
      <Dialog
        v-model:visible="showImageModal"
        modal
        :style="{ width: '90vw', maxWidth: '1200px' }"
        :closable="true"
        :draggable="false"
        class="image-modal"
        @hide="closeImageModal"
      >
        <template #header>
          <div class="modal-header">
            <h3>이미지 확대 보기</h3>
          </div>
        </template>
        <div class="modal-image-container" v-if="asset.image">
          <img :src="asset.image" alt="asset image" class="modal-image" />
        </div>
      </Dialog>

      <table class="detail-table">
        <tbody>
          <tr>
            <th>자원 명</th>
            <td>{{ asset.name }}</td>

            <th>자원 유형</th>
            <td>{{ convertType(asset.type) }}</td>
          </tr>

          <tr>
            <th>자원 상태</th>
            <td>{{ convertStatus(asset.status) }}</td>

            <th>카테고리</th>
            <td>{{ asset.categoryName }}</td>
          </tr>

          <tr>
            <th>예약 가능 여부</th>
            <td>{{ asset.available ? '예약 가능' : '불가' }}</td>

            <th>승인 유무</th>
            <td>{{ asset.approvalStatus ? '승인 필요' : '승인 불필요' }}</td>
          </tr>

          <tr>
            <th>시간당 청구 비용</th>
            <td>{{ formatPrice(asset.costPerHour) }}</td>

            <th>인가 단계</th>
            <td>{{ asset.accessLevel }}</td>
          </tr>

          <tr>
            <th>고정비</th>
            <td>{{ formatPrice(asset.periodCost) }}</td>

            <th>버전</th>
            <td>{{ asset.version || '-' }}</td>
          </tr>

          <tr>
            <th>자원 설명</th>
            <td colspan="3">{{ asset.description }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 하단 버튼들 -->
      <div class="bottom-btns">
        <button class="edit-btn" @click="goEdit">자원 수정</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { assetApi } from '@/api/assetApi'
import AssetTreeView from './components/AssetTreeView.vue'
import Dialog from 'primevue/dialog'

const route = useRoute()
const router = useRouter()
const assetId = ref(Number(route.params.assetId) || null)

const asset = ref({})
const showImageModal = ref(false)

function openImageModal() {
  if (asset.value.image) {
    showImageModal.value = true
  }
}

function closeImageModal() {
  showImageModal.value = false
}

async function loadDetail() {
  try {
    if (!assetId.value || isNaN(assetId.value)) {
      ElMessage.error('유효하지 않은 자원 ID입니다.')
      router.push('/admin/assets')
      return
    }

    const res = await assetApi.getDetail(assetId.value)

    if (!res?.data) {
      ElMessage.error('자원 정보를 불러올 수 없습니다.')
      router.push('/admin/assets')
      return
    }

    asset.value = res.data
  } catch (e) {
    console.error('자원 정보 조회 실패:', e)

    let errorMessage = '자원 정보를 불러오는데 실패했습니다.'

    if (e.response) {
      const status = e.response.status
      const data = e.response.data

      if (status === 404) {
        errorMessage = data?.message || '자원을 찾을 수 없습니다.'
      } else if (status === 403) {
        errorMessage = data?.message || '자원 조회 권한이 없습니다.'
      } else {
        errorMessage = data?.message || `자원 정보를 불러오는데 실패했습니다. (${status})`
      }
    } else if (e.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
    router.push('/admin/assets')
  }
}

function goEdit() {
  router.push(`/admin/assets/${assetId.value}/edit`)
}

// 표시 변환 함수들
const convertStatus = (status) => {
  return (
    {
      AVAILABLE: '사용 가능',
      UNAVAILABLE: '사용 불가',
      MAINTENANCE: '점검 중',
    }[status] || status
  )
}

const convertType = (type) => {
  return (
    {
      STATIC: '정적 자원',
      DYNAMIC: '업무기기',
    }[type] || type
  )
}

const formatPrice = (v) => (v != null ? `${v.toLocaleString()}원` : '-')

onMounted(loadDetail)
watch(
  () => route.params.assetId,
  (newId) => {
    assetId.value = Number(newId) || null
    loadDetail()
  },
)
</script>

<style scoped>
.detail-wrapper {
  display: flex;
  width: 100%;
  gap: 40px;
}

/* 왼쪽 패널 */
.tree-panel {
  width: 250px;
  border-right: 1px solid #e5e5e5;
  padding-right: 20px;
  overflow: auto;
  white-space: nowrap;
  height: calc(100vh - 140px);
}

.tree-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
}

.tree-list {
  list-style: none;
  padding-left: 0;
}

.tree-root {
  margin-bottom: 10px;
  font-weight: 700;
}

/* 오른쪽 상세 영역 */
.detail-panel {
  flex: 1;
}

.image-area {
  margin-bottom: 20px;
}

.image-box {
  width: 400px;
  max-width: 100%;
  height: 300px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.image-box:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #f5f5f5;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
  gap: 8px;
}

.image-box:hover .image-overlay {
  opacity: 1;
}

.image-overlay i {
  font-size: 32px;
}

.image-overlay span {
  font-size: 14px;
  font-weight: 600;
}

.image-placeholder {
  color: #999;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}

.detail-table th {
  background: #b9cdb4;
  padding: 12px;
  width: 160px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.detail-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.bottom-btns {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.edit-btn,
.history-btn {
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #c7dbcc;
  background: #e6f0e6;
}

/* 이미지 확대 모달 스타일 */
:deep(.image-modal .p-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.image-modal .p-dialog-header) {
  padding: 20px 24px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.image-modal .p-dialog-header .p-dialog-title) {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

:deep(.image-modal .p-dialog-content) {
  padding: 0;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.modal-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
}

.modal-image {
  max-width: 100%;
  max-height: 80vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: zoomIn 0.3s ease-out;
}

@keyframes zoomIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}
</style>
