<template>
  <div class="filter-box">
    <!-- 날짜 범위 선택 -->
    <DatePicker
      v-model="dateRange"
      selectionMode="range"
      showIcon
      iconDisplay="input"
      dateFormat="yy-mm-dd"
      class="dater"
      placeholder="날짜 범위를 선택하세요"
    />

    <!-- 검색창 -->
    <div class="search-container">
      <InputText
        v-model="keyword"
        placeholder="자원명을 입력해주세요"
        class="search-input"
        @keyup.enter="emitSearch"
      />
      <i class="ri-search-line search-icon" @click="emitSearch"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import DatePicker from 'primevue/datepicker'
import InputText from 'primevue/inputtext'

const emit = defineEmits(['search'])

const dateRange = ref(null)
const keyword = ref('')

function formatDate(date) {
  if (!date) return null
  return date.toISOString().split("T")[0]
}

function emitSearch() {
  emit('search', {
    startDate: dateRange.value ? formatDate(dateRange.value[0]) : null,
    endDate: dateRange.value ? formatDate(dateRange.value[1]) : null,
    keyword: keyword.value
  })
}

watch(dateRange, (val) => {
  if (val && val.length === 2) {
    emitSearch()
  }
})


</script>

<style scoped>
.filter-box {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.dater :deep(.p-inputtext) {
  height: 38px;
  font-size: 14px;
}

.search-container {
  position: relative;
  width: 260px;
  margin-left: auto;
}

.search-input {
  width: 100%;
  padding-right: 32px;
  height: 38px;
}

.search-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #666;
  cursor: pointer;
}
</style>
