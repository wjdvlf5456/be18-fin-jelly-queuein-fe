<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue"
import { permissionApi } from "@/api/iam/permissionApi"
import { roleApi } from '@/api/iam/roleApi.js'
import { useRouter } from "vue-router"
import Button from "primevue/button"
import DataTable from "primevue/datatable"
import Column from "primevue/column"
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'
import Dialog from 'primevue/dialog'
import { ElMessageBox, ElMessage } from "element-plus"
import { useAuthStore } from '@/stores/authStore'
import IamTabs from '@/components/iam/IamTabs.vue'
import { diffChanges } from '@/utils/permissionDiff'

const router = useRouter()
const auth = useAuthStore()

const isMaster = auth.role === "MASTER"

// 권한 목록 관련
const permissions = ref([])

// 권한 카테고리 분류 함수 (prefix 기반)
function getPermissionCategory(permissionName) {
  const name = permissionName.toUpperCase()
  
  // IAM 관련 (사용자, 역할, 권한)
  if (name.startsWith('IAM_USER_') || name.startsWith('IAM_ROLE_') || name.startsWith('IAM_PERMISSION_')) {
    return '사용자'
  }
  // 예약 관련
  else if (name.startsWith('RESERVATION_') || name.startsWith('BOOKING_')) {
    return '예약'
  }
  // 자원 관련 (ASSET, RESOURCE, INVENTORY, CATEGORY)
  else if (name.startsWith('ASSET_') || name.startsWith('RESOURCE_') || name.startsWith('INVENTORY_')) {
    return '자원'
  }
  // 정산 관련
  else if (name.startsWith('ACCOUNTING_') || name.startsWith('SETTLEMENT_') || name.startsWith('USAGE_')) {
    return '정산'
  }
  // 기타
  return '기타'
}

// 카테고리별로 그룹화된 권한
const groupedPermissions = computed(() => {
  const groups = {
    '사용자': [],
    '예약': [],
    '자원': [],
    '정산': [],
    '기타': []
  }
  
  if (!permissions.value || !Array.isArray(permissions.value)) {
    return groups
  }
  
  permissions.value.forEach(perm => {
    if (perm && perm.permissionName) {
      const category = getPermissionCategory(perm.permissionName)
      if (groups[category]) {
        groups[category].push(perm)
      } else {
        groups['기타'].push(perm)
      }
    }
  })
  
  return groups
})

// Matrix 관련
const roles = ref([])
const matrix = ref([])
const original = ref([])
const keyword = ref('')
const saving = ref(false)
const summaryOpen = ref(false)
const changes = ref([])

// 권한 생성 다이얼로그
const showCreate = ref(false)
const createForm = ref({
  permissionName: '',
  permissionDescription: '',
})

// 탭 상태 (목록 / 매핑)
const activeTab = ref('list')

// 권한 목록 로드
async function load() {
  const res = await permissionApi.getPermissionList()
  permissions.value = res.data.permissions
}

// Matrix 데이터 로드
async function loadMatrix() {
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
        // MASTER 역할은 항상 true로 설정
        r.roleName === 'MASTER' ? true : r.permissions.some((x) => x.permissionId === perm.permissionId),
      ]),
    ),
  }))

  matrix.value = JSON.parse(JSON.stringify(built))
  original.value = JSON.parse(JSON.stringify(built))
}

// 필터된 Matrix
const filteredMatrix = computed(() => {
  if (!keyword.value.trim()) return matrix.value
  const q = keyword.value.toLowerCase()

  return matrix.value.filter(
    (p) => p.name.toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q),
  )
})

// Matrix를 카테고리별로 그룹화
const groupedMatrix = computed(() => {
  const groups = {
    '사용자': [],
    '예약': [],
    '자원': [],
    '정산': [],
    '기타': []
  }
  
  if (!filteredMatrix.value || !Array.isArray(filteredMatrix.value)) {
    return groups
  }
  
  filteredMatrix.value.forEach(perm => {
    if (perm && perm.name) {
      const category = getPermissionCategory(perm.name)
      if (groups[category]) {
        groups[category].push(perm)
      } else {
        groups['기타'].push(perm)
      }
    }
  })
  
  return groups
})

