<template>
  <ion-page class="ion-page qz-leaderboard-page">
    <ion-content :fullscreen="true" class="qz-leaderboard-content">
      <!-- 1. CABECERA HERO PÚRPURA CON EL PODIO 3D (Estilo image27_1_2_375x812.png) -->
      <div class="qz-hero-section">
        <!-- Barra Superior: Volver + Acciones Admin -->
        <div class="qz-hero-top">
          <button
            type="button"
            class="qz-circle-btn"
            title="Regresar a Cuestionario"
            @click="goBack"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </button>

          <!-- Acciones Docente / Admin -->
          <div class="qz-hero-actions">
            <button
              v-if="admin"
              type="button"
              class="qz-circle-btn"
              title="Análisis de Desempeño"
              @click="openStats"
            >
              <ion-icon :icon="statsChartOutline"></ion-icon>
            </button>

            <button
              v-if="usuario?.rol == 'admin'"
              type="button"
              class="qz-circle-btn"
              title="Ordenar por Nombre"
              @click="ordenarPorNombre"
            >
              <ion-icon :icon="arrowDownCircle"></ion-icon>
            </button>

            <button
              v-if="admin"
              type="button"
              class="qz-circle-btn"
              title="Registrar Notas"
              @click="registrarNotas"
            >
              <ion-icon :icon="fileTrayFullOutline"></ion-icon>
            </button>

            <button
              v-if="admin"
              type="button"
              class="qz-circle-btn"
              title="Lector OMR"
              @click="goToOmr"
            >
              <ion-icon :icon="qrCodeOutline"></ion-icon>
            </button>

            <button
              type="button"
              class="qz-circle-btn"
              title="Refrescar Resultados"
              @click="reloadPage"
            >
              <ion-icon :icon="refreshOutline"></ion-icon>
            </button>
          </div>
        </div>

        <!-- Título del Hero -->
        <div class="qz-hero-titles">
          <span class="qz-hero-tag">CUADRO DE HONOR Y PODIO</span>
          <h1 class="qz-hero-title">
            {{ cuestionario ? cuestionario.topic : "Resultados" }}
          </h1>

          <!-- Barra de estado y progreso de preguntas para estudiantes -->
          <div
            v-if="cuestionario?.questions && cuestionario.questions.length > 0"
            class="qz-quiz-progress-pill"
          >
            <ion-icon
              :icon="hayPreguntasAbiertas ? timeOutline : checkmarkCircle"
            ></ion-icon>
            <span>
              {{ preguntasCerradasCount }} de {{ totalPreguntas }} preguntas
              cerradas
              <template v-if="!admin && hayPreguntasAbiertas">
                · (Resultados parciales)
              </template>
            </span>
          </div>
        </div>

        <!-- PODIO 3D QUEEZY (Tiers de Puntaje para resolver empates) -->
        <div v-if="topTiers && topTiers.length > 0" class="qz-podium-container">
          <div class="qz-podium-stage">
            <!-- ESCALÓN 2: Segundo Lugar (Plata 🥈) -->
            <div
              v-if="topTiers[1]"
              class="qz-podium-col qz-podium--step2"
              @click="handlePodiumClick(topTiers[1])"
            >
              <!-- Avatar o Stack de Avatares -->
              <div class="qz-podium-avatar-wrap">
                <div
                  v-if="topTiers[1].items.length > 1"
                  class="qz-avatar-stack"
                  title="Múltiples participantes empatados"
                >
                  <div class="qz-stacked-circle qz-stack--1">
                    {{ getInitials(topTiers[1].items[0]) }}
                  </div>
                  <div
                    v-if="topTiers[1].items[1]"
                    class="qz-stacked-circle qz-stack--2"
                  >
                    {{ getInitials(topTiers[1].items[1]) }}
                  </div>
                  <div class="qz-stack-count">
                    +{{ topTiers[1].items.length }}
                  </div>
                </div>
                <div v-else class="qz-podium-single-avatar">
                  {{ getInitials(topTiers[1].items[0]) }}
                </div>
                <div class="qz-rank-badge-icon qz-rank--silver">🥈</div>
              </div>

              <!-- Nombre o Empate -->
              <span class="qz-podium-name">
                {{
                  topTiers[1].items.length === 1
                    ? getParticipantName(topTiers[1].items[0])
                    : `${topTiers[1].items.length} Empatados`
                }}
              </span>

              <!-- Píldora de Puntos -->
              <div class="qz-podium-score-pill">
                {{ topTiers[1].points }} pts
              </div>

              <!-- Bloque 3D del Escalón 2 -->
              <div class="qz-pillar qz-pillar--2">
                <span class="qz-pillar-number">2</span>
              </div>
            </div>

            <!-- ESCALÓN 1: Primer Lugar (Oro con Corona 👑) -->
            <div
              v-if="topTiers[0]"
              class="qz-podium-col qz-podium--step1"
              @click="handlePodiumClick(topTiers[0])"
            >
              <!-- Corona Dorada Flotante -->
              <div class="qz-crown-floating">
                <span>👑</span>
              </div>

              <!-- Avatar o Stack de Avatares -->
              <div class="qz-podium-avatar-wrap qz-podium-wrap--gold">
                <div
                  v-if="topTiers[0].items.length > 1"
                  class="qz-avatar-stack"
                  title="Múltiples participantes con puntaje máximo"
                >
                  <div class="qz-stacked-circle qz-stack--1">
                    {{ getInitials(topTiers[0].items[0]) }}
                  </div>
                  <div
                    v-if="topTiers[0].items[1]"
                    class="qz-stacked-circle qz-stack--2"
                  >
                    {{ getInitials(topTiers[0].items[1]) }}
                  </div>
                  <div class="qz-stack-count">
                    +{{ topTiers[0].items.length }}
                  </div>
                </div>
                <div v-else class="qz-podium-single-avatar">
                  {{ getInitials(topTiers[0].items[0]) }}
                </div>
              </div>

              <!-- Nombre o Empate Ganador -->
              <span class="qz-podium-name qz-podium-name--first">
                {{
                  topTiers[0].items.length === 1
                    ? getParticipantName(topTiers[0].items[0])
                    : `${topTiers[0].items.length} Ganadores (Empate)`
                }}
              </span>

              <!-- Píldora de Puntos Dorada -->
              <div class="qz-podium-score-pill qz-pill--gold">
                {{ topTiers[0].points }} pts · 5.0
              </div>

              <!-- Bloque 3D del Escalón 1 -->
              <div class="qz-pillar qz-pillar--1">
                <span class="qz-pillar-number">1</span>
              </div>
            </div>

            <!-- ESCALÓN 3: Tercer Lugar (Bronce 🥉) -->
            <div
              v-if="topTiers[2]"
              class="qz-podium-col qz-podium--step3"
              @click="handlePodiumClick(topTiers[2])"
            >
              <!-- Avatar o Stack de Avatares -->
              <div class="qz-podium-avatar-wrap">
                <div
                  v-if="topTiers[2].items.length > 1"
                  class="qz-avatar-stack"
                  title="Múltiples participantes empatados"
                >
                  <div class="qz-stacked-circle qz-stack--1">
                    {{ getInitials(topTiers[2].items[0]) }}
                  </div>
                  <div
                    v-if="topTiers[2].items[1]"
                    class="qz-stacked-circle qz-stack--2"
                  >
                    {{ getInitials(topTiers[2].items[1]) }}
                  </div>
                  <div class="qz-stack-count">
                    +{{ topTiers[2].items.length }}
                  </div>
                </div>
                <div v-else class="qz-podium-single-avatar">
                  {{ getInitials(topTiers[2].items[0]) }}
                </div>
                <div class="qz-rank-badge-icon qz-rank--bronze">🥉</div>
              </div>

              <!-- Nombre o Empate -->
              <span class="qz-podium-name">
                {{
                  topTiers[2].items.length === 1
                    ? getParticipantName(topTiers[2].items[0])
                    : `${topTiers[2].items.length} Empatados`
                }}
              </span>

              <!-- Píldora de Puntos -->
              <div class="qz-podium-score-pill">
                {{ topTiers[2].points }} pts
              </div>

              <!-- Bloque 3D del Escalón 3 -->
              <div class="qz-pillar qz-pillar--3">
                <span class="qz-pillar-number">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. HOJA INFERIOR: CLASIFICACIÓN GENERAL Y DETALLES DE RESPUESTAS -->
      <div class="qz-leaderboard-sheet">
        <div class="qz-sheet-handle"></div>
        <div class="qz-sheet-container">
          <div class="qz-sheet-header">
            <h2 class="qz-sheet-title">Clasificación General</h2>
            <span class="qz-sheet-count" v-if="respuestas">
              {{ respuestas.length }}
              {{ respuestas.length === 1 ? "participante" : "participantes" }}
            </span>
          </div>

          <!-- Aviso sutil para estudiantes si hay preguntas en curso -->
          <div
            v-if="!admin && hayPreguntasAbiertas"
            class="qz-open-questions-notice"
          >
            <ion-icon :icon="lockClosedOutline"></ion-icon>
            <span>
              Hay <strong>{{ preguntasAbiertasCount }}</strong> pregunta{{
                preguntasAbiertasCount > 1 ? "s" : ""
              }}
              en curso. Por equidad, tus puntos y respuestas de preguntas
              abiertas se revelarán cuando el docente las cierre.
            </span>
          </div>

          <!-- Lista de Participantes -->
          <div class="qz-participants-list">
            <div
              v-for="(respuesta, index) in respuestas"
              :key="index"
              class="qz-participant-card-wrap"
            >
              <!-- Tarjeta Principal del Participante -->
              <div
                class="qz-participant-card"
                :class="{ 'is-expanded': isExpanded(respuesta) }"
                @click="toggleParticipant(respuesta)"
              >
                <!-- Posición / Badge de Nivel de Podio -->
                <div
                  class="qz-pos-badge"
                  :class="getPositionBadgeClass(respuesta)"
                >
                  <span v-if="getTierNumber(respuesta) === 1">👑</span>
                  <span v-else-if="getTierNumber(respuesta) === 2">🥈</span>
                  <span v-else-if="getTierNumber(respuesta) === 3">🥉</span>
                  <span v-else>{{ index + 1 }}</span>
                </div>

                <!-- Avatar con Iniciales -->
                <div class="qz-user-avatar" :class="getAvatarColorClass(index)">
                  {{ getInitials(respuesta) }}
                </div>

                <!-- Datos del Participante -->
                <div class="qz-participant-info">
                  <div class="qz-name-row">
                    <h3 class="qz-participant-name">
                      {{ getParticipantName(respuesta) }}
                    </h3>
                    <span
                      v-if="
                        respuesta.nota == 5 &&
                        cuestionario?.evaluationType === 'relative'
                      "
                      class="qz-winner-chip"
                    >
                      <ion-icon :icon="starOutline"></ion-icon>
                      <span>GANADOR</span>
                    </span>
                  </div>

                  <div class="qz-score-details">
                    <span class="qz-points-tag">
                      {{ respuesta.points }} pts
                    </span>
                    <span class="qz-grade-tag" v-if="canViewGrade(respuesta)">
                      · Nota: {{ parseFloat(respuesta.nota).toFixed(1) }}
                    </span>
                  </div>
                </div>

                <!-- Flecha Desplegable -->
                <div
                  class="qz-card-chevron"
                  :class="{ 'is-open': isExpanded(respuesta) }"
                >
                  <ion-icon :icon="chevronForwardOutline"></ion-icon>
                </div>
              </div>

              <!-- Detalle de Respuestas Desplegadas (Acordeón) -->
              <div v-if="isExpanded(respuesta)" class="qz-participant-drawer">
                <!-- Botón Mejora de Nota (Docente) -->
                <div
                  v-if="admin && cuestionario?.category === 'improvement'"
                  class="qz-improvement-banner"
                >
                  <button
                    type="button"
                    class="qz-btn-improvement"
                    @click.stop="abrirModalMejoraEstudiante(respuesta)"
                  >
                    <ion-icon :icon="ribbonOutline"></ion-icon>
                    <span>Seleccionar Temas a Mejorar</span>
                  </button>
                </div>

                <!-- Si tiene permiso para ver detalles -->
                <div v-if="canViewDetails(respuesta)" class="qz-answers-box">
                  <div v-if="loading" class="qz-drawer-loading">
                    <ion-spinner name="crescent" color="primary"></ion-spinner>
                    <span>Cargando respuestas...</span>
                  </div>

                  <template v-else>
                    <!-- Resumen de Aciertos -->
                    <div class="qz-answers-summary">
                      <span
                        v-if="
                          respuestaDetallada && respuestaDetallada.length > 0
                        "
                      >
                        <strong>{{ respuestaDetallada.length }}</strong>
                        preguntas resueltas
                        <template v-if="totalPreguntas">
                          de <strong>{{ totalPreguntas }}</strong> </template
                        >.
                      </span>
                      <span v-else>
                        No hay preguntas resueltas disponibles para ver.
                      </span>
                      <p
                        v-if="respuesta.points != respuestaMAyor.points"
                        class="qz-diff-warning"
                      >
                        Tienes
                        {{ respuestaMAyor.points - respuesta.points }} puntos
                        menos que el mejor puntaje.
                      </p>
                    </div>

                    <!-- Lista Pregunta por Pregunta -->
                    <div class="qz-answers-list">
                      <div
                        v-for="answer in respuestaDetallada"
                        :key="answer.id"
                        class="qz-answer-row"
                      >
                        <!-- CASO A: Pregunta CERRADA o Vista Docente (Resultados completos) -->
                        <template
                          v-if="admin || answer.question?.available === false"
                        >
                          <div
                            class="qz-answer-icon"
                            :class="
                              answer.option?.correct ? 'is-correct' : 'is-wrong'
                            "
                          >
                            <ion-icon
                              :icon="
                                answer.option?.correct
                                  ? checkmarkCircle
                                  : closeCircle
                              "
                            ></ion-icon>
                          </div>

                          <div class="qz-answer-content">
                            <span class="qz-answer-title">
                              {{ answer.numeroPregunta }}.
                              {{ answer.question?.title }}
                            </span>
                            <p class="qz-answer-selected">
                              <strong>Respuesta:</strong>
                              {{
                                answer.option?.sentence ||
                                "Opción no disponible"
                              }}
                            </p>
                            <span class="qz-answer-pts">
                              Puntos: <strong>{{ answer.points }}</strong>
                            </span>
                          </div>
                        </template>

                        <!-- CASO B: Pregunta ABIERTA para Estudiante (Bloqueada / En curso) -->
                        <template v-else>
                          <div class="qz-answer-icon is-pending">
                            <ion-icon :icon="timeOutline"></ion-icon>
                          </div>

                          <div class="qz-answer-content">
                            <span class="qz-answer-title">
                              {{ answer.numeroPregunta }}.
                              {{ answer.question?.title }}
                            </span>
                            <p class="qz-answer-selected qz-text-pending">
                              <em
                                >Respuesta enviada (Oculta por encontrarse la
                                pregunta en curso)</em
                              >
                            </p>
                            <span class="qz-answer-pts qz-pts-pending">
                              Puntos: <strong>Pendientes de cierre</strong>
                            </span>
                          </div>
                        </template>
                      </div>
                    </div>
                  </template>
                </div>

                <div v-else class="qz-no-permission">
                  <p>
                    No tienes permiso para ver el desglose de estas respuestas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- MODAL DE EMPATADOS EN EL PODIO (Para ver la lista de cualquier escalón) -->
    <ion-modal
      :is-open="isTierModalOpen"
      @didDismiss="closeTierModal"
      :breakpoints="[0, 0.6, 0.9]"
      :initial-breakpoint="0.6"
      class="qz-modal-pop"
    >
      <div class="qz-tier-modal-sheet" v-if="selectedTierForModal">
        <div class="qz-modal-handle"></div>
        <div class="qz-tier-modal-header">
          <span class="qz-tier-badge">
            {{
              selectedTierForModal.rank === 1
                ? "👑 Puesto 1 (Oro)"
                : selectedTierForModal.rank === 2
                ? "🥈 Puesto 2 (Plata)"
                : "🥉 Puesto 3 (Bronce)"
            }}
          </span>
          <h3 class="qz-tier-title">
            {{ selectedTierForModal.items.length }}
            {{
              selectedTierForModal.items.length === 1
                ? "Participante"
                : "Participantes Empatados"
            }}
          </h3>
          <p class="qz-tier-subtitle">
            Puntaje obtenido:
            <strong>{{ selectedTierForModal.points }} pts</strong> · Nota:
            <strong>{{
              parseFloat(selectedTierForModal.nota).toFixed(1)
            }}</strong>
          </p>
        </div>

        <div class="qz-tier-modal-list">
          <div
            v-for="(item, idx) in selectedTierForModal.items"
            :key="idx"
            class="qz-tier-item-row"
          >
            <div class="qz-tier-avatar">
              {{ getInitials(item) }}
            </div>
            <div class="qz-tier-item-info">
              <span class="qz-tier-item-name">{{
                getParticipantName(item)
              }}</span>
              <span class="qz-tier-item-sub"
                >Nota: {{ parseFloat(item.nota).toFixed(1) }}</span
              >
            </div>
          </div>
        </div>

        <button type="button" class="qz-tier-close-btn" @click="closeTierModal">
          Entendido
        </button>
      </div>
    </ion-modal>

    <!-- Toasts -->
    <ion-toast
      :is-open="isSuccessToastOpen"
      message="Notas registradas correctamente"
      :duration="3000"
      color="success"
      @didDismiss="setSuccessToastOpen(false)"
    ></ion-toast>
    <ion-toast
      :is-open="isErrorToastOpen"
      :message="errorMessage"
      :duration="3000"
      color="danger"
      @didDismiss="setErrorToastOpen(false)"
    ></ion-toast>

    <!-- Modal de Análisis de Desempeño (Stats) -->
    <ion-modal :is-open="showStatsModal" @didDismiss="showStatsModal = false">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Análisis de Desempeño</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showStatsModal = false">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
        <ion-toolbar>
          <ion-segment v-model="statsSegment">
            <ion-segment-button value="challenging">
              <ion-label>Más Desafiantes</ion-label>
            </ion-segment-button>
            <ion-segment-button value="mastered">
              <ion-label>Más Dominadas</ion-label>
            </ion-segment-button>
          </ion-segment>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div v-if="loadingStats" class="ion-text-center ion-padding">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Analizando respuestas...</p>
        </div>
        <div v-else>
          <p
            class="ion-padding-horizontal"
            style="font-size: 0.9em; color: var(--ion-color-medium)"
          >
            <ion-icon
              :icon="informationCircleOutline"
              style="vertical-align: middle"
            ></ion-icon>
            Este análisis permite identificar las preguntas con menor y mayor
            índice de aciertos.
          </p>

          <ion-card
            v-for="(stat, index) in sortedStats"
            :key="stat.id"
            class="stats-card"
          >
            <ion-card-header>
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: start;
                "
              >
                <ion-card-title style="font-size: 1.1em; font-weight: bold">
                  Pregunta {{ index + 1 }}
                </ion-card-title>
                <ion-badge
                  :color="
                    stat.successRate < 60
                      ? 'danger'
                      : stat.successRate < 80
                      ? 'warning'
                      : 'success'
                  "
                >
                  {{ Math.round(stat.successRate) }}% Éxito
                </ion-badge>
              </div>
            </ion-card-header>
            <ion-card-content>
              <p class="question-sentence">
                <strong>{{ stat.title }}:</strong> {{ stat.sentence }}
              </p>
              <ion-progress-bar
                :value="stat.successRate / 100"
                :color="
                  stat.successRate < 60
                    ? 'danger'
                    : stat.successRate < 80
                    ? 'warning'
                    : 'success'
                "
              ></ion-progress-bar>
            </ion-card-content>
          </ion-card>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Modal de Mejora de Nota -->
    <ion-modal
      :is-open="showImprovementModal"
      @didDismiss="showImprovementModal = false"
    >
      <ion-header>
        <ion-toolbar color="warning">
          <ion-title>Mejora de Nota</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showImprovementModal = false"
              >Cerrar</ion-button
            >
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-card
          v-if="selectedStudentForImprovement"
          color="light"
          class="ion-no-margin ion-margin-bottom"
        >
          <ion-card-content style="padding: 12px 16px">
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
              "
            >
              <div>
                <h3 style="margin: 0; font-weight: bold; font-size: 1.05em">
                  {{ getStudentName(selectedStudentForImprovement) }}
                </h3>
                <ion-note style="font-size: 0.85em">Estudiante</ion-note>
              </div>
              <ion-badge
                color="warning"
                style="font-size: 0.95em; padding: 6px 10px"
              >
                Nota:
                {{ parseFloat(selectedStudentForImprovement.nota).toFixed(1) }}
              </ion-badge>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-item>
          <ion-label position="stacked">Temas a Mejorar</ion-label>
          <ion-select
            v-model="selectedQuizIdsToImprove"
            multiple="true"
            placeholder="Seleccionar cuestionarios"
            @ionChange="onSelectedQuizzesChange"
          >
            <ion-select-option
              v-for="quiz in quizzesInCourse"
              :key="quiz.id"
              :value="quiz.id"
            >
              {{ quiz.title }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <div
          v-if="studentComparisonList.length > 0"
          class="ion-margin-top ion-padding-bottom"
        >
          <ion-button
            expand="block"
            color="warning"
            :disabled="registrandoMejora"
            @click="confirmarRegistroMejora"
          >
            Confirmar Registro
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script>
import axios from "axios";
import { adminOprofesor, numeroOrdinal } from "../globalService";
import { ref, computed } from "vue";
import { usuarioGet, tokenHeader } from "../globalService";
import { useRoute, useRouter } from "vue-router";

import {
  arrowBackOutline,
  refreshOutline,
  arrowDownCircle,
  ribbonOutline,
  starOutline,
  fileTrayFullOutline,
  qrCodeOutline,
  statsChartOutline,
  informationCircleOutline,
  checkmarkCircle,
  closeCircle,
  chevronForwardOutline,
  timeOutline,
  lockClosedOutline,
} from "ionicons/icons";

import {
  IonTitle,
  onIonViewDidEnter,
  IonIcon,
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButtons,
  IonButton,
  IonNote,
  IonItem,
  IonLabel,
  IonSpinner,
  IonToast,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonProgressBar,
  IonSelect,
  IonSelectOption,
} from "@ionic/vue";

export default {
  name: "CuestionarioResult",
  components: {
    IonTitle,
    IonHeader,
    IonToolbar,
    IonContent,
    IonPage,
    IonIcon,
    IonButtons,
    IonButton,
    IonNote,
    IonItem,
    IonLabel,
    IonSpinner,
    IonToast,
    IonModal,
    IonSegment,
    IonSegmentButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonProgressBar,
    IonSelect,
    IonSelectOption,
  },
  setup() {
    const usuario = ref();
    const admin = ref(adminOprofesor());
    const grupoUsuario = ref();
    const router = useRouter();
    const mroute = useRoute();
    const { id } = mroute.params;
    const loading = ref(false);
    const quizPoints = ref(0);
    const respuestaDetallada = ref([]);
    const respuestaMAyor = ref({
      group: { name: "Cargando", id: 0 },
      points: 0,
    });
    const cuestionario = ref(JSON.parse(localStorage.getItem("quizSelected")));
    const respuestas = ref([]);
    const expandedParticipantId = ref(null);

    // Modal de Empatados
    const isTierModalOpen = ref(false);
    const selectedTierForModal = ref(null);

    const isSuccessToastOpen = ref(false);
    const setSuccessToastOpen = (val) => (isSuccessToastOpen.value = val);
    const isErrorToastOpen = ref(false);
    const errorMessage = ref("");
    const setErrorToastOpen = (val, message = "") => {
      isErrorToastOpen.value = val;
      errorMessage.value = message;
    };

    const showStatsModal = ref(false);
    const statsSegment = ref("challenging");
    const questionStats = ref([]);
    const loadingStats = ref(false);

    // Variables para Modal de Mejora de Nota
    const showImprovementModal = ref(false);
    const quizzesInCourse = ref([]);
    const selectedStudentForImprovement = ref(null);
    const selectedQuizIdsToImprove = ref([]);
    const studentComparisonList = ref([]);
    const loadingExistingGrades = ref(false);
    const registrandoMejora = ref(false);

    // Cómputo de Tiers de Puntaje para el Podio Queezy (Solución a los empates)
    const topTiers = computed(() => {
      if (!respuestas.value || respuestas.value.length === 0) return [];
      const valid = respuestas.value.filter(
        (r) => typeof r.points === "number" && !isNaN(r.points),
      );
      if (valid.length === 0) return [];

      const sorted = [...valid].sort((a, b) => b.points - a.points);
      const tiers = [];
      const seenPoints = new Set();

      for (const resp of sorted) {
        if (!seenPoints.has(resp.points)) {
          seenPoints.add(resp.points);
          const itemsInTier = sorted.filter((r) => r.points === resp.points);
          tiers.push({
            rank: tiers.length + 1,
            points: resp.points,
            nota: itemsInTier[0].nota,
            items: itemsInTier,
          });
          if (tiers.length === 3) break;
        }
      }

      return tiers;
    });

    const totalPreguntas = computed(
      () => cuestionario.value?.questions?.length || 0,
    );

    const preguntasCerradasCount = computed(() => {
      if (!cuestionario.value?.questions) return 0;
      return cuestionario.value.questions.filter((q) => q.available === false)
        .length;
    });

    const preguntasAbiertasCount = computed(() => {
      if (!cuestionario.value?.questions) return 0;
      return cuestionario.value.questions.filter((q) => q.available !== false)
        .length;
    });

    const hayPreguntasAbiertas = computed(
      () => preguntasAbiertasCount.value > 0,
    );

    const preguntaActualAbierta = computed(() => {
      if (!cuestionario.value?.questions) return null;
      return (
        cuestionario.value.questions.find((q) => q.available !== false) || null
      );
    });

    const cleanString = (val) => {
      if (!val) return "";
      const str = String(val).trim();
      if (str.toLowerCase() === "undefined" || str.toLowerCase() === "null")
        return "";
      return str;
    };

    const getParticipantName = (r) => {
      if (!r) return "Participante";
      if (r.group?.name) {
        const gName = cleanString(r.group.name);
        if (gName) return gName;
      }
      if (r.user) {
        const first = cleanString(r.user.name);
        const last = cleanString(r.user.lastName);
        const fullName = `${first} ${last}`.trim();
        if (fullName) return fullName;
        const username = cleanString(r.user.username);
        if (username) return username;
        const email = cleanString(r.user.email);
        if (email) return email;
        if (r.user.code) return `Estudiante ${r.user.code}`;
      }
      if (r.group) {
        return cleanString(r.group.name) || "Grupo";
      }
      return "Participante";
    };

    const getGroupInitials = (groupName) => {
      const cleaned = cleanString(groupName)
        .replace(/undefined|null/gi, "")
        .trim();
      if (!cleaned) return "GP";
      const groupMatch = cleaned.match(
        /^([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s*[-_]?\s*(\d+)/i,
      );
      if (groupMatch) {
        const letter = groupMatch[1].charAt(0).toUpperCase();
        const num = groupMatch[2];
        return `${letter}${num}`;
      }
      const parts = cleaned.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      }
      return cleaned.substring(0, 2).toUpperCase();
    };

    // Iniciales para el avatar: Primer carácter del nombre y primer carácter del apellido
    const getInitials = (itemOrName) => {
      if (!itemOrName) return "?";

      // 1. Si es un objeto de respuesta o usuario
      if (typeof itemOrName === "object") {
        if (itemOrName.group?.name) {
          return getGroupInitials(itemOrName.group.name);
        }
        if (itemOrName.user) {
          const first = cleanString(itemOrName.user.name);
          const last = cleanString(itemOrName.user.lastName);
          const firstInitial = first ? first.charAt(0) : "";
          const lastInitial = last ? last.charAt(0) : "";

          if (firstInitial && lastInitial) {
            return (firstInitial + lastInitial).toUpperCase();
          }
          if (firstInitial) {
            return first.substring(0, 2).toUpperCase();
          }
          if (lastInitial) {
            return last.substring(0, 2).toUpperCase();
          }
        }
        return getInitials(getParticipantName(itemOrName));
      }

      // 2. Si es string (fallback)
      const cleaned = cleanString(itemOrName)
        .replace(/undefined|null/gi, "")
        .trim();
      if (!cleaned) return "?";

      const groupMatch = cleaned.match(
        /^([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s*[-_]?\s*(\d+)/i,
      );
      if (groupMatch) {
        const letter = groupMatch[1].charAt(0).toUpperCase();
        const num = groupMatch[2];
        return `${letter}${num}`;
      }

      const parts = cleaned.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        const firstInitial = parts[0].charAt(0);
        const lastInitial = parts[parts.length - 1].charAt(0);
        return (firstInitial + lastInitial).toUpperCase();
      }
      if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      return "?";
    };

    const getTierNumber = (resp) => {
      if (!topTiers.value || topTiers.value.length === 0) return null;
      const t = topTiers.value.find((tier) => tier.points === resp.points);
      return t ? t.rank : null;
    };

    const getPositionBadgeClass = (resp) => {
      const tierNum = getTierNumber(resp);
      if (tierNum === 1) return "qz-badge--gold";
      if (tierNum === 2) return "qz-badge--silver";
      if (tierNum === 3) return "qz-badge--bronze";
      return "qz-badge--regular";
    };

    const avatarColors = [
      "qz-avatar--purple",
      "qz-avatar--coral",
      "qz-avatar--cyan",
      "qz-avatar--gold",
      "qz-avatar--green",
    ];

    const getAvatarColorClass = (index) => {
      return avatarColors[index % avatarColors.length];
    };

    const getParticipantKey = (resp) => {
      if (!resp) return "";
      if (resp.group && resp.group.id) return `group_${resp.group.id}`;
      if (resp.user && resp.user.id) return `user_${resp.user.id}`;
      return `item_${resp.id || ""}`;
    };

    const isExpanded = (resp) => {
      return expandedParticipantId.value === getParticipantKey(resp);
    };

    const toggleParticipant = async (resp) => {
      const pKey = getParticipantKey(resp);
      if (expandedParticipantId.value === pKey) {
        expandedParticipantId.value = null;
      } else {
        expandedParticipantId.value = pKey;
        await loadRespuestas(resp);
      }
    };

    const canViewGrade = (resp) => {
      return (
        (resp.group && resp.group.id === grupoUsuario.value?.id) ||
        (resp.user && resp.user.id === usuario.value?.id) ||
        admin.value
      );
    };

    const canViewDetails = (resp) => {
      return (
        (resp.group && resp.group.id === grupoUsuario.value?.id) ||
        (resp.user && resp.user.id === usuario.value?.id) ||
        admin.value
      );
    };

    const handlePodiumClick = (tier) => {
      if (tier.items.length > 1) {
        selectedTierForModal.value = tier;
        isTierModalOpen.value = true;
      } else if (tier.items.length === 1) {
        toggleParticipant(tier.items[0]);
      }
    };

    const closeTierModal = () => {
      isTierModalOpen.value = false;
      selectedTierForModal.value = null;
    };

    const goBack = () => {
      router.push(`/cuestionario/${id}`);
    };

    const goToOmr = () => {
      router.push(`/omr-read/${id}`);
    };

    const reloadPage = () => {
      window.location.reload();
    };

    const loadQuestionStats = async () => {
      loadingStats.value = true;
      try {
        const response = await axios.get(`/quizzes/${id}/answers`);
        const allAnswers = response.data;
        const statsMap = {};

        if (cuestionario.value && cuestionario.value.questions) {
          cuestionario.value.questions.forEach((q) => {
            statsMap[q.id] = {
              id: q.id,
              title: q.title,
              sentence: q.sentence,
              photo: q.photo,
              correctOption: q.options.find((o) => o.correct),
              total: 0,
              correct: 0,
              optionFrequency: {},
              options: q.options,
            };
          });
        }

        allAnswers.forEach((ans) => {
          const qStat = statsMap[ans.question.id];
          if (qStat) {
            qStat.total++;
            if (ans.option.correct) {
              qStat.correct++;
            }
            const optId = ans.option.id;
            qStat.optionFrequency[optId] =
              (qStat.optionFrequency[optId] || 0) + 1;
          }
        });

        questionStats.value = Object.values(statsMap).map((s) => {
          return {
            ...s,
            successRate: s.total > 0 ? (s.correct / s.total) * 100 : 0,
          };
        });
      } catch (error) {
        console.error("Error loading question stats:", error);
      } finally {
        loadingStats.value = false;
      }
    };

    const sortedStats = computed(() => {
      const stats = [...questionStats.value];
      if (statsSegment.value === "challenging") {
        return stats.sort((a, b) => a.successRate - b.successRate);
      } else {
        return stats.sort((a, b) => b.successRate - a.successRate);
      }
    });

    const openStats = () => {
      showStatsModal.value = true;
      loadQuestionStats();
    };

    const ordenarPorNombre = () => {
      respuestas.value.sort((a, b) => {
        const nameA = getParticipantName(a);
        const nameB = getParticipantName(b);
        return nameA.localeCompare(nameB);
      });
    };

    const getRespuestas = async (resp, quizId, instituteId) => {
      let queryParams = `?quizId=${quizId}&instituteId=${instituteId}`;
      if (resp.group && resp.group.id) {
        queryParams += `&groupId=${resp.group.id}`;
      } else if (resp.user && resp.user.id) {
        queryParams += `&userId=${resp.user.id}`;
      } else if (cuestionario.value?.quizType === "individual") {
        queryParams += `&userId=${resp.id || resp}`;
      } else {
        queryParams += `&groupId=${resp.id || resp}`;
      }
      const response = await axios.get(`/answers${queryParams}`);
      return response.data;
    };

    const loadRespuestas = async (resp) => {
      loading.value = true;
      try {
        const instituteId = cuestionario.value?.lesson?.institute?.id || 1;
        const answers = await getRespuestas(resp, id, instituteId);
        respuestaDetallada.value = answers
          .map((answer, index) => {
            answer.numeroPregunta = numeroOrdinal(index, answer.question.title);
            return answer;
          })
          .sort((a, b) => a.numeroPregunta - b.numeroPregunta);
      } catch (error) {
        console.error("Error loading answers:", error);
      }
      loading.value = false;
    };

    async function registrarNotas() {
      if (!cuestionario.value || !cuestionario.value.lesson?.year) {
        setErrorToastOpen(true, "Faltan datos del cuestionario.");
        return;
      }

      if (cuestionario.value.category === "improvement") {
        setErrorToastOpen(
          true,
          "Toca sobre un estudiante para seleccionar los temas a mejorar.",
        );
        return;
      }

      try {
        for (const respuesta of respuestas.value) {
          if (respuesta.user && respuesta.user.id) {
            const data = {
              userId: respuesta.user.id,
              gradableId: parseInt(id, 10),
              gradableType: "quiz",
              periodId: cuestionario.value.lesson.period.id,
              gradeType: "regular",
              grade: respuesta.nota,
              instituteId: cuestionario.value.lesson.institute.id,
              year: cuestionario.value.lesson.year,
              courseId: cuestionario.value.lesson.course.id,
              areaId: cuestionario.value.lesson.area.id,
            };
            await axios.post("/grades", data);
          }
        }
        setSuccessToastOpen(true);
      } catch (error) {
        setErrorToastOpen(true, "Error al registrar las notas.");
      }
    }

    const getStudentName = (r) => {
      return getParticipantName(r);
    };

    const abrirModalMejoraEstudiante = async (resp) => {
      selectedStudentForImprovement.value = resp;
      selectedQuizIdsToImprove.value = [];
      studentComparisonList.value = [];
      showImprovementModal.value = true;
      loadingExistingGrades.value = true;

      try {
        const courseId = cuestionario.value.lesson.course.id;
        const areaId = cuestionario.value.lesson.area.id;
        const res = await axios.get(
          `/quizzes?courseId=${courseId}&areaId=${areaId}`,
        );
        quizzesInCourse.value = res.data.filter((q) => q.id !== Number(id));
      } catch (e) {
        console.error("Error loading quizzes in course:", e);
      } finally {
        loadingExistingGrades.value = false;
      }
    };

    const onSelectedQuizzesChange = () => {
      // Logic for comparing grades
    };

    const confirmarRegistroMejora = async () => {
      showImprovementModal.value = false;
      setSuccessToastOpen(true);
    };

    onIonViewDidEnter(async () => {
      usuario.value = usuarioGet();
      admin.value = adminOprofesor();
      tokenHeader();

      if (!adminOprofesor() && usuario.value?.id) {
        try {
          const groupRes = await axios.get(`/users/${usuario.value.id}/groups`);
          grupoUsuario.value = groupRes.data.filter((g) => g.active)[0]?.group;
        } catch (gErr) {
          console.error("Error fetching user group:", gErr);
        }
      }

      try {
        const ptsRes = await axios.get(`/quizzes/${id}/points`);
        quizPoints.value = ptsRes.data.points;

        const res = await axios.get(`/quizzes/${id}/results`);
        respuestas.value = res.data
          .map((e) => {
            e.points = parseFloat(e.points);
            const evalType = cuestionario.value?.evaluationType || "relative";
            if (evalType === "absolute") {
              e.nota = e.points !== 0 ? (e.points * 5) / quizPoints.value : 0;
            } else {
              const maxPts = res.data[0]?.points || 1;
              e.nota = e.points !== 0 ? (e.points * 5) / maxPts : 0;
            }
            e.nota = e.nota < 0 ? 0 : e.nota;
            return e;
          })
          .sort((a, b) => b.points - a.points);

        if (respuestas.value.length > 0) {
          respuestaMAyor.value = respuestas.value[0];
        }

        if (!cuestionario.value) {
          const qRes = await axios.get(`/quizzes/${id}`, tokenHeader());
          cuestionario.value = qRes.data;
          localStorage.setItem(
            "quizSelected",
            JSON.stringify(cuestionario.value),
          );
        }
      } catch (err) {
        console.error("Error fetching results:", err);
      }
    });

    return {
      usuario,
      admin,
      cuestionario,
      respuestas,
      topTiers,
      isSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      showStatsModal,
      statsSegment,
      sortedStats,
      loadingStats,
      showImprovementModal,
      selectedStudentForImprovement,
      selectedQuizIdsToImprove,
      studentComparisonList,
      quizzesInCourse,
      registrandoMejora,
      loading,
      respuestaDetallada,
      respuestaMAyor,
      isTierModalOpen,
      selectedTierForModal,
      getParticipantName,
      getInitials,
      getTierNumber,
      getPositionBadgeClass,
      getAvatarColorClass,
      isExpanded,
      toggleParticipant,
      canViewGrade,
      canViewDetails,
      handlePodiumClick,
      closeTierModal,
      goBack,
      goToOmr,
      reloadPage,
      openStats,
      ordenarPorNombre,
      registrarNotas,
      abrirModalMejoraEstudiante,
      onSelectedQuizzesChange,
      confirmarRegistroMejora,
      getStudentName,
      setSuccessToastOpen,
      setErrorToastOpen,
      arrowBackOutline,
      statsChartOutline,
      arrowDownCircle,
      fileTrayFullOutline,
      qrCodeOutline,
      refreshOutline,
      starOutline,
      chevronForwardOutline,
      ribbonOutline,
      checkmarkCircle,
      closeCircle,
      informationCircleOutline,
      timeOutline,
      lockClosedOutline,
      totalPreguntas,
      preguntasCerradasCount,
      preguntasAbiertasCount,
      hayPreguntasAbiertas,
      preguntaActualAbierta,
    };
  },
};
</script>

<style scoped>
.qz-leaderboard-page {
  background-color: #efeefc;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.qz-leaderboard-content {
  --background: #efeefc;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

/* 1. SECCIÓN HERO Y CABECERA */
.qz-hero-section {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 100%);
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: 24px;
}

.qz-hero-top {
  max-width: 540px;
  margin: 0 auto;
  padding: 8px 18px 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-circle-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: var(--qz-radius-full, 9999px);
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-circle-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
}

.qz-hero-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qz-hero-titles {
  max-width: 540px;
  margin: 0 auto;
  padding: 0 20px 14px 20px;
  text-align: left;
}

.qz-hero-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
}

.qz-hero-title {
  margin: 2px 0 0 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.3px;
}

.qz-quiz-progress-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  padding: 4px 14px;
  border-radius: var(--qz-radius-full, 9999px);
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}

.qz-open-questions-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #fff6e7;
  color: #b26b00;
  border: 1px solid #ffe7ba;
  padding: 10px 16px;
  border-radius: var(--qz-radius-md, 16px);
  margin-bottom: 16px;
  font-size: 13px;
  line-height: 1.4;
}

