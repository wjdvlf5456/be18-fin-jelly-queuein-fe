<script setup>
import { ref, computed } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { RouterView } from 'vue-router'

const isFixedOpen = ref(false)
const isHoverOpen = ref(false)

const isSidebarOpen = computed(() => isFixedOpen.value || isHoverOpen.value)

function toggleSidebar() {
  isFixedOpen.value = !isFixedOpen.value
}

function openHover() {
  if (!isFixedOpen.value) isHoverOpen.value = true
}

function closeHover() {
  if (!isFixedOpen.value) isHoverOpen.value = false
}
</script>

<template>
  <div class="layout">
    <AppHeader @toggle-sidebar="toggleSidebar" />

    <!-- 화면 어두워지는 오버레이 -->
    <div v-if="isSidebarOpen" class="overlay" @click="isFixedOpen = false"></div>

    <!-- 사이드바 -->
    <AppSidebar
      :open="isSidebarOpen"
      @hover-open="openHover"
      @hover-close="closeHover"
      @close-sidebar="isFixedOpen = false"
    />

    <main class="content">
      <RouterView />
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.layout {
  position: relative;
}

.content {
  padding: 5px 20px;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 20;
}
</style>
