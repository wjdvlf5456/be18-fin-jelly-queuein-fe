<template>
  <div class="table-wrapper">
    <DataTable
      :value="props.rows"
      stripedRows
      showGridlines
      class="reservable-assets-datatable"
      :emptyMessage="'데이터가 없습니다.'"
      @row-click="(e) => goToDetail(e.data)"
      :pt="{
        root: { class: 'custom-datatable' },
        header: { class: 'custom-header' },
        thead: { class: 'custom-thead' },
        tbody: { class: 'custom-tbody' },
      }"
    >
      <!-- 자원명 -->
      <Column
        field="assetName"
        header="자원명"
        :style="{ minWidth: '240px', whiteSpace: 'nowrap' }"
        :headerStyle="{ textAlign: 'center' }"
        :bodyStyle="{ textAlign: 'center' }"
      />

      <!-- 자원 유형 -->
      <Column
        field="assetType"
        header="자원 유형"
        :style="{ minWidth: '120px', whiteSpace: 'nowrap' }"
        :headerStyle="{ textAlign: 'center' }"
        :bodyStyle="{ textAlign: 'center' }"
      >
        <template #body="{ data }">
          {{ data.assetType === 'STATIC' || data.assetType === 'static' ? '정적' : '동적' }}
        </template>
      </Column>

      <!-- 카테고리 -->
      <Column
        field="categoryName"
        header="카테고리"
        :style="{ minWidth: '140px', whiteSpace: 'nowrap' }"
        :headerStyle="{ textAlign: 'center' }"
        :bodyStyle="{ textAlign: 'center' }"
      />

      <!-- 예약 가능 여부 -->
      <Column
        field="reservable"
        header="예약 가능 여부"
        :style="{ minWidth: '140px', whiteSpace: 'nowrap' }"
        :headerStyle="{ textAlign: 'center' }"
        :bodyStyle="{ textAlign: 'center' }"
      >
        <template #body="{ data }">
          <StatusTag :status="data.reservable ? 'AVAILABLE' : 'UNAVAILABLE'" />
        </template>
      </Column>

      <!-- 승인 필요 -->
      <Column
        field="needsApproval"
        header="승인 필요"
        :style="{ minWidth: '120px', whiteSpace: 'nowrap' }"
        :headerStyle="{ textAlign: 'center' }"
        :bodyStyle="{ textAlign: 'center' }"
      >
        <template #body="{ data }">
          {{ data.needsApproval ? '예' : '아니오' }}
        </template>
      </Column>

      <!-- 예약하기 -->
      <Column
        header="예약하기"
        :style="{ minWidth: '120px', whiteSpace: 'nowrap' }"
        :headerStyle="{ textAlign: 'center' }"
        :bodyStyle="{ textAlign: 'center' }"
        :exportable="false"
      >
        <template #body="{ data }">
          <Button
            label="예약"
            class="reserve-btn"
            @click.stop="goToDetail(data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>

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
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

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
.table-wrapper {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}
</style>

<style>
/* PrimeVue DataTable full width */
.reservable-assets-datatable.p-datatable {
  width: 100%;
}

/* Prevent text wrapping */
.reservable-assets-datatable.p-datatable td,
.reservable-assets-datatable.p-datatable th {
  white-space: nowrap;
}

/* Let columns auto-size */
.reservable-assets-datatable.p-datatable table {
  table-layout: auto;
  width: 100%;
}

/* Reduce excessive padding */
.reservable-assets-datatable.p-datatable .p-datatable-tbody > tr > td {
  padding: 0.75rem 1rem;
}

.reservable-assets-datatable.p-datatable .p-datatable-thead > tr > th {
  padding: 0.75rem 1rem;
}

/* Table styling */
.reservable-assets-datatable.p-datatable {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.reservable-assets-datatable.p-datatable .p-datatable-thead > tr > th {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  color: #374151;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 2px solid #e5e7eb;
}

.reservable-assets-datatable.p-datatable .p-datatable-tbody > tr > td {
  border-bottom: 1px solid #f3f4f6;
}

.reservable-assets-datatable.p-datatable .p-datatable-tbody > tr:hover {
  background: #f9fafb;
}

.reservable-assets-datatable.p-datatable .p-datatable-tbody > tr {
  transition: background 0.2s ease;
  cursor: pointer;
}

/* Reserve button styling */
.reservable-assets-datatable .reserve-btn {
  border: none;
  background: linear-gradient(135deg, #00a950 0%, #10b981 100%) !important;
  color: white !important;
  border-radius: 8px;
  padding: 0.5rem 1.25rem;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 169, 80, 0.2);
}

.reservable-assets-datatable .reserve-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 169, 80, 0.3) !important;
  background: linear-gradient(135deg, #10b981 0%, #00a950 100%) !important;
}

.reservable-assets-datatable .reserve-btn:active {
  transform: translateY(0);
}
</style>
