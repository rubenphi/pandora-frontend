<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Inicio</ion-title>
        <ion-buttons slot="end" class="ion-margin-end">
          <ion-button slot="end" @click="salir">
            <ion-icon :icon="exitOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <strong>Hola, bienvenido</strong>
        <p>
          Construí esta aplicación para trabajar en grupo de una manera más
          dinámica, espero que la clase de hoy vaya genial 😃.
        </p>
        <div v-if="serverIp">
          <p>
            Para acceder desde otro dispositivo (estudiantes, tablets, PC),
            conéctese a la misma red Wi-Fi o Zona Wi-Fi e ingrese a:
            <br />
            <strong style="font-size: 1.1em; color: #3880ff;">http://{{ serverIp }}:3000</strong>
            <br />
            o escanee el código QR desde el navegador o la app:
          </p>
          <div style="display: flex; justify-content: center; margin: 15px 0;">
            <canvas id="qr-code-canvas"></canvas>
          </div>
        </div>
        <ion-button href="/herramientas" align-self-center>
            <ion-icon slot="start" :icon="constructOutline"></ion-icon>
           Herramientas
          </ion-button>
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
  IonIcon,
  IonButton,
  IonButtons,
  onIonViewWillEnter,
} from "@ionic/vue";
import { ref, onMounted, watch } from "vue"; // Import watch
import { tokenHeader } from "../globalService";
import router from "../router";
import { exitOutline, constructOutline } from "ionicons/icons";
import QRCode from "qrcode";
import axios from "axios";
import { Capacitor } from "@capacitor/core";

export default {
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonIcon,
    IonButton,
    IonButtons,
  },
  setup() {
    const isNative = ref(false);
    const serverIp = ref(null);
    const frontendPort = ref(window.location.port || 80); // Get port dynamically, default to 80 if not specified

    const fetchServerIp = async () => {
      try {
        // Assuming your NestJS backend is running on port 3000
        const response = await axios.get("auth/server-ip");
        serverIp.value = response.data.ip;
      } catch (error) {
        console.error("Error fetching server IP:", error);
        serverIp.value = "Error al obtener IP";
      }
    };

    const generateQrCode = (ip) => {
      const canvas = document.getElementById("qr-code-canvas");
      if (canvas && ip && ip !== "Error al obtener IP") {
        QRCode.toCanvas(
          canvas,
          `http://${ip}:3000`,
          { width: 250, margin: 2 },
          function (error) {
            if (error) console.error("Error generating QR:", error);
          }
        );
      }
    };

    onIonViewWillEnter(async () => {
      tokenHeader();
      isNative.value = Capacitor.isNativePlatform();
      await fetchServerIp();
      if (serverIp.value) {
        setTimeout(() => {
          generateQrCode(serverIp.value);
        }, 200);
      }
    });

    onMounted(async () => {
      await fetchServerIp();
      if (serverIp.value) {
        setTimeout(() => {
          generateQrCode(serverIp.value);
        }, 200);
      }
    });

    watch(serverIp, (newIp) => {
      if (newIp && newIp !== "Error al obtener IP") {
        setTimeout(() => {
          generateQrCode(newIp);
        }, 100);
      }
    });

    return {
      serverIp,
      isNative,
      frontendPort,
      salir() {
        const periodoSelected = JSON.parse(
          localStorage.getItem("periodoSelected")
        );
        localStorage.clear();
        localStorage.setItem(
          "periodoSelected",
          JSON.stringify(periodoSelected)
        );
        // Limpiar cualquier estado relacionado con el usuario aquí

        // Limpiar datos de Tab1Page.vue

        localStorage.removeItem("miembros");
        localStorage.removeItem("notas");
        router.push("/login");
      },
      exitOutline,
      constructOutline,
    };
  },
};
</script>
<style scoped>
#container {
  text-align: center;
  position: absolute;
  left: 10%;
  right: 10%;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;
  color: #8c8c8c;
  margin: 0;
}
</style>
