<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Lecciones</ion-title>

        <ion-buttons slot="start" class="ion-margin-end">
          <ion-button v-if="curso" :href="'/areas/' + curso">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-buttons v-if="adminOProfesor" slot="end" class="ion-margin-end">
          <ion-button
            v-if="curso && area"
            slot="end"
            :href="`/crear/leccion/${curso}/${area}/${year}`"
          >
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card v-for="leccion in lecciones" :key="leccion.id">
        <ion-item lines="none">
          <div>
            <ion-card-header>
              <ion-card-subtitle>{{ cursoSelected.name }}</ion-card-subtitle>

              <ion-card-title>{{ leccion.topic }}</ion-card-title>
            </ion-card-header>

            <ion-card-content>
              {{ leccion.date.substring(0, 10) }}
            </ion-card-content>
          </div>
          <ion-buttons slot="end">
            <ion-button
              v-if="adminOProfesor"
              :href="`/crear/leccion/${leccion.id}`"
            >
              <ion-icon :icon="createOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-item>
        <ion-button
          fill="clear"
          @click="toggleSection(leccion.id, 'materiales')"
          >Material de apoyo</ion-button
        >
        <ion-button
          fill="clear"
          @click="toggleSection(leccion.id, 'cuestionarios')"
          :class="{
            sinNota: leccionesConCuestionariosPendientes.includes(leccion.id),
          }"
          >Cuestionarios</ion-button
        >
        <ion-button
          fill="clear"
          @click="toggleSection(leccion.id, 'actividades')"
          :class="{
            sinNota: leccionesConActividadesPendientes.includes(leccion.id),
          }"
          >Actividad</ion-button
        >

        <!-- Materiales List -->
        <ion-list
          v-if="openedLessonId === leccion.id && openedSection === 'materiales'"
        >
          <ion-item v-if="isLoadingMaterials">
            <ion-label>Cargando materiales...</ion-label>
          </ion-item>
          <ion-item v-else-if="materialsList.length === 0">
            <ion-label>No hay material de apoyo</ion-label>
          </ion-item>
          <ion-item v-else v-for="material in materialsList" :key="material.id">
            <ion-label @click="openMaterial(material)">{{
              material.name
            }}</ion-label>
            <ion-button
              slot="end"
              fill="clear"
              v-if="adminOProfesor"
              :href="'/crear/material/' + leccion.id + '/' + material.id"
            >
              <ion-icon :icon="createOutline"></ion-icon>
            </ion-button>
          </ion-item>
          <ion-item v-if="adminOProfesor">
            <ion-button
              expand="full"
              :router-link="`/crear/material/${leccion.id}`"
            >
              <ion-icon :icon="addOutline"></ion-icon>
              <ion-label>Crear Material</ion-label>
            </ion-button>
          </ion-item>
        </ion-list>

        <!-- Cuestionarios List -->
        <ion-list
          v-if="
            openedLessonId === leccion.id && openedSection === 'cuestionarios'
          "
        >
          <ion-item v-if="isLoadingCuestionarios">
            <ion-label>Cargando cuestionarios...</ion-label>
          </ion-item>
          <ion-item v-else-if="cuestionariosList.length === 0">
            <ion-label>No hay cuestionarios</ion-label>
          </ion-item>
          <ion-item
            @click="lessonSelected(cuestionario)"
            v-else
            v-for="cuestionario in cuestionariosList"
            :key="cuestionario.id"
            :href="cuestionario.url"
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
          v-if="
            openedLessonId === leccion.id && openedSection === 'actividades'
          "
        >
          <ion-item v-if="isLoadingActivities">
            <ion-label>Cargando actividades...</ion-label>
          </ion-item>
          <ion-item v-else-if="actvitiesList.length === 0">
            <ion-label>No hay actividades</ion-label>
          </ion-item>
          <ion-item
            v-else
            v-for="actividad in actvitiesList"
            :key="actividad.id"
            :href="actividad.url"
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
    </ion-content>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import {
  tokenHeader,
  usuarioGet,
  adminOprofesor,
  basedeURL,
  selectedPeriod,
} from "../globalService";
import { useRoute } from "vue-router";
import router from "../router";
import { addOutline, arrowBackOutline, createOutline } from "ionicons/icons";
import MaterialModal from "../components/MaterialModal.vue";

