<!-- file: src/views/admin/asset/AssetEditView.vue -->
<template>
  <div>
    <AssetForm
      v-if="form"
      :initialData="form"
      submitText="자원 수정"
      :onSubmit="updateAsset"
      :isEdit="true"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AssetForm from './components/AssetForm.vue'
import { assetApi } from '@/api/assetApi.js'

const route = useRoute()
const router = useRouter()

const assetId = route.params.assetId

// 초기값 (불러오기 전)
const form = ref(null)

// 🔹 자원 상세 불러오기
async function loadDetail() {
  try {
    if (!assetId || isNaN(assetId)) {
      ElMessage.error('유효하지 않은 자원 ID입니다.')
      router.push('/admin/assets')
      return
    }

    const res = await assetApi.getDetail(assetId)

    if (!res?.data) {
      ElMessage.error('자원 정보를 불러올 수 없습니다.')
      router.push('/admin/assets')
      return
    }

    form.value = {
      parentName: res.data.parentName || '',
      categoryId: res.data.categoryId,
      name: res.data.name || '',
      description: res.data.description || '',
      image: res.data.image || '',
      status: res.data.status, // 문자열 "AVAILABLE" 등
      type: res.data.type, // 문자열 "STATIC" 등
      accessLevel: res.data.accessLevel || 1,
      approvalStatus: res.data.approvalStatus ?? true,
      costPerHour: res.data.costPerHour || 0,
      periodCost: res.data.periodCost || 0,
    }
  } catch (err) {
    console.error('자원 정보 조회 실패:', err)

    let errorMessage = '자원 정보를 불러오는데 실패했습니다.'

    if (err.response) {
      const status = err.response.status
      const data = err.response.data

      if (status === 404) {
        errorMessage = data?.message || '자원을 찾을 수 없습니다.'
      } else if (status === 403) {
        errorMessage = data?.message || '자원 조회 권한이 없습니다.'
      } else {
        errorMessage = data?.message || `자원 정보를 불러오는데 실패했습니다. (${status})`
      }
    } else if (err.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
    router.push('/admin/assets')
  }
}

// 🔹 수정 요청
async function updateAsset(data) {
  try {
    // 유효성 검사
    if (!data.name || data.name.trim() === '') {
      ElMessage.warning('자원명을 입력해주세요.')
      return
    }

    if (!data.categoryId) {
      ElMessage.warning('카테고리를 선택해주세요.')
      return
    }

    if (!assetId || isNaN(assetId)) {
      ElMessage.error('유효하지 않은 자원 ID입니다.')
      return
    }

    const payload = {
      parentName: data.parentName || '',
      categoryId: Number(data.categoryId),
      name: data.name.trim(),
      description: data.description || '',
      image: data.image || '',
      status: data.status, // 문자열 그대로
      type: data.type, // 문자열 그대로
      accessLevel: Number(data.accessLevel) || 1,
      approvalStatus: Boolean(data.approvalStatus),
      costPerHour: Number(data.costPerHour) || 0,
      periodCost: Number(data.periodCost) || 0,
    }

    await assetApi.update(assetId, payload)
    ElMessage.success('자원이 수정되었습니다.')
    router.push('/admin/assets')
  } catch (err) {
    console.error('자원 수정 실패:', err)

    let errorMessage = '자원 수정에 실패했습니다.'

    if (err.response) {
      const status = err.response.status
      const data = err.response.data

      if (status === 400) {
        errorMessage = data?.message || '입력 정보가 올바르지 않습니다. 확인해주세요.'
      } else if (status === 403) {
        errorMessage = data?.message || '자원 수정 권한이 없습니다.'
      } else if (status === 404) {
        errorMessage = data?.message || '자원을 찾을 수 없습니다.'
      } else if (status === 409) {
        errorMessage = data?.message || '충돌이 발생했습니다. 다시 시도해주세요.'
      } else {
        errorMessage = data?.message || `자원 수정에 실패했습니다. (${status})`
      }
    } else if (err.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
  }
}

onMounted(loadDetail)
</script>
