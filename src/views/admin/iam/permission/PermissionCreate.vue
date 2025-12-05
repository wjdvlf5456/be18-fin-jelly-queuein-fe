<script setup>
import { ref } from 'vue'
import { permissionApi } from '@/api/iam/permissionApi'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useRouter } from 'vue-router'

const router = useRouter()

const name = ref('')
const description = ref('')

async function submit() {
  await permissionApi.createPermission({
    permissionName: name.value,
    permissionDescription: description.value
  })

  alert("생성 완료")
  router.push('/admin/permissions/list')
}
</script>

<template>
  <div class="page">
    <h2>권한 생성</h2>

    <div class="form">
      <label>권한명</label>
      <InputText v-model="name" />

      <label>설명</label>
      <InputText v-model="description" />

      <Button label="생성" @click="submit" />
    </div>
  </div>
</template>

<style scoped>
.page { padding: 20px; }
.form { display: flex; flex-direction: column; gap: 14px; width: 300px; }
</style>
