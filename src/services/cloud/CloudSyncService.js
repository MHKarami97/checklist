import { CLOUD_CONFIG } from './cloudConfig'
import { CLOUD_SYNC_STATUS } from '../../models/CloudSync'
import { checklistRepository } from '../ChecklistRepository'
import { mergeTemplates } from './mergeChecklists'
import { deriveKey, newSaltHex } from './cloudCrypto'
import { CloudSyncError, toUserMessage } from './CloudSyncError'

export class CloudSyncService {
  constructor({ auth, drive, codec, vault, storage }) {
    this._auth = auth
    this._drive = drive
    this._codec = codec
    this._vault = vault
    this._storage = storage
    this._state = this._storage.load()
    this._status = this._state.connected ? CLOUD_SYNC_STATUS.IDLE : CLOUD_SYNC_STATUS.DISCONNECTED
    this._decision = null
    this._hasRollback = false
    this._listeners = new Set()
    this._dismissedRemoteIds = new Set()
    this._debounceTimer = null
    this._running = false
    this._rerunRequested = false
    this._suppressDirty = false
    this._started = false
    this._lastSilentAttemptAt = 0
    this._onDataRestored = async () => {}
  }

  isSuppressingDirty() {
    return this._suppressDirty
  }

  setDataRestoredHandler(handler) {
    this._onDataRestored = handler
  }

