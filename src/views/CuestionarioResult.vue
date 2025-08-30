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
                      {{
                        answer.option.identifier + ")" + answer.option.sentence
                      }}
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
        <input
          type="file"
          ref="fileInput"
          @change="onFileSelected"
          style="display: none"
          accept=".xlsx, .xls"
        />
        <ion-button
          expand="full"
          fill="outline"
          shape="round"
          color="primary"
          class="ion-align-self-center"
          @click="triggerFileUpload"
        >
          Importar Excel <ion-icon :icon="cloudUploadOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

      <!-- Modal for number of questions -->
      <ion-modal
        :is-open="isQuestionsModalOpen"
        @didDismiss="isQuestionsModalOpen = false"
      >
        <ion-header>
          <ion-toolbar>
            <ion-title>Número de Preguntas a Evaluar</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="isQuestionsModalOpen = false"
                >Cancelar</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-label position="stacked">Número de preguntas</ion-label>
            <ion-input type="number" v-model="numPreguntasAEvaluar"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label>Registrar solo si la nota es mayor</ion-label>
            <ion-checkbox v-model="registrarNotaMayor"></ion-checkbox>
          </ion-item>
          <ion-button expand="block" @click="processAndRegisterGrades"
            >Aceptar</ion-button
          >
        </ion-content>
      </ion-modal>

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
import { ref, computed } from "vue";
import { usuarioGet, tokenHeader } from "../globalService";
import { useRoute } from "vue-router";
import * as XLSX from "xlsx";

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
  cloudUploadOutline,
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
  IonModal,
  IonInput,
  IonCheckbox,
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
    IonModal,
    IonInput,
    IonCheckbox,
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

    const fileInput = ref(null);
    const isQuestionsModalOpen = ref(false);
    const numPreguntasAEvaluar = ref(0);
    const selectedFile = ref(null);
    const registrarNotaMayor = ref(false);

    const triggerFileUpload = () => {
      fileInput.value.click();
    };

    const onFileSelected = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      selectedFile.value = file;
      numPreguntasAEvaluar.value = totalPreguntas.value;
      isQuestionsModalOpen.value = true;
      event.target.value = "";
    };

    const registrarNotasDesdeExcel = async (grades, registrarMayor) => {
      const failedRegistrations = [];

      for (const grade of grades) {
        // eslint-disable-next-line no-unused-vars
        const { studentInfo, ...gradeData } = grade;
        try {
          await axios.post("/grades", { ...gradeData, registrarMayor });
        } catch (error) {
          failedRegistrations.push({
            student: studentInfo,
            error: error.response?.data?.message || "Error desconocido",
          });
        }
      }

      if (failedRegistrations.length > 0) {
        const errorList = failedRegistrations
          .map((f) => `<li>${f.student.lastName} ${f.student.name}</li>`)
          .join("");
        const alert = await alertController.create({
          header: "Error al Registrar Notas",
          subHeader: "Algunas notas no se pudieron registrar.",
          message: `Estudiantes afectados:<br><ul>${errorList}</ul>`,
          buttons: ["OK"],
        });
        await alert.present();
      } else {
        const successAlert = await alertController.create({
          header: "Éxito",
          message: "Todas las notas han sido registradas correctamente.",
          buttons: ["OK"],
        });
        await successAlert.present();
      }
    };

    const processAndRegisterGrades = async () => {
      isQuestionsModalOpen.value = false;
      const file = selectedFile.value;
      if (!file) {
        return;
      }

      const numPreguntas = numPreguntasAEvaluar.value;
      if (numPreguntas <= 0) {
        setErrorToastOpen(
          true,
          "El número de preguntas a evaluar debe ser mayor que 0."
        );
        return;
      }

      const reader = new FileReader();
      const data = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
      });

      const workbook = XLSX.read(new Uint8Array(data), { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // 🔹 Leer valor de la celda A1
      const cellA1 = worksheet["A1"] ? worksheet["A1"].v : null;

      // 🔹 Decidir desde qué fila arrancar (0 = primera fila, 1 = segunda fila)
      let startRow = 0;
      if (cellA1 === 0 || cellA1 === "0") {
        startRow = 1; // Encabezados en fila 2
      } else if (cellA1 === "Exam") {
        startRow = 0; // Encabezados en fila 1
      }

      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        range: startRow,
      });

      if (rows.length < 1) {
        console.error(
          "No se encontraron datos en el archivo Excel o está vacío."
        );
        return;
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      const datosParaRegistrar = [];
      const errores = [];

      const searchStudent = async (code) => {
        if (!code) return null;
        try {
          const response = await axios.get(`/users?code=${code}`);
          if (response.data && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        } catch (error) {
          console.error(`Error buscando estudiante con código ${code}:`, error);
          return null;
        }
      };

      for (const [index, rowArray] of dataRows.entries()) {
        const rowObject = {};
        headers.forEach((header, index) => {
          rowObject[header] = rowArray[index];
        });

        const correctAnswers = parseFloat(rowObject["Correct Answers"]);

        const totalMarks = rowObject["Total Marks"];
        const incorrectAnswers = rowObject["Incorrect Answers"];

        const isCorrectEmpty = correctAnswers == null || isNaN(correctAnswers);
        const isTotalEmpty = totalMarks == null || totalMarks === "";
        const isIncorrectEmpty =
          incorrectAnswers == null || incorrectAnswers === "";
        if (isCorrectEmpty && isTotalEmpty && isIncorrectEmpty) {
          continue;
        }

        const originalRollNo = String(rowObject["Roll No"] || "");
        const cleanedRollNo = originalRollNo.replace(/^0+/, "");

        let student = null;
        const searchAttempts = [];

        const rollNoWith1 = "1" + cleanedRollNo;
        searchAttempts.push(rollNoWith1);
        student = await searchStudent(rollNoWith1);

        if (!student) {
          const rollNoWith10 = "10" + cleanedRollNo;
          searchAttempts.push(rollNoWith10);
          student = await searchStudent(rollNoWith10);
        }
        if (!student) {
          searchAttempts.push(cleanedRollNo);
          student = await searchStudent(cleanedRollNo);
        }

        if (student) {
          const calculatedNota = (correctAnswers * 5) / numPreguntas;
          const nota = Math.min(calculatedNota, 5); // Capar nota en 5
          const gradeData = {
            userId: student.id,
            gradableId: parseInt(id, 10),
            gradableType: "quiz",
            periodId: cuestionario.value.lesson.period.id,
            gradeType: "regular",
            grade: parseFloat(nota.toFixed(2)),
            instituteId: cuestionario.value.lesson.institute.id,
            studentInfo: {
              name: student.name,
              lastName: student.lastName,
              code: student.code,
            },
          };
          datosParaRegistrar.push(gradeData);
        } else {
          errores.push({
            row: index + 2 + startRow, // Ajustar fila según origen
            "Roll No Original": originalRollNo,
            "Intentos de búsqueda": searchAttempts,
            Mensaje: "Estudiante no encontrado.",
          });
        }
      }

      if (errores.length > 0) {
        const errorMessages = errores
          .map(
            (e) =>
              `Fila ${e.row}: No se encontró al estudiante con Roll No ${e["Roll No Original"]}`
          )
          .join("<br>");
        const confirmAlert = await alertController.create({
          header: "Estudiantes no encontrados",
          message: `${errorMessages}<br><br>¿Desea registrar las notas de todas maneras para los estudiantes que sí se encontraron?`,
          buttons: [
            {
              text: "No",
              role: "cancel",
            },
            {
              text: "Sí",
              handler: () => {
                registrarNotasDesdeExcel(
                  datosParaRegistrar,
                  registrarNotaMayor.value
                );
              },
            },
          ],
        });
        await confirmAlert.present();
      } else {
        registrarNotasDesdeExcel(datosParaRegistrar, registrarNotaMayor.value);
      }
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
      fileInput,
      triggerFileUpload,
      cloudUploadOutline,
      isQuestionsModalOpen,
      numPreguntasAEvaluar,
      onFileSelected,
      processAndRegisterGrades,
      registrarNotaMayor,
    };
  },
};
</script>
