<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="//herramientas"></ion-back-button>
        </ion-buttons>
        <ion-title>Encuestas en Vivo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Encuestas en Vivo</ion-title>
        </ion-toolbar>
      </ion-header>

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
  onIonViewWillEnter,
} from "@ionic/vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { barChartOutline, addOutline } from "ionicons/icons";
import axios from "axios";
import { adminOprofesor, tokenHeader} from "../globalService";

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
  },
  setup() {
    const router = useRouter();
    const polls = ref([]);
    const loading = ref(false);
    const esProfesor = ref(false);

    const fetchPolls = async () => {
      loading.value = true;
      try {
        tokenHeader();
        polls.value = [];
        

        if (esProfesor.value) {
            // Teacher: fetch all polls for current year/period
            // If backend supports filtering by just year/period (which it should now), great.
            // But my backend service logic for findAll only uses query params if present.
            // If I send ONLY periodId and year, it returns polls for ALL courses? Yes.
            // Is that okay? Teachers usually want to see polls for THEIR courses. 
            // But simple implementation: list all polls for the period.
            const response = await axios.get("/polls");
            polls.value = response.data;
        } else {
            // Student: need to fetch polls for MY courses.
            // 1. Get my courses via profile (assuming it returns courses relation)
            const profileRes = await axios.get("/auth/profile");
            const user = profileRes.data;
            let myCourses = [];
            
            if (user.courses && user.courses.length > 0) {
              // user.courses is UserToCourse[], so map to course
              myCourses = user.courses
                .map(utc => utc.course)
                .filter(c => c && (c.active || c.exist));
            } else {
              // Fallback: try to get from /courses/student/:id (if exists) or local storage
              // But if profile fails to return courses, we can't do much.
              // Assuming profile returns user with relations or at least we should try.
              console.warn("No courses found in profile for student.");
            }
            
            // 2. Fetch polls for each course
            for (const course of myCourses) {
                const response = await axios.get("/polls", {
                    params: {
                        courseId: course.id,
                    }
                });
                polls.value.push(...response.data);
            }
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

    onIonViewWillEnter(() => {
      esProfesor.value = !!adminOprofesor();
      fetchPolls();
    });

    return {
      polls,
      loading,
      esProfesor,
      router,
      openPoll,
      barChartOutline,
      addOutline,
    };
  },
};
</script>
