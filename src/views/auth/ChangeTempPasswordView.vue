<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/iam/userApi.js'

const router = useRouter()

const pw1 = ref('')
const pw2 = ref('')

const showPw1 = ref(false)
const showPw2 = ref(false)

const errorMessage = ref(null); // 에러 메시지 상태 추가
const showError = ref(false); // 에러 표시 여부 상태 추가

async function changePassword() {
  if (pw1.value !== pw2.value) {
    errorMessage.value = '새 비밀번호가 일치하지 않습니다.'
    showError.value = true;
    return
  }

  if (pw1.value.length < 8) { // 최소 길이 검증 추가 (프론트엔드 유효성)
    errorMessage.value = '비밀번호는 최소 8자 이상이어야 합니다.'
    showError.value = true;
    return
  }

  const token = localStorage.getItem('tempAccessToken')

  if (!token) {
    errorMessage.value = '인증 정보가 없습니다. 다시 로그인해 주세요.'
    showError.value = true;
    router.push('/');
    return;
  }


  try {
    // API 호출
    await userApi.changeTempPassword(
      { newPassword: pw1.value },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    // 성공 시: tempAccessToken 제거 및 로그인 페이지로 이동
    alert('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해 주세요.');
    localStorage.removeItem('tempAccessToken');
    router.push('/');

  } catch (e) {
    console.error("비밀번호 변경 실패:", e.response ? e.response.status : e.message, e);

    // 에러 상태 초기화
    showError.value = true;

    // 401 (Unauthorized) 또는 403 (Forbidden) 처리
    if (e.response && (e.response.status === 401 || e.response.status === 403)) {

      // 401: 토큰 만료/무효, 403: 비즈니스 로직 거부 (PASSWORD_CHANGE_NOT_ALLOWED)
      const msg = e.response.data.message || "권한이 없거나 인증 정보가 만료되었습니다. 다시 로그인해 주세요.";

      errorMessage.value = msg;

      // 401 또는 403 오류 발생 시에는 사용자에게 재로그인을 유도
      localStorage.removeItem('tempAccessToken');
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } else {
      // 기타 네트워크/서버 오류
      errorMessage.value = e.response?.data?.message || "서버 오류로 변경에 실패했습니다.";
    }
  }
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
        <!-- 에러 표시 박스 추가 -->
        <div v-if="showError && errorMessage" class="error-box">
          {{ errorMessage }}
        </div>

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

.error-box {
  width: 100%;
  padding: 10px 20px;
  background-color: #ffe0e0;
  color: #b00020;
  border: 1px solid #ffb3b3;
  border-radius: 15px;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: -5px;
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
