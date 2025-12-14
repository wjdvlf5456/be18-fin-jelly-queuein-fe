<template>
  <div class="category-page">
    <!-- 페이지 제목 -->
    <h2 class="page-title">자원 카테고리</h2>
    <!-- 상단 필터 영역 (필요하면 여기에 추가 가능) -->

    <!-- 카테고리 목록 테이블 -->
    <el-table
      :data="categories"
      stripe
      border
      style="width: 100%"
      :empty-text="'데이터가 없습니다.'"
    >
      <el-table-column prop="categoryId" label="카테고리 번호" width="120" />
      <el-table-column prop="name" label="카테고리 명" width="200" />
      <el-table-column prop="assetCount" label="개수" width="100" />
      <el-table-column prop="createdBy" label="생성자" width="120">
        <template #default="{ row }">
          {{ resolveCreatedBy(row.createdBy) }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="생성 날짜" width="120">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="카테고리 설명" />
      <el-table-column label="편집" width="180">
        <template #default="{ row }">
          <el-button type="primary" text size="small" @click.stop="editCategory(row)"
            >수정</el-button
          >
          <el-button type="danger" text size="small" @click.stop="deleteCategory(row)"
            >삭제</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 페이지네이션 -->
    <div class="pagination">
      <el-pagination
        layout="prev, pager, next"
        :total="total"
        :page-size="size"
        :current-page="page + 1"
        @current-change="changePage"
      />
    </div>

    <!-- 생성 버튼 -->
    <div class="bottom-actions">
      <button class="asset-btn" @click="goAsset">자원 관리</button>
      <button class="create-btn" @click="openCreateModal">카테고리 생성</button>
    </div>

    <!-- 모달들 -->
    <CategoryFormModal
      v-if="showCreateModal"
      title="카테고리 생성"
      submitText="등록"
      @submit="createCategory"
      @close="showCreateModal = false"
    />

    <CategoryFormModal
      v-if="showEditModal"
      title="카테고리 수정"
      submitText="수정"
      :initialData="editTarget"
      @submit="updateCategory"
      @close="showEditModal = false"
    />

    <ConfirmModal
      v-if="showDeleteModal"
      title="카테고리 삭제"
      message="삭제하면 복구할 수 없습니다. 계속할까요?"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { categoryApi } from '@/api/categoryApi'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import CategoryFormModal from './CategoryFormModal.vue'

const router = useRouter()
const categories = ref([])
const page = ref(0)
const size = ref(10)
const total = ref(0)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const showEditModal = ref(false)
const editTarget = ref(null)
const selectedCategory = ref(null)

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toISOString().split('T')[0]
}

function resolveCreatedBy(id) {
  return id ? '관리자' : '-'
}

async function loadCategories() {
  try {
    if (page.value < 0) {
      page.value = 0
    }
    if (size.value <= 0) {
      size.value = 10
    }

    const res = await categoryApi.getManagementList(page.value, size.value)

    if (res?.data) {
      categories.value = res.data.content || []
      total.value = res.data.totalElements || 0
    } else {
      console.warn('응답 데이터 형식이 올바르지 않습니다.')
      categories.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error)
    ElMessage.error('카테고리 목록을 불러오는데 실패했습니다.')
    categories.value = []
    total.value = 0
  }
}

function changePage(newPage) {
  page.value = newPage - 1
  loadCategories()
}

async function createCategory(data) {
  try {
    // 유효성 검사
    if (!data.name || data.name.trim() === '') {
      ElMessage.warning('카테고리명을 입력해주세요.')
      return
    }

    await categoryApi.create(data)
    ElMessage.success('카테고리가 생성되었습니다.')
    showCreateModal.value = false
    await loadCategories()
  } catch (error) {
    console.error('카테고리 생성 실패:', error)

    let errorMessage = '카테고리 생성에 실패했습니다.'

    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      if (status === 400) {
        errorMessage = data?.message || '입력 정보가 올바르지 않습니다.'
      } else if (status === 403) {
        errorMessage = data?.message || '카테고리 생성 권한이 없습니다.'
      } else if (status === 409) {
        errorMessage = data?.message || '이미 존재하는 카테고리입니다.'
      } else {
        errorMessage = data?.message || `카테고리 생성에 실패했습니다. (${status})`
      }
    } else if (error.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
  }
}

async function updateCategory(data) {
  try {
    // 유효성 검사
    if (!editTarget.value?.categoryId) {
      ElMessage.warning('수정할 카테고리를 선택해주세요.')
      return
    }

    if (!data.name || data.name.trim() === '') {
      ElMessage.warning('카테고리명을 입력해주세요.')
      return
    }

    await categoryApi.update(editTarget.value.categoryId, data)
    ElMessage.success('카테고리가 수정되었습니다.')
    showEditModal.value = false
    await loadCategories()
  } catch (error) {
    console.error('카테고리 수정 실패:', error)

    let errorMessage = '카테고리 수정에 실패했습니다.'

    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      if (status === 400) {
        errorMessage = data?.message || '입력 정보가 올바르지 않습니다.'
      } else if (status === 403) {
        errorMessage = data?.message || '카테고리 수정 권한이 없습니다.'
      } else if (status === 404) {
        errorMessage = data?.message || '카테고리를 찾을 수 없습니다.'
      } else if (status === 409) {
        errorMessage = data?.message || '충돌이 발생했습니다. 다시 시도해주세요.'
      } else {
        errorMessage = data?.message || `카테고리 수정에 실패했습니다. (${status})`
      }
    } else if (error.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
  }
}

async function confirmDelete() {
  try {
    if (!selectedCategory.value?.categoryId) {
      ElMessage.warning('삭제할 카테고리를 선택해주세요.')
      showDeleteModal.value = false
      return
    }

    await categoryApi.delete(selectedCategory.value.categoryId)
    ElMessage.success('카테고리가 삭제되었습니다.')
    showDeleteModal.value = false
    await loadCategories()
  } catch (error) {
    console.error('카테고리 삭제 실패:', error)

    let errorMessage = '카테고리 삭제에 실패했습니다.'

    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      if (status === 403) {
        errorMessage = data?.message || '카테고리 삭제 권한이 없습니다.'
      } else if (status === 404) {
        errorMessage = data?.message || '카테고리를 찾을 수 없습니다.'
      } else if (status === 409) {
        errorMessage = data?.message || '카테고리를 사용 중이어서 삭제할 수 없습니다.'
      } else {
        errorMessage = data?.message || `카테고리 삭제에 실패했습니다. (${status})`
      }
    } else if (error.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
  }
}

function openCreateModal() {
  showCreateModal.value = true
}

function editCategory(c) {
  editTarget.value = { ...c }
  showEditModal.value = true
}

function deleteCategory(c) {
  selectedCategory.value = c
  showDeleteModal.value = true
}

function goAsset() {
  router.push('/admin/assets/list')
}
onMounted(loadCategories)
</script>

<style scoped>
.page-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.bottom-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.asset-btn {
  padding: 10px 18px;
  background: #ddd;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.create-btn {
  padding: 10px 18px;
  background: #c7dbcc;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>
