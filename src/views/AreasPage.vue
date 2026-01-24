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
        <ion-label slot="start" ><strong>Periodo:</strong></ion-label
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
          <ion-item
            slot="header"
            color="light"
            @click="handleHeaderClick($event)"
          >
            <ion-icon slot="start" :icon="libraryOutline"></ion-icon>
            <ion-label>{{ area.name }}</ion-label>
          </ion-item>
          <div slot="content">
            <ion-list>
              <ion-item
                button
                @click="navigateToTab3(area.id, LessonType.STANDARD)"
              >
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
  currentServerYear,
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
      const curServerYear = currentServerYear();
      years.value = new Array(10)
        .fill(0)
        .map((_, i) => curServerYear - i);
      const storedYear = localStorage.getItem("year");
      yearSelected.value = storedYear ? JSON.parse(storedYear) : curServerYear;

      usuario.value = usuarioGet();
      tokenHeader();

      if (usuario.value.rol === "student" || usuario.value.rol === "user") {
        const cursosUsuario = JSON.parse(localStorage.getItem("cursosUsuario")) || [];
        const sortedCourses = cursosUsuario.sort((a, b) => b.year - a.year);
        
        // Use stored year if valid for student, otherwise use most recent course year
        const storedYearValue = storedYear ? JSON.parse(storedYear) : null;
        const isValidStoredYear = sortedCourses.some(c => c.year == storedYearValue);

        if (isValidStoredYear) {
          yearSelected.value = storedYearValue;
        } else if (sortedCourses.length > 0) {
          yearSelected.value = sortedCourses[0].year;
          localStorage.setItem("year", JSON.stringify(yearSelected.value));
        }

        const courseSelected = sortedCourses.find(c => c.year == yearSelected.value) || sortedCourses[0];
        localStorage.setItem("courseSelected", JSON.stringify(courseSelected));
      }

      // Fetch all areas for the course
      const allCourseAreas = await axios.get(`/courses/${id}/areas`).then(res => res.data);
      
      // Fetch all teacher assignments for this course
      const courseAssignments = await axios.get(`/courses/${id}/areas-teachers`).then(res => res.data);

      const isAdminView = localStorage.getItem("adminView") === "true";

      if (usuario.value.rol === "admin" && isAdminView) {
        // System admin with admin view ON: sees everything active
        areas.value = allCourseAreas;
      } else if (usuario.value.rol === "teacher" || usuario.value.rol === "director" || usuario.value.rol === "coordinator" || (usuario.value.rol === "admin" && !isAdminView)) {
        // Teachers / Course directors / Admins with admin view OFF: only see their assigned areas
        areas.value = allCourseAreas.filter((area) => {
          return courseAssignments.some((assignment) => {
            return (
              assignment.active &&
              Number(assignment.area.id) === Number(area.id) &&
              Number(assignment.teacher?.id) === Number(usuario.value.id)
            );
          });
        });
      } else if (isStudent.value) {
        // Students only see areas that have at least one active teacher assignment
        areas.value = allCourseAreas.filter((area) => {
          return courseAssignments.some((assignment) => {
            return (
              assignment.active &&
              Number(assignment.area.id) === Number(area.id) &&
              assignment.teacher // Must have a teacher assigned
            );
          });
        });
      } else {
        areas.value = allCourseAreas;
      }
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
        const selectedYearValue = event.detail.value;
        localStorage.setItem("year", JSON.stringify(selectedYearValue));
        yearSelected.value = selectedYearValue;

        if (usuario.value.rol === "student" || usuario.value.rol === "user") {
          const cursosUsuario = JSON.parse(localStorage.getItem("cursosUsuario")) || [];
          const courseForYear = cursosUsuario.find(c => c.year == selectedYearValue);
          if (courseForYear) {
            localStorage.setItem("courseSelected", JSON.stringify(courseForYear));
            // Trigger a potential reload or redirect if the route depends on courseId
            if (id != courseForYear.id) {
              router.push(`/areas/${courseForYear.id}`);
            }
          }
        }
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
