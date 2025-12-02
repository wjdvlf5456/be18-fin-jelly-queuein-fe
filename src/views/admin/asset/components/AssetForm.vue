<template>
  <div class="asset-form-wrapper">
    <h2 class="title">자원 생성</h2>

    <table class="form-table">
      <tbody>
        <!-- 자원명 -->
        <tr>
          <th>자원 명</th>
          <td>
            <input v-model="form.name" class="input" placeholder="자원 이름을 입력하세요" />
          </td>
        </tr>

        <!-- 부모 자원 -->
        <tr>
          <th>부모 자원 명</th>
          <td>
            <input
              v-model="form.parentName"
              class="input readonly-input"
              :readonly="props.isEdit"
              :disabled="props.isEdit"
              placeholder="부모 자원 이름을 입력하세요"
            />
          </td>
        </tr>

        <!-- 카테고리 -->
        <tr>
          <th>카테고리</th>
          <td>
            <CategoryDropDownMenu v-model="form.categoryId" />
          </td>
        </tr>

        <!-- 자원 상태 -->
        <tr>
          <th>자원 상태</th>
          <td>
            <AssetStatusDropdown v-model="form.status" />
          </td>
        </tr>

        <!-- 자원 유형 -->
        <tr>
          <th>자원 유형</th>
          <td>
            <AssetTypeDropdown v-model="form.type" />
          </td>
        </tr>

        <!-- 인가 단계 -->
        <tr>
          <th>인가 단계 (accessLevel)</th>
          <td>
            <input
              v-model="form.accessLevel"
              class="input"
              type="number"
              placeholder="1 ~ 3 등급"
            />
          </td>
        </tr>

        <!-- 승인 필요 여부 -->
        <tr>
          <th>승인 필요 여부</th>
          <td>
            <select v-model="form.approvalStatus" class="input">
              <option :value="true">승인 필요</option>
              <option :value="false">승인 불필요</option>
            </select>
          </td>
        </tr>

        <!-- 시간당 비용 -->
        <tr>
          <th>시간당 청구 비용</th>
          <td>
            <input v-model="form.costPerHour" class="input" type="number" placeholder="예: 10000" />
          </td>
        </tr>

        <!-- 고정 비용 -->
        <tr>
          <th>고정 비용</th>
          <td>
            <input v-model="form.periodCost" class="input" type="number" placeholder="예: 30000" />
          </td>
        </tr>

        <!-- 이미지 URL -->
        <tr>
          <th>이미지 URL</th>
          <td>
            <input v-model="form.image" class="input" placeholder="https://example.com/asset.jpg" />
          </td>
        </tr>

        <!-- 설명 -->
        <tr>
          <th>자원 설명</th>
          <td>
            <textarea
              v-model="form.description"
              class="textarea"
              placeholder="자원에 대한 설명을 입력하세요"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <div class="btn-wrapper">
      <button class="submit-btn" @click="submit">{{ submitText }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CategoryDropDownMenu from '@/components/common/CategoryDropDownMenu.vue'
import AssetStatusDropdown from '@/components/common/AssetStatusDropdown.vue'
import AssetTypeDropdown from '@/components/common/AssetTypeDropdown.vue'

const props = defineProps({
  initialData: { type: Object, default: () => ({}) },
  submitText: { type: String, default: '자원 생성' },
  onSubmit: { type: Function },
  isEdit: { type: Boolean, default: false },
})

// 초기값 세팅
const form = ref({
  parentName: props.initialData.parentName ?? '',
  categoryId: props.initialData.categoryId ?? null,
  name: props.initialData.name ?? '',
  description: props.initialData.description ?? '',
  image: props.initialData.image ?? '',
  status: props.initialData.status ?? 1,
  type: props.initialData.type ?? 1,
  accessLevel: props.initialData.accessLevel ?? 1,
  approvalStatus: props.initialData.approvalStatus ?? true,
  costPerHour: props.initialData.costPerHour ?? 0,
  periodCost: props.initialData.periodCost ?? 0,
})

function submit() {
  props.onSubmit(form.value)
}
</script>

<style scoped>
.asset-form-wrapper {
  width: 100%;
}

.title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
}

.form-table {
  width: 100%;
  border-collapse: collapse;
}

th {
  width: 250px;
  background: #b9cdb4;
  padding: 14px;
  text-align: left;
  font-weight: 700;
  border-bottom: 1px solid #e8e8e8;
}

td {
  padding: 14px;
  border-bottom: 1px solid #e8e8e8;
}

.input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.readonly-input[disabled] {
  opacity: 0.6;
  background-color: #eaeaea;
  cursor: not-allowed;
  color: #555;
}

.textarea {
  width: 100%;
  height: 120px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  resize: none;
}

.btn-wrapper {
  text-align: right;
  margin-top: 20px;
}

.submit-btn {
  padding: 10px 20px;
  border: 1px solid #c7dbcc;
  background: #e6f0e6;
  border-radius: 6px;
  cursor: pointer;
}
</style>
