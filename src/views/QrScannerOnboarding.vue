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
    };
  },
  methods: {
    async scanQR() {
      if (this.isScanning) return;

      try {
        this.isScanning = true;

        const result = await CapacitorBarcodeScanner.scanBarcode({
          hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
          scanInstructions: "Escanee un código QR",
        });

        this.isScanning = false;

        if (result.ScanResult) {
          // Verificar si el código ya existe
          const codeExists = this.scannedCodes.includes(result.ScanResult);

          if (codeExists) {
            // Mostrar alerta de código duplicado
            const alert = await alertController.create({
              header: "Código Duplicado",
              message: "Este código QR ya ha sido escaneado.",
              buttons: [
                {
                  text: "OK",
                  role: "cancel",
                },
                {
                  text: "Escanear Otro",
                  handler: () => {
                    // Escanear otro inmediatamente
                    setTimeout(() => this.scanQR(), 300);
                  },
                },
              ],
            });
            await alert.present();
          } else {
            // Agregar el nuevo código
            this.scannedCodes.unshift(result.ScanResult);

            // Mostrar toast de éxito
            this.toastMessage = `✓ Código #${this.scannedCodes.length} escaneado`;
            this.showToast = true;

            // Preguntar si quiere escanear otro
            const alert = await alertController.create({
              header: "¡Código Escaneado!",
              message: `Total de códigos: ${this.scannedCodes.length}`,
              buttons: [
                {
                  text: "Terminar",
                  role: "cancel",
                },
                {
                  text: "Escanear Otro",
                  handler: () => {
                    // Escanear otro inmediatamente
                    setTimeout(() => this.scanQR(), 300);
                  },
                },
              ],
            });
            await alert.present();
          }
        }
      } catch (error) {
        console.error("Error al escanear QR:", error);
        this.isScanning = false;

        const alert = await alertController.create({
          header: "Error",
          message: "Ocurrió un error al escanear el QR.",
          buttons: ["OK"],
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
