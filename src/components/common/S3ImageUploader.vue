<template>
  <div class="s3-image-uploader">
    <!-- 이미지 미리보기 영역 -->
    <div v-if="imageUrl || previewUrl" class="image-preview">
      <img :src="previewUrl || imageUrl" alt="Preview" />
      <button class="remove-btn" @click="removeImage" type="button">
        <i class="pi pi-times"></i>
      </button>
    </div>

    <!-- 업로드 영역 -->
    <div
      v-if="!imageUrl && !previewUrl"
      class="upload-area"
      :class="{ 'drag-over': isDragOver, uploading: isUploading }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleFileSelect"
      />
      <div class="upload-content">
        <i class="pi pi-cloud-upload upload-icon"></i>
        <p class="upload-text">
          <span class="highlight">클릭하거나 드래그 앤 드롭</span>하여 이미지를 업로드하세요
        </p>
        <p class="upload-hint">PNG, JPG, GIF 파일 (최대 10MB)</p>
      </div>
    </div>

    <!-- 업로드 진행 중 -->
    <div v-if="isUploading" class="upload-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
      </div>
      <p class="progress-text">업로드 중... {{ uploadProgress }}%</p>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="errorMessage" class="error-message">
      <i class="pi pi-exclamation-triangle"></i>
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api/axios'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const fileInput = ref(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref('')
const previewUrl = ref('')
const imageUrl = ref(props.modelValue)

// modelValue 변경 감지
watch(
  () => props.modelValue,
  (newValue) => {
    imageUrl.value = newValue
    if (!newValue) {
      previewUrl.value = ''
    }
  },
)

// 파일 선택 트리거
function triggerFileInput() {
  fileInput.value?.click()
}

// 드래그 오버
function handleDragOver(e) {
  e.preventDefault()
  isDragOver.value = true
}

// 드래그 리브
function handleDragLeave(e) {
  e.preventDefault()
  isDragOver.value = false
}

// 드롭
function handleDrop(e) {
  e.preventDefault()
  isDragOver.value = false

  const files = e.dataTransfer.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

// 파일 선택
function handleFileSelect(e) {
  const files = e.target.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

// 파일 처리
async function processFile(file) {
  // 파일 유효성 검사
  if (!file.type.startsWith('image/')) {
    errorMessage.value = '이미지 파일만 업로드 가능합니다.'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }

  // 파일 크기 검사 (10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    errorMessage.value = '파일 크기는 10MB를 초과할 수 없습니다.'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }

  // 미리보기 생성
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
  }
  reader.readAsDataURL(file)

  // 업로드 시작
  await uploadToS3(file)
}

// S3 업로드
async function uploadToS3(file) {
  try {
    isUploading.value = true
    uploadProgress.value = 0
    errorMessage.value = ''

    // 파일 확장자 추출
    const extension = file.name.split('.').pop().toLowerCase()
    const contentType = file.type

    // 1. Pre-signed URL 요청
    uploadProgress.value = 20
    const urlResponse = await api.post('/assets/images/upload-url', null, {
      params: {
        extension,
        contentType,
      },
    })

    const { uploadUrl, fileUrl } = urlResponse.data

    // 2. S3에 직접 업로드
    uploadProgress.value = 50
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

    uploadProgress.value = 100

    // 3. 성공 시 fileUrl을 부모 컴포넌트에 전달
    imageUrl.value = fileUrl
    emit('update:modelValue', fileUrl)

    ElMessage.success('이미지가 업로드되었습니다.')
  } catch (error) {
    console.error('이미지 업로드 실패:', error)
    errorMessage.value = '이미지 업로드에 실패했습니다. 다시 시도해주세요.'
    previewUrl.value = ''
    ElMessage.error('이미지 업로드에 실패했습니다.')
  } finally {
    isUploading.value = false
    setTimeout(() => {
      uploadProgress.value = 0
    }, 500)
  }
}

// 이미지 제거
function removeImage() {
  imageUrl.value = ''
  previewUrl.value = ''
  emit('update:modelValue', '')
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<style scoped>
.s3-image-uploader {
  width: 100%;
}

/* 이미지 미리보기 */
.image-preview {
  position: relative;
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  background: #f9fafb;
}

.image-preview img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

/* 업로드 영역 */
.upload-area {
  width: 100%;
  min-height: 200px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.upload-area:hover {
  border-color: #00a950;
  background: #f0fdf4;
}

.upload-area.drag-over {
  border-color: #00a950;
  background: #dcfce7;
  transform: scale(1.02);
}

.upload-area.uploading {
  cursor: not-allowed;
  opacity: 0.7;
}

.upload-content {
  text-align: center;
  padding: 40px 20px;
}

.upload-icon {
  font-size: 48px;
  color: #9ca3af;
  margin-bottom: 16px;
  display: block;
}

.upload-area:hover .upload-icon,
.upload-area.drag-over .upload-icon {
  color: #00a950;
  transform: scale(1.1);
  transition: all 0.3s ease;
}

.upload-text {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 8px;
}

.highlight {
  color: #00a950;
  font-weight: 600;
}

.upload-hint {
  font-size: 14px;
  color: #9ca3af;
}

/* 업로드 진행 바 */
.upload-progress {
  margin-top: 16px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00a950, #10b981);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
  text-align: center;
}

/* 에러 메시지 */
.error-message {
  margin-top: 12px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-message i {
  font-size: 16px;
}
</style>
