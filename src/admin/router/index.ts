import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: () => import('../views/Login.vue') },
    { path: '/dashboard', component: () => import('../views/Dashboard.vue') },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes: routes,
})

export default router
