<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item>
          <ion-label position="stacked">Título</ion-label>
          <ion-input
            v-model="activityForm.title"
            type="text"
            required
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Clasificaciones (Dimensiones)</ion-label>
          <ion-select
            v-model="activityForm.classifications"
            multiple="true"
            placeholder="Seleccione dimensiones"
            ok-text="Aceptar"
            cancel-text="Cancelar"
          >
            <ion-select-option value="knowledge"
              >Saber (Conocimiento)</ion-select-option
            >
            <ion-select-option value="execution"
              >Hacer (Ejecución)</ion-select-option
            >
            <ion-select-option value="behavior"
              >Ser (Comportamiento)</ion-select-option
            >
          </ion-select>
        </ion-item>

        <ion-item lines="none">
          <ion-label position="stacked">Instrucciones (Opcional)</ion-label>
        </ion-item>
        <div class="ion-padding-start ion-padding-end ion-padding-bottom">
          <tiptap-editor v-model="activityForm.instructions" />
        </div>

        <!-- instituteId will be handled by globalService.usuario.institute.id -->
      </ion-list>
      <div class="ion-padding">
        <ion-button expand="block" @click="saveActivity"
          >Guardar Actividad</ion-button
        >
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, computed } from "vue";
import axios from "axios";
import { useRouter, useRoute } from "vue-router";
import {
  onIonViewWillEnter,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonIcon,
  IonSelect,
  IonSelectOption,
} from "@ionic/vue";
import { tokenHeader, usuarioGet } from "../globalService";
import { arrowBackOutline } from "ionicons/icons";
import TiptapEditor from "../components/TiptapEditor.vue";

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
    IonInput,
    IonButton,
    IonButtons,
    IonIcon,
    IonSelect,
    IonSelectOption,
    TiptapEditor,
  },
  setup() {
    const router = useRouter();
    const mroute = useRoute();
    const lessonId = parseInt(mroute.params.lessonId, 10);
    let activityId = mroute.params.id ? parseInt(mroute.params.id, 10) : null; // Get optional activity ID

    const activityForm = ref({
      id: activityId, // Initialize with activityId
      title: "",
      instructions: "",
      classifications: ["execution"], // Default
      lessonId: lessonId,
      instituteId: null,
    });
    const usuario = ref(null);
    const lessonDetails = ref(null);

    const backUrl = ref("");

    const pageTitle = computed(() => {
      return activityId ? "Editar Actividad" : "Crear Actividad";
    });

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      activityForm.value.instituteId = usuario.value.institute.id;

      try {
        const response = await axios.get(`/lessons/${lessonId}`, tokenHeader());
        lessonDetails.value = response.data;

        if (!activityId) {
          const { course, area, period, year, type } = lessonDetails.value;
          backUrl.value = `/lecciones/${course.id}/${area.id}/${period.id}/${year}${type ? '/' + type : ''}`;
        } else if (activityId) {
          backUrl.value = `/actividades/${activityId}`;
        }

        if (activityId) {
          // If editing, fetch activity details
          const activityResponse = await axios.get(
            `/activities/${activityId}`,
            tokenHeader()
          );
          activityForm.value.title = activityResponse.data.title;
          activityForm.value.instructions = activityResponse.data.instructions;
          activityForm.value.classifications = activityResponse.data.classifications?.length
            ? activityResponse.data.classifications
            : ["execution"];
          // Ensure lessonId and instituteId are correctly set from fetched data if needed
          activityForm.value.lessonId = activityResponse.data.lesson.id;
          activityForm.value.instituteId = activityResponse.data.institute.id;
        }
      } catch (error) {
        console.error("Error fetching lesson or activity details:", error);
        return;
      }
    });

    const saveActivity = async () => {
      try {
        if (activityId) {
          // Update existing activity
          delete activityForm.value.id;
          await axios.patch(
            `/activities/${activityId}`,
            activityForm.value,
            tokenHeader()
          );
        } else {
          delete activityForm.value.id;
          // Create new activity
          await axios
            .post("/activities", activityForm.value, tokenHeader())
            .then((response) => {
              activityId = response.data.id; // Set the ID of the newly created activity
            });
        }
        // Redirect to the activity view after saving
        router.push(`/actividades/${activityId}`);
      } catch (error) {
        console.error("Error saving activity:", error);
        alert("Error al guardar la actividad. Por favor, intente de nuevo.");
      }
    };

    const goBack = () => {
      if (backUrl.value) {
        router.push(backUrl.value);
      } else {
        router.back();
      }
    };

    return {
      activityForm,
      saveActivity,
      backUrl,
      arrowBackOutline,
      pageTitle,
      goBack,
    };
  },
};
</script>

<style>
/* Remove default Tiptap/ProseMirror styles that might conflict */
.ProseMirror {
  outline: none !important;
  height: 100%; /* Ensure ProseMirror itself takes full height */
}

.ProseMirror :focus {
  outline: none !important; /* Remove focus outline */
}
.ProseMirror p {
  margin: 0; /* Remove default paragraph margins */
}

.margen {
  font-family: serif;
  margin-left: 0px;
  margin-right: 3px;
  font-size: 12pt;
}

.editor-content {
  min-height: 25vh; /* 25% de la altura del viewport */
  border: 1px solid var(--ion-color-step-150, #d7d8da); /* Borde para visualizar la altura */
  border-radius: 4px;
  padding: 8px;
  box-sizing: border-box; /* Incluye padding y borde en el cálculo de la altura */
  margin: 16px;
  display: flex; /* Make it a flex container */
  flex-direction: column; /* Stack children vertically */
  overflow: hidden; /* Hide overflow to prevent scrollbars on the container */
}

.tiptap-editor-area {
  flex-grow: 1; /* Allow the editor content to grow and fill available space */
  min-height: 100%; /* Ensure it takes at least 100% of the flex container's height */
  outline: none !important; /* Remove the outline on focus */
  text-align: left; /* Ensure text aligns to the left */
  overflow-y: auto; /* Add scrollbar if content overflows vertically */
}
</style>
