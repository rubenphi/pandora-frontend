<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/encuestas"></ion-back-button>
        </ion-buttons>
        <ion-title>Nueva Encuesta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-list>
        <!-- Title -->
        <ion-item>
          <ion-label position="stacked">Título</ion-label>
          <ion-input
            v-model="form.title"
            placeholder="Ej: Encuesta del día"
            clearInput
          ></ion-input>
        </ion-item>

        <!-- Question -->
        <ion-item>
          <ion-label position="stacked">Pregunta</ion-label>
          <ion-textarea
            v-model="form.question"
            placeholder="Ej: ¿Cuál es tu color favorito?"
            :auto-grow="true"
          ></ion-textarea>
        </ion-item>

        <!-- Course -->
        <ion-item>
          <ion-label position="stacked">Curso</ion-label>
          <ion-select v-model="form.courseId" placeholder="Selecciona un curso">
            <ion-select-option
              v-for="course in courses"
              :key="course.id"
              :value="course.id"
            >
              {{ course.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Mode -->
        <ion-item>
          <ion-label>Modo</ion-label>
          <ion-segment v-model="form.mode" slot="end">
            <ion-segment-button value="group">
              <ion-label>Grupal</ion-label>
            </ion-segment-button>
            <ion-segment-button value="individual">
              <ion-label>Individual</ion-label>
            </ion-segment-button>
          </ion-segment>
        </ion-item>
        
        <div class="ion-padding-horizontal" v-if="form.mode === 'group'">
          <ion-text color="medium">
            <p style="font-size: 0.85em; margin-top: 5px">
              <ion-icon :icon="informationCircleOutline" style="vertical-align: middle"></ion-icon>
              Los estudiantes votarán en nombre de su grupo (un voto por grupo).
            </p>
          </ion-text>
        </div>
      </ion-list>

      <!-- Options -->
      <div class="ion-padding-top">
        <ion-label class="options-label">
          <strong>Opciones</strong>
          <span style="color: var(--ion-color-medium); font-size: 0.85em"> (mínimo 2)</span>
        </ion-label>

        <ion-list>
          <ion-item v-for="(option, index) in form.options" :key="index">
            <ion-label position="stacked">Opción {{ index + 1 }}</ion-label>
            <ion-input
              v-model="form.options[index].text"
              :placeholder="`Opción ${index + 1}`"
              clearInput
            ></ion-input>
            <ion-button
              v-if="form.options.length > 2"
              slot="end"
              fill="clear"
              color="danger"
              @click="removeOption(index)"
            >
              <ion-icon slot="icon-only" :icon="trashOutline"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>

        <ion-button expand="block" fill="outline" @click="addOption" class="ion-margin-top">
          <ion-icon slot="start" :icon="addOutline"></ion-icon>
          Agregar opción
        </ion-button>
      </div>

      <!-- Error message -->
      <ion-text color="danger" v-if="errorMsg">
        <p class="ion-padding-horizontal">{{ errorMsg }}</p>
      </ion-text>

      <!-- Submit -->
      <ion-button
        expand="block"
        class="ion-margin-top"
        :disabled="submitting"
        @click="submit"
      >
        <ion-spinner v-if="submitting" name="crescent" slot="start"></ion-spinner>
        {{ submitting ? "Creando..." : "Crear Encuesta" }}
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  onIonViewWillEnter,
} from "@ionic/vue";
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { addOutline, trashOutline, informationCircleOutline } from "ionicons/icons";
import axios from "axios";
import { tokenHeader, selectedPeriod, selectedYear } from "../globalService";

export default {
  name: "CrearEncuesta",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonButton,
    IonIcon,
    IonText,
    IonSpinner,
  },
  setup() {
    const router = useRouter();
    const courses = ref([]);
    const submitting = ref(false);
    const errorMsg = ref("");

    const form = reactive({
      title: "",
      question: "",
      courseId: null,
      mode: "group",
      options: [{ text: "" }, { text: "" }],
    });

    const fetchCourses = async () => {
      try {
        tokenHeader();
        // Fetch courses. Assuming a /courses endpoint exists or similar
        // If teacher, they likely want courses they teach
        const response = await axios.get("/courses"); 
        // Filter active courses or handle backend filtering
        courses.value = response.data.filter(c => c.exist); 
        
        if (courses.value.length > 0 && !form.courseId) {
          form.courseId = courses.value[0].id;
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    const addOption = () => {
      form.options.push({ text: "" });
    };

    const removeOption = (index) => {
      form.options.splice(index, 1);
    };

    const submit = async () => {
      errorMsg.value = "";

      // Validation
      if (!form.title.trim()) {
        errorMsg.value = "El título es obligatorio.";
        return;
      }
      if (!form.question.trim()) {
        errorMsg.value = "La pregunta es obligatoria.";
        return;
      }
      if (!form.courseId) {
        errorMsg.value = "Debes seleccionar un curso.";
        return;
      }
      const validOptions = form.options.filter((o) => o.text.trim());
      if (validOptions.length < 2) {
        errorMsg.value = "Debes ingresar al menos 2 opciones.";
        return;
      }

      submitting.value = true;
      try {
        tokenHeader();
        await axios.post("/polls", {
          title: form.title.trim(),
          question: form.question.trim(),
          courseId: form.courseId,
          periodId: selectedPeriod(),
          year: selectedYear(),
          mode: form.mode,
          options: validOptions,
        });
        router.push("/encuestas");
      } catch (error) {
        console.error("Error creating poll:", error);
        errorMsg.value =
          error.response?.data?.message || "Error al crear la encuesta.";
      } finally {
        submitting.value = false;
      }
    };

    onIonViewWillEnter(() => {
      // Reset form
      form.title = "";
      form.question = "";
      form.courseId = null;
      form.mode = "group";
      form.options = [{ text: "" }, { text: "" }];
      errorMsg.value = "";
      fetchCourses();
    });

    return {
      form,
      courses,
      submitting,
      errorMsg,
      addOption,
      removeOption,
      submit,
      addOutline,
      trashOutline,
      informationCircleOutline,
    };
  },
};
</script>

<style scoped>
.options-label {
  display: block;
  padding: 8px 16px 0;
  font-size: 1em;
}
</style>
