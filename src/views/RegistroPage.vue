<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button
            v-if="Number.isInteger(userLoged.id) == false"
            :href="'/login'"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
          <ion-button
            v-if="Number.isInteger(userLoged.id) == true"
            :href="'/admin/panel'"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="registrarUsuario">
            <ion-icon :icon="checkmarkOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Registro </ion-title>
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
      <ion-toast
        :is-open="isSuccessToastOpen"
        position="middle"
        message="Registro exitoso. Redirigiendo a login..."
        :duration="3000"
        @didDismiss="setSuccessToastOpen(false)"
        color="success"
      ></ion-toast>
      <ion-toast
        :is-open="isErrorToastOpen"
        position="middle"
        :message="errorMessage"
        :duration="3000"
        @didDismiss="setErrorToastOpen(false)"
        color="danger"
      ></ion-toast>
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
  IonToast,
  onIonViewWillEnter,
} from "@ionic/vue";

import axios from "axios";

import { arrowBackOutline, checkmarkOutline } from "ionicons/icons";
import { ref } from "vue";

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
    IonToast,
  },
  setup() {
    const isSuccessToastOpen = ref(false);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const userLoged = ref({});

    const setSuccessToastOpen = (state) => {
      isSuccessToastOpen.value = state;
    };

    const setErrorToastOpen = (state) => {
      isErrorToastOpen.value = state;
    };

    onIonViewWillEnter(async () => {
      userLoged.value = JSON.parse(localStorage.getItem("usuario"));
      console.log(userLoged.value.id);
    });

    return {
      arrowBackOutline,
      checkmarkOutline,
      isSuccessToastOpen,
      isErrorToastOpen,
      setSuccessToastOpen,
      setErrorToastOpen,
      errorMessage,
      userLoged,
    };
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
    async registrarUsuario() {
      try {
        await axios
          .post("/users", this.formData, {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          })
          .then(() => {
            this.isSuccessToastOpen = true;
            setTimeout(() => {
              if (this.userLoged.value.id !== undefined) {
                this.$router.push("/inicio");
              }
              this.$router.push("/login");
            }, 3000);
          });
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "Error al registrar";
        this.isErrorToastOpen = true;
      }
    },
  },
};
</script>
