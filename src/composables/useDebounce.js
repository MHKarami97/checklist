import { ref } from 'vue'

/**
 * Generic debounce composable used to throttle expensive operations
 * (e.g. localStorage writes) triggered by fast user input like typing.
 */
export function useDebouncedValue(initialValue, delayMs = 300) {
  var debouncedValue = ref(initialValue)
  var timeoutId = null

  function setValue(newValue) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue
    }, delayMs)
  }

  return { debouncedValue, setValue }
}
