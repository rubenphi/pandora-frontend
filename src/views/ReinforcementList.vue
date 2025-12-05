<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Refuerzos</ion-title>
        <ion-buttons slot="start" class="ion-margin-end">
          <ion-button v-if="curso" :href="'/areas/' + curso">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons v-if="adminOProfesor" slot="end" class="ion-margin-end">
          <ion-button
            v-if="curso && area"
            slot="end"
            :href="`/crear/refuerzo/${curso}/${area}/${year}/${periodo}`"
          >
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
        <div class="ion-padding" v-if="adminOProfesor || showReinforcementToggle">
            <ion-segment :value="'reinforcement'" @ionChange="segmentChanged">
                <ion-segment-button value="standard">
                    <ion-label>Lecciones</ion-label>
                </ion-segment-button>
                <ion-segment-button value="reinforcement">
                    <ion-label>Refuerzos</ion-label>
                </ion-segment-button>
            </ion-segment>
        </div>
      <ion-card v-for="leccion in lecciones" :key="leccion.id">
        <ion-item lines="none">
          <div>
            <ion-card-header>
              <ion-card-subtitle>{{ cursoSelected ? cursoSelected.name : 'Curso' }}</ion-card-subtitle>
              <ion-card-title>{{ leccion.topic }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              {{ leccion.date.substring(0, 10) }}
            </ion-card-content>
          </div>
          <ion-buttons slot="end">
             <ion-button v-if="adminOProfesor" :router-link="`/crear/refuerzo/${curso}/${area}/${year}/${periodo}/${leccion.id}`">
                <ion-icon :icon="createOutline" slot="icon-only"></ion-icon>
             </ion-button>
          </ion-buttons>
        </ion-item>
        <ion-button
          fill="clear"
          @click="toggleSection(leccion.id, 'cuestionarios')"
          >Cuestionarios</ion-button
        >
        <ion-button
          fill="clear"
          @click="toggleSection(leccion.id, 'actividades')"
          >Actividad</ion-button
        >

        <!-- Cuestionarios List -->
        <ion-list
          v-if="openedLessonId === leccion.id && openedSection === 'cuestionarios'"
        >
           <ion-item v-if="isLoadingCuestionarios">
            <ion-label>Cargando...</ion-label>
          </ion-item>
           <ion-item v-else-if="cuestionariosList.length === 0">
            <ion-label>No hay cuestionarios</ion-label>
          </ion-item>
          <ion-item
            v-else
            v-for="cuestionario in cuestionariosList"
            :key="cuestionario.id"
            :href="'/cuestionario/' + cuestionario.id"
          >
            <ion-label>{{ cuestionario.name }}</ion-label>
          </ion-item>
           <ion-item v-if="adminOProfesor">
            <ion-button
              expand="full"
              :router-link="`/crear/cuestionario/${leccion.id}`"
            >
              <ion-icon :icon="addOutline"></ion-icon>
              <ion-label>Crear Cuestionario</ion-label>
            </ion-button>
          </ion-item>
        </ion-list>

        <!-- Actividades List -->
        <ion-list
          v-if="openedLessonId === leccion.id && openedSection === 'actividades'"
        >
          <ion-item v-if="isLoadingActivities">
            <ion-label>Cargando...</ion-label>
          </ion-item>
           <ion-item v-else-if="actvitiesList.length === 0">
            <ion-label>No hay actividades</ion-label>
          </ion-item>
          <ion-item
            v-else
            v-for="actividad in actvitiesList"
            :key="actividad.id"
            :href="'/actividades/' + actividad.id"
          >
            <ion-label>{{ actividad.name }}</ion-label>
          </ion-item>
          <ion-item v-if="adminOProfesor">
            <ion-button
              expand="full"
              :router-link="`/crear/actividad/${leccion.id}`"
            >
              <ion-icon :icon="addOutline"></ion-icon>
              <ion-label>Crear Actividad</ion-label>
            </ion-button>
          </ion-item>
        </ion-list>

      </ion-card>
      <ion-item v-if="lecciones.length === 0">
          <ion-label class="ion-text-center">No hay refuerzos creados para este periodo.</ion-label>
      </ion-item>
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import router from "../router";
import { ref } from "vue";
import {
  tokenHeader,
  usuarioGet,
  adminOprofesor,
} from "../globalService";
import { useRoute } from "vue-router";
import { addOutline, arrowBackOutline, createOutline } from "ionicons/icons";
import {
  onIonViewWillEnter,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton
} from "@ionic/vue";

export default {
  components: {
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSegment,
    IonSegmentButton
  },
  setup() {
    const mroute = useRoute();
    const { curso } = mroute.params;
    const { area } = mroute.params;
    const { year } = mroute.params;
    const { periodo } = mroute.params;
    
    const cursoSelected = ref(
      JSON.parse(localStorage.getItem("courseSelected"))
    );
    const usuario = ref();
    const adminOProfesor = ref();
    const lecciones = ref([]);
    const cuestionariosList = ref([]);
    const actvitiesList = ref([]);
    
    const isLoadingCuestionarios = ref(false);
    const isLoadingActivities = ref(false);
    const openedLessonId = ref(null);
    const openedSection = ref(null);

    const toggleSection = (leccionId, section) => {
      if (
        openedLessonId.value === leccionId &&
        openedSection.value === section
      ) {
        openedLessonId.value = null;
        openedSection.value = null;
      } else {
        openedLessonId.value = leccionId;
        openedSection.value = section;
        switch (section) {
          case "cuestionarios":
            cuestionarioConsulta(leccionId);
            break;
          case "actividades":
            actividadesConsulta(leccionId);
            break;
        }
      }
    };

    onIonViewWillEnter(async () => {
      adminOProfesor.value = adminOprofesor();
      usuario.value = usuarioGet();
      tokenHeader();

      await axios
        .get(
          `/lessons?courseId=${curso}&areaId=${area}&periodId=${periodo}${
            year ? "&year=" + year : ""
          }&exist=true&type=reinforcement`
        )
        .then((response) => {
          lecciones.value = response.data
            .map((leccion) => ({
              id: leccion.id,
              topic: leccion.topic,
              date: leccion.date,
              area: { id: leccion.area.id },
              course: { id: leccion.course.id },
              year: leccion.year,
            }))
            .sort((a, b) => {
              return new Date(a.date) - new Date(b.date);
            });
        });
    });

    const cuestionarioConsulta = async (lessonId) => {
      isLoadingCuestionarios.value = true;
      cuestionariosList.value = [];
      await axios
        .get(`/lessons/${lessonId}/quizzes`)
        .then((response) => {
          cuestionariosList.value = response.data.map((c) => ({
             id: c.id,
             name: c.title,
          }));
        })
        .finally(() => {
          isLoadingCuestionarios.value = false;
        });
    };

    const actividadesConsulta = async (lessonId) => {
      isLoadingActivities.value = true;
      actvitiesList.value = [];
      await axios
        .get(`/activities?lessonId=${lessonId}`)
        .then((response) => {
          actvitiesList.value = response.data.map((a) => ({
             id: a.id,
             name: a.title,
          }));
        })
        .finally(() => {
          isLoadingActivities.value = false;
        });
    };

    const showReinforcementToggle = ref(true); // Always true here if we are here?

    // Actually, if a student navigates here manually but has no reinforcements, what happens?
    // They see empty list. But they should see the toggle to go back to standard.
    
    const segmentChanged = (ev) => {
        if (ev.detail.value === 'standard') {
             router.push(`/lecciones/${curso}/${area}/${periodo}/${year}`);
        }
    };

    return {
      lecciones,
      cursoSelected,
      adminOProfesor,
      area,
      curso,
      periodo,
      year,
      addOutline,
      arrowBackOutline,
      createOutline,
      openedLessonId,
      openedSection,
      toggleSection,
      cuestionariosList,
      actvitiesList,
      isLoadingCuestionarios,
      isLoadingActivities,
      showReinforcementToggle,
      segmentChanged,
    };
  },
};
</script>
