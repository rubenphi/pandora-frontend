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
        <ion-item v-for="miembro in miembros" :key="miembro.id" @click="changeMayus(miembro)">
          <ion-icon slot="start" :icon="personOutline"></ion-icon>
          <ion-label>{{miembro.nombre}}</ion-label>
        </ion-item>
        
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import { personOutline } from "ionicons/icons";
import { ref } from "vue";
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

    const mayus = ref({})

    return {
      changeMayus (miembro){
          if ( miembro.id in miembros.value ) {
            console.log('Existe');
          } else {
            console.log('no existe');
          }
          mayus.value[miembro.id] =  miembro
          miembro.nombre = miembro.nombre.toUpperCase();
          console.log(mayus.value.nombre);
          console.log(miembro.nombre)
      },
      personOutline,
      miembros
    };
  },
};
</script>
