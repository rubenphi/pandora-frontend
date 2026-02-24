<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/encuestas"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ poll ? poll.title : "Encuesta" }}</ion-title>
        <!-- Close poll button for teachers -->
        <ion-buttons slot="end" v-if="esProfesor && poll ">
          <ion-button @click="editPoll(poll.id)">
            <ion-icon slot="icon-only" :icon="createOutline"></ion-icon>
          </ion-button>
          <ion-button color="danger" @click="closePoll" :disabled="closing">
            <ion-spinner v-if="closing" name="crescent" slot="start"></ion-spinner>
            Cerrar
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <!-- Loading -->
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <template v-else-if="poll">
        <!-- Poll header -->
        <div class="poll-header ion-margin-bottom">
          <p v-if="poll.course" style="color: var(--ion-color-medium); font-size: 0.9em; margin-bottom: 4px">
            {{ poll.course.name }}
          </p>
          <h2>{{ poll.question }}</h2>
          <ion-badge :color="poll.active ? 'success' : 'medium'">
            {{ poll.active ? "Activa" : "Cerrada" }}
          </ion-badge>
        </div>

        <!-- STATE 1: Active + not voted yet -->
        <template v-if="poll.active && !myVote">
          <ion-list>
            <ion-radio-group v-model="selectedOptionId">
              <ion-item v-for="option in poll.options" :key="option.id">
                <ion-label>{{ option.text }}</ion-label>
                <ion-radio slot="end" :value="option.id"></ion-radio>
              </ion-item>
            </ion-radio-group>
          </ion-list>

          <ion-text color="danger" v-if="voteError">
            <p class="ion-padding-horizontal">{{ voteError }}</p>
          </ion-text>

          <ion-button
            expand="block"
            class="ion-margin-top"
            :disabled="!selectedOptionId || voting"
            @click="castVote"
          >
            <ion-spinner v-if="voting" name="crescent" slot="start"></ion-spinner>
            {{ voting ? "Enviando..." : "Votar" }}
          </ion-button>
        </template>

        <!-- STATE 2: Active + already voted -->
        <template v-else-if="poll.active && myVote">
          <div class="ion-text-center ion-padding">
            <ion-icon
              :icon="checkmarkCircleOutline"
              color="success"
              style="font-size: 64px"
            ></ion-icon>
            <h3>¡Ya votaste!</h3>
            <p style="color: var(--ion-color-medium)">
              Tu voto: <strong>{{ myVote.option?.text }}</strong>
            </p>
            <p style="color: var(--ion-color-medium)">
              Los resultados estarán disponibles cuando el profesor cierre la encuesta.
            </p>
          </div>

          <!-- Show options highlighted for reference -->
          <ion-list>
            <ion-item v-for="option in poll.options" :key="option.id">
              <ion-label :color="myVote.option?.id === option.id ? 'primary' : ''">
                <strong v-if="myVote.option?.id === option.id">✓ </strong>
                {{ option.text }}
              </ion-label>
            </ion-item>
          </ion-list>
        </template>

        <!-- STATE 3: Closed — show results -->
        <template v-else-if="!poll.active">
          <div v-if="results">
            <p class="ion-padding-horizontal" style="color: var(--ion-color-medium)">
              Total de votos: <strong>{{ results.totalVotes }}</strong>
            </p>

            <div
              v-for="result in results.results"
              :key="result.optionId"
              class="result-item ion-padding-horizontal ion-margin-bottom"
            >
              <div class="result-label">
                <span>{{ result.text }}</span>
                <span class="result-pct">{{ result.percentage }}%</span>
              </div>
              <div class="result-bar-bg">
                <div
                  class="result-bar-fill"
                  :style="{ width: result.percentage + '%' }"
                ></div>
              </div>
              <p class="result-votes">{{ result.votes }} voto{{ result.votes !== 1 ? 's' : '' }}</p>
            </div>
          </div>
          <div v-else class="ion-text-center ion-padding">
            <ion-spinner name="crescent"></ion-spinner>
          </div>
        </template>
      </template>
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
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonBadge,
  IonSpinner,
  IonIcon,
  IonText,
  onIonViewWillEnter,
  alertController,
} from "@ionic/vue";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createOutline, checkmarkCircleOutline } from "ionicons/icons";
import axios from "axios";
import { adminOprofesor, tokenHeader } from "../globalService";

