<template>
  <div class="asset-form-wrapper">
    <h2 class="title">{{ submitText }}</h2>

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

        <!-- 이미지 업로드 -->
        <tr>
          <th>이미지</th>
          <td>
            <S3ImageUploader v-model="form.image" />
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
import S3ImageUploader from '@/components/common/S3ImageUploader.vue'

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
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 32px;
  color: #1f2937;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.form-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

th {
  width: 250px;
  background: linear-gradient(135deg, #b9cdb4 0%, #a8c09f 100%);
  padding: 16px 20px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
}

td {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: white;
}

.input:focus {
  outline: none;
  border-color: #00a950;
  box-shadow: 0 0 0 3px rgba(0, 169, 80, 0.1);
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
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  resize: vertical;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
  background: white;
}

.textarea:focus {
  outline: none;
  border-color: #00a950;
  box-shadow: 0 0 0 3px rgba(0, 169, 80, 0.1);
}

.btn-wrapper {
  text-align: right;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.submit-btn {
  padding: 12px 32px;
  border: none;
  background: linear-gradient(135deg, #00a950 0%, #10b981 100%);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 169, 80, 0.2);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 169, 80, 0.3);
}

.submit-btn:active {
  transform: translateY(0);
}
</style>
