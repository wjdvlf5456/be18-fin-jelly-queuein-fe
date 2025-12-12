<script setup>
import { ref, onMounted, computed } from 'vue'
import { userApi } from '@/api/iam/userApi.js'

import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Card from 'primevue/card'
import DatePicker from 'primevue/datepicker'

// ===============================
// 상태
// ===============================
const me = ref(null)

const form = ref({
  userName: '',
  email: '',
  birth: null, // Date 객체
  phone: '',
})

// -----------------------------
// 연락처 raw + computed 강제 제어
// -----------------------------
const rawPhone = ref('')

const phone = computed({
  get() {
    return rawPhone.value
  },
  set(value) {
    rawPhone.value = formatPhone(value)
  },
})

function onPhoneInput(e) {
  rawPhone.value = formatPhone(e.target.value)
}

// -----------------------------
// 비밀번호
// -----------------------------
const pwForm = ref({
  oldPassword: '',
  newPassword: '',
})

// -----------------------------
// 이미지 업로드
// -----------------------------
const fileInput = ref(null)

function openFileSelector() {
  fileInput.value.click()
}

function onFileSelected(e) {
  const file = e.target.files[0]
  if (!file) return

  // 현재는 업로드는 없음 → preview 추가 가능
  console.log('선택된 파일:', file)
}

// ===============================
// 데이터 로딩
// ===============================
async function loadMe() {
  const res = await userApi.getMe()
  me.value = res.data

  form.value.userName = res.data.userName
  form.value.email = res.data.email

  rawPhone.value = res.data.phone || ''

  // birth 문자열 → Date 객체 변환
  if (res.data.birth) {
    const d = new Date(res.data.birth)
    if (!isNaN(d)) form.value.birth = d
  }
}

onMounted(loadMe)

// ===============================
// 저장 로직
// ===============================
async function saveMyInfo() {
  try {
    form.value.phone = rawPhone.value

    const payload = {
      userName: form.value.userName,
      phone: form.value.phone,
      birth: form.value.birth ? form.value.birth.toISOString().slice(0, 10) : null,
    }

    await userApi.updateMe(payload)
    alert('내 정보가 수정되었습니다.')
    loadMe()
  } catch (e) {
    console.error(e)
    alert('수정 중 오류가 발생했습니다.')
  }
}

