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
              {{ formatKoreaTime(asset?.actualStartAt) }} ~ {{ formatKoreaTime(asset?.actualEndAt) }}
            </template>
            <template v-else>-</template>
          </div>
        </div>

        <div class="row">
          <div class="label green">승인 / 거절 사유</div>
          <div class="value">
            <el-input 
              v-model="editedReason"
              type="textarea"
              rows="3"
              placeholder="사유를 입력하세요"
              class="reason-textarea"
            />
          </div>

          <div class="label green">비고</div>
          <div class="value">
            {{ asset?.description ?? "-" }}
          </div>
        </div>

      </div>

      <div style="margin-top: 20px; text-align: right;">
        <el-button @click="close">닫기</el-button>
        <el-button type="primary" @click="saveReason">저장</el-button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue"
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



const props = defineProps({
  visible: Boolean,
  asset: Object
})

const emit = defineEmits(["close", "save-reason"])

const close = () => emit("close")

/* -------------------------------------------
  사유(reason) 수정 상태
------------------------------------------- */
const editedReason = ref("")

watch( //모달 열릴 때
  () => props.asset, //props.asset의 기존 값 가져옴
  (val) => {
    editedReason.value = val?.reason ?? ""
  },
  { immediate: true }
)

const saveReason = () => { //저장 버튼 눌렀을 때 id, reason emit -> 부모 컴포넌트에서 받는 용도
  emit("save-reason", {
    reservationId: props.asset?.id,
    reason: editedReason.value
  })

  close()
}


/* -------------------------------------------
  참여자 이름 표시
  attendants → attendantName 사용
------------------------------------------- */
const participantsText = computed(() => {
  const list = props.asset?.participants
  if (!list || list.length === 0) return "-"

  return list
    .map(a => a.attendantName)
    .join(", ")
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.modal {
  width: 800px;
  background: #fff;
  border-radius: 6px;
  padding: 30px 40px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
/* 텍스트 영역 테두리 제거 + 배경만 유지 */
.reason-textarea ::v-deep(.el-textarea__inner) {
  border: none !important;
  box-shadow: none !important;
  background: #fafafa !important;
  resize: none; /* 원하면 제거 가능 */
  padding: 10px 12px;
  min-height: 80px;
}

.reason-textarea ::v-deep(.el-textarea__inner) {
  color: #333 !important; /* 글자가 보이도록 */
}

</style>