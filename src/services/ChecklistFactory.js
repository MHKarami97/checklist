import { ChecklistTemplate } from '../models/ChecklistTemplate'
import { ChecklistCategory } from '../models/ChecklistCategory'
import { ChecklistItem } from '../models/ChecklistItem'

var uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

/**
 * Factory Pattern: builds ChecklistTemplate aggregates either from
 * a static definition (default templates) or from user input (custom).
 */
export class ChecklistFactory {
  static createFromDefinition(definition) {
    var categories = definition.categories.map((catDef) => {
      var items = catDef.items.map((title) => new ChecklistItem({ id: uid(), title, isChecked: false }))
      return new ChecklistCategory({ id: uid(), name: catDef.name, icon: catDef.icon, items })
    })

    return new ChecklistTemplate({
      id: definition.id || uid(),
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      categories,
      isCustom: false
    })
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
