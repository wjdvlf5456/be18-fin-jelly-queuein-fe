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
            selected: selected.includes(h-1),
            dragging: isDragging && isInDragRange(h-1),
            'click-start': clickStartIndex === h-1,
            'click-end': clickEndIndex === h-1
          }"
          :data-hour-index="h-1"
          @mousedown="onMouseDown(h-1, $event)"
          @mouseenter="onMouseEnter(h-1)"
          @mouseup="onMouseUp"
          @click="onBlockClick(h-1, $event)"
        ></div>

    </div>
  </div>


</template>

<script setup>
import { ref, watch } from 'vue'

// 반드시 여기 있어야 template에서 인식됨
const hours = Array.from({ length: 24 }, (_, i) => i)

const props = defineProps({
  blocks: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])
const selected = ref([...(props.modelValue || [])])

// 부모가 v-model 업데이트하면 동기화
watch(() => props.modelValue, val => selected.value = [...(val || [])])

// 드래그 관련 상태
const isDragging = ref(false)
const dragStart = ref(null)
const dragEnd = ref(null)
const hasDragged = ref(false) // 실제로 드래그가 발생했는지 추적
const mouseDownTime = ref(0)
const mouseDownPosition = ref({ x: 0, y: 0 })

// 클릭 기반 범위 선택 상태
const clickStartIndex = ref(null)
const clickEndIndex = ref(null)

// 예약 블록인지 확인
const isReserved = (h) => {
  return props.blocks.some(b => b.type === 'reserved' && h >= b.start && h < b.end)
}

// 드래그 범위에 포함되는지 확인
const isInDragRange = (h) => {
  if (dragStart.value === null || dragEnd.value === null) return false
  const start = Math.min(dragStart.value, dragEnd.value)
  const end = Math.max(dragStart.value, dragEnd.value)
  return h >= start && h <= end
}

// 마우스 다운
const onMouseDown = (h, event) => {
  if (isReserved(h)) return
  
  event.stopPropagation()
  
  // 드래그 시작 시 클릭 선택 리셋
  resetClickSelection()
  
  // 드래그 상태 초기화
  isDragging.value = true
  hasDragged.value = false
  dragStart.value = h
  dragEnd.value = h
  mouseDownTime.value = Date.now()
  mouseDownPosition.value = { x: event.clientX, y: event.clientY }
  
  // 마우스가 블록 밖으로 나가도 계속 추적
  document.addEventListener('mousemove', onDocumentMouseMove)
  document.addEventListener('mouseup', onDocumentMouseUp)
}

// 문서 전체 마우스 이동 (드래그 중)
const onDocumentMouseMove = (event) => {
  if (!isDragging.value) return
  
  // 마우스가 충분히 이동했는지 확인 (드래그로 간주)
  const moveDistance = Math.abs(event.clientX - mouseDownPosition.value.x) + 
                       Math.abs(event.clientY - mouseDownPosition.value.y)
  
  if (moveDistance > 3) {
    hasDragged.value = true // 실제 드래그 발생
  }
  
  // 마우스 위치에 해당하는 블록 찾기
  const blocks = document.querySelectorAll('.time-blocks .block')
  let targetHour = null
  
  blocks.forEach((block, index) => {
    const rect = block.getBoundingClientRect()
    if (event.clientX >= rect.left && event.clientX <= rect.right) {
      targetHour = index
    }
  })
  
  if (targetHour !== null && !isReserved(targetHour)) {
    dragEnd.value = targetHour
    updateSelectionFromDrag()
  }
}

// 문서 전체 마우스 업
const onDocumentMouseUp = () => {
  const wasDragging = isDragging.value
  const didDrag = hasDragged.value
  
  if (wasDragging) {
    isDragging.value = false
    dragStart.value = null
    dragEnd.value = null
    
    // 실제로 드래그가 발생했으면 클릭 선택 리셋
    if (didDrag) {
      resetClickSelection()
    }
  }
  
  // 약간의 지연 후 hasDragged 리셋 (클릭 이벤트 처리 후)
  setTimeout(() => {
    hasDragged.value = false
  }, 10)
  
  document.removeEventListener('mousemove', onDocumentMouseMove)
  document.removeEventListener('mouseup', onDocumentMouseUp)
}

// 클릭 선택 리셋
const resetClickSelection = () => {
  clickStartIndex.value = null
  clickEndIndex.value = null
}

// 블록 위에서 마우스 이동
const onMouseEnter = (h) => {
  if (isDragging.value && !isReserved(h)) {
    dragEnd.value = h
    updateSelectionFromDrag()
  }
}

// 블록 클릭 (드래그가 아닐 때만)
const onBlockClick = (h, event) => {
  event.stopPropagation()
  
  // 실제로 드래그가 발생했으면 클릭 무시
  if (hasDragged.value) {
    return
  }
  
  // 드래그 중이면 클릭 무시
  if (isDragging.value) {
    return
  }
  
  // 예약 불가능한 블록 클릭 무시
  if (isReserved(h)) return
  
  // 클릭 기반 범위 선택 로직
  if (clickStartIndex.value === null) {
    // 첫 번째 클릭: 시작 블록 설정
    clickStartIndex.value = h
    clickEndIndex.value = null
    selected.value = [h]
    emit('update:modelValue', selected.value)
  } else if (clickEndIndex.value === null) {
    // 두 번째 클릭: 끝 블록 설정 (범위 완성)
    clickEndIndex.value = h
    
    // 시작과 끝 사이의 모든 블록 선택 (앞뒤 방향 모두 지원)
    const start = Math.min(clickStartIndex.value, clickEndIndex.value)
    const end = Math.max(clickStartIndex.value, clickEndIndex.value)
    
    const range = []
    for (let i = start; i <= end; i++) {
      if (!isReserved(i)) {
        range.push(i)
      }
    }
    
    selected.value = range
    emit('update:modelValue', selected.value)
  } else {
    // 세 번째 클릭: 리셋하고 새 범위 시작
    clickStartIndex.value = h
    clickEndIndex.value = null
    selected.value = [h]
    emit('update:modelValue', selected.value)
  }
}

// 드래그로 선택 업데이트
const updateSelectionFromDrag = () => {
  if (dragStart.value === null || dragEnd.value === null) return
  
  // 드래그 중에는 클릭 선택 리셋
  resetClickSelection()
  
  const start = Math.min(dragStart.value, dragEnd.value)
  const end = Math.max(dragStart.value, dragEnd.value)
  
  const range = []
  for (let i = start; i <= end; i++) {
    if (!isReserved(i)) {
      range.push(i)
    }
  }
  
  selected.value = range
  emit('update:modelValue', selected.value)
}

// 마우스 업
const onMouseUp = () => {
  const wasDragging = isDragging.value
  const didDrag = hasDragged.value
  
  if (wasDragging) {
    isDragging.value = false
    dragStart.value = null
    dragEnd.value = null
    
    // 실제로 드래그가 발생했으면 클릭 선택 리셋
    if (didDrag) {
      resetClickSelection()
    }
  }
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

.block.dragging {
  background: #9bc497;
  opacity: 0.8;
}

.block.click-start {
  background: #7ba678;
  box-shadow: 0 0 0 2px #5a8a57;
}

.block.click-end {
  background: #7ba678;
  box-shadow: 0 0 0 2px #5a8a57;
}

.block.click-start.click-end {
  background: #5a8a57;
  box-shadow: 0 0 0 3px #4a7a47;
}

.divider {
  width: 100%;
  border-bottom: 4px solid #eaeaea;
  margin: 6px 0 16px 0;
}
</style>
