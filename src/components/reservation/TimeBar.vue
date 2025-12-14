<template>
  <div class="time-bar-wrapper">
    <div class="time-labels">
      <div class="label">시간</div>
      <div
        v-for="h in hours"
        :key="h"
        class="hour-label"
      >
        {{ h  }}
      </div>
    </div>

    <div class="divider"></div>

    <div class="time-blocks">
      <div class="label">예약 현황</div>
        <div
          v-for="h in 24"
          :key="h"
          class="block"
          :class="{
            available: blocks[h-1]?.type === 'available',
            reserved: blocks[h-1]?.type === 'reserved',
            selected: selected.includes(h-1)
          }"
          @click="toggleHour(h-1)"
        ></div>

    </div>
  </div>


</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue'

interface Block {
  label: string
  type: 'reserved' | 'available'
  start: number
  end: number
}

// 반드시 여기 있어야 template에서 인식됨
const hours = Array.from({ length: 24 }, (_, i) => i)

const props = defineProps<{
  blocks: Block[]
  modelValue?: number[]
}>()

const emit = defineEmits(['update:modelValue'])
const selected = ref<number[]>([...(props.modelValue || [])])

// 부모가 v-model 업데이트하면 동기화
watch(() => props.modelValue, val => selected.value = [...(val || [])])

// 예약 블록인지 확인
const isReserved = (h: number) => props.blocks.some(b => b.type === 'reserved' && h >= b.start && h < b.end)

// 연속 선택 토글
const toggleHour = (h: number) => {
  if (isReserved(h)) return

  // 이미 선택된 시간 클릭 → 해제
  if (selected.value.includes(h)) {
    selected.value = selected.value.filter(v => v !== h)
    emit('update:modelValue', selected.value)
    return
  }

  // 선택된 것이 아무것도 없으면 처음 추가
  if (selected.value.length === 0) {
    selected.value.push(h)
  } else {
    const min = Math.min(...selected.value)
    const max = Math.max(...selected.value)

    // 연속 확장
    if (h === min - 1) selected.value.unshift(h)
    else if (h === max + 1) selected.value.push(h)
    else selected.value = [h]  // 비연속 → 새로 시작
  }

  emit('update:modelValue', selected.value)
}

</script>

<style scoped>
.time-bar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-labels,
.time-blocks {
  display: flex;
  align-items: center;
}

.label {
  width: 90px;
  font-weight: 600;
  background: #cfe3ca;
  padding: 14px;
  border-radius: 4px;
  text-align: center;
  margin-right: 4px;
}

.hour-label,
.block {
  flex: 1;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 2px;
  border-radius: 4px;
  font-size: 12px;
}

.block {
  cursor: pointer;
  background: #e6f0e6;
}

.block.reserved {
  background: #ccc;
  cursor: not-allowed;
}

.block.selected {
  background: #b6ceb4;
}

.divider {
  width: 100%;
  border-bottom: 4px solid #eaeaea;
  margin: 6px 0 16px 0;
}
</style>
