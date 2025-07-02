<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button
            v-if="cuestionario?.id != 0"
            :href="
              '/lecciones/' +
              cuestionario?.lesson?.course?.id +
              '/' +
              cuestionario?.lesson?.area?.id +
              '/' +
              cuestionario?.lesson?.period?.id +
              '/' +
              cuestionario?.lesson?.year
            "
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title size="large" class="ion-text-center">{{
          cuestionario.fecha
        }}</ion-title>
        <ion-buttons v-if="!admin" slot="end" class="ion-margin-end">
          <ion-button
            v-if="cuestionario.id != 0"
            :href="'/cuestionario/' + cuestionario.id"
          >
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons v-if="admin" slot="end" class="ion-margin-end">
          <ion-button
            v-if="cuestionario.id != 0"
            :href="
              'crear/cuestionario/' +
              cuestionario.lesson.id +
              '/' +
              cuestionario.id
            "
          >
            <ion-icon :icon="createOutline"></ion-icon>
          </ion-button>

          <ion-button
            v-if="allVisible == false"
            @click="marcarTodoDisponibleVisible(true)"
          >
            <ion-icon :icon="lockOpenOutline"></ion-icon>
          </ion-button>
          <ion-button
            v-if="allVisible == true"
            @click="marcarTodoDisponibleVisible(false)"
          >
            <ion-icon :icon="lockClosedOutline"></ion-icon>
          </ion-button>
          <ion-button @click="generateAnswerKeyCsv(cuestionario.questions)">
            <ion-icon :icon="downloadOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card
        v-if="cuestionario.id != 0"
        :href="'/ganadores/' + cuestionario.id"
      >
        <ion-card-header>
          <ion-card-title class="ion-text-center">{{
            cuestionario.topic
          }}</ion-card-title>
          <ion-card-subtitle class="ion-text-center"
            >Ver Resultados</ion-card-subtitle
          >
        </ion-card-header>
      </ion-card>
      <ion-card class="ion-padding" v-if="cuestionario.questions">
        <ion-card-subtitle class="ion-text-center"
          >Preguntas de Seleccion Múltiple
        </ion-card-subtitle>
        <ion-list>
          <ion-item
            v-for="(question, index) in cuestionario.questions"
            :key="question.id"
            :href="'/pregunta/' + question.id"
          >
            <ion-icon
              v-if="question.available == false"
              slot="start"
              :icon="lockClosedOutline"
            ></ion-icon>
            <ion-icon
              v-if="question.available == true"
              slot="start"
              :icon="lockOpenOutline"
            ></ion-icon>
            <ion-label>
              <b>{{
                question.title
                  ? question.title
                  : numeroOrdinal(index + 1, question.identifier)
              }}</b></ion-label
            >
          </ion-item>
        </ion-list>
      </ion-card>

      <ion-buttons
        v-if="admin"
        class="ion-justify-content-center ion-padding-top ion-padding-bottom"
      >
        <ion-button
          :href="'/crear/pregunta/' + cuestionario.id"
          expand="full"
          fill="outline"
          shape="round"
          color="medium"
          class="ion-align-self-center"
        >
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-button>
        <ion-button
          @click="openTypeImportModal"
          expand="full"
          fill="outline"
          shape="round"
          color="medium"
          class="ion-align-self-center"
        >
          <ion-icon :icon="downloadOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

      <!-- Modal para tipo de importacion  (desde pregunta, Json de Tipos (avanzado), Json de Opciones Variables (avanzado)) -->

      <ion-modal
        :is-open="isModalOpen"
        @didDismiss="closeModal"
        ref="modal"
        trigger="open-modal"
        :breakpoints="[0.3, 0.5, 1]"
        :initial-breakpoint="0.5"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="cancel()">Cancelar</ion-button>
            </ion-buttons>
            <ion-title style="text-align: center">Importar Preguntas</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="confirm()"
                >Confirmar</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-select
              label="Seleccione tipo de importación"
              v-model="tipoImportacionUrl"
              placeholder="Si no sabe programar, seleccione 'Desde Pregunta'"
            >
              <ion-select-option
                v-for="tipoEnLista in tiposIportacion"
                :key="tipoEnLista.id"
                :value="tipoEnLista.url"
              >
                {{ tipoEnLista.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>
<script>
import axios from "axios";
import { ref } from "vue";
import { tokenHeader, adminOprofesor, numeroOrdinal } from "../globalService";

import {
  lockClosedOutline,
  lockOpenOutline,
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
  createOutline,
  addOutline,
  downloadOutline,
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
  IonCardSubtitle,
  onIonViewDidEnter,
  IonModal,
  IonSelect,
  IonSelectOption,
} from "@ionic/vue";

import { useRoute } from "vue-router";
import router from "../router";

export default {
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButtons,
    IonButton,
    IonCard,
    IonCardTitle,
    IonCardHeader,
    IonCardSubtitle,
    IonModal,
    IonSelect,
    IonSelectOption,
  },
  setup() {
    const admin = adminOprofesor();
    const periodoSelected = ref();

    const isModalOpen = ref(false);
    const year = ref();
    const allVisible = ref(false);
    const mroute = useRoute();
    const closeModal = () => {
      isModalOpen.value = false;
    };
    const { id } = mroute.params;
    const tiposIportacion = ref([
      { id: 1, url: "/cuestionario/importar/", name: "Desde Pregunta" },
      {
        id: 2,
        url: "/cuestionario/importar/preguntas/tipo/",
        name: "Json de Tipos (avanzado)",
      },
      {
        id: 3,
        url: "/cuestionario/importar/preguntas/variables/",
        name: "Json de Opciones Variables (avanzado)",
      },
    ]);
    const tipoImportacionUrl = ref("");

    let cuestionario = ref(JSON.parse(localStorage.getItem("lessonSelected")));

    onIonViewDidEnter(async () => {
      periodoSelected.value = JSON.parse(
        localStorage.getItem("periodoSelected")
      );

      tokenHeader();

      if (cuestionario.value.id !== id) {
        await axios.get(`/quizzes/${id}`).then((response) => {
          cuestionario.value = {
            ...response.data,
            id: response.data.id,
            topic: response.data.title,
            //order by title with ordinal number
            questions: response.data.questions
              .sort((a, b) => a.id - b.id) // o a.number - b.number
              .map((question, index) => ({
                ...question,
                title:
                  numeroOrdinal(index, question.title) + ". " + question.title,
              }))
              //only exist
              .filter((question) => question.exist),

            course: response.data.course,
          };

          if (!admin) {
            cuestionario.value.questions = cuestionario.value.questions.filter(
              (question) => question.visible
            );
          }
          localStorage.setItem(
            "lessonSelected",
            JSON.stringify(cuestionario.value)
          );

          year.value = cuestionario.value.year;
        });
      }
    });

    const cancel = () => {
      closeModal();
      tipoImportacionUrl.value = "";
    };

    const confirm = () => {
      if (!tipoImportacionUrl.value) {
        return;
      }
      const url = tipoImportacionUrl.value + id;
      router.push(url);
      tipoImportacionUrl.value = "";
      closeModal();
    };

    const openTypeImportModal = () => {
      isModalOpen.value = true;
    };

    const generateAnswerKeyCsv = function (questions) {
      // Crear el encabezado del CSV
      let csvContent = '"Q No","KEY"\n';

      // Iterar sobre las preguntas
      questions.forEach((question, index) => {
        // Encontrar la opción correcta
        const correctOption = question.options.find((option) => option.correct);

        // Agregar la fila al CSV
        // Suma 1 al índice para que los números de pregunta empiecen en 1
        csvContent += `"${index + 1}","${
          correctOption ? correctOption.identifier : ""
        }"\n`;
      });

      // Crear un Blob con el contenido del CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      // Crear un enlace de descarga
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${cuestionario.value.topic}.csv`);

      // Simular clic para descargar
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const marcarTodoDisponibleVisible = async function (estado) {
      if (!cuestionario.value.questions.length) {
        return;
      }

      for (const pregunta of cuestionario.value.questions) {
        const preguntaUpdate = {
          lessonId: cuestionario.value.id,
          visible: estado,
          available: estado,
          instituteId: cuestionario.value.institute.id,
        };
        try {
          await axios.patch(
            `/questions/${pregunta.id}`,
            preguntaUpdate,
            tokenHeader()
          );

          //reload page
        } catch (error) {
          console.error(`Error al actualizar pregunta ${pregunta.id}:`, error);
        }
      }
      window.location.reload();
    };

    return {
      tipoImportacionUrl,
      closeModal,
      cancel,
      confirm,
      openTypeImportModal,
      isModalOpen,
      tiposIportacion,
      allVisible,
      generateAnswerKeyCsv,
      marcarTodoDisponibleVisible,
      admin,
      cuestionario,
      id,
      periodoSelected,
      arrowBackOutline,
      handLeftOutline,
      refreshOutline,
      createOutline,
      addOutline,
      lockClosedOutline,
      lockOpenOutline,
      downloadOutline,
      year,
      numeroOrdinal,
    };
  },
};
</script>
