<template>
  <ion-page class="ion-page qz-lecciones-page">
    <ion-content :fullscreen="true" class="qz-lecciones-content">
      <div class="qz-page-wrapper">
        <!-- 1. CABECERA HERO QUEEZY PÚRPURA -->
        <div class="qz-hero-header">
          <!-- Barra superior: Botón volver + Botón crear lección (docente) -->
          <div class="qz-hero-top">
            <button
              type="button"
              class="qz-back-btn"
              title="Regresar a Áreas"
              @click="goBack"
            >
              <ion-icon :icon="arrowBackOutline"></ion-icon>
            </button>

            <!-- Botón Crear Lección para Profesores / Admins -->
            <button
              v-if="adminOProfesor && curso && area"
              type="button"
              class="qz-create-btn"
              @click="presentCreateLessonOptions"
            >
              <ion-icon :icon="addOutline"></ion-icon>
              <span>{{ createLabel }}</span>
            </button>
          </div>

          <!-- Títulos del Hero -->
          <div class="qz-hero-titles">
            <span class="qz-hero-tag" v-if="cursoActual?.name">
              {{ cursoActual.name }} · {{ year ? year : "" }}
            </span>
            <span class="qz-hero-tag" v-else> CURSO Y LECCIONES </span>
            <h1 class="qz-hero-title">{{ pageTitle }}</h1>
            <p class="qz-hero-subtitle">
              Consulta materiales, cuestionarios y actividades asignadas
            </p>
          </div>
        </div>

        <!-- 2. CUERPO: LISTA DE TARJETAS DE LECCIONES ESCALABLES -->
        <div class="qz-main-body">
          <div class="qz-container">
            <!-- Indicador de total de lecciones y botón contraer/desplegar todas -->
            <div
              class="qz-section-header"
              v-if="lecciones && lecciones.length > 0"
            >
              <div class="qz-section-header-left">
                <h2 class="qz-section-title">Contenido del periodo</h2>
                <span class="qz-section-badge">
                  {{ lecciones.length }}
                  {{ lecciones.length === 1 ? "lección" : "lecciones" }}
                </span>
              </div>

              <!-- Botón Desplegar / Contraer Todo -->
              <button
                type="button"
                class="qz-toggle-all-btn"
                @click="toggleAllLessons"
                :title="
                  allExpanded
                    ? 'Contraer todas las lecciones'
                    : 'Desplegar todas las lecciones'
                "
              >
                <ion-icon
                  :icon="allExpanded ? chevronUpOutline : chevronDownOutline"
                ></ion-icon>
                <span>{{
                  allExpanded ? "Contraer todo" : "Desplegar todo"
                }}</span>
              </button>
            </div>

            <!-- Lista de Lecciones -->
            <div
              v-if="lecciones && lecciones.length > 0"
              class="qz-lessons-list"
            >
              <div
                v-for="leccion in lecciones"
                :key="leccion.id"
                class="qz-lesson-card"
                :class="{ 'is-collapsed': !isLessonExpanded(leccion.id) }"
              >
                <!-- A. Encabezado de la Tarjeta de Lección (Interactivo para desplegar) -->
                <div
                  class="qz-lesson-card-header"
                  :class="{ 'is-collapsed': !isLessonExpanded(leccion.id) }"
                  @click="toggleLessonCard(leccion.id)"
                >
                  <!-- Fila Superior: Fecha y Alerta alineados horizontalmente con los Botones de Acción -->
                  <div class="qz-lesson-top-row">
                    <div class="qz-lesson-date-group">
                      <span class="qz-lesson-date">
                        <ion-icon :icon="calendarOutline"></ion-icon>
                        {{ formatFecha(leccion.date) }}
                      </span>
                      <span
                        v-if="
                          leccionesConCuestionariosPendientes.includes(
                            leccion.id,
                          ) ||
                          leccionesConActividadesPendientes.includes(leccion.id)
                        "
                        class="qz-alert-pill"
                      >
                        Por calificar
                      </span>
                    </div>

                    <div class="qz-lesson-header-actions">
                      <!-- Botón Editar Lección (Docentes) -->
                      <button
                        v-if="adminOProfesor"
                        type="button"
                        class="qz-edit-lesson-btn"
                        title="Editar lección"
                        @click.stop="goToEdit(leccion)"
                      >
                        <ion-icon :icon="createOutline"></ion-icon>
                      </button>

                      <!-- Chevron Desplegable -->
                      <div
                        class="qz-card-chevron"
                        :class="{ 'is-open': isLessonExpanded(leccion.id) }"
                        title="Desplegar o contraer subsecciones"
                      >
                        <ion-icon :icon="chevronDownOutline"></ion-icon>
                      </div>
                    </div>
                  </div>

                  <!-- Título / Tema de la Lección a ancho completo -->
                  <h3 class="qz-lesson-topic">{{ leccion.topic }}</h3>
                </div>

                <!-- B. Módulos de la Lección en Renglones Apilados Escalables (Opción 2) -->
                <transition name="qz-expand">
                  <div
                    v-show="isLessonExpanded(leccion.id)"
                    class="qz-modules-container"
                  >
                    <!-- MÓDULO 1: Material de Apoyo -->
                    <div class="qz-module-block">
                      <div
                        class="qz-module-row"
                        :class="{
                          'is-expanded':
                            openedLessonId === leccion.id &&
                            openedSection === 'materiales',
                        }"
                        @click="toggleSection(leccion.id, 'materiales')"
                      >
                        <div class="qz-module-icon qz-icon--purple">
                          <ion-icon :icon="folderOpenOutline"></ion-icon>
                        </div>
                        <div class="qz-module-info">
                          <span class="qz-module-title">Material de apoyo</span>
                          <span class="qz-module-desc"
                            >Guías, lecturas y recursos descargables</span
                          >
                        </div>
                        <div
                          class="qz-module-chevron"
                          :class="{
                            'is-open':
                              openedLessonId === leccion.id &&
                              openedSection === 'materiales',
                          }"
                        >
                          <ion-icon :icon="chevronForwardOutline"></ion-icon>
                        </div>
                      </div>

                      <!-- Despliegue de Materiales -->
                      <div
                        v-if="
                          openedLessonId === leccion.id &&
                          openedSection === 'materiales'
                        "
                        class="qz-expanded-drawer"
                      >
                        <div v-if="isLoadingMaterials" class="qz-loading-box">
                          <ion-spinner
                            name="crescent"
                            color="primary"
                          ></ion-spinner>
                          <span>Cargando materiales...</span>
                        </div>
                        <div
                          v-else-if="materialsList.length === 0"
                          class="qz-empty-module-box"
                        >
                          <ion-icon
                            :icon="documentTextOutline"
                            class="qz-empty-module-icon"
                          ></ion-icon>
                          <p>No hay material de apoyo registrado</p>
                        </div>
                        <div v-else class="qz-items-group">
                          <div
                            v-for="material in materialsList"
                            :key="material.id"
                            class="qz-item-card"
                          >
                            <div
                              class="qz-item-clickable"
                              @click="openMaterial(material)"
                            >
                              <div class="qz-item-bullet qz-bullet--purple">
                                <ion-icon
                                  :icon="documentTextOutline"
                                ></ion-icon>
                              </div>
                              <span class="qz-item-label">{{
                                material.name
                              }}</span>
                            </div>
                            <button
                              v-if="adminOProfesor"
                              type="button"
                              class="qz-item-action-btn"
                              title="Editar material"
                              @click.stop="
                                goToEditMaterial(leccion.id, material.id)
                              "
                            >
                              <ion-icon :icon="createOutline"></ion-icon>
                            </button>
                          </div>
                        </div>

                        <!-- Botón Añadir Material para Profesores -->
                        <button
                          v-if="adminOProfesor"
                          type="button"
                          class="qz-add-item-btn"
                          @click="presentMaterialCreationOptions(leccion.id)"
                        >
                          <ion-icon :icon="addCircleOutline"></ion-icon>
                          <span>Agregar Material</span>
                        </button>
                      </div>
                    </div>

                    <!-- MÓDULO 2: Cuestionarios -->
                    <div class="qz-module-block">
                      <div
                        class="qz-module-row"
                        :class="{
                          'is-expanded':
                            openedLessonId === leccion.id &&
                            openedSection === 'cuestionarios',
                        }"
                        @click="toggleSection(leccion.id, 'cuestionarios')"
                      >
                        <div class="qz-module-icon qz-icon--coral">
                          <ion-icon :icon="helpCircleOutline"></ion-icon>
                        </div>
                        <div class="qz-module-info">
                          <div class="qz-module-title-wrap">
                            <span class="qz-module-title">Cuestionarios</span>
                            <span
                              v-if="
                                leccionesConCuestionariosPendientes.includes(
                                  leccion.id,
                                )
                              "
                              class="qz-alert-pill"
                            >
                              Por calificar
                            </span>
                          </div>
                          <span class="qz-module-desc"
                            >Pruebas evaluativas y cuestionarios</span
                          >
                        </div>
                        <div
                          class="qz-module-chevron"
                          :class="{
                            'is-open':
                              openedLessonId === leccion.id &&
                              openedSection === 'cuestionarios',
                          }"
                        >
                          <ion-icon :icon="chevronForwardOutline"></ion-icon>
                        </div>
                      </div>

                      <!-- Despliegue de Cuestionarios -->
                      <div
                        v-if="
                          openedLessonId === leccion.id &&
                          openedSection === 'cuestionarios'
                        "
                        class="qz-expanded-drawer"
                      >
                        <div
                          v-if="isLoadingCuestionarios"
                          class="qz-loading-box"
                        >
                          <ion-spinner
                            name="crescent"
                            color="primary"
                          ></ion-spinner>
                          <span>Cargando cuestionarios...</span>
                        </div>
                        <div
                          v-else-if="cuestionariosList.length === 0"
                          class="qz-empty-module-box"
                        >
                          <ion-icon
                            :icon="helpCircleOutline"
                            class="qz-empty-module-icon"
                          ></ion-icon>
                          <p>No hay cuestionarios asignados</p>
                        </div>
                        <div v-else class="qz-items-group">
                          <div
                            v-for="cuestionario in cuestionariosList"
                            :key="cuestionario.id"
                            class="qz-item-card"
                            @click="navigateToQuiz(cuestionario)"
                          >
                            <div class="qz-item-clickable">
                              <div class="qz-item-bullet qz-bullet--coral">
                                <ion-icon :icon="checkboxOutline"></ion-icon>
                              </div>
                              <span class="qz-item-label">{{
                                cuestionario.name
                              }}</span>
                            </div>
                            <span
                              v-if="
                                cuestionariosPendientes.includes(
                                  cuestionario.id,
                                )
                              "
                              class="qz-warning-chip"
                            >
                              <ion-icon :icon="alertCircleOutline"></ion-icon>
                              <span>Pendiente</span>
                            </span>
                            <div class="qz-item-arrow">
                              <ion-icon
                                :icon="chevronForwardOutline"
                              ></ion-icon>
                            </div>
                          </div>
                        </div>

                        <!-- Botón Crear Cuestionario para Profesores -->
                        <button
                          v-if="adminOProfesor"
                          type="button"
                          class="qz-add-item-btn"
                          @click="goToCreateQuiz(leccion.id)"
                        >
                          <ion-icon :icon="addCircleOutline"></ion-icon>
                          <span>Crear Cuestionario</span>
                        </button>
                      </div>
                    </div>

                    <!-- MÓDULO 3: Actividades -->
                    <div class="qz-module-block">
                      <div
                        class="qz-module-row"
                        :class="{
                          'is-expanded':
                            openedLessonId === leccion.id &&
                            openedSection === 'actividades',
                        }"
                        @click="toggleSection(leccion.id, 'actividades')"
                      >
                        <div class="qz-module-icon qz-icon--cyan">
                          <ion-icon :icon="flashOutline"></ion-icon>
                        </div>
                        <div class="qz-module-info">
                          <div class="qz-module-title-wrap">
                            <span class="qz-module-title">Actividades</span>
                            <span
                              v-if="
                                leccionesConActividadesPendientes.includes(
                                  leccion.id,
                                )
                              "
                              class="qz-alert-pill"
                            >
                              Por calificar
                            </span>
                          </div>
                          <span class="qz-module-desc"
                            >Talleres prácticos y tareas</span
                          >
                        </div>
                        <div
                          class="qz-module-chevron"
                          :class="{
                            'is-open':
                              openedLessonId === leccion.id &&
                              openedSection === 'actividades',
                          }"
                        >
                          <ion-icon :icon="chevronForwardOutline"></ion-icon>
                        </div>
                      </div>

                      <!-- Despliegue de Actividades -->
                      <div
                        v-if="
                          openedLessonId === leccion.id &&
                          openedSection === 'actividades'
                        "
                        class="qz-expanded-drawer"
                      >
                        <div v-if="isLoadingActivities" class="qz-loading-box">
                          <ion-spinner
                            name="crescent"
                            color="primary"
                          ></ion-spinner>
                          <span>Cargando actividades...</span>
                        </div>
                        <div
                          v-else-if="actvitiesList.length === 0"
                          class="qz-empty-module-box"
                        >
                          <ion-icon
                            :icon="flashOutline"
                            class="qz-empty-module-icon"
                          ></ion-icon>
                          <p>No hay actividades asignadas</p>
                        </div>
                        <div v-else class="qz-items-group">
                          <div
                            v-for="actividad in actvitiesList"
                            :key="actividad.id"
                            class="qz-item-card"
                            @click="navigateToActivity(actividad)"
                          >
                            <div class="qz-item-clickable">
                              <div class="qz-item-bullet qz-bullet--cyan">
                                <ion-icon :icon="createOutline"></ion-icon>
                              </div>
                              <span class="qz-item-label">{{
                                actividad.name
                              }}</span>
                            </div>
                            <span
                              v-if="
                                actividadesPendientes.includes(actividad.id)
                              "
                              class="qz-warning-chip"
                            >
                              <ion-icon :icon="alertCircleOutline"></ion-icon>
                              <span>Pendiente</span>
                            </span>
                            <div class="qz-item-arrow">
                              <ion-icon
                                :icon="chevronForwardOutline"
                              ></ion-icon>
                            </div>
                          </div>
                        </div>

                        <!-- Botón Opciones de Actividad para Profesores -->
                        <button
                          v-if="adminOProfesor"
                          type="button"
                          class="qz-add-item-btn"
                          @click="presentActivityCreationOptions(leccion.id)"
                        >
                          <ion-icon :icon="addCircleOutline"></ion-icon>
                          <span>Opciones de Actividad</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>

            <!-- Estado Vacío -->
            <div v-else class="qz-empty-card">
              <div class="qz-empty-icon-box">
                <ion-icon :icon="bookOutline"></ion-icon>
              </div>
              <h3 class="qz-empty-title">Sin lecciones disponibles</h3>
              <p class="qz-empty-desc">
                No se han registrado lecciones o actividades para esta área en
                el periodo seleccionado.
              </p>
              <button
                v-if="adminOProfesor && curso && area"
                type="button"
                class="qz-empty-action-btn"
                @click="presentCreateLessonOptions"
              >
                <ion-icon :icon="addOutline"></ion-icon>
                <span>{{ createLabel }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref, computed } from "vue";
