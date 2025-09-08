<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="'/actividades/' + activityId">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Ver mi revisión</ion-title>
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
import { ref, onMounted } from "vue";
import axios from "axios";
import { tokenHeader, usuarioGet } from "../globalService";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonPage,
  IonIcon,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonAccordionGroup,
  IonAccordion,
  IonRange,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
  IonNote,
} from "@ionic/vue";
import { useRoute } from "vue-router";
import { arrowBackOutline } from "ionicons/icons";

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
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonAccordionGroup,
    IonAccordion,
    IonRange,
    IonGrid,
    IonRow,
    IonCol,
    IonToast,
    IonNote,
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

    const isSuccessToastOpen = ref(false);
    const setSuccessToastOpen = (val) => (isSuccessToastOpen.value = val);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const setErrorToastOpen = (val, message = "") => {
      isErrorToastOpen.value = val;
      errorMessage.value = message;
    };

    usuario.value = usuarioGet();

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
          `/student-criterion-scores/permissions?reviserId=${usuario.value.id}&activityId=${activityId.value}`,
          tokenHeader()
        );
        const permisosGrupales = await axios.get(
          `/student-criterion-scores/permissions?reviserId=${grupoUsuario.value.id}&activityId=${activityId.value}`,
          tokenHeader()
        );
        userPermissions.value = permisosIndividuales.data;

        userPermissions.value.push(...permisosGrupales.data);
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
            const isAlreadyAdded = allStudents.some(student => student.id === userResponse.data.id);
            if (!isAlreadyAdded) {
              allStudents.push(userResponse.data);
            }
          }
        } else if (permission.revisedType === "Group") {
          const groupUsersResponse = await axios.get(
            `/groups/${permission.revisedId}/${year}/users`,
            tokenHeader()
          );
          groupUsersResponse.data.forEach((u) => {
            if (u.user) {
              const isAlreadyAdded = allStudents.some(student => student.id === u.user.id);
              if (!isAlreadyAdded) {
                allStudents.push(u.user);
              }
            }
          });
        }
      }

      const usersNoGroupResponse = await axios.get(
        `/courses/${courseId}/usersNoGroup?year=${year}`,
        tokenHeader()
      );
      const usersWithoutGroupIds = new Set(
        usersNoGroupResponse.data.map((u) => u.user.id)
      );
      students.value = allStudents.map((student) => ({
        ...student,
        hasGroup: !usersWithoutGroupIds.has(student.id),
      }));
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
        const fetchedScores = response.data;

        fetchedScores.forEach((score) => {
          if (
            evaluation.value[score.student.id] &&
            evaluation.value[score.student.id][score.criterion.id]
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

    const calculateFinalGrade = (student) => {
      let totalScore = 0;
      let maxPossibleScore = 0;

      for (const criterionId in evaluation.value[student.id]) {
        const evaluationEntry = evaluation.value[student.id][criterionId];
        const value =
          evaluationEntry.value === null ? 0 : evaluationEntry.value;
        const criterion = criteria.value.find((c) => c.id == criterionId);

        if (criterion) {
          maxPossibleScore += criterion.score;
          totalScore += value;
        }
      }
      if (maxPossibleScore === 0) return 0;
      return (totalScore / maxPossibleScore) * 5;
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

    const handleAccordionChange = (event, student) => {
      if (event.detail.checked) {
        currentlyOpenStudentId.value = student.id;
        updateGrade(student);
      } else {
        currentlyOpenStudentId.value = null;
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
            const score = value;

            const payload = {
              studentId: student.id,
              criterionId: parseInt(criterionId),
              score: score,
              instituteId: usuario.value.institute.id,
              activityId: parseInt(activityId.value),
            };

            const permission = userPermissions.value.find((p) => {
              if (p.revisedType === "User") return p.revisedId === student.id;
              if (p.revisedType === "Group") {
                return true; // Simplified, backend will validate membership
              }
              return false;
            });
            if (permission) {
              payload.permissionId = permission.id;
            } else {
              throw new Error("No permission to evaluate this student.");
            }

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
        setSuccessToastOpen(true);
        await fetchStudentCriterionScores();
      } catch (error) {
        const message =
          error.response?.data?.message || "Error al guardar la evaluación";
        setErrorToastOpen(true, message);
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

    return {
      activityId,
      arrowBackOutline,
      students,
      criteria,
      evaluation,
      saveEvaluation,
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
      markAllAs,
      usuario,
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
</style>
