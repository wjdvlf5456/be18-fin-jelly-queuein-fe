<!-- file: src/components/common/ConfirmModal.vue -->
<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-box">
      <h3 class="modal-title">{{ title }}</h3>
      <p class="modal-message">{{ message }}</p>

      <div class="modal-actions">
        <button class="cancel-btn" @click="close">취소</button>
        <button class="confirm-btn" @click="confirm">확인</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '확인' },
  message: { type: String, default: '계속 진행하시겠습니까?' },
})

const emit = defineEmits(['confirm', 'cancel'])

function confirm() {
  emit('confirm')
}

function close() {
  emit('cancel')
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-box {
  width: 360px;
  max-width: 90vw;
  background: white;
  padding: 32px 40px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
}

.modal-message {
  margin-top: 12px;
  font-size: 15px;
  color: #555;
}

.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  padding: 10px 20px;
  background: #f3f4f6;
  color: #4b5563;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  outline: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.confirm-btn {
  padding: 10px 20px;
  background: #7ba678;
  color: white;
  border-radius: 8px;
  border: none;
  outline: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.confirm-btn:hover {
  background: #6a9568;
  opacity: 0.9;
}
</style>
