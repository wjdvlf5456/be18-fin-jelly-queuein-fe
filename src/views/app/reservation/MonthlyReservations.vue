<template>
  <div class="calendar-page">
    <!-- 왼쪽 미니 캘린더 -->
    <MiniCalendar
      :selected-date="selectedDate"
      :events="calendarEvents"
      :current-view="currentView"
      @date-select="onMiniCalendarDateSelect"
      @event-click="onMiniCalendarEventClick"
    />

    <!-- 오른쪽 메인 캘린더 -->
    <div class="main-calendar-container">
      <Card class="calendar-card">
        <template #content>
          <div class="calendar-content-wrapper">
            <div class="calendar-top">
          <!-- 월별/주별/일별 버튼 -->
          <div class="calendar-toggle">
            <Button
              label="월별"
              :outlined="currentView !== 'dayGridMonth'"
              :class="{ 'active-view': currentView === 'dayGridMonth' }"
              @click="changeView('dayGridMonth')"
            />
            <Button
              label="주별"
              :outlined="currentView !== 'timeGridWeek'"
              :class="{ 'active-view': currentView === 'timeGridWeek' }"
              @click="changeView('timeGridWeek')"
            />
            <Button
              label="일별"
              :outlined="currentView !== 'timeGridDay'"
              :class="{ 'active-view': currentView === 'timeGridDay' }"
              @click="changeView('timeGridDay')"
            />
          </div>
        </div>

            <div class="calendar-wrapper">
              <FullCalendar ref="calendarRef" :options="calendarOptions" />
            </div>
          </div>
        </template>
      </Card>

    <!-- 예약 상세 모달 -->
    <ReservationDetailModal
      :visible="modalOpen"
      :asset="reservationDetail"
      @close="closeModal"
      @start="handleStart"
      @end="handleEnd"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import koLocale from '@fullcalendar/core/locales/ko.js'
import { reservationApi } from '@/api/reservationApi'
import ReservationDetailModal from '@/components/reservation/ReservationDetailModal.vue'
import MiniCalendar from '@/components/reservation/MiniCalendar.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'

const calendarRef = ref(null)
const today = new Date()
const selectedDate = ref(today)
const currentView = ref('dayGridMonth')
const calendarEvents = ref([]) // 미니 캘린더용 이벤트 목록
const isChangingView = ref(false) // 뷰 변경 중 플래그

// 모달 관련
const modalOpen = ref(false)
const reservationDetail = ref(null)

