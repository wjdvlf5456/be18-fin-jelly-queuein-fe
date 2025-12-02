import api from '../axios.js'

export const permissionApi = {

  // ------------------------------------------------
  // Command
  // ------------------------------------------------

  // 권한 생성 (MASTER)
  createPermission: (payload) => api.post('/permissions', payload),

  // 권한 수정 (MASTER)
  updatePermission: (permissionId, payload) =>
    api.put(`/permissions/${permissionId}`, payload),

  // 권한 삭제 (MASTER)
  deletePermission: (permissionId) =>
    api.delete(`/permissions/${permissionId}`),


  // ------------------------------------------------
  // Query
  // ------------------------------------------------

  // 권한 상세 조회 (MASTER, ADMIN)
  getPermission: (permissionId) => api.get(`/permissions/${permissionId}`),

  // 권한 목록 조회 (MASTER, ADMIN)
  getPermissionList: () => api.get('/permissions'),
}
