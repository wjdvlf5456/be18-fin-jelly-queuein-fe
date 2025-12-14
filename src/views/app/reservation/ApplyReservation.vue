<template>
  <div class="reservation-page">
    <!-- 헤더 -->
    <div class="header-row">

    </div>

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
      <TimeBar
        :blocks="timeBlocks"
        v-model="selectedHours"
      />
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

    <!-- 예약 신청 완료 모달 -->
    <ConfirmModal
      v-if="showSuccessModal"
      title="예약 신청 완료"
      message="예약 신청이 완료되었습니다."
      @confirm="handleSuccessConfirm"
      @cancel="handleSuccessConfirm"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api/axios'

import TimeBar from '@/components/reservation/TimeBar.vue'
import BookingHeader from '@/components/reservation/BookingHeader.vue'
import ParticipantModal from '@/components/reservation/ParticipantModal.vue'
import ApplyButton from '@/components/reservation/ApplyButton.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { reservationApi } from '@/api/reservationApi'

const router = useRouter()

const route = useRoute()

// 목록 페이지에서 전달한 assetId와 date → params 로 변경!
const assetId = Number(route.query.assetId)

const assetName = route.query.assetName?.toString() ?? ""

// 자원 정보
const assetInfo = ref<any>(null)

// 예약 가능 시간
const timeBlocks = ref<any[]>([])
const selectedHours = ref<number[]>([])
console.log("route.query.date =", route.query.date)

// 참여자
const participantModalVisible = ref(false)
const selectedUsers = ref([])
const note = ref("")

// 예약 신청 완료 모달
const showSuccessModal = ref(false)

// ============================================
// 중복 호출 방지 메커니즘
// ============================================
// isLoadingTimes: 예약 가능 시간 로딩 중인지 확인
const isLoadingTimes = ref(false)
// lastFetchedDate: 마지막으로 조회한 날짜 (동일 날짜 중복 방지)
const lastFetchedDate = ref(null)
// debounceTimer: watch debounce용 타이머
let debounceTimer = null

// -------------------------------
// 예약 가능 시간 조회 API
// -------------------------------
const today = new Date().toLocaleDateString('en-CA')

const rawDate = route.query.date
const initialDate =
  Array.isArray(rawDate) ? rawDate[0] : rawDate

const date = ref(initialDate || today)

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
const removeParticipant = (user) => {
  selectedUsers.value = selectedUsers.value.filter(
    (u) => u.id !== user.id
  );
};
// ============================================
// 예약 가능 시간 조회 (중복 방지 적용)
// ============================================
const fetchAvailableTimes = async (force = false) => {
  // Guard 1: 유효성 검사
  if (!assetId || isNaN(assetId)) {
    console.error('유효하지 않은 assetId:', assetId)
    return
  }

  if (!date.value) {
    console.error('날짜가 없습니다.')
    return
  }

  // Guard 2: 이미 로딩 중이고 force가 false면 스킵
  if (isLoadingTimes.value && !force) {
    console.log('fetchAvailableTimes: 이미 로딩 중이므로 스킵')
    return
  }

  // Guard 3: 동일한 날짜를 이미 조회했고 force가 false면 스킵
  if (lastFetchedDate.value === date.value && !force) {
    console.log('fetchAvailableTimes: 동일한 날짜를 이미 조회했으므로 스킵', date.value)
    return
  }

  isLoadingTimes.value = true
  lastFetchedDate.value = date.value

  try {
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
    // 에러 발생 시 lastFetchedDate 초기화 (재시도 가능하도록)
    lastFetchedDate.value = null
  } finally {
    isLoadingTimes.value = false
  }
}

// ============================================
// 날짜 변경 감지 (debounce 적용)
// ============================================
// 날짜 변경 시 자동으로 예약 가능 시간 갱신
// debounce: 300ms 지연으로 빠른 연속 변경 시 중복 호출 방지
watch(
  () => date.value,
  () => {
    if (!date.value || !assetId) return

    // 이전 타이머 취소
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // 300ms 후 실행 (debounce)
    debounceTimer = setTimeout(() => {
      fetchAvailableTimes()
    }, 300)
  },
)


// -------------------------------
// 선택 시간 → 시간 문자열로 변환
// -------------------------------
const timeRange = computed(() => {
  if (!selectedHours.value.length) return '-'
  const start = Math.min(...selectedHours.value)
  const end = Math.max(...selectedHours.value) + 1

  return `${String(start).padStart(2,'0')}:00 ~ ${String(end).padStart(2,'0')}:00`
})

// 모달
const openParticipantModal = () => participantModalVisible.value = true

const onSelectParticipants = (users) => {
  console.log("모달에서 선택된 유저들:", users);
  selectedUsers.value = users.map(u => ({
    id: u.userId,
    name: u.userName
  }));
  console.log("BookingHeader로 전달할 selectedUsers:", selectedUsers.value);
};
function toUtcIso(date, hour) {
  // date = "2025-12-03"
  // hour = 0~23 (KST)
  const local = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00+09:00`);
  return local.toISOString(); // → UTC 변환
}

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
    const endHour = Math.max(...selectedHours.value) + 1

    const startAt = toUtcIso(date.value, startHour)
    const endAt = toUtcIso(date.value, endHour)

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

    await api.post(`/reservations/${assetId}/apply`, payload)

    // 성공 모달 표시
    showSuccessModal.value = true
  } catch (error) {
    console.error('예약 신청 실패:', error)

    let errorMessage = '예약 신청에 실패했습니다.'

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
        errorMessage = data?.message || `예약 신청에 실패했습니다. (${status})`
      }
    } else if (error.request) {
      errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }

    ElMessage.error(errorMessage)
  }
}

// 예약 신청 완료 모달 확인 처리
function handleSuccessConfirm() {
  showSuccessModal.value = false
  router.push('/app/reservations/me')
}





const currentUserName = ref("")
const currentUserId = ref(null)
onMounted(async () => {
  try {
    const res = await api.get('/users/me')
    if (res?.data) {
      currentUserName.value = res.data.userName
      currentUserId.value = res.data.userId
    } else {
      console.error('사용자 정보 응답 형식이 올바르지 않습니다.')
      ElMessage.error('사용자 정보를 불러올 수 없습니다.')
    }
  } catch (e) {
    console.error('유저 정보 조회 실패', e)
    ElMessage.error('사용자 정보를 불러오는데 실패했습니다.')
  }

  // 초기 로드는 강제 실행 (watch와 중복되어도 최신 데이터 보장)
  // watch가 이미 실행될 수 있으므로 약간의 지연을 두고 실행
  await nextTick()
  setTimeout(() => {
    if (date.value && assetId) {
      fetchAvailableTimes(true) // force: true로 강제 실행
    }
  }, 100)
})



// -------------------------------
// 컴포넌트 언마운트 시 정리
// -------------------------------
onBeforeUnmount(() => {
  // debounce 타이머 정리
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
})

</script>

<style scoped>
.reservation-page {
  padding: 20px;
}

.time-section {
  margin-top: 40px;
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
