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
                    <span
                      v-if="hasScan(respuesta)"
                      class="qz-scan-pill-badge"
                      title="Hoja OMR digitalizada disponible"
                    >
                      <ion-icon :icon="cameraOutline"></ion-icon>
                      <span>OMR</span>
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
                <!-- Botón Evidencia OMR Escaneada -->
                <div
                  v-if="hasScan(respuesta)"
                  class="qz-scan-evidence-banner"
                >
                  <button
                    type="button"
                    class="qz-btn-view-scan"
                    @click.stop="openScanModal(respuesta)"
                  >
                    <ion-icon :icon="cameraOutline"></ion-icon>
                    <span>Ver Hoja OMR Escaneada</span>
                    <span
                      class="qz-scan-count-tag"
                      v-if="getScansForParticipant(respuesta).length > 1"
                    >
                      {{ getScansForParticipant(respuesta).length }} hojas
                    </span>
                  </button>
                </div>

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
      :message="successMessage"
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

    <!-- Modal de Mejora de Nota (Queezy UI) -->
    <ion-modal
      :is-open="showImprovementModal"
      @didDismiss="showImprovementModal = false"
      class="qz-improvement-modal"
    >
      <div class="qz-modal-sheet">
        <!-- Barra de Cabecera Modal -->
        <div class="qz-modal-header-bar">
          <div class="qz-modal-header-texts">
            <span class="qz-modal-tag">
              MEJORA DE NOTA ·
              {{ cuestionario?.lesson?.course?.name || "CURSO" }} -
              {{ cuestionario?.lesson?.area?.name || "ÁREA" }}
            </span>
            <h2 class="qz-modal-title">Asignar Mejora a Cuestionarios</h2>
            <p class="qz-modal-subtitle">
              Periodo {{ cuestionario?.lesson?.period?.name || cuestionario?.lesson?.period?.id || "" }} ·
              Selecciona las evaluaciones anteriores a mejorar con esta nota
            </p>
          </div>
          <button
            type="button"
            class="qz-modal-close-btn"
            @click="showImprovementModal = false"
            title="Cerrar modal"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>

        <div class="qz-modal-body">
          <!-- Tarjeta del Estudiante Seleccionado -->
          <div v-if="selectedStudentForImprovement" class="qz-student-target-card">
            <div class="qz-target-avatar">
              {{ getInitials(selectedStudentForImprovement) }}
            </div>
            <div class="qz-target-info">
              <span class="qz-target-name">
                {{ getStudentName(selectedStudentForImprovement) }}
              </span>
              <span v-if="improvementTargetUsers.length > 1" class="qz-target-sub">
                Equipo de {{ improvementTargetUsers.length }} estudiantes:
                {{ improvementTargetUsers.map((u) => u.name || "").filter(Boolean).slice(0, 3).join(", ") }}{{ improvementTargetUsers.length > 3 ? "..." : "" }}
              </span>
              <span v-else class="qz-target-sub">
                Evaluación: {{ cuestionario?.title || cuestionario?.topic || "Mejora de Nota" }}
              </span>
            </div>
            <div class="qz-target-grade-pill">
              <span class="qz-grade-pill-label">Nota Obtenida</span>
              <span class="qz-grade-pill-value">
                {{ parseFloat(selectedStudentForImprovement.nota || 0).toFixed(1) }}
              </span>
            </div>
          </div>

          <!-- Información y Herramientas -->
          <div v-if="studentComparisonList.length > 0" class="qz-modal-tools-row">
            <span class="qz-tools-label">
              {{ studentComparisonList.length }} cuestionarios en el periodo
            </span>
            <div class="qz-tools-btns" v-if="selectedQuizzesCount > 0">
              <button
                type="button"
                class="qz-mini-tool-btn"
                @click="deseleccionarTodos"
                title="Desmarcar todos"
              >
                <span>Limpiar ({{ selectedQuizzesCount }})</span>
              </button>
            </div>
          </div>

          <!-- Estado de Carga -->
          <div v-if="loadingExistingGrades" class="qz-modal-loading">
            <ion-spinner name="crescent" class="qz-modal-spinner"></ion-spinner>
            <p>Consultando cuestionarios y calificaciones del periodo...</p>
          </div>

          <!-- Estado Vacío -->
          <div
            v-else-if="studentComparisonList.length === 0"
            class="qz-modal-empty"
          >
            <ion-icon :icon="informationCircleOutline" class="qz-modal-empty-icon"></ion-icon>
            <h4>Sin cuestionarios regulares</h4>
            <p>
              No se encontraron otros cuestionarios regulares en este curso, área y periodo para mejorar.
            </p>
          </div>

          <!-- Lista de Cuestionarios Comparativa -->
          <div v-else class="qz-comparison-list">
            <div
              v-for="item in studentComparisonList"
              :key="item.id"
              class="qz-comparison-item"
              :class="{
                'is-selected': item.selected,
                'has-improvement': item.isImprovement && item.previousGrade !== null
              }"
              @click="toggleQuizSelection(item)"
            >
              <div class="qz-comparison-left">
                <div
                  class="qz-select-indicator"
                  :class="{ 'is-checked': item.selected }"
                >
                  <ion-icon :icon="checkmark" v-if="item.selected"></ion-icon>
                </div>

                <div class="qz-comparison-meta">
                  <div class="qz-comparison-badge-row">
                    <span class="qz-item-type-pill">
                      <ion-icon :icon="documentTextOutline"></ion-icon>
                      Cuestionario
                    </span>
                  </div>
                  <h4 class="qz-comparison-title">{{ item.title }}</h4>
                  <span v-if="item.lessonTitle" class="qz-comparison-sub">
                    Lección: {{ item.lessonTitle }}
                  </span>
                </div>
              </div>

              <div class="qz-comparison-right">
                <!-- Comparación de notas -->
                <div class="qz-grade-compare-box">
                  <div class="qz-grade-pill qz-grade-pill--prev">
                    <span class="qz-compare-label">{{ item.isGroupAverage ? "Promedio:" : "Actual:" }}</span>
                    <span class="qz-compare-val">
                      {{ item.previousGrade !== null ? item.previousGrade.toFixed(1) : "Sin nota" }}
                    </span>
                  </div>

                  <ion-icon :icon="arrowForwardOutline" class="qz-compare-arrow"></ion-icon>

                  <div class="qz-grade-pill qz-grade-pill--new">
                    <span class="qz-compare-label">Nueva:</span>
                    <span class="qz-compare-val">{{ item.newGrade.toFixed(1) }}</span>
                  </div>
                </div>

                <!-- Badge de Estado de Mejora -->
                <span
                  v-if="item.previousGrade !== null && item.newGrade > item.previousGrade"
                  class="qz-improvement-tag qz-tag--success"
                >
                  +{{ (item.newGrade - item.previousGrade).toFixed(1) }} Mejora
                </span>
                <span
                  v-else-if="item.previousGrade === null"
                  class="qz-improvement-tag qz-tag--new"
                >
                  Nueva nota
                </span>
                <span
                  v-else
                  class="qz-improvement-tag qz-tag--neutral"
                >
                  Menor o igual
                </span>
              </div>
            </div>
          </div>

          <!-- Botón de Confirmación Inferior -->
          <div class="qz-modal-footer">
            <button
              type="button"
              class="qz-modal-cancel-btn"
              @click="showImprovementModal = false"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="qz-modal-confirm-btn"
              :disabled="registrandoMejora || selectedQuizzesCount === 0"
              @click="confirmarRegistroMejora"
            >
              <ion-spinner
                v-if="registrandoMejora"
                name="crescent"
                class="qz-spinner-white"
              ></ion-spinner>
              <template v-else>
                <ion-icon :icon="checkmarkCircle"></ion-icon>
                <span>
                  Confirmar Mejora ({{ selectedQuizzesCount }})
                </span>
              </template>
            </button>
          </div>
        </div>
      </div>
    </ion-modal>

    <!-- Modal para Ver Hoja OMR Escaneada (Queezy UI) -->
    <ion-modal
      :is-open="isScanModalOpen"
      @didDismiss="closeScanModal"
      class="qz-scan-modal"
    >
      <div class="qz-modal-sheet qz-scan-sheet">
        <!-- Barra de Cabecera Modal -->
        <div class="qz-modal-header-bar">
          <div class="qz-modal-header-texts">
            <span class="qz-modal-tag">
              EVIDENCIA OMR DIGITALIZADA
            </span>
            <h2 class="qz-modal-title">
              Hoja de Respuestas Calificada
            </h2>
            <p class="qz-modal-subtitle" v-if="selectedParticipantForScan">
              {{ getParticipantName(selectedParticipantForScan) }} ·
              Nota: {{ parseFloat(selectedParticipantForScan.nota || 0).toFixed(1) }} ({{ selectedParticipantForScan.points }} pts)
            </p>
          </div>
          <button
            type="button"
            class="qz-modal-close-btn"
            @click="closeScanModal"
            title="Cerrar vista previa"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>

        <div class="qz-scan-modal-body">
          <!-- Segmento de pestañas si hay múltiples secciones / hojas -->
          <div
            v-if="currentParticipantScans.length > 1"
            class="qz-scan-tabs-bar"
          >
            <button
              v-for="(scanItem, sIdx) in currentParticipantScans"
              :key="scanItem.id || sIdx"
              type="button"
              class="qz-scan-tab-btn"
              :class="{ 'is-active': selectedScanSectionIndex === sIdx }"
              @click="selectedScanSectionIndex = sIdx"
            >
              Hoja {{ scanItem.section || sIdx + 1 }}
            </button>
          </div>

          <!-- Leyenda de Colores OMR -->
          <div class="qz-omr-legend">
            <div class="qz-legend-item">
              <span class="qz-legend-dot qz-dot--correct"></span>
              <span>Correcta</span>
            </div>
            <div class="qz-legend-item">
              <span class="qz-legend-dot qz-dot--incorrect"></span>
              <span>Incorrecta</span>
            </div>
            <div class="qz-legend-item">
              <span class="qz-legend-ring qz-ring--key"></span>
              <span>Clave</span>
            </div>
          </div>

          <!-- Contenedor de la Imagen Escaneada -->
          <div class="qz-scan-image-viewport">
            <div v-if="currentActiveScan" class="qz-scan-img-wrapper">
              <img
                :src="getScanImageUrl(currentActiveScan)"
                alt="Hoja OMR Escaneada"
                class="qz-scan-img"
              />
            </div>
            <div v-else class="qz-scan-empty">
              <ion-icon :icon="cameraOutline" class="qz-scan-empty-icon"></ion-icon>
              <p>No se encontró la imagen de la hoja escaneada.</p>
            </div>
          </div>

          <!-- Pie del Modal -->
          <div class="qz-modal-footer qz-scan-footer">
            <span class="qz-scan-date-info" v-if="currentActiveScan?.createdAt">
              Escaneado: {{ formatScanDate(currentActiveScan.createdAt) }}
            </span>
            <button
              type="button"
              class="qz-modal-cancel-btn"
              @click="closeScanModal"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
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
  closeOutline,
  arrowForwardOutline,
  documentTextOutline,
  checkmark,
  cameraOutline,
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
    const successMessage = ref("Notas registradas correctamente");
    const setSuccessToastOpen = (val, message = "") => {
      isSuccessToastOpen.value = val;
      if (message) {
        successMessage.value = message;
      }
    };
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
    const improvementTargetUsers = ref([]);

    // OMR Scans (Evidencia de hojas escaneadas)
    const quizScans = ref([]);
    const isScanModalOpen = ref(false);
    const selectedParticipantForScan = ref(null);
    const selectedScanSectionIndex = ref(0);

    const getParticipantUserId = (resp) => {
      if (!resp) return null;
      if (resp.user && resp.user.id) return Number(resp.user.id);
      if (resp.userId) return Number(resp.userId);
      if (typeof resp.id === "number") return resp.id;
      return null;
    };

    const getScansForParticipant = (resp) => {
      const uId = getParticipantUserId(resp);
      if (!uId || !quizScans.value || quizScans.value.length === 0) return [];
      return quizScans.value.filter((scan) => Number(scan.userId) === uId);
    };

    const hasScan = (resp) => {
      return getScansForParticipant(resp).length > 0;
    };

    const currentParticipantScans = computed(() => {
      if (!selectedParticipantForScan.value) return [];
      return getScansForParticipant(selectedParticipantForScan.value);
    });

    const currentActiveScan = computed(() => {
      const scans = currentParticipantScans.value;
      if (scans.length === 0) return null;
      return scans[selectedScanSectionIndex.value] || scans[0];
    });

    const openScanModal = (resp) => {
      selectedParticipantForScan.value = resp;
      selectedScanSectionIndex.value = 0;
      isScanModalOpen.value = true;
    };

    const closeScanModal = () => {
      isScanModalOpen.value = false;
      selectedParticipantForScan.value = null;
      selectedScanSectionIndex.value = 0;
    };

    const getScanImageUrl = (scan) => {
      if (!scan) return "";
      if (
        scan.imageUrl?.startsWith("data:") ||
        scan.imageUrl?.startsWith("http://") ||
        scan.imageUrl?.startsWith("https://")
      ) {
        return scan.imageUrl;
      }
      const base = axios.defaults.baseURL || "";
      const cleanPath = (scan.imageUrl || "").replace(/^\/+/, "");
      if (base) {
        const cleanBase = base.endsWith("/") ? base : `${base}/`;
        return `${cleanBase}${cleanPath}`;
      }
      return `/${cleanPath}`;
    };

    const formatScanDate = (d) => {
      if (!d) return "";
      try {
        const date = new Date(d);
        return date.toLocaleString();
      } catch (_) {
        return String(d);
      }
    };

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

    const toggleQuizSelection = (item) => {
      item.selected = !item.selected;
    };

    const seleccionarSoloMejoras = () => {
      studentComparisonList.value.forEach((item) => {
        item.selected = item.isImprovement;
      });
    };

    const deseleccionarTodos = () => {
      studentComparisonList.value.forEach((item) => {
        item.selected = false;
      });
    };

    const selectedQuizzesCount = computed(() => {
      return studentComparisonList.value.filter((item) => item.selected).length;
    });

    const abrirModalMejoraEstudiante = async (resp) => {
      selectedStudentForImprovement.value = resp;
      selectedQuizIdsToImprove.value = [];
      studentComparisonList.value = [];
      showImprovementModal.value = true;
      loadingExistingGrades.value = true;

      try {
        const courseId = cuestionario.value?.lesson?.course?.id;
        const areaId = cuestionario.value?.lesson?.area?.id;
        const periodId = cuestionario.value?.lesson?.period?.id;

        if (!courseId || !areaId || !periodId) {
          setErrorToastOpen(
            true,
            "Falta información del curso, área o periodo de la lección.",
          );
          return;
        }

        const year = cuestionario.value?.lesson?.year;
        const res = await axios.get(
          `/quizzes?courseId=${courseId}&areaId=${areaId}&periodId=${periodId}${year ? `&year=${year}` : ""}`,
        );
        const candidateQuizzes = (res.data || []).filter(
          (q) =>
            q.id !== Number(id) &&
            q.category !== "improvement" &&
            q.lesson?.type !== "reinforcement" &&
            q.lesson?.type !== "remedial",
        );
        quizzesInCourse.value = candidateQuizzes;

        let targetUsers = [];
        if (resp?.user?.id) {
          targetUsers = [resp.user];
        } else if (resp?.group?.id) {
          try {
            const groupRes = await axios.get(
              `/groups/${resp.group.id}/${cuestionario.value?.lesson?.year}/users`,
            );
            targetUsers = (groupRes.data || [])
              .map((rel) => rel.user)
              .filter(Boolean);
          } catch (eGroup) {
            console.error("Error fetching group users:", eGroup);
          }
        }
        improvementTargetUsers.value = targetUsers;

        const quizGradesMap = {};
        const instituteId =
          cuestionario.value?.lesson?.institute?.id ||
          usuario.value?.institute?.id ||
          1;

        if (targetUsers.length > 0) {
          try {
            const gradesPromises = targetUsers.map((u) =>
              axios
                .get(
                  `/grades?userId=${u.id}&courseId=${courseId}&areaId=${areaId}&periodId=${periodId}&gradableType=quiz&instituteId=${instituteId}`,
                )
                .then((r) => (Array.isArray(r.data) ? r.data : []))
                .catch(() => []),
            );
            const allUsersGrades = await Promise.all(gradesPromises);

            allUsersGrades.forEach((userGrades) => {
              userGrades.forEach((g) => {
                if (g.gradableId) {
                  if (!quizGradesMap[g.gradableId]) {
                    quizGradesMap[g.gradableId] = [];
                  }
                  quizGradesMap[g.gradableId].push(parseFloat(g.grade));
                }
              });
            });
          } catch (errGrades) {
            console.error("Error al consultar notas existentes:", errGrades);
          }
        }

        const newGradeVal = parseFloat(resp?.nota || 0);

        studentComparisonList.value = candidateQuizzes.map((quiz) => {
          const gradesList = quizGradesMap[quiz.id] || [];
          let prev = null;
          let isGroupAverage = false;

          if (gradesList.length > 0) {
            const allEqual = gradesList.every(
              (g) => Math.abs(g - gradesList[0]) < 0.01,
            );
            if (allEqual) {
              prev = gradesList[0];
            } else {
              prev =
                gradesList.reduce((acc, curr) => acc + curr, 0) /
                gradesList.length;
              isGroupAverage = true;
            }
          }

          const isImprovement = prev !== null ? newGradeVal > prev : true;

          return {
            id: quiz.id,
            title: quiz.title,
            lessonTitle: quiz.lesson?.topic || quiz.lesson?.title || "",
            previousGrade: prev,
            newGrade: newGradeVal,
            isGroupAverage,
            isImprovement,
            selected: false,
          };
        });
      } catch (e) {
        console.error("Error loading quizzes in course:", e);
        setErrorToastOpen(
          true,
          "Error al cargar los cuestionarios del curso y periodo.",
        );
      } finally {
        loadingExistingGrades.value = false;
      }
    };

    const onSelectedQuizzesChange = () => {
      // Logic for comparing grades
    };

    const confirmarRegistroMejora = async () => {
      const selectedItems = studentComparisonList.value.filter(
        (item) => item.selected,
      );

      if (selectedItems.length === 0) {
        setErrorToastOpen(
          true,
          "Selecciona al menos un cuestionario para aplicar la mejora.",
        );
        return;
      }

      let targetUserIds = (improvementTargetUsers.value || [])
        .map((u) => u.id)
        .filter(Boolean);

      if (targetUserIds.length === 0) {
        if (selectedStudentForImprovement.value?.user?.id) {
          targetUserIds = [selectedStudentForImprovement.value.user.id];
        } else if (selectedStudentForImprovement.value?.group?.id) {
          try {
            const groupRes = await axios.get(
              `/groups/${selectedStudentForImprovement.value.group.id}/${cuestionario.value?.lesson?.year}/users`,
            );
            targetUserIds = (groupRes.data || [])
              .map((rel) => rel.user?.id)
              .filter(Boolean);
          } catch (eG) {
            console.error("Error loading group users for improvement:", eG);
          }
        }
      }

      if (targetUserIds.length === 0) {
        setErrorToastOpen(
          true,
          "No se encontraron integrantes para registrar la nota de mejora.",
        );
        return;
      }

      registrandoMejora.value = true;
      try {
        const newGradeVal = parseFloat(selectedStudentForImprovement.value.nota);
        const lesson = cuestionario.value.lesson;
        const instituteId =
          lesson.institute?.id || usuario.value?.institute?.id;

        for (const studentUserId of targetUserIds) {
          for (const item of selectedItems) {
            const payload = {
              userId: studentUserId,
              gradableId: item.id,
              gradableType: "quiz",
              periodId: lesson.period.id,
              gradeType: "regular",
              grade: newGradeVal,
              instituteId,
              registrarMayor: true,
            };
            await axios.post("/grades", payload);
          }

          // Registrar también la nota en el propio cuestionario de mejora
          const payloadMejora = {
            userId: studentUserId,
            gradableId: parseInt(id, 10),
            gradableType: "quiz",
            periodId: lesson.period.id,
            gradeType: "regular",
            grade: newGradeVal,
            instituteId,
          };
          await axios.post("/grades", payloadMejora);
        }

        showImprovementModal.value = false;
        setSuccessToastOpen(
          true,
          `¡Notas mejoradas exitosamente para ${selectedItems.length} cuestionario(s)!`,
        );
      } catch (e) {
        console.error("Error al registrar mejora:", e);
        setErrorToastOpen(
          true,
          "Ocurrió un error al registrar las notas mejoradas.",
        );
      } finally {
        registrandoMejora.value = false;
      }
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

      // Cargar escaneos OMR disponibles para este cuestionario
      try {
        const scansRes = await axios.get(`/quizzes/${id}/scans`);
        quizScans.value = scansRes.data || [];
      } catch (scanErr) {
        console.error("Error fetching quiz scans:", scanErr);
        quizScans.value = [];
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
      improvementTargetUsers,
      selectedQuizIdsToImprove,
      studentComparisonList,
      quizzesInCourse,
      loadingExistingGrades,
      registrandoMejora,
      loading,
      respuestaDetallada,
      respuestaMAyor,
      isTierModalOpen,
      selectedTierForModal,
      quizScans,
      isScanModalOpen,
      selectedParticipantForScan,
      selectedScanSectionIndex,
      currentParticipantScans,
      currentActiveScan,
      hasScan,
      getScansForParticipant,
      openScanModal,
      closeScanModal,
      getScanImageUrl,
      formatScanDate,
      cameraOutline,
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
      toggleQuizSelection,
      seleccionarSoloMejoras,
      deseleccionarTodos,
      selectedQuizzesCount,
      getStudentName,
      setSuccessToastOpen,
      successMessage,
      setErrorToastOpen,
      arrowBackOutline,
      closeOutline,
      arrowForwardOutline,
      documentTextOutline,
      checkmark,
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

/* ─── MODAL DE MEJORA DE NOTA (QUEEZY UI) ─────────────────────────────────── */
.qz-improvement-modal {
  --border-radius: 24px;
}

.qz-modal-sheet {
  background: #ffffff;
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-modal-header-bar {
  background: linear-gradient(135deg, #6a5ae0 0%, #7668e3 100%);
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  color: #ffffff;
  flex-shrink: 0;
}

.qz-modal-header-texts {
  flex: 1;
}

.qz-modal-tag {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
  display: block;
  margin-bottom: 2px;
}

.qz-modal-title {
  margin: 0 0 2px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 18px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.3px;
}

.qz-modal-subtitle {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.35;
}

.qz-modal-close-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: 9999px;
  width: 34px;
  height: 34px;
  min-width: 34px;
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.12s ease;
}

.qz-modal-close-btn:active {
  transform: scale(0.92);
}

.qz-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f7f6fd;
}

/* Tarjeta de información del alumno seleccionado */
.qz-student-target-card {
  background: #ffffff;
  border: 1.5px solid #eceaf9;
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 3px 10px rgba(106, 90, 224, 0.05);
  flex-shrink: 0;
}

.qz-target-avatar {
  width: 42px;
  height: 42px;
  min-width: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, #e0dcfa 0%, #efeefc 100%);
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
}

.qz-target-info {
  flex: 1;
  min-width: 0;
}

.qz-target-name {
  display: block;
  font-weight: 800;
  font-size: 14px;
  color: #0c092a;
}

.qz-target-sub {
  font-size: 12px;
  color: #858399;
}

.qz-target-grade-pill {
  background: #fef3c7;
  border: 1px solid rgba(217, 119, 6, 0.3);
  border-radius: 12px;
  padding: 4px 10px;
  text-align: right;
  flex-shrink: 0;
}

.qz-grade-pill-label {
  display: block;
  font-size: 9.5px;
  font-weight: 700;
  color: #92400e;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.qz-grade-pill-value {
  display: block;
  font-size: 16px;
  font-weight: 800;
  color: #b45309;
}

/* Fila de Herramientas */
.qz-modal-tools-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  padding: 0 2px;
}

.qz-tools-label {
  font-size: 12.5px;
  font-weight: 800;
  color: #49465f;
}

.qz-tools-btns {
  display: flex;
  gap: 6px;
}

.qz-mini-tool-btn {
  background: #ffffff;
  border: 1px solid #e2e0ed;
  border-radius: 9999px;
  padding: 4px 10px;
  font-size: 11.5px;
  font-weight: 700;
  color: #635f7a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.12s ease;
}

.qz-mini-tool-btn--accent {
  background: #fef3c7;
  border-color: rgba(217, 119, 6, 0.3);
  color: #92400e;
}

.qz-mini-tool-btn:active {
  transform: scale(0.95);
}

/* Lista de Comparación */
.qz-comparison-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-comparison-item {
  background: #ffffff;
  border: 1.5px solid #eceaf9;
  border-radius: 14px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.qz-comparison-item:hover {
  border-color: rgba(106, 90, 224, 0.4);
}

.qz-comparison-item.is-selected {
  border-color: #6a5ae0;
  background: #fdfcff;
  box-shadow: 0 3px 12px rgba(106, 90, 224, 0.08);
}

.qz-comparison-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.qz-select-indicator {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 1.8px solid #c8c5e2;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.qz-select-indicator.is-checked {
  background: #6a5ae0;
  border-color: #6a5ae0;
  color: #ffffff;
}

.qz-select-indicator ion-icon {
  font-size: 14px;
  stroke-width: 36px;
}

body.dark .qz-select-indicator {
  border-color: #4a4478;
  background: #1e1a3a;
}

body.dark .qz-select-indicator.is-checked {
  background: #8c7eff;
  border-color: #8c7eff;
  color: #ffffff;
}

.qz-round-checkbox {
  --size: 18px;
  --border-radius: 5px;
  --checkbox-background-checked: #6a5ae0;
  --border-color-checked: #6a5ae0;
  --checkmark-color: #ffffff;
  margin: 0;
  flex-shrink: 0;
}

.qz-comparison-meta {
  flex: 1;
  min-width: 0;
}

.qz-comparison-badge-row {
  margin-bottom: 3px;
}

.qz-item-type-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #6a5ae0;
  background: #f0eeff;
  padding: 1px 6px;
  border-radius: 9999px;
  letter-spacing: 0.03em;
}

body.dark .qz-item-type-pill {
  color: #a594fd;
  background: rgba(106, 90, 224, 0.22);
}

.qz-comparison-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: #0c092a;
  line-height: 1.25;
}

