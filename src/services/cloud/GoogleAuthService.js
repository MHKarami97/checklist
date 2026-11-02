import { CloudSyncError } from './CloudSyncError'

var EXPIRY_SAFETY_MS = 60 * 1000
var SILENT_TIMEOUT_MS = 15 * 1000

export class GoogleAuthService {
  constructor(clientId, scope, loader) {
    this._clientId = clientId
    this._scope = scope
    this._loader = loader
    this._tokenClient = null
    this._accessToken = null
    this._expiresAt = 0
    this._pending = null
  }

  get isAuthorized() {
    return this._accessToken !== null && Date.now() < this._expiresAt
  }

  getToken() {
    if (!this.isAuthorized) {
      throw new CloudSyncError('AUTH', 'نشست Google منقضی شده است؛ دوباره متصل شوید.')
    }
    return this._accessToken
  }

  preload() {
    this._loader.load().catch(() => {})
  }

  clear() {
    this._accessToken = null
    this._expiresAt = 0
  }

  async requestAccess(mode) {
    if (this._pending) return this._pending
    this._pending = this._runRequest(mode).finally(() => {
      this._pending = null
    })
    return this._pending
  }

  async revoke() {
    var token = this._accessToken
    this.clear()
    if (!token) return
    await this._loader.load()
    await new Promise((resolve) => {
      window.google.accounts.oauth2.revoke(token, () => resolve())
    })
  }

  async _runRequest(mode) {
    await this._loader.load()
    var oauth2 = window.google.accounts.oauth2

    return new Promise((resolveRaw) => {
      var settled = false
      var timer
      var resolve = (value) => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        resolveRaw(value)
      }

      if (mode === 'silent') {
        timer = window.setTimeout(() => resolve(false), SILENT_TIMEOUT_MS)
      }

      this._tokenClient = oauth2.initTokenClient({
        client_id: this._clientId,
        scope: this._scope,
        callback: (response) => {
          if (response.error || !response.access_token) return resolve(false)
          if (!oauth2.hasGrantedAllScopes(response, this._scope)) return resolve(false)
          this._accessToken = response.access_token
          this._expiresAt = Date.now() + Number(response.expires_in || 0) * 1000 - EXPIRY_SAFETY_MS
          resolve(true)
        },
        error_callback: () => resolve(false)
      })
      this._tokenClient.requestAccessToken(mode === 'silent' ? { prompt: 'none' } : {})
    })
  }
}
