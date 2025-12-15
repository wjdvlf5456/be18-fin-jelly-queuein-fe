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
              {{ formatKoreaTime(asset?.actualStartAt) }} ~ {{ formatKoreaTime(asset?.actualEndAt) }}
            </template>
            <template v-else>-</template>
          </div>
        </div>

        <div class="row">
          <div class="label green">승인 / 거절 사유</div>
          <div class="value">
            <Textarea 
              v-model="editedReason"
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

      <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 8px;">
        <Button label="승인" severity="success" @click="approve" />
        <Button label="거절" severity="danger" @click="reject" />
      </div>
  </Dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue"
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
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

const emit = defineEmits(["close", "approve", "reject", "update:visible"])
const close = () => {
  emit("update:visible", false)
  emit("close")
}

const approve = () => {
  emit("approve", { reservationId: props.asset.id, ...props.asset, reason: editedReason.value})
  close()
}

const reject = () => {
  emit("reject", { reservationId: props.asset.id, ...props.asset,reason: editedReason.value})
  close()
}


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
  console.log("emit reason:", editedReason.value, "reservationId:", props.asset?.id)
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
.reason-textarea {
  width: 100%;
  border: none !important;
  background: #fafafa !important;
  resize: none;
}

</style>