<!-- file: src/views/admin/iam/role/RoleManagement.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { roleApi } from '@/api/iam/roleApi.js'

import IamTabs from '@/components/iam/IamTabs.vue'

// PrimeVue
import Card from 'primevue/card'
import Button from 'primevue/button'
import Chip from 'primevue/chip'
import Menu from 'primevue/menu'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'

const roles = ref([])
const loading = ref(false)

// 펼침 여부 roleId → boolean
const expanded = ref({})

// 역할 생성/수정 다이얼로그 상태
const showDialog = ref(false)
const editMode = ref(false)
const form = ref({
  roleId: null,
  roleName: '',
  roleDescription: '',
  // permissions: [],  // 백엔드 확장 전까지 주석처리
})

// --------------------------------------------------
// 역할 목록 조회
// --------------------------------------------------
async function loadRoles() {
  loading.value = true

  const res = await roleApi.getRoleList()

  // 응답 구조: { roles: [...] }
  roles.value = res.data.roles

  // 초기에는 모두 접힌 상태
  expanded.value = Object.fromEntries(
    roles.value.map(r => [r.roleId, false])
  )

  loading.value = false
}

// 펼침/접기 토글
function toggleExpand(roleId) {
  expanded.value[roleId] = !expanded.value[roleId]
}

onMounted(loadRoles)

// --------------------------------------------------
// 역할 편집 메뉴 (···)
// --------------------------------------------------
const menuRef = ref()
const selectedRole = ref(null)

function openMenu(event, role) {
  selectedRole.value = role
  menuRef.value.toggle(event)
}

const menuItems = [
  {
    label: '역할 수정',
    icon: 'pi pi-pencil',
    command: () => openEdit(selectedRole.value)
  },
  {
    label: '역할 삭제',
    icon: 'pi pi-trash',
    command: () => deleteRole(selectedRole.value)
  }
]

// --------------------------------------------------
// 역할 추가 / 수정
// --------------------------------------------------
function openAdd() {
  editMode.value = false
  form.value = {
    roleId: null,
    roleName: '',
    roleDescription: '',
  }
  showDialog.value = true
}

function openEdit(role) {
  editMode.value = true
  form.value = {
    roleId: role.roleId,
    roleName: role.roleName,
    roleDescription: role.roleDescription,
  }
  showDialog.value = true
}

async function saveRole() {
  if (!form.value.roleName.trim()) {
    return alert('역할 이름을 입력하세요.')
  }

  if (editMode.value) {
    await roleApi.updateRole(form.value.roleId, {
      roleName: form.value.roleName,
      roleDescription: form.value.roleDescription
    })
  } else {
    await roleApi.createRole({
      roleName: form.value.roleName,
      roleDescription: form.value.roleDescription
    })
  }

  showDialog.value = false
  loadRoles()
}

// --------------------------------------------------
// 역할 삭제
// --------------------------------------------------
async function deleteRole(role) {
  if (!confirm(`${role.roleName} 역할을 삭제하시겠습니까?`)) return
  await roleApi.deleteRole(role.roleId)
  loadRoles()
}
</script>

<template>
  <div class="page">

    <IamTabs />

    <!-- Header -->
    <div class="header">
      <div>
        <h2>역할 설정</h2>
        <p class="desc">사용자, 역할, 권한을 관리할 수 있습니다.</p>
      </div>

      <Button
        label="역할 추가"
        icon="pi pi-plus"
        class="add-btn"
        @click="openAdd"
      />
    </div>

    <p class="sub">{{ roles.length }}개의 역할</p>

    <!-- Roles as Cards -->
    <div class="role-grid">
      <Card
        v-for="role in roles"
        :key="role.roleId"
        class="role-card"
      >
        <template #title>
          <div class="title-box">
            <div class="title">
              {{ role.roleName }}

              <!-- role.isSystem 은 아직 DTO 없음 → 주석처리 -->
              <!-- <Chip v-if="role.isSystem" label="System" class="system-tag" /> -->
            </div>

            <Button
              icon="pi pi-ellipsis-v"
              text
              rounded
              @click="(e) => openMenu(e, role)"
            />
          </div>
        </template>

        <template #subtitle>
           <div class="sub-info">
            <i class="pi pi-users"></i>
            {{ role.userCount }} 명
          </div>
        </template>

        <template #content>
          <p class="role-desc">{{ role.roleDescription }}</p>

          <!-- 펼침/접기 버튼 -->
          <div class="perm-header" @click="toggleExpand(role.roleId)">
            <span>Permissions</span>
            <i :class="expanded[role.roleId] ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
          </div>

          <!-- 펼쳐진 경우에만 Permissions 목록 표시 -->
          <div v-if="expanded[role.roleId]" class="perm-list">
            <Chip
              v-for="p in role.permissions"
              :key="p.permissionId"
              :label="p.permissionName"
              class="perm-chip"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- PrimeVue Menu -->
    <Menu ref="menuRef" :model="menuItems" popup />

    <!-- Role Add/Edit Dialog -->
    <Dialog
      v-model:visible="showDialog"
      :header="editMode ? '역할 수정' : '역할 추가'"
      modal
      class="dialog"
    >
      <div class="dialog-body">
        <label>역할 이름</label>
        <InputText v-model="form.roleName" class="w-full" />

        <label>설명</label>
        <Textarea v-model="form.roleDescription" rows="3" class="w-full" />
      </div>

      <template #footer>
        <Button label="취소" text @click="showDialog = false" />
        <Button label="저장" @click="saveRole" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.page {
  padding: 30px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.desc {
  color: #666;
  margin-top: 5px;
}

.add-btn {
  background: #000;
  border: none;
  color: white;
  padding: 8px 14px;
}

.sub {
  color: #888;
  margin-top: 8px;
  margin-bottom: 20px;
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.role-card {
  padding: 4px 6px;
}

.title-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.system-tag {
  background: #e2e2e2;
  color: #666;
}

.sub-info {
  font-size: 13px;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6px;
}

.role-desc {
  color: #666;
  margin-bottom: 10px;
}

.perm-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.perm-chip {
  background: #f0f0f0;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
}

.w-full {
  width: 100%;
}
</style>
