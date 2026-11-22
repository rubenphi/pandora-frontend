<template>
  <ion-page class="ion-page qz-permissions-page">
    <!-- BARRA SUPERIOR FIJA QUEEZY -->
    <ion-header class="ion-no-border qz-sticky-header">
      <div class="qz-hero-top">
        <!-- Botón Volver -->
        <button
          type="button"
          class="qz-back-btn"
          title="Regresar a la actividad"
          @click="goBack"
        >
          <ion-icon :icon="arrowBackOutline"></ion-icon>
        </button>

        <!-- Píldora de Conteo -->
        <div class="qz-hero-pills">
          <span
            class="qz-summary-pill"
            :title="
              selectedTab === 'grupos'
                ? `${allGroups.length} agrupaciones disponibles`
                : `${students.length} estudiantes inscritos`
            "
          >
            <ion-icon
              :icon="selectedTab === 'grupos' ? peopleOutline : personOutline"
            ></ion-icon>
            <template v-if="selectedTab === 'grupos'">
              {{ allGroups.length }}
              <span class="qz-pill-label-full">{{
                allGroups.length === 1 ? "grupo" : "grupos"
              }}</span>
              <span class="qz-pill-label-short">eq.</span>
            </template>
            <template v-else>
              {{ students.length }}
              <span class="qz-pill-label-full">{{
                students.length === 1 ? "estudiante" : "estudiantes"
              }}</span>
              <span class="qz-pill-label-short">est.</span>
            </template>
          </span>
        </div>

        <!-- Botón Circular Guardar en Barra Superior -->
        <div class="qz-hero-actions">
          <button
            type="button"
            class="qz-save-hero-btn"
            title="Guardar todos los permisos"
            aria-label="Guardar permisos"
            @click="savePermissions"
            :disabled="isLoading"
          >
            <ion-spinner
              v-if="isLoading"
              name="crescent"
              class="qz-btn-spinner"
            ></ion-spinner>
            <ion-icon v-else :icon="saveOutline"></ion-icon>
          </button>
        </div>
      </div>
    </ion-header>

    <ion-content :fullscreen="true" class="qz-permissions-content">
      <div class="qz-page-wrapper">
        <!-- 1. BANNER HERO QUEEZY PÚRPURA -->
        <div class="qz-hero-banner">
          <div class="qz-hero-titles">
            <span class="qz-hero-tag">
              CO-EVALUACIÓN Y AUTOEVALUACIÓN
              <template v-if="gradeName || areaName">
                · {{ [gradeName, areaName].filter(Boolean).join(" - ") }}
              </template>
            </span>
            <h1 class="qz-hero-title">Configuración de Permisos</h1>
            <p class="qz-hero-subtitle">
              {{
                activityTopic
                  ? `Actividad: ${activityTopic}`
                  : "Define qué grupos o estudiantes evaluarán el trabajo de sus pares o realizarán autoevaluación."
              }}
            </p>
          </div>
        </div>

        <!-- 2. CUERPO PRINCIPAL -->
        <div class="qz-main-body">
          <div class="qz-container">
            <!-- Selector de Pestañas Queezy (Segment) -->
            <div class="qz-segment-wrap">
              <ion-segment
                :value="selectedTab"
                @ionChange="handleTabChange"
                class="qz-segment"
              >
                <ion-segment-button
                  value="grupos"
                  layout="icon-start"
                  class="qz-segment-btn"
                >
                  <ion-icon :icon="peopleOutline"></ion-icon>
                  <ion-label>
                    <span class="qz-seg-label-full">Permisos Grupales</span>
                    <span class="qz-seg-label-short">Grupales</span>
                    <span
                      class="qz-segment-count"
                      :class="{ 'qz-segment-count--zero': allGroups.length === 0 }"
                    >
                      {{ allGroups.length }}
                    </span>
                  </ion-label>
                </ion-segment-button>
                <ion-segment-button
                  value="individuales"
                  layout="icon-start"
                  class="qz-segment-btn"
                >
                  <ion-icon :icon="personOutline"></ion-icon>
                  <ion-label>
                    <span class="qz-seg-label-full">Permisos Individuales</span>
                    <span class="qz-seg-label-short">Individuales</span>
                    <span class="qz-segment-count" v-if="students.length">
                      {{ students.length }}
                    </span>
                  </ion-label>
                </ion-segment-button>
              </ion-segment>
            </div>

            <!-- Barra de Acciones Rápidas (Toolbox) -->
            <div
              v-if="selectedTab !== 'grupos' || allGroups.length > 0"
              class="qz-toolbox-card"
            >
              <div class="qz-toolbox-header">
                <span class="qz-toolbox-title">Asignación Rápida</span>
                <span class="qz-toolbox-caption">
                  {{
                    selectedTab === "grupos"
                      ? "Para equipos y grupos libres"
                      : "Para estudiantes individuales"
                  }}
                </span>
              </div>
              <div class="qz-toolbox-actions">
                <button
                  type="button"
                  class="qz-tool-pill qz-tool-pill--primary"
                  @click="assignAllSelfEvaluation"
                  title="Todos evalúan su propio trabajo"
                >
                  <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                  <span>Autoevaluar Todos</span>
                </button>
                <button
                  type="button"
                  class="qz-tool-pill qz-tool-pill--secondary"
                  @click="assignRandomly"
                  :title="selectedTab === 'grupos' && allGroups.length === 1 ? 'Requiere mínimo 2 grupos con entrega' : 'Asignación circular cruzada aleatoria'"
                  :class="{ 'qz-tool-pill--disabled': selectedTab === 'grupos' && allGroups.length === 1 }"
                >
                  <ion-icon :icon="shuffleOutline"></ion-icon>
                  <span>Aleatorio Cruzado</span>
                </button>
                <button
                  type="button"
                  class="qz-tool-pill qz-tool-pill--danger"
                  @click="removeAllPermissions"
                  title="Limpiar todas las asignaciones"
                >
                  <ion-icon :icon="trashOutline"></ion-icon>
                  <span>Quitar Todos</span>
                </button>
              </div>
            </div>

            <!-- Estado de Carga Inicial -->
            <div v-if="isLoadingData" class="qz-loading-state">
              <ion-spinner
                name="crescent"
                class="qz-main-spinner"
              ></ion-spinner>
              <p>Cargando información de grupos y estudiantes...</p>
            </div>

            <!-- CONTENIDO PESTAÑA: PERMISOS GRUPALES -->
            <div v-else-if="selectedTab === 'grupos'" class="qz-tab-content">
              <!-- Estado Vacío: Sin Grupos con Entrega -->
              <div v-if="allGroups.length === 0" class="qz-empty-card">
                <div class="qz-empty-icon-box qz-empty-icon-box--warning">
                  <ion-icon :icon="alertCircleOutline"></ion-icon>
                </div>
                <h3 class="qz-empty-title">Sin entregas en grupo en esta actividad</h3>
                <p class="qz-empty-desc">
                  Esta actividad no tiene entregas grupales registradas. No se pueden otorgar permisos grupales porque no podemos calificar grupalmente ni otorgar permisos grupales a entregas sin grupo.
                </p>
                <button
                  type="button"
                  class="qz-outline-action-btn"
                  @click="selectedTab = 'individuales'"
                >
                  Ir a Permisos Individuales
                </button>
              </div>

              <!-- Lista de Grupos con Entrega Registrada -->
              <div v-else class="qz-groups-section">
                <!-- Alerta visual si solo hay 1 grupo con entrega -->
                <div v-if="allGroups.length === 1" class="qz-alert-banner qz-alert-banner--warning">
                  <div class="qz-alert-icon">
                    <ion-icon :icon="warningOutline"></ion-icon>
                  </div>
                  <div class="qz-alert-content">
                    <strong>Solo hay 1 grupo con entrega registrada</strong>
                    <p>
                      Para que un grupo evalúe a otro se requieren mínimo 2 grupos con entrega en la actividad. Con 1 solo grupo no es posible asignar co-evaluación entre pares, pero sí puedes habilitarle <strong>Autoevaluación</strong> para que sus integrantes califiquen su trabajo.
                    </p>
                  </div>
                </div>
                <!-- 1. Equipos del Curso -->
                <div v-if="courseGroups.length > 0" class="qz-group-cluster">
                  <div class="qz-cluster-header">
                    <span class="qz-cluster-badge qz-cluster-badge--course">
                      <ion-icon :icon="layersOutline"></ion-icon>
                      Equipos del Curso ({{ courseGroups.length }})
                    </span>
                    <span class="qz-cluster-desc"
                      >Equipos oficiales definidos en el curso</span
                    >
                  </div>

                  <div class="qz-cards-grid">
                    <div
                      v-for="group in courseGroups"
                      :key="group.id"
                      class="qz-perm-card"
                    >
                      <div class="qz-perm-card-top">
                        <div class="qz-perm-avatar qz-perm-avatar--course">
                          <ion-icon :icon="peopleOutline"></ion-icon>
                        </div>
                        <div class="qz-perm-info">
                          <div class="qz-perm-title-row">
                            <h3 class="qz-perm-name">{{ group.name }}</h3>
                            <span class="qz-type-chip qz-type-chip--course"
                              >Equipo</span
                            >
                          </div>
                          <p
                            class="qz-perm-members"
                            v-if="group.members && group.members.length"
                          >
                            <strong
                              >Integrantes ({{ group.members.length }}):</strong
                            >
                            {{
                              group.members
                                .map((m) =>
                                  `${m.name} ${m.lastName || ""}`.trim(),
                                )
                                .join(", ")
                            }}
                          </p>
                        </div>
                      </div>

                      <div class="qz-perm-selector-row">
                        <label class="qz-field-label">
                          <ion-icon :icon="arrowForwardOutline"></ion-icon>
                          <span>Evaluará a:</span>
                        </label>
                        <div class="qz-select-wrapper">
                          <ion-select
                            v-model="groupPermissions[group.id]"
                            interface="action-sheet"
                            placeholder="Seleccionar revisado"
                            :interface-options="{
                              header: 'Asignar a quién evalúa',
                              subHeader: `Revisor: ${group.name}`,
                            }"
                          >
                            <ion-select-option :value="-1"
                              >Ninguno (Sin evaluar)</ion-select-option
                            >
                            <ion-select-option :value="group.id">
                              {{ group.name }} (Autoevaluación)
                            </ion-select-option>
                            <ion-select-option
                              v-for="reviserGroup in getAvailableReviserGroups(
                                group.id,
                              ).filter(
                                (g) => String(g.id) !== String(group.id),
                              )"
                              :key="reviserGroup.id"
                              :value="reviserGroup.id"
                            >
                              {{
                                reviserGroup.isFreeGroup
                                  ? `Grupo Libre: ${reviserGroup.shortName}`
                                  : reviserGroup.name
                              }}
                            </ion-select-option>
                          </ion-select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 2. Grupos Libres de la Actividad -->
                <div v-if="freeGroups.length > 0" class="qz-group-cluster">
                  <div class="qz-cluster-header">
                    <span class="qz-cluster-badge qz-cluster-badge--free">
                      <ion-icon :icon="peopleCircleOutline"></ion-icon>
                      Grupos Libres de la Actividad ({{ freeGroups.length }})
                    </span>
                    <span class="qz-cluster-desc"
                      >Estudiantes que entregaron juntos en esta actividad</span
                    >
                  </div>

                  <div class="qz-cards-grid">
                    <div
                      v-for="group in freeGroups"
                      :key="group.id"
                      class="qz-perm-card qz-perm-card--free"
                    >
                      <div class="qz-perm-card-top">
                        <div class="qz-perm-avatar qz-perm-avatar--free">
                          <ion-icon :icon="peopleCircleOutline"></ion-icon>
                        </div>
                        <div class="qz-perm-info">
                          <div class="qz-perm-title-row">
                            <h3 class="qz-perm-name">
                              {{ group.shortName || group.name }}
                            </h3>
                            <span class="qz-type-chip qz-type-chip--free"
                              >Grupo Libre</span
                            >
                          </div>
                          <p
                            class="qz-perm-members"
                            v-if="group.members && group.members.length"
                          >
                            <strong
                              >Integrantes ({{ group.members.length }}):</strong
                            >
                            {{
                              group.members
                                .map((m) =>
                                  `${m.name} ${m.lastName || ""}`.trim(),
                                )
                                .join(", ")
                            }}
                          </p>
                        </div>
                      </div>

                      <div class="qz-perm-selector-row">
                        <label class="qz-field-label">
                          <ion-icon :icon="arrowForwardOutline"></ion-icon>
                          <span>Evaluará a:</span>
                        </label>
                        <div class="qz-select-wrapper">
                          <ion-select
                            v-model="groupPermissions[group.id]"
                            interface="action-sheet"
                            placeholder="Seleccionar revisado"
                            :interface-options="{
                              header: 'Asignar a quién evalúa',
                              subHeader: `Revisor: Grupo Libre (${group.shortName})`,
                            }"
                          >
                            <ion-select-option :value="-1"
                              >Ninguno (Sin evaluar)</ion-select-option
                            >
                            <ion-select-option :value="group.id">
                              Grupo Libre (Autoevaluación de Integrantes)
                            </ion-select-option>
                            <ion-select-option
                              v-for="reviserGroup in getAvailableReviserGroups(
                                group.id,
                              ).filter(
                                (g) => String(g.id) !== String(group.id),
                              )"
                              :key="reviserGroup.id"
                              :value="reviserGroup.id"
                            >
                              {{
                                reviserGroup.isFreeGroup
                                  ? `Grupo Libre: ${reviserGroup.shortName}`
                                  : reviserGroup.name
                              }}
                            </ion-select-option>
                          </ion-select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- CONTENIDO PESTAÑA: PERMISOS INDIVIDUALES -->
            <div
              v-else-if="selectedTab === 'individuales'"
              class="qz-tab-content"
            >
              <!-- Estado Vacío: Sin Estudiantes -->
              <div v-if="students.length === 0" class="qz-empty-card">
                <div class="qz-empty-icon-box">
                  <ion-icon :icon="personOutline"></ion-icon>
                </div>
                <h3 class="qz-empty-title">No hay estudiantes inscritos</h3>
                <p class="qz-empty-desc">
                  No se encontraron estudiantes activos en este curso para el
                  año lectivo seleccionado.
                </p>
              </div>

              <!-- Lista de Estudiantes -->
              <div v-else class="qz-cards-grid">
                <div
                  v-for="student in students"
                  :key="student.id"
                  class="qz-perm-card"
                >
                  <div class="qz-perm-card-top">
                    <div class="qz-perm-avatar qz-perm-avatar--student">
                      <span>{{ getInitials(student) }}</span>
                    </div>
                    <div class="qz-perm-info">
                      <h3 class="qz-perm-name">
                        {{ student.lastName }} {{ student.name }}
                      </h3>
                      <p class="qz-perm-subtext">Estudiante</p>
                    </div>
                  </div>

                  <div class="qz-perm-selector-row">
                    <label class="qz-field-label">
                      <ion-icon :icon="arrowForwardOutline"></ion-icon>
                      <span>Evaluará a:</span>
                    </label>
                    <div class="qz-select-wrapper">
                      <ion-select
                        v-model="individualPermissions[student.id]"
                        interface="action-sheet"
                        placeholder="¿A quién revisa?"
                        :interface-options="{
                          header: 'Asignar a quién evalúa',
                          subHeader: `Revisor: ${student.name} ${student.lastName}`,
                        }"
                      >
                        <ion-select-option :value="-1"
                          >Ninguno (Sin evaluar)</ion-select-option
                        >
                        <ion-select-option :value="student.id">
                          {{ student.lastName }}
                          {{ student.name }} (Autoevaluación)
                        </ion-select-option>
                        <ion-select-option
                          v-for="reviserStudent in getAvailableReviserStudents(
                            student.id,
                          ).filter((s) => s.id !== student.id)"
                          :key="reviserStudent.id"
                          :value="reviserStudent.id"
                        >
                          {{ reviserStudent.lastName }}
                          {{ reviserStudent.name }}
                        </ion-select-option>
                      </ion-select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- BARRA INFERIOR DE GUARDADO -->
            <div class="qz-bottom-bar">
              <button
                type="button"
                class="qz-bottom-btn qz-bottom-btn--danger"
                @click="removeAllPermissions"
                :disabled="isLoading"
              >
                <ion-icon :icon="trashOutline"></ion-icon>
                <span>Quitar Todos</span>
              </button>
              <button
                type="button"
                class="qz-bottom-btn qz-bottom-btn--primary"
                @click="savePermissions"
                :disabled="isLoading"
              >
                <ion-spinner
                  v-if="isLoading"
                  name="crescent"
                  class="qz-btn-spinner-inline"
                ></ion-spinner>
                <template v-else>
                  <ion-icon :icon="saveOutline"></ion-icon>
                  <span>Guardar Permisos</span>
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Toasts de Notificación -->
      <ion-toast
        :is-open="isSuccessToastOpen"
        :message="successMessage"
        :duration="3000"
        color="success"
        @didDismiss="setSuccessToastOpen(false)"
      ></ion-toast>
      <ion-toast
        :is-open="isErrorToastOpen"
        :message="errorMessage"
        :duration="3500"
        color="danger"
        @didDismiss="setErrorToastOpen(false)"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { currentServerYear, tokenHeader } from "../globalService";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonSpinner,
  IonToast,
  alertController,
} from "@ionic/vue";
import {
  arrowBackOutline,
  saveOutline,
  peopleOutline,
  personOutline,
  checkmarkCircleOutline,
  shuffleOutline,
  trashOutline,
  peopleCircleOutline,
  arrowForwardOutline,
  layersOutline,
  warningOutline,
  alertCircleOutline,
} from "ionicons/icons";

