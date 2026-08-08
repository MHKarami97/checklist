<script setup>
defineProps({
  item: { type: Object, required: true }
})
var emit = defineEmits(['toggle', 'remove'])
</script>

<template>
  <div
    class="group flex items-center gap-3 rounded-xl px-3 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 animate-fade-in"
  >
    <button
      type="button"
      class="relative w-6 h-6 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-colors"
      :class="item.isChecked
        ? 'bg-brand-500 border-brand-500'
        : 'border-slate-300 dark:border-slate-600'"
      :aria-pressed="item.isChecked"
      @click="emit('toggle', item.id)"
    >
      <svg
        v-if="item.isChecked"
        class="w-4 h-4 text-white animate-check-pop"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.2 3.2 6.7-6.7a1 1 0 011.4 0z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <div class="flex-1 min-w-0">
      <p
        class="text-sm sm:text-base transition-colors"
        :class="item.isChecked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'"
      >
        {{ item.title }}
      </p>
      <p v-if="item.note" class="text-xs text-slate-400 mt-0.5">{{ item.note }}</p>
    </div>

    <button
      type="button"
      class="opacity-0 group-hover:opacity-100 focus:opacity-100 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-red-500 transition-opacity"
      aria-label="حذف آیتم"
      @click="emit('remove', item.id)"
    >
      🗑️
    </button>
  </div>
</template>
