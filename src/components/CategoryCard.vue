<script setup>
defineProps({
  category: { type: Object, required: true },
  isActive: { type: Boolean, default: false }
})
defineEmits(['select'])
</script>

<template>
  <button
    type="button"
    class="w-full text-right rounded-2xl border p-4 transition-all duration-200 min-h-[44px] flex flex-col gap-3"
    :class="isActive
      ? 'border-brand-500 bg-brand-50 dark:bg-brand-700/20 shadow-sm'
      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-400'"
    @click="$emit('select', category.id)"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xl">{{ category.icon }}</span>
        <span class="font-semibold text-sm sm:text-base">{{ category.name }}</span>
      </div>
      <span class="text-xs text-slate-500 dark:text-slate-400">{{ category.completedCount }}/{{ category.totalCount }}</span>
    </div>
    <ProgressBar :percent="category.progressPercent" size="sm" />
  </button>
</template>

<script>
import ProgressBar from './ProgressBar.vue'
export default { components: { ProgressBar } }
</script>
