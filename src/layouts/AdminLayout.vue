<!-- file: src/layouts/AdminLayout.vue -->
<script setup>
import { ref } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { RouterView } from 'vue-router'

const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="layout">
    <AppHeader @toggle-sidebar="toggleSidebar" />

    <div class="body">
      <AppSidebar :open="sidebarOpen" />

      <main class="content">
        <RouterView />
      </main>
    </div>

    <AppFooter />
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.body {
  display: flex;
  flex: 1;
}

.content {
  flex: 1;
  padding: 30px;
  background: white;
  overflow-y: auto;
}
</style>
