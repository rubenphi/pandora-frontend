<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" class="ion-margin-start">
          <ion-button
            v-if="question.quiz?.id != 0"
            :href="'/cuestionario/' + question.quiz.id"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons v-if="resVisible == 1" slot="end" class="ion-margin-end">
          <ion-button :href="'/resultado/' + question.id">
            <ion-icon :icon="podiumOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-card>
        <ion-card-header>
          <ion-card-title class="ion-text-center">
            {{ question.title }}
          </ion-card-title>
          <ion-card-subtitle class="ion-text-center">
            Esta pregunta vale: + {{ question.points }} puntos
          </ion-card-subtitle>
          <ion-icon slot="end" :icon="createOutline"></ion-icon>
        </ion-card-header>
      </ion-card>
      <ion-grid>
        <ion-row>
          <ion-col size-xs="1" size-s="1" size-md="2" size-lg="3" size-xl="3">
          </ion-col>

          <ion-col size-xs="10" size-s="10" size-md="8" size-lg="6" size-xl="6">
            <ion-card v-if="question.photo">
              <ion-img :src="basedeURL + question.photo"></ion-img>
            </ion-card>
          </ion-col>
          <ion-col size-xs="1" size-s="1" size-md="2" size-lg="3" size-xl="3">
          </ion-col>
        </ion-row>
      </ion-grid>
      <ion-card>
        <div class="ion-padding" v-html="question.sentence"></div>
        <ion-item v-if="admin" button :href="'/editar/pregunta/' + question.id">
          <ion-icon slot="end" :icon="createOutline"></ion-icon>
        </ion-item>
      </ion-card>
      <ion-card class="ion-padding-top ion-padding-bottom">
        <div
          style="position: relative; text-align: center; padding: 0 16px 10px;"
        >
          <ion-card-subtitle v-if="error.estatus === 0">
            Selecciona tu respuesta
          </ion-card-subtitle>
          <ion-button
            v-if="admin"
            @click="toggleShowCorrectAnswer()"
            fill="clear"
            style="position: absolute; top: 50%; right: 8px; transform: translateY(-50%); margin: 0;"
          >
            <ion-icon :icon="showCorrectAnswer ? eyeOffOutline : eyeOutline"></ion-icon>
          </ion-button>
        </div>

        <ion-list>
          <ion-item v-if="error.estatus === 1" color="danger">
            <ion-label>
              {{ error.data }}
            </ion-label>
          </ion-item>
          <div v-if="!admin">
            <ion-radio-group v-model="respuesta.optionId">
              <ion-item
                lines="none"
                v-for="option in question.options"
                :key="option.id"
              >
                <ion-label class="ion-text-wrap"
                  ><b>{{ option.identifier }}. </b>
                  {{ option.sentence }}</ion-label
                >

                <ion-radio
                  slot="start"
                  :value="option.id"
                  :id="option.id"
                ></ion-radio>
              </ion-item>
            </ion-radio-group>
          </div>
          <div v-if="admin">
            <ion-item
              button
              lines="none"
              v-for="option in question.options"
              :key="option.id"
              :href="'editar/opcion/' + option.id"
            >
              <ion-label class="ion-text-wrap"
                ><b>{{ option.identifier }}. </b>
                {{ option.sentence }}</ion-label
              >
              <ion-icon
                slot="start"
                :color="showCorrectAnswer && option.correct ? 'success' : ''"
                :icon="createOutline"
              ></ion-icon>
            </ion-item>
          </div>
        </ion-list>
      </ion-card>

      <ion-buttons
        v-if="!admin && (grupoUsuario?.id || question.quiz?.quizType === 'individual')"
        class="ion-justify-content-center ion-padding-top ion-padding-bottom"
      >
        <ion-button
          expand="full"
          fill="outline"
          shape="round"
          color="primary"
          class="ion-align-self-center"
          :disabled="loading"
          @click="responder"
        >
          <ion-icon slot="end" :icon="paperPlaneOutline"></ion-icon>
          <ion-label class="ion-text-center"> Enviar Respuesta </ion-label>
        </ion-button>
      </ion-buttons>

      <div v-if="!admin && !grupoUsuario?.id && question.quiz?.quizType !== 'individual'">
        <ion-card>
          <ion-card-header>
            <ion-card-title class="ion-text-center">
              No puedes responder preguntas si no perteneces a un grupo
            </ion-card-title>
          </ion-card-header>
        </ion-card>
      </div>

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
          :href="'crear/opcion/' + question.id"
        >
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
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
  defaultFile,
  shuffleArray,
} from "../globalService";
import { useRoute } from "vue-router";
import router from "../router";

import {
  arrowBackOutline,
  refreshOutline,
  handLeftOutline,
  paperPlaneOutline,
  podiumOutline,
  createOutline,
  addOutline,
  eyeOutline,
  eyeOffOutline,
} from "ionicons/icons";

import {
  onIonViewDidEnter,
  IonIcon,
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  // IonCardContent,
  IonImg,
  IonRadio,
  IonLabel,
  IonRadioGroup,
  IonCardSubtitle,
  IonItem,
  IonList,
} from "@ionic/vue";

