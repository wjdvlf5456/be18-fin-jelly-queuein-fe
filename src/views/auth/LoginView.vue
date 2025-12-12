<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import Modal from '@/components/common/Modal.vue'

// Vue 3 + Vite 표준: import를 사용하여 asset 경로 처리
// Vite는 이미지를 자동으로 URL로 변환합니다
import logoUrl from '@/assets/icons/logo.svg'
import heroImageUrl from '@/assets/img/qiinMain.png'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const showError = ref(false)

watch(rememberMe, (v) => console.log('rememberMe changed →', v))

console.log('ON LOGIN VIEW RENDER', {
  rememberEmail: localStorage.getItem('rememberEmail'),
  fullStorageDump: JSON.parse(JSON.stringify(localStorage)),
})

// 화면 로드 시 저장된 이메일 불러오기
onMounted(async () => {
  console.log('MOUNT — stored rememberEmail:', localStorage.getItem('rememberEmail'))
  console.log('MOUNT — saved variable before apply:', email.value)

  await nextTick()

  const saved = localStorage.getItem('rememberEmail')
  console.log('MOUNT — saved from LS:', saved)

  if (saved) {
    setTimeout(() => {
      email.value = saved
      rememberMe.value = true
    }, 50) // Autofill보다 항상 늦게 실행됨
  }

  console.log('LOGIN VIEW MOUNTED!!')
})

function validate() {
  if (!email.value) {
    errorMessage.value = '이메일을 입력해주세요.'
    showError.value = true
    return false
  }

  if (!password.value) {
    errorMessage.value = '비밀번호를 입력해주세요.'
    showError.value = true
    return false
  }

  showError.value = false
  return true
}

async function login() {
  if (!validate()) {
    return
  }

  if (isLoading.value) {
    return
  }
  isLoading.value = true

  try {
    const result = await auth.login(email.value, password.value, rememberMe.value)

    // 비밀번호 초기 변경 상황
    if (result === 'CHANGE_PASSWORD') {
      router.push('/change-password')
      return
    }

    // result === role (예: MASTER, ADMIN, GENERAL)
    if (result === 'MASTER' || result === 'ADMIN') {
      router.push('/admin')
    } else {
      router.push('/app')
    }
  } catch (e) {
    console.error('로그인 실패:', e)
    // 로그인 실패 시 구체적인 안내 메시지 표시
    if (e.response?.status === 401 || e.response?.status === 400) {
      errorMessage.value =
        '아이디(로그인 전화번호, 로그인 전용 아이디) 또는 비밀번호가 잘못 되었습니다.\n아이디와 비밀번호를 정확히 입력해 주세요.'
    } else {
      errorMessage.value = e.response?.data?.message || '로그인에 실패했습니다.'
    }
    showError.value = true
    // 에러 발생 시 즉시 로딩 상태 해제
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-layout">
    <!-- Left Section -->
    <div class="left">
      <div class="center-wrapper">
        <div class="title">
          <img :src="logoUrl" alt="QueueIn Logo" class="logo-img" />
        </div>
        <div class="subtitle">사내 일정 관리 시스템</div>

        <form class="login-form" autocomplete="off" @submit.prevent="login">
          <div v-if="showError" class="error-box">
            {{ errorMessage }}
          </div>
          <input
            v-model="email"
            type="text"
            placeholder="이메일"
            class="input"
            autocomplete="email"
          />
          <input
            v-model="password"
            type="password"
            placeholder="비밀번호"
            class="input"
            autocomplete="current-password"
          />

          <div class="options">
            <label> <input type="checkbox" v-model="rememberMe" /> 사용자 기억하기 </label>
            <a href="#" class="find-pw">비밀번호 찾기</a>
          </div>

          <button type="submit" class="login-btn" :disabled="isLoading">
            {{ isLoading ? '로그인 중 입니다...' : '로그인' }}
          </button>
        </form>

        <div class="footer">
          <span>Terms and conditions</span>
          <span class="dot">•</span>
          <span>Privacy policy</span>
        </div>
      </div>
    </div>

    <!-- Right Section -->
    <div class="right">
      <img :src="heroImageUrl" class="hero-img" alt="calendar" />
    </div>

    <!-- Brand -->
    <div class="brand">QueueIn</div>
    <!-- 로그인 중 모달 -->
    <Modal :show="isLoading">
      <div class="spinner"></div>
      <p class="msg">로그인 중입니다...</p>
    </Modal>
  </div>
</template>

<style scoped>
/* 전체 화면 꽉 채우기 */
.login-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  background: white;
  position: relative;
  box-sizing: border-box;
}

/* Left */
.left {
  flex: 7 1 0%;
  flex-basis: 70%;
  padding: 40px 400px;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 세로 가운데 정렬 유지 */
  align-items: center; /* 가로 가운데 정렬 유지 */
  box-sizing: border-box;
}

.center-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center; /* 자식 모두 가로 중앙 */
  width: 100%;
}

.title {
  margin-bottom: 14px;
  display: flex;
  justify-content: center;
}

.logo-img {
  width: 600px; /* 로고 크기 조정 */
  height: auto;
  object-fit: contain;
}

.subtitle {
  font-size: 16px;
  margin-bottom: 50px;
  color: #6b6b6b;
}

.login-form {
  width: 100%;
  max-width: 500px;
  padding: 0 16px; /* 양쪽 여백 조금 */
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.input {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 12px;
  font-size: 14px;
}

.options {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-top: 5px;
}

.find-pw {
  color: #677;
  text-decoration: underline;
  cursor: pointer;
}

.login-btn {
  margin-top: 10px;
  padding: 12px;
  font-size: 15px;
  font-weight: 600;
  background: #b6ceb4; /* 공통 컬러 */
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.footer {
  margin-top: 40px;
  font-size: 11px;
  color: #777;
}

.footer .dot {
  padding: 0 8px;
}

/* Right */
.right {
  flex: 3 1 0%;
  flex-basis: 30%;
  background: #c8e0c3; /* 공용 색상 */
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}

.hero-img {
  width: 55%;
  max-width: 350px;
}

/* Corner brand */
.brand {
  position: absolute;
  bottom: 30px;
  right: 50px;
  font-size: 13px;
  color: #5c5c5c;
}

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

.error-box {
  width: 100%;
  max-width: 500px;
  padding: 10px 14px;
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef5350;
  border-radius: 4px;
  font-size: 13px;
  margin-bottom: 10px;
  text-align: left;
  white-space: pre-line;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
