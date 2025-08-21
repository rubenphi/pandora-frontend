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
              @click="saveEvaluation(student)"
              :disabled="isSaving"
              >Guardar</ion-button
            >
            <ion-list>
              <template v-for="criterion in criteria" :key="criterion.id">
                <ion-item>
                  <ion-label>{{ criterion.description }}</ion-label>
                  <div class="range-wrapper">
                    <div class="range-labels">
                      <span class="range-label">No Cumple</span>
                      <span class="range-label">Parcialmente</span>
                      <span class="range-label">Cumple</span>
                    </div>
                    <ion-range
                      :value="evaluation[student.id][criterion.id].value"
                      @ionChange="
                        (evaluation[student.id][criterion.id].value =
                          $event.detail.value),
                          updateGrade(student)
                      "
                      min="0"
                      max="2"
                      step="1"
                      snaps="true"
                      ticks="true"
                      class="small-range"
                    >
                    </ion-range>
                  </div>
                </ion-item>
              </template>
              <ion-item>
                <ion-grid>
                  <ion-row class="button-row">
                    <ion-col size="auto">
                      <ion-button
                        @click="saveEvaluation(student)"
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
    </ion-content>
  </ion-page>
</template>

<script>
import { ref } from "vue";
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

    const isSuccessToastOpen = ref(false);
    const setSuccessToastOpen = (val) => (isSuccessToastOpen.value = val);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const setErrorToastOpen = (val, message = "") => {
      isErrorToastOpen.value = val;
      errorMessage.value = message;
    };

    // Fetch user data on component setup
    usuario.value = usuarioGet();

    const fetchActivityDetails = async () => {
      try {
        const response = await axios.get(
          `/activities/${activityId}`,
          tokenHeader()
        );

        const courseId = response.data.lesson.course.id;
        const year = response.data.lesson.year; // Get the year from the lesson
        periodId.value = response.data.lesson.period.id;
        instituteId.value = response.data.institute.id;

        await fetchCriteria(activityId); // Fetch criteria first

        await fetchStudents(courseId, year);

        await fetchStudentCriterionScores(activityId);
      } catch (error) {
        console.error("Error in fetchActivityDetails:", error.message || error);
      }
    };

    const fetchStudentCriterionScores = async (activityId) => {
      try {
        const response = await axios.get(
          `/student-criterion-scores?activityId=${activityId}`,
          tokenHeader()
        );
        const fetchedScores = response.data;

        // Populate evaluation with fetched scores
        fetchedScores.forEach((score) => {
          if (evaluation.value[score.student.id]) {
            // Convert string value back to number for ion-range
            let numericValue = null;
            if (score.score === 0) {
              numericValue = 0; // No Cumple
            } else if (score.score === score.criterion.score / 2) {
              numericValue = 1; // Cumple Parcialmente
            } else if (score.score === score.criterion.score) {
              numericValue = 2; // Cumple
            }
            evaluation.value[score.student.id][score.criterion.id] = {
              value: numericValue,
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
          if (value === 0) {
            totalScore += 0; // No Cumple
          } else if (value === 1) {
            totalScore += criterion.score / 2; // Cumple Parcialmente
          } else if (value === 2) {
            totalScore += criterion.score; // Cumple
          }
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
        const usersWithoutGroupIds = new Set(usersNoGroupResponse.data.map(u => u.user.id));

        students.value = allStudents.map(student => ({
          ...student,
          hasGroup: !usersWithoutGroupIds.has(student.id)
        }));

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
      isSaving.value = true;
      try {
        for (const criterionId in evaluation.value[student.id]) {
          const evaluationEntry = evaluation.value[student.id][criterionId];
          const value = evaluationEntry.value;
          const scoreId = evaluationEntry.id;

          if (value !== null) {
            // Only include evaluated criteria
            const criterion = criteria.value.find((c) => c.id == criterionId); // Find the criterion object

            let score = 0;
            if (criterion) {
              if (value === 0) {
                score = 0; // No Cumple
              } else if (value === 1) {
                score = criterion.score / 2; // Cumple Parcialmente
              } else if (value === 2) {
                score = criterion.score; // Cumple
              }
            }

            const payload = {
              studentId: student.id,
              criterionId: parseInt(criterionId),
              score: score,
              instituteId: usuario.value.institute.id, // Get instituteId from the logged-in user
              activityId: parseInt(activityId),
            };

            if (scoreId) {
              // Update existing score
              await axios.patch(
                `/student-criterion-scores/${scoreId}`,
                payload,
                tokenHeader()
              );
            } else {
              // Create new score
              const response = await axios.post(
                `/student-criterion-scores`,
                payload,
                tokenHeader()
              );

              // Update the evaluation ref with the new ID
              evaluation.value[student.id][criterionId].id = response.data.id;
            }
          }
        }
        setSuccessToastOpen(true);
        // After saving, re-fetch scores to ensure UI is up-to-date
        await fetchStudentCriterionScores(activityId);
      } catch (error) {
        const message =
          error.response?.data?.message || "Error al guardar la evaluación";
        setErrorToastOpen(true, message);
      } finally {
        isSaving.value = false;
      }
    };

    const registerAllGrades = async () => {
      for (const student of students.value) {
        // Phase 1: Ensure all individual criterion scores are persisted (defaulting null to 0)
        for (const criterion of criteria.value) {
          const evaluationEntry = evaluation.value[student.id][criterion.id];
          let valueToSave = evaluationEntry.value;

          // If the value is null (not explicitly evaluated), default to 0 (No Cumple)
          if (valueToSave === null) {
            valueToSave = 0;
          }

          let score = 0;
          if (valueToSave === 0) {
            score = 0; // No Cumple
          } else if (valueToSave === 1) {
            score = criterion.score / 2; // Cumple Parcialmente
          } else if (valueToSave === 2) {
            score = criterion.score; // Cumple
          }

          const payload = {
            studentId: student.id,
            criterionId: criterion.id,
            score: score,
            instituteId: usuario.value.institute.id,
            activityId: parseInt(activityId),
          };

          try {
            if (evaluationEntry.id) {
              // Update existing score
              await axios.patch(
                `/student-criterion-scores/${evaluationEntry.id}`,
                payload,
                tokenHeader()
              );
            } else {
              // Create new score
              const response = await axios.post(
                `/student-criterion-scores`,
                payload,
                tokenHeader()
              );
              // Update the evaluation ref with the new ID
              evaluation.value[student.id][criterion.id].id = response.data.id;
            }
          } catch (error) {
            console.error(
              `Error saving criterion score for student ${student.name}, criterion ${criterion.description}:`,
              error
            );
          }
        }

        // Phase 2: Calculate and register the overall activity grade
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
          console.error(
            `Error registrando nota final para ${student.name}:`,
            error
          );
        }
      }
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

    return {
      activityId,
      students,
      criteria,
      evaluation,
      arrowBackOutline,
      saveEvaluation,
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
    };
  },
};
</script>

<style scoped>
.button-row {
  justify-content: space-between;
}

.range-wrapper {
  width: 30%; /* Asegura que el wrapper ocupe todo el ancho disponible */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 5px; /* Reducir el padding para dar más espacio */
  font-size: 0.6em;
  margin-bottom: 5px;
}

.range-label {
  text-align: center;
  flex: 1;
}

.small-range {
  width: 70%; /* Ajusta este valor para controlar el ancho del rango */
}

.no-group-student {
  opacity: 0.6;
  font-style: italic;
}
</style>
