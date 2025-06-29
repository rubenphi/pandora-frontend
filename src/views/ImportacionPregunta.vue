<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="'/cuestionario/' + idCuestionario">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Seleccione el cuestionario</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <!-- Selección de filtros -->
        <ion-item>
          <ion-label position="stacked">Curso</ion-label>
          <ion-select
            v-model="cursoSelected"
            placeholder="Selecciona un curso"
            @ionChange="areasSearch"
          >
            <ion-select-option
              v-for="curso in cursos"
              :key="curso.id"
              :value="curso"
            >
              {{ curso.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Área</ion-label>
          <ion-select v-model="areaSelected" placeholder="Selecciona un área">
            <ion-select-option
              v-for="area in areas"
              :key="area.id"
              :value="area"
            >
              {{ area.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-select
            slot="start"
            v-model="yearSelected"
            placeholder="Selecciona un año"
          >
            <ion-select-option v-for="year in years" :key="year" :value="year">
              <strong>Año: </strong> {{ year }}
            </ion-select-option>
          </ion-select>
          <ion-select
            slot="end"
            v-model="periodoSelected"
            placeholder="Selecciona un período"
          >
            <ion-select-option
              v-for="periodo in periodos"
              :key="periodo.id"
              :value="periodo"
            >
              {{ periodo.name }}
            </ion-select-option>
          </ion-select>
          <ion-buttons slot="end">
            <ion-button @click="search">
              <ion-icon :icon="searchOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-item>

        <!-- Lecciones y preguntas -->
        <ion-accordion-group :multiple="true">
          <ion-accordion v-for="c in cuestionarios" :key="c.id">
            <ion-item slot="header" @click="loadQuestions(c)">
              <ion-label>{{ c.topic }}</ion-label>
              <ion-badge v-if="preguntasPorLeccion[c.id]?.preguntas?.length">
                {{ preguntasPorLeccion[c.id].preguntas.length }} preguntas
              </ion-badge>
            </ion-item>

            <div class="ion-padding" slot="content">
              <ion-item>
                <ion-checkbox
                  :checked="
                    preguntasPorLeccion[c.id]?.preguntas?.every(
                      (p) => p.selected
                    )
                  "
                  @ionChange="
                    (event) => toggleSeleccionTodas(c.id, event.detail.checked)
                  "
                ></ion-checkbox>
                <ion-label>Seleccionar todas</ion-label>
              </ion-item>

              <ion-item
                v-for="pregunta in preguntasPorLeccion[c.id]?.preguntas || []"
                :key="pregunta.id"
              >
                <ion-checkbox v-model="pregunta.selected"></ion-checkbox>
                <ion-label>{{ pregunta.title }}</ion-label>
              </ion-item>
            </div>
          </ion-accordion>
        </ion-accordion-group>

        <!-- Configuración de importación -->
        <ion-item>
          <ion-label>Modo de orden</ion-label>
          <ion-select v-model="modoOrden">
            <ion-select-option value="mix">Mezclado</ion-select-option>
            <ion-select-option value="tema">Por tema</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-button expand="block" @click="importarSeleccionadas">
          Importar preguntas seleccionadas
        </ion-button>
      </ion-list>

      <!-- Toasters -->
      <ion-toast
        :is-open="isSuccessToastOpen"
        message="Importación exitosa"
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
import { ref } from "vue";
import { useRoute } from "vue-router";
import {
  onIonViewWillEnter,
  IonToast,
  IonCheckbox,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonButton,
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonIcon,
  IonContent,
  IonList,
  IonTitle,
  IonAccordionGroup,
  IonAccordion,
  IonBadge,
} from "@ionic/vue";

import axios from "axios";
import {
  arrowBackOutline,
  downloadOutline,
  searchOutline,
} from "ionicons/icons";
import { periodosGet, numerosOrdinales } from "../globalService";

export default {
  components: {
    IonToast,
    IonCheckbox,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonLabel,
    IonButton,
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonIcon,
    IonContent,
    IonList,
    IonTitle,
    IonAccordionGroup,
    IonAccordion,
    IonBadge,
  },
  setup() {
    const route = useRoute();
    const idCuestionario = route.params.id;

    const cursos = ref([]);
    const cursoSelected = ref();
    const areas = ref([]);
    const areaSelected = ref();
    const years = ref([]);
    const yearSelected = ref();
    const periodoSelected = ref();
    const periodos = ref(periodosGet());
    const cuestionarios = ref([]);
    const preguntasPorLeccion = ref({});
    const modoOrden = ref("mix");
    const seleccionarTodas = ref(false);

    const isSuccessToastOpen = ref(false);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const userLoged = ref(JSON.parse(localStorage.getItem("usuario")));

    const setSuccessToastOpen = (val) => (isSuccessToastOpen.value = val);
    const setErrorToastOpen = (val) => (isErrorToastOpen.value = val);

    const search = async () => {
      if (
        !cursoSelected.value ||
        !areaSelected.value ||
        !periodoSelected.value ||
        !yearSelected.value
      )
        return;
      const res = await axios.get(
        `/lessons?courseId=${cursoSelected.value.id}&areaId=${areaSelected.value.id}&periodId=${periodoSelected.value.id}&year=${yearSelected.value}&instituteId=${userLoged.value.institute.id}&exist=true`
      );
      cuestionarios.value = res.data.filter((c) => c.id != idCuestionario);
    };

    const areasSearch = async () => {
      const res = await axios.get(`/courses/${cursoSelected.value.id}/areas`);
      areas.value = res.data;
    };

    const loadQuestions = async (lesson) => {
      const res = await axios.get(`/lessons/${lesson.id}/questions`);
      res.data.forEach((q) => (q.selected = false));
      preguntasPorLeccion.value[lesson.id] = {
        nombre: lesson.name,
        preguntas: res.data,
      };
    };

    const toggleSeleccionTodas = () => {
      seleccionarTodas.value = !seleccionarTodas.value;
      Object.values(preguntasPorLeccion.value).forEach(({ preguntas }) => {
        preguntas.forEach((q) => (q.selected = seleccionarTodas.value));
      });
    };

    const importarSeleccionadas = async () => {
      let seleccionadas = [];
      Object.values(preguntasPorLeccion.value).forEach(({ preguntas }) => {
        seleccionadas.push(...preguntas.filter((p) => p.selected));
      });

      if (modoOrden.value === "mix") {
        seleccionadas = seleccionadas.sort(() => Math.random() - 0.5);
      }

      seleccionadas = seleccionadas.map((p, index) => ({
        id: p.id,
        title: numerosOrdinales[index] || `Pregunta ${index + 1}`,
      }));

      try {
        await axios.patch("/lessons/questions/import-mix", {
          toLessonId: parseInt(idCuestionario),
          questions: seleccionadas,
        });
        setSuccessToastOpen(true);
      } catch (e) {
        errorMessage.value = e.response?.data?.message || "Error al importar";
        setErrorToastOpen(true);
      }
    };

    onIonViewWillEnter(async () => {
      userLoged.value.institute.id = parseInt(userLoged.value.institute.id);
      cursos.value = (
        await axios.get(
          `/courses?instituteId=${userLoged.value.institute.id}&exist=true`
        )
      ).data;
      years.value = Array.from(
        { length: 10 },
        (_, i) => new Date().getFullYear() - i
      );
      yearSelected.value =
        localStorage.getItem("year") || new Date().getFullYear();
    });

    return {
      arrowBackOutline,
      downloadOutline,
      searchOutline,
      isSuccessToastOpen,
      isErrorToastOpen,
      setSuccessToastOpen,
      setErrorToastOpen,
      importarSeleccionadas,
      errorMessage,
      userLoged,
      idCuestionario,
      cursos,
      cursoSelected,
      areas,
      areaSelected,
      cuestionarios,
      periodos,
      years,
      yearSelected,
      periodoSelected,
      search,
      areasSearch,
      preguntasPorLeccion,
      modoOrden,
      seleccionarTodas,
      toggleSeleccionTodas,
      loadQuestions,
    };
  },
};
</script>

<style scoped>
ion-checkbox {
  margin-right: 1rem;
}
</style>
