<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button href="/admin/panel">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Configuraciones</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item>
          <ion-label>
            <h2>Vista Administrador</h2>
            <p>Ver todos los cursos y áreas del instituto</p>
          </ion-label>
          <ion-toggle slot="end" v-model="adminView" @ionChange="toggleAdminView"></ion-toggle>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, onMounted } from "vue";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonButtons,
  IonButton,
  IonIcon,
} from "@ionic/vue";
import { arrowBackOutline } from "ionicons/icons";

export default {
  name: "ConfiguracionesPage",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonButtons,
    IonButton,
    IonIcon,
  },
  setup() {
    const adminView = ref(false);

    onMounted(() => {
      const stored = localStorage.getItem("adminView");
      adminView.value = stored === "true";
    });

    const toggleAdminView = (event) => {
      localStorage.setItem("adminView", event.detail.checked);
    };

    return {
      adminView,
      toggleAdminView,
      arrowBackOutline,
    };
  },
};
</script>
