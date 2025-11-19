<script setup lang="ts">
const props = defineProps({
  modelValue: String,
  placeholder: String
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <input
    class="input"
    :value="modelValue"
    :placeholder="placeholder"
    @input="emit('update:modelValue',$event.target.value)"
  />
</template>

<style scoped>
.input {
  border: 1px solid #ccc;
  padding: 10px 12px;
  font-size: 14px;
  border-radius: 6px;
  width: 100%;
}
</style>
