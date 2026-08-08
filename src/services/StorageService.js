/**
 * Abstraction over the persistence mechanism.
 * Repository Pattern: UI/store code never talks to localStorage directly.
 * Swappable with an IndexedDB implementation without touching consumers.
 */
export class StorageService {
  constructor(namespace = 'smart-checklist') {
    this.namespace = namespace
  }

  _key(key) {
    return `${this.namespace}:${key}`
  }

  get(key, fallback = null) {
    try {
      var raw = localStorage.getItem(this._key(key))
      return raw ? JSON.parse(raw) : fallback
    } catch (error) {
      console.error('StorageService.get failed', error)
      return fallback
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(this._key(key), JSON.stringify(value))
      return true
    } catch (error) {
      console.error('StorageService.set failed', error)
      return false
    }
  }

  remove(key) {
    localStorage.removeItem(this._key(key))
  }

  clearAll() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`${this.namespace}:`))
      .forEach((k) => localStorage.removeItem(k))
  }
}

export const storageService = new StorageService()
