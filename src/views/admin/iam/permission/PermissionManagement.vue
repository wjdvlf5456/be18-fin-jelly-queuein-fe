<script setup>
import { ref, onMounted, computed } from 'vue'
import { roleApi } from '@/api/iam/roleApi.js'
import { permissionApi } from '@/api/iam/permissionApi.js'

import IamTabs from '@/components/iam/IamTabs.vue'

// PrimeVue Components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

// ------------------------------------------------------------
// 상태 변수
// ------------------------------------------------------------
const roles = ref([])
const permissions = ref([])
const matrix = ref([])

const keyword = ref("")
const saving = ref(false)

// 변경 추적용
const modified = ref(false)

// ------------------------------------------------------------
// 데이터 로딩
// ------------------------------------------------------------
async function loadData() {
  const roleRes = await roleApi.getRoleList()
  const permRes = await permissionApi.getPermissionList()

  console.log("ROLE API RESULT:", roleRes.data)
  console.log("PERMISSION API RESULT:", permRes.data)

  // 응답이 { roles: [...] } 형태일 경우
  roles.value = roleRes.data.roles

  // 응답이 { permissions: [...] } 형태
  permissions.value = permRes.data.permissions

  matrix.value = permissions.value.map(p => ({
    permissionId: p.permissionId,
    name: p.permissionName,
    desc: p.permissionDescription,

    roles: Object.fromEntries(
      roles.value.map(r => [
        r.roleName,
        r.permissions?.some(x => x.permissionId === p.permissionId) || false
      ])
    )
  }))
}

// 역할명
function countAssigned(roleName) {
  return matrix.value.filter(p => p.roles[role.roleName]).length
}




onMounted(loadData)

// ------------------------------------------------------------
// 검색 필터
// ------------------------------------------------------------
const filteredMatrix = computed(() => {
  if (!keyword.value.trim()) return matrix.value
  const key = keyword.value.toLowerCase()
  return matrix.value.filter(p =>
    p.name.toLowerCase().includes(key) ||
    p.desc?.toLowerCase().includes(key)
  )
})

// ------------------------------------------------------------
// 토글 변경 처리
// ------------------------------------------------------------
function toggleRole(row, roleName) {
  row.roles[roleName] = !row.roles[roleName]
  modified.value = true
}

// ------------------------------------------------------------
// 저장하기
// ------------------------------------------------------------
async function saveChanges() {
  saving.value = true

  for (const role of roles.value) {
    const allowedIds = matrix.value
    .filter(p => p.roles[role.name])
    .map(p => p.permissionId)

    await roleApi.replacePermissions(role.roleId, {
      permissionIds: allowedIds
    })
  }

  modified.value = false
  saving.value = false
  alert('변경 사항이 저장되었습니다.')
}
</script>


<template>
  <div class="page">

    <IamTabs />

    <!-- Header -->
    <h2>권한 설정</h2>
    <p class="desc">Manage users, roles, and permissions for your application</p>

    <!-- Summary Cards -->
    <div class="role-summary">
      <Card
        v-for="role in roles"
        :key="role.roleId"
        class="role-summary-card"
      >
        <div class="role-summary-header">
          <span class="role-title">{{ role.roleName }}</span>
          <Tag
            v-if="role.roleName === 'MASTER'"
            value="System"
            severity="secondary"
          />
        </div>

        <div class="role-summary-count">
          {{ countAssigned(role.roleName) }} permissions assigned
        </div>
      </Card>
    </div>

    <!-- Permission Matrix -->
    <div class="matrix-section">

      <!-- Search -->
      <InputText
        v-model="keyword"
        placeholder="Search permissions..."
        class="search"
      />

      <DataTable
        :value="filteredMatrix"
        stripedRows
        class="mt-3 permission-table"
      >
        <!-- Permission Column -->
        <Column header="Permission" field="name" style="width: 260px">
          <template #body="{ data }">
            <div class="perm-name">{{ data.name }}</div>
            <div class="perm-desc">{{ data.desc }}</div>
          </template>
        </Column>

        <!-- Role Columns -->
        <Column
          v-for="role in roles"
          :key="role.roleId"
          :header="role.roleName"
          style="width: 140px; text-align: center"
        >
          <template #body="{ data }">
            <div class="toggle-wrap">
              <ToggleSwitch
                v-model="data.roles[role.roleName]"
                @update:modelValue="toggleRole(data, role.roleName)"
              />
            </div>
          </template>
        </Column>
      </DataTable>

    </div>

    <!-- Save Button -->
    <div class="save-wrap">
      <Button
        label="저장"
        :disabled="!modified"
        :loading="saving"
        @click="saveChanges"
      />
    </div>
  </div>
</template>


<style scoped>
.page {
  padding: 30px;
}

.desc {
  color: #777;
  margin-bottom: 20px;
}

.summary {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.summary-card {
  width: 200px;
  padding: 14px;
}

.r-title {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.r-count {
  color: #555;
  font-size: 13px;
}

.matrix-section {
  margin-top: 20px;
}

.search {
  width: 280px;
  margin-bottom: 10px;
}

.perm-name {
  font-weight: 600;
  margin-bottom: 2px;
}

.perm-desc {
  font-size: 12px;
  color: #777;
}

.permission-table .p-datatable-thead > tr > th {
  text-align: center;
  font-weight: 600;
}

.toggle-wrap {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.save-wrap {
  text-align: right;
  margin-top: 20px;
}
</style>
<style scoped>
.role-summary {
  display: flex;
  gap: 16px;
  margin: 20px 0;
}

.role-summary-card {
  width: 180px;
  padding: 16px;
}

.role-summary-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 8px;
}

.role-summary-count {
  font-size: 13px;
  color: #666;
}
</style>
