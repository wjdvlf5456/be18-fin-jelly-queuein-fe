<template>
  <div class="notification-wrapper">
    <div class="notification-icon" @click="toggleDropdown" ref="iconRef">
      <i class="ri-notification-3-line"></i>
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </div>

    <Transition name="dropdown">
      <div v-if="showDropdown" class="notification-dropdown" ref="dropdownRef">
        <div class="dropdown-header">
          <h3>알림</h3>
          <button v-if="unreadCount > 0" @click="markAllAsRead" class="mark-all-read">
            모두 읽음
          </button>
        </div>

        <div class="dropdown-content">
          <div v-if="loading" class="loading">
            <i class="ri-loader-4-line"></i>
            <span>로딩 중...</span>
          </div>

          <div v-else-if="notifications.length === 0" class="empty">
            <i class="ri-notification-off-line"></i>
            <span>알림이 없습니다</span>
          </div>

          <div v-else class="notification-list">
            <div
              v-for="notification in notifications"
              :key="notification.notificationId"
              class="notification-item"
              :class="{ unread: !notification.isRead }"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-icon-wrapper">
                <i :class="getNotificationIcon(notification.type)"></i>
              </div>
              <div class="notification-content">
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
              </div>
              <button
                class="delete-btn"
                @click.stop="deleteNotification(notification.notificationId)"
              >
                <i class="ri-close-line"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-if="hasMore" class="dropdown-footer">
          <button @click="loadMore" class="load-more">더 보기</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { notificationApi } from '@/api/notificationApi'
import { sseService } from '@/services/sseService'
import { useRouter } from 'vue-router'

const router = useRouter()

const showDropdown = ref(false)
const notifications = ref([])
const loading = ref(false)
const currentPage = ref(0)
const hasMore = ref(true)
const unreadCount = ref(0)

const iconRef = ref(null)
const dropdownRef = ref(null)

// 알림 타입별 아이콘
const getNotificationIcon = (type) => {
  const iconMap = {
    RESERVATION_APPROVED: 'ri-checkbox-circle-line',
    RESERVATION_REJECTED: 'ri-close-circle-line',
    RESERVATION_CANCELLED: 'ri-error-warning-line',
    RESERVATION_REMINDER: 'ri-time-line',
    RESERVATION_STARTED: 'ri-play-circle-line',
    RESERVATION_ENDED: 'ri-stop-circle-line',
  }
  return iconMap[type] || 'ri-notification-line'
}

// ISO 형식 시간을 예쁘게 변환 (로컬 시간, TZ 제거)
const formatIsoToLocal = (iso) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

// 메시지 안의 ISO 날짜(TZ 포함)를 로컬 포맷으로 치환
const prettifyMessage = (msg) => {
  if (!msg) return ''
  const isoRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g
  return msg.replace(isoRegex, (match) => formatIsoToLocal(match))
}

// 시간 포맷팅
const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

// 알림 목록 로드
const loadNotifications = async (page = 0, append = false) => {
  if (loading.value) return

  loading.value = true
  try {
    const res = await notificationApi.getAllNotifications(page, 20)
    const data = res.data

    if (append) {
      notifications.value = [...notifications.value, ...data.content]
    } else {
      notifications.value = data.content
    }

    currentPage.value = page
    hasMore.value = !data.last
    updateUnreadCount()
  } catch (err) {
    console.error('알림 로드 실패:', err)
  } finally {
    loading.value = false
  }
}

// 읽지 않은 알림 개수 업데이트
const updateUnreadCount = () => {
  unreadCount.value = notifications.value.filter((n) => !n.isRead).length
}

// 더 보기
const loadMore = () => {
  if (hasMore.value && !loading.value) {
    loadNotifications(currentPage.value + 1, true)
  }
}

// 드롭다운 토글
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value && notifications.value.length === 0) {
    loadNotifications()
  }
}

// 알림 클릭 처리 (리다이렉트 없이 읽음 처리만 수행)
const handleNotificationClick = async (notification) => {
  if (!notification.isRead) {
    try {
      await notificationApi.markAsRead(notification.notificationId)
      notification.isRead = true
      updateUnreadCount()
    } catch (err) {
      console.error('읽음 처리 실패:', err)
    }
  }
  // 요청만 보내고 리다이렉트는 하지 않음
}

