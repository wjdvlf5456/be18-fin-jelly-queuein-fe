<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

const router = useRouter()

// 단일 탭만 활성화 (첫 번째 탭을 기본으로 열기)
const activeIndex = ref(0)

// 목차 항목
const tocItems = [
  {
    id: 'reservation-apply',
    label: '예약 신청하기',
    icon: 'pi pi-calendar-plus',
    path: '/app/reservations/me',
  },
  {
    id: 'reservation-list',
    label: '내 예약 조회하기',
    icon: 'pi pi-list',
    path: '/app/reservations/me',
  },
  {
    id: 'reservable-assets',
    label: '예약 가능 자원 찾기',
    icon: 'pi pi-search',
    path: '/app/reservations/available-assets',
  },
  {
    id: 'schedule-management',
    label: '일정 관리',
    icon: 'pi pi-calendar',
    path: '/app/reservations/monthly',
  },
  { id: 'mypage', label: '마이페이지', icon: 'pi pi-user', path: '/app/users/me' },
  { id: 'faq', label: '자주 묻는 질문', icon: 'pi pi-question-circle' },
]

// 안내 팝업 관련
const showWelcomeDialog = ref(false)
const showEnableDialogButton = ref(false)

// 오늘 날짜 키 생성
const getTodayKey = () => {
  const today = new Date()
  return `guideWelcomeDismissed_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
}

// 안내 팝업 표시 여부 확인
const shouldShowWelcome = () => {
  const todayKey = getTodayKey()
  const dismissed = localStorage.getItem(todayKey)
  return !dismissed
}

// 안내 팝업 닫기 (오늘 하루 안 보기)
const dismissWelcome = () => {
  const todayKey = getTodayKey()
  localStorage.setItem(todayKey, 'true')
  showWelcomeDialog.value = false
}

// 안내 팝업 다시 활성화
const enableWelcomeDialog = () => {
  const todayKey = getTodayKey()
  localStorage.removeItem(todayKey)
  showWelcomeDialog.value = true
  showEnableDialogButton.value = false
}

// 목차 클릭 시 해당 섹션으로 스크롤
const scrollToSection = (sectionId) => {
  // Accordion 열기 (단일 탭만 활성화)
  const index = tocItems.findIndex((item) => item.id === sectionId)
  if (index !== -1) {
    activeIndex.value = index
    // DOM 업데이트 후 스크롤
    setTimeout(() => {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }
}

// 목차에서 링크로 이동
const navigateToPath = (path) => {
  if (path) {
    router.push(path)
  }
}

// 가이드 방문 플래그 저장
onMounted(() => {
  localStorage.setItem('hasVisitedGuide', 'true')

  // 안내 팝업 표시 여부 확인
  if (shouldShowWelcome()) {
    showWelcomeDialog.value = true
  } else {
    showEnableDialogButton.value = true
  }
})
</script>

<template>
  <div class="guide-view">
    <!-- 안내 팝업 다시 활성화 버튼 -->
    <div v-if="showEnableDialogButton" class="enable-dialog-button">
      <Button
        label="안내 팝업 다시 보기"
        icon="pi pi-info-circle"
        outlined
        size="small"
        @click="enableWelcomeDialog"
      />
    </div>

    <!-- 안내 팝업 -->
    <Dialog
      v-model:visible="showWelcomeDialog"
      modal
      :closable="true"
      class="welcome-dialog"
      :style="{ width: '500px' }"
    >
      <template #header>
        <div class="dialog-header-content">
          <i class="pi pi-info-circle"></i>
          <span>QueueIn 사용법 가이드 안내</span>
        </div>
      </template>

      <div class="dialog-body-content">
        <p>QueueIn 시스템 사용법을 안내하는 가이드입니다.</p>
        <p>좌측 목차를 클릭하면 해당 섹션으로 이동하거나, 관련 페이지로 바로 이동할 수 있습니다.</p>
        <div class="dialog-features">
          <div class="feature-item">
            <i class="pi pi-check-circle"></i>
            <span>목차를 통해 빠르게 원하는 섹션으로 이동</span>
          </div>
          <div class="feature-item">
            <i class="pi pi-check-circle"></i>
            <span>각 섹션에서 관련 페이지로 바로 이동 가능</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer-content">
          <Button label="오늘 하루 안 보기" outlined @click="dismissWelcome" />
          <Button label="확인" @click="dismissWelcome" />
        </div>
      </template>
    </Dialog>

    <div class="guide-layout">
      <!-- 좌측 목차 -->
      <div class="guide-toc">
        <div class="toc-header">
          <h3>목차</h3>
        </div>
        <nav class="toc-nav">
          <div
            v-for="(item, index) in tocItems"
            :key="item.id"
            class="toc-item"
            :class="{ active: activeIndex === index }"
            @click="scrollToSection(item.id)"
          >
            <i :class="item.icon"></i>
            <span>{{ item.label }}</span>
            <Button
              v-if="item.path"
              icon="pi pi-external-link"
              text
              size="small"
              class="toc-link-btn"
              @click.stop="navigateToPath(item.path)"
            />
          </div>
        </nav>
      </div>

      <!-- 우측 콘텐츠 -->
      <div class="guide-content-wrapper">
        <div class="guide-header">
          <h1 class="guide-title">
            <i class="pi pi-book"></i>
            QueueIn 사용법 가이드
          </h1>
          <p class="guide-subtitle">QueueIn 시스템을 효율적으로 사용하는 방법을 안내합니다.</p>
        </div>

        <Card class="guide-card">
          <template #content>
            <Accordion v-model:activeIndex="activeIndex">
              <!-- 예약 신청 -->
              <AccordionTab>
                <template #header>
                  <div class="tab-header" id="reservation-apply">
                    <i class="pi pi-calendar-plus"></i>
                    <span>예약 신청하기</span>
                  </div>
                </template>
                <div class="tab-content">
                  <div class="section-actions">
                    <Button
                      label="예약 신청 페이지로 이동"
                      icon="pi pi-arrow-right"
                      outlined
                      size="small"
                      @click="navigateToPath('/app/reservations/me')"
                    />
                  </div>

                  <h3>1. 예약 신청 페이지 접근</h3>
                  <p>
                    좌측 사이드바에서 <strong>"예약 관리"</strong> 메뉴를 클릭하거나, 대시보드의
                    <strong>"예약 신청"</strong> 버튼을 클릭합니다.
                  </p>

                  <h3>2. 자원 선택</h3>
                  <p>예약하고 싶은 자원을 검색하거나 목록에서 선택합니다.</p>

                  <h3>3. 예약 정보 입력</h3>
                  <ul>
                    <li><strong>날짜</strong>: 예약하고 싶은 날짜를 선택합니다.</li>
                    <li><strong>시간</strong>: 시작 시간과 종료 시간을 선택합니다.</li>
                    <li><strong>사용 목적</strong>: 예약 목적을 입력합니다 (선택사항).</li>
                  </ul>

                  <h3>4. 예약 신청</h3>
                  <p><strong>"예약 신청"</strong> 버튼을 클릭하면 관리자 승인을 기다리게 됩니다.</p>

                  <div class="tip-box">
                    <i class="pi pi-info-circle"></i>
                    <strong>팁:</strong> 즉시 승인이 필요한 경우, 관리자에게 직접 연락하거나 즉시
                    승인 예약 기능을 사용하세요.
                  </div>
                </div>
              </AccordionTab>

              <!-- 예약 조회 -->
              <AccordionTab>
                <template #header>
                  <div class="tab-header" id="reservation-list">
                    <i class="pi pi-list"></i>
                    <span>내 예약 조회하기</span>
                  </div>
                </template>
                <div class="tab-content">
                  <div class="section-actions">
                    <Button
                      label="내 예약 목록으로 이동"
                      icon="pi pi-arrow-right"
                      outlined
                      size="small"
                      @click="navigateToPath('/app/reservations/me')"
                    />
                  </div>

                  <h3>1. 예약 목록 확인</h3>
                  <p>
                    좌측 사이드바의 <strong>"예약 관리"</strong> 메뉴를 클릭하면 내 예약 목록을
                    확인할 수 있습니다.
                  </p>

                  <h3>2. 예약 상태 확인</h3>
                  <ul>
                    <li><strong>대기중 (PENDING)</strong>: 관리자 승인을 기다리는 상태</li>
                    <li><strong>승인됨 (APPROVED)</strong>: 예약이 승인되어 사용 가능한 상태</li>
                    <li><strong>거부됨 (REJECTED)</strong>: 예약이 거부된 상태</li>
                    <li><strong>사용중 (USING)</strong>: 현재 자원을 사용 중인 상태</li>
                    <li><strong>완료 (COMPLETED)</strong>: 예약 시간이 종료된 상태</li>
                    <li><strong>취소됨 (CANCELED)</strong>: 예약이 취소된 상태</li>
                  </ul>

                  <h3>3. 예약 상세 정보</h3>
                  <p>예약 목록에서 예약 항목을 클릭하면 상세 정보를 확인할 수 있습니다.</p>
                </div>
              </AccordionTab>

              <!-- 예약 가능 자원 조회 -->
              <AccordionTab>
                <template #header>
                  <div class="tab-header" id="reservable-assets">
                    <i class="pi pi-search"></i>
                    <span>예약 가능 자원 찾기</span>
                  </div>
                </template>
                <div class="tab-content">
                  <div class="section-actions">
                    <Button
                      label="예약 가능 자원 페이지로 이동"
                      icon="pi pi-arrow-right"
                      outlined
                      size="small"
                      @click="navigateToPath('/app/reservations/available-assets')"
                    />
                  </div>

                  <h3>1. 예약 가능 자원 페이지 접근</h3>
                  <p>
                    대시보드의 <strong>"예약 가능 자원"</strong> 버튼을 클릭하거나, 좌측
                    사이드바에서 해당 메뉴를 선택합니다.
                  </p>

                  <h3>2. 자원 검색</h3>
                  <ul>
                    <li><strong>날짜 필터</strong>: 특정 날짜의 예약 가능한 자원만 조회합니다.</li>
                    <li><strong>자원명 검색</strong>: 자원 이름으로 검색합니다.</li>
                    <li><strong>카테고리 필터</strong>: 자원 카테고리로 필터링합니다.</li>
                  </ul>

                  <h3>3. 예약 가능 시간 확인</h3>
                  <p>각 자원의 예약 가능한 시간대를 확인하고, 바로 예약 신청할 수 있습니다.</p>
                </div>
              </AccordionTab>

              <!-- 일정 관리 -->
              <AccordionTab>
                <template #header>
                  <div class="tab-header" id="schedule-management">
                    <i class="pi pi-calendar"></i>
                    <span>일정 관리 (월별/주별)</span>
                  </div>
                </template>
                <div class="tab-content">
                  <div class="section-actions">
                    <Button
                      label="일정 관리 페이지로 이동"
                      icon="pi pi-arrow-right"
                      outlined
                      size="small"
                      @click="navigateToPath('/app/reservations/monthly')"
                    />
                  </div>

                  <h3>1. 월별 예약 조회</h3>
                  <p>
                    대시보드의 <strong>"일정 관리"</strong> 버튼을 클릭하거나, 좌측 사이드바의
                    <strong>"일정 관리"</strong> 메뉴를 선택합니다.
                  </p>

                  <h3>2. 월별/주별 보기</h3>
                  <ul>
                    <li><strong>월별 보기</strong>: 한 달 단위로 예약 일정을 확인합니다.</li>
                    <li><strong>주별 보기</strong>: 한 주 단위로 예약 일정을 확인합니다.</li>
                  </ul>

                  <h3>3. 일정 확인</h3>
                  <p>
                    캘린더 형식으로 예약 일정을 한눈에 확인할 수 있습니다. 각 날짜를 클릭하면 해당
                    날짜의 예약 목록을 확인할 수 있습니다.
                  </p>

                  <div class="tip-box">
                    <i class="pi pi-info-circle"></i>
                    <strong>팁:</strong> 캘린더의 예약 이벤트를 클릭하면 예약 상세 정보를 확인할 수
                    있습니다.
                  </div>
                </div>
              </AccordionTab>

              <!-- 마이페이지 -->
              <AccordionTab>
                <template #header>
                  <div class="tab-header" id="mypage">
                    <i class="pi pi-user"></i>
                    <span>마이페이지</span>
                  </div>
                </template>
                <div class="tab-content">
                  <div class="section-actions">
                    <Button
                      label="마이페이지로 이동"
                      icon="pi pi-arrow-right"
                      outlined
                      size="small"
                      @click="navigateToPath('/app/users/me')"
                    />
                  </div>

                  <h3>1. 마이페이지 접근</h3>
                  <p>
                    우측 상단의 프로필 아이콘을 클릭하거나, <strong>"마이페이지"</strong> 메뉴를
                    선택합니다.
                  </p>

                  <h3>2. 내 정보 수정</h3>
                  <ul>
                    <li><strong>이름</strong>: 사용자 이름을 수정할 수 있습니다.</li>
                    <li><strong>연락처</strong>: 전화번호를 수정할 수 있습니다.</li>
                    <li><strong>생년월일</strong>: 생년월일을 수정할 수 있습니다.</li>
                    <li><strong>이메일</strong>: 이메일은 수정할 수 없습니다 (관리자에게 문의).</li>
                  </ul>

                  <h3>3. 비밀번호 변경</h3>
                  <p>
                    마이페이지에서 <strong>"비밀번호 변경"</strong> 섹션을 통해 비밀번호를 변경할 수
                    있습니다.
                  </p>

                  <div class="warning-box">
                    <i class="pi pi-exclamation-triangle"></i>
                    <strong>주의:</strong> 비밀번호는 안전하게 관리하세요. 정기적으로 변경하는 것을
                    권장합니다.
                  </div>
                </div>
              </AccordionTab>

              <!-- 자주 묻는 질문 -->
              <AccordionTab>
                <template #header>
                  <div class="tab-header" id="faq">
                    <i class="pi pi-question-circle"></i>
                    <span>자주 묻는 질문 (FAQ)</span>
                  </div>
                </template>
                <div class="tab-content">
                  <h3>Q1. 예약이 승인되지 않았어요.</h3>
                  <p>
                    A: 예약은 관리자의 승인이 필요합니다. 승인까지 시간이 걸릴 수 있으니 잠시
                    기다려주세요. 급한 경우 관리자에게 직접 연락하세요.
                  </p>

                  <h3>Q2. 예약을 취소하고 싶어요.</h3>
                  <p>
                    A: 예약 목록에서 취소하고 싶은 예약을 선택하고 <strong>"취소"</strong> 버튼을
                    클릭하세요. 단, 이미 시작된 예약은 취소할 수 없습니다.
                  </p>

                  <h3>Q3. 예약 시간을 변경하고 싶어요.</h3>
                  <p>A: 기존 예약을 취소하고 새로운 시간으로 다시 예약 신청하세요.</p>

                  <h3>Q4. 자원 사용을 시작/종료하려면 어떻게 하나요?</h3>
                  <p>
                    A: 승인된 예약의 경우, 예약 시간이 되면 <strong>"사용 시작"</strong> 버튼이
                    활성화됩니다. 사용이 끝나면 <strong>"사용 종료"</strong> 버튼을 클릭하세요.
                  </p>

                  <h3>Q5. 비밀번호를 잊어버렸어요.</h3>
                  <p>A: 관리자에게 문의하여 비밀번호를 재설정하세요.</p>
                </div>
              </AccordionTab>
            </Accordion>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.guide-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
}

/* 안내 팝업 다시 활성화 버튼 */
.enable-dialog-button {
  position: fixed;
  top: 100px;
  right: 24px;
  z-index: 100;
}

/* 안내 팝업 스타일 */
:deep(.welcome-dialog) {
  border-radius: 12px;
}

.dialog-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
}

.dialog-header-content i {
  font-size: 24px;
  color: #3b82f6;
}

.dialog-body-content {
  padding: 16px 0;
}

.dialog-body-content p {
  margin-bottom: 12px;
  line-height: 1.6;
  color: #4b5563;
}

.dialog-features {
  margin-top: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.feature-item i {
  color: #10b981;
  font-size: 18px;
}

.dialog-footer-content {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 가이드 레이아웃 */
.guide-layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

/* 좌측 목차 */
.guide-toc {
  position: sticky;
  top: 100px;
  width: 280px;
  flex-shrink: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.toc-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.toc-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toc-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #4b5563;
  font-weight: 500;
}

.toc-item:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.toc-item.active {
  background: #eff6ff;
  color: #3b82f6;
  font-weight: 600;
}

.toc-item i {
  font-size: 18px;
  flex-shrink: 0;
  color: #6b7280;
  transition: color 0.2s ease;
}

.toc-item.active i {
  color: #3b82f6;
}

.toc-item span {
  flex: 1;
}

.toc-link-btn {
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.toc-item:hover .toc-link-btn {
  opacity: 1;
}

/* 우측 콘텐츠 */
.guide-content-wrapper {
  flex: 1;
  min-width: 0;
}

.guide-header {
  margin-bottom: 32px;
  text-align: center;
}

.guide-title {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.guide-title i {
  font-size: 36px;
  color: #3b82f6;
}

.guide-subtitle {
  font-size: 16px;
  color: #6b7280;
}

.guide-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 16px;
}

.tab-header i {
  font-size: 20px;
  color: #3b82f6;
}

.tab-content {
  padding: 16px 0;
}

.section-actions {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.tab-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-top: 24px;
  margin-bottom: 12px;
}

.tab-content h3:first-child {
  margin-top: 0;
}

.tab-content p {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 12px;
}

.tab-content ul {
  color: #4b5563;
  line-height: 1.8;
  margin-left: 20px;
  margin-bottom: 16px;
}

.tab-content li {
  margin-bottom: 8px;
}

.tip-box,
.warning-box {
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.tip-box {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  color: #1e40af;
}

.tip-box i {
  color: #3b82f6;
  font-size: 20px;
  flex-shrink: 0;
}

.warning-box {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  color: #92400e;
}

.warning-box i {
  color: #f59e0b;
  font-size: 20px;
  flex-shrink: 0;
}

/* PrimeVue Accordion 커스터마이징 */
:deep(.p-accordion-header) {
  border-radius: 8px;
  margin-bottom: 8px;
}

:deep(.p-accordion-header-link) {
  padding: 16px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.p-accordion-content) {
  padding: 0 20px 20px 20px;
  transition: all 0.3s ease;
}

@media (max-width: 1024px) {
  .guide-layout {
    flex-direction: column;
  }

  .guide-toc {
    position: static;
    width: 100%;
    max-height: none;
  }
}

@media (max-width: 768px) {
  .guide-view {
    padding: 16px;
  }

  .guide-title {
    font-size: 24px;
    flex-direction: column;
  }

  .enable-dialog-button {
    position: static;
    margin-bottom: 16px;
    text-align: right;
  }
}
</style>
