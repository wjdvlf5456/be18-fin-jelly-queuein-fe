<!-- file: src/views/admin/iam/user/UserDetailView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { userApi } from "@/api/iam/userApi.js";
import IamTabs from '@/components/iam/IamTabs.vue';

import Button from "primevue/button";
import Card from "primevue/card";
import Tag from "primevue/tag";

const route = useRoute();
const router = useRouter();

const userId = Number(route.params.userId);
const user = ref(null);
const loading = ref(false);

// ---------------------------------------------
// 데이터 로딩
// ---------------------------------------------
async function loadData() {
  try {
    loading.value = true;
    const userRes = await userApi.getUser(userId);
    user.value = userRes.data;
  } catch (e) {
    console.error(e);
    alert("사용자 정보를 불러오는 중 오류가 발생했습니다.");
    router.push("/admin/users");
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);

// ---------------------------------------------
// 편집 페이지로 이동
// ---------------------------------------------
function editUser() {
  if (user.value?.roleName === 'MASTER') return;
  router.push(`/admin/users/${userId}/edit`);
}

// ---------------------------------------------
// 역할 태그 색상
// ---------------------------------------------
const roleTagStyle = {
  MASTER: { severity: 'danger' },
  ADMIN: { severity: 'warning' },
  MANAGER: { severity: 'info' },
  GENERAL: { severity: 'success' },
};

// ---------------------------------------------
// 날짜 포맷팅
// ---------------------------------------------
function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

// ---------------------------------------------
// 아바타 첫 글자
// ---------------------------------------------
function firstLetter(name = '') {
  return name?.trim()?.charAt(0) || '?';
}
</script>

<template>
  <div class="page">
    <IamTabs />

    <div class="page-wrapper">
      <div class="header">
        <div>
          <h2>사용자 상세 조회</h2>
          <p class="subtitle">사용자의 상세 정보를 확인할 수 있습니다.</p>
        </div>
        <Button
          label="편집"
          icon="pi pi-pencil"
          :disabled="user?.roleName === 'MASTER'"
          @click="editUser"
        />
      </div>

      <div v-if="loading" class="loading">로딩 중...</div>

      <div v-else-if="user" class="content-layout">
        <!-- LEFT : 기본 정보 -->
        <Card class="info-card">
          <template #title>기본 정보</template>
          <template #content>
            <div class="info-grid">
              <div class="info-item">
                <label>프로필</label>
                <div class="avatar">{{ firstLetter(user.userName) }}</div>
              </div>

              <div class="info-item">
                <label>사원명</label>
                <div class="value">{{ user.userName }}</div>
              </div>

              <div class="info-item">
                <label>이메일</label>
                <div class="value">{{ user.email }}</div>
              </div>

              <div class="info-item">
                <label>연락처</label>
                <div class="value">{{ user.phone || '-' }}</div>
              </div>

              <div class="info-item">
                <label>역할</label>
                <Tag
                  :value="user.roleName"
                  :severity="roleTagStyle[user.roleName]?.severity"
                />
              </div>

              <div class="info-item">
                <label>마지막 접속</label>
                <div class="value">{{ formatDate(user.lastLoginAt) }}</div>
              </div>
            </div>
          </template>
        </Card>

        <!-- RIGHT : 추가 정보 -->
        <Card class="additional-card">
          <template #title>추가 정보</template>
          <template #content>
            <div class="info-grid">
              <div class="info-item">
                <label>부서 ID</label>
                <div class="value">{{ user.dptId || '-' }}</div>
              </div>

              <div class="info-item">
                <label>퇴사일</label>
                <div class="value">{{ user.retireDate ? formatDate(user.retireDate) : '-' }}</div>
              </div>

              <div class="info-item">
                <label>상태</label>
                <div class="value">
                  <span :class="['status-text', user.active ? 'active' : 'inactive']">
                    {{ user.active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 30px;
}

.page-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.title {
  font-size: 24px;
  font-weight: 700;
}

.subtitle {
  margin-top: 4px;
  color: #666;
}

.content-layout {
  display: flex;
  gap: 32px;
}

/* LEFT CARD */
.info-card {
  flex: 1;
  min-width: 380px;
}

/* RIGHT CARD */
.additional-card {
  flex: 1;
  min-width: 380px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.value {
  font-size: 16px;
  color: #243540;
}

.avatar {
  width: 48px;
  height: 48px;
  background: #e0e4ef;
  color: #243540;
  font-weight: bold;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.status-text.active {
  color: #16a34a;
  font-weight: 600;
}

.status-text.inactive {
  color: #999;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>

