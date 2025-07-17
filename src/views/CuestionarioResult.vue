<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title size="large" class="ion-text-center"
          >{{ cuestionario.topic }}
        </ion-title>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button v-if="id" :href="'/cuestionario/' + id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button v-if="id" :href="'/ganadores/' + id">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button v-if="usuario?.rol == 'admin'" @click="ordenarPorNombre">
            <ion-icon :icon="arrowDownCircle"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-accordion-group @ionChange="handleAccordionChange">
        <ion-accordion
          v-for="(respuesta, index) in respuestas"
          :key="index"
          :value="respuesta.group.id"
        >
          <ion-item slot="header" lines="full" class="ion-padding-end">
            <ion-icon
              v-if="index === 0 && respuesta.points > 0"
              :icon="trophyOutline"
              size="large"
              slot="start"
            ></ion-icon>
            <ion-icon
              v-else-if="respuesta.nota >= 3"
              :icon="happyOutline"
              size="large"
              slot="start"
            ></ion-icon>
            <ion-icon
              v-else
              :icon="sadOutline"
              size="large"
              slot="start"
            ></ion-icon>
            <ion-label color="medium">{{ respuesta.group.name }}</ion-label>
            <ion-note slot="end">
              <ion-text v-if="index === 0" color="warning">
                <h6>
                  <ion-icon :icon="starOutline"></ion-icon>GANADOR<ion-icon
                    :icon="starOutline"
                  ></ion-icon>
                </h6>
              </ion-text>
              <ion-text v-if="respuesta.points > 0" color="success">
                <h6>Total Puntos: {{ respuesta.points }}</h6>
              </ion-text>
              <ion-text v-else color="danger">
                <h6>Total Puntos: {{ respuesta.points }}</h6>
              </ion-text>
              <ion-text
                v-if="
                  respuesta?.group?.id === grupoUsuario?.id ||
                  usuario?.rol == 'admin'
                "
              >
                Nota: {{ parseFloat(respuesta.nota).toFixed(1) }}
              </ion-text>
            </ion-note>
          </ion-item>
          <div class="ion-padding" slot="content">
            <ion-list
              v-if="
                respuesta?.group?.id === grupoUsuario?.id ||
                usuario?.rol == 'admin'
              "
            >
              <ion-spinner v-if="loading" name="crescent"></ion-spinner>
              <template v-else>
                <div>
                  <strong>
                    Tienes un total de {{ respuestaDetallada.length }} preguntas
                    resueltas.
                    <p
                      v-if="respuesta.points != respuestaMAyor.points"
                      style="color: orange"
                    >
                      Tienes
                      {{ respuestaMAyor.points - respuesta.points }} puntos
                      menos que el grupo con mejor puntaje así que tienes
                      preguntas incorrectas o que no respondiste.
                    </p>
                  </strong>
                </div>
                <ion-item v-for="answer in respuestaDetallada" :key="answer.id">
                  <ion-label>
                    <strong
                      >{{ answer.numeroPregunta }}.{{
                        answer.question.title
                      }}</strong
                    >
                    <p>
                      <strong>Respuesta seleccionada:</strong>
                      {{
                        answer.option.identifier + ")" + answer.option.sentence
                      }}
                      <ion-icon
                        :icon="
                          answer.option.correct
                            ? checkmarkCircleOutline
                            : closeCircleOutline
                        "
                        :color="answer.option.correct ? 'success' : 'danger'"
                      ></ion-icon>
                    </p>
                    <p>
                      <strong>Puntos obtenidos:</strong> {{ answer.points }}
                    </p>
                  </ion-label>
                </ion-item>
              </template>
            </ion-list>
            <ion-text v-else color="medium">
              <p class="ion-text-center">
                No tienes permiso para ver estas respuestas
              </p>
            </ion-text>
          </div>
        </ion-accordion>
      </ion-accordion-group>

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
          @click="registrarNotas"
        >
          Registrar notas <ion-icon :icon="fileTrayFullOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

      <!-- Toasts -->
      <ion-toast
        :is-open="isSuccessToastOpen"
        message="Notas registradas correctamente"
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
import axios from "axios";
import { adminOprofesor, numeroOrdinal } from "../globalService";
import { ref } from "vue";
import { usuarioGet, tokenHeader } from "../globalService";
import { useRoute } from "vue-router";

import {
  arrowBackOutline,
  refreshOutline,
  arrowDownCircle,
  handLeftOutline,
  paperPlaneOutline,
  happyOutline,
  sadOutline,
  ribbonOutline,
  starOutline,
  trophyOutline,
  fileTrayFullOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
} from "ionicons/icons";

import {
  IonTitle,
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
  IonAccordionGroup,
  IonAccordion,
  IonSpinner,
  IonToast,
} from "@ionic/vue";

