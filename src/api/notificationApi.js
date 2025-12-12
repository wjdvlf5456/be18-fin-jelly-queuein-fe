import api from './axios'

export const notificationApi = {
  // 개별 알림 조회
  getNotification: (notificationId) => api.get(`/notifications/${notificationId}`),

  // 사용자의 모든 알림 조회 (페이지네이션)
  getAllNotifications: (page = 0, size = 20) =>
    api.get('/notifications/me', {
      params: { page, size },
    }),

  // 알림 읽음 처리
  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),

  // 알림 삭제
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),

  // SSE 구독
  subscribe: () => {
    // 토큰은 sseService에서 갱신 후 사용하므로 여기서는 그대로 사용
    const token = localStorage.getItem('accessToken')

    if (!token) {
      console.warn('No access token found for SSE subscription')
      throw new Error('No access token available')
    }

    // EventSource는 헤더를 직접 설정할 수 없으므로 쿼리 파라미터로 전달
    // 백엔드에서 @SseAccessToken으로 받을 수 있도록 설정
    // encodeURIComponent로 JWT의 특수문자(+, /, =) 인코딩
    return new EventSource(
      `${import.meta.env.VITE_API_URL}/api/v1/sse/subscribe?token=${encodeURIComponent(token)}`,
      {
        withCredentials: true,
      },
    )
  },

  // SSE 구독 해제
  unsubscribe: () => api.delete('/sse/unsubscribe'),
}