export default {
  components: {
    IonList,
    IonLabel,
    IonItem,
    IonHeader,
    IonToolbar,
    IonContent,
    IonPage,
    IonIcon,
    IonButtons,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    // IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonRadioGroup,
    IonRadio,
    IonCardSubtitle,
  },
  setup() {
    const admin = adminOprofesor();
    const usuario = usuarioGet();
    const botonInactivo = ref(false);
    const mroute = useRoute();
    const grupoUsuario = ref();
    const { id } = mroute.params;
    const question = ref({
      id: "",
      points: "",
      sentence: "",
      quiz: {
        id: 0,
      },
      options: {
        sentence: "",
      },
    });
    const src = ref("");
    const respuesta = ref({
      optionId: "",
      questionId: "",
      groupId: "",
      quizId: "",
      userId: usuario?.id,
      exist: 0,
    });

    const error = ref({
      estatus: 0,
      data: "",
    });
    const resVisible = ref(0);
    const loading = ref(false);
    const disableRandomization = ref(false);
    const showCorrectAnswer = ref(false);

    onIonViewDidEnter(async () => {
      tokenHeader();

      // 1. Fetch question data first
      await axios.get("/questions/" + id).then((response) => {
        question.value = {
          id: response.data.id,
          points: response.data.points,
          sentence: response.data.sentence,
          quiz: response.data.quiz,
          title: response.data.title,
          photo: response.data.photo,
          options: response.data.options, // Keep original options for now
        };

        if (!question.value.photo) {
          src.value = defaultFile("thumbnail");
        }
        var rem = new RegExp("<p></p>", "g");
        question.value.sentence = question.value.sentence.replace(rem, "</br>");
      });

      // 2. Now that question.value is populated, proceed with randomization logic
      const storedRandomizationKey = localStorage.getItem("ordenOpcionesKey");
      if (storedRandomizationKey) {
        try {
          const { quizId, authCode } = JSON.parse(storedRandomizationKey);
          const invitationResponse = await axios.get(
            `/invitations?code=${authCode}&valid=true&exist=true`,
            tokenHeader()
          );

          if (invitationResponse.data && invitationResponse.data.length > 0) {
            if (quizId === question.value.quiz?.id) {
              disableRandomization.value = true;
            }
          } else {
            disableRandomization.value = false;
            localStorage.removeItem("ordenOpcionesKey");
          }
        } catch (e) {
          localStorage.removeItem("ordenOpcionesKey");
          console.error("Error parsing or validating randomization key:", e);
        }
      }

      // 3. Process options based on admin status or disabled randomization
      let processedOptions;
      if (
        admin ||
        (disableRandomization.value &&
          question.value.quiz?.id === question.value.quiz?.id)
      ) {
        processedOptions = question.value.options.sort((a, b) =>
          a.identifier.localeCompare(b.identifier)
        );
      } else {
        processedOptions = shuffleArray(question.value.options).map(
          (option, index) => {
            return {
              ...option,
              identifier: String.fromCharCode(65 + index),
            };
          }
        );
      }
      question.value.options = processedOptions;

      // 4. Fetch group answers (if not admin)
      if (!adminOprofesor())
        await axios.get(`/users/${usuario?.id}/groups`).then((response) => {
          grupoUsuario.value = response.data.filter((g) => g.active)[0]?.group;
        });

      if (!admin && grupoUsuario.value?.id) {
        await axios
          .get(`/answers?questionId=${id}&groupId=${grupoUsuario.value.id}`)
          .then((response) => {
            if (response.data && response.data.length > 0) {
              resVisible.value = 1;
            }
          })
          .catch(() => {
            // Fail silently, user is treated as not having answered.
          });
      }

      if (admin) {
        resVisible.value = 1;
      }
    });

    const toggleShowCorrectAnswer = () => {
      showCorrectAnswer.value = !showCorrectAnswer.value;
    };

    return {
      async responder() {
        const hasCorrectOption = question.value.options.some(
          (option) => option.correct
        );

        if (!hasCorrectOption) {
          error.value.estatus = 1;
          error.value.data =
            "Esta pregunta no tiene una respuesta correcta marcada. Por favor, informa a tu profesor.";
          return;
        }

        if (respuesta.value.optionId == "") {
          error.value.estatus = 1;
          error.value.data = "Debe seleccionar una opción.";
        } else {
          respuesta.value.questionId = question.value.id;
          if (question.value.quiz?.quizType !== 'individual') {
               respuesta.value.groupId = grupoUsuario.value?.id;
          }
          respuesta.value.quizId = question.value.quiz?.id;
          respuesta.value.exist = true;
          respuesta.value.instituteId = usuarioGet().institute.id;
          botonInactivo.value = true;
          loading.value = true;
          await axios
            .post("/answers", respuesta.value)
            .then(() => {
              botonInactivo.value = false;
              loading.value = false;
              router.push("/resultado/" + question.value.id);
            })
            .catch((fallo) => {
              botonInactivo.value = false;
              loading.value = false;
              error.value.estatus = 1;
              error.value.data = fallo.response.data.message;
              localStorage.setItem("error", fallo.response.data.message);
            });
        }
      },
      basedeURL: basedeURL(),
      admin,
      error,
      resVisible,
      respuesta,
      question,
      arrowBackOutline,
      handLeftOutline,
      refreshOutline,
      paperPlaneOutline,
      podiumOutline,
      createOutline,
      addOutline,
      eyeOutline,
      eyeOffOutline,
      grupoUsuario,
      botonInactivo,
      loading,
      showCorrectAnswer,
      toggleShowCorrectAnswer,
    };
  },
};
</script>