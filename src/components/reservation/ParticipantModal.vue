<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import api from '@/api/axios'

// ------------------
// Props & Emits
// ------------------
const props = defineProps({
  show: { type: Boolean, default: false },
  width: { type: String, default: '360px' }
})

const emit = defineEmits(['close', 'select'])

// ------------------
// 상태
// ------------------
const users = ref([])     // 🔹 검색 결과
const keyword = ref('')
const selectedIds = ref([])  // 선택된 유저 ID들
const selectedUserObjects = ref([])

// ------------------
// Debounce + API 호출
// ------------------
let timer = null

watch(keyword, (val) => {
  if (timer) clearTimeout(timer)

  timer = setTimeout(() => {
    fetchUsers(val)
  }, 300)
})

// 검색 결과가 들어와도 기존 선택 유지
const fetchUsers = async (keyword) => {
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
const toggleSelect = (user) => {
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
  <Dialog
    :visible="show"
    modal
    header="참여자 선택"
    :style="{ width: width || '360px' }"
    @update:visible="emit('close')"
  >

      <!-- 검색창 -->
      <div class="search-box">
        <InputText
          v-model="keyword"
          placeholder="사용자명을 입력해주세요"
          class="search-input"
        />
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
      <div style="margin-top: 12px;">
        <Button
          label="선택 완료"
          @click="submitSelection"
          :disabled="!selectedIds.length"
          style="width: 100%"
        />
      </div>
  </Dialog>
</template>

<style scoped>
.search-box {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
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
.empty { text-align:center; color:#999; padding:20px 0; }
</style>
