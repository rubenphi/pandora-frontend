<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/encuestas"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditMode ? 'Editar Encuesta' : 'Nueva Encuesta' }}</ion-title>
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

         <!-- Active Status -->
         <ion-row>
          <ion-col>
        <ion-item>
          <ion-label position="stacked">Activo</ion-label>
          <ion-toggle v-model="form.active" justify="space-between"></ion-toggle>
        </ion-item>
        </ion-col>


        <!-- Course -->
          <ion-col>
        <ion-item>
          <ion-label position="stacked">Curso</ion-label>
          <ion-select v-model="form.courseId" placeholder="Selecciona un curso" >
            <ion-select-option
              v-for="course in courses"
              :key="course.id"
              :value="course.id"
            >
              {{ course.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        </ion-col>
      </ion-row>
      </ion-list>

        

        <!-- Period -->
        <ion-item>
          <ion-label position="stacked">Periodo</ion-label>
          <ion-select v-model="form.periodId" placeholder="Selecciona un periodo">
            <ion-select-option
              v-for="periodo in periodos"
              :key="periodo.id"
              :value="periodo.id"
            >
              {{ periodo.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Year and Mode in the same row -->
        <ion-row>
          <ion-col>
            <ion-item>
              <ion-label position="stacked">Año</ion-label>
              <ion-select v-model="form.year" placeholder="Selecciona un año">
                <ion-select-option v-for="year in years" :key="year" :value="year">
                  {{ year }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </ion-col>
          <ion-col>
            <ion-item>
              <ion-label position="stacked">Modo</ion-label>
              <ion-select v-model="form.mode" placeholder="Selecciona el modo">
                <ion-select-option value="group">Grupal</ion-select-option>
                <ion-select-option value="individual">Individual</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-col>
        </ion-row>
        
        <div class="ion-padding-horizontal" v-if="form.mode === 'group'">
          <ion-text color="medium">
            <p style="font-size: 0.85em; margin-top: 5px">
              <ion-icon :icon="informationCircleOutline" style="vertical-align: middle"></ion-icon>
              Los estudiantes votarán en nombre de su grupo (un voto por grupo).
            </p>
          </ion-text>
        </div>

       

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
              :disabled="isEditMode"
            >
              <ion-icon slot="icon-only" :icon="trashOutline"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>

        <ion-button expand="block" fill="outline" @click="addOption" class="ion-margin-top" :disabled="isEditMode">
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
        {{ submitting ? (isEditMode ? "Guardando..." : "Creando...") : (isEditMode ? "Guardar Cambios" : "Crear Encuesta") }}
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
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonToggle,
  onIonViewWillEnter,
  IonCol,
  IonRow,

} from "@ionic/vue";
import { ref, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { addOutline, trashOutline, informationCircleOutline } from "ionicons/icons";
import axios from "axios";
import { tokenHeader, selectedPeriod, selectedYear, periodosGet, currentServerYear } from "../globalService";

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
    IonButton,
    IonIcon,
    IonText,
    IonSpinner,
    IonToggle, // Added IonToggle
    IonCol,
    IonRow,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const courses = ref([]);
    const submitting = ref(false);
    const errorMsg = ref("");
    const isEditMode = ref(false);
    const pollId = ref(null);

    const years = ref([]);
    const periodos = ref([]);

    const form = reactive({
      title: "",
      question: "",
      courseId: null,
      mode: "group",
      options: [{ text: "" }, { text: "" }],
      periodId: null,
      year: null,
      active: true, // Added active status
    });

    const fetchCourses = async () => {
      try {
        tokenHeader();
        const response = await axios.get("/courses"); 
        courses.value = response.data.filter(c => c.exist); 
        
        if (courses.value.length > 0 && !form.courseId) {
          form.courseId = courses.value[0].id;
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    const fetchPoll = async (id) => {
      try {
        tokenHeader();
        const response = await axios.get(`/polls/${id}`);
        const fetchedPoll = response.data;

        form.title = fetchedPoll.title;
        form.question = fetchedPoll.question;
        form.courseId = fetchedPoll.course.id;
        form.mode = fetchedPoll.mode;
        form.options = fetchedPoll.options.map(opt => ({ text: opt.text }));
        form.periodId = fetchedPoll.period.id;
        form.year = fetchedPoll.year;
        form.active = fetchedPoll.active; // Populate active status

      } catch (error) {
        console.error("Error fetching poll for edit:", error);
        router.push("/encuestas"); // Redirect if poll not found or error
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
      if (!form.periodId) {
        errorMsg.value = "Debes seleccionar un periodo.";
        return;
      }
      if (!form.year) {
        errorMsg.value = "Debes seleccionar un año.";
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
        const payload = {
          title: form.title.trim(),
          question: form.question.trim(),
          courseId: form.courseId,
          periodId: form.periodId,
          year: form.year,
          mode: form.mode,
          active: form.active, // Include active status
          options: validOptions,
        };

        if (isEditMode.value) {
          await axios.patch(`/polls/${pollId.value}`, payload);
        } else {
          await axios.post("/polls", payload);
        }
        router.push("/encuestas");
      } catch (error) {
        console.error(`Error ${isEditMode.value ? 'updating' : 'creating'} poll:`, error);
        errorMsg.value =
          error.response?.data?.message || `Error al ${isEditMode.value ? 'actualizar' : 'crear'} la encuesta.`;
      } finally {
        submitting.value = false;
      }
    };

    onIonViewWillEnter(async () => {
      pollId.value = route.params.id;
      isEditMode.value = !!pollId.value;

      // Initialize years and periods
      periodos.value = periodosGet();
      const curServerYear = currentServerYear();
      years.value = new Array(10).fill(0).map((_, i) => curServerYear - i);

      // Reset form for create mode, or prepare for edit mode
      if (!isEditMode.value) {
        form.title = "";
        form.question = "";
        form.courseId = null;
        form.mode = "group";
        form.options = [{ text: "" }, { text: "" }];
        form.periodId = selectedPeriod(); // Default for create
        form.year = selectedYear();       // Default for create
      }
      errorMsg.value = "";
      
      await fetchCourses(); // Fetch courses for select options

      if (isEditMode.value) {
        await fetchPoll(pollId.value);
      }
    });

    return {
      form,
      courses,
      submitting,
      errorMsg,
      isEditMode,
      years,
      periodos,
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
