<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { hasRole } from '@/utils/role'

// Vue 3 + Vite 표준: asset import
import reserveIcon from '@/assets/icons/reserve.svg'
import scheduleIcon from '@/assets/icons/schedule.svg'
import resourceIcon from '@/assets/icons/resource.svg'
import statsIcon from '@/assets/icons/stats.svg'
import userIcon from '@/assets/icons/user.svg'

const props = defineProps({
  open: Boolean,
})

const route = useRoute()

// MANAGER 이상 (자원 관리, 정산 관리용)
const isAdminOrManager = computed(() => hasRole('MANAGER'))

// ADMIN 이상 (유저 관리, 가이드용)
const isAdminOnly = computed(() => hasRole('ADMIN'))

function isActiveExact(path) {
  return route.path === path
}

function isActiveStartsWith(basePath) {
  return route.path === basePath || route.path.startsWith(basePath + '/')
}
</script>


<template>
  <aside class="sidebar" :class="{ open: props.open }">

    <nav class="menu">


      <!-- 예약 관리 -->
      <router-link
        to="/app/reservations/me"
        class="item"
        :class="{ active: isActiveStartsWith('/app/reservations/me') }"
        @click="$emit('close-sidebar')"
      >
        <img :src="reserveIcon" class="icon" />
        <span v-if="props.open">예약 관리</span>
      </router-link>

      <!-- 일정 관리 -->
      <router-link
        to="/app/reservations/monthly"
        class="item"
        :class="{ active: isActiveStartsWith('/app/reservations/monthly') }"
        @click="$emit('close-sidebar')"
      >
        <img :src="scheduleIcon" class="icon" />
        <span v-if="props.open">일정 관리</span>
      </router-link>

      <!-- 자원 관리 -->
      <router-link
        v-if="isAdminOrManager"
        to="/admin/assets"
        class="item"
        :class="{ active: isActiveStartsWith('/admin/assets') }"
        @click="$emit('close-sidebar')"
      >
        <img :src="resourceIcon" class="icon" />
        <span v-if="props.open">자원 관리</span>
      </router-link>

      <!-- 정산 관리 -->
      <router-link
        v-if="isAdminOrManager"
        to="/admin/accounting/usage-history"
        class="item"
        :class="{ active: isActiveStartsWith('/admin/accounting') }"
        @click="$emit('close-sidebar')"
      >
        <img :src="statsIcon" class="icon" />
        <span v-if="props.open">정산 관리</span>
      </router-link>

      <!-- 유저 관리 (ADMIN 이상만) - 사용자, 역할, 권한 모두 포함 -->
      <router-link
        v-if="isAdminOnly"
        to="/admin/users"
        class="item"
        :class="{ active: isActiveStartsWith('/admin/users') || isActiveStartsWith('/admin/roles') || isActiveStartsWith('/admin/permissions') }"
        @click="$emit('close-sidebar')"
      >
        <img :src="userIcon" class="icon" />
        <span v-if="props.open">유저 관리</span>
      </router-link>

      <!-- 사용법 가이드 (ADMIN 이상만) -->
      <router-link
        v-if="isAdminOnly"
        to="/admin/guide"
        class="item"
        :class="{ active: isActiveStartsWith('/admin/guide') }"
        @click="$emit('close-sidebar')"
      >
        <i class="pi pi-book icon-text"></i>
        <span v-if="props.open">사용법 가이드</span>
      </router-link>

    </nav>

  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;

  /* 닫힘 기본값 */
  width: 0px;
  overflow: hidden;

  background: #f3f3f3;
  border-right: 1px solid #ddd;

  padding-top: 70px;
  transition: width 0.25s ease;
  z-index: 30;
  display: flex;
  flex-direction: column;
}

/* 열림 */
.sidebar.open {
  width: 150px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 메뉴 전체 정렬 */
.menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-height: 0;
  padding-bottom: 20px;
}

/* 아이템 기본 스타일 */
.item {
  display: flex;
  flex-direction: column; /* 아이콘 위 / 글씨 아래 */
  align-items: center;
  width: 100%;
  padding: 30px 0;

  text-decoration: none;
  color: #333;
  transition: 0.2s;
}

/* 선택된 메뉴 */
.item.active {
  background: #B6CEB4;
  border-radius: 4px;
}

/* 아이콘 */
.icon {
  width: 40px;
  height: 40px;
}

/* PrimeIcons 텍스트 아이콘 (가이드용) */
.icon-text {
  font-size: 32px;
  color: #333;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 텍스트 */
.item span {
  margin-top: 6px;
  font-size: 14px;
  font-weight: 600;
}

 /* 사이드바에서 클릭 시 초록색으로 변경 */
:deep(.router-link-active),
:deep(.router-link-exact-active) {
  background: #B6CEB4 !important;
  border-radius: 12px;
  color: #000 !important;
}
</style>