// 토글 변경
function manualToggle(row, roleId, roleName) {
  // MASTER 역할은 수정 불가
  if (roleName === 'MASTER') {
    ElMessage.warning('MASTER의 권한은 수정할 수 없습니다.')
    // 원래 상태로 되돌림
    row.roles[roleId] = true
    return
  }
  
  row.roles[roleId] = !row.roles[roleId]
  changes.value = diffChanges(original.value, matrix.value, roles.value)
}

// Matrix 저장
async function saveChanges() {
  saving.value = true

  try {
    for (const role of roles.value) {
      const allowedIds = matrix.value.filter((p) => p.roles[role.roleId]).map((p) => p.permissionId)

      await roleApi.replacePermissions(role.roleId, {
        permissionIds: allowedIds,
      })
    }

    await loadMatrix()

    changes.value = []
    summaryOpen.value = false

    ElMessage.success('저장되었습니다.')
  } finally {
    saving.value = false
  }
}

// 권한 생성
async function createPermission() {
  if (!createForm.value.permissionName.trim()) {
    return ElMessage.warning('권한명을 입력하세요.')
  }

  await permissionApi.createPermission({
    permissionName: createForm.value.permissionName,
    permissionDescription: createForm.value.permissionDescription,
  })

  ElMessage.success('권한이 생성되었습니다.')

  // 폼 초기화
  createForm.value = {
    permissionName: '',
    permissionDescription: '',
  }

  showCreate.value = false

  // 다시 로딩하여 테이블 갱신
  await load()
  await loadMatrix()
}

// 삭제
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
    await loadMatrix()
  } catch (err) {
    if (err !== "cancel") ElMessage.error("삭제 실패")
  }
}

// 탭 변경 시 데이터 로드
watch(activeTab, (newTab) => {
  if (newTab === 'matrix') {
    loadMatrix()
  } else {
    load()
  }
})

onMounted(() => {
  load()
  loadMatrix()
})
</script>

