<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Panel</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item :href="'admin/cuestionarios'">
          <ion-icon slot="start" :icon="peopleCircleOutline"></ion-icon>
          <ion-label>Cuestionarios</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref } from "vue";
import { tokenHeader, usuarioGet } from "../globalService";

import { peopleCircleOutline } from "ionicons/icons";

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
    IonLabel,
    IonItem,
    IonList,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonIcon,
  },
  methods: {
    courseSelected: function (course) {
      localStorage.setItem("courseSelected", JSON.stringify(course));
    },
  },
  setup() {
    let usuario = usuarioGet();

    const cursos = ref([]);
    onIonViewWillEnter(async () => {
      tokenHeader();
      cursos.value = JSON.parse(localStorage.getItem("cursosUsuario"));
    });

    return {
      peopleCircleOutline,
      usuario,
      cursos,
    };
  },
};
</script>