.qz-comparison-sub {
  font-size: 11px;
  color: #858399;
}

.qz-comparison-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.qz-grade-compare-box {
  display: flex;
  align-items: center;
  gap: 5px;
}

.qz-grade-pill {
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 11px;
  display: inline-flex;
  gap: 3px;
  font-weight: 700;
}

.qz-grade-pill--prev {
  background: #f1f0f7;
  color: #635f7a;
}

.qz-compare-arrow {
  font-size: 12px;
  color: #858399;
}

.qz-grade-pill--new {
  background: #e0dcfa;
  color: #6a5ae0;
  font-weight: 800;
}

.qz-compare-label {
  opacity: 0.8;
  font-size: 10px;
}

.qz-improvement-tag {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 6px;
  border: 1px solid transparent;
}

.qz-tag--success {
  background: #dcfce7;
  color: #15803d;
  border-color: rgba(22, 163, 74, 0.25);
}

.qz-tag--new {
  background: #e0e7ff;
  color: #4338ca;
  border-color: rgba(67, 56, 202, 0.25);
}

.qz-tag--neutral {
  background: #f3f4f6;
  color: #6b7280;
  border-color: #e5e7eb;
}

/* Footer Modal */
.qz-modal-footer {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
}

.qz-modal-cancel-btn {
  background: #ffffff;
  border: 1.5px solid #eceaf9;
  border-radius: 14px;
  padding: 0 16px;
  height: 44px;
  font-size: 13px;
  font-weight: 700;
  color: #635f7a;
  cursor: pointer;
}

