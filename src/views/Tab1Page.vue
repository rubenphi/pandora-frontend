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
          <ion-label>{{miembro.nombre}}</ion-label>
        </ion-item>
        
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import { personOutline } from "ionicons/icons";
// import axios from "axios";
import { ref } from "vue";
import { tokenHeader , usuarioGet } from "../globalService";

import {
  IonLabel,
  IonItem,
  IonIcon,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  onIonViewWillEnter
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
    const miembros  = ref([
      {id: 1, nombre:'Felipito'},
      {id: 2, nombre:'Susanita'},
      {id: 3, nombre:'Mafalda'},
      {id: 4, nombre:'Guille'}
    ])

   // const mayus = ref({});
    let usuario = usuarioGet();
  //  const cuestionarios = ref([]);
    onIonViewWillEnter(() => {
      tokenHeader();
      console.log(usuario.grupo_id)
    });
    return {
      usuario,
      personOutline,
      miembros
    };
  },
};
</script>
