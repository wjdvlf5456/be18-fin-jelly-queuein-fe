<!-- src/layouts/PublicLayout.vue -->
<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { RouterView } from 'vue-router'

const route = useRoute()
const previousPath = ref(null)
const transitionName = ref('fade')

// 경로 변경 감지 및 Transition 이름 결정
watch(
  () => route.path,
  (newPath, oldPath) => {
    transitionName.value = 'fade'
    previousPath.value = oldPath

    if (oldPath) {
      sessionStorage.setItem('previousRoutePath', oldPath)
    }
  },
  { immediate: false },
)

// Transition 완료 후 이벤트 발생
function onTransitionEnter() {
  setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent('route-transition-complete', {
        detail: {
          path: route.path,
          previousPath: previousPath.value || sessionStorage.getItem('previousRoutePath'),
        },
      }),
    )
  }, 50)
}
</script>

<template>
  <div class="public-layout">
    <RouterView v-slot="{ Component }">
      <Transition :name="transitionName" mode="out-in" @after-enter="onTransitionEnter">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </div>
</template>

<style scoped>
.public-layout {
  min-height: 100vh;
}

/* ===== 페이지 전환 애니메이션 ===== */

/* 기본 페이드 전환 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
