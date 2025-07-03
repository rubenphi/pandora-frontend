<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button v-if="isAdminOrProfessor" @click="editMaterial()">
          Editar
        </ion-button>
      </ion-buttons>
      <ion-title class="ion-text-center">{{ material.title }}</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="dismissModal()">Cerrar</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <div v-if="material.type === MaterialType.VIDEO">
      <video controls :src="material.url" style="width: 100%"></video>
    </div>
    <div v-else-if="material.type === MaterialType.IMAGE">
      <img :src="material.url" style="width: 100%" />
      <ion-button expand="full" @click="openInNewTab(material.url)"
        >Abrir en nueva pestaña</ion-button
      >
    </div>
    <div v-else-if="material.type === MaterialType.AUDIO">
      <audio controls :src="material.url" style="width: 100%"></audio>
    </div>
    <div v-else-if="material.type === MaterialType.TEXT_RICH || material.type === MaterialType.TEXT_SHORT">
      <p v-html="material.content"></p>
    </div>
    <div v-else>
      <p>Tipo de material no soportado para visualización en modal.</p>
      <ion-button expand="full" @click="openInNewTab(material.url)"
        >Abrir en nueva pestaña</ion-button
      >
    </div>
  </ion-content>
</template>

<script>
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  modalController,
} from "@ionic/vue";
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { adminOprofesor } from "../globalService";

const MaterialType = {
  VIDEO: "VIDEO",
  PDF: "PDF",
  IMAGE: "IMAGE",
  AUDIO: "AUDIO",
  DOC: "DOC",
  TEXT_RICH: "TEXT_RICH",
  TEXT_SHORT: "TEXT_SHORT",
};

export default defineComponent({
  name: "MaterialModal",
  props: {
    material: Object,
  },
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
  },
  setup(props) {
    const router = useRouter();
    const isAdminOrProfessor = adminOprofesor();

    const dismissModal = () => {
      modalController.dismiss();
    };

    const openInNewTab = (url) => {
      window.open(url, "_blank");
    };

    const editMaterial = () => {
      dismissModal(); // Close the modal first
      router.push(`/crear/material/${props.material.lesson.id}/${props.material.id}`);
    };

    return {
      dismissModal,
      openInNewTab,
      MaterialType,
      isAdminOrProfessor,
      editMaterial,
    };
  },
});
</script>
