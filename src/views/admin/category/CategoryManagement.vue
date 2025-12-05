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
      <el-button type="success" @click="openCreateModal">카테고리 생성</el-button>
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
import { categoryApi } from '@/api/categoryApi'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import CategoryFormModal from './CategoryFormModal.vue'

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
  const res = await categoryApi.getManagementList(page.value, size.value)
  categories.value = res.data.content
  total.value = res.data.totalElements
}

function changePage(newPage) {
  page.value = newPage - 1
  loadCategories()
}

async function createCategory(data) {
  await categoryApi.create(data)
  alert('카테고리가 생성되었습니다.')
  showCreateModal.value = false
  loadCategories()
}

async function updateCategory(data) {
  await categoryApi.update(editTarget.value.categoryId, data)
  alert('카테고리가 수정되었습니다.')
  showEditModal.value = false
  loadCategories()
}

async function confirmDelete() {
  await categoryApi.delete(selectedCategory.value.categoryId)
  showDeleteModal.value = false
  loadCategories()
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
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
