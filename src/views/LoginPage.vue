<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Inicio</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-grid>
        <ion-row>
          <ion-col size="2"> </ion-col>
          <ion-col size="8">
            <ion-card class="ion-padding">
              <ion-item>
                <ion-label position="floating">Usuario</ion-label>
                <ion-input placeholder="Código de estudiante"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="floating">Clave</ion-label>
                <ion-input placeholder="Documento de identidad"></ion-input>
              </ion-item>
              <ion-buttons class="ion-justify-content-center ion-padding-top ion-padding-bottom">
        <ion-button expand="full" fill="outline" shape="round" color="primary" class="ion-align-self-center">
          <ion-label class="ion-text-center"> Enviar Respuesta </ion-label>
        </ion-button>
      </ion-buttons>
            </ion-card>
          </ion-col>
          <ion-col size="2"> </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonItem,
  IonLabel,
  IonInput,
  IonButton
} from "@ionic/vue";
export default {
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonItem,
    IonLabel,
    IonInput,
    IonButton
  },
};
</script>
<style scoped>
#container {
  text-align: center;
  position: absolute;
  left: 10%;
  right: 10%;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;
  color: #8c8c8c;
  margin: 0;
}
</style>
