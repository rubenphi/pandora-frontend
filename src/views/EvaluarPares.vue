<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="'/actividades/' + activityId">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Ver Revisión</ion-title>
        <ion-buttons slot="primary"></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-accordion-group>
        <ion-accordion
          v-for="student in students"
          :key="student.id"
          @ionChange="handleAccordionChange($event, student)"
        >
          <IonItem slot="header">
            <IonLabel>{{ student.lastName + " " + student.name }}</IonLabel>
            <IonNote slot="end"
              >Nota:
              {{
                studentGrades[student.id] !== null
                  ? studentGrades[student.id].toFixed(2)
                  : "N/A"
              }}</IonNote
            >
          </IonItem>

          <div class="ion-padding" slot="content">
            <ion-button
              expand="block"
              @click="saveSingleEvaluation(student)"
              :disabled="isSaving"
              >Guardar</ion-button
            >

            <!-- Shared criterion list + 0/Medio/Max buttons -->
            <criterion-list
              :criteria="criteria"
              :modelValue="getStudentFlat(student)"
              @update:modelValue="onStudentEvalUpdate($event, student)"
            />

            <ion-button
              expand="block"
              @click="saveSingleEvaluation(student)"
              :disabled="isSaving"
              >Guardar</ion-button
            >
          </div>
        </ion-accordion>
      </ion-accordion-group>

      <!-- Toasts -->
      <ion-toast
        :is-open="isSuccessToastOpen"
        message="Evaluación guardada correctamente"
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

      <!-- FAB for Bulk Evaluation -->
      <ion-fab
        vertical="bottom"
        horizontal="end"
        slot="fixed"
        v-if="selectedStudents.size > 0"
      >
        <ion-fab-button @click="openBulkEvaluationModal">
          Evaluar
        </ion-fab-button>
      </ion-fab>

      <!-- Bulk Evaluation Modal -->
      <ion-modal
        :is-open="isBulkModalOpen"
        @didDismiss="closeBulkEvaluationModal"
        :initial-breakpoint="0.75"
        :breakpoints="[0, 0.75, 1]"
      >
        <ion-header>
          <ion-toolbar>
            <ion-title>Evaluación Grupal</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeBulkEvaluationModal">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <p>
            Asigne una puntuación a cada criterio. Se aplicará a los
            {{ selectedStudents.size }} compañeros seleccionados.
          </p>

          <!-- Shared criterion list + 0/Medio/Max buttons -->
          <criterion-list
            :criteria="criteria"
            v-model="bulkEvaluationTemplate"
          />

          <ion-grid>
            <ion-row>
              <ion-col>
                <ion-button
                  @click="closeBulkEvaluationModal"
                  color="light"
                  expand="block"
                >
                  Cancelar
                </ion-button>
              </ion-col>
              <ion-col>
                <ion-button @click="applyAndSaveChanges" expand="block">
                  Aplicar y Guardar
                </ion-button>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { tokenHeader, usuarioGet } from "../globalService";
import {
  useToast,
  calculateFinalGrade,
  saveCriterionScore,
} from "../composables/useEvaluation";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonPage,
  IonIcon,
  IonContent,
  IonItem,
  IonLabel,
  IonAccordionGroup,
  IonAccordion,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
  IonNote,
  IonFab,
  IonFabButton,
  IonModal,
} from "@ionic/vue";
import { useRoute } from "vue-router";
import { arrowBackOutline } from "ionicons/icons";
import CriterionList from "../components/CriterionList.vue";

