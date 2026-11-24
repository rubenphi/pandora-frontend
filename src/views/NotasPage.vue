<template>
  <ion-page class="ion-page qz-notas-page">
    <ion-content
      :fullscreen="true"
      class="qz-notas-content"
      :force-overscroll="false"
    >
      <!-- 1. CABECERA HERO PÚRPURA QUEEZY -->
      <div class="qz-hero-section">
        <div class="qz-hero-top">
          <button
            type="button"
            class="qz-circle-btn"
            title="Volver a Cursos"
            @click="goBack"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </button>

          <!-- Acciones de Cabecera -->
          <div class="qz-hero-actions-cluster">
            <!-- Botón Descargar Planilla -->
            <button
              type="button"
              class="qz-header-action-pill pill-secondary"
              title="Descargar Planilla"
              @click="descargarPlanilla"
            >
              <ion-icon :icon="downloadOutline"></ion-icon>
              <span class="qz-pill-text-hide-sm">Planilla</span>
            </button>

            <!-- Botón Opciones de Reporte -->
            <button
              type="button"
              class="qz-header-action-pill pill-secondary"
              title="Opciones de Reporte"
              @click="presentReportActionSheet"
            >
              <ion-icon :icon="documentTextOutline"></ion-icon>
              <span class="qz-pill-text-hide-sm">Reportes</span>
            </button>
          </div>
        </div>

        <!-- Títulos del Hero -->
        <div class="qz-hero-titles">
          <div class="qz-hero-tags-row">
            <span class="qz-hero-pill-badge" v-if="cursoSelected?.name">
              <ion-icon :icon="schoolOutline"></ion-icon>
              <span>{{ cursoSelected.name }}</span>
            </span>
            <span class="qz-hero-pill-badge" v-if="areaSelected?.name">
              <ion-icon :icon="bookOutline"></ion-icon>
              <span>{{ areaSelected.name }}</span>
            </span>
            <span class="qz-hero-pill-badge" v-if="year">
              <ion-icon :icon="calendarOutline"></ion-icon>
              <span>{{ year }}</span>
            </span>
          </div>

          <h1 class="qz-hero-title">Planilla de Calificaciones</h1>
          <p class="qz-hero-subtitle">
            Seguimiento de desempeño, calificaciones y auditoría académica
          </p>
        </div>
      </div>

      <!-- 2. CUERPO PRINCIPAL -->
      <div class="qz-notas-body">
        <!-- 2.1 Selector de Período Queezy -->
        <div class="qz-card qz-filters-card">
          <div class="qz-filter-pill-item">
            <div class="qz-filter-pill-icon-wrap">
              <ion-icon :icon="timeOutline"></ion-icon>
            </div>
            <div class="qz-filter-pill-content">
              <label class="qz-filter-pill-label">Período Académico</label>
              <ion-select
                v-model="periodoSelected"
                interface="popover"
                class="qz-period-select"
                placeholder="Seleccione el período"
                @ionChange="actualizarNotas"
              >
                <ion-select-option
                  v-for="periodo in periodos"
                  :key="periodo.id"
                  :value="periodo.id"
                >
                  {{ periodo.name }}
                </ion-select-option>
              </ion-select>
            </div>
          </div>
        </div>

        <!-- 2.2 Franja de Auditoría Contextual del Curso -->
        <div
          v-if="usuariosEstudiantes && usuariosEstudiantes.length > 0"
          class="qz-audit-bar"
          :class="{
            'has-pending': totalPendientesCurso > 0,
            'is-synced': totalPendientesCurso === 0,
          }"
          @click="abrirModalAuditoria"
        >
          <div class="qz-audit-bar-top-row">
            <div
              class="qz-audit-bar-icon-wrap"
              :class="totalPendientesCurso > 0 ? 'is-warning' : 'is-success'"
            >
              <ion-icon
                :icon="
                  totalPendientesCurso > 0
                    ? alertCircleOutline
                    : checkmarkCircleOutline
                "
              ></ion-icon>
            </div>
            <div class="qz-audit-bar-content">
              <div class="qz-audit-bar-main">
                <span
                  class="qz-audit-bar-title"
                  v-if="totalPendientesCurso > 0"
                >
                  {{ totalPendientesCurso }}
                  {{
                    totalPendientesCurso === 1
                      ? "actividad pendiente"
                      : "actividades pendientes"
                  }}
                  por calificar
                </span>
                <span class="qz-audit-bar-title" v-else>
                  Evaluaciones al día en este curso
                </span>
                <span
                  class="qz-audit-bar-badge"
                  :class="
                    totalPendientesCurso > 0 ? 'badge-warning' : 'badge-success'
                  "
                >
                  {{
                    totalPendientesCurso > 0
                      ? `${totalEstudiantesConPendientes} estudiante(s)`
                      : "Al día"
                  }}
                </span>
              </div>
              <p class="qz-audit-bar-desc" v-if="totalPendientesCurso > 0">
                Actividades evaluadas a otros compañeros que requieren nota o
                entrega
              </p>
              <p class="qz-audit-bar-desc" v-else>
                Todos los estudiantes cuentan con notas en las actividades
                evaluadas
              </p>
            </div>
            <div class="qz-audit-bar-action" v-if="totalPendientesCurso > 0">
              <button
                type="button"
                class="qz-audit-trigger-btn"
                @click.stop="abrirModalAuditoria"
              >
                <span>Auditar</span>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
          </div>

          <!-- Selector de Categorías Contextual Pre-Modal -->
          <div class="qz-audit-bar-categories" @click.stop>
            <button
              type="button"
              class="qz-audit-cat-pill"
              :class="
                totalPendientesRegulares > 0 ? 'cat-pending' : 'cat-synced'
              "
              @click="abrirModalAuditoriaConFiltro('regular')"
              title="Auditar Notas de clase"
            >
              <ion-icon :icon="bookOutline"></ion-icon>
              <span class="qz-audit-cat-label">Notas de clase:</span>
              <span class="qz-audit-cat-val">{{
                totalPendientesRegulares > 0
                  ? `${totalPendientesRegulares} pendientes`
                  : "Al día"
              }}</span>
            </button>

            <button
              type="button"
              class="qz-audit-cat-pill"
              :class="
                totalPendientesRefuerzos > 0 ? 'cat-pending' : 'cat-synced'
              "
              @click="abrirModalAuditoriaConFiltro('reinforcement')"
              title="Auditar Refuerzos"
            >
              <ion-icon :icon="sparklesOutline"></ion-icon>
              <span class="qz-audit-cat-label">Refuerzos:</span>
              <span class="qz-audit-cat-val">{{
                totalPendientesRefuerzos > 0
                  ? `${totalPendientesRefuerzos} pendientes`
                  : "Al día"
              }}</span>
            </button>

            <button
              type="button"
              class="qz-audit-cat-pill"
              :class="
                totalPendientesNivelaciones > 0 ? 'cat-pending' : 'cat-synced'
              "
              @click="abrirModalAuditoriaConFiltro('remedial')"
              title="Auditar Nivelaciones"
            >
              <ion-icon :icon="ribbonOutline"></ion-icon>
              <span class="qz-audit-cat-label">Nivelaciones:</span>
              <span class="qz-audit-cat-val">{{
                totalPendientesNivelaciones > 0
                  ? `${totalPendientesNivelaciones} pendientes`
                  : "Al día"
              }}</span>
            </button>
          </div>
        </div>

        <!-- 2.3 Sección de Estudiantes -->
        <div class="qz-students-container">
          <div class="qz-section-header">
            <div class="qz-section-titles">
              <h2 class="qz-section-title">Estudiantes Matriculados</h2>
              <p class="qz-section-subtitle">
                Despliega un estudiante para registrar o modificar notas por
                dimensión
              </p>
            </div>
            <span
              v-if="usuariosEstudiantes && usuariosEstudiantes.length > 0"
              class="qz-badge--count"
            >
              {{ usuariosEstudiantes.length }}
              {{
                usuariosEstudiantes.length === 1 ? "estudiante" : "estudiantes"
              }}
            </span>
          </div>

          <!-- Empty State -->
          <div
            v-if="!usuariosEstudiantes || usuariosEstudiantes.length === 0"
            class="qz-card qz-state-card"
          >
            <div class="qz-empty-icon-wrap">
              <ion-icon :icon="schoolOutline"></ion-icon>
            </div>
            <h3>Sin estudiantes en este curso</h3>
            <p>
              No se encontraron registros de estudiantes para el período
              seleccionado.
            </p>
          </div>

          <!-- Acordeón Queezy de Estudiantes -->
          <ion-accordion-group v-else class="qz-students-accordion-group">
            <ion-accordion
              v-for="estudiante in usuariosEstudiantes"
              :key="estudiante.id"
              :value="String(estudiante.id)"
              class="qz-student-accordion"
            >
              <ion-item
                slot="header"
                lines="none"
                class="qz-student-header-item"
              >
                <div class="qz-student-avatar">
                  {{
                    getStudentInitials(
                      estudiante.lastName + " " + estudiante.name,
                    )
                  }}
                </div>
                <ion-label class="qz-student-name-label">
                  <h3>{{ estudiante.lastName }} {{ estudiante.name }}</h3>
                  <span class="qz-student-meta">
                    Código: {{ estudiante.code || "—" }}
                  </span>
                </ion-label>

                <!-- Chips de Promedios RG, RF, NV -->
                <div slot="end" class="qz-grade-chips-cluster">
                  <div
                    v-if="estudiante.promedioRegular !== null"
                    class="qz-grade-badge"
                    :class="getGradeColorClass(estudiante.promedioRegular)"
                    title="Promedio Notas de Clase"
                  >
                    <span class="qz-grade-label">NC</span>
                    <span class="qz-grade-val">{{
                      estudiante.promedioRegular
                    }}</span>
                  </div>

                  <div
                    v-if="estudiante.hasReinforcement"
                    class="qz-grade-badge"
                    :class="getGradeColorClass(estudiante.promedioRefuerzo)"
                    title="Promedio Refuerzo"
                  >
                    <span class="qz-grade-label">RF</span>
                    <span class="qz-grade-val">{{
                      estudiante.promedioRefuerzo
                    }}</span>
                  </div>

                  <div
                    v-if="estudiante.hasRemedial"
                    class="qz-grade-badge"
                    :class="getGradeColorClass(estudiante.promedioNivelacion)"
                    title="Promedio Nivelación"
                  >
                    <span class="qz-grade-label">NV</span>
                    <span class="qz-grade-val">{{
                      estudiante.promedioNivelacion
                    }}</span>
                  </div>
                </div>
              </ion-item>

              <div slot="content" class="qz-student-content-wrap">
                <!-- Sub-acordeones para tipos de notas -->
                <ion-accordion-group class="qz-sub-accordion-group">
                  <!-- Notas De Clase -->
                  <ion-accordion
                    value="regular"
                    v-if="
                      estudiante.dimensionesRegular &&
                      estudiante.dimensionesRegular.some(
                        (d) => d.notas && d.notas.length > 0,
                      )
                    "
                    class="qz-sub-accordion"
                  >
                    <ion-item
                      slot="header"
                      lines="none"
                      class="qz-sub-accordion-header"
                    >
                      <div class="qz-sub-header-left">
                        <ion-icon
                          :icon="bookOutline"
                          class="qz-sub-header-icon"
                        ></ion-icon>
                        <ion-label>Notas de Clase</ion-label>
                      </div>
                      <div
                        slot="end"
                        class="qz-grade-badge"
                        :class="getGradeColorClass(estudiante.promedioRegular)"
                      >
                        <span class="qz-grade-label">Promedio</span>
                        <span class="qz-grade-val">{{
                          estudiante.promedioRegular
                        }}</span>
                      </div>
                    </ion-item>
                    <div slot="content" class="qz-sub-content">
                      <div
                        v-for="dimension in estudiante.dimensionesRegular"
                        :key="dimension.id"
                        class="qz-dimension-block"
                      >
                        <div
                          v-if="dimension.notas && dimension.notas.length > 0"
                          class="qz-dimension-bar"
                        >
                          <span class="qz-dimension-name">{{
                            dimension.name
                          }}</span>
                          <span
                            class="qz-grade-pill-sm"
                            :class="getGradeColorClass(dimension.promedio)"
                          >
                            {{ dimension.promedio }}
                          </span>
                        </div>

                        <ion-list
                          lines="none"
                          class="qz-grades-item-list"
                          v-if="dimension.notas && dimension.notas.length > 0"
                        >
                          <ion-item-sliding
                            v-for="nota in dimension.notas"
                            :key="nota.id"
                            class="qz-grade-item-sliding"
                          >
                            <ion-item
                              class="qz-grade-item-row"
                              lines="none"
                              button
                              :detail="false"
                              @click="editarNota(nota, estudiante.id)"
                              title="Toca para editar calificación"
                            >
                              <div class="qz-grade-item-icon-wrap">
                                <ion-icon :icon="easelOutline"></ion-icon>
                              </div>
                              <ion-label class="qz-grade-item-label">
                                <h4 class="qz-grade-item-title">
                                  {{ nota.gradableItem?.title }}
                                </h4>
                                <p class="qz-grade-item-topic">
                                  Lección:
                                  {{ nota.gradableItem?.lesson?.topic }}
                                </p>
                              </ion-label>
                              <div slot="end" class="qz-grade-item-score-wrap">
                                <span
                                  v-if="nota.grade !== null"
                                  class="qz-grade-pill-val"
                                  :class="getGradeColorClass(nota.grade)"
                                >
                                  {{ nota.grade }}
                                </span>
                                <span v-else class="qz-grade-pill-pending">
                                  Pendiente
                                </span>
                                <button
                                  type="button"
                                  class="qz-grade-edit-btn-inline"
                                  title="Editar calificación"
                                  @click.stop="editarNota(nota, estudiante.id)"
                                >
                                  <ion-icon :icon="pencilOutline"></ion-icon>
                                </button>
                              </div>
                            </ion-item>
                            <ion-item-options side="end">
                              <ion-item-option
                                @click="editarNota(nota, estudiante.id)"
                                class="qz-grade-edit-option"
                              >
                                <ion-icon
                                  :icon="pencilOutline"
                                  slot="icon-only"
                                ></ion-icon>
                              </ion-item-option>
                            </ion-item-options>
                          </ion-item-sliding>
                        </ion-list>
                      </div>
                    </div>
                  </ion-accordion>

                  <!-- Notas de Refuerzo -->
                  <ion-accordion
                    value="reinforcement"
                    v-if="
                      estudiante.dimensionesReinforcement &&
                      estudiante.dimensionesReinforcement.some(
                        (d) => d.notas && d.notas.length > 0,
                      )
                    "
                    class="qz-sub-accordion"
                  >
                    <ion-item
                      slot="header"
                      lines="none"
                      class="qz-sub-accordion-header"
                    >
                      <div class="qz-sub-header-left">
                        <ion-icon
                          :icon="ribbonOutline"
                          class="qz-sub-header-icon is-warning"
                        ></ion-icon>
                        <ion-label>Notas de Refuerzo</ion-label>
                      </div>
                      <div
                        slot="end"
                        class="qz-grade-badge"
                        :class="getGradeColorClass(estudiante.promedioRefuerzo)"
                      >
                        <span class="qz-grade-label">Promedio</span>
                        <span class="qz-grade-val">{{
                          estudiante.promedioRefuerzo
                        }}</span>
                      </div>
                    </ion-item>
                    <div slot="content" class="qz-sub-content">
                      <div
                        v-for="dimension in estudiante.dimensionesReinforcement"
                        :key="dimension.id"
                        class="qz-dimension-block"
                      >
                        <div
                          v-if="dimension.notas && dimension.notas.length > 0"
                          class="qz-dimension-bar"
                        >
                          <span class="qz-dimension-name">{{
                            dimension.name
                          }}</span>
                          <span
                            class="qz-grade-pill-sm"
                            :class="getGradeColorClass(dimension.promedio)"
                          >
                            {{ dimension.promedio }}
                          </span>
                        </div>

                        <ion-list
                          lines="none"
                          class="qz-grades-item-list"
                          v-if="dimension.notas && dimension.notas.length > 0"
                        >
                          <ion-item-sliding
                            v-for="nota in dimension.notas"
                            :key="nota.id"
                            class="qz-grade-item-sliding"
                          >
                            <ion-item
                              class="qz-grade-item-row"
                              lines="none"
                              button
                              :detail="false"
                              @click="editarNota(nota, estudiante.id)"
                              title="Toca para editar calificación"
                            >
                              <div class="qz-grade-item-icon-wrap">
                                <ion-icon :icon="easelOutline"></ion-icon>
                              </div>
                              <ion-label class="qz-grade-item-label">
                                <h4 class="qz-grade-item-title">
                                  {{ nota.gradableItem?.title }}
                                </h4>
                                <p class="qz-grade-item-topic">
                                  Lección:
                                  {{ nota.gradableItem?.lesson?.topic }}
                                </p>
                              </ion-label>
                              <div slot="end" class="qz-grade-item-score-wrap">
                                <span
                                  v-if="nota.grade !== null"
                                  class="qz-grade-pill-val"
                                  :class="getGradeColorClass(nota.grade)"
                                >
                                  {{ nota.grade }}
                                </span>
                                <span v-else class="qz-grade-pill-pending">
                                  Pendiente
                                </span>
                                <button
                                  type="button"
                                  class="qz-grade-edit-btn-inline"
                                  title="Editar calificación"
                                  @click.stop="editarNota(nota, estudiante.id)"
                                >
                                  <ion-icon :icon="pencilOutline"></ion-icon>
                                </button>
                              </div>
                            </ion-item>
                            <ion-item-options side="end">
                              <ion-item-option
                                @click="editarNota(nota, estudiante.id)"
                                class="qz-grade-edit-option"
                              >
                                <ion-icon
                                  :icon="pencilOutline"
                                  slot="icon-only"
                                ></ion-icon>
                              </ion-item-option>
                            </ion-item-options>
                          </ion-item-sliding>
                        </ion-list>
                      </div>
                    </div>
                  </ion-accordion>

                  <!-- Notas de Nivelación -->
                  <ion-accordion
                    value="remedial"
                    v-if="
                      estudiante.dimensionesRemedial &&
                      estudiante.dimensionesRemedial.some(
                        (d) => d.notas && d.notas.length > 0,
                      )
                    "
                    class="qz-sub-accordion"
                  >
                    <ion-item
                      slot="header"
                      lines="none"
                      class="qz-sub-accordion-header"
                    >
                      <div class="qz-sub-header-left">
                        <ion-icon
                          :icon="ribbonOutline"
                          class="qz-sub-header-icon is-info"
                        ></ion-icon>
                        <ion-label>Notas de Nivelación</ion-label>
                      </div>
                      <div
                        slot="end"
                        class="qz-grade-badge"
                        :class="
                          getGradeColorClass(estudiante.promedioNivelacion)
                        "
                      >
                        <span class="qz-grade-label">Promedio</span>
                        <span class="qz-grade-val">{{
                          estudiante.promedioNivelacion
                        }}</span>
                      </div>
                    </ion-item>
                    <div slot="content" class="qz-sub-content">
                      <div
                        v-for="dimension in estudiante.dimensionesRemedial"
                        :key="dimension.id"
                        class="qz-dimension-block"
                      >
                        <div
                          v-if="dimension.notas && dimension.notas.length > 0"
                          class="qz-dimension-bar"
                        >
                          <span class="qz-dimension-name">{{
                            dimension.name
                          }}</span>
                          <span
                            class="qz-grade-pill-sm"
                            :class="getGradeColorClass(dimension.promedio)"
                          >
                            {{ dimension.promedio }}
                          </span>
                        </div>

                        <ion-list
                          lines="none"
                          class="qz-grades-item-list"
                          v-if="dimension.notas && dimension.notas.length > 0"
                        >
                          <ion-item-sliding
                            v-for="nota in dimension.notas"
                            :key="nota.id"
                            class="qz-grade-item-sliding"
                          >
                            <ion-item
                              class="qz-grade-item-row"
                              lines="none"
                              button
                              :detail="false"
                              @click="editarNota(nota, estudiante.id)"
                              title="Toca para editar calificación"
                            >
                              <div class="qz-grade-item-icon-wrap">
                                <ion-icon :icon="easelOutline"></ion-icon>
                              </div>
                              <ion-label class="qz-grade-item-label">
                                <h4 class="qz-grade-item-title">
                                  {{ nota.gradableItem?.title }}
                                </h4>
                                <p class="qz-grade-item-topic">
                                  Lección:
                                  {{ nota.gradableItem?.lesson?.topic }}
                                </p>
                              </ion-label>
                              <div slot="end" class="qz-grade-item-score-wrap">
                                <span
                                  v-if="nota.grade !== null"
                                  class="qz-grade-pill-val"
                                  :class="getGradeColorClass(nota.grade)"
                                >
                                  {{ nota.grade }}
                                </span>
                                <span v-else class="qz-grade-pill-pending">
                                  Pendiente
                                </span>
                                <button
                                  type="button"
                                  class="qz-grade-edit-btn-inline"
                                  title="Editar calificación"
                                  @click.stop="editarNota(nota, estudiante.id)"
                                >
                                  <ion-icon :icon="pencilOutline"></ion-icon>
                                </button>
                              </div>
                            </ion-item>
                            <ion-item-options side="end">
                              <ion-item-option
                                @click="editarNota(nota, estudiante.id)"
                                class="qz-grade-edit-option"
                              >
                                <ion-icon
                                  :icon="pencilOutline"
                                  slot="icon-only"
                                ></ion-icon>
                              </ion-item-option>
                            </ion-item-options>
                          </ion-item-sliding>
                        </ion-list>
                      </div>
                    </div>
                  </ion-accordion>
                </ion-accordion-group>
              </div>
            </ion-accordion>
          </ion-accordion-group>
        </div>
      </div>
    </ion-content>

    <!-- Modal para añadir/editar nota -->
    <ion-modal
      :is-open="mostrarModal"
      @didDismiss="cerrarModal"
      class="qz-grade-modal"
    >
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>{{
            modoEdicion ? "Editar Calificación" : "Registrar Calificación"
          }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="cerrarModal" title="Cerrar modal">
              <ion-icon slot="icon-only" :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding qz-grade-modal-content">
        <!-- Edit Mode View -->
        <div v-if="modoEdicion" class="qz-grade-modal-body">
          <div class="qz-modal-card">
            <div class="qz-modal-field">
              <label class="qz-modal-label">Lección</label>
              <div class="qz-modal-readonly-input">
                <ion-icon :icon="bookOutline"></ion-icon>
                <span>{{ lessonName }}</span>
              </div>
            </div>

            <div class="qz-modal-field">
              <label class="qz-modal-label">
                {{
                  notaForm.gradableType === "quiz"
                    ? "Cuestionario / Quiz"
                    : "Actividad evaluada"
                }}
              </label>
              <div class="qz-modal-readonly-input">
                <ion-icon
                  :icon="
                    notaForm.gradableType === 'quiz'
                      ? schoolOutline
                      : easelOutline
                  "
                ></ion-icon>
                <span>{{ notaForm.gradableTitle }}</span>
              </div>
            </div>

            <div class="qz-modal-field">
              <label class="qz-modal-label">Calificación (0.0 a 5.0)</label>
              <div class="qz-modal-input-wrap">
                <ion-input
                  v-model="notaForm.grade"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="0.0 - 5.0"
                  class="qz-grade-numeric-input"
                ></ion-input>
              </div>
            </div>
          </div>

          <div class="qz-modal-actions">
            <button
              type="button"
              class="qz-btn-save-grade"
              @click="guardarNota"
            >
              <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              <span>Guardar Calificación</span>
            </button>
          </div>
        </div>

        <!-- Add Mode View -->
        <div v-else class="qz-grade-modal-body">
          <div class="qz-modal-card">
            <div class="qz-modal-field">
              <label class="qz-modal-label">Lección</label>
              <ion-select
                v-model="notaForm.lessonId"
                placeholder="Seleccione la lección"
                @ionChange="onLessonSelected"
                class="qz-modal-select"
              >
                <ion-select-option
                  v-for="lesson in lessons"
                  :key="lesson.id"
                  :value="lesson.id"
                >
                  {{ lesson.topic }} ({{
                    new Date(lesson.date).toLocaleDateString()
                  }})
                </ion-select-option>
              </ion-select>
            </div>

            <div class="qz-modal-field">
              <label class="qz-modal-label">Tipo de Ítem Calificable</label>
              <ion-segment
                v-model="gradableTypeSelected"
                @ionChange="onGradableTypeSelected"
                class="qz-modal-segment"
              >
                <ion-segment-button value="quiz">
                  <ion-label>Quiz</ion-label>
                </ion-segment-button>
                <ion-segment-button value="activity">
                  <ion-label>Actividad</ion-label>
                </ion-segment-button>
              </ion-segment>
            </div>

            <div class="qz-modal-field" v-if="gradableTypeSelected">
              <label class="qz-modal-label">{{
                gradableTypeSelected === "quiz" ? "Quiz" : "Actividad"
              }}</label>
              <ion-select
                v-model="notaForm.gradableId"
                placeholder="Seleccione el ítem calificable"
                class="qz-modal-select"
              >
                <ion-select-option
                  v-for="item in gradableTypeSelected === 'quiz'
                    ? quizzes
                    : activities"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.title }}
                </ion-select-option>
              </ion-select>
              <p
                v-if="
                  (gradableTypeSelected === 'quiz' && quizzes.length === 0) ||
                  (gradableTypeSelected === 'activity' &&
                    activities.length === 0)
                "
                class="qz-modal-helper-text"
              >
                No hay
                {{
                  gradableTypeSelected === "quiz" ? "quizzes" : "actividades"
                }}
                disponibles para esta lección.
              </p>
            </div>

            <div class="qz-modal-field">
              <label class="qz-modal-label">Calificación (0.0 a 5.0)</label>
              <div class="qz-modal-input-wrap">
                <ion-input
                  v-model="notaForm.grade"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="0.0 - 5.0"
                  class="qz-grade-numeric-input"
                ></ion-input>
              </div>
            </div>
          </div>

          <div class="qz-modal-actions">
            <button
              type="button"
              class="qz-btn-save-grade"
              @click="guardarNota"
            >
              <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              <span>Guardar Calificación</span>
            </button>
          </div>
        </div>
      </ion-content>
    </ion-modal>
    <!-- Modal de Configuración de Reporte (Estilo Queezy) -->
    <ion-modal
      :is-open="mostrarModalConfig"
      @didDismiss="cerrarModalConfig"
      class="qz-config-modal"
    >
      <div class="qz-config-modal-wrapper">
        <!-- 1. Cabecera Hero Queezy -->
        <div class="qz-config-modal-header">
          <div class="qz-config-header-titles">
            <span class="qz-config-tag">FILTRO DE CALIFICACIONES</span>
            <h2 class="qz-config-header-title">Configurar Reporte</h2>
          </div>
          <button
            type="button"
            class="qz-config-close-btn"
            @click="cerrarModalConfig"
            title="Cerrar modal"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>

        <!-- 2. Cuerpo del Modal -->
        <div class="qz-config-modal-body">
          <div class="qz-config-card">
            <!-- Píldoras de contexto (Curso y Área) -->
            <div class="qz-config-meta-row">
              <span class="qz-config-meta-pill" v-if="cursoSelected?.name">
                <ion-icon :icon="schoolOutline"></ion-icon>
                <span>{{ cursoSelected.name }}</span>
              </span>
              <span class="qz-config-meta-pill" v-if="areaSelected?.name">
                <ion-icon :icon="bookOutline"></ion-icon>
                <span>{{ areaSelected.name }}</span>
              </span>
            </div>

            <!-- Campo 1: Condición de Calificación -->
            <div class="qz-config-field-group">
              <label class="qz-config-field-label">
                <ion-icon :icon="funnelOutline"></ion-icon>
                <span>Condición de Filtro</span>
              </label>
              <div class="qz-config-select-wrap">
                <ion-select
                  v-model="reportConfig.condition"
                  placeholder="Seleccione condición"
                  interface="popover"
                  class="qz-config-select"
                >
                  <ion-select-option value="lt"
                    >Menor a (&lt;)</ion-select-option
                  >
                  <ion-select-option value="lte"
                    >Igual o menor a (≤)</ion-select-option
                  >
                  <ion-select-option value="eq">Igual a (=)</ion-select-option>
                  <ion-select-option value="gt"
                    >Mayor a (&gt;)</ion-select-option
                  >
                  <ion-select-option value="gte"
                    >Igual o mayor a (≥)</ion-select-option
                  >
                </ion-select>
              </div>
            </div>

            <!-- Campo 2: Valor de Nota de Corte -->
            <div class="qz-config-field-group">
              <div class="qz-config-label-row">
                <label class="qz-config-field-label">
                  <ion-icon :icon="ribbonOutline"></ion-icon>
                  <span>Nota de Corte</span>
                </label>
                <span class="qz-config-range-hint">Escala: 0.0 - 5.0</span>
              </div>
              <div class="qz-config-input-wrap">
                <ion-input
                  v-model="reportConfig.value"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="Ej: 3.3"
                  class="qz-config-num-input"
                ></ion-input>
              </div>

              <!-- Píldoras de atajo rápido para la nota de corte -->
              <div class="qz-config-presets-row">
                <button
                  type="button"
                  class="qz-config-preset-btn"
                  :class="{ 'is-active': Number(reportConfig.value) === 3.0 }"
                  @click="reportConfig.value = 3.0"
                >
                  3.0
                </button>
                <button
                  type="button"
                  class="qz-config-preset-btn"
                  :class="{ 'is-active': Number(reportConfig.value) === 3.3 }"
                  @click="reportConfig.value = 3.3"
                >
                  3.3
                </button>
                <button
                  type="button"
                  class="qz-config-preset-btn"
                  :class="{ 'is-active': Number(reportConfig.value) === 3.5 }"
                  @click="reportConfig.value = 3.5"
                >
                  3.5
                </button>
                <button
                  type="button"
                  class="qz-config-preset-btn"
                  :class="{ 'is-active': Number(reportConfig.value) === 4.0 }"
                  @click="reportConfig.value = 4.0"
                >
                  4.0
                </button>
              </div>
            </div>

            <!-- Campo 3: Tipo / Formato de Informe -->
            <div class="qz-config-field-group">
              <label class="qz-config-field-label">
                <ion-icon :icon="documentTextOutline"></ion-icon>
                <span>Nivel de Detalle</span>
              </label>
              <div class="qz-config-format-cards">
                <div
                  class="qz-format-card"
                  :class="{ 'is-selected': reportConfig.format === 'short' }"
                  @click="reportConfig.format = 'short'"
                >
                  <div class="qz-format-radio">
                    <span class="qz-radio-circle"></span>
                  </div>
                  <div class="qz-format-info">
                    <span class="qz-format-title">Resumido</span>
                    <span class="qz-format-desc"
                      >Lista rápida con nombres y promedios finales</span
                    >
                  </div>
                  <ion-icon
                    :icon="listOutline"
                    class="qz-format-icon"
                  ></ion-icon>
                </div>

                <div
                  class="qz-format-card"
                  :class="{ 'is-selected': reportConfig.format === 'detailed' }"
                  @click="reportConfig.format = 'detailed'"
                >
                  <div class="qz-format-radio">
                    <span class="qz-radio-circle"></span>
                  </div>
                  <div class="qz-format-info">
                    <span class="qz-format-title">Detallado</span>
                    <span class="qz-format-desc"
                      >Desglose por dimensiones y actividades evaluadas</span
                    >
                  </div>
                  <ion-icon
                    :icon="readerOutline"
                    class="qz-format-icon"
                  ></ion-icon>
                </div>
              </div>
            </div>

            <!-- Botón de Acción Principal -->
            <div class="qz-config-actions">
              <button
                type="button"
                class="qz-btn-submit-report"
                @click="generarReporte"
              >
                <ion-icon :icon="documentTextOutline"></ion-icon>
                <span>Generar Reporte</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ion-modal>

    <!-- Modal de Visualización de Reporte -->
    <ion-modal :is-open="mostrarModalReporte" @didDismiss="cerrarModalReporte">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="presentShareActionSheet">Compartir</ion-button>
          </ion-buttons>
          <ion-title class="ion-text-center">Reporte de Notas</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="cerrarModalReporte">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <div ref="reportContent" class="ion-padding">
          <div class="report-header ion-padding">
            <h3>Informe de Estudiantes</h3>
            <h6>Grado: {{ cursoSelected.name }}</h6>
            <h6>Área: {{ areaSelected.name }}</h6>
            <p>
              A continuación se listan los estudiantes con nota
              {{ reportConditionText }} {{ reportConfig.value }}.
            </p>
          </div>

          <!-- Tabla Corta -->
          <div v-if="reportConfig.format === 'short'">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Apellido</th>
                  <th>Nombre</th>
                  <th>Promedio</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="est in estudiantesReporte" :key="est.id">
                  <td>{{ est.lastName }}</td>
                  <td>{{ est.name }}</td>
                  <td :class="getGradeColorClass(est.promedioRegular)">
                    {{ est.promedioRegular }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tabla Detallada -->
          <div v-else>
            <div
              v-for="est in estudiantesReporte"
              :key="est.id"
              class="detailed-student"
            >
              <div class="student-info-header">
                <strong>{{ est.lastName }} {{ est.name }}</strong>
                <ion-chip :class="getGradeColorClass(est.promedioRegular)">
                  NC: {{ est.promedioRegular }}
                </ion-chip>
              </div>
              <table class="report-table detailed">
                <thead>
                  <tr>
                    <th>Dimensión / Item</th>
                    <th>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="dim in est.dimensionesRegular" :key="dim.id">
                    <tr class="dimension-row">
                      <td>
                        <strong>{{ dim.name }}</strong>
                      </td>
                      <td>
                        <strong :class="getGradeColorClass(dim.promedio)">{{
                          dim.promedio
                        }}</strong>
                      </td>
                    </tr>
                    <tr
                      v-for="nota in dim.notas"
                      :key="nota.id"
                      class="item-row"
                    >
                      <td class="item-name">
                        {{ nota.gradableItem?.title }}
                      </td>
                      <td :class="getGradeColorClass(nota.grade)">
                        {{ nota.grade !== null ? nota.grade : "Pendiente" }}
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Warning: recently enrolled students -->
          <div
            v-if="estudiantesNuevos.length > 0"
            class="new-students-warning ion-padding"
          >
            <p>
              <strong
                ><ion-icon
                  :icon="warningOutline"
                  class="qz-warning-icon"
                ></ion-icon>
                Aviso – Estudiantes de ingreso reciente</strong
              >
            </p>
            <p>
              Los siguientes estudiantes fueron asignados al curso hace menos de
              un mes. Su nota baja puede deberse a que no cuentan con las
              actividades anteriores a su llegada:
            </p>
            <ul>
              <li v-for="est in estudiantesNuevos" :key="est.id">
                {{ est.lastName }}, {{ est.name }}
                <em>(ingresó el {{ est.enrolledAt }})</em>
              </li>
            </ul>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Modal Generador de Planilla -->
    <generador-planilla
      :is-open="mostrarModalGeneradorPlanilla"
      :curso-id="cursoId"
      :area-id="areaId"
      :periodo-selected="periodoSelected"
      :year="year"
      :usuario="usuario"
      :usuarios-estudiantes="usuariosEstudiantes"
      @close="mostrarModalGeneradorPlanilla = false"
    ></generador-planilla>

    <!-- Modal de progreso de la generación ZIP (Estilo Queezy) -->
    <ion-modal
      :is-open="isGeneratingZip"
      :backdrop-dismiss="false"
      class="qz-zip-modal"
    >
      <div class="qz-zip-modal-wrapper">
        <!-- 1. Cabecera Hero Queezy -->
        <div class="qz-zip-modal-header">
          <div class="qz-zip-header-titles">
            <span class="qz-zip-tag">EXPORTACIÓN DE REPORTES</span>
            <h2 class="qz-zip-header-title">Generando Paquete</h2>
          </div>
          <button
            type="button"
            class="qz-zip-close-btn"
            @click="cancelarGeneracionZip"
            :disabled="isZipGenerationCancelled"
            title="Cancelar proceso"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>

        <!-- 2. Cuerpo del Modal -->
        <div class="qz-zip-modal-body">
          <div class="qz-zip-card">
            <!-- Squircle Icon con Gradiente Queezy -->
            <div class="qz-zip-squircle">
              <ion-icon :icon="downloadOutline"></ion-icon>
            </div>

            <h3 class="qz-zip-title">Empaquetando en ZIP</h3>

            <!-- Píldoras del contexto (Curso y Área) -->
            <div class="qz-zip-meta-row">
              <span class="qz-zip-meta-pill" v-if="cursoSelected?.name">
                <ion-icon :icon="schoolOutline"></ion-icon>
                <span>{{ cursoSelected.name }}</span>
              </span>
              <span class="qz-zip-meta-pill" v-if="areaSelected?.name">
                <ion-icon :icon="bookOutline"></ion-icon>
                <span>{{ areaSelected.name }}</span>
              </span>
            </div>

            <!-- Estado dinámico actual -->
            <div class="qz-zip-current-status">
              <span class="qz-zip-status-dot"></span>
              <span class="qz-zip-status-text">{{
                zipProgressText || "Iniciando proceso..."
              }}</span>
            </div>

            <!-- Bloque de Barra de Progreso Moderna -->
            <div class="qz-zip-progress-block">
              <div class="qz-zip-progress-header">
                <span class="qz-zip-progress-label"
                  >Progreso de exportación</span
                >
                <span class="qz-zip-progress-percent"
                  >{{ Math.round(zipProgressValue * 100) }}%</span
                >
              </div>
              <div class="qz-zip-track">
                <div
                  class="qz-zip-fill"
                  :style="{ width: Math.round(zipProgressValue * 100) + '%' }"
                ></div>
              </div>
            </div>

            <!-- Mensaje informativo -->
            <div class="qz-zip-info-box">
              <ion-icon
                :icon="sparklesOutline"
                class="qz-zip-info-icon"
              ></ion-icon>
              <span
                >Generando PDFs vectoriales nativos y protegidos por
                contraseña.</span
              >
            </div>

            <!-- Acción de Cancelación -->
            <div class="qz-zip-actions">
              <button
                type="button"
                class="qz-btn-cancel-zip"
                @click="cancelarGeneracionZip"
                :disabled="isZipGenerationCancelled"
              >
                <ion-icon :icon="closeOutline"></ion-icon>
                <span>{{
                  isZipGenerationCancelled
                    ? "Cancelando..."
                    : "Cancelar Proceso"
                }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ion-modal>

    <!-- Modal de Auditoría Contextual de Evaluaciones del Curso -->
    <ion-modal
      :is-open="mostrarModalAuditoria"
      @didDismiss="cerrarModalAuditoria"
      class="qz-audit-modal"
    >
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Auditoría de Evaluaciones</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="cerrarModalAuditoria">
              <ion-icon slot="icon-only" :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding qz-audit-modal-content">
        <!-- Cabecera Informativa -->
        <div class="qz-audit-modal-header-card">
          <div class="qz-audit-modal-header-info">
            <div class="qz-audit-modal-badge-row">
              <span class="qz-pill-tag">
                <ion-icon :icon="schoolOutline"></ion-icon>
                <span>{{ cursoSelected?.name || "Curso" }}</span>
              </span>
              <span class="qz-pill-tag" v-if="areaSelected?.name">
                <ion-icon :icon="bookOutline"></ion-icon>
                <span>{{ areaSelected.name }}</span>
              </span>
              <span class="qz-pill-tag">
                Año {{ year }} · Período {{ getPeriodoNombre(periodoSelected) }}
              </span>
            </div>
            <h2 class="qz-audit-modal-title">
              Seguimiento de Evaluaciones Pendientes
            </h2>
            <p class="qz-audit-modal-subtitle">
              Se auditan únicamente las evaluaciones donde otros estudiantes del
              grupo ya tienen nota registrada, excluyendo actividades que no
              decidiste calificar.
            </p>
          </div>

          <!-- Filtro de Categoría Queezy: Notas de clase / Refuerzos / Nivelaciones / Ver todas -->
          <div class="qz-audit-tabs-row">
            <button
              type="button"
              class="qz-audit-tab-btn"
              :class="{ 'is-active': filtroAuditoria === 'regular' }"
              @click="filtroAuditoria = 'regular'"
            >
              <ion-icon :icon="bookOutline"></ion-icon>
              <span>Notas de clase</span>
              <span class="qz-audit-tab-count">{{
                totalPendientesRegulares
              }}</span>
            </button>

            <button
              type="button"
              class="qz-audit-tab-btn"
              :class="{ 'is-active': filtroAuditoria === 'reinforcement' }"
              @click="filtroAuditoria = 'reinforcement'"
            >
              <ion-icon :icon="sparklesOutline"></ion-icon>
              <span>Refuerzos</span>
              <span class="qz-audit-tab-count">{{
                totalPendientesRefuerzos
              }}</span>
            </button>

            <button
              type="button"
              class="qz-audit-tab-btn"
              :class="{ 'is-active': filtroAuditoria === 'remedial' }"
              @click="filtroAuditoria = 'remedial'"
            >
              <ion-icon :icon="ribbonOutline"></ion-icon>
              <span>Nivelaciones</span>
              <span class="qz-audit-tab-count">{{
                totalPendientesNivelaciones
              }}</span>
            </button>
          </div>
        </div>

        <!-- Estado Vacío (Al día) -->
        <div
          v-if="estudiantesConPendientesFiltrados.length === 0"
          class="qz-audit-empty-card"
        >
          <div class="qz-audit-empty-icon-wrap">
            <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
          </div>
          <h3>{{ getEmptyStateTitle() }}</h3>
          <p>{{ getEmptyStateMessage() }}</p>
        </div>

        <!-- Lista de Estudiantes con Pendientes (Colapsable) -->
        <div v-else class="qz-audit-students-container">
          <!-- Barra de Acciones de la Lista: Contador y Expandir/Colapsar -->
          <div class="qz-audit-list-toolbar">
            <span class="qz-audit-list-caption">
              {{ estudiantesConPendientesFiltrados.length }}
              {{
                estudiantesConPendientesFiltrados.length === 1
                  ? "estudiante con pendientes"
                  : "estudiantes con pendientes"
              }}
            </span>
            <div class="qz-audit-toolbar-actions">
              <button
                type="button"
                class="qz-audit-link-btn"
                @click="expandAllAuditStudents"
              >
                Expandir todos
              </button>
              <span class="qz-audit-link-divider">·</span>
              <button
                type="button"
                class="qz-audit-link-btn"
                @click="collapseAllAuditStudents"
              >
                Colapsar todos
              </button>
            </div>
          </div>

          <div
            v-for="est in estudiantesConPendientesFiltrados"
            :key="est.id"
            class="qz-audit-student-box"
            :class="{ 'is-expanded': isAuditStudentExpanded(est.id) }"
          >
            <!-- Cabecera del Estudiante (Clickeable para colapsar/expandir) -->
            <div
              class="qz-audit-student-box-header"
              @click="toggleAuditStudent(est.id)"
              title="Toca para ver o colapsar actividades pendientes"
            >
              <div class="qz-audit-student-avatar">
                <span>{{ getStudentInitials(est.nombreCompleto) }}</span>
              </div>
              <div class="qz-audit-student-details">
                <span class="qz-audit-student-name">{{
                  est.nombreCompleto
                }}</span>
                <span class="qz-audit-student-count">
                  {{ est.pendientes.length }}
                  {{ est.pendientes.length === 1 ? "pendiente" : "pendientes" }}
                </span>
              </div>
              <button
                type="button"
                class="qz-audit-student-toggle-btn"
                :title="
                  isAuditStudentExpanded(est.id)
                    ? 'Colapsar actividades'
                    : 'Ver actividades pendientes'
                "
                @click.stop="toggleAuditStudent(est.id)"
              >
                <ion-icon
                  :icon="
                    isAuditStudentExpanded(est.id)
                      ? chevronUpOutline
                      : chevronDownOutline
                  "
                ></ion-icon>
              </button>
            </div>

            <!-- Lista de Actividades Pendientes del Estudiante (Colapsable) -->
            <div
              v-if="isAuditStudentExpanded(est.id)"
              class="qz-audit-pending-list"
            >
              <div
                v-for="item in est.pendientes"
                :key="item.key"
                class="qz-audit-pending-row"
              >
                <div class="qz-audit-pending-info">
                  <div class="qz-audit-tags-row">
                    <span
                      class="qz-item-tag"
                      :class="'qz-item-tag--' + item.tipoEvaluacion"
                    >
                      {{ item.tipoEvaluacionLabel }}
                    </span>
                    <span class="qz-item-tag qz-item-tag--dimension">
                      {{ item.dimensionName }}
                    </span>
                    <span class="qz-item-tag qz-item-tag--type">
                      <ion-icon :icon="item.tipoIcon"></ion-icon>
                      {{ item.tipo }}
                    </span>
                  </div>
                  <h4 class="qz-audit-item-title">{{ item.titulo }}</h4>
                  <p class="qz-audit-item-meta">
                    <ion-icon :icon="easelOutline"></ion-icon>
                    Lección: {{ item.leccion }}
                  </p>
                </div>

                <div class="qz-audit-pending-action">
                  <button
                    type="button"
                    class="qz-audit-btn-grade"
                    @click="calificarDesdeAuditoria(item.nota, est.id)"
                    title="Calificar nota de este estudiante"
                  >
                    <ion-icon :icon="createOutline"></ion-icon>
                    <span>Calificar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script>
import axios from "axios";
import { ref, computed, watch, nextTick } from "vue";
import { alertController, actionSheetController } from "@ionic/vue";
import {
  periodosGet,
  tokenHeader,
  usuarioGet,
  currentServerDate,
} from "../globalService";
import DomToImage from "dom-to-image";
import htmlToDocx from "html-to-docx";
import { Capacitor } from "@capacitor/core";
import { FileSharer } from "@byteowls/capacitor-filesharer";
import JSZip from "jszip";
import { jsPDF } from "jspdf";

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
  IonButton,
  IonModal,
  IonInput,
  IonButtons,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonSegment,
  IonSegmentButton,
  IonChip,
} from "@ionic/vue";
import { useRoute, useRouter } from "vue-router";
import {
  easelOutline,
  addOutline,
  pencilOutline,
  schoolOutline,
  documentTextOutline,
  shareOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  chevronUpOutline,
  chevronDownOutline,
  closeOutline,
  helpCircleOutline,
  createOutline,
  arrowBackOutline,
  sparklesOutline,
  calendarOutline,
  timeOutline,
  bookOutline,
  warningOutline,
  downloadOutline,
  ellipsisVerticalOutline,
  peopleOutline,
  ribbonOutline,
  funnelOutline,
  listOutline,
  readerOutline,
} from "ionicons/icons";
import { LessonType } from "../globalService";
import GeneradorPlanilla from "../components/GeneradorPlanilla.vue";

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
    IonButton,
    IonModal,
    IonInput,
    IonButtons,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonSegment,
    IonSegmentButton,
    IonChip,
    GeneradorPlanilla,
  },
  setup() {
    const router = useRouter();
    const goBack = () => router.back();
    const mroute = useRoute();
    const { year, cursoId, areaId } = mroute.params;
    const usuario = ref();
    const periodos = ref([]);
    const periodoSelected = ref();
    const usuariosEstudiantes = ref([]);
    const cursoSelected = ref({});
    const areaSelected = ref({});
    const reportContent = ref(null);

    const lessons = ref([]);
    const quizzes = ref([]);
    const activities = ref([]);
    const mostrarModal = ref(false);
    const modoEdicion = ref(false);
    const gradableTypeSelected = ref(null);
    const notaForm = ref({
      userId: null,
      lessonId: null,
      gradableId: null,
      gradableTitle: null,
      gradableType: null,
      periodId: null,
      grade: null,
      instituteId: null,
      id: null,
      exist: false,
    });

    const mostrarModalConfig = ref(false);
    const mostrarModalReporte = ref(false);
    const mostrarModalGeneradorPlanilla = ref(false);
    const reportConfig = ref({
      condition: "lte",
      value: 3.3,
      format: "short",
    });
    const estudiantesReporte = ref([]);
    const estudiantesNuevos = ref([]); // Students in report enrolled < 1 month ago

    const processStudentGrades = (
      allGrades,
      studentList,
      reinforcementStudents,
      remedialStudents,
      reinforcementMap, // studentId -> Set of lessonIds
      remedialMap, // studentId -> Set of lessonIds
    ) => {
      // 1. Build Master List of ALL Gradable Items (we will filter per type/student later)
      const masterItemsMap = new Map();

      allGrades.forEach((grade) => {
        if (grade.gradableItem && grade.gradableItem.id) {
          const uniqueKey = `${grade.gradableType}-${grade.gradableItem.id}-${grade.classification}`;
          if (!masterItemsMap.has(uniqueKey)) {
            masterItemsMap.set(uniqueKey, {
              id: grade.gradableItem.id,
              type: grade.gradableType,
              item: grade.gradableItem,
              classification: grade.classification,
            });
          }
        }
      });

      // Split Master List by Classification
      const masterKnowledge = Array.from(masterItemsMap.values()).filter(
        (i) => i.classification === "knowledge",
      );
      const masterExecution = Array.from(masterItemsMap.values()).filter(
        (i) => i.classification === "execution",
      );
      const masterBehavior = Array.from(masterItemsMap.values()).filter(
        (i) => i.classification === "behavior",
      );

      const mapToDisplayParamsWithMasterList = (studentGrades, masterList) => {
        return masterList
          .map((masterItem) => {
            const foundGrade = studentGrades.find(
              (g) =>
                g.gradableType === masterItem.type &&
                g.gradableItem.id === masterItem.id &&
                g.classification === masterItem.classification,
            );
            if (foundGrade) {
              return {
                id: foundGrade.id,
                gradableItem: foundGrade.gradableItem,
                gradableType: foundGrade.gradableType,
                classification: foundGrade.classification,
                grade: foundGrade.grade,
                isPending: false,
              };
            } else {
              // Create Pending Entry
              return {
                id: `pending-${masterItem.type}-${masterItem.id}`,
                gradableItem: masterItem.item,
                gradableType: masterItem.type,
                classification: masterItem.classification,
                grade: null, // Visual: Pending
                isPending: true,
              };
            }
          })
          .sort(
            (a, b) =>
              new Date(a.gradableItem.lesson.date) -
              new Date(b.gradableItem.lesson.date),
          );
      };

      const calculateAverageFromMasterList = (studentGrades, masterList) => {
        if (masterList.length === 0) return 0; // Return 0 if no items in the master list

        let totalScore = 0;
        const itemsConsideredCount = masterList.length; // All assigned items count towards the average

        masterList.forEach((masterItem) => {
          const foundGrade = studentGrades.find(
            (g) =>
              g.gradableType === masterItem.type &&
              g.gradableItem.id === masterItem.id,
          );
          // If grade exists and is not null, use it. Otherwise, treat as 0.
          totalScore +=
            foundGrade && foundGrade.grade !== null ? foundGrade.grade : 0;
        });

        const avg =
          itemsConsideredCount > 0 ? totalScore / itemsConsideredCount : 0;
        return itemsConsideredCount > 0 ? Math.max(avg, 1.0) : 0;
      };

      const formatGrade = (grade) => {
        if (grade === null || isNaN(grade)) return null;
        return Math.floor(grade * 10) / 10;
      };

      return studentList.map((estudiante) => {
        const hasReinforcement = reinforcementStudents.has(estudiante.id);
        const hasRemedial = remedialStudents.has(estudiante.id);

        const studentGrades = allGrades
          .filter((grade) => grade.user.id === estudiante.id)
          .map((n) => ({ ...n, grade: formatGrade(n.grade) }));

        // --- REGULAR GRADES LOGIC ---
        const masterKnowledgeRegular = masterKnowledge.filter(
          (i) => i.item.lesson?.type === LessonType.STANDARD,
        );
        const masterExecutionRegular = masterExecution.filter(
          (i) => i.item.lesson?.type === LessonType.STANDARD,
        );
        const masterBehaviorRegular = masterBehavior.filter(
          (i) => i.item.lesson?.type === LessonType.STANDARD,
        );

        const promSaberRegular = calculateAverageFromMasterList(
          studentGrades,
          masterKnowledgeRegular,
        );
        const promHacerRegular = calculateAverageFromMasterList(
          studentGrades,
          masterExecutionRegular,
        );
        const promSerRegular = calculateAverageFromMasterList(
          studentGrades,
          masterBehaviorRegular,
        );

        const promedioFinalRegular =
          (promSaberRegular + promHacerRegular + promSerRegular) / 3;

        // --- REINFORCEMENT GRADES LOGIC ---
        let promSaberReinf = 0,
          promHacerReinf = 0,
          promSerReinf = 0,
          promedioFinalReinf = 0;
        if (hasReinforcement) {
          // In NotasPage, areaId is fixed from route, and we already filtered the students by area
          // So any reinforcement item in the master list for this area applies.
          const masterKnowledgeReinf = masterKnowledge.filter(
            (i) => i.item.lesson?.type === LessonType.REINFORCEMENT,
          );
          const masterExecutionReinf = masterExecution.filter(
            (i) => i.item.lesson?.type === LessonType.REINFORCEMENT,
          );
          const masterBehaviorReinf = masterBehavior.filter(
            (i) => i.item.lesson?.type === LessonType.REINFORCEMENT,
          );

          promSaberReinf = calculateAverageFromMasterList(
            studentGrades,
            masterKnowledgeReinf,
          );
          promHacerReinf = calculateAverageFromMasterList(
            studentGrades,
            masterExecutionReinf,
          );
          promSerReinf = calculateAverageFromMasterList(
            studentGrades,
            masterBehaviorReinf,
          );
          promedioFinalReinf =
            (promSaberReinf + promHacerReinf + promSerReinf) / 3 > 4
              ? 4
              : (promSaberReinf + promHacerReinf + promSerReinf) / 3;
        }

        // --- REMEDIAL GRADES LOGIC ---
        let promSaberRemedial = 0,
          promHacerRemedial = 0,
          promSerRemedial = 0,
          promedioFinalRemedial = 0;
        if (hasRemedial) {
          const masterKnowledgeRemedial = masterKnowledge.filter(
            (i) => i.item.lesson?.type === LessonType.REMEDIAL,
          );
          const masterExecutionRemedial = masterExecution.filter(
            (i) => i.item.lesson?.type === LessonType.REMEDIAL,
          );
          const masterBehaviorRemedial = masterBehavior.filter(
            (i) => i.item.lesson?.type === LessonType.REMEDIAL,
          );

          promSaberRemedial = calculateAverageFromMasterList(
            studentGrades,
            masterKnowledgeRemedial,
          );
          promHacerRemedial = calculateAverageFromMasterList(
            studentGrades,
            masterExecutionRemedial,
          );
          promSerRemedial = calculateAverageFromMasterList(
            studentGrades,
            masterBehaviorRemedial,
          );
          promedioFinalRemedial =
            (promSaberRemedial + promHacerRemedial + promSerRemedial) / 3;
        }

        // Apply Hierarchy for the main student chip color: Remedial > Reinforcement > Regular
        let finalPromedio = Math.max(promedioFinalRegular, 1.0);
        if (hasReinforcement && promedioFinalReinf > 0) {
          finalPromedio = Math.max(
            finalPromedio,
            Math.max(promedioFinalReinf, 1.0),
          );
        }
        if (hasRemedial && promedioFinalRemedial > 0) {
          finalPromedio = Math.max(
            finalPromedio,
            Math.max(promedioFinalRemedial, 1.0),
          );
        }

        const getGradesByLessonType = (grades, lessonTypeFilter) => {
          return grades.filter(
            (g) => g.gradableItem?.lesson?.type === lessonTypeFilter,
          );
        };

        const dimensionesRegular = [
          {
            id: "knowledge",
            name: "Saber",
            promedio: formatGrade(promSaberRegular)?.toFixed(1),
            notas: mapToDisplayParamsWithMasterList(
              getGradesByLessonType(studentGrades, LessonType.STANDARD),
              masterKnowledge.filter(
                (i) => i.item.lesson?.type === LessonType.STANDARD,
              ),
            ),
          },
          {
            id: "execution",
            name: "Hacer",
            promedio: formatGrade(promHacerRegular)?.toFixed(1),
            notas: mapToDisplayParamsWithMasterList(
              getGradesByLessonType(studentGrades, LessonType.STANDARD),
              masterExecution.filter(
                (i) => i.item.lesson?.type === LessonType.STANDARD,
              ),
            ),
          },
          {
            id: "behavior",
            name: "Ser",
            promedio: formatGrade(promSerRegular)?.toFixed(1),
            notas: mapToDisplayParamsWithMasterList(
              getGradesByLessonType(studentGrades, LessonType.STANDARD),
              masterBehavior.filter(
                (i) => i.item.lesson?.type === LessonType.STANDARD,
              ),
            ),
          },
        ];

        const studentReinforcementLessons =
          reinforcementMap.get(estudiante.id) || new Set();
        const studentRemedialLessons =
          remedialMap.get(estudiante.id) || new Set();

        const dimensionesReinforcement = [
          {
            id: "knowledge",
            name: "Saber",
            promedio: formatGrade(promSaberReinf)?.toFixed(1),
            notas: mapToDisplayParamsWithMasterList(
              getGradesByLessonType(studentGrades, LessonType.REINFORCEMENT),
              masterKnowledge.filter(
                (i) =>
                  i.item.lesson?.type === LessonType.REINFORCEMENT &&
                  studentReinforcementLessons.has(i.item.lesson?.id),
              ),
            ),
          },
          {
            id: "execution",
            name: "Hacer",
            promedio: formatGrade(promHacerReinf)?.toFixed(1),
            notas: mapToDisplayParamsWithMasterList(
              getGradesByLessonType(studentGrades, LessonType.REINFORCEMENT),
              masterExecution.filter(
                (i) =>
                  i.item.lesson?.type === LessonType.REINFORCEMENT &&
                  studentReinforcementLessons.has(i.item.lesson?.id),
              ),
            ),
          },
          {
            id: "behavior",
            name: "Ser",
            promedio: formatGrade(promSerReinf)?.toFixed(1),
            notas: mapToDisplayParamsWithMasterList(
              getGradesByLessonType(studentGrades, LessonType.REINFORCEMENT),
              masterBehavior.filter(
                (i) =>
                  i.item.lesson?.type === LessonType.REINFORCEMENT &&
                  studentReinforcementLessons.has(i.item.lesson?.id),
              ),
            ),
          },
        ];

        const dimensionesRemedial = [
          {
            id: "knowledge",
            name: "Saber",
            promedio: formatGrade(promSaberRemedial)?.toFixed(1),
            notas: mapToDisplayParamsWithMasterList(
              getGradesByLessonType(studentGrades, LessonType.REMEDIAL),
              masterKnowledge.filter(
                (i) =>
                  i.item.lesson?.type === LessonType.REMEDIAL &&
                  studentRemedialLessons.has(i.item.lesson?.id),
              ),
            ),
          },
          {
            id: "execution",
            name: "Hacer",
            promedio: formatGrade(promHacerRemedial)?.toFixed(1),
            notas: mapToDisplayParamsWithMasterList(
              getGradesByLessonType(studentGrades, LessonType.REMEDIAL),
              masterExecution.filter(
                (i) =>
                  i.item.lesson?.type === LessonType.REMEDIAL &&
                  studentRemedialLessons.has(i.item.lesson?.id),
              ),
            ),
          },
          {
            id: "behavior",
            name: "Ser",
            promedio: formatGrade(promSerRemedial)?.toFixed(1),
            notas: mapToDisplayParamsWithMasterList(
              getGradesByLessonType(studentGrades, LessonType.REMEDIAL),
              masterBehavior.filter(
                (i) =>
                  i.item.lesson?.type === LessonType.REMEDIAL &&
                  studentRemedialLessons.has(i.item.lesson?.id),
              ),
            ),
          },
        ];

        return {
          ...estudiante,
          promedio: formatGrade(finalPromedio)?.toFixed(1), // Keep for main chip color
          hasReinforcement: hasReinforcement,
          hasRemedial: hasRemedial,
          promedioRegular: formatGrade(
            Math.max(promedioFinalRegular, 1.0),
          )?.toFixed(1),
          promedioRefuerzo: hasReinforcement
            ? formatGrade(Math.max(promedioFinalReinf, 1.0))?.toFixed(1)
            : 0,
          promedioNivelacion: hasRemedial
            ? formatGrade(Math.max(promedioFinalRemedial, 1.0))?.toFixed(1)
            : 0,
          dimensionesRegular,
          dimensionesReinforcement,
          dimensionesRemedial,
        };
      });
    };

    const getNotas = async () => {
      if (!periodoSelected.value) return;
      localStorage.setItem(
        "periodoSelected",
        JSON.stringify(periodoSelected.value),
      );

      try {
        const allGradesResponse = await axios.get(
          `/grades?year=${year}&courseId=${cursoId}&areaId=${areaId}&periodId=${periodoSelected.value}&instituteId=${usuario.value.institute.id}`,
          tokenHeader(),
        );
        const allGrades = allGradesResponse.data;

        const studentList = (
          await axios.get(
            `/courses/${cursoId}/users?&year=${year}&active=true`,
            tokenHeader(),
          )
        ).data
          .filter((estudiante) => estudiante.rol === "student")
          .map((estudiante) => estudiante.user);

        // Fetch Reinforcements (all for course/period)
        const reinforcementsResponse = await axios.get(
          `/reinforcement/by-context?courseId=${cursoId}&areaId=${areaId}&periodId=${periodoSelected.value}&year=${year}&lessonType=${LessonType.REINFORCEMENT}`,
          tokenHeader(),
        );
        // Map: studentId -> Set of reinforcement lessonIds
        const reinforcementMap = new Map();
        reinforcementsResponse.data.forEach((r) => {
          if (!reinforcementMap.has(r.student.id))
            reinforcementMap.set(r.student.id, new Set());
          if (r.lesson?.id) reinforcementMap.get(r.student.id).add(r.lesson.id);
        });

        const remedialResponse = await axios.get(
          `/reinforcement/by-context?courseId=${cursoId}&areaId=${areaId}&periodId=${periodoSelected.value}&year=${year}&lessonType=${LessonType.REMEDIAL}`,
          tokenHeader(),
        );
        // Map: studentId -> Set of remedial lessonIds
        const remedialMap = new Map();
        remedialResponse.data.forEach((r) => {
          if (!remedialMap.has(r.student.id))
            remedialMap.set(r.student.id, new Set());
          if (r.lesson?.id) remedialMap.get(r.student.id).add(r.lesson.id);
        });

        const reinforcementStudents = new Set(
          reinforcementsResponse.data.map((r) => r.student.id),
        );
        const remedialStudents = new Set(
          remedialResponse.data.map((r) => r.student.id),
        );

        usuariosEstudiantes.value = processStudentGrades(
          allGrades,
          studentList,
          reinforcementStudents,
          remedialStudents,
          reinforcementMap,
          remedialMap,
        ).sort((a, b) => {
          const lastNameA = a.lastName || "";
          const lastNameB = b.lastName || "";
          return lastNameA.localeCompare(lastNameB);
        });
      } catch (error) {
        console.error("Error fetching grades:", error);
      }
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      periodos.value = periodosGet();
      cursoSelected.value = await axios
        .get(`/courses/${cursoId}`, tokenHeader())
        .then((res) => res.data);
      areaSelected.value = await axios
        .get(`/areas/${areaId}`, tokenHeader())
        .then((res) => res.data);
      const storedPeriod = localStorage.getItem("periodoSelected");
      periodoSelected.value = storedPeriod
        ? JSON.parse(storedPeriod)
        : periodos.value[0]?.id || null;

      await getNotas();
    });

    const blurActiveElement = () => {
      if (
        typeof document !== "undefined" &&
        document.activeElement &&
        typeof document.activeElement.blur === "function"
      ) {
        document.activeElement.blur();
      }
    };

    const actualizarNotas = async () => {
      await getNotas();
    };

    const mostrarModalNuevaNota = async (estudianteId) => {
      blurActiveElement();
      modoEdicion.value = false;
      gradableTypeSelected.value = null;
      notaForm.value = {
        userId: estudianteId,
        lessonId: null,
        gradableId: null,
        gradableType: null,
        classification: "execution",
        periodId: periodoSelected.value,
        grade: null,
        instituteId: usuario.value.institute.id,
        exist: false,
      };
      await cargarLessons();
      mostrarModal.value = true;
    };

    const editarNota = async (nota, estudianteId) => {
      blurActiveElement();
      modoEdicion.value = true;
      notaForm.value = {
        userId: estudianteId,
        lessonId: nota.gradableItem.lesson.id,
        gradableId: nota.gradableItem.id,
        gradableType: nota.gradableType,
        classification: nota.classification || "execution",
        periodId: periodoSelected.value,
        gradableTitle: nota.gradableItem.title,
        grade: parseFloat(nota.grade),
        instituteId: usuario.value.institute.id,

        exist: true,
      };
      if (!nota.id.toString().startsWith("pending-")) {
        notaForm.value.id = nota.id;
      }
      await cargarLessons();
      await cargarGradableItemsForLesson(
        nota.gradableItem.lesson.id,
        nota.gradableItem.type,
      );
      mostrarModal.value = true;
    };

    const cargarLessons = async () => {
      try {
        const response = await axios.get(
          `/lessons?courseId=${cursoId}&periodId=${periodoSelected.value}&year=${year}&areaId=${areaId}&instituteId=${usuario.value.institute.id}`,
          tokenHeader(),
        );
        lessons.value = response.data;
      } catch (error) {
        console.error("Error al cargar las lecciones:", error);
      }
    };

    const cargarGradableItemsForLesson = async (lessonId, type) => {
      try {
        const endpoint = type === "quiz" ? "quizzes" : "activities";
        const response = await axios.get(
          `/${endpoint}?lessonId=${lessonId}`,
          tokenHeader(),
        );
        if (type === "quiz") {
          quizzes.value = response.data;
          activities.value = [];
        } else {
          activities.value = response.data;
          quizzes.value = [];
        }
      } catch (error) {
        console.error(`Error al cargar ${type}s:`, error);
      }
    };

    const onLessonSelected = async () => {
      if (notaForm.value.lessonId && gradableTypeSelected.value) {
        await cargarGradableItemsForLesson(
          notaForm.value.lessonId,
          gradableTypeSelected.value,
        );
      }
    };

    const onGradableTypeSelected = async () => {
      notaForm.value.gradableType = gradableTypeSelected.value;
      if (notaForm.value.lessonId) {
        await cargarGradableItemsForLesson(
          notaForm.value.lessonId,
          gradableTypeSelected.value,
        );
      }
    };

    const guardarNota = async () => {
      const gradeValue = parseFloat(notaForm.value.grade);
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 5) {
        const alert = await alertController.create({
          header: "Error de Validación",
          message: "La calificación debe ser un número entre 0 y 5.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      try {
        const payload = {
          userId: notaForm.value.userId,
          gradableId: notaForm.value.gradableId,
          gradableType: notaForm.value.gradableType,
          classification: notaForm.value.classification,
          periodId: notaForm.value.periodId,
          grade: parseFloat(notaForm.value.grade),
          instituteId: usuario.value.institute.id,
        };

        if (modoEdicion.value && notaForm.value?.id) {
          await axios.patch(
            `/grades/${notaForm.value?.id}`,
            { ...payload, exist: true },
            tokenHeader(),
          );
        } else if (modoEdicion.value && !notaForm.value?.id) {
          await axios.post(
            "/grades",
            { ...payload, exist: true },
            tokenHeader(),
          );
        } else {
          await axios.post("/grades", payload, tokenHeader());
        }
        await getNotas();
        cerrarModal();
      } catch (error) {
        console.error("Error al guardar la nota:", error);
        alert(error);
      }
    };

    const cerrarModal = () => {
      mostrarModal.value = false;
    };

    const abrirModalConfig = () => {
      mostrarModalConfig.value = true;
    };

    const cerrarModalConfig = () => {
      mostrarModalConfig.value = false;
    };

    const cerrarModalReporte = () => {
      mostrarModalReporte.value = false;
    };

    const generarReporte = async () => {
      const val = parseFloat(reportConfig.value.value);
      if (isNaN(val)) return;

      estudiantesReporte.value = usuariosEstudiantes.value.filter((est) => {
        const prom = parseFloat(est.promedioRegular);
        if (isNaN(prom)) return false;

        switch (reportConfig.value.condition) {
          case "lt":
            return prom < val;
          case "lte":
            return prom <= val;
          case "eq":
            return prom === val;
          case "gt":
            return prom > val;
          case "gte":
            return prom >= val;
          default:
            return false;
        }
      });

      // For "lower than" conditions, detect recently enrolled students (< 1 month)
      estudiantesNuevos.value = [];
      if (
        reportConfig.value.condition === "lt" ||
        reportConfig.value.condition === "lte"
      ) {
        try {
          const enrollmentResponse = await axios.get(
            `/courses/${cursoId}/users?year=${year}&active=true`,
            tokenHeader(),
          );
          const oneMonthAgo = currentServerDate();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

          const reportIds = new Set(estudiantesReporte.value.map((e) => e.id));
          estudiantesNuevos.value = enrollmentResponse.data
            .filter((enrollment) => {
              if (!reportIds.has(enrollment.user?.id)) return false;
              const enrolledAt = new Date(enrollment.createdAt);
              return enrolledAt > oneMonthAgo;
            })
            .map((enrollment) => ({
              id: enrollment.user.id,
              name: enrollment.user.name,
              lastName: enrollment.user.lastName,
              enrolledAt: new Date(enrollment.createdAt).toLocaleDateString(),
            }));
        } catch (error) {
          console.error("Error fetching enrollment dates:", error);
        }
      }

      mostrarModalConfig.value = false;
      mostrarModalReporte.value = true;
    };

    const reportConditionText = computed(() => {
      switch (reportConfig.value.condition) {
        case "lt":
          return "menor a";
        case "lte":
          return "igual o menor a";
        case "eq":
          return "igual a";
        case "gt":
          return "mayor a";
        case "gte":
          return "igual o mayor a";
        default:
          return "";
      }
    });

    const lessonName = computed(() => {
      if (!notaForm.value.lessonId) return "";
      const lesson = lessons.value.find(
        (l) => l.id === notaForm.value.lessonId,
      );
      return lesson
        ? `${lesson.topic} (${new Date(lesson.date).toLocaleDateString()})`
        : "";
    });

    const gradableItemName = computed(() => {
      if (!notaForm.value.gradableId || !gradableTypeSelected.value) return "";
      const source =
        gradableTypeSelected.value === "quiz"
          ? quizzes.value
          : activities.value;
      const item = source.find((i) => i.id === notaForm.value.gradableId);
      return item ? item.title : "";
    });

    const getGradeColorClass = (grade) => {
      if (grade === null || isNaN(grade)) return "";
      const numericGrade = parseFloat(grade);
      if (numericGrade < 3.0) return "red-grade";
      if (numericGrade >= 3.0 && numericGrade < 4.0) return "orange-grade";
      if (numericGrade >= 4.0 && numericGrade < 4.5) return "light-green-grade";
      if (numericGrade >= 4.5) return "dark-green-grade";
      return "";
    };

    const shareAsImage = async () => {
      const reportElement = reportContent.value;
      if (!reportElement) return;

      const loading = await alertController.create({
        header: "Imagen",
        message: "Por favor espere mientras se genera la imagen",
        backdropDismiss: false,
      });

      // Get the background color from the ion-content parent
      const contentElement = reportElement.closest("ion-content");
      const backgroundColor = contentElement
        ? window
            .getComputedStyle(contentElement)
            .getPropertyValue("--ion-background-color")
            .trim()
        : "#ffffff"; // Fallback to white if not found

      const canvas = await DomToImage.toPng(reportElement, {
        width: reportElement.offsetWidth * 2,
        height: reportElement.offsetHeight * 2,
        bgcolor: backgroundColor || "#ffffff", // Ensure there's always a color
        style: {
          transform: "scale(2)",
          transformOrigin: "top left",
        },
      }).finally(() => {
        loading.dismiss();
      });

      const fileName = `reporte-notas-${cursoSelected.value.name}-${
        JSON.parse(localStorage.getItem("periodos")).find(
          (p) => p.id === periodoSelected.value,
        )?.name
      }-${year}.png`;

      if (Capacitor.isNativePlatform()) {
        try {
          await FileSharer.share({
            filename: fileName,
            contentType: "image/png",
            base64Data: canvas.split(",")[1],
          });
        } catch (error) {
          console.error("Error sharing image:", error);
        }
      } else {
        // Web
        const link = document.createElement("a");
        link.download = fileName;
        link.href = canvas;
        link.click();
      }
    };

    const shareAsWord = async () => {
      const reportElement = reportContent.value;
      if (!reportElement) return;

      const loading = await alertController.create({
        header: "Word",
        message: "Por favor espere mientras se genera el documento",
        backdropDismiss: false,
      });

      try {
        const htmlString = reportElement.outerHTML;
        const fileBuffer = await htmlToDocx(htmlString, null, {
          table: { row: { cantSplit: true } },
          footer: true,
          pageNumber: true,
        });

        loading.dismiss();

        const fileName = `reporte-notas-${cursoSelected.value.name}-${
          areaSelected.value.name
        }-${
          JSON.parse(localStorage.getItem("periodos")).find(
            (p) => p.id === periodoSelected.value,
          )?.name
        }-${year}.docx`;
        const blob = new Blob([fileBuffer], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async function () {
          const base64data = reader.result;

          if (Capacitor.isNativePlatform()) {
            await FileSharer.share({
              filename: fileName,
              contentType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              base64Data: base64data.split(",")[1],
            });
          } else {
            // Web
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
          }
        };
      } catch (error) {
        loading.dismiss();
        console.error("Error sharing as Word:", error);
        const alert = await alertController.create({
          header: "Error",
          message: "No se pudo generar el archivo de Word.",
          buttons: ["OK"],
        });
        await alert.present();
      }
    };

    const presentShareActionSheet = async () => {
      const buttons = [];
      if (reportConfig.value.format === "short") {
        buttons.push({
          text: "Compartir como Imagen",
          handler: shareAsImage,
        });
      }
      buttons.push({
        text: "Compartir como Word",
        handler: shareAsWord,
      });
      buttons.push({
        text: "Cancelar",
        role: "cancel",
      });

      const actionSheet = await actionSheetController.create({
        header: "Compartir Reporte",
        buttons: buttons,
      });
      await actionSheet.present();
    };

    const descargarPlanilla = async () => {
      mostrarModalGeneradorPlanilla.value = true;
    };

    const isGeneratingZip = ref(false);
    const zipProgressValue = ref(0);
    const zipProgressText = ref("");
    const studentToRender = ref(null);
    const isZipGenerationCancelled = ref(false);

    const cancelarGeneracionZip = () => {
      if (isZipGenerationCancelled.value) return;
      isZipGenerationCancelled.value = true;
      zipProgressText.value = "Cancelando, por favor espere...";
    };

    // Función para ceder agresivamente el hilo principal al navegador
    // Permite que se procesen eventos de click y se pinte la pantalla
    const yieldThread = (ms = 0) =>
      new Promise((resolve) => {
        const { port1, port2 } = new MessageChannel();
        port1.onmessage = () => setTimeout(resolve, ms);
        port2.postMessage(null);
      });

    const generateStudentReportPdf = (student, curso, area) => {
      const password = (student.code || student.document || "1234").toString();

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
        encryption: {
          userPassword: password,
          ownerPassword: password,
          userPermissions: ["print", "copy"],
        },
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const marginX = 15;
      const contentWidth = pageWidth - marginX * 2; // 180 mm
      const bottomMargin = 16;
      const topMargin = 20;

      let currentY = topMargin;

      const drawPageHeader = () => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(120, 130, 150);
        pdf.text("Reporte de Calificaciones", marginX, 12);

        const rightHeader =
          (curso?.name || "") + (area?.name ? " - " + area.name : "");
        if (rightHeader) {
          const rightHeaderWidth = pdf.getTextWidth(rightHeader);
          pdf.text(rightHeader, pageWidth - marginX - rightHeaderWidth, 12);
        }

        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.35);
        pdf.line(marginX, 14, pageWidth - marginX, 14);
      };

      const checkPageBreak = (neededHeight) => {
        if (currentY + neededHeight > pageHeight - bottomMargin) {
          pdf.addPage("a4", "portrait");
          drawPageHeader();
          currentY = topMargin;
          return true;
        }
        return false;
      };

      const getGradeRgb = (grade) => {
        if (grade === null || grade === undefined || isNaN(grade))
          return [120, 130, 150];
        const val = parseFloat(grade);
        if (val < 3.0) return [211, 47, 47]; // Rojo
        if (val < 4.0) return [230, 120, 0]; // Naranja
        if (val < 4.5) return [46, 125, 50]; // Verde
        return [27, 94, 32]; // Verde oscuro
      };

      // Encabezado en página 1
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.setTextColor(26, 26, 46);
      pdf.text("Reporte de Notas del Estudiante", marginX, currentY);
      currentY += 7;

      // Tarjeta de información del estudiante
      const cardHeight = 20;
      pdf.setFillColor(248, 249, 252);
      pdf.roundedRect(marginX, currentY, contentWidth, cardHeight, 3, 3, "F");
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(marginX, currentY, contentWidth, cardHeight, 3, 3, "S");

      const col1X = marginX + 5;
      const col2X = marginX + contentWidth / 2 + 5;
      const row1Y = currentY + 6.5;
      const row2Y = currentY + 14.5;

      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(70, 80, 100);
      pdf.text("Estudiante:", col1X, row1Y);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(20, 20, 30);
      const studentNameStr = (
        (student.lastName || "") +
        " " +
        (student.name || "")
      ).trim();
      pdf.text(studentNameStr, col1X + 18, row1Y);

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(70, 80, 100);
      pdf.text("Código:", col1X, row2Y);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(20, 20, 30);
      pdf.text(
        String(student.document || student.code || "N/A"),
        col1X + 18,
        row2Y,
      );

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(70, 80, 100);
      pdf.text("Curso:", col2X, row1Y);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(20, 20, 30);
      pdf.text(String(curso?.name || "N/A"), col2X + 14, row1Y);

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(70, 80, 100);
      pdf.text("Área:", col2X, row2Y);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(20, 20, 30);
      pdf.text(String(area?.name || "N/A"), col2X + 14, row2Y);

      currentY += cardHeight + 5;

      // Insignias de promedios
      const badges = [];
      if (
        student.promedioRegular !== null &&
        student.promedioRegular !== undefined
      ) {
        badges.push({
          label: "Promedio Notas de clase:",
          value: student.promedioRegular,
        });
      }
      if (student.hasReinforcement && student.promedioRefuerzo) {
        badges.push({
          label: "Promedio Refuerzo:",
          value: student.promedioRefuerzo,
        });
      }
      if (student.hasRemedial && student.promedioNivelacion) {
        badges.push({
          label: "Promedio Nivelación:",
          value: student.promedioNivelacion,
        });
      }

      if (badges.length > 0) {
        const badgeGap = 4;
        const badgeW =
          (contentWidth - badgeGap * (badges.length - 1)) / badges.length;
        const badgeH = 10;

        badges.forEach((b, idx) => {
          const bx = marginX + idx * (badgeW + badgeGap);
          pdf.setFillColor(244, 245, 250);
          pdf.roundedRect(bx, currentY, badgeW, badgeH, 2, 2, "F");
          pdf.setDrawColor(220, 225, 235);
          pdf.setLineWidth(0.25);
          pdf.roundedRect(bx, currentY, badgeW, badgeH, 2, 2, "S");

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(70, 80, 100);
          pdf.text(b.label, bx + 3.5, currentY + 6.5);

          const valRgb = getGradeRgb(b.value);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.setTextColor(valRgb[0], valRgb[1], valRgb[2]);
          const valStr = String(b.value);
          const valW = pdf.getTextWidth(valStr);
          pdf.text(valStr, bx + badgeW - valW - 3.5, currentY + 6.5);
        });

        currentY += badgeH + 6;
      }

      // Dibujador de secciones
      const drawSectionTable = (title, dimensiones) => {
        if (!dimensiones || dimensiones.length === 0) return;
        const hasAnyGrade = dimensiones.some(
          (d) => d.notas && d.notas.length > 0,
        );
        if (!hasAnyGrade) return;

        checkPageBreak(22);

        // Barra de acento morado Queezy
        pdf.setFillColor(106, 90, 224);
        pdf.rect(marginX, currentY, 3, 5.5, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10.5);
        pdf.setTextColor(30, 30, 50);
        pdf.text(title, marginX + 6, currentY + 4.5);
        currentY += 8;

        const colGradeWidth = 32;
        const colItemWidth = contentWidth - colGradeWidth;
        const headerHeight = 6.5;

        pdf.setFillColor(235, 238, 245);
        pdf.rect(marginX, currentY, contentWidth, headerHeight, "F");
        pdf.setDrawColor(215, 220, 230);
        pdf.setLineWidth(0.25);
        pdf.rect(marginX, currentY, contentWidth, headerHeight, "S");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(50, 60, 80);
        pdf.text("Dimensión / Actividad", marginX + 4, currentY + 4.5);

        const thGradeText = "Calificación";
        const thGradeW = pdf.getTextWidth(thGradeText);
        pdf.text(
          thGradeText,
          marginX + colItemWidth + (colGradeWidth - thGradeW) / 2,
          currentY + 4.5,
        );

        currentY += headerHeight;

        dimensiones.forEach((dim) => {
          if (!dim.notas || dim.notas.length === 0) return;

          checkPageBreak(12);

          const dimRowH = 6;
          pdf.setFillColor(245, 247, 252);
          pdf.rect(marginX, currentY, contentWidth, dimRowH, "F");
          pdf.setDrawColor(220, 225, 235);
          pdf.setLineWidth(0.2);
          pdf.rect(marginX, currentY, contentWidth, dimRowH, "S");

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8.5);
          pdf.setTextColor(40, 45, 65);
          pdf.text(String(dim.name || ""), marginX + 4, currentY + 4.2);

          if (
            dim.promedio !== null &&
            dim.promedio !== undefined &&
            dim.promedio !== ""
          ) {
            const dimPromRgb = getGradeRgb(dim.promedio);
            pdf.setTextColor(dimPromRgb[0], dimPromRgb[1], dimPromRgb[2]);
            const dimPromStr = String(dim.promedio);
            const dimPromW = pdf.getTextWidth(dimPromStr);
            pdf.text(
              dimPromStr,
              marginX + colItemWidth + (colGradeWidth - dimPromW) / 2,
              currentY + 4.2,
            );
          }
          currentY += dimRowH;

          dim.notas.forEach((nota, nIdx) => {
            const itemTitle = nota.gradableItem?.title || "Sin título";
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            const lines = pdf.splitTextToSize(itemTitle, colItemWidth - 12);
            const rowH = Math.max(5.5, lines.length * 3.6 + 2.2);

            checkPageBreak(rowH + 1);

            if (nIdx % 2 === 1) {
              pdf.setFillColor(252, 253, 255);
              pdf.rect(marginX, currentY, contentWidth, rowH, "F");
            }
            pdf.setDrawColor(230, 235, 242);
            pdf.setLineWidth(0.15);
            pdf.rect(marginX, currentY, contentWidth, rowH, "S");

            pdf.setTextColor(60, 70, 85);
            let textY = currentY + 3.8;
            for (const line of lines) {
              pdf.text(line, marginX + 8, textY);
              textY += 3.6;
            }

            const middleY = currentY + rowH / 2 + 1.1;
            if (
              nota.grade !== null &&
              nota.grade !== undefined &&
              !nota.isPending
            ) {
              const valNum = parseFloat(nota.grade);
              const valStr = isNaN(valNum)
                ? String(nota.grade)
                : valNum.toFixed(1);
              const gradeRgb = getGradeRgb(valNum);
              pdf.setFont("helvetica", "bold");
              pdf.setFontSize(8.5);
              pdf.setTextColor(gradeRgb[0], gradeRgb[1], gradeRgb[2]);
              const gw = pdf.getTextWidth(valStr);
              pdf.text(
                valStr,
                marginX + colItemWidth + (colGradeWidth - gw) / 2,
                middleY,
              );
            } else {
              pdf.setFont("helvetica", "italic");
              pdf.setFontSize(7.5);
              pdf.setTextColor(150, 155, 170);
              const pendText = "Pendiente";
              const pw = pdf.getTextWidth(pendText);
              pdf.text(
                pendText,
                marginX + colItemWidth + (colGradeWidth - pw) / 2,
                middleY,
              );
            }

            currentY += rowH;
          });
        });

        currentY += 6;
      };

      drawSectionTable("Notas de clase", student.dimensionesRegular);

      if (
        student.dimensionesReinforcement &&
        student.dimensionesReinforcement.some(
          (d) => d.notas && d.notas.length > 0,
        )
      ) {
        drawSectionTable("Notas de Refuerzo", student.dimensionesReinforcement);
      }

      if (
        student.dimensionesRemedial &&
        student.dimensionesRemedial.some((d) => d.notas && d.notas.length > 0)
      ) {
        drawSectionTable("Notas de Nivelación", student.dimensionesRemedial);
      }

      const totalPages = pdf.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(140, 150, 165);
        const footerText = "Página " + p + " de " + totalPages;
        const fw = pdf.getTextWidth(footerText);
        pdf.text(footerText, pageWidth - marginX - fw, pageHeight - 8);

        const genDateStr = "Generado el " + new Date().toLocaleDateString();
        pdf.text(genDateStr, marginX, pageHeight - 8);
      }

      return pdf.output("arraybuffer");
    };

    const descargarPaqueteReportes = async () => {
      if (
        !usuariosEstudiantes.value ||
        usuariosEstudiantes.value.length === 0
      ) {
        alert("No hay estudiantes para procesar.");
        return;
      }

      blurActiveElement();
      isGeneratingZip.value = true;
      zipProgressValue.value = 0;
      isZipGenerationCancelled.value = false;

      const zip = new JSZip();
      const total = usuariosEstudiantes.value.length;

      // Breve pausa inicial para mostrar el modal de progreso
      await yieldThread(100);

      if (isZipGenerationCancelled.value) {
        isGeneratingZip.value = false;
        return;
      }

      for (let i = 0; i < total; i++) {
        if (isZipGenerationCancelled.value) {
          zipProgressText.value = "Generación cancelada.";
          isGeneratingZip.value = false;
          return;
        }

        const est = usuariosEstudiantes.value[i];
        zipProgressText.value = `Generando reporte para ${est.lastName} ${
          est.name
        } (${i + 1}/${total})...`;
        zipProgressValue.value = i / total;

        try {
          const pdfArrayBuffer = generateStudentReportPdf(
            est,
            cursoSelected.value,
            areaSelected.value,
          );
          zip.file(`${est.lastName}_${est.name}_Reporte.pdf`, pdfArrayBuffer);
        } catch (err) {
          console.error("Error generando PDF para", est.name, err);
        }

        // Breve pausa para refrescar UI y capturar eventos de cancelación
        await yieldThread(15);

        if (isZipGenerationCancelled.value) {
          isGeneratingZip.value = false;
          return;
        }
      }

      if (isZipGenerationCancelled.value) {
        isGeneratingZip.value = false;
        return;
      }

      zipProgressText.value = "Comprimiendo archivo ZIP...";
      zipProgressValue.value = 1;
      await yieldThread(50);

      try {
        const blob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });

        // Trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Reportes_${cursoSelected.value?.name || "Curso"}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Error comprimiendo ZIP", e);
        alert("Ocurrió un error al generar el archivo ZIP.");
      } finally {
        isGeneratingZip.value = false;
      }
    };

    const presentReportActionSheet = async () => {
      const actionSheet = await actionSheetController.create({
        header: "Opciones de Reporte",
        buttons: [
          {
            text: "Generar Reporte",
            handler: () => {
              abrirModalConfig();
            },
          },
          {
            text: "Descargar Paquete de Reportes (ZIP/PDF)",
            handler: () => {
              descargarPaqueteReportes();
            },
          },
          {
            text: "Descargar Planilla para Plataforma de Notas",
            handler: () => {
              descargarPlanilla();
            },
          },

          {
            text: "Cancelar",
            role: "cancel",
          },
        ],
      });
      await actionSheet.present();
    };

    // ==========================================
    // AUDITORÍA CONTEXTUAL DE EVALUACIONES
    // ==========================================
    const mostrarModalAuditoria = ref(false);
    const filtroAuditoria = ref("regular");
    const expandedAuditStudentIds = ref(new Set());

    const toggleAuditStudent = (studentId) => {
      if (expandedAuditStudentIds.value.has(studentId)) {
        expandedAuditStudentIds.value.delete(studentId);
      } else {
        expandedAuditStudentIds.value.add(studentId);
      }
    };

    const isAuditStudentExpanded = (studentId) => {
      return expandedAuditStudentIds.value.has(studentId);
    };

    const expandAllAuditStudents = () => {
      estudiantesConPendientesFiltrados.value.forEach((est) => {
        expandedAuditStudentIds.value.add(est.id);
      });
    };

    const collapseAllAuditStudents = () => {
      expandedAuditStudentIds.value.clear();
    };

    const abrirModalAuditoria = () => {
      if (totalPendientesRegulares.value > 0) {
        filtroAuditoria.value = "regular";
      } else if (totalPendientesRefuerzos.value > 0) {
        filtroAuditoria.value = "reinforcement";
      } else if (totalPendientesNivelaciones.value > 0) {
        filtroAuditoria.value = "remedial";
      } else {
        filtroAuditoria.value = "regular";
      }

      expandedAuditStudentIds.value = new Set();
      if (estudiantesConPendientesFiltrados.value.length === 1) {
        expandedAuditStudentIds.value.add(
          estudiantesConPendientesFiltrados.value[0].id,
        );
      }
      mostrarModalAuditoria.value = true;
    };

    const abrirModalAuditoriaConFiltro = (cat = "regular") => {
      filtroAuditoria.value = cat;
      expandedAuditStudentIds.value = new Set();
      if (estudiantesConPendientesFiltrados.value.length === 1) {
        expandedAuditStudentIds.value.add(
          estudiantesConPendientesFiltrados.value[0].id,
        );
      }
      mostrarModalAuditoria.value = true;
    };

    const getEmptyStateTitle = () => {
      switch (filtroAuditoria.value) {
        case "regular":
          return "Notas de clase al día";
        case "reinforcement":
          return "Refuerzos al día";
        case "remedial":
          return "Nivelaciones al día";
        default:
          return "Notas de clase al día";
      }
    };

    const getEmptyStateMessage = () => {
      switch (filtroAuditoria.value) {
        case "regular":
          return "No se encontraron notas de clase pendientes por calificar en este curso.";
        case "reinforcement":
          return "No hay evaluaciones de refuerzo pendientes por calificar. Todas las actividades de refuerzo evaluadas están al día.";
        case "remedial":
          return "No hay evaluaciones de nivelación pendientes por calificar. Todas las actividades de nivelación evaluadas están al día.";
        default:
          return "No se encontraron notas de clase pendientes por calificar en este curso.";
      }
    };

    watch(filtroAuditoria, () => {
      expandedAuditStudentIds.value = new Set();
      if (estudiantesConPendientesFiltrados.value.length === 1) {
        expandedAuditStudentIds.value.add(
          estudiantesConPendientesFiltrados.value[0].id,
        );
      }
    });

    const cerrarModalAuditoria = () => {
      mostrarModalAuditoria.value = false;
    };

    const calificarDesdeAuditoria = async (nota, estudianteId) => {
      mostrarModalAuditoria.value = false;
      await nextTick();
      await editarNota(nota, estudianteId);
    };

    const getPeriodoNombre = (id) => {
      if (!periodos.value || periodos.value.length === 0) return "N/A";
      const p = periodos.value.find((item) => item.id === id);
      return p ? p.name : "N/A";
    };

    const getStudentInitials = (name) => {
      if (!name) return "E";
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    const listaEstudiantesConPendientes = computed(() => {
      if (
        !usuariosEstudiantes.value ||
        usuariosEstudiantes.value.length === 0
      ) {
        return [];
      }

      const resultado = [];

      usuariosEstudiantes.value.forEach((estudiante) => {
        const pendientes = [];

        // 1. Regulares (donde otros estudiantes ya tienen nota registrada, pero este no)
        if (
          estudiante.dimensionesRegular &&
          Array.isArray(estudiante.dimensionesRegular)
        ) {
          estudiante.dimensionesRegular.forEach((dim) => {
            if (dim.notas && Array.isArray(dim.notas)) {
              dim.notas.forEach((n) => {
                if (n.isPending || n.grade === null) {
                  pendientes.push({
                    key: `reg-${dim.id}-${n.id}`,
                    tipoEvaluacion: "regular",
                    tipoEvaluacionLabel: "Nota de clase",
                    dimensionName: dim.name,
                    nota: n,
                    titulo: n.gradableItem?.title || "Sin título",
                    leccion: n.gradableItem?.lesson?.topic || "Sin lección",
                    tipo:
                      n.gradableType === "quiz" ? "Cuestionario" : "Actividad",
                    tipoIcon:
                      n.gradableType === "quiz"
                        ? helpCircleOutline
                        : easelOutline,
                  });
                }
              });
            }
          });
        }

        // 2. Refuerzos asignados a este estudiante con nota faltante
        if (
          estudiante.hasReinforcement &&
          estudiante.dimensionesReinforcement &&
          Array.isArray(estudiante.dimensionesReinforcement)
        ) {
          estudiante.dimensionesReinforcement.forEach((dim) => {
            if (dim.notas && Array.isArray(dim.notas)) {
              dim.notas.forEach((n) => {
                if (n.isPending || n.grade === null) {
                  pendientes.push({
                    key: `reinf-${dim.id}-${n.id}`,
                    tipoEvaluacion: "reinforcement",
                    tipoEvaluacionLabel: "Refuerzo",
                    dimensionName: dim.name,
                    nota: n,
                    titulo: n.gradableItem?.title || "Sin título",
                    leccion: n.gradableItem?.lesson?.topic || "Sin lección",
                    tipo:
                      n.gradableType === "quiz" ? "Cuestionario" : "Actividad",
                    tipoIcon:
                      n.gradableType === "quiz"
                        ? helpCircleOutline
                        : easelOutline,
                  });
                }
              });
            }
          });
        }

        // 3. Nivelaciones asignadas a este estudiante con nota faltante
        if (
          estudiante.hasRemedial &&
          estudiante.dimensionesRemedial &&
          Array.isArray(estudiante.dimensionesRemedial)
        ) {
          estudiante.dimensionesRemedial.forEach((dim) => {
            if (dim.notas && Array.isArray(dim.notas)) {
              dim.notas.forEach((n) => {
                if (n.isPending || n.grade === null) {
                  pendientes.push({
                    key: `remed-${dim.id}-${n.id}`,
                    tipoEvaluacion: "remedial",
                    tipoEvaluacionLabel: "Nivelación",
                    dimensionName: dim.name,
                    nota: n,
                    titulo: n.gradableItem?.title || "Sin título",
                    leccion: n.gradableItem?.lesson?.topic || "Sin lección",
                    tipo:
                      n.gradableType === "quiz" ? "Cuestionario" : "Actividad",
                    tipoIcon:
                      n.gradableType === "quiz"
                        ? helpCircleOutline
                        : easelOutline,
                  });
                }
              });
            }
          });
        }

        if (pendientes.length > 0) {
          resultado.push({
            id: estudiante.id,
            nombreCompleto: `${estudiante.lastName || ""} ${
              estudiante.name || ""
            }`.trim(),
            pendientes,
          });
        }
      });

      return resultado;
    });

    const totalEstudiantesConPendientes = computed(() => {
      return listaEstudiantesConPendientes.value.length;
    });

    const totalPendientesCurso = computed(() => {
      return listaEstudiantesConPendientes.value.reduce(
        (acc, est) => acc + est.pendientes.length,
        0,
      );
    });

    const totalPendientesRegulares = computed(() => {
      return listaEstudiantesConPendientes.value.reduce(
        (acc, est) =>
          acc +
          est.pendientes.filter((p) => p.tipoEvaluacion === "regular").length,
        0,
      );
    });

    const totalPendientesRefuerzos = computed(() => {
      return listaEstudiantesConPendientes.value.reduce(
        (acc, est) =>
          acc +
          est.pendientes.filter((p) => p.tipoEvaluacion === "reinforcement")
            .length,
        0,
      );
    });

    const totalPendientesNivelaciones = computed(() => {
      return listaEstudiantesConPendientes.value.reduce(
        (acc, est) =>
          acc +
          est.pendientes.filter((p) => p.tipoEvaluacion === "remedial").length,
        0,
      );
    });

    const estudiantesConPendientesFiltrados = computed(() => {
      return listaEstudiantesConPendientes.value
        .map((est) => {
          const filtrados = est.pendientes.filter(
            (p) => p.tipoEvaluacion === filtroAuditoria.value,
          );
          if (filtrados.length > 0) {
            return {
              ...est,
              pendientes: filtrados,
            };
          }
          return null;
        })
        .filter((e) => e !== null);
    });

    return {
      usuario,
      usuariosEstudiantes,
      periodos,
      periodoSelected,
      easelOutline,
      addOutline,
      pencilOutline,
      actualizarNotas,
      mostrarModal,
      LessonType,
      modoEdicion,
      lessons,
      quizzes,
      activities,
      notaForm,
      gradableTypeSelected,
      mostrarModalNuevaNota,
      editarNota,
      guardarNota,
      cerrarModal,
      onLessonSelected,
      onGradableTypeSelected,
      lessonName,
      gradableItemName,
      schoolOutline,
      year,
      cursoId,
      getGradeColorClass,
      mostrarModalConfig,
      mostrarModalReporte,
      reportConfig,
      estudiantesReporte,
      estudiantesNuevos,
      abrirModalConfig,
      cerrarModalConfig,
      cerrarModalReporte,
      generarReporte,
      reportConditionText,
      documentTextOutline,
      cursoSelected,
      areaSelected,
      shareOutline,
      presentShareActionSheet,
      presentReportActionSheet,
      descargarPlanilla,
      mostrarModalGeneradorPlanilla,
      reportContent,
      areaId,
      isGeneratingZip,
      zipProgressValue,
      zipProgressText,
      isZipGenerationCancelled,
      studentToRender,
      cancelarGeneracionZip,
      // Auditoría Contextual
      mostrarModalAuditoria,
      filtroAuditoria,
      abrirModalAuditoria,
      abrirModalAuditoriaConFiltro,
      getEmptyStateTitle,
      getEmptyStateMessage,
      cerrarModalAuditoria,
      calificarDesdeAuditoria,
      getPeriodoNombre,
      getStudentInitials,
      listaEstudiantesConPendientes,
      totalEstudiantesConPendientes,
      totalPendientesCurso,
      totalPendientesRegulares,
      totalPendientesRefuerzos,
      totalPendientesNivelaciones,
      estudiantesConPendientesFiltrados,
      expandedAuditStudentIds,
      toggleAuditStudent,
      isAuditStudentExpanded,
      expandAllAuditStudents,
      collapseAllAuditStudents,
      goBack,
      // Iconos
      alertCircleOutline,
      checkmarkCircleOutline,
      chevronForwardOutline,
      chevronUpOutline,
      chevronDownOutline,
      closeOutline,
      helpCircleOutline,
      createOutline,
      arrowBackOutline,
      sparklesOutline,
      calendarOutline,
      timeOutline,
      bookOutline,
      warningOutline,
      downloadOutline,
      ellipsisVerticalOutline,
      peopleOutline,
      ribbonOutline,
      funnelOutline,
      listOutline,
      readerOutline,
    };
  },
};
</script>
<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM - NOTAS PAGE
   ========================================================================== */

