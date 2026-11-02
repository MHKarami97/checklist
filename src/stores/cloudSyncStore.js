import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cloudSyncService } from '../services/cloud'
import { formatDateTimeFa } from '../services/cloud/cloudFormat'
import { CLOUD_SYNC_STATUS } from '../models/CloudSync'

export var useCloudSyncStore = defineStore('cloudSync', () => {
  var isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      isOnline.value = true
    })
    window.addEventListener('offline', () => {
      isOnline.value = false
    })
  }

  var snapshot = ref(cloudSyncService.getSnapshot())
  cloudSyncService.subscribe((next) => {
    snapshot.value = next
  })

  var isConnected = computed(() => snapshot.value.connected)
  var isBusy = computed(() => snapshot.value.status === CLOUD_SYNC_STATUS.SYNCING)
  var lastSuccessText = computed(() => formatDateTimeFa(snapshot.value.lastSuccessAt))

  var statusText = computed(() => {
    switch (snapshot.value.status) {
      case CLOUD_SYNC_STATUS.DISCONNECTED:
        return 'متصل نیست'
      case CLOUD_SYNC_STATUS.SYNCING:
        return 'در حال همگام‌سازی...'
      case CLOUD_SYNC_STATUS.NEEDS_RECONNECT:
        return 'اتصال به Google نیاز به تأیید دوباره دارد'
      case CLOUD_SYNC_STATUS.ERROR:
        return snapshot.value.lastError || 'همگام‌سازی ناموفق بود'
      case CLOUD_SYNC_STATUS.DECISION_PENDING:
        return 'نسخه‌ی ابری منتظر تصمیم شماست'
      case CLOUD_SYNC_STATUS.SUCCESS:
        return 'همگام و به‌روز است'
      default:
        return snapshot.value.lastSuccessAt
          ? 'همگام و به‌روز است'
          : 'متصل است؛ هنوز پشتیبانی گرفته نشده'
    }
  })

  var showFailureBar = computed(() => {
    var status = snapshot.value.status
    return (
      snapshot.value.connected &&
      snapshot.value.notifyFailures &&
      (status === CLOUD_SYNC_STATUS.ERROR || status === CLOUD_SYNC_STATUS.NEEDS_RECONNECT) &&
      isOnline.value
    )
  })

  var failureBarMessage = computed(() =>
    snapshot.value.status === CLOUD_SYNC_STATUS.NEEDS_RECONNECT
      ? 'دیتا همگام‌سازی نشد؛ اتصال به Google Drive نیاز به تأیید دوباره دارد.'
      : `دیتا همگام‌سازی نشد. ${snapshot.value.lastError || ''}`.trim()
  )

  return {
    snapshot,
    isConnected,
    isBusy,
    isOnline,
    statusText,
    lastSuccessText,
    showFailureBar,
    failureBarMessage,
    start: () => cloudSyncService.start(),
    preload: () => cloudSyncService.preload(),
    connect: () => cloudSyncService.connect(),
    disconnect: (deleteRemote) => cloudSyncService.disconnect(deleteRemote),
    backupNow: () => cloudSyncService.backupNow('manual'),
    resolveRestore: (mode, passphrase) => cloudSyncService.resolveRestore(mode, passphrase),
    resolveKeepLocal: () => cloudSyncService.resolveKeepLocal(),
    dismissDecision: () => cloudSyncService.dismissDecision(),
    reopenDecision: () => cloudSyncService.reopenDecision(),
    rollbackLastRestore: () => cloudSyncService.rollbackLastRestore(),
    enableEncryption: (passphrase) => cloudSyncService.enableEncryption(passphrase),
    disableEncryption: () => cloudSyncService.disableEncryption(),
    setNotifyFailures: (value) => cloudSyncService.setNotifyFailures(value)
  }
})
