<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useChecklistStore } from './stores/checklistStore'
import AppHeader from './components/AppHeader.vue'
import BottomNav from './components/BottomNav.vue'
import AppFooter from './components/AppFooter.vue'

var store = useChecklistStore()

onMounted(() => {
  store.initialize()
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
  </div>
</template>
