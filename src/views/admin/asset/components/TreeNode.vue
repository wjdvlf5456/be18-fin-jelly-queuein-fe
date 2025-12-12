<template>
  <li>
    <!-- 노드 라인 -->
    <div
      class="node-row"
      :class="{ selected: isSelected, 'has-children': hasChildren }"
      @click="handleClick"
      @dblclick.stop="openDetail"
    >
      <!-- 삼각형 아이콘 -->
      <span class="arrow" v-if="hasChildren">
        <svg :class="{ open: isOpen }" width="10" height="10" viewBox="0 0 20 20">
          <polygon points="6,4 14,10 6,16" fill="#666" />
        </svg>
      </span>

      <span class="dot" v-else></span>

      <!-- 자원 이름 -->
      <span class="node-name">
        {{ node.name }}
      </span>
    </div>

    <!-- children with smooth animation -->
    <Transition name="tree-expand">
      <ul v-if="isOpen && hasChildren" class="children">
        <TreeNode
          v-for="child in node.children"
          :key="child.assetId"
          :node="child"
          :currentId="currentId"
          :expandAll="expandAll"
          @openDetail="$emit('openDetail', $event)"
        />
      </ul>
    </Transition>
  </li>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  node: Object,
  currentId: [Number, Object],
  expandAll: {
    type: Boolean,
    default: undefined, // undefined면 자체 상태 관리, true/false면 부모 제어
  },
})

const emit = defineEmits(['openDetail'])

const open = ref(false)
const hasChildren = computed(() => props.node.children?.length > 0)

// expandAll이 명시되면 부모 제어, 아니면 자체 상태
const isOpen = computed(() => {
  if (props.expandAll !== undefined) {
    return props.expandAll
  }
  return open.value
})

const isSelected = computed(() => {
  const cur = props.currentId?.value ?? props.currentId
  return props.node.assetId == cur
})

function handleClick() {
  if (hasChildren.value) {
    // expandAll이 undefined일 때만 자체 토글
    if (props.expandAll === undefined) {
      open.value = !open.value
    }
  } else {
    // 자식이 없으면 상세 페이지로 이동
    openDetail()
  }
}

function openDetail() {
  emit('openDetail', props.node.assetId)
}
</script>

<style scoped>
.node-row {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  user-select: none;
}

.node-row:hover {
  background: #f0f7f4;
  transform: translateX(2px);
}

.node-row.selected {
  background: #e6f3e6;
  font-weight: 600;
  color: #2d5016;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.node-row.has-children {
  font-weight: 500;
}

.arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-right: 2px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.arrow svg {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

.arrow svg.open {
  transform: rotate(90deg);
}

.dot {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dot::before {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #94a3b8;
}

.node-name {
  margin-left: 4px;
  font-size: 14px;
  color: #333;
  flex: 1;
}

.children {
  margin-left: 24px;
  border-left: 2px solid #e2e8f0;
  padding-left: 12px;
  overflow: hidden;
}

/* 부드러운 펼치기/접기 애니메이션 */
.tree-expand-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.tree-expand-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.tree-expand-enter-from {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.tree-expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-5px);
}

.tree-expand-enter-to,
.tree-expand-leave-from {
  opacity: 1;
  max-height: 2000px;
  transform: translateY(0);
}

ul,
li {
  list-style: none !important;
  margin: 0;
  padding: 0;
}
</style>