.qz-notas-page {
  --background: #f7f7fd;
  background-color: #f7f7fd;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-notas-content {
  --background: #f7f7fd;
  --color: #0c092a;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

/* 1. CABECERA HERO PÚRPURA QUEEZY */
.qz-hero-section {
  background: linear-gradient(135deg, #6a5ae0 0%, #8275ea 50%, #9b8ff5 100%);
  padding: 24px 20px 32px 20px;
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;
  color: #ffffff;
  position: relative;
  box-shadow: 0 10px 25px rgba(106, 90, 224, 0.25);
  margin-bottom: 18px;
}

.qz-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.qz-circle-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.qz-circle-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.qz-circle-btn:active {
  transform: translateY(1px);
}

.qz-hero-actions-cluster {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-header-action-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 14px;
  border-radius: 9999px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  cursor: pointer;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.qz-header-action-pill:hover {
  background: rgba(255, 255, 255, 0.28);
  transform: translateY(-1px);
}

.qz-header-action-pill.pill-warning {
  background: #ffae33;
  color: #4a2800;
  border-color: #ffd591;
  box-shadow: 0 4px 12px rgba(255, 174, 51, 0.4);
}

.qz-header-action-pill.pill-success {
  background: rgba(39, 174, 96, 0.25);
  color: #ffffff;
  border-color: rgba(39, 174, 96, 0.5);
}

.qz-header-action-pill.pill-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

/* Títulos del Hero */
.qz-hero-titles {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

.qz-hero-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.qz-hero-pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.qz-hero-title {
  margin: 4px 0 2px 0;
  font-size: 26px;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.qz-hero-subtitle {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 500;
  line-height: 1.45;
}

/* 2. CUERPO PRINCIPAL */
.qz-notas-body {
  padding: 0 16px 40px 16px;
  max-width: 1040px;
  margin: 0 auto;
}

/* 2.1 Selector Card */
.qz-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid rgba(106, 90, 224, 0.08);
  box-shadow: 0 4px 16px rgba(12, 9, 42, 0.04);
}

.qz-filters-card {
  padding: 12px 16px;
  margin-bottom: 14px;
}

.qz-filter-pill-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f7f7fd;
  border-radius: 14px;
  padding: 10px 16px;
  border: 1px solid rgba(106, 90, 224, 0.12);
}

.qz-filter-pill-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.qz-filter-pill-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.qz-filter-pill-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #858494;
}

.qz-period-select {
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 0;
  --padding-end: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14.5px;
  font-weight: 700;
  color: #0c092a;
}

/* 2.3 Sección de Estudiantes */
.qz-students-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 6px;
}

.qz-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.qz-section-title {
  margin: 0 0 2px 0;
  font-size: 18px;
  font-weight: 800;
  color: #0c092a;
}

.qz-section-subtitle {
  margin: 0;
  font-size: 13px;
  color: #858494;
}

.qz-badge--count {
  background: #efeefc;
  color: #6a5ae0;
  font-size: 12px;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 9999px;
  flex-shrink: 0;
}

/* Acordeón de Estudiantes */
.qz-students-accordion-group {
  background: transparent;
}

.qz-student-accordion {
  background: #ffffff;
  border-radius: 18px !important;
  border: 1.5px solid rgba(12, 9, 42, 0.06) !important;
  box-shadow: 0 4px 14px rgba(12, 9, 42, 0.03);
  margin-bottom: 12px;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.qz-student-accordion.accordion-expanded {
  border-color: rgba(106, 90, 224, 0.3) !important;
  box-shadow: 0 8px 24px rgba(106, 90, 224, 0.1);
}

.qz-student-header-item {
  --background: #ffffff;
  --background-hover: #fcfcff;
  --background-activated: #f5f4fd;
  --background-focused: #f5f4fd;
  --padding-start: 16px;
  --padding-end: 16px;
  --inner-padding-end: 0;
  --min-height: 68px;
  cursor: pointer;
}

.qz-student-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6a5ae0 0%, #8275ea 100%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(106, 90, 224, 0.22);
}

.qz-student-name-label {
  margin: 10px 0;
}

.qz-student-name-label h3 {
  margin: 0 0 2px 0;
  font-size: 15px;
  font-weight: 800;
  color: #0c092a;
}

.qz-student-meta {
  font-size: 12px;
  color: #858494;
  font-weight: 600;
}

.qz-grade-chips-cluster {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  flex-shrink: 0;
}

.qz-grade-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  border: 1px solid transparent;
  background: #f1f2f6;
  color: #57606f;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

.qz-grade-badge .qz-grade-label {
  font-size: 9.5px;
  text-transform: uppercase;
  opacity: 0.85;
  white-space: nowrap;
}

.qz-grade-badge .qz-grade-val {
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

/* Clases de Color para Calificaciones */
.qz-grade-badge.red-grade {
  background: #fff1f0;
  color: #cf1322;
  border-color: #ffa39e;
}

.qz-grade-badge.orange-grade {
  background: #fff7e6;
  color: #d46b08;
  border-color: #ffd591;
}

.qz-grade-badge.light-green-grade {
  background: #f6ffed;
  color: #389e0d;
  border-color: #b7eb8f;
}

.qz-grade-badge.dark-green-grade {
  background: #e6f7ff;
  color: #096dd9;
  border-color: #91d5ff;
}

/* Contenido del Estudiante (Sub-acordeones) */
.qz-student-content-wrap {
  padding: 12px 16px 16px 16px;
  background: #fafafc;
  border-top: 1px solid rgba(12, 9, 42, 0.06);
}

.qz-sub-accordion-group {
  background: transparent;
}

.qz-sub-accordion {
  background: #ffffff;
  border-radius: 14px !important;
  border: 1px solid rgba(12, 9, 42, 0.08) !important;
  margin-bottom: 10px;
  overflow: hidden;
}

.qz-sub-accordion-header {
  --background: #ffffff;
  --padding-start: 14px;
  --padding-end: 14px;
  --min-height: 52px;
}

.qz-sub-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 14px;
  color: #0c092a;
}

.qz-sub-header-icon {
  font-size: 18px;
  color: #6a5ae0;
}

.qz-sub-header-icon.is-warning {
  color: #fa8c16;
}

.qz-sub-header-icon.is-info {
  color: #1890ff;
}

.qz-sub-content {
  padding: 10px 14px 14px 14px;
  background: #fcfcff;
}

.qz-dimension-block {
  margin-bottom: 14px;
}

.qz-dimension-block:last-child {
  margin-bottom: 0;
}

.qz-dimension-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #f0effc;
  border-radius: 8px;
  margin-bottom: 8px;
}

