import { createRouter, createWebHistory } from 'vue-router'

var HomeView = () => import('../views/HomeView.vue')
var ChecklistDetailView = () => import('../views/ChecklistDetailView.vue')

var routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/checklist/:id', name: 'checklist-detail', component: ChecklistDetailView, props: true }
]

var router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
