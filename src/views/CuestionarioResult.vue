<template>
  <ion-page>
    <div v-if="!isScanning && !isShowingScanResult">
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
            :value="respuesta.group ? respuesta.group.id : respuesta.user.id"
          >
            <ion-item slot="header" lines="full" class="ion-padding-end">
              <ion-icon
                v-if="respuesta.nota == 5"
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
              <ion-label color="medium">{{ respuesta.group ? respuesta.group.name : respuesta.user?.name + ' ' + respuesta.user?.lastName }}</ion-label>
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
                    (respuesta.group && respuesta.group.id === grupoUsuario?.id) ||
                    (respuesta.user && respuesta.user.id === usuario?.id) ||
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
                  (respuesta.group && respuesta.group.id === grupoUsuario?.id) ||
                  (respuesta.user && respuesta.user.id === usuario?.id) ||
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
                      <ion-icon
                        :icon="
                          answer.option.correct
                            ? checkmarkCircleOutline
                            : closeCircleOutline
                        "
                        :color="answer.option.correct ? 'success' : 'danger'"
                      ></ion-icon>
                      <p>
                        <strong>Respuesta seleccionada:</strong>
                        {{ answer.option.sentence }}
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
          <ion-button
            expand="full"
            fill="outline"
            shape="round"
            color="primary"
            class="ion-align-self-center"
            :href="/omr-read/{id}"
          >
            Escanear Hoja de Respuestas <ion-icon :icon="cameraOutline"></ion-icon>
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
    </div>

  </ion-page>
</template>

