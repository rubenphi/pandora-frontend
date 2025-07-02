<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button
            v-if="actividad?.id != 0"
            :href="
              '/lecciones/' +
              actividad?.lesson?.course?.id +
              '/' +
              actividad?.lesson?.area?.id +
              '/' +
              actividad?.lesson?.period?.id +
              '/' +
              actividad?.lesson?.year
            "
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title size="large" class="ion-text-center">{{
          actividad.title
        }}</ion-title>
        <ion-buttons v-if="admin" slot="end" class="ion-margin-end">
          <ion-button
            v-if="actividad.id != 0"
            :href="`/crear/actividad/${actividad.lesson.id}/${actividad.id}`"
          >
            <ion-icon :icon="createOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card v-if="actividad.id != 0" class="ion-padding">
        <ion-card-header>
          <ion-card-title class="ion-text-center">Instrucciones</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div v-html="actividad.instructions"></div>
        </ion-card-content>
      </ion-card>

      <ion-card class="ion-padding" v-if="criteriaList">
        <ion-card-header
          class="ion-align-items-center ion-justify-content-between"
        >
          <ion-card-subtitle class="ion-text-center"
            >Criterios de Evaluación</ion-card-subtitle
          >
        </ion-card-header>
        <ion-list>
          <ion-item v-for="criterion in criteriaList" :key="criterion.id">
            <ion-icon
              v-if="admin"
              slot="start"
              :icon="createOutline"
            ></ion-icon>
            <ion-label
              v-if="admin"
              :router-link="`/crear/criterio/${actividad.id}#criterion-${criterion.id}`"
            >
              <b>{{ criterion.description }}</b>
              <p>Puntuación: {{ criterion.score }}</p>
            </ion-label>
            <ion-label v-else>
              <b>{{ criterion.description }}</b>
              <p>Puntuación: {{ criterion.score }}</p>
            </ion-label>
          </ion-item>
          <ion-item
            :router-link="`/crear/criterio/${actividad.id}`"
            v-if="admin"
          >
            <ion-icon slot="start" :icon="addOutline"></ion-icon>
            <ion-label>Añadir Criterio</ion-label>
          </ion-item>
        </ion-list>
      </ion-card>

      <!-- Espacio para el botón flotante -->
      <div style="height: 80px"></div>

      <ion-fab
        class="centered-fab"
        v-if="admin"
        vertical="bottom"
        horizontal="center"
        slot="fixed"
      >
        <ion-button
          class="pill-button"
          color="medium"
          :router-link="`/revisar/actividad/${actividad.id}`"
        >
          <ion-icon :icon="eyeOutline" slot="start"></ion-icon>
          Revisar Actividad
        </ion-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader, adminOprofesor } from "../globalService";

import {
  arrowBackOutline,
  createOutline,
  addOutline,
  eyeOutline,
} from "ionicons/icons";
import {
  IonLabel,
  IonItem,
  IonIcon,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  onIonViewWillEnter,
  IonCardSubtitle,
  IonFab,
} from "@ionic/vue";

import { useRoute } from "vue-router";

export default {
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardTitle,
    IonCardHeader,
    IonCardContent,
    IonCardSubtitle,
    IonList,
    IonItem,
    IonLabel,
    IonFab,
  },
  setup() {
    const admin = adminOprofesor();
    const mroute = useRoute();
    const { id } = mroute.params; // This 'id' will be activityId

    const actividad = ref({
      id: 0,
      title: "",
      instructions: "",
      lesson: {},
    });
    const criteriaList = ref([]);

    const fetchActivityDetails = async () => {
      try {
        const response = await axios.get(`/activities/${id}`);
        actividad.value = {
          ...response.data,
          lesson: response.data.lesson,
        };
      } catch (error) {
        console.error("Error fetching activity details:", error);
        // Handle error, e.g., redirect to a 404 page or show an alert
      }
    };

    const fetchCriteria = async () => {
      try {
        const criteriaResponse = await axios.get(`/criteria?activityId=${id}`);
        criteriaList.value = criteriaResponse.data.sort((a, b) => a.id - b.id);
      } catch (error) {
        console.error("Error fetching criteria:", error);
      }
    };

    onIonViewWillEnter(async () => {
      tokenHeader();

      // Only fetch activity details if not already loaded or if ID changes
      if (actividad.value.id != id || actividad.value.id === 0) {
        await fetchActivityDetails();
      }

      // Always fetch criteria to ensure they are up-to-date
      await fetchCriteria();
    });

    return {
      admin,
      actividad,
      criteriaList,
      arrowBackOutline,
      createOutline,
      addOutline,
      eyeOutline,
    };
  },
};
</script>

<style scoped>
.pill-button {
  --border-radius: 20px; /* Ajusta esto para más o menos redondez */
  --padding-start: 15px;
  --padding-end: 15px;
  --padding-top: 10px;
  --padding-bottom: 10px;
  font-size: 16px;
}

.centered-fab {
  left: 53%;
  transform: translateX(-50%);
}
</style>
