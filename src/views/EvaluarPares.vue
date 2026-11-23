<template>
  <ion-page class="ion-page qz-peer-page">
    <!-- BARRA SUPERIOR FIJA QUEEZY (Permanece anclada con estilo armónico) -->
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

        <!-- Píldora de Conteo de Pares -->
        <div class="qz-hero-pills">
          <span
            class="qz-summary-pill"
            :title="`${students.length} compañeros asignados para evaluar`"
          >
            <ion-icon :icon="peopleOutline"></ion-icon>
            {{ students.length }}
            <span class="qz-pill-label-full">{{
              students.length === 1 ? "compañero" : "compañeros"
            }}</span>
            <span class="qz-pill-label-short">pares</span>
          </span>
        </div>

        <!-- Acciones Superior: Guardar Todo -->
        <div class="qz-hero-actions">
          <button
            type="button"
            class="qz-save-hero-btn"
            title="Guardar todas las evaluaciones"
            aria-label="Guardar todas las evaluaciones"
            @click="saveAllEvaluations"
            :disabled="isSaving || students.length === 0"
          >
            <ion-spinner
              v-if="isSaving && !currentlySavingStudentId"
              name="crescent"
              class="qz-btn-spinner"
            ></ion-spinner>
            <ion-icon v-else :icon="saveOutline"></ion-icon>
          </button>
        </div>
      </div>
    </ion-header>

    <ion-content :fullscreen="true" class="qz-peer-content">
      <div class="qz-page-wrapper">
        <!-- 1. BANNER HERO QUEEZY PÚRPURA -->
        <div class="qz-hero-banner">
          <div class="qz-hero-titles">
            <span class="qz-hero-tag">
              CO-EVALUACIÓN ENTRE PARES
              <template v-if="gradeName || areaName">
                · {{ [gradeName, areaName].filter(Boolean).join(" - ") }}
              </template>
            </span>
            <h1 class="qz-hero-title">
              {{ activityTopic || "Evaluar a mis Compañeros" }}
            </h1>
            <p class="qz-hero-subtitle">
              {{
                lessonTopic
                  ? `Lección: ${lessonTopic} · `
                  : ""
              }}Revisa las evidencias entregadas y califica el desempeño de tus compañeros según los criterios asignados
            </p>
          </div>
        </div>

        <!-- 2. CUERPO PRINCIPAL -->
        <div class="qz-main-body">
          <div class="qz-container">
            <!-- Estado de carga inicial -->
            <div v-if="isLoadingData" class="qz-loading-state">
              <ion-spinner name="crescent" class="qz-main-spinner"></ion-spinner>
              <p>Cargando información de co-evaluación...</p>
            </div>

            <!-- Estado Vacío: Sin compañeros asignados -->
            <div v-else-if="students.length === 0" class="qz-empty-card">
              <div class="qz-empty-icon-box">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              </div>
              <h3 class="qz-empty-title">Sin compañeros asignados</h3>
              <p class="qz-empty-desc">
                El docente no ha configurado permisos de evaluación de pares para ti en esta actividad, o no perteneces al grupo evaluador.
              </p>
              <button
                type="button"
                class="qz-outline-action-btn"
                @click="goBack"
              >
                Volver a la actividad
              </button>
            </div>

            <!-- ── Single-criterion mode: lista plana optimizada ── -->
            <div v-else-if="isSingleCriterion" class="qz-single-wrapper">
              <single-criterion-student-list
                :students="students"
                :criterion="criteria[0]"
                :modelValue="getAllFlat()"
                :criteria="criteria"
                :evaluation="evaluation"
                :isSaving="isSaving"
                @update:modelValue="onAllFlatUpdate"
                @save="saveSingleEvaluation"
              >
                <template #row-suffix="{ student }">
                  <div class="qz-single-evidence-box">
                    <evidence-uploader
                      :student-id="student.id"
                      :activity-id="activityId"
                      :institute-id="usuario?.institute?.id"
                      read-only
                    />
                  </div>
                </template>
              </single-criterion-student-list>
            </div>

            <!-- ── Multi-criterion mode: acordeón por estudiante ── -->
            <div v-else class="qz-multi-wrapper">
              <ion-accordion-group
                class="qz-student-accordion-group"
                :value="currentlyOpenStudentId ? String(currentlyOpenStudentId) : undefined"
              >
                <ion-accordion
                  v-for="student in students"
                  :key="student.id"
                  :value="String(student.id)"
                  class="qz-student-accordion-item"
                  @ionChange="handleAccordionChange($event, student)"
                >
                  <!-- Cabecera del Estudiante -->
                  <div slot="header" class="qz-student-header-row">
                    <div class="qz-student-avatar">
                      {{ getInitials(student) }}
                    </div>
                    <div class="qz-student-info">
                      <span class="qz-student-name">
                        {{ student.lastName }} {{ student.name }}
                      </span>
                      <span v-if="student._groupName" class="qz-student-group-tag">
                        {{ student._groupName }}
                      </span>
                    </div>
                    <div
                      class="qz-student-grade-badge"
                      :class="getGradeClass(studentGrades[student.id])"
                    >
                      <span class="qz-badge-label">Nota</span>
                      <span class="qz-badge-val">
                        {{
                          studentGrades[student.id] !== null &&
                          studentGrades[student.id] !== undefined
                            ? Number(studentGrades[student.id]).toFixed(2)
                            : "—"
                        }}
                      </span>
                    </div>
                  </div>

                  <!-- Contenido Desplegable -->
                  <div class="qz-accordion-body" slot="content">
                    <!-- 1. Evidencia del estudiante o su equipo -->
                    <div class="qz-sub-card qz-evidence-panel">
                      <div class="qz-sub-header">
                        <ion-icon :icon="documentAttachOutline"></ion-icon>
                        <h3>Evidencias y Trabajos Entregados</h3>
                      </div>
                      <div class="qz-evidence-inner">
                        <evidence-uploader
                          :student-id="student.id"
                          :activity-id="activityId"
                          :institute-id="usuario?.institute?.id"
                          read-only
                        />
                      </div>
                    </div>

                    <!-- 2. Criterios de Evaluación -->
                    <div class="qz-sub-card qz-criteria-panel">
                      <div class="qz-sub-header">
                        <ion-icon :icon="checkboxOutline"></ion-icon>
                        <h3>Criterios de Evaluación</h3>
                      </div>
                      <criterion-list
                        :criteria="criteria"
                        :modelValue="getStudentFlat(student)"
                        @update:modelValue="onStudentEvalUpdate($event, student)"
                      />
                    </div>

                    <!-- 3. Botón de Guardado Individual -->
                    <div class="qz-save-panel-bottom">
                      <button
                        type="button"
                        class="qz-save-student-btn"
                        @click="saveSingleEvaluation(student)"
                        :disabled="isSaving"
                      >
                        <ion-spinner
                          v-if="isSaving && currentlySavingStudentId === student.id"
                          name="crescent"
                          class="qz-btn-spinner-inline"
                        ></ion-spinner>
                        <template v-else>
                          <ion-icon :icon="saveOutline"></ion-icon>
                          <span>Guardar Calificación de {{ student.name.split(" ")[0] }}</span>
                        </template>
                      </button>
                    </div>
                  </div>
                </ion-accordion>
              </ion-accordion-group>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast de Notificaciones -->
      <ion-toast
        :is-open="isSuccessToastOpen"
        :message="successToastMessage"
        :duration="3000"
        color="success"
        @didDismiss="setSuccessToastOpen(false)"
      ></ion-toast>
      <ion-toast
        :is-open="isErrorToastOpen"
        :message="errorMessage"
        :duration="3000"
        color="danger"
        @didDismiss="setErrorToastOpen(false)"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { tokenHeader, usuarioGet } from "../globalService";
