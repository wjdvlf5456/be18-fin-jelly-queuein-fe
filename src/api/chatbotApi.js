import api from './axios'

export const chatbotApi = {
  // 챗봇 질의
  ask: (message) =>
    api.post('/chatbot/message', message, {
      headers: { 'Content-Type': 'text/plain' },
    }),
}

