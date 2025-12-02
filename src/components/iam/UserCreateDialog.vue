<script setup>
import { ref } from "vue"
import Dialog from "primevue/dialog"
import InputText from "primevue/inputtext"
import Button from "primevue/button"
import Calendar from "primevue/calendar"
import Dropdown from "primevue/dropdown"
import { userApi } from "@/api/iam/userApi.js"

const props = defineProps({
  visible: Boolean,
})

const emit = defineEmits(["close", "created"])

// -------------------------------
// 부서 선택 (하드코딩)
// -------------------------------
const departmentOptions = [
  { label: "개발 1팀", value: 1 },
  { label: "개발 2팀", value: 2 },
  { label: "인사팀", value: 3 },
  { label: "재무팀", value: 4 },
]

// -------------------------------
// 폼 데이터
// -------------------------------
const form = ref({
  dptId: null,
  userName: "",
  email: "",
  hireDate: null,
  phone: "",
  birth: "",
})

// -------------------------------
// 저장 중 여부
// -------------------------------
const saving = ref(false)

// -------------------------------
// 저장 처리
// -------------------------------
async function submit() {
  try {
    saving.value = true

    const payload = {
      dptId: form.value.dptId,
      userName: form.value.userName,
      email: form.value.email,
      hireDate: formatLocalDate(form.value.hireDate),
      phone: form.value.phone || null,
      birth: form.value.birth || null,
    }

    await userApi.createUser(payload)

    alert("사용자가 등록되었습니다.")
    emit("created")
    emit("close")

  } catch (e) {
    console.error(e)
    alert(e.response?.data?.message || "사용자 등록 중 오류 발생")
  } finally {
    saving.value = false
  }
}

// -------------------------------
// yyyy-MM-dd 포맷팅
// -------------------------------
function formatLocalDate(date) {
  if (!date) return null

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="사용자 등록"
    :style="{ width: '450px' }"
    @update:visible="emit('close')"
  >
    <div class="form">

      <label>부서</label>
      <Dropdown
        v-model="form.dptId"
        :options="departmentOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="부서를 선택하세요"
        class="input"
      />

      <label>이름</label>
      <InputText v-model="form.userName" class="input" />

      <label>이메일</label>
      <InputText v-model="form.email" class="input" />

      <label>입사일</label>
      <Calendar
        v-model="form.hireDate"
        dateFormat="yy-mm-dd"
        class="input"
      />

      <label>연락처(선택)</label>
      <InputText v-model="form.phone" class="input" placeholder="010-0000-0000" />

      <label>생년월일(선택)</label>
      <InputText v-model="form.birth" class="input" placeholder="yyyy-MM-dd" />

      <div class="actions">
        <Button label="취소" text @click="emit('close')" />
        <Button label="등록" :loading="saving" @click="submit" />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input {
  width: 100%;
}

.actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
