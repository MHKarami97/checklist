<script setup>
import { useChecklistStore } from '../stores/checklistStore'

var store = useChecklistStore()
</script>

<template>
  <header
    class="sticky top-0 z-20 backdrop-blur bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800"
  >
    <div class="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-2 font-bold text-lg">
        <span>🗒️</span>
        <span>چک‌لیست هوشمند</span>
      </RouterLink>

      <button
        type="button"
        class="w-11 h-11 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        :aria-label="store.isDarkMode ? 'حالت روشن' : 'حالت تاریک'"
        @click="store.toggleTheme"
      >
        <span class="text-xl">{{ store.isDarkMode ? '☀️' : '🌙' }}</span>
      </button>
    </div>
  </header>
</template>
