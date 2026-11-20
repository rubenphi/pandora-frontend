<template>
  <ion-page class="ion-page qz-profile-page">
    <ion-content
      :fullscreen="true"
      class="qz-profile-content"
      :force-overscroll="false"
    >
      <!-- 1. CABECERA HERO PÚRPURA QUEEZY -->
      <div class="qz-hero-section">
        <!-- Barra Superior: Pill Central y Cerrar Sesión -->
        <div class="qz-hero-top">
          <div class="qz-header-pill">
            <ion-icon :icon="sparklesOutline" class="qz-pill-icon"></ion-icon>
            <span>PERFIL DE ESTUDIANTE</span>
          </div>

          <button
            type="button"
            class="qz-circle-btn"
            title="Cerrar sesión"
            @click="confirmarSalida"
          >
            <ion-icon :icon="exitOutline"></ion-icon>
          </button>
        </div>

        <!-- Banner de Perfil de Usuario -->
        <div class="qz-hero-profile">
          <div class="qz-profile-avatar">
            {{ getInitials(usuario) }}
          </div>

          <div class="qz-hero-titles">
            <h1 class="qz-hero-title">
              {{
                usuario
                  ? (usuario.name + " " + (usuario.lastName || "")).trim()
                  : "Estudiante"
              }}
            </h1>

            <div class="qz-hero-tags-row">
              <span class="qz-hero-pill-badge">
                <ion-icon :icon="idCardOutline"></ion-icon>
                <span>Código: {{ usuario?.code || "—" }}</span>
              </span>

              <span class="qz-hero-pill-badge">
                <ion-icon :icon="schoolOutline"></ion-icon>
                <span>{{
                  actualCurso?.course?.name ||
                  actualCurso?.name ||
                  "Curso Activo"
                }}</span>
              </span>

              <span v-if="usuario?.institute?.name" class="qz-hero-pill-badge">
                <ion-icon :icon="bookOutline"></ion-icon>
                <span>{{ usuario.institute.name }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. CUERPO DE LA PÁGINA (TARJETAS QUEEZY) -->
      <div class="qz-sheet-section">
        <!-- SECCIÓN A: MODALIDAD / GRUPO DE TRABAJO -->
        <div class="qz-card qz-group-section-card">
          <div class="qz-card-header">
            <div
              class="qz-icon-pill"
              :class="{ 'qz-pill--individual': !grupoUsuario?.id }"
            >
              <ion-icon
                :icon="grupoUsuario?.id ? peopleOutline : personOutline"
              ></ion-icon>
            </div>

            <div class="qz-card-titles">
              <h2 class="qz-card-title">
                {{
                  grupoUsuario?.id
                    ? "Grupo de Trabajo Actual"
                    : "Modalidad de Trabajo"
                }}
              </h2>
              <p class="qz-card-subtitle">
                {{
                  grupoUsuario?.id
                    ? "Equipo asignado para actividades y dinámicas grupales"
                    : "Asignación para el desarrollo de actividades del curso"
                }}
              </p>
            </div>

            <span
              class="qz-status-badge"
              :class="
                grupoUsuario?.id ? 'qz-badge--group' : 'qz-badge--individual'
              "
            >
              {{ grupoUsuario?.id ? "En Equipo" : "Trabajo Individual" }}
            </span>
          </div>

          <!-- CASO 1: TIENE GRUPO ASIGNADO -->
          <div v-if="grupoUsuario?.id" class="qz-group-active-content">
            <div class="qz-group-hero-badge">
              <div class="qz-group-avatar">
                {{ getGroupInitials(grupoUsuario.name) }}
              </div>
              <div class="qz-group-hero-info">
                <h3 class="qz-group-hero-name">{{ grupoUsuario.name }}</h3>
                <span class="qz-group-hero-meta">
                  {{ miembros.length }}
                  {{
                    miembros.length === 1
                      ? "integrante registrado"
                      : "integrantes registrados"
                  }}
                </span>
              </div>
            </div>

            <div
              v-if="miembros && miembros.length > 0"
              class="qz-members-list-wrap"
            >
              <span class="qz-members-label">COMPAÑEROS DE EQUIPO:</span>
              <div class="qz-members-chips-grid">
                <div
                  v-for="miembro in miembros"
                  :key="miembro?.id"
                  class="qz-member-chip"
                  :class="{ 'is-self': miembro?.user?.id === usuario?.id }"
                >
                  <div class="qz-member-chip-avatar">
                    {{ getInitials(miembro?.user) }}
                  </div>
                  <span class="qz-member-chip-name">
                    {{ miembro?.user?.name }} {{ miembro?.user?.lastName }}
                  </span>
                  <span
                    v-if="miembro?.user?.id === usuario?.id"
                    class="qz-self-tag"
                    >Tú</span
                  >
                </div>
              </div>
            </div>

            <div class="qz-group-footer-actions">
              <button
                type="button"
                class="qz-action-pill-btn qz-btn--secondary"
                @click="openModal"
              >
                <ion-icon :icon="swapHorizontalOutline"></ion-icon>
                <span>Cambiar de grupo</span>
              </button>
            </div>
          </div>

          <!-- CASO 2: NO TIENE GRUPO (TRABAJO INDIVIDUAL) -->
          <div v-else class="qz-individual-active-content">
            <div class="qz-individual-banner">
              <div class="qz-individual-icon-wrap">
                <ion-icon :icon="personCircleOutline"></ion-icon>
              </div>
              <div class="qz-individual-info">
                <h3 class="qz-individual-title">
                  Trabajando de Forma Individual
                </h3>
                <p class="qz-individual-text">
                  Estás trabajando de manera <strong>100% individual</strong>.
                  Todas tus evaluaciones, cuestionarios y calificaciones se
                  registran directamente a tu perfil personal sin depender de
                  ningún grupo.
                </p>
              </div>
            </div>

            <div class="qz-group-footer-actions">
              <button
                type="button"
                class="qz-action-pill-btn qz-btn--secondary"
                @click="openModal"
              >
                <ion-icon :icon="peopleOutline"></ion-icon>
                <span>Unirme a un grupo</span>
              </button>
            </div>
          </div>
        </div>

        <!-- SECCIÓN B: DATOS PERSONALES -->
        <div class="qz-card qz-student-info-card">
          <div class="qz-card-header">
            <div class="qz-icon-pill">
              <ion-icon :icon="idCardOutline"></ion-icon>
            </div>
            <div class="qz-card-titles">
              <h2 class="qz-card-title">Datos del Estudiante</h2>
              <p class="qz-card-subtitle">
                Información de cuenta y matrícula institucional
              </p>
            </div>
          </div>

          <div class="qz-info-grid">
            <div class="qz-info-item">
              <span class="qz-info-label">CÓDIGO DE USUARIO</span>
              <span class="qz-info-value">{{ usuario?.code || "—" }}</span>
            </div>

            <div class="qz-info-item">
              <span class="qz-info-label">CORREO ELECTRÓNICO</span>
              <span class="qz-info-value">{{ usuario?.email || "—" }}</span>
            </div>

            <div class="qz-info-item">
              <span class="qz-info-label">CURSO MATRICULADO</span>
              <span class="qz-info-value">
                {{
                  actualCurso?.course?.name ||
                  actualCurso?.name ||
                  "Sin curso asignado"
                }}
              </span>
            </div>

            <div class="qz-info-item">
              <span class="qz-info-label">INSTITUCIÓN EDUCATIVA</span>
              <span class="qz-info-value">{{
                usuario?.institute?.name || "—"
              }}</span>
            </div>
          </div>
        </div>

        <!-- SECCIÓN C: CALIFICACIONES (GRUPO O INDIVIDUAL) -->
        <div
          v-if="!finalPeriodo && !adminOProfesor"
          class="qz-card qz-grades-sheet"
        >
          <div class="qz-grades-sheet-header">
            <div class="qz-grades-header-left">
              <div class="qz-icon-pill">
                <ion-icon :icon="schoolOutline"></ion-icon>
              </div>
              <div class="qz-card-titles">
                <h2 class="qz-card-title">
                  {{
                    grupoUsuario?.id
                      ? "Calificaciones del Equipo"
                      : "Mis Calificaciones"
                  }}
                </h2>
                <p class="qz-card-subtitle">
                  {{
                    grupoUsuario?.id
                      ? "Consulta las calificaciones de los integrantes del equipo por período"
                      : "Consulta tus notas, dimensiones y promedios por área"
                  }}
                </p>
              </div>
            </div>

            <!-- Selector de Período -->
            <div class="qz-period-selector-wrap">
              <label class="qz-period-label">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <span>Período:</span>
              </label>
              <ion-select
                v-model="periodoSelected"
                interface="popover"
                class="qz-period-select"
                placeholder="Seleccione el período"
              >
                <ion-select-option
                  v-for="periodo in periodos"
                  :key="periodo?.id"
                  :value="periodo?.id"
                >
                  {{ periodo?.name }}
                </ion-select-option>
              </ion-select>
            </div>
          </div>

          <!-- Empty State si no hay áreas o período -->
          <div
            v-if="
              !groupMembersWithGrades || groupMembersWithGrades.length === 0
            "
            class="qz-empty-grades-state"
          >
            <ion-spinner name="crescent" class="qz-spinner"></ion-spinner>
            <p>Cargando información académica...</p>
          </div>

          <!-- Acordeón de Miembros (o del Estudiante Individual) -->
          <ion-accordion-group
            v-else
            :value="defaultExpandedMember"
            class="qz-members-accordion-group"
          >
            <ion-accordion
              v-for="member in groupMembersWithGrades"
              :key="member.userId"
              :value="String(member.userId)"
              class="qz-member-accordion"
            >
              <ion-item
                slot="header"
                lines="none"
                class="qz-member-header-item"
              >
                <div class="qz-member-avatar-chip">
                  {{ getInitials({ name: member.userName }) }}
                </div>
                <ion-label class="qz-member-name-label">
                  <h3>{{ member.userName }}</h3>
                </ion-label>
                <span
                  v-if="member.userId === usuario?.id"
                  slot="end"
                  class="qz-self-pill"
                  >Tú</span
                >
                <span
                  v-else-if="member.isIndividual"
                  slot="end"
                  class="qz-individual-pill"
                  >Individual</span
                >
              </ion-item>

              <div slot="content" class="qz-member-content-wrap">
                <!-- Acordeón de Áreas del Estudiante -->
                <ion-accordion-group
                  @ionChange="handleAreaExpand($event, member)"
                  class="qz-areas-accordion-group"
                >
                  <ion-accordion
                    v-for="area in member.areas"
                    :key="area.id"
                    :value="String(area.id)"
                    class="qz-area-accordion"
                  >
                    <ion-item
                      slot="header"
                      lines="none"
                      class="qz-area-header-item"
                    >
                      <ion-label class="qz-area-title-label">
                        <h4>{{ area.name }}</h4>
                      </ion-label>

                      <!-- Promedios y Chips del Área -->
                      <div
                        v-if="area.loaded"
                        slot="end"
                        class="qz-area-grades-summary"
                      >
                        <span
                          class="qz-grade-badge"
                          :class="getGradeColorClass(area.promedio)"
                          :style="{
                            opacity: area.hasReinforcement ? '0.65' : '1',
                          }"
                          title="Promedio Regular"
                        >
                          RG: {{ area.promedio }}
                        </span>

                        <span
                          v-if="area.hasReinforcement"
                          class="qz-grade-badge qz-badge--reinf"
                          :class="
                            getGradeColorClass(area.promedioReinf || '1.0')
                          "
                          title="Promedio de Refuerzo"
                        >
                          RF: {{ area.promedioReinf || "1.0" }}
                        </span>

                        <span
                          v-if="area.hasRemedial"
                          class="qz-grade-badge qz-badge--remedial"
                          :class="
                            getGradeColorClass(area.promedioRemedial || '1.0')
                          "
                          title="Promedio de Nivelación"
                        >
                          NV: {{ area.promedioRemedial || "1.0" }}
                        </span>
                      </div>

                      <ion-spinner
                        v-else-if="area.loading"
                        name="dots"
                        slot="end"
                        class="qz-area-spinner"
                      ></ion-spinner>
                    </ion-item>

                    <!-- Detalle de la Área al Expandir -->
                    <div slot="content" class="qz-area-details-body">
                      <!-- Loading -->
                      <div v-if="area.loading" class="qz-area-loading-box">
                        <ion-spinner name="crescent"></ion-spinner>
                        <p>Cargando calificaciones de {{ area.name }}...</p>
                      </div>

                      <!-- Loaded Details -->
                      <div
                        v-else-if="area.loaded"
                        class="qz-area-dimensions-wrap"
                      >
                        <ion-accordion-group
                          class="qz-dimension-accordion-group"
                        >
                          <!-- 1. NOTAS REGULARES -->
                          <ion-accordion
                            value="regulares"
                            class="qz-dimension-accordion"
                          >
                            <ion-item
                              slot="header"
                              lines="none"
                              class="qz-dimension-header"
                            >
                              <ion-label color="primary">
                                <strong>Notas Regulares</strong>
                              </ion-label>
                              <span
                                slot="end"
                                class="qz-grade-badge"
                                :class="getGradeColorClass(area.promedio)"
                              >
                                {{ area.promedio }}
                              </span>
                            </ion-item>

                            <div slot="content" class="qz-dimension-content">
                              <div
                                v-for="dimension in area.dimensiones"
                                :key="dimension.id"
                                class="qz-dimension-block"
                              >
                                <div class="qz-dimension-subhead">
                                  <span class="qz-dimension-name">
                                    Dimensión: {{ dimension.name }}
                                  </span>
                                  <span
                                    class="qz-grade-badge qz-badge--sm"
                                    :class="
                                      getGradeColorClass(dimension.promedio)
                                    "
                                  >
                                    {{ dimension.promedio }}
                                  </span>
                                </div>

                                <div
                                  v-if="
                                    dimension.notas &&
                                    dimension.notas.length > 0
                                  "
                                  class="qz-notes-list"
                                >
                                  <div
                                    v-for="nota in dimension.notas"
                                    :key="nota?.id"
                                    class="qz-note-item"
                                    :class="{ 'is-clickable': !nota.isPending }"
                                    @click="goToResult(nota)"
                                  >
                                    <div class="qz-note-left">
                                      <ion-icon
                                        :icon="easelOutline"
                                        class="qz-note-icon"
                                      ></ion-icon>
                                      <span class="qz-note-title">
                                        {{
                                          nota?.gradableItem?.title ||
                                          nota.title
                                        }}
                                      </span>
                                    </div>

                                    <div class="qz-note-right">
                                      <span
                                        class="qz-grade-badge qz-badge--sm"
                                        :class="getGradeColorClass(nota.grade)"
                                      >
                                        {{
                                          nota.grade !== null &&
                                          nota.grade !== undefined
                                            ? nota.grade
                                            : "Pendiente"
                                        }}
                                      </span>
                                      <ion-icon
                                        v-if="!nota.isPending"
                                        :icon="chevronForwardOutline"
                                        class="qz-note-arrow"
                                      ></ion-icon>
                                    </div>
                                  </div>
                                </div>
                                <div v-else class="qz-notes-empty">
                                  <span
                                    >Sin notas registradas en esta
                                    dimensión</span
                                  >
                                </div>
                              </div>
                            </div>
                          </ion-accordion>

                          <!-- 2. NOTAS DE REFUERZO -->
                          <ion-accordion
                            v-if="area.hasReinforcement"
                            value="refuerzo"
                            class="qz-dimension-accordion"
                          >
                            <ion-item
                              slot="header"
                              lines="none"
                              class="qz-dimension-header"
                            >
                              <ion-label color="tertiary">
                                <strong>Notas de Refuerzo</strong>
                              </ion-label>
                              <span
                                slot="end"
                                class="qz-grade-badge"
                                :class="
                                  getGradeColorClass(
                                    area.promedioReinf || '1.0',
                                  )
                                "
                              >
                                RF: {{ area.promedioReinf || "1.0" }}
                              </span>
                            </ion-item>

                            <div slot="content" class="qz-dimension-content">
                              <div
                                v-for="dimension in area.dimensiones"
                                :key="'reinf-' + dimension.id"
                                class="qz-dimension-block"
                              >
                                <div
                                  v-if="
                                    dimension.notasReinf &&
                                    dimension.notasReinf.length > 0
                                  "
                                >
                                  <div class="qz-dimension-subhead">
                                    <span class="qz-dimension-name">
                                      {{ dimension.name }} (Refuerzo)
                                    </span>
                                    <span
                                      class="qz-grade-badge qz-badge--sm"
                                      :class="
                                        getGradeColorClass(
                                          dimension.promedioReinf,
                                        )
                                      "
                                    >
                                      {{ dimension.promedioReinf }}
                                    </span>
                                  </div>

                                  <div class="qz-notes-list">
                                    <div
                                      v-for="nota in dimension.notasReinf"
                                      :key="nota?.id"
                                      class="qz-note-item"
                                      :class="{
                                        'is-clickable': !nota.isPending,
                                      }"
                                      @click="goToResult(nota)"
                                    >
                                      <div class="qz-note-left">
                                        <ion-icon
                                          :icon="easelOutline"
                                          class="qz-note-icon qz-icon--reinf"
                                        ></ion-icon>
                                        <span class="qz-note-title">
                                          {{
                                            nota?.gradableItem?.title ||
                                            nota.title
                                          }}
                                        </span>
                                      </div>

                                      <div class="qz-note-right">
                                        <span
                                          class="qz-grade-badge qz-badge--sm"
                                          :class="
                                            getGradeColorClass(nota.grade)
                                          "
                                        >
                                          {{
                                            nota.grade !== null &&
                                            nota.grade !== undefined
                                              ? nota.grade
                                              : "Pendiente"
                                          }}
                                        </span>
                                        <ion-icon
                                          v-if="!nota.isPending"
                                          :icon="chevronForwardOutline"
                                          class="qz-note-arrow"
                                        ></ion-icon>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </ion-accordion>

                          <!-- 3. NOTAS DE NIVELACIÓN -->
                          <ion-accordion
                            v-if="area.hasRemedial"
                            value="nivelacion"
                            class="qz-dimension-accordion"
                          >
                            <ion-item
                              slot="header"
                              lines="none"
                              class="qz-dimension-header"
                            >
                              <ion-label color="warning">
                                <strong>Notas de Nivelación</strong>
                              </ion-label>
                              <span
                                slot="end"
                                class="qz-grade-badge"
                                :class="
                                  getGradeColorClass(
                                    area.promedioRemedial || '1.0',
                                  )
                                "
                              >
                                NV: {{ area.promedioRemedial || "1.0" }}
                              </span>
                            </ion-item>

                            <div slot="content" class="qz-dimension-content">
                              <div
                                v-for="dimension in area.dimensiones"
                                :key="'rem-' + dimension.id"
                                class="qz-dimension-block"
                              >
                                <div
                                  v-if="
                                    dimension.notasRemedial &&
                                    dimension.notasRemedial.length > 0
                                  "
                                >
                                  <div class="qz-dimension-subhead">
                                    <span class="qz-dimension-name">
                                      {{ dimension.name }} (Nivelación)
                                    </span>
                                    <span
                                      class="qz-grade-badge qz-badge--sm"
                                      :class="
                                        getGradeColorClass(
                                          dimension.promedioRemedial,
                                        )
                                      "
                                    >
                                      {{ dimension.promedioRemedial }}
                                    </span>
                                  </div>

                                  <div class="qz-notes-list">
                                    <div
                                      v-for="nota in dimension.notasRemedial"
                                      :key="nota?.id"
                                      class="qz-note-item"
                                      :class="{
                                        'is-clickable': !nota.isPending,
                                      }"
                                      @click="goToResult(nota)"
                                    >
                                      <div class="qz-note-left">
                                        <ion-icon
                                          :icon="easelOutline"
                                          class="qz-note-icon qz-icon--remedial"
                                        ></ion-icon>
                                        <span class="qz-note-title">
                                          {{
                                            nota?.gradableItem?.title ||
                                            nota.title
                                          }}
                                        </span>
                                      </div>

                                      <div class="qz-note-right">
                                        <span
                                          class="qz-grade-badge qz-badge--sm"
                                          :class="
                                            getGradeColorClass(nota.grade)
                                          "
                                        >
                                          {{
                                            nota.grade !== null &&
                                            nota.grade !== undefined
                                              ? nota.grade
                                              : "Pendiente"
                                          }}
                                        </span>
                                        <ion-icon
                                          v-if="!nota.isPending"
                                          :icon="chevronForwardOutline"
                                          class="qz-note-arrow"
                                        ></ion-icon>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </ion-accordion>
                        </ion-accordion-group>
                      </div>

                      <!-- Not loaded yet -->
                      <div v-else class="qz-area-idle-box">
                        <p>
                          Toca esta área para consultar el desglose de notas y
                          actividades.
                        </p>
                      </div>
                    </div>
                  </ion-accordion>
                </ion-accordion-group>
              </div>
            </ion-accordion>
          </ion-accordion-group>
        </div>

        <!-- Tarjeta de Acceso Restringido en Final de Período -->
        <div v-else-if="finalPeriodo" class="qz-card qz-restricted-card">
          <div class="qz-restricted-icon-wrap">
            <ion-icon :icon="lockClosedOutline"></ion-icon>
          </div>
          <h2 class="qz-restricted-title">Acceso Temporalmente Restringido</h2>
          <p class="qz-restricted-text">
            En épocas de cierre de período académico y consolidación de notas
            finales, el acceso al perfil detallado de notas se encuentra
            restringido.
          </p>
        </div>
      </div>

      <!-- MODAL QUEEZY: CAMBIO O ASIGNACIÓN DE GRUPO -->
      <ion-modal
        ref="modal"
        :is-open="isModalOpen"
        @didDismiss="isModalOpen = false"
        :breakpoints="[0.3, 0.6, 0.9]"
        :initial-breakpoint="0.6"
        class="qz-custom-modal"
      >
        <div class="qz-modal-sheet">
          <div class="qz-modal-header">
            <h3 class="qz-modal-title">
              {{ grupoUsuario?.id ? "Cambio de Grupo" : "Unirse a un Grupo" }}
            </h3>
            <p class="qz-modal-subtitle">
              Selecciona el equipo e ingresa el código de autorización del
              docente
            </p>
          </div>

          <div class="qz-modal-body">
            <div v-if="grupos && grupos.length > 0" class="qz-modal-field">
              <label class="qz-modal-label">Equipo de destino</label>
              <ion-select
                v-model="grupo"
                placeholder="Seleccione el nuevo equipo"
                interface="action-sheet"
                class="qz-modal-select"
              >
                <ion-select-option
                  v-for="grp in grupos"
                  :key="grp.id"
                  :value="grp.id"
                >
                  {{ grp.name }}
                </ion-select-option>
              </ion-select>
            </div>
            <div v-else class="qz-modal-empty-groups">
              <ion-icon :icon="informationCircleOutline"></ion-icon>
              <span
                >Actualmente no hay otros equipos disponibles en este curso.
                Cuando el docente configure grupos, podrás seleccionarlos
                aquí.</span
              >
            </div>

            <div class="qz-modal-field">
              <label class="qz-modal-label">Código de autorización</label>
              <ion-input
                v-model="code"
                placeholder="Ingresa el código proporcionado por el docente"
                class="qz-modal-input"
              ></ion-input>
            </div>
          </div>

          <div class="qz-modal-actions">
            <button
              type="button"
              class="qz-action-pill-btn qz-btn--secondary"
              @click="cancel()"
            >
              Cancelar
            </button>

            <button
              type="button"
              class="qz-action-pill-btn qz-btn--primary"
              :disabled="!grupo || !code || !grupos || grupos.length === 0"
              @click="confirm()"
            >
              Confirmar
            </button>
          </div>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  easelOutline,
  swapHorizontalOutline,
  peopleOutline,
  personOutline,
  personCircleOutline,
  sparklesOutline,
  schoolOutline,
  idCardOutline,
  calendarOutline,
  exitOutline,
  lockClosedOutline,
  chevronForwardOutline,
  bookOutline,
  informationCircleOutline,
} from "ionicons/icons";
import axios from "axios";
import { ref, watch } from "vue";
import {
  adminOprofesor,
  periodosGet,
  selectedYear,
  tokenHeader,
  usuarioGet,
} from "../globalService";
import {
  onIonViewWillEnter,
  IonPage,
  IonContent,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonLabel,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonSpinner,
  IonModal,
  alertController,
} from "@ionic/vue";
import { useRouter } from "vue-router";

