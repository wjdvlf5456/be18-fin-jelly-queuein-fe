<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { setToastInstance } from '@/utils/toast'

const toast = useToast()

onMounted(() => {
  // 전역 Toast 인스턴스 설정
  setToastInstance(toast)
})
</script>

<template>
  <RouterView />
  <Toast />
</template>

<style>
/* 전역 스타일이 필요하다면 여기에 */
</style>
