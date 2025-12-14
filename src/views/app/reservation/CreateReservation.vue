<template>
  <div class="reservation-page">
    <!-- 헤더 -->
    <div class="header-row"></div>

    <!-- 자원 예약 정보 -->

    <BookingHeader
      :assetName="assetInfo?.assetName || assetName"
      v-model:date="date"
      v-model:note="note"
      :reserver="currentUserName"
      :timeRange="timeRange"
      :participants="selectedUsers"
      @add="openParticipantModal"
      @remove="removeParticipant"
    />

    <!-- 예약 시간 선택 -->
    <div class="time-section">
      <h2>예약 시간 선택</h2>
      <TimeBar :blocks="timeBlocks" v-model="selectedHours" />
    </div>

    <!-- 선택된 참여자 표시
    <div v-if="selectedUsers.length" class="selected-users">
      선택된 참여자:
      <span v-for="user in selectedUsers" :key="user.id" class="user-chip">
        {{ user.name }}
      </span>
    </div> -->

    <!-- 참여자 선택 모달 -->
    <ParticipantModal
      :show="participantModalVisible"
      @close="participantModalVisible = false"
      @select="onSelectParticipants"
    />

    <!-- 예약 신청 버튼 -->
    <ApplyButton @click="submitBooking" />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api/axios'

import TimeBar from '@/components/reservation/TimeBar.vue'
import BookingHeader from '@/components/reservation/BookingHeader.vue'
import ParticipantModal from '@/components/reservation/ParticipantModal.vue'
import ApplyButton from '@/components/reservation/ApplyButton.vue'
import { reservationApi } from '@/api/reservationApi'

const router = useRouter()

const route = useRoute()

// 목록 페이지에서 전달한 assetId와 date → params 로 변경!
const assetId = Number(route.query.assetId)

const selectedDate = ref(route.query.date)
const assetName = route.query.assetName?.toString() ?? ''

// 자원 정보
const assetInfo = ref<any>(null)

// 예약 가능 시간
const timeBlocks = ref<any[]>([])
const selectedHours = ref<number[]>([])
console.log('route.query.date =', route.query.date)

// 참여자
const participantModalVisible = ref(false)
const selectedUsers = ref([])
const note = ref('')

// -------------------------------
//  예약 가능 시간 조회 API
// -------------------------------
const today = new Date().toLocaleDateString('en-CA')

const rawDate = route.query.date
const initialDate = Array.isArray(rawDate) ? rawDate[0] : rawDate

const date = ref(initialDate || today)

// console.log("받은 값:", users);
// console.log("저장 직전:", users.map(u => ({ id: u.userId, name: u.userName })));
const removeParticipant = (user) => {
  selectedUsers.value = selectedUsers.value.filter((u) => u.id !== user.id)
}

function convertToTimeBlocks(apiData) {
  try {
    if (!apiData || !apiData.timeSlots || !Array.isArray(apiData.timeSlots)) {
      console.warn('예약 가능 시간 데이터 형식이 올바르지 않습니다.')
      return []
    }

    const blocks = []
    const availableHours = new Set<number>()

    apiData.timeSlots.forEach((slot) => {
      try {
        if (!slot || !slot.start || !slot.end) {
          console.warn('시간 슬롯 데이터가 올바르지 않습니다:', slot)
          return
        }

        // 1) start, end 숫자로 변환
        let start = Number(slot.start.slice(0, 2))
        let end = Number(slot.end.slice(0, 2))

        // 유효성 검사
        if (isNaN(start) || isNaN(end)) {
          console.warn('시간 파싱 실패:', slot)
          return
        }

        // 2) end가 00이면 24로 변경 → 정상적인 범위로 조정
        if (end === 0) end = 24

        // 3) available 이 true 일 때만 availableHours 추가
        if (slot.available) {
          for (let h = start; h < end; h++) {
            if (h >= 0 && h < 24) {
              availableHours.add(h)
            }
          }
        }
      } catch (slotError) {
        console.warn('시간 슬롯 처리 중 오류:', slotError, slot)
      }
    })

    // 4) 0~23 모든 시간대 생성
    for (let h = 0; h < 24; h++) {
      blocks.push({
        label: `${h}:00`,
        type: availableHours.has(h) ? 'available' : 'reserved',
        start: h,
        end: h + 1,
      })
    }

    return blocks
  } catch (error) {
    console.error('시간 블록 변환 실패:', error)
    return []
  }
}

const fetchAvailableTimes = async () => {
  try {
    if (!assetId || isNaN(assetId)) {
      console.error('유효하지 않은 assetId:', assetId)
      return
    }

    if (!date.value) {
      console.error('날짜가 없습니다.')
      return
    }

    const res = await reservationApi.getAvailableTimes(assetId, date.value)

    if (res?.data?.timeSlots) {
      timeBlocks.value = convertToTimeBlocks(res.data)
    } else {
      console.warn('예약 가능 시간 데이터 형식이 올바르지 않습니다.')
      timeBlocks.value = []
    }
  } catch (error) {
    console.error('예약 가능 시간 조회 실패:', error)
    ElMessage.error('예약 가능 시간을 불러오는데 실패했습니다.')
    timeBlocks.value = []
  }
}

