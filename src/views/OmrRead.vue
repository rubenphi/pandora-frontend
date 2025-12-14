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
              :disabled="!isSectionEnabled(section)"
              :class="{ 'section-invalid': !sectionValidity[section - 1] }"
            >
              <ion-label
                >Preguntas {{ (section - 1) * 20 + 1 }} -
                {{
                  Math.min(section * 20, cuestionario.questions.length)
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
                :color="saveButtonColor"
              >
                <ion-spinner v-if="isSubmitting" name="crescent"></ion-spinner>
                <ion-icon v-else :icon="saveOutline" slot="start"></ion-icon>
                Guardar
              </ion-button>
            </ion-col>
          </ion-row>
        </ion-grid>

        <div
          v-if="sectionScanImageUrls[currentSection - 1]"
          class="scan-result-container"
        >
          <h3>
            Imagen del Escaneo
            <span v-if="numberOfSections > 1"
              >(Sección {{ currentSection }})</span
            >
          </h3>
          <img
            :src="sectionScanImageUrls[currentSection - 1]"
            alt="Resultado del escaneo OMR"
            class="scan-result-image"
          />
        </div>

        <div
          v-if="
            !invalidSectionDetails[currentSection] &&
            (student.id || studentCodeInput)
          "
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
            <div class="ion-padding-top">
              <strong>Respuestas Correctas:</strong> <span class="ion-text-success">{{ totalCorrectAnswers }}</span>
            </div>
            <div>
              <strong>Respuestas Incorrectas:</strong> <span class="ion-text-danger">{{ totalIncorrectAnswers }}</span>
            </div>
          </div>
        </div>
        <div
          v-if="invalidSectionDetails[currentSection]"
          class="student-info-container ion-padding-top"
        >
          <ion-item lines="none">
            <ion-label style="color: var(--ion-color-danger)"
              ><strong>Código de sección no coincide</strong></ion-label
            >
          </ion-item>
          <ion-item color="light">
            <ion-label position="stacked"
              >Código escaneado (incorrecto)</ion-label
            >
            <ion-input
              :value="invalidSectionDetails[currentSection].code"
              readonly
              color="danger"
            ></ion-input>
          </ion-item>
          <div
            v-if="invalidSectionDetails[currentSection].name"
            class="ion-padding-vertical"
            style="color: var(--ion-color-danger)"
          >
            <div>
              <strong>Estudiante encontrado:</strong>
              {{ invalidSectionDetails[currentSection].name }}
              {{ invalidSectionDetails[currentSection].lastName }}
            </div>
          </div>
        </div>

        <IonList>
          <IonItem
            v-for="answer in questionsForCurrentSection"
            :key="answer.id"
            :class="{ 'answer-correct': answer.isCorrect, 'answer-incorrect': !answer.isCorrect && answer.selectedOption !== null }"
          >
            <IonLabel>{{ answer.questionTitle }} </IonLabel>
            <div class="select-with-correct-option">
              <ion-select
                v-model="answer.selectedOption"
                placeholder="Seleccione"
                interface="popover"
                :class="{ 'selected-option-correct': answer.isCorrect, 'selected-option-incorrect': !answer.isCorrect && answer.selectedOption !== null }"
              >
                <ion-select-option
                  v-for="option in answer.options"
                  :key="option.id"
                  :value="option.id"
                >
                  {{ option.identifier }}
                </ion-select-option>
              </ion-select>
              <span class="correct-option-display">
                Correcta: <span class="ion-text-success">{{ answer.correctOptionIdentifier }}</span>
              </span>
            </div>
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
import { ref, reactive, nextTick, computed } from "vue";
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
    const cuestionario = ref({ questions: [] });
    const isScanning = ref(false);
    const scannerComponent = ref(null);
    const backUrl = ref("/inicio");
    const answersToSend = ref([]);
    const student = ref({});
    const studentCodeInput = ref("");
    const activeGroup = ref(null);
    const isSubmitting = ref(false);
    const invalidSectionDetails = ref({});

    // State for sections
    const numberOfSections = ref(1);
    const currentSection = ref(1);
    const sectionScanImageUrls = ref([]);
    const sectionStudentCodes = ref([]);
    const sectionValidity = ref([]);

    const saveButtonColor = computed(() => {
      return sectionValidity.value.includes(false) ? "medium" : "secondary";
    });

    const questionsForCurrentSection = computed(() => {
      if (answersToSend.value.length === 0) return [];
      const start = (currentSection.value - 1) * 20;
      const end = currentSection.value * 20;
      return answersToSend.value.slice(start, end);
    });

    const totalCorrectAnswers = computed(() => {
      return answersToSend.value.filter(
        (answer) => answer.selectedOption !== null && answer.selectedOption === answer.correctOptionId
      ).length;
    });

    const totalIncorrectAnswers = computed(() => {
      return answersToSend.value.filter(
        (answer) => answer.selectedOption !== null && answer.selectedOption !== answer.correctOptionId
      ).length;
    });

    // Función para determinar si una sección está habilitada
    const isSectionEnabled = (sectionNumber) => {
      // La primera sección siempre está habilitada
      if (sectionNumber === 1) return true;

      // Las secciones siguientes solo se habilitan si la sección anterior tiene código escaneado
      const previousSectionIndex = sectionNumber - 2;
      return !!sectionStudentCodes.value[previousSectionIndex];
    };

    const startScan = async () => {
      const sectionIndex = currentSection.value - 1;
      const start = sectionIndex * 20;
      const end = currentSection.value * 20;

      for (let i = start; i < end && i < answersToSend.value.length; i++) {
        answersToSend.value[i].selectedOption = null;
      }
      sectionScanImageUrls.value[sectionIndex] = null;
      sectionStudentCodes.value[sectionIndex] = "";
      sectionValidity.value[sectionIndex] = true;

      isScanning.value = true;
      await nextTick();
      if (scannerComponent.value) scannerComponent.value.start();
    };

    const fetchStudentByCodeAPI = async (code) => {
      if (!code) return null;
      try {
        const response = await axios.get(`/users?code=${code}`);
        return response.data.length > 0 ? response.data[0] : null;
      } catch (error) {
        console.error("Error fetching student data:", error);
        return { error: "network" };
      }
    };

    const validateStudentCodes = async () => {
      const referenceCode = sectionStudentCodes.value[0];
      invalidSectionDetails.value = {};

      if (!referenceCode) {
        sectionValidity.value.fill(true);
        return;
      }

      if (student.value.code !== referenceCode) {
        await findStudentByCode(referenceCode, "scan");
      }

      const mismatchedSections = [];
      const promises = [];

      for (let i = 0; i < numberOfSections.value; i++) {
        const currentCode = sectionStudentCodes.value[i];
        const isValid = !currentCode || currentCode === referenceCode;
        sectionValidity.value[i] = isValid;

        if (!isValid) {
          mismatchedSections.push(i + 1);
          const p = fetchStudentByCodeAPI(currentCode).then((data) => {
            if (data?.error === "network") {
              invalidSectionDetails.value[i + 1] = {
                code: currentCode,
                name: "Error de Red",
                lastName: "",
              };
            } else if (data) {
              invalidSectionDetails.value[i + 1] = {
                code: currentCode,
                ...data,
              };
            } else {
              invalidSectionDetails.value[i + 1] = {
                code: currentCode,
                name: "No encontrado",
                lastName: "",
              };
            }
          });
          promises.push(p);
        }
      }

      await Promise.all(promises);

      if (mismatchedSections.length > 0) {
        const alert = await alertController.create({
          header: "Códigos no coinciden",
          message: `El código en la(s) sección(es) ${mismatchedSections.join(
            ", "
          )} no coincide con el de la primera sección (${referenceCode}). Por favor, vuelva a escanear las secciones incorrectas.`,
          buttons: ["OK"],
        });
        await alert.present();
      }
    };

    const findStudentByCode = async (code, context = "manual") => {
      studentCodeInput.value = code;
      if (!code) {
        student.value = {};
        activeGroup.value = null;
        return;
      }

      const foundStudent = await fetchStudentByCodeAPI(code);

      if (foundStudent?.error === "network") {
        student.value = { id: null, name: "Error de Red", lastName: "" };
        activeGroup.value = null;
        const alert = await alertController.create({
          header: "Error de Red",
          message:
            "No se pudo verificar el código del estudiante. Verifique su conexión e inténtelo de nuevo.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      if (!foundStudent) {
        student.value = { id: null, name: "No encontrado", lastName: "" };
        activeGroup.value = null;
        if (context === "scan") {
          const alert = await alertController.create({
            header: "Estudiante no encontrado",
            message: `No se encontró ningún estudiante con el código "${code}".`,
            buttons: ["OK"],
          });
          await alert.present();
        }
      } else {
        student.value = foundStudent;
        try {
          const groupsResponse = await axios.get(
            `/users/${student.value.id}/groups?active=true`
          );
          const activeUserToGroup = groupsResponse.data.find((g) => g.active);
          activeGroup.value = activeUserToGroup
            ? activeUserToGroup.group
            : null;
        } catch (error) {
          console.error("Error fetching student groups:", error);
          activeGroup.value = null;
        }
      }
    };

    const onScanComplete = async (payload) => {
      const sectionIndex = currentSection.value - 1;
      sectionScanImageUrls.value[sectionIndex] = payload.imageUrl;

      const questionsArrayBlockResults = payload.results.filter(
        (r) => r.typeOrigin === "question"
      );
      const concatedAnswers = [];
      questionsArrayBlockResults.forEach((block) => {
        concatedAnswers.push(...block.content);
      });

      const sectionOffset = sectionIndex * 20;
      concatedAnswers.forEach((scannedAnswer, index) => {
        const globalIndex = sectionOffset + index;
        if (globalIndex < answersToSend.value.length) {
          const question = answersToSend.value[globalIndex];
          const option = question.options.find(
            (opt) =>
              opt.identifier.toLowerCase() ===
              scannedAnswer.answer.toLowerCase()
          );
          if (option) question.selectedOption = option.id;
        }
      });

      const studentCode = payload.results.find(
        (r) => r.typeOrigin === "numeric"
      );
      sectionStudentCodes.value[sectionIndex] = studentCode
        ? studentCode.content
        : "";

      isScanning.value = false;
      await validateStudentCodes();
    };

    const onScanCancelled = () => {
      isScanning.value = false;
    };

    const submitAnswers = async () => {
      if (sectionValidity.value.includes(false)) {
        const alert = await alertController.create({
          header: "Error de Validación",
          message:
            "No se pueden guardar las respuestas porque hay códigos de estudiante que no coinciden. Por favor, corrija las secciones marcadas en rojo.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

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
          quizId: cuestionario.value.id,
          instituteId: cuestionario.value.instituteId,
          userId: student.value.id,
          groupId: cuestionario.value.quizType === "group" ? activeGroup.value.id : null,
          exist: true, // Assuming new answers are always 'exist: true'
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

      isSubmitting.value = true;
      try {
        await axios.post("/answers/bulk", answersPayload);
        const alert = await alertController.create({
          header: "Éxito",
          message: "Las respuestas se han guardado correctamente.",
          buttons: [
            {
              text: "OK",
              handler: () => router.push(backUrl.value),
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
        questions: response.data.questions.sort((a, b) => a.id - b.id),
        instituteId: response.data.lesson.institute.id,
      };

      numberOfSections.value = Math.ceil(
        cuestionario.value.questions.length / 20
      );

      sectionScanImageUrls.value = Array(numberOfSections.value).fill(null);
      sectionStudentCodes.value = Array(numberOfSections.value).fill("");
      sectionValidity.value = Array(numberOfSections.value).fill(true);

      answersToSend.value = cuestionario.value.questions.map((question) => {
        const correctOption = question.options.find(opt => opt.correct);
        const correctOptionId = correctOption ? correctOption.id : null;
        const correctOptionIdentifier = correctOption ? correctOption.identifier : 'N/A';

        const questionReactive = reactive({
            id: question.id,
            questionTitle: question.title,
            correctOptionId: correctOptionId,
            options: question.options.map((option) => ({
                id: option.id,
                identifier: option.identifier,
                correct: option.correct,
            })),
            selectedOption: null,
            correctOptionIdentifier: correctOptionIdentifier,
        });

        questionReactive.isCorrect = computed(() =>
            questionReactive.selectedOption !== null && questionReactive.selectedOption === questionReactive.correctOptionId
        );

        return questionReactive;
      });

      if (cuestionario.value.id) {
        backUrl.value = `/ganadores/${cuestionario.value.id}`;
      }
    });

    return {
      isScanning,
      student,
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
      numberOfSections,
      currentSection,
      questionsForCurrentSection,
      sectionScanImageUrls,
      sectionValidity,
      isSectionEnabled,
      startScan,
      onScanComplete,
      onScanCancelled,
      findStudentByCode,
      submitAnswers,
      saveButtonColor,
      invalidSectionDetails,
      totalCorrectAnswers,
      totalIncorrectAnswers,
    };
  },
};
</script>

<style scoped>
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
.section-invalid {
  --indicator-color: var(--ion-color-danger) !important;
  color: var(--ion-color-danger);
}

.select-with-correct-option {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto; /* This will push it to the right */
}

.correct-option-display {
  font-size: 0.9em;
  white-space: nowrap; /* Prevent wrapping */
}

.selected-option-correct {
  color: var(--ion-color-success);
}

.selected-option-incorrect {
  color: var(--ion-color-danger);
}
</style>
