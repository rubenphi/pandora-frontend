<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Perfil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Grupo</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-card>
        <ion-card-header>
          <ion-card-title>Datos generales</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <strong>Usuario:</strong>
          {{ usuario.code }} <br />
          <strong>Email:</strong>
          {{ usuario.email }} <br />
          <strong>Nombres:</strong>
          {{ usuario.name }} <br />
          <strong>Apellidos:</strong>
          {{ usuario.lastName }} <br />
          <strong>institución:</strong>: {{ usuario.institute.name }} <br />
          <strong> Curso:</strong> {{ actualCurso.name }} <br />
        </ion-card-content>
        <ion-card>
          <ion-card-header>
            <ion-card-title>Grupo actual </ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <strong>Nombre del Grupo:</strong> {{ grupoUsuario.name }} <br />
            <strong>Integrantes:</strong>
            <ul>
              <li v-for="miembro in miembros" :key="miembro.id">
                {{ miembro.user.name + " " + miembro.user.lastName }}
              </li>
            </ul>
          </ion-card-content>
          <ion-button fill="clear" @click="presentModal" id="open-modal">
            Cambiar de grupo&nbsp;
            <ion-icon :icon="syncOutline"></ion-icon>
          </ion-button>
        </ion-card>
      </ion-card>

      <!-- establecer el tamaño del modal según el contenido without size="cover"  -->
      <ion-modal
        ref="modal"
        trigger="open-modal"
        :breakpoints="[0.3, 0.5, 1]"
        :initial-breakpoint="0.5"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="cancel()">Cancelar</ion-button>
            </ion-buttons>
            <ion-title style="text-align: center">Cambio De Grupo</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="confirm()"
                >Confirmar</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-select
              label="Seleccione el nuevo grupo"
              v-model="grupo"
              placeholder="Seleccion el nuevo grupo"
            >
              <ion-select-option
                v-for="grupo in grupos"
                :key="grupo.id"
                :value="grupo.id"
              >
                {{ grupo.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label color="medium" position="floating"
              >Código de autorización</ion-label
            >
            <ion-input
              placeholder="Código de autorización"
              v-model="code"
            ></ion-input>
          </ion-item>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>
<script>
import { personOutline, syncOutline } from "ionicons/icons";
import axios from "axios";
import { ref } from "vue";
import { tokenHeader, usuarioGet } from "../globalService";
import {
  onIonViewWillEnter,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonModal,
  IonItem,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonInput,
  IonLabel,
} from "@ionic/vue";

export default {
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonModal,
    IonItem,
    IonButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonInput,
    IonLabel,
  },

  setup() {
    let usuario = usuarioGet();
    let cursosUsuario = JSON.parse(localStorage.getItem("cursosUsuario"));
    let actualCurso = cursosUsuario.find(
      (curso) => curso.year == localStorage.getItem("year")
    );
    let year = localStorage.getItem("year");

    const grupo = ref();
    const modal = ref();
    const code = ref();

    const grupoUsuario = ref({
      name: "",
    });

    const grupos = ref([]);

    const miembros = ref([]);
    const cancel = () => modal.value.$el.dismiss(null, "cancel");

    const confirm = () => {
      /*
      {
  "groupId": 0,
  "userId": 0,
  "code": "string",
  "active": true
}
axios users/{userId}/groups  
*/
      let data = {
        groupId: grupo.value,
        userId: usuario.id,
        code: code.value,
        active: true,
      };

      axios.post(`/users/${usuario.id}/groups`, data).then(() => {
        modal.value.$el.dismiss(data, "confirm");
        //refresh page
        location.reload();
      });
    };

    onIonViewWillEnter(async () => {
      tokenHeader();

      await axios.get(`/users/${usuario.id}/groups`).then((response) => {
        grupoUsuario.value = response.data.filter((g) => g.active)[0].group;
        localStorage.setItem(
          "grupoUsuario",
          JSON.stringify(grupoUsuario.value)
        );
      });
      await axios
        .get(`/groups/${grupoUsuario.value.id}/users`)
        .then((response) => {
          miembros.value = response.data;
        });

      await axios
        .get(`/groups?courseId=${actualCurso.id}&year=${year}`)
        .then((response) => {
          grupos.value = response.data.filter((grupo) => {
            return grupo.id != grupoUsuario.value.id ?? false;
          });
        });
    });

    return {
      grupoUsuario,
      grupos,
      grupo,
      code,
      year,
      usuario,
      personOutline,
      miembros,
      modal,
      presentModal() {},
      syncOutline,
      cancel,
      confirm,
      actualCurso,
    };
  },
};
</script>
