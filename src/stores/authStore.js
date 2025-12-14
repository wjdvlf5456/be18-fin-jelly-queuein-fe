import { defineStore } from 'pinia'
import { authApi } from '@/api/authApi'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken'),
    role: localStorage.getItem('role'),
  }),

  actions: {
    async login(email, password, rememberMe) {
      try {
        // 유효성 검사
        if (!email || !email.trim()) {
          ElMessage.warning('이메일을 입력해주세요.')
          throw new Error('이메일이 필요합니다.')
        }

        if (!password || !password.trim()) {
          ElMessage.warning('비밀번호를 입력해주세요.')
          throw new Error('비밀번호가 필요합니다.')
        }

        console.log('[authStore.login] rememberMe:', rememberMe)

        const res = await authApi.login({ email: email.trim(), password })

        if (!res?.data) {
          throw new Error('로그인 응답이 올바르지 않습니다.')
        }

        const data = res.data

        if (rememberMe === true) {
          console.log('[authStore.login] SAVING rememberEmail', email)
          localStorage.setItem('rememberEmail', email)
        } else {
          console.log('[authStore.login] REMOVING rememberEmail')
          //localStorage.removeItem('rememberEmail')
        }

        if (data.mustChangePassword) {
          if (!data.accessToken) {
            throw new Error('임시 비밀번호 변경을 위한 토큰이 없습니다.')
          }
          localStorage.setItem('tempAccessToken', data.accessToken)
          return 'CHANGE_PASSWORD'
        }

        if (!data.accessToken || !data.role) {
          throw new Error('로그인 응답에 필수 정보가 없습니다.')
        }

        this.accessToken = data.accessToken
        this.role = data.role

        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('role', data.role)
        if (data.userName) {
          localStorage.setItem('userName', data.userName)
        }

        return data.role
      } catch (error) {
        console.error('로그인 실패:', error)

        // 이미 ElMessage가 표시된 경우 중복 방지
        if (!error.response) {
          // 네트워크 에러 등은 axios interceptor에서 처리되므로 여기서는 재throw
          throw error
        }

        // 로그인 실패는 LoginView에서 처리하므로 여기서는 재throw
        throw error
      }
    },

    async logout() {
      // SSE 연결 먼저 종료 (ERR_SOCKET_NOT_CONNECTED 방지)
      try {
        const { sseService } = await import('@/services/sseService')
        if (sseService && sseService.isConnected) {
          sseService.disconnect()
        }
      } catch (err) {
        console.warn('SSE disconnect failed:', err)
      }

      // 로그아웃 API 호출
      try {
        await authApi.logout()
      } catch (err) {
        // 로그아웃 실패해도 로컬 정리는 진행
        console.warn('Logout API failed:', err)
      }

      // 로컬 스토리지 정리
      localStorage.removeItem('accessToken')
      localStorage.removeItem('role')
      localStorage.removeItem('userName')

      this.accessToken = null
      this.role = null

      window.location.replace('/')
    },
  },
})
