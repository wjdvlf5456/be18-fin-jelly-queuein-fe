<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/iam/userApi.js'
import UserCreateDialog from "@/components/iam/UserCreateDialog.vue"

import IamTabs from '@/components/iam/IamTabs.vue'

// PrimeVue
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'

const router = useRouter()

// --------------------------------------------------
// 상태
// --------------------------------------------------
const users = ref([])
const loading = ref(false)
const total = ref(0)
const showCreate = ref(false)

// 검색 조건
const search = ref({
  keyword: '',
  role: null,
  status: null
})

const roleOptions = [
  { label: '전체', value: null },
  { label: 'Master', value: 'MASTER' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'General', value: 'GENERAL' }
]

const statusOptions = [
  { label: '전체', value: null },
  { label: 'Active', value: true },
  { label: 'Inactive', value: false }
]

// --------------------------------------------------
// 사용자 목록 조회 (정상 버전)
// --------------------------------------------------
async function loadUsers() {
  try {
    loading.value = true

    const params = {
      keyword: search.value.keyword || null,
      roleName: search.value.role,
      active: search.value.status
    }

    const res = await userApi.searchUsers(params)

    users.value = res.data.content
    total.value = res.data.totalElements
  } catch (e) {
    console.error("[UserManagement] 사용자 조회 실패:", e)
    alert("사용자 목록 조회 중 오류가 발생했습니다.")
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)

// --------------------------------------------------
// 사용자 삭제
// --------------------------------------------------
async function confirmDelete(userId) {
  if (!confirm("정말 삭제하시겠습니까?")) return

  try {
    await userApi.deleteUser(userId)
    await loadUsers()   // 삭제 후 목록 재조회
  } catch (e) {
    console.error("[UserManagement] 사용자 삭제 실패:", e)
    alert("사용자 삭제 중 오류가 발생했습니다.")
  }
}

// --------------------------------------------------
// 수정 기능
// --------------------------------------------------
function editUser(user) {
  router.push(`/admin/users/${user.userId}/edit`)
}

// --------------------------------------------------
// 아바타 표시용 첫 글자
// --------------------------------------------------
function firstLetter(name = "") {
  return name?.trim()?.charAt(0) || "?"
}

function formatDate(value) {
  if (!value) return "-"

  const date = new Date(value) // ISO → Date 변환

  // YYYY-MM-DD HH:mm:ss 형식 만들기
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")
  const ss = String(date.getSeconds()).padStart(2, "0")

  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

// --------------------------------------------------
// 역할 태그 색상
// --------------------------------------------------
const roleTagStyle = {
  MASTER: { severity: 'danger' },
  ADMIN: { severity: 'warning' },
  MANAGER: { severity: 'info' },
  GENERAL: { severity: 'success' }
}
</script>

<template>
  <div class="page">

    <IamTabs />

    <!-- Title -->
    <header class="header">
      <div>
        <h2>사용자 관리</h2>
        <p class="desc">사용자, 역할, 권한을 관리할 수 있는 페이지입니다.</p>
      </div>

      <Button
        label="사용자 등록"
        icon="pi pi-plus"
        class="add-btn"
        @click="showCreate = true"
      />
    </header>

    <!-- Filters -->
    <section class="filters">
      <InputText
        v-model="search.keyword"
        placeholder="사용자 검색하기"
        class="input"
      />

      <Dropdown
        v-model="search.role"
        :options="roleOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="전체 역할"
        class="input"
      />

      <Dropdown
        v-model="search.status"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="전체 상태"
        class="input"
      />

      <Button label="조회" @click="loadUsers" />
    </section>

    <!-- DataTable -->
    <DataTable
      :value="users"
      :loading="loading"
      stripedRows
      paginator
      :rows="10"
      :totalRecords="total"
      class="datatable"
    >
      <!-- 프로필 -->
      <Column header="프로필">
        <template #body="{ data }">
          <div class="avatar">{{ firstLetter(data.userName) }}</div>
        </template>
      </Column>

      <Column field="userName" header="사원명" sortable />
      <Column field="email" header="이메일" sortable />
      <Column field="phone" header="연락처" />

      <!-- 역할 -->
      <Column header="역할">
        <template #body="{ data }">
          <Tag
            :value="data.roleName"
            :severity="roleTagStyle[data.roleName]?.severity"
          />
        </template>
      </Column>

      <!-- Status -->
<!--      <Column field="active" header="Status">-->
<!--        <template #body="{ data }">-->
<!--          <div class="status-col">-->
<!--            <ToggleSwitch v-model="data.active" />-->
<!--            <span :class="['status-text', data.active ? 'active' : 'inactive']">-->
<!--              {{ data.active ? 'Active' : 'Inactive' }}-->
<!--            </span>-->
<!--          </div>-->
<!--        </template>-->
<!--      </Column>-->

      <Column header="마지막 접속">
        <template #body="{ data }">
          {{ formatDate(data.lastLoginAt) }}
        </template>
      </Column>
      <!-- Actions -->
      <Column header="Actions">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            text
            rounded
            @click="editUser(data)"
          />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            @click="confirmDelete(data.userId)"
          />
        </template>
      </Column>

    </DataTable>

    <UserCreateDialog
      :visible="showCreate"
      @close="showCreate = false"
      @created="loadUsers"
    />
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
  margin-bottom: 25px;
}

.desc {
  color: #666;
  margin-top: 4px;
}

.add-btn {
  background: #000;
  border: none;
  color: white;
}

.filters {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}

.input {
  width: 200px;
}

.avatar {
  width: 36px;
  height: 36px;
  background: #e0e4ef;
  color: #243540;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.status-col {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-text.active {
  color: #16a34a;
  font-weight: 600;
}

.status-text.inactive {
  color: #999;
}
</style>
