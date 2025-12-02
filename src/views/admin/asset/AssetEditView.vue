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
    const res = await assetApi.getDetail(assetId)
    console.log('수정 초기데이터:', res.data)

    form.value = {
      parentName: res.data.parentName,
      categoryId: res.data.categoryId,
      name: res.data.name,
      description: res.data.description,
      image: res.data.image,
      status: res.data.status, // 문자열 "AVAILABLE" 등
      type: res.data.type, // 문자열 "STATIC" 등
      accessLevel: res.data.accessLevel,
      approvalStatus: res.data.approvalStatus,
      costPerHour: res.data.costPerHour,
      periodCost: res.data.periodCost,
    }
  } catch (err) {
    console.error(err)
    alert('자원 정보를 불러오지 못했습니다.')
  }
}

// 🔹 수정 요청
async function updateAsset(data) {
  const payload = {
    parentName: data.parentName,
    categoryId: Number(data.categoryId),
    name: data.name,
    description: data.description,
    image: data.image,
    status: data.status, // 문자열 그대로
    type: data.type, // 문자열 그대로
    accessLevel: Number(data.accessLevel),
    approvalStatus: Boolean(data.approvalStatus),
    costPerHour: Number(data.costPerHour),
    periodCost: Number(data.periodCost),
  }

  try {
    await assetApi.update(assetId, payload)
    alert('자원이 수정되었습니다.')
    router.push('/admin/assets')
  } catch (err) {
    console.error(err)
    alert('수정 중 오류가 발생했습니다.')
  }
}

onMounted(loadDetail)
</script>
