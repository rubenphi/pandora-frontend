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
                      disabled="true"
                    >
                    </ion-range>
                  </div>
                </ion-item>
              </template>
              
            </ion-list>
          </div>
        </ion-accordion>
      </ion-accordion-group>
      <!-- Toasts -->
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
  IonIcon,
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
    IonIcon,
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
          `/users/${usuario.value.id}/groups`,
          tokenHeader()
        );
        const group = response.data.filter((g) => g.active)[0]?.group;
        if (group) {
          const groupResponse = await axios.get(
            `/groups/${group.id}/${year}/users`,
            tokenHeader()
          );
          students.value = groupResponse.data.map((u) => u.user);
        } else {
          students.value = [usuario.value];
        }

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

    onIonViewWillEnter(async () => {
      await fetchActivityDetails();
    });

    return {
      activityId,
      students,
      criteria,
      evaluation,
      arrowBackOutline,
      handleAccordionChange,
      currentlyOpenStudentId,
      fetchStudentCriterionScores,
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
</style>
