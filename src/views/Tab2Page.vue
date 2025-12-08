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
          {{ backendURL }}
          Construí esta aplicación para trabajar en grupo de una manera más
          dinámica, espero que la clase de hoy vaya genial 😃
        </p>
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
import { basedeURL, tokenHeader } from "../globalService";
import router from "../router";
import { exitOutline } from "ionicons/icons";
import { ref } from "vue";

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
    const backendURL = ref(basedeURL());
    onIonViewWillEnter(async () => {
      tokenHeader();
    });

    return {
      backendURL,
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
