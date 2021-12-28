import { createRouter, createWebHistory } from '@ionic/vue-router';
import TabsPage from '../views/TabsPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/inicio'
  },
  {
    path: '/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/inicio'
      },
      {
        path: 'grupo',
        component: () => import('@/views/Tab1Page.vue')
      },
      {
        path: 'inicio',
        component: () => import('@/views/Tab2Page.vue')
      },
      {
        path: 'cuestionarios',
        component: () => import('@/views/Tab3Page.vue')
      },
      {
        path: 'cuestionario',
        component: () => import('@/views/CuestionarioView.vue')
      },
      {
        path: 'pregunta',
        component: () => import('@/views/PreguntaView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
