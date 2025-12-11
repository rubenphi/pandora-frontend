<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="backUrl">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Escaneo de Hoja de Respuestas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-card v-if="cuestionario.id != 0">
        <ion-card-header style="position: relative">
          <ion-card-title class="ion-text-center">{{
            cuestionario.title
          }}</ion-card-title>
          <ion-card-subtitle class="ion-text-center"
            >Las respuestas escaneadas se registrarán a este
            cuestionario.</ion-card-subtitle
          >
        </ion-card-header>
      </ion-card>
      <div v-if="!isScanning">
        <ion-button expand="block" @click="startScan"> Escanear </ion-button>

        <div v-if="scanImageUrl" class="scan-result-container">
          <h3>Imagen del Escaneo</h3>
          <img
            :src="scanImageUrl"
            alt="Resultado del escaneo OMR"
            class="scan-result-image"
          />

          <div
            v-if="student.id || studentCodeInput"
            class="student-info-container ion-padding-top"
          >
            <ion-item>
              <ion-label position="stacked">Código de Estudiante</ion-label>
              <ion-input
                v-model="studentCodeInput"
                placeholder="Ingrese código"
              ></ion-input>
              <ion-button
                slot="end"
                fill="clear"
                @click="findStudentByCode(studentCodeInput)"
              >
                <ion-icon :icon="syncOutline" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-item>
            <div v-if="student.id" class="ion-padding-top">
              <strong>Estudiante:</strong> {{ student.name }}
              {{ student.lastName }}
            </div>
          </div>
        </div>

        <IonList>
          <IonItem v-for="answer in answersToSend" :key="answer.id">
            <IonLabel>{{ answer.questionTitle }} </IonLabel>
            <ion-select
              v-model="answer.selectedOption"
              placeholder="Seleccione"
              interface="popover"
            >
              <ion-select-option
                v-for="option in answer.options"
                :key="option.id"
                :value="option.id"
              >
                {{ option.identifier }}
              </ion-select-option>
            </ion-select>
          </IonItem>
        </IonList>
        <ion-item>
          <ion-label position="stacked"
            >Resultados del Escaneo (JSON)</ion-label
          >
          <ion-textarea
            v-model="scanResults"
            readonly
            rows="10"
            placeholder="Los resultados del escaneo aparecerán aquí..."
          ></ion-textarea>
        </ion-item>
      </div>

      <div
        v-show="isScanning"
        style="
          height: 90%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        "
      >
        <omr-scanner
          ref="scannerComponent"
          @scan-complete="onScanComplete"
          @scan-cancelled="onScanCancelled"
        ></omr-scanner>
      </div>
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
  IonButton,
  IonTextarea,
  IonLabel,
  IonList,
  IonItem,
  onIonViewDidEnter,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonIcon,
  IonSelect,
  IonSelectOption,
  alertController,
  IonInput,
} from "@ionic/vue";
import { ref, nextTick } from "vue";
import OmrScanner from "@/components/OmrScanner.vue";
import { tokenHeader } from "../globalService";
import axios from "axios";
import { useRoute } from "vue-router";
import { arrowBackOutline, syncOutline } from "ionicons/icons";

