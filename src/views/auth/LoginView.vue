<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'

const router = useRouter()

const email = ref('')
const password = ref('')

async function login() {
  try {
    const res = await api.post('/auth/login', {
      email: email.value,
      password: password.value
    })

    const data = res.data

    if (data.mustChangePassword === true) {
      localStorage.setItem('tempAccessToken', data.accessToken)
      router.push('/change-password')
      return
    }

    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('role', data.role)
    localStorage.setItem("userName", data.userName)

    router.push('/app')

  } catch (e) {
    console.error(e)
    alert('로그인 실패')
  }
}
</script>



<template>
  <div class="login-layout">
    <!-- Left Section -->
    <div class="left">
      <div class="title">Queue In</div>
      <div class="subtitle">사내 일정 관리 시스템</div>

      <form class="login-form" @submit.prevent="login">
        <input v-model="email" type="text" placeholder="이메일" class="input" />
        <input v-model="password" type="password" placeholder="비밀번호" class="input" />

        <div class="options">
          <label><input type="checkbox" /> 사용자 기억하기</label>
          <a href="#" class="find-pw">비밀번호 찾기</a>
        </div>

        <button type="submit" class="login-btn">로그인</button>
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
</style>
