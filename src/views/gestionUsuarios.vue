<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Cursos</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Cursos</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-list>
        <ion-item>
          <ion-label><strong>Año:</strong></ion-label>
          <ion-select
            v-model="selectedYear"
            placeholder="Seleccione el año"
            @ionChange="getCurso()"
          >
            <ion-select-option v-for="year in years" :key="year" :value="year">
              {{ year }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-accordion-group @ionChange="captarAbierto($event)">
          <ion-accordion v-for="curso in cursosInstituto" :key="curso.id">
            <IonItem slot="header" @click="changeCourse(curso)">
              <IonLabel v-if="!loading || courseSelected.id != curso.id">{{
                curso.name
              }}</IonLabel>
              <IonLabel v-if="loading && courseSelected.id == curso.id">{{
                curso.name + ": ⏳ Cargando usuarios"
              }}</IonLabel>
            </IonItem>
            <div class="ion-padding" slot="content">
              <IonList>
                <IonItem v-for="usuario in usersCourse" :key="usuario.id">
                  <IonLabel
                    >{{ usuario.lastName + " " + usuario.name + " " }}
                    {{
                      usuario?.rol == "user" || usuario?.rol == "student"
                        ? "Estudiante "
                        : usuario?.rol == "admin"
                        ? "Administrador "
                        : usuario?.rol == "teacher"
                        ? "Profesor "
                        : usuario?.rol == ""
                        ? ""
                        : "Rol no identificado"
                    }}</IonLabel
                  >
                </IonItem>
              </IonList>
            </div>
          </ion-accordion>

          <ion-accordion>
            <IonItem slot="header" @click="getUsuariosSinCurso()">
              <IonLabel v-if="!loading">Sin Curso</IonLabel>
              <IonLabel v-if="loading && courseSelected.id">Sin Curso</IonLabel>
              <IonLabel v-if="loading && !courseSelected.id"
                >Sin Curso: ⏳ Cargando usuarios"</IonLabel
              >
            </IonItem>

            <div class="ion-padding" slot="content">
              <IonList>
                <IonItem v-for="usuario in usersCourse" :key="usuario.id">
                  <IonLabel
                    >{{ usuario.lastName + " " + usuario.name + " " }}
                    {{
                      usuario?.rol == "user" || usuario?.rol == "student"
                        ? "Estudiante "
                        : usuario?.rol == "admin"
                        ? "Administrador "
                        : usuario?.rol == "teacher"
                        ? "Profesor "
                        : usuario?.rol == ""
                        ? ""
                        : "Rol no identificado"
                    }}</IonLabel
                  >
                </IonItem>
              </IonList>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </ion-list>
    </ion-content>
  </ion-page>
</template>
<script>
import axios from "axios";
import router from "../router";

import { ref } from "vue";
import { tokenHeader, usuarioGet } from "../globalService";
import {
  onIonViewWillEnter,
  IonLabel,
  IonItem,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSelect,
  IonSelectOption,
  IonAccordionGroup,
  IonAccordion,
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

    IonSelect,
    IonSelectOption,
    IonAccordionGroup,
    IonAccordion,
  },
  setup() {
    const usuario = ref();
    const usersCourse = ref([]);
    const courseSelected = ref({});
    const abierto = ref(false);
    const loading = ref(false);
    const years = ref(
      Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)
    );
    const selectedYear = ref(new Date().getFullYear());
    const captarAbierto = (event) => {
      const selectedValue = event.detail.value;
      abierto.value = selectedValue !== undefined;

      if (abierto.value && courseSelected.value?.id) {
        getUsuarios(courseSelected.value.id, selectedYear.value);
      }
    };

    const getUsuarios = async (cursoId, year) => {
      loading.value = true;
      usersCourse.value = [];

      const response = await axios.get(
        `/courses/${cursoId}/users?year=${year}`,
        tokenHeader()
      );

      usersCourse.value = response.data.map((usuario) => usuario.user);
      loading.value = false;
    };

    const getUsuariosSinCurso = async () => {
      loading.value = true;
      usersCourse.value = [];
      courseSelected.value = {};

      const response = await axios.get(
        `/institutes/${usuario.value.institute.id}/usersNoCourse?year=0`,
        tokenHeader()
      );
      usersCourse.value = response.data;

      loading.value = false;
    };

    const changeCourse = (curso) => {
      courseSelected.value = curso;
    };

    const cursosInstituto = ref([]);

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      await getCurso();
      tokenHeader();
    });
    const getCurso = async () => {
      const response = await axios.get(
        `/courses?instituteId=${usuario.value.institute.id}&exist=true`,
        tokenHeader()
      );

      cursosInstituto.value = response.data.sort((a, b) => a.name - b.name);
    };
    return {
      usuario,
      abierto,
      router,
      loading,
      cursosInstituto,
      getUsuariosSinCurso,
      years,
      usersCourse,
      courseSelected,
      changeCourse,
      selectedYear,
      captarAbierto,
      getCurso,
    };
  },
}; //  /users/1/courses?year=2024'
</script>
