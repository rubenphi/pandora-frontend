<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button
            :default-href="`/revisar/actividad/${activityId}`"
          ></ion-back-button>
        </ion-buttons>
        <ion-title>Evaluación Grupal</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="saveChanges" :disabled="isSaving">
            <ion-spinner v-if="isSaving" name="crescent"></ion-spinner>
            <span v-else>Guardar</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Nota de la Plantilla</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <h1 style="text-align: center; font-size: 3em; margin: 0">
            {{ templateGrade.toFixed(2) }}
          </h1>
        </ion-card-content>
      </ion-card>

      <ion-grid>
        <ion-row>
          <ion-col>
            <p>
              Asigne una puntuación a cada criterio. Se aplicará a los
              <strong>{{ studentIds.length }}</strong> estudiantes
              seleccionados.
            </p>
          </ion-col>
        </ion-row>
        <ion-row>
          <ion-col>
            <ion-button
              expand="block"
              @click="markAllAs('min')"
              color="danger"
              >0</ion-button
            >
          </ion-col>
          <ion-col>
            <ion-button
              expand="block"
              @click="markAllAs('mid')"
              color="warning"
              >Medio</ion-button
            >
          </ion-col>
          <ion-col>
            <ion-button
              expand="block"
              @click="markAllAs('max')"
              color="success"
              >Max</ion-button
            >
          </ion-col>
        </ion-row>
      </ion-grid>

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
            <ion-note slot="end" style="min-width: 40px; text-align: center">
              {{
                bulkEvaluationTemplate[criterion.id] != null
                  ? bulkEvaluationTemplate[criterion.id].toFixed(1)
                  : "-"
              }}
            </ion-note>
          </ion-item>
        </template>
      </ion-list>
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
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { tokenHeader, usuarioGet } from "../globalService";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonBackButton,
  onIonViewWillEnter,
  IonList,
  IonItem,
  IonLabel,
  IonRange,
  IonGrid,
  IonRow,
  IonCol,
  IonNote,
  IonSpinner,
  IonToast,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from "@ionic/vue";

export default {
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonRange,
    IonGrid,
    IonRow,
    IonCol,
    IonNote,
    IonSpinner,
    IonToast,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
  },
  setup() {
    const router = useRouter();
    const usuario = ref(null);
    const activityId = ref(null);
    const studentIds = ref([]);
    const criteria = ref([]);
    const bulkEvaluationTemplate = ref({});
    const existingScores = ref({});
    const isSaving = ref(false);

    const isSuccessToastOpen = ref(false);
    const setSuccessToastOpen = (val) => (isSuccessToastOpen.value = val);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const setErrorToastOpen = (val, message = "") => {
      isErrorToastOpen.value = val;
      errorMessage.value = message;
    };

    const templateGrade = computed(() => {
      if (criteria.value.length === 0) {
        return 0;
      }

      let totalScore = 0;
      let maxPossibleScore = 0;

      for (const criterion of criteria.value) {
        const value = bulkEvaluationTemplate.value[criterion.id] || 0;
        maxPossibleScore += criterion.score;
        totalScore += value;
      }

      if (maxPossibleScore === 0) {
        return 0;
      }
      return (totalScore / maxPossibleScore) * 5;
    });

    const fetchCriteria = async (id) => {
      try {
        const response = await axios.get(
          `/criteria?activityId=${id}`,
          tokenHeader()
        );
        criteria.value = response.data.sort((a, b) => a.id - b.id);
        // Initialize template with 0
        criteria.value.forEach((c) => {
          bulkEvaluationTemplate.value[c.id] = 0;
        });
      } catch (error) {
        console.error("Error in fetchCriteria:", error.message || error);
        setErrorToastOpen(true, "Error al cargar los criterios.");
      }
    };

    const fetchStudentCriterionScores = async (id) => {
      try {
        const response = await axios.get(
          `/student-criterion-scores/getAll?activityId=${id}`,
          tokenHeader()
        );
        const fetchedScores = response.data;
        const scoresMap = {};
        fetchedScores.forEach((score) => {
          if (!scoresMap[score.student.id]) {
            scoresMap[score.student.id] = {};
          }
          scoresMap[score.student.id][score.criterion.id] = score.id;
        });
        existingScores.value = scoresMap;
      } catch (error) {
        console.error(
          "Error in fetchStudentCriterionScores:",
          error.message || error
        );
      }
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      const state = window.history.state;
      if (state && state.activityId && state.studentIds) {
        activityId.value = state.activityId;
        studentIds.value = state.studentIds;
        await fetchCriteria(activityId.value);
        await fetchStudentCriterionScores(activityId.value);
      } else {
        router.back();
      }
    });

    const markAllAs = (valueType) => {
      for (const criterionId in bulkEvaluationTemplate.value) {
        const criterion = criteria.value.find((c) => c.id == criterionId);
        if (criterion) {
          let score = 0;
          if (valueType === "mid") {
            score = criterion.score / 2;
          } else if (valueType === "max") {
            score = criterion.score;
          }
          bulkEvaluationTemplate.value[criterionId] = score;
        }
      }
    };

    const saveChanges = async () => {
      isSaving.value = true;
      const savePromises = [];

      studentIds.value.forEach((studentId) => {
        criteria.value.forEach((criterion) => {
          const score = bulkEvaluationTemplate.value[criterion.id];
          if (score !== null) {
            const payload = {
              studentId: studentId,
              criterionId: criterion.id,
              score: score,
              instituteId: usuario.value.institute.id,
              activityId: parseInt(activityId.value),
            };

            const scoreId = existingScores.value[studentId]
              ? existingScores.value[studentId][criterion.id]
              : null;

            let promise;
            if (scoreId) {
              promise = axios.patch(
                `/student-criterion-scores/update/${scoreId}`,
                payload,
                tokenHeader()
              );
            } else {
              promise = axios.post(
                `/student-criterion-scores/create`,
                payload,
                tokenHeader()
              );
            }
            savePromises.push(promise);
          }
        });
      });

      try {
        await Promise.all(savePromises);
        setSuccessToastOpen(true);
        setTimeout(() => router.back(), 1000);
      } catch (error) {
        const message =
          error.response?.data?.message ||
          "Error al guardar una o más evaluaciones.";
        setErrorToastOpen(true, message);
      } finally {
        isSaving.value = false;
      }
    };

    return {
      activityId,
      studentIds,
      criteria,
      bulkEvaluationTemplate,
      isSaving,
      markAllAs,
      saveChanges,
      isSuccessToastOpen,
      setSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setErrorToastOpen,
      templateGrade,
    };
  },
};
</script>

<style scoped>
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
</style>
