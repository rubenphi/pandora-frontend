<template>
  <ion-page class="ion-page qz-poll-view-page">
    <ion-content :fullscreen="true" class="qz-poll-view-content">
      <div class="qz-poll-view-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <header class="qz-hero-header">
          <div class="qz-hero-inner">
            <div class="qz-hero-top">
              <div class="qz-hero-top-left">
                <button
                  type="button"
                  class="qz-back-btn"
                  title="Volver a encuestas"
                  aria-label="Volver"
                  @click="goBack"
                >
                  <ion-icon :icon="arrowBackOutline"></ion-icon>
                </button>
                <span class="qz-hero-tag">
                  {{ poll ? poll.title : "ENCUESTA" }}
                </span>
              </div>

              <!-- Acciones de profesor/admin -->
              <div v-if="esProfesor && poll" class="qz-hero-actions">
                <button
                  type="button"
                  class="qz-hero-icon-btn"
                  title="Editar encuesta"
                  aria-label="Editar encuesta"
                  @click="editPoll(poll.id)"
                >
                  <ion-icon :icon="createOutline"></ion-icon>
                </button>
                <button
                  v-if="poll.active"
                  type="button"
                  class="qz-hero-close-btn"
                  :disabled="closing"
                  @click="closePoll"
                >
                  <ion-spinner
                    v-if="closing"
                    name="crescent"
                    class="qz-btn-spinner"
                  ></ion-spinner>
                  <span>{{ closing ? "Cerrando..." : "Cerrar" }}</span>
                </button>
              </div>
            </div>

            <div v-if="poll" class="qz-hero-meta-row">
              <span
                class="qz-status-badge"
                :class="
                  poll.active ? 'qz-status--active' : 'qz-status--closed'
                "
              >
                {{ poll.active ? "Activa" : "Cerrada" }}
              </span>
              <span class="qz-mode-pill">
                {{ poll.mode === "group" ? "Modo Grupal" : "Modo Individual" }}
              </span>
              <span v-if="poll.course" class="qz-course-pill">
                Curso {{ poll.course.name }}
              </span>
            </div>

            <h1 class="qz-hero-title">
              {{ poll ? poll.question : "Cargando encuesta..." }}
            </h1>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-poll-body">
          <!-- Loading -->
          <div v-if="loading" class="qz-card qz-state-card">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p class="qz-state-text">Cargando encuesta...</p>
          </div>

          <template v-else-if="poll">
            <!-- ESTADO 1: Activa + no ha votado aún -->
            <section v-if="poll.active && !myVote" class="qz-card">
              <div v-if="esProfesor" class="qz-teacher-notice">
                <ion-icon :icon="informationCircleOutline"></ion-icon>
                <span>
                  La encuesta está activa. Los resultados se mostrarán al
                  cerrarla.
                </span>
              </div>

              <div class="qz-options-stack">
                <button
                  v-for="option in poll.options"
                  :key="option.id"
                  type="button"
                  class="qz-vote-option"
                  :class="{ 'is-selected': selectedOptionId === option.id }"
                  @click="selectedOptionId = option.id"
                >
                  <span class="qz-vote-radio">
                    <span
                      v-if="selectedOptionId === option.id"
                      class="qz-vote-radio-dot"
                    ></span>
                  </span>
                  <span class="qz-vote-text">{{ option.text }}</span>
                </button>
              </div>

              <div v-if="voteError" class="qz-error-banner">
                {{ voteError }}
              </div>

              <button
                type="button"
                class="qz-btn-primary"
                :disabled="!selectedOptionId || voting"
                @click="castVote"
              >
                <ion-spinner
                  v-if="voting"
                  name="crescent"
                  class="qz-btn-spinner"
                ></ion-spinner>
                <span>{{ voting ? "Enviando..." : "Votar" }}</span>
              </button>
            </section>

            <!-- ESTADO 2: Activa + ya votó -->
            <section v-else-if="poll.active && myVote" class="qz-card">
              <div class="qz-voted-banner">
                <div class="qz-voted-icon">
                  <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                </div>
                <h2 class="qz-voted-title">¡Ya votaste!</h2>
                <p class="qz-voted-choice">
                  Tu voto: <strong>{{ myVote.option?.text }}</strong>
                </p>
                <p class="qz-state-text">
                  Los resultados estarán disponibles cuando el profesor cierre
                  la encuesta.
                </p>
              </div>

              <div class="qz-options-stack qz-options-readonly">
                <div
                  v-for="option in poll.options"
                  :key="option.id"
                  class="qz-vote-option qz-vote-option--readonly"
                  :class="{ 'is-my-vote': myVote.option?.id === option.id }"
                >
                  <ion-icon
                    v-if="myVote.option?.id === option.id"
                    :icon="checkmarkCircleOutline"
                    class="qz-my-vote-check"
                  ></ion-icon>
                  <span class="qz-vote-text">{{ option.text }}</span>
                </div>
              </div>
            </section>

            <!-- ESTADO 3: Cerrada — mostrar resultados -->
            <section v-else-if="!poll.active" class="qz-card">
              <template v-if="results">
                <div class="qz-results-header">
                  <span class="qz-results-title">Resultados finales</span>
                  <span class="qz-total-votes-pill">
                    Total: {{ results.totalVotes }}
                    {{ results.totalVotes === 1 ? "voto" : "votos" }}
                  </span>
                </div>

                <div class="qz-results-list">
                  <div
                    v-for="result in results.results"
                    :key="result.optionId"
                    class="qz-result-item"
                  >
                    <div class="qz-result-label">
                      <span class="qz-result-text">{{ result.text }}</span>
                      <span class="qz-result-pct">
                        {{ result.percentage }}%
                      </span>
                    </div>
                    <div class="qz-result-bar-bg">
                      <div
                        class="qz-result-bar-fill"
                        :style="{ width: result.percentage + '%' }"
                      ></div>
                    </div>
                    <p class="qz-result-votes">
                      {{ result.votes }} voto{{ result.votes !== 1 ? "s" : "" }}
                    </p>
                  </div>
                </div>
              </template>

              <div v-else-if="resultsError" class="qz-error-banner">
                {{ resultsError }}
              </div>

              <div v-else class="qz-state-card">
                <ion-spinner name="crescent" color="primary"></ion-spinner>
                <p class="qz-state-text">Cargando resultados...</p>
              </div>
            </section>
          </template>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonIcon,
  onIonViewWillEnter,
  alertController,
} from "@ionic/vue";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  createOutline,
  checkmarkCircleOutline,
  arrowBackOutline,
  informationCircleOutline,
} from "ionicons/icons";
import axios from "axios";
import { adminOprofesor, tokenHeader } from "../globalService";