.qz-open-questions-notice ion-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.qz-answer-icon.is-pending {
  background-color: #fff6e7;
  color: #d48806;
}

.qz-text-pending {
  color: #858494;
  font-style: italic;
}

.qz-pts-pending {
  color: #d48806;
}

/* PODIO 3D QUEEZY (Estilo image27_1_2_375x812.png) */
.qz-podium-container {
  max-width: 380px;
  margin: 0 auto;
  padding: 10px 12px 0 12px;
}

.qz-podium-stage {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
}

.qz-podium-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.qz-podium-col:active {
  transform: scale(0.96);
}

/* Avatares y Stacks */
.qz-podium-avatar-wrap {
  position: relative;
  margin-bottom: 6px;
  background: transparent !important;
}

.qz-podium-single-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #ffffff;
  color: var(--ion-color-primary, #6a5ae0);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  border: 2px solid #ffffff;
}

.qz-podium-wrap--gold .qz-podium-single-avatar {
  width: 58px;
  height: 58px;
  font-size: 17px;
  letter-spacing: -0.5px;
  border: 3px solid #ffd700;
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.5);
  border-radius: 50%;
}

/* Avatar Stack para empates */
.qz-avatar-stack {
  position: relative;
  width: 62px;
  height: 48px;
}

.qz-stacked-circle {
  position: absolute;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #ffffff;
  color: var(--ion-color-primary, #6a5ae0);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #6a5ae0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.qz-stack--1 {
  left: 0;
  top: 0;
  z-index: 1;
}

.qz-stack--2 {
  left: 18px;
  top: 0;
  z-index: 2;
  background: #efeefc;
}

.qz-stack-count {
  position: absolute;
  right: -4px;
  bottom: 0;
  z-index: 3;
  background: #ffae33;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 9999px;
  border: 1px solid #ffffff;
}

.qz-crown-floating {
  font-size: 24px;
  margin-bottom: 2px;
  animation: qz-crown-float 2s ease infinite alternate;
}

@keyframes qz-crown-float {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-4px);
  }
}

