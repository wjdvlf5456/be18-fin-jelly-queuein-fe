<script setup>
import { ref, onMounted } from "vue"
import { permissionApi } from "@/api/iam/permissionApi"
import { useRouter } from "vue-router"
import Button from "primevue/button"
import DataTable from "primevue/datatable"
import Column from "primevue/column"
import { ElMessageBox, ElMessage } from "element-plus"
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const auth = useAuthStore()

const isMaster = auth.role === "MASTER"

const permissions = ref([])

async function load() {
  const res = await permissionApi.getPermissionList()
  permissions.value = res.data.permissions
}

async function onDelete(item) {
  try {
    await ElMessageBox.confirm(
      `권한 "${item.permissionName}" 을(를) 삭제하시겠습니까?`,
      "확인",
      { type: "warning" }
    )

    await permissionApi.deletePermission(item.permissionId)

    ElMessage.success("삭제되었습니다.")
    await load()
  } catch (err) {
    if (err !== "cancel") ElMessage.error("삭제 실패")
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h2 class="title">권한 목록</h2>

    <div class="toolbar">
      <Button
        v-if="isMaster"
        label="권한 생성"
        icon="pi pi-plus"
        @click="router.push('/admin/permissions/create')"
      />
      <Button
        label="역할-권한 매핑"
        icon="pi pi-sitemap"
        class="p-button-secondary"
        @click="router.push('/admin/permissions')"
      />
    </div>

    <DataTable :value="permissions" stripedRows>
      <Column header="ID" field="permissionId" style="width:100px" />
      <Column header="권한명" field="permissionName" />
      <Column header="설명" field="permissionDescription" />

      <Column header="관리" style="width:160px">
        <template #body="{ data }">
          <Button
            label="수정"
            size="small"
            icon="pi pi-pencil"
            class="mr-2"
            @click="router.push(`/admin/permissions/${data.permissionId}/edit`)"
          />

          <Button
            v-if="isMaster"
            label="삭제"
            size="small"
            icon="pi pi-trash"
            severity="danger"
            @click="onDelete(data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.page {
  padding: 20px;
}

.title {
  font-size: 20px;
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
</style>
