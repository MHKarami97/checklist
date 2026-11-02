<script setup>
import { ref } from 'vue'
import { useChecklistStore } from '../stores/checklistStore'
import { useCloudSyncStore } from '../stores/cloudSyncStore'
import TemplateCard from '../components/TemplateCard.vue'
import CloudBackupCard from '../components/cloud/CloudBackupCard.vue'

var store = useChecklistStore()
var cloudStore = useCloudSyncStore()
var isCreating = ref(false)
var newTitle = ref('')
var showCloudBackup = ref(false)

function createCustom() {
  if (!newTitle.value.trim()) return
  store.createCustomTemplate(newTitle.value.trim())
  newTitle.value = ''
  isCreating.value = false
}

function triggerImport(inputEl) {
  inputEl.click()
}

function handleImport(event) {
  var file = event.target.files?.[0]
  if (file) store.importData(file)
  event.target.value = ''
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold">چک‌لیست‌های من</h1>
        <p class="text-sm text-slate-400 mt-1">{{ store.templates.length }} چک‌لیست فعال</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          class="min-h-[44px] px-4 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
          @click="isCreating = true"
        >
          + چک‌لیست جدید
        </button>
        <button
          type="button"
          class="min-h-[44px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          @click="store.exportData"
        >
          خروجی
        </button>
        <input ref="importInput" type="file" accept="application/json" class="hidden" @change="handleImport" />
        <button
          type="button"
          class="min-h-[44px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          @click="triggerImport($refs.importInput)"
        >
          ورودی
        </button>
        <button
          type="button"
          class="min-h-[44px] px-3.5 rounded-xl border text-sm transition-colors flex items-center gap-1.5"
          :class="showCloudBackup ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-600 dark:text-brand-400 font-medium' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'"
          @click="showCloudBackup = !showCloudBackup"
          :aria-expanded="showCloudBackup"
          title="پشتیبان‌گیری ابری Google Drive"
        >
          <span>☁️</span>
          <span>Google Drive</span>
          <span
            v-if="cloudStore.isConnected"
            class="inline-block w-2 h-2 rounded-full bg-emerald-500"
            title="متصل"
          />
        </button>
      </div>
    </div>

    <div v-show="showCloudBackup" class="transition-all">
      <CloudBackupCard />
    </div>

    <div v-if="isCreating" class="flex items-center gap-2">
      <input
        v-model="newTitle"
        type="text"
        placeholder="عنوان چک‌لیست جدید..."
        class="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-sm"
        @keyup.enter="createCustom"
      />
      <button type="button" class="min-h-[44px] px-4 rounded-xl bg-brand-500 text-white text-sm" @click="createCustom">ساخت</button>
      <button type="button" class="min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-sm" @click="isCreating = false">لغو</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <TemplateCard v-for="tpl in store.templates" :key="tpl.id" :template="tpl" />
    </div>
  </section>
</template>
