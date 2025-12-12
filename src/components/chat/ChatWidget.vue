<template>
  <div class="chat-widget">
    <div class="chat-toggle" @click="toggle">
      <i class="ri-robot-2-line"></i>
    </div>

    <Transition name="fade">
      <div v-if="open" class="chat-panel">
        <div class="chat-header">
          <div class="title">
            <i class="ri-robot-2-line"></i>
            QueueIn 챗봇
          </div>
          <button class="close-btn" @click="toggle">
            <i class="ri-close-line"></i>
          </button>
        </div>

        <div class="chat-body" ref="scrollRef">
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="chat-bubble"
            :class="msg.role"
          >
            <p class="text">{{ msg.content }}</p>
          </div>
          <div v-if="loading" class="chat-bubble bot loading">
            <i class="ri-loader-4-line spin"></i>
            <span>생각 중...</span>
          </div>
        </div>

        <form class="chat-input" @submit.prevent="send">
          <input
            v-model="input"
            type="text"
            placeholder="무엇을 도와드릴까요?"
            :disabled="loading"
          />
          <button type="submit" :disabled="!input.trim() || loading">
            <i class="ri-send-plane-2-line"></i>
          </button>
        </form>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { chatbotApi } from '@/api/chatbotApi'

const open = ref(false)
const input = ref('')
const loading = ref(false)
const messages = ref([
  { role: 'bot', content: '안녕하세요! 자원 예약/상태/위치 등을 물어보세요.' },
])

const scrollRef = ref(null)

const toggle = () => {
  open.value = !open.value
  if (open.value) nextTick(scrollToBottom)
}

const scrollToBottom = () => {
  const el = scrollRef.value
  if (el) el.scrollTop = el.scrollHeight
}

const send = async () => {
  const text = input.value.trim()
  if (!text) return

  messages.value.push({ role: 'user', content: text })
  input.value = ''
  loading.value = true
  await nextTick(scrollToBottom)

  try {
    const res = await chatbotApi.ask(text)
    const answer = res?.data ?? '아직 지원하지 않는 요청입니다. 다시 질문해 주세요.'
    messages.value.push({ role: 'bot', content: answer })
  } catch (err) {
    console.error('챗봇 오류:', err)
    messages.value.push({
      role: 'bot',
      content: '아직 지원하지 않는 요청입니다. 다시 질문해 주세요.',
    })
  } finally {
    loading.value = false
    await nextTick(scrollToBottom)
  }
}
</script>

<style scoped>
.chat-widget {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2000;
}

.chat-toggle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chat-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
}

.chat-panel {
  position: absolute;
  bottom: 60px;
  right: 0;
  width: 340px;
  max-height: 520px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #eef2ff, #f5f3ff);
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #1f2937;
}

.close-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 18px;
  color: #6b7280;
}

.chat-body {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  background: #f9fafb;
}

.chat-bubble {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 12px;
  margin-bottom: 10px;
  line-height: 1.5;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.chat-bubble.user {
  background: #e0f2fe;
  color: #0f172a;
  margin-left: auto;
}

.chat-bubble.bot {
  background: #fff;
  color: #111827;
  margin-right: auto;
}

.chat-bubble.loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.chat-input {
  border-top: 1px solid #e5e7eb;
  padding: 10px;
  display: flex;
  gap: 8px;
  background: #fff;
}

.chat-input input {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.chat-input input:focus {
  border-color: #3b82f6;
}

.chat-input button {
  width: 42px;
  border: none;
  background: #3b82f6;
  color: white;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.chat-input button:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>

