import { ChecklistTemplate } from '../models/ChecklistTemplate'
import { ChecklistCategory } from '../models/ChecklistCategory'
import { ChecklistItem } from '../models/ChecklistItem'

var uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

/**
 * Factory Pattern: builds ChecklistTemplate aggregates either from
 * a static definition (default templates) or from user input (custom).
 *
 * createFromDefinition / createCategoryFromDefinition / createItemFromDefinition
 * expect the augmented defaultChecklists.js shape:
 *   { id, version, title, description, icon,
 *     categories: [{ id, name, icon, items: [{ id, title, note }] }] }
 * This shape carries stable ids so DefaultsReconciler can diff a user's
 * persisted template against an updated definition without destroying
 * their progress or custom additions.
 */
export class ChecklistFactory {
  static createItemFromDefinition(defItem) {
    return new ChecklistItem({
      id: defItem.id,
      title: defItem.title,
      note: defItem.note ?? '',
      isChecked: false
    })
  }

  static createCategoryFromDefinition(defCategory) {
    var items = defCategory.items.map((defItem) => this.createItemFromDefinition(defItem))
    return new ChecklistCategory({
      id: defCategory.id,
      name: defCategory.name,
      icon: defCategory.icon,
      items
    })
  }

  static createFromDefinition(definition) {
    var categories = definition.categories.map((catDef) => this.createCategoryFromDefinition(catDef))

    var template = new ChecklistTemplate({
      id: definition.id || uid(),
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      categories,
      isCustom: false,
      version: definition.version ?? 1,
      sourceDefinitionId: definition.id
    })

    return template
  }

  static createEmptyCustom(title, icon = '📝') {
    return new ChecklistTemplate({
      id: uid(),
      title,
      description: 'چک‌لیست شخصی من',
      icon,
      categories: [
        new ChecklistCategory({ id: uid(), name: 'موارد عمومی', icon: '✅', items: [] })
      ],
      isCustom: true
    })
  }

  static createItem(title, note = '') {
    return new ChecklistItem({ id: uid(), title, note, isChecked: false, isCustom: true })
  }

  static createCategory(name, icon = '📁') {
    return new ChecklistCategory({ id: uid(), name, icon, items: [] })
  }
}

export function generateId() {
  return uid()
}