<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="'/actividades/' + activityId">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Revisar Actividad</ion-title>
        <ion-buttons slot="primary">
          <ion-item>
            <ion-label>Sel. Todos</ion-label>
            <ion-checkbox
              :checked="areAllSelected"
              @ionChange="toggleSelectAll"
            ></ion-checkbox>
          </ion-item>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="presentConfirmAlert()">
            Registrar Notas
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-accordion-group>
        <ion-accordion
          v-for="student in students"
          :key="student.id"
          @ionChange="handleAccordionChange($event, student)"
          :class="{ 'no-group-student': !student.hasGroup }"
        >
          <IonItem slot="header">
            <ion-checkbox
              slot="start"
              :checked="selectedStudents.has(student.id)"
              @ionChange="
                handleStudentSelection(student.id, $event.detail.checked)
              "
              @click.stop
            ></ion-checkbox>
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
            <ion-grid>
              <ion-row>
                <ion-col>
                  <ion-button
                    expand="block"
                    @click="markAllAs(student, 'min')"
                    color="danger"
                    >0</ion-button
                  >
                </ion-col>
                <ion-col>
                  <ion-button
                    expand="block"
                    @click="markAllAs(student, 'mid')"
                    color="warning"
                    >Medio</ion-button
                  >
                </ion-col>
                <ion-col>
                  <ion-button
                    expand="block"
                    @click="markAllAs(student, 'max')"
                    color="success"
                    >Max</ion-button
                  >
                </ion-col>
              </ion-row>
            </ion-grid>
            <ion-button
              expand="block"
              @click="saveSingleEvaluation(student)"
              :disabled="isSaving"
              >Guardar</ion-button
            >
            <ion-list>
              <template v-for="criterion in criteria" :key="criterion.id">
                <ion-item>
                  <ion-label>{{ criterion.description }}</ion-label>
                  <div class="range-wrapper">
                    <div class="range-labels">
                      <span class="range-label">0</span>
                      <span class="range-label">{{ criterion.score }}</span>
                    </div>
                    <ion-range
                      :value="evaluation[student.id][criterion.id].value"
                      @ionChange="
                        (evaluation[student.id][criterion.id].value =
                          $event.detail.value),
                          updateGrade(student)
                      "
                      min="0"
                      :max="criterion.score"
                      step="0.5"
                      snaps="true"
                      ticks="true"
                      pin="true"
                      :pin-formatter="(value) => value.toFixed(1)"
                      class="small-range"
                    >
                    </ion-range>
                  </div>
                  <ion-note slot="end" style="min-width: 40px; text-align: center;">
                    {{ evaluation[student.id][criterion.id].value != null ? evaluation[student.id][criterion.id].value.toFixed(1) : '-' }}
                  </ion-note>
                </ion-item>
              </template>
              <ion-item>
                <ion-grid>
                  <ion-row class="button-row">
                    <ion-col size="auto">
                      <ion-button
                        @click="saveSingleEvaluation(student)"
                        :disabled="isSaving"
                        >Guardar</ion-button
                      >
                    </ion-col>
                  </ion-row>
                </ion-grid>
              </ion-item>
            </ion-list>
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
            {{ selectedStudents.size }} estudiantes seleccionados.
          </p>
          <ion-list>
            <template v-for="criterion in criteria" :key="criterion.id">
              <ion-item>
                <ion-label>{{ criterion.description }}</ion-label>
                <div class="range-wrapper">
                  <div class="range-labels">
                    <span class="range-label">0</span>
                    <span class="range-label">{{ criterion.score }}</span>
                  </div>
                  <ion-range
                    :value="bulkEvaluationTemplate[criterion.id]"
                    @ionChange="
                      bulkEvaluationTemplate[criterion.id] = $event.detail.value
                    "
                    min="0"
                    :max="criterion.score"
                    step="0.5"
                    snaps="true"
                    ticks="true"
                    pin="true"
                    :pin-formatter="(value) => value.toFixed(1)"
                    class="small-range"
                  >
                  </ion-range>
                </div>
              </ion-item>
            </template>
          </ion-list>
          <ion-grid>
            <ion-row>
              <ion-col>
                <ion-button @click="closeBulkEvaluationModal" color="light" expand="block">
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
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { tokenHeader, usuarioGet } from "../globalService";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  onIonViewWillEnter,
  IonAccordionGroup,
  IonAccordion,
  IonRange,
  IonGrid,
  IonRow,
  IonCol,
  alertController,
  IonIcon,
  IonToast,
  IonNote,
  IonCheckbox,
  IonFab,
  IonFabButton,
  IonModal,
} from "@ionic/vue";
import { arrowBackOutline } from "ionicons/icons";