export default {
  name: "PerfilGrupoPage",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonLabel,
    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonSpinner,
    IonModal,
  },

  setup() {
    const router = useRouter();
    const usuario = ref();
    const adminOProfesor = ref(false);
    const finalPeriodo = ref(false);

    const cursosUsuario = ref([]);
    const periodos = ref([]);
    const periodoSelected = ref(
      localStorage.getItem("periodoSelected")
        ? parseInt(localStorage.getItem("periodoSelected"), 10)
        : null,
    );
    const actualCurso = ref({});
    const year = ref();
    const grupo = ref();
    const modal = ref();
    const code = ref("");

    const grupoUsuario = ref(null);
    const groupMembersWithGrades = ref([]);
    const defaultExpandedMember = ref("");

    const grupos = ref([]);
    const miembros = ref([]);
    const isModalOpen = ref(false);

    const openModal = () => {
      isModalOpen.value = true;
    };

    const cancel = () => {
      isModalOpen.value = false;
      if (modal.value?.$el) {
        modal.value.$el.dismiss(null, "cancel");
      }
    };

    const confirm = async () => {
      if (!grupo.value || !code.value) return;

      const data = {
        groupId: grupo.value,
        userId: usuario.value.id,
        code: code.value.trim(),
        year: parseInt(year.value, 10),
        active: true,
      };

      try {
        await axios.post(
          `/users/${usuario.value.id}/groups`,
          data,
          tokenHeader(),
        );
        isModalOpen.value = false;
        if (modal.value?.$el) {
          modal.value.$el.dismiss(data, "confirm");
        }
        location.reload();
      } catch (err) {
        console.error("Error al unirse o cambiar de grupo:", err);
        const alert = await alertController.create({
          header: "Código Inválido",
          message:
            err.response?.data?.message ||
            "El código de autorización es incorrecto o no se pudo unir al grupo.",
          buttons: ["Aceptar"],
        });
        await alert.present();
      }
    };

    const confirmarSalida = async () => {
      const alert = await alertController.create({
        header: "Cerrar Sesión",
        message: "¿Estás seguro de que deseas salir del sistema?",
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Cerrar Sesión",
            role: "destructive",
            handler: () => {
              localStorage.clear();
              sessionStorage.clear();
              router.push("/login");
            },
          },
        ],
      });
      await alert.present();
    };

    // Helper para obtener iniciales del estudiante
    const getInitials = (user) => {
      if (!user) return "ES";
      const name = String(user.name || "").trim();
      const last = String(user.lastName || "").trim();
      if (name && last) {
        return (name.charAt(0) + last.charAt(0)).toUpperCase();
      }
      if (name) {
        return name.substring(0, 2).toUpperCase();
      }
      return "ES";
    };

    // Helper para iniciales de un grupo
    const getGroupInitials = (groupName) => {
      if (!groupName) return "GP";
      const cleaned = String(groupName)
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

    const initializeGroupData = async () => {
      try {
        const courseId = actualCurso.value?.course?.id || actualCurso.value?.id;
        if (!courseId || !periodoSelected.value) {
          groupMembersWithGrades.value = [];
          return;
        }

        const areasResponse = await axios.get(
          `/courses/${courseId}/areas`,
          tokenHeader(),
        );
        const areas = areasResponse.data || [];

        // Si tiene grupo con miembros registrados, usamos la lista de miembros.
        // Si NO tiene grupo (o curso pequeño donde trabajan individual), usamos al propio estudiante.
        const effectiveMembers =
          miembros.value && miembros.value.length > 0
            ? miembros.value
            : usuario.value
            ? [{ id: `self-${usuario.value.id}`, user: usuario.value }]
            : [];

        if (effectiveMembers.length === 0) {
          groupMembersWithGrades.value = [];
          return;
        }

        groupMembersWithGrades.value = effectiveMembers.map((miembro) => {
          const userObj = miembro.user || miembro;
          const fullName =
            userObj.name && userObj.lastName
              ? `${userObj.name} ${userObj.lastName}`
              : userObj.name || userObj.username || "Estudiante";

          return {
            userId: userObj.id,
            userName: fullName,
            isIndividual: !grupoUsuario.value?.id,
            areas: areas.map((area) => ({
              id: area.id,
              name: area.name,
              loading: false,
              loaded: false,
              promedio: "-",
              promedioReinf: null,
              promedioRemedial: null,
              hasReinforcement: false,
              hasRemedial: false,
              dimensiones: [],
            })),
          };
        });

        // Expandir por defecto al estudiante actual
        if (groupMembersWithGrades.value.length > 0) {
          const selfMember = groupMembersWithGrades.value.find(
            (m) => m.userId === usuario.value?.id,
          );
          defaultExpandedMember.value = String(
            selfMember
              ? selfMember.userId
              : groupMembersWithGrades.value[0].userId,
          );
        }
      } catch (err) {
        console.error("Error al inicializar datos académicos:", err);
      }
    };

    const handleAreaExpand = async (ev, member) => {
      let areaId = ev.detail.value;
      if (Array.isArray(areaId)) {
        areaId = areaId.length > 0 ? areaId[areaId.length - 1] : null;
      }

      if (areaId === undefined || areaId === null || areaId === "") return;

      const area = member.areas.find((a) => String(a.id) === String(areaId));

      if (!area || area.loaded || area.loading) {
        return;
      }

      area.loading = true;

      try {
        const courseId = actualCurso.value?.course?.id || actualCurso.value?.id;
        if (!courseId) throw new Error("Course ID not found");

        // 1. Fetch Master List de calificaciones
        const masterGradesUrl = `/grades?courseId=${courseId}&areaId=${area.id}&periodId=${periodoSelected.value}&year=${year.value}`;
        const masterGradesResponse = await axios.get(
          masterGradesUrl,
          tokenHeader(),
        );
        const masterAllGrades = masterGradesResponse.data || [];

        const masterItemsMap = new Map();
        masterAllGrades.forEach((grade) => {
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

        // 2. Fetch specific student grades
        const studentGradesUrl = `/grades?userId=${member.userId}&areaId=${area.id}&periodId=${periodoSelected.value}&year=${year.value}`;
        const studentGradesResponse = await axios.get(
          studentGradesUrl,
          tokenHeader(),
        );
        const formatGradeValue = (grade) => {
          if (!grade && grade !== 0) return 0;
          return Math.floor(grade * 10) / 10;
        };
        const studentGrades = (studentGradesResponse.data || []).map((n) => ({
          ...n,
          grade: formatGradeValue(n.grade),
        }));

        // 3. Fetch reinforcement & remedial records
        const reinfUrl = `/reinforcement/by-context?courseId=${courseId}&areaId=${area.id}&periodId=${periodoSelected.value}&year=${year.value}&studentId=${member.userId}&lessonType=reinforcement`;
        const reinfResponse = await axios.get(reinfUrl, tokenHeader());
        const assignedReinfLessonIds = new Set(
          (reinfResponse.data || [])
            .map((r) => r.lesson?.id)
            .filter((i) => !!i),
        );

        const remedialUrl = `/reinforcement/by-context?courseId=${courseId}&areaId=${area.id}&periodId=${periodoSelected.value}&year=${year.value}&studentId=${member.userId}&lessonType=remedial`;
        const remedialResponse = await axios.get(remedialUrl, tokenHeader());
        const assignedRemedialLessonIds = new Set(
          (remedialResponse.data || [])
            .map((r) => r.lesson?.id)
            .filter((i) => !!i),
        );

        // Helper functions
        const getStudentGradeForItem = (grades, item) => {
          return grades.find(
            (g) =>
              g.gradableType === item.type &&
              String(g.gradableItem?.id) === String(item.id) &&
              g.classification === item.classification,
          );
        };

        const mapToDisplayParamsWithMasterList = (grades, masterList) => {
          return masterList
            .map((masterItem) => {
              const foundGrade = getStudentGradeForItem(grades, masterItem);
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
                return {
                  id: `pending-${masterItem.type}-${masterItem.id}-${masterItem.classification}`,
                  gradableItem: masterItem.item,
                  gradableType: masterItem.type,
                  classification: masterItem.classification,
                  grade: null,
                  isPending: true,
                };
              }
            })
            .sort(
              (a, b) =>
                new Date(a.gradableItem?.lesson?.date || 0) -
                new Date(b.gradableItem?.lesson?.date || 0),
            );
        };

        const calculateAverageFromMasterList = (grades, masterList) => {
          if (masterList.length === 0) return 0;
          let totalScore = 0;
          masterList.forEach((masterItem) => {
            const foundGrade = getStudentGradeForItem(grades, masterItem);
            if (
              foundGrade &&
              foundGrade.grade !== null &&
              foundGrade.grade !== undefined
            ) {
              totalScore += foundGrade.grade;
            }
          });
          const avg = totalScore / masterList.length;
          return Math.max(avg, 1.0);
        };

        const areaMasterItems = Array.from(masterItemsMap.values());
        const masterKnowledge = areaMasterItems.filter(
          (i) => i.classification === "knowledge",
        );
        const masterExecution = areaMasterItems.filter(
          (i) => i.classification === "execution",
        );
        const masterBehavior = areaMasterItems.filter(
          (i) => i.classification === "behavior",
        );

        // Regulares
        const mKReg = masterKnowledge.filter(
          (i) =>
            i.item.lesson?.type !== "reinforcement" &&
            i.item.lesson?.type !== "remedial",
        );
        const mEReg = masterExecution.filter(
          (i) =>
            i.item.lesson?.type !== "reinforcement" &&
            i.item.lesson?.type !== "remedial",
        );
        const mBReg = masterBehavior.filter(
          (i) =>
            i.item.lesson?.type !== "reinforcement" &&
            i.item.lesson?.type !== "remedial",
        );

        const pKReg = calculateAverageFromMasterList(studentGrades, mKReg);
        const pEReg = calculateAverageFromMasterList(studentGrades, mEReg);
        const pBReg = calculateAverageFromMasterList(studentGrades, mBReg);

        const avgReg = (pKReg + pEReg + pBReg) / 3;
        area.promedio = formatGradeValue(Math.max(avgReg, 1.0)).toFixed(1);

        // Refuerzo
        const mKReinf = masterKnowledge.filter(
          (i) =>
            i.item.lesson?.type === "reinforcement" &&
            assignedReinfLessonIds.has(i.item.lesson?.id),
        );
        const mEReinf = masterExecution.filter(
          (i) =>
            i.item.lesson?.type === "reinforcement" &&
            assignedReinfLessonIds.has(i.item.lesson?.id),
        );
        const mBReinf = masterBehavior.filter(
          (i) =>
            i.item.lesson?.type === "reinforcement" &&
            assignedReinfLessonIds.has(i.item.lesson?.id),
        );

        area.hasReinforcement =
          mKReinf.length + mEReinf.length + mBReinf.length > 0;
        if (area.hasReinforcement) {
          const pKReinf = calculateAverageFromMasterList(
            studentGrades,
            mKReinf,
          );
          const pEReinf = calculateAverageFromMasterList(
            studentGrades,
            mEReinf,
          );
          const pBReinf = calculateAverageFromMasterList(
            studentGrades,
            mBReinf,
          );

          const rawReinf = (pKReinf + pEReinf + pBReinf) / 3;
          const avgReinf = rawReinf > 4 ? 4 : rawReinf;
          area.promedioReinf = formatGradeValue(
            Math.max(avgReinf, 1.0),
          ).toFixed(1);
        }

        // Nivelación
        const mKRem = masterKnowledge.filter(
          (i) =>
            i.item.lesson?.type === "remedial" &&
            assignedRemedialLessonIds.has(i.item.lesson?.id),
        );
        const mERem = masterExecution.filter(
          (i) =>
            i.item.lesson?.type === "remedial" &&
            assignedRemedialLessonIds.has(i.item.lesson?.id),
        );
        const mBRem = masterBehavior.filter(
          (i) =>
            i.item.lesson?.type === "remedial" &&
            assignedRemedialLessonIds.has(i.item.lesson?.id),
        );

        area.hasRemedial = mKRem.length + mERem.length + mBRem.length > 0;
        if (area.hasRemedial) {
          const pKRem = calculateAverageFromMasterList(studentGrades, mKRem);
          const pERem = calculateAverageFromMasterList(studentGrades, mERem);
          const pBRem = calculateAverageFromMasterList(studentGrades, mBRem);

          const avgRem = (pKRem + pERem + pBRem) / 3;
          area.promedioRemedial = formatGradeValue(
            Math.max(avgRem, 1.0),
          ).toFixed(1);
        }

        area.dimensiones = [
          {
            id: "knowledge",
            name: "Saber",
            promedio: formatGradeValue(mKReg.length > 0 ? pKReg : 0).toFixed(1),
            notas: mapToDisplayParamsWithMasterList(studentGrades, mKReg),
            promedioReinf:
              mKReinf.length > 0
                ? formatGradeValue(
                    calculateAverageFromMasterList(studentGrades, mKReinf),
                  ).toFixed(1)
                : null,
            notasReinf: mapToDisplayParamsWithMasterList(
              studentGrades,
              mKReinf,
            ),
            promedioRemedial:
              mKRem.length > 0
                ? formatGradeValue(
                    calculateAverageFromMasterList(studentGrades, mKRem),
                  ).toFixed(1)
                : null,
            notasRemedial: mapToDisplayParamsWithMasterList(
              studentGrades,
              mKRem,
            ),
          },
          {
            id: "execution",
            name: "Hacer",
            promedio: formatGradeValue(mEReg.length > 0 ? pEReg : 0).toFixed(1),
            notas: mapToDisplayParamsWithMasterList(studentGrades, mEReg),
            promedioReinf:
              mEReinf.length > 0
                ? formatGradeValue(
                    calculateAverageFromMasterList(studentGrades, mEReinf),
                  ).toFixed(1)
                : null,
            notasReinf: mapToDisplayParamsWithMasterList(
              studentGrades,
              mEReinf,
            ),
            promedioRemedial:
              mERem.length > 0
                ? formatGradeValue(
                    calculateAverageFromMasterList(studentGrades, mERem),
                  ).toFixed(1)
                : null,
            notasRemedial: mapToDisplayParamsWithMasterList(
              studentGrades,
              mERem,
            ),
          },
          {
            id: "behavior",
            name: "Ser",
            promedio: formatGradeValue(mBReg.length > 0 ? pBReg : 0).toFixed(1),
            notas: mapToDisplayParamsWithMasterList(studentGrades, mBReg),
            promedioReinf:
              mBReinf.length > 0
                ? formatGradeValue(
                    calculateAverageFromMasterList(studentGrades, mBReinf),
                  ).toFixed(1)
                : null,
            notasReinf: mapToDisplayParamsWithMasterList(
              studentGrades,
              mBReinf,
            ),
            promedioRemedial:
              mBRem.length > 0
                ? formatGradeValue(
                    calculateAverageFromMasterList(studentGrades, mBRem),
                  ).toFixed(1)
                : null,
            notasRemedial: mapToDisplayParamsWithMasterList(
              studentGrades,
              mBRem,
            ),
          },
        ];

        area.loaded = true;
      } catch (error) {
        console.error("Error al cargar detalles del área:", error);
      } finally {
        area.loading = false;
      }
    };

    onIonViewWillEnter(async () => {
      adminOProfesor.value = adminOprofesor();
      year.value = Number.isNaN(parseInt(localStorage.getItem("year"), 10))
        ? selectedYear()
        : parseInt(localStorage.getItem("year"), 10);

      usuario.value = usuarioGet();
      periodos.value = periodosGet() || [];

      try {
        tokenHeader();
        const coursesResp = await axios.get(
          `/users/${usuario.value.id}/courses`,
          tokenHeader(),
        );
        cursosUsuario.value = coursesResp.data || [];
        actualCurso.value =
          cursosUsuario.value.find((curso) => curso.active) ||
          cursosUsuario.value[0] ||
          {};
      } catch (err) {
        console.warn("No se pudieron cargar cursos del usuario:", err);
      }

      try {
        const groupResp = await axios.get(
          `/users/${usuario.value.id}/groups`,
          tokenHeader(),
        );
        grupoUsuario.value =
          groupResp.data?.filter((g) => g.active)[0]?.group ?? null;
      } catch (err) {
        console.warn("No se pudo cargar grupo del usuario:", err);
        grupoUsuario.value = null;
      }

      if (grupoUsuario.value?.id) {
        try {
          const membersResp = await axios.get(
            `/groups/${grupoUsuario.value.id}/${year.value}/users`,
            tokenHeader(),
          );
          miembros.value = membersResp.data || [];
        } catch (err) {
          console.warn("No se pudieron cargar compañeros de grupo:", err);
          miembros.value = [];
        }
      } else {
        miembros.value = [];
      }

      if (!periodoSelected.value && periodos.value?.length > 0) {
        periodoSelected.value = periodos.value[0].id;
      }

      await initializeGroupData();

      const courseId = actualCurso.value?.course?.id || actualCurso.value?.id;
      if (courseId) {
        try {
          const currentYear = year.value || new Date().getFullYear();
          const groupsResp = await axios.get(
            `/groups?courseId=${courseId}&year=${currentYear}&active=true`,
            tokenHeader(),
          );
          const rawGroups = groupsResp.data || [];
          grupos.value = rawGroups
            .filter((g) => {
              // 1. Filtrar estrictamente por año lectivo seleccionado
              const matchesYear = Number(g.year) === Number(currentYear);
              // 2. Filtrar únicamente grupos activos
              const isActive =
                g.active === true ||
                g.active === 1 ||
                g.active === "true" ||
                g.active === "1";
              // 3. Excluir el grupo actual del estudiante (si ya tiene uno asignado)
              const isDifferentFromCurrent =
                !grupoUsuario.value?.id ||
                Number(g.id) !== Number(grupoUsuario.value.id);

              return matchesYear && isActive && isDifferentFromCurrent;
            })
            .sort((a, b) =>
              (a.name || "").localeCompare(b.name || "", undefined, {
                numeric: true,
                sensitivity: "base",
              }),
            );
        } catch (err) {
          console.warn("No se pudieron cargar grupos disponibles:", err);
          grupos.value = [];
        }
      }
    });

    watch([periodoSelected, miembros], () => {
      initializeGroupData();
    });

    watch(periodoSelected, (newVal) => {
      if (newVal) {
        localStorage.setItem("periodoSelected", newVal);
      }
    });

    // Helper de clases para los chips de notas
    const getGradeColorClass = (grade) => {
      if (
        grade === null ||
        grade === undefined ||
        isNaN(grade) ||
        grade === 0 ||
        grade === "0"
      ) {
        return "qz-grade--pending";
      }
      const num = parseFloat(grade);
      if (num < 3.0) return "qz-grade--danger";
      if (num >= 3.0 && num < 4.0) return "qz-grade--warning";
      if (num >= 4.0 && num < 4.5) return "qz-grade--success";
      if (num >= 4.5) return "qz-grade--excellent";
      return "";
    };

    const goToResult = (nota) => {
      if (nota.isPending) return;
      if (nota.gradableType === "quiz") {
        router.push(`/ganadores/${nota.gradableItem.id}`);
      } else if (nota.gradableType === "activity") {
        router.push(`/ver/revision/${nota.gradableItem.id}`);
      }
    };

    return {
      usuario,
      adminOProfesor,
      finalPeriodo,
      cursosUsuario,
      periodos,
      periodoSelected,
      actualCurso,
      year,
      grupo,
      modal,
      code,
      miembros,
      groupMembersWithGrades,
      defaultExpandedMember,
      grupos,
      grupoUsuario,
      isModalOpen,
      openModal,
      cancel,
      confirm,
      confirmarSalida,
      getInitials,
      getGroupInitials,
      getGradeColorClass,
      handleAreaExpand,
      goToResult,
      easelOutline,
      swapHorizontalOutline,
      peopleOutline,
      personOutline,
      personCircleOutline,
      sparklesOutline,
      schoolOutline,
      idCardOutline,
      calendarOutline,
      exitOutline,
      lockClosedOutline,
      chevronForwardOutline,
      bookOutline,
      informationCircleOutline,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   1. PÁGINA Y HERO HEADER PÚRPURA QUEEZY
   ========================================================================== */
.qz-profile-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-profile-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  --keyboard-offset: 0px !important;
  --padding-bottom: 32px;
}

/* Cabecera Hero Púrpura */
.qz-hero-section {
  background: linear-gradient(180deg, #6a5ae0 0%, #7667e8 100%);
  padding: calc(env(safe-area-inset-top, 0px) + 16px) 20px 32px;
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;
  box-shadow: 0 10px 24px -4px rgba(106, 90, 224, 0.28);
  color: #ffffff;
}

.qz-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
}

.qz-header-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: #ffffff;
}

.qz-pill-icon {
  font-size: 14px;
  color: #ffd233;
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
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.qz-circle-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.3);
}

