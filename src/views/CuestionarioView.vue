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
          <ion-button @click="openGeneratorModal()">
            <ion-icon :icon="downloadOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card v-if="cuestionario.id != 0">
        <ion-card-header
          style="position: relative"
          @click="goToWinners(cuestionario.id)"
        >
          <ion-card-title class="ion-text-center">{{
            cuestionario.topic
          }}</ion-card-title>
          <ion-card-subtitle class="ion-text-center"
            >Ver Resultados</ion-card-subtitle
          >
          <ion-button
            v-if="!admin"
            color="medium"
            fill="clear"
            size="small"
            style="position: absolute; bottom: 0; right: 0"
            @click.stop="evitarAleatoriedadOpciones"
          >
            <ion-icon :icon="codeDownloadOutline"></ion-icon>
          </ion-button>
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

      <CuestionarioGeneratorModal
        :is-open="isGeneratorModalOpen"
        :questions="cuestionario.questions"
        :title="cuestionario.topic"
        :lesson-data="cuestionario.lesson"
        @close="closeGeneratorModal"
      ></CuestionarioGeneratorModal>
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
  codeDownloadOutline,
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
  alertController,
} from "@ionic/vue";

import CuestionarioGeneratorModal from '../components/CuestionarioGeneratorModal.vue';

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
    CuestionarioGeneratorModal,
  },
  setup() {
    const admin = adminOprofesor();
    const periodoSelected = ref();

    const isModalOpen = ref(false);
    const isGeneratorModalOpen = ref(false);
    const year = ref();
    const allVisible = ref(false);
    const mroute = useRoute();
    const closeModal = () => {
      isModalOpen.value = false;
    };

    const openGeneratorModal = () => {
      isGeneratorModalOpen.value = true;
    };

    const closeGeneratorModal = () => {
      isGeneratorModalOpen.value = false;
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
              .slice() // Create a shallow copy before sorting
              .sort((a, b) => a.id - b.id) // o a.number - b.number
              .map((question, index) => ({
                ...question,
                title:
                  numeroOrdinal(index, question.title) + ". " + question.title,
              }))
              //only exist
              .filter((question) => question.exist),

            course: response.data.course,
            institute: response.data.institute,
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

          allVisible.value = cuestionario.value.questions.every(
            (question) => question.visible
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

    const goToWinners = (quizId) => {
      router.push(`/ganadores/${quizId}`);
    };

    const evitarAleatoriedadOpciones = async () => {
      const alert = await alertController.create({
        header: "Deshabilitar Opciones al Azar",
        message:
          "Va a deshabilitar las opciones al azar, ingrese el código de autorización del profesor",
        inputs: [
          {
            name: "authCode",
            type: "text",
            placeholder: "Código de autorización",
          },
        ],
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
          },
          {
            text: "Confirmar",
            handler: async (data) => {
              const authCode = data.authCode;
              if (!authCode) {
                const errorAlert = await alertController.create({
                  header: "Error",
                  message: "Debe ingresar un código de autorización.",
                  buttons: ["OK"],
                });
                await errorAlert.present();
                return;
              }

              try {
                const response = await axios.get(
                  `/invitations?code=${authCode}&valid=true&exist=true`,
                  tokenHeader()
                );

                if (response.data && response.data.length > 0) {
                  // Guardar en localStorage
                  const dataToStore = {
                    quizId: cuestionario.value.id,
                    authCode: authCode,
                  };
                  localStorage.setItem(
                    "ordenOpcionesKey",
                    JSON.stringify(dataToStore)
                  );

                  // Mostrar mensaje de éxito
                  const successAlert = await alertController.create({
                    header: "Éxito",
                    message:
                      "Las opciones de respuesta ahora estarán en orden.",
                    buttons: ["OK"],
                  });
                  await successAlert.present();
                } else {
                  localStorage.removeItem("ordenOpcionesKey"); // Eliminar si el código es inválido
                  const errorAlert = await alertController.create({
                    header: "Error de Autorización",
                    message: "El código ingresado no es válido o ha expirado.",
                    buttons: ["OK"],
                  });
                  await errorAlert.present();
                }
              } catch (error) {
                console.error("Error al validar el código:", error);
                const errorAlert = await alertController.create({
                  header: "Error",
                  message:
                    "Ocurrió un error al validar el código. Intente de nuevo.",
                  buttons: ["OK"],
                });
                await errorAlert.present();
              }
            },
          },
        ],
      });
      await alert.present();
    };

    const marcarTodoDisponibleVisible = async function (estado) {
      if (
        !cuestionario.value.questions.length ||
        !cuestionario.value.institute
      ) {
        return;
      }

      const promises = cuestionario.value.questions.map((pregunta) => {
        const preguntaUpdate = {
          quizId: cuestionario.value.id,
          visible: estado,
          available: estado,
          instituteId: cuestionario.value.institute.id,
        };
        return axios.patch(
          `/questions/${pregunta.id}`,
          preguntaUpdate,
          tokenHeader()
        );
      });

      try {
        await Promise.all(promises);
        window.location.reload();
      } catch (error) {
        console.error("Error al actualizar una o más preguntas:", error);
      }
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
      codeDownloadOutline,
      year,
      numeroOrdinal,
      goToWinners,
      evitarAleatoriedadOpciones,
      isGeneratorModalOpen,
      openGeneratorModal,
      closeGeneratorModal,
    };
  },
};
</script>