.qz-modal-confirm-btn {
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  border-radius: 14px;
  flex: 1;
  height: 44px;
  font-size: 13.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.25);
  transition: all 0.15s ease;
}

.qz-modal-confirm-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.qz-modal-confirm-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.qz-spinner-white {
  width: 18px;
  height: 18px;
  --color: #ffffff;
}

.qz-modal-loading,
.qz-modal-empty {
  background: #ffffff;
  border-radius: 16px;
  padding: 28px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid #eceaf9;
}

.qz-modal-spinner {
  width: 28px;
  height: 28px;
  --color: #6a5ae0;
  margin-bottom: 8px;
}

.qz-modal-empty-icon {
  font-size: 32px;
  color: #858399;
  margin-bottom: 6px;
}

.qz-modal-empty h4 {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 700;
  color: #0c092a;
}

.qz-modal-empty p {
  margin: 0;
  font-size: 12.5px;
  color: #858399;
}

/* OMR Scan Evidence Badge & Button */
.qz-scan-pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: rgba(106, 90, 224, 0.12);
  color: #6a5ae0;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 9999px;
  border: 1px solid rgba(106, 90, 224, 0.25);
  margin-left: 4px;
  vertical-align: middle;
}

body.dark .qz-scan-pill-badge,
.dark .qz-scan-pill-badge {
  background: rgba(106, 90, 224, 0.25);
  color: #a594fd;
  border-color: rgba(165, 148, 253, 0.35);
}

