<!-- file: src/views/admin/iam/permission/PermissionMatrix.vue -->
<script setup>
import { ref, computed, onMounted } from "vue"
import { roleApi } from "@/api/iam/roleApi.js"
import { permissionApi } from "@/api/iam/permissionApi.js"
import IamTabs from "@/components/iam/IamTabs.vue"
import Button from "primevue/button"
import InputText from "primevue/inputtext"
import ToggleSwitch from "primevue/toggleswitch"
import DataTable from "primevue/datatable"
import Column from "primevue/column"

import { diffChanges } from "@/utils/permissionDiff"

// -------------------------------------
// 상태
// -------------------------------------
const roles = ref([])
const permissions = ref([])
const matrix = ref([])
const original = ref([])

const keyword = ref("")
const saving = ref(false)

const summaryOpen = ref(false)
const changes = ref([])

const showCreate = ref(false)

const createForm = ref({
  permissionName: '',
  permissionDescription: ''
})

// -------------------------------------
// 데이터 로딩
// -------------------------------------
async function loadData() {
  const roleRes = await roleApi.getRoleList()
  const permRes = await permissionApi.getPermissionList()

  roles.value = roleRes.data.roles
  permissions.value = permRes.data.permissions

  const built = permissions.value.map((perm) => ({
    key: perm.permissionId,
    permissionId: perm.permissionId,
    name: perm.permissionName,
    desc: perm.permissionDescription,
    roles: Object.fromEntries(
      roles.value.map((r) => [
        r.roleId,
        r.permissions.some((x) => x.permissionId === perm.permissionId),
      ])
    ),
  }))

  matrix.value = JSON.parse(JSON.stringify(built))
  original.value = JSON.parse(JSON.stringify(built))
}

async function createPermission() {
  if (!createForm.value.permissionName.trim()) {
    return alert("권한명을 입력하세요.")
  }

  await permissionApi.createPermission({
    permissionName: createForm.value.permissionName,
    permissionDescription: createForm.value.permissionDescription
  })

  alert("권한이 생성되었습니다.")

  // 폼 초기화
  createForm.value = {
    permissionName: '',
    permissionDescription: ''
  }

  showCreate.value = false

  // 다시 로딩하여 테이블 갱신
  await loadData()
}


onMounted(loadData)

// -------------------------------------
// 검색
// -------------------------------------
const filteredMatrix = computed(() => {
  if (!keyword.value.trim()) return matrix.value
  const q = keyword.value.toLowerCase()

  return matrix.value.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.desc || "").toLowerCase().includes(q)
  )
})

// -------------------------------------
// 토글 변경 (PrimeVue 최적화 문제 해결버전)
// -------------------------------------
function manualToggle(row, roleId) {
  // 직접 반전시켜야 즉시 반영됨
  row.roles[roleId] = !row.roles[roleId]

  // diff 즉시 계산
  changes.value = diffChanges(original.value, matrix.value, roles.value)

}

// -------------------------------------
// 저장
// -------------------------------------
async function saveChanges() {
  saving.value = true

  try {
    for (const role of roles.value) {
      const allowedIds = matrix.value
      .filter((p) => p.roles[role.roleId])
      .map((p) => p.permissionId)

      await roleApi.replacePermissions(role.roleId, {
        permissionIds: allowedIds,
      })
    }

    await loadData()

    changes.value = []
    summaryOpen.value = false

    alert("저장되었습니다.")
  } finally {
    saving.value = false
  }
}

</script>

