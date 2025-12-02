<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  open: Boolean,
})

const route = useRoute()

const role = localStorage.getItem('role')
const isAdmin = computed(() =>
  ['MASTER', 'ADMIN', 'MANAGER'].includes(role)
)

// ★ 여기 추가!
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
        to="/app"
        class="item"
        :class="{ active: isActiveStartsWith('/app') }"
        @click="$emit('close-sidebar')"
      >
        <img src="@/assets/icons/reserve.svg" class="icon" />
        <span v-if="props.open">예약 관리</span>
      </router-link>

      <!-- 일정 관리 -->
      <router-link
        to="/app/schedule"
        class="item"
        :class="{ active: isActiveStartsWith('/app/schedule') }"
        @click="$emit('close-sidebar')"
      >
        <img src="@/assets/icons/schedule.svg" class="icon" />
        <span v-if="props.open">일정 관리</span>
      </router-link>

      <!-- 자원 관리 -->
      <router-link
        v-if="isAdmin"
        to="/admin/assets"
        class="item"
        :class="{ active: isActiveStartsWith('/admin/assets') }"
        @click="$emit('close-sidebar')"
      >
        <img src="@/assets/icons/resource.svg" class="icon" />
        <span v-if="props.open">자원 관리</span>
      </router-link>

      <!-- 정산 관리 -->
      <router-link
        v-if="isAdmin"
        to="/admin/stats"
        class="item"
        :class="{ active: isActiveStartsWith('/admin/stats') }"
        @click="$emit('close-sidebar')"
      >
        <img src="@/assets/icons/stats.svg" class="icon" />
        <span v-if="props.open">정산 관리</span>
      </router-link>

      <!-- 유저 관리 -->
      <router-link
        v-if="isAdmin"
        to="/admin/users"
        class="item"
        :class="{ active: isActiveStartsWith('/admin/users') }"
        @click="$emit('close-sidebar')"
      >
        <img src="@/assets/icons/user.svg" class="icon" />
        <span v-if="props.open">유저 관리</span>
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
}

/* 열림 */
.sidebar.open {
  width: 150px;
}

/* 메뉴 전체 정렬 */
.menu {
  display: flex;
  flex-direction: column;
  align-items: center;
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

/* 텍스트 */
.item span {
  margin-top: 6px;
  font-size: 14px;
  font-weight: 600;
}
</style>