  subscribe(listener) {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  getSnapshot() {
    return {
      ...this._state,
      status: this._status,
      hasRollbackSnapshot: this._hasRollback,
      decision: this._decision
    }
  }

  async start() {
    if (this._started) return
    this._started = true
    this._installDirtyHooks()
    this._installConnectivityListeners()
    this._hasRollback = (await this._vault.getSnapshot()) !== null
    this._emit()
    if (this._isOnline()) this.preload()

    if (!this._state.connected || !this._isOnline()) return
    if (!(await this._ensureAuthorized('silent'))) {
      this._setStatus(CLOUD_SYNC_STATUS.NEEDS_RECONNECT)
      return
    }
    await this._guarded(() => this._reconcile())
  }

  preload() {
    this._auth.preload()
  }

  async connect() {
    var granted = this._auth.isAuthorized || (await this._auth.requestAccess('interactive'))
    if (!granted) {
      throw new CloudSyncError('AUTH', 'اتصال به Google انجام نشد یا دسترسی داده نشد.')
    }
    this._patch({ connected: true, lastError: null })
    await this._guarded(() => this._reconcile())
  }

  async disconnect(deleteRemote) {
    window.clearTimeout(this._debounceTimer)
    if (deleteRemote) {
      try {
        if (await this._ensureAuthorized('interactive')) {
          var files = await this._drive.list()
          for (var file of files) await this._drive.remove(file.id)
        }
      } catch {
        // Ignored
      }
    }
    try {
      await this._auth.revoke()
    } catch {
      this._auth.clear()
    }
    this._decision = null
    this._patch({
      connected: false,
      lastSyncedHash: null,
      lastRemoteModifiedTime: null,
      lastError: null,
      dirtyAt: null,
      forceUpload: false
    })
    this._setStatus(CLOUD_SYNC_STATUS.DISCONNECTED)
  }

  async backupNow(trigger = 'manual') {
    if (!this._state.connected || this._decision) return
    if (!this._isOnline()) return
    var mode = trigger === 'manual' ? 'interactive' : 'silent'
    if (!(await this._ensureAuthorized(mode))) {
      this._setStatus(CLOUD_SYNC_STATUS.NEEDS_RECONNECT)
      return
    }
    await this._guarded(() => this._uploadIfChanged())
  }

  async resolveRestore(mode, passphrase) {
    var pending = this._decision
    if (!pending) return
    if (!(await this._ensureAuthorized('interactive'))) {
      throw new CloudSyncError('AUTH', 'برای ادامه باید دسترسی Google را تأیید کنید.')
    }

    var targetDecision = pending
    await this._guarded(async () => {
      var content = await this._drive.read(targetDecision.remote.id)
      var payload = await this._codec.open(content, passphrase)

      var currentSnapshot = await this._codec.snapshotLocal()
      await this._vault.saveSnapshot(JSON.stringify(currentSnapshot.payload))
      this._hasRollback = true

      await this._withoutDirtyTracking(async () => {
        if (mode === 'replace') {
          checklistRepository.saveAll(payload.templates || [])
          if (Array.isArray(payload.deletedDefaultIds)) {
            checklistRepository.saveDeletedDefaultIds(payload.deletedDefaultIds)
          }
        } else {
          var local = checklistRepository.getAll()
          var merged = mergeTemplates(local, payload.templates || [])
          checklistRepository.saveAll(merged)
          if (Array.isArray(payload.deletedDefaultIds)) {
            var set = new Set([...checklistRepository.getDeletedDefaultIds(), ...payload.deletedDefaultIds])
            checklistRepository.saveDeletedDefaultIds(Array.from(set))
          }
        }
      })

      await this._onDataRestored()
      this._decision = null
      if (await this._vault.getKey()) this._patch({ encryptionEnabled: true })

      var remoteHash = targetDecision.remote.appProperties?.contentHash ?? null
      if (mode === 'merge') {
        var mergedLocal = await this._codec.snapshotLocal()
        await this._upload(mergedLocal, this._state.encryptionEnabled, await this._drive.list())
      } else {
        var localSnapshot = await this._codec.snapshotLocal()
        this._markSuccess(remoteHash ?? localSnapshot.fingerprint.contentHash, targetDecision.remote.modifiedTime)
      }
    }, true)
  }

  async resolveKeepLocal() {
    if (!this._decision) return
    if (!(await this._ensureAuthorized('interactive'))) {
      throw new CloudSyncError('AUTH', 'برای ادامه باید دسترسی Google را تأیید کنید.')
    }
    await this._guarded(async () => {
      var local = await this._codec.snapshotLocal()
      var remotes = await this._drive.list()
      this._decision = null
      await this._upload(local, this._state.encryptionEnabled, remotes)
    })
  }

  dismissDecision() {
    if (!this._decision) return
    this._dismissedRemoteIds.add(this._decision.remote.id)
    this._decision = { ...this._decision, dismissed: true }
    this._emit()
  }

  reopenDecision() {
    if (!this._decision) return
    this._decision = { ...this._decision, dismissed: false }
    this._emit()
  }

  async rollbackLastRestore() {
    var json = await this._vault.getSnapshot()
    if (!json) throw new CloudSyncError('INVALID_BACKUP', 'نسخه‌ی قبل از بازیابی موجود نیست.')
    var payload = JSON.parse(json)
    await this._withoutDirtyTracking(async () => {
      checklistRepository.saveAll(payload.templates || [])
      if (Array.isArray(payload.deletedDefaultIds)) {
        checklistRepository.saveDeletedDefaultIds(payload.deletedDefaultIds)
      }
    })
    await this._vault.clearSnapshot()
    this._hasRollback = false
    await this._onDataRestored()
    this._emit()
    this.markDirty()
  }

  async enableEncryption(passphrase) {
    if (passphrase.length < CLOUD_CONFIG.minPassphraseLength) {
      throw new CloudSyncError(
        'PASSPHRASE_INVALID',
        `رمز عبور باید حداقل ${CLOUD_CONFIG.minPassphraseLength} نویسه باشد.`
      )
    }

    var previous = await this._vault.getKey()
    var verified = false
    if (this._state.connected && this._isOnline() && this._auth.isAuthorized) {
      var latest = (await this._drive.list())[0]
      if (latest?.appProperties?.encrypted === '1') {
        await this._vault.clearKey()
        try {
          await this._codec.open(await this._drive.read(latest.id), passphrase)
          verified = true
        } catch (error) {
          if (previous) await this._vault.saveKey(previous.key, previous.saltHex, previous.iterations)
          throw error
        }
      }
    }

    if (!verified) {
      var saltHex = newSaltHex()
      var key = await deriveKey(passphrase, saltHex, CLOUD_CONFIG.pbkdf2Iterations)
      await this._vault.saveKey(key, saltHex, CLOUD_CONFIG.pbkdf2Iterations)
    }

    this._patch({ encryptionEnabled: true, forceUpload: this._state.connected })
    if (this._state.connected) this._scheduleBackup(500)
  }

  async disableEncryption() {
    await this._vault.clearKey()
    this._patch({ encryptionEnabled: false, forceUpload: this._state.connected })
    if (this._state.connected) this._scheduleBackup(500)
  }

  setNotifyFailures(value) {
    this._patch({ notifyFailures: value })
  }

  markDirty() {
    this._patch({ dirtyAt: new Date().toISOString() })
    if (this._state.connected && !this._decision) {
      this._scheduleBackup(CLOUD_CONFIG.autoBackupDebounceMs)
    }
  }

  _scheduleBackup(delayMs) {
    window.clearTimeout(this._debounceTimer)
    this._debounceTimer = window.setTimeout(() => void this.backupNow('auto'), delayMs)
  }

  async _reconcile() {
    var local = await this._codec.snapshotLocal()
    var remotes = await this._drive.list()
    var latest = remotes[0]

    if (!latest) {
      if (local.fingerprint.itemsCount > 0) {
        await this._upload(local, this._state.encryptionEnabled, [])
      } else {
        this._markSuccess(local.fingerprint.contentHash, null)
      }
      return
    }

    var remoteHash = latest.appProperties?.contentHash ?? null
    var localHash = local.fingerprint.contentHash

    if (remoteHash === localHash && !this._state.forceUpload) {
      this._markSuccess(localHash, latest.modifiedTime)
      return
    }
    if (local.fingerprint.itemsCount === 0) {
      this._raiseDecision('remote-only', latest, local)
      return
    }

    var lastHash = this._state.lastSyncedHash
    var remoteUnchanged = !!lastHash && remoteHash === lastHash
    var localUnchanged = !!lastHash && localHash === lastHash

    if (remoteUnchanged) {
      await this._upload(local, this._state.encryptionEnabled, remotes)
      return
    }
    this._raiseDecision(localUnchanged ? 'remote-newer' : 'conflict', latest, local)
  }

  async _uploadIfChanged() {
    var local = await this._codec.snapshotLocal()
    var localHash = local.fingerprint.contentHash
    if (!this._state.forceUpload && localHash === this._state.lastSyncedHash) {
      this._markSuccess(localHash, this._state.lastRemoteModifiedTime)
      return
    }

    var remotes = await this._drive.list()
    var latest = remotes[0]
    if (latest) {
      var remoteHash = latest.appProperties?.contentHash ?? null
      if (remoteHash === localHash && !this._state.forceUpload) {
        this._markSuccess(localHash, latest.modifiedTime)
        return
      }
      if (remoteHash !== this._state.lastSyncedHash) {
        this._raiseDecision('conflict', latest, local)
        return
      }
    }
    await this._upload(local, this._state.encryptionEnabled, remotes)
  }

  async _upload(local, encrypt, existing) {
    var content = await this._codec.serialize(local, encrypt)
    var stamp = new Date().toISOString().replace(/[:.]/g, '-')
    var created = await this._drive.create(
      `${CLOUD_CONFIG.backupFilePrefix}${stamp}.json`,
      content,
      {
        contentHash: local.fingerprint.contentHash,
        itemsCount: String(local.fingerprint.itemsCount),
        encrypted: encrypt ? '1' : '0',
        schema: '1',
        deviceId: this._getDeviceId()
      }
    )
    await this._prune([created, ...existing])
    this._markSuccess(local.fingerprint.contentHash, created.modifiedTime)
  }

  async _prune(files) {
    var sorted = [...files].sort((a, b) => (a.modifiedTime < b.modifiedTime ? 1 : -1))
    for (var stale of sorted.slice(CLOUD_CONFIG.keepVersions)) {
      try {
        await this._drive.remove(stale.id)
      } catch {
        // Ignored
      }
    }
  }

  _raiseDecision(kind, remote, local) {
    this._decision = {
      kind,
      remote,
      remoteItemsCount: Number(remote.appProperties?.itemsCount ?? 0),
      localItemsCount: local.fingerprint.itemsCount,
      remoteEncrypted: remote.appProperties?.encrypted === '1',
      dismissed: this._dismissedRemoteIds.has(remote.id)
    };
    this._setStatus(CLOUD_SYNC_STATUS.DECISION_PENDING)
  }

  async _guarded(task, rethrowPassphraseErrors = false) {
    if (this._running) {
      this._rerunRequested = true
      return
    }
    this._running = true
    this._setStatus(CLOUD_SYNC_STATUS.SYNCING)
    try {
      await task()
      if (this._status === CLOUD_SYNC_STATUS.SYNCING) {
        this._setStatus(this._decision ? CLOUD_SYNC_STATUS.DECISION_PENDING : CLOUD_SYNC_STATUS.IDLE)
      }
    } catch (error) {
      var isPassphrase =
        error instanceof CloudSyncError &&
        (error.code === 'PASSPHRASE_REQUIRED' || error.code === 'PASSPHRASE_INVALID')
      if (isPassphrase && rethrowPassphraseErrors) {
        this._setStatus(this._decision ? CLOUD_SYNC_STATUS.DECISION_PENDING : CLOUD_SYNC_STATUS.IDLE)
        throw error
      }
      this._fail(error)
    } finally {
      this._running = false
      if (this._rerunRequested) {
        this._rerunRequested = false
        this._scheduleBackup(1000)
      }
    }
  }

  _fail(error) {
    var needsReconnect = error instanceof CloudSyncError && error.code === 'AUTH'
    this._patch({ lastError: toUserMessage(error) })
    this._setStatus(needsReconnect ? CLOUD_SYNC_STATUS.NEEDS_RECONNECT : CLOUD_SYNC_STATUS.ERROR)
  }

  _markSuccess(hash, remoteModifiedTime) {
    this._patch({
      lastSyncedHash: hash,
      lastRemoteModifiedTime: remoteModifiedTime,
      lastSuccessAt: new Date().toISOString(),
      lastError: null,
      dirtyAt: null,
      forceUpload: false
    })
    this._setStatus(CLOUD_SYNC_STATUS.SUCCESS)
  }

  async _ensureAuthorized(mode) {
    if (this._auth.isAuthorized) return true
    if (mode === 'interactive') return this._auth.requestAccess('interactive')

    var now = Date.now()
    if (now - this._lastSilentAttemptAt < CLOUD_CONFIG.silentRetryCooldownMs) return false
    this._lastSilentAttemptAt = now
    return this._auth.requestAccess('silent')
  }

  async _withoutDirtyTracking(action) {
    this._suppressDirty = true
    try {
      return await action()
    } finally {
      this._suppressDirty = false
    }
  }

  _installDirtyHooks() {
    var onChange = () => {
      if (this._suppressDirty) return
      window.setTimeout(() => this.markDirty(), 0)
    }

    checklistRepository.onChange(onChange)
  }

  _installConnectivityListeners() {
    window.addEventListener('online', () => void this._syncSoon())
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this._state.dirtyAt) void this._syncSoon()
    })
  }

  async _syncSoon() {
    if (!this._state.connected || this._decision || !this._isOnline()) return
    if (this._state.dirtyAt || this._status === CLOUD_SYNC_STATUS.ERROR) this._scheduleBackup(1000)
  }

  _isOnline() {
    return typeof navigator === 'undefined' ? true : navigator.onLine
  }

  _getDeviceId() {
    try {
      var existing = localStorage.getItem(CLOUD_CONFIG.deviceIdStorageKey)
      if (existing) return existing
      var created = crypto.randomUUID().slice(0, 8)
      localStorage.setItem(CLOUD_CONFIG.deviceIdStorageKey, created)
      return created
    } catch {
      return 'unknown'
    }
  }

  _setStatus(status) {
    this._status = status
    this._emit()
  }

  _patch(partial) {
    this._state = { ...this._state, ...partial }
    this._storage.save(this._state)
    this._emit()
  }

  _emit() {
    var snapshot = this.getSnapshot()
    this._listeners.forEach((listener) => listener(snapshot))
  }
}
