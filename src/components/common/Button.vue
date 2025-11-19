<script setup lang="ts">
const props = defineProps({
  type: { type: String, default: 'primary' }
})
</script>

<template>
  <button :class="['btn', type]">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  cursor: pointer;
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  transition: 0.2s;
}

/* 기본 스타일 */
.primary {
  background: #243540;
  color: #fff;
}
.primary:hover {
  background: #1b2832;
}

.secondary {
  background: #e5e5e5;
  color: #333;
}
</style>