.qz-dimension-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #5544d6;
}

.qz-grade-pill-sm {
  font-size: 12px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
}

.qz-grades-item-list {
  background: transparent;
  padding: 0;
}

.qz-grade-item-sliding {
  border-radius: 10px;
  margin-bottom: 6px;
  overflow: hidden;
  border: 1px solid rgba(12, 9, 42, 0.05);
}

.qz-grade-item-row {
  --background: #ffffff;
  --padding-start: 10px;
  --padding-end: 12px;
  --min-height: 54px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-grade-item-row:hover {
  --background: #f7f6fd;
}

.qz-grade-item-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-right: 12px;
  flex-shrink: 0;
}

.qz-grade-item-label {
  margin: 8px 0;
}

.qz-grade-item-title {
  margin: 0 0 2px 0;
  font-size: 13.5px;
  font-weight: 700;
  color: #0c092a;
}

.qz-grade-item-topic {
  margin: 0;
  font-size: 11.5px;
  color: #858494;
}

.qz-grade-item-score-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}

.qz-grade-pill-val {
  font-size: 14px;
  font-weight: 900;
}

.qz-grade-pill-pending {
  font-size: 11.5px;
  font-weight: 700;
  color: #858494;
  font-style: italic;
}

.qz-grade-edit-btn-inline {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(106, 90, 224, 0.1);
  color: #6a5ae0;
  border: 1px solid rgba(106, 90, 224, 0.2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.qz-grade-edit-btn-inline:hover {
  background: #6a5ae0;
  color: #ffffff;
  transform: scale(1.05);
}

.qz-grade-edit-option {
  --background: #6a5ae0;
  --color: #ffffff;
}

/* ==========================================================================
   MODAL DE EDICIÓN / REGISTRO DE NOTA (ESTILOS QUEEZY LIGHT & DARK)
   ========================================================================== */
.qz-grade-modal ion-toolbar {
  --background: #6a5ae0;
  --color: #ffffff;
}

.qz-grade-modal-content {
  --background: #f8f9fa;
  font-family: inherit;
}

.qz-grade-modal-body {
  max-width: 520px;
  margin: 0 auto;
}

.qz-modal-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-modal-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-modal-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #4a4768;
  letter-spacing: 0.3px;
}

.qz-modal-readonly-input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f4f3fd;
  color: #1a1a2e;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid rgba(106, 90, 224, 0.15);
}

