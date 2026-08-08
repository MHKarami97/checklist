import { ChecklistItem } from './ChecklistItem'

/**
 * Aggregates a group of related ChecklistItem instances
 * and exposes derived progress metrics.
 */
export class ChecklistCategory {
  constructor({ id, name, icon = '📌', items = [] }) {
    this.id = id
    this.name = name
    this.icon = icon
    this.items = items.map((item) => (item instanceof ChecklistItem ? item : new ChecklistItem(item)))
  }

  get totalCount() {
    return this.items.length
  }

  get completedCount() {
    return this.items.filter((item) => item.isChecked).length
  }

  get progressPercent() {
    if (this.totalCount === 0) return 0
    return Math.round((this.completedCount / this.totalCount) * 100)
  }

  addItem(item) {
    this.items.push(item instanceof ChecklistItem ? item : new ChecklistItem(item))
  }

  removeItem(itemId) {
    this.items = this.items.filter((item) => item.id !== itemId)
  }

  findItem(itemId) {
    return this.items.find((item) => item.id === itemId)
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      items: this.items.map((item) => item.toJSON())
    }
  }

  static fromJSON(json) {
    return new ChecklistCategory(json)
  }
}
