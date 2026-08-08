/**
 * Value Object representing a single checklist entry.
 * Immutable identity (id) + mutable completion state.
 */
export class ChecklistItem {
  constructor({ id, title, note = '', isChecked = false, isCustom = false, createdAt = Date.now() }) {
    this.id = id
    this.title = title
    this.note = note
    this.isChecked = isChecked
    this.isCustom = isCustom
    this.createdAt = createdAt
  }

  toggle() {
    this.isChecked = !this.isChecked
    return this
  }

  clone() {
    return new ChecklistItem({ ...this })
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      note: this.note,
      isChecked: this.isChecked,
      isCustom: this.isCustom,
      createdAt: this.createdAt
    }
  }

  static fromJSON(json) {
    return new ChecklistItem(json)
  }
}
