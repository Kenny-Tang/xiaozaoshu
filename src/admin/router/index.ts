import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: () => import('../views/Login.vue') },
    { path: '/dashboard', component: () => import('../views/Dashboard.vue') },
    { path: '/dividend-price-trend', component: () => import('../views/DividendPriceTrend.vue') },
    { path: '/trend', component: () => import('../views/DividendPriceTrend.vue') },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes: routes,
})

export default router
