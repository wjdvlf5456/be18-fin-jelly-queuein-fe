<template>
  <el-table
    :data="props.rows"
    border
    style="width: 100%"
    @row-click="goToDetail"
    highlight-current-row
  >
    <el-table-column type="selection" width="48" />

    <el-table-column prop="assetName" label="자원명" min-width="350" align="center" />

    <!-- assetType -->
    <el-table-column prop="assetType" label="자원 유형" width="120" align="center">
      <template #default="scope">
        {{ scope.row.assetType === 'STATIC' || scope.row.assetType === 'static' ? '정적' : '동적' }}
      </template>
    </el-table-column>

    <!-- categoryName -->
    <el-table-column prop="categoryName" label="카테고리" width="180" align="center" />

    <!-- reservable (문구로 표시) -->
    <el-table-column prop="reservable" label="예약 가능 여부" width="140" align="center">
      <template #default="scope">
        <StatusTag :status="scope.row.reservable ? 'AVAILABLE' : 'UNAVAILABLE'" />
      </template>
    </el-table-column>

    <!-- needsApproval -->
    <el-table-column prop="needsApproval" label="승인 필요" width="110" align="center">
      <template #default="scope">
        {{ scope.row.needsApproval ? '예' : '아니오' }}
      </template>
    </el-table-column>

    <el-table-column label="예약하기" width="100" align="center">
      <template #default="scope">
        <el-button
          type="primary"
          class="reserve-btn"
          size="small"
          @click.stop="goToDetail(scope.row, {})"
        >
          예약
        </el-button>
      </template>
    </el-table-column>
  </el-table>

  <div class="pagination">
    <el-pagination
      layout="prev, pager, next"
      :total="total"
      @current-change="(page) => emit('page-change', page - 1)"
    />
  </div>
</template>

<script setup>
import StatusTag from './ReservationStatus.vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
})
// 부모가 받을 이벤트 선언
const emit = defineEmits(['page-change'])

const router = useRouter()
const goToDetail = (row) => {
  const targetPath = row.needsApproval
    ? '/app/reservations/apply' // 선착순
    : '/app/reservations/create-reservation' //신청
  router.push({
    path: targetPath,
    query: {
      assetId: row.assetId,
      assetName: row.assetName,
      date: typeof props.date === 'string' ? props.date : props.date.toISOString().slice(0, 10),
    },
  })
}
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

/* 테이블 스타일 개선 */
:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.el-table__header) {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

:deep(.el-table th) {
  background: transparent;
  color: #374151;
  font-weight: 600;
  font-size: 14px;
  padding: 16px;
  border-bottom: 2px solid #e5e7eb;
}

:deep(.el-table td) {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

:deep(.el-table__row:hover) {
  background: #f9fafb;
}

:deep(.el-table__row) {
  transition: background 0.2s ease;
}

.reserve-btn {
  border: none;
  background: linear-gradient(135deg, #00a950 0%, #10b981 100%) !important;
  color: white !important;
  border-radius: 8px;
  padding: 8px 20px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 169, 80, 0.2);
}

.reserve-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 169, 80, 0.3) !important;
  background: linear-gradient(135deg, #10b981 0%, #00a950 100%) !important;
}

.reserve-btn:active {
  transform: translateY(0);
}

.reserve-btn:hover,
.reserve-btn:focus,
.el-button.reserve-btn:hover,
.el-button.reserve-btn:focus {
  border: none !important;
  background: linear-gradient(135deg, #10b981 0%, #00a950 100%) !important;
  color: white !important;
}
</style>