// 날짜를 YYYY-MM-DD 형식으로 변환
const formatDateForApi = (date) => {
  if (!date) return new Date().toISOString().slice(0, 10)
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/* ---------------------------
   FullCalendar 옵션
---------------------------- */
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin],
  locale: koLocale,
  initialView: currentView.value,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: ''
  },
  buttonText: {
    today: '오늘',
    month: '월',
    week: '주',
    day: '일'
  },
  views: {
    timeGridDay: {
      slotMinTime: '00:00:00',
      slotMaxTime: '24:00:00',
      slotDuration: '00:30:00',
      contentHeight: 'auto',
    },
    timeGridWeek: {
      slotMinTime: '00:00:00',
      slotMaxTime: '24:00:00',
      slotDuration: '00:30:00',
      contentHeight: 'auto',
    }
  },
  contentHeight: 'auto',
  displayEventTime: false,
  eventOverlap: false,
  slotEventOverlap: false,
  eventMaxStack: 1,
  allDaySlot: false,
  firstDay: 0, // 일요일부터 시작
  dayHeaderFormat: { weekday: 'short' }, // 요일을 짧게 표시 (일, 월, 화...)
  slotLabelFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  
  eventContent: (arg) => {
    // 로컬 시간으로 변환하여 표시
    const startTime = arg.event.start ? new Date(arg.event.start).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
    const endTime = arg.event.end ? new Date(arg.event.end).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
    const timeText = endTime ? `${startTime} - ${endTime}` : startTime
    const count = arg.event.extendedProps.count ?? 1
    const bgColor = arg.event.backgroundColor || '#fce7f3'
    const textColor = arg.event.textColor || '#9f1239'
    return {
      html: `
        <div class="custom-event-chip" style="background-color: ${bgColor}; color: ${textColor};">
          <span class="event-title">${timeText} ${arg.event.title}</span>
          ${count > 1 ? `<span class="event-badge">+${count - 1}</span>` : ""}
        </div>
      `
    }
  },
  
  eventClick: (info) => {
    const reservationId = info.event.id
    if (reservationId) {
      openDetailModal(reservationId)
    }
  },
  events: [],
  
  // 날짜 변경 시 이벤트 로드
  datesSet: async (info) => {
    const api = calendarRef.value?.getApi()
    if (!api) return
    
    // 뷰 변경 중이면 잠시 대기 후 플래그 해제 (changeView에서 이미 로드함)
    if (isChangingView.value) {
      // 플래그가 너무 오래 true로 남아있지 않도록 안전장치
      setTimeout(() => {
        isChangingView.value = false
      }, 1000)
      return
    }
    
    // 주간/일간 뷰일 때는 주별 API 호출
    if (currentView.value === 'timeGridWeek' || currentView.value === 'timeGridDay') {
      const startDate = info.startStr.slice(0, 10)
      try {
        const res = await reservationApi.getWeeklyReservations(startDate)
        const json = res.data.reservations ? res.data : res.data.data?.reservations ? res.data.data : res.data.result?.reservations ? res.data.result : null
        
        if (json && json.reservations) {
          const events = convertReservationsToEvents(json)
          calendarEvents.value = events
          
          api.removeAllEvents()
          events.forEach(ev => api.addEvent(ev))
          
          await nextTick()
          setTimeout(() => {
            applySlotBackgrounds()
          }, 600)
        } else {
          // 예약이 없는 경우에도 기존 이벤트 제거
          api.removeAllEvents()
          calendarEvents.value = []
        }
      } catch (err) {
        console.error('주별 예약 조회 실패:', err)
        // 에러 발생 시에도 기존 이벤트 제거하지 않음 (재시도 가능하도록)
      }
    } else {
      // 월별 뷰일 때는 월별 API 호출
      await loadCalendarEvents()
    }
  },
  
  // 이벤트가 마운트될 때 타임슬롯 배경색 적용 (주간/일간 뷰일 때만)
  eventDidMount: (arg) => {
    const event = arg.event
    if (!event.start || !event.end) return
    
    const bgColor = event.backgroundColor || '#fce7f3'
    const textColor = event.textColor || '#9f1239'
    
    // fc-event-main 전체에 배경색 적용
    const eventMain = arg.el.querySelector('.fc-event-main')
    if (eventMain) {
      eventMain.style.backgroundColor = bgColor
      eventMain.style.color = textColor
      // padding과 border-radius 제거하여 전체 영역에 색상 적용
      eventMain.style.padding = '0'
      eventMain.style.borderRadius = '0'
    }
    
    // fc-event 전체에도 배경색 적용
    arg.el.style.backgroundColor = bgColor
    arg.el.style.borderColor = bgColor
    
    // 주간/일간 뷰일 때 타임슬롯 배경색도 적용
    if (currentView.value === 'timeGridWeek' || currentView.value === 'timeGridDay') {
      setTimeout(() => {
        applySlotBackgrounds()
      }, 200)
    }
  },
}))

/* ---------------------------
   예약 상태별 옅은 색상 매핑
---------------------------- */
const getEventColor = (status) => {
  const statusUpper = (status || '').toUpperCase()
  switch (statusUpper) {
    case 'PENDING':
      return '#fef3c7' // 옅은 노란색
    case 'APPROVED':
      return '#d1fae5' // 옅은 초록색
    case 'USING':
      return '#dbeafe' // 옅은 파란색
    case 'COMPLETED':
      return '#f3f4f6' // 옅은 회색
    case 'REJECTED':
      return '#fee2e2' // 옅은 빨간색
    case 'CANCELED':
      return '#f9fafb' // 옅은 회색
    default:
      return '#fce7f3' // 옅은 분홍색 (기본)
  }
}

