import { notificationApi } from '@/api/notificationApi'
import { authApi } from '@/api/authApi'

class SseService {
  constructor() {
    this.eventSource = null
    this.listeners = new Map()
    this.isConnected = false
    this.isConnecting = false // 연결 시도 중 여부
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.isInitialConnect = true // 최초 연결 여부
    this.reconnectTimer = null
  }

  // 토큰 갱신 (최초 연결 시에만 사용)
  async refreshToken() {
    try {
      const res = await authApi.refresh()
      const newAccessToken = res.data.accessToken
      if (newAccessToken) {
        localStorage.setItem('accessToken', newAccessToken)
        console.log('Access token refreshed for SSE')
        return newAccessToken
      }
    } catch (err) {
      // refresh 실패 시 조용히 처리 (401은 정상적인 경우일 수 있음)
      // refresh 토큰이 만료되었거나 없을 때는 에러를 출력하지 않음
      // 401 에러는 조용히 무시 (콘솔에 표시하지 않음)
      if (err.response?.status !== 401) {
        console.error('Failed to refresh token for SSE:', err)
      }
      // refresh 실패 시 로그아웃 처리하지 않음 (사용자가 로그인 상태일 수 있음)
      return null
    }
    return null
  }

  // SSE 연결
  async connect(onMessage, onError) {
    // 이미 연결되어 있고 열려있으면 재연결하지 않음
    if (this.isConnected && this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      console.log('SSE is already connected')
      return this.eventSource
    }

    // 연결 중이면 대기
    if (this.isConnecting) {
      console.log('SSE connection already in progress')
      return null
    }

    this.isConnecting = true

    try {
      // 최초 연결 시에만 토큰 갱신 (재연결 시에는 갱신하지 않음)
      if (this.isInitialConnect) {
        const refreshed = await this.refreshToken()
        // refresh 토큰이 만료되었거나 없으면 SSE 연결 시도하지 않음
        if (!refreshed) {
          this.isConnecting = false
          // 조용히 실패 (콘솔에 표시하지 않음)
          return null
        }
        this.isInitialConnect = false
      }

      this.eventSource = await notificationApi.subscribe()

      this.eventSource.onopen = () => {
        console.log('SSE connected')
        this.isConnected = true
        this.isConnecting = false
        this.reconnectAttempts = 0 // 연결 성공 시 재시도 횟수 리셋
        // 재연결 타이머 클리어
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
          this.reconnectTimer = null
        }
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (onMessage) {
            onMessage(data)
          }
          // 등록된 모든 리스너에 알림
          this.listeners.forEach((callback) => {
            callback(data)
          })
        } catch (err) {
          console.error('Failed to parse SSE message:', err)
        }
      }

      this.eventSource.onerror = (error) => {
        this.isConnecting = false

        // readyState 확인
        // 0: CONNECTING, 1: OPEN, 2: CLOSED
        if (this.eventSource.readyState === EventSource.CLOSED) {
          this.isConnected = false

          // 에러가 401이 아니면만 로그 출력
          if (onError && error?.response?.status !== 401) {
            onError(error)
          }

          // 재연결 시도 (토큰 갱신 없이)
          this.scheduleReconnect(onMessage, onError)
        }
      }
    } catch (err) {
      this.isConnecting = false

      // 401 에러는 조용히 처리
      if (err?.response?.status !== 401) {
        console.error('Failed to create SSE connection:', err)
      }

      if (onError && err?.response?.status !== 401) {
        onError(err)
      }
      // 초기 연결 실패 시에도 재연결 시도 (401이 아닐 때만)
      if (err?.response?.status !== 401) {
        this.scheduleReconnect(onMessage, onError)
      }
    }

    return this.eventSource
  }

  // 재연결 스케줄링 (토큰 갱신 포함, 하지만 제한적으로)
  scheduleReconnect(onMessage, onError) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++

    // Exponential backoff: 재연결 시도가 많을수록 대기 시간 증가
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    const maxDelay = 30000 // 최대 30초
    const finalDelay = Math.min(delay, maxDelay)

    console.log(
      `Scheduling reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${finalDelay}ms...`,
    )

    // 재연결 전에 토큰 갱신 (재연결 시에만, 최초 연결이 아닐 때)
    // 하지만 너무 자주 갱신하지 않도록 제한
    const shouldRefresh = this.reconnectAttempts <= 2 // 처음 2번의 재연결 시에만 refresh

    this.reconnectTimer = setTimeout(async () => {
      this.disconnect()

      // 재연결 시 토큰 갱신 (제한적으로)
      if (shouldRefresh) {
        try {
          const refreshed = await this.refreshToken()
          // refresh 실패 시 재연결 중단
          if (!refreshed) {
            console.log('Skipping reconnect due to refresh token failure')
            return
          }
        } catch (err) {
          console.error('Token refresh failed during reconnect:', err)
          return
        }
      }

      await this.connect(onMessage, onError)
    }, finalDelay)
  }

  // 재연결 시도 (deprecated - scheduleReconnect 사용)
  async reconnect(onMessage, onError) {
    this.scheduleReconnect(onMessage, onError)
  }

  // 리스너 등록
  addListener(id, callback) {
    this.listeners.set(id, callback)
  }

  // 리스너 제거
  removeListener(id) {
    this.listeners.delete(id)
  }

  // SSE 연결 해제
  disconnect() {
    // 재연결 타이머 클리어
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.isConnected = false
      this.reconnectAttempts = 0
      this.isInitialConnect = true // 다음 연결을 위해 초기화
      this.listeners.clear()
    }

    // 백엔드에 구독 해제 요청
    notificationApi.unsubscribe().catch((err) => {
      console.error('Failed to unsubscribe:', err)
    })
  }
}

// 싱글톤 인스턴스
export const sseService = new SseService()