const MaterialType = {
  VIDEO: "VIDEO",
  PDF: "PDF",
  IMAGE: "IMAGE",
  AUDIO: "AUDIO",
  DOC: "DOC",
  TEXT_RICH: "TEXT_RICH",
  TEXT_SHORT: "TEXT_SHORT",
};

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
} from "@ionic/vue";
import { modalController } from "@ionic/vue";

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
  },
  methods: {
    lessonSelected: function (cuestionario) {
      localStorage.setItem("lessonSelected", JSON.stringify(cuestionario));
    },
  },
  setup() {
    const mroute = useRoute();
    const { curso } = mroute.params;
    const { area } = mroute.params;
    const { year } = mroute.params;
    const backendUrl = basedeURL();
    const { periodo } = mroute.params;
    const cursoSelected = ref(
      JSON.parse(localStorage.getItem("courseSelected"))
    );
    const cursosUsuario = ref(
      JSON.parse(localStorage.getItem("cursosUsuario"))
    );
    const usuario = ref();
    const adminOProfesor = ref();
    const lecciones = ref([]);
    const leccionesConCuestionariosPendientes = ref([]);
    const leccionesConActividadesPendientes = ref([]);
    const materialsList = ref([]);
    const cuestionariosList = ref([]);
    const actvitiesList = ref([]);

    const isLoadingMaterials = ref(false);
    const isLoadingCuestionarios = ref(false);
    const isLoadingActivities = ref(false);

    const openedLessonId = ref(null);
    const openedSection = ref(null);

    const openMaterial = async (material) => {
      const modal = await modalController.create({
        component: MaterialModal,
        componentProps: {
          material: {
            id: material.id,
            name: material.name,
            type: material.type,
            url: backendUrl + material.url,
            lesson: material.lesson,
            title: material.title,
            content: material.content,
          },
        },
      });
      modal.present();
    };

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
          case "materiales":
            materialesConsulta(leccionId);
            break;
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

      if (adminOProfesor.value) {
        try {
          const response = await axios.get(`/quizzes/pending-grading`, {
            params: {
              courseId: curso,
              periodId: selectedPeriod(),
              year: year,
              instituteId: usuario.value.institute.id,
            },
          });

          leccionesConCuestionariosPendientes.value = response.data.map(
            (quiz) => quiz.lesson.id
          );
        } catch (error) {
          console.error("Error fetching pending quizzes:", error);
        }

        try {
          const response = await axios.get(`/activities/pending-grading`, {
            params: {
              courseId: curso,
              year: year,
              periodId: selectedPeriod(),
              instituteId: usuario.value.institute.id,
            },
          });
          leccionesConActividadesPendientes.value = response.data.map(
            (activity) => activity.lesson.id
          );
        } catch (error) {
          console.error("Error fetching pending activities:", error);
        }
      }

      if (curso != cursosUsuario.value[0].id && !adminOprofesor()) {
        router.push("/lecciones/" + cursosUsuario.value[0].id + "/" + area);
      } else {
        await axios
          .get(
            `/lessons?courseId=${curso}&areaId=${area}&periodId=${periodo}${
              year ? "&year=" + year : ""
            }&exist=true&type=standard`
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
        // Re-fetch materials if the section was open
        if (openedLessonId.value && openedSection.value === "materiales") {
          await materialesConsulta(openedLessonId.value);
        }
      }
    });

    const cuestionarioConsulta = async (lessonId) => {
      isLoadingCuestionarios.value = true;
      cuestionariosList.value = []; // Clear previous data
      await axios
        .get(
          `/lessons/${lessonId}/quizzes
          `
        )
        .then((response) => {
          cuestionariosList.value = response.data
            .map((cuestionario) => ({
              id: cuestionario.id,
              name: cuestionario.title,
              lesson: cuestionario.lesson,
              url: `/cuestionario/${cuestionario.id}`,
            }))
            .sort((a, b) => {
              return new Date(a.date) - new Date(b.date);
            });
        })
        .catch((error) => {
          console.error("Error fetching quizzes:", error);
          cuestionariosList.value = [];
        })
        .finally(() => {
          isLoadingCuestionarios.value = false;
        });
    };

    const materialesConsulta = async (lessonId) => {
      isLoadingMaterials.value = true;
      materialsList.value = []; // Clear previous data
      await axios
        .get(`/materials?lessonId=${lessonId}`)
        .then((response) => {
          materialsList.value = response.data.map((material) => ({
            ...material,
            name: material.title, // Keep name for display in Tab3Page
          }));
        })
        .catch((error) => {
          console.error("Error fetching materials:", error);
          materialsList.value = [];
        })
        .finally(() => {
          isLoadingMaterials.value = false;
        });
    };

    const actividadesConsulta = async (lessonId) => {
      isLoadingActivities.value = true;
      actvitiesList.value = []; // Clear previous data
      await axios
        .get(`/activities?lessonId=${lessonId}`)
        .then((response) => {
          actvitiesList.value = response.data.map((actividad) => ({
            id: actividad.id,
            name: actividad.title, // Use 'title' from backend Activity entity
            url: `/actividades/${actividad.id}`,
          }));
        })
        .catch((error) => {
          console.error("Error fetching activities:", error);
          actvitiesList.value = [];
        })
        .finally(() => {
          isLoadingActivities.value = false;
        });
    };

    return {
      basedeURL,
      materialesConsulta,
      actividadesConsulta,
      cuestionarioConsulta,
      materialsList,
      createOutline,
      cuestionariosList,
      actvitiesList,
      cursoSelected,
      adminOProfesor,
      area,
      curso,
      addOutline,
      arrowBackOutline,
      usuario,
      lecciones,
      leccionesConCuestionariosPendientes,
      leccionesConActividadesPendientes,
      year,
      openedLessonId,
      openedSection,
      toggleSection,
      isLoadingMaterials,
      isLoadingCuestionarios,
      isLoadingActivities,
      MaterialType,
      openMaterial,
    };
  },
};
</script>

<style scoped>
.sinNota {
  color: orange;
}
</style>