.qz-modal-readonly-input ion-icon {
  font-size: 18px;
  color: #6a5ae0;
  flex-shrink: 0;
}

.qz-modal-readonly-input span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qz-modal-input-wrap {
  border-radius: 12px;
  border: 2px solid #6a5ae0;
  background: #ffffff;
  overflow: hidden;
  transition: all 0.2s ease;
}

.qz-modal-input-wrap:focus-within {
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.25);
}

.qz-grade-numeric-input {
  --padding-start: 14px;
  --padding-end: 14px;
  --padding-top: 10px;
  --padding-bottom: 10px;
  font-size: 18px;
  font-weight: 800;
  color: #1a1a2e;
}

.qz-modal-select {
  --padding-start: 14px;
  --padding-end: 14px;
  --padding-top: 10px;
  --padding-bottom: 10px;
  border-radius: 12px;
  border: 1px solid #d9d6f3;
  background: #ffffff;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.qz-modal-segment {
  border-radius: 10px;
  background: #efeefc;
  padding: 3px;
}

.qz-modal-segment ion-segment-button {
  --indicator-color: #6a5ae0;
  --color: #6a5ae0;
  --color-checked: #ffffff;
  font-weight: 700;
  border-radius: 8px;
}

.qz-modal-helper-text {
  margin: 4px 0 0;
  font-size: 11.5px;
  color: #e67e22;
}

