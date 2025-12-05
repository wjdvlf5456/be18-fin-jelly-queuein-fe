<script setup>
import { ref, onMounted } from 'vue'
import { permissionApi } from '@/api/iam/permissionApi'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const id = Number(route.params.permissionId)

const name = ref('')
const description = ref('')

async function load() {
  const res = await permissionApi.getPermission(id)
  name.value = res.data.permissionName
  description.value = res.data.permissionDescription
}

async function submit() {
  await permissionApi.updatePermission(id, {
    permissionName: name.value,
    permissionDescription: description.value
  })
  alert("수정 완료")
  router.push('/admin/permissions/list')
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h2>권한 수정</h2>

    <div class="form">
      <label>권한명</label>
      <InputText v-model="name" />

      <label>설명</label>
      <InputText v-model="description" />

      <Button label="저장" @click="submit" />
    </div>
  </div>
</template>

<style scoped>
.page { padding: 20px; }
.form { display: flex; flex-direction: column; gap: 14px; width: 300px; }
</style>
