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
        path: 'grupo/:id',
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
        path: 'cuestionario/:id',
        component: () => import('@/views/CuestionarioView.vue')
      },
      {
        path: 'pregunta/:id',
        component: () => import('@/views/PreguntaView.vue')
      },
      {
        path: 'resultado/:id',
        component: () => import('@/views/PreguntaResult.vue')
      },
      {
        path: 'ganadores/:id',
        component: () => import('@/views/CuestionarioResult.vue')
      },
      {
        path: 'login',
        component: () => import('@/views/LoginPage.vue')
      }
    ]
  }
]
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from) => {
  const canAccess = localStorage.getItem('token');
  if (!canAccess) return '/login'
})


export default  router