<script setup>
import ProgressBar from './ProgressBar.vue'

defineProps({
  template: { type: Object, required: true }
})
</script>

<template>
  <RouterLink
    :to="`/checklist/${template.id}`"
    class="block rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
  >
    <div class="flex items-start justify-between gap-3 mb-3">
      <div class="flex items-center gap-3">
        <span class="text-2xl sm:text-3xl">{{ template.icon }}</span>
        <div>
          <h3 class="font-semibold text-sm sm:text-base leading-tight">{{ template.title }}</h3>
          <p class="text-xs text-slate-400 mt-0.5 line-clamp-1">{{ template.description }}</p>
        </div>
      </div>
      <span
        v-if="template.isCustom"
        class="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-700/30 dark:text-brand-100 flex-shrink-0"
      >شخصی</span>
    </div>

    <ProgressBar :percent="template.overallProgress" size="sm" />
    <p class="text-xs text-slate-400 mt-2">{{ template.completedItems }} از {{ template.totalItems }} مورد انجام‌شده</p>
  </RouterLink>
</template>
