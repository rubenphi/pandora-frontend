import { createRouter, createWebHistory } from "@ionic/vue-router";
import TabsPage from "../views/TabsPage.vue";
import QrScannerOnboarding from "../views/QrScannerOnboarding.vue";
import axios from "axios";
import { adminOprofesor, apiState } from "../globalService"; // <-- MODIFIED
import { courseAccessGuard } from "../courseAccessService";
import { Device } from "@capacitor/device";
import { resetDemoLock } from "../utils/demoLicense";

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
  //create route to register (wizard + classic fallback)
  {
    path: "/register",
    component: () => import("@/views/RegistroWizardPage.vue"),
  },
  {
    path: "/register/classic",
    component: () => import("@/views/RegistroPage.vue"),
  },
  {
    path: "/onboarding-qr", // New route
    component: QrScannerOnboarding,
  },
  {
    path: "/qr-preguntas/:d",
    component: () => import("@/views/QrPreguntas.vue"),
    beforeEnter: courseAccessGuard("question", "d"),
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
        component: () => import("@/views/PerfilGrupoPage.vue"),
      },
      {
        path: "inicio",
        component: () => import("@/views/InicioPage.vue"),
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
        path: "omr-test",
        component: () => import("@/views/OmrTest.vue"),
      },
      {
        path: "encuestas-test",
        component: () => import("@/views/OmrMenuPage.vue"),
      },
      {
        path: "omr-editor",
        component: () => import("@/views/OmrTemplateEditor.vue"),
      },
      {
        path: "omr-editor/:templateId",
        component: () => import("@/views/OmrTemplateEditor.vue"),
      },
      {
        path: "omr-encuesta/estudiantes",
        component: () => import("@/views/OmrStudentSurveyLauncher.vue"),
      },
      {
        path: "omr-encuesta/estudiantes/:sessionId",
        component: () => import("@/views/OmrSurveyReader.vue"),
      },
      {
        path: "omr-encuesta/padres",
        component: () => import("@/views/OmrParentSurveyLauncher.vue"),
      },
      {
        path: "omr-encuesta/padres/:sessionId",
        component: () => import("@/views/OmrParentSurveyReader.vue"),
      },
      // Encuestas Personalizadas OMR
      {
        path: "omr-encuesta/sesiones/:templateId",
        component: () => import("@/views/OmrSurveySessionLauncher.vue"),
      },
      {
        path: "omr-encuesta/personalizada/:sessionId",
        component: () => import("@/views/OmrGenericSurveyReader.vue"),
      },
      {
        path: "omr-encuesta/dinamica/:slug",
        component: () => import("@/views/OmrGenericSurveyReader.vue"),
      },
      {
        path: "omr-encuesta/dinamica/:slug/:sessionId",
        component: () => import("@/views/OmrGenericSurveyReader.vue"),
      },
      {
        path: "omr-encuesta/resultados/:sessionId",
        component: () => import("@/views/OmrSurveyResultsView.vue"),
      },
      {
        path: "lecciones/:curso/:area/:periodo/:year/:lessonType?",
        component: () => import("@/views/LeccionesAreaPage.vue"),
      },
      {
        path: "special-lessons/:lessonType/:curso/:area/:periodo/:year",
        component: () => import("@/views/ReinforcementList.vue"),
      },
      {
        path: "create-special-lesson/:lessonType/:curso/:area/:year/:periodo/:id?",
        component: () => import("@/views/CreateSpecialLesson.vue"),
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
        path: "admin/configuraciones",
        component: () => import("@/views/ConfiguracionesPage.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "admin/plantillas-encuestas",
        component: () => import("@/views/SurveyTemplateManager.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "surveys/templates",
        redirect: "/admin/plantillas-encuestas",
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
        path: "admin/asistencia",
        component: () => import("@/views/AsistenciaPage.vue"),
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
        path: "admin/gestion-academica",
        component: () => import("@/views/GestionAcademica.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "admin/gestionar/cursos",
        component: () => import("@/views/gestionUsuarios.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "admin/papeleria",
        name: "Papeleria",
        component: () => import("@/views/PapeleriaPage.vue"),
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
        path: "admin/imprimir-qr-estudiantes",
        name: "PrintableStudentQr",
        component: () => import("@/views/PrintableStudentQr.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "admin/importar-usuarios",
        name: "UserImport",
        component: () => import("@/views/UserImportView.vue"),
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
        beforeEnter: courseAccessGuard("quiz"),
      },
      {
        path: "actividades/:id",
        component: () => import("@/views/ActividadView.vue"),
      },
      {
        path: "material/:id",
        component: () => import("@/views/MaterialView.vue"),
      },
      {
        path: "materiales/:id",
        component: () => import("@/views/MaterialView.vue"),
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
        path: "evaluacion-grupal",
        name: "EvaluacionGrupal",
        component: () => import("@/views/EvaluacionGrupal.vue"),
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
        redirect: (to) => `/cuestionario/importar/preguntas/variables/${to.params.id}`,
      },
      {
        path: "cuestionario/importar/preguntas/variables/:id",
        component: () => import("@/views/ImportarPreguntaVariables.vue"),
      },
      {
        path: "admin/gestionar/areas",
        component: () => import("@/views/GestionAreasPage.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "areas/:id",
        component: () => import("@/views/AreasPage.vue"),
      },
      {
        path: "pregunta/:id",
        component: () => import("@/views/PreguntaView.vue"),
        beforeEnter: courseAccessGuard("question"),
      },
      {
        path: "resultado/:id",
        component: () => import("@/views/PreguntaResult.vue"),
        beforeEnter: courseAccessGuard("question"),
      },
      {
        path: "ganadores/:id",
        component: () => import("@/views/CuestionarioResult.vue"),
        beforeEnter: courseAccessGuard("quiz"),
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

      {
        path: "materials/edit/:id",
        component: () => import("@/views/CrearMaterial.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "/herramientas",
        component: () => import("@/views/HerramientasPage.vue"),
      },
      {
        path: "/herramientas/tingo-tango",
        component: () => import("@/views/TingoTangoPage.vue"),
        beforeEnter: (to, from, next) => {
          // Assuming similar auth requirements as other admin tools
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "/herramientas/ruleta",
        component: () => import("@/views/RuletaPage.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      // Encuestas Routes
      {
        path: "encuestas",
        component: () => import("@/views/EncuestasPage.vue"),
      },
      {
        path: "encuestas/crear",
        component: () => import("@/views/CrearEncuesta.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "encuestas/editar/:id", // NEW ROUTE
        component: () => import("@/views/CrearEncuesta.vue"),
        beforeEnter: (to, from, next) => {
          if (adminOprofesor()) next();
          else next({ path: "/inicio" });
        },
      },
      {
        path: "encuestas/:id",
        component: () => import("@/views/EncuestaView.vue"),
      },
    ],
  },
];
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Interceptor global: solo cerrar sesión si el backend responde explícitamente 401 (token expirado/inválido)
// Nunca cerrar sesión por errores de red, pérdida momentánea de conexión o suspensión en segundo plano
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const publicPages = ["/login", "/register", "/onboarding-qr"];
      const currentPath = router.currentRoute?.value?.path || "";
      if (!publicPages.includes(currentPath)) {
        localStorage.removeItem("usuario");
        localStorage.removeItem("token");
        resetDemoLock();
        router.push("/login");
      }
    }
    return Promise.reject(error);
  }
);

// --- vvv MODIFIED GUARD vvv ---
router.beforeEach(async (to, from, next) => {
  const info = await Device.getInfo();
  const isNative = info.platform === "android" || info.platform === "ios";

  // Use the reactive state to check if the URL is configured
  const isBaseUrlSet = !!apiState.baseUrl;
  const rawUser = localStorage.getItem("usuario");
  const rawToken = localStorage.getItem("token");
  const isLoggedIn = !!rawUser && rawUser !== "undefined" && rawUser !== "null" && !!rawToken;

  const publicPages = ["/login", "/register", "/onboarding-qr"];
  const authRequired = !publicPages.includes(to.path);

  // If on native, the URL is not set, and not going to onboarding, redirect.
  if (isNative && !isBaseUrlSet && to.path !== "/onboarding-qr") {
    return next("/onboarding-qr");
  }

  // If auth is required and user is not logged in, redirect to login.
  if (authRequired && !isLoggedIn) {
    resetDemoLock();
    return next("/login");
  }

  if (to.path === "/login") {
    resetDemoLock();
  }

  // If user is logged in, set auth header.
  if (isLoggedIn && rawToken) {
    axios.defaults.headers.common["Authorization"] = rawToken;
  }

  next();
});
// --- ^^^ MODIFIED GUARD ^^^ ---

export default router;
