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
          <ion-icon slot="start" :icon="helpCircleOutline"></ion-icon>
          <ion-label>Lecciones</ion-label>
        </ion-item>
        <ion-item :href="'admin/autorizaciones'">
          <ion-icon slot="start" :icon="lockOpenOutline"></ion-icon>
          <ion-label>Autorizaciones</ion-label>
        </ion-item>
        <ion-item href="/omr-read">
          <ion-icon slot="start" :icon="scanOutline"></ion-icon>
          <ion-label>Lector OMR</ion-label>
        </ion-item>

        <ion-item>
          <ion-icon slot="start" :icon="settingsOutline"></ion-icon
          ><ion-label>Configuraciones</ion-label>
        </ion-item>
        <ion-item :href="'/admin/registro/usuarios'">
          <ion-icon slot="start" :icon="personAddOutline"></ion-icon
          ><ion-label>Añadir usuario</ion-label>
        </ion-item>

        <ion-item :href="'/admin/gestionar/usuarios'">
          <ion-icon slot="start" :icon="peopleCircleOutline"></ion-icon
          ><ion-label>Gestionar usuarios</ion-label>
        </ion-item>

        <ion-item href="/admin/gestionar/areas">
          <ion-icon slot="start" :icon="layersOutline"></ion-icon>
          <ion-label>Gestionar Áreas</ion-label>
        </ion-item>

        <ion-item href="/admin/gestionar/cursos">
          <ion-icon slot="start" :icon="schoolOutline"></ion-icon>
          <ion-label>Gestionar Cursos</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref } from "vue";
import { tokenHeader, usuarioGet } from "../globalService";

import {
  helpCircleOutline,
  lockOpenOutline,
  peopleCircleOutline,
  personAddOutline,
  settingsOutline,
  scanOutline,
  layersOutline,
  schoolOutline,
} from "ionicons/icons";

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
    const usuario = ref();

    const cursos = ref([]);
    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      tokenHeader();
      cursos.value = JSON.parse(localStorage.getItem("cursosUsuario"));
    });

    return {
      lockOpenOutline,
      helpCircleOutline,
      settingsOutline,
      usuario,
      cursos,
      personAddOutline,
      peopleCircleOutline,
      scanOutline,
      layersOutline,
      schoolOutline,
    };
  },
};
</script>
