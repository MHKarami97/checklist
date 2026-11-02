import { CLOUD_CONFIG } from './cloudConfig'
import { DEFAULT_CLOUD_STATE } from '../../models/CloudSync'

export class CloudSyncStateStorage {
  load() {
    try {
      var raw = localStorage.getItem(CLOUD_CONFIG.stateStorageKey)
      return raw ? { ...DEFAULT_CLOUD_STATE, ...JSON.parse(raw) } : { ...DEFAULT_CLOUD_STATE }
    } catch {
      return { ...DEFAULT_CLOUD_STATE }
    }
  }

  save(state) {
    try {
      localStorage.setItem(CLOUD_CONFIG.stateStorageKey, JSON.stringify(state))
    } catch {
      // Storage unavailable
    }
  }
}
