import api from './axios'

export const categoryApi = {
  create: (payload) => api.post('/assets/categories', payload),
  update: (id, payload) => api.patch(`/assets/categories/${id}`, payload),
  delete: (id) => api.delete(`/assets/categories/${id}`),
  getDropdown: () => api.get('/assets/categories/dropdown-menu'),
  getManagementList: (page = 0, size = 10) =>
    api.get(`/assets/categories/management?page=${page}&size=${size}`),
}
