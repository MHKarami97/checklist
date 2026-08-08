import { defineStore } from 'pinia'
import { checklistRepository } from '../services/ChecklistRepository'
import { ChecklistFactory } from '../services/ChecklistFactory'
import { defaultChecklistDefinitions } from '../data/defaultChecklists'
import { applyItemStrategy } from '../services/ItemFilterStrategies'

/**
 * Central reactive store (Observer Pattern via Pinia's reactivity system).
 * All components subscribe to this single source of truth; any mutation
 * here automatically propagates to every subscriber.
 */
export var useChecklistStore = defineStore('checklist', {
  state: () => ({
    templates: [],
    activeTemplateId: null,
    activeCategoryId: null,
    filterKey: 'all',
    sortKey: 'default',
    searchQuery: '',
    isDarkMode: false,
    saveTimeoutId: null
  }),

  getters: {
    activeTemplate(state) {
      return state.templates.find((tpl) => tpl.id === state.activeTemplateId) || null
    },

    activeCategory(state) {
      var template = state.templates.find((tpl) => tpl.id === state.activeTemplateId)
      if (!template) return null
      return template.findCategory(state.activeCategoryId) || template.categories[0] || null
    },

    visibleItems(state) {
      var category = this.activeCategory
      if (!category) return []
      var items = category.items
      if (state.searchQuery.trim()) {
        var query = state.searchQuery.trim().toLowerCase()
        items = items.filter((item) => item.title.toLowerCase().includes(query))
      }
      return applyItemStrategy(items, state.filterKey, state.sortKey)
    }
  },

  actions: {
    initialize() {
      if (checklistRepository.exists()) {
        this.templates = checklistRepository.getAll()
      } else {
        this.templates = defaultChecklistDefinitions.map((def) => ChecklistFactory.createFromDefinition(def))
        this.persistAll()
      }
      if (this.templates.length && !this.activeTemplateId) {
        this.activeTemplateId = this.templates[0].id
        this.activeCategoryId = this.templates[0].categories[0]?.id ?? null
      }

      var darkPref = localStorage.getItem('smart-checklist:theme')
      this.isDarkMode = darkPref === 'dark'
      this.applyTheme()
    },

    persistAll() {
      checklistRepository.saveAll(this.templates)
    },

    schedulePersist() {
      clearTimeout(this.saveTimeoutId)
      this.saveTimeoutId = setTimeout(() => this.persistAll(), 400)
    },

    selectTemplate(templateId) {
      this.activeTemplateId = templateId
      var template = this.activeTemplate
      this.activeCategoryId = template?.categories[0]?.id ?? null
      this.searchQuery = ''
    },

    selectCategory(categoryId) {
      this.activeCategoryId = categoryId
    },

    toggleItem(itemId) {
      var category = this.activeCategory
      if (!category) return
      var item = category.findItem(itemId)
      if (item) {
        item.toggle()
        this.schedulePersist()
      }
    },

    addItem(title, note = '') {
      var category = this.activeCategory
      if (!category || !title.trim()) return
      category.addItem(ChecklistFactory.createItem(title.trim(), note))
      this.schedulePersist()
    },

    removeItem(itemId) {
      var category = this.activeCategory
      if (!category) return
      category.removeItem(itemId)
      this.schedulePersist()
    },

    addCategory(name, icon = '📁') {
      var template = this.activeTemplate
      if (!template || !name.trim()) return
      var category = ChecklistFactory.createCategory(name.trim(), icon)
      template.categories.push(category)
      this.activeCategoryId = category.id
      this.schedulePersist()
    },

    resetActiveTemplate() {
      var template = this.activeTemplate
      if (!template) return
      template.resetProgress()
      this.schedulePersist()
    },

    createCustomTemplate(title, icon = '📝') {
      var template = ChecklistFactory.createEmptyCustom(title, icon)
      this.templates.push(template)
      this.selectTemplate(template.id)
      this.persistAll()
      return template
    },

    deleteTemplate(templateId) {
      this.templates = this.templates.filter((tpl) => tpl.id !== templateId)
      if (this.activeTemplateId === templateId) {
        this.activeTemplateId = this.templates[0]?.id ?? null
        this.activeCategoryId = this.templates[0]?.categories[0]?.id ?? null
      }
      this.persistAll()
    },

    setFilter(key) {
      this.filterKey = key
    },

    setSort(key) {
      this.sortKey = key
    },

    setSearchQuery(query) {
      this.searchQuery = query
    },

    toggleTheme() {
      this.isDarkMode = !this.isDarkMode
      localStorage.setItem('smart-checklist:theme', this.isDarkMode ? 'dark' : 'light')
      this.applyTheme()
    },

    applyTheme() {
      document.documentElement.classList.toggle('dark', this.isDarkMode)
    },

    exportData() {
      var payload = {
        exportedAt: new Date().toISOString(),
        templates: this.templates.map((tpl) => tpl.toJSON())
      }
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      var url = URL.createObjectURL(blob)
      var link = document.createElement('a')
      link.href = url
      link.download = `checklist-backup-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
    },

    async importData(file) {
      var text = await file.text()
      var parsed = JSON.parse(text)
      var incoming = (parsed.templates || []).map((json) => ChecklistFactory.createFromDefinition({
        ...json,
        categories: json.categories.map((cat) => ({
          name: cat.name,
          icon: cat.icon,
          items: cat.items.map((it) => it.title)
        }))
      }))
      this.templates.push(...incoming)
      this.persistAll()
    }
  }
})
