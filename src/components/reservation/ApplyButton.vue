<template>
  <div class="apply-wrapper">
    <button class="apply-btn" @click="handleClick">
      <slot>신청하기</slot>
    </button>
  </div>
</template>

<script setup>
const emit = defineEmits(['click'])

const handleClick = (event) => {
  event.stopPropagation()
  emit('click', event)
}
</script>

<style scoped>
.apply-wrapper {
  margin-top: 40px;
  display: flex;
  justify-content: center;   /* 중앙 정렬 */
  padding-left: 0;          /* 기존 좌측 밀림 제거 */
}
.apply-btn {
  background: #ffffff;
  border: 1.5px solid #dcdcdc;
  padding: 10px 30px;
  border-radius: 8px;
  font-size: 16px;
  color: #444;
  cursor: pointer;
  transition: all 0.2s ease;
}

.apply-btn:hover {
  background: #f6f6f6;
}

.apply-btn:active {
  background: #eeeeee;
}
</style>
