import {createRouter, createWebHistory} from '@ionic/vue-router';


const routes = [
    {
        path: '/',
        redirect: '/inicio'
    },
    {
        path: '/grupo',
        component: () => import ('@/views/Tab1Page.vue')
    },
    {
        path: '/inicio',
        component: () => import ('@/views/Tab2Page.vue')
    },
    {
        path: '/cuestionarios',
        component: () => import ('@/views/Tab3Page.vue'),
        meta: {
            refresh: true
        }
    }, {
        path: '/cuestionario',
        component: () => import ('@/views/CuestionarioView.vue')
    }, {
        path: '/pregunta',
        component: () => import ('@/views/PreguntaView.vue')
    }, {
        path: '/resultado',
        component: () => import ('@/views/PreguntaResult.vue')
    }, {
        path: '/ganadores',
        component: () => import ('@/views/CuestionarioResult.vue')
    }, {
        path: '/login',
        component: () => import ('@/views/LoginPage.vue')
    }

]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

export default router
