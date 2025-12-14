<template>
  <el-tag :type="color" size="small">
    {{ text }}
  </el-tag>
</template>

<script setup>
const props = defineProps({
  status: {
    type: String,
    required: true
  }
})

/**
 * 예약 상태 매핑 테이블
 */
const map = {
  PENDING:   { text: "대기",       color: "warning" },
  USING:     { text: "사용중",     color: "primary" },
  APPROVED:  { text: "승인됨",     color: "info" },
  REJECTED:  { text: "거절됨",     color: "danger" },
  CANCELED:  { text: "취소됨",     color: "info" },
  COMPLETED: { text: "사용완료",   color: "success" },

  /** 여기에 AVAILABLE 추가 */
  AVAILABLE: { text: "예약 가능", color: "success" },
  UNAVAILABLE: { text: "예약 불가", color: "danger" },
  ASSET_AVAILABLE: { text: "이용 가능", color: "success" },
  ASSET_UNAVAILABLE: { text: "이용 불가", color: "danger" }
}

/**
 * 매핑되지 않은 상태도 안전하게 처리
 */
const current = map[props.status] ?? {
  text: props.status ?? "-",
  color: "info",
}

const text = current.text
const color = current.color
</script>
