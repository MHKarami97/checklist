<script setup>
import { useChecklistStore } from '../stores/checklistStore'

var store = useChecklistStore()

var filterOptions = [
  { key: 'all', label: 'همه' },
  { key: 'pending', label: 'باقی‌مانده' },
  { key: 'completed', label: 'انجام‌شده' }
]

var sortOptions = [
  { key: 'default', label: 'پیش‌فرض' },
  { key: 'alphabetical', label: 'الفبایی' },
  { key: 'newest', label: 'جدیدترین' }
]
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
    <input
      :value="store.searchQuery"
      type="search"
      placeholder="جستجو در آیتم‌ها..."
      class="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-brand-400"
      @input="store.setSearchQuery($event.target.value)"
    />

    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
      <button
        v-for="option in filterOptions"
        :key="option.key"
        type="button"
        class="min-h-[36px] px-3 rounded-full text-xs sm:text-sm whitespace-nowrap transition-colors"
        :class="store.filterKey === option.key
          ? 'bg-brand-500 text-white'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'"
        @click="store.setFilter(option.key)"
      >
        {{ option.label }}
      </button>

      <select
        :value="store.sortKey"
        class="min-h-[36px] rounded-full bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm px-3"
        @change="store.setSort($event.target.value)"
      >
        <option v-for="opt in sortOptions" :key="opt.key" :value="opt.key">{{ opt.label }}</option>
      </select>
    </div>
  </div>
</template>
