<!-- file: src/views/admin/iam/role/RoleManagement.vue -->
<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { roleApi } from '@/api/iam/roleApi.js'

import IamTabs from '@/components/iam/IamTabs.vue'

const route = useRoute()
const router = useRouter()

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
// 권한 설명 표시 여부 permissionId → boolean
const hoveredPermission = ref(null)

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
  expanded.value = Object.fromEntries(roles.value.map((r) => [r.roleId, false]))

  loading.value = false
}

// 펼침/접기 토글
function toggleExpand(roleId) {
  expanded.value[roleId] = !expanded.value[roleId]
}

// 마운트 시 데이터 로드
onMounted(() => {
  // 이전 경로 확인 (permission에서 온 경우 재로드)
  const prevPath = sessionStorage.getItem('previousRoutePath')
  if (prevPath && prevPath !== '/admin/roles' && prevPath.startsWith('/admin/permissions')) {
    // permission에서 온 경우 Transition 완료 후 로드
    setTimeout(() => {
      loadRoles()
    }, 350)
  } else {
    // 일반적인 경우 즉시 로드
    loadRoles()
  }
})

// 라우트 변경 감지 - Transition 완료 후 데이터 로드
watch(
  () => route.path,
  async (newPath, oldPath) => {
    // 역할 페이지로 이동할 때 (다른 페이지에서 온 경우)
    if (newPath === '/admin/roles' && oldPath && oldPath !== '/admin/roles') {
      console.log('[RoleManagement] 경로 변경 감지:', { from: oldPath, to: newPath })
      // Transition 완료를 기다림 (300ms + 약간의 여유)
      await new Promise((resolve) => setTimeout(resolve, 350))
      await nextTick()
      loadRoles()
    }
  },
  { immediate: false },
)

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
    command: () => openEdit(selectedRole.value),
  },
  {
    label: '역할 삭제',
    icon: 'pi pi-trash',
    command: () => deleteRole(selectedRole.value),
  },
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
      roleDescription: form.value.roleDescription,
    })
  } else {
    await roleApi.createRole({
      roleName: form.value.roleName,
      roleDescription: form.value.roleDescription,
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

// --------------------------------------------------
// 사용자 목록으로 이동 (역할 필터 적용)
// --------------------------------------------------
function navigateToUsersWithRole(roleName) {
  router.push({
    path: '/admin/users',
    query: { role: roleName }
  })
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

      <Button label="역할 추가" icon="pi pi-plus" class="add-btn" @click="openAdd" />
    </div>

    <p class="sub">{{ roles.length }}개의 역할</p>

    <!-- Roles as Cards -->
    <div class="role-grid">
      <Card v-for="role in roles" :key="role.roleId" class="role-card">
        <template #title>
          <div class="title-box">
            <div class="title">
              {{ role.roleName }}

              <!-- role.isSystem 은 아직 DTO 없음 → 주석처리 -->
              <!-- <Chip v-if="role.isSystem" label="System" class="system-tag" /> -->
            </div>

            <Button icon="pi pi-ellipsis-v" text rounded @click="(e) => openMenu(e, role)" />
          </div>
        </template>

        <template #subtitle>
          <div class="sub-info" @click="navigateToUsersWithRole(role.roleName)" @click.stop>
            <i class="pi pi-users"></i>
            {{ role.userCount }} 명
          </div>
        </template>

        <template #content>
          <p class="role-desc">{{ role.roleDescription }}</p>

          <!-- 권한 펼침/접기 -->
          <div class="perm-header" @click="toggleExpand(role.roleId)">
            <span>권한 {{ role.permissions?.length || 0 }}개</span>
            <i :class="expanded[role.roleId] ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
          </div>

          <!-- 펼쳐진 경우에만 Permissions 목록 표시 (독립적인 전환) -->
          <Transition name="perm-expand">
            <div v-if="expanded[role.roleId]" class="perm-list-wrapper">
              <div class="perm-list">
                <div
                  v-for="p in role.permissions"
                  :key="p.permissionId"
                  class="perm-item"
                  @mouseenter="hoveredPermission = p.permissionId"
                  @mouseleave="hoveredPermission = null"
                >
                  <Chip
                    :label="p.permissionName"
                    class="perm-chip"
                  />
                  <div
                    v-if="p.permissionDescription && hoveredPermission === p.permissionId"
                    class="perm-description"
                  >
                    {{ p.permissionDescription }}
                  </div>
                </div>
              </div>
            </div>
          </Transition>
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
  /* 그리드 아이템들이 독립적으로 정렬되도록 */
  align-items: start;
}

.role-card {
  padding: 4px 6px;
  /* 각 카드가 독립적으로 동작하도록 격리 */
  contain: layout style;
  /* 카드 높이 변화가 다른 카드에 영향을 주지 않도록 */
  align-self: start;
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
  cursor: pointer;
  transition: color 0.2s ease;
  user-select: none;
}

.sub-info:hover {
  color: #3b82f6;
}

.sub-info:hover i {
  color: #3b82f6;
}

.role-desc {
  color: #666;
  margin-bottom: 10px;
}

.perm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #DBEAFE;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 12px;
}

.perm-header:hover {
  background: #bfdbfe;
}

.perm-header span {
  font-size: 14px;
  font-weight: 500;
  color: #3B82F6;
}

.perm-header i {
  font-size: 14px;
  color: #3B82F6;
}

.perm-list-wrapper {
  overflow: hidden;
  margin-top: 0;
}

.perm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.perm-item {
  position: relative;
  width: 100%;
}

.perm-description {
  display: block;
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%);
  padding: 8px 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 8px;
  font-size: 12px;
  color: white;
  z-index: 100;
  white-space: normal;
  width: 200px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  line-height: 1.5;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

.perm-description::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid #3b82f6;
}

/* 권한 목록 확장/축소 전환 애니메이션 */
.perm-expand-enter-active,
.perm-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.perm-expand-enter-from {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
}

.perm-expand-enter-to {
  max-height: 500px;
  opacity: 1;
  margin-top: 0;
}

.perm-expand-leave-from {
  max-height: 500px;
  opacity: 1;
  margin-top: 0;
}

.perm-expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
}

.perm-chip {
  background: #DBEAFE;
  color: #3B82F6;
  border: none;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
}

/* PrimeVue Chip 스타일 오버라이드 */
.perm-chip :deep(.p-chip-text) {
  color: #3B82F6;
  font-weight: 500;
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
