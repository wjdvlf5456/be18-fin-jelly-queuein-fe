<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api/iam/userApi.js'
import UserCreateDialog from '@/components/iam/UserCreateDialog.vue'

import IamTabs from '@/components/iam/IamTabs.vue'

// PrimeVue
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const router = useRouter()
const route = useRoute()

// --------------------------------------------------
// 상태
// --------------------------------------------------
const users = ref([])
const loading = ref(false)
const total = ref(0)
const showCreate = ref(false)

// 검색 조건
const search = ref({
  userName: '',
  email: '',
  roleName: null,
})

const roleOptions = [
  { label: '전체', value: null },
  { label: 'Master', value: 'MASTER' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'General', value: 'GENERAL' },
]


// --------------------------------------------------
// 사용자 목록 조회 (정상 버전)
// --------------------------------------------------
async function loadUsers() {
  try {
    loading.value = true

    // 사원명으로만 검색
    const searchKeyword = search.value.userName?.trim() || ''

    const params = {
      userName: searchKeyword || null,
      roleName: search.value.roleName || null,
    }

    // 빈 값은 제거
    Object.keys(params).forEach((key) => {
      if (params[key] === null || params[key] === '') {
        delete params[key]
      }
    })

    const res = await userApi.searchUsers(params)

    if (res?.data) {
      users.value = res.data.content || []
      total.value = res.data.totalElements || 0
    } else {
      console.warn('응답 데이터 형식이 올바르지 않습니다.')
      users.value = []
      total.value = 0
    }
  } catch (e) {
    console.error('[UserManagement] 사용자 조회 실패:', e)
    ElMessage.error('사용자 목록을 불러오는데 실패했습니다.')
    users.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 마운트 시 데이터 로드
onMounted(() => {
  // 쿼리 파라미터에서 역할 필터 적용
  if (route.query.role) {
    const roleValue = Array.isArray(route.query.role) ? route.query.role[0] : route.query.role
    // roleOptions에서 해당 역할 찾기
    const roleOption = roleOptions.find(opt => opt.value === roleValue)
    if (roleOption) {
      search.value.roleName = roleOption.value
    }
  }

  // 이전 경로 확인 (permission에서 온 경우 재로드)
  const prevPath = sessionStorage.getItem('previousRoutePath')
  if (prevPath && prevPath !== '/admin/users' && prevPath.startsWith('/admin/permissions')) {
    // permission에서 온 경우 Transition 완료 후 로드
    setTimeout(() => {
      loadUsers()
    }, 350)
  } else {
    // 일반적인 경우 즉시 로드
    loadUsers()
  }
})

// 라우트 변경 감지 - Transition 완료 후 데이터 로드
watch(
  () => route.path,
  async (newPath, oldPath) => {
    // 사용자 페이지로 이동할 때 (다른 페이지에서 온 경우)
    if (newPath === '/admin/users' && oldPath && oldPath !== '/admin/users') {
      console.log('[UserManagement] 경로 변경 감지:', { from: oldPath, to: newPath })
      // 쿼리 파라미터에서 역할 필터 적용
      if (route.query.role) {
        const roleValue = Array.isArray(route.query.role) ? route.query.role[0] : route.query.role
        const roleOption = roleOptions.find(opt => opt.value === roleValue)
        if (roleOption) {
          search.value.roleName = roleOption.value
        }
      }
      // Transition 완료를 기다림 (300ms + 약간의 여유)
      await new Promise((resolve) => setTimeout(resolve, 350))
      await nextTick()
      loadUsers()
    }
  },
  { immediate: false },
)

// 쿼리 파라미터 변경 감지 (같은 페이지에서 쿼리만 변경된 경우)
watch(
  () => route.query.role,
  (newRole) => {
    if (route.path === '/admin/users') {
      if (newRole) {
        const roleValue = Array.isArray(newRole) ? newRole[0] : newRole
        const roleOption = roleOptions.find(opt => opt.value === roleValue)
        if (roleOption) {
          search.value.roleName = roleOption.value
          loadUsers()
        }
      } else {
        // role 쿼리가 없으면 필터 초기화
        search.value.roleName = null
        loadUsers()
      }
    }
  },
  { immediate: false },
)

// --------------------------------------------------
// 사용자 삭제
// --------------------------------------------------
async function confirmDelete(userId) {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    if (!userId || isNaN(userId)) {
      ElMessage.warning('유효하지 않은 사용자 ID입니다.')
      return
    }

    await userApi.deleteUser(userId)
    ElMessage.success('사용자가 삭제되었습니다.')
    await loadUsers() // 삭제 후 목록 재조회
  } catch (e) {
    console.error('사용자 삭제 실패:', e)

    let errorMessage = '사용자 삭제에 실패했습니다.'

    if (e.response) {
      const status = e.response.status
      const data = e.response.data

      if (status === 403) {
        errorMessage = data?.message || '사용자 삭제 권한이 없습니다.'
      } else if (status === 404) {
        errorMessage = data?.message || '사용자를 찾을 수 없습니다.'
      } else if (status === 409) {
        errorMessage = data?.message || '사용자를 삭제할 수 없는 상태입니다.'
      } else {
        errorMessage = data?.message || `사용자 삭제에 실패했습니다. (${status})`
      }
    } else if (e.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
    console.error('[UserManagement] 사용자 삭제 실패:', e)
    alert('사용자 삭제 중 오류가 발생했습니다.')
  }
}

// --------------------------------------------------
// 행 클릭 이벤트
// --------------------------------------------------
function onRowClick(event) {
  // 편집 버튼이나 삭제 버튼 클릭 시에는 행 클릭 이벤트 무시
  const target = event.originalEvent.target
  if (
    target.closest('button') ||
    target.closest('.p-button') ||
    target.closest('a')
  ) {
    return
  }

  const user = event.data
  if (user) {
    viewUserDetail(user)
  }
}

// --------------------------------------------------
// 상세 조회 기능
// --------------------------------------------------
function viewUserDetail(user) {
  router.push(`/admin/users/${user.userId}`)
}

// --------------------------------------------------
// 수정 기능
// --------------------------------------------------
function editUser(user) {
  if (user.roleName === 'MASTER') return
  router.push(`/admin/users/${user.userId}/edit`)
}

// --------------------------------------------------
// 아바타 표시용 첫 글자
// --------------------------------------------------
function firstLetter(name = '') {
  return name?.trim()?.charAt(0) || '?'
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value) // ISO → Date 변환

  // YYYY-MM-DD HH:mm:ss 형식 만들기
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')

  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

// --------------------------------------------------
// 역할 태그 색상
// --------------------------------------------------
const roleTagStyle = {
  MASTER: { severity: 'danger' },
  ADMIN: { severity: 'warning' },
  MANAGER: { severity: 'info' },
  GENERAL: { severity: 'success' },
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

      <Button label="사용자 등록" icon="pi pi-plus" class="add-btn" @click="showCreate = true" />
    </header>

    <!-- Filters -->
    <section class="filters">
      <Dropdown
        v-model="search.roleName"
        :options="roleOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="전체 역할"
        class="input role-dropdown"
      />

      <div class="search-group">
        <InputText
          v-model="search.userName"
          placeholder="사원명으로 검색"
          class="input search-input"
          @keydown.enter="loadUsers"
        />

        <Button label="검색" @click="loadUsers" />
      </div>
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
      @row-click="onRowClick"
    >
      <!-- 프로필 -->
      <Column header="프로필">
        <template #body="{ data }">
          <div class="avatar">
            <img
              v-if="data.profileImageUrl"
              :src="data.profileImageUrl"
              :alt="data.userName"
              class="avatar-image"
            />
            <span v-else>{{ firstLetter(data.userName) }}</span>
          </div>
        </template>
      </Column>

      <Column field="userName" header="사원명" sortable />
      <Column field="email" header="이메일" sortable />
      <Column field="phone" header="연락처" sortable />

      <!-- 역할 -->
      <Column field="roleName" header="역할" sortable>
        <template #body="{ data }">
          <Tag :value="data.roleName" :severity="roleTagStyle[data.roleName]?.severity" />
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

      <Column field="lastLoginAt" header="마지막 접속" sortable>
        <template #body="{ data }">
          {{ formatDate(data.lastLoginAt) }}
        </template>
      </Column>
      <!-- Actions -->
      <Column header="사용자 편집하기">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            text
            rounded
            :disabled="data.roleName === 'MASTER'"
            @click.stop="editUser(data)"
          />
          <Button
            icon="pi pi-trash"
            text
            rounded
            :disabled="data.roleName === 'MASTER'"
            severity="danger"
            @click.stop="confirmDelete(data.userId)"
          />
        </template>
      </Column>
    </DataTable>

    <UserCreateDialog :visible="showCreate" @close="showCreate = false" @created="loadUsers" />
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
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input {
  width: 200px;
}

.role-dropdown {
  margin-right: auto;
}

.search-input {
  width: 250px;
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
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

/* 행 클릭 가능 스타일 */
.datatable :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
  transition: background-color 0.2s;
}

.datatable :deep(.p-datatable-tbody > tr:hover) {
  background-color: #f5f5f5;
}
</style>
