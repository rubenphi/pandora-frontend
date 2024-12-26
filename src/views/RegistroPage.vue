<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="'/login'">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="crearCuestionario">
            <ion-icon :icon="checkmarkOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Registro</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item>
          <ion-label position="stacked">Nombre</ion-label>
          <ion-input
            v-model="formData.name"
            placeholder="Escribe tu nombre"
            clear-input
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Apellido</ion-label>
          <ion-input
            v-model="formData.lastName"
            placeholder="Escribe tu apellido"
            clear-input
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Correo electrónico</ion-label>
          <ion-input
            v-model="formData.email"
            type="email"
            placeholder="Escribe tu correo electrónico"
            clear-input
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Código</ion-label>
          <ion-input
            v-model="formData.code"
            placeholder="Escribe tu código"
            clear-input
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked"
            >Invitación de la institución (number)</ion-label
          >
          <ion-input
            v-model="formData.instituteInvitation"
            placeholder="Escribe el código de invitación"
            clear-input
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Contraseña</ion-label>
          <ion-input
            v-model="formData.password"
            type="password"
            placeholder="Escribe tu contraseña"
            clear-input
          ></ion-input>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonButtons,
} from "@ionic/vue";

import axios from "axios";

import { arrowBackOutline, checkmarkOutline } from "ionicons/icons";

export default {
  components: {
    IonButton,
    IonButtons,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
  },
  data() {
    return {
      formData: {
        name: "",
        lastName: "",
        email: "",
        code: "",
        instituteInvitation: "",
        password: "",
        exist: false,
      },
    };
  },
  methods: {
    async crearCuestionario() {
      try {
        await axios.post(
          "/users", // Cambia esta URL por la ruta correcta de tu API
          this.formData,
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );

        //go to login page
      } catch (error) {
        console.error(
          "Error al registrar:",
          error.response?.data || error.message
        );
        this.$router.push("/login");
        // Aquí puedes manejar errores, como mostrar un mensaje al usuario.
      }
    },
  },

  setup() {
    return {
      arrowBackOutline,
      checkmarkOutline,
    };
  },
};
</script>
