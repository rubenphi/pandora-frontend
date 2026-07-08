<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Encuesta a Padres</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="stacked">Año</ion-label>
        <ion-input
          type="number"
          v-model="year"
          :min="2020"
          :max="2100"
        ></ion-input>
      </ion-item>

      <ion-button
        expand="block"
        color="primary"
        @click="fetchSessions"
        class="ion-margin-top"
      >
        <ion-icon :icon="searchOutline" slot="start"></ion-icon>
        Buscar sesiones
      </ion-button>

      <ion-list class="ion-margin-top" v-if="sessions.length > 0">
        <ion-list-header>
          <ion-label>Sesiones disponibles</ion-label>
        </ion-list-header>
        <ion-item
          v-for="s in sessions"
          :key="s.id"
          button
          @click="enterSession(s)"
        >
          <ion-label>
            <h2>{{ s.label }}</h2>
            <p>{{ s.year }} &middot; creada {{ formatDate(s.createdAt) }}</p>
          </ion-label>
          <ion-badge slot="end" color="primary">{{
            s.responseCount || 0
          }}</ion-badge>
        </ion-item>
      </ion-list>

      <ion-card
        v-if="templateId && sessions.length === 0 && searched"
        class="ion-margin-top"
      >
        <ion-card-content class="ion-text-center">
          <p>No hay sesiones para {{ year }}.</p>
        </ion-card-content>
      </ion-card>

      <ion-button
        expand="block"
        color="tertiary"
        class="ion-margin-top"
        @click="showCreateModal = true"
      >
        <ion-icon :icon="addOutline" slot="start"></ion-icon>
        Nueva sesión
      </ion-button>
    </ion-content>

    <ion-modal
      :is-open="showCreateModal"
      @did-dismiss="showCreateModal = false"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Nueva sesión</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showCreateModal = false">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-item>
          <ion-label position="stacked">Año</ion-label>
          <ion-input
            type="number"
            v-model="createYear"
            :min="2020"
            :max="2100"
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Nombre de la sesión</ion-label>
          <ion-input
            v-model="createLabel"
            placeholder="Ej: Primer Semestre"
          ></ion-input>
        </ion-item>
        <ion-button
          expand="block"
          class="ion-margin-top"
          @click="createSession"
          :disabled="!createLabel || !createYear"
        >
          <ion-icon :icon="checkmarkOutline" slot="start"></ion-icon>
          Crear sesión
        </ion-button>
      </ion-content>
    </ion-modal>
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
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonCard,
  IonCardContent,
  IonBadge,
  IonListHeader,
  IonModal,
} from "@ionic/vue";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { tokenHeader, selectedYear } from "../globalService";
import {
  arrowBackOutline,
  addOutline,
  closeOutline,
  checkmarkOutline,
  searchOutline,
} from "ionicons/icons";

export default {
  name: "OmrParentSurveyLauncher",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonCard,
    IonCardContent,
    IonBadge,
    IonModal,
    IonListHeader,
  },
  setup() {
    const router = useRouter();
    const templateId = ref(null);
    const year = ref(selectedYear());
    const createYear = ref(selectedYear());
    const createLabel = ref("");
    const sessions = ref([]);
    const showCreateModal = ref(false);
    const searched = ref(false);

    const goBack = () => router.back();

    const loadTemplate = async () => {
      try {
        tokenHeader();
        const res = await axios.get("/surveys/templates", {
          params: { slug: "parent-survey" },
        });
        if (res.data.length > 0) {
          templateId.value = res.data[0].id;
        }
      } catch (err) {
        console.error("loadTemplate error:", err.response?.data || err.message);
      }
    };

    const fetchSessions = async () => {
      if (!templateId.value) return;
      searched.value = true;
      try {
        tokenHeader();
        const res = await axios.get("/surveys/sessions", {
          params: { templateId: templateId.value, year: Number(year.value) },
        });
        const data = res.data || [];

        const sessionIds = data.map((s) => s.id);
        const responseCounts = {};
        if (sessionIds.length > 0) {
          try {
            const allRes = await axios.get("/surveys/responses", {
              params: { templateId: templateId.value },
            });
            const responses = allRes.data || [];
            for (const r of responses) {
              if (r.session?.id) {
                responseCounts[r.session.id] =
                  (responseCounts[r.session.id] || 0) + 1;
              }
            }
          } catch {
            // ignore errors counting individual session responses
          }
        }

        sessions.value = data.map((s) => ({
          ...s,
          responseCount: responseCounts[s.id] || 0,
        }));
      } catch (err) {
        console.error(
          "fetchSessions error:",
          err.response?.data || err.message,
        );
        sessions.value = [];
      }
    };

    const createSession = async () => {
      if (!templateId.value || !createLabel.value || !createYear.value) return;
      try {
        tokenHeader();
        await axios.post("/surveys/sessions", {
          templateId: templateId.value,
          year: Number(createYear.value),
          label: createLabel.value,
        });
        createLabel.value = "";
        showCreateModal.value = false;
        year.value = Number(createYear.value);
        await fetchSessions();
      } catch (err) {
        console.error(
          "createSession error:",
          err.response?.data || err.message,
        );
      }
    };

    const enterSession = (session) => {
      router.push(`/omr-encuesta/padres/${session.id}`);
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleDateString();
    };

    onMounted(async () => {
      await loadTemplate();
      if (templateId.value) {
        await fetchSessions();
      }
    });

    return {
      templateId,
      year,
      createYear,
      createLabel,
      sessions,
      showCreateModal,
      searched,
      goBack,
      fetchSessions,
      createSession,
      enterSession,
      formatDate,
      arrowBackOutline,
      addOutline,
      closeOutline,
      checkmarkOutline,
      searchOutline,
    };
  },
};
</script>
