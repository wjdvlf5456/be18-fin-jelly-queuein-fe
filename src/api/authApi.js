import api from './axios'

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => {
    // SSE용 refresh는 에러를 조용히 처리하기 위해 별도 처리
    return api.post('/auth/refresh').catch(err => {
      // 401 에러는 조용히 처리 (refresh 토큰 만료는 정상적인 경우일 수 있음)
      if (err.response?.status === 401) {
        // 에러를 그대로 반환하되, 콘솔에는 표시하지 않음
        return Promise.reject(err)
      }
      // 다른 에러는 그대로 throw
      throw err
    })
  },
}
