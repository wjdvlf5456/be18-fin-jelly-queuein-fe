<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api/iam/userApi.js'
import api from '@/api/axios.js'

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

// 원본 데이터 저장 (변경 감지용)
const originalData = ref({
  userName: '',
  email: '',
  birth: null,
  phone: '',
  profileImageUrl: null,
  profileImageKey: null,
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
const profileImagePreview = ref(null)
const profileImageUrl = ref(null)
const profileImageKey = ref(null)
const originalProfileImageUrl = ref(null)
const originalProfileImageKey = ref(null)
const selectedFile = ref(null) // 선택된 파일 저장 (저장 버튼 클릭 시 업로드)
const isImageDeleted = ref(false) // 이미지 삭제 플래그
const isDragging = ref(false)
const fileSizeError = ref('')
const isUploading = ref(false)
const MAX_FILE_SIZE = 500 * 1024 // 500KB

function openFileSelector() {
  fileInput.value?.click()
}

function validateImageFile(file) {
  // 파일 크기 검증 (500KB 이하)
  if (file.size > MAX_FILE_SIZE) {
    fileSizeError.value = '이미지 크기는 500KB 이하만 가능합니다.'
    return false
  }

  // 이미지 파일 타입 검증
  if (!file.type.startsWith('image/')) {
    fileSizeError.value = '이미지 파일만 업로드 가능합니다.'
    return false
  }

  // 검증 통과 시 에러 메시지 초기화
  fileSizeError.value = ''
  return true
}

function handleImageFile(file) {
  if (!file) return

  // 검증 실패 시 에러 메시지만 표시하고 리턴
  if (!validateImageFile(file)) return

  // 파일 저장 (저장 버튼 클릭 시 업로드)
  selectedFile.value = file
  isImageDeleted.value = false // 새 이미지 선택 시 삭제 플래그 해제

  // FileReader로 미리보기 생성
  const reader = new FileReader()
  reader.onload = (e) => {
    profileImagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

async function uploadToS3(file) {
  try {
    isUploading.value = true
    fileSizeError.value = ''

    // 파일 확장자 추출
    const extension = file.name.split('.').pop().toLowerCase()
    const contentType = file.type

    // 1. Pre-signed URL 요청
    const urlResponse = await api.post('/assets/images/upload-url', null, {
      params: {
        extension,
        contentType,
      },
    })

    const { uploadUrl, fileUrl } = urlResponse.data

    // 2. S3에 직접 업로드
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
      },
    })

    if (!uploadResponse.ok) {
      throw new Error('S3 업로드 실패')
    }

    // 3. fileUrl에서 fileKey 추출 (예: https://bucket.s3.amazonaws.com/filename.ext -> filename.ext)
    const fileKey = fileUrl.split('/').pop() || null

    // 4. 성공 시 fileUrl과 fileKey 저장
    profileImageUrl.value = fileUrl
    profileImageKey.value = fileKey
    fileSizeError.value = ''
  } catch (error) {
    console.error('이미지 업로드 실패:', error)
    fileSizeError.value = '이미지 업로드에 실패했습니다. 다시 시도해주세요.'
    ElMessage.error('이미지 업로드에 실패했습니다.')
    // 업로드 실패 시 미리보기 제거
    profileImagePreview.value = originalProfileImageUrl.value
  } finally {
    isUploading.value = false
  }
}

function onFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  handleImageFile(file)

  // input 초기화 (같은 파일 다시 선택 가능하도록)
  e.target.value = ''
}

function onDragOver(e) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = true
}

function onDragLeave(e) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false
}

function onDrop(e) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false

  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  handleImageFile(file)
}

function cancelImageChange() {
  profileImagePreview.value = originalProfileImageUrl.value
  profileImageUrl.value = originalProfileImageUrl.value
  profileImageKey.value = originalProfileImageKey.value
  selectedFile.value = null
  isImageDeleted.value = false
  fileSizeError.value = ''
}

function deleteImage() {
  profileImagePreview.value = null
  profileImageUrl.value = null
  profileImageKey.value = null
  selectedFile.value = null
  isImageDeleted.value = true // 이미지 삭제 플래그 설정
  fileSizeError.value = ''
}

