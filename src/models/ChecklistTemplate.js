import { ChecklistCategory } from './ChecklistCategory'

/**
 * Root aggregate: a full checklist made of multiple categories.
 * Behaves as the Aggregate Root for persistence boundaries.
 */
export class ChecklistTemplate {
  constructor({ id, title, description = '', icon = '🗒️', categories = [], isCustom = false, createdAt = Date.now() }) {
    this.id = id
    this.title = title
    this.description = description
    this.icon = icon
    this.isCustom = isCustom
    this.createdAt = createdAt
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
      categories: this.categories.map((cat) => cat.toJSON())
    }
  }

  static fromJSON(json) {
    return new ChecklistTemplate(json)
  }
}
