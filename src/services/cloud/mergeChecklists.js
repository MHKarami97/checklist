import { ChecklistTemplate } from '../../models/ChecklistTemplate'
import { ChecklistCategory } from '../../models/ChecklistCategory'
import { ChecklistItem } from '../../models/ChecklistItem'

/**
 * Deep merge of local and remote templates by ID.
 * - If a template exists only in one side, keep it.
 * - If exists in both: merge categories by ID, and items within by ID.
 * - For item completion state: if remote or local is checked, keep the true state, or keep latest modified.
 */
export function mergeTemplates(localTemplates, remoteTemplates) {
  var templateMap = new Map()

  localTemplates.forEach((t) => {
    templateMap.set(t.id, t instanceof ChecklistTemplate ? t : ChecklistTemplate.fromJSON(t))
  })

  remoteTemplates.forEach((rawRemote) => {
    var remote = rawRemote instanceof ChecklistTemplate ? rawRemote : ChecklistTemplate.fromJSON(rawRemote)
    if (!templateMap.has(remote.id)) {
      templateMap.set(remote.id, remote)
      return
    }

    var local = templateMap.get(remote.id)
    var catMap = new Map()
    local.categories.forEach((c) => catMap.set(c.id, c))

    remote.categories.forEach((rawCat) => {
      var cat = rawCat instanceof ChecklistCategory ? rawCat : ChecklistCategory.fromJSON(rawCat)
      if (!catMap.has(cat.id)) {
        catMap.set(cat.id, cat)
        return
      }

      var localCat = catMap.get(cat.id)
      var itemMap = new Map()
      localCat.items.forEach((it) => itemMap.set(it.id, it))

      cat.items.forEach((rawIt) => {
        var it = rawIt instanceof ChecklistItem ? rawIt : ChecklistItem.fromJSON(rawIt)
        if (!itemMap.has(it.id)) {
          itemMap.set(it.id, it)
        } else {
          var localIt = itemMap.get(it.id)
          // If checked in either, or keep latest
          localIt.isChecked = localIt.isChecked || it.isChecked
          if (it.note && !localIt.note) localIt.note = it.note
        }
      })

      localCat.items = Array.from(itemMap.values())
    })

    local.categories = Array.from(catMap.values())
  })

  return Array.from(templateMap.values())
}