/* Banner de Perfil en Hero */
.qz-hero-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.qz-profile-avatar {
  width: 68px;
  height: 68px;
  border-radius: 24px;
  background: #ffd233;
  color: #49308a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.6);
}

.qz-hero-titles {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.qz-hero-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-hero-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.qz-hero-pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.16);
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
}

.qz-hero-pill-badge ion-icon {
  font-size: 13px;
}

/* ==========================================================================
   2. CUERPO: TARJETAS Y CONTENIDO PRINCIPAL
   ========================================================================== */
.qz-sheet-section {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 900px;
  margin: 0 auto;
}

.qz-card {
  background: #ffffff;
  border-radius: var(--qz-radius-2xl, 28px);
  padding: 20px;
  box-shadow: 0 4px 16px rgba(106, 90, 224, 0.06);
  border: 1px solid var(--qz-color-border, #e9e8f7);
}

.qz-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.qz-icon-pill {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background-color: #efeefc;
  color: var(--qz-color-purple-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.qz-icon-pill.qz-pill--individual {
  background-color: #e0f2fe;
  color: #0284c7;
}

.qz-card-titles {
  flex: 1;
  min-width: 0;
}

.qz-card-title {
  margin: 0 0 3px;
  font-size: 17px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-card-subtitle {
  margin: 0;
  font-size: 12.5px;
  color: var(--qz-color-text-muted, #858494);
  line-height: 1.35;
}

.qz-status-badge {
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.qz-badge--group {
  background-color: #efeefc;
  color: var(--qz-color-purple-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.2);
}

.qz-badge--individual {
  background-color: #e0f2fe;
  color: #0369a1;
  border: 1px solid rgba(2, 132, 199, 0.25);
}

/* ==========================================================================
   3. SECCIÓN MODALIDAD: CASO EN EQUIPO Y CASO INDIVIDUAL
   ========================================================================== */
.qz-group-active-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-group-hero-badge {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #f8f8fd 0%, #efeefc 100%);
  padding: 14px 18px;
  border-radius: 20px;
  border: 1px solid #e2e0fa;
}

.qz-group-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 800;
  flex-shrink: 0;
}

.qz-group-hero-info {
  display: flex;
  flex-direction: column;
}

.qz-group-hero-name {
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-group-hero-meta {
  font-size: 12px;
  font-weight: 600;
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-members-list-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-members-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-members-chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.qz-member-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f8f8fd;
  border: 1px solid var(--qz-color-border, #e9e8f7);
  padding: 6px 12px 6px 6px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-member-chip.is-self {
  background: #efeefc;
  border-color: #cfccfb;
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-member-chip-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e2e0fa;
  color: var(--qz-color-purple-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
}

.qz-self-tag {
  background: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
  padding: 2px 7px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
}

/* BANNER DE TRABAJO INDIVIDUAL CLARO Y EXPLICATIVO */
.qz-individual-active-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-individual-banner {
  display: flex;
  gap: 14px;
  background: #f0f9ff;
  border: 1.5px solid #bae6fd;
  border-radius: 20px;
  padding: 16px;
  align-items: flex-start;
}

.qz-individual-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #e0f2fe;
  color: #0284c7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}

.qz-individual-info {
  flex: 1;
}

.qz-individual-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 800;
  color: #0369a1;
}

.qz-individual-text {
  margin: 0;
  font-size: 13.5px;
  color: #334155;
  line-height: 1.5;
}

.qz-individual-text strong {
  color: #0c092a;
}

.qz-group-footer-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

/* ==========================================================================
   4. SECCIÓN DATOS PERSONALES DEL ESTUDIANTE
   ========================================================================== */
.qz-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.qz-info-item {
  background: #f8f8fd;
  border: 1px solid var(--qz-color-border, #e9e8f7);
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.qz-info-label {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-info-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
  word-break: break-word;
}

/* ==========================================================================
   5. SECCIÓN CALIFICACIONES Y ACORDEÓN
   ========================================================================== */
.qz-grades-sheet-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.qz-grades-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 240px;
}

.qz-period-selector-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f8f8fd;
  border: 1.5px solid var(--qz-color-border, #e9e8f7);
  padding: 6px 14px;
  border-radius: 9999px;
}

.qz-period-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-period-select {
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 0;
  --padding-end: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-empty-grades-state {
  text-align: center;
  padding: 32px 16px;
  color: var(--qz-color-text-muted, #858494);
  font-size: 14px;
}

/* Acordeón de Miembros */
.qz-members-accordion-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-member-accordion {
  border: 1.5px solid var(--qz-color-border, #e9e8f7);
  border-radius: 20px !important;
  overflow: hidden;
  margin-bottom: 8px;
}

.qz-member-header-item {
  --background: #f8f8fd;
  --padding-start: 16px;
  --padding-end: 16px;
  --inner-padding-end: 0px;
}

.qz-member-avatar-chip {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e0fa;
  color: var(--qz-color-purple-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  margin-right: 10px;
}

.qz-member-name-label h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-self-pill,
.qz-individual-pill {
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.qz-self-pill {
  background: #efeefc;
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-individual-pill {
  background: #e0f2fe;
  color: #0369a1;
}

.qz-member-content-wrap {
  padding: 12px;
  background: #ffffff;
}

/* Acordeón de Áreas */
.qz-areas-accordion-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-area-accordion {
  border: 1px solid var(--qz-color-border, #e9e8f7);
  border-radius: 16px !important;
  overflow: hidden;
  margin-bottom: 6px;
}

.qz-area-header-item {
  --background: #ffffff;
  --padding-start: 14px;
  --padding-end: 14px;
}

.qz-area-title-label h4 {
  margin: 0;
  font-size: 14.5px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-area-grades-summary {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qz-area-details-body {
  padding: 12px;
  background: #fcfcff;
  border-top: 1px solid var(--qz-color-border, #e9e8f7);
}

.qz-area-loading-box,
.qz-area-idle-box {
  text-align: center;
  padding: 18px 12px;
  font-size: 13px;
  color: var(--qz-color-text-muted, #858494);
}

/* Acordeón de Dimensiones */
.qz-dimension-accordion-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-dimension-accordion {
  border: 1px solid #e9e8f7;
  border-radius: 14px !important;
  overflow: hidden;
  background: #ffffff;
}

.qz-dimension-header {
  --background: #f8f8fd;
  --padding-start: 12px;
  --padding-end: 12px;
}

.qz-dimension-content {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-dimension-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-dimension-subhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.qz-dimension-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--qz-color-text-muted, #858494);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Lista de Notas */
.qz-notes-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-note-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f8fd;
  border-radius: 12px;
  border: 1px solid #e9e8f7;
  transition: all 0.2s ease;
}

.qz-note-item.is-clickable {
  cursor: pointer;
}

.qz-note-item.is-clickable:active {
  transform: scale(0.98);
  background: #efeefc;
}

.qz-note-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.qz-note-icon {
  font-size: 16px;
  color: var(--qz-color-purple-primary, #6a5ae0);
  flex-shrink: 0;
}

.qz-note-icon.qz-icon--reinf {
  color: #0284c7;
}

.qz-note-icon.qz-icon--remedial {
  color: #d97706;
}

.qz-note-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--qz-color-text-main, #0c092a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-note-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.qz-note-arrow {
  font-size: 14px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-notes-empty {
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
  padding: 4px 8px;
  font-style: italic;
}

/* BADGES DE CALIFICACIONES (COLORES QUEEZY) */
.qz-grade-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 800;
}

.qz-grade-badge.qz-badge--sm {
  font-size: 11px;
  padding: 2px 8px;
}

.qz-grade--danger {
  background-color: #feecec;
  color: #d32f2f;
  border: 1px solid rgba(255, 86, 86, 0.3);
}

.qz-grade--warning {
  background-color: #fff6e7;
  color: #d48806;
  border: 1px solid rgba(255, 174, 51, 0.3);
}

.qz-grade--success {
  background-color: #eafbf1;
  color: #2e7d32;
  border: 1px solid rgba(83, 223, 131, 0.3);
}

.qz-grade--excellent {
  background-color: #eef2ff;
  color: #4338ca;
  border: 1px solid rgba(124, 110, 242, 0.3);
}

.qz-grade--pending {
  background-color: #f0f0f5;
  color: #858494;
}

/* Restricción de Período */
.qz-restricted-card {
  text-align: center;
  padding: 36px 20px;
}

.qz-restricted-icon-wrap {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: #feecec;
  color: #d32f2f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.qz-restricted-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-restricted-text {
  margin: 0 auto;
  max-width: 440px;
  font-size: 13.5px;
  color: var(--qz-color-text-muted, #858494);
  line-height: 1.5;
}

/* ==========================================================================
   6. BOTONES DE ACCIÓN PÍLDORA QUEEZY
   ========================================================================== */
.qz-action-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: var(--qz-radius-lg, 20px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13.5px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(12, 9, 42, 0.06);
}

.qz-action-pill-btn:active {
  transform: translateY(2px);
}

.qz-btn--primary {
  background-color: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(106, 90, 224, 0.35);
}

.qz-btn--secondary {
  background-color: #ffffff;
  color: var(--qz-color-purple-primary, #6a5ae0);
  border: 1.5px solid var(--qz-color-purple-primary, #6a5ae0);
}

/* ==========================================================================
   7. MODAL CUSTOM QUEEZY
   ========================================================================== */
.qz-custom-modal {
  --border-radius: 28px 28px 0 0;
}

.qz-modal-sheet {
  background: #ffffff;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
}

.qz-modal-header {
  text-align: center;
}

.qz-modal-title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-modal-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-modal-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--qz-color-text-muted, #858494);
  text-transform: uppercase;
}

.qz-modal-select,
.qz-modal-input {
  background: #f8f8fd;
  border: 1.5px solid var(--qz-color-border, #e9e8f7);
  border-radius: 14px;
  padding: 10px 14px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-modal-empty-groups {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff6e7;
  border: 1px solid #ffe7ba;
  border-radius: 14px;
  padding: 12px 14px;
  color: #d48806;
  font-size: 13px;
  line-height: 1.4;
}

.qz-modal-empty-groups ion-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.qz-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>
