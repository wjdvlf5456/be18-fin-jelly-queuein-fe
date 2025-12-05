<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const visible = ref(true)
const router = useRouter()

const goHome = () => {
  router.push('/admin')
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
