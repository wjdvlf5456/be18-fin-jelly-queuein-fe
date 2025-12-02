<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import Modal from '@/components/common/Modal.vue'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref("");
const showError = ref(false);

watch(rememberMe, v => console.log("rememberMe changed →", v))

console.log("ON LOGIN VIEW RENDER", {
  rememberEmail: localStorage.getItem("rememberEmail"),
  fullStorageDump: JSON.parse(JSON.stringify(localStorage))
})


// 화면 로드 시 저장된 이메일 불러오기
onMounted(async () => {

  console.log("MOUNT — stored rememberEmail:", localStorage.getItem("rememberEmail"))
  console.log("MOUNT — saved variable before apply:", email.value)

  await nextTick()

  const saved = localStorage.getItem('rememberEmail')
  console.log("MOUNT — saved from LS:", saved)

  if (saved) {
    setTimeout(() => {
      email.value = saved
      rememberMe.value = true
    }, 50)   // Autofill보다 항상 늦게 실행됨
  }

  console.log("LOGIN VIEW MOUNTED!!")
})

function validate() {
  if (!email.value) {
    errorMessage.value = "이메일을 입력해주세요.";
    showError.value = true;
    return false;
  }

  if (!password.value) {
    errorMessage.value = "비밀번호를 입력해주세요.";
    showError.value = true;
    return false;
  }

  showError.value = false;
  return true;
}

async function login() {

  if (!validate()) return;

  if (isLoading.value) return
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
    console.error(e)
    errorMessage.value =
      e.response?.data?.message || "로그인에 실패했습니다."
    showError.value = true
  } finally {
    setTimeout(() => {
      isLoading.value = false
    }, 500)
  }
}

</script>


<template>
  <div class="login-layout">
    <!-- Left Section -->
    <div class="left">
      <div class="title">Queue In</div>
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
          <label>
            <input type="checkbox" v-model="rememberMe"/> 사용자 기억하기
          </label>
          <a href="#" class="find-pw">비밀번호 찾기</a>
        </div>

        <button
          type="submit"
          class="login-btn"
          :disabled="isLoading"
        >
          {{ isLoading ? '로그인 중 입니다...' : '로그인' }}
        </button>
      </form>

      <div class="footer">
        <span>Terms and conditions</span>
        <span class="dot">•</span>
        <span>Privacy policy</span>
      </div>
    </div>

    <!-- Right Section -->
    <div class="right">
      <img src="../../assets/img/qiinMain.png" class="hero-img" alt="calendar" />
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
}

/* Left */
.left {
  flex: 1;
  padding: 40px 400px;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 세로 가운데 정렬 유지 */
  align-items: center;  /* 가로 가운데 정렬 유지 */
}

.title {
  font-size: 110px;
  font-weight: 700;
  color: #243540;
  margin-bottom: 14px;
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
  flex: 1;
  background: #C8E0C3; /* 공용 색상 */
  display: flex;
  justify-content: center;
  align-items: center;
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
  background: #ffe5e5;
  color: #b30000;
  border: 1px solid #ffb3b3;
  border-radius: 4px;
  font-size: 13px;
  margin-bottom: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