<template>
  <div class="page">
    <!-- IAM Tabs -->
    <IamTabs />

    <!-- 내부 탭 (목록 / 매핑) -->
    <div class="internal-tabs">
      <button
        :class="['tab-btn', { active: activeTab === 'list' }]"
        @click="activeTab = 'list'"
      >
        권한 목록
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'matrix' }]"
        @click="activeTab = 'matrix'"
      >
        역할-권한 매핑
      </button>
    </div>

    <!-- 권한 목록 탭 -->
    <div v-if="activeTab === 'list'" class="list-view">
      <div class="toolbar">
        <Button
          v-if="isMaster"
          label="권한 생성"
          icon="pi pi-plus"
          @click="showCreate = true"
        />
      </div>

      <!-- 카테고리별 권한 그룹 -->
      <div class="permission-categories">
        <template
          v-for="(category, categoryName) in groupedPermissions"
          :key="categoryName"
        >
          <div
            v-if="category && category.length > 0"
            class="category-section"
          >
          <div class="category-header">
            <h3 class="category-title">{{ categoryName }}</h3>
            <span class="category-count">{{ category.length }}개 권한</span>
          </div>
          
          <div class="permission-cards">
            <div
              v-for="perm in category"
              :key="perm.permissionId"
              class="permission-card"
            >
              <div class="permission-header">
                <div class="permission-name">{{ perm.permissionName }}</div>
                <div class="permission-actions">
                  <Button
                    label="수정"
                    size="small"
                    icon="pi pi-pencil"
                    text
                    @click="router.push(`/admin/permissions/${perm.permissionId}/edit`)"
                  />
                  <Button
                    v-if="isMaster"
                    label="삭제"
                    size="small"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    @click="onDelete(perm)"
                  />
                </div>
              </div>
              <div class="permission-description">{{ perm.permissionDescription || '-' }}</div>
            </div>
          </div>
        </div>
        </template>
      </div>
    </div>

    <!-- 역할-권한 매핑 탭 -->
    <div v-if="activeTab === 'matrix'" class="matrix-view">
      <!-- SummaryBar + Panel -->
      <div class="summary-wrapper">
        <!-- SummaryBar -->
        <div class="summary-bar">
          <div class="summary-left" @click="summaryOpen = !summaryOpen">
            <span class="arrow" :class="{ open: summaryOpen }"></span>
            <span class="label">
              {{ changes.length === 0 ? '변경된 내용 없음' : `변경된 내용 ${changes.length}건` }}
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

        <!-- SummaryPanel -->
        <div v-if="summaryOpen" class="summary-panel">
          <div v-for="item in changes" :key="item.key" class="summary-row">
            <span class="role">{{ item.roleName }}</span>
            <span>역할에</span>
            <span class="perm">{{ item.permissionName }}</span>
            <span :class="{ on: item.now, off: !item.now }">
              {{ item.now ? '권한을 활성화했습니다.' : '권한을 비활성화했습니다.' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Search & Add -->
      <div class="matrix-toolbar">
        <InputText v-model="keyword" placeholder="Search permissions..." class="search-input" />
        <Button label="권한 추가" icon="pi pi-plus" class="add-btn" @click="showCreate = true" />
      </div>

      <!-- 카테고리별 Matrix 그룹 -->
      <div class="matrix-categories">
        <template
          v-for="(category, categoryName) in groupedMatrix"
          :key="categoryName"
        >
          <div
            v-if="category && category.length > 0"
            class="matrix-category-section"
          >
            <div class="matrix-category-header">
              <h3 class="matrix-category-title">{{ categoryName }}</h3>
              <span class="matrix-category-count">{{ category.length }}개 권한</span>
            </div>
            
            <div class="matrix-table-wrapper">
              <DataTable :value="category" :rowKey="'key'" stripedRows class="perm-table">
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
                        :modelValue="role.roleName === 'MASTER' ? true : data.roles[role.roleId]"
                        @change="manualToggle(data, role.roleId, role.roleName)"
                      />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 권한 생성 다이얼로그 -->
    <Dialog v-model:visible="showCreate" header="권한 생성" modal class="create-dialog">
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
  </div>
</template>

<style scoped>
.page {
  padding: 30px;
  transition: all 0.3s ease;
}

/* 내부 탭 */
.internal-tabs {
  display: inline-flex;
  gap: 12px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
  width: fit-content;
}

.tab-btn {
  padding: 7px 24px;
  border: 1px solid #e0e0e0;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex: 1;
  white-space: nowrap;
}

.tab-btn:hover {
  background: #eeeeee;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 목록 뷰 */
.list-view {
  padding: 20px 0;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.title {
  font-size: 20px;
  margin-bottom: 16px;
}

/* Matrix 뷰 */
.matrix-view {
  padding: 20px 0;
  animation: fadeIn 0.3s ease;
}

/* SummaryBar + SummaryPanel 전체를 sticky 묶음으로*/
.summary-wrapper {
  position: sticky;
  top: 0px;
  z-index: 25;
  background: white;
  margin-bottom: 18px;
  margin-left: 0;
  margin-right: 0;
  padding: 0;
}

/* SummaryBar */
.summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #ddd;
  background: white;
  max-width: 100%;
  box-sizing: border-box;
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

/* SummaryPanel */
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

/* Matrix Toolbar */
.matrix-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

.search-input {
  width: 260px;
}

.toggle-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* MASTER 역할 토글 비활성화 스타일 - 초록색 유지 */
:deep(.p-toggleswitch.p-disabled) {
  opacity: 1;
  cursor: not-allowed;
}

/* MASTER 역할 토글이 비활성화되어도 초록색 유지 */
:deep(.p-toggleswitch.p-disabled.p-toggleswitch-checked .p-toggleswitch-slider) {
  background: #10b981 !important;
}

:deep(.p-toggleswitch.p-disabled.p-toggleswitch-checked .p-toggleswitch-handle) {
  background: white !important;
}

.save-btn {
  background: #22c55e !important;
  border: none;
}

.add-btn {
  background: #000;
  border: none;
  color: white;
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

.p-name {
  font-weight: 600;
}

.p-desc {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

/* 권한 카테고리 섹션 */
.permission-categories {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.category-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.category-section:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.category-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.category-count {
  font-size: 14px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 12px;
  border-radius: 12px;
}

.permission-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.permission-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.permission-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 12px;
}

.permission-name {
  font-weight: 600;
  font-size: 15px;
  color: #1f2937;
  flex: 1;
  word-break: break-word;
}

.permission-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.permission-description {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .permission-cards {
    grid-template-columns: 1fr;
  }
}

/* Matrix 카테고리 섹션 */
.matrix-categories {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.matrix-category-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.matrix-category-section:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.matrix-category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.matrix-category-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.matrix-category-count {
  font-size: 14px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 12px;
  border-radius: 12px;
}

.matrix-table-wrapper {
  overflow-x: auto;
}

.matrix-table-wrapper :deep(.p-datatable) {
  border-radius: 8px;
  overflow: hidden;
}
</style>
