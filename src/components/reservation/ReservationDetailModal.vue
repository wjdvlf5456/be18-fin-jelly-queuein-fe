<template>
  <Dialog
    :visible="visible && asset"
    modal
    header="예약 상세 조회"
    :style="{ width: '800px', maxWidth: '90vw' }"
    @update:visible="close"
  >

      <!-- 상세 테이블 -->
      <div class="detail-table">

        <div class="row">
          <div class="label green">자원 명</div>
          <div class="value">{{ asset?.name ?? "-" }}</div>

          <div class="label green">예약 상태</div>
          <div class="value">{{ asset?.status ?? "-" }}</div>
        </div>

        <div class="row">
          <div class="label green">예약자</div>
          <div class="value">{{ asset?.reserver ?? "-" }}</div>

          <div class="label green">예약 날짜</div>
          <div class="value">{{ asset?.date ?? "-" }}</div>
        </div>

        <div class="row">
          <div class="label green">승인자</div>
          <div class="value">{{ asset?.approver ?? "-" }}</div>

          <div class="label green">사용 시간</div>
          <div class="value">
            {{ formatKoreaTime(asset?.startAt) }} ~ {{ formatKoreaTime(asset?.endAt) }}
          </div>
        </div>

        <div class="row">
          <div class="label green">참여자</div>
          <div class="value">{{ participantsText }}</div>

          <div class="label green">실제 사용 시간</div>
          <div class="value">
            <template v-if="asset?.actualStartAt">
              {{ formatKoreaTime(asset.actualStartAt) }} ~ {{ formatKoreaTime(asset.actualEndAt) }}
            </template>
            <template v-else>-</template>
          </div>
        </div>

        <div class="row">
          <div class="label green">승인 / 거절 사유</div>
          <div class="value">{{ asset?.reason ?? "-" }}</div>

          <div class="label green">비고</div>
          <div class="value">{{ asset?.note ?? "-" }}</div>
        </div>

      </div>



      <!-- 하단 버튼 -->
      <div class="footer" v-if="actionLabel">
        <Button
          :label="actionLabel"
          :disabled="isActionDisabled"
          @click="onActionClick"
        />
      </div>

      <!-- 예약 취소 확인 모달 -->
      <ConfirmModal
        v-if="showCancelConfirm"
        title="예약 취소"
        message="정말 예약을 취소하시겠습니까?"
        @confirm="onCancelConfirm"
        @cancel="showCancelConfirm = false"
      />
  </Dialog>
</template>

<script setup>
import { computed, ref } from "vue"
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const props = defineProps({
  visible: Boolean,
  asset: Object
})
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

const formatKoreaTime = (instant) => {
  if (!instant) return "-";

  const str = String(instant);

  // 1) ISO 8601 UTC 값일 때 (예: 2025-12-02T15:00:00Z)
  if (str.includes("T")) {
    const utcTime = dayjs.utc(str); // UTC로 파싱
    const kstTime = utcTime.tz("Asia/Seoul");
    return kstTime.format("HH:mm");
  }

  // 2) 공백 포함 KST 문자열 (예: 2025-12-03 09:00:00)
  if (str.includes(" ")) {
    const t = str.split(" ")[1]; // 09:00:00
    return t ? t.slice(0, 5) : "-";
  }

  // 3) 이미 HH:mm 또는 HH:mm:ss
  if (/^\d{2}:\d{2}/.test(str)) {
    return str.slice(0, 5);
  }

  return "-";
};

const emit = defineEmits(["close", "start", "end", "cancel", "edit"])

const close = () => emit("close")

const onEdit = () => {
  if (!props.asset) return;
  emit("edit", props.asset.id)   // 부모 컴포넌트에서 수정 처리
}
/* -------------------------------------------
   참여자 출력
------------------------------------------- */
const participantsText = computed(() => {
  const list = props.asset?.participants
  if (!list || list.length === 0) return "-"

  return list
    .map(a => a.attendantName)
    .join(", ")
})
/* -------------------------------------------
   버튼 라벨
------------------------------------------- */
const normalizedUsage = computed(() =>
  (props.asset?.status ?? "").trim().toUpperCase()
)

const actionLabel = computed(() => {
  switch (normalizedUsage.value) {
    case "PENDING":
      return "예약 취소"
    case "APPROVED":
      return "사용 시작"
    case "USING":
      return "사용 종료"
    case "COMPLETED":   // 서버 두 경우 모두 대응
      return "사용 종료됨"
    // case "COMPLETED":
    //   return "취소 불가"
    case "REJECTED":
      return "거절됨"
    case "UNAVAILABLE":
      return "사용불가"
    case "CANCELED":
      return "취소됨"


    default:
      return null
  }
})

const isActionDisabled = computed(() =>
  ["COMPLETED", "CANCELED", "REJECTED"].includes(normalizedUsage.value)
)

// 예약 취소 확인 모달
const showCancelConfirm = ref(false)

/* -------------------------------------------
   버튼 클릭 처리
------------------------------------------- */
const onActionClick = () => {
  const usage = normalizedUsage.value

  // PENDING 상태일 때는 확인 모달 표시
  if (usage === "PENDING") {
    showCancelConfirm.value = true
    return
  }

  // 다른 액션은 바로 실행
  onAction()
}

/* -------------------------------------------
   예약 취소 확인 처리
------------------------------------------- */
const onCancelConfirm = () => {
  showCancelConfirm.value = false
  emit("cancel", props.asset.id)
  emit("close")
}

/* -------------------------------------------
   서버 요청 이벤트 + 모달 닫힘
------------------------------------------- */
const onAction = () => {
  const usage = normalizedUsage.value

  if (usage === "APPROVED") emit("start", props.asset.id)
  if (usage === "USING" || usage === "IN_USE") emit("end", props.asset.id)

  // 버튼 클릭 후 모달 자동 닫힘
  emit("close")
}
</script>

<style scoped>

.detail-table {
  width: 100%;
}

.row {
  display: grid;
  grid-template-columns: 180px 1fr 180px 1fr;
  border-bottom: 1px solid #eaeaea;
}

.label {
  padding: 14px;
  font-weight: 600;
  color: white;
}

.green {
  background: #7ba678;
}

.value {
  padding: 14px;
  background: #fafafa;
}

.footer {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.footer {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}



</style>
