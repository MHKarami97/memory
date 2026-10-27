import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'timeline',
    component: () => import('@/views/TimelineView.vue'),
  },
  {
    path: '/new',
    name: 'new-memory',
    component: () => import('@/views/EditorView.vue'),
  },
  {
    path: '/edit/:id',
    name: 'edit-memory',
    component: () => import('@/views/EditorView.vue'),
    props: true,
  },
  {
    path: '/memory/:id',
    name: 'memory-detail',
    component: () => import('@/views/DetailView.vue'),
    props: true,
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: () => import('@/views/CalendarView.vue'),
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/SearchView.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
