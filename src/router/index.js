import { createRouter, createWebHistory } from "@ionic/vue-router";
import TabsPage from "../views/TabsPage.vue";
import QrScannerOnboarding from "../views/QrScannerOnboarding.vue";
import axios from "axios";
import { adminOprofesor, apiState } from "../globalService"; // <-- MODIFIED
import { Device } from "@capacitor/device";

const routes = [
  // ... (all routes remain the same)
  {
    path: "/",
    redirect: "/inicio",
  },
  {
    path: "/login",
    component: () => import("@/views/LoginPage.vue"),
  },
  //create route to register (registro.vue)
  {
    path: "/register",
    component: () => import("@/views/RegistroPage.vue"),
  },
  {
    path: "/onboarding-qr", // New route
    component: QrScannerOnboarding,
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
        path: "omr-read",
        component: () => import("@/views/OmrRead.vue"),
      },
      {
        path: "omr-read/:id",
        component: () => import("@/views/OmrRead.vue"),
      },
      {
        path: "lecciones/:curso/:area/:periodo/:year",
        component: () => import("@/views/Tab3Page.vue"),
      },
      {
        path: "refuerzos/:curso/:area/:periodo/:year",
        component: () => import("@/views/ReinforcementList.vue"),
      },
      {
        path: "crear/refuerzo/:curso/:area/:year/:periodo/:id?",
        component: () => import("@/views/CreateReinforcement.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },

      {
        path: "admin/cuestionarios",
        component: () => import("@/views/CuestionariosPage.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "admin/registro/usuarios",
        component: () => import("@/views/RegistroPage.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "admin/actualizar/usuarios/:id",
        component: () => import("@/views/UpdateUser.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "admin/panel",
        component: () => import("@/views/PanelPage.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "admin/gestionar/usuarios",
        component: () => import("@/views/gestionUsuarios.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "admin/imprimir-lista-estudiantes",
        name: "PrintableStudentList",
        component: () => import("@/views/PrintableStudentList.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "admin/imprimir-hojas-estudiantes",
        name: "PrintableStudentSheet",
        component: () => import("@/views/PrintableStudentSheet.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "admin/grupos/:cursoId/:selectedYear",
        component: () => import("@/views/GruposPage.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "admin/notas/:cursoId/:areaId/:year",
        component: () => import("@/views/NotasPage.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "cuestionario/:id",
        component: () => import("@/views/CuestionarioView.vue"),
      },
      {
        path: "actividades/:id",
        component: () => import("@/views/ActividadView.vue"),
      },

      {
        path: "actividad/:id/evaluar-pares",
        component: () => import("@/views/EvaluarPares.vue"),
      },
      {
        path: "revisar/actividad/:id",
        component: () => import("@/views/RevisarActividad.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "ver/revision/:id",
        component: () => import("@/views/VerRevision.vue"),
      },
      {
        path: "revisar/actividad/:id/permisos",
        component: () => import("@/views/ConfiguracionPermisos.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },

      {
        path: "cuestionario/importar/:id",
        component: () => import("@/views/ImportacionPregunta.vue"),
      },
      {
        path: "cuestionario/importar/preguntas/tipo/:id",
        component: () => import("@/views/ImportarPreguntaTipo.vue"),
      },
      {
        path: "cuestionario/importar/preguntas/variables/:id",
        component: () => import("@/views/ImportarPreguntaVariables.vue"),
      },
      {
        path: "areas/:id",
        component: () => import("@/views/AreasPage.vue"),
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
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "admin/autorizaciones/",
        component: () => import("@/views/AutorizacionesPage.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "crear/cuestionario/:lessonId/:id?",
        component: () => import("@/views/CrearCuestionario.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "crear/cuestionario/:lessonId",
        component: () => import("@/views/CrearCuestionario.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "crear/actividad/:lessonId/:id?",
        component: () => import("@/views/CrearActividad.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "crear/leccion/:id",
        component: () => import("@/views/CrearLeccion.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "/crear/leccion/:curso/:area/:year",
        component: () => import("@/views/CrearLeccion.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "crear/criterio/:activityId",
        component: () => import("@/views/CrearCriterio.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },

      {
        path: "crear/pregunta/:cuestionario",
        component: () => import("@/views/CrearPregunta.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "editar/pregunta/:id",
        component: () => import("@/views/CrearPregunta.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "crear/opcion/:pregunta",
        component: () => import("@/views/CrearOpcion.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "editar/opcion/:id",
        component: () => import("@/views/CrearOpcion.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "materials",
        component: () => import("@/views/MaterialsPage.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "crear/material/:lessonId",
        component: () => import("@/views/CrearMaterial.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "crear/material/:lessonId/:id",
        component: () => import("@/views/CrearMaterial.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "materials/edit/:id",
        component: () => import("@/views/CrearMaterial.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
    ],
  },
];
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// --- vvv MODIFIED GUARD vvv ---
router.beforeEach(async (to, from, next) => {
  const info = await Device.getInfo();
  const isNative = info.platform === "android" || info.platform === "ios";

  // Use the reactive state to check if the URL is configured
  const isBaseUrlSet = !!apiState.baseUrl;
  const isLoggedIn = localStorage.getItem("usuario") != undefined;

  const publicPages = ["/login", "/register", "/onboarding-qr"];
  const authRequired = !publicPages.includes(to.path);

  // If on native, the URL is not set, and not going to onboarding, redirect.
  if (isNative && !isBaseUrlSet && to.path !== "/onboarding-qr") {
    return next("/onboarding-qr");
  }

  // If auth is required and user is not logged in, redirect to login.
  if (authRequired && !isLoggedIn) {
    return next("/login");
  }

  // If user is logged in, set auth header.
  if (isLoggedIn) {
    axios.defaults.headers.common["Authorization"] =
      localStorage.getItem("token");
    axios.get("/auth/profile").catch((e) => {
      localStorage.removeItem("usuario");
      localStorage.setItem("error", e);
    });
  }

  next();
});
// --- ^^^ MODIFIED GUARD ^^^ ---

export default router;
