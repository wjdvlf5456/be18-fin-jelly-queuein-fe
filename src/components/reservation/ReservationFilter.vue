<template>
  <el-row :gutter="12" class="filter-row">
    <!-- 날짜 선택 (Element Plus 유지) -->

    <div class="filters">
      <el-col :span="4">
        <el-date-picker
          v-model="filters.date"
          type="date"
          placeholder="날짜 선택"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="emitChange"
        />
      </el-col>
      <div class="cell">
        <RootDropDownMenu v-model="filters.layerZero" @update:modelValue="onBuildingChange">
          <option value="">전체</option>
          <!-- 전체 옵션 추가 -->
        </RootDropDownMenu>
      </div>
      <div class="cell">
        <OneDepthDropDownMenu
          v-model="filters.layerOne"
          :buildingId="filters.layerZero"
          @update:modelValue="emitChange"
        />
      </div>
      <div class="cell">
        <CategoryDropDownMenu v-model="filters.categoryId" @update:modelValue="emitChange" />
      </div>
      <div class="cell">
        <AssetTypeDropdown v-model="filters.assetType" @update:modelValue="emitChange" />
      </div>
      <div class="cell search-box">
        <el-input v-model="filters.assetName" placeholder="자원명 검색" />
      </div>

      <button class="search-btn" @click="onSearch">검색</button>
    </div>

    <!-- 자원 유형 -->
    <!-- <el-col :span="4">
      <AssetTypeDropdown
        v-model="filters.assetType"
        placeholder="자원 유형"
        @update:modelValue="emitChange"
      />
    </el-col> -->

    <!-- 자원 상태 -->
    <!-- <el-col :span="4">
      <AssetStatusDropdown
        v-model="filters.assetStatus"
        placeholder="자원 상태"
        @update:modelValue="emitChange"
      />
    </el-col> -->

    <!-- 카테고리 -->
    <!-- <el-col :span="4">
      <CategoryDropdown
        v-model="filters.categoryName"
        placeholder="카테고리"
        @update:modelValue="emitChange"
      />
    </el-col> -->

    <!-- 1계층 (위치: 사옥 선택 시 활성화) -->
    <!-- <el-col :span="4">
      <LocationDropdown
        v-model="filters.layerOne"
        :buildingId="filters.layerZero"
        @update:modelValue="emitChange"
      />
    </el-col> -->

    <!-- 0계층 (사옥) -->
    <!-- <el-col :span="4">
      <BuildingDropdown v-model="filters.layerZero" @update:modelValue="onBuildingChange" />
    </el-col> -->
  </el-row>
</template>

<script setup>
import { ref, watch } from 'vue'

import AssetTypeDropdown from '@/components/common/AssetTypeDropdown.vue'
import CategoryDropDownMenu from '@/components/common/CategoryDropDownMenu.vue'
import OneDepthDropDownMenu from '@/components/common/OneDepthDropDownMenu.vue'
import RootDropDownMenu from '@/components/common/RootDropDownMenu.vue'

// 부모에게 필터 변경 emit
const emit = defineEmits(['change'])
const today = new Date().toLocaleDateString('en-CA')

const filters = ref({
  date: today,
  assetType: '',
  assetStatus: '',
  categoryId: '',
  layerZero: '',
  layerOne: '',
  assetName: '',
})

function emitChange() {
  emit('change', { ...filters.value })
}

// 건물(0계층) 변경 시 위치 초기화 + emit
function onBuildingChange(val) {
  filters.value.layerZero = val
  // 0계층이 "전체"로 변경되면 1계층 초기화
  if (!val || val === '') {
    filters.value.layerOne = '' // 위치 초기화
  }
  emitChange()
}

// 검색 버튼 클릭 시 emit
function onSearch() {
  emitChange()
}

// 날짜는 초기 로드시 바로 emit
watch(
  () => filters.value.date,
  () => emitChange(),
  { immediate: true },
)
</script>

<style scoped>
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0;
}

/* 모든 el-col은 동일 크기로 강제 */
.filter-row > .el-col {
  flex: 1;
  min-width: 180px;
  box-sizing: border-box;
}

/* 내부 요소 모두 width 100% */
.filter-row :deep(.el-select),
.filter-row :deep(.el-date-editor),
.filter-row :deep(.el-input),
.filter-row :deep(.el-input__wrapper),
.filter-row :deep(.el-input__inner) {
  width: 100% !important;
  box-sizing: border-box;
}

/* 드롭다운 내부도 padding 균일하게 */
.filter-row :deep(.el-input__wrapper) {
  padding-left: 12px !important;
  padding-right: 12px !important;
}

/* 반응형: 화면이 좁아지면 3등분 */
@media (max-width: 1200px) {
  .filter-row > .el-col {
    flex: 1 1 calc(33.33% - 12px); /* 한 줄에 3개 */
  }
}

/* 더 좁아지면 2등분 */
@media (max-width: 900px) {
  .filter-row > .el-col {
    flex: 1 1 calc(50% - 12px); /* 한 줄에 2개 */
  }
}

/* 모바일: 1개씩 */
@media (max-width: 600px) {
  .filter-row > .el-col {
    flex: 1 1 100%; /* 한 줄에 하나 */
  }
}

/* 필터 영역 */
.filters {
  display: flex;
  gap: 12px;
  width: 100%;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

/* 드롭다운/검색창 공통 비율 */
.cell {
  flex: 1; /* 비율 기반으로 확대/축소 */
  min-width: 120px; /* 최소 폭만 지정 */
}

/* 드롭다운 내부의 select 는 셀 폭에 맞게 꽉 채움 */
.cell select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.2s ease;
}

.cell select:focus {
  outline: none;
  border-color: #00a950;
  box-shadow: 0 0 0 3px rgba(0, 169, 80, 0.1);
}

/* 검색 입력창 비율 처리 */
.search-box input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #00a950;
  box-shadow: 0 0 0 3px rgba(0, 169, 80, 0.1);
}

/* 검색 버튼은 고정폭 */
.search-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #00a950 0%, #10b981 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 169, 80, 0.2);
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 169, 80, 0.3);
}

.search-btn:active {
  transform: translateY(0);
}
</style>
