<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Escáner QR Múltiple</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div class="content-wrapper ion-padding">
        <div class="info-section">
          <h2>Códigos Escaneados: {{ scannedCodes.length }}</h2>
          <p v-if="scannedCodes.length === 0" class="empty-message">
            No hay códigos escaneados aún. Presione "Escanear QR" para comenzar.
          </p>
        </div>

        <ion-list>
          <ion-item v-for="(code, index) in scannedCodes" :key="index">
            <ion-label class="ion-text-wrap">
              <p class="code-number">Código #{{ index + 1 }}</p>
              <h3>{{ code }}</h3>
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
          <ion-button expand="block" @click="scanQR" :disabled="isScanning">
            {{ isScanning ? "Escaneando..." : "Escanear QR" }}
          </ion-button>
          <ion-button
            v-if="scannedCodes.length > 0"
            expand="block"
            fill="outline"
            color="warning"
            @click="clearCodes"
            :disabled="isScanning"
          >
            Limpiar Todo ({{ scannedCodes.length }})
          </ion-button>
          <ion-button
            expand="block"
            fill="outline"
            color="danger"
            @click="cancelAndExit"
            :disabled="isScanning"
          >
            Salir
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
} from "@ionic/vue";
import { App } from "@capacitor/app";
import { Device } from "@capacitor/device";
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";
import { trashOutline } from "ionicons/icons";

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
  },
  data() {
    return {
      scannedCodes: [],
      isScanning: false,
      showToast: false,
      toastMessage: "",
      trashOutline,
      lastScan: null,
      scannerResult: null,
      scanFormat: null,
      questionId: null, // Now questionId
      question: null, // To store fetched question details
      lessonQuizType: "individual", // To store quizType from lesson/quiz
      student: { name: "", lastName: "" },
      activeGroup: { name: "" },
      qrCount: 0, // Counter for valid QR codes
    };
  },
  mounted() {
    this.questionId = this.$route.params.d;
    this.fetchQuestionDetails();
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
      this.student = { name: "", lastName: "" };
      this.activeGroup = { name: "" };

      if (!studentCode) return;

      try {
        tokenHeader();
        const studentResponse = await axios.get(`/users?code=${studentCode}`);
        if (studentResponse.data.length > 0) {
          this.student = studentResponse.data[0];

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
        }
      } catch (error) {
        console.error("Error fetching student or group data:", error);
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
          currentScanInstructions = `Último QR leído: ${this.lastScan}. Total escaneados: ${this.qrCount}. Escanee el siguiente código`;
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

        if (result.ScanResult) {
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

          let formattedLastScan = "";
          if (this.lessonQuizType === "individual") {
            formattedLastScan = `${this.student.name} ${this.student.lastName}: ${opcion}`;
          } else if (this.lessonQuizType === "group" && this.activeGroup.name) {
            formattedLastScan = `${this.activeGroup.name}: ${opcion}`;
          } else {
            formattedLastScan = `${codigoEstudiante}: ${opcion}`; // Fallback if group name not found or type unknown
          }

          this.lastScan = formattedLastScan; // Update lastScan with the formatted string
          this.scannerResult = result.ScanResult;
          this.scanFormat = result.scanFormat; // Corrected from result.ScanFormat

          // Verificar si el código ya existe
          const codeExists = this.scannedCodes.includes(result.ScanResult);

          if (!codeExists) {
            // Agregar el nuevo código solo si no existe
            this.scannedCodes.unshift(result.ScanResult); // Keep raw result for the list
            this.qrCount++; // Increment QR count only for valid, new codes

            // Mostrar toast de éxito
            this.toastMessage = `✓ Código #${this.scannedCodes.length} escaneado`;
            this.showToast = true;
          }
          // Always restart the scanner after processing, without alerts for success/duplicate
          setTimeout(() => this.scanQR(), 300);
        }
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

    removeCode(index) {
      this.scannedCodes.splice(index, 1);
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
            },
          },
        ],
      });
      await alert.present();
    },

    async cancelAndExit() {
      const info = await Device.getInfo();
      if (info.platform !== "web") {
        App.exitApp();
      } else {
        console.log("Running in web, cannot exit app.");
        this.$router.replace("/login");
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
