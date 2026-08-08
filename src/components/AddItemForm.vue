<script setup>
import { ref } from 'vue'

var emit = defineEmits(['add'])
var title = ref('')

function submit() {
  if (!title.value.trim()) return
  emit('add', title.value.trim())
  title.value = ''
}
</script>

<template>
  <form class="flex items-center gap-2" @submit.prevent="submit">
    <input
      v-model="title"
      type="text"
      placeholder="افزودن آیتم جدید..."
      class="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
    />
    <button
      type="submit"
      class="min-w-[44px] min-h-[44px] rounded-xl bg-brand-500 text-white font-medium px-4 hover:bg-brand-600 transition-colors"
    >
      افزودن
    </button>
  </form>
</template>