.qz-scan-evidence-banner {
  margin-bottom: 10px;
}

.qz-btn-view-scan {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  background: linear-gradient(135deg, #6a5ae0 0%, #5846db 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.35);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.qz-btn-view-scan:active {
  transform: scale(0.98);
}

.qz-scan-count-tag {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 9999px;
  padding: 2px 7px;
  font-size: 10.5px;
  font-weight: 800;
  color: #ffffff;
}

/* Modal Ver Hoja OMR Escaneada */
.qz-scan-modal {
  --border-radius: 24px;
}

.qz-scan-modal-body {
  padding: 14px 16px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8f7fc;
}

.qz-scan-tabs-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.qz-scan-tab-btn {
  background: #ffffff;
  border: 1.5px solid #e2e0ed;
  border-radius: 9999px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  color: #49465f;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.qz-scan-tab-btn.is-active {
  background: #6a5ae0;
  color: #ffffff;
  border-color: #6a5ae0;
  box-shadow: 0 3px 8px rgba(106, 90, 224, 0.3);
}

.qz-omr-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #ebe8f5;
  font-size: 11px;
  font-weight: 600;
  color: #49465f;
  flex-shrink: 0;
}

.qz-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.qz-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.qz-dot--correct {
  background-color: #2dd36f;
  box-shadow: 0 0 4px rgba(45, 211, 111, 0.6);
}