.qz-modal-actions {
  max-width: 520px;
  margin: 0 auto;
}

.qz-btn-save-grade {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border-radius: 14px;
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.35);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.qz-btn-save-grade:hover {
  background: #5b4bd4;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(106, 90, 224, 0.45);
}

.qz-btn-save-grade:active {
  transform: translateY(1px);
}

.qz-warning-icon {
  font-size: 16px;
  color: #fa8c16;
  vertical-align: text-bottom;
  margin-right: 4px;
}

.qz-state-card {
  text-align: center;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.qz-empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 4px;
}

.qz-state-card h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: #0c092a;
}

.qz-state-card p {
  margin: 0;
  font-size: 13.5px;
  color: #858494;
  max-width: 440px;
}

@media (max-width: 600px) {
  .qz-pill-text-hide-sm {
    display: none;
  }
  .qz-hero-title {
    font-size: 22px;
  }
  .qz-grade-chips-cluster {
    flex-wrap: wrap;
    max-width: 140px;
    justify-content: flex-end;
  }
}

.red-grade {
  color: red;
  font-weight: bold;
}
.orange-grade {
  color: orange;
  font-weight: bold;
}
.light-green-grade {
  color: lightgreen;
  font-weight: bold;
}
.dark-green-grade {
  color: darkgreen;
  font-weight: bold;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.report-table th,
.report-table td {
  border: 1px solid;
  padding: 8px;
  text-align: left;
}

.detailed-student {
  margin-bottom: 20px;
  border: 1px solid;
  border-radius: 8px;
  overflow: hidden;
}

.student-info-header {
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-table.detailed {
  margin-top: 0;
  border: none;
}

.item-row td {
  font-size: 0.9em;
  padding-left: 20px;
}

.new-students-warning {
  margin-top: 20px;
  border: 2px solid #f0a500;
  border-radius: 8px;
  background-color: #fff8e1;
  color: #5a3e00;
}

.new-students-warning p {
  margin: 4px 0;
}

.new-students-warning ul {
  margin: 8px 0 4px 16px;
  padding: 0;
}

.pending-grade {
  color: #888;
  font-style: italic;
  font-weight: bold;
}

/* ==========================================================================
   AUDITORÍA CONTEXTUAL DE EVALUACIONES (ESTILOS QUEEZY Y MODO OSCURO)
   ========================================================================== */

/* 1. Franja de Auditoría debajo del selector de período */
.qz-audit-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
  margin: 10px 16px 16px 16px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.qz-audit-bar:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.qz-audit-bar.has-pending {
  background: linear-gradient(135deg, #fffcf5 0%, #fff7e6 100%);
  border: 1px solid rgba(255, 174, 51, 0.4);
}

.qz-audit-bar.is-synced {
  background: linear-gradient(135deg, #f6ffed 0%, #f0fff4 100%);
  border: 1px solid rgba(39, 174, 96, 0.3);
}

.qz-audit-bar-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.qz-audit-bar-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  padding-top: 10px;
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
}

.qz-audit-cat-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  outline: none;
}

.qz-audit-cat-pill:hover {
  transform: translateY(-1px);
}

.qz-audit-cat-pill.cat-pending {
  background: #fff3dc;
  border-color: rgba(255, 174, 51, 0.5);
  color: #874d00;
}

.qz-audit-cat-pill.cat-pending:hover {
  background: #ffe7ba;
}

.qz-audit-cat-pill.cat-synced {
  background: #e6f7ec;
  border-color: rgba(39, 174, 96, 0.35);
  color: #135200;
}

.qz-audit-cat-pill.cat-synced:hover {
  background: #d4edda;
}

.qz-audit-cat-label {
  font-weight: 500;
  opacity: 0.85;
}

.qz-audit-cat-val {
  font-weight: 700;
}

.qz-audit-bar-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.qz-audit-bar-icon-wrap.is-warning {
  background: #fff1d6;
  color: #d48806;
}

.qz-audit-bar-icon-wrap.is-success {
  background: #e6f7ff;
  color: #27ae60;
}

.qz-audit-bar-content {
  flex: 1;
  min-width: 0;
}

.qz-audit-bar-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 2px;
}

.qz-audit-bar-title {
  font-size: 14.5px;
  font-weight: 700;
  color: #1a1a2e;
}

.qz-audit-bar-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
}