import {
  tokenHeader,
  usuarioGet,
  adminOprofesor,
  basedeURL,
  selectedPeriod,
  selectedYear,
  LessonType,
} from "../globalService";
import { useRoute, useRouter } from "vue-router";
import {
  addOutline,
  addCircleOutline,
  arrowBackOutline,
  calendarOutline,
  createOutline,
  folderOpenOutline,
  documentTextOutline,
  helpCircleOutline,
  checkboxOutline,
  flashOutline,
  chevronForwardOutline,
  chevronDownOutline,
  chevronUpOutline,
  alertCircleOutline,
  bookOutline,
} from "ionicons/icons";
import MaterialModal from "../components/MaterialModal.vue";
import MaterialSelectionModal from "../components/MaterialSelectionModal.vue";
import ImportActivityModal from "../components/ImportActivityModal.vue";
import DuplicateLessonModal from "../components/DuplicateLessonModal.vue";
import {
  actionSheetController,
  modalController,
  onIonViewWillEnter,
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
} from "@ionic/vue";

export default {
  name: "LeccionesAreaPage",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonSpinner,
  },
  setup() {
    const mroute = useRoute();
    const router = useRouter();
    const { curso, area } = mroute.params;
    const { year, periodo, lessonType: lessonTypeParam } = mroute.params;
    const lessonType = lessonTypeParam || LessonType.STANDARD;

    const backendUrl = basedeURL();
    const cursosUsuario = ref(
      JSON.parse(localStorage.getItem("cursosUsuario")),
    );
    const usuario = ref();
    const adminOProfesor = ref(false);
    const lecciones = ref([]);
    const leccionesConCuestionariosPendientes = ref([]);
    const leccionesConActividadesPendientes = ref([]);
    const cuestionariosPendientes = ref([]);
    const actividadesPendientes = ref([]);
    const materialsList = ref([]);
    const cuestionariosList = ref([]);
    const actvitiesList = ref([]);

    const isLoadingMaterials = ref(false);
    const isLoadingCuestionarios = ref(false);
    const isLoadingActivities = ref(false);

    const openedLessonId = ref(null);
    const openedSection = ref(null);
    const expandedLessonIds = ref([]);

    const isLessonExpanded = (lessonId) => {
      return expandedLessonIds.value.includes(lessonId);
    };

    const toggleLessonCard = (lessonId) => {
      const index = expandedLessonIds.value.indexOf(lessonId);
      if (index > -1) {
        expandedLessonIds.value.splice(index, 1);
      } else {
        expandedLessonIds.value.push(lessonId);
      }
    };

    const allExpanded = computed(() => {
      return (
        lecciones.value.length > 0 &&
        expandedLessonIds.value.length === lecciones.value.length
      );
    });

    const toggleAllLessons = () => {
      if (allExpanded.value) {
        expandedLessonIds.value = [];
      } else {
        expandedLessonIds.value = lecciones.value.map((l) => l.id);
      }
    };

    const formatFecha = (dateStr) => {
      if (!dateStr) return "";
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr.substring(0, 10);
        return d.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      } catch (e) {
        return dateStr.substring(0, 10);
      }
    };

    const createUrl = computed(() => {
      if (
        lessonType === LessonType.REINFORCEMENT ||
        lessonType === LessonType.REMEDIAL
      ) {
        return `/create-special-lesson/${lessonType}/${curso}/${area}/${year}/${periodo}`;
      }
      return `/crear/leccion/${curso}/${area}/${year}`;
    });

    const createLabel = computed(() => {
      if (lessonType === LessonType.REINFORCEMENT) return "Crear Refuerzo";
      if (lessonType === LessonType.REMEDIAL) return "Crear Nivelación";
      return "Crear Lección";
    });

    const cursoActual = computed(() => {
      if (cursosUsuario.value && curso) {
        return cursosUsuario.value.find((c) => c.id == curso);
      }
      return null;
    });

    const pageTitle = computed(() => {
      if (lessonType === LessonType.REINFORCEMENT) return "Refuerzos";
      if (lessonType === LessonType.REMEDIAL) return "Nivelaciones";
      return "Lecciones";
    });

    const getEditUrl = (leccion) => {
      if (
        lessonType === LessonType.REINFORCEMENT ||
        lessonType === LessonType.REMEDIAL
      ) {
        return `/create-special-lesson/${lessonType}/${curso}/${area}/${year}/${periodo}/${leccion.id}`;
      }
      return `/crear/leccion/${leccion.id}`;
    };

    const goToEdit = (leccion) => {
      router.push(getEditUrl(leccion));
    };

    const goToEditMaterial = (leccionId, materialId) => {
      router.push(`/crear/material/${leccionId}/${materialId}`);
    };

    const goToCreateQuiz = (leccionId) => {
      router.push(`/crear/cuestionario/${leccionId}`);
    };

    const navigateToQuiz = (cuestionario) => {
      localStorage.setItem("quizSelected", JSON.stringify(cuestionario));
      router.push(cuestionario.url);
    };

    const navigateToActivity = (actividad) => {
      router.push(actividad.url);
    };

    const goBack = () => {
      if (curso) {
        router.push(`/areas/${curso}`);
      } else if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/admin/cuestionarios");
      }
    };

    const openMaterial = async (material) => {
      const modal = await modalController.create({
        component: MaterialModal,
        componentProps: {
          material: {
            id: material.id,
            name: material.name,
            type: material.type,
            url: backendUrl + material.url,
            lesson: material.lesson,
            title: material.title,
            content: material.content,
          },
        },
      });
      modal.present();
    };

    const toggleSection = (leccionId, section) => {
      if (!expandedLessonIds.value.includes(leccionId)) {
        expandedLessonIds.value.push(leccionId);
      }
      if (
        openedLessonId.value === leccionId &&
        openedSection.value === section
      ) {
        openedLessonId.value = null;
        openedSection.value = null;
      } else {
        openedLessonId.value = leccionId;
        openedSection.value = section;
        switch (section) {
          case "materiales":
            materialesConsulta(leccionId);
            break;
          case "cuestionarios":
            cuestionarioConsulta(leccionId);
            break;
          case "actividades":
            actividadesConsulta(leccionId);
            break;
        }
      }
    };

    const cuestionarioConsulta = async (lessonId) => {
      isLoadingCuestionarios.value = true;
      cuestionariosList.value = [];
      await axios
        .get(`/lessons/${lessonId}/quizzes`)
        .then((response) => {
          cuestionariosList.value = response.data
            .map((cuestionario) => ({
              id: cuestionario.id,
              name: cuestionario.title,
              lesson: cuestionario.lesson,
              url: `/cuestionario/${cuestionario.id}`,
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        })
        .catch((error) => {
          console.error("Error fetching quizzes:", error);
          cuestionariosList.value = [];
        })
        .finally(() => {
          isLoadingCuestionarios.value = false;
        });
    };

    const materialesConsulta = async (lessonId) => {
      isLoadingMaterials.value = true;
      materialsList.value = [];
      await axios
        .get(`/materials?lessonId=${lessonId}`)
        .then((response) => {
          materialsList.value = response.data
            .map((material) => ({
              ...material,
              name: material.title,
            }))
            .sort((a, b) => {
              if (a.createdAt && b.createdAt) {
                return new Date(a.createdAt) - new Date(b.createdAt);
              }
              return (a.id || 0) - (b.id || 0);
            });
        })
        .catch((error) => {
          console.error("Error fetching materials:", error);
          materialsList.value = [];
        })
        .finally(() => {
          isLoadingMaterials.value = false;
        });
    };

    const actividadesConsulta = async (lessonId) => {
      isLoadingActivities.value = true;
      actvitiesList.value = [];
      await axios
        .get(`/activities?lessonId=${lessonId}`)
        .then((response) => {
          actvitiesList.value = response.data.map((actividad) => ({
            id: actividad.id,
            name: actividad.title,
            url: `/actividades/${actividad.id}`,
          }));
        })
        .catch((error) => {
          console.error("Error fetching activities:", error);
          actvitiesList.value = [];
        })
        .finally(() => {
          isLoadingActivities.value = false;
        });
    };

    const presentMaterialCreationOptions = async (lessonId) => {
      const actionSheet = await actionSheetController.create({
        header: "Opciones de Material",
        buttons: [
          {
            text: "Crear Material Nuevo",
            handler: () => {
              router.push(`/crear/material/${lessonId}`);
            },
          },
          {
            text: "Copiar Material Existente",
            handler: async () => {
              const modal = await modalController.create({
                component: MaterialSelectionModal,
                componentProps: {
                  area: area,
                },
              });
              await modal.present();

              const { data: selectedMaterial } = await modal.onWillDismiss();

              if (selectedMaterial) {
                sessionStorage.setItem(
                  "copiedMaterial",
                  JSON.stringify(selectedMaterial),
                );
                router.push(`/crear/material/${lessonId}`);
              }
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
          },
        ],
      });
      await actionSheet.present();
    };

    const presentCreateLessonOptions = async () => {
      const actionSheet = await actionSheetController.create({
        header: "Opciones de Lección",
        buttons: [
          {
            text: "Crear Lección Nueva",
            handler: () => {
              router.push(createUrl.value);
            },
          },
          {
            text: "Importar Lección",
            handler: async () => {
              const modal = await modalController.create({
                component: DuplicateLessonModal,
                componentProps: {
                  currentCourseId: parseInt(curso),
                  currentAreaId: parseInt(area),
                  currentPeriodId: periodo,
                  currentYear: parseInt(year),
                  lessonType: lessonType,
                },
              });
              await modal.present();

              const { data } = await modal.onWillDismiss();
              if (data && data.imported) {
                const storedYearVal = selectedYear();
                const storedPeriodoVal = localStorage.getItem("periodoSelected")
                  ? JSON.parse(localStorage.getItem("periodoSelected"))
                  : null;

                const res = await axios.get(
                  `/lessons?courseId=${curso}&areaId=${area}&periodId=${
                    periodo || storedPeriodoVal
                  }${
                    year || storedYearVal
                      ? "&year=" + (year || storedYearVal)
                      : ""
                  }&exist=true&type=${lessonType}`,
                );
                lecciones.value = res.data
                  .map((l) => ({
                    id: l.id,
                    topic: l.topic,
                    date: l.date,
                    area: { id: l.area.id },
                    course: { id: l.course.id },
                    year: l.year,
                    type: l.type,
                  }))
                  .sort(
                    (a, b) =>
                      new Date(b.date) - new Date(a.date) || b.id - a.id,
                  );

                if (
                  lecciones.value.length > 0 &&
                  expandedLessonIds.value.length === 0
                ) {
                  expandedLessonIds.value = [lecciones.value[0].id];
                }
              }
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
          },
        ],
      });
      await actionSheet.present();
    };

    const presentActivityCreationOptions = async (lessonId) => {
      const actionSheet = await actionSheetController.create({
        header: "Opciones de Actividad",
        buttons: [
          {
            text: "Crear Actividad Nueva",
            handler: () => {
              router.push(`/crear/actividad/${lessonId}`);
            },
          },
          {
            text: "Importar Actividad",
            handler: async () => {
              const modal = await modalController.create({
                component: ImportActivityModal,
                componentProps: {
                  targetLessonId: lessonId,
                },
              });
              await modal.present();

              const { data } = await modal.onWillDismiss();
              if (data && data.imported) {
                actividadesConsulta(lessonId);
              }
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
          },
        ],
      });
      await actionSheet.present();
    };

    onIonViewWillEnter(async () => {
      adminOProfesor.value = adminOprofesor();
      usuario.value = usuarioGet();
      tokenHeader();

      if (adminOProfesor.value) {
        try {
          const response = await axios.get(`/quizzes/pending-grading`, {
            params: {
              courseId: curso,
              periodId: selectedPeriod(),
              year: year,
              category: "regular",
              instituteId: usuario.value.institute.id,
            },
          });

          leccionesConCuestionariosPendientes.value = response.data.map(
            (quiz) => quiz.lesson.id,
          );
          cuestionariosPendientes.value = response.data.map((quiz) => quiz.id);
        } catch (error) {
          console.error("Error fetching pending quizzes:", error);
        }

        try {
          const response = await axios.get(`/activities/pending-grading`, {
            params: {
              courseId: curso,
              year: year,
              periodId: selectedPeriod(),
              instituteId: usuario.value.institute.id,
            },
          });
          leccionesConActividadesPendientes.value = response.data.map(
            (activity) => activity.lesson.id,
          );
          actividadesPendientes.value = response.data.map(
            (activity) => activity.id,
          );
        } catch (error) {
          console.error("Error fetching pending activities:", error);
        }
      }

      const storedYearVal = selectedYear();
      const storedPeriodoVal = localStorage.getItem("periodoSelected")
        ? JSON.parse(localStorage.getItem("periodoSelected"))
        : null;

      if (!adminOprofesor()) {
        const currentCourseFromUrl = cursosUsuario.value.find(
          (c) => c.id == curso,
        );

        if (!currentCourseFromUrl || !currentCourseFromUrl.active) {
          let targetCourse = cursosUsuario.value.find(
            (c) => c.year == (year || storedYearVal) && c.active,
          );

          if (!targetCourse) {
            targetCourse = cursosUsuario.value.find((c) => c.active);
          }

          if (targetCourse) {
            router.push(
              `/lecciones/${targetCourse.id}/${area}/${
                periodo || storedPeriodoVal
              }/${year || storedYearVal}/${lessonType}`,
            );
          }
        }
      }

      await axios
        .get(
          `/lessons?courseId=${curso}&areaId=${area}&periodId=${
            periodo || storedPeriodoVal
          }${
            year || storedYearVal ? "&year=" + (year || storedYearVal) : ""
          }&exist=true&type=${lessonType}`,
        )
        .then((response) => {
          lecciones.value = response.data
            .map((leccion) => ({
              id: leccion.id,
              topic: leccion.topic,
              date: leccion.date,
              area: { id: leccion.area.id },
              course: { id: leccion.course.id },
              year: leccion.year,
              type: leccion.type,
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

          if (
            lecciones.value.length > 0 &&
            expandedLessonIds.value.length === 0
          ) {
            expandedLessonIds.value = [lecciones.value[0].id];
          }
        });

      if (
        openedLessonId.value &&
        !expandedLessonIds.value.includes(openedLessonId.value)
      ) {
        expandedLessonIds.value.push(openedLessonId.value);
      }

      if (openedLessonId.value && openedSection.value === "materiales") {
        await materialesConsulta(openedLessonId.value);
      }
    });

    return {
      adminOProfesor,
      area,
      curso,
      cursoActual,
      lecciones,
      pageTitle,
      createLabel,
      lessonType,
      openedLessonId,
      openedSection,
      materialsList,
      cuestionariosList,
      actvitiesList,
      isLoadingMaterials,
      isLoadingCuestionarios,
      isLoadingActivities,
      leccionesConCuestionariosPendientes,
      leccionesConActividadesPendientes,
      cuestionariosPendientes,
      actividadesPendientes,
      formatFecha,
      goToEdit,
      goToEditMaterial,
      goToCreateQuiz,
      navigateToQuiz,
      navigateToActivity,
      goBack,
      openMaterial,
      toggleSection,
      expandedLessonIds,
      isLessonExpanded,
      toggleLessonCard,
      allExpanded,
      toggleAllLessons,
      presentMaterialCreationOptions,
      presentCreateLessonOptions,
      presentActivityCreationOptions,
      arrowBackOutline,
      addOutline,
      addCircleOutline,
      calendarOutline,
      createOutline,
      folderOpenOutline,
      documentTextOutline,
      helpCircleOutline,
      checkboxOutline,
      flashOutline,
      chevronForwardOutline,
      chevronDownOutline,
      chevronUpOutline,
      alertCircleOutline,
      bookOutline,
      year,
    };
  },
};
</script>

<style scoped>
.qz-lecciones-page {
  background-color: var(--qz-color-purple-bg, #efeefc);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.qz-lecciones-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;
}

/* 1. CABECERA HERO QUEEZY PÚRPURA */
.qz-hero-header {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 85%, #efeefc 100%);
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: 22px;
  flex-shrink: 0;
}

.qz-hero-top {
  max-width: 540px;
  margin: 0 auto;
  padding: 8px 18px 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-back-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: var(--qz-radius-full, 9999px);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-back-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
}

.qz-create-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  color: var(--ion-color-primary, #6a5ae0);
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 8px 16px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.qz-create-btn:active {
  transform: scale(0.95);
}

.qz-hero-titles {
  max-width: 540px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: left;
}

.qz-hero-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
}

.qz-hero-title {
  margin: 3px 0 4px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.4px;
}

.qz-hero-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

/* 2. CUERPO PRINCIPAL */
.qz-main-body {
  flex: 1;
  padding: 8px 18px 28px 18px;
}

.qz-container {
  max-width: 540px;
  margin: 0 auto;
}

.qz-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 0 4px;
  gap: 12px;
}

.qz-section-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.qz-toggle-all-btn {
  background: #ffffff;
  border: 1px solid rgba(106, 90, 224, 0.16);
  color: var(--ion-color-primary, #6a5ae0);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 5px 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(106, 90, 224, 0.06);
  flex-shrink: 0;
}

.qz-toggle-all-btn:active {
  transform: scale(0.95);
  background: #efeefc;
}

.qz-section-title {
  margin: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 19px;
  font-weight: 800;
  color: #0c092a;
  letter-spacing: -0.3px;
}

.qz-section-badge {
  background: #ffffff;
  color: var(--ion-color-primary, #6a5ae0);
  font-size: 12px;
  font-weight: 700;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 3px 10px;
  box-shadow: 0 2px 8px rgba(106, 90, 224, 0.08);
}

/* Lista de Tarjetas de Lección */
.qz-lessons-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-lesson-card {
  background: #ffffff;
  border-radius: var(--qz-radius-xl, 24px);
  padding: 16px;
  box-shadow: 0 6px 20px -4px rgba(106, 90, 224, 0.08);
  border: 1px solid rgba(106, 90, 224, 0.04);
  transition: padding 0.2s ease, box-shadow 0.2s ease;
}

.qz-lesson-card.is-collapsed {
  padding: 12px 16px;
}

.qz-lesson-card.is-collapsed:hover {
  box-shadow: 0 8px 24px -4px rgba(106, 90, 224, 0.14);
}

/* Encabezado de la Tarjeta */
.qz-lesson-card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0eefc;
  cursor: pointer;
  user-select: none;
  transition: padding 0.2s ease, border-color 0.2s ease;
}

.qz-lesson-card-header.is-collapsed {
  padding-bottom: 0;
  border-bottom: 1px solid transparent;
}

/* Fila Superior: Fecha a la izquierda y Botones de acción a la derecha */
.qz-lesson-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.qz-lesson-date-group {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: nowrap;
}

.qz-lesson-date {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  color: #858494;
  text-transform: capitalize;
  white-space: nowrap;
}

.qz-lesson-date ion-icon {
  font-size: 15px;
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-lesson-topic {
  margin: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 17px;
  font-weight: 800;
  color: #0c092a;
  letter-spacing: -0.2px;
  line-height: 1.35;
}

.qz-lesson-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.qz-edit-lesson-btn {
  background: #efeefc;
  color: var(--ion-color-primary, #6a5ae0);
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-edit-lesson-btn:active {
  transform: scale(0.92);
  background: #e0dcfa;
}

.qz-card-chevron {
  width: 32px;
  height: 32px;
  border-radius: var(--qz-radius-full, 9999px);
  background: #f4f3fd;
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    background 0.15s ease;
  flex-shrink: 0;
}

.qz-card-chevron.is-open {
  transform: rotate(180deg);
  background: #efeefc;
}

/* Animación de apertura y cierre de subsecciones */
.qz-expand-enter-active,
.qz-expand-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.qz-expand-enter-from,
.qz-expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}

.qz-expand-enter-to,
.qz-expand-leave-from {
  opacity: 1;
  max-height: 1200px;
  transform: translateY(0);
}

/* Contenedor de Módulos Apilados (Opción 2) */
.qz-modules-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.qz-module-block {
  display: flex;
  flex-direction: column;
}

/* Fila interactiva del Módulo */
.qz-module-row {
  background: #f9f9fe;
  border: 1px solid #eceaf9;
  border-radius: var(--qz-radius-lg, 16px);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease, border-color 0.15s ease,
    transform 0.15s ease;
}

.qz-module-row:active {
  transform: scale(0.985);
}

.qz-module-row.is-expanded {
  background: #efeefc;
  border-color: #d6d1f9;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

/* Iconos de Módulo */
.qz-module-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  flex-shrink: 0;
}

.qz-icon--purple {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-icon--coral {
  background: #ffeaea;
  color: #ff7562;
}

.qz-icon--cyan {
  background: #e2f6fc;
  color: #0582ca;
}

.qz-module-info {
  flex: 1;
  min-width: 0;
}

.qz-module-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qz-module-title {
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 700;
  color: #0c092a;
}

.qz-alert-pill {
  background: #fff1df;
  color: #e58700;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 9999px;
  border: 1px solid #ffe2be;
}

.qz-module-desc {
  margin-top: 1px;
  font-size: 11px;
  color: #858494;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-module-chevron {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9d9bb0;
  font-size: 15px;
  transition: transform 0.2s ease, color 0.15s ease;
  flex-shrink: 0;
}

.qz-module-chevron.is-open {
  transform: rotate(90deg);
  color: var(--ion-color-primary, #6a5ae0);
}

/* Cajón Desplegable del Módulo */
.qz-expanded-drawer {
  background: #f4f3fd;
  border: 1px solid #d6d1f9;
  border-top: none;
  border-radius: 0 0 var(--qz-radius-lg, 16px) var(--qz-radius-lg, 16px);
  padding: 10px 10px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: qz-slide-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes qz-slide-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.qz-loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 0;
  font-size: 12px;
  color: #858494;
}

.qz-empty-module-box {
  text-align: center;
  padding: 14px 8px;
  color: #858494;
}

.qz-empty-module-icon {
  font-size: 26px;
  color: #afaac8;
  margin-bottom: 4px;
}

.qz-empty-module-box p {
  margin: 0;
  font-size: 12px;
}

/* Grupo de Items Desplegados */
.qz-items-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-item-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  box-shadow: 0 2px 6px rgba(106, 90, 224, 0.05);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.qz-item-card:active {
  transform: scale(0.985);
}

.qz-item-clickable {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.qz-item-bullet {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.qz-bullet--purple {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-bullet--coral {
  background: #ffeaea;
  color: #ff7562;
}

.qz-bullet--cyan {
  background: #e2f6fc;
  color: #0582ca;
}

.qz-item-label {
  font-size: 13px;
  font-weight: 600;
  color: #0c092a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-warning-chip {
  display: flex;
  align-items: center;
  gap: 3px;
  background: #fff1df;
  color: #e58700;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.qz-item-arrow {
  color: #9d9bb0;
  font-size: 15px;
  flex-shrink: 0;
}

.qz-item-action-btn {
  background: #efeefc;
  color: #6a5ae0;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

.qz-add-item-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  background: #ffffff;
  border: 1px dashed #6a5ae0;
  border-radius: 12px;
  padding: 9px;
  color: var(--ion-color-primary, #6a5ae0);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 4px;
  transition: background 0.15s ease, transform 0.15s ease;
}

.qz-add-item-btn:active {
  background: #efeefc;
  transform: scale(0.98);
}

/* Estado Vacío de Lecciones */
.qz-empty-card {
  background: #ffffff;
  border-radius: var(--qz-radius-2xl, 28px);
  padding: 36px 24px;
  text-align: center;
  box-shadow: 0 8px 24px -4px rgba(106, 90, 224, 0.08);
  margin-top: 10px;
}

.qz-empty-icon-box {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin: 0 auto 16px auto;
}

.qz-empty-title {
  margin: 0 0 8px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 18px;
  font-weight: 700;
  color: #0c092a;
}

.qz-empty-desc {
  margin: 0 0 18px 0;
  font-size: 14px;
  color: #858494;
  line-height: 1.5;
}

.qz-empty-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 10px 22px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.3);
  transition: transform 0.15s ease;
}

.qz-empty-action-btn:active {
  transform: scale(0.96);
}
</style>
