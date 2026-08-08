<script setup>
import { useRoute, useRouter } from 'vue-router'

var route = useRoute()
var router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-20 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around h-16"
  >
    <button
      type="button"
      class="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-4 text-sm"
      :class="route.name === 'home' ? 'text-brand-500 font-semibold' : 'text-slate-500 dark:text-slate-400'"
      @click="goHome"
    >
      <span class="text-xl">🏠</span>
      <span>چک‌لیست‌ها</span>
    </button>
  </nav>
</template>
