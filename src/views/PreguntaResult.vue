<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title size="large" class="ion-text-center">
          {{ respuestas.length }} Respuestas - {{ pregunta.title }}
        </ion-title>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button v-if="id" :href="'/pregunta/' + id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button v-if="id" :href="'/resultado/' + id">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
          <!-- Nuevo botón para ordenar -->
          <ion-button v-if="admin" @click="ordenarPorNombre">
            <ion-icon :icon="arrowDownCircle"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list v-if="admin || pregunta.available == false">
        <ion-item
          v-for="(respuesta, index) in respuestas"
          :key="respuesta.id"
          lines="full"
          class="ion-padding-end"
        >
          <ion-icon
            v-if="
              ((index === 0) & admin && respuesta.points > 0) ||
              (index === 0 && respuesta.points > 0)
            "
            :icon="ribbonOutline"
            size="large"
            slot="start"
          ></ion-icon>
          <ion-icon
            v-else-if="(respuesta.points > 0) & admin || respuesta.points > 0"
            :icon="happyOutline"
            size="large"
            slot="start"
          ></ion-icon>
          <ion-icon
            v-else-if="(respuesta.points <= 0) & admin || respuesta.points <= 0"
            :icon="sadOutline"
            size="large"
            slot="start"
          ></ion-icon>
          <ion-icon
            v-else
            :icon="helpCircleOutline"
            size="large"
            slot="start"
          ></ion-icon>

          <ion-label color="medium">{{ respuesta.group.name }}</ion-label>
          <ion-note slot="end">
            <ion-text
              v-if="(respuesta.points > 0) & admin || respuesta.points > 0"
              color="success"
              ><h6>Obtienen: +{{ respuesta.points }}</h6></ion-text
            >
            <ion-text
              v-else-if="
                admin & (respuesta.points <= 0) || respuesta.points <= 0
              "
              color="danger"
              ><h6>Obtienen: {{ respuesta.points }}</h6></ion-text
            >
            <ion-text v-else color="warning"><h6>Obtienen: ?</h6></ion-text>
            <ion-text
              v-if="admin || grupoUsuario?.id == respuesta.group.id"
              color="warning"
              ><h6>Respuesta: {{ respuesta.option.identifier }}</h6></ion-text
            >
            <ion-text v-else color="primary"><h6>Respuesta: ?</h6></ion-text>
          </ion-note>
          <ion-buttons
            v-if="admin && groupAnswerCount[respuesta.group.id] > 1"
            slot="end"
          >
            <ion-button @click="presentDeleteAlert(respuesta.id)">
              <ion-icon :icon="trashOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-item>
      </ion-list>

      <ion-list v-else>
        <ion-item>
          <ion-label color="medium" class="ion-text-center"
            >Espere a que bloqueen la pregunta para ver resultados</ion-label
          >
        </ion-item>
      </ion-list>

      <ion-buttons
        v-if="admin"
        class="ion-justify-content-center ion-padding-top ion-padding-bottom"
      >
        <ion-button
          expand="full"
          fill="outline"
          shape="round"
          color="medium"
          class="ion-align-self-center"
          @click="bonus"
        >
          Cerrar Pregunta
          <ion-icon :icon="lockClosedOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-content>
  </ion-page>
</template>

<script>
import { useRoute } from "vue-router";
import router from "../router";
import axios from "axios";
import { ref } from "vue";
import { tokenHeader, adminOprofesor, usuarioGet } from "../globalService";

import {
  arrowDownCircle,
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
  paperPlaneOutline,
  happyOutline,
  sadOutline,
  ribbonOutline,
  helpCircleOutline,
  lockClosedOutline,
  trashOutline,
} from "ionicons/icons";

import {
  onIonViewDidEnter,
  IonIcon,
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonNote,
  IonText,
  IonLabel,
  IonTitle,
  alertController,
} from "@ionic/vue";

export default {
  components: {
    IonHeader,
    IonToolbar,
    IonContent,
    IonPage,
    IonIcon,
    IonButtons,
    IonButton,
    IonList,
    IonItem,
    IonNote,
    IonText,
    IonLabel,
    IonTitle,
  },
  setup() {
    const usuario = usuarioGet();
    const admin = adminOprofesor();
    const mroute = useRoute();
    const grupoUsuario = ref();
    const { id } = mroute.params;
    const respuestas = ref([
      {
        id: "Cargando",
        group: { name: "Cargando" },
        points: 0,
        option: {
          identifier: "Cargando",
        },
      },
    ]);
    const pregunta = ref({ title: "Cargando..." });

    const ordenarPorNombre = () => {
      respuestas.value.sort((a, b) => {
        const regex = /(\D+)(\d+)/;
        const [, textA, numberA] = a.group.name.match(regex);
        const [, textB, numberB] = b.group.name.match(regex);

        const textComparison = textA.localeCompare(textB);
        if (textComparison !== 0) {
          return textComparison;
        }

        return parseInt(numberA) - parseInt(numberB);
      });
    };

    const groupAnswerCount = ref({});

    const calcularRespuestasPorGrupo = () => {
      const counts = {};
      for (const respuesta of respuestas.value) {
        counts[respuesta.group.id] = (counts[respuesta.group.id] || 0) + 1;
      }
      groupAnswerCount.value = counts;
    };

    const presentDeleteAlert = async (answerId) => {
      const alert = await alertController.create({
        header: "Confirmar Eliminación",
        message:
          "¿Estás seguro de que quieres eliminar esta respuesta? Esta acción no se puede deshacer.",
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
          },
          {
            text: "Eliminar",
            handler: () => {
              deleteAnswer(answerId);
            },
          },
        ],
      });

      await alert.present();
    };

    const deleteAnswer = async (answerId) => {
      try {
        await axios.delete(`/answers/${answerId}`, tokenHeader());
        respuestas.value = respuestas.value.filter((r) => r.id !== answerId);
        calcularRespuestasPorGrupo();
      } catch (error) {
        console.error("Error al eliminar la respuesta:", error);
      }
    };

    onIonViewDidEnter(async () => {
      if (!adminOprofesor())
        await axios.get(`/users/${usuario?.id}/groups`).then((response) => {
          grupoUsuario.value = response.data.filter((g) => g.active)[0]?.group;
        });
      tokenHeader();
      await axios.get("/questions/" + id).then((response) => {
        pregunta.value = {
          title: response.data.title,
          available: response.data.available,
        };
      });
      await axios.get("/questions/" + id + "/answers").then((response) => {
        respuestas.value = response.data;
        calcularRespuestasPorGrupo();
      });
    });

    return {
      admin,
      id,
      ordenarPorNombre, // <-- Añadido aquí
      async bonus() {
        await axios
          .post(`/answers/question/${id}/bonus`)
          .then((response) => {
            localStorage.setItem("error", response);
          })
          .then(() => {
            router.push("/pregunta/" + id);
          });
      },
      grupoUsuario,
      respuestas,
      groupAnswerCount,
      arrowBackOutline,
      arrowDownCircle,
      handLeftOutline,
      paperPlaneOutline,
      refreshOutline,
      happyOutline,
      sadOutline,
      ribbonOutline,
      lockClosedOutline,
      pregunta,
      helpCircleOutline,
      trashOutline,
      presentDeleteAlert,
    };
  },
};
</script>
