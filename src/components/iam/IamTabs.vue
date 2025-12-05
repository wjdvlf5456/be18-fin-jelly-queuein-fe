<template>
  <div class="iam-tabs">
    <button
      v-for="t in tabs"
      :key="t.to"
      :class="['tab', { active: isActive(t.to) }]"
      @click="go(t.to)"
    >
      <i :class="t.icon"></i>
      {{ t.label }}
    </button>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { label: '사용자', to: '/admin/users', icon: 'pi pi-user' },
  { label: '역할', to: '/admin/roles', icon: 'pi pi-shield' },
  { label: '권한', to: '/admin/permissions/matrix', icon: 'pi pi-key' }
]

function go(path) {
  router.push(path)
}

function isActive(path) {
  return route.path.startsWith(path)
}
</script>

<style scoped>
.iam-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tab {
  background: #f3f3f3;
  border: 1px solid #ddd;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab.active {
  background: #e1e7ff;
  border-color: #6b84ff;
  color: #4a5bdc;
}
</style>
