<template>
  <el-table
    :data="rows"
    border
    style="width: 100%"
    highlight-current-row
    @row-click="onRowClick"
  >
    <!-- 체크박스 -->
    <el-table-column type="selection" min-width="48" />

    <!-- 자원명 -->
    <el-table-column prop="assetName" label="자원명" min-width="230" align="center" />

    <!-- 신청자 -->
    <el-table-column prop="applicantName" label="신청자" min-width="120" align="center" />

    <!-- 승인자 -->
    <el-table-column prop="respondentName" label="승인자" min-width="220" align="center" />

    <!-- 예약 가능 여부 -->
    <el-table-column prop="isReservable" label="예약 가능 여부" min-width="150" align="center">
      <template #default="scope">
        {{ scope.row.reservable ? "가능" : "불가능" }}
      </template>
    </el-table-column>

    <!-- 승인/거절 버튼 -->
    <el-table-column label="승인 / 거절" min-width="250" align="center">
      <template #default="scope">
        <el-button type="success" size="small" @click.stop="emit('approve', scope.row)">
          승인
        </el-button>

        <el-button type="danger" size="small" @click.stop="emit('reject', scope.row)" style="margin-left: 6px">
          거절
        </el-button>
      </template>
    </el-table-column>

    <!-- 예약 결과 -->
    <el-table-column label="예약 결과" min-width="180" align="center">
      <template #default="scope">
        <el-tag v-if="scope.row.isApproved === 'APPROVED'" type="success">승인</el-tag>
        <el-tag v-else-if="scope.row.isApproved === 'REJECTED'" type="danger">거절</el-tag>
        <span v-else>-</span>
      </template>
    </el-table-column>

    <!-- 사유 -->
    <el-table-column label="사유" min-width="150" align="center">
      <template #default="scope">
        {{ scope.row.reason || "-" }}
      </template>
    </el-table-column>


  </el-table>

  <!-- Pagination -->
  <div class="pagination">
    <el-pagination
      layout="prev, pager, next"
      :total="total"
      :page-size="pageSize"
      :current-page="page"
      @current-change="changePage"
    />
  </div>
</template>

<script setup>

import { reservationApi } from "@/api/reservationApi"
import { ref, watch } from "vue" 
const props = defineProps({
  rows: { type: Array, required: true },
  total: { type: Number, required: true },
  filters: { 
    type: Object, 
    default: () => ({
      date: "",
      assetType: "",
      assetStatus: "",
      categoryName: "",
      layerZero: "",
      layerOne: "",
      assetName: ""    // ✅ 여기 추가
    }) 
  }
})
const localRows = ref([...props.rows])

const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const emit = defineEmits(["page-change", "approve", "reject", "open-detail"])

const onRowClick = (row, column) => {
  if (column?.type === "selection") return
  if (!row?.reservationId) return
  emit("open-detail", row.reservationId)
}
const fetchReservations = async () => {
  try {
    const params = {
      page: page.value - 1,
      size: pageSize.value,
      date: props.filters.date,
      assetType: props.filters.assetType || undefined,
      assetStatus: props.filters.assetStatus || undefined,
      categoryName: props.filters.categoryName || undefined,
      layerZero: props.filters.layerZero || undefined,
      layerOne: props.filters.layerOne || undefined,
      assetName: props.filters.assetName || undefined
    }

    const res = await reservationApi.getAppliedReservations(params)

    rows.value = res?.data?.content ?? []
    total.value = res?.data?.totalElements ?? 0
  } catch (err) {
    console.error("예약 조회 실패:", err)
  }
}
watch(
  () => props.filters,
  () => {
    page.value = 1
    fetchReservations()
  },
  { deep: true, immediate: true }
)

watch(() => props.rows, (val) => {
  localRows.value = [...val]
}, { deep: true, immediate: true })

// 모달에서 입력한 임시 사유 업데이트

</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>