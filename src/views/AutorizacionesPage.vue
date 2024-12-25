<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Códigos</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Códigos</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Formulario para generar códigos -->
      <ion-item>
        <ion-label position="stacked">Número de Códigos</ion-label>
        <ion-input v-model="numeroDeCodigos" type="number" min="1"></ion-input>
      </ion-item>
      <ion-button expand="full" @click="generarCodigos"
        >Generar Códigos</ion-button
      >

      <ion-list>
        <ion-item v-for="codigo in codigos" :key="codigo.id">
          <ion-label>
            <h2>{{ codigo.code }}</h2>
            <p>
              Expira: {{ new Date(codigo.expirationDate).toLocaleString() }}
            </p>
            <p :style="{ color: codigo.valid ? 'green' : 'red' }">
              {{ codigo.valid ? "Activo" : "No Activo" }}
            </p>
          </ion-label>
          <ion-icon
            slot="end"
            :icon="trashOutline"
            @click="eliminarCodigo(codigo)"
            style="cursor: pointer; color: red"
          ></ion-icon>
          <ion-icon
            v-if="codigo.valid"
            slot="end"
            :icon="closeCircleOutline"
            @click="invalidarCodigo(codigo)"
            style="cursor: pointer; color: orange"
          ></ion-icon>
          <ion-icon
            v-if="!codigo.valid"
            slot="end"
            :icon="checkmarkCircleOutline"
            @click="invalidarCodigo(codigo)"
            style="cursor: pointer; color: greenyellow"
          ></ion-icon>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  trashOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import axios from "axios";
import { ref } from "vue";

import { tokenHeader } from "../globalService";
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
  IonInput,
  IonButton,
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
    IonInput,
    IonButton,
  },
  setup() {
    const codigos = ref([]);
    const numeroDeCodigos = ref(1); // Valor inicial para el número de códigos

    const cargarCodigos = async () => {
      tokenHeader();
      try {
        const response = await axios.get(`/invitations`);
        codigos.value = response.data.filter((c) => c.exist);
      } catch (error) {
        console.error("Error al cargar los códigos:", error);
      }
    };

    const eliminarCodigo = async (codigo) => {
      try {
        await axios.patch(`/invitations/${codigo.id}`, {
          expirationDate: codigo.expirationDate,
          code: codigo.code,
          instituteId: codigo.institute.id,
          exist: false,
          active: codigo.valid,
        });
        codigos.value = codigos.value.filter((c) => c.id !== codigo.id);
      } catch (error) {
        console.error("Error al eliminar el código:", error);
      }
    };

    const invalidarCodigo = async (codigo) => {
      try {
        await axios.patch(`/invitations/${codigo.id}`, {
          expirationDate: codigo.expirationDate,
          code: codigo.code,
          instituteId: codigo.institute.id,
          exist: codigo.exist,
          active: codigo.valid ? false : true,
        });
        const codigoActualizado = codigos.value.find((c) => c.id === codigo.id);
        if (codigoActualizado) {
          codigoActualizado.valid = !codigo.valid;
        }
      } catch (error) {
        console.error("Error al invalidar el código:", error);
      }
    };

    const generarCodigos = async () => {
      const hoy = new Date();
      const fechaExpiracion = new Date(hoy);
      fechaExpiracion.setDate(hoy.getDate() + 1); // Establecer la fecha de expiración al día siguiente

      const nuevosCodigos = [];
      for (let i = 0; i < numeroDeCodigos.value; i++) {
        const nuevoCodigo = {
          expirationDate: fechaExpiracion.toISOString(),
          instituteId: 1,
          exist: true,
          active: true,
        };
        nuevosCodigos.push(nuevoCodigo);

        // Aquí se pueden realizar la lógica de envío a la API para guardar los códigos
        try {
          await axios.post(`/invitations`, nuevoCodigo);
        } catch (error) {
          console.error("Error al generar el código:", error);
        }
      }

      // Actualizamos la lista de códigos después de la creación
      cargarCodigos();
    };

    onIonViewWillEnter(cargarCodigos);

    return {
      codigos,
      trashOutline,
      closeCircleOutline,
      checkmarkCircleOutline,
      eliminarCodigo,
      invalidarCodigo,
      numeroDeCodigos,
      generarCodigos,
    };
  },
};
</script>

<style scoped>
h2 {
  margin: 0;
  font-size: 1.2em;
}
p {
  margin: 0;
  font-size: 0.9em;
  color: gray;
}
</style>
