import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api/v1'
})

// 요청 인터셉터 — Authorization 자동 추가
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 응답 인터셉터 — 401 발생 시 자동 리프레시
let isRefreshing = false
let refreshSubscribers = []

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach(callback => callback(newToken))
  refreshSubscribers = []
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback)
}

api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config

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
      const refreshToken = localStorage.getItem('refreshToken')

      if (originalRequest.url.includes('/auth/logout')) {
        return Promise.reject(error)
      }

      // 이미 갱신 중이라면 대기
      if (isRefreshing) {
        return new Promise(resolve => {
          addRefreshSubscriber(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      isRefreshing = true

      try {
        const res = await axios.post('/api/v1/auth/refresh', { refreshToken })

        const newAccess = res.data.accessToken
        const newRefresh = res.data.refreshToken

        localStorage.setItem('accessToken', newAccess)
        localStorage.setItem('refreshToken', newRefresh)

        isRefreshing = false
        onTokenRefreshed(newAccess)

        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)

      } catch (err) {
        isRefreshing = false
        // localStorage.clear()
        //window.location.href = '/'
        return Promise.reject(err)
      }
    }

        if (error.response?.data) {
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
    } else {
      ElMessage.error('서버와 연결할 수 없습니다.')
    }

    return Promise.reject(error)
  }

)

export default api
