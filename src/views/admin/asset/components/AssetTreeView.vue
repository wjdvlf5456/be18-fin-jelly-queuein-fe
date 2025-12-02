<template>
  <div class="tree-container">
    <ul class="tree-root">
      <TreeNode
        v-for="node in tree"
        :key="node.assetId"
        :node="node"
        :currentId="currentId"
        @openDetail="openDetail"
      />
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import TreeNode from './TreeNode.vue'
import { assetApi } from '@/api/assetApi'
import { useRouter } from 'vue-router'

const router = useRouter()
const tree = ref([])

const props = defineProps({
  currentId: [Number, Object], // ref 지원
})

async function loadTree() {
  const res = await assetApi.getTree()
  tree.value = res.data
}

function openDetail(assetId) {
  router.push(`/admin/assets/${assetId}`)
}

onMounted(loadTree)
</script>

<style scoped>
.tree-container {
  width: 100%;
  padding: 10px;
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