.qz-dot--incorrect {
  background-color: #eb445a;
  box-shadow: 0 0 4px rgba(235, 68, 90, 0.6);
}

.qz-legend-ring {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #2dd36f;
  background: transparent;
}

.qz-scan-image-viewport {
  flex: 1;
  min-height: 280px;
  max-height: 65vh;
  background: #0d0b1a;
  border-radius: 14px;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
}

.qz-scan-img-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
}

.qz-scan-img {
  max-width: 100%;
  max-height: 62vh;
  object-fit: contain;
  border-radius: 8px;
  display: block;
}

.qz-scan-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #858494;
  padding: 40px 20px;
}

.qz-scan-empty-icon {
  font-size: 40px;
  opacity: 0.5;
}

.qz-scan-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.qz-scan-date-info {
  font-size: 11px;
  color: #858494;
  font-weight: 500;
}

/* Dark Mode para Modal de Mejora y OMR */
body.dark .qz-modal-sheet,
.dark .qz-modal-sheet {
  background: #1e1a3a;
}
body.dark .qz-modal-body,
.dark .qz-modal-body {
  background: #16132b;
}
body.dark .qz-student-target-card,
body.dark .qz-comparison-item,
body.dark .qz-modal-loading,
body.dark .qz-modal-empty,
.dark .qz-student-target-card,
.dark .qz-comparison-item,
.dark .qz-modal-loading,
.dark .qz-modal-empty {
  background: #1e1a3a;
  border-color: rgba(255, 255, 255, 0.08);
}
body.dark .qz-target-name,
body.dark .qz-comparison-title,
body.dark .qz-modal-empty h4,
.dark .qz-target-name,
.dark .qz-comparison-title,
.dark .qz-modal-empty h4 {
  color: #f3f2ff;
}
body.dark .qz-tools-label,
.dark .qz-tools-label {
  color: #c4beff;
}
body.dark .qz-comparison-item.is-selected,
.dark .qz-comparison-item.is-selected {
  background: #252048;
  border-color: #8c7eff;
}
body.dark .qz-mini-tool-btn,
body.dark .qz-modal-cancel-btn,
.dark .qz-mini-tool-btn,
.dark .qz-modal-cancel-btn {
  background: #1e1a3a;
  border-color: #2e2954;
  color: #c4beff;
}
body.dark .qz-scan-modal-body,
.dark .qz-scan-modal-body {
  background: #18152e;
}
body.dark .qz-scan-tab-btn,
.dark .qz-scan-tab-btn {
  background: #252244;
  border-color: rgba(255, 255, 255, 0.12);
  color: #e2e0ed;
}
body.dark .qz-scan-tab-btn.is-active,
.dark .qz-scan-tab-btn.is-active {
  background: #6a5ae0;
  color: #ffffff;
  border-color: #6a5ae0;
}
body.dark .qz-omr-legend,
.dark .qz-omr-legend {
  background: #252244;
  border-color: rgba(255, 255, 255, 0.1);
  color: #e2e0ed;
}
body.dark .qz-scan-date-info,
.dark .qz-scan-date-info {
  color: #a09eb5;
}