export default {
  name: "EncuestaView",
  components: {
    IonPage,
    IonContent,
    IonSpinner,
    IonIcon,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const poll = ref(null);
    const myVote = ref(null);
    const results = ref(null);
    const resultsError = ref("");
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
      resultsError.value = "";
      selectedOptionId.value = null;
      voteError.value = "";

      try {
        const id = route.params.id;
        const pollRes = await axios.get(`/polls/${id}`, tokenHeader());
        poll.value = pollRes.data;

        if (poll.value.active) {
          const voteRes = await axios.get(
            `/polls/${id}/my-vote`,
            tokenHeader(),
          );
          myVote.value = voteRes.data || null;
        } else {
          try {
            const resultsRes = await axios.get(
              `/polls/${id}/results`,
              tokenHeader(),
            );
            results.value = resultsRes.data;
          } catch (e) {
            console.error("Error loading results:", e);
            resultsError.value =
              e.response?.data?.message ||
              "No se pudieron cargar los resultados.";
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
        const id = route.params.id;
        await axios.post(
          `/polls/${id}/vote`,
          { optionId: selectedOptionId.value },
          tokenHeader(),
        );
        await loadPoll();
      } catch (error) {
        console.error("Error casting vote:", error);
        const msg = error.response?.data?.message;
        voteError.value = Array.isArray(msg)
          ? msg.join(", ")
          : msg || "Error al registrar el voto.";
      } finally {
        voting.value = false;
      }
    };

    const closePoll = async () => {
      const alert = await alertController.create({
        header: "Cerrar encuesta",
        message:
          "¿Estás seguro de que deseas cerrar esta encuesta? Esta acción no se puede deshacer.",
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Cerrar encuesta",
            role: "confirm",
            handler: async () => {
              closing.value = true;
              try {
                const id = route.params.id;
                await axios.patch(`/polls/${id}/close`, {}, tokenHeader());
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

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/encuestas");
      }
    };

    onIonViewWillEnter(() => {
      esProfesor.value = !!adminOprofesor();
      loadPoll();
    });

    return {
      poll,
      myVote,
      results,
      resultsError,
      loading,
      voting,
      closing,
      selectedOptionId,
      voteError,
      esProfesor,
      castVote,
      closePoll,
      editPoll,
      goBack,
      checkmarkCircleOutline,
      createOutline,
      arrowBackOutline,
      informationCircleOutline,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM: DETALLE / VOTACIÓN DE ENCUESTA
   ========================================================================== */

.qz-poll-view-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-poll-view-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-poll-view-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;
  padding-bottom: 70px;
}

/* 1. CABECERA HERO */
.qz-hero-header {
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  padding: max(20px, env(safe-area-inset-top)) 20px 26px;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(106, 90, 224, 0.2);
}

.qz-hero-inner {
  max-width: 720px;
  margin: 0 auto;
}

.qz-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.qz-hero-top-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.qz-back-btn,
.qz-hero-icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  backdrop-filter: blur(6px);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.qz-back-btn:hover,
.qz-hero-icon-btn:hover {
  background: rgba(255, 255, 255, 0.28);
}

.qz-hero-tag {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.7px;
  padding: 5px 12px;
  border-radius: 9999px;
  backdrop-filter: blur(6px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.qz-hero-close-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ff5656;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 9px 14px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 86, 86, 0.3);
  transition: all 0.2s ease;
}

.qz-hero-close-btn:hover:not(:disabled) {
  background: #e11d48;
}

.qz-hero-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.qz-status-badge {
  font-size: 10.5px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 9999px;
  text-transform: uppercase;
}

.qz-status--active {
  background: #eafbf1;
  color: #15803d;
}

.qz-status--closed {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.qz-mode-pill,
.qz-course-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.qz-hero-title {
  margin: 0;
  font-size: 21px;
  font-weight: 800;
  line-height: 1.3;
  color: #ffffff;
}

/* 2. CUERPO Y TARJETAS */
.qz-poll-body {
  padding: 20px 16px 24px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.qz-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 20px;
  border: 1px solid rgba(106, 90, 224, 0.12);
  box-shadow: 0 6px 18px rgba(12, 9, 42, 0.05);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-state-card {
  padding: 36px 20px;
  align-items: center;
  text-align: center;
}

.qz-state-text {
  margin: 0;
  font-size: 13.5px;
  color: #858494;
}

.qz-teacher-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 12.5px;
  font-weight: 600;
}

.qz-teacher-notice ion-icon {
  font-size: 18px;
  flex-shrink: 0;
}

/* OPCIONES DE VOTO */
.qz-options-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-vote-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f4f3fd;
  border: 1.5px solid rgba(106, 90, 224, 0.16);
  border-radius: 14px;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-vote-option:hover:not(.qz-vote-option--readonly) {
  border-color: #6a5ae0;
}

.qz-vote-option.is-selected {
  background: #efeefc;
  border-color: #6a5ae0;
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.14);
}

.qz-vote-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #858494;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.2s ease;
}

.qz-vote-option.is-selected .qz-vote-radio {
  border-color: #6a5ae0;
}

.qz-vote-radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6a5ae0;
}

.qz-vote-text {
  font-size: 14.5px;
  font-weight: 600;
  color: #0c092a;
}

.qz-vote-option--readonly {
  cursor: default;
}

.qz-vote-option--readonly.is-my-vote {
  background: #eafbf1;
  border-color: rgba(44, 182, 125, 0.45);
}

.qz-my-vote-check {
  font-size: 20px;
  color: #16a34a;
  flex-shrink: 0;
}

/* YA VOTASTE */
.qz-voted-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  padding: 12px 8px;
}

.qz-voted-icon {
  width: 60px;
  height: 60px;
  border-radius: 20px;
  background: #eafbf1;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  margin-bottom: 4px;
}

.qz-voted-title {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  color: #0c092a;
}

.qz-voted-choice {
  margin: 0;
  font-size: 14px;
  color: #5a5772;
}

/* RESULTADOS */
.qz-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.qz-results-title {
  font-size: 16px;
  font-weight: 800;
  color: #0c092a;
}

.qz-total-votes-pill {
  font-size: 12px;
  font-weight: 700;
  background: #efeefc;
  color: #6a5ae0;
  padding: 4px 12px;
  border-radius: 9999px;
}

.qz-results-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-result-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-result-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.qz-result-text {
  font-size: 14px;
  font-weight: 600;
  color: #0c092a;
}

.qz-result-pct {
  color: #6a5ae0;
  font-weight: 800;
  font-size: 14px;
}

.qz-result-bar-bg {
  background: #f4f3fd;
  border-radius: 9999px;
  height: 12px;
  overflow: hidden;
}

.qz-result-bar-fill {
  background: linear-gradient(90deg, #6a5ae0 0%, #9087e5 100%);
  height: 100%;
  border-radius: 9999px;
  transition: width 0.6s ease;
}

.qz-result-votes {
  font-size: 12px;
  color: #858494;
  margin: 0;
  font-weight: 500;
}

/* BOTONES Y ERROR */
.qz-error-banner {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #be123c;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
}

.qz-btn-primary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.28);
  transition: all 0.2s ease;
}

.qz-btn-primary:hover:not(:disabled) {
  background: #5b4cc9;
}

.qz-btn-primary:disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.qz-btn-spinner {
  width: 16px;
  height: 16px;
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-poll-view-page,
  body:not(.light) .qz-poll-view-content {
    --background: #120f24;
    background-color: #120f24;
  }

  body:not(.light) .qz-hero-header {
    background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
  }

  body:not(.light) .qz-hero-tag {
    background: rgba(255, 255, 255, 0.12);
    color: #b5a9ff;
    border: 1px solid rgba(181, 169, 255, 0.28);
  }

  body:not(.light) .qz-status--active {
    background: rgba(83, 223, 131, 0.2);
    color: #53df83;
  }

  body:not(.light) .qz-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
  }

  body:not(.light) .qz-teacher-notice {
    background: rgba(37, 99, 235, 0.15);
    border-color: rgba(37, 99, 235, 0.35);
    color: #93c5fd;
  }

  body:not(.light) .qz-vote-option {
    background: #241d42;
    border-color: rgba(255, 255, 255, 0.1);
  }

  body:not(.light) .qz-vote-option.is-selected {
    background: #2b2254;
    border-color: #8c7ef8;
    box-shadow: 0 0 0 3px rgba(140, 126, 248, 0.2);
  }

  body:not(.light) .qz-vote-option.is-selected .qz-vote-radio {
    border-color: #b5a9ff;
  }

  body:not(.light) .qz-vote-radio-dot {
    background: #b5a9ff;
  }

  body:not(.light) .qz-vote-option--readonly.is-my-vote {
    background: rgba(83, 223, 131, 0.15);
    border-color: rgba(83, 223, 131, 0.35);
  }

  body:not(.light) .qz-my-vote-check {
    color: #53df83;
  }

  body:not(.light) .qz-voted-icon {
    background: rgba(83, 223, 131, 0.18);
    color: #53df83;
  }

  body:not(.light) .qz-vote-text,
  body:not(.light) .qz-voted-title,
  body:not(.light) .qz-results-title,
  body:not(.light) .qz-result-text {
    color: #f7f7fd;
  }

  body:not(.light) .qz-voted-choice {
    color: #c7c3e0;
  }

  body:not(.light) .qz-state-text,
  body:not(.light) .qz-result-votes {
    color: #9e9bb8;
  }

  body:not(.light) .qz-total-votes-pill {
    background: #2b2254;
    color: #b5a9ff;
  }

  body:not(.light) .qz-result-pct {
    color: #b5a9ff;
  }

  body:not(.light) .qz-result-bar-bg {
    background: #241d42;
  }

  body:not(.light) .qz-error-banner {
    background: rgba(225, 29, 72, 0.18);
    border-color: rgba(225, 29, 72, 0.35);
    color: #fda4af;
  }
}

:global(body.dark) .qz-poll-view-page,
:global(body.dark) .qz-poll-view-content,
:global(html.dark) .qz-poll-view-page,
:global(html.dark) .qz-poll-view-content,
:global(.dark) .qz-poll-view-page,
:global(.dark) .qz-poll-view-content {
  --background: #120f24;
  background-color: #120f24;
}

:global(body.dark) .qz-hero-header,
:global(html.dark) .qz-hero-header,
:global(.dark) .qz-hero-header {
  background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
}

:global(body.dark) .qz-hero-tag,
:global(html.dark) .qz-hero-tag,
:global(.dark) .qz-hero-tag {
  background: rgba(255, 255, 255, 0.12);
  color: #b5a9ff;
  border: 1px solid rgba(181, 169, 255, 0.28);
}

:global(body.dark) .qz-status--active,
:global(html.dark) .qz-status--active,
:global(.dark) .qz-status--active {
  background: rgba(83, 223, 131, 0.2);
  color: #53df83;
}

:global(body.dark) .qz-card,
:global(html.dark) .qz-card,
:global(.dark) .qz-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
}

