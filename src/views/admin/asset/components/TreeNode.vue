<template>
  <li>
    <!-- 노드 라인 -->
    <div
      class="node-row"
      :class="{ selected: isSelected }"
      @click="toggle"
      @dblclick.stop="openDetail"
    >
      <!-- 삼각형 아이콘 -->
      <span class="arrow" v-if="hasChildren">
        <svg :class="{ open: open }" width="10" height="10" viewBox="0 0 20 20">
          <polygon points="6,4 14,10 6,16" fill="#666" />
        </svg>
      </span>

      <span class="dot" v-else></span>

      <!-- 자원 이름 -->
      <span class="node-name">
        {{ node.name }}
      </span>
    </div>

    <!-- children -->
    <ul v-if="open" class="children">
      <TreeNode
        v-for="child in node.children"
        :key="child.assetId"
        :node="child"
        :currentId="currentId"
        @openDetail="$emit('openDetail', $event)"
      />
    </ul>
  </li>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  node: Object,
  currentId: [Number, Object],
})

const emit = defineEmits(['openDetail'])

const open = ref(false)
const hasChildren = props.node.children?.length > 0

const isSelected = computed(() => {
  const cur = props.currentId?.value ?? props.currentId
  return props.node.assetId == cur
})

function toggle() {
  if (hasChildren) open.value = !open.value
}

function openDetail() {
  emit('openDetail', props.node.assetId)
}
</script>

<style scoped>
.node-row {
  display: flex;
  align-items: center;
  padding: 4px 6px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s ease;
}

.node-row:hover {
  background: #f5f7f5;
}

.node-row.selected {
  background: #e6f3e6;
  font-weight: 600;
  border-radius: 4px;
}

.arrow {
  display: flex;
  width: 16px;
}

.arrow svg {
  transition: transform 0.15s ease;
}

.arrow svg.open {
  transform: rotate(90deg);
}

.dot {
  width: 16px;
}

.node-name {
  margin-left: 4px;
  font-size: 14px;
  color: #333;
}

.children {
  margin-left: 20px;
  border-left: 1px dashed #d3d3d3;
  padding-left: 10px;
}

ul,
li {
  list-style: none !important;
  margin: 0;
  padding: 0;
}
</style>
