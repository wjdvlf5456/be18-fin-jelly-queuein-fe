<script setup lang="ts">
const props = defineProps({
  show: { type: Boolean, default: false },
  width: { type: String, default: '360px' }
})

const emit = defineEmits(['close'])
</script>

<template>
  <div v-if="show" class="overlay" @click.self="emit('close')">
    <div class="modal" :style="{ width }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(2px);
  z-index: 9999;
}

.modal {
  background: white;
  padding: 28px 32px;
  border-radius: 12px;
}
</style>
