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
  { id: 'user-management', label: '사용자 관리', icon: 'pi pi-users', path: '/admin/users' },
  { id: 'role-permission', label: '역할 & 권한 관리', icon: 'pi pi-shield', path: '/admin/roles' },
  { id: 'asset-management', label: '자원 관리', icon: 'pi pi-box', path: '/admin/assets' },
  { id: 'reservation-management', label: '예약 관리', icon: 'pi pi-calendar', path: '/admin/reservations/applied' },
  { id: 'accounting-management', label: '정산 관리', icon: 'pi pi-chart-line', path: '/admin/accounting/usage-history' },
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
  const index = tocItems.findIndex(item => item.id === sectionId)
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
          <span>QueueIn 관리자 가이드 안내</span>
        </div>
      </template>

      <div class="dialog-body-content">
        <p>QueueIn 관리자 시스템 사용법을 안내하는 가이드입니다.</p>
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
          <Button
            label="오늘 하루 안 보기"
            outlined
            @click="dismissWelcome"
          />
          <Button
            label="확인"
            @click="dismissWelcome"
          />
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
            QueueIn 관리자 가이드
          </h1>
          <p class="guide-subtitle">QueueIn 관리자 시스템을 효율적으로 사용하는 방법을 안내합니다.</p>
        </div>

        <Card class="guide-card">
          <template #content>
            <Accordion v-model:activeIndex="activeIndex">
              <!-- 사용자 관리 -->
              <AccordionTab>
                <template #header>
                  <div class="tab-header" id="user-management">
                    <i class="pi pi-users"></i>
                    <span>사용자 관리</span>
                  </div>
                </template>
                <div class="tab-content">
                  <div class="section-actions">
                    <Button
                      label="사용자 관리 페이지로 이동"
                      icon="pi pi-arrow-right"
                      outlined
                      size="small"
                      @click="navigateToPath('/admin/users')"
                    />
                  </div>

                  <h3>1. 사용자 목록 조회</h3>
                  <p>좌측 사이드바의 <strong>"유저 관리"</strong> 메뉴를 클릭하면 전체 사용자 목록을 확인할 수 있습니다.</p>

                  <h3>2. 사용자 생성</h3>
                  <ul>
                    <li>사용자 목록 페이지에서 <strong>"사용자 등록"</strong> 버튼을 클릭합니다.</li>
                    <li>필수 정보를 입력합니다: 이름, 이메일, 전화번호, 역할 등</li>
                    <li>생성된 사용자는 임시 비밀번호로 로그인할 수 있습니다.</li>
                  </ul>

                  <h3>3. 사용자 수정</h3>
                  <ul>
                    <li>사용자 목록에서 수정하고 싶은 사용자를 선택합니다.</li>
                    <li><strong>"수정"</strong> 버튼을 클릭하여 정보를 변경합니다.</li>
                    <li>사용자의 역할을 변경할 수 있습니다.</li>
                  </ul>

                  <h3>4. 사용자 삭제</h3>
                  <p>사용자 목록에서 삭제하고 싶은 사용자를 선택하고 <strong>"삭제"</strong> 버튼을 클릭합니다. (주의: 삭제된 사용자는 복구할 수 없습니다.)</p>
                </div>
              </AccordionTab>

              <!-- 역할 & 권한 관리 -->
              <AccordionTab>
                <template #header>
                  <div class="tab-header" id="role-permission">
                    <i class="pi pi-shield"></i>
                    <span>역할 & 권한 관리</span>
                  </div>
                </template>
                <div class="tab-content">
                  <div class="section-actions">
                    <Button
                      label="역할 관리 페이지로 이동"
                      icon="pi pi-arrow-right"
                      outlined
                      size="small"
                      @click="navigateToPath('/admin/roles')"
                    />
                    <Button
                      label="권한 관리 페이지로 이동"
                      icon="pi pi-arrow-right"
                      outlined
                      size="small"
                      @click="navigateToPath('/admin/permissions/list')"
                    />
                  </div>

                  <h3>1. 역할 관리</h3>
                  <ul>
                    <li><strong>역할 목록 조회</strong>: 좌측 사이드바의 <strong>"유저 관리"</strong> → 상단 탭에서 <strong>"역할"</strong>을 클릭합니다.</li>
                    <li><strong>역할 생성</strong>: <strong>"역할 추가"</strong> 버튼을 클릭하여 새로운 역할을 생성합니다.</li>
                    <li><strong>역할 수정</strong>: 역할 카드의 <strong>"⋯"</strong> 메뉴에서 수정/삭제를 선택합니다.</li>
                  </ul>

                  <h3>2. 권한 관리</h3>
                  <ul>
                    <li>상단 탭에서 <strong>"권한"</strong> → <strong>"역할-권한 매핑"</strong> 메뉴를 클릭합니다.</li>
                    <li>각 역할에 대해 권한을 토글 스위치로 할당/해제할 수 있습니다.</li>
                    <li>변경사항은 <strong>"저장"</strong> 버튼을 클릭하여 적용합니다.</li>
                  </ul>

                  <h3>3. 권한 종류</h3>
                  <ul>
                    <li><strong>IAM_USER_*</strong>: 사용자 관리 권한 (생성, 조회, 수정, 삭제)</li>
                    <li><strong>IAM_ROLE_*</strong>: 역할 관리 권한</li>
                    <li><strong>IAM_PERMISSION_*</strong>: 권한 관리 권한</li>
                    <li>기타 도메인별 권한들</li>
                  </ul>

                  <div class="tip-box">
                    <i class="pi pi-info-circle"></i>
                    <strong>팁:</strong> 권한은 역할 단위로 관리되며, 사용자는 역할을 통해 권한을 상속받습니다.
                  </div>
                </div>
              </AccordionTab>

              <!-- 자원 관리 -->
              <AccordionTab>
                <template #header>
                  <div class="tab-header" id="asset-management">
                    <i class="pi pi-box"></i>
                    <span>자원 관리</span>
                  </div>
                </template>
                <div class="tab-content">
                  <div class="section-actions">
                    <Button
                      label="자원 관리 페이지로 이동"
                      icon="pi pi-arrow-right"
                      outlined
                      size="small"
                      @click="navigateToPath('/admin/assets')"
                    />
                  </div>

                  <h3>1. 자원 목록 조회</h3>
                  <p>좌측 사이드바의 <strong>"자원 관리"</strong> 메뉴를 클릭하면 계층 구조로 자원 목록을 확인할 수 있습니다.</p>

                  <h3>2. 자원 생성</h3>
                  <ul>
                    <li><strong>"자원 등록"</strong> 버튼을 클릭합니다.</li>
                    <li>자원 정보를 입력합니다: 이름, 타입, 카테고리, 위치 등</li>
                    <li>부모 자원을 선택하여 계층 구조를 설정할 수 있습니다.</li>
                  </ul>

                  <h3>3. 자원 수정/삭제</h3>
                  <ul>
                    <li>자원 목록에서 수정/삭제하고 싶은 자원을 선택합니다.</li>
                    <li>자원 상세 페이지에서 <strong>"수정"</strong> 또는 <strong>"삭제"</strong> 버튼을 클릭합니다.</li>
                  </ul>

                  <h3>4. 카테고리 관리</h3>
                  <p>자원 관리 페이지에서 <strong>"카테고리 관리"</strong> 메뉴를 통해 자원 카테고리를 관리할 수 있습니다.</p>
                </div>
              </AccordionTab>

              <!-- 예약 관리 -->
              <AccordionTab>
                <template #header>
                  <div class="tab-header" id="reservation-management">
                    <i class="pi pi-calendar"></i>
                    <span>예약 관리</span>
                  </div>
                </template>
                <div class="tab-content">
                  <div class="section-actions">
                    <Button
                      label="신청 예약 관리 페이지로 이동"
                      icon="pi pi-arrow-right"
                      outlined
                      size="small"
                      @click="navigateToPath('/admin/reservations/applied')"
                    />
                  </div>

                  <h3>1. 신청 예약 조회</h3>
                  <p>좌측 사이드바의 <strong>"신청 예약 관리"</strong> 메뉴를 클릭하면 승인 대기 중인 예약 목록을 확인할 수 있습니다.</p>

                  <h3>2. 예약 승인/거부</h3>
                  <ul>
                    <li>예약 목록에서 승인/거부하고 싶은 예약을 선택합니다.</li>
                    <li><strong>"승인"</strong> 또는 <strong>"거부"</strong> 버튼을 클릭합니다.</li>
                    <li>거부 시 사유를 입력할 수 있습니다.</li>
                  </ul>

                  <h3>3. 예약 필터링</h3>
                  <p>날짜, 자원명, 상태 등으로 예약을 필터링하여 조회할 수 있습니다.</p>

                  <div class="warning-box">
                    <i class="pi pi-exclamation-triangle"></i>
                    <strong>주의:</strong> 예약을 거부할 경우 사용자에게 알림이 전송됩니다. 신중하게 결정하세요.
                  </div>
                </div>
              </AccordionTab>

              <!-- 정산 관리 -->
              <AccordionTab>
                <template #header>
                  <div class="tab-header" id="accounting-management">
                    <i class="pi pi-chart-line"></i>
                    <span>정산 관리</span>
                  </div>
                </template>
                <div class="tab-content">
                  <div class="section-actions">
                    <Button
                      label="정산 관리 페이지로 이동"
                      icon="pi pi-arrow-right"
                      outlined
                      size="small"
                      @click="navigateToPath('/admin/accounting/usage-history')"
                    />
                  </div>

                  <h3>1. 자원 사용 기록</h3>
                  <p>정산 메뉴의 <strong>"자원 사용 기록"</strong>에서 모든 자원 사용 내역을 조회할 수 있습니다.</p>

                  <h3>2. 사용 추이 분석</h3>
                  <p><strong>"사용 추이"</strong> 메뉴에서 시간대별, 기간별 자원 사용 추이를 그래프로 확인할 수 있습니다.</p>

                  <h3>3. 운영 성과 분석</h3>
                  <ul>
                    <li><strong>"운영 성과 분석"</strong> 메뉴에서 연도별, 자원별 성과를 비교 분석할 수 있습니다.</li>
                    <li>절감액, 사용률 등 다양한 지표를 확인할 수 있습니다.</li>
                  </ul>

                  <h3>4. 분기 정산</h3>
                  <p><strong>"분기 정산"</strong> 메뉴에서 분기별 정산 내역을 조회하고 엑셀로 다운로드할 수 있습니다.</p>
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
                  <h3>Q1. 사용자에게 권한을 부여하려면 어떻게 하나요?</h3>
                  <p>A: 사용자의 역할을 변경하면 됩니다. 역할은 권한 관리에서 관리되며, 역할에 할당된 권한이 사용자에게 자동으로 적용됩니다.</p>

                  <h3>Q2. 예약 승인 기준은 무엇인가요?</h3>
                  <p>A: 예약 승인은 관리자의 판단에 따라 결정됩니다. 자원의 가용성, 사용 목적 등을 고려하여 승인하세요.</p>

                  <h3>Q3. 자원을 삭제하면 예약도 함께 삭제되나요?</h3>
                  <p>A: 자원을 삭제하면 해당 자원과 관련된 예약도 함께 삭제됩니다. 신중하게 삭제하세요.</p>

                  <h3>Q4. 통계 데이터는 언제 업데이트되나요?</h3>
                  <p>A: 통계 데이터는 실시간으로 업데이트됩니다. 예약이 생성/완료되면 즉시 반영됩니다.</p>

                  <h3>Q5. 사용자가 비밀번호를 잊어버렸을 때는?</h3>
                  <p>A: 사용자 관리 페이지에서 해당 사용자의 비밀번호를 재설정할 수 있습니다. 또는 사용자에게 임시 비밀번호를 발급할 수 있습니다.</p>
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
  padding: 21.6px;
  max-width: 1260px;
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
  gap: 10.8px;
  font-size: 18px;
  font-weight: 600;
}

