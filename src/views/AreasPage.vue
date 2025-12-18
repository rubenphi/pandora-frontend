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
      <ion-item lines="none">
        <ion-label slot="start" v-if="!adminOProfesor"
          ><strong>Periodo:</strong></ion-label
        >
        <ion-select
          v-if="adminOProfesor"
          slot="start"
          v-model="yearSelected"
          @ionChange="changeYear($event)"
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
      <ion-accordion-group>
        <ion-accordion v-for="area in areas" :key="area.id" :value="area.id">
          <ion-item slot="header" color="light" @click="handleHeaderClick($event)">
            <ion-icon slot="start" :icon="libraryOutline"></ion-icon>
            <ion-label>{{ area.name }}</ion-label>
          </ion-item>
          <div slot="content">
            <ion-list>
              <ion-item button @click="navigateToTab3(area.id, LessonType.STANDARD)">
                <ion-label>Lecciones</ion-label>
              </ion-item>
              <ion-item 
                v-if="adminOProfesor || hasReinforcement(area.id)" 
                button 
                @click="navigateToTab3(area.id, LessonType.REINFORCEMENT)"
              >
                <ion-label>Refuerzos</ion-label>
              </ion-item>
              <ion-item 
                v-if="adminOProfesor || hasRemedial(area.id)" 
                button 
                @click="navigateToTab3(area.id, LessonType.REMEDIAL)"
              >
                <ion-label>Nivelaciones</ion-label>
              </ion-item>
            </ion-list>
          </div>
        </ion-accordion>
      </ion-accordion-group>
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
import { ref, watch, computed } from "vue";
import { useRoute } from "vue-router";

import {
  tokenHeader,
  usuarioGet,
  periodosGet,
  adminOprofesor,
  LessonType,
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
  IonAccordion,
  IonAccordionGroup,
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
    IonAccordion,
    IonAccordionGroup,
  },
  setup() {
    const mroute = useRoute();
    const presentToast = async () => {
      isOpen.value = true;
    };
    const setOpen = (state) => {
      isOpen.value = state;
    };
    const adminOProfesor = ref(false);
    const isStudent = computed(() => {
      return usuario.value?.rol === "student" || usuario.value?.rol === "user";
    });
    const { id } = mroute.params;
    const usuario = ref();
    const areas = ref([]);
    const isOpen = ref(false);
    const assignmentsCount = ref({}); // { areaId: { reinforcement: 0, remedial: 0 } }

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
      yearSelected.value =
        localStorage.getItem("year") ?? new Date().getFullYear();
      usuario.value = usuarioGet();
      tokenHeader();
      if (usuario.value.rol === "student" || usuario.value.rol === "user") {
        // course with te bigest year
        const courseSelected = JSON.parse(
          localStorage.getItem("cursosUsuario")
        ).sort((a, b) => b.year - a.year)[0];
        if (!yearSelected.value) {
          yearSelected.value = courseSelected.year;
          localStorage.setItem("yearSelected", yearSelected.value);
        }

        localStorage.setItem("courseSelected", JSON.stringify(courseSelected));
      }

      await axios.get(`/courses/${id}/areas`).then((response) => {
        areas.value = response.data;
      });
    });

    watch([areas, periodoSelected], () => {
      if (isStudent.value && areas.value.length > 0 && periodoSelected.value) {
        fetchStudentAssignments();
      }
    });

    const handleHeaderClick = (event) => {
      if (!periodoSelected.value) {
        event.stopPropagation();
        event.preventDefault();
        presentToast();
      }
    };

    const fetchStudentAssignments = async () => {
      try {
        const counts = await Promise.all(
          areas.value.flatMap((area) => [
            axios.get("/reinforcement/count", {
              params: {
                studentId: usuario.value.id,
                courseId: id,
                areaId: area.id,
                periodId: periodoSelected.value,
                year: yearSelected.value,
                lessonType: LessonType.REINFORCEMENT,
              },
            }),
            axios.get("/reinforcement/count", {
              params: {
                studentId: usuario.value.id,
                courseId: id,
                areaId: area.id,
                periodId: periodoSelected.value,
                year: yearSelected.value,
                lessonType: LessonType.REMEDIAL,
              },
            }),
          ])
        );

        let idx = 0;
        areas.value.forEach((area) => {
          assignmentsCount.value[area.id] = {
            reinforcement: counts[idx++].data,
            remedial: counts[idx++].data,
          };
        });
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };
    return {
      changePeriodo: (event) => {
        localStorage.setItem(
          "periodoSelected",
          JSON.stringify(event.detail.value)
        );
        periodoSelected.value = event.detail.value;
      },

      changeYear: (event) => {
        localStorage.setItem("yearSelected", event.detail.value);
        yearSelected.value = event.detail.value;
      },

      navigateToTab3: (areaId, type) => {
        if (!periodoSelected.value) {
          presentToast();
          return;
        }
        router.push(
          `/lecciones/${id}/${areaId}/${periodoSelected.value}/${yearSelected.value}/${type}`
        );
      },
      hasReinforcement: (areaId) => {
        return assignmentsCount.value[areaId]?.reinforcement > 0;
      },
      hasRemedial: (areaId) => {
        return assignmentsCount.value[areaId]?.remedial > 0;
      },
      LessonType,
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
      handleHeaderClick,
    };
  },
};
</script>
