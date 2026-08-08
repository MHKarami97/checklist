<script setup>
import { ref, computed } from 'vue'
import ChecklistItem from './ChecklistItem.vue'

/**
 * Minimal windowed rendering (poor-man's virtual scroll) to keep DOM node
 * count bounded when a category grows well beyond typical checklist sizes.
 * Falls back to rendering everything when the list is small.
 */
var props = defineProps({
  items: { type: Array, required: true },
  threshold: { type: Number, default: 40 },
  rowHeight: { type: Number, default: 64 },
  viewportHeight: { type: Number, default: 480 }
})
var emit = defineEmits(['toggle', 'remove'])

var scrollTop = ref(0)
var isVirtualized = computed(() => props.items.length > props.threshold)

var visibleRange = computed(() => {
  if (!isVirtualized.value) return { start: 0, end: props.items.length }
  var visibleCount = Math.ceil(props.viewportHeight / props.rowHeight) + 4
  var start = Math.max(0, Math.floor(scrollTop.value / props.rowHeight) - 2)
  var end = Math.min(props.items.length, start + visibleCount)
  return { start, end }
})

var visibleItems = computed(() => props.items.slice(visibleRange.value.start, visibleRange.value.end))
var topSpacerHeight = computed(() => visibleRange.value.start * props.rowHeight)
var bottomSpacerHeight = computed(() => (props.items.length - visibleRange.value.end) * props.rowHeight)

function onScroll(event) {
  scrollTop.value = event.target.scrollTop
}
</script>

<template>
  <div
    class="space-y-2 overflow-y-auto no-scrollbar"
    :style="isVirtualized ? { maxHeight: viewportHeight + 'px' } : {}"
    @scroll="isVirtualized && onScroll($event)"
  >
    <div v-if="isVirtualized" :style="{ height: topSpacerHeight + 'px' }" />
    <ChecklistItem
      v-for="item in visibleItems"
      :key="item.id"
      :item="item"
      @toggle="emit('toggle', $event)"
      @remove="emit('remove', $event)"
    />
    <div v-if="isVirtualized" :style="{ height: bottomSpacerHeight + 'px' }" />
    <p v-if="!items.length" class="text-center text-sm text-slate-400 py-8">آیتمی برای نمایش وجود ندارد</p>
  </div>
</template>
