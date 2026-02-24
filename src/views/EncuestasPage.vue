<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="//herramientas"></ion-back-button>
        </ion-buttons>
        <ion-title>Encuestas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Encuestas en Vivo</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-item lines="none">
        <ion-select
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
            <strong>Periodo: </strong> {{ periodo.name }}
          </ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item lines="none" v-if="!isStudent">
        <ion-select
          v-model="courseSelected"
          @ionChange="changeCourse($event)"
          placeholder="Selecciona un curso"
        >
          <ion-select-option v-for="course in courses" :key="course.id" :value="course.id">
            <strong>Curso: </strong> {{ course.name }}
          </ion-select-option>
        </ion-select>
      </ion-item>

      <!-- Loading -->
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <!-- Empty state -->
      <div v-else-if="polls.length === 0" class="ion-text-center ion-padding">
        <ion-icon :icon="barChartOutline" style="font-size: 64px; color: var(--ion-color-medium)"></ion-icon>
        <p style="color: var(--ion-color-medium)">No hay encuestas disponibles para este periodo.</p>
      </div>

      <!-- Poll list -->
      <ion-list v-else>
        <ion-item
          v-for="poll in polls"
          :key="poll.id"
          button
          @click="openPoll(poll)"
          detail
        >
          <ion-label>
            <h2>{{ poll.title }}</h2>
            <p>{{ poll.question }}</p>
            <p v-if="poll.course" style="font-size: 0.85em; color: var(--ion-color-medium)">
              Curso: {{ poll.course.name }}
            </p>
          </ion-label>
          <ion-badge slot="end" :color="poll.active ? 'success' : 'medium'">
            {{ poll.active ? 'Activa' : 'Cerrada' }}
          </ion-badge>
        </ion-item>
      </ion-list>

      <!-- FAB: only for teachers/admins -->
      <ion-fab v-if="esProfesor" vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="router.push('/encuestas/crear')">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSelect,
  IonSelectOption,
  onIonViewWillEnter,
} from "@ionic/vue";
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { barChartOutline, addOutline } from "ionicons/icons";
import axios from "axios";
import { adminOprofesor, tokenHeader, usuarioGet, periodosGet, currentServerYear } from "../globalService";

