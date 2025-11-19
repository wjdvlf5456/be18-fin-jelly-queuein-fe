<!-- file: src/components/layout/AppSidebar.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: true }
})

const role = localStorage.getItem('role')
const isAdmin = computed(() => role === 'MASTER' || role === 'ADMIN')
</script>

<template>
  <aside class="sidebar" :class="{ closed: !open }">
    <nav class="menu">

      <router-link to="/app" class="item">
        <img src="@/assets/icons/reserve.svg" class="icon" />
        <span v-if="open">예약 관리</span>
      </router-link>

      <router-link to="/app/schedule" class="item">
        <img src="@/assets/icons/schedule.svg" class="icon" />
        <span v-if="open">일정 관리</span>
      </router-link>

      <router-link to="/app/resource" class="item">
        <img src="@/assets/icons/resource.svg" class="icon" />
        <span v-if="open">자원 관리</span>
      </router-link>

      <router-link to="/app/stats" class="item">
        <img src="@/assets/icons/stats.svg" class="icon" />
        <span v-if="open">정산 관리</span>
      </router-link>

      <router-link v-if="isAdmin" to="/admin" class="item admin">
        <img src="@/assets/icons/user.svg" class="icon" />
        <span v-if="open">유저 관리</span>
      </router-link>

    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 200px;
  background: #f9f9f9;
  padding: 25px 0;
  border-radius: 0 20px 20px 0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

/* 닫혔을 때 */
.sidebar.closed {
  width: 80px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 35px;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #444;
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
}

.item:hover {
  color: #000;
}

.icon {
  width: 40px;
  height: 40px;
  margin-bottom: 6px;
}

.admin {
  background: #cfe3ca;
  padding: 14px 0;
  border-radius: 6px;
}
</style>
