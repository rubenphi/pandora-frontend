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
import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
import { checkmarkCircleOutline } from "ionicons/icons";

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
        // Verificar y solicitar permisos de cámara
        const status = await BarcodeScanner.checkPermission({ force: true });

        if (!status.granted) {
          const alert = await alertController.create({
            header: "Permiso denegado",
            message:
              "Es necesario otorgar permisos de cámara para escanear el QR.",
            buttons: ["OK"],
          });
          await alert.present();
          return;
        }

        // Preparar la UI para el escaneo
        document.querySelector("body").classList.add("scanner-active");
        document.querySelector("ion-app").style.background = "transparent";

        // Hacer el fondo del WebView transparente para ver la cámara
        BarcodeScanner.hideBackground();

        // Iniciar el escaneo
        const result = await BarcodeScanner.startScan();

        // Restaurar la UI
        document.querySelector("body").classList.remove("scanner-active");
        document.querySelector("ion-app").style.background = "";
        BarcodeScanner.showBackground();

        // Si el resultado tiene contenido, mostrarlo en el modal
        if (result.hasContent) {
          this.qrContent = result.content;
          this.isModalOpen = true;
        }
      } catch (error) {
        console.error("Error al escanear QR:", error);

        // Asegurarse de restaurar el estado de la UI
        document.querySelector("body")?.classList.remove("scanner-active");
        if (document.querySelector("ion-app")) {
          document.querySelector("ion-app").style.background = "";
        }
        BarcodeScanner.showBackground();

        const alert = await alertController.create({
          header: "Error",
          message:
            "Ocurrió un error al escanear el QR. Por favor, intente nuevamente.",
          buttons: ["OK"],
        });
        await alert.present();
      }
    },
    closeModal() {
      this.isModalOpen = false;
      // Aquí puedes agregar lógica adicional después de cerrar el modal
      // Por ejemplo, procesar el contenido del QR o navegar a otra página
    },
    async cancelAndExit() {
      const info = await Device.getInfo();
      if (info.platform !== "web") {
        App.exitApp();
      } else {
        console.log("Running in web, cannot exit app.");
        // Optionally, redirect to login or another page for web
        this.$router.replace("/login");
      }
    },
  },
  beforeUnmount() {
    // Limpiar al desmontar el componente
    document.body.classList.remove("scanner-active");
    BarcodeScanner.showBackground();
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

<style>
/* Estilos globales para ocultar el contenido durante el escaneo */
body.scanner-active {
  --background: transparent;
  --ion-background-color: transparent;
  background: transparent !important;
}

body.scanner-active ion-app,
body.scanner-active ion-content {
  --background: transparent;
  background: transparent !important;
}

body.scanner-active .ion-page {
  background: transparent !important;
}

/* Asegurar que el contenido esté oculto durante el escaneo */
body.scanner-active .onboarding-container {
  visibility: hidden;
}
</style>