.qz-audit-bar-badge.badge-warning {
  background-color: #ffe7ba;
  color: #874d00;
}

.qz-audit-bar-badge.badge-success {
  background-color: #d9f7be;
  color: #135200;
}

.qz-audit-bar-desc {
  margin: 0;
  font-size: 12.5px;
  color: #666;
  line-height: 1.35;
}

.qz-audit-bar-action {
  flex-shrink: 0;
}

.qz-audit-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 9999px;
  background: #ffae33;
  color: #5c3500;
  border: none;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(255, 174, 51, 0.3);
}

.qz-audit-trigger-btn:hover {
  background: #f7a222;
}

/* 2. Modal de Auditoría */
.qz-audit-modal-content {
  --background: #f8f9fa;
  font-family: inherit;
}

.qz-audit-modal-header-card {
  background: white;
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
}

.qz-audit-modal-badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.qz-pill-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  background: #f0f0ff;
  color: #6a5ae0;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 700;
  max-width: 100%;
  box-sizing: border-box;
}

.qz-pill-tag span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qz-audit-modal-title {
  margin: 0 0 6px 0;
  font-size: 17px;
  font-weight: 800;
  color: #1a1a2e;
  word-break: break-word;
}

.qz-audit-modal-subtitle {
  margin: 0 0 14px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.45;
  word-break: break-word;
}

.qz-audit-tabs-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  width: 100%;
}

.qz-audit-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid rgba(106, 90, 224, 0.15);
  background: #ffffff;
  color: #555;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap !important;
  transition: all 0.2s ease;
}

.qz-audit-tab-btn.is-active {
  background: #6a5ae0;
  color: #ffffff;
  border-color: #6a5ae0;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.25);
}

.qz-audit-tab-count {
  font-size: 11px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 9999px;
  background: rgba(106, 90, 224, 0.12);
  color: #6a5ae0;
}

.qz-audit-tab-btn.is-active .qz-audit-tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* Toolbar de Auditoría: Expandir / Colapsar */
.qz-audit-list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 6px;
  margin-bottom: 6px;
}

.qz-audit-list-caption {
  font-size: 12px;
  font-weight: 700;
  color: #858494;
}

.qz-audit-toolbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.qz-audit-link-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  font-weight: 700;
  color: #6a5ae0;
  cursor: pointer;
}

.qz-audit-link-btn:hover {
  text-decoration: underline;
}

.qz-audit-link-divider {
  color: #cbd5e1;
  font-size: 12px;
}

/* 3. Estado Vacío de Auditoría */
.qz-audit-empty-card {
  background: white;
  border-radius: 16px;
  padding: 40px 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
}

.qz-audit-empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: #f0fff4;
  color: #27ae60;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin: 0 auto 16px;
}

.qz-audit-empty-card h3 {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 800;
  color: #1a1a2e;
}

.qz-audit-empty-card p {
  margin: 0 auto;
  font-size: 13.5px;
  color: #666;
  max-width: 440px;
  line-height: 1.45;
}

/* 4. Lista de Estudiantes con Pendientes */
.qz-audit-students-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-audit-student-box {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.qz-audit-student-box-header {
  padding: 12px 16px;
  background: #f7f7fd;
  border-bottom: 1px solid #edf0f5;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease;
}

.qz-audit-student-box-header:hover {
  background: #f0effc;
}

.qz-audit-student-avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #6a5ae0;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  flex-shrink: 0;
}

