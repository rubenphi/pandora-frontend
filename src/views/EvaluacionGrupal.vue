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

      <p style="padding: 0 16px">
        Asigne una puntuación a cada criterio. Se aplicará a los
        <strong>{{ studentIds.length }}</strong> estudiantes seleccionados.
      </p>

      <!-- Shared criterion list + 0/Medio/Max buttons -->
      <criterion-list
        :criteria="criteria"
        v-model="bulkEvaluationTemplate"
      />

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
import {
  useToast,
  saveCriterionScore,
} from "../composables/useEvaluation";
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
  IonSpinner,
  IonToast,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from "@ionic/vue";
import axios from "axios";
import { tokenHeader, usuarioGet } from "../globalService";
import CriterionList from "../components/CriterionList.vue";

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
    IonSpinner,
    IonToast,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    CriterionList,
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

    const {
      isSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setSuccessToastOpen,
      setErrorToastOpen,
    } = useToast();

    const templateGrade = computed(() => {
      if (criteria.value.length === 0) return 0;

      let totalScore = 0;
      let maxPossibleScore = 0;

      for (const criterion of criteria.value) {
        const value = bulkEvaluationTemplate.value[criterion.id] || 0;
        maxPossibleScore += criterion.score;
        totalScore += value;
      }

      if (maxPossibleScore === 0) return 0;
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
        const scoresMap = {};
        response.data.forEach((score) => {
          if (!scoresMap[score.student.id]) scoresMap[score.student.id] = {};
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

    const saveChanges = async () => {
      isSaving.value = true;
      const savePromises = [];

      studentIds.value.forEach((studentId) => {
        criteria.value.forEach((criterion) => {
          const score = bulkEvaluationTemplate.value[criterion.id];
          if (score !== null) {
            const payload = {
              studentId,
              criterionId: criterion.id,
              score,
              instituteId: usuario.value.institute.id,
              activityId: parseInt(activityId.value),
            };
            const scoreId =
              existingScores.value[studentId]?.[criterion.id] ?? null;
            savePromises.push(saveCriterionScore(scoreId, payload));
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