<template>
  <div class="page">

    <!-- ⭐ SummaryBar + Panel 전체를 하나의 sticky 덩어리로 묶음 ⭐ -->
    <div class="summary-wrapper">

      <!-- SummaryBar -->
      <div class="summary-bar">
        <div class="summary-left" @click="summaryOpen = !summaryOpen">
          <span class="arrow" :class="{ open: summaryOpen }"></span>
          <span class="label">
            {{ changes.length === 0 ? "변경된 내용 없음" : `변경된 내용 ${changes.length}건` }}
          </span>
        </div>

        <Button
          :label="saving ? '저장 중...' : '저장'"
          icon="pi pi-save"
          iconPos="right"
          :loading="saving"
          loadingIcon="pi pi-spinner pi-spin"
          class="save-btn"
          :disabled="changes.length === 0 || saving"
          @click="saveChanges"
        />

      </div>

      <!-- SummaryPanel (SummaryBar 바로 아래에서 함께 sticky 동작) -->
      <div v-if="summaryOpen" class="summary-panel">
        <div v-for="item in changes" :key="item.key" class="summary-row">
          <span class="role">{{ item.roleName }}</span>
          <span>역할에</span>
          <span class="perm">{{ item.permissionName }}</span>
          <span :class="{ on: item.now, off: !item.now }">
            {{ item.now ? "권한을 활성화했습니다." : "권한을 비활성화했습니다." }}
          </span>
        </div>
      </div>

    </div>

    <!-- Tabs -->
    <IamTabs />

    <!-- Search -->
    <InputText v-model="keyword" placeholder="Search permissions..." class="search-input" />
    <Button
      label="권한 추가"
      icon="pi pi-plus"
      class="add-btn"
      @click="showCreate = true"
    />
    <!-- Table -->
    <DataTable :value="filteredMatrix" :rowKey="'key'" stripedRows class="perm-table">
      <Column header="Permission" field="name">
        <template #body="{ data }">
          <div class="p-name">{{ data.name }}</div>
          <div class="p-desc">{{ data.desc }}</div>
        </template>
      </Column>

      <Column
        v-for="role in roles"
        :key="role.roleId"
        :header="role.roleName"
        style="width: 120px; text-align: center"
      >
        <template #body="{ data }">
          <div class="toggle-center">
            <ToggleSwitch
              :modelValue="data.roles[role.roleId]"
              @change="manualToggle(data, role.roleId)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>

  <Dialog
    v-model:visible="showCreate"
    header="권한 생성"
    modal
    class="create-dialog"
  >
    <div class="dialog-body">
      <label>권한명</label>
      <InputText v-model="createForm.permissionName" class="w-full" />

      <label>설명</label>
      <InputText v-model="createForm.permissionDescription" class="w-full" />
    </div>

    <template #footer>
      <Button label="취소" text @click="showCreate = false" />
      <Button label="생성" @click="createPermission" />
    </template>
  </Dialog>
</template>

<style scoped>
.page {
  padding: 0 30px;
}

/* SummaryBar + SummaryPanel 전체를 sticky 묶음으로*/
.summary-wrapper {
  position: sticky;
  top: 0px; /* Header height */
  z-index: 300;
  background: white;
}

/* SummaryBar */
.summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 12px 6px;
  border-bottom: 1px solid #ddd;
  background: white;
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.arrow {
  border: solid #444;
  border-width: 0 2px 2px 0;
  padding: 4px;
  transform: rotate(45deg);
  transition: 0.2s;
}

.arrow.open {
  transform: rotate(-135deg);
}

/* SummaryPanel: summary-bar 바로 아래 */
.summary-panel {
  background: #fafafa;
  border-bottom: 1px solid #ddd;
  padding: 16px;
}

.summary-row {
  padding: 4px 0;
  font-size: 14px;
}

.role {
  font-weight: bold;
}

.perm {
  font-weight: bold;
  margin: 0 4px;
}

.on {
  color: #16a34a;
}

.off {
  color: #dc2626;
}

/* Search */
.search-input {
  margin-top: 18px;
  width: 260px;
}

/* Toggle */
.toggle-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.save-btn {
  background: #22c55e !important;
  border: none;
}

.add-btn {
  background: #000;
  border: none;
  color: white;
  margin-left: 10px;
}

.create-dialog {
  width: 400px;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 10px 0;
}

.w-full {
  width: 100%;
}
</style>

