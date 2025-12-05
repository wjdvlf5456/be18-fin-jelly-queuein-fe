<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, watch } from 'vue'
import api from '@/api/axios'

// ------------------
// 타입 정의 (백엔드 DTO 기반)
// ------------------
interface User {
  userId: number
  userName: string
  email: string
  avatarUrl?: string
}

// ------------------
// Props & Emits
// ------------------
const props = defineProps({
  show: { type: Boolean, default: false },
  width: { type: String, default: '360px' }
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', users: User[]): void
}>()

// ------------------
// 상태
// ------------------
const users = ref<User[]>([])     // 🔹 검색 결과
const keyword = ref('')
const selectedIds = ref<number[]>([])  // 선택된 유저 ID들
const selectedUserObjects = ref<User[]>([])

// ------------------
// Debounce + API 호출
// ------------------
let timer: any = null

watch(keyword, (val) => {
  if (timer) clearTimeout(timer)

  timer = setTimeout(() => {
    fetchUsers(val)
  }, 300)
})

// 검색 결과가 들어와도 기존 선택 유지
const fetchUsers = async (keyword: string) => {
  if (!keyword) {
    users.value = []
    return
  }

  try {
    const res = await api.get('/users/lookup', { params: { keyword } })

    const newList = res.data.map(u => ({
      userId: u.userId,
      userName: u.userName,
      email: u.email,
    }))

    users.value = newList
  } catch (err) {
    console.error('사용자 조회 실패', err)
  }
}


// ------------------
// 검색 필터 (API 결과에 재필터링 효과)
// ------------------
const filteredUsers = computed(() => {
  if (!keyword.value) return users.value
  return users.value.filter(u =>
    (u.userName ?? '').includes(keyword.value)
  )
})

// ------------------
// 선택 토글
// ------------------
const toggleSelect = (user: User) => {
  const idx = selectedIds.value.indexOf(user.userId)

  if (idx === -1) {
    selectedIds.value.push(user.userId)
    selectedUserObjects.value.push(user)
  } else {
    selectedIds.value.splice(idx, 1)
    selectedUserObjects.value = selectedUserObjects.value.filter(
      u => u.userId !== user.userId
    )
  }
}


// ------------------
// 선택 완료
// ------------------
const submitSelection = () => {
  emit('select', selectedUserObjects.value)
  emit('close')
}


</script>

<template>
  <div v-if="show" class="overlay" @click.self="emit('close')">
    <div class="modal" :style="{ width }">
      <h3 class="title">참여자 선택</h3>

      <!-- 검색창 -->
      <div class="search-box">
        <input
          v-model="keyword"
          type="text"
          placeholder="사용자명을 입력해주세요"
          class="search-input"
        />
        <svg class="search-icon" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-width="2"
            d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
          />
        </svg>
      </div>

      <!-- 사용자 목록 -->
      <div class="list" v-if="filteredUsers.length">
        <div 
          v-for="user in filteredUsers" 
          :key="user.userId" 
          class="item"
          @click="toggleSelect(user)"
          :class="{ selected: selectedIds.includes(user.userId) }"
        >
          <img v-if="user.avatarUrl" :src="user.avatarUrl" class="avatar" />
          <div v-else class="avatar placeholder">{{ user.userName.slice(0, 1) }}</div>

          <div class="info">
            <div class="name">{{ user.userName }}</div>
            <div class="email">{{ user.email }}</div>
          </div>
        </div>
      </div>

      <div v-else class="empty">검색 결과가 없습니다.</div>

      <!-- 선택 완료 버튼 -->
      <button class="submit-btn" @click="submitSelection" :disabled="!selectedIds.length">
        선택 완료
      </button>
    </div>
  </div>
</template>

<style scoped>
.overlay { 
  position: fixed; inset:0; 
  display:flex; justify-content:center; align-items:center; 
  background:rgba(0,0,0,0.35); 
  z-index:9999; 
}
.modal { 
  background:#fff; padding:24px; border-radius:12px; 
  width:360px; 
}
.title { 
  font-weight:700; font-size:18px; margin-bottom:16px; 
}
.search-box { position: relative; margin-bottom:12px; }
.search-input { 
  width:100%; padding:8px 36px 8px 12px; 
  border-radius:6px; border:1px solid #ccc; font-size:14px; 
}
.search-icon { 
  position: absolute; right: 10px; top: 50%; 
  transform: translateY(-50%); 
  width: 18px; height: 18px; color: #aaa; 
}
.list { max-height:300px; overflow-y:auto; margin-bottom:12px; }
.item { 
  display:flex; align-items:center; padding:10px; 
  border-bottom:1px solid #eee; 
  cursor:pointer; transition: background 0.15s; 
}
.item:hover { background:#f7f7f7; }
.item.selected { background:#B6CEB4; color:#000; }
.avatar { width:38px; height:38px; border-radius:50%; }
.placeholder { 
  background:#d9e7ff; color:#394f3b; 
  display:flex; align-items:center; justify-content:center; 
  font-weight:bold; 
}
.info { margin-left:10px; flex:1; }
.name { font-weight:600; font-size:14px; }
.email { font-size:12px; color:#666; }
.submit-btn { 
  width:100%; padding:10px; border-radius:8px; 
  background:#abdfb0; color:#fff; font-weight:600; 
  cursor:pointer; 
}
.submit-btn:disabled { background:#ccc; cursor:not-allowed; }
.empty { text-align:center; color:#999; padding:20px 0; }
</style>
