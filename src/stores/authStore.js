import { defineStore } from 'pinia'
import { authApi } from '@/api/authApi'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken'),
    role: localStorage.getItem('role'),
  }),

  actions: {
    async login(email, password, rememberMe) {

      console.log("[authStore.login] rememberMe:", rememberMe)
      console.log("[authStore.login] BEFORE save, rememberEmail:", localStorage.getItem("rememberEmail"))

      const res = await authApi.login({ email, password })
      const data = res.data

      if (rememberMe === true) {
        console.log("[authStore.login] SAVING rememberEmail", email)
        localStorage.setItem('rememberEmail', email)
      } else {
        console.log("[authStore.login] REMOVING rememberEmail")
        //localStorage.removeItem('rememberEmail')
      }

      console.log("[authStore.login] AFTER save, rememberEmail:", localStorage.getItem("rememberEmail"))


      if (data.mustChangePassword) {
        localStorage.setItem('tempAccessToken', data.accessToken)
        return 'CHANGE_PASSWORD'
      }

      this.accessToken = data.accessToken
      this.role = data.role

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('role', data.role)
      localStorage.setItem('userName', data.userName)

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
