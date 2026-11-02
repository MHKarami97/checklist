import { checklistRepository } from '../ChecklistRepository'
import { hashSha256, stableStringify, deriveKey, encryptWithKey, decryptWithKey } from './cloudCrypto'
import { CLOUD_CONFIG } from './cloudConfig'
import { CloudSyncError } from './CloudSyncError'

export class CloudBackupCodec {
  constructor(vault) {
    this._vault = vault
  }

  async snapshotLocal() {
    var rawTemplates = checklistRepository.getAll().map((t) => t.toJSON())
    var deletedDefaultIds = checklistRepository.getDeletedDefaultIds()
    var payload = {
      format: 'checklist-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: rawTemplates,
      deletedDefaultIds
    }
    return { payload, fingerprint: await this.fingerprintOf(payload) }
  }

  async fingerprintOf(payload) {
    var contentHash = await hashSha256(
      stableStringify({
        templates: payload.templates || [],
        deletedDefaultIds: payload.deletedDefaultIds || []
      })
    )
    var itemsCount = 0
    ;(payload.templates || []).forEach((tpl) => {
      ;(tpl.categories || []).forEach((cat) => {
        itemsCount += (cat.items || []).length
      })
    })
    return { contentHash, itemsCount }
  }

  async serialize(snapshot, encrypt) {
    var json = JSON.stringify(snapshot.payload)
    if (!encrypt) return json

    var record = await this._vault.getKey()
    if (!record) {
      throw new CloudSyncError(
        'KEY_MISSING',
        'کلید رمزنگاری روی این دستگاه موجود نیست؛ رمزنگاری را دوباره فعال کنید.'
      )
    }

    var encrypted = await encryptWithKey(json, record.key)
    var container = {
      format: 'checklist-encrypted-backup',
      version: '1.0',
      algorithm: 'AES-GCM',
      kdf: 'PBKDF2',
      iterations: record.iterations,
      salt: record.saltHex,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
      checksum: await hashSha256(json),
      meta: {
        createdAt: new Date().toISOString(),
        itemsCount: snapshot.fingerprint.itemsCount,
        contentHash: snapshot.fingerprint.contentHash,
        source: 'cloud'
      }
    }
    return JSON.stringify(container)
  }

  async open(content, passphrase) {
    var parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new CloudSyncError('INVALID_BACKUP', 'فایل پشتیبان ابری آسیب دیده است.')
    }

    if (parsed.format !== 'checklist-encrypted-backup') {
      if (Array.isArray(parsed.templates)) {
        return parsed
      }
      throw new CloudSyncError('INVALID_BACKUP', 'فرمت فایل پشتیبان ابری معتبر نیست.')
    }

    var json = await this._decrypt(parsed, passphrase)
    if ((await hashSha256(json)) !== parsed.checksum) {
      throw new CloudSyncError('INVALID_BACKUP', 'یکپارچگی فایل پشتیبان ابری تأیید نشد.')
    }
    return JSON.parse(json)
  }

  async _decrypt(container, passphrase) {
    if (!passphrase) {
      var record = await this._vault.getKey()
      var matches =
        !!record && record.saltHex === container.salt && record.iterations === container.iterations
      if (!record || !matches) {
        throw new CloudSyncError('PASSPHRASE_REQUIRED', 'برای باز کردن این پشتیبان، رمز عبور آن را وارد کنید.')
      }
      try {
        return await decryptWithKey(container.ciphertext, container.iv, record.key)
      } catch {
        throw new CloudSyncError('PASSPHRASE_REQUIRED', 'برای باز کردن این پشتیبان، رمز عبور آن را وارد کنید.')
      }
    }

    if (passphrase.length < CLOUD_CONFIG.minPassphraseLength) {
      throw new CloudSyncError('PASSPHRASE_INVALID', 'رمز عبور وارد شده کوتاه‌تر از حد مجاز است.')
    }

    var key = await deriveKey(passphrase, container.salt, container.iterations)
    try {
      var json = await decryptWithKey(container.ciphertext, container.iv, key)
      await this._vault.saveKey(key, container.salt, container.iterations)
      return json
    } catch {
      throw new CloudSyncError('PASSPHRASE_INVALID', 'رمز عبور اشتباه است یا فایل پشتیبان دستکاری شده است.')
    }
  }
}