/* 텍스트 색상 매핑 */
const getEventTextColor = (status) => {
  const statusUpper = (status || '').toUpperCase()
  switch (statusUpper) {
    case 'PENDING':
      return '#92400e' // 진한 노란색 텍스트
    case 'APPROVED':
      return '#065f46' // 진한 초록색 텍스트
    case 'USING':
      return '#1e40af' // 진한 파란색 텍스트
    case 'COMPLETED':
      return '#374151' // 진한 회색 텍스트
    case 'REJECTED':
      return '#991b1b' // 진한 빨간색 텍스트
    case 'CANCELED':
      return '#6b7280' // 회색 텍스트
    default:
      return '#9f1239' // 진한 분홍색 텍스트
  }
}

/* ---------------------------
   API 데이터 → FullCalendar event 변환
---------------------------- */
const convertReservationsToEvents = (data) => {
  const events = []
  const eventRanges = [] // 모든 이벤트의 시간 범위 저장 (겹침 감지용)

  // 먼저 모든 이벤트를 생성
  data.reservations.forEach(day => {
    day.reservations.forEach(r => {
      // UTC 시간을 Date 객체로 변환 (FullCalendar가 자동으로 로컬 시간으로 표시)
      const start = new Date(r.startAt)
      const end = new Date(r.endAt)
      
      eventRanges.push({
        id: r.reservationId,
        start: start.getTime(),
        end: end.getTime()
      })
      
      events.push({
        id: r.reservationId,
        title: r.assetName,
        start: start,
        end: end,
        allDay: false,
        backgroundColor: getEventColor(r.reservationStatus),
        borderColor: getEventColor(r.reservationStatus),
        textColor: getEventTextColor(r.reservationStatus),
        extendedProps: {
          status: r.reservationStatus,
          startAt: r.startAt,
          endAt: r.endAt
        }
      })
    })
  })

  // 겹침 감지 및 색상 변경
  events.forEach(event => {
    const eventStart = event.start.getTime()
    const eventEnd = event.end.getTime()
    
    // 다른 이벤트와 겹치는지 확인
    const overlappingCount = eventRanges.filter(range => {
      if (range.id === event.id) return false
      // 시간 범위가 겹치는지 확인
      return (eventStart < range.end && eventEnd > range.start)
    }).length
    
    // 겹치는 이벤트가 있으면 색상을 변경
    if (overlappingCount > 0) {
      const baseColor = event.backgroundColor
      const baseTextColor = event.textColor
      event.backgroundColor = darkenColor(baseColor)
      event.borderColor = darkenColor(baseColor)
      event.textColor = darkenColor(baseTextColor)
      event.extendedProps.hasOverlap = true
    }
  })

  return events
}

// 색상을 더 진하게 만드는 함수
function darkenColor(color) {
  // hex 색상인 경우
  if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // 20% 어둡게
    const newR = Math.max(0, Math.floor(r * 0.8))
    const newG = Math.max(0, Math.floor(g * 0.8))
    const newB = Math.max(0, Math.floor(b * 0.8))
    
    return `rgb(${newR}, ${newG}, ${newB})`
  }
  
  // rgb 색상인 경우
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g)
    if (matches && matches.length >= 3) {
      const r = Math.max(0, Math.floor(parseInt(matches[0]) * 0.8))
      const g = Math.max(0, Math.floor(parseInt(matches[1]) * 0.8))
      const b = Math.max(0, Math.floor(parseInt(matches[2]) * 0.8))
      return `rgb(${r}, ${g}, ${b})`
    }
  }
  
  return color
}

