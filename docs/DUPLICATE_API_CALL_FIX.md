# 중복 API 호출 방지 수정 사항

## 수정 개요

프론트엔드에서 예약 관련 API가 중복 호출되는 문제를 해결하기 위해 다음과 같은 메커니즘을 적용했습니다.

---

## 1. UserReservations.vue

### 적용된 수정 사항

#### 1.1 중복 호출 방지 메커니즘
```javascript
// isLoading: 현재 요청 진행 중인지 확인
const isLoading = ref(false)
// lastRequestKey: 마지막 요청의 고유 키 (동일 요청 중복 방지)
let lastRequestKey = null
// requestCounter: 요청 카운터 (요청 순서 추적)
let requestCounter = 0
```

**왜 필요한가?**
- 여러 트리거(route.path watch, onMounted, window 이벤트 등)가 동시에 발생할 수 있음
- 동일한 파라미터로 여러 번 요청하는 것을 방지
- 진행 중인 요청이 있으면 새 요청을 스킵하거나 이전 요청을 무시

#### 1.2 fetchReservations() 단일 진입점 패턴
```javascript
const fetchReservations = async (options = {}) => {
  const { skipIfLoading = false, force = false } = options
  
  // Guard 1: 로딩 중이고 skipIfLoading이 true면 스킵
  if (isLoading.value && skipIfLoading && !force) return
  
  // Guard 2: 동일한 요청이 이미 진행 중이면 스킵
  const requestKey = JSON.stringify(params)
  if (lastRequestKey === requestKey && isLoading.value && !force) return
  
  // 요청 실행...
}
```

**왜 이렇게 바꿨나?**
- 모든 API 호출이 이 함수를 통해서만 실행되도록 통합
- `skipIfLoading`: 로딩 중이면 스킵 (중복 방지)
- `force`: 강제 실행 (필터 변경, 페이지 변경 등 사용자 액션)
- 요청 키 비교로 동일 요청 중복 방지

#### 1.3 트리거별 옵션 설정
```javascript
// 필터 변경: 강제 실행 (사용자가 명시적으로 변경)
handleFilterChange() → fetchReservations({ force: true })

// 페이지 변경: 강제 실행 (사용자가 명시적으로 변경)
changePage() → fetchReservations({ force: true })

// 라우트 변경: 로딩 중이면 스킵 (중복 방지)
watch(route.path) → fetchReservations({ skipIfLoading: true })

// onMounted: 강제 실행 (초기 로드)
onMounted() → fetchReservations({ force: true })

// onActivated: 로딩 중이면 스킵 (keep-alive 재활성화)
onActivated() → fetchReservations({ skipIfLoading: true })
```

**왜 이렇게 분리했나?**
- 사용자 액션(필터 변경, 페이지 변경)은 항상 실행해야 함
- 자동 트리거(라우트 변경, 이벤트)는 중복을 방지해야 함
- 초기 로드는 강제 실행하여 데이터 보장

#### 1.4 응답 무시 로직
```javascript
const currentRequestId = ++requestCounter
// ... 요청 실행 ...

// 응답이 왔을 때 최신 요청인지 확인
if (currentRequestId !== requestCounter) {
  console.log('더 최신 요청이 있어서 이 응답을 무시')
  return
}
```

**왜 필요한가?**
- 빠르게 연속 요청이 발생하면 이전 요청의 응답이 나중에 올 수 있음
- 오래된 응답으로 데이터를 덮어쓰는 것을 방지

---

## 2. MonthlyReservations.vue

### 적용된 수정 사항

#### 2.1 FullCalendar datesSet 중복 호출 방지
```javascript
// isLoadingEvents: 이벤트 로딩 중인지 확인
const isLoadingEvents = ref(false)
// lastLoadedDateRange: 마지막으로 로드한 날짜 범위
const lastLoadedDateRange = ref(null)
// isAddingEvents: 이벤트 추가 중 플래그
const isAddingEvents = ref(false)
```

