<!-- file: src/views/admin/iam/user/UserEditView.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { userApi } from "@/api/iam/userApi.js";
import { roleApi } from "@/api/iam/roleApi.js";

import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import Calendar from "primevue/calendar";
import Button from "primevue/button";
import Card from "primevue/card";

const route = useRoute();
const router = useRouter();

const userId = Number(route.params.userId);

const user = ref(null);
const roleOptions = ref([]);
const deptOptions = Array.from({ length: 10 }, (_, i) => ({
  label: `${i + 1}`,
  value: i + 1
}));

const form = ref({
  roleId: null,
  dptId: null,
  retireDate: null
});

// ---------------------------------------------
// 데이터 로딩
// ---------------------------------------------
async function loadData() {
  const userRes = await userApi.getUser(userId);
  user.value = userRes.data;

  // 역할 목록
  const roles = await roleApi.getRoleList();
  roleOptions.value = roles.data.roles.map(r => ({
    label: r.roleName,
    value: r.roleId
  }));

  // 기존 값 매핑
  form.value.roleId = user.value.roleId ?? null;
  form.value.dptId = user.value.dptId ?? null;
  form.value.retireDate = user.value.retireDate
    ? new Date(user.value.retireDate)
    : null;
}

onMounted(loadData);

// ---------------------------------------------
// 저장 처리
// ---------------------------------------------
async function save() {
  try {
    // 역할 변경
    await userApi.updateUserRole(userId, {
      roleId: form.value.roleId
    });

    // 부서 + 퇴사일 변경
    await userApi.updateUser(userId, {
      dptId: form.value.dptId,
      retireDate: form.value.retireDate
        ? form.value.retireDate.toISOString()
        : null
    });

    alert("사용자 정보가 성공적으로 수정되었습니다.");
    router.push("/admin/users");
  } catch (e) {
    console.error(e);
    alert("수정 중 오류가 발생했습니다.");
  }
}
</script>

<template>
  <div class="page-wrapper">
    <h2 class="title">사용자 편집</h2>
    <p class="subtitle">관리자가 사용자의 정보 및 권한을 수정할 수 있는 화면입니다.</p>

    <div v-if="user" class="content-layout">

      <!-- LEFT : 기본 정보 -->
      <Card class="info-card">
        <template #title>기본 정보</template>
        <template #content>
          <div class="form-column">

            <div class="form-field">
              <label>사원명</label>
              <InputText :model-value="user.userName" disabled />
            </div>

            <div class="form-field">
              <label>이메일</label>
              <InputText :model-value="user.email" disabled />
            </div>

            <div class="form-field">
              <label>연락처</label>
              <InputText :model-value="user.phone" disabled />
            </div>

          </div>
        </template>
      </Card>

      <!-- RIGHT : 관리자 편집 -->
      <Card class="edit-card">
        <template #title>관리자 편집</template>
        <template #content>
          <div class="form-column">

            <div class="form-field">
              <label>역할</label>
              <Dropdown
                v-model="form.roleId"
                :options="roleOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="역할 선택"
              />
            </div>

            <div class="form-field">
              <label>부서</label>
              <Dropdown
                v-model="form.dptId"
                :options="deptOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="부서 선택"
              />
            </div>

            <div class="form-field">
              <label>퇴사일</label>
              <Calendar
                v-model="form.retireDate"
                dateFormat="yy-mm-dd"
                placeholder="YYYY-MM-DD"
              />
            </div>

            <div class="actions">
              <Button
                label="취소"
                severity="secondary"
                @click="router.back()"
              />
              <Button
                label="저장"
                severity="success"
                @click="save"
              />
            </div>

          </div>
        </template>
      </Card>

    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  padding: 40px;
  max-width: 1100px;
  margin: 0 auto;
}

.title {
  font-size: 24px;
  font-weight: 700;
}

.subtitle {
  margin-bottom: 28px;
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
.edit-card {
  flex: 1;
  min-width: 380px;
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-weight: 600;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}
</style>
