<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Grupo</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Grupo</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-list>
        <ion-item v-for="miembro in miembros" :key="miembro.id" >
          <ion-icon slot="start" :icon="personOutline"></ion-icon>
          <ion-label>{{miembro.name}}</ion-label>
        </ion-item>
        
      </ion-list>
    </ion-content>
  </ion-page>
</template>
<script>
import { personOutline } from "ionicons/icons";
import axios from "axios";
import { ref } from "vue";
import { tokenHeader , usuarioGet } from "../globalService";
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
    let usuario = usuarioGet();
    const miembros = ref([]);
    onIonViewWillEnter(() => {
      tokenHeader();
      axios.get("/user/grupo/" + usuario.grupo_id).then((response) => {
        miembros.value = response.data;
        localStorage.removeItem('usuario')
      });
    });
    return {
      usuario,
      personOutline,
      miembros
    };
  
  },
};
</script>