**왜 필요한가?**
- FullCalendar의 `addEvent()` 호출 시 내부적으로 `datesSet`가 다시 트리거될 수 있음
- 뷰 변경 시 `changeView`와 `datesSet`가 동시에 호출될 수 있음
- 동일한 날짜 범위를 여러 번 로드하는 것을 방지

#### 2.2 datesSet Guard 패턴
```javascript
datesSet: async (info) => {
  // Guard 1: 뷰 변경 중이면 스킵
  if (isChangingView.value) return
  
  // Guard 2: 이벤트 추가 중이면 스킵 (addEvent로 인한 재트리거 방지)
  if (isAddingEvents.value) return
  
  // Guard 3: 이미 로딩 중이면 스킵
  if (isLoadingEvents.value) return
  
  // Guard 4: 동일한 날짜 범위를 이미 로드했으면 스킵
  const currentDateRange = { start, end, view }
  if (lastLoadedDateRange.value === currentDateRange) return
  
  // 로딩 시작...
}
```

**왜 이렇게 바꿨나?**
- `isAddingEvents` 플래그로 `addEvent()` 호출 중에는 `datesSet`가 실행되지 않도록 차단
- 날짜 범위 비교로 동일 범위 중복 로드 방지
- 뷰 변경 중에는 `changeView`에서 처리하므로 `datesSet` 스킵

#### 2.3 이벤트 추가 시 플래그 사용
```javascript
// 이벤트 추가 전 플래그 설정
isAddingEvents.value = true
api.removeAllEvents()
events.forEach(ev => api.addEvent(ev))
await nextTick()
isAddingEvents.value = false
```

**왜 필요한가?**
- `addEvent()` 호출 시 FullCalendar가 내부적으로 `datesSet`를 다시 트리거할 수 있음
- 플래그로 이벤트 추가 중에는 `datesSet`가 실행되지 않도록 차단

#### 2.4 changeView와 datesSet 분리
```javascript
const changeView = async (view) => {
  // 뷰 변경 중 플래그 설정 (datesSet가 실행되지 않도록)
  isChangingView.value = true
  lastLoadedDateRange.value = null // 새 뷰에서는 새로 로드
  
  // 뷰 변경 및 데이터 로드
  // ...
  
  // 완료 후 플래그 해제
  isChangingView.value = false
}
```

**왜 이렇게 바꿨나?**
- `changeView`에서 데이터를 로드하므로 `datesSet`가 중복 실행되지 않도록 차단
- 날짜 범위를 초기화하여 새 뷰에서는 항상 새로 로드

---

## 3. ApplyReservation.vue

### 적용된 수정 사항

#### 3.1 중복 호출 방지 메커니즘
```javascript
// isLoadingTimes: 예약 가능 시간 로딩 중인지 확인
const isLoadingTimes = ref(false)
// lastFetchedDate: 마지막으로 조회한 날짜
const lastFetchedDate = ref(null)
// debounceTimer: watch debounce용 타이머
let debounceTimer = null
```

**왜 필요한가?**
- `date` watch와 `onMounted`가 동시에 실행될 수 있음
- 날짜가 빠르게 연속 변경될 때 여러 번 호출되는 것을 방지

#### 3.2 fetchAvailableTimes() Guard 패턴
```javascript
const fetchAvailableTimes = async (force = false) => {
  // Guard 1: 유효성 검사
  if (!assetId || !date.value) return
  
  // Guard 2: 이미 로딩 중이고 force가 false면 스킵
  if (isLoadingTimes.value && !force) return
  
  // Guard 3: 동일한 날짜를 이미 조회했고 force가 false면 스킵
  if (lastFetchedDate.value === date.value && !force) return
  
  // 로딩 시작...
}
```

**왜 이렇게 바꿨나?**
- 동일 날짜 중복 조회 방지
- 로딩 중에는 새 요청 스킵 (force 옵션으로 강제 실행 가능)

