<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button href="/admin/panel">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Configuraciones</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item>
          <ion-label>
            <h2>Vista Administrador</h2>
            <p>Ver todos los cursos y áreas del instituto</p>
          </ion-label>
          <ion-toggle slot="end" v-model="adminView" @ionChange="toggleAdminView"></ion-toggle>
        </ion-item>
        <ion-item v-if="adminView">
          <ion-label>
            <h2>Token de Acceso</h2>
            <p>Ver y copiar el Bearer Token actual</p>
          </ion-label>
          <ion-button slot="end" fill="outline" color="primary" @click="solicitarContrasenaToken">
            <ion-icon :icon="keyOutline" slot="start"></ion-icon>
            Mostrar Token
          </ion-button>
        </ion-item>
        <ion-item v-if="adminView">
          <ion-label>
            <h2>Documentación de la API</h2>
            <p>Consultar endpoints y modelos interactivos</p>
          </ion-label>
          <ion-button slot="end" fill="outline" color="secondary" @click="openApiDocs">
            <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
            Consultar la API
          </ion-button>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, onMounted } from "vue";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonButtons,
  IonButton,
  IonIcon,
  alertController,
  toastController,
} from "@ionic/vue";
import { arrowBackOutline, keyOutline, copyOutline, documentTextOutline } from "ionicons/icons";
import axios from "axios";
import { basedeURL } from "../globalService";

export default {
  name: "ConfiguracionesPage",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonButtons,
    IonButton,
    IonIcon,
  },
  setup() {
    const adminView = ref(false);

    onMounted(() => {
      const stored = localStorage.getItem("adminView");
      adminView.value = stored === "true";
    });

    const toggleAdminView = (event) => {
      localStorage.setItem("adminView", event.detail.checked);
    };

    const solicitarContrasenaToken = async () => {
      const alert = await alertController.create({
        header: 'Seguridad',
        message: 'Por favor, ingrese su contraseña para ver el token de acceso.',
        inputs: [
          {
            name: 'password',
            type: 'password',
            placeholder: 'Contraseña'
          }
        ],
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
          },
          {
            text: 'Verificar',
            handler: async (data) => {
              if (!data.password) return false;
              return await verificarYMostrarToken(data.password);
            }
          }
        ]
      });

      await alert.present();
    };

    const verificarYMostrarToken = async (password) => {
      try {
        const usuarioGlobal = JSON.parse(localStorage.getItem("usuario"));
        
        if (!usuarioGlobal || !usuarioGlobal.code) {
            throw new Error("No se pudo obtener el usuario actual.");
        }

        // Verify password using login endpoint
        const response = await axios.post("/auth/login", {
          code: usuarioGlobal.code,
          password: password
        });

        // If successful, show the token
        if (response.data?.userLoged?.accessToken) {
          const token = "Bearer " + response.data.userLoged.accessToken;
          mostrarTokenConCopia(token);
          return true;
        } else {
             throw new Error("Credenciales inválidas");
        }
      } catch (error) {
        let msg = "Contraseña incorrecta o error al verificar.";
        if (error.response?.status === 401) {
            msg = "Contraseña incorrecta.";
        }
        const errorAlert = await alertController.create({
          header: 'Error',
          message: msg,
          buttons: ['OK']
        });
        await errorAlert.present();
        return false;
      }
    };

    const mostrarTokenConCopia = async (token) => {
      const alert = await alertController.create({
        header: 'Token de Acceso',
        message: `<div style="word-break: break-all; max-height: 200px; overflow-y: auto; user-select: text;">${token}</div>`,
        buttons: [
          {
            text: 'Cerrar',
            role: 'cancel'
          },
          {
            text: 'Copiar al Portapapeles',
            handler: () => {
              copiarTexto(token);
              return true; 
            }
          }
        ]
      });
      await alert.present();
    };

    const copiarTexto = async (texto) => {
      let exitoso = false;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(texto);
          exitoso = true;
        } catch (err) {
          console.log("Clipboard API falló, intentando método alternativo:", err);
        }
      }

      if (!exitoso) {
        const textarea = document.createElement("textarea");
        textarea.value = texto;
        document.body.appendChild(textarea);
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.left = "0";
        textarea.style.top = "0";
        textarea.select();

        try {
          exitoso = document.execCommand("copy");
        } catch (err) {
          console.error("Error al copiar:", err);
        } finally {
          document.body.removeChild(textarea);
        }
      }

      if (exitoso) {
        const toast = await toastController.create({
          message: 'Token copiado al portapapeles',
          duration: 2000,
          color: 'success',
          position: 'bottom',
          icon: copyOutline
        });
        await toast.present();
      } else {
        const toast = await toastController.create({
          message: 'Error al copiar el token',
          duration: 2000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    };

    const openApiDocs = () => {
      const baseUrl = basedeURL() || "";
      const docsUrl = baseUrl.endsWith("/") ? `${baseUrl}api/docs/` : `${baseUrl}/api/docs/`;
      window.open(docsUrl, '_blank');
    };

    return {
      adminView,
      toggleAdminView,
      solicitarContrasenaToken,
      openApiDocs,
      arrowBackOutline,
      keyOutline,
      documentTextOutline,
    };
  },
};
</script>