:global(body.dark) .qz-teacher-notice,
:global(html.dark) .qz-teacher-notice,
:global(.dark) .qz-teacher-notice {
  background: rgba(37, 99, 235, 0.15);
  border-color: rgba(37, 99, 235, 0.35);
  color: #93c5fd;
}

:global(body.dark) .qz-vote-option,
:global(html.dark) .qz-vote-option,
:global(.dark) .qz-vote-option {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .qz-vote-option.is-selected,
:global(html.dark) .qz-vote-option.is-selected,
:global(.dark) .qz-vote-option.is-selected {
  background: #2b2254;
  border-color: #8c7ef8;
  box-shadow: 0 0 0 3px rgba(140, 126, 248, 0.2);
}

:global(body.dark) .qz-vote-option.is-selected .qz-vote-radio,
:global(html.dark) .qz-vote-option.is-selected .qz-vote-radio,
:global(.dark) .qz-vote-option.is-selected .qz-vote-radio {
  border-color: #b5a9ff;
}

:global(body.dark) .qz-vote-radio-dot,
:global(html.dark) .qz-vote-radio-dot,
:global(.dark) .qz-vote-radio-dot {
  background: #b5a9ff;
}

:global(body.dark) .qz-vote-option--readonly.is-my-vote,
:global(html.dark) .qz-vote-option--readonly.is-my-vote,
:global(.dark) .qz-vote-option--readonly.is-my-vote {
  background: rgba(83, 223, 131, 0.15);
  border-color: rgba(83, 223, 131, 0.35);
}

:global(body.dark) .qz-my-vote-check,
:global(html.dark) .qz-my-vote-check,
:global(.dark) .qz-my-vote-check {
  color: #53df83;
}

:global(body.dark) .qz-voted-icon,
:global(html.dark) .qz-voted-icon,
:global(.dark) .qz-voted-icon {
  background: rgba(83, 223, 131, 0.18);
  color: #53df83;
}

:global(body.dark) .qz-vote-text,
:global(html.dark) .qz-vote-text,
:global(.dark) .qz-vote-text,
:global(body.dark) .qz-voted-title,
:global(html.dark) .qz-voted-title,
:global(.dark) .qz-voted-title,
:global(body.dark) .qz-results-title,
:global(html.dark) .qz-results-title,
:global(.dark) .qz-results-title,
:global(body.dark) .qz-result-text,
:global(html.dark) .qz-result-text,
:global(.dark) .qz-result-text {
  color: #f7f7fd;
}

:global(body.dark) .qz-voted-choice,
:global(html.dark) .qz-voted-choice,
:global(.dark) .qz-voted-choice {
  color: #c7c3e0;
}

:global(body.dark) .qz-state-text,
:global(html.dark) .qz-state-text,
:global(.dark) .qz-state-text,
:global(body.dark) .qz-result-votes,
:global(html.dark) .qz-result-votes,
:global(.dark) .qz-result-votes {
  color: #9e9bb8;
}

:global(body.dark) .qz-total-votes-pill,
:global(html.dark) .qz-total-votes-pill,
:global(.dark) .qz-total-votes-pill {
  background: #2b2254;
  color: #b5a9ff;
}

:global(body.dark) .qz-result-pct,
:global(html.dark) .qz-result-pct,
:global(.dark) .qz-result-pct {
  color: #b5a9ff;
}

:global(body.dark) .qz-result-bar-bg,
:global(html.dark) .qz-result-bar-bg,
:global(.dark) .qz-result-bar-bg {
  background: #241d42;
}

:global(body.dark) .qz-error-banner,
:global(html.dark) .qz-error-banner,
:global(.dark) .qz-error-banner {
  background: rgba(225, 29, 72, 0.18);
  border-color: rgba(225, 29, 72, 0.35);
  color: #fda4af;
}
</style>
