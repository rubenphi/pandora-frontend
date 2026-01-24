<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Selecciona el curso</ion-title>
        <ion-buttons slot="end">
          <ion-item>
            <ion-select v-model="selectedYear" interface="popover">
              <ion-select-option
                v-for="year in availableYears"
                :key="year"
                :value="year"
              >
                {{ year }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item
          v-for="curso in cursos"
          :key="curso.id"
          :href="'areas/' + curso.id"
          v-on:click="courseSelected(curso)"
        >
          <ion-icon slot="start" :icon="peopleCircleOutline"></ion-icon>
          <ion-label>{{ curso.name }}</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, watch } from "vue";
import axios from "axios";
import { tokenHeader, usuarioGet, selectedYear as selectedYearService, currentServerYear } from "../globalService";

import { peopleCircleOutline } from "ionicons/icons";

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
  IonButtons,
  IonSelect,
  IonSelectOption,
} from "@ionic/vue";

export default {
  components: {
    IonLabel,
    IonItem,
    IonList,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonIcon,
    IonButtons,
    IonSelect,
    IonSelectOption,
  },
  methods: {
    courseSelected: function (course) {
      localStorage.setItem("courseSelected", JSON.stringify(course));
    },
  },
  setup() {
    const usuario = ref();
    const cursos = ref([]);
    const selectedYear = ref();
    const availableYears = ref(
      Array.from({ length: 10 }, (_, i) => currentServerYear() - i)
    );

    const fetchCursosUsuario = async (year) => {
      if (!usuario.value?.id) return;
      try {
        const isAdminView = localStorage.getItem("adminView") === "true";
        let response;
        
        if (usuario.value.rol === "admin" && isAdminView) {
          // Fetch ALL institute courses
          response = await axios.get(
            `/courses?instituteId=${usuario.value.institute.id}&exist=true`,
            tokenHeader()
          );
          cursos.value = response.data
            .map((c) => ({
              id: c.id,
              name: c.name,
              year: year, // Assume selected year
              active: true
            }))
            .sort((a, b) => parseInt(a.name) - parseInt(b.name));
        } else {
          // Fetch only assigned courses
          response = await axios.get(
            `/users/${usuario.value.id}/courses?year=${year}&active=true`,
            tokenHeader()
          );
          cursos.value = response.data
            .map((c) => ({
              id: c.course.id,
              name: c.course.name,
              year: c.year,
              active: c.active
            }))
            .sort((a, b) => parseInt(a.name) - parseInt(b.name));
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        cursos.value = [];
      }
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      tokenHeader();

      const storedYear = JSON.parse(localStorage.getItem("year"));
      selectedYear.value = storedYear || selectedYearService();

      await fetchCursosUsuario(selectedYear.value);
    });

    watch(selectedYear, async (newYear) => {
      localStorage.setItem("year", JSON.stringify(newYear));
      await fetchCursosUsuario(newYear);
    });

    return {
      peopleCircleOutline,
      usuario,
      cursos,
      selectedYear,
      availableYears,
    };
  },
};
</script>
