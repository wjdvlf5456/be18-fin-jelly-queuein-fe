import api from './axios'

export const assetApi = {
  // 생성
  create: (data) => api.post('/assets', data),

  // 수정
  update: (id, data) => api.patch(`/assets/${id}`, data),

  // 삭제
  delete: (id) => api.delete(`/assets/${id}`),

  // 이동
  move: (id, parentName) => api.patch(`/assets/${id}/move`, { parentName }),

  // 자원 상세 조회
  getDetail: (id) => api.get(`/assets/${id}`),

  // 사옥 (0 depth) 계층 조회
  getRoots: () => api.get('/assets/roots'),

  // 위치(1 depth) 계층 조회
  getOneDepth: (rootId) => api.get(`/assets/${rootId}/one-depth`),

  // 자원 목록 조회 (descendants)
  getDescendants: (params) => api.get('/assets/descendants', { params }),

  // 자원 전체 계층 조회
  getTree: () => api.get('/assets/tree'),
}
