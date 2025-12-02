<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-box">
      <h3 class="modal-title">부모 자원 이름</h3>

      <!-- 입력창 -->
      <input
        v-model="parentName"
        type="text"
        class="modal-input"
        placeholder="새 부모 자원 이름을 입력하세요"
      />

      <!-- 버튼 -->
      <div class="modal-actions">
        <button class="confirm-btn" @click="confirm">확인</button>
        <button class="cancel-btn" @click="close">취소</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  onConfirm: { type: Function, required: true },
  onClose: { type: Function, required: true },
})

const parentName = ref('')

// 확인 버튼
function confirm() {
  if (!parentName.value.trim()) {
    alert('부모 자원 이름을 입력하세요.')
    return
  }
  props.onConfirm(parentName.value)
}

// 닫기 버튼
function close() {
  props.onClose()
}
</script>

<style scoped>
/* 배경 흐림 */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

/* 모달 박스 */
.modal-box {
  background: white;
  width: 320px;
  padding: 22px;
  border-radius: 8px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

/* 제목 */
.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 14px;
}

/* 입력창 */
.modal-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  margin-bottom: 18px;
  font-size: 14px;
}

/* 버튼 영역 */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 확인 버튼 */
.confirm-btn {
  padding: 8px 14px;
  background: #c7dbcc;
  border: 1px solid #aec5b5;
  border-radius: 6px;
  cursor: pointer;
}

/* 취소 버튼 */
.cancel-btn {
  padding: 8px 14px;
  background: #eee;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
}
</style>
