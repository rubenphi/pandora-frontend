<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :router-link="backUrl">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Escáner de respuestas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div class="content-wrapper ion-padding">
        <div class="info-section">
          <h2>Respuestas escaneadas: {{ scannedCodes.length }}</h2>
          <p v-if="scannedCodes.length === 0" class="empty-message">
            No hay respuestas escaneadas aún. Presione "Escanear QR" para
            comenzar.
          </p>
        </div>

        <ion-list>
          <ion-item v-for="(code, index) in scannedCodes" :key="index">
            <ion-label class="ion-text-wrap">
              <p class="code-number">Respuesta #{{ index + 1 }}</p>
              <h3 v-if="code.lessonQuizType === 'individual'">
                {{ code.user.name }} {{ code.user.lastName }}:
                {{ code.optionSelected.identifier }}
              </h3>
              <h3 v-else-if="code.lessonQuizType === 'group'">
                {{ code.group.name }}: {{ code.optionSelected.identifier }}
              </h3>
              <h3 v-else>
                {{ code.user.name }} {{ code.user.lastName }} (Individual):
                {{ code.optionSelected.identifier }}
              </h3>
            </ion-label>
            <ion-button
              slot="end"
              fill="clear"
              color="danger"
              @click="removeCode(index)"
            >
              <ion-icon :icon="trashOutline"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <div class="ion-padding">
          <ion-button expand="block" @click="scanQR">
            {{ isScanning ? "Escaneando..." : "Escanear QR" }}
          </ion-button>
          <ion-button
            v-if="scannedCodes.length > 0"
            expand="block"
            fill="outline"
            color="danger"
            @click="clearCodes"
          >
            Limpiar Todo ({{ scannedCodes.length }})
          </ion-button>
          <ion-button
            expand="block"
            fill="outline"
            color="success"
            @click="submitAnswersBulk"
            :disabled="scannedCodes.length === 0"
          >
            Guardar Respuestas
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>

    <!-- Toast para mostrar código recién escaneado -->
    <ion-toast
      :is-open="showToast"
      :message="toastMessage"
      :duration="2000"
      position="top"
      color="success"
      @didDismiss="showToast = false"
    ></ion-toast>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  alertController,
  IonFooter,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonToast,
  IonButtons, // Added IonButtons
} from "@ionic/vue";

import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";
import { trashOutline, arrowBackOutline } from "ionicons/icons"; // Added arrowBackOutline

import axios from "axios";
import { tokenHeader } from "../globalService";

