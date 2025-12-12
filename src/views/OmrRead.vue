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
      <div v-if="!isScanning" class="ion-padding-top">
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

        <!-- Section Tabs -->
        <div v-if="numberOfSections > 1" class="ion-padding-vertical">
          <ion-segment v-model="currentSection" scrollable>
            <ion-segment-button
              v-for="section in numberOfSections"
              :key="section"
              :value="section"
            >
              <ion-label
                >Preguntas {{ (section - 1) * 40 + 1 }} -
                {{
                  Math.min(section * 40, cuestionario.questions.length)
                }}</ion-label
              >
            </ion-segment-button>
          </ion-segment>
        </div>

        <ion-grid>
          <ion-row>
            <ion-col>
              <ion-button
                expand="block"
                @click="startScan"
                :disabled="isSubmitting"
              >
                Escanear
                <span v-if="numberOfSections > 1"
                  >&nbsp;Sección {{ currentSection }}</span
                >
              </ion-button>
            </ion-col>
            <ion-col>
              <ion-button
                expand="block"
                @click="submitAnswers"
                :disabled="!student.id || isSubmitting"
                color="secondary"
              >
                <ion-spinner v-if="isSubmitting" name="crescent"></ion-spinner>
                <ion-icon v-else :icon="saveOutline" slot="start"></ion-icon>
                Guardar
              </ion-button>
            </ion-col>
          </ion-row>
        </ion-grid>

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
                :disabled="isSubmitting"
              ></ion-input>
              <ion-button
                slot="end"
                fill="clear"
                @click="findStudentByCode(studentCodeInput)"
                :disabled="isSubmitting"
              >
                <ion-icon :icon="syncOutline" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-item>
            <div v-if="student.id" class="ion-padding-vertical">
              <div>
                <strong>Estudiante:</strong> {{ student.name }}
                {{ student.lastName }}
              </div>
              <div
                v-if="cuestionario.quizType === 'group' && activeGroup"
                class="ion-padding-top"
              >
                <strong>Grupo Activo:</strong> {{ activeGroup.name }}
              </div>
            </div>
          </div>
        </div>

        <IonList>
          <IonItem
            v-for="answer in questionsForCurrentSection"
            :key="answer.id"
          >
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
  IonCol,
  IonRow,
  IonSpinner,
  IonGrid,
  IonSegment,
  IonSegmentButton,
} from "@ionic/vue";
import { ref, nextTick, computed } from "vue"; // Import computed
import OmrScanner from "@/components/OmrScanner.vue";
import { tokenHeader } from "../globalService";
import { useRoute, useRouter } from "vue-router";
import { arrowBackOutline, saveOutline, syncOutline } from "ionicons/icons";
import axios from "axios";

export default {
  name: "OmrRead",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCol,
    IonRow,
    IonSpinner,
    IonGrid,
    IonButtons,
    IonButton,
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
    IonSegment,
    IonSegmentButton,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
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
    const activeGroup = ref(null);
    const isSubmitting = ref(false);

    // New state for sections
    const numberOfSections = ref(1);
    const currentSection = ref(1);

    // Computed property for displaying questions of the current section
    const questionsForCurrentSection = computed(() => {
      if (answersToSend.value.length === 0) {
        return [];
      }
      const start = (currentSection.value - 1) * 40;
      const end = currentSection.value * 40;
      return answersToSend.value.slice(start, end);
    });

    const startScan = async () => {
      // This will clear the student info for each new scan, which is acceptable
      // as the student code is on each sheet.
      scanImageUrl.value = null;
      scanResults.value = "";
      student.value = {};
      studentCodeInput.value = "";
      activeGroup.value = null;
      isScanning.value = true;
      await nextTick(); // Wait for the DOM to update after v-show
      if (scannerComponent.value) {
        scannerComponent.value.start();
      }
    };

    const findStudentByCode = async (code, context = "manual") => {
      if (!code) {
        student.value = {};
        activeGroup.value = null;
        return;
      }
      try {
        // Assuming the endpoint returns the user with its relations, including groups
        const response = await axios.get(`/users?code=${code}`);
        if (response.data.length === 0) {
          student.value = { id: null, name: "No encontrado", lastName: "" };
          activeGroup.value = null;

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
          // Find the active group
          if (student.value.groups && student.value.groups.length > 0) {
            const userToGroup = student.value.groups.find((g) => g.active);
            if (userToGroup) {
              activeGroup.value = userToGroup.group;
            }
          }
        }
      } catch (error) {
        student.value = { id: null, name: "No encontrado", lastName: "" };
        activeGroup.value = null;
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

      // --- MODIFIED LOGIC FOR SECTIONS ---
      const sectionOffset = (currentSection.value - 1) * 40;
      concatedAnswers.forEach((scannedAnswer, index) => {
        const globalIndex = sectionOffset + index;
        if (globalIndex < answersToSend.value.length) {
          const question = answersToSend.value[globalIndex];
          const option = question.options.find(
            (opt) =>
              opt.identifier.toLowerCase() ===
              scannedAnswer.answer.toLowerCase()
          );
          if (option) {
            question.selectedOption = option.id;
          }
        }
      });
      // --- END OF MODIFIED LOGIC ---

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
        activeGroup.value = null;
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

    const submitAnswers = async () => {
      if (!student.value.id) {
        const alert = await alertController.create({
          header: "Error",
          message: "Se requiere un estudiante para guardar las respuestas.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      if (
        cuestionario.value.quizType === "group" &&
        (!activeGroup.value || !activeGroup.value.id)
      ) {
        const alert = await alertController.create({
          header: "Error",
          message:
            "Este es un cuestionario de grupo y no se encontró un grupo activo para el estudiante.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      const answersPayload = answersToSend.value
        .filter((a) => a.selectedOption !== null)
        .map((a) => ({
          questionId: a.id,
          optionId: a.selectedOption,
        }));

      if (answersPayload.length === 0) {
        const alert = await alertController.create({
          header: "Sin respuestas",
          message: "No hay ninguna respuesta seleccionada para enviar.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      const bulkDto = {
        quizId: cuestionario.value.id,
        instituteId: cuestionario.value.instituteId,
        answers: answersPayload,
      };

      if (cuestionario.value.quizType === "group") {
        bulkDto.groupId = activeGroup.value.id;
        bulkDto.userId = student.value.id;
      } else {
        bulkDto.userId = student.value.id;
      }

      isSubmitting.value = true;
      try {
        await axios.post("/answers/bulk", bulkDto);
        const alert = await alertController.create({
          header: "Éxito",
          message: "Las respuestas se han guardado correctamente.",
          buttons: [
            {
              text: "OK",
              handler: () => {
                router.push(backUrl.value);
              },
            },
          ],
        });
        await alert.present();
      } catch (error) {
        const message =
          error.response?.data?.message ||
          "Ocurrió un error al guardar las respuestas.";
        const alert = await alertController.create({
          header: "Error al Guardar",
          message: message,
          buttons: ["OK"],
        });
        await alert.present();
      } finally {
        isSubmitting.value = false;
      }
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

      // Calculate number of sections
      numberOfSections.value = Math.ceil(
        cuestionario.value.questions.length / 40
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
      saveOutline,
      syncOutline,
      backUrl,
      studentCodeInput,
      activeGroup,
      isSubmitting,
      // New exports for sections
      numberOfSections,
      currentSection,
      questionsForCurrentSection,
      startScan,
      onScanComplete,
      onScanCancelled,
      findStudentByCode,
      submitAnswers,
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