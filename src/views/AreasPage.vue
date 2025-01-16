<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Areas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Areas</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-list>
        <ion-item>
          <ion-label slot="start" v-if="!adminOProfesor"
            ><strong>Periodo:</strong></ion-label
          >
          <ion-select
            v-if="adminOProfesor"
            slot="start"
            v-model="yearSelected"
            placeholder="Selecciona un año"
          >
            <ion-select-option v-for="year in years" :key="year" :value="year">
              <strong>Año: </strong> {{ year }}
            </ion-select-option>
          </ion-select>

          <ion-select
            slot="end"
            v-model="periodoSelected"
            placeholder="Selecciona un periodo"
            @ionChange="changePeriodo($event)"
          >
            <ion-select-option
              v-for="periodo in periodos"
              :key="periodo.id"
              :value="periodo.id"
            >
              {{ periodo.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item
          v-for="area in areas"
          :key="area.id"
          @click="navigateToCuestionario(area.id)"
        >
          <ion-icon slot="start" :icon="libraryOutline"></ion-icon>
          <ion-label>{{ area.name }}</ion-label>
        </ion-item>
      </ion-list>
      <ion-toast
        :is-open="isOpen"
        position="middle"
        message="Por favor, seleccione un periodo antes de continuar."
        :duration="3000"
        @didDismiss="setOpen(false)"
      >
        <ion-icon slot="start" :icon="alertCircleOutline"></ion-icon>
      </ion-toast>
    </ion-content>
  </ion-page>
</template>
<script>
import { libraryOutline, alertCircleOutline } from "ionicons/icons";
import axios from "axios";
import router from "../router";
import { ref } from "vue";
import { useRoute } from "vue-router";

import {
  tokenHeader,
  usuarioGet,
  periodosGet,
  adminOprofesor,
} from "../globalService";
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
  IonSelect,
  IonSelectOption,
  IonToast,
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
    IonSelect,
    IonSelectOption,
    IonToast,
  },
  setup() {
    const mroute = useRoute();
    const adminOProfesor = ref();
    const { id } = mroute.params;
    const usuario = ref();
    const areas = ref([]);
    const isOpen = ref(false);
    const setOpen = (state) => {
      isOpen.value = state;
    };

    const presentToast = async () => {
      isOpen.value = true;
    };

    const periodos = ref();

    const periodoSelected = ref();

    const years = ref([]);
    const yearSelected = ref();

    onIonViewWillEnter(async () => {
      adminOProfesor.value = adminOprofesor();
      periodos.value = periodosGet();
      periodoSelected.value = JSON.parse(
        localStorage.getItem("periodoSelected")
      );
      //las 10 years
      years.value = new Array(10)
        .fill(0)
        .map((_, i) => new Date().getFullYear() - i);
      yearSelected.value = localStorage.getItem("year");
      usuario.value = usuarioGet();
      tokenHeader();
      if (usuario.value.rol === "student" || usuario.value.rol === "user") {
        const year = localStorage.getItem("year");
        const courseSelected = JSON.parse(
          localStorage.getItem("cursosUsuario")
        ).find((course) => course.year == year);
        localStorage.setItem("courseSelected", JSON.stringify(courseSelected));
      }

      await axios.get(`/courses/${id}/areas`).then((response) => {
        areas.value = response.data;
      });
    });
    return {
      changePeriodo: (event) => {
        localStorage.setItem(
          "periodoSelected",
          JSON.stringify(event.detail.value)
        );
      },
      navigateToCuestionario: (areaId) => {
        if (!periodoSelected.value) {
          presentToast();
          return;
        }
        router.push(
          `/cuestionarios/${id}/${areaId}/${periodoSelected.value}/${yearSelected.value}`
        );
      },
      usuario,
      adminOProfesor,
      libraryOutline,
      areas,
      id,
      periodos,
      periodoSelected,
      alertCircleOutline,
      isOpen,
      setOpen,
      presentToast,
      years,
      yearSelected,
    };
  },
};
</script>
