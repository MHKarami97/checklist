import { ChecklistTemplate } from '../models/ChecklistTemplate'
import { storageService } from './StorageService'

const STORAGE_KEY = 'checklists'

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
    return this.storage.set(STORAGE_KEY, payload)
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
}

export const checklistRepository = new ChecklistRepository()
