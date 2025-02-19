<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button :href="'/admin/panel'">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="actualizarUsuario">
            <ion-icon :icon="checkmarkOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Actualizar Usuario</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item>
          <ion-label position="stacked">Nombre</ion-label>
          <ion-input
            v-model="formData.name"
            placeholder="Nombre del usuario"
            clear-input
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Apellido</ion-label>
          <ion-input
            v-model="formData.lastName"
            placeholder="Apellido del usuario"
            clear-input
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Correo electrónico</ion-label>
          <ion-input
            v-model="formData.email"
            type="email"
            placeholder="Correo electrónico"
            clear-input
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Código</ion-label>
          <ion-input
            v-model="formData.code"
            placeholder="Código único"
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
        message="Usuario actualizado correctamente"
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
import { useRoute } from "vue-router";
import axios from "axios";
import { arrowBackOutline, checkmarkOutline } from "ionicons/icons";
import { ref } from "vue";
import { tokenHeader } from "../globalService";

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
    const route = useRoute();
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
      route,
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
      },
    };
  },
  methods: {
    async loadUserData() {
      try {
        const response = await axios.get(
          `/users/${this.route.params.id}`,
          tokenHeader()
        );
        const userData = response.data;

        this.formData = {
          name: userData.name,
          lastName: userData.lastName,
          email: userData.email,
          code: userData.code,
          password: "", // Password siempre vacío inicialmente
        };
      } catch (error) {
        this.errorMessage = "Error al cargar los datos del usuario";
        this.isErrorToastOpen = true;
      }
    },

    async actualizarUsuario() {
      try {
        const submitData = { ...this.formData };

        // Eliminar password si está vacío
        if (!submitData.password) {
          delete submitData.password;
        }

        await axios.patch(
          `/users/${this.route.params.id}`,
          submitData,
          tokenHeader()
        );

        this.isSuccessToastOpen = true;
        setTimeout(() => {
          this.$router.push("/admin/panel");
        }, 1500);
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "Error al actualizar el usuario";
        this.isErrorToastOpen = true;
      }
    },
  },
  mounted() {
    this.loadUserData();
  },
};
</script>