/* ---------------------------
   YYYY-MM-DD → YYYY-MM 변환
---------------------------- */
const getYearMonth = (date) => {
  if (!date) return new Date().toISOString().slice(0, 7)
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/* ---------------------------
   API 호출하여 FullCalendar 갱신
---------------------------- */
const loadCalendarEvents = async () => {
  const yearMonth = getYearMonth(selectedDate.value)

  const res = await reservationApi.getMonthlyReservations(yearMonth)

  console.log("RAW AXIOS DATA:", res.data)

  const json =
    res.data.reservations
      ? res.data
      : res.data.data?.reservations
      ? res.data.data
      : res.data.result?.reservations
      ? res.data.result
      : null

  console.log("PARSED JSON:", json)

  const api = calendarRef.value.getApi()

  if (!json || !json.reservations) {
    console.warn("❗ reservations 데이터를 찾을 수 없습니다")
    api.removeAllEvents()
    return
  }

  const events = convertReservationsToEvents(json)
  console.log("EVENTS:", events)
  
  // 캘린더 이벤트 저장 (미니 캘린더용)
  calendarEvents.value = events

  api.removeAllEvents()
  events.forEach(ev => api.addEvent(ev))
  
  // 주간/일간 뷰일 때 타임슬롯 배경색 적용
  if (currentView.value === 'timeGridWeek' || currentView.value === 'timeGridDay') {
    await nextTick()
    setTimeout(() => {
      applySlotBackgrounds()
    }, 600)
  }
}

// 타임슬롯 배경색 적용 함수
function applySlotBackgrounds() {
  const calendarEl = calendarRef.value?.getApi()?.el
  if (!calendarEl) {
    return
  }
  
  // 모든 타임슬롯 배경색 초기화
  const allSlots = calendarEl.querySelectorAll('.fc-timegrid-slot')
  allSlots.forEach(slot => {
    slot.style.backgroundColor = ''
    slot.classList.remove('has-event-slot')
  })
  
  // 모든 이벤트 엘리먼트 찾기
  const allEvents = calendarEl.querySelectorAll('.fc-timegrid-event')
  
  if (allEvents.length === 0) {
    return
  }
  
  allEvents.forEach((eventEl) => {
    // 이벤트의 배경색 가져오기 (인라인 스타일에서)
    const eventChip = eventEl.querySelector('.custom-event-chip')
    if (!eventChip) {
      return
    }
    
    // 인라인 스타일에서 배경색 가져오기
    const bgColorStyle = eventChip.getAttribute('style')
    if (!bgColorStyle || !bgColorStyle.includes('background-color')) {
      return
    }
    
    const bgColorMatch = bgColorStyle.match(/background-color:\s*([^;]+)/)
    if (!bgColorMatch) {
      return
    }
    
    const bgColor = bgColorMatch[1].trim()
    const rgba = hexToRgbaFromString(bgColor, 0.3)
    
    // 이벤트가 속한 타임슬롯 찾기
    const timeGridCol = eventEl.closest('.fc-timegrid-col')
    if (!timeGridCol) {
      return
    }
    
    const colFrame = timeGridCol.querySelector('.fc-timegrid-col-frame')
    if (!colFrame) {
      return
    }
    
    // 이벤트의 실제 위치 계산
    const eventRect = eventEl.getBoundingClientRect()
    const colRect = colFrame.getBoundingClientRect()
    const eventTop = eventRect.top - colRect.top
    const eventBottom = eventRect.bottom - colRect.top
    
    // 실제 타임슬롯 높이 계산 (첫 번째 슬롯의 높이 사용)
    const slots = colFrame.querySelectorAll('.fc-timegrid-slot')
    if (slots.length === 0) {
      return
    }
    
    const firstSlot = slots[0]
    const slotHeight = firstSlot.getBoundingClientRect().height || 60
    
    // 시작/종료 인덱스 계산
    const startSlotIndex = Math.max(0, Math.floor(eventTop / slotHeight))
    const endSlotIndex = Math.min(
      slots.length,
      Math.ceil(eventBottom / slotHeight)
    )
    
    // 해당 범위의 모든 타임슬롯에 배경색 적용
    for (let i = startSlotIndex; i < endSlotIndex && i < slots.length; i++) {
      const slot = slots[i]
      if (slot) {
        slot.style.backgroundColor = rgba
        slot.classList.add('has-event-slot')
      }
    }
  })
}

// 문자열에서 hex 색상을 rgba로 변환
function hexToRgbaFromString(colorStr, alpha) {
  // 이미 rgba 형식인 경우
  if (colorStr.includes('rgba')) {
    return colorStr.replace(/rgba?\([^)]+\)/, (match) => {
      return match.replace(/,\s*[\d.]+\)$/, `, ${alpha})`)
    })
  }
  
  // hex 색상인 경우
  if (colorStr.startsWith('#')) {
    return hexToRgba(colorStr, alpha)
  }
  
  // rgb 형식인 경우
  if (colorStr.includes('rgb')) {
    return rgbToRgba(colorStr, alpha)
  }
  
  return colorStr
}