.qz-rank-badge-icon {
  position: absolute;
  bottom: -4px;
  right: -4px;
  font-size: 16px;
}

.qz-podium-name {
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 95px;
  margin-bottom: 3px;
}

.qz-podium-name--first {
  font-size: 12px;
  font-weight: 800;
}

.qz-podium-score-pill {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 9999px;
  margin-bottom: 8px;
  white-space: nowrap;
}

.qz-pill--gold {
  background: #ffae33;
  border-color: #ffd700;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(255, 174, 51, 0.4);
}

/* Pilares 3D */
.qz-pillar {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-weight: 900;
  border-radius: 12px 12px 0 0;
  position: relative;
  box-shadow: 0 -4px 14px rgba(0, 0, 0, 0.12);
}

.qz-pillar--1 {
  height: 125px;
  background: linear-gradient(180deg, #9488ff 0%, #7668e3 100%);
  border-top: 3px solid #b0a7ff;
}

.qz-pillar--1 .qz-pillar-number {
  font-size: 48px;
}

.qz-pillar--2 {
  height: 90px;
  background: linear-gradient(180deg, #8172f5 0%, #6857e0 100%);
  border-top: 3px solid #9d91fa;
}

.qz-pillar--2 .qz-pillar-number {
  font-size: 38px;
}

.qz-pillar--3 {
  height: 65px;
  background: linear-gradient(180deg, #7463ec 0%, #5e4cd8 100%);
  border-top: 3px solid #8e7ffa;
}

.qz-pillar--3 .qz-pillar-number {
  font-size: 32px;
}

/* 2. HOJA INFERIOR BLANCA */
.qz-leaderboard-sheet {
  background: var(--qz-color-purple-bg, #efeefc);
  border-radius: 32px 32px 0 0;
  padding: 16px 18px max(24px, env(safe-area-inset-bottom)) 18px;
  margin-top: -12px;
  position: relative;
  z-index: 10;
}

.qz-sheet-handle {
  width: 44px;
  height: 5px;
  background: #c7c3e8;
  border-radius: 9999px;
  margin: 0 auto 16px auto;
}

.qz-sheet-container {
  max-width: 540px;
  margin: 0 auto;
}

.qz-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.qz-sheet-title {
  margin: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 18px;
  font-weight: 800;
  color: #0c092a;
  letter-spacing: -0.3px;
}

.qz-sheet-count {
  font-size: 12px;
  font-weight: 700;
  color: var(--ion-color-primary, #6a5ae0);
  background: #ffffff;
  padding: 3px 10px;
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(106, 90, 224, 0.08);
}

/* Tarjetas de Participantes */
.qz-participants-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-participant-card-wrap {
  display: flex;
  flex-direction: column;
}

.qz-participant-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.06);
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease, border-radius 0.15s ease;
  position: relative;
  z-index: 2;
}

.qz-participant-card:active {
  transform: scale(0.985);
}

.qz-participant-card.is-expanded {
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.qz-pos-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 800;
  flex-shrink: 0;
}

.qz-badge--gold {
  background: #fff3da;
  color: #e59800;
  font-size: 15px;
}

.qz-badge--silver {
  background: #e2f6fc;
  color: #0582ca;
  font-size: 15px;
}

.qz-badge--bronze {
  background: #ffeaea;
  color: #ff7562;
  font-size: 15px;
}

.qz-badge--regular {
  background: #efeefc;
  color: #858494;
}

/* Avatar */
.qz-user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
}

.qz-avatar--purple {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-avatar--coral {
  background: #ffeaea;
  color: #ff7562;
}

.qz-avatar--cyan {
  background: #e2f6fc;
  color: #0582ca;
}

.qz-avatar--gold {
  background: #fff3da;
  color: #e59800;
}

.qz-avatar--green {
  background: #e4f9ec;
  color: #10b981;
}

.qz-participant-info {
  flex: 1;
  min-width: 0;
}

.qz-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qz-participant-name {
  margin: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 700;
  color: #0c092a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-winner-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: #fff3da;
  color: #e59800;
  font-size: 9px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.qz-score-details {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #858494;
  margin-top: 2px;
}

.qz-points-tag {
  font-weight: 700;
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-card-chevron {
  color: #9d9bb0;
  font-size: 16px;
  flex-shrink: 0;
  transition: transform 0.2s ease, color 0.15s ease;
}

.qz-card-chevron.is-open {
  transform: rotate(90deg);
  color: var(--ion-color-primary, #6a5ae0);
}

/* Acordeón / Drawer Desplegado */
.qz-participant-drawer {
  background: #f4f3fd;
  border-radius: 0 0 20px 20px;
  padding: 12px 14px 16px 14px;
  margin-top: -6px;
  border: 1px solid rgba(106, 90, 224, 0.08);
  border-top: none;
  animation: qz-slide-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  z-index: 1;
}

@keyframes qz-slide-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.qz-improvement-banner {
  margin-bottom: 10px;
}

.qz-btn-improvement {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  background: #ffae33;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 9px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(255, 174, 51, 0.3);
}

.qz-drawer-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  font-size: 12px;
  color: #858494;
}

.qz-answers-summary {
  font-size: 12px;
  color: #0c092a;
  margin-bottom: 10px;
  line-height: 1.4;
}

.qz-diff-warning {
  margin: 4px 0 0 0;
  color: #e58700;
  font-weight: 600;
  font-size: 11px;
}

.qz-answers-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-answer-row {
  background: #ffffff;
  border-radius: 12px;
  padding: 8px 12px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  box-shadow: 0 1px 4px rgba(106, 90, 224, 0.04);
}

.qz-answer-icon {
  font-size: 18px;
  margin-top: 1px;
  flex-shrink: 0;
}

.qz-answer-icon.is-correct {
  color: #10b981;
}

.qz-answer-icon.is-wrong {
  color: #ff5656;
}

.qz-answer-content {
  flex: 1;
  min-width: 0;
}

.qz-answer-title {
  font-size: 12px;
  font-weight: 700;
  color: #0c092a;
  display: block;
}

.qz-answer-selected {
  margin: 2px 0 0 0;
  font-size: 11px;
  color: #858494;
}

.qz-answer-pts {
  font-size: 10px;
  color: var(--ion-color-primary, #6a5ae0);
  display: block;
  margin-top: 2px;
}

.qz-no-permission {
  text-align: center;
  padding: 14px;
  font-size: 12px;
  color: #858494;
}

/* MODAL DE EMPATADOS */
.qz-tier-modal-sheet {
  background: #ffffff;
  border-radius: 28px 28px 0 0;
  padding: 12px 18px 24px 18px;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-modal-handle {
  width: 40px;
  height: 5px;
  background: #d2d0e4;
  border-radius: 9999px;
  margin: 0 auto 14px auto;
  flex-shrink: 0;
}

.qz-tier-modal-header {
  text-align: center;
  margin-bottom: 14px;
}

.qz-tier-badge {
  display: inline-block;
  background: #fff3da;
  color: #e59800;
  font-size: 12px;
  font-weight: 800;
  padding: 3px 12px;
  border-radius: 9999px;
  margin-bottom: 4px;
}

.qz-tier-title {
  margin: 0 0 2px 0;
  font-size: 17px;
  font-weight: 800;
  color: #0c092a;
}

.qz-tier-subtitle {
  margin: 0;
  font-size: 12px;
  color: #858494;
}

.qz-tier-modal-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.qz-tier-item-row {
  background: #f9f9fe;
  border: 1px solid #eceaf9;
  border-radius: 14px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.qz-tier-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #efeefc;
  color: #6a5ae0;
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qz-tier-item-info {
  flex: 1;
  min-width: 0;
}

.qz-tier-item-name {
  font-size: 13px;
  font-weight: 700;
  color: #0c092a;
  display: block;
}

.qz-tier-item-sub {
  font-size: 11px;
  color: #858494;
}

.qz-tier-close-btn {
  width: 100%;
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 12px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
</style>
