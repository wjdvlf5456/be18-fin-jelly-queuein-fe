<!-- file: src/components/layout/AppHeader.vue -->
<template>
  <header class="header">
    <div class="left-controls">
      <button class="menu-btn" @click="toggle">☰</button>

      <!-- 로고 클릭 시 /app 이동 -->
      <router-link to="/app" class="logo-link">
        <img class="logo" src="@/assets/icons/logo.svg" alt="QueueIn Logo" />
      </router-link>
    </div>

    <div class="right">
      <span class="role">Role: {{ role }}</span>
      <button class="logout-btn" @click="handleLogout">로그아웃</button>
    </div>

    <!-- 로그아웃 중 모달 -->
    <Modal :show="showLogoutModal">
      <div class="spinner"></div>
      <p class="msg">로그아웃 중입니다...</p>
    </Modal>
  </header>
</template>

<script setup>
import { ref, onMounted, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import Modal from '@/components/common/Modal.vue'

const emit = defineEmits(['toggle-sidebar'])
const router = useRouter()

const role = ref('')
const showLogoutModal = ref(false)

onMounted(() => {
  role.value = localStorage.getItem('role') || ''
})

function toggle() {
  emit('toggle-sidebar')
}

async function handleLogout() {
  showLogoutModal.value = true

  try {
    await api.post('/auth/logout')
  } catch (e) {
    console.error(e)
  } finally {
    localStorage.clear()

    // 약간의 지연 후 페이지 이동 (UX 부드러움)
    setTimeout(() => {
      showLogoutModal.value = false
      router.push('/')
    }, 800)
  }
}
</script>

<style scoped>
.header {
  height: 60px;
  background: #c8e0c3;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-btn {
  font-size: 22px;
  background: none;
  border: none;
  cursor: pointer;
}

.logo-link {
  display: flex;
  align-items: center;
}

.logo {
  height: 40px;
  width: auto;
}

.right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logout-btn {
  background: #243540;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
}

/* ----------------------------- */
/* 모달 안에서 쓰는 스피너 • 문구 */
/* ----------------------------- */
.spinner {
  width: 32px;
  height: 32px;
  border: 4px solid #c8e0c3;
  border-top-color: #243540;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

.msg {
  text-align: center;
  font-size: 15px;
  color: #333;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
