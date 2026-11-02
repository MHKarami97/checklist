<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useChecklistStore } from './stores/checklistStore'
import { useCloudSyncStore } from './stores/cloudSyncStore'
import AppHeader from './components/AppHeader.vue'
import BottomNav from './components/BottomNav.vue'
import AppFooter from './components/AppFooter.vue'
import UpdatePrompt from './components/UpdatePrompt.vue'
import SyncFailedBar from './components/cloud/SyncFailedBar.vue'
import CloudConflictModal from './components/cloud/CloudConflictModal.vue'

var store = useChecklistStore()
var cloudStore = useCloudSyncStore()

onMounted(() => {
  store.initialize()
  cloudStore.start()
})
</script>

<template>
  <div class="min-h-screen flex flex-col pb-16 sm:pb-0">
    <AppHeader />
    <main class="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-4">
      <RouterView />
    </main>
    <AppFooter />
    <BottomNav class="sm:hidden" />
    <UpdatePrompt />
    <SyncFailedBar />
    <CloudConflictModal />
  </div>
</template>
