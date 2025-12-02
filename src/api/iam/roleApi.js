import api from '../axios.js'

export const roleApi = {

  // ------------------------------------------------
  // Role Command
  // ------------------------------------------------

  // 역할 생성 (MASTER)
  createRole: (payload) => api.post('/roles', payload),

  // 역할 수정 (MASTER)
  updateRole: (roleId, payload) => api.put(`/roles/${roleId}`, payload),

  // 역할 삭제 (MASTER, ADMIN)
  deleteRole: (roleId) => api.delete(`/roles/${roleId}`),


  // ------------------------------------------------
  // RolePermission Command
  // ------------------------------------------------

  // 권한 여러 개 추가 (MASTER, ADMIN)
  addPermissions: (roleId, payload) =>
    api.post(`/roles/${roleId}/permissions`, payload),

  // 역할-권한 매핑 전체 교체 (MASTER, ADMIN)
  replacePermissions: (roleId, payload) =>
    api.put(`/roles/${roleId}/permissions`, payload),

  // 특정 권한 삭제 (MASTER, ADMIN)
  deletePermission: (roleId, permissionId) =>
    api.delete(`/roles/${roleId}/permissions/${permissionId}`),


  // ------------------------------------------------
  // Role Query
  // ------------------------------------------------

  // 역할 상세 조회
  getRole: (roleId) => api.get(`/roles/${roleId}`),

  // 역할 목록 조회
  getRoleList: () => api.get('/roles'),
}
