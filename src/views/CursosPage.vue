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
            @ionChange="getCursoUsuario(selectedYear)"
          >
            <ion-select-option v-for="year in years" :key="year" :value="year">
              {{ year }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-accordion-group>
          <ion-accordion v-for="curso in cursosUsuario" :key="curso.id">
            <IonItem slot="header">
              <IonLabel>{{ curso.name }}</IonLabel>
            </IonItem>
            <div class="ion-padding" slot="content">
              <IonAccordionGroup>
                <IonAccordion v-for="area in curso.areas" :key="area.id">
                  <IonItem slot="header">
                    <IonLabel>{{ area.name }}</IonLabel>
                  </IonItem>
                  <div class="ion-padding" slot="content">
                    <IonList>
                      <IonItem
                        @click="
                          router.push(
                            `/admin/notas/${curso.id}/${area.id}/${selectedYear}`
                          )
                        "
                      >
                        <IonLabel>Notas</IonLabel>
                      </IonItem>
                      <IonItem
                        @click="
                          router.push(
                            `/admin/grupos/${curso.id}/${selectedYear}`
                          )
                        "
                      >
                        <IonLabel>Grupos</IonLabel>
                      </IonItem>
                    </IonList>
                  </div>
                </IonAccordion>
              </IonAccordionGroup>
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
import { tokenHeader, usuarioGet, selectedYear as selectedYearService, currentServerYear } from "../globalService";
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
    const currentYear = selectedYearService();
    const years = ref(
      Array.from({ length: 10 }, (_, i) => currentServerYear() - i)
    );
    const selectedYear = ref(currentYear);

    const cursosUsuario = ref([]);

    onIonViewWillEnter(async () => {
      tokenHeader();
      usuario.value = usuarioGet();

      await getCursoUsuario(selectedYear.value);
    });
    const getCursoUsuario = async (year) => {
      const response = await axios.get(
        //  /users/1/courses?year=2024'
        `/users/${usuario.value.id}/courses?year=${year}&active=true`,
        tokenHeader()
      );

      const areAAssignments = await axios
        .get(`/courses/teacher-assignments/${usuarioGet().id}`)
        .then((response) => {
          return response.data.filter(
            (assignment) => assignment.active === true
          );
        });

      cursosUsuario.value = response.data.map((curso) => ({
        id: curso.course.id,
        name: curso.course.name,
        areas:
          usuario.value.rol == "admin"
            ? curso.course.courseAreas
                .filter((a) => a.active == true)
                .map((a) => {
                  return a.area;
                })
            : areAAssignments
                .filter((assignment) => assignment.course.id == curso.course.id)
                .map((assignment) => assignment.area),
      }));

      cursosUsuario.value = cursosUsuario.value.sort((a, b) => parseInt(a.name) - parseInt(b.name));
    };
    return {
      usuario,
      router,
      cursosUsuario,
      years,
      selectedYear,
      getCursoUsuario,
    };
  },
}; //  /users/1/courses?year=2024'
</script>
