<!-- file: src/components/iam/UserCreateDialog.vue -->
<script setup>
import { ref, watch, nextTick } from "vue"
import Dialog from "primevue/dialog"
import InputText from "primevue/inputtext"
import Button from "primevue/button"
import AutoComplete from "primevue/autocomplete"
import Dropdown from "primevue/dropdown"
import Calendar from "primevue/calendar"
import { userApi } from "@/api/iam/userApi.js"

const props = defineProps({
  visible: Boolean
})
const emit = defineEmits(["close", "created"])

// -------------------------------
// 부서 옵션 (Dropdown 기반)
// -------------------------------
const departmentOptions = [
  { label: "개발 1팀", value: 1 },
  { label: "개발 2팀", value: 2 },
  { label: "인사팀", value: 3 },
  { label: "재무팀", value: 4 }
]

// -------------------------------
// 폼 + 에러
// -------------------------------
const form = ref({
  dptId: "",
  userName: "",
  email: "",
  hireDate: null,
  phone: "",
  birthYear: "",
  birthMonth: "",
  birthDay: ""
})

const errors = ref({
  dptId: "",
  userName: "",
  email: "",
  hireDate: "",
  phone: "",
  birth: ""
})

const saving = ref(false)

// -------------------------------
// 엔터 잔류 입력 완전 차단
// -------------------------------
function blockEnter(e) {
  if (e.key === "Enter") {
    e.preventDefault()
    e.stopImmediatePropagation()
    e.stopPropagation()
    return false
  }
}

// -------------------------------
// 다음 input으로 포커스 이동
// -------------------------------
function moveTo(id) {
  setTimeout(() => {
    const el = document.getElementById(id)
    if (el) el.focus()
  }, 10)
}

// -------------------------------
// 초기화
// -------------------------------
function resetForm() {
  form.value = {
    dptId: "",
    userName: "",
    email: "",
    hireDate: null,
    phone: "",
    birthYear: "",
    birthMonth: "",
    birthDay: ""
  }

  Object.keys(errors.value).forEach(k => (errors.value[k] = ""))
}

// -------------------------------
// 전화번호 자동 하이픈 + 11자리 제한
// -------------------------------
function autoHyphen(raw) {
  if (!raw) return ""
  let digits = raw.replace(/\D/g, "").slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 7) return digits.replace(/(\d{3})(\d{1,4})/, "$1-$2")
  return digits.replace(/(\d{3})(\d{4})(\d{1,4})/, "$1-$2-$3")
}

function onPhoneInput(e) {
  form.value.phone = autoHyphen(e.target.value)
}

// -------------------------------
// yyyy-MM-dd 포맷
// -------------------------------
function formatDate(y, m, d) {
  const mm = String(m).padStart(2, "0")
  const dd = String(d).padStart(2, "0")
  return `${y}-${mm}-${dd}`
}

// -------------------------------
// 생년월일 AutoComplete
// -------------------------------
const allYears = Array.from({ length: 2025 - 1950 + 1 }, (_, i) =>
  String(2025 - i)
)
const filteredYears = ref([])

function searchYear(e) {
  const q = e.query.trim()
  filteredYears.value = allYears.filter(y => y.includes(q))
}

const allMonths = Array.from({ length: 12 }, (_, i) => String(i + 1))
const filteredMonths = ref([])

function searchMonth(e) {
  const q = e.query.trim()
  filteredMonths.value = allMonths.filter(m => m.includes(q))
}

const allDays = ref([])
const filteredDays = ref([])

watch(
  () => [form.value.birthYear, form.value.birthMonth],
  ([y, m]) => {
    if (!y || !m) {
      allDays.value = []
      form.value.birthDay = ""
      return
    }
    const last = new Date(Number(y), Number(m), 0).getDate()
    allDays.value = Array.from({ length: last }, (_, i) => String(i + 1))
  }
)

function searchDay(e) {
  const q = e.query.trim()
  filteredDays.value = allDays.value.filter(d => d.includes(q))
}

