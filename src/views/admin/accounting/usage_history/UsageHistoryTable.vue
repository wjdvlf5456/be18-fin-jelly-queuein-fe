<template>
  <div>
    <!-- 📌 데이터 테이블 -->
    <el-table
      :data="rows"
      border
      style="width: 100%"
      highlight-current-row
    >
      <!-- 자원명 -->
      <el-table-column
        prop="assetName"
        label="자원명"
        min-width="180"
        align="center"
      />

      <!-- 예약 시작 -->
      <el-table-column label="예약 시작" min-width="160" align="center">
        <template #default="scope">
          {{ toKST(scope.row.reservationStartAt) }}
        </template>
      </el-table-column>

      <!-- 예약 종료 -->
      <el-table-column label="예약 종료" min-width="160" align="center">
        <template #default="scope">
          {{ toKST(scope.row.reservationEndAt) }}
        </template>
      </el-table-column>

      <!-- 예약 시간 -->
      <el-table-column
        prop="reservationMinutes"
        label="예약 시간(분)"
        min-width="150"
        align="center"
      />

      <!-- 실제 시작 -->
      <el-table-column label="실제 시작" min-width="160" align="center">
        <template #default="scope">
          {{ toKST(scope.row.actualStartAt) }}
        </template>
      </el-table-column>

      <!-- 실제 종료 -->
      <el-table-column label="실제 종료" min-width="160" align="center">
        <template #default="scope">
          {{ toKST(scope.row.actualEndAt) }}
        </template>
      </el-table-column>

      <!-- 실사용 시간 -->
      <el-table-column
        prop="actualMinutes"
        label="실사용 시간(분)"
        min-width="150"
        align="center"
      />

      <!-- 사용률 -->
      <el-table-column label="사용률(%)" min-width="120" align="center">
        <template #default="scope">
          {{ Math.round(scope.row.usageRatio * 100) }}%
        </template>
      </el-table-column>

      <!-- 상세 버튼 -->
      <el-table-column label="상세" width="100" align="center">
        <template #default="scope">
          <el-button type="primary" link @click.stop="openDetail(scope.row.usageHistoryId)">
            조회
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 📌 Pagination -->
    <div class="pagination">
      <el-pagination
        layout="prev, pager, next"
        :total="pageInfo.totalPages * pageInfo.size"
        :page-size="pageInfo.size"
        :current-page="pageInfo.page + 1"
        @current-change="changePage"
      />
    </div>

    <!-- 📌 상세 모달 (테이블 내부에서 처리) -->
    <div v-if="showDetail" class="modal-backdrop" @click="closeDetail"></div>

    <div v-if="showDetail" class="detail-modal">
      <div class="modal-header">
        <span>상세 정보</span>
        <button class="close-btn" @click="closeDetail">✕</button>
      </div>

      <div class="modal-body">
        <div class="modal-image">
          <img
            v-if="detailData.assetImage"
            :src="detailData.assetImage"
            alt="자원 이미지"
          />
          <div v-else class="no-image">이미지 없음</div>
        </div>

        <div class="modal-info">
          <p><strong>자원명:</strong> {{ detailData.assetName }}</p>

          <p><strong>예약자:</strong>
            <span v-if="detailData.reserverNames?.length">
              {{ detailData.reserverNames.join(", ") }}
            </span>
            <span v-else>없음</span>
          </p>

          <p><strong>청구금액:</strong> {{ detailData.billAmount }}</p>
          <p><strong>실제 청구금액:</strong> {{ detailData.actualBillAmount }}</p>
        </div>
      </div>
    </div>

  </div>
</template>


<script setup>
import { ref } from "vue"
import api from "@/api/axios"

const props = defineProps({
  rows: Array,
  pageInfo: Object,
})
const emit = defineEmits(["changePage"])

/* 조회 모달 상태 */
const showDetail = ref(false)
const detailData = ref({})

async function openDetail(id) {
  try {
    const { data } = await api.get(`/accounting/usage-history/${id}`)
    detailData.value = data
    showDetail.value = true
  } catch (err) {
    console.error("상세 조회 실패:", err)
  }
}

function closeDetail() {
  showDetail.value = false
}

function toKST(date) {
  if (!date) return "-"
  const d = new Date(date)
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().replace("T", " ").slice(0, 16)
}

function changePage(newPage) {
  emit("changePage", newPage - 1)
}
</script>


<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* --- 여기 아래는 기존 모달 CSS 그대로 유지 --- */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.35);
  z-index: 998;
}

.detail-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 700px;
  background: white;
  border-radius: 12px;
  padding: 32px;
  z-index: 999;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  font-size: 18px;
  margin-bottom: 15px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  display: flex;
  gap: 40px;
}

.modal-image {
  width: 260px;
  height: 200px;
  background: #eee;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-image {
  color: #777;
  font-size: 13px;
}

.modal-info p {
  margin: 20px 0;
}

:deep(.el-table__header-wrapper th) {
  background-color: #D9E9CF !important;
  color: #525B63 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  text-align: center !important;
}

:deep(.el-table__header th .cell) {
  font-weight: 500 !important;   /* 확실하게 굵게 */
  color: #333 !important;
  font-size: 15px !important;
}


</style>
