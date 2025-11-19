<!-- file: src/layouts/HomeLayout.vue -->
<script setup>
import { ref } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { RouterView } from 'vue-router'

const isSidebarOpen = ref(false)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<template>
  <div class="layout">

    <AppHeader @toggle-sidebar="toggleSidebar" />

    <div class="main">
      <AppSidebar :open="isSidebarOpen" />

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

.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 본문 영역 */
.content {
  flex: 1;
  background: #ffffff;
  padding: 30px;
  overflow-y: auto;
}
</style>