export default {
  name: "OmrRead",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonTextarea,
    IonLabel,
    IonItem,
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonIcon,
    IonSelect,
    IonSelectOption,
    OmrScanner,
    IonInput,
  },
  setup() {
    const route = useRoute();
    const quizId = route.params.id;
    const cuestionario = ref({});
    const isScanning = ref(false);
    const scanResults = ref("");
    const scanImageUrl = ref(null);
    const scannerComponent = ref(null);
    const backUrl = ref("/inicio");
    const answersToSend = ref([]);
    const student = ref({});
    const studentCodeInput = ref("");

    const startScan = async () => {
      scanImageUrl.value = null;
      scanResults.value = "";
      student.value = {};
      studentCodeInput.value = "";
      isScanning.value = true;
      await nextTick(); // Wait for the DOM to update after v-show
      if (scannerComponent.value) {
        scannerComponent.value.start();
      }
    };

    const findStudentByCode = async (code, context = "manual") => {
      if (!code) {
        student.value = {};
        return;
      }
      try {
        const response = await axios.get(`/users?code=${code}`);
        if (response.data.length === 0) {
          student.value = { id: null, name: "No encontrado", lastName: "" };

          const alertButtons =
            context === "scan"
              ? [
                  { text: "Cancelar", role: "cancel" },
                  { text: "Reescanear", handler: () => startScan() },
                ]
              : ["OK"];

          const alert = await alertController.create({
            header: "Estudiante no encontrado",
            message: `No se encontró ningún estudiante con el código "${code}".`,
            buttons: alertButtons,
          });
          await alert.present();
        } else {
          student.value = response.data[0];
        }
      } catch (error) {
        student.value = { id: null, name: "No encontrado", lastName: "" };
        const alertButtons =
          context === "scan"
            ? [
                { text: "Cancelar", role: "cancel" },
                { text: "Reescanear", handler: () => startScan() },
              ]
            : ["OK"];
        const alert = await alertController.create({
          header: "Error de Red",
          message:
            "No se pudo verificar el código del estudiante. Verifique su conexión e inténtelo de nuevo.",
          buttons: alertButtons,
        });
        await alert.present();
      }
    };

    const onScanComplete = (payload) => {
      scanResults.value = JSON.stringify(payload.results, null, 2);
      const questionsArrayBlockResults = payload.results.filter(
        (r) => r.typeOrigin === "question"
      );

      const concatedAnswers = [];
      questionsArrayBlockResults.forEach((block) => {
        concatedAnswers.push(...block.content);
      });

      answersToSend.value.forEach((answer, index) => {
        const answerSameIdentfier = answer.options.find(
          (opt) =>
            opt.identifier.toLowerCase() ===
            concatedAnswers[index].answer.toLowerCase()
        );
        if (answerSameIdentfier) {
          answer.selectedOption = answerSameIdentfier.id;
        }
      });
      const studentCode = payload.results.find(
        (r) => r.typeOrigin === "numeric"
      );

      if (studentCode && studentCode.content) {
        studentCodeInput.value = studentCode.content;
        findStudentByCode(studentCode.content, "scan"); // Immediate search with scan context
      } else {
        // No student code was found in the scan
        studentCodeInput.value = "";
        student.value = {};
        alertController
          .create({
            header: "Código no encontrado",
            message:
              "No se pudo detectar un código de estudiante en el escaneo. Puede ingresarlo manualmente.",
            buttons: ["OK"],
          })
          .then((alert) => alert.present());
      }

      scanImageUrl.value = payload.imageUrl;
      isScanning.value = false;
    };

    const onScanCancelled = () => {
      isScanning.value = false;
    };

    onIonViewDidEnter(async () => {
      tokenHeader();
      const response = await axios.get(`/quizzes/${quizId}`);
      cuestionario.value = {
        id: response.data.id,
        title: response.data.title,
        quizType: response.data.quizType,
        lessonId: response.data.lesson.id,
        questions: response.data.questions,
        instituteId: response.data.lesson.institute.id,
        exist: response.data.exist,
      };

      cuestionario.value.questions = cuestionario.value.questions.sort(
        (a, b) => a.id - b.id
      );

      answersToSend.value = cuestionario.value.questions.map((question) => {
        return {
          id: question.id,
          questionTitle: question.title,
          options: question.options.map((option) => ({
            id: option.id,
            identifier: option.identifier,
          })),
          selectedOption: null,
        };
      });

      if (cuestionario.value.id) {
        backUrl.value = `/ganadores/${cuestionario.value.id}`;
      }
    });

    return {
      isScanning,
      student,
      scanResults,
      scanImageUrl,
      cuestionario,
      answersToSend,
      scannerComponent,
      arrowBackOutline,
      syncOutline,
      backUrl,
      studentCodeInput,
      startScan,
      onScanComplete,
      onScanCancelled,
      findStudentByCode,
    };
  },
};
</script>

<style scoped>
ion-textarea {
  margin-top: 10px;
  border: 1px solid var(--ion-color-medium);
  border-radius: 5px;
}
.scan-result-container {
  margin-top: 20px;
  margin-bottom: 20px;
  text-align: center;
}
.scan-result-image {
  max-width: 100%;
  border: 1px solid var(--ion-color-medium);
  border-radius: 5px;
}
</style>