// ===============================
// 비밀번호 변경
// ===============================
async function changePassword() {
  // 유효성 검사
  if (!pwForm.value.oldPassword || !pwForm.value.newPassword) {
    alert('현재 비밀번호와 새 비밀번호를 모두 입력해주세요.')
    return
  }

  if (pwForm.value.newPassword.length < 8) {
    alert('새 비밀번호는 최소 8자 이상이어야 합니다.')
    return
  }

  if (pwForm.value.oldPassword === pwForm.value.newPassword) {
    alert('새 비밀번호는 현재 비밀번호와 다르게 설정해주세요.')
    return
  }

  try {
    // 토큰 확인 (디버깅용)
    const token = localStorage.getItem('accessToken')
    if (!token) {
      alert('인증 토큰이 없습니다. 다시 로그인해주세요.')
      window.location.href = '/'
      return
    }

    const payload = {
      oldPassword: pwForm.value.oldPassword,
      newPassword: pwForm.value.newPassword,
    }

    await userApi.changePassword(payload)
    alert('비밀번호가 변경되었습니다.')
    pwForm.value.oldPassword = ''
    pwForm.value.newPassword = ''
  } catch (e) {
    console.error('비밀번호 변경 실패:', e)

    // 에러 메시지 추출
    let errorMessage = '비밀번호 변경에 실패했습니다.'

    if (e.response) {
      const status = e.response.status
      const data = e.response.data

      if (status === 401) {
        errorMessage = data?.message || '인증이 필요합니다. 다시 로그인해주세요.'
        // 401 오류 시 로그인 페이지로 이동
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } else if (status === 400) {
        errorMessage = data?.message || '요청 형식이 올바르지 않습니다. 입력 정보를 확인해주세요.'
      } else if (status === 403) {
        errorMessage = data?.message || '비밀번호 변경 권한이 없습니다.'
      } else {
        errorMessage = data?.message || `서버 오류가 발생했습니다. (${status})`
      }
    } else if (e.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    alert(errorMessage)
  }
}

// ===============================
// 연락처 포맷팅
// ===============================
function formatPhone(value) {
  if (!value) return ''

  value = value.replace(/\D/g, '')

  if (value.length > 11) value = value.slice(0, 11)

  if (value.length === 11) {
    return value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  if (value.length >= 7) {
    return value.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3')
  }
  if (value.length >= 4) {
    return value.replace(/(\d{3})(\d+)/, '$1-$2')
  }

  return value
}
</script>

<template>
  <div class="mypage-wrapper" v-if="me">
    <h2 class="title">마이페이지</h2>
    <p class="subtitle">내 계정 정보를 확인하고 수정할 수 있습니다.</p>

    <Card class="mypage-card">
      <template #content>
        <!-- 두 열 구조 -->
        <div class="layout">
          <!-- 프로필 -->
          <div class="left-profile">
            <div class="avatar">{{ me.userName.charAt(0) }}</div>

            <Button label="이미지 변경" outlined @click="openFileSelector" />
            <input
              type="file"
              accept="image/*"
              ref="fileInput"
              style="display: none"
              @change="onFileSelected"
            />
          </div>

          <!-- 정보 입력 -->
          <div class="right-info">
            <h3>기본 정보</h3>

            <!-- 입력 필드 세로 정렬 -->
            <div class="form-vertical">
              <div class="field">
                <label>이름</label>
                <InputText v-model="form.userName" class="input-lg" />
              </div>

              <div class="field">
                <label>이메일</label>
                <InputText v-model="form.email" disabled class="input-lg" />
              </div>

              <div class="field">
                <label>연락처</label>
                <InputText
                  :value="rawPhone"
                  placeholder="010-0000-0000"
                  class="input-lg"
                  @input="onPhoneInput"
                />
              </div>

              <div class="field">
                <label>생년월일</label>
                <br />
                <DatePicker
                  v-model="form.birth"
                  dateFormat="yy-mm-dd"
                  placeholder="YYYY-MM-DD"
                  inputClass="input-lg"
                  showIcon
                />
              </div>
            </div>

            <!-- 기본 정보 저장 버튼 -->
            <div class="btn-row">
              <Button label="저장" class="save-btn" @click="saveMyInfo" />
            </div>
          </div>
        </div>

        <!-- 비밀번호 변경 -->
        <div class="pw-section">
          <h3>비밀번호 변경</h3>

          <div class="pw-grid">
            <div class="field">
              <label>현재 비밀번호</label>
              <Password
                v-model="pwForm.oldPassword"
                toggleMask
                class="input-lg"
                :feedback="true"
                promptLabel="비밀번호를 입력하세요"
                weakLabel="약함"
                mediumLabel="보통"
                strongLabel="강함"
              />
            </div>

            <div class="field">
              <label>새 비밀번호</label>
              <Password
                v-model="pwForm.newPassword"
                toggleMask
                class="input-lg"
                :feedback="true"
                promptLabel="비밀번호를 입력하세요"
                weakLabel="약함"
                mediumLabel="보통"
                strongLabel="강함"
              />
            </div>
          </div>

          <!-- 비밀번호 변경 -->
          <div class="btn-row">
            <Button
              label="비밀번호 변경"
              class="pw-btn"
              severity="danger"
              @click="changePassword"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.mypage-wrapper {
  padding: 30px;
  max-width: 980px;
  margin: 0 auto;
}

.title {
  font-size: 22px;
  font-weight: 700;
}

.subtitle {
  margin-bottom: 18px;
  color: #666;
}

.mypage-card {
  padding: 30px;
}

.layout {
  display: flex;
  gap: 60px;
  align-items: flex-start;
}

/* 프로필 영역 */
.left-profile {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
}

.avatar {
  width: 110px;
  height: 110px;
  background: #b8a57a;
  border-radius: 50%;
  font-size: 40px;
  font-weight: 700;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 입력 섹션 */
.right-info {
  flex: 1;
}

h3 {
  margin-bottom: 14px;
  font-size: 17px;
  font-weight: 700;
}

.form-vertical {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #444;
}

.input-lg {
  width: 100%;
  padding: 0.65rem !important;
}

/* 저장 버튼 */
.save-btn {
  margin-top: 14px;
  background: #28a745;
  border: none;
}

/* 비밀번호 영역 */
.pw-section {
  margin-top: 40px;
  border-top: 1px solid #ddd;
  padding-top: 30px;
}

.pw-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  align-items: center;
}

.pw-grid .input-lg {
  width: 100%;
}

.pw-btn {
  margin-top: 16px;
}

:deep(.p-password) {
  width: 100% !important;
}

:deep(.p-password-input) {
  width: 100% !important;
}

.btn-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
