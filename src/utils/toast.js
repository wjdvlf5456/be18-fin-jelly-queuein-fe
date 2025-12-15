// 전역 Toast 유틸리티
// PrimeVue ToastService를 사용하여 전역적으로 Toast 메시지를 표시할 수 있도록 함

let toastInstance = null

// Toast 인스턴스 설정 (main.js에서 호출)
export function setToastInstance(instance) {
  toastInstance = instance
}

// 권한 오류 메시지 표시
export function showPermissionError() {
  if (toastInstance) {
    toastInstance.add({
      severity: 'error',
      summary: '권한 오류',
      detail: '권한이 없습니다.',
      life: 3000,
    })
  } else {
    // Toast 인스턴스가 아직 설정되지 않은 경우 (초기 로딩 시)
    // 약간의 지연 후 다시 시도
    setTimeout(() => {
      if (toastInstance) {
        toastInstance.add({
          severity: 'error',
          summary: '권한 오류',
          detail: '권한이 없습니다.',
          life: 3000,
        })
      }
    }, 100)
  }
}