export default {
  name: "QrScannerMultiple",
  components: {
    IonPage,
    IonContent,
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonFooter,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonToast,
    IonButtons, // Added IonButtons
  },
  data() {
    return {
      scannedCodes: [], // Array of { user: {id, name, lastName}, group: {id, name}, optionSelected: { identifier } }
      isScanning: false,
      showToast: false,
      toastMessage: "",
      trashOutline,
      arrowBackOutline, // Added arrowBackOutline to data
      lastScan: null,
      scannerResult: null,
      scanFormat: null,
      questionId: null,
      question: null,
      lessonQuizType: "individual",
      student: { id: null, name: "", lastName: "" }, // Initialize student with id
      activeGroup: { id: null, name: "" }, // Initialize activeGroup with id
      qrCount: 0,
      isSubmitting: false, // Added isSubmitting
      mutationObserver: null, // To store the MutationObserver instance
    };
  },
  computed: {
    backUrl() {
      return `/resultado/${this.questionId}`;
    },
  },
  mounted() {
    this.questionId = this.$route.params.d;
    this.fetchQuestionDetails();

    // Create a MutationObserver to watch for the close button being added to the DOM
    this.mutationObserver = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const closeButton = document.querySelector('.scanner-dialog-inner .close-button');
          if (closeButton) {
            closeButton.addEventListener('click', this.handleNativeCloseButtonClick);
            this.mutationObserver.disconnect(); // Stop observing once found
            break;
          }
        }
      }
    });

    // Start observing the document body for child list changes
    this.mutationObserver.observe(document.body, { childList: true, subtree: true });
  },

  beforeUnmount() {
    // Ensure scanning state is reset when component is unmounted
    this.isScanning = false;
    // Attempt to stop the scanner explicitly, especially for web
    if (
      typeof CapacitorBarcodeScanner !== "undefined" &&
      CapacitorBarcodeScanner.stopScan
    ) {
      CapacitorBarcodeScanner.stopScan().catch((e) =>
        console.error("Error stopping barcode scanner:", e)
      );
    }

    // Disconnect the MutationObserver
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    // Also ensure the event listener is removed if it was attached
    const closeButton = document.querySelector('.scanner-dialog-inner .close-button');
    if (closeButton) {
      closeButton.removeEventListener('click', this.handleNativeCloseButtonClick);
    }
  },
  methods: {
    async fetchQuestionDetails() {
      try {
        tokenHeader();
        const response = await axios.get(`/questions/${this.questionId}`);
        this.question = response.data;
        // Assuming quizType is nested under lesson or quiz within the question object
        this.lessonQuizType =
          this.question.lesson?.quizType ||
          this.question.quiz?.quizType ||
          "individual";
      } catch (error) {
        console.error("Error fetching question details:", error);
        const alert = await alertController.create({
          header: "Error",
          message: "No se pudo cargar los detalles de la pregunta.",
          buttons: ["OK"],
        });
        await alert.present();
      }
    },
    async fetchStudentAndGroup(studentCode) {
      this.student = { id: null, name: "", lastName: "" };
      this.activeGroup = { id: null, name: "" };

      if (!studentCode) return;

      try {
        tokenHeader();
        const studentResponse = await axios.get(`/users?code=${studentCode}`);
        if (studentResponse.data.length > 0) {
          const foundStudent = studentResponse.data[0];
          
          // --- Validation Start ---
          try {
            const coursesResponse = await axios.get(
              `/users/${foundStudent.id}/courses`
            );
            const studentCourses = coursesResponse.data;
            const activeUserCourse = studentCourses.find((uc) => uc.active);

            // Determine the courseId from the question
            // The structure might vary, so we check multiple paths
            const questionCourseId = 
              this.question.lesson?.course?.id || 
              this.question.quiz?.lesson?.course?.id ||
              this.question.course?.id;

            if (questionCourseId) {
               if (
                !activeUserCourse ||
                activeUserCourse.course.id !== questionCourseId
              ) {
                const alert = await alertController.create({
                  header: "Estudiante no Autorizado",
                  message: `El estudiante ${foundStudent.name} ${foundStudent.lastName} no pertenece al curso activo de esta pregunta.`,
                  buttons: ["OK"],
                });
                await alert.present();
                return; // Stop processing this student
              }
            } else {
               console.warn("Could not determine courseId from question details. Skipping course validation.");
            }
           
          } catch (error) {
             console.error("Error validating student course:", error);
             // We allow to proceed if validation fails due to network/server error? 
             // Or we block? OmrRead blocks. Let's block to be safe and consistent.
              const alert = await alertController.create({
                header: "Error de Verificación",
                message:
                  "No se pudo verificar la inscripción del estudiante al curso. Por favor, inténtelo de nuevo.",
                buttons: ["OK"],
              });
              await alert.present();
              return;
          }
           // --- Validation End ---

          this.student = foundStudent;

          if (this.lessonQuizType === "group" && this.student.id) {
            const groupsResponse = await axios.get(
              `/users/${this.student.id}/groups?active=true`
            );
            const activeUserToGroup = groupsResponse.data.find((g) => g.active);
            if (activeUserToGroup) {
              this.activeGroup = activeUserToGroup.group;
            }
          }
        } else {
          console.warn(`Student with code ${studentCode} not found.`);
          this.student = { id: null, name: "", lastName: "" }; // Ensure id is null if not found
          
           const alert = await alertController.create({
            header: "Estudiante no encontrado",
            message: `No se encontró ningún estudiante con el código "${studentCode}".`,
            buttons: ["OK"],
          });
          await alert.present();
        }
      } catch (error) {
        console.error("Error fetching student or group data:", error);
        this.student = { id: null, name: "", lastName: "" }; // Ensure id is null on error
        this.activeGroup = { id: null, name: "" }; // Ensure id is null on error
        const alert = await alertController.create({
          header: "Error",
          message: "No se pudo cargar los datos del estudiante o grupo.",
          buttons: ["OK"],
        });
        await alert.present();
      }
    },
    async scanQR() {
      if (this.isScanning) return;

      try {
        this.isScanning = true;

        // Construct scanInstructions based on the *previous* lastScan and current qrCount
        let currentScanInstructions = `Escanee un código QR. Total escaneados: ${this.qrCount}`;
        if (this.lastScan) {
          currentScanInstructions = `${this.lastScan}. || Total escaneados: ${this.qrCount}.`;
        }

        const result = await CapacitorBarcodeScanner.scanBarcode({
          hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
          scanInstructions: currentScanInstructions,
          scanButton: false, // No manual close button
        });

        this.isScanning = false;

        if (result.cancelled) {
          console.log("Scanner closed by user.");
          // Do not auto-restart, effectively stopping the continuous scanning
          return;
        }

        // If not cancelled, but no ScanResult, it means the scanner closed without a scan.
        // In this case, we should also ensure isScanning is false and not auto-restart.
        if (!result.ScanResult) {
          return;
        }

        // If we reach here, it means a ScanResult was found.
        // Proceed only if a QR code was scanned
        const [codigoEstudiante, opcion] = result.ScanResult.split(":");

        if (!codigoEstudiante || !opcion) {
          const alert = await alertController.create({
            header: "Formato de QR inválido",
            message:
              "El código QR debe tener el formato 'codigoEstudiante:opcion'.",
            buttons: [
              {
                text: "OK",
                handler: () => {
                  setTimeout(() => this.scanQR(), 300); // Auto-restart after dismissing alert
                },
              },
            ],
          });
          await alert.present();
          return; // Stop further processing for invalid format
        }

        await this.fetchStudentAndGroup(codigoEstudiante);

        const scannedObject = {
          user: { ...this.student }, // Clone student object
          group: { ...this.activeGroup }, // Clone activeGroup object
          optionSelected: { identifier: opcion },
          lessonQuizType: this.lessonQuizType, // Add lessonQuizType to the scanned object
        };

        let formattedLastScan = "";
        if (this.lessonQuizType === "individual") {
          formattedLastScan = `${this.student.name} ${this.student.lastName}: ${opcion}`;
        } else if (this.lessonQuizType === "group" && this.activeGroup.name) {
          formattedLastScan = `${this.activeGroup.name}: ${opcion}`;
        } else {
          formattedLastScan = `${codigoEstudiante}: ${opcion}`; // Fallback if group name not found or type unknown
        }

        // Verificar si ya existe una respuesta para este estudiante/grupo
        let codeExists = false;
        if (scannedObject.lessonQuizType === "individual") {
          codeExists = this.scannedCodes.some(
            (item) => item.user.id === scannedObject.user.id
          );
        } else if (scannedObject.lessonQuizType === "group") {
          codeExists = this.scannedCodes.some(
            (item) => item.group.id === scannedObject.group.id
          );
        }

        if (codeExists) {
          this.toastMessage = `Ya existe una respuesta para este ${
            scannedObject.lessonQuizType === "individual"
              ? "estudiante"
              : "grupo"
          }.`;
          this.showToast = true;
          setTimeout(() => this.scanQR(), 300);
          return;
        }

        // Agregar el nuevo código
        this.scannedCodes.unshift(scannedObject); // Add the new object
        this.lastScan = formattedLastScan;
        this.qrCount++; // Increment QR count only for valid, new codes

        // Mostrar toast de éxito
        this.toastMessage = `✓ Código #${this.scannedCodes.length} escaneado`;
        this.showToast = true;
        // Always restart the scanner after processing, without alerts for success/duplicate
        setTimeout(() => this.scanQR(), 300);
      } catch (error) {
        this.isScanning = false; // Ensure scanning state is reset

        // Check for user cancellation error
        const isUserCancellation = error.code === "OS-PLUG-BARC-0006";
        if (isUserCancellation) {
          // No alert, no auto-restart for user cancellation
          return;
        }

        // For other genuine errors, show alert and auto-restart
        console.error("Error al escanear QR:", error);
        const alert = await alertController.create({
          header: "Error",
          message:
            "Ocurrió un error al escanear el QR: " + JSON.stringify(error),
          buttons: [
            {
              text: "OK",
              handler: () => {
                setTimeout(() => this.scanQR(), 300); // Auto-restart after dismissing alert
              },
            },
          ],
        });
        await alert.present();
      }
    },

    handleNativeCloseButtonClick(event) {
      if (event) event.preventDefault(); // Prevent default action if necessary

      this.isScanning = false;
      if (typeof CapacitorBarcodeScanner !== 'undefined' && CapacitorBarcodeScanner.stopScan) {
        CapacitorBarcodeScanner.stopScan().catch(e => console.error("Error stopping barcode scanner from native close button:", e));
      }
    },
    removeCode(index) {
      this.scannedCodes.splice(index, 1);
      this.qrCount--; // Decrement qrCount when a code is removed

      // Update lastScan logic
      if (this.scannedCodes.length > 0) {
        // If there are still codes, update lastScan to the most recent one (first in array)
        const latestScannedObject = this.scannedCodes[0];
        if (latestScannedObject.lessonQuizType === "individual") {
          this.lastScan = `${latestScannedObject.user.name} ${latestScannedObject.user.lastName}: ${latestScannedObject.optionSelected.identifier}`;
        } else if (latestScannedObject.lessonQuizType === "group") {
          this.lastScan = `${latestScannedObject.group.name}: ${latestScannedObject.optionSelected.identifier}`;
        } else {
          this.lastScan = `${latestScannedObject.user.name} ${latestScannedObject.user.lastName} (Individual): ${latestScannedObject.optionSelected.identifier}`;
        }
      } else {
        // If no codes left, clear lastScan
        this.lastScan = null;
      }
    },

    async clearCodes() {
      const alert = await alertController.create({
        header: "Confirmar",
        message: `¿Desea eliminar todos los ${this.scannedCodes.length} códigos escaneados?`,
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
          },
          {
            text: "Eliminar Todo",
            role: "destructive",
            handler: () => {
              this.scannedCodes = [];
              this.qrCount = 0; // Reset qrCount
              this.lastScan = null; // Reset lastScan
            },
          },
        ],
      });
      await alert.present();
    },

    async submitAnswersBulk() {
      if (this.scannedCodes.length === 0) {
        const alert = await alertController.create({
          header: "Sin respuestas",
          message: "No hay ninguna respuesta escaneada para enviar.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      this.isSubmitting = true;
      try {
        const answersPayload = await Promise.all(
          this.scannedCodes.map(async (scannedCode) => {
            // Find the optionId based on the identifier
            const option = this.question.options.find(
              (opt) => opt.identifier === scannedCode.optionSelected.identifier
            );

            if (!option) {
              throw new Error(
                `Option with identifier ${scannedCode.optionSelected.identifier} not found for question.`
              );
            }

            return {
              optionId: option.id,
              questionId: this.question.id,
              quizId: this.question.quiz?.id || this.question.lesson?.quiz?.id, // Adjust based on actual structure
              instituteId:
                this.question.institute?.id ||
                this.question.lesson?.institute?.id, // Adjust based on actual structure
              userId: scannedCode.user.id,
              groupId: scannedCode.group?.id || null,
              exist: true,
            };
          })
        );

        await axios.post("/answers/bulk", answersPayload);

        const alert = await alertController.create({
          header: "Éxito",
          message: "Las respuestas se han guardado correctamente.",
          buttons: [
            {
              text: "OK",
              handler: () => {
                this.scannedCodes = [];
                this.qrCount = 0;
                this.lastScan = null;
                this.$router.push(this.backUrl);
              },
            },
          ],
        });
        await alert.present();
      } catch (error) {
        console.error("Error al guardar respuestas en bulk:", error);
        const message =
          error.response?.data?.message ||
          "Ocurrió un error al guardar las respuestas: " +
            JSON.stringify(error);
        const alert = await alertController.create({
          header: "Error al Guardar",
          message: message,
          buttons: ["OK"],
        });
        await alert.present();
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style scoped>
.content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.info-section {
  padding: 20px 0;
  text-align: center;
}

.info-section h2 {
  font-size: 1.5em;
  margin-bottom: 10px;
  color: var(--ion-color-primary);
}

.empty-message {
  color: var(--ion-color-medium);
  font-size: 0.95em;
  padding: 0 20px;
}

.code-number {
  font-size: 0.85em;
  color: var(--ion-color-medium);
  margin-bottom: 5px;
}

ion-list {
  flex: 1;
  overflow-y: auto;
}

ion-item h3 {
  font-family: monospace;
  font-size: 0.9em;
  word-break: break-all;
}

ion-footer ion-button {
  margin-top: 5px;
  margin-bottom: 5px;
}
</style>