#### 3.3 watch debounce 적용
```javascript
watch(() => date.value, () => {
  if (!date.value || !assetId) return
  
  // 이전 타이머 취소
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  // 300ms 후 실행 (debounce)
  debounceTimer = setTimeout(() => {
    fetchAvailableTimes()
  }, 300)
})
```

**왜 필요한가?**
- 날짜 선택기가 빠르게 변경될 때 여러 번 호출되는 것을 방지
- 300ms 지연으로 사용자가 날짜 선택을 완료한 후에만 호출

#### 3.4 onMounted와 watch 분리
```javascript
onMounted(async () => {
  // 초기 로드는 강제 실행 (watch와 중복되어도 최신 데이터 보장)
  await nextTick()
  setTimeout(() => {
    if (date.value && assetId) {
      fetchAvailableTimes(true) // force: true
    }
  }, 100)
})
```

**왜 이렇게 바꿨나?**
- `watch`가 이미 실행될 수 있으므로 약간의 지연을 두고 실행
- `force: true`로 강제 실행하여 초기 데이터 보장

---

## 예상 효과

### 수정 전
```
페이지 진입 시:
- onMounted → fetchReservations()
- watch(route.path) → fetchReservations()
- handleRouteTransitionComplete → fetchReservations()
- handleTabChanged → fetchReservations()
→ 총 4번 호출 (동일한 파라미터)
```

### 수정 후
```
페이지 진입 시:
- onMounted → fetchReservations({ force: true }) 실행
- watch(route.path) → fetchReservations({ skipIfLoading: true }) 스킵
- handleRouteTransitionComplete → fetchReservations({ skipIfLoading: true }) 스킵
- handleTabChanged → fetchReservations({ skipIfLoading: true }) 스킵
→ 총 1번 호출
```

---

## 검증 방법

### 1. 브라우저 개발자 도구
1. Network 탭 → XHR 필터
2. `/reservations/me` 또는 `/reservations/weekly` 요청 개수 확인
3. 동일한 파라미터로 여러 번 요청되는지 확인

### 2. 콘솔 로그 확인
```javascript
// UserReservations.vue
console.log('fetchReservations 시작') // 여러 번 찍히면 문제
console.log('fetchReservations: 이미 로딩 중이므로 스킵') // 정상 동작

// MonthlyReservations.vue
console.log('datesSet: 이미 로딩 중이므로 스킵') // 정상 동작
console.log('datesSet: 동일한 날짜 범위를 이미 로드했으므로 스킵') // 정상 동작
```

### 3. 백엔드 로그 확인
- 동일한 SQL이 반복 실행되는지 확인
- 프론트 요청이 1회인데 백엔드에서만 반복되면 백엔드 N+1 문제

---

## 주의사항

1. **AbortController 미사용**
   - 현재 구조에서는 `isLoading` 플래그와 요청 키 비교만으로 충분
   - 필요시 나중에 AbortController 추가 가능

2. **force 옵션 사용 시점**
   - 사용자 액션(필터 변경, 페이지 변경) → `force: true`
   - 자동 트리거(라우트 변경, 이벤트) → `skipIfLoading: true`

3. **날짜 범위 비교**
   - MonthlyReservations에서 날짜 범위 비교 시 `view`도 포함
   - 같은 날짜라도 뷰가 다르면 다른 데이터를 로드해야 함

---

## 추가 개선 가능 사항

1. **캐싱 추가**
   - 동일한 파라미터로 조회한 데이터를 일정 시간 캐싱
   - 캐시가 있으면 API 호출 스킵

2. **AbortController 추가**
   - 진행 중인 요청을 명시적으로 취소
   - 네트워크 리소스 절약

3. **요청 큐잉**
   - 여러 요청이 동시에 발생하면 마지막 요청만 실행
   - 중간 요청은 자동으로 스킵