.dialog-header-content i {
  font-size: 21.6px;
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
  gap: 28.8px;
  align-items: flex-start;
}

/* 좌측 목차 */
.guide-toc {
  position: sticky;
  top: 90px;
  width: 252px;
  flex-shrink: 0;
  background: white;
  border-radius: 10.8px;
  box-shadow: 0 1.8px 7.2px rgba(0, 0, 0, 0.1);
  padding: 18px;
  max-height: calc(100vh - 108px);
  overflow-y: auto;
}

.toc-header {
  margin-bottom: 14.4px;
  padding-bottom: 10.8px;
  border-bottom: 2px solid #e5e7eb;
}

.toc-header h3 {
  font-size: 16.2px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 7.2px;
}

.toc-item {
  display: flex;
  align-items: center;
  gap: 10.8px;
  padding: 10.8px 14.4px;
  border-radius: 7.2px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #4b5563;
  font-weight: 500;
  font-size: 14.4px;
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
  font-size: 16.2px;
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
  margin-bottom: 28.8px;
  text-align: center;
}

.guide-title {
  font-size: 28.8px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 10.8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10.8px;
}

.guide-title i {
  font-size: 32.4px;
  color: #3b82f6;
}

.guide-subtitle {
  font-size: 14.4px;
  color: #6b7280;
}

