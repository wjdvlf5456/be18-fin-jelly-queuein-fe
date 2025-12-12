<template>
  <div class="mini-calendar-container">
    <!-- 미니 캘린더 -->
    <div class="mini-calendar-section">
      <div class="mini-calendar-header">
        <button class="nav-btn" @click="prevMonth">
          <i class="pi pi-chevron-left"></i>
        </button>
        <h3 class="month-title">{{ currentMonthText }}</h3>
        <button class="nav-btn" @click="nextMonth">
          <i class="pi pi-chevron-right"></i>
        </button>
      </div>
      
      <div class="mini-calendar-grid">
        <!-- 요일 헤더 -->
        <div class="weekday-header">
          <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
        </div>
        
        <!-- 날짜 그리드 -->
        <div class="date-grid">
          <div
            v-for="(date, index) in calendarDays"
            :key="index"
            class="date-cell"
            :class="{
              'other-month': !date.isCurrentMonth,
              'today': date.isToday,
              'selected': date.isSelected
            }"
            @click="selectDate(date.date)"
          >
            <span class="date-number">{{ date.day }}</span>
            <span v-if="hasEventOnDate(date.date)" class="event-dot"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 오늘 날짜 표시 -->
    <div class="today-section">
      <div class="today-label">TODAY</div>
      <div class="today-date">{{ todayText }}</div>
    </div>

    <!-- 선택된 날짜의 이벤트 목록 -->
    <div class="events-section">
      <div class="events-header">이벤트</div>
      <div class="events-list">
        <div
          v-for="event in selectedDateEvents"
          :key="event.id"
          class="event-item"
          @click="onEventClick(event)"
        >
          <div class="event-time">
            {{ formatTime(event.start) }} - {{ formatTime(event.end) }}
          </div>
          <div class="event-title">{{ event.title }}</div>
          <div v-if="event.location" class="event-location">{{ event.location }}</div>
        </div>
        <div v-if="selectedDateEvents.length === 0" class="no-events">
          예약이 없습니다.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  selectedDate: {
    type: Date,
    required: true
  },
  events: {
    type: Array,
    default: () => []
  },
  currentView: {
    type: String,
    default: 'dayGridMonth' // 'dayGridMonth', 'timeGridWeek', 'timeGridDay'
  }
})

const emit = defineEmits(['date-select', 'event-click'])

const currentMonth = ref(new Date(props.selectedDate.getFullYear(), props.selectedDate.getMonth(), 1))

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

const currentMonthText = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = String(currentMonth.value.getMonth() + 1).padStart(2, '0')
  return `${year}년 ${month}월`
})

const todayText = computed(() => {
  const year = props.selectedDate.getFullYear()
  const month = String(props.selectedDate.getMonth() + 1).padStart(2, '0')
  const day = String(props.selectedDate.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
})

// 캘린더 날짜 그리드 생성
const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  
  // 해당 월의 첫 날과 마지막 날
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // 첫 날의 요일 (0 = 일요일)
  const firstDayOfWeek = firstDay.getDay()
  
  // 이전 달의 마지막 날들
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  
  const days = []
  
  // 이전 달 날짜들
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i)
    days.push({
      date,
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: isToday(date),
      isSelected: isSelected(date)
    })
  }
  
  // 현재 달 날짜들
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    days.push({
      date,
      day,
      isCurrentMonth: true,
      isToday: isToday(date),
      isSelected: isSelected(date)
    })
  }
  
  // 다음 달 날짜들 (총 42개 셀을 채우기 위해)
  const remainingDays = 42 - days.length
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    days.push({
      date,
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: isToday(date),
      isSelected: isSelected(date)
    })
  }
  
  return days
})

// 오늘인지 확인
function isToday(date) {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

// 선택된 날짜인지 확인
function isSelected(date) {
  return (
    date.getFullYear() === props.selectedDate.getFullYear() &&
    date.getMonth() === props.selectedDate.getMonth() &&
    date.getDate() === props.selectedDate.getDate()
  )
}

// 해당 날짜에 이벤트가 있는지 확인
function hasEventOnDate(date) {
  return props.events.some(event => {
    const eventDate = new Date(event.start)
    return (
      eventDate.getFullYear() === date.getFullYear() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getDate() === date.getDate()
    )
  })
}

// 선택된 날짜의 이벤트 목록
const selectedDateEvents = computed(() => {
  return props.events.filter(event => {
    const eventDate = new Date(event.start)
    return (
      eventDate.getFullYear() === props.selectedDate.getFullYear() &&
      eventDate.getMonth() === props.selectedDate.getMonth() &&
      eventDate.getDate() === props.selectedDate.getDate()
    )
  })
})

// 이전 달
function prevMonth() {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1
  )
}

// 다음 달
function nextMonth() {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1
  )
}

// 날짜 선택
function selectDate(date) {
  emit('date-select', date)
}

// 이벤트 클릭
function onEventClick(event) {
  emit('event-click', event)
}

// 시간 포맷
function formatTime(date) {
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// selectedDate가 변경되면 currentMonth도 업데이트
watch(() => props.selectedDate, (newDate) => {
  const newMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1)
  if (
    newMonth.getFullYear() !== currentMonth.value.getFullYear() ||
    newMonth.getMonth() !== currentMonth.value.getMonth()
  ) {
    currentMonth.value = newMonth
  }
})
</script>

<style scoped>
.mini-calendar-container {
  width: 300px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  height: calc(100vh - 160px);
  overflow-y: auto;
  position: sticky;
  top: 20px;
  align-self: flex-start;
  margin-top: 50px;
}

/* 미니 캘린더 섹션 */
.mini-calendar-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.mini-calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  color: #667eea;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #f3f4f6;
  border-radius: 4px;
}

.month-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.mini-calendar-grid {
  width: 100%;
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  padding: 4px 0;
}

.date-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.date-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  position: relative;
  transition: all 0.2s;
}

.date-cell:hover {
  background: #f3f4f6;
}

.date-cell.other-month {
  color: #d1d5db;
}

.date-cell.today {
  background: #fef3c7;
  font-weight: 700;
}

.date-cell.selected {
  background: #667eea;
  color: white;
  font-weight: 700;
}

.date-cell.selected.today {
  background: #667eea;
  color: white;
}

.date-number {
  font-size: 14px;
}

.event-dot {
  position: absolute;
  bottom: 4px;
  width: 4px;
  height: 4px;
  background: #667eea;
  border-radius: 50%;
}

.date-cell.selected .event-dot {
  background: white;
}

/* 오늘 날짜 섹션 */
.today-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.today-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}

.today-date {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

/* 이벤트 목록 섹션 */
.events-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.events-header {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.events-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  cursor: pointer;
  transition: all 0.2s;
}

.event-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.event-time {
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 4px;
}

.event-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.event-location {
  font-size: 12px;
  color: #6b7280;
}

.no-events {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 20px 0;
}
</style>

