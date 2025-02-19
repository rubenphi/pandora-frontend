<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="'/cuestionario/' + idCuestionario">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title>Seleccione el cuestionario </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item>
          <ion-label position="stacked">Curso</ion-label>
          <ion-select
            v-model="cursoSelected"
            placeholder="Selecciona un curso"
            @ionChange="areasSearch()"
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
          <ion-label position="stacked">Area</ion-label>
          <ion-select v-model="areaSelected" placeholder="Selecciona un area">
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
            placeholder="Selecciona un periodo"
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
            <ion-button @click="search()">
              <ion-icon :icon="searchOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-item>
        <ion-item>
          <ion-label position="stacked" color="primary"
            ><h2>Seleccione el cuestionario</h2></ion-label
          >
        </ion-item>

        <ion-item v-for="cuestionario in cuestionarios" :key="cuestionario.id">
          <ion-label>
            {{ cuestionario.topic }}
          </ion-label>
          <ion-button @click="importarPreguntas(cuestionario.id)" slot="end">
            <ion-icon :icon="downloadOutline"></ion-icon
          ></ion-button>
        </ion-item>
      </ion-list>
      <ion-toast
        :is-open="isSuccessToastOpen"
        position="middle"
        message="Importación exitosa"
        :duration="3000"
        @didDismiss="setSuccessToastOpen(false)"
        color="success"
      ></ion-toast>
      <ion-toast
        :is-open="isErrorToastOpen"
        position="middle"
        :message="errorMessage"
        :duration="3000"
        @didDismiss="setErrorToastOpen(false)"
        color="danger"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonList,
  IonItem,
  IonLabel,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonButtons,
  IonToast,
  onIonViewWillEnter,
  IonSelect,
  IonSelectOption,
} from "@ionic/vue";

import axios from "axios";

import {
  arrowBackOutline,
  downloadOutline,
  searchOutline,
} from "ionicons/icons";
import { ref } from "vue";
import { useRoute } from "vue-router";
import { periodosGet } from "../globalService";

export default {
  components: {
    IonButton,
    IonButtons,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonList,
    IonItem,
    IonLabel,

    IonToast,
    IonSelect,
    IonSelectOption,
  },
  setup() {
    const mroute = useRoute();
    const periodos = ref(periodosGet());
    const years = ref([]);
    const yearSelected = ref();

    const periodoSelected = ref({});
    const idCuestionario = mroute.params.id;
    const isSuccessToastOpen = ref(false);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const userLoged = ref({});
    const cursos = ref([]);
    const cursoSelected = ref();
    const areas = ref();
    const areaSelected = ref({});
    const cuestionarios = ref([]);

    const setSuccessToastOpen = (state) => {
      isSuccessToastOpen.value = state;
    };

    const setErrorToastOpen = (state) => {
      isErrorToastOpen.value = state;
    };

    const importarPreguntas = async (lessonId) => {
      const tryImportQuestions = async () => {
        try {
          await axios.patch(
            `/lessons/${idCuestionario}/questions/import`,
            {
              fromLessonId: lessonId,
            },
            {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
          setSuccessToastOpen(true);
        } catch (error) {
          // Si es error 500, intentamos resetear los índices
          if (
            error.response?.status === 500 &&
            error.response?.data?.message === "Internal server error"
          ) {
            try {
              // Llamada al endpoint de reset
              await axios.get("/questions/reset/index");

              // Reintentamos la importación
              await tryImportQuestions();
            } catch (resetError) {
              handleError(error);
            }
          } else {
            handleError(error);
          }
        }
      };

      const handleError = (error) => {
        errorMessage.value =
          error.response?.data?.message ===
          "You can only import options to a question that doesn't have them"
            ? "Solo puedes importar preguntas a cuestionarios en blanco"
            : error.response?.data?.message;

        setErrorToastOpen(true);
      };

      // Iniciamos el proceso
      await tryImportQuestions();
    };

    const search = async () => {
      if (
        !cursoSelected.value?.id ||
        !periodoSelected.value?.id ||
        !areaSelected.value?.id ||
        !yearSelected.value
      ) {
        return;
      }

      cuestionarios.value = await axios
        .get(
          `/lessons?&courseId=${cursoSelected.value.id}&periodId=${periodoSelected.value.id}&year=${yearSelected.value}&areaId=${areaSelected.value.id}&instituteId=${userLoged.value.institute.id}&exist=true`,
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        )
        .then((response) =>
          response.data.filter((c) => c.id != idCuestionario)
        );
    };

    const areasSearch = async () => {
      areas.value = await axios
        .get(`/courses/${cursoSelected.value.id}/areas`, {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        })
        .then((response) => response.data);
    };

    onIonViewWillEnter(async () => {
      userLoged.value = JSON.parse(localStorage.getItem("usuario"));
      userLoged.value.institute.id = parseInt(userLoged.value.institute.id, 10);
      years.value = new Array(10)
        .fill(0)
        .map((_, i) => new Date().getFullYear() - i);
      yearSelected.value =
        localStorage.getItem("year") ?? new Date().getFullYear();

      cursos.value = await axios
        .get(
          `/courses?instituteId=${userLoged.value.institute.id}&exist=true`,
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        )
        .then((response) => response.data);
    });

    return {
      arrowBackOutline,
      downloadOutline,
      isSuccessToastOpen,
      isErrorToastOpen,
      setSuccessToastOpen,
      setErrorToastOpen,
      importarPreguntas,
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
      searchOutline,
    };
  },
  data() {
    return {
      formData: {
        name: "",
        lastName: "",
        email: "",
        code: "",
        instituteInvitation: "",
        password: "",
        exist: false,
      },
    };
  },
  methods: {},
};
</script>
