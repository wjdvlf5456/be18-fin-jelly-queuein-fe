import api from '../axios.js'

export const userApi = {

  // ------------------------------------------------
  // Command
  // ------------------------------------------------

  // 사용자 생성 (MASTER, ADMIN)
  createUser: (payload) => api.post('/users', payload),

  // 사용자 수정 (MASTER, ADMIN, MANAGER)
  updateUser: (userId, payload) => api.patch(`/users/${userId}`, payload),

  // 임시 비밀번호 변경 (로그인 직후)
  changeTempPassword: (payload,config) => api.patch('/users/me/temp-password', payload, config),

  // 본인 비밀번호 변경
  changePassword: (payload) => api.patch('/users/me/password', payload),

  // 사용자 삭제 (MASTER, ADMIN)
  deleteUser: (userId) => api.delete(`/users/${userId}`),


  // ------------------------------------------------
  // Query
  // ------------------------------------------------

  // 사용자 목록 조회 (MASTER, ADMIN, MANAGER)
  searchUsers: (params) => api.get('/users', { params }),

  // 참여자용 사용자 조회(키워드 기반)
  lookupUsers: (keyword) => api.get('/users/lookup', { params: { keyword } }),

  // 사용자 상세 조회
  getUser: (userId) => api.get(`/users/${userId}`),

  // 내 정보 조회
  getMyInfo: () => api.get('/users/me'),
}
