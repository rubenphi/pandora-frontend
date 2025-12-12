<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-padding ion-text-center">
      <div class="onboarding-container">
        <h1>Debe vincular la aplicación al sistema</h1>
        <p>Para eso debe escanear el QR generado.</p>

        <ion-button expand="block" @click="scanQr">Escanear QR</ion-button>
        <ion-button
          expand="block"
          fill="outline"
          color="danger"
          @click="cancelAndExit"
          >Cancelar</ion-button
        >
      </div>
    </ion-content>

    <!-- Modal para mostrar el resultado del QR -->
    <ion-modal :is-open="isModalOpen" @didDismiss="closeModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Resultado del QR</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div class="modal-content">
          <ion-icon
            :icon="checkmarkCircleOutline"
            color="success"
            size="large"
          ></ion-icon>
          <h2>QR Escaneado exitosamente</h2>
          <p class="qr-content">{{ qrContent }}</p>
          <ion-button expand="block" @click="closeModal">Aceptar</ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonButton,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonIcon,
  alertController,
} from "@ionic/vue";
import { App } from "@capacitor/app";
import { Device } from "@capacitor/device";
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";
import { checkmarkCircleOutline } from "ionicons/icons";
import { initializeBaseUrl, isStrictHttpIp } from "../globalService";
import axios from "axios"; // Import axios

export default {
  name: "QrScannerOnboarding",
  components: {
    IonPage,
    IonContent,
    IonButton,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonIcon,
  },
  data() {
    return {
      isModalOpen: false,
      qrContent: "",
      checkmarkCircleOutline,
    };
  },
  methods: {
    async scanQr() {
      try {
        const result = await CapacitorBarcodeScanner.scanBarcode({
          hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
          scanInstructions: "Escanee el código QR",
          scanButton: false,
        });

        if (result.ScanResult) {
          this.qrContent = result.ScanResult;
          this.isModalOpen = true;
        }
      } catch (error) {
        const alert = await alertController.create({
          header: "Error",
          message:
            error instanceof Error
              ? error.message
              : "Ocurrió un error al escanear el QR. Por favor, intente nuevamente.",
          buttons: ["OK"],
        });
        await alert.present();
      }
    },
    // --- vvv MODIFIED METHOD vvv ---
    async closeModal() {
      this.isModalOpen = false;
      if (this.qrContent) {
        if (isStrictHttpIp(this.qrContent)) {
          const ipAddress = this.qrContent
            .replace("http://", "")
            .replace("/", "")
            .split(":")[0];

          const backendUrl = `${ipAddress}:3000/`;

          initializeBaseUrl(backendUrl); // Use the new service function

          await axios
            .get("/auth/server-ip", { timeout: 3000 })
            .then(() => {
              this.$router.replace("/login");
            })
            .catch(async () => {
              const alert = await alertController.create({
                header: "Error de conexión",
                message:
                  "No se pudo conectar al servidor. Asegúrese de que el dispositivo esté en la misma red que el servidor y el programa esté corriendo",
                buttons: ["OK"],
              });
              await alert.present();
            });
        } else {
          const alert = await alertController.create({
            header: "Error de formato",
            message:
              'El formato del código QR no es válido. Debe ser una IP con formato "http://192.168.1.100:8100".',
            buttons: ["OK"],
          });
          await alert.present();
          return;
        }
      }
    },
    // --- ^^^ MODIFIED METHOD ^^^ ---
    async cancelAndExit() {
      const info = await Device.getInfo();
      if (info.platform !== "web") {
        App.exitApp();
      } else {
        this.$router.replace("/login");
      }
    },
  },
};
</script>

<style scoped>
.onboarding-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  max-width: 400px;
  margin: 0 auto;
}

h1 {
  font-size: 1.8em;
  margin-bottom: 10px;
}

p {
  font-size: 1.1em;
  margin-bottom: 30px;
  color: #666;
}

ion-button {
  margin-top: 15px;
  height: 48px;
  font-size: 1.1em;
}

.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
}

.modal-content ion-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.modal-content h2 {
  margin-bottom: 20px;
  color: #333;
}

.qr-content {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  word-break: break-all;
  margin-bottom: 30px;
  font-family: monospace;
  font-size: 0.95em;
  max-width: 100%;
}
</style>