.guide-card {
  border-radius: 10.8px;
  box-shadow: 0 1.8px 7.2px rgba(0, 0, 0, 0.1);
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 10.8px;
  font-weight: 600;
  font-size: 14.4px;
}

.tab-header i {
  font-size: 18px;
  color: #3b82f6;
}

.tab-content {
  padding: 14.4px 0;
}

.section-actions {
  margin-bottom: 21.6px;
  padding-bottom: 14.4px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 10.8px;
  flex-wrap: wrap;
}

.tab-content h3 {
  font-size: 16.2px;
  font-weight: 600;
  color: #1f2937;
  margin-top: 21.6px;
  margin-bottom: 10.8px;
}

.tab-content h3:first-child {
  margin-top: 0;
}

.tab-content p {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 10.8px;
  font-size: 14.4px;
}

.tab-content ul {
  color: #4b5563;
  line-height: 1.8;
  margin-left: 18px;
  margin-bottom: 14.4px;
  font-size: 14.4px;
}

.tab-content li {
  margin-bottom: 7.2px;
}

.tip-box,
.warning-box {
  padding: 14.4px;
  border-radius: 7.2px;
  margin-top: 14.4px;
  display: flex;
  align-items: flex-start;
  gap: 10.8px;
  font-size: 14.4px;
}

.tip-box {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  color: #1e40af;
}

.tip-box i {
  color: #3b82f6;
  font-size: 18px;
  flex-shrink: 0;
}

.warning-box {
  background: #fef3c7;
  border-left: 3.6px solid #f59e0b;
  color: #92400e;
}

.warning-box i {
  color: #f59e0b;
  font-size: 18px;
  flex-shrink: 0;
}

/* PrimeVue Accordion 커스터마이징 */
:deep(.p-accordion-header) {
  border-radius: 7.2px;
  margin-bottom: 7.2px;
}

:deep(.p-accordion-header-link) {
  padding: 14.4px 18px;
  border-radius: 7.2px;
  transition: all 0.3s ease;
}

:deep(.p-accordion-content) {
  padding: 0 18px 18px 18px;
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
