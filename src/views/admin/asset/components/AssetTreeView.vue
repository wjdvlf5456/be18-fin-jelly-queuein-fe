<template>
  <div class="tree-container">
    <!-- 컨트롤 버튼 -->
    <div class="tree-controls">
      <button class="control-btn" @click="expandAll" :disabled="isAllExpanded">
        <i class="ri-folder-open-line"></i>
        전체 펼치기
      </button>
      <button class="control-btn" @click="collapseAll" :disabled="!isAllExpanded">
        <i class="ri-folder-close-line"></i>
        전체 접기
      </button>
    </div>

    <!-- 트리 -->
    <ul class="tree-root">
      <TreeNode
        v-for="node in tree"
        :key="node.assetId"
        :node="node"
        :currentId="currentId"
        :expandAll="expandState"
        @openDetail="openDetail"
      />
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import TreeNode from './TreeNode.vue'
import { assetApi } from '@/api/assetApi'
import { useRouter } from 'vue-router'

const router = useRouter()
const tree = ref([])
const expandState = ref(undefined) // undefined = 자체 제어, true/false = 전체 제어

const props = defineProps({
  currentId: [Number, Object], // ref 지원
})

const isAllExpanded = computed(() => expandState.value === true)

async function loadTree() {
  const res = await assetApi.getTree()
  tree.value = res.data
}

function expandAll() {
  expandState.value = true
}

function collapseAll() {
  expandState.value = false
  // 잠시 후 자체 제어로 복귀 (사용자가 개별 토글 가능하도록)
  setTimeout(() => {
    expandState.value = undefined
  }, 350) // 애니메이션 완료 후
}

function openDetail(assetId) {
  router.push(`/admin/assets/${assetId}`)
}

onMounted(loadTree)
</script>

<style scoped>
.tree-container {
  width: 100%;
  padding: 12px;
}

.tree-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: #667eea;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn i {
  font-size: 14px;
}

.tree-root {
  list-style: none;
  padding-left: 0;
}

.tree-root,
.tree-root ul,
.tree-root li {
  list-style: none !important;
  margin: 0;
  padding: 0;
}
</style>
