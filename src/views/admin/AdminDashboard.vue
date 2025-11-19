<!-- file: src/views/admin/AdminDashboard.vue -->
<script setup>
const role = localStorage.getItem('role')
</script>

<template>
  <div class="admin-page">
    <h1>관리자 페이지</h1>
    <p>현재 역할: {{ role }}</p>
    <p>이곳은 MASTER / ADMIN 사용자가 접근할 수 있는 영역입니다.</p>
  </div>
</template>

<style scoped>
.admin-page {
  padding: 20px;
}
</style>