.qz-audit-student-details {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.qz-audit-student-name {
  font-size: 14.5px;
  font-weight: 700;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.qz-audit-student-count {
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 9999px;
  background: #fee2e2;
  color: #b91c1c;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

.qz-audit-student-toggle-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  cursor: pointer;
  border-radius: 8px;
  flex-shrink: 0;
}

/* Filas de pendientes */
.qz-audit-pending-list {
  display: flex;
  flex-direction: column;
}

.qz-audit-pending-row {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: background 0.15s ease;
}

.qz-audit-pending-row:last-child {
  border-bottom: none;
}

.qz-audit-pending-row:hover {
  background: #fbfbfd;
}

.qz-audit-pending-info {
  flex: 1;
  min-width: 0;
}

.qz-audit-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.qz-item-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
}

.qz-item-tag--regular {
  background: #eef2ff;
  color: #4338ca;
  border: 1px solid rgba(67, 56, 202, 0.2);
}

.qz-item-tag--reinforcement {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid rgba(180, 83, 9, 0.2);
}

.qz-item-tag--remedial {
  background: #fdf2f8;
  color: #be185d;
  border: 1px solid rgba(190, 24, 93, 0.2);
}

.qz-item-tag--dimension {
  background: #f3f4f6;
  color: #374151;
}

.qz-item-tag--type {
  background: #f0fdf4;
  color: #15803d;
}

.qz-audit-item-title {
  margin: 0 0 2px 0;
  font-size: 13.5px;
  font-weight: 700;
  color: #1a1a2e;
}

.qz-audit-item-meta {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
}

.qz-audit-pending-action {
  flex-shrink: 0;
}

.qz-audit-btn-grade {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  background: #6a5ae0;
  color: white;
  border: none;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(106, 90, 224, 0.25);
}

.qz-audit-btn-grade:hover {
  background: #5947d6;
  transform: translateY(-1px);
}

.qz-audit-btn-grade:active {
  transform: translateY(1px);
}

/* ==========================================================================
   MODO OSCURO (DARK MODE) PARA AUDITORÍA CONTEXTUAL
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  .qz-notas-page,
  .qz-notas-content {
    --background: #120f24;
    background-color: #120f24;
    --color: #f7f7fd;
  }
  .qz-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-filters-card {
    background: #1d1838;
  }
  .qz-filter-pill-item {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.12);
  }
  .qz-filter-pill-icon-wrap {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-filter-pill-label {
    color: #a39bf0;
  }
  .qz-period-select {
    color: #f7f7fd;
  }
  .qz-section-title {
    color: #f7f7fd;
  }
  .qz-section-subtitle {
    color: #9e9bb8;
  }
  .qz-badge--count {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-student-accordion {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  .qz-student-accordion.accordion-expanded {
    border-color: rgba(124, 110, 242, 0.35) !important;
  }
  .qz-student-header-item {
    --background: #231d42;
    --background-hover: #292450;
    --background-activated: #302a5c;
    --background-focused: #292450;
    --color: #f7f7fd;
  }
  .qz-student-name-label h3 {
    color: #f7f7fd;
  }
  .qz-student-meta {
    color: #9e9bb8;
  }
  .qz-student-content-wrap {
    background: #191432;
    border-top-color: rgba(255, 255, 255, 0.08);
  }
  .qz-sub-accordion {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  .qz-sub-accordion-header {
    --background: #231d42;
  }
  .qz-sub-header-left {
    color: #f7f7fd;
  }
  .qz-sub-content {
    background: #1c1739;
  }
  .qz-dimension-bar {
    background: #28214b;
  }
  .qz-dimension-name {
    color: #a39bf0;
  }
  .qz-grade-item-sliding {
    border-color: rgba(255, 255, 255, 0.06);
  }
  .qz-grade-item-row {
    --background: #231d42;
    --color: #f7f7fd;
  }
  .qz-grade-item-icon-wrap {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-grade-item-title {
    color: #f7f7fd;
  }
  .qz-grade-item-topic {
    color: #9e9bb8;
  }
  .qz-grade-pill-pending {
    color: #9e9bb8;
  }
  .qz-state-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-state-card h3 {
    color: #f7f7fd;
  }
  .qz-state-card p {
    color: #9e9bb8;
  }
  .qz-empty-icon-wrap {
    background: #28214b;
    color: #a39bf0;
  }
  .qz-grade-badge {
    background: #28214b;
    color: #cbd5e1;
  }
  .qz-grade-badge.red-grade {
    background: rgba(245, 34, 45, 0.2);
    color: #ff7875;
    border-color: rgba(245, 34, 45, 0.35);
  }
  .qz-grade-badge.orange-grade {
    background: rgba(250, 140, 22, 0.2);
    color: #ffa940;
    border-color: rgba(250, 140, 22, 0.35);
  }
  .qz-grade-badge.light-green-grade {
    background: rgba(82, 196, 26, 0.2);
    color: #73d13d;
    border-color: rgba(82, 196, 26, 0.35);
  }
  .qz-grade-badge.dark-green-grade {
    background: rgba(24, 144, 255, 0.2);
    color: #40a9ff;
    border-color: rgba(24, 144, 255, 0.35);
  }

  .qz-audit-bar.has-pending {
    background: linear-gradient(135deg, #261f18 0%, #201a14 100%);
    border-color: rgba(255, 174, 51, 0.3);
  }
  .qz-audit-bar.is-synced {
    background: linear-gradient(135deg, #13241b 0%, #0f1d16 100%);
    border-color: rgba(39, 174, 96, 0.3);
  }
  .qz-audit-bar-title {
    color: #f7f7fd;
  }
  .qz-audit-bar-desc {
    color: #9e9bb8;
  }
  .qz-audit-bar-icon-wrap.is-warning {
    background: rgba(255, 174, 51, 0.18);
    color: #ffae33;
  }
  .qz-audit-bar-icon-wrap.is-success {
    background: rgba(39, 174, 96, 0.18);
    color: #2ecc71;
  }

  .qz-audit-modal-content {
    --background: #120f24;
    color: #f7f7fd;
  }
  .qz-audit-modal-header-card,
  .qz-audit-empty-card,
  .qz-audit-student-box {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-audit-modal-title,
  .qz-audit-empty-card h3,
  .qz-audit-student-name,
  .qz-audit-item-title {
    color: #f7f7fd;
  }
  .qz-audit-modal-subtitle,
  .qz-audit-empty-card p,
  .qz-audit-item-meta {
    color: #9e9bb8;
  }
  .qz-pill-tag {
    background: #28214b !important;
    color: #a39bf0 !important;
    border: 1px solid rgba(124, 110, 242, 0.3) !important;
  }
  .qz-audit-student-box-header {
    background: #28214b;
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
  .qz-audit-student-avatar {
    background: #6a5ae0;
  }
  .qz-audit-student-count {
    background: rgba(239, 68, 68, 0.22) !important;
    color: #fca5a5 !important;
    border: 1px solid rgba(239, 68, 68, 0.4) !important;
  }
  .qz-audit-pending-row {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }
  .qz-audit-pending-row:hover {
    background: #231d42;
  }
  .qz-item-tag--regular {
    background: rgba(99, 102, 241, 0.22) !important;
    color: #a5b4fc !important;
    border: 1px solid rgba(99, 102, 241, 0.4) !important;
  }
  .qz-item-tag--reinforcement {
    background: rgba(245, 158, 11, 0.22) !important;
    color: #fcd34d !important;
    border: 1px solid rgba(245, 158, 11, 0.4) !important;
  }
  .qz-item-tag--remedial {
    background: rgba(236, 72, 153, 0.22) !important;
    color: #f472b6 !important;
    border: 1px solid rgba(236, 72, 153, 0.4) !important;
  }
  .qz-item-tag--dimension {
    background: #28214b !important;
    color: #cbd5e1 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
  }
  .qz-item-tag--type {
    background: rgba(16, 185, 129, 0.22) !important;
    color: #6ee7b7 !important;
    border: 1px solid rgba(16, 185, 129, 0.4) !important;
  }
  .qz-audit-tab-btn {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.1);
    color: #9e9bb8;
  }
  .qz-audit-tab-btn.is-active {
    background: #6a5ae0;
    color: #ffffff;
    border-color: #6a5ae0;
  }
  .qz-audit-tab-count {
    background: rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
  }
  .qz-audit-tab-btn.is-active .qz-audit-tab-count {
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
  }
  .qz-audit-student-box-header:hover {
    background: #28214b;
  }
  .qz-audit-student-toggle-btn {
    color: #b5a9ff;
  }
  .qz-audit-link-btn {
    color: #a39bf0;
  }
  .qz-audit-list-caption {
    color: #9e9bb8;
  }
  .qz-audit-link-divider {
    color: #555;
  }
  .qz-audit-modal ion-toolbar {
    --background: #1d1838 !important;
    --color: #ffffff !important;
  }
  .badge-warning {
    background: rgba(245, 158, 11, 0.2) !important;
    color: #fcd34d !important;
    border: 1px solid rgba(245, 158, 11, 0.35) !important;
  }
  .badge-success {
    background: rgba(16, 185, 129, 0.2) !important;
    color: #6ee7b7 !important;
    border: 1px solid rgba(16, 185, 129, 0.35) !important;
  }
}

:global(body.dark) .qz-audit-bar.has-pending,
:global(html.dark) .qz-audit-bar.has-pending,
:global(.dark) .qz-audit-bar.has-pending {
  background: linear-gradient(135deg, #261f18 0%, #201a14 100%);
  border-color: rgba(255, 174, 51, 0.3);
}

:global(body.dark) .qz-audit-bar.is-synced,
:global(html.dark) .qz-audit-bar.is-synced,
:global(.dark) .qz-audit-bar.is-synced {
  background: linear-gradient(135deg, #13241b 0%, #0f1d16 100%);
  border-color: rgba(39, 174, 96, 0.3);
}

:global(body.dark) .qz-audit-bar-title,
:global(html.dark) .qz-audit-bar-title,
:global(.dark) .qz-audit-bar-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-audit-bar-desc,
:global(html.dark) .qz-audit-bar-desc,
:global(.dark) .qz-audit-bar-desc {
  color: #9e9bb8;
}

:global(body.dark) .qz-audit-bar-icon-wrap.is-warning,
:global(html.dark) .qz-audit-bar-icon-wrap.is-warning,
:global(.dark) .qz-audit-bar-icon-wrap.is-warning {
  background: rgba(255, 174, 51, 0.18);
  color: #ffae33;
}

:global(body.dark) .qz-audit-bar-icon-wrap.is-success,
:global(html.dark) .qz-audit-bar-icon-wrap.is-success,
:global(.dark) .qz-audit-bar-icon-wrap.is-success {
  background: rgba(39, 174, 96, 0.18);
  color: #2ecc71;
}

:global(body.dark) .qz-audit-bar-categories,
:global(html.dark) .qz-audit-bar-categories,
:global(.dark) .qz-audit-bar-categories {
  border-top-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-audit-cat-pill.cat-pending,
:global(html.dark) .qz-audit-cat-pill.cat-pending,
:global(.dark) .qz-audit-cat-pill.cat-pending {
  background: rgba(255, 174, 51, 0.15);
  border-color: rgba(255, 174, 51, 0.4);
  color: #ffc069;
}

:global(body.dark) .qz-audit-cat-pill.cat-pending:hover,
:global(html.dark) .qz-audit-cat-pill.cat-pending:hover,
:global(.dark) .qz-audit-cat-pill.cat-pending:hover {
  background: rgba(255, 174, 51, 0.25);
}

:global(body.dark) .qz-audit-cat-pill.cat-synced,
:global(html.dark) .qz-audit-cat-pill.cat-synced,
:global(.dark) .qz-audit-cat-pill.cat-synced {
  background: rgba(39, 174, 96, 0.15);
  border-color: rgba(39, 174, 96, 0.4);
  color: #52c41a;
}

:global(body.dark) .qz-audit-cat-pill.cat-synced:hover,
:global(html.dark) .qz-audit-cat-pill.cat-synced:hover,
:global(.dark) .qz-audit-cat-pill.cat-synced:hover {
  background: rgba(39, 174, 96, 0.25);
}

:global(body.dark) .qz-audit-modal-content,
:global(html.dark) .qz-audit-modal-content,
:global(.dark) .qz-audit-modal-content {
  --background: #120f24;
  color: #f7f7fd;
}

:global(body.dark) .qz-audit-modal-header-card,
:global(html.dark) .qz-audit-modal-header-card,
:global(.dark) .qz-audit-modal-header-card,
:global(body.dark) .qz-audit-empty-card,
:global(html.dark) .qz-audit-empty-card,
:global(.dark) .qz-audit-empty-card,
:global(body.dark) .qz-audit-student-box,
:global(html.dark) .qz-audit-student-box,
:global(.dark) .qz-audit-student-box {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-audit-modal-title,
:global(html.dark) .qz-audit-modal-title,
:global(.dark) .qz-audit-modal-title,
:global(body.dark) .qz-audit-empty-card h3,
:global(html.dark) .qz-audit-empty-card h3,
:global(.dark) .qz-audit-empty-card h3,
:global(body.dark) .qz-audit-student-name,
:global(html.dark) .qz-audit-student-name,
:global(.dark) .qz-audit-student-name,
:global(body.dark) .qz-audit-item-title,
:global(html.dark) .qz-audit-item-title,
:global(.dark) .qz-audit-item-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-audit-modal-subtitle,
:global(html.dark) .qz-audit-modal-subtitle,
:global(.dark) .qz-audit-modal-subtitle,
:global(body.dark) .qz-audit-empty-card p,
:global(html.dark) .qz-audit-empty-card p,
:global(.dark) .qz-audit-empty-card p,
:global(body.dark) .qz-audit-item-meta,
:global(html.dark) .qz-audit-item-meta,
:global(.dark) .qz-audit-item-meta {
  color: #9e9bb8;
}

:global(body.dark) .qz-pill-tag,
:global(html.dark) .qz-pill-tag,
:global(.dark) .qz-pill-tag {
  background: #28214b !important;
  color: #a39bf0 !important;
  border: 1px solid rgba(124, 110, 242, 0.3) !important;
}

:global(body.dark) .qz-audit-student-box-header,
:global(html.dark) .qz-audit-student-box-header,
:global(.dark) .qz-audit-student-box-header {
  background: #28214b;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-audit-student-count,
:global(html.dark) .qz-audit-student-count,
:global(.dark) .qz-audit-student-count {
  background: rgba(239, 68, 68, 0.22) !important;
  color: #fca5a5 !important;
  border: 1px solid rgba(239, 68, 68, 0.4) !important;
}

:global(body.dark) .qz-audit-pending-row,
:global(html.dark) .qz-audit-pending-row,
:global(.dark) .qz-audit-pending-row {
  border-bottom-color: rgba(255, 255, 255, 0.06);
}

:global(body.dark) .qz-audit-pending-row:hover,
:global(html.dark) .qz-audit-pending-row:hover,
:global(.dark) .qz-audit-pending-row:hover {
  background: #231d42;
}

:global(body.dark) .qz-item-tag--regular,
:global(html.dark) .qz-item-tag--regular,
:global(.dark) .qz-item-tag--regular {
  background: rgba(99, 102, 241, 0.22) !important;
  color: #a5b4fc !important;
  border: 1px solid rgba(99, 102, 241, 0.4) !important;
}

:global(body.dark) .qz-item-tag--reinforcement,
:global(html.dark) .qz-item-tag--reinforcement,
:global(.dark) .qz-item-tag--reinforcement {
  background: rgba(245, 158, 11, 0.22) !important;
  color: #fcd34d !important;
  border: 1px solid rgba(245, 158, 11, 0.4) !important;
}

:global(body.dark) .qz-item-tag--remedial,
:global(html.dark) .qz-item-tag--remedial,
:global(.dark) .qz-item-tag--remedial {
  background: rgba(236, 72, 153, 0.22) !important;
  color: #f472b6 !important;
  border: 1px solid rgba(236, 72, 153, 0.4) !important;
}

:global(body.dark) .qz-item-tag--dimension,
:global(html.dark) .qz-item-tag--dimension,
:global(.dark) .qz-item-tag--dimension {
  background: #28214b !important;
  color: #cbd5e1 !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-item-tag--type,
:global(html.dark) .qz-item-tag--type,
:global(.dark) .qz-item-tag--type {
  background: rgba(16, 185, 129, 0.22) !important;
  color: #6ee7b7 !important;
  border: 1px solid rgba(16, 185, 129, 0.4) !important;
}

:global(body.dark) .qz-audit-tab-btn,
:global(html.dark) .qz-audit-tab-btn,
:global(.dark) .qz-audit-tab-btn {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.1);
  color: #9e9bb8;
}

:global(body.dark) .qz-audit-tab-btn.is-active,
:global(html.dark) .qz-audit-tab-btn.is-active,
:global(.dark) .qz-audit-tab-btn.is-active {
  background: #6a5ae0;
  color: #ffffff;
  border-color: #6a5ae0;
}

:global(body.dark) .qz-audit-tab-count,
:global(html.dark) .qz-audit-tab-count,
:global(.dark) .qz-audit-tab-count {
  background: rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
}

:global(body.dark) .qz-audit-student-box-header:hover,
:global(html.dark) .qz-audit-student-box-header:hover,
:global(.dark) .qz-audit-student-box-header:hover {
  background: #28214b;
}

:global(body.dark) .qz-audit-student-toggle-btn,
:global(html.dark) .qz-audit-student-toggle-btn,
:global(.dark) .qz-audit-student-toggle-btn {
  color: #b5a9ff;
}

:global(body.dark) .qz-audit-link-btn,
:global(html.dark) .qz-audit-link-btn,
:global(.dark) .qz-audit-link-btn {
  color: #a39bf0;
}

:global(body.dark) .qz-audit-list-caption,
:global(html.dark) .qz-audit-list-caption,
:global(.dark) .qz-audit-list-caption {
  color: #9e9bb8;
}

:global(body.dark) .qz-audit-link-divider,
:global(html.dark) .qz-audit-link-divider,
:global(.dark) .qz-audit-link-divider {
  color: #555;
}

:global(body.dark) .qz-audit-modal ion-toolbar,
:global(html.dark) .qz-audit-modal ion-toolbar,
:global(.dark) .qz-audit-modal ion-toolbar {
  --background: #1d1838 !important;
  --color: #ffffff !important;
}

:global(body.dark) .badge-warning,
:global(html.dark) .badge-warning,
:global(.dark) .badge-warning {
  background: rgba(245, 158, 11, 0.2) !important;
  color: #fcd34d !important;
  border: 1px solid rgba(245, 158, 11, 0.35) !important;
}

:global(body.dark) .badge-success,
:global(html.dark) .badge-success,
:global(.dark) .badge-success {
  background: rgba(16, 185, 129, 0.2) !important;
  color: #6ee7b7 !important;
  border: 1px solid rgba(16, 185, 129, 0.35) !important;
}

:global(body.dark) .qz-notas-page,
:global(html.dark) .qz-notas-page,
:global(.dark) .qz-notas-page,
:global(body.dark) .qz-notas-content,
:global(html.dark) .qz-notas-content,
:global(.dark) .qz-notas-content {
  --background: #120f24;
  background-color: #120f24;
  --color: #f7f7fd;
}

:global(body.dark) .qz-card,
:global(html.dark) .qz-card,
:global(.dark) .qz-card,
:global(body.dark) .qz-filters-card,
:global(html.dark) .qz-filters-card,
:global(.dark) .qz-filters-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-filter-pill-item,
:global(html.dark) .qz-filter-pill-item,
:global(.dark) .qz-filter-pill-item {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(body.dark) .qz-filter-pill-icon-wrap,
:global(html.dark) .qz-filter-pill-icon-wrap,
:global(.dark) .qz-filter-pill-icon-wrap {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-filter-pill-label,
:global(html.dark) .qz-filter-pill-label,
:global(.dark) .qz-filter-pill-label {
  color: #a39bf0;
}

:global(body.dark) .qz-period-select,
:global(html.dark) .qz-period-select,
:global(.dark) .qz-period-select {
  color: #f7f7fd;
}

:global(body.dark) .qz-section-title,
:global(html.dark) .qz-section-title,
:global(.dark) .qz-section-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-section-subtitle,
:global(html.dark) .qz-section-subtitle,
:global(.dark) .qz-section-subtitle {
  color: #9e9bb8;
}

:global(body.dark) .qz-badge--count,
:global(html.dark) .qz-badge--count,
:global(.dark) .qz-badge--count {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-student-accordion,
:global(html.dark) .qz-student-accordion,
:global(.dark) .qz-student-accordion {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-student-accordion.accordion-expanded,
:global(html.dark) .qz-student-accordion.accordion-expanded,
:global(.dark) .qz-student-accordion.accordion-expanded {
  border-color: rgba(124, 110, 242, 0.35) !important;
}

:global(body.dark) .qz-student-header-item,
:global(html.dark) .qz-student-header-item,
:global(.dark) .qz-student-header-item {
  --background: #231d42;
  --background-hover: #292450;
  --background-activated: #302a5c;
  --background-focused: #292450;
  --color: #f7f7fd;
}

:global(body.dark) .qz-student-name-label h3,
:global(html.dark) .qz-student-name-label h3,
:global(.dark) .qz-student-name-label h3 {
  color: #f7f7fd;
}

:global(body.dark) .qz-student-meta,
:global(html.dark) .qz-student-meta,
:global(.dark) .qz-student-meta {
  color: #9e9bb8;
}

:global(body.dark) .qz-student-content-wrap,
:global(html.dark) .qz-student-content-wrap,
:global(.dark) .qz-student-content-wrap {
  background: #191432;
  border-top-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-sub-accordion,
:global(html.dark) .qz-sub-accordion,
:global(.dark) .qz-sub-accordion {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-sub-accordion-header,
:global(html.dark) .qz-sub-accordion-header,
:global(.dark) .qz-sub-accordion-header {
  --background: #231d42;
}

:global(body.dark) .qz-sub-header-left,
:global(html.dark) .qz-sub-header-left,
:global(.dark) .qz-sub-header-left {
  color: #f7f7fd;
}

:global(body.dark) .qz-sub-content,
:global(html.dark) .qz-sub-content,
:global(.dark) .qz-sub-content {
  background: #1c1739;
}

:global(body.dark) .qz-dimension-bar,
:global(html.dark) .qz-dimension-bar,
:global(.dark) .qz-dimension-bar {
  background: #28214b;
}

:global(body.dark) .qz-dimension-name,
:global(html.dark) .qz-dimension-name,
:global(.dark) .qz-dimension-name {
  color: #a39bf0;
}

:global(body.dark) .qz-grade-item-sliding,
:global(html.dark) .qz-grade-item-sliding,
:global(.dark) .qz-grade-item-sliding {
  border-color: rgba(255, 255, 255, 0.06);
}

:global(body.dark) .qz-grade-item-row,
:global(html.dark) .qz-grade-item-row,
:global(.dark) .qz-grade-item-row {
  --background: #231d42;
  --color: #f7f7fd;
}

:global(body.dark) .qz-grade-item-icon-wrap,
:global(html.dark) .qz-grade-item-icon-wrap,
:global(.dark) .qz-grade-item-icon-wrap {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-grade-item-title,
:global(html.dark) .qz-grade-item-title,
:global(.dark) .qz-grade-item-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-grade-item-topic,
:global(html.dark) .qz-grade-item-topic,
:global(.dark) .qz-grade-item-topic {
  color: #9e9bb8;
}

:global(body.dark) .qz-grade-pill-pending,
:global(html.dark) .qz-grade-pill-pending,
:global(.dark) .qz-grade-pill-pending {
  color: #9e9bb8;
}

:global(body.dark) .qz-grade-item-row:hover,
:global(html.dark) .qz-grade-item-row:hover,
:global(.dark) .qz-grade-item-row:hover {
  --background: #2a2350;
}

:global(body.dark) .qz-grade-edit-btn-inline,
:global(html.dark) .qz-grade-edit-btn-inline,
:global(.dark) .qz-grade-edit-btn-inline {
  background: rgba(163, 155, 240, 0.15);
  color: #a39bf0;
  border-color: rgba(163, 155, 240, 0.3);
}

:global(body.dark) .qz-grade-edit-btn-inline:hover,
:global(html.dark) .qz-grade-edit-btn-inline:hover,
:global(.dark) .qz-grade-edit-btn-inline:hover {
  background: #6a5ae0;
  color: #ffffff;
}

:global(body.dark) .qz-grade-modal ion-toolbar,
:global(html.dark) .qz-grade-modal ion-toolbar,
:global(.dark) .qz-grade-modal ion-toolbar {
  --background: #1d1838 !important;
  --color: #ffffff !important;
}

:global(body.dark) .qz-grade-modal-content,
:global(html.dark) .qz-grade-modal-content,
:global(.dark) .qz-grade-modal-content {
  --background: #120f24;
  color: #f7f7fd;
}

:global(body.dark) .qz-modal-card,
:global(html.dark) .qz-modal-card,
:global(.dark) .qz-modal-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}

:global(body.dark) .qz-modal-label,
:global(html.dark) .qz-modal-label,
:global(.dark) .qz-modal-label {
  color: #cbd5e1;
}

:global(body.dark) .qz-modal-readonly-input,
:global(html.dark) .qz-modal-readonly-input,
:global(.dark) .qz-modal-readonly-input {
  background: #28214b;
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .qz-modal-readonly-input ion-icon,
:global(html.dark) .qz-modal-readonly-input ion-icon,
:global(.dark) .qz-modal-readonly-input ion-icon {
  color: #a39bf0;
}

:global(body.dark) .qz-modal-input-wrap,
:global(html.dark) .qz-modal-input-wrap,
:global(.dark) .qz-modal-input-wrap {
  background: #231d42;
  border-color: #6a5ae0;
}

:global(body.dark) .qz-grade-numeric-input,
:global(html.dark) .qz-grade-numeric-input,
:global(.dark) .qz-grade-numeric-input {
  color: #ffffff;
  --color: #ffffff;
}

:global(body.dark) .qz-modal-select,
:global(html.dark) .qz-modal-select,
:global(.dark) .qz-modal-select {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  --color: #ffffff;
}

:global(body.dark) .qz-modal-segment,
:global(html.dark) .qz-modal-segment,
:global(.dark) .qz-modal-segment {
  background: #28214b;
}

:global(body.dark) .qz-btn-save-grade,
:global(html.dark) .qz-btn-save-grade,
:global(.dark) .qz-btn-save-grade {
  background: #6a5ae0;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.4);
}

:global(body.dark) .qz-state-card,
:global(html.dark) .qz-state-card,
:global(.dark) .qz-state-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-state-card h3,
:global(html.dark) .qz-state-card h3,
:global(.dark) .qz-state-card h3 {
  color: #f7f7fd;
}

:global(body.dark) .qz-state-card p,
:global(html.dark) .qz-state-card p,
:global(.dark) .qz-state-card p {
  color: #9e9bb8;
}

:global(body.dark) .qz-empty-icon-wrap,
:global(html.dark) .qz-empty-icon-wrap,
:global(.dark) .qz-empty-icon-wrap {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-grade-badge,
:global(html.dark) .qz-grade-badge,
:global(.dark) .qz-grade-badge {
  background: #28214b;
  color: #cbd5e1;
}

:global(body.dark) .qz-grade-badge.red-grade,
:global(html.dark) .qz-grade-badge.red-grade,
:global(.dark) .qz-grade-badge.red-grade {
  background: rgba(245, 34, 45, 0.2);
  color: #ff7875;
  border-color: rgba(245, 34, 45, 0.35);
}

:global(body.dark) .qz-grade-badge.orange-grade,
:global(html.dark) .qz-grade-badge.orange-grade,
:global(.dark) .qz-grade-badge.orange-grade {
  background: rgba(250, 140, 22, 0.2);
  color: #ffa940;
  border-color: rgba(250, 140, 22, 0.35);
}

:global(body.dark) .qz-grade-badge.light-green-grade,
:global(html.dark) .qz-grade-badge.light-green-grade,
:global(.dark) .qz-grade-badge.light-green-grade {
  background: rgba(82, 196, 26, 0.2);
  color: #73d13d;
  border-color: rgba(82, 196, 26, 0.35);
}

:global(body.dark) .qz-grade-badge.dark-green-grade,
:global(html.dark) .qz-grade-badge.dark-green-grade,
:global(.dark) .qz-grade-badge.dark-green-grade {
  background: rgba(24, 144, 255, 0.2);
  color: #40a9ff;
  border-color: rgba(24, 144, 255, 0.35);
}

/* Optimizaciones responsivas para pantallas pequeñas */
@media (max-width: 640px) {
  .qz-hero-header {
    padding: 20px 14px 20px 14px;
  }

  .qz-hero-title {
    font-size: 20px;
  }

  .qz-hero-subtitle {
    font-size: 12px;
  }

  .qz-hero-top-row {
    margin-bottom: 12px;
  }

  .qz-hero-tags-row {
    gap: 6px;
    flex-wrap: wrap;
  }

  .qz-hero-pill-badge {
    padding: 4px 9px;
    font-size: 11px;
    white-space: nowrap !important;
  }

  .qz-pill-text-hide-sm {
    display: none !important;
  }

  .qz-circle-btn {
    width: 40px !important;
    height: 40px !important;
    font-size: 20px !important;
  }

  .qz-hero-actions-cluster .qz-header-action-pill {
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;
    padding: 0 !important;
    border-radius: 50% !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0 !important;
  }

  .qz-hero-actions-cluster .qz-header-action-pill ion-icon {
    font-size: 20px !important;
    margin: 0 !important;
  }

  .qz-header-action-pill {
    padding: 6px 10px;
    font-size: 11.5px;
    white-space: nowrap !important;
  }

  .qz-notas-body {
    padding: 14px 12px 60px;
  }

  .qz-student-header-item {
    --padding-start: 10px;
    --padding-end: 10px;
    --min-height: 60px;
  }

  .qz-student-avatar {
    width: 36px;
    height: 36px;
    font-size: 13px;
    margin-right: 10px;
  }

  .qz-student-name-label {
    min-width: 0;
    flex: 1;
    margin: 8px 0;
  }

  .qz-student-name-label h3 {
    font-size: 13.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .qz-student-meta {
    font-size: 11px;
  }

  .qz-grade-chips-cluster {
    gap: 4px;
    margin-left: 6px;
  }

  .qz-grade-badge {
    padding: 2px 6px;
    font-size: 10px;
    gap: 3px;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }

  .qz-grade-badge .qz-grade-label {
    font-size: 8.5px;
    white-space: nowrap !important;
  }

  .qz-grade-badge .qz-grade-val {
    font-size: 11px;
    white-space: nowrap !important;
  }

  .qz-sub-accordion-header {
    --padding-start: 10px;
    --padding-end: 10px;
    --min-height: 48px;
  }

  .qz-sub-header-left {
    font-size: 13px;
  }

  .qz-audit-modal-content {
    --padding-top: 10px;
    --padding-bottom: 16px;
    --padding-start: 10px;
    --padding-end: 10px;
  }

  .qz-audit-modal-header-card {
    padding: 12px 12px;
    margin-bottom: 12px;
    border-radius: 14px;
    width: 100%;
    box-sizing: border-box;
  }

  .qz-audit-modal-badge-row {
    gap: 5px;
    margin-bottom: 6px;
  }

  .qz-pill-tag {
    font-size: 10px;
    padding: 2px 7px;
    max-width: 100%;
    box-sizing: border-box;
  }

  .qz-pill-tag span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .qz-audit-modal-title {
    font-size: 15px;
    line-height: 1.25;
    margin-bottom: 4px;
    word-break: break-word;
  }

  .qz-audit-modal-subtitle {
    font-size: 11.5px;
    line-height: 1.35;
    margin-bottom: 8px;
    word-break: break-word;
  }

  .qz-audit-tabs-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
    width: 100%;
  }

  .qz-audit-tab-btn {
    flex: 1 1 calc(33.333% - 6px);
    min-width: 85px;
    justify-content: center;
    padding: 6px 6px;
    font-size: 11px;
    gap: 4px;
    white-space: nowrap !important;
  }

  .qz-audit-tab-count {
    font-size: 10px;
    padding: 1px 5px;
  }

  .qz-audit-student-box-header {
    padding: 10px 12px;
    gap: 8px;
  }

  .qz-audit-student-avatar {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .qz-audit-student-name {
    font-size: 13.5px;
  }

  .qz-audit-student-count {
    font-size: 10.5px;
    padding: 2px 7px;
  }

  .qz-audit-pending-row {
    padding: 10px 12px;
    gap: 8px;
  }

  .qz-audit-btn-grade {
    padding: 6px 10px;
    font-size: 11.5px;
    white-space: nowrap !important;
  }

  .qz-audit-bar {
    padding: 10px 12px;
  }

  .qz-audit-bar-categories {
    gap: 6px;
    margin-top: 6px;
    padding-top: 6px;
  }

  .qz-audit-cat-pill {
    font-size: 10.5px;
    padding: 4px 8px;
  }
}

/* ==========================================================================
   Modal Generador de Paquete ZIP (Estilo Queezy)
   ========================================================================== */
.qz-zip-modal {
  --width: 92%;
  --max-width: 440px;
  --height: auto;
  --border-radius: 24px;
  --background: var(--qz-color-purple-bg, #efeefc);
  --box-shadow: 0 20px 48px -8px rgba(106, 90, 224, 0.28);
}

.qz-zip-modal::part(content) {
  border-radius: 24px;
  overflow: hidden;
  background: var(--qz-color-purple-bg, #efeefc);
  box-shadow: 0 20px 48px -8px rgba(106, 90, 224, 0.28);
}

.qz-zip-modal-wrapper {
  background: var(--qz-color-purple-bg, #efeefc);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  border-radius: 24px;
  overflow: hidden;
}

/* 1. Cabecera Hero Queezy con Gradiente */
.qz-zip-modal-header {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 100%);
  padding: 18px 20px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(106, 90, 224, 0.18);
}

.qz-zip-tag {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
}

.qz-zip-header-title {
  margin: 3px 0 0 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 19px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.3px;
}

.qz-zip-close-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: 9999px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-zip-close-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.32);
}

.qz-zip-close-btn:active {
  transform: scale(0.92);
}

.qz-zip-close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 2. Cuerpo y Tarjeta */
.qz-zip-modal-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.qz-zip-card {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: 20px;
  padding: 22px 18px;
  box-shadow: 0 6px 20px -4px rgba(106, 90, 224, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid var(--qz-color-border, #eef0f6);
}

/* Squircle con birrete/descarga */
.qz-zip-squircle {
  width: 62px;
  height: 62px;
  border-radius: 18px;
  background: linear-gradient(135deg, #efeefc 0%, #e0defa 100%);
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin-bottom: 14px;
  box-shadow: 0 6px 16px rgba(106, 90, 224, 0.15);
  transition: transform 0.3s ease;
}

.qz-zip-title {
  margin: 0 0 8px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 18px;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.2px;
}

/* Píldoras de contexto */
.qz-zip-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 14px;
}

.qz-zip-meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #f4f5fa;
  border: 1px solid #eaedf5;
  color: #6a5ae0;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
  white-space: nowrap !important;
}

.qz-zip-meta-pill ion-icon {
  font-size: 13px;
}

/* Estado dinámico con punto animado */
.qz-zip-current-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fafbff;
  border: 1px solid #eef2fb;
  border-radius: 12px;
  padding: 8px 14px;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 16px;
}

.qz-zip-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6a5ae0;
  flex-shrink: 0;
  animation: qz-pulse-glow 1.5s infinite;
}

@keyframes qz-pulse-glow {
  0% {
    transform: scale(0.9);
    opacity: 0.6;
    box-shadow: 0 0 0 0 rgba(106, 90, 224, 0.6);
  }
  70% {
    transform: scale(1.1);
    opacity: 1;
    box-shadow: 0 0 0 6px rgba(106, 90, 224, 0);
  }
  100% {
    transform: scale(0.9);
    opacity: 0.6;
    box-shadow: 0 0 0 0 rgba(106, 90, 224, 0);
  }
}

.qz-zip-status-text {
  font-size: 12.5px;
  font-weight: 600;
  color: #4b5563;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Bloque de Barra de Progreso Moderna */
.qz-zip-progress-block {
  width: 100%;
  margin-bottom: 16px;
}

.qz-zip-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.qz-zip-progress-label {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
}

.qz-zip-progress-percent {
  font-size: 15px;
  font-weight: 800;
  color: #6a5ae0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-zip-track {
  width: 100%;
  height: 10px;
  background: #eaedf5;
  border-radius: 9999px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
}

.qz-zip-fill {
  height: 100%;
  background: linear-gradient(90deg, #6a5ae0 0%, #8b7af4 100%);
  border-radius: 9999px;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(106, 90, 224, 0.4);
}

/* Mensaje informativo / seguridad */
.qz-zip-info-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #f9f8ff;
  border: 1px solid #ece8fc;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 18px;
  text-align: left;
  width: 100%;
  box-sizing: border-box;
}

.qz-zip-info-icon {
  font-size: 16px;
  color: #6a5ae0;
  flex-shrink: 0;
  margin-top: 1px;
}

.qz-zip-info-box span {
  font-size: 11.5px;
  color: #7668e3;
  line-height: 1.4;
  font-weight: 500;
}

/* Botón de Cancelación Queezy */
.qz-zip-actions {
  width: 100%;
}

.qz-btn-cancel-zip {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 11px 18px;
  border-radius: 14px;
  border: 1.5px solid rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.qz-btn-cancel-zip:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.16);
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-1px);
}