export default {
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonAccordionGroup,
    IonAccordion,
    IonRange,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonToast,
    IonNote,
    IonCheckbox,
    IonFab,
    IonFabButton,
    IonModal,

  },
  setup() {
    const mroute = useRoute();
    const activityId = mroute.params.id;
    const usuario = ref(null);
    const periodId = ref(null);
    const instituteId = ref(null);

    const students = ref([]);
    const criteria = ref([]);
    const evaluation = ref({}); // { studentId: { criterionId: 'value' } }
    const studentGrades = ref({});
    const currentlyOpenStudentId = ref(null); // Track the currently open student accordion
    const isSaving = ref(false);
    const selectedStudents = ref(new Set());
    const isBulkModalOpen = ref(false);
    const bulkEvaluationTemplate = ref({});

    const isSuccessToastOpen = ref(false);
    const setSuccessToastOpen = (val) => (isSuccessToastOpen.value = val);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const setErrorToastOpen = (val, message = "") => {
      isErrorToastOpen.value = val;
      errorMessage.value = message;
    };

    // ... existing setup
    usuario.value = usuarioGet();

    const fetchActivityDetails = async () => {
      try {
        const response = await axios.get(
          `/activities/${activityId}`,
          tokenHeader()
        );

        const courseId = response.data.lesson.course.id;
        const year = response.data.lesson.year;
        const lessonType = response.data.lesson.type;
        const lessonId = response.data.lesson.id;
        
        periodId.value = response.data.lesson.period.id;
        instituteId.value = response.data.institute.id;

        await fetchCriteria(activityId); // Fetch criteria first

        // Conditional student fetch based on lesson type
        if (lessonType === 'reinforcement') {
          await fetchReinforcementStudents(lessonId);
        } else {
          await fetchStudents(courseId, year);
        }

        await fetchStudentCriterionScores(activityId);
      } catch (error) {
        console.error("Error in fetchActivityDetails:", error.message || error);
      }
    };

    const fetchStudentCriterionScores = async (activityId) => {
      try {
        const response = await axios.get(
          `/student-criterion-scores/getAll?activityId=${activityId}`,
          tokenHeader()
        );
        const fetchedScores = response.data;

        // Populate evaluation with fetched scores
        fetchedScores.forEach((score) => {
          if (evaluation.value[score.student.id]) {
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

    const calculateFinalGrade = (student) => {
      let totalScore = 0;
      let maxPossibleScore = 0;

      for (const criterionId in evaluation.value[student.id]) {
        const evaluationEntry = evaluation.value[student.id][criterionId];
        // Treat null values as 0 for the purpose of final grade calculation
        const value =
          evaluationEntry.value === null ? 0 : evaluationEntry.value;
        const criterion = criteria.value.find((c) => c.id == criterionId);

        if (criterion) {
          maxPossibleScore += criterion.score;
          totalScore += value;
        }
      }
      // Normalize the score to a 0-5 scale, assuming maxPossibleScore is the total possible points for all criteria
      // If maxPossibleScore is 0 (no criteria or all criteria have 0 score), return 0 to avoid division by zero
      if (maxPossibleScore === 0) {
        return 0;
      }
      return (totalScore / maxPossibleScore) * 5;
    };

    const fetchStudents = async (courseId, year) => {
      try {
        const response = await axios.get(
          `/courses/${courseId}/users?year=${year}`,
          tokenHeader()
        );
        const allStudents = response.data
          .filter((user) => user.rol === "student")
          .map((user) => user.user);

        const usersNoGroupResponse = await axios.get(
          `/courses/${courseId}/usersNoGroup?year=${year}`,
          tokenHeader()
        );
        const usersWithoutGroupIds = new Set(
          usersNoGroupResponse.data.map((u) => u.user.id)
        );

        students.value = allStudents
          .map((student) => ({
            ...student,
            hasGroup: !usersWithoutGroupIds.has(student.id),
          }))
          .sort((a, b) => {
            const lastNameA = a.lastName || "";
            const lastNameB = b.lastName || "";
            if (lastNameA !== lastNameB) {
              return lastNameA.localeCompare(lastNameB);
            }
            const nameA = a.name || "";
            const nameB = b.name || "";
            return nameA.localeCompare(nameB);
          });

        // Initialize evaluation for all students
        students.value.forEach((student) => {
          studentGrades.value[student.id] = null;
          if (!evaluation.value[student.id]) {
            evaluation.value[student.id] = {};
            criteria.value.forEach((criterion) => {
              evaluation.value[student.id][criterion.id] = {
                value: null,
                id: null,
              }; // Initialize with null for not evaluated and no ID
            });
          }
        });
      } catch (error) {
        console.error("Error in fetchStudents:", error.message || error);
      }
    };

    const fetchReinforcementStudents = async (lessonId) => {
      try {
        const response = await axios.get(
          `/reinforcement/lesson/${lessonId}`,
          tokenHeader()
        );
        
        // Get the lesson to extract courseId and year for usersNoGroup check
        const lessonResponse = await axios.get(
          `/lessons/${lessonId}`,
          tokenHeader()
        );
        const courseId = lessonResponse.data.course.id;
        const year = lessonResponse.data.year;

        // Fetch users without group to apply the hasGroup property
        const usersNoGroupResponse = await axios.get(
          `/courses/${courseId}/usersNoGroup?year=${year}`,
          tokenHeader()
        );
        const usersWithoutGroupIds = new Set(
          usersNoGroupResponse.data.map((u) => u.user.id)
        );
        
        // response.data is array of Reinforcement objects with student relation
        const reinforcementStudents = response.data.map(r => ({
          ...r.student,
          hasGroup: !usersWithoutGroupIds.has(r.student.id)
        }));
        
        students.value = reinforcementStudents.sort((a, b) => {
          const lastNameA = a.lastName || "";
          const lastNameB = b.lastName || "";
          if (lastNameA !== lastNameB) {
            return lastNameA.localeCompare(lastNameB);
          }
          const nameA = a.name || "";
          const nameB = b.name || "";
          return nameA.localeCompare(nameB);
        });

        // Initialize evaluation for reinforcement students
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
      } catch (error) {
        console.error("Error in fetchReinforcementStudents:", error.message || error);
      }
    };

    const fetchCriteria = async (activityId) => {
      try {
        const response = await axios.get(
          `/criteria?activityId=${activityId}`,
          tokenHeader()
        );
        criteria.value = response.data.sort((a, b) => a.id - b.id);
      } catch (error) {
        console.error("Error in fetchCriteria:", error.message || error);
      }
    };

    const handleAccordionChange = (event, student) => {
      if (event.detail.checked) {
        // Check if the accordion is being opened
        currentlyOpenStudentId.value = student.id;
        updateGrade(student);
      } else {
        currentlyOpenStudentId.value = null; // Accordion is closed
      }
    };

    const updateGrade = (student) => {
      studentGrades.value[student.id] = calculateFinalGrade(student);
    };

    const saveEvaluation = async (student) => {
      // This function is now designed to not open the success toast,
      // as it will be controlled by the bulk save function.
      // It will still show errors individually.
      try {
        for (const criterionId in evaluation.value[student.id]) {
          const evaluationEntry = evaluation.value[student.id][criterionId];
          const value = evaluationEntry.value;
          const scoreId = evaluationEntry.id;

          if (value !== null) {
            const score = value;
            const payload = {
              studentId: student.id,
              criterionId: parseInt(criterionId),
              score: score,
              instituteId: usuario.value.institute.id,
              activityId: parseInt(activityId),
            };

            if (scoreId) {
              await axios.patch(
                `/student-criterion-scores/update/${scoreId}`,
                payload,
                tokenHeader()
              );
            } else {
              const response = await axios.post(
                `/student-criterion-scores/create`,
                payload,
                tokenHeader()
              );
              evaluation.value[student.id][criterionId].id = response.data.id;
            }
          }
        }
      } catch (error) {
        const message =
          error.response?.data?.message ||
          `Error guardando evaluación para ${student.name}`;
        setErrorToastOpen(true, message);
        // Throw error to stop Promise.all in saveBulkEvaluations
        throw new Error(message);
      }
    };

    const saveSingleEvaluation = async (student) => {
      isSaving.value = true;
      try {
        await saveEvaluation(student); // The core logic
        setSuccessToastOpen(true);
        await fetchStudentCriterionScores(activityId); // Refetch to get new IDs
      } catch (error) {
        // error toast is handled by saveEvaluation
        console.error(`Fallo al guardar la evaluacion para ${student.name}`);
      } finally {
        isSaving.value = false;
      }
    };

    const registerAllGrades = async () => {
      const allPromises = [];

      for (const student of students.value) {
        // Collect all criterion score promises for this student
        const criterionPromises = criteria.value.map(async (criterion) => {
          const evaluationEntry = evaluation.value[student.id][criterion.id];
          let valueToSave = evaluationEntry.value;
          if (valueToSave === null) { valueToSave = 0; }
          const score = valueToSave;

          const payload = {
            studentId: student.id,
            criterionId: criterion.id,
            score: score,
            instituteId: usuario.value.institute.id,
            activityId: parseInt(activityId),
          };

          try {
            if (evaluationEntry.id) {
              await axios.patch(`/student-criterion-scores/update/${evaluationEntry.id}`, payload, tokenHeader());
            } else {
              const response = await axios.post(`/student-criterion-scores/create`, payload, tokenHeader());
              evaluation.value[student.id][criterion.id].id = response.data.id;
            }
          } catch (error) {
            console.error(`Error saving criterion score`, error);
          }
        });

        // Wait for all criterion scores for this student, then register final grade
        const studentGradePromise = Promise.all(criterionPromises).then(async () => {
          const finalGrade = calculateFinalGrade(student);

          const payloadFinalGrade = {
            userId: student.id,
            gradableId: parseInt(activityId),
            gradableType: "activity",
            periodId: periodId.value,
            gradeType: "regular",
            grade: parseFloat(finalGrade.toFixed(2)),
            instituteId: instituteId.value,
          };

          try {
            await axios.post("/grades", payloadFinalGrade, tokenHeader());
          } catch (error) {
            console.error(`Error registrando nota final para ${student.name}:`, error);
          }
        });

        allPromises.push(studentGradePromise);
      }

      // Wait for all students to complete
      await Promise.all(allPromises);
    };

    const presentConfirmAlert = async () => {
      const studentsWithMissing = getStudentsWithMissingCriteria();
      let message =
        "¿Estás seguro de que deseas registrar las notas para todos los estudiantes? Esta acción no se puede deshacer.";

      if (studentsWithMissing.length > 0) {
        message +=
          "<br><br><b>¡Advertencia!</b> Los siguientes estudiantes tienen criterios sin evaluar. Sus notas se registrarán con 0 en esos criterios:<br>";
        message += "<ul>";
        studentsWithMissing.forEach((studentName) => {
          message += `<li>${studentName}</li>`;
        });
        message += "</ul>";
      }

      const alert = await alertController.create({
        header: "Confirmar Registro",
        message: message,
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
            cssClass: "secondary",
            handler: () => {},
          },
          {
            text: "Registrar",
            handler: async () => {
              await registerAllGrades();
              presentSuccessAlert();
            },
          },
        ],
      });
      await alert.present();
    };

    const presentSuccessAlert = async () => {
      const alert = await alertController.create({
        header: "Registro Exitoso",
        message:
          "Las notas se han registrado exitosamente para todos los estudiantes.",
        buttons: ["OK"],
      });
      await alert.present();
    };

    const getStudentsWithMissingCriteria = () => {
      const studentsWithMissing = [];
      students.value.forEach((student) => {
        let hasMissing = false;
        criteria.value.forEach((criterion) => {
          if (
            evaluation.value[student.id] &&
            evaluation.value[student.id][criterion.id] &&
            evaluation.value[student.id][criterion.id].value === null
          ) {
            hasMissing = true;
          }
        });
        if (hasMissing) {
          studentsWithMissing.push(student.name + " " + student.lastName);
        }
      });
      return studentsWithMissing;
    };

    onIonViewWillEnter(async () => {
      await fetchActivityDetails();
    });

    const markAllAs = (student, valueType) => {
      if (evaluation.value[student.id]) {
        for (const criterionId in evaluation.value[student.id]) {
          const criterion = criteria.value.find((c) => c.id == criterionId);
          if (criterion) {
            let score = 0;
            if (valueType === "mid") {
              score = criterion.score / 2;
            } else if (valueType === "max") {
              score = criterion.score;
            }
            evaluation.value[student.id][criterionId].value = score;
          }
        }
        updateGrade(student);
      }
    };

    const handleStudentSelection = (studentId, isChecked) => {
      if (isChecked) {
        selectedStudents.value.add(studentId);
      } else {
        selectedStudents.value.delete(studentId);
      }
    };

    const areAllSelected = computed(() => {
      return (
        students.value.length > 0 &&
        selectedStudents.value.size === students.value.length
      );
    });

    const toggleSelectAll = () => {
      if (areAllSelected.value) {
        selectedStudents.value.clear();
      } else {
        students.value.forEach((student) =>
          selectedStudents.value.add(student.id)
        );
      }
    };

    const openBulkEvaluationModal = () => {
      // Initialize template with 0
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
          if (
            evaluation.value[student.id] &&
            evaluation.value[student.id][criterionId]
          ) {
            evaluation.value[student.id][criterionId].value =
              bulkEvaluationTemplate.value[criterionId];
          }
        }
        updateGrade(student); // Recalculate grade after applying
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
        setSuccessToastOpen(true); // Show success toast only after all are saved
        await fetchStudentCriterionScores(activityId); // Re-fetch scores to update IDs
      } catch (error) {
        // Error toast is already handled in saveEvaluation
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
      students,
      criteria,
      evaluation,
      arrowBackOutline,
      saveEvaluation,
      saveSingleEvaluation,
      handleAccordionChange,
      currentlyOpenStudentId,
      fetchStudentCriterionScores,
      registerAllGrades,
      presentConfirmAlert,
      isSaving,
      isSuccessToastOpen,
      setSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setErrorToastOpen,
      studentGrades,
      updateGrade,
      markAllAs,
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
    };
  },
};
</script>

<style scoped>
.button-row {
  justify-content: space-between;
}

.range-wrapper {
  width: 30%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 5px;
  font-size: 0.6em;
  margin-bottom: 5px;
}

.range-label {
  text-align: center;
  flex: 1;
}

.small-range {
  width: 70%;
}

.no-group-student {
  opacity: 0.6;
  font-style: italic;
}

ion-item ion-label {
  white-space: normal !important;
}
</style>
