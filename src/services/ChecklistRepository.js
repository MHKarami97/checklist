import { ChecklistTemplate } from '../models/ChecklistTemplate'
import { storageService } from './StorageService'

const STORAGE_KEY = 'checklists'
const DELETED_DEFAULTS_KEY = 'deleted-default-ids'

/**
 * Repository Pattern implementation for ChecklistTemplate aggregates.
 * Provides a persistence-agnostic API to the rest of the app.
 */
export class ChecklistRepository {
  constructor(storage = storageService) {
    this.storage = storage
  }

  getAll() {
    var raw = this.storage.get(STORAGE_KEY, [])
    return raw.map((json) => ChecklistTemplate.fromJSON(json))
  }

  saveAll(templates) {
    var payload = templates.map((tpl) => tpl.toJSON())
    var result = this.storage.set(STORAGE_KEY, payload)
    this._notify()
    return result
  }

  getById(id) {
    return this.getAll().find((tpl) => tpl.id === id) || null
  }

  upsert(template) {
    var all = this.getAll()
    var index = all.findIndex((tpl) => tpl.id === template.id)
    if (index >= 0) {
      all[index] = template
    } else {
      all.push(template)
    }
    this.saveAll(all)
    return template
  }

  remove(templateId) {
    var all = this.getAll().filter((tpl) => tpl.id !== templateId)
    this.saveAll(all)
  }

  exists() {
    return this.storage.get(STORAGE_KEY, null) !== null
  }

  /**
   * Ids of default-sourced templates the user explicitly deleted, so
   * DefaultsReconciler.reconcileAll() does not silently resurrect them
   * on the next app start.
   */
  getDeletedDefaultIds() {
    return this.storage.get(DELETED_DEFAULTS_KEY, [])
  }

  saveDeletedDefaultIds(ids) {
    var result = this.storage.set(DELETED_DEFAULTS_KEY, ids)
    this._notify()
    return result
  }

  onChange(listener) {
    if (!this._listeners) this._listeners = []
    this._listeners.push(listener)
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener)
    }
  }

  _notify() {
    if (!this._listeners) return
    this._listeners.forEach((l) => {
      try {
        l()
      } catch (err) {
        console.error('ChecklistRepository listener error', err)
      }
    })
  }
}

export const checklistRepository = new ChecklistRepository()