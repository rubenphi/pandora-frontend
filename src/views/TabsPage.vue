<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        
<ion-tab-button  v-if="usuario.rol === 'admin' || usuario.rol === 'profesor'" tab="tab1" href="/grupo">
          <ion-icon :icon="peopleOutline" />
          <ion-label>Cursos</ion-label>
        </ion-tab-button>

        <ion-tab-button v-else tab="tab1" href="/grupo">
          <ion-icon :icon="peopleOutline" />
          <ion-label>Grupo</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/inicio">
          <ion-icon :icon="homeOutline" />
          <ion-label>Inicio</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/cuestionarios">
          <ion-icon :icon="helpCircleOutline" />
          <ion-label>Cuestionarios</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script>
import {
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonLabel,
  IonIcon,
  IonPage,
  IonRouterOutlet,
  onIonViewWillEnter
} from "@ionic/vue";

import { ref } from "vue";
import { helpCircleOutline, homeOutline, peopleOutline } from "ionicons/icons";

import { usuarioGet } from "../globalService";
export default {
  components: {
    IonLabel,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonPage,
    IonRouterOutlet,
  },
  setup() {
     const usuario = ref({
       rol: 'estudiante'
     });

     onIonViewWillEnter(() => {
       
       if(usuarioGet() != false){
         usuario.value.rol = usuarioGet().rol;
       }
    
      });

    
    return {
      usuario,
      helpCircleOutline,
      homeOutline,
      peopleOutline
    };
  },
};
</script>
