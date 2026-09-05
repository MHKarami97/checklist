import { ChecklistCategory } from './ChecklistCategory'

/**
 * Root aggregate: a full checklist made of multiple categories.
 * Behaves as the Aggregate Root for persistence boundaries.
 *
 * `version` + `sourceDefinitionId` track which default definition (if any)
 * this template originated from, and which version of it was last merged —
 * required by DefaultsReconciler to safely add new default content without
 * touching user progress or custom items. Both must round-trip through
 * toJSON/fromJSON or they reset to their defaults on every reload.
 */
export class ChecklistTemplate {
  constructor({
    id,
    title,
    description = '',
    icon = '🗒️',
    categories = [],
    isCustom = false,
    createdAt = Date.now(),
    version = 1,
    sourceDefinitionId = null
  }) {
    this.id = id
    this.title = title
    this.description = description
    this.icon = icon
    this.isCustom = isCustom
    this.createdAt = createdAt
    this.version = version
    this.sourceDefinitionId = sourceDefinitionId
    this.categories = categories.map((cat) => (cat instanceof ChecklistCategory ? cat : new ChecklistCategory(cat)))
  }

  get totalItems() {
    return this.categories.reduce((sum, cat) => sum + cat.totalCount, 0)
  }

  get completedItems() {
    return this.categories.reduce((sum, cat) => sum + cat.completedCount, 0)
  }

  get overallProgress() {
    if (this.totalItems === 0) return 0
    return Math.round((this.completedItems / this.totalItems) * 100)
  }

  findCategory(categoryId) {
    return this.categories.find((cat) => cat.id === categoryId)
  }

  resetProgress() {
    this.categories.forEach((cat) => cat.items.forEach((item) => (item.isChecked = false)))
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      icon: this.icon,
      isCustom: this.isCustom,
      createdAt: this.createdAt,
      version: this.version,
      sourceDefinitionId: this.sourceDefinitionId,
      categories: this.categories.map((cat) => cat.toJSON())
    }
  }

  static fromJSON(json) {
    return new ChecklistTemplate(json)
  }
}