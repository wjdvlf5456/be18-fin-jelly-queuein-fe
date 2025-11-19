import api from './axios'

export const userApi = {
  changePassword: (payload) =>api.patch('/users/me/password', payload),
  getMyInfo: () => api.get('/users/me'),
}
