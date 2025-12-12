<template>
  <div 
    class="modal-overlay" 
    v-if="asset && visible"
    @click.self="close"
  >
    <div class="modal">

      <!-- 제목 + 닫기 -->
      <div class="header">
        <h2>예약 상세 조회</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>

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
      <div class="footer" v-if="actionLabel"   :class="{ 'has-edit': normalizedUsage === 'PENDING' || normalizedUsage === 'APPROVED' }">

        <!-- 수정 버튼: PENDING 또는 APPROVED 상태일 때만 -->
        <!-- <button 
          v-if="normalizedUsage === 'PENDING' || normalizedUsage === 'APPROVED'"
          class="footer-btn"
          @click="onEdit" 
        > 수정 
          
        </button> -->
        <button 
          class="footer-btn"
          :disabled="isActionDisabled"
          @click="onAction"
        >
          {{ actionLabel }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"

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
      return "취소"
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

/* -------------------------------------------
   버튼 클릭 → 서버 요청 이벤트 + 모달 닫힘
------------------------------------------- */
const onAction = () => {
  const usage = normalizedUsage.value

  if (usage === "APPROVED") emit("start", props.asset.id)
  if (usage === "USING" || usage === "IN_USE") emit("end", props.asset.id)
  if (usage === "PENDING") emit("cancel", props.asset.id)

  // 버튼 클릭 후 모달 자동 닫힘
  emit("close")
}
</script>

<style scoped>
/* 그대로 유지 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal {
  width: 800px;
  max-width: 90vw;
  background: #fff;
  border-radius: 12px;
  padding: 32px 40px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
}

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

.footer-btn {
  padding: 10px 28px;
  border-radius: 6px;
  background: #ffffff;
  border: 1.5px solid #d0d0d0;
  cursor: pointer;
  transition: 0.2s;
}

.footer-btn:hover {
  background: #f3f3f3;
}

.footer-btn:disabled {
  cursor: not-allowed;
  background: #eaeaea;
}
.footer {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}



</style>