export default {
  name: "ConfiguracionPermisos",
  components: {
    IonPage,
    IonHeader,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonSpinner,
    IonToast,
  },
  setup() {
    const selectedYear = currentServerYear();
    const route = useRoute();
    const router = useRouter();
    const activityId = ref(route.params.id);
    const selectedTab = ref("grupos");
    const courseId = ref(null);
    const year = ref(null);

    const activityTopic = ref("");
    const lessonTopic = ref("");
    const gradeName = ref("");
    const areaName = ref("");

    const courseGroups = ref([]);
    const freeGroups = ref([]);
    const allGroups = ref([]);
    const students = ref([]);

    const groupPermissions = ref({});
    const individualPermissions = ref({});
    const initialPermissions = ref([]);
    const isLoading = ref(false);
    const isLoadingData = ref(true);

    const isSuccessToastOpen = ref(false);
    const successMessage = ref("Permisos guardados correctamente");
    const setSuccessToastOpen = (
      val,
      msg = "Permisos guardados correctamente",
    ) => {
      isSuccessToastOpen.value = val;
      if (msg) successMessage.value = msg;
    };

    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const setErrorToastOpen = (val, message = "") => {
      isErrorToastOpen.value = val;
      errorMessage.value = message;
    };

    const hasAlertedSingleGroup = ref(false);

    const alertSingleGroup = async () => {
      const alert = await alertController.create({
        header: "Atención: Co-evaluación no disponible",
        subHeader: "Solo 1 grupo con entrega",
        message:
          "Para que un grupo evalúe a otro se requieren mínimo 2 grupos con entrega en la actividad. Con un solo grupo no es posible asignar co-evaluación entre pares, pero sí puedes habilitarle autoevaluación a sus integrantes.",
        buttons: ["Entendido"],
      });
      await alert.present();
    };

    const handleTabChange = (event) => {
      const newTab = event.detail.value;
      selectedTab.value = newTab;
      if (
        newTab === "grupos" &&
        allGroups.value.length === 1 &&
        !hasAlertedSingleGroup.value
      ) {
        hasAlertedSingleGroup.value = true;
        alertSingleGroup();
      }
    };

    const goBack = () => {
      router.push(`/actividades/${activityId.value}`);
    };

    const getInitials = (student) => {
      const first = student.name ? student.name.trim()[0] : "";
      const last = student.lastName ? student.lastName.trim()[0] : "";
      return (first + last).toUpperCase() || "?";
    };

    const getAvailableReviserGroups = (currentGroupId) => {
      const otherSelectedIds = Object.entries(groupPermissions.value)
        .filter(
          ([key, value]) =>
            String(key) !== String(currentGroupId) &&
            value !== -1 &&
            String(key) !== String(value),
        )
        .map(([, value]) => String(value));
      return allGroups.value.filter(
        (g) => !otherSelectedIds.includes(String(g.id)),
      );
    };

    const getAvailableReviserStudents = (currentStudentId) => {
      const otherSelectedIds = Object.entries(individualPermissions.value)
        .filter(
          ([key, value]) =>
            String(key) !== String(currentStudentId) &&
            value !== -1 &&
            String(key) !== String(value),
        )
        .map(([, value]) => String(value));
      return students.value.filter(
        (s) => !otherSelectedIds.includes(String(s.id)),
      );
    };

    const fetchActivityDetails = async () => {
      isLoadingData.value = true;
      try {
        const response = await axios.get(
          `/activities/${activityId.value}`,
          tokenHeader(),
        );
        const lesson = response.data.lesson || {};
        const course = lesson.course || {};

        courseId.value = course.id;
        year.value = lesson.year;
        activityTopic.value = response.data.topic || "";
        lessonTopic.value = lesson.topic || "";
        gradeName.value = course.grade?.name || "";
        areaName.value = course.area?.name || "";

        await fetchStudents();
        await fetchGroups();
        await fetchExistingPermissions();
      } catch (error) {
        console.error("Error fetching activity details:", error);
        setErrorToastOpen(
          true,
          "Error al cargar los detalles de la actividad.",
        );
      } finally {
        isLoadingData.value = false;
      }
    };

    const fetchStudents = async () => {
      if (!courseId.value || !year.value) return;
      try {
        const usersResponse = await axios.get(
          `/courses/${courseId.value}/users?active=true&year=${year.value}`,
          tokenHeader(),
        );
        const allUsersInCourse = usersResponse.data || [];

        students.value = allUsersInCourse
          .filter((u) => u.rol === "student")
          .map((u) => ({
            ...u.user,
          }));

        students.value.forEach((student) => {
          if (individualPermissions.value[student.id] === undefined) {
            individualPermissions.value[student.id] = -1;
          }
        });
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    const fetchGroups = async () => {
      if (!courseId.value) return;
      try {
        // 1. Grupos oficiales del curso (usando el año lectivo efectivo de la actividad)
        const effectiveYear = year.value || selectedYear;
        const response = await axios.get(
          `/courses/${courseId.value}/groups?year=${effectiveYear}&active=true`,
          tokenHeader(),
        );
        const rawCourseGroups = response.data || [];
        const validCourseGroups = rawCourseGroups
          .filter(
            (group) =>
              group.usersToGroup &&
              group.usersToGroup.some(
                (u) =>
                  u.active == 1 ||
                  u.active === true ||
                  u.active === "true" ||
                  u.active === "1",
              ),
          )
          .map((g) => {
            const activeMembers = (g.usersToGroup || [])
              .filter(
                (u) =>
                  u.active == 1 ||
                  u.active === true ||
                  u.active === "true" ||
                  u.active === "1",
              )
              .map((u) => {
                if (u.user) return u.user;
                const sId = Number(u.userId);
                return (
                  students.value.find((s) => Number(s.id) === sId) || {
                    id: sId,
                    name: `Estudiante ${sId}`,
                    lastName: "",
                  }
                );
              })
              .filter(Boolean);
            return {
              id: g.id,
              name: g.name,
              isCourseGroup: true,
              isFreeGroup: false,
              members: activeMembers,
              memberIds: activeMembers.map((m) => Number(m.id)),
            };
          });

        // 2. Agrupaciones de la actividad (Grupos que efectivamente entregaron juntos)
        const usedCourseGroups = [];
        const detectedFreeGroups = [];
        try {
          const evResponse = await axios.get(
            `/activity-evidences/activity/${activityId.value}`,
            tokenHeader(),
          );
          const evidences = evResponse.data || [];
          const evidenceByUrl = {};

          evidences.forEach((ev) => {
            if (!ev.pdfUrl || ev.pdfUrl === "PHYSICAL") return;
            if (!evidenceByUrl[ev.pdfUrl]) {
              evidenceByUrl[ev.pdfUrl] = [];
            }
            evidenceByUrl[ev.pdfUrl].push(Number(ev.studentId));
          });

          let freeIdx = 1;
          for (const pdfUrl in evidenceByUrl) {
            const studentIds = Array.from(new Set(evidenceByUrl[pdfUrl])).sort(
              (a, b) => a - b,
            );

            // 1. Detectar si el pdfUrl tiene un identificador de equipo de curso explícito
            // Ejemplos: PHYSICAL_GROUP_course_3_..., PHYSICAL_GROUP_course_12_...
            let matchedCourseGroup = null;
            const courseMatch = pdfUrl.match(/course_(\d+)/);
            if (courseMatch) {
              const cgId = Number(courseMatch[1]);
              matchedCourseGroup = validCourseGroups.find(
                (cg) => Number(cg.id) === cgId,
              );
            }

            // 2. Coincidencia por miembros del equipo
            if (!matchedCourseGroup) {
              matchedCourseGroup = validCourseGroups.find((cg) => {
                const cgIds = [...cg.memberIds].sort((a, b) => a - b);
                // Coincidencia exacta de miembros
                if (
                  cgIds.length === studentIds.length &&
                  cgIds.every((id, idx) => id === studentIds[idx])
                ) {
                  return true;
                }
                // Si la entrega tiene al menos 2 estudiantes y todos pertenecen a este equipo
                if (
                  studentIds.length >= 2 &&
                  studentIds.every((id) => cgIds.includes(id))
                ) {
                  return true;
                }
                return false;
              });
            }

            if (matchedCourseGroup) {
              // Solo incluir los equipos del curso que REALMENTE entregaron en esta actividad
              if (
                !usedCourseGroups.some(
                  (cg) => Number(cg.id) === Number(matchedCourseGroup.id),
                )
              ) {
                usedCourseGroups.push({
                  ...matchedCourseGroup,
                  pdfUrl,
                });
              }
            } else if (studentIds.length >= 2) {
              const groupMembers = studentIds.map((sId) => {
                const found = students.value.find(
                  (s) => Number(s.id) === sId,
                );
                return (
                  found || {
                    id: sId,
                    name: `Estudiante ${sId}`,
                    lastName: "",
                  }
                );
              });
              const memberNames = groupMembers
                .map((m) => `${m.name} ${m.lastName || ""}`.trim())
                .join(", ");

              detectedFreeGroups.push({
                id: `free_${freeIdx++}`,
                name: `Grupo Libre (${memberNames})`,
                shortName: memberNames,
                isCourseGroup: false,
                isFreeGroup: true,
                members: groupMembers,
                memberIds: studentIds,
                pdfUrl,
              });
            }
          }
        } catch (evErr) {
          console.warn(
            "No se pudieron cargar evidencias para grupos libres:",
            evErr,
          );
        }

        // Si solo se usaron algunos equipos del curso se muestran solo los usados
        courseGroups.value = usedCourseGroups;
        freeGroups.value = detectedFreeGroups;
        allGroups.value = [...usedCourseGroups, ...detectedFreeGroups];

        // Si una actividad no tiene entregas en grupo no se hacen permisos grupales (ir a individuales)
        if (allGroups.value.length === 0) {
          selectedTab.value = "individuales";
        }

        allGroups.value.forEach((group) => {
          if (groupPermissions.value[group.id] === undefined) {
            groupPermissions.value[group.id] = -1;
          }
        });

        // Si solamente hay 1 grupo, alertar al docente que no se puede co-evaluación cruzada
        if (
          allGroups.value.length === 1 &&
          selectedTab.value === "grupos" &&
          !hasAlertedSingleGroup.value
        ) {
          hasAlertedSingleGroup.value = true;
          alertSingleGroup();
        }
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    const fetchExistingPermissions = async () => {
      if (!activityId.value) return;
      try {
        const response = await axios.get(
          `/student-criterion-scores/permissions?activityId=${activityId.value}&expired=false`,
          tokenHeader(),
        );
        initialPermissions.value = response.data || [];

        // 1. Restaurar permisos individuales
        students.value.forEach((student) => {
          individualPermissions.value[student.id] = -1;
        });
        initialPermissions.value.forEach((p) => {
          if (p.reviserType === "User" && p.revisedType === "User") {
            individualPermissions.value[p.reviserId] = p.revisedId;
          }
        });

        // 2. Restaurar permisos grupales
        allGroups.value.forEach((group) => {
          groupPermissions.value[group.id] = -1;
        });

        for (const group of allGroups.value) {
          if (group.isCourseGroup) {
            const perm = initialPermissions.value.find(
              (p) =>
                p.reviserType === "Group" &&
                Number(p.reviserId) === Number(group.id),
            );
            if (perm) {
              if (perm.revisedType === "Group") {
                groupPermissions.value[group.id] = perm.revisedId;
              } else if (perm.revisedType === "User") {
                const targetGroup = allGroups.value.find((g) =>
                  g.memberIds.includes(Number(perm.revisedId)),
                );
                if (targetGroup) {
                  groupPermissions.value[group.id] = targetGroup.id;
                }
              }
            }
          } else if (group.isFreeGroup) {
            const firstMemberId = group.memberIds[0];
            const memberPerm = initialPermissions.value.find(
              (p) =>
                p.reviserType === "User" &&
                Number(p.reviserId) === Number(firstMemberId),
            );
            if (memberPerm) {
              if (memberPerm.revisedType === "Group") {
                groupPermissions.value[group.id] = memberPerm.revisedId;
              } else if (memberPerm.revisedType === "User") {
                if (group.memberIds.includes(Number(memberPerm.revisedId))) {
                  groupPermissions.value[group.id] = group.id;
                } else {
                  const targetGroup = allGroups.value.find((g) =>
                    g.memberIds.includes(Number(memberPerm.revisedId)),
                  );
                  if (targetGroup) {
                    groupPermissions.value[group.id] = targetGroup.id;
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching existing permissions:", error);
      }
    };

    const removeAllPermissions = async () => {
      const alert = await alertController.create({
        header: "Quitar Asignaciones",
        message: `¿Deseas desasignar todos los ${
          selectedTab.value === "grupos"
            ? "equipos y grupos libres"
            : "estudiantes"
        }? Recuerda presionar Guardar para aplicar los cambios en el servidor.`,
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
          },
          {
            text: "Quitar Todos",
            role: "destructive",
            handler: () => {
              if (selectedTab.value === "grupos") {
                for (const group of allGroups.value) {
                  groupPermissions.value[group.id] = -1;
                }
              } else if (selectedTab.value === "individuales") {
                for (const student of students.value) {
                  individualPermissions.value[student.id] = -1;
                }
              }
            },
          },
        ],
      });
      await alert.present();
    };

    const assignAllSelfEvaluation = () => {
      if (selectedTab.value === "grupos") {
        for (const group of allGroups.value) {
          groupPermissions.value[group.id] = group.id;
        }
      } else if (selectedTab.value === "individuales") {
        for (const student of students.value) {
          individualPermissions.value[student.id] = student.id;
        }
      }
    };

    const assignRandomly = async () => {
      let items = [];
      let permissionsMap = {};
      let typeLabel = "";

      if (selectedTab.value === "grupos") {
        if (allGroups.value.length === 0) {
          const noGroupsAlert = await alertController.create({
            header: "Sin grupos con entrega",
            message:
              "Esta actividad no tiene entregas grupales registradas para asignar co-evaluación.",
            buttons: ["OK"],
          });
          await noGroupsAlert.present();
          return;
        }
        if (allGroups.value.length === 1) {
          const singleAlert = await alertController.create({
            header: "Co-evaluación no posible",
            subHeader: "Solo 1 grupo con entrega",
            message:
              "Para que un grupo evalúe a otro se requieren mínimo 2 grupos con entrega en la actividad. Con 1 solo grupo únicamente es posible asignar autoevaluación.",
            buttons: ["OK"],
          });
          await singleAlert.present();
          return;
        }
        items = allGroups.value;
        permissionsMap = groupPermissions.value;
        typeLabel = "equipos / grupos libres";
      } else if (selectedTab.value === "individuales") {
        items = students.value;
        permissionsMap = individualPermissions.value;
        typeLabel = "estudiantes";
      }

      if (items.length < 2) {
        const errorAlert = await alertController.create({
          header: "Atención",
          message: `No hay suficientes ${typeLabel} para una asignación aleatoria cruzada (mínimo 2).`,
          buttons: ["OK"],
        });
        await errorAlert.present();
        return;
      }

      const shuffled = [...items].sort(() => Math.random() - 0.5);

      for (let i = 0; i < shuffled.length; i++) {
        const currentId = shuffled[i].id;
        const nextId = shuffled[(i + 1) % shuffled.length].id;
        permissionsMap[currentId] = nextId;
      }
    };

    const savePermissions = async () => {
      isLoading.value = true;
      try {
        const currentActivityId = parseInt(activityId.value, 10);
        const toSaveDtos = [];

        if (selectedTab.value === "grupos") {
          if (allGroups.value.length === 0) {
            const noGroupsAlert = await alertController.create({
              header: "Atención",
              message:
                "No se pueden guardar permisos grupales porque no hay grupos con entrega registrada en esta actividad.",
              buttons: ["OK"],
            });
            await noGroupsAlert.present();
            isLoading.value = false;
            return;
          }
          for (const group of allGroups.value) {
            const targetId = groupPermissions.value[group.id];
            if (
              targetId === -1 ||
              targetId === undefined ||
              targetId === null
            ) {
              continue;
            }

            const targetGroup = allGroups.value.find(
              (g) => String(g.id) === String(targetId),
            );
            if (!targetGroup) continue;

            if (group.isCourseGroup && targetGroup.isCourseGroup) {
              toSaveDtos.push({
                reviserId: Number(group.id),
                reviserType: "Group",
                revisedId: Number(targetGroup.id),
                revisedType: "Group",
                activityId: currentActivityId,
                expired: false,
              });
            } else if (group.isCourseGroup && targetGroup.isFreeGroup) {
              targetGroup.memberIds.forEach((mId) => {
                toSaveDtos.push({
                  reviserId: Number(group.id),
                  reviserType: "Group",
                  revisedId: Number(mId),
                  revisedType: "User",
                  activityId: currentActivityId,
                  expired: false,
                });
              });
            } else if (group.isFreeGroup && targetGroup.isCourseGroup) {
              group.memberIds.forEach((rId) => {
                toSaveDtos.push({
                  reviserId: Number(rId),
                  reviserType: "User",
                  revisedId: Number(targetGroup.id),
                  revisedType: "Group",
                  activityId: currentActivityId,
                  expired: false,
                });
              });
            } else if (group.isFreeGroup && targetGroup.isFreeGroup) {
              group.memberIds.forEach((rId) => {
                targetGroup.memberIds.forEach((tId) => {
                  toSaveDtos.push({
                    reviserId: Number(rId),
                    reviserType: "User",
                    revisedId: Number(tId),
                    revisedType: "User",
                    activityId: currentActivityId,
                    expired: false,
                  });
                });
              });
            }
          }
        } else if (selectedTab.value === "individuales") {
          for (const student of students.value) {
            const targetId = individualPermissions.value[student.id];
            if (
              targetId === -1 ||
              targetId === undefined ||
              targetId === null
            ) {
              continue;
            }
            toSaveDtos.push({
              reviserId: Number(student.id),
              reviserType: "User",
              revisedId: Number(targetId),
              revisedType: "User",
              activityId: currentActivityId,
              expired: false,
            });
          }
        }

        if (toSaveDtos.length === 0) {
          await axios.delete(
            `/student-criterion-scores/permissions?activityId=${currentActivityId}`,
            tokenHeader(),
          );
        } else {
          await axios.post(
            `/student-criterion-scores/permissions/bulk`,
            toSaveDtos,
            tokenHeader(),
          );
        }

        setSuccessToastOpen(true, "Permisos guardados correctamente");
        await fetchExistingPermissions();
      } catch (error) {
        console.error("Error saving permissions:", error);
        const message =
          error.response?.data?.message ||
          "Error al guardar los permisos. Inténtalo de nuevo.";
        setErrorToastOpen(true, message);
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(() => {
      fetchActivityDetails();
    });

    return {
      activityId,
      selectedTab,
      courseGroups,
      freeGroups,
      allGroups,
      students,
      groupPermissions,
      individualPermissions,
      activityTopic,
      gradeName,
      areaName,
      isLoading,
      isLoadingData,
      isSuccessToastOpen,
      successMessage,
      setSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setErrorToastOpen,
      goBack,
      getInitials,
      getAvailableReviserGroups,
      getAvailableReviserStudents,
      removeAllPermissions,
      assignAllSelfEvaluation,
      assignRandomly,
      savePermissions,
      handleTabChange,
      arrowBackOutline,
      saveOutline,
      peopleOutline,
      personOutline,
      checkmarkCircleOutline,
      shuffleOutline,
      trashOutline,
      peopleCircleOutline,
      arrowForwardOutline,
      layersOutline,
      warningOutline,
      alertCircleOutline,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM - CONFIGURACIÓN DE PERMISOS
   ========================================================================== */
.qz-permissions-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-permissions-content {
  --background: var(--qz-color-purple-bg, #efeefc);
}

.qz-page-wrapper {
  display: flex;
  flex-direction: column;
}

/* ─── Cabecera Fija Queezy ──────────────────────────────────────────────── */
.qz-sticky-header {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: linear-gradient(
    180deg,
    #6a5ae0 0%,
    #7061e3 50%,
    #7a6ce6 75%,
    rgba(122, 108, 230, 0.7) 88%,
    rgba(106, 90, 224, 0) 100%
  ) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding-top: calc(var(--ion-safe-area-top, 0px) + 6px);
  padding-bottom: 22px;
  pointer-events: none;
  border-bottom: none !important;
  box-shadow: none !important;
  margin-bottom: -22px;
}

.qz-sticky-header::after {
  display: none !important;
  content: none !important;
}

.qz-hero-top {
  max-width: 860px;
  margin: 0 auto;
  padding: 4px 16px 2px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  pointer-events: auto;
}

/* Botón Volver */
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
  flex-shrink: 0;
}

.qz-back-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
}

/* Píldora de Conteo */
.qz-hero-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  flex-wrap: nowrap;
}

.qz-summary-pill {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 5px 12px;
  font-size: 13px;
  font-weight: 700;
  backdrop-filter: blur(4px);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.qz-pill-label-short {
  display: none;
}
.qz-pill-label-full {
  display: inline;
}

/* Acciones Superior */
.qz-hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.qz-save-hero-btn {
  background: #ffffff;
  color: var(--ion-color-primary, #6a5ae0);
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  outline: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  flex-shrink: 0;
}

.qz-save-hero-btn:active:not(:disabled) {
  transform: scale(0.92);
}

.qz-save-hero-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.qz-btn-spinner {
  width: 20px;
  height: 20px;
  color: var(--ion-color-primary, #6a5ae0);
}

/* ─── Banner Hero Queezy ─────────────────────────────────────────────────── */
.qz-hero-banner {
  background: linear-gradient(135deg, #6a5ae0 0%, #8b7df0 100%);
  color: #ffffff;
  padding: 36px 20px 32px 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.qz-hero-titles {
  max-width: 860px;
  width: 100%;
}

.qz-hero-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 9999px;
  margin-bottom: 8px;
}

.qz-hero-title {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 6px 0;
  line-height: 1.25;
}

.qz-hero-subtitle {
  font-size: 13.5px;
  margin: 0;
  opacity: 0.9;
  line-height: 1.45;
  max-width: 650px;
}

/* ─── Cuerpo Principal ──────────────────────────────────────────────────── */
.qz-main-body {
  flex: 1;
  padding: 16px 12px 60px 12px;
}

.qz-container {
  max-width: 860px;
  margin: 0 auto;
}

/* ─── Segmento Queezy ───────────────────────────────────────────────────── */
.qz-segment-wrap {
  margin: 10px auto 26px auto;
  display: flex;
  justify-content: center;
  width: 100%;
}

.qz-segment {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: 20px;
  padding: 6px;
  border: 1px solid var(--qz-color-border, #e6e6e6);
  box-shadow: 0 4px 18px rgba(106, 90, 224, 0.08);
  width: 100%;
  max-width: 620px;
  display: flex;
}

.qz-segment-btn {
  --color: var(--qz-color-text-muted, #858494);
  --color-checked: #ffffff;
  --background-checked: var(--ion-color-primary, #6a5ae0);
  --indicator-color: transparent !important;
  --indicator-box-shadow: none !important;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-weight: 700;
  font-size: 14px;
  border-radius: 14px;
  margin: 0 3px;
  min-height: 48px;
  transition: all 0.2s ease;
  flex: 1;
  --padding-start: 14px;
  --padding-end: 14px;
  --padding-top: 8px;
  --padding-bottom: 8px;
}

.qz-segment-btn::part(native) {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.qz-seg-label-full {
  display: inline;
}

.qz-seg-label-short {
  display: none;
}

.qz-segment-btn ion-icon {
  font-size: 20px;
  margin-right: 6px;
}

.qz-segment-btn ion-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.qz-segment-count {
  background: rgba(106, 90, 224, 0.12);
  color: var(--ion-color-primary, #6a5ae0);
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 800;
  padding: 2px 8px;
  display: inline-block;
  line-height: 1.2;
}

.qz-segment-btn.ion-activated .qz-segment-count,
.qz-segment-btn[aria-selected="true"] .qz-segment-count {
  background: rgba(255, 255, 255, 0.28);
  color: #ffffff;
}

/* ─── Barra de Acciones Rápidas (Toolbox) ───────────────────────────────── */
.qz-toolbox-card {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: 18px;
  padding: 14px 18px;
  border: 1px solid var(--qz-color-border, #e6e6e6);
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.05);
  margin-bottom: 20px;
}

.qz-toolbox-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.qz-toolbox-title {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qz-toolbox-caption {
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-toolbox-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.qz-tool-pill {
  flex: 1;
  min-width: 130px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  outline: none;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-tool-pill:active {
  transform: scale(0.96);
}

.qz-tool-pill ion-icon {
  font-size: 17px;
}

.qz-tool-pill--primary {
  background: rgba(106, 90, 224, 0.1);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.2);
}

.qz-tool-pill--primary:hover {
  background: rgba(106, 90, 224, 0.16);
}

.qz-tool-pill--secondary {
  background: rgba(73, 187, 189, 0.12);
  color: #0b9b9e;
  border: 1px solid rgba(73, 187, 189, 0.25);
}

.qz-tool-pill--secondary:hover {
  background: rgba(73, 187, 189, 0.2);
}

.qz-tool-pill--danger {
  background: rgba(235, 87, 87, 0.08);
  color: #eb5757;
  border: 1px solid rgba(235, 87, 87, 0.2);
}

.qz-tool-pill--danger:hover {
  background: rgba(235, 87, 87, 0.15);
}

/* ─── Agrupadores y Headers de Clúster ──────────────────────────────────── */
.qz-group-cluster {
  margin-bottom: 24px;
}

.qz-cluster-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.qz-cluster-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
  padding: 5px 12px;
  border-radius: 9999px;
}

.qz-cluster-badge--course {
  background: rgba(106, 90, 224, 0.12);
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-cluster-badge--free {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.qz-cluster-desc {
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
}

/* ─── Grid y Tarjetas de Permisos ───────────────────────────────────────── */
.qz-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-perm-card {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: 18px;
  border: 1px solid var(--qz-color-border, #e6e6e6);
  padding: 16px;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.05);
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.qz-perm-card--free {
  border-left: 4px solid #10b981;
}

.qz-perm-card-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.qz-perm-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.qz-perm-avatar--course {
  background: rgba(106, 90, 224, 0.12);
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-perm-avatar--free {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.qz-perm-avatar--student {
  background: rgba(106, 90, 224, 0.12);
  color: var(--ion-color-primary, #6a5ae0);
  font-weight: 800;
  font-size: 15px;
}

.qz-perm-info {
  flex: 1;
  min-width: 0;
}

.qz-perm-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.qz-perm-name {
  font-size: 15.5px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  margin: 0;
  line-height: 1.3;
}

.qz-type-chip {
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 9999px;
  letter-spacing: 0.4px;
}

.qz-type-chip--course {
  background: rgba(106, 90, 224, 0.1);
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-type-chip--free {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.qz-perm-members {
  font-size: 12.5px;
  color: var(--qz-color-text-muted, #858494);
  margin: 0;
  line-height: 1.45;
}

.qz-perm-members strong {
  color: var(--qz-color-text-main, #0c092a);
}

.qz-perm-subtext {
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
  margin: 0;
}

/* Selector Row */
.qz-perm-selector-row {
  background: var(--qz-color-purple-bg, #efeefc);
  border-radius: 14px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.qz-field-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
  white-space: nowrap;
}

.qz-field-label ion-icon {
  color: var(--ion-color-primary, #6a5ae0);
  font-size: 16px;
}

.qz-select-wrapper {
  flex: 1;
  max-width: 70%;
  display: flex;
  justify-content: flex-end;
}

.qz-select-wrapper ion-select {
  --padding-top: 6px;
  --padding-bottom: 6px;
  --padding-start: 10px;
  --padding-end: 10px;
  background: var(--qz-color-card-bg, #ffffff);
  border: 1px solid var(--qz-color-border, #e6e6e6);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--qz-color-text-main, #0c092a);
  max-width: 100%;
  width: 100%;
}

/* ─── Barra Inferior Fija ───────────────────────────────────────────────── */
.qz-bottom-bar {
  display: flex;
  gap: 12px;
  margin-top: 30px;
  padding-top: 10px;
}

.qz-bottom-btn {
  flex: 1;
  min-height: 48px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
  border: none;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-bottom-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.qz-bottom-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.qz-bottom-btn--primary {
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.3);
}

.qz-bottom-btn--danger {
  background: transparent;
  color: #eb5757;
  border: 1.5px solid rgba(235, 87, 87, 0.35);
}

.qz-bottom-btn--danger:hover {
  background: rgba(235, 87, 87, 0.08);
}

.qz-btn-spinner-inline {
  width: 18px;
  height: 18px;
  color: #ffffff;
}

/* ─── Estados de Carga y Vacío ──────────────────────────────────────────── */
.qz-loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--qz-color-text-muted, #858494);
  font-size: 14px;
  font-weight: 600;
}

.qz-main-spinner {
  width: 36px;
  height: 36px;
  color: var(--ion-color-primary, #6a5ae0);
  margin-bottom: 12px;
}

.qz-empty-card {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: 24px;
  padding: 40px 24px;
  text-align: center;
  box-shadow: var(--qz-shadow-card, 0 8px 24px rgba(106, 90, 224, 0.08));
  border: 1px solid var(--qz-color-border, #e6e6e6);
  margin: 20px 0;
}

.qz-empty-icon-box {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin: 0 auto 16px auto;
}

.qz-empty-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  margin: 0 0 8px 0;
}

.qz-empty-desc {
  font-size: 13.5px;
  color: var(--qz-color-text-muted, #858494);
  line-height: 1.5;
  max-width: 460px;
  margin: 0 auto 20px auto;
}

.qz-outline-action-btn {
  background: transparent;
  color: var(--ion-color-primary, #6a5ae0);
  border: 1.5px solid var(--ion-color-primary, #6a5ae0);
  border-radius: 9999px;
  padding: 10px 22px;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}

.qz-outline-action-btn:active {
  background: var(--qz-color-purple-bg, #efeefc);
  transform: scale(0.96);
}

/* ─── Banner de Alerta (Un solo grupo) ─────────────────────────────────── */
.qz-alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 18px;
  margin-bottom: 20px;
}

.qz-alert-banner--warning {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #92400e;
}

.qz-alert-icon {
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
  color: #f59e0b;
  margin-top: 1px;
}

.qz-alert-content strong {
  display: block;
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 4px;
  color: #92400e;
}

.qz-alert-content p {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: #92400e;
  opacity: 0.95;
}

.qz-segment-count--zero {
  background: rgba(133, 132, 148, 0.15) !important;
  color: var(--qz-color-text-muted, #858494) !important;
}

.qz-tool-pill--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.qz-empty-icon-box--warning {
  background: rgba(245, 158, 11, 0.12) !important;
  color: #f59e0b !important;
}

/* ─── Soporte Dark Theme ────────────────────────────────────────────────── */
body.dark .qz-permissions-page,
.dark .qz-permissions-page,
@media (prefers-color-scheme: dark) {
  .qz-permissions-page {
    --background: #16132b;
    background-color: #16132b;
  }
  .qz-permissions-content {
    --background: #16132b;
  }
  .qz-perm-selector-row {
    background: #16132b;
  }
  .qz-alert-banner--warning {
    background: rgba(245, 158, 11, 0.18);
    border-color: rgba(245, 158, 11, 0.45);
    color: #fcd34d;
  }
  .qz-alert-content strong,
  .qz-alert-content p {
    color: #fcd34d;
  }
}

/* ─── Responsividad Móvil ───────────────────────────────────────────────── */
@media (max-width: 600px) {
  .qz-pill-label-full {
    display: none;
  }
  .qz-pill-label-short {
    display: inline;
  }
  .qz-seg-label-full {
    display: none;
  }
  .qz-seg-label-short {
    display: inline;
  }
  .qz-hero-top {
    padding: 6px 12px;
    gap: 8px;
    align-items: center;
  }
  .qz-back-btn,
  .qz-save-hero-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    aspect-ratio: 1 / 1;
    border-radius: var(--qz-radius-full, 9999px);
    flex-shrink: 0;
    font-size: 18px;
  }
  .qz-segment-wrap {
    margin: 8px auto 16px auto;
    padding: 0 4px;
    width: 100%;
    box-sizing: border-box;
  }
  .qz-segment {
    max-width: 100%;
    padding: 4px;
    border-radius: 16px;
  }
  .qz-segment-btn {
    min-height: 42px;
    margin: 0 2px;
    font-size: 12.5px;
    border-radius: 12px;
    --padding-start: 6px;
    --padding-end: 6px;
    --padding-top: 6px;
    --padding-bottom: 6px;
  }
  .qz-segment-btn ion-icon {
    font-size: 18px;
    margin-right: 4px;
  }
  .qz-segment-btn ion-label {
    gap: 4px;
    font-size: 12.5px;
  }
  .qz-segment-count {
    font-size: 10.5px;
    padding: 1px 6px;
  }
  .qz-hero-banner {
    padding: 30px 16px 24px 16px;
  }
  .qz-hero-title {
    font-size: 20px;
  }
  .qz-perm-selector-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .qz-select-wrapper {
    max-width: 100%;
  }
  .qz-bottom-bar {
    flex-direction: column;
  }
}
</style>