<script>
import axios from "axios";
import { adminOprofesor, numeroOrdinal } from "../globalService";
import { ref, computed, nextTick } from "vue";
import { usuarioGet, tokenHeader } from "../globalService";
import { useRoute } from "vue-router";
import OmrScanner from "@/components/OmrScanner.vue";

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
  cameraOutline,
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
  alertController,
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
    OmrScanner,
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
      JSON.parse(localStorage.getItem("quizSelected"))
    );
    const respuestas = ref([
      { group: { name: "Cargando", id: 0 }, points: "Cargando" },
    ]);

    const totalPreguntas = computed(() => {
      if (cuestionario.value && cuestionario.value.questions) {
        return cuestionario.value.questions.length;
      }
      return 0;
    });

    const isSuccessToastOpen = ref(false);
    const setSuccessToastOpen = (val) => (isSuccessToastOpen.value = val);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const setErrorToastOpen = (val, message = "") => {
      isErrorToastOpen.value = val;
      errorMessage.value = message;
    };

    const isScanning = ref(false);
    const omrScannerRef = ref(null);
    const isShowingScanResult = ref(false);
    const scanResultPayload = ref(null);
    const scannedStudent = ref(null);
    const scannedAnswers = ref([]);

    const startScan = async () => {
      isShowingScanResult.value = false;
      isScanning.value = true;
      await nextTick();
      omrScannerRef.value?.start();
    };

    const cancelScan = () => {
      if (isScanning.value) {
        omrScannerRef.value?.cancelScan();
      }
      isScanning.value = false;
    };

    const showStudentNotFoundAlert = async () => {
        const alert = await alertController.create({
            header: 'Estudiante no encontrado',
            message: 'El código escaneado no corresponde a ningún estudiante. ¿Qué deseas hacer?',
            buttons: [
                {
                    text: 'Salir',
                    role: 'cancel',
                },
                {
                    text: 'Reintentar',
                    handler: () => {
                        startScan();
                    },
                },
            ],
        });
        await alert.present();
    };

    const handleScanComplete = async (payload) => {
      isScanning.value = false;
      const numericResult = payload.results.find(r => r.typeOrigin === 'numeric');
      const studentCode = numericResult ? numericResult.content : null;

      if (!studentCode) {
          setErrorToastOpen(true, "No se pudo detectar el código del estudiante en el escaneo.");
          return;
      }

      try {
        const response = await axios.get(`/users?code=${studentCode}`);
        if (response.data && response.data.length > 0) {
            scannedStudent.value = response.data[0];
            scanResultPayload.value = payload;
            
            scannedAnswers.value = payload.results
                .filter(r => r.typeOrigin === 'question')
                .flatMap(block => block.content);

            isShowingScanResult.value = true;
        } else {
            showStudentNotFoundAlert();
        }
      } catch (error) {
        setErrorToastOpen(true, "Error al buscar el estudiante.");
        console.error("Error fetching student by code:", error);
      }
    };

    const submitScan = () => {
        // Logic to submit the scanned answers will be implemented in the next step
        console.log("Submitting scan...", {
            student: scannedStudent.value,
            answers: scannedAnswers.value
        });
    };

    const handleAccordionChange = async (e) => {
      const openedAccordion = e.detail.value;
      if (openedAccordion) {
        const id = parseInt(openedAccordion, 10);
        await loadRespuestas(id);
      }
    };

    const ordenarPorNombre = () => {
      respuestas.value.sort((a, b) => {
        if (a.user && b.user) {
             const nameA = a.user.name + ' ' + a.user.lastName;
             const nameB = b.user.name + ' ' + b.user.lastName;
             return nameA.localeCompare(nameB);
        } else if (a.group && b.group) {
            const regex = /(\D+)(\d+)/;
            const [, textA, numberA] = a.group.name.match(regex) || [null, a.group.name, 0];
            const [, textB, numberB] = b.group.name.match(regex) || [null, b.group.name, 0];

            const textComparison = textA.localeCompare(textB);
            if (textComparison !== 0) {
            return textComparison;
            }

            return parseInt(numberA) - parseInt(numberB);
        }
        return 0;
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
      
      await axios.get(`/quizzes/${id}/results`);
      await axios
        .get(`/quizzes/${id}/results`)
        .then((response) => {
          respuestas.value = response.data.map((e) => {
            e.points = parseFloat(e.points);

            let topic = (cuestionario.value.topic || "")
              .toLowerCase()
              .trim()
              .replace(/\s+/g, " ");

            const regexRefuerzo = /^refuerzo\s*(#|nº?|n)?\s*\d*$/i;
            const regexActividadRefuerzo =
              /^actividades?\s+de\s+refuerzo\s*(#|nº?|n)?\s*\d*$/i;

            const esRefuerzo =
              regexRefuerzo.test(topic) || regexActividadRefuerzo.test(topic);

            if (esRefuerzo) {
              e.nota = e.points != 0 ? (e.points * 5) / quizPoints.value : 0;
            } else {
              e.nota =
                e.points != 0 ? (e.points * 5) / response.data[0].points : 0;
            }

            e.nota = e.nota < 0 ? 0 : e.nota;
            return e;
          });
        })

        .then(() => {
          respuestaMAyor.value = respuestas.value.sort(
            (a, b) => b.points - a.points
          )[0];
        });
    });

    const loadRespuestas = async (targetId) => {
      loading.value = true;

      try {
        const answers = await getRespuestas(
          targetId,
          id,
          cuestionario.value.lesson.institute.id
        );
        respuestaDetallada.value = answers
          .map((answer, index) => {
            answer.numeroPregunta = numeroOrdinal(index, answer.question.title);
            return answer;
          })
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
           if (respuesta.user && respuesta.user.id) {
                const data = {
                    userId: respuesta.user.id,
                    gradableId: parseInt(id, 10),
                    gradableType: "quiz",
                    periodId: cuestionario.value.lesson.period.id,
                    gradeType: "regular",
                    grade: respuesta.nota,
                    instituteId: cuestionario.value.lesson.institute.id,
                };
                await axios.post("/grades", data);
                continue; 
           }

          if (!respuesta.group || !respuesta.group.id) {
            console.warn(
              "Skipping response due to missing group/user data:",
              respuesta
            );
            continue;
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
        const message =
          e.response?.data?.message || "Error al registrar las notas";
        setErrorToastOpen(true, message);
      }
    }

    async function getRespuestas(targetId, quizId, instituteId) {
      if (targetId == grupoUsuario.value?.id || admin || targetId == usuario.value?.id) {
        let queryParams = `?quizId=${quizId}&instituteId=${instituteId}`;

        if (cuestionario.value.quizType === 'individual') {
             queryParams += `&userId=${targetId}`;
        } else {
             queryParams += `&groupId=${targetId}`;
        }

        const response = await axios.get(`/answers${queryParams}`);
        return response.data;
      } else {
        return [];
      }
    }

    return {
      totalPreguntas,
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
      isScanning,
      omrScannerRef,
      startScan,
      cancelScan,
      handleScanComplete,
      cameraOutline,
      isShowingScanResult,
      scanResultPayload,
      scannedStudent,
      scannedAnswers,
      submitScan,
    };
  },
};
</script>
