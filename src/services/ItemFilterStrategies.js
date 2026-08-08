/**
 * Strategy Pattern: pluggable filter/sort strategies for checklist items.
 * The store selects a strategy by key at runtime without branching logic
 * scattered across components.
 */
class BaseStrategy {
  filter(items) {
    return items
  }
  sort(items) {
    return items
  }
}

class AllItemsStrategy extends BaseStrategy {
  filter(items) {
    return items
  }
}

class PendingOnlyStrategy extends BaseStrategy {
  filter(items) {
    return items.filter((item) => !item.isChecked)
  }
}

class CompletedOnlyStrategy extends BaseStrategy {
  filter(items) {
    return items.filter((item) => item.isChecked)
  }
}

class AlphabeticalSortStrategy extends BaseStrategy {
  sort(items) {
    return [...items].sort((a, b) => a.title.localeCompare(b.title, 'fa'))
  }
}

class NewestFirstSortStrategy extends BaseStrategy {
  sort(items) {
    return [...items].sort((a, b) => b.createdAt - a.createdAt)
  }
}

export const FilterStrategies = {
  all: new AllItemsStrategy(),
  pending: new PendingOnlyStrategy(),
  completed: new CompletedOnlyStrategy()
}

export const SortStrategies = {
  default: new BaseStrategy(),
  alphabetical: new AlphabeticalSortStrategy(),
  newest: new NewestFirstSortStrategy()
}

export function applyItemStrategy(items, filterKey = 'all', sortKey = 'default') {
  var filterStrategy = FilterStrategies[filterKey] || FilterStrategies.all
  var sortStrategy = SortStrategies[sortKey] || SortStrategies.default
  return sortStrategy.sort(filterStrategy.filter(items))
}
