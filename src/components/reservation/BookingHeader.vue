<template>

  <div class="reservation-header">

    <!-- 제목 -->
    <h2 class="title">{{ assetName }}</h2>

    <!-- 상단 속성 라인 -->
    <div class="info-row">
      <div class="info-label">자원 명</div>
      <div class="info-value">{{ assetName }}</div>

      <div class="info-label">예약 날짜</div>
      <div class="info-value date-picker-wrapper">
        <Calendar
          v-model="internalDate"
          dateFormat="yy-mm-dd"
          :showIcon="true"
          inputId="reservation-date"
          @date-select="onDateChange"
        />
      </div>

      <div class="info-label">예약자</div>
      <div class="info-value">{{ reserver }}</div>

      <div class="info-label">예약시간</div>
      <div class="info-value">{{ timeRange }}</div>
    </div>

    <div class="divider"></div>

    <!-- 참여자 -->
    <div class="line-row">
      <div class="line-label">참여자</div>
      <div class="line-content">
        <Button
          icon="pi pi-plus"
          rounded
          severity="success"
          @click="onAdd"
        />
        <span 
          v-for="user in participants" 
          :key="user.userId || user.id"
          class="tag"
          @click="onRemove(user)"
        >
          {{ user.name }}
        </span>




      </div>
    </div>

    <!-- 비고 -->
    <div class="line-row">
      <div class="line-label">비고</div>
      <div class="line-content">
        <Textarea
          v-model="internalNote"
          placeholder="비고를 입력하세요"
          rows="2"
          style="max-width: 400px;"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue"
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'

// const props = defineProps({
//   assetName: String,
//   date: String,
//   reserver: String,
//   timeRange: String,
//   participants: Array,
//   note: {
//   type: String,
//   default: ""
// }
// });

const props = defineProps({
  assetName: String,
  date: String,
  reserver: String,
  timeRange: String,
  participants: {
    type: Array,
    default: () => []
  },
  note: String
})



const emit = defineEmits(["add", "update:date", "update:note", "remove"]);

const internalDate = ref(props.date ? new Date(props.date) : null);

// props.date → 내부 동기화
watch(() => props.date, v => {
  if (v) {
    internalDate.value = new Date(v)
  } else {
    internalDate.value = null
  }
});

// 날짜 선택 시 부모로 전달
const onDateChange = (event) => {
  const date = event.value || internalDate.value
  if (date instanceof Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const str = `${year}-${month}-${day}`
    emit("update:date", str)
  } else if (typeof date === "string") {
    emit("update:date", date)
  }
}
const onRemove = (user) => {
  emit("remove", user);
};

const internalNote = computed({
  get: () => props.note,
  set: (val) => emit("update:note", val)
});

// 참여자 추가
const onAdd = () => emit("add");
</script>



<style scoped>
.reservation-header {
  width: 100%;
  margin-bottom: 20px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 14px;
}

/* 상단 정보줄 */
.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.info-label {
  background: #c7dbbf;
  padding: 8px 14px;
  border-radius: 6px;
  font-weight: 600;
  min-width: 90px;
  text-align: center;
}

.info-value {
  font-size: 15px;
  color: #555;
  margin-right: 18px;
  min-width: 80px;
}

/* 행 단위 영역 (참여자/비고) */
.line-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 4px solid #eaeaea;
}

.line-label {
  width: 90px;
  background: #c7dbbf;
  padding: 10px 0;
  font-weight: 600;
  text-align: center;
  border-radius: 4px;
  margin-right: 12px;
}

.line-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tag {
  display: inline-flex;        /* 기존 block → inline-flex */
  align-items: center;
  background: #aed8ae;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 14px;
  white-space: nowrap;        /* 이름 줄바꿈 방지 */
}


/* "자원명 ~ 참여자" 사이 구분선 */
.divider {
  width: 100%;
  border-bottom: 4px solid #eaeaea;
  margin: 6px 0 16px 0; /* 위쪽/아래쪽 이상적 간격 */
}

.date-picker-wrapper {
  min-width: 200px;
}

.tag {
  color: black !important;
}


</style>
