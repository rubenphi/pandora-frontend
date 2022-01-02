<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <a href="/login"><ion-tab-button tab="tab1" >
          <ion-icon :icon="peopleOutline" />
          <ion-label>Grupo</ion-label>
        </ion-tab-button></a>
        
          <a href="/inicio"><ion-tab-button tab="tab2" >
          <ion-icon :icon="homeOutline" />
          <ion-label>Inicio</ion-label>
        </ion-tab-button></a>
        
        <a href="/cuestionarios"><ion-tab-button tab="tab3">
          <ion-icon :icon="helpCircleOutline" />
          <ion-label>Cuestionarios</ion-label>
        </ion-tab-button></a>
        
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script>
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { helpCircleOutline ,homeOutline, peopleOutline } from 'ionicons/icons';

export default {
  components: { IonLabel, IonTabs, IonTabBar, IonTabButton, IonIcon, IonPage, IonRouterOutlet },
  setup() {
    return {
      helpCircleOutline,
      homeOutline,
      peopleOutline
    }
  }
}
</script>