import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  withCredentials: true, // 쿠키 자동 전수
})
axios.defaults.withCredentials = true

// 요청 인터셉터 — Authorization 자동 추가
api.interceptors.request.use((config) => {
  // refresh 요청은 토큰 추가하지 않음 (쿠키로 처리)
  if (config.url.includes('/auth/refresh')) {
    return config
  }
  // logout 요청은 토큰이 필요하므로 추가
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// 응답 인터셉터 — 401 발생 시 자동 리프레시
let isRefreshing = false
let refreshSubscribers = []

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken))
  refreshSubscribers = []
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback)
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config

    // refresh 요청의 401 에러는 조용히 처리 (SSE 연결 시 정상적인 경우일 수 있음)
    if (error.config?.url?.includes('/auth/refresh') && error.response?.status === 401) {
      // 에러를 그대로 반환하되, 메시지나 리다이렉트는 하지 않음
      return Promise.reject(error)
    }

    // 403
    if (error.response && error.response.status === 403) {
      // 1) 모달 메시지
      ElMessage.error('접근 권한이 없습니다.')

      // 2) 403 페이지로 이동
      window.location.href = '/403'
      return Promise.reject(error)
    }

    // Access Token 만료
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // 로그인/로그아웃 API는 토큰 리프레시하지 않음
      if (
        originalRequest.url.includes('/auth/logout') ||
        originalRequest.url.includes('/auth/login')
      ) {
        return Promise.reject(error)
      }

      // 이미 갱신 중이라면 대기
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      isRefreshing = true

      try {
        const { authApi } = await import('./authApi')
        const res = await authApi.refresh()

        const newAccess = res.data.accessToken

        localStorage.setItem('accessToken', newAccess)

        isRefreshing = false
        onTokenRefreshed(newAccess)

        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (err) {
        isRefreshing = false
        localStorage.clear()
        window.location.href = '/'
        return Promise.reject(err)
      }
    }

    // refresh 요청의 401 에러는 메시지 표시하지 않음
    const isRefreshRequest = error.config?.url?.includes('/auth/refresh')

    if (error.response?.data && !isRefreshRequest) {
      const data = error.response.data
      // data.code 또는 data.message 활용
      if (data.message) {
        ElMessage.error(data.message)
      } else if (data.code) {
        // 필요시 코드별 분기
        switch (data.code) {
          case 'RESERVATION_ALREADY_APPROVED':
            ElMessage.error('이미 승인된 예약입니다.')
            break
          case 'RESERVATION_NOT_FOUND':
            ElMessage.error('예약 정보를 찾을 수 없습니다.')
            break
          default:
            ElMessage.error('알 수 없는 오류가 발생했습니다.')
        }
      } else {
        ElMessage.error('서버 오류가 발생했습니다.')
      }
    } else if (!isRefreshRequest) {
      ElMessage.error('서버와 연결할 수 없습니다.')
    }

    return Promise.reject(error)
  },
)

export default api
