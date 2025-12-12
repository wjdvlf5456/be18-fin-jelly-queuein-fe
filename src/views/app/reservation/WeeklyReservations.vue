<template>
  <div class="calendar-container">
    <Card class="calendar-card">
      <template #content>
        <div class="calendar-wrapper">
          <FullCalendar ref="calendarRef" :options="calendarOptions" />
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
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import koLocale from '@fullcalendar/core/locales/ko.js'
import { reservationApi } from '@/api/reservationApi'
import ReservationDetailModal from '@/components/reservation/ReservationDetailModal.vue'
import Card from 'primevue/card'

const calendarRef = ref(null)
const events = ref([])
const currentDate = ref(new Date())

// 모달 관련
const modalOpen = ref(false)
const reservationDetail = ref(null)

async function fetchWeekReservations(start) {
  const res = await reservationApi.getWeeklyReservations(start)
  return res.data
}

/* 예약 상태별 옅은 색상 매핑 */
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

function convertWeeklyToEvents(data) {
  const list = []

  data.reservations.forEach(day => {
    day.reservations.forEach(r => {
      const startUtc = new Date(r.startAt)
      const localStart = new Date(startUtc.getTime() + 9 * 60 * 60 * 1000)
      const endUtc = new Date(r.endAt)
      const localEnd = new Date(endUtc.getTime() + 9 * 60 * 60 * 1000)

      list.push({
        id: r.reservationId,
        title: r.assetName,
        start: localStart,
        end: localEnd, // 끝나는 시간까지 표시
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

  return list
}

const calendarOptions = computed(() => ({
  plugins: [timeGridPlugin, interactionPlugin, dayGridPlugin],
  locale: koLocale,
  initialView: 'timeGridWeek',
  allDaySlot: false,
  initialDate: currentDate.value,
  events: events.value,
  firstDay: 0, // 일요일부터 시작
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
  dayHeaderFormat: { weekday: 'short' },
  slotLabelFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  slotMinTime: '00:00:00',
  slotMaxTime: '24:00:00',
  contentHeight: 'auto',
  height: 'auto',

  eventContent: (arg) => {
    const startTime = arg.event.start ? arg.event.start.toTimeString().slice(0, 5) : ''
    const endTime = arg.event.end ? arg.event.end.toTimeString().slice(0, 5) : ''
    const timeText = endTime ? `${startTime} - ${endTime}` : startTime
    const bgColor = arg.event.backgroundColor || '#fce7f3'
    const textColor = arg.event.textColor || '#9f1239'

    return {
      html: `
        <div class="custom-event-chip" style="background-color: ${bgColor}; color: ${textColor};">
          <span class="event-time">${timeText}</span>
          <span class="event-title">${arg.event.title}</span>
        </div>
      `
    }
  },

  datesSet: async (info) => {
    console.log('[WeeklyReservations] datesSet called', info.startStr)
    const start = info.startStr.slice(0, 10)
    const json = await fetchWeekReservations(start)
    events.value = convertWeeklyToEvents(json)
    console.log('[WeeklyReservations] Events loaded:', events.value.length)
    // 이벤트 렌더링 후 타임슬롯 배경색 적용
    await nextTick()
    console.log('[WeeklyReservations] Calling applySlotBackgrounds in 500ms...')
    setTimeout(() => {
      console.log('[WeeklyReservations] Now calling applySlotBackgrounds')
      applySlotBackgrounds()
    }, 500)
  },

  eventClick: (info) => {
    const reservationId = info.event.id
    if (reservationId) {
      openDetailModal(reservationId)
    }
  },

  // 이벤트가 마운트될 때 타임슬롯 배경색 적용
  eventDidMount: (arg) => {
    const event = arg.event
    if (!event.start || !event.end) return
    
    const bgColor = event.backgroundColor || '#fce7f3'
    const textColor = event.textColor || '#9f1239'
    
    // fc-event-main에 custom-event-chip과 동일한 색상 적용 (solid color)
    const eventMain = arg.el.querySelector('.fc-event-main')
    if (eventMain) {
      eventMain.style.backgroundColor = bgColor
      eventMain.style.color = textColor
    }
    
    // 타임슬롯 배경색 적용
    setTimeout(() => {
      applySlotBackgrounds()
    }, 200)
  },

}))

// 타임슬롯 배경색 적용 함수
function applySlotBackgrounds() {
  console.log('[applySlotBackgrounds] ===== FUNCTION CALLED =====')
  console.log('[applySlotBackgrounds] calendarRef.value:', calendarRef.value)
  const calendarEl = calendarRef.value?.getApi()?.el
  if (!calendarEl) {
    console.warn('[applySlotBackgrounds] Calendar element not found')
    console.warn('[applySlotBackgrounds] calendarRef.value?.getApi():', calendarRef.value?.getApi())
    return
  }
  
  console.log('[applySlotBackgrounds] Calendar element found:', calendarEl)
  console.log('[applySlotBackgrounds] Starting...')
  
  // 모든 타임슬롯 배경색 초기화
  const allSlots = calendarEl.querySelectorAll('.fc-timegrid-slot')
  console.log('[applySlotBackgrounds] Found slots:', allSlots.length)
  allSlots.forEach(slot => {
    slot.style.backgroundColor = ''
    slot.classList.remove('has-event-slot')
  })
  
  // 모든 이벤트 엘리먼트 찾기
  const allEvents = calendarEl.querySelectorAll('.fc-timegrid-event')
  console.log('[applySlotBackgrounds] Found events:', allEvents.length)
  
  if (allEvents.length === 0) {
    console.warn('[applySlotBackgrounds] No events found')
    return
  }
  
  allEvents.forEach((eventEl, eventIndex) => {
    console.log(`[applySlotBackgrounds] Processing event ${eventIndex + 1}...`)
    // 이벤트의 배경색 가져오기 (인라인 스타일에서)
    const eventChip = eventEl.querySelector('.custom-event-chip')
    if (!eventChip) {
      console.warn(`[applySlotBackgrounds] Event ${eventIndex + 1}: custom-event-chip not found`)
      return
    }
    
    // 인라인 스타일에서 배경색 가져오기
    const bgColorStyle = eventChip.getAttribute('style')
    if (!bgColorStyle || !bgColorStyle.includes('background-color')) {
      console.warn(`[applySlotBackgrounds] Event ${eventIndex + 1}: no background-color in style`)
      return
    }
    
    const bgColorMatch = bgColorStyle.match(/background-color:\s*([^;]+)/)
    if (!bgColorMatch) {
      console.warn(`[applySlotBackgrounds] Event ${eventIndex + 1}: could not parse background-color`)
      return
    }
    
    const bgColor = bgColorMatch[1].trim()
    const rgba = hexToRgbaFromString(bgColor, 0.3)
    console.log(`[applySlotBackgrounds] Event ${eventIndex + 1}: bgColor=${bgColor}, rgba=${rgba}`)
    
    // 이벤트가 속한 타임슬롯 찾기
    const timeGridCol = eventEl.closest('.fc-timegrid-col')
    if (!timeGridCol) {
      console.warn(`[applySlotBackgrounds] Event ${eventIndex + 1}: timeGridCol not found`)
      return
    }
    
    const colFrame = timeGridCol.querySelector('.fc-timegrid-col-frame')
    if (!colFrame) {
      console.warn(`[applySlotBackgrounds] Event ${eventIndex + 1}: colFrame not found`)
      return
    }
    
    // 이벤트의 실제 위치 계산
    const eventRect = eventEl.getBoundingClientRect()
    const colRect = colFrame.getBoundingClientRect()
    const eventTop = eventRect.top - colRect.top
    const eventBottom = eventRect.bottom - colRect.top
    
    console.log(`[applySlotBackgrounds] Event ${eventIndex + 1}: eventTop=${eventTop}, eventBottom=${eventBottom}`)
    
    // 실제 타임슬롯 높이 계산 (첫 번째 슬롯의 높이 사용)
    const firstSlot = colFrame.querySelector('.fc-timegrid-slot')
    if (!firstSlot) {
      console.warn(`[applySlotBackgrounds] Event ${eventIndex + 1}: firstSlot not found`)
      return
    }
    const slotHeight = firstSlot.getBoundingClientRect().height || 60
    console.log(`[applySlotBackgrounds] Event ${eventIndex + 1}: slotHeight=${slotHeight}`)
    
    // 시작/종료 인덱스 계산
    const slots = colFrame.querySelectorAll('.fc-timegrid-slot')
    const startSlotIndex = Math.max(0, Math.floor(eventTop / slotHeight))
    const endSlotIndex = Math.min(
      slots.length,
      Math.ceil(eventBottom / slotHeight)
    )
    
    console.log(`[applySlotBackgrounds] Event ${eventIndex + 1}: startSlotIndex=${startSlotIndex}, endSlotIndex=${endSlotIndex}, slots.length=${slots.length}`)
    
    // 해당 범위의 모든 타임슬롯에 배경색 적용
    let appliedCount = 0
    for (let i = startSlotIndex; i < endSlotIndex && i < slots.length; i++) {
      const slot = slots[i]
      if (slot) {
        slot.style.backgroundColor = rgba
        slot.classList.add('has-event-slot')
        appliedCount++
      }
    }
    console.log(`[applySlotBackgrounds] Event ${eventIndex + 1}: Applied to ${appliedCount} slots`)
  })
  
  console.log('[applySlotBackgrounds] Finished')
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
  // # 제거
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.slice(0, 2), 16)
  const g = parseInt(cleanHex.slice(2, 4), 16)
  const b = parseInt(cleanHex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

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
    const api = calendarRef.value?.getApi()
    if (api) {
      const view = api.view
      const start = view.activeStart.toISOString().slice(0, 10)
      const json = await fetchWeekReservations(start)
      events.value = convertWeeklyToEvents(json)
    }
  } catch (err) {
    console.error('사용 시작 실패:', err)
  }
}

const handleEnd = async (id) => {
  try {
    await reservationApi.endUsing(id)
    modalOpen.value = false
    const api = calendarRef.value?.getApi()
    if (api) {
      const view = api.view
      const start = view.activeStart.toISOString().slice(0, 10)
      const json = await fetchWeekReservations(start)
      events.value = convertWeeklyToEvents(json)
    }
  } catch (err) {
    console.error('사용 종료 실패:', err)
  }
}

const handleCancel = async (id) => {
  try {
    await reservationApi.cancel(id)
    modalOpen.value = false
    const api = calendarRef.value?.getApi()
    if (api) {
      const view = api.view
      const start = view.activeStart.toISOString().slice(0, 10)
      const json = await fetchWeekReservations(start)
      events.value = convertWeeklyToEvents(json)
    }
  } catch (err) {
    console.error('예약 취소 실패:', err)
  }
}

/* 모달 닫기 */
const closeModal = () => {
  modalOpen.value = false
}
</script>

<style scoped>
.calendar-container {
  padding: 24px;
  max-width: 100%;
}

.calendar-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.calendar-wrapper {
  min-height: 700px;
  max-height: calc(100vh - 200px);
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.calendar-wrapper :deep(.fc) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-wrapper :deep(.fc-view-harness) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.calendar-wrapper :deep(.fc-scroller) {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  max-height: 100%;
}

.calendar-wrapper :deep(.fc-timegrid-body .fc-scroller) {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  height: auto !important;
  max-height: 100%;
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

/* 주별 뷰 시간 슬롯 */
:deep(.fc-timegrid-slot) {
  height: 60px;
  border-top: 1px solid #f3f4f6;
  position: relative;
}

/* 이벤트가 있는 타임슬롯 배경색 적용 */
:deep(.fc-timegrid-event) {
  position: relative;
  z-index: 1;
}

/* 이벤트가 있는 타임슬롯에 배경색 적용 - CSS로 직접 처리 */
:deep(.fc-timegrid-col-frame) {
  position: relative;
}

/* 이벤트가 있는 타임슬롯 배경색 (동적으로 적용됨) */
:deep(.fc-timegrid-slot.has-event-slot) {
  /* 배경색은 JavaScript로 동적 적용 */
}

:deep(.fc-timegrid-slot-label) {
  padding: 8px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

:deep(.fc-timegrid-col) {
  border-left: 1px solid #e5e7eb;
  background: white;
}

:deep(.fc-timegrid-col.fc-day-today) {
  background: #f0f9ff;
}

:deep(.fc-timegrid-now-indicator-line) {
  border-color: #3b82f6;
  border-width: 2px;
}

/* 이벤트 스타일 */
:deep(.fc-event-bg),
:deep(.fc-timegrid-event) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

/* fc-event-main은 JavaScript로 배경색이 동적으로 적용됨 */
:deep(.fc-event-main) {
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.custom-event-chip {
  width: 100% !important;
  height: 100%;
  border-radius: 0;
  padding: 6px 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 !important;
}

.custom-event-chip:hover {
  opacity: 0.8;
}

/* 주별 뷰에서 이벤트가 가로 전체를 차지하도록 */
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

.event-time {
  font-size: 11px;
  opacity: 0.9;
  font-weight: 700;
}

.event-title {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* 주별 뷰 all-day 제거 */
:deep(.fc-timegrid-all-day) {
  display: none !important;
}

:deep(.fc-timegrid-axis) {
  border-right: 1px solid #e5e7eb;
  background: #fafafa;
}

:deep(.fc-timegrid-axis-cushion) {
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
}

/* 반응형 */
@media (max-width: 768px) {
  .calendar-container {
    padding: 16px;
  }

  .calendar-wrapper {
    padding: 8px;
    min-height: 500px;
  }

  :deep(.fc-toolbar-title) {
    font-size: 18px;
  }

  :deep(.fc-timegrid-slot) {
    height: 50px;
  }
}
</style>
