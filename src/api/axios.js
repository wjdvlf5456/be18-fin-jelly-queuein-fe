  import axios from 'axios'

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
        localStorage.clear()
        window.location.href = '/'
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  }
)

export default api
