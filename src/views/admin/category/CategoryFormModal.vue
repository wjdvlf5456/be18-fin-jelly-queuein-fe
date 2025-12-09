<!-- file: src/components/category/CategoryFormModal.vue -->
<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-box">
      <div class="header">
        <h2>{{ title }}</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="form">
        <label>카테고리 명</label>
        <input v-model="form.name" placeholder="category name" class="input" />

        <label>카테고리 설명</label>
        <input v-model="form.description" placeholder="category description" class="input" />
      </div>

      <div class="btn-area">
        <button class="submit" @click="submit">{{ submitText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, default: '카테고리 생성' },
  submitText: { type: String, default: '등록' },
  initialData: { type: Object, default: () => ({}) }, // 수정 시 초기값
})

const emit = defineEmits(['submit', 'close'])

const form = ref({
  name: '',
  description: '',
})

watch(
  () => props.initialData,
  (newVal) => {
    form.value = {
      name: newVal?.name ?? '',
      description: newVal?.description ?? '',
    }
  },
  { immediate: true, deep: true },
)

function close() {
  emit('close')
}

function submit() {
  if (!form.value.name) {
    alert('카테고리 명은 필수입니다.')
    return
  }
  emit('submit', { ...form.value })
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-box {
  background: white;
  width: 500px;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
}

.input {
  padding: 10px 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.btn-area {
  text-align: center;
}

.submit {
  width: 140px;
  padding: 10px 0;
  border-radius: 8px;
  background: #e6f0e6;
  border: 1px solid #b6ceb4;
  cursor: pointer;
}
</style>
