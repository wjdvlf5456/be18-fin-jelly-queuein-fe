<template>
  <div>
    <AssetForm :initialData="defaultForm" submitText="자원 생성" :onSubmit="createAsset" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AssetForm from './components/AssetForm.vue'
import { assetApi } from '@/api/assetApi.js'
import { ref } from 'vue'

const router = useRouter()

// 생성할 때 사용하는 기본 폼 값
const defaultForm = ref({
  parentName: '',
  name: '',
  categoryId: null,
  type: '',
  status: '',
  available: true,
  approved: true,
  approvalLevel: 1,
  pricePerHour: 0,
  fixedCost: 0,
  description: '',
  image: '',
})

async function createAsset(data) {
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

    const payload = {
      parentName: data.parentName || '',
      categoryId: data.categoryId,
      name: data.name.trim(),
      description: data.description || '',
      image: data.image || '',
      status: data.status,
      type: data.type,
      accessLevel: Number(data.accessLevel) || 1,
      approvalStatus: Boolean(data.approvalStatus),
      costPerHour: Number(data.costPerHour) || 0,
      periodCost: Number(data.periodCost) || 0,
    }

    await assetApi.create(payload)
    ElMessage.success('자원이 생성되었습니다.')
    router.push('/admin/assets')
  } catch (error) {
    console.error('자원 생성 실패:', error)

    let errorMessage = '자원 생성에 실패했습니다.'

    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      if (status === 400) {
        errorMessage = data?.message || '입력 정보가 올바르지 않습니다. 확인해주세요.'
      } else if (status === 403) {
        errorMessage = data?.message || '자원 생성 권한이 없습니다.'
      } else if (status === 409) {
        errorMessage = data?.message || '이미 존재하는 자원입니다.'
      } else {
        errorMessage = data?.message || `자원 생성에 실패했습니다. (${status})`
      }
    } else if (error.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
  }
}
</script>
