import { ChecklistFactory } from './ChecklistFactory'

/**
 * DefaultsReconciler
 * ------------------
 * Strategy Pattern: encapsulates the algorithm that merges an updated
 * default definition (shipped in source code) into an already-persisted
 * user template, without touching the user's progress or custom items.
 *
 * Contract for defaultChecklistDefinitions entries (required for stable
 * matching across app updates):
 *   { id: 'travel', version: 2, categories: [
 *       { id: 'documents', name: 'Documents', icon: '📄', items: [
 *           { id: 'passport', title: 'Passport', note: '' }
 *       ]}
 *   ]}
 *
 * Rules (additive-only merge, by design, to avoid destroying user data):
 *  1. A category present in the definition but missing from the template
 *     (matched by id) is appended as-is.
 *  2. An item present in a matched category's definition but missing from
 *     the template's category (matched by id) is appended, unchecked.
 *  3. Existing categories/items are never mutated or removed here — if a
 *     definition item's title changed upstream, the user's copy is left
 *     alone (their edits, if any, take precedence). Deletions upstream are
 *     intentionally ignored to avoid wiping user progress silently.
 *  4. The template's `version` is bumped to the definition's version only
 *     after a successful merge pass, so re-running is idempotent.
 */
export class DefaultsReconciler {
  /**
   * @param {ChecklistTemplate} template - persisted template instance
   * @param {object} definition - current definition from source code
   * @returns {boolean} true if the template was mutated
   */
  static reconcile(template, definition) {
    if (!template || !definition) return false
    if ((template.version ?? 0) >= (definition.version ?? 0)) return false

    var mutated = false

    definition.categories.forEach((defCategory) => {
      var category = template.findCategory(defCategory.id)

      if (!category) {
        template.categories.push(ChecklistFactory.createCategoryFromDefinition(defCategory))
        mutated = true
        return
      }

      defCategory.items.forEach((defItem) => {
        var existingItem = category.findItem(defItem.id)
        if (!existingItem) {
          category.addItem(ChecklistFactory.createItemFromDefinition(defItem))
          mutated = true
        }
      })
    })

    template.version = definition.version
    return mutated
  }

  /**
   * Runs reconciliation for every known default definition against the
   * currently loaded templates. Adds brand-new default templates (ones the
   * user never had) unless the user explicitly deleted them before.
   *
   * @param {ChecklistTemplate[]} templates
   * @param {object[]} definitions
   * @param {string[]} deletedDefaultIds
   * @returns {{ templates: ChecklistTemplate[], changed: boolean }}
   */
  static reconcileAll(templates, definitions, deletedDefaultIds = []) {
    var changed = false
    var result = [...templates]

    definitions.forEach((definition) => {
      var existing = result.find((tpl) => tpl.sourceDefinitionId === definition.id)

      if (existing) {
        if (this.reconcile(existing, definition)) changed = true
        return
      }

      if (deletedDefaultIds.includes(definition.id)) return

      result.push(ChecklistFactory.createFromDefinition(definition))
      changed = true
    })

    return { templates: result, changed: changed }
  }
}