// 알림 삭제
const deleteNotification = async (notificationId) => {
  try {
    await notificationApi.deleteNotification(notificationId)
    notifications.value = notifications.value.filter((n) => n.notificationId !== notificationId)
    updateUnreadCount()
  } catch (err) {
    console.error('알림 삭제 실패:', err)
  }
}

// 모두 읽음 처리
const markAllAsRead = async () => {
  const unreadNotifications = notifications.value.filter((n) => !n.isRead)
  try {
    await Promise.all(unreadNotifications.map((n) => notificationApi.markAsRead(n.notificationId)))
    notifications.value.forEach((n) => {
      n.isRead = true
    })
    updateUnreadCount()
  } catch (err) {
    console.error('모두 읽음 처리 실패:', err)
  }
}

// 외부 클릭 감지
const handleClickOutside = (event) => {
  if (
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target) &&
    iconRef.value &&
    !iconRef.value.contains(event.target)
  ) {
    showDropdown.value = false
  }
}

// SSE 메시지 핸들러
const handleSseMessage = (data) => {
  // 새 알림이 오면 목록 맨 위에 추가
  if (data.notificationId) {
    const newNotification = {
      notificationId: data.notificationId,
      message: prettifyMessage(data.message || data.title || '새 알림이 있습니다'),
      type: data.type,
      isRead: false,
      createdAt: data.createdAt,
      reservationId: null, // SSE DTO에는 없지만 필요시 추가 가능
    }
    notifications.value.unshift(newNotification)
    unreadCount.value++

    // 드롭다운이 열려있지 않으면 알림 표시 (선택사항)
    if (!showDropdown.value) {
      // 브라우저 알림 표시 (권한 필요)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('새 알림', {
          body: newNotification.message,
          icon: '/favicon.ico',
        })
      }
    }
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)

  // 초기에 알림 목록을 불러와 뱃지 카운트 표시
  await loadNotifications()

  // SSE 연결 (비동기로 처리)
  // refresh 토큰이 만료되었거나 없을 수 있으므로 에러를 조용히 처리
  // 이미 연결되어 있으면 다시 연결하지 않음
  if (!sseService.isConnected) {
    try {
      const eventSource = await sseService.connect(handleSseMessage, (error) => {
        // SSE 연결 에러는 조용히 처리 (refresh 토큰 만료 등 정상적인 경우일 수 있음)
        // 401 에러는 콘솔에 표시하지 않음
        if (error?.response?.status !== 401) {
          console.error('SSE connection error:', error)
        }
      })
      // eventSource가 null이면 연결 실패 (refresh 토큰 문제 등) - 조용히 처리
    } catch (err) {
      // refresh 토큰 관련 에러는 조용히 처리 (401은 콘솔에 표시하지 않음)
      if (err?.response?.status !== 401) {
        console.error('Failed to initialize SSE connection:', err)
      }
    }
  }

  // 리스너 등록
  sseService.addListener('notification-dropdown', handleSseMessage)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  sseService.removeListener('notification-dropdown')
})
</script>

<style scoped>
.notification-wrapper {
  position: relative;
}

.notification-icon {
  position: relative;
  font-size: 20px;
  cursor: pointer;
  color: #444;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.notification-icon:hover {
  background-color: #f5f5f5;
}

.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.4;
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 380px;
  max-height: 500px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.dropdown-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.mark-all-read {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.mark-all-read:hover {
  background-color: #f3f4f6;
}

.dropdown-content {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.loading,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6b7280;
  gap: 12px;
}

.loading i {
  font-size: 24px;
  animation: spin 1s linear infinite;
}

.empty i {
  font-size: 32px;
  color: #d1d5db;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.notification-list {
  padding: 8px 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f3f4f6;
  position: relative;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: #f9fafb;
}

.notification-item.unread {
  background-color: #eff6ff;
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: #3b82f6;
  border-radius: 50%;
}

.notification-icon-wrapper {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  background: #f3f4f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 18px;
}

.notification-item.unread .notification-icon-wrapper {
  background: #dbeafe;
  color: #3b82f6;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-message {
  font-size: 14px;
  color: #1f2937;
  line-height: 1.5;
  margin-bottom: 4px;
  word-break: break-word;
}

.notification-time {
  font-size: 12px;
  color: #6b7280;
}

.delete-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0;
}

.notification-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background-color: #fee2e2;
  color: #ef4444;
}

.dropdown-footer {
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.load-more {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.load-more:hover {
  background-color: #f3f4f6;
}

/* 드롭다운 애니메이션 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