.qz-btn-cancel-zip:active {
  transform: scale(0.98);
}

.qz-btn-cancel-zip:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* ==========================================================================
   Modo Oscuro para Modal ZIP (Selectores Globales de Clase)
   ========================================================================== */
:global(body.dark) .qz-zip-modal,
:global(html.dark) .qz-zip-modal,
:global(.dark) .qz-zip-modal,
:global(:root[data-theme="dark"]) .qz-zip-modal {
  --background: #120f24 !important;
  --box-shadow: 0 20px 48px -8px rgba(0, 0, 0, 0.6) !important;
}

:global(body.dark) .qz-zip-modal::part(content),
:global(html.dark) .qz-zip-modal::part(content),
:global(.dark) .qz-zip-modal::part(content),
:global(:root[data-theme="dark"]) .qz-zip-modal::part(content) {
  background: #120f24 !important;
  box-shadow: 0 20px 48px -8px rgba(0, 0, 0, 0.6) !important;
}

:global(body.dark) .qz-zip-modal-wrapper,
:global(html.dark) .qz-zip-modal-wrapper,
:global(.dark) .qz-zip-modal-wrapper,
:global(:root[data-theme="dark"]) .qz-zip-modal-wrapper {
  background: #120f24 !important;
}

:global(body.dark) .qz-zip-modal-header,
:global(html.dark) .qz-zip-modal-header,
:global(.dark) .qz-zip-modal-header,
:global(:root[data-theme="dark"]) .qz-zip-modal-header {
  background: linear-gradient(180deg, #1d1838 0%, #251e45 100%) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

:global(body.dark) .qz-zip-tag,
:global(html.dark) .qz-zip-tag,
:global(.dark) .qz-zip-tag,
:global(:root[data-theme="dark"]) .qz-zip-tag {
  color: #a39bf0 !important;
}

:global(body.dark) .qz-zip-header-title,
:global(html.dark) .qz-zip-header-title,
:global(.dark) .qz-zip-header-title,
:global(:root[data-theme="dark"]) .qz-zip-header-title {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-zip-close-btn,
:global(html.dark) .qz-zip-close-btn,
:global(.dark) .qz-zip-close-btn,
:global(:root[data-theme="dark"]) .qz-zip-close-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  color: #f7f7fd !important;
}

:global(body.dark) .qz-zip-close-btn:hover:not(:disabled),
:global(html.dark) .qz-zip-close-btn:hover:not(:disabled),
:global(.dark) .qz-zip-close-btn:hover:not(:disabled),
:global(:root[data-theme="dark"]) .qz-zip-close-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2) !important;
}

:global(body.dark) .qz-zip-card,
:global(html.dark) .qz-zip-card,
:global(.dark) .qz-zip-card,
:global(:root[data-theme="dark"]) .qz-zip-card {
  background: #1d1838 !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35) !important;
}

:global(body.dark) .qz-zip-squircle,
:global(html.dark) .qz-zip-squircle,
:global(.dark) .qz-zip-squircle,
:global(:root[data-theme="dark"]) .qz-zip-squircle {
  background: linear-gradient(135deg, #2a2254 0%, #1f1842 100%) !important;
  color: #a39bf0 !important;
  border: 1px solid rgba(163, 155, 240, 0.2) !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3) !important;
}

:global(body.dark) .qz-zip-title,
:global(html.dark) .qz-zip-title,
:global(.dark) .qz-zip-title,
:global(:root[data-theme="dark"]) .qz-zip-title {
  color: #f7f7fd !important;
}

:global(body.dark) .qz-zip-meta-pill,
:global(html.dark) .qz-zip-meta-pill,
:global(.dark) .qz-zip-meta-pill,
:global(:root[data-theme="dark"]) .qz-zip-meta-pill {
  background: #28214b !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #a39bf0 !important;
}

:global(body.dark) .qz-zip-current-status,
:global(html.dark) .qz-zip-current-status,
:global(.dark) .qz-zip-current-status,
:global(:root[data-theme="dark"]) .qz-zip-current-status {
  background: #16122c !important;
  border-color: rgba(255, 255, 255, 0.06) !important;
}

:global(body.dark) .qz-zip-status-dot,
:global(html.dark) .qz-zip-status-dot,
:global(.dark) .qz-zip-status-dot,
:global(:root[data-theme="dark"]) .qz-zip-status-dot {
  background: #a39bf0 !important;
}

:global(body.dark) .qz-zip-status-text,
:global(html.dark) .qz-zip-status-text,
:global(.dark) .qz-zip-status-text,
:global(:root[data-theme="dark"]) .qz-zip-status-text {
  color: #cbd5e1 !important;
}

:global(body.dark) .qz-zip-progress-label,
:global(html.dark) .qz-zip-progress-label,
:global(.dark) .qz-zip-progress-label,
:global(:root[data-theme="dark"]) .qz-zip-progress-label {
  color: #94a3b8 !important;
}

:global(body.dark) .qz-zip-progress-percent,
:global(html.dark) .qz-zip-progress-percent,
:global(.dark) .qz-zip-progress-percent,
:global(:root[data-theme="dark"]) .qz-zip-progress-percent {
  color: #a39bf0 !important;
}

:global(body.dark) .qz-zip-track,
:global(html.dark) .qz-zip-track,
:global(.dark) .qz-zip-track,
:global(:root[data-theme="dark"]) .qz-zip-track {
  background: #2d2656 !important;
}

:global(body.dark) .qz-zip-fill,
:global(html.dark) .qz-zip-fill,
:global(.dark) .qz-zip-fill,
:global(:root[data-theme="dark"]) .qz-zip-fill {
  background: linear-gradient(90deg, #8b7af4 0%, #a39bf0 100%) !important;
  box-shadow: 0 2px 8px rgba(139, 122, 244, 0.4) !important;
}

:global(body.dark) .qz-zip-info-box,
:global(html.dark) .qz-zip-info-box,
:global(.dark) .qz-zip-info-box,
:global(:root[data-theme="dark"]) .qz-zip-info-box {
  background: #231d42 !important;
  border-color: rgba(163, 155, 240, 0.15) !important;
}

:global(body.dark) .qz-zip-info-icon,
:global(html.dark) .qz-zip-info-icon,
:global(.dark) .qz-zip-info-icon,
:global(:root[data-theme="dark"]) .qz-zip-info-icon {
  color: #a39bf0 !important;
}

:global(body.dark) .qz-zip-info-box span,
:global(html.dark) .qz-zip-info-box span,
:global(.dark) .qz-zip-info-box span,
:global(:root[data-theme="dark"]) .qz-zip-info-box span {
  color: #cbd5e1 !important;
}

:global(body.dark) .qz-btn-cancel-zip,
:global(html.dark) .qz-btn-cancel-zip,
:global(.dark) .qz-btn-cancel-zip,
:global(:root[data-theme="dark"]) .qz-btn-cancel-zip {
  background: rgba(239, 68, 68, 0.16) !important;
  border-color: rgba(239, 68, 68, 0.45) !important;
  color: #f87171 !important;
}

:global(body.dark) .qz-btn-cancel-zip:hover:not(:disabled),
:global(html.dark) .qz-btn-cancel-zip:hover:not(:disabled),
:global(.dark) .qz-btn-cancel-zip:hover:not(:disabled),
:global(:root[data-theme="dark"]) .qz-btn-cancel-zip:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25) !important;
  border-color: rgba(239, 68, 68, 0.6) !important;
}

/* ==========================================================================
   Modo Oscuro para Modal ZIP (Preferencia del Sistema @media prefers-color-scheme)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  .qz-zip-modal,
  ion-modal.qz-zip-modal {
    --background: #120f24 !important;
    --box-shadow: 0 20px 48px -8px rgba(0, 0, 0, 0.6) !important;
  }
  .qz-zip-modal::part(content),
  ion-modal.qz-zip-modal::part(content) {
    background: #120f24 !important;
    box-shadow: 0 20px 48px -8px rgba(0, 0, 0, 0.6) !important;
  }
  .qz-zip-modal-wrapper {
    background: #120f24 !important;
  }
  .qz-zip-modal-header {
    background: linear-gradient(180deg, #1d1838 0%, #251e45 100%) !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  }
  .qz-zip-tag {
    color: #a39bf0 !important;
  }
  .qz-zip-header-title {
    color: #f7f7fd !important;
  }
  .qz-zip-close-btn {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    color: #f7f7fd !important;
  }
  .qz-zip-close-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2) !important;
  }
  .qz-zip-card {
    background: #1d1838 !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35) !important;
  }
  .qz-zip-squircle {
    background: linear-gradient(135deg, #2a2254 0%, #1f1842 100%) !important;
    color: #a39bf0 !important;
    border: 1px solid rgba(163, 155, 240, 0.2) !important;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3) !important;
  }
  .qz-zip-title {
    color: #f7f7fd !important;
  }
  .qz-zip-meta-pill {
    background: #28214b !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
    color: #a39bf0 !important;
  }
  .qz-zip-current-status {
    background: #16122c !important;
    border-color: rgba(255, 255, 255, 0.06) !important;
  }
  .qz-zip-status-dot {
    background: #a39bf0 !important;
  }
  .qz-zip-status-text {
    color: #cbd5e1 !important;
  }
  .qz-zip-progress-label {
    color: #94a3b8 !important;
  }
  .qz-zip-progress-percent {
    color: #a39bf0 !important;
  }
  .qz-zip-track {
    background: #2d2656 !important;
  }
  .qz-zip-fill {
    background: linear-gradient(90deg, #8b7af4 0%, #a39bf0 100%) !important;
    box-shadow: 0 2px 8px rgba(139, 122, 244, 0.4) !important;
  }
  .qz-zip-info-box {
    background: #231d42 !important;
    border-color: rgba(163, 155, 240, 0.15) !important;
  }
  .qz-zip-info-icon {
    color: #a39bf0 !important;
  }
  .qz-zip-info-box span {
    color: #cbd5e1 !important;
  }
  .qz-btn-cancel-zip {
    background: rgba(239, 68, 68, 0.16) !important;
    border-color: rgba(239, 68, 68, 0.45) !important;
    color: #f87171 !important;
  }
  .qz-btn-cancel-zip:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.25) !important;
    border-color: rgba(239, 68, 68, 0.6) !important;
  }
}
</style>