export default {
  name: "EncuestaView",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonRadioGroup,
    IonRadio,
    IonBadge,
    IonSpinner,
    IonIcon,
    IonText,

  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const poll = ref(null);
    const myVote = ref(null);
    const results = ref(null);
    const loading = ref(false);
    const voting = ref(false);
    const closing = ref(false);
    const selectedOptionId = ref(null);
    const voteError = ref("");
    const esProfesor = ref(false);

    const loadPoll = async () => {
      loading.value = true;
      poll.value = null;
      myVote.value = null;
      results.value = null;
      selectedOptionId.value = null;
      voteError.value = "";

      try {
        tokenHeader();
        const id = route.params.id;

        // Load poll details
        const pollRes = await axios.get(`/polls/${id}`);
        poll.value = pollRes.data;

        if (poll.value.active) {
          // Check if already voted
          const voteRes = await axios.get(`/polls/${id}/my-vote`);
          myVote.value = voteRes.data; // null if not voted
        } else {
          // Load results for closed poll
          try {
            const resultsRes = await axios.get(`/polls/${id}/results`);
            results.value = resultsRes.data;
          } catch (e) {
            console.error("Error loading results:", e);
          }
        }
      } catch (error) {
        console.error("Error loading poll:", error);
      } finally {
        loading.value = false;
      }
    };

    const castVote = async () => {
      if (!selectedOptionId.value) return;
      voteError.value = "";
      voting.value = true;
      try {
        tokenHeader();
        const id = route.params.id;
        await axios.post(`/polls/${id}/vote`, { optionId: selectedOptionId.value });
        // Reload to show "already voted" state
        await loadPoll();
      } catch (error) {
        console.error("Error casting vote:", error);
        voteError.value =
          error.response?.data?.message || "Error al registrar el voto.";
      } finally {
        voting.value = false;
      }
    };

    const closePoll = async () => {
      const alert = await alertController.create({
        header: "Cerrar encuesta",
        message: "¿Estás seguro de que deseas cerrar esta encuesta? Esta acción no se puede deshacer.",
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Cerrar encuesta",
            role: "confirm",
            handler: async () => {
              closing.value = true;
              try {
                tokenHeader();
                const id = route.params.id;
                await axios.patch(`/polls/${id}/close`);
                await loadPoll();
              } catch (error) {
                console.error("Error closing poll:", error);
              } finally {
                closing.value = false;
              }
            },
          },
        ],
      });
      await alert.present();
    };

    const editPoll = (pollId) => {
      router.push(`/encuestas/editar/${pollId}`);
    };

    onIonViewWillEnter(() => {
      esProfesor.value = !!adminOprofesor();
      loadPoll();
    });

    return {
      poll,
      myVote,
      results,
      loading,
      voting,
      closing,
      selectedOptionId,
      voteError,
      esProfesor,
      castVote,
      closePoll,
      editPoll, // Added editPoll here
      checkmarkCircleOutline,
      createOutline, // Added createOutline here
    };
  },
};
</script>

<style scoped>
.poll-header {
  padding: 8px 0;
}

.poll-header h2 {
  font-size: 1.2em;
  font-weight: 600;
  margin-bottom: 8px;
}

.result-item {
  margin-bottom: 16px;
}

.result-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-weight: 500;
}

.result-pct {
  color: var(--ion-color-primary);
  font-weight: 700;
}

.result-bar-bg {
  background: var(--ion-color-light);
  border-radius: 8px;
  height: 12px;
  overflow: hidden;
}

.result-bar-fill {
  background: var(--ion-color-primary);
  height: 100%;
  border-radius: 8px;
  transition: width 0.6s ease;
}

.result-votes {
  font-size: 0.8em;
  color: var(--ion-color-medium);
  margin-top: 2px;
}
</style>
