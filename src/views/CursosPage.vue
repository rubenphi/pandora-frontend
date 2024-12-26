<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Cursos</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Cursos</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-list>
        <ion-item v-for="curso in cursosUsuario" :key="curso.id">
          <ion-icon slot="start" :icon="peopleCircleOutline"></ion-icon>
          <ion-label>{{ curso.name }}</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>
<script>
import { peopleCircleOutline } from "ionicons/icons";

import { ref } from "vue";
import { tokenHeader, usuarioGet } from "../globalService";
import {
  onIonViewWillEnter,
  IonLabel,
  IonItem,
  IonIcon,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/vue";
export default {
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
  },
  setup() {
    const usuario = ref();
    const cursosUsuario = ref(
      JSON.parse(localStorage.getItem("cursosUsuario"))
    );
    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      tokenHeader();
    });
    return {
      usuario,
      peopleCircleOutline,
      cursosUsuario,
    };
  },
};
</script>
