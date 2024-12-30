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
          <ion-label><strong>Periodo:</strong></ion-label>
          <ion-select
            v-model="periodoSelected"
            placeholder="Seleccione el periodo"
            @ionChange="actualizarNotas()"
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
        <ion-accordion-group>
          <ion-accordion
            v-for="estudiante in usuariosEstudiantes"
            :key="estudiante.id"
          >
            <IonItem
              slot="header"
              @click="filtrarNotasEstudiante(estudiante.id)"
            >
              <IonLabel>{{ estudiante.name }}</IonLabel>
            </IonItem>
            <div class="ion-padding" slot="content">
              <IonList>
                <ion-item v-for="nota in notasEstudiante" :key="nota?.id">
                  <ion-icon :icon="easelOutline" slot="start"></ion-icon>
                  <ion-label>
                    <h2>{{ nota?.lesson?.topic }}</h2>

                    <p v-if="nota?.grade < 3" style="color: #bf9494">
                      {{ nota?.grade }}
                    </p>
                    <p v-else>{{ nota?.grade }}</p>
                  </ion-label>
                </ion-item>
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
import { periodosGet, tokenHeader, usuarioGet } from "../globalService";

import {
  onIonViewWillEnter,
  IonLabel,
  IonItem,
  IonList,
  IonIcon,
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
import { useRoute } from "vue-router";
import { easelOutline } from "ionicons/icons";
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
    IonAccordionGroup,
    IonAccordion,
  },
  setup() {
    const mroute = useRoute();
    const { year } = mroute.params;
    const { cursoId } = mroute.params;
    const { areaId } = mroute.params;
    const usuario = ref();
    const periodos = ref([]);
    const periodoSelected = ref();
    const notasCurso = ref([]);
    const notasEstudiante = ref([]);

    const cursosUsuario = ref([]);

    const usuariosEstudiantes = ref([]);

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      periodos.value = periodosGet();
      periodoSelected.value = JSON.parse(
        localStorage.getItem("periodoSelected")
      );

      //rol student
      usuariosEstudiantes.value = (
        await axios.get(`/courses/${cursoId}/users?year=${year}`, tokenHeader())
      ).data
        .filter((estudiante) => estudiante.rol === "student")
        .map((estudiante) => estudiante.user);

      await getNotas(periodoSelected.value);
    });
    const getNotas = async () => {
      localStorage.setItem(
        "periodoSelected",
        JSON.stringify(periodoSelected.value)
      );

      notasCurso.value = (
        await axios.get(
          `/grades?year=${year}&courseId=${cursoId}&areaId=${areaId}&periodId=${periodoSelected.value}&instituteId=${usuario.value.institute.id}`,
          tokenHeader()
        )
      ).data;
    };
    const actualizarNotas = async () => {
      await getNotas();
      location.reload();
    };
    const filtrarNotasEstudiante = (estudianteId) => {
      notasEstudiante.value = notasCurso.value
        .filter((nota) => nota?.user?.id === estudianteId)
        .map((nota) => {
          return {
            ...nota,
            grade: nota.grade.toFixed(1),
          };
        })

        .sort((a, b) => {
          return new Date(a.lesson.date) - new Date(b.lesson.date);
        });
    };
    return {
      usuario,
      usuariosEstudiantes,
      router,
      cursosUsuario,
      periodos,
      periodoSelected,
      notasCurso,
      notasEstudiante,
      easelOutline,
      getNotas,
      actualizarNotas,
      filtrarNotasEstudiante,
    };
  },
};
</script>