// -------------------------------
// 저장
// -------------------------------
async function submit() {
  Object.keys(errors.value).forEach(k => (errors.value[k] = ""))

  if (!form.value.dptId) errors.value.dptId = "부서를 선택하세요."
  if (!form.value.userName) errors.value.userName = "이름을 입력해주세요."
  if (!form.value.email) errors.value.email = "이메일을 입력해주세요."
  if (form.value.email && !form.value.email.includes("@"))
    errors.value.email = "올바른 이메일 형식이 아닙니다."
  if (!form.value.hireDate) errors.value.hireDate = "입사일을 선택하세요."

  if (Object.values(errors.value).some(v => v)) return

  let birthString = null
  if (form.value.birthYear && form.value.birthMonth && form.value.birthDay) {
    birthString = formatDate(
      form.value.birthYear,
      form.value.birthMonth,
      form.value.birthDay
    )
  }

  const payload = {
    dptId: form.value.dptId,
    userName: form.value.userName,
    email: form.value.email,
    hireDate: form.value.hireDate
      ? formatDate(
        form.value.hireDate.getFullYear(),
        form.value.hireDate.getMonth() + 1,
        form.value.hireDate.getDate()
      )
      : null,
    phone: form.value.phone || null,
    birth: birthString
  }

  saving.value = true
  try {
    await userApi.createUser(payload)
    emit("created")
    emit("close")
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="사용자 등록"
    :style="{ width: '480px' }"
    @update:visible="emit('close')"
  >
    <div class="form">

      <!-- 부서 -->
      <label for="dptId">부서*</label>
      <Dropdown
        id="dptId"
        v-model="form.dptId"
        :options="departmentOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="부서를 선택하세요"
        class="input"
        @keydown.enter.prevent="moveTo('userName')"
        @keydown="blockEnter"
      />
      <p v-if="errors.dptId" class="error">{{ errors.dptId }}</p>

      <!-- 이름 -->
      <label for="userName">이름*</label>
      <InputText
        id="userName"
        v-model="form.userName"
        class="input"
        @keydown.enter.prevent="moveTo('email')"
        @keydown="blockEnter"
      />
      <p v-if="errors.userName" class="error">{{ errors.userName }}</p>

      <!-- 이메일 -->
      <label for="email">이메일*</label>
      <InputText
        id="email"
        v-model="form.email"
        class="input"
        @keydown.enter.prevent="moveTo('hireDate')"
        @keydown="blockEnter"
      />
      <p v-if="errors.email" class="error">{{ errors.email }}</p>

      <!-- 입사일 -->
      <label for="hireDate">입사일*</label>
      <Calendar
        id="hireDate"
        v-model="form.hireDate"
        dateFormat="yy-mm-dd"
        class="input"
        @keydown.enter.prevent="moveTo('phone')"
        @keydown="blockEnter"
      />
      <p v-if="errors.hireDate" class="error">{{ errors.hireDate }}</p>

      <!-- 전화번호 -->
      <label for="phone">연락처</label>
      <InputText
        id="phone"
        v-model="form.phone"
        class="input"
        placeholder="예: 010-1234-5678"
        maxlength="13"
        @input="onPhoneInput"
        @keydown.enter.prevent="moveTo('birthYear')"
        @keydown="blockEnter"
      />

      <!-- 생년월일 -->
      <label>생년월일</label>
      <div class="birth-row">

        <AutoComplete
          id="birthYear"
          v-model="form.birthYear"
          :suggestions="filteredYears"
          @complete="searchYear"
          placeholder="년도"
          class="input birth-select"
          dropdown
          @keydown.enter.prevent="moveTo('birthMonth')"
          @keydown="blockEnter"
        />

        <AutoComplete
          id="birthMonth"
          v-model="form.birthMonth"
          :suggestions="filteredMonths"
          @complete="searchMonth"
          placeholder="월"
          class="input birth-select"
          dropdown
          @keydown.enter.prevent="moveTo('birthDay')"
          @keydown="blockEnter"
        />

        <AutoComplete
          id="birthDay"
          v-model="form.birthDay"
          :suggestions="filteredDays"
          @complete="searchDay"
          placeholder="일"
          class="input birth-select"
          dropdown
          @keydown.enter.prevent="moveTo('submitBtn')"
          @keydown="blockEnter"
        />

      </div>

      <div class="actions">
        <Button label="초기화" text @click="resetForm" />
        <Button label="취소" text @click="emit('close')" />
        <Button id="submitBtn" label="등록" :loading="saving" @click="submit" />
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
  height: 42px !important;
  border-radius: 8px;
}
.birth-row {
  display: flex;
  gap: 10px;
}
.birth-select {
  flex: 1;
}
.error {
  color: #d92d20;
  font-size: 13px;
  margin-top: -4px;
}
.actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