// 날짜 변경 시 자동으로 예약 가능 시간 갱신
watch(
  () => date.value,
  () => {
    if (date.value && assetId) {
      fetchAvailableTimes()
    }
  },
)

// -------------------------------
// 선택 시간 → 시간 문자열로 변환
// -------------------------------
const timeRange = computed(() => {
  if (!selectedHours.value.length) return '-'
  const start = Math.min(...selectedHours.value)
  const end = Math.max(...selectedHours.value) + 1

  return `${String(start).padStart(2, '0')}:00 ~ ${String(end).padStart(2, '0')}:00`
})

// 모달
const openParticipantModal = () => (participantModalVisible.value = true)

function toUtcIso(date, hour) {
  const local = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00+09:00`)
  return local.toISOString()
}

// -------------------------------
// 예약 생성 API
// -------------------------------
async function submitBooking() {
  try {
    // 유효성 검사
    if (!selectedHours.value.length) {
      ElMessage.warning('예약 시간을 선택해주세요.')
      return
    }

    if (!currentUserId.value) {
      ElMessage.error('사용자 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.')
      return
    }

    if (!assetId || isNaN(assetId)) {
      ElMessage.error('자원 정보가 올바르지 않습니다.')
      return
    }

    if (!date.value) {
      ElMessage.error('날짜를 선택해주세요.')
      return
    }

    const startHour = Math.min(...selectedHours.value)
    const endHourRaw = Math.max(...selectedHours.value) + 1

    let endDateValue = date.value
    let endHour = endHourRaw

    if (endHourRaw === 24) {
      const [y, m, d] = date.value.split('-').map(Number)
      if (isNaN(y) || isNaN(m) || isNaN(d)) {
        ElMessage.error('날짜 형식이 올바르지 않습니다.')
        return
      }
      const nextDay = new Date(Date.UTC(y, m - 1, d + 1))
      endDateValue = nextDay.toISOString().slice(0, 10) // yyyy-MM-dd
      endHour = 0
    }

    // --- KST(+09:00) → UTC ISO 변환 ---
    const startAt = toUtcIso(date.value, startHour)
    const endAt = toUtcIso(endDateValue, endHour)

    // 시간 유효성 검사
    if (!startAt || !endAt) {
      ElMessage.error('예약 시간을 계산하는 중 오류가 발생했습니다.')
      return
    }

    const payload = {
      applicantId: currentUserId.value,
      attendantIds: selectedUsers.value.map((u) => u.id),
      startAt,
      endAt,
      description: note.value || '',
    }

    await api.post(`/reservations/${assetId}/instant-confirm`, payload)

    ElMessage.success('예약이 완료되었습니다.')
    router.push('/app/reservations/me')
  } catch (error) {
    console.error('예약 생성 실패:', error)

    let errorMessage = '예약 생성에 실패했습니다.'

    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      if (status === 400) {
        errorMessage = data?.message || '요청 정보가 올바르지 않습니다. 입력 내용을 확인해주세요.'
      } else if (status === 403) {
        errorMessage = data?.message || '예약 권한이 없습니다.'
      } else if (status === 409) {
        errorMessage = data?.message || '해당 시간대에 이미 예약이 있습니다.'
      } else if (status === 404) {
        errorMessage = data?.message || '자원을 찾을 수 없습니다.'
      } else {
        errorMessage = data?.message || `예약 생성에 실패했습니다. (${status})`
      }
    } else if (error.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
  }
}
const currentUserName = ref('')
const currentUserId = ref(null)
onMounted(async () => {
  try {
    const res = await api.get('/users/me')
    if (res?.data) {
      currentUserId.value = res.data.userId
      currentUserName.value = res.data.userName
    } else {
      console.error('사용자 정보 응답 형식이 올바르지 않습니다.')
      ElMessage.error('사용자 정보를 불러올 수 없습니다.')
    }
  } catch (e) {
    console.error('유저 정보 조회 실패', e)
    ElMessage.error('사용자 정보를 불러오는데 실패했습니다.')
  }

  try {
    await fetchAvailableTimes()
  } catch (error) {
    console.error('초기 데이터 로딩 실패:', error)
  }
})

const onSelectParticipants = (users) => {
  console.log('모달에서 선택된 유저들:', users)
  selectedUsers.value = users.map((u) => ({
    id: u.userId,
    name: u.userName,
  }))
  console.log('BookingHeader로 전달할 selectedUsers:', selectedUsers.value)
}

// -------------------------------
// 페이지 로딩 시 API 호출
// -------------------------------
</script>

<style scoped>
.reservation-page {
  padding: 20px;
}

.time-section {
  margin-top: 40px;
}
.time-section h2 {
  margin-top: 20px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.selected-users {
  margin: 10px 0;
  font-weight: 600;
}

.user-chip {
  display: inline-block;
  background: #b6ceb4;
  padding: 4px 8px;
  margin-right: 6px;
  border-radius: 8px;
  font-size: 13px;
}
</style>