// 이미지가 변경되었는지 확인
const hasImageChanged = computed(() => {
  // 새 파일이 선택되었거나, 이미 업로드된 이미지가 원본과 다른 경우
  // 또는 이미지가 삭제된 경우 (원본은 있지만 현재는 없는 경우)
  return selectedFile.value !== null ||
         profileImageUrl.value !== originalProfileImageUrl.value ||
         profileImageKey.value !== originalProfileImageKey.value ||
         (originalProfileImageUrl.value !== null && profileImageUrl.value === null)
})

// 변경사항이 있는지 확인
const hasChanges = computed(() => {
  // 폼 데이터 변경 확인
  const formChanged =
    form.value.userName.trim() !== originalData.value.userName ||
    rawPhone.value !== originalData.value.phone ||
    (form.value.birth?.toISOString().slice(0, 10) || null) !==
    (originalData.value.birth?.toISOString().slice(0, 10) || null)

  // 이미지 변경 확인
  const imageChanged = hasImageChanged.value

  return formChanged || imageChanged
})

function resetForm() {
  form.value.userName = originalData.value.userName
  rawPhone.value = originalData.value.phone
  form.value.birth = originalData.value.birth ? new Date(originalData.value.birth) : null
  cancelImageChange()
  selectedFile.value = null
  isImageDeleted.value = false
}

// ===============================
// 데이터 로딩
// ===============================
async function loadMe() {
  try {
    const res = await userApi.getMe()

    if (!res?.data) {
      ElMessage.error('사용자 정보를 불러올 수 없습니다.')
      return
    }

    me.value = res.data

    form.value.userName = res.data.userName || ''
    form.value.email = res.data.email || ''

    rawPhone.value = res.data.phone || ''

    // birth 문자열 → Date 객체 변환
    if (res.data.birth) {
      const d = new Date(res.data.birth)
      if (!isNaN(d)) {
        form.value.birth = d
      }
    }

    // 프로필 이미지 로드
    if (res.data.profileImageUrl) {
      profileImageUrl.value = res.data.profileImageUrl
      profileImagePreview.value = res.data.profileImageUrl
      originalProfileImageUrl.value = res.data.profileImageUrl
    } else {
      profileImageUrl.value = null
      profileImagePreview.value = null
      originalProfileImageUrl.value = null
    }

    if (res.data.profileImageKey) {
      profileImageKey.value = res.data.profileImageKey
      originalProfileImageKey.value = res.data.profileImageKey
    } else {
      profileImageKey.value = null
      originalProfileImageKey.value = null
    }

    // 원본 데이터 저장 (birth는 Date 객체로 저장)
    const originalBirth = res.data.birth ? new Date(res.data.birth) : null
    if (originalBirth && !isNaN(originalBirth.getTime())) {
      originalData.value.birth = originalBirth
    } else {
      originalData.value.birth = null
    }

    originalData.value.userName = res.data.userName || ''
    originalData.value.email = res.data.email || ''
    originalData.value.phone = res.data.phone || ''
    originalData.value.profileImageUrl = originalProfileImageUrl.value
    originalData.value.profileImageKey = originalProfileImageKey.value
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error)

    let errorMessage = '사용자 정보를 불러오는데 실패했습니다.'

    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      if (status === 401) {
        errorMessage = data?.message || '로그인이 필요합니다.'
      } else if (status === 404) {
        errorMessage = data?.message || '사용자 정보를 찾을 수 없습니다.'
      } else {
        errorMessage = data?.message || `사용자 정보를 불러오는데 실패했습니다. (${status})`
      }
    } else if (error.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
  }
}

onMounted(loadMe)

