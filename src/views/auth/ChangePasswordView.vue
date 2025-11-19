<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/userApi'

const router = useRouter()

const pw1 = ref('')
const pw2 = ref('')

const showPw1 = ref(false)
const showPw2 = ref(false)

async function changePassword() {
  if (pw1.value !== pw2.value) {
    alert('비밀번호가 일치하지 않습니다.')
    return
  }

  const token = localStorage.getItem('tempAccessToken')

  await userApi.changeMyPassword(
    { newPassword: pw1.value },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  )

  localStorage.removeItem('tempAccessToken')
  router.push('/')
}

</script>

<template>
  <div class="container">
    <!-- 브랜드 -->
    <div class="logo">Queue In</div>

    <!-- 비밀번호 변경 폼 -->
    <div class="box">
      <h1>비밀번호 변경</h1>
      <p class="desc">임시 비밀번호를 새로운 비밀번호로 바꿔주세요</p>

      <form @submit.prevent="changePassword" class="form">
        <!-- PW1 -->
        <div class="input-wrapper">
          <input
            :type="showPw1 ? 'text' : 'password'"
            v-model="pw1"
            placeholder="Your new password"
          />
          <span class="eye" @click="showPw1 = !showPw1">👁</span>
        </div>

        <!-- PW2 -->
        <div class="input-wrapper">
          <input
            :type="showPw2 ? 'text' : 'password'"
            v-model="pw2"
            placeholder="Confirm your new password"
          />
          <span class="eye" @click="showPw2 = !showPw2">👁</span>
        </div>

        <button type="submit" class="submit-btn">비밀번호 변경하기</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* 전체 레이아웃 */
.container {
  width: 100%;
  height: 100vh;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 60px;
}

/* 좌측 상단 로고 */
.logo {
  width: 100%;
  padding-left: 50px;
  font-size: 32px;
  font-weight: 700;
  color: #243540;
  margin-bottom: 80px;
}

/* 중앙 컨텐츠 */
.box {
  width: 100%;
  max-width: 600px;
  text-align: center;
}

h1 {
  font-size: 32px;
  margin-bottom: 12px;
  font-weight: 700;
}

.desc {
  color: #666;
  margin-bottom: 40px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 40px;
}

/* 인풋 */
.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: 15px 45px 15px 18px;
  border-radius: 30px;
  border: 1px solid #ddd;
  font-size: 15px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.eye {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 14px;
  color: #555;
}

/* 버튼 */
.submit-btn {
  width: 100%;
  padding: 15px;
  border-radius: 30px;
  border: none;
  background: #b6ceb4;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
}
</style>
