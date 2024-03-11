<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Areas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Areas</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-list>
        <ion-item v-for="area in areas" :key="area.id" :href="'cuestionarios/' + id + '/' + area.id" >
          <ion-icon slot="start" :icon="libraryOutline"></ion-icon>
          <ion-label>{{area.name}}</ion-label>
        </ion-item>
        
      </ion-list>
    </ion-content>
  </ion-page>
</template>
<script>
import { libraryOutline } from "ionicons/icons";
import axios from "axios";
import { ref } from "vue";
import { useRoute } from "vue-router";

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
    const mroute = useRoute();
    const { id } = mroute.params;
    let usuario = usuarioGet();
    const areas = ref([]);
    onIonViewWillEnter(async () => {
      tokenHeader();
      if (usuario.rol === 'student' || usuario.rol === 'user') {
        const year = localStorage.getItem('year');
        const courseSelected = JSON.parse(localStorage.getItem('cursosUsuario')).find((course) => course.year ==  year);
        localStorage.setItem('courseSelected', JSON.stringify(courseSelected));
        
      }
     await  axios.get(`/courses/${id}/areas`).then((response) => {
        areas.value = response.data;
      });
    });
    return {
      usuario,
      libraryOutline,
      areas,
      id
    };
  
  },
};
</script>