export default {
  name: "EvaluarPares",
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonButtons,
    IonPage,
    IonContent,
    IonItem,
    IonLabel,
    IonButton,
    IonAccordionGroup,
    IonAccordion,
    IonGrid,
    IonRow,
    IonCol,
    IonToast,
    IonNote,
    IonFab,
    IonFabButton,
    IonModal,
    CriterionList,
  },
  setup() {
    const mroute = useRoute();

    const grupoUsuario = ref(null);
    const activityId = ref(mroute.params.id);
    const usuario = ref(null);
    const userPermissions = ref([]);

    const students = ref([]);
    const criteria = ref([]);
    const evaluation = ref({});
    const studentGrades = ref({});
    const currentlyOpenStudentId = ref(null);
    const isSaving = ref(false);
    const selectedStudents = ref(new Set());
    const isBulkModalOpen = ref(false);
    const bulkEvaluationTemplate = ref({});

    const {
      isSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setSuccessToastOpen,
      setErrorToastOpen,
    } = useToast();

    usuario.value = usuarioGet();

    // ─── Helpers for CriterionList v-model ───────────────────────────────────

    /** Returns a flat { criterionId: value } map for a student. */
    const getStudentFlat = (student) => {
      const flat = {};
      if (!evaluation.value[student.id]) return flat;
      for (const cId in evaluation.value[student.id]) {
        flat[cId] = evaluation.value[student.id][cId]?.value ?? null;
      }
      return flat;
    };

    /** Syncs a flat update back into the nested evaluation object. */
    const onStudentEvalUpdate = (newFlat, student) => {
      if (!evaluation.value[student.id]) return;
      for (const cId in newFlat) {
        if (evaluation.value[student.id][cId] !== undefined) {
          evaluation.value[student.id][cId].value = newFlat[cId];
        }
      }
      updateGrade(student);
    };

    // ─── Data fetching ────────────────────────────────────────────────────────

    const fetchActivityDetails = async () => {
      try {
        const response = await axios.get(
          `/activities/${activityId.value}`,
          tokenHeader()
        );
        const courseId = response.data.lesson.course.id;
        const year = response.data.lesson.year;

        await fetchCriteria();
        await fetchStudentPermissions(courseId, year);
        await fetchStudentCriterionScores();
      } catch (error) {
        console.error("Error in fetchActivityDetails:", error.message || error);
      }
    };

    const fetchStudentPermissions = async (courseId, year) => {
      try {
        const permisosIndividuales = await axios.get(
          `/student-criterion-scores/permissions?reviserId=${usuario.value.id}&activityId=${activityId.value}&expired=false`,
          tokenHeader()
        );
        userPermissions.value = [...permisosIndividuales.data];

        if (grupoUsuario.value != null) {
          const permisosGrupales = await axios.get(
            `/student-criterion-scores/permissions?reviserId=${grupoUsuario.value.id}&activityId=${activityId.value}&expired=false`,
            tokenHeader()
          );
          userPermissions.value.push(...permisosGrupales.data);
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
        } else if (permission.revisedType === "Group") {
          const groupUsersResponse = await axios.get(
            `/groups/${permission.revisedId}/${year}/users`,
            tokenHeader()
          );
          groupUsersResponse.data.forEach((u) => {
            if (u.user) {
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
        }
      }

      students.value = allStudents.map((student) => ({ ...student }));
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
        response.data.forEach((score) => {
          if (
            evaluation.value[score.student.id]?.[score.criterion.id]
          ) {
            evaluation.value[score.student.id][score.criterion.id] = {
              value: score.score,
              id: score.id,
            };
          }
        });
      } catch (error) {
        console.error(
          "Error in fetchStudentCriterionScores:",
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
        criteria.value = response.data.sort((a, b) => a.id - b.id);
      } catch (error) {
        console.error("Error in fetchCriteria:", error.message || error);
      }
    };

    // ─── Grade helpers ────────────────────────────────────────────────────────

    const updateGrade = (student) => {
      studentGrades.value[student.id] = calculateFinalGrade(
        student.id,
        evaluation.value,
        criteria.value
      );
    };

    const handleAccordionChange = (event, student) => {
      if (event.detail.checked) {
        currentlyOpenStudentId.value = student.id;
        updateGrade(student);
      } else {
        currentlyOpenStudentId.value = null;
      }
    };

    // ─── Save helpers ─────────────────────────────────────────────────────────

    /** Saves one student's criterion scores. EvaluarPares-specific: adds permissionId. */
    const saveEvaluation = async (student) => {
      try {
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

            // EvaluarPares requires a permissionId
            const permission = userPermissions.value.find((p) => {
              if (p.revisedType === "User") return p.revisedId === student.id;
              if (p.revisedType === "Group")
                return p.revisedId === student._allowedByGroupId;
              return false;
            });
            if (permission) {
              payload.permissionId = permission.id;
            } else {
              throw new Error("No permission to evaluate this student.");
            }

            const savedData = await saveCriterionScore(entry.id, payload);
            if (!entry.id && savedData?.id) {
              evaluation.value[student.id][criterionId].id = savedData.id;
            }
          }
        }
      } catch (error) {
        const message =
          error.response?.data?.message || "Error al guardar la evaluación";
        setErrorToastOpen(true, message);
        throw new Error(message);
      }
    };

    const saveSingleEvaluation = async (student) => {
      isSaving.value = true;
      try {
        await saveEvaluation(student);
        setSuccessToastOpen(true);
        await fetchStudentCriterionScores();
      } catch (error) {
        console.error(`Fallo al guardar la evaluacion para ${student.name}`);
      } finally {
        isSaving.value = false;
      }
    };

    onMounted(async () => {
      await axios.get(`/users/${usuario.value.id}/groups`).then((response) => {
        grupoUsuario.value =
          response.data.filter((g) => g.active)[0]?.group ?? null;
      });
      await fetchActivityDetails();
    });

    // ─── Student selection ────────────────────────────────────────────────────

    const handleStudentSelection = (studentId, isChecked) => {
      if (isChecked) {
        selectedStudents.value.add(studentId);
      } else {
        selectedStudents.value.delete(studentId);
      }
    };

    const areAllSelected = computed(
      () =>
        students.value.length > 0 &&
        selectedStudents.value.size === students.value.length
    );

    const toggleSelectAll = () => {
      if (areAllSelected.value) {
        selectedStudents.value.clear();
      } else {
        students.value.forEach((student) =>
          selectedStudents.value.add(student.id)
        );
      }
    };

    // ─── Bulk evaluation modal ────────────────────────────────────────────────

    const openBulkEvaluationModal = () => {
      criteria.value.forEach((c) => {
        bulkEvaluationTemplate.value[c.id] = 0;
      });
      isBulkModalOpen.value = true;
    };

    const closeBulkEvaluationModal = () => {
      isBulkModalOpen.value = false;
    };

    const applyBulkEvaluation = () => {
      const studentObjects = students.value.filter((s) =>
        selectedStudents.value.has(s.id)
      );
      studentObjects.forEach((student) => {
        for (const criterionId in bulkEvaluationTemplate.value) {
          if (evaluation.value[student.id]?.[criterionId]) {
            evaluation.value[student.id][criterionId].value =
              bulkEvaluationTemplate.value[criterionId];
          }
        }
        updateGrade(student);
      });
    };

    const saveBulkEvaluations = async () => {
      const studentObjects = students.value.filter((s) =>
        selectedStudents.value.has(s.id)
      );
      isSaving.value = true;
      try {
        await Promise.all(
          studentObjects.map((student) => saveEvaluation(student))
        );
        setSuccessToastOpen(true);
        await fetchStudentCriterionScores();
      } catch (error) {
        console.error("Una o más guardados fallaron.", error);
      } finally {
        isSaving.value = false;
      }
    };

    const applyAndSaveChanges = async () => {
      applyBulkEvaluation();
      closeBulkEvaluationModal();
      await saveBulkEvaluations();
    };

    return {
      activityId,
      arrowBackOutline,
      students,
      criteria,
      evaluation,
      saveEvaluation,
      saveSingleEvaluation,
      handleAccordionChange,
      currentlyOpenStudentId,
      isSaving,
      isSuccessToastOpen,
      setSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setErrorToastOpen,
      studentGrades,
      updateGrade,
      usuario,
      selectedStudents,
      handleStudentSelection,
      areAllSelected,
      toggleSelectAll,
      isBulkModalOpen,
      bulkEvaluationTemplate,
      openBulkEvaluationModal,
      closeBulkEvaluationModal,
      applyAndSaveChanges,
      getStudentFlat,
      onStudentEvalUpdate,
    };
  },
};
</script>

<style scoped>
.button-row {
  justify-content: space-between;
}
</style>
