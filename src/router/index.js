import { createRouter, createWebHistory } from "@ionic/vue-router";
import TabsPage from "../views/TabsPage.vue";
import axios from "axios";
import { adminOprofesor } from "../globalService";




const routes = [
  {
    path: "/",
    redirect: "/inicio",
  },
  {
    path: "/login",
    component: () => import("@/views/LoginPage.vue"),
  },
  {
    path: "/",
    component: TabsPage,
    children: [
      {
        path: "",
        redirect: "/inicio",
      },
      {
        path: "grupo",
        component: () => import("@/views/Tab1Page.vue"),
      },
      {
        path: "inicio",
        component: () => import("@/views/Tab2Page.vue"),
      },
      {
        path: "cuestionarios/:curso",
        component: () => import("@/views/Tab3Page.vue"),
      },
      {
        path: "admin/cuestionarios",
        component: () => import("@/views/CuestionariosPage.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next()
          else next({ path: '/inicio' })
        }
      },
      {
        path: "cuestionario/:id",
        component: () => import("@/views/CuestionarioView.vue"),
      },
      {
        path: "pregunta/:id",
        component: () => import("@/views/PreguntaView.vue"),
      },
      {
        path: "resultado/:id",
        component: () => import("@/views/PreguntaResult.vue"),
      },
      {
        path: "ganadores/:id",
        component: () => import("@/views/CuestionarioResult.vue"),
      },
      {
        path: "cursos/",
        component: () => import("@/views/CursosPage.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next()
          else next({ path: '/inicio' })
        }
        
      },
      {
        path: "crear/cuestionario/:curso",
        component: () => import("@/views/CrearCuestionario.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next()
          else next({ path: '/inicio' })
        }
      },
      {
        path: "editar/cuestionario/:id",
        component: () => import("@/views/CrearCuestionario.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next()
          else next({ path: '/inicio' })
        }
       },
             {
        path: "crear/pregunta",
        component: () => import("@/views/CrearPregunta.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next()
          else next({ path: '/inicio' })
        }
       }
    ],
  },
];
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});


router.beforeEach((to, from, next) => {

  if (to.path !== '/login' && localStorage.getItem('usuario') == undefined) next({ path: '/login' })
  else next()

  axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
  axios.get("/user/loged").catch( e => {
    localStorage.removeItem('usuario')
    localStorage.setItem('error', e)
  }
  );
});

export default router;