import {
  useToast,
  calculateFinalGrade,
  saveCriterionScore,
} from "../composables/useEvaluation";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonAccordionGroup,
  IonAccordion,
  IonToast,
  IonIcon,
  IonSpinner,
} from "@ionic/vue";
import {
  arrowBackOutline,
  saveOutline,
  peopleOutline,
  documentAttachOutline,
  checkboxOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import CriterionList from "../components/CriterionList.vue";
import SingleCriterionStudentList from "../components/SingleCriterionStudentList.vue";
import EvidenceUploader from "../components/EvidenceUploader.vue";

export default {
  name: "EvaluarPares",
  components: {
    IonPage,
    IonHeader,
    IonContent,
    IonAccordionGroup,
    IonAccordion,
    IonToast,
    IonIcon,
    IonSpinner,
    CriterionList,
    SingleCriterionStudentList,
    EvidenceUploader,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const activityId = ref(route.params.id);
    const usuario = ref(usuarioGet());
    const grupoUsuario = ref(null);
    const userPermissions = ref([]);

    const activityTopic = ref("");
    const lessonTopic = ref("");
    const gradeName = ref("");
    const areaName = ref("");

    const students = ref([]);
    const criteria = ref([]);
    const evaluation = ref({});
    const studentGrades = ref({});
    const currentlyOpenStudentId = ref(null);
    const currentlySavingStudentId = ref(null);
    const activityEvidences = ref({}); // studentId -> ActivityEvidence

    const isSaving = ref(false);
    const isLoadingData = ref(true);

    const successToastMessage = ref("Evaluación guardada correctamente");

    const {
      isSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setSuccessToastOpen: rawSetSuccessToastOpen,
      setErrorToastOpen,
    } = useToast();

    const setSuccessToastOpen = (val, message = "Evaluación guardada correctamente") => {
      successToastMessage.value = message;
      rawSetSuccessToastOpen(val);
    };

    // ─── Helpers de Navegación ────────────────────────────────────────────────
    const goBack = () => {
      router.push(`/actividades/${activityId.value}`);
    };

    // ─── Helpers de Iniciales y Clases de Calificación ─────────────────────────
    const getInitials = (student) => {
      const first = student.name ? student.name.trim()[0] : "";
      const last = student.lastName ? student.lastName.trim()[0] : "";
      return (first + last).toUpperCase() || "?";
    };

    const getGradeClass = (grade) => {
      if (grade === null || grade === undefined || isNaN(grade)) {
        return "qz-badge--none";
      }
      const num = Number(grade);
      if (num >= 4.0) return "qz-badge--high";
      if (num >= 3.0) return "qz-badge--mid";
      return "qz-badge--low";
    };

    // ─── Helpers de Compañeros Vinculados (Entrega Grupal) ────────────────────
    const getLinkedTeammates = (studentId) => {
      const ev = activityEvidences.value[studentId];
      if (!ev || !ev.pdfUrl || ev.pdfUrl === "PHYSICAL") return [];
      return students.value.filter(
        (s) =>
          Number(s.id) !== Number(studentId) &&
          activityEvidences.value[s.id]?.pdfUrl === ev.pdfUrl
      );
    };

    // ─── Helpers para CriterionList v-model ───────────────────────────────────
    const getStudentFlat = (student) => {
      const flat = {};
      if (!evaluation.value[student.id]) return flat;
      for (const cId in evaluation.value[student.id]) {
        flat[cId] = evaluation.value[student.id][cId]?.value ?? null;
      }
      return flat;
    };

    const onStudentEvalUpdate = (newFlat, student) => {
      if (!evaluation.value[student.id]) return;
      for (const cId in newFlat) {
        if (evaluation.value[student.id][cId] !== undefined) {
          evaluation.value[student.id][cId].value = newFlat[cId];
        }
      }
      updateGrade(student);
    };

    // ─── Single-criterion mode helpers ───────────────────────────────────────
    const isSingleCriterion = computed(() => criteria.value.length === 1);

    const getAllFlat = () => {
      const result = {};
      for (const student of students.value) {
        result[student.id] = getStudentFlat(student);
      }
      return result;
    };

    const onAllFlatUpdate = (newAllFlat) => {
      for (const studentId in newAllFlat) {
        const student = students.value.find((s) => s.id == studentId);
        if (student) onStudentEvalUpdate(newAllFlat[studentId], student);
      }
    };

    // ─── Carga de Datos ───────────────────────────────────────────────────────
    const fetchActivityDetails = async () => {
      isLoadingData.value = true;
      try {
        const response = await axios.get(
          `/activities/${activityId.value}`,
          tokenHeader()
        );
        const lesson = response.data.lesson || {};
        const course = lesson.course || {};

        activityTopic.value = response.data.topic || "";
        lessonTopic.value = lesson.topic || "";
        gradeName.value = course.grade?.name || "";
        areaName.value = course.area?.name || "";

        const courseId = course.id;
        const year = lesson.year;

        // Cargar evidencias de la actividad para detectar entregas grupales compartidas
        try {
          const evRes = await axios.get(
            `/activity-evidences/activity/${activityId.value}`,
            tokenHeader()
          );
          const evMap = {};
          (evRes.data || []).forEach((ev) => {
            evMap[ev.studentId] = ev;
          });
          activityEvidences.value = evMap;
        } catch (err) {
          console.error("Error cargando evidencias de la actividad:", err);
        }

        await fetchCriteria();
        await fetchStudentPermissions(courseId, year);
        await fetchStudentCriterionScores();
      } catch (error) {
        console.error("Error en fetchActivityDetails:", error.message || error);
        setErrorToastOpen(true, "No se pudieron cargar los datos de la actividad");
      } finally {
        isLoadingData.value = false;
      }
    };

    const fetchStudentPermissions = async (courseId, year) => {
      try {
        const permisosIndividuales = await axios.get(
          `/student-criterion-scores/permissions?reviserId=${usuario.value.id}&activityId=${activityId.value}&expired=false&reviserType=User`,
          tokenHeader()
        );
        userPermissions.value = [...(permisosIndividuales.data || [])];

        if (grupoUsuario.value != null) {
          const permisosGrupales = await axios.get(
            `/student-criterion-scores/permissions?reviserId=${grupoUsuario.value.id}&activityId=${activityId.value}&expired=false&reviserType=Group`,
            tokenHeader()
          );
          userPermissions.value.push(...(permisosGrupales.data || []));
        }

        await fetchStudentsToReview(courseId, year);
      } catch (error) {
        console.error("Error fetching student permissions:", error);
      }
    };

    const fetchStudentsToReview = async (courseId, year) => {
      const allStudents = [];

      for (const permission of userPermissions.value) {
        if (permission.revisedType === "User") {
          try {
            const userResponse = await axios.get(
              `/users/${permission.revisedId}`,
              tokenHeader()
            );
            if (userResponse.data) {
              const isAlreadyAdded = allStudents.some(
                (student) => student.id === userResponse.data.id
              );
              if (!isAlreadyAdded) allStudents.push(userResponse.data);
            }
          } catch (err) {
            console.error("Error cargando usuario revisado:", err);
          }
        } else if (permission.revisedType === "Group") {
          try {
            const groupUsersResponse = await axios.get(
              `/groups/${permission.revisedId}/${year}/users`,
              tokenHeader()
            );
            // Filtro activo estricto para evitar miembros inactivos o retirados
            (groupUsersResponse.data || []).forEach((u) => {
              const isActive = u.active == 1 || u.active === true || u.active === "true";
              if (u.user && isActive) {
                const existingStudent = allStudents.find(
                  (student) => student.id === u.user.id
                );
                if (!existingStudent) {
                  u.user._allowedByGroupId = permission.revisedId;
                  allStudents.push(u.user);
                } else {
                  existingStudent._allowedByGroupId = permission.revisedId;
                }
              }
            });
          } catch (err) {
            console.error("Error cargando grupo revisado:", err);
          }
        }
      }

      // Regla de Autoevaluación vs Evaluación de Terceros:
      // Un equipo o estudiante puede autoevaluarse ÚNICAMENTE si los permisos son sobre ellos mismos.
      // Si los permisos son sobre otra persona o sobre integrantes de otro grupo, NO se pueden evaluar a sí mismos.
      const isSelfEvaluationAllowed = userPermissions.value.some((p) => {
        if (p.reviserType === "Group" && p.revisedType === "Group") {
          return (
            Number(p.reviserId) === Number(p.revisedId) &&
            grupoUsuario.value &&
            Number(p.reviserId) === Number(grupoUsuario.value.id)
          );
        }
        if (p.reviserType === "User" && p.revisedType === "User") {
          return (
            Number(p.reviserId) === Number(usuario.value.id) &&
            Number(p.revisedId) === Number(usuario.value.id)
          );
        }
        return false;
      });

      let finalStudents = allStudents;
      if (!isSelfEvaluationAllowed) {
        finalStudents = allStudents.filter(
          (student) => Number(student.id) !== Number(usuario.value.id)
        );
      }

      students.value = finalStudents.map((student) => ({ ...student }));
      initializeEvaluation();
    };

    const initializeEvaluation = () => {
      students.value.forEach((student) => {
        studentGrades.value[student.id] = null;
        if (!evaluation.value[student.id]) {
          evaluation.value[student.id] = {};
          criteria.value.forEach((criterion) => {
            evaluation.value[student.id][criterion.id] = {
              value: null,
              id: null,
            };
          });
        }
      });
    };

    const fetchStudentCriterionScores = async () => {
      try {
        const response = await axios.get(
          `/student-criterion-scores/getAll?activityId=${activityId.value}`,
          tokenHeader()
        );
        (response.data || []).forEach((score) => {
          if (evaluation.value[score.student?.id]?.[score.criterion?.id]) {
            evaluation.value[score.student.id][score.criterion.id] = {
              value: score.score,
              id: score.id,
            };
          }
        });
        students.value.forEach((student) => updateGrade(student));
      } catch (error) {
        console.error(
          "Error en fetchStudentCriterionScores:",
          error.message || error
        );
      }
    };

    const fetchCriteria = async () => {
      try {
        const response = await axios.get(
          `/criteria?activityId=${activityId.value}`,
          tokenHeader()
        );
        criteria.value = (response.data || []).sort((a, b) => a.id - b.id);
      } catch (error) {
        console.error("Error en fetchCriteria:", error.message || error);
      }
    };

    // ─── Helpers de Calificaciones ────────────────────────────────────────────
    const updateGrade = (student) => {
      studentGrades.value[student.id] = calculateFinalGrade(
        student.id,
        evaluation.value,
        criteria.value
      );
    };

    const handleAccordionChange = (event, student) => {
      if (event.detail.value === String(student.id)) {
        currentlyOpenStudentId.value = student.id;
        updateGrade(student);
      } else if (currentlyOpenStudentId.value === student.id) {
        currentlyOpenStudentId.value = null;
      }
    };

    // ─── Guardado de Evaluaciones ─────────────────────────────────────────────
    const saveEvaluation = async (student) => {
      try {
        document.activeElement?.blur();

        for (const criterionId in evaluation.value[student.id]) {
          const entry = evaluation.value[student.id][criterionId];
          if (entry.value !== null) {
            const payload = {
              studentId: student.id,
              criterionId: parseInt(criterionId),
              score: entry.value,
              instituteId: usuario.value.institute.id,
              activityId: parseInt(activityId.value),
            };

            const permission = userPermissions.value.find((p) => {
              if (p.revisedType === "User") return Number(p.revisedId) === Number(student.id);
              if (p.revisedType === "Group")
                return Number(p.revisedId) === Number(student._allowedByGroupId);
              return false;
            });

            if (permission) {
              payload.permissionId = permission.id;
            } else {
              throw new Error("No tienes permiso para evaluar a este estudiante.");
            }

            let savedData;
            try {
              savedData = await saveCriterionScore(entry.id, payload);
            } catch (err) {
              if (err.response?.status === 409 && entry.id == null) {
                await fetchStudentCriterionScores();
                const existingId =
                  evaluation.value[student.id]?.[criterionId]?.id;
                if (existingId) {
                  savedData = await saveCriterionScore(existingId, payload);
                } else {
                  throw err;
                }
              } else {
                throw err;
              }
            }
            if (savedData?.id) {
              evaluation.value[student.id][criterionId].id = savedData.id;
            }
          }
        }
      } catch (error) {
        const message =
          error.response?.data?.message || error.message || "Error al guardar la evaluación";
        setErrorToastOpen(true, message);
        throw new Error(message);
      }
    };

    const saveSingleEvaluation = async (student) => {
      isSaving.value = true;
      currentlySavingStudentId.value = student.id;
      try {
        // 1. Guardar la evaluación del estudiante actual
        await saveEvaluation(student);

        // 2. Si el estudiante entregó en grupo con otros compañeros en esta actividad,
        // replicar automáticamente la misma calificación a sus compañeros de equipo
        const teammates = getLinkedTeammates(student.id);
        for (const teammate of teammates) {
          if (!evaluation.value[teammate.id]) evaluation.value[teammate.id] = {};
          for (const criterionId in evaluation.value[student.id]) {
            const scoreVal = evaluation.value[student.id][criterionId]?.value;
            if (!evaluation.value[teammate.id][criterionId]) {
              evaluation.value[teammate.id][criterionId] = {
                value: scoreVal,
                id: null,
              };
            } else {
              evaluation.value[teammate.id][criterionId].value = scoreVal;
            }
          }
          updateGrade(teammate);
          try {
            await saveEvaluation(teammate);
          } catch (err) {
            console.warn(`No se pudo replicar automáticamente a ${teammate.name}:`, err);
          }
        }

        if (teammates.length > 0) {
          const names = [student.name.split(" ")[0], ...teammates.map((t) => t.name.split(" ")[0])].join(" y ");
          setSuccessToastOpen(true, `Evaluación guardada y replicada para el equipo (${names})`);
        } else {
          setSuccessToastOpen(true, `Evaluación de ${student.name} guardada correctamente`);
        }

        await fetchStudentCriterionScores();
      } catch (error) {
        console.error(`Fallo al guardar la evaluación para ${student.name}`, error);
      } finally {
        isSaving.value = false;
        currentlySavingStudentId.value = null;
      }
    };

    const saveAllEvaluations = async () => {
      if (students.value.length === 0) return;
      isSaving.value = true;
      try {
        await Promise.all(
          students.value.map((student) => saveEvaluation(student))
        );
        setSuccessToastOpen(true, "Todas las evaluaciones fueron guardadas correctamente");
        await fetchStudentCriterionScores();
      } catch (error) {
        console.error("Una o más evaluaciones fallaron al guardar.", error);
      } finally {
        isSaving.value = false;
      }
    };

    onMounted(async () => {
      try {
        const response = await axios.get(
          `/users/${usuario.value.id}/groups`,
          tokenHeader()
        );
        grupoUsuario.value =
          (response.data || []).filter((g) => g.active)[0]?.group ?? null;
      } catch (err) {
        console.error("Error al obtener grupos del usuario:", err);
      }
      await fetchActivityDetails();
    });

    return {
      activityId,
      arrowBackOutline,
      saveOutline,
      peopleOutline,
      documentAttachOutline,
      checkboxOutline,
      checkmarkCircleOutline,
      students,
      criteria,
      evaluation,
      studentGrades,
      activityTopic,
      lessonTopic,
      gradeName,
      areaName,
      currentlyOpenStudentId,
      currentlySavingStudentId,
      isSaving,
      isLoadingData,
      isSuccessToastOpen,
      successToastMessage,
      setSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setErrorToastOpen,
      saveEvaluation,
      saveSingleEvaluation,
      saveAllEvaluations,
      handleAccordionChange,
      getInitials,
      getGradeClass,
      getStudentFlat,
      onStudentEvalUpdate,
      isSingleCriterion,
      getAllFlat,
      onAllFlatUpdate,
      goBack,
      usuario,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   QUEEZY PEER REVIEW THEME (EvaluarPares.vue)
   ========================================================================== */
.qz-peer-page {
  --background: var(--qz-color-purple-bg, #EFEEFC);
  background-color: var(--qz-color-purple-bg, #EFEEFC);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-peer-content {
  --background: var(--qz-color-purple-bg, #EFEEFC);
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
  max-width: 820px;
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
  max-width: 820px;
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
  max-width: 820px;
  margin: 0 auto;
}

/* Estados de Carga y Vacío */
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
  max-width: 440px;
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

/* ─── Acordeón de Estudiantes ────────────────────────────────────────────── */
.qz-student-accordion-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-student-accordion-item {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: 20px !important;
  border: 1px solid var(--qz-color-border, #e6e6e6);
  box-shadow: var(--qz-shadow-card, 0 6px 18px rgba(106, 90, 224, 0.06));
  overflow: hidden;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.qz-student-accordion-item.ion-accordion-expanded {
  border-color: rgba(106, 90, 224, 0.35);
  box-shadow: 0 10px 28px rgba(106, 90, 224, 0.12);
}

.qz-student-header-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
}

.qz-student-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6a5ae0 0%, #9087e5 100%);
  color: #ffffff;
  font-weight: 800;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(106, 90, 224, 0.25);
}

.qz-student-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.qz-student-name {
  font-size: 15px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-student-group-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--qz-color-purple-primary, #6a5ae0);
  background: var(--qz-color-purple-bg, #efeefc);
  padding: 1px 8px;
  border-radius: 9999px;
  width: fit-content;
  margin-top: 2px;
}

/* Badge de Calificación */
.qz-student-grade-badge {
  padding: 6px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.qz-badge-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  opacity: 0.8;
  line-height: 1;
}

.qz-badge-val {
  font-size: 16px;
  font-weight: 900;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.qz-badge--none {
  background: rgba(133, 132, 148, 0.1);
  color: var(--qz-color-text-muted, #858494);
}

.qz-badge--high {
  background: rgba(83, 223, 131, 0.18);
  color: #2e9f55;
}

.qz-badge--mid {
  background: rgba(255, 174, 51, 0.18);
  color: #d4830e;
}

.qz-badge--low {
  background: rgba(255, 86, 86, 0.16);
  color: #df3838;
}

/* Cuerpo desplegable */
.qz-accordion-body {
  padding: 14px 16px 20px 16px;
  border-top: 1px solid var(--qz-color-border, #f0f0f5);
  background: var(--qz-color-card-bg, #ffffff);
}

.qz-sub-card {
  margin-bottom: 16px;
}

.qz-sub-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.qz-sub-header ion-icon {
  font-size: 18px;
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-sub-header h3 {
  font-size: 14px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  margin: 0;
}

.qz-evidence-inner {
  background: var(--qz-color-purple-bg, #f7f6fd);
  border-radius: 16px;
  padding: 10px;
  border: 1px dashed rgba(106, 90, 224, 0.2);
}

.qz-single-evidence-box {
  margin-top: 8px;
  padding: 8px;
  background: var(--qz-color-purple-bg, #f7f6fd);
  border-radius: 14px;
}

.qz-save-panel-bottom {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}

.qz-save-student-btn {
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  padding: 12px 24px;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 6px 16px rgba(106, 90, 224, 0.3);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.qz-save-student-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.qz-save-student-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.qz-btn-spinner-inline {
  width: 18px;
  height: 18px;
  color: #ffffff;
}

/* ─── Media Queries Móvil ────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .qz-pill-label-full {
    display: none;
  }
  .qz-pill-label-short {
    display: inline;
  }
  .qz-save-student-btn {
    width: 100%;
    justify-content: center;
  }
}

/* ─── Modo Oscuro ────────────────────────────────────────────────────────── */
@media (prefers-color-scheme: dark) {
  .qz-peer-page,
  .qz-peer-content {
    --background: #120f24;
    background-color: #120f24;
  }

  .qz-sticky-header {
    background: linear-gradient(
      180deg,
      #1d1838 0%,
      #231d42 50%,
      #28214b 75%,
      rgba(40, 33, 75, 0.7) 88%,
      rgba(29, 24, 56, 0) 100%
    ) !important;
  }

  .qz-hero-banner {
    background: linear-gradient(180deg, #5a4ad1 0%, #352b6a 80%, #120f24 100%);
  }

  .qz-student-accordion-item,
  .qz-accordion-body,
  .qz-empty-card {
    background: #1d1838 !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
  }

  .qz-student-name,
  .qz-sub-header h3,
  .qz-empty-title {
    color: #f7f7fd !important;
  }

  .qz-evidence-inner,
  .qz-single-evidence-box {
    background: #16122d !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
  }

  .qz-badge--none {
    background: rgba(255, 255, 255, 0.08);
    color: #9e9bb8;
  }

  .qz-badge--high {
    background: rgba(83, 223, 131, 0.2);
    color: #53df83;
  }

  .qz-badge--mid {
    background: rgba(255, 174, 51, 0.2);
    color: #ffae33;
  }

  .qz-badge--low {
    background: rgba(255, 86, 86, 0.2);
    color: #ff8fa2;
  }
}

:global(body.dark) .qz-peer-page,
:global(html.dark) .qz-peer-page,
:global(.dark) .qz-peer-page,
:global(body.dark) .qz-peer-content,
:global(html.dark) .qz-peer-content,
:global(.dark) .qz-peer-content {
  --background: #120f24;
  background-color: #120f24;
}

:global(body.dark) .qz-sticky-header,
:global(html.dark) .qz-sticky-header,
:global(.dark) .qz-sticky-header {
  background: linear-gradient(
    180deg,
    #1d1838 0%,
    #231d42 50%,
    #28214b 75%,
    rgba(40, 33, 75, 0.7) 88%,
    rgba(29, 24, 56, 0) 100%
  ) !important;
}

:global(body.dark) .qz-hero-banner,
:global(html.dark) .qz-hero-banner,
:global(.dark) .qz-hero-banner {
  background: linear-gradient(180deg, #5a4ad1 0%, #352b6a 80%, #120f24 100%);
}

:global(body.dark) .qz-student-accordion-item,
:global(html.dark) .qz-student-accordion-item,
:global(.dark) .qz-student-accordion-item,
:global(body.dark) .qz-accordion-body,
:global(html.dark) .qz-accordion-body,
:global(.dark) .qz-accordion-body,
:global(body.dark) .qz-empty-card,
:global(html.dark) .qz-empty-card,
:global(.dark) .qz-empty-card {
  background: #1d1838 !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

:global(body.dark) .qz-student-name,
:global(html.dark) .qz-student-name,
:global(.dark) .qz-student-name,
:global(body.dark) .qz-sub-header h3,
:global(html.dark) .qz-sub-header h3,
:global(.dark) .qz-sub-header h3,
:global(body.dark) .qz-empty-title,
:global(html.dark) .qz-empty-title,
:global(.dark) .qz-empty-title {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-evidence-inner,
:global(html.dark) .qz-evidence-inner,
:global(.dark) .qz-evidence-inner,
:global(body.dark) .qz-single-evidence-box,
:global(html.dark) .qz-single-evidence-box,
:global(.dark) .qz-single-evidence-box {
  background: #16122d !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

:global(body.dark) .qz-badge--none,
:global(html.dark) .qz-badge--none,
:global(.dark) .qz-badge--none {
  background: rgba(255, 255, 255, 0.08);
  color: #9e9bb8;
}

:global(body.dark) .qz-badge--high,
:global(html.dark) .qz-badge--high,
:global(.dark) .qz-badge--high {
  background: rgba(83, 223, 131, 0.2);
  color: #53df83;
}

:global(body.dark) .qz-badge--mid,
:global(html.dark) .qz-badge--mid,
:global(.dark) .qz-badge--mid {
  background: rgba(255, 174, 51, 0.2);
  color: #ffae33;
}

:global(body.dark) .qz-badge--low,
:global(html.dark) .qz-badge--low,
:global(.dark) .qz-badge--low {
  background: rgba(255, 86, 86, 0.2);
  color: #ff8fa2;
}
</style>
