<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Inicio</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Inicio</ion-title>
        </ion-toolbar>
      </ion-header>
         <div id="container">
    <strong>Hola, bienvenido</strong>
    <p> Construí esta aplicación para trabajar en grupo de una manera más dinámica, espero que la clase de hoy vaya genial :D </p>
  </div>

    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
export default  {
  components: { IonHeader, IonToolbar, IonTitle, IonContent, IonPage }
}
</script>
<style scoped>
#container {
  text-align: center;
  position: absolute;
  left: 0;
  right: 0;
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