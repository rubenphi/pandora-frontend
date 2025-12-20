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
import { tokenHeader, usuarioGet } from "../globalService";

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
    const availableYears = ref([]);
    const allUserCursos = ref([]);

    const filterCoursesByYear = (year) => {
      cursos.value = allUserCursos.value
        .filter((curso) => curso.year == year)
        .sort((a, b) => a.name.localeCompare(b.name));
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      tokenHeader();

      allUserCursos.value =
        JSON.parse(localStorage.getItem("cursosUsuario")).filter(
          (c) => c.active
        ) || [];
      selectedYear.value = JSON.parse(localStorage.getItem("year"));

      const years = allUserCursos.value.map((c) => c.year);
      availableYears.value = [...new Set(years)].sort((a, b) => b - a);

      filterCoursesByYear(selectedYear.value);
    });

    watch(selectedYear, (newYear) => {
      filterCoursesByYear(newYear);
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