@media (prefers-color-scheme: dark) {
  .qz-modal-sheet {
    background: #1e1a3a;
  }
  .qz-modal-body {
    background: #16132b;
  }
  .qz-student-target-card,
  .qz-comparison-item,
  .qz-modal-loading,
  .qz-modal-empty {
    background: #1e1a3a;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-target-name,
  .qz-comparison-title,
  .qz-modal-empty h4 {
    color: #f3f2ff;
  }
  .qz-tools-label {
    color: #c4beff;
  }
  .qz-comparison-item.is-selected {
    background: #252048;
    border-color: #8c7eff;
  }
  .qz-mini-tool-btn,
  .qz-modal-cancel-btn {
    background: #1e1a3a;
    border-color: #2e2954;
    color: #c4beff;
  }
  .qz-scan-modal-body {
    background: #18152e;
  }
  .qz-scan-tab-btn {
    background: #252244;
    border-color: rgba(255, 255, 255, 0.12);
    color: #e2e0ed;
  }
  .qz-scan-tab-btn.is-active {
    background: #6a5ae0;
    color: #ffffff;
    border-color: #6a5ae0;
  }
  .qz-omr-legend {
    background: #252244;
    border-color: rgba(255, 255, 255, 0.1);
    color: #e2e0ed;
  }
  .qz-scan-date-info {
    color: #a09eb5;
  }
}
</style>