// ===============================
// 저장 로직
// ===============================
async function saveMyInfo() {
  try {
    // 유효성 검사
    if (!form.value.userName || form.value.userName.trim() === '') {
      ElMessage.warning('이름을 입력해주세요.')
      return
    }

    // 이미지가 변경되었으면 먼저 S3에 업로드
    if (selectedFile.value) {
      try {
        await uploadToS3(selectedFile.value)
        selectedFile.value = null // 업로드 완료 후 초기화
      } catch (uploadError) {
        // 업로드 실패 시 저장 중단
        console.error('이미지 업로드 실패:', uploadError)
        return
      }
    }

    form.value.phone = rawPhone.value

    // 기본 payload 구성
    const payload = {
      userName: form.value.userName.trim(),
      phone: form.value.phone || '',
      birth: form.value.birth ? form.value.birth.toISOString().slice(0, 10) : null,
    }

    // 이미지 삭제된 경우 imageDeleted 플래그 전송
    if (isImageDeleted.value) {
      payload.imageDeleted = true
    } else {
      // 이미지가 업로드된 경우에만 profileImageUrl과 profileImageKey 포함
      if (profileImageUrl.value && profileImageKey.value) {
        payload.profileImageUrl = profileImageUrl.value
        payload.profileImageKey = profileImageKey.value
      }
    }

    await userApi.updateMe(payload)
    ElMessage.success('내 정보가 수정되었습니다.')
    isImageDeleted.value = false // 저장 후 삭제 플래그 초기화
    await loadMe() // loadMe에서 원본 데이터도 업데이트됨
  } catch (e) {
    console.error('정보 수정 실패:', e)

    let errorMessage = '정보 수정에 실패했습니다.'

    if (e.response) {
      const status = e.response.status
      const data = e.response.data

      if (status === 400) {
        errorMessage = data?.message || '입력 정보가 올바르지 않습니다.'
      } else if (status === 403) {
        errorMessage = data?.message || '정보 수정 권한이 없습니다.'
      } else if (status === 409) {
        errorMessage = data?.message || '이미 사용 중인 정보입니다.'
      } else {
        errorMessage = data?.message || `정보 수정에 실패했습니다. (${status})`
      }
    } else if (e.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
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
            <div
              class="avatar-container"
              :class="{ 'dragging': isDragging }"
              @dragover="onDragOver"
              @dragleave="onDragLeave"
              @drop="onDrop"
            >
              <div v-if="profileImagePreview" class="avatar-image">
                <img :src="profileImagePreview" alt="프로필 이미지" />
              </div>
              <div v-else class="avatar">{{ me.userName.charAt(0) }}</div>
              <div v-if="isDragging" class="drag-overlay">
                <span>이미지를 여기에 놓으세요</span>
              </div>
            </div>

            <div class="image-buttons">
              <Button
                label="이미지 변경"
                outlined
                @click="openFileSelector"
                :disabled="isUploading"
              />
              <Button
                v-if="profileImagePreview || originalProfileImageUrl"
                label="이미지 삭제"
                outlined
                severity="danger"
                @click="deleteImage"
                :disabled="isUploading"
              />
            </div>
            <input
              type="file"
              accept="image/*"
              ref="fileInput"
              style="display: none"
              @change="onFileSelected"
            />
            <p v-if="isUploading" class="file-upload-status">이미지 업로드 중...</p>
            <p v-else-if="fileSizeError" class="file-size-error">{{ fileSizeError }}</p>
            <p v-else class="file-size-hint">최대 500KB까지 업로드 가능</p>
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
              <Button
                label="초기화"
                outlined
                severity="secondary"
                @click="resetForm"
                :disabled="!hasChanges"
              />
              <Button
                label="저장"
                class="save-btn"
                @click="saveMyInfo"
                :disabled="!hasChanges"
              />
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

.avatar-container {
  position: relative;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-container.dragging {
  border: 3px dashed #b8a57a;
  background-color: rgba(184, 165, 122, 0.1);
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

.avatar-image {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(184, 165, 122, 0.9);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  padding: 10px;
  z-index: 10;
}

.file-size-hint {
  font-size: 12px;
  color: #999;
  margin: 0;
  text-align: center;
}

.file-size-error {
  font-size: 12px;
  color: #dc3545;
  margin: 0;
  text-align: center;
  font-weight: 600;
}

.file-upload-status {
  font-size: 12px;
  color: #28a745;
  margin: 0;
  text-align: center;
  font-weight: 600;
}

.image-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
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
  gap: 10px;
  margin-top: 14px;
  align-items: center;
}

.btn-row :deep(.p-button) {
  min-width: 100px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