export default {
  components: {
    IonTitle,
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
    IonAccordionGroup,
    IonAccordion,
    IonSpinner,
    IonToast,
  },
  setup() {
    const usuario = ref();
    const admin = adminOprofesor();
    const grupoUsuario = ref();
    const mroute = useRoute();
    const { id } = mroute.params;
    const loading = ref(false);
    const quizPoints = ref(0);
    const respuestaDetallada = ref({});
    const respuestaMAyor = ref({
      group: { name: "Cargando", id: 0 },
      points: 0,
    });
    const cuestionario = ref(
      JSON.parse(localStorage.getItem("lessonSelected"))
    );
    const respuestas = ref([
      { group: { name: "Cargando", id: 0 }, points: "Cargando" },
    ]);

    const isSuccessToastOpen = ref(false);
    const setSuccessToastOpen = (val) => (isSuccessToastOpen.value = val);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const setErrorToastOpen = (val, message = "") => {
      isErrorToastOpen.value = val;
      errorMessage.value = message;
    };

    const handleAccordionChange = async (e) => {
      const openedAccordion = e.detail.value;
      if (openedAccordion) {
        const groupId = parseInt(openedAccordion, 10);
        await loadRespuestas(groupId);
      }
    };

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

    onIonViewDidEnter(async () => {
      usuario.value = usuarioGet();
      if (!adminOprofesor())
        await axios
          .get(`/users/${usuario.value?.id}/groups`)
          .then((response) => {
            grupoUsuario.value = response.data.filter(
              (g) => g.active
            )[0]?.group;
          });
      tokenHeader();

      await axios.get(`/quizzes/${id}/points`).then((response) => {
        quizPoints.value = response.data.points;
      });

      await axios
        .get(`/quizzes/${id}/results`)
        .then((response) => {
          respuestas.value = response.data.map((e) => {
            e.points = parseFloat(e.points);
            if (cuestionario.value.topic == "Refuerzo") {
              e.nota = e.points != 0 ? (e.points * 5) / quizPoints.value : 0;
              e.nota = e.nota < 0 ? 0 : e.nota;
            } else {
              e.nota =
                e.points != 0 ? (e.points * 5) / response.data[0].points : 0;
              e.nota = e.nota < 0 ? 0 : e.nota;
            }
            return e;
          });
        })
        .then(() => {
          respuestaMAyor.value = respuestas.value.sort(
            (a, b) => b.points - a.points
          )[0];
        });
    });

    const loadRespuestas = async (groupId) => {
      loading.value = true;

      try {
        const answers = await getRespuestas(
          groupId,
          id,
          cuestionario.value.lesson.institute.id
        );
        respuestaDetallada.value = answers
          .map((answer, index) => {
            answer.numeroPregunta = numeroOrdinal(index, answer.question.title);
            return answer;
          })
          // order by numeroPregunta
          .sort((a, b) => a.numeroPregunta - b.numeroPregunta);
      } catch (error) {
        console.error("Error loading answers:", error);
      }
      loading.value = false;
    };

    async function registrarNotas() {
      if (!cuestionario.value || !cuestionario.value.lesson.year) {
        setErrorToastOpen(true, "Faltan datos del cuestionario.");
        return;
      }
      try {
        for (const respuesta of respuestas.value) {
          if (!respuesta.group || !respuesta.group.id) {
            console.warn(
              "Skipping response due to missing group data:",
              respuesta
            );
            continue; // Skip to the next response
          }
          const response = await axios.get(
            `/groups/${respuesta.group.id}/${cuestionario.value.lesson.year}/users`
          );
          for (const relacionUsuario of response.data) {
            const data = {
              userId: relacionUsuario.user.id,
              gradableId: parseInt(id, 10),
              gradableType: "quiz",
              periodId: cuestionario.value.lesson.period.id,
              gradeType: "regular",
              grade: respuesta.nota,
              instituteId: cuestionario.value.lesson.institute.id,
            };

            await axios.post("/grades", data);
          }
        }
        setSuccessToastOpen(true);
      } catch (e) {
        const message = e.response?.data?.message || "Error al registrar las notas";
        setErrorToastOpen(true, message);
      }
    }

    async function getRespuestas(groupId, quizId, instituteId) {
      if (groupId == grupoUsuario.value?.id || admin) {
        const response = await axios.get(
          `/answers?groupId=${groupId}&quizId=${quizId}&instituteId=${instituteId}`
        );
        return response.data;
      } else {
        return [];
      }
    }

    return {
      usuario,
      lessonPoints: quizPoints,
      id,
      cuestionario,
      respuestas,
      respuestaDetallada,
      loading,
      registrarNotas,
      loadRespuestas,
      handleAccordionChange,
      arrowBackOutline,
      grupoUsuario,
      handLeftOutline,
      paperPlaneOutline,
      refreshOutline,
      arrowDownCircle,
      happyOutline,
      sadOutline,
      ribbonOutline,
      starOutline,
      trophyOutline,
      ordenarPorNombre,
      admin,
      fileTrayFullOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      respuestaMAyor,
      isSuccessToastOpen,
      setSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setErrorToastOpen,
    };
  },
};
</script>
