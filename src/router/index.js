import { createRouter, createWebHistory } from '@ionic/vue-router';
import TabsPage from '../views/TabsPage.vue';
import axios from "axios";



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
});

function validador(){
  let user = {};
  axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
  console.log(localStorage.getItem('token'));
  axios.get("/user/loged").then((response) => {
    localStorage.setItem("usuario", JSON.stringify(response.data));
  });
  
  user = JSON.parse(localStorage.getItem('usuario')) 
  if ( user.name == undefined) {
    return false
  } else {
    return true
  }
}

router.beforeEach((to, from, next) => {
  console.log(validador());
  if (to.path !== '/login' && validador() == false) next({ path: '/login' })
  else next()
});


export default  router