// RGB를 rgba로 변환
function rgbToRgba(rgb, alpha) {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`
  }
  return rgb
}

// Hex 색상을 rgba로 변환
function hexToRgba(hex, alpha) {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.slice(0, 2), 16)
  const g = parseInt(cleanHex.slice(2, 4), 16)
  const b = parseInt(cleanHex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/* 날짜 변경 */
const onDateChange = async () => {
  const api = calendarRef.value.getApi()
  const dateStr = formatDateForApi(selectedDate.value)
  api.gotoDate(dateStr)
  await loadCalendarEvents()
}

/* 뷰 변경 */
const changeView = async (view) => {
  const api = calendarRef.value.getApi()
  const currentDate = api.getDate() // 현재 캘린더의 날짜 저장
  
  // 뷰 변경 중 플래그 설정
  isChangingView.value = true
  
  currentView.value = view
  api.changeView(view)
  // 뷰 변경 후 날짜 유지
  api.gotoDate(currentDate)
  
  // 주간/일간 뷰로 변경될 때 명시적으로 예약 데이터 로드
  if (view === 'timeGridWeek' || view === 'timeGridDay') {
    await nextTick()
    const startDate = api.getDate().toISOString().slice(0, 10)
    try {
      const res = await reservationApi.getWeeklyReservations(startDate)
      const json = res.data.reservations ? res.data : res.data.data?.reservations ? res.data.data : res.data.result?.reservations ? res.data.result : null
      
      if (json && json.reservations) {
        const events = convertReservationsToEvents(json)
        calendarEvents.value = events
        
        api.removeAllEvents()
        events.forEach(ev => api.addEvent(ev))
        
        await nextTick()
        setTimeout(() => {
          applySlotBackgrounds()
        }, 600)
      } else {
        api.removeAllEvents()
        calendarEvents.value = []
      }
    } catch (err) {
      console.error('주별 예약 조회 실패:', err)
    } finally {
      // 뷰 변경 완료 후 플래그 해제 (항상 해제)
      setTimeout(() => {
        isChangingView.value = false
      }, 800)
    }
  } else {
    // 월별 뷰로 변경될 때는 월별 데이터 로드
    await loadCalendarEvents()
    setTimeout(() => {
      isChangingView.value = false
    }, 300)
  }
}

/* 최초 로딩 */
onMounted(async () => {
  // 초기 로딩 시 현재 뷰에 맞는 데이터 로드
  if (currentView.value === 'timeGridWeek' || currentView.value === 'timeGridDay') {
    const api = calendarRef.value?.getApi()
    if (api) {
      const startDate = api.getDate().toISOString().slice(0, 10)
      try {
        const res = await reservationApi.getWeeklyReservations(startDate)
        const json = res.data.reservations ? res.data : res.data.data?.reservations ? res.data.data : res.data.result?.reservations ? res.data.result : null
        
        if (json && json.reservations) {
          const events = convertReservationsToEvents(json)
          calendarEvents.value = events
          
          api.removeAllEvents()
          events.forEach(ev => api.addEvent(ev))
          
          await nextTick()
          setTimeout(() => {
            applySlotBackgrounds()
          }, 600)
        }
      } catch (err) {
        console.error('주별 예약 조회 실패:', err)
      }
    }
  } else {
    await loadCalendarEvents()
  }
})

/* ------------------------------------
   상세 조회 API 호출
------------------------------------ */
const openDetailModal = async (reservationId) => {
  try {
    const res = await reservationApi.getReservationDetail(reservationId)
    const d = res.data

    reservationDetail.value = {
      id: d.reservationId,
      name: d.assetName,
      status: d.reservationStatus,
      usage: d.reservationStatus,
      isApproved: d.isApproved,
      reserver: d.applicantName,
      approver: d.respondentName,
      assetStatus: d.assetStatus,
      date: d.date,

      startAt: d.startAt,
      endAt: d.endAt,
      actualStartAt: d.actualStartAt,
      actualEndAt: d.actualEndAt,

      participants: d.attendants,

      reason: d.reason,
      note: d.description,
    }

    modalOpen.value = true
  } catch (err) {
    console.error('상세 조회 실패:', err)
  }
}

/* ------------------------------------
   모달 액션 처리
------------------------------------ */
const handleStart = async (id) => {
  try {
    await reservationApi.startUsing(id)
    modalOpen.value = false
    loadCalendarEvents()
  } catch (err) {
    console.error('사용 시작 실패:', err)
  }
}

const handleEnd = async (id) => {
  try {
    await reservationApi.endUsing(id)
    modalOpen.value = false
    loadCalendarEvents()
  } catch (err) {
    console.error('사용 종료 실패:', err)
  }
}

const handleCancel = async (id) => {
  try {
    await reservationApi.cancel(id)
    modalOpen.value = false
    loadCalendarEvents()
  } catch (err) {
    console.error('예약 취소 실패:', err)
  }
}

/* 모달 닫기 */
const closeModal = () => {
  modalOpen.value = false
}

/* 미니 캘린더 이벤트 핸들러 */
const onMiniCalendarDateSelect = (date) => {
  selectedDate.value = date
  const api = calendarRef.value.getApi()
  api.gotoDate(date)
  loadCalendarEvents()
}

const onMiniCalendarEventClick = (event) => {
  openDetailModal(event.id)
}
</script>

<style scoped>
.calendar-page {
  display: flex;
  gap: 20px;
  padding: 20px;
  max-width: 1920px;
  margin: 0 auto;
  height: calc(100vh - 120px);
  overflow: hidden;
  align-items: flex-start;
}

.main-calendar-container {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: calc(100vh - 160px);
}

.calendar-container {
  padding: 24px;
  max-width: 100%;
}

.calendar-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.calendar-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 16px;
}

.calendar-top {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.date-picker {
  flex: 0 0 auto;
}

.calendar-toggle {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.calendar-toggle :deep(.p-button) {
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.calendar-toggle .active-view {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.calendar-wrapper {
  flex: 1;
  padding: 0;
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
  max-height: calc(100vh - 300px);
}

.calendar-wrapper :deep(.fc) {
  height: 100% !important;
  display: flex;
  flex-direction: column;
}

.calendar-wrapper :deep(.fc-view-harness) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  max-height: 100%;
}

.calendar-wrapper :deep(.fc-scroller) {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  -webkit-overflow-scrolling: touch;
  max-height: calc(100vh - 300px);
}

.calendar-wrapper :deep(.fc-timegrid-body) {
  overflow: visible;
}

.calendar-wrapper :deep(.fc-timegrid-body .fc-scroller) {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  -webkit-overflow-scrolling: touch;
  max-height: calc(100vh - 300px);
}

/* FullCalendar 한국어 스타일 개선 */
:deep(.fc) {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
}

:deep(.fc-header-toolbar) {
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

:deep(.fc-toolbar-title) {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

:deep(.fc-button) {
  background: white;
  border: 1px solid #e5e7eb;
  color: #4b5563;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

:deep(.fc-button:hover) {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #1f2937;
}

:deep(.fc-button:active),
:deep(.fc-button-active) {
  background: #667eea;
  border-color: #667eea;
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

:deep(.fc-button-primary:not(:disabled):active),
:deep(.fc-button-primary:not(:disabled).fc-button-active) {
  background: #667eea;
  border-color: #667eea;
}

/* 요일 헤더 스타일 - 단색 배경 */
:deep(.fc-col-header-cell) {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  font-weight: 600;
  padding: 12px 8px;
  text-align: center;
}

:deep(.fc-col-header-cell-cushion) {
  color: #4b5563;
  font-size: 14px;
  font-weight: 600;
}

/* 일요일 빨간 글씨 */
:deep(.fc-col-header-cell.fc-day-sun .fc-col-header-cell-cushion) {
  color: #ef4444;
}

/* 토요일 파란 글씨 */
:deep(.fc-col-header-cell.fc-day-sat .fc-col-header-cell-cushion) {
  color: #3b82f6;
}

/* 날짜 셀 스타일 */
:deep(.fc-daygrid-day) {
  background: white;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

:deep(.fc-daygrid-day:hover) {
  background: #f9fafb;
}

:deep(.fc-day-today) {
  background: #eff6ff !important;
  border: 2px solid #3b82f6 !important;
}

:deep(.fc-daygrid-day-number) {
  padding: 8px;
  color: #1f2937;
  font-weight: 600;
  font-size: 14px;
}

:deep(.fc-day-today .fc-daygrid-day-number) {
  color: #3b82f6;
  font-weight: 700;
}

/* 주별 뷰 시간 슬롯 */
:deep(.fc-timegrid-slot) {
  min-height: 60px;
  border-top: 1px solid #f3f4f6;
}

:deep(.fc-timegrid-slot-label) {
  padding: 8px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

:deep(.fc-timegrid-col) {
  border-left: 1px solid #e5e7eb;
}

:deep(.fc-timegrid-col.fc-day-today) {
  background: #f0f9ff;
}

/* 이벤트 스타일 */
:deep(.fc-event-bg),
:deep(.fc-timegrid-event) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* fc-event-main은 JavaScript로 배경색이 동적으로 적용됨 */
:deep(.fc-event-main) {
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.custom-event-chip {
  position: relative;
  width: 100% !important;
  height: 100%;
  border-radius: 0;
  padding: 6px 10px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 !important;
}

.custom-event-chip:hover {
  opacity: 0.8;
}

/* 월간 뷰에서 이벤트가 날짜 가로 전체를 차지하도록 */
:deep(.fc-daygrid-event) {
  margin: 0 !important;
  width: 100% !important;
  border-radius: 0 !important;
  left: 0 !important;
  right: 0 !important;
}

:deep(.fc-daygrid-event-harness) {
  width: 100% !important;
  left: 0 !important;
  right: 0 !important;
}

:deep(.fc-daygrid-event-harness > a) {
  width: 100% !important;
  margin: 0 !important;
  left: 0 !important;
  right: 0 !important;
}

/* 주별 뷰에서도 이벤트가 가로 전체를 차지하도록 */
:deep(.fc-timegrid-event) {
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
}

:deep(.fc-timegrid-event-harness) {
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
}

.event-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}

.event-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(255, 255, 255, 0.95);
  color: #1f2937;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  line-height: 1.2;
  font-weight: 700;
}

/* 월간 뷰 이벤트 */
:deep(.fc-daygrid-event) {
  margin: 2px 4px;
  border-radius: 6px;
  overflow: hidden;
}

:deep(.fc-daygrid-event-harness) {
  max-height: 24px;
}

/* 주별 뷰 all-day 제거 */
:deep(.fc-timegrid-all-day) {
  display: none !important;
}

:deep(.fc-timegrid-axis) {
  border-right: 1px solid #e5e7eb;
}

/* 반응형 */
@media (max-width: 768px) {
  .calendar-container {
    padding: 16px;
  }

  .calendar-top {
    flex-direction: column;
    align-items: stretch;
  }

  .calendar-toggle {
    margin-left: 0;
    width: 100%;
  }

  .calendar-toggle :deep(.p-button) {
    flex: 1;
  }

  .calendar-wrapper {
    padding: 8px;
    min-height: 400px;
  }

  :deep(.fc-toolbar-title) {
    font-size: 18px;
  }
}
</style>
