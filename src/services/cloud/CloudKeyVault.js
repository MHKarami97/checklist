import { CLOUD_CONFIG } from './cloudConfig'

export class CloudKeyVault {
  constructor() {
    this._dbName = CLOUD_CONFIG.vaultDatabaseName
    this._dbVersion = 1
    this._dbPromise = null
  }

  _open() {
    if (this._dbPromise) return this._dbPromise
    this._dbPromise = new Promise((resolve, reject) => {
      var request = indexedDB.open(this._dbName, this._dbVersion)
      request.onupgradeneeded = (event) => {
        var db = event.target.result
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('snapshots')) {
          db.createObjectStore('snapshots', { keyPath: 'id' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    return this._dbPromise
  }

  async getKey() {
    var db = await this._open()
    return new Promise((resolve, reject) => {
      var tx = db.transaction('keys', 'readonly')
      var req = tx.objectStore('keys').get('backup-key')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }

  async saveKey(key, saltHex, iterations) {
    var db = await this._open()
    return new Promise((resolve, reject) => {
      var tx = db.transaction('keys', 'readwrite')
      var req = tx.objectStore('keys').put({
        id: 'backup-key',
        key,
        saltHex,
        iterations,
        createdAt: new Date().toISOString()
      })
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  async clearKey() {
    var db = await this._open()
    return new Promise((resolve, reject) => {
      var tx = db.transaction('keys', 'readwrite')
      var req = tx.objectStore('keys').delete('backup-key')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  async saveSnapshot(json) {
    var db = await this._open()
    return new Promise((resolve, reject) => {
      var tx = db.transaction('snapshots', 'readwrite')
      var req = tx.objectStore('snapshots').put({
        id: 'pre-restore',
        json,
        createdAt: new Date().toISOString()
      })
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  async getSnapshot() {
    var db = await this._open()
    return new Promise((resolve, reject) => {
      var tx = db.transaction('snapshots', 'readonly')
      var req = tx.objectStore('snapshots').get('pre-restore')
      req.onsuccess = () => resolve(req.result ? req.result.json : null)
      req.onerror = () => reject(req.error)
    })
  }

  async clearSnapshot() {
    var db = await this._open()
    return new Promise((resolve, reject) => {
      var tx = db.transaction('snapshots', 'readwrite')
      var req = tx.objectStore('snapshots').delete('pre-restore')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }
}
