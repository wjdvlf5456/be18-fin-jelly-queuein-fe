<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { hasRole } from '@/utils/role'

const visible = ref(true)
const router = useRouter()

const goHome = () => {
  // 역할에 따라 적절한 페이지로 리다이렉트
  if (hasRole('ADMIN')) {
    router.push('/admin')
  } else {
    router.push('/app')
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :closable="false"
    header="403 Forbidden"
    style="width: 420px;"
  >
    <div class="text-center">
      <i class="pi pi-ban text-red-500" style="font-size: 2.5rem;"></i>

      <h2 class="mt-3 mb-2 text-lg font-semibold">
        접근 권한이 없습니다
      </h2>

      <p class="mb-4 text-gray-600">
        이 기능에는 접근할 수 없습니다.
      </p>

      <Button
        label="돌아가기"
        severity="danger"
        class="w-full"
        @click="goHome"
      />
    </div>
  </Dialog>
</template>