export default {
  name: "EncuestasPage",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSelect,
    IonSelectOption,
  },
  setup() {
    const router = useRouter();
    const polls = ref([]);
    const loading = ref(false);
    const esProfesor = ref(false);

    const usuario = ref(null);
    const isStudent = computed(() => {
      return usuario.value?.rol === "student" || usuario.value?.rol === "user";
    });

    const years = ref([]);
    const yearSelected = ref(null);
    const periodos = ref([]);
    const periodoSelected = ref(null);
    const courses = ref([]); // List of courses for privileged users
    const courseSelected = ref(null);

    const fetchPolls = async () => {
      loading.value = true;
      try {
        tokenHeader();
        polls.value = [];

        const params = {};
        if (courseSelected.value) {
          params.courseId = courseSelected.value;
        }
        if (periodoSelected.value) {
          params.periodId = periodoSelected.value;
        }
        if (yearSelected.value) {
          params.year = yearSelected.value;
        }

        // Only fetch if all required filters are present for privileged users, or if it's a student
        if (isStudent.value || (courseSelected.value && periodoSelected.value && yearSelected.value)) {
            const response = await axios.get("/polls", { params });
            polls.value = response.data;
        } else {
            polls.value = []; // Clear polls if filters are incomplete for privileged users
        }
      } catch (error) {
        console.error("Error fetching polls:", error);
      } finally {
        loading.value = false;
      }
    };

    const openPoll = (poll) => {
      router.push(`/encuestas/${poll.id}`);
    };

    const changeYear = (event) => {
      yearSelected.value = event.detail.value;
      localStorage.setItem("year", JSON.stringify(yearSelected.value));
      // If student, update courseSelected based on new year
      if (isStudent.value) {
        const cursosUsuario = JSON.parse(localStorage.getItem("cursosUsuario")) || [];
        const courseForYear = cursosUsuario.find(c => c.year == yearSelected.value && (c.active || c.exist));
        if (courseForYear) {
          courseSelected.value = courseForYear.id;
          localStorage.setItem("courseSelected", JSON.stringify(courseForYear));
        } else {
          courseSelected.value = null;
          localStorage.removeItem("courseSelected");
        }
      }
    };

    const changePeriodo = (event) => {
      periodoSelected.value = event.detail.value;
      localStorage.setItem("periodoSelected", JSON.stringify(periodoSelected.value));
    };

    const changeCourse = (event) => {
      courseSelected.value = event.detail.value;
      localStorage.setItem("courseSelected", JSON.stringify({ id: courseSelected.value })); // Store just ID for simplicity
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      esProfesor.value = adminOprofesor();

      periodos.value = periodosGet();
      periodoSelected.value = JSON.parse(localStorage.getItem("periodoSelected"));

      const curServerYear = currentServerYear();
      years.value = new Array(10).fill(0).map((_, i) => curServerYear - i);
      yearSelected.value = JSON.parse(localStorage.getItem("year")) || curServerYear;

      if (isStudent.value) {
        const cursosUsuario = JSON.parse(localStorage.getItem("cursosUsuario")) || [];
        const sortedCourses = cursosUsuario.sort((a, b) => b.year - a.year);
        
        // Try to find a course for the selected year, otherwise use the most recent
        let activeCourse = sortedCourses.find(c => c.year == yearSelected.value && (c.active || c.exist));
        if (!activeCourse && sortedCourses.length > 0) {
            activeCourse = sortedCourses[0];
            yearSelected.value = activeCourse.year; // Update yearSelected to match the active course
            localStorage.setItem("year", JSON.stringify(yearSelected.value));
        }

        if (activeCourse) {
          courseSelected.value = activeCourse.id;
          localStorage.setItem("courseSelected", JSON.stringify(activeCourse));
          // Ensure periodoSelected is set for the student's context
          if (!periodoSelected.value && periodos.value.length > 0) {
            periodoSelected.value = periodos.value[0].id; // Default to first period if not set
            localStorage.setItem("periodoSelected", JSON.stringify(periodoSelected.value));
          }
        } else {
          // No active course found for student
          courseSelected.value = null;
          periodoSelected.value = null;
          yearSelected.value = null;
          polls.value = []; // Clear polls
          loading.value = false;
          return; // Stop further execution if no course for student
        }
        courses.value = activeCourse ? [activeCourse] : []; // Student only sees their course
      } else {
        // Privileged user: fetch all courses
        try {
          const response = await axios.get("/courses");
          courses.value = response.data;
          // Initialize courseSelected if not already set or if stored course is not in the list
          const storedCourse = JSON.parse(localStorage.getItem("courseSelected"));
          if (storedCourse && courses.value.some(c => c.id === storedCourse.id)) {
            courseSelected.value = storedCourse.id;
          } else if (courses.value.length > 0) {
            courseSelected.value = courses.value[0].id;
            localStorage.setItem("courseSelected", JSON.stringify(courses.value[0]));
          }
        } catch (error) {
          console.error("Error fetching courses:", error);
          courses.value = [];
        }
      }
      
      fetchPolls(); // Initial fetch with determined filters
    });

    watch([yearSelected, periodoSelected, courseSelected], () => {
      if (yearSelected.value && periodoSelected.value && (courseSelected.value || isStudent.value)) {
        fetchPolls();
      } else if (!isStudent.value) {
        // For privileged users, clear polls if filters are incomplete
        polls.value = [];
      }
    });

    return {
      polls,
      loading,
      esProfesor,
      router,
      openPoll,
      barChartOutline,
      addOutline,
      isStudent,
      years,
      yearSelected,
      periodos,
      periodoSelected,
      courses,
      courseSelected,
      changeYear,
      changePeriodo,
      changeCourse,
    };
  },
};
</script>
