import { defineStore } from 'pinia'
import { authApi } from '@/api/authApi'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken'),
    role: localStorage.getItem('role'),
  }),

  actions: {
    async login(email, password) {
      const res = await authApi.login({ email, password })
      const data = res.data

      if (data.mustChangePassword) {
        localStorage.setItem('tempAccessToken', data.accessToken)
        return 'CHANGE_PASSWORD'
      }

      this.accessToken = data.accessToken
      this.role = data.role

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('role', data.role)

      return data.role
    },

    async logout() {
      try {
        await authApi.logout()
      } catch {}

      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('role')

      this.accessToken = null
      this.role = null

      window.location.replace('/')
    }



  }
})
