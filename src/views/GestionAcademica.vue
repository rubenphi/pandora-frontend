<template>
  <ion-page class="ion-page qz-academic-page">
    <ion-content :fullscreen="true" class="qz-academic-content">
      <div class="qz-academic-wrapper">
        <!-- 1. CABECERA HERO QUEEZY PÚRPURA -->
        <header class="qz-hero-header">
          <div class="qz-hero-top">
            <button
              type="button"
              class="qz-back-btn"
              title="Regresar"
              @click="goBack"
            >
              <ion-icon :icon="arrowBackOutline"></ion-icon>
            </button>

            <div class="qz-hero-status-pill">
              <ion-icon
                :icon="
                  selectedTab === 'courses'
                    ? schoolOutline
                    : selectedTab === 'areas'
                    ? bookOutline
                    : calendarOutline
                "
              ></ion-icon>
              <span>
                {{ heroStatusText }}
              </span>
            </div>

            <button
              type="button"
              class="qz-action-btn"
              :title="
                selectedTab === 'courses'
                  ? 'Crear Nuevo Curso'
                  : selectedTab === 'areas'
                  ? 'Crear Nueva Área'
                  : 'Crear Nuevo Periodo'
              "
              @click="openCreateModalForCurrentTab"
            >
              <ion-icon :icon="addOutline"></ion-icon>
            </button>
          </div>

          <div class="qz-hero-titles">
            <div class="qz-hero-badge-row">
              <span class="qz-hero-tag">ADMINISTRACIÓN ACADÉMICA</span>
            </div>
            <h1 class="qz-hero-title">Gestión Académica</h1>
            <p class="qz-hero-subtitle">
              Administre cursos, áreas de conocimiento y periodos lectivos
              institucionales.
            </p>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-main-body">
          <div class="qz-academic-container">
            <!-- PESTAÑAS SEGMENT QUEEZY -->
            <div class="qz-segment-wrap">
              <div class="qz-tabs-nav">
                <button
                  type="button"
                  class="qz-tab-btn"
                  :class="{ 'is-active': selectedTab === 'courses' }"
                  @click="selectedTab = 'courses'"
                >
                  <ion-icon :icon="schoolOutline"></ion-icon>
                  <span class="qz-tab-label">Cursos</span>
                  <span class="qz-tab-count">{{ totalActiveCourses }}</span>
                </button>

                <button
                  type="button"
                  class="qz-tab-btn"
                  :class="{ 'is-active': selectedTab === 'areas' }"
                  @click="selectedTab = 'areas'"
                >
                  <ion-icon :icon="bookOutline"></ion-icon>
                  <span class="qz-tab-label">Áreas</span>
                  <span class="qz-tab-count">{{ totalAreas }}</span>
                </button>

                <button
                  type="button"
                  class="qz-tab-btn"
                  :class="{ 'is-active': selectedTab === 'periods' }"
                  @click="selectedTab = 'periods'"
                >
                  <ion-icon :icon="calendarOutline"></ion-icon>
                  <span class="qz-tab-label">Periodos</span>
                  <span class="qz-tab-count">{{ totalPeriods }}</span>
                </button>
              </div>
            </div>

            <!-- SELECTOR SUB-VISTA: ACTIVOS VS ARCHIVO / PAPELERA -->
            <div class="qz-subfilter-wrap">
              <div class="qz-subfilter-nav">
                <button
                  type="button"
                  class="qz-subfilter-btn"
                  :class="{
                    'is-active': sectionViewMode[selectedTab] === 'active',
                  }"
                  @click="setSectionViewMode('active')"
                >
                  <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                  <span class="qz-subfilter-label">Activos</span>
                  <span class="qz-subfilter-pill">
                    {{
                      selectedTab === "courses"
                        ? cursosInstituto.length
                        : selectedTab === "areas"
                        ? areas.length
                        : periods.length
                    }}
                  </span>
                </button>

                <button
                  type="button"
                  class="qz-subfilter-btn qz-subfilter-btn--archive"
                  :class="{
                    'is-active': sectionViewMode[selectedTab] === 'archived',
                  }"
                  @click="setSectionViewMode('archived')"
                >
                  <ion-icon :icon="archiveOutline"></ion-icon>
                  <span class="qz-subfilter-label">Papelera / Archivo</span>
                  <span
                    class="qz-subfilter-pill qz-subfilter-pill--muted"
                    v-if="archivedLoaded[selectedTab]"
                  >
                    {{
                      selectedTab === "courses"
                        ? archivedCourses.length
                        : selectedTab === "areas"
                        ? archivedAreas.length
                        : archivedPeriods.length
                    }}
                  </span>
                </button>
              </div>
            </div>

            <!-- SECCIÓN 1: CURSOS -->
            <div v-if="selectedTab === 'courses'" class="qz-tab-content">
              <!-- VISTA ACTIVOS -->
              <div v-if="sectionViewMode.courses === 'active'">
                <!-- Botón Rápido Crear Curso -->
                <button
                  type="button"
                  class="qz-quick-btn qz-quick-btn--primary"
                  @click="openCreateCourseModal"
                >
                  <div class="qz-quick-btn__icon">
                    <ion-icon :icon="addOutline"></ion-icon>
                  </div>
                  <div class="qz-quick-btn__text">
                    <span class="qz-quick-btn__title">Nuevo Curso</span>
                    <span class="qz-quick-btn__sub"
                      >Crear grupo académico activo</span
                    >
                  </div>
                </button>

                <!-- Cursos Activos -->
                <div class="qz-section-block">
                  <div class="qz-section-title-row">
                    <h3 class="qz-section-title">
                      Cursos Activos
                      <span
                        class="qz-count-pill"
                        v-if="cursosInstituto.length > 0"
                      >
                        {{ cursosInstituto.length }}
                      </span>
                    </h3>
                  </div>

                  <div v-if="cursosInstituto.length > 0" class="qz-items-grid">
                    <div
                      v-for="curso in cursosInstituto"
                      :key="curso.id"
                      class="qz-card qz-item-card"
                    >
                      <div class="qz-item-icon-wrap qz-icon--purple">
                        <ion-icon :icon="schoolOutline"></ion-icon>
                      </div>
                      <div class="qz-item-details">
                        <h4 class="qz-item-name">{{ curso.name }}</h4>
                        <div class="qz-item-meta">
                          <span class="qz-status-badge qz-status--active"
                            >Activo</span
                          >
                        </div>
                        <button
                          type="button"
                          class="qz-academic-pill-btn"
                          title="Gestionar materias y asignación docente del curso"
                          aria-label="Asignaturas y Docentes"
                          @click="openCourseAcademicModal(curso)"
                        >
                          <ion-icon :icon="bookOutline"></ion-icon>
                          <span>Asignaturas y Docentes</span>
                        </button>
                      </div>
                      <div class="qz-item-actions">
                        <button
                          type="button"
                          class="qz-action-btn-circle qz-btn-edit"
                          title="Editar curso"
                          aria-label="Editar curso"
                          @click="openEditCourseModal(curso)"
                        >
                          <ion-icon :icon="createOutline"></ion-icon>
                        </button>
                        <button
                          type="button"
                          class="qz-action-btn-circle qz-btn-archive"
                          title="Archivar curso"
                          aria-label="Archivar curso"
                          @click="archiveCourse(curso)"
                        >
                          <ion-icon :icon="archiveOutline"></ion-icon>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-else class="qz-empty-card">
                    <div class="qz-empty-icon-circle">
                      <ion-icon :icon="schoolOutline"></ion-icon>
                    </div>
                    <h4 class="qz-empty-title">No hay cursos activos</h4>
                    <p class="qz-empty-desc">
                      Cree un nuevo curso para comenzar a asignar estudiantes y
                      áreas.
                    </p>
                    <button
                      type="button"
                      class="qz-btn-create-empty"
                      @click="openCreateCourseModal"
                    >
                      <ion-icon :icon="addOutline"></ion-icon>
                      <span>Crear Curso</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- VISTA ARCHIVO / PAPELERA -->
              <div v-else class="qz-archive-view">
                <div class="qz-archive-banner">
                  <div class="qz-archive-banner__icon">
                    <ion-icon :icon="archiveOutline"></ion-icon>
                  </div>
                  <div class="qz-archive-banner__text">
                    <h4 class="qz-archive-banner__title">
                      Papelera / Archivo de Cursos
                    </h4>
                    <p class="qz-archive-banner__desc">
                      Los cursos archivados no se eliminan físicamente
                      (active=false) para proteger sus grupos, notas y datos de
                      años anteriores. Puede reactivarlos en cualquier momento.
                    </p>
                  </div>
                </div>

                <div v-if="isArchivedLoading.courses" class="qz-loading-state">
                  <ion-spinner name="crescent"></ion-spinner>
                  <span>Cargando cursos archivados...</span>
                </div>

                <div
                  v-else-if="archivedCourses.length > 0"
                  class="qz-items-grid"
                >
                  <div
                    v-for="curso in archivedCourses"
                    :key="curso.id"
                    class="qz-card qz-item-card qz-item-card--archived"
                  >
                    <div class="qz-item-icon-wrap qz-icon--muted">
                      <ion-icon :icon="archiveOutline"></ion-icon>
                    </div>
                    <div class="qz-item-details">
                      <h4 class="qz-item-name">{{ curso.name }}</h4>
                      <div class="qz-item-meta">
                        <span class="qz-status-badge qz-status--archived"
                          >Archivado</span
                        >
                      </div>
                    </div>
                    <div class="qz-item-actions">
                      <button
                        type="button"
                        class="qz-btn-pill-action qz-btn-pill--success"
                        title="Reactivar curso"
                        @click="reactivateCourse(curso)"
                      >
                        <ion-icon :icon="refreshOutline"></ion-icon>
                        <span>Reactivar</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div v-else class="qz-empty-card qz-empty-card--compact">
                  <div class="qz-empty-icon-circle qz-empty-icon--muted">
                    <ion-icon :icon="archiveOutline"></ion-icon>
                  </div>
                  <h4 class="qz-empty-title">Papelera vacía</h4>
                  <p class="qz-empty-desc">
                    No hay cursos archivados en la papelera.
                  </p>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 2: ÁREAS -->
            <div v-if="selectedTab === 'areas'" class="qz-tab-content">
              <!-- VISTA ACTIVOS -->
              <div v-if="sectionViewMode.areas === 'active'">
                <!-- Botón Rápido Crear Área -->
                <button
                  type="button"
                  class="qz-quick-btn qz-quick-btn--primary"
                  @click="openCreateAreaModal"
                >
                  <div class="qz-quick-btn__icon">
                    <ion-icon :icon="addOutline"></ion-icon>
                  </div>
                  <div class="qz-quick-btn__text">
                    <span class="qz-quick-btn__title">Nueva Área</span>
                    <span class="qz-quick-btn__sub"
                      >Añadir área de conocimiento activa</span
                    >
                  </div>
                </button>

                <div class="qz-section-block">
                  <div class="qz-section-title-row">
                    <h3 class="qz-section-title">
                      Áreas Activas
                      <span class="qz-count-pill" v-if="areas.length > 0">
                        {{ areas.length }}
                      </span>
                    </h3>
                  </div>

                  <div v-if="areas.length > 0" class="qz-items-grid">
                    <div
                      v-for="area in areas"
                      :key="area.id"
                      class="qz-card qz-item-card"
                    >
                      <div class="qz-item-icon-wrap qz-icon--cyan">
                        <ion-icon :icon="bookOutline"></ion-icon>
                      </div>
                      <div class="qz-item-details">
                        <h4 class="qz-item-name">{{ area.name }}</h4>
                        <div class="qz-item-meta">
                          <span class="qz-status-badge qz-status--active"
                            >Activa</span
                          >
                        </div>
                      </div>
                      <div class="qz-item-actions">
                        <button
                          type="button"
                          class="qz-action-btn-circle qz-btn-edit"
                          title="Editar área"
                          @click="openEditAreaModal(area)"
                        >
                          <ion-icon :icon="createOutline"></ion-icon>
                        </button>
                        <button
                          type="button"
                          class="qz-action-btn-circle qz-btn-archive"
                          title="Archivar área"
                          @click="archiveArea(area)"
                        >
                          <ion-icon :icon="archiveOutline"></ion-icon>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-else class="qz-empty-card">
                    <div class="qz-empty-icon-circle">
                      <ion-icon :icon="bookOutline"></ion-icon>
                    </div>
                    <h4 class="qz-empty-title">No hay áreas activas</h4>
                    <p class="qz-empty-desc">
                      Cree una nueva área académica para asignarla a los cursos
                      de la institución.
                    </p>
                    <button
                      type="button"
                      class="qz-btn-create-empty"
                      @click="openCreateAreaModal"
                    >
                      <ion-icon :icon="addOutline"></ion-icon>
                      <span>Crear Área</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- VISTA ARCHIVO / PAPELERA -->
              <div v-else class="qz-archive-view">
                <div class="qz-archive-banner">
                  <div class="qz-archive-banner__icon">
                    <ion-icon :icon="archiveOutline"></ion-icon>
                  </div>
                  <div class="qz-archive-banner__text">
                    <h4 class="qz-archive-banner__title">
                      Papelera / Archivo de Áreas
                    </h4>
                    <p class="qz-archive-banner__desc">
                      Las áreas archivadas preservan sus lecciones, actividades
                      y notas históricas (active=false) para no romper
                      relaciones del pensum. Puede reactivarlas cuando lo
                      requiera.
                    </p>
                  </div>
                </div>

                <div v-if="isArchivedLoading.areas" class="qz-loading-state">
                  <ion-spinner name="crescent"></ion-spinner>
                  <span>Cargando áreas archivadas...</span>
                </div>

                <div v-else-if="archivedAreas.length > 0" class="qz-items-grid">
                  <div
                    v-for="area in archivedAreas"
                    :key="area.id"
                    class="qz-card qz-item-card qz-item-card--archived"
                  >
                    <div class="qz-item-icon-wrap qz-icon--muted">
                      <ion-icon :icon="archiveOutline"></ion-icon>
                    </div>
                    <div class="qz-item-details">
                      <h4 class="qz-item-name">{{ area.name }}</h4>
                      <div class="qz-item-meta">
                        <span class="qz-status-badge qz-status--archived"
                          >Archivada</span
                        >
                      </div>
                    </div>
                    <div class="qz-item-actions">
                      <button
                        type="button"
                        class="qz-btn-pill-action qz-btn-pill--success"
                        title="Reactivar área"
                        @click="reactivateArea(area)"
                      >
                        <ion-icon :icon="refreshOutline"></ion-icon>
                        <span>Reactivar</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div v-else class="qz-empty-card qz-empty-card--compact">
                  <div class="qz-empty-icon-circle qz-empty-icon--muted">
                    <ion-icon :icon="archiveOutline"></ion-icon>
                  </div>
                  <h4 class="qz-empty-title">Papelera vacía</h4>
                  <p class="qz-empty-desc">
                    No hay áreas archivadas en la papelera.
                  </p>
                </div>
              </div>
            </div>

            <!-- SECCIÓN 3: PERIODOS -->
            <div v-if="selectedTab === 'periods'" class="qz-tab-content">
              <!-- VISTA ACTIVOS -->
              <div v-if="sectionViewMode.periods === 'active'">
                <!-- Botón Rápido Crear Periodo -->
                <button
                  type="button"
                  class="qz-quick-btn qz-quick-btn--primary"
                  @click="openCreatePeriodModal"
                >
                  <div class="qz-quick-btn__icon">
                    <ion-icon :icon="addOutline"></ion-icon>
                  </div>
                  <div class="qz-quick-btn__text">
                    <span class="qz-quick-btn__title">Nuevo Periodo</span>
                    <span class="qz-quick-btn__sub"
                      >Registrar lapso evaluativo activo</span
                    >
                  </div>
                </button>

                <div class="qz-section-block">
                  <div class="qz-section-title-row">
                    <h3 class="qz-section-title">
                      Periodos Activos
                      <span class="qz-count-pill" v-if="periods.length > 0">
                        {{ periods.length }}
                      </span>
                    </h3>
                  </div>

                  <div v-if="periods.length > 0" class="qz-items-grid">
                    <div
                      v-for="period in periods"
                      :key="period.id"
                      class="qz-card qz-item-card"
                    >
                      <div class="qz-item-icon-wrap qz-icon--gold">
                        <ion-icon :icon="calendarOutline"></ion-icon>
                      </div>
                      <div class="qz-item-details">
                        <h4 class="qz-item-name">{{ period.name }}</h4>
                        <div class="qz-item-meta">
                          <span class="qz-status-badge qz-status--active"
                            >Activo</span
                          >
                        </div>
                      </div>
                      <div class="qz-item-actions">
                        <button
                          type="button"
                          class="qz-action-btn-circle qz-btn-edit"
                          title="Editar periodo"
                          @click="openEditPeriodModal(period)"
                        >
                          <ion-icon :icon="createOutline"></ion-icon>
                        </button>
                        <button
                          type="button"
                          class="qz-action-btn-circle qz-btn-archive"
                          title="Archivar periodo"
                          @click="archivePeriod(period)"
                        >
                          <ion-icon :icon="archiveOutline"></ion-icon>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-else class="qz-empty-card">
                    <div class="qz-empty-icon-circle">
                      <ion-icon :icon="calendarOutline"></ion-icon>
                    </div>
                    <h4 class="qz-empty-title">No hay periodos activos</h4>
                    <p class="qz-empty-desc">
                      Cree los periodos lectivos (ej. 1º Periodo, 2º Periodo)
                      para la calificación académica.
                    </p>
                    <button
                      type="button"
                      class="qz-btn-create-empty"
                      @click="openCreatePeriodModal"
                    >
                      <ion-icon :icon="addOutline"></ion-icon>
                      <span>Crear Periodo</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- VISTA ARCHIVO / PAPELERA -->
              <div v-else class="qz-archive-view">
                <div class="qz-archive-banner">
                  <div class="qz-archive-banner__icon">
                    <ion-icon :icon="archiveOutline"></ion-icon>
                  </div>
                  <div class="qz-archive-banner__text">
                    <h4 class="qz-archive-banner__title">
                      Papelera / Archivo de Periodos
                    </h4>
                    <p class="qz-archive-banner__desc">
                      Los periodos archivados protegen las calificaciones y
                      reportes históricos de los estudiantes (active=false).
                      Puede reactivarlos cuando sea necesario.
                    </p>
                  </div>
                </div>

                <div v-if="isArchivedLoading.periods" class="qz-loading-state">
                  <ion-spinner name="crescent"></ion-spinner>
                  <span>Cargando periodos archivados...</span>
                </div>

                <div
                  v-else-if="archivedPeriods.length > 0"
                  class="qz-items-grid"
                >
                  <div
                    v-for="period in archivedPeriods"
                    :key="period.id"
                    class="qz-card qz-item-card qz-item-card--archived"
                  >
                    <div class="qz-item-icon-wrap qz-icon--muted">
                      <ion-icon :icon="archiveOutline"></ion-icon>
                    </div>
                    <div class="qz-item-details">
                      <h4 class="qz-item-name">{{ period.name }}</h4>
                      <div class="qz-item-meta">
                        <span class="qz-status-badge qz-status--archived"
                          >Archivado</span
                        >
                      </div>
                    </div>
                    <div class="qz-item-actions">
                      <button
                        type="button"
                        class="qz-btn-pill-action qz-btn-pill--success"
                        title="Reactivar periodo"
                        @click="reactivatePeriod(period)"
                      >
                        <ion-icon :icon="refreshOutline"></ion-icon>
                        <span>Reactivar</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div v-else class="qz-empty-card qz-empty-card--compact">
                  <div class="qz-empty-icon-circle qz-empty-icon--muted">
                    <ion-icon :icon="archiveOutline"></ion-icon>
                  </div>
                  <h4 class="qz-empty-title">Papelera vacía</h4>
                  <p class="qz-empty-desc">
                    No hay periodos archivados en la papelera.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ion-content>

    <!-- MODAL 1: CREAR CURSO -->
    <ion-modal
      :is-open="isCreateCourseModalOpen"
      @did-dismiss="closeCreateCourseModal"
      class="qz-session-modal"
    >
      <div class="qz-modal-content">
        <div class="qz-modal-header">
          <div class="qz-modal-badge">NUEVO CURSO</div>
          <h3 class="qz-modal-title">Crear Nuevo Curso</h3>
          <button
            type="button"
            class="qz-modal-close-btn"
            @click="closeCreateCourseModal"
            aria-label="Cerrar"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>
        <div class="qz-modal-body">
          <div class="qz-input-group">
            <label class="qz-input-label">Nombre del Curso</label>
            <input
              type="text"
              v-model="newCourse.name"
              placeholder="Ej: 1º Bachillerato A"
              class="qz-form-input"
              @keyup.enter="createCourse"
            />
          </div>
          <div class="qz-toggle-group">
            <label class="qz-input-label">Estado</label>
            <div class="qz-toggle-row">
              <span class="qz-toggle-text">Curso Activo</span>
              <ion-toggle
                v-model="newCourse.exist"
                class="qz-toggle"
              ></ion-toggle>
            </div>
          </div>
          <button
            type="button"
            class="qz-modal-submit-btn"
            @click="createCourse"
            :disabled="!newCourse.name"
          >
            <ion-icon :icon="checkmarkOutline"></ion-icon>
            <span>Crear Curso</span>
          </button>
        </div>
      </div>
    </ion-modal>

    <!-- MODAL 2: EDITAR CURSO -->
    <ion-modal
      :is-open="isEditCourseModalOpen"
      @did-dismiss="closeEditCourseModal"
      class="qz-session-modal qz-modal-large"
    >
      <div class="qz-modal-content">
        <div class="qz-modal-header">
          <div class="qz-modal-badge">EDITAR CURSO</div>
          <h3 class="qz-modal-title">Editar Curso</h3>
          <button
            type="button"
            class="qz-modal-close-btn"
            @click="closeEditCourseModal"
            aria-label="Cerrar"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>
        <div class="qz-modal-body">
          <div class="qz-input-group">
            <label class="qz-input-label">Nombre del Curso</label>
            <input
              type="text"
              v-model="editedCourse.name"
              placeholder="Nombre del curso"
              class="qz-form-input"
              @keyup.enter="editCourse"
            />
          </div>
          <div class="qz-toggle-group">
            <label class="qz-input-label">Estado</label>
            <div class="qz-toggle-row">
              <span class="qz-toggle-text">Curso Activo</span>
              <ion-toggle
                v-model="editedCourse.exist"
                class="qz-toggle"
              ></ion-toggle>
            </div>
          </div>
          <div class="qz-areas-selection-group">
            <div class="qz-group-label-row">
              <label class="qz-input-label">Áreas Asignadas al Curso</label>
              <span class="qz-count-badge"
                >{{ editedCourseAreas.length }} seleccionadas</span
              >
            </div>
            <div v-if="allAreas.length > 0" class="qz-areas-checklist">
              <div
                v-for="area in allAreas"
                :key="area.id"
                class="qz-area-check-row"
                :class="{ 'is-selected': editedCourseAreas.includes(area.id) }"
                @click="
                  toggleAreaInCourse(
                    area.id,
                    !editedCourseAreas.includes(area.id),
                  )
                "
              >
                <div class="qz-check-icon">
                  <ion-icon
                    :icon="
                      editedCourseAreas.includes(area.id)
                        ? checkmarkCircle
                        : ellipseOutline
                    "
                  ></ion-icon>
                </div>
                <span class="qz-check-label">{{ area.name }}</span>
              </div>
            </div>
            <div v-else class="qz-empty-notice">
              No hay áreas registradas aún. Cree áreas en la pestaña de Áreas
              para poder asignarlas a este curso.
            </div>
          </div>
          <button
            type="button"
            class="qz-modal-submit-btn"
            @click="editCourse"
            :disabled="!editedCourse.name"
          >
            <ion-icon :icon="checkmarkOutline"></ion-icon>
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>
    </ion-modal>

    <!-- MODAL 3: CREAR ÁREA -->
    <ion-modal
      :is-open="isCreateAreaModalOpen"
      @did-dismiss="closeCreateAreaModal"
      class="qz-session-modal"
    >
      <div class="qz-modal-content">
        <div class="qz-modal-header">
          <div class="qz-modal-badge">NUEVA ÁREA</div>
          <h3 class="qz-modal-title">Crear Nueva Área</h3>
          <button
            type="button"
            class="qz-modal-close-btn"
            @click="closeCreateAreaModal"
            aria-label="Cerrar"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>
        <div class="qz-modal-body">
          <div class="qz-input-group">
            <label class="qz-input-label">Nombre del Área</label>
            <input
              type="text"
              v-model="newArea.name"
              placeholder="Ej: Matemáticas, Lenguaje, etc."
              class="qz-form-input"
              @keyup.enter="createArea"
            />
          </div>
          <button
            type="button"
            class="qz-modal-submit-btn"
            @click="createArea"
            :disabled="!newArea.name"
          >
            <ion-icon :icon="checkmarkOutline"></ion-icon>
            <span>Crear Área</span>
          </button>
        </div>
      </div>
    </ion-modal>

    <!-- MODAL 4: EDITAR ÁREA -->
    <ion-modal
      :is-open="isEditAreaModalOpen"
      @did-dismiss="closeEditAreaModal"
      class="qz-session-modal"
    >
      <div class="qz-modal-content">
        <div class="qz-modal-header">
          <div class="qz-modal-badge">EDITAR ÁREA</div>
          <h3 class="qz-modal-title">Editar Área</h3>
          <button
            type="button"
            class="qz-modal-close-btn"
            @click="closeEditAreaModal"
            aria-label="Cerrar"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>
        <div class="qz-modal-body">
          <div class="qz-input-group">
            <label class="qz-input-label">Nombre del Área</label>
            <input
              type="text"
              v-model="editedArea.name"
              placeholder="Nombre del área"
              class="qz-form-input"
              @keyup.enter="editArea"
            />
          </div>
          <button
            type="button"
            class="qz-modal-submit-btn"
            @click="editArea"
            :disabled="!editedArea.name"
          >
            <ion-icon :icon="checkmarkOutline"></ion-icon>
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>
    </ion-modal>

    <!-- MODAL 5: CREAR PERIODO -->
    <ion-modal
      :is-open="isCreatePeriodModalOpen"
      @did-dismiss="closeCreatePeriodModal"
      class="qz-session-modal"
    >
      <div class="qz-modal-content">
        <div class="qz-modal-header">
          <div class="qz-modal-badge">NUEVO PERIODO</div>
          <h3 class="qz-modal-title">Crear Nuevo Periodo</h3>
          <button
            type="button"
            class="qz-modal-close-btn"
            @click="closeCreatePeriodModal"
            aria-label="Cerrar"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>
        <div class="qz-modal-body">
          <div class="qz-input-group">
            <label class="qz-input-label">Nombre del Periodo</label>
            <input
              type="text"
              v-model="newPeriod.name"
              placeholder="Ej: 1º Trimestre, Periodo 1, etc."
              class="qz-form-input"
              @keyup.enter="createPeriod"
            />
          </div>
          <button
            type="button"
            class="qz-modal-submit-btn"
            @click="createPeriod"
            :disabled="!newPeriod.name"
          >
            <ion-icon :icon="checkmarkOutline"></ion-icon>
            <span>Crear Periodo</span>
          </button>
        </div>
      </div>
    </ion-modal>

    <!-- MODAL 6: EDITAR PERIODO -->
    <ion-modal
      :is-open="isEditPeriodModalOpen"
      @did-dismiss="closeEditPeriodModal"
      class="qz-session-modal"
    >
      <div class="qz-modal-content">
        <div class="qz-modal-header">
          <div class="qz-modal-badge">EDITAR PERIODO</div>
          <h3 class="qz-modal-title">Editar Periodo</h3>
          <button
            type="button"
            class="qz-modal-close-btn"
            @click="closeEditPeriodModal"
            aria-label="Cerrar"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>
        <div class="qz-modal-body">
          <div class="qz-input-group">
            <label class="qz-input-label">Nombre del Periodo</label>
            <input
              type="text"
              v-model="editedPeriod.name"
              placeholder="Nombre del periodo"
              class="qz-form-input"
              @keyup.enter="editPeriod"
            />
          </div>
          <button
            type="button"
            class="qz-modal-submit-btn"
            @click="editPeriod"
            :disabled="!editedPeriod.name"
          >
            <ion-icon :icon="checkmarkOutline"></ion-icon>
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>
    </ion-modal>

    <!-- MODAL DE ASIGNACIÓN ACADÉMICA (ÁREAS Y DOCENTES DEL CURSO) -->
    <ion-modal
      :is-open="isAcademicModalOpen"
      @did-dismiss="closeCourseAcademicModal"
      class="qz-session-modal qz-academic-modal"
    >
      <div
        class="qz-modal-content qz-academic-modal-content"
        v-if="selectedCourseForAcademic"
      >
        <div class="qz-modal-header">
          <div>
            <div class="qz-modal-badge">ASIGNATURAS Y DOCENTES</div>
            <h3 class="qz-modal-title">
              Asignación Académica: {{ selectedCourseForAcademic.name }}
            </h3>
          </div>
          <button
            type="button"
            class="qz-modal-close-btn"
            @click="closeCourseAcademicModal"
            aria-label="Cerrar"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>

        <div class="qz-modal-body">
          <!-- Barra de Control: Año Lectivo y Botón de Vincular Asignatura -->
          <div class="qz-academic-bar-row">
            <div class="qz-academic-year-wrap">
              <label class="qz-academic-year-label">Año Lectivo:</label>
              <div class="qz-select-pill">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <select
                  v-model="academicYear"
                  class="qz-year-native-select"
                  @change="onAcademicYearChange"
                >
                  <option v-for="y in academicYears" :key="y" :value="y">
                    {{ y }}
                  </option>
                </select>
              </div>
            </div>

            <button
              type="button"
              class="qz-btn-add-course-area"
              @click="openAddAreaPicker"
            >
              <ion-icon :icon="addOutline"></ion-icon>
              <span>Vincular Asignatura</span>
            </button>
          </div>

          <!-- Estado de Carga -->
          <div v-if="loadingAcademicData" class="qz-loading-state">
            <ion-spinner name="crescent"></ion-spinner>
            <span>Cargando asignaturas y docentes...</span>
          </div>

          <!-- Si no tiene áreas -->
          <div
            v-else-if="courseAreasList.length === 0"
            class="qz-empty-card qz-empty--academic"
          >
            <div class="qz-empty-icon-circle">
              <ion-icon :icon="bookOutline"></ion-icon>
            </div>
            <h4 class="qz-empty-title">Sin asignaturas</h4>
            <p class="qz-empty-desc">
              Este curso aún no tiene materias vinculadas. Vincule las
              asignaturas institucionales para poder asignar a los docentes
              encargados en {{ academicYear }}.
            </p>
            <button
              type="button"
              class="qz-btn-create-empty"
              @click="openAddAreaPicker"
            >
              <ion-icon :icon="addOutline"></ion-icon>
              <span>Vincular Primera Asignatura</span>
            </button>
          </div>

          <!-- Grid de Áreas y Docentes -->
          <div v-else class="qz-academic-grid">
            <div
              v-for="area in courseAreasList"
              :key="area.id"
              class="qz-academic-card"
            >
              <div class="qz-academic-card-top">
                <div class="qz-area-squircle-icon">
                  <ion-icon :icon="bookOutline"></ion-icon>
                </div>
                <div class="qz-academic-card-title-col">
                  <h4 class="qz-academic-area-title">{{ area.name }}</h4>
                  <div
                    class="qz-academic-teacher-badge"
                    :class="
                      getAssignedTeacher(area.id)
                        ? 'qz-teacher--assigned'
                        : 'qz-teacher--none'
                    "
                  >
                    <ion-icon
                      :icon="
                        getAssignedTeacher(area.id)
                          ? checkmarkCircle
                          : alertCircleOutline
                      "
                    ></ion-icon>
                    <span>
                      {{
                        getAssignedTeacher(area.id)
                          ? "Docente: " +
                            getAssignedTeacher(area.id).lastName +
                            " " +
                            getAssignedTeacher(area.id).name
                          : "Sin docente en " + academicYear
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="qz-academic-card-actions">
                <button
                  type="button"
                  class="qz-btn-assign-action"
                  @click="openTeacherPickerForArea(area)"
                >
                  <ion-icon :icon="createOutline"></ion-icon>
                  <span>{{
                    getAssignedTeacher(area.id)
                      ? "Cambiar Docente"
                      : "Asignar Docente"
                  }}</span>
                </button>

                <button
                  type="button"
                  class="qz-btn-unlink-area"
                  title="Desvincular del curso"
                  @click="confirmRemoveAreaFromCourse(area)"
                >
                  <ion-icon :icon="closeOutline"></ion-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-modal>
  </ion-page>
</template>

<script setup>
import axios from "axios";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  tokenHeader,
  usuarioGet,
  sortPeriods,
  currentServerDate,
} from "../globalService";
import {
  IonPage,
  IonContent,
  IonIcon,
  IonModal,
  IonToggle,
  IonSpinner,
  alertController,
} from "@ionic/vue";
import {
  createOutline,
  arrowBackOutline,
  addOutline,
  closeOutline,
  checkmarkOutline,
  schoolOutline,
  bookOutline,
  calendarOutline,
  archiveOutline,
  refreshOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  ellipseOutline,
  alertCircleOutline,
} from "ionicons/icons";

const router = useRouter();

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push("/inicio");
  }
};

const usuario = ref(null);
const selectedTab = ref("courses");

// --- Modos de Vista y Carga Perezosa de Archivo/Papelera ---
const sectionViewMode = ref({
  courses: "active",
  areas: "active",
  periods: "active",
});

const archivedLoaded = ref({
  courses: false,
  areas: false,
  periods: false,
});

const isArchivedLoading = ref({
  courses: false,
  areas: false,
  periods: false,
});

const setSectionViewMode = async (mode) => {
  sectionViewMode.value[selectedTab.value] = mode;
  if (mode === "archived" && !archivedLoaded.value[selectedTab.value]) {
    await fetchArchivedCurrentTab();
  }
};

const fetchArchivedCurrentTab = async () => {
  const tab = selectedTab.value;
  if (tab === "courses") {
    await fetchArchivedCourses();
  } else if (tab === "areas") {
    await fetchArchivedAreas();
  } else if (tab === "periods") {
    await fetchArchivedPeriods();
  }
};

// --- Contadores y Título Computados ---
const totalActiveCourses = computed(() => cursosInstituto.value.length);
const totalAreas = computed(() => areas.value.length);
const totalPeriods = computed(() => periods.value.length);

const heroStatusText = computed(() => {
  const isArchived = sectionViewMode.value[selectedTab.value] === "archived";
  if (selectedTab.value === "courses") {
    return isArchived
      ? `${archivedCourses.value.length} Cursos en Papelera`
      : `${totalActiveCourses.value} Cursos Activos`;
  }
  if (selectedTab.value === "areas") {
    return isArchived
      ? `${archivedAreas.value.length} Áreas en Papelera`
      : `${totalAreas.value} Áreas Activas`;
  }
  return isArchived
    ? `${archivedPeriods.value.length} Periodos en Papelera`
    : `${totalPeriods.value} Periodos Activos`;
});

const openCreateModalForCurrentTab = () => {
  if (selectedTab.value === "courses") {
    openCreateCourseModal();
  } else if (selectedTab.value === "areas") {
    openCreateAreaModal();
  } else if (selectedTab.value === "periods") {
    openCreatePeriodModal();
  }
};

// --- Course Management ---
const cursosInstituto = ref([]);
const isCreateCourseModalOpen = ref(false);
const newCourse = ref({ name: "", instituteId: null, exist: true });
const isEditCourseModalOpen = ref(false);
const editedCourse = ref({
  id: null,
  name: "",
  instituteId: null,
  exist: true,
});
const allAreas = ref([]);
const editedCourseAreas = ref([]);
const archivedCourses = ref([]);

const fetchCourses = async () => {
  try {
    const response = await axios.get(
      `/courses?instituteId=${usuario.value.institute.id}&exist=true`,
      tokenHeader(),
    );
    cursosInstituto.value = response.data.sort(
      (a, b) => parseInt(a.name) - parseInt(b.name),
    );
  } catch (error) {
    console.error("Error fetching courses:", error);
  }
};

const fetchArchivedCourses = async () => {
  try {
    isArchivedLoading.value.courses = true;
    const response = await axios.get(
      `/courses?instituteId=${usuario.value.institute.id}&exist=false`,
      tokenHeader(),
    );
    archivedCourses.value = response.data.sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    archivedLoaded.value.courses = true;
  } catch (error) {
    console.error("Error fetching archived courses:", error);
  } finally {
    isArchivedLoading.value.courses = false;
  }
};

const openCreateCourseModal = () => {
  newCourse.value = {
    name: "",
    instituteId: usuario.value.institute.id,
    exist: true,
  };
  isCreateCourseModalOpen.value = true;
};

const closeCreateCourseModal = () => {
  isCreateCourseModalOpen.value = false;
};

const createCourse = async () => {
  if (!newCourse.value.name) {
    const alert = await alertController.create({
      header: "Error",
      message: "El nombre del curso no puede estar vacío.",
      buttons: ["OK"],
    });
    await alert.present();
    return;
  }
  try {
    await axios.post("/courses", newCourse.value, tokenHeader());
    closeCreateCourseModal();
    sectionViewMode.value.courses = "active";
    await fetchCourses();
    const alert = await alertController.create({
      header: "Éxito",
      message: "Curso creado exitosamente.",
      buttons: ["OK"],
    });
    await alert.present();
  } catch (error) {
    console.error("Error creating course:", error);
    const alert = await alertController.create({
      header: "Error",
      message: "Hubo un error al crear el curso.",
      buttons: ["OK"],
    });
    await alert.present();
  }
};

const openEditCourseModal = async (course) => {
  editedCourse.value = { ...course };
  try {
    const response = await axios.get(
      `/courses/${course.id}/areas`,
      tokenHeader(),
    );
    editedCourseAreas.value = response.data.map((area) => area.id);
  } catch (error) {
    console.error("Error fetching course areas:", error);
    editedCourseAreas.value = [];
  }
  isEditCourseModalOpen.value = true;
};

const closeEditCourseModal = () => {
  isEditCourseModalOpen.value = false;
  editedCourseAreas.value = [];
};

const toggleAreaInCourse = (areaId, isChecked) => {
  if (isChecked) {
    if (!editedCourseAreas.value.includes(areaId)) {
      editedCourseAreas.value.push(areaId);
    }
  } else {
    editedCourseAreas.value = editedCourseAreas.value.filter(
      (id) => id !== areaId,
    );
  }
};

const editCourse = async () => {
  if (!editedCourse.value.name) {
    const alert = await alertController.create({
      header: "Error",
      message: "El nombre del curso no puede estar vacío.",
      buttons: ["OK"],
    });
    await alert.present();
    return;
  }
  try {
    const payload = {
      name: editedCourse.value.name,
      instituteId: editedCourse.value.institute.id,
      exist: editedCourse.value.exist,
    };
    await axios.patch(
      `/courses/${editedCourse.value.id}`,
      payload,
      tokenHeader(),
    );
    const currentAreasResponse = await axios.get(
      `/courses/${editedCourse.value.id}/areas`,
      tokenHeader(),
    );
    const currentAreaIds = currentAreasResponse.data.map((area) => area.id);
    const areasToAdd = editedCourseAreas.value.filter(
      (id) => !currentAreaIds.includes(id),
    );
    const areasToRemove = currentAreaIds.filter(
      (id) => !editedCourseAreas.value.includes(id),
    );
    if (areasToAdd.length > 0) {
      const addPayload = areasToAdd.map((areaId) => ({
        areaId,
        start_date: currentServerDate().toISOString().split("T")[0],
      }));
      await axios.post(
        `/courses/${editedCourse.value.id}/areas`,
        addPayload,
        tokenHeader(),
      );
    }
    if (areasToRemove.length > 0) {
      await axios.delete(`/courses/${editedCourse.value.id}/areas`, {
        data: areasToRemove,
        ...tokenHeader(),
      });
    }
    closeEditCourseModal();
    await fetchCourses();
    const alert = await alertController.create({
      header: "Éxito",
      message: "Curso actualizado exitosamente.",
      buttons: ["OK"],
    });
    await alert.present();
  } catch (error) {
    console.error("Error updating course:", error);
    const alert = await alertController.create({
      header: "Error",
      message: "Hubo un error al actualizar el curso.",
      buttons: ["OK"],
    });
    await alert.present();
  }
};

// --- Asignación Académica (Áreas y Docentes de Cursos) ---
const isAcademicModalOpen = ref(false);
const selectedCourseForAcademic = ref(null);
const currentYearVal = new Date().getFullYear();
const academicYear = ref(currentYearVal);
const academicYears = ref(
  Array.from({ length: 6 }, (_, i) => currentYearVal - i + 1),
);
const courseAreasList = ref([]);
const courseTeacherAssignments = ref([]);
const allTeachersList = ref([]);
const loadingAcademicData = ref(false);

const openCourseAcademicModal = async (curso) => {
  selectedCourseForAcademic.value = curso;
  isAcademicModalOpen.value = true;
  await loadAcademicDataForCourse();
};

const closeCourseAcademicModal = () => {
  isAcademicModalOpen.value = false;
  selectedCourseForAcademic.value = null;
  courseAreasList.value = [];
  courseTeacherAssignments.value = [];
};

const onAcademicYearChange = async () => {
  await loadAcademicDataForCourse();
};

const loadAcademicDataForCourse = async () => {
  if (!selectedCourseForAcademic.value) return;
  loadingAcademicData.value = true;
  const courseId = selectedCourseForAcademic.value.id;
  try {
    const [areasRes, teachersRes, allTeachersRes] = await Promise.all([
      axios.get(`/courses/${courseId}/areas?active=true`, tokenHeader()),
      axios.get(
        `/courses/${courseId}/areas-teachers?year=${academicYear.value}`,
        tokenHeader(),
      ),
      allTeachersList.value.length === 0
        ? axios.get(
            `/users?instituteId=${usuario.value.institute.id}&rol=teacher,admin`,
            tokenHeader(),
          )
        : Promise.resolve({ data: allTeachersList.value }),
    ]);

    courseAreasList.value = areasRes.data || [];
    courseTeacherAssignments.value = teachersRes.data || [];
    allTeachersList.value = (allTeachersRes.data || []).sort((a, b) =>
      (a.lastName || "").localeCompare(b.lastName || ""),
    );
  } catch (err) {
    console.error("Error al cargar datos académicos del curso:", err);
  } finally {
    loadingAcademicData.value = false;
  }
};

const getAssignedTeacher = (areaId) => {
  const item = courseTeacherAssignments.value.find(
    (a) => a.area?.id === areaId && a.active !== false,
  );
  return item ? item.teacher : null;
};

const openAddAreaPicker = async () => {
  const existingAreaIds = new Set(courseAreasList.value.map((a) => a.id));
  const availableAreas = areas.value.filter((a) => !existingAreaIds.has(a.id));

  if (availableAreas.length === 0) {
    const alert = await alertController.create({
      header: "Sin Asignaturas Pendientes",
      message:
        "Todas las asignaturas activas del instituto ya están vinculadas a este curso.",
      buttons: ["Entendido"],
    });
    await alert.present();
    return;
  }

  const inputs = availableAreas.map((area) => ({
    type: "checkbox",
    label: area.name,
    value: area.id,
  }));

  const alert = await alertController.create({
    header: "Vincular Asignaturas",
    subHeader: `Curso ${selectedCourseForAcademic.value?.name}`,
    message: "Seleccione las materias que desea agregar",
    inputs,
    buttons: [
      { text: "Cancelar", role: "cancel" },
      {
        text: "Vincular",
        handler: async (selectedAreaIds) => {
          if (!selectedAreaIds || selectedAreaIds.length === 0) return;
          try {
            const addPayload = selectedAreaIds.map((id) => ({
              areaId: id,
              start_date: currentServerDate().toISOString().split("T")[0],
            }));
            await axios.post(
              `/courses/${selectedCourseForAcademic.value.id}/areas`,
              addPayload,
              tokenHeader(),
            );
            await loadAcademicDataForCourse();
          } catch (err) {
            console.error("Error al vincular áreas al curso:", err);
          }
        },
      },
    ],
  });
  await alert.present();
};

const openTeacherPickerForArea = async (area) => {
  const currentTeacher = getAssignedTeacher(area.id);

  const inputs = allTeachersList.value.map((t) => ({
    type: "radio",
    label: `${t.lastName} ${t.name}`,
    value: t.id,
    checked: currentTeacher && currentTeacher.id === t.id,
  }));

  inputs.unshift({
    type: "radio",
    label: "Sin Docente Asignado",
    value: null,
    checked: !currentTeacher,
  });

  const alert = await alertController.create({
    header: `Docente de ${area.name}`,
    subHeader: `Curso ${selectedCourseForAcademic.value?.name} · Año ${academicYear.value}`,
    inputs,
    buttons: [
      { text: "Cancelar", role: "cancel" },
      {
        text: "Guardar",
        handler: async (teacherId) => {
          try {
            await axios.post(
              `/courses/${selectedCourseForAcademic.value.id}/areas-teachers`,
              {
                areaId: area.id,
                teacherId,
                year: parseInt(academicYear.value, 10),
                active: true,
              },
              tokenHeader(),
            );
            await loadAcademicDataForCourse();
          } catch (err) {
            console.error("Error al asignar docente a área:", err);
          }
        },
      },
    ],
  });
  await alert.present();
};

const confirmRemoveAreaFromCourse = async (area) => {
  const alert = await alertController.create({
    header: "Desvincular Asignatura",
    message: `¿Desea retirar "${area.name}" del curso ${selectedCourseForAcademic.value?.name}? La asignatura seguirá existiendo en el instituto.`,
    buttons: [
      { text: "Cancelar", role: "cancel" },
      {
        text: "Desvincular",
        role: "destructive",
        handler: async () => {
          try {
            await axios.delete(
              `/courses/${selectedCourseForAcademic.value.id}/areas`,
              {
                data: [area.id],
                ...tokenHeader(),
              },
            );
            await loadAcademicDataForCourse();
          } catch (err) {
            console.error("Error al desvincular área del curso:", err);
          }
        },
      },
    ],
  });
  await alert.present();
};

const archiveCourse = async (course) => {
  const alert = await alertController.create({
    header: "Confirmar Archivación",
    message: `¿Estás seguro de que quieres archivar el curso "${course.name}"? Los datos no se eliminarán pero dejarán de aparecer en las listas activas.`,
    buttons: [
      { text: "Cancelar", role: "cancel" },
      {
        text: "Archivar",
        handler: async () => {
          try {
            await axios.patch(
              `/courses/${course.id}`,
              { exist: false },
              tokenHeader(),
            );
            cursosInstituto.value = cursosInstituto.value.filter(
              (c) => c.id !== course.id,
            );
            if (archivedLoaded.value.courses) {
              await fetchArchivedCourses();
            }
            const successAlert = await alertController.create({
              header: "Éxito",
              message: `El curso "${course.name}" ha sido enviado al archivo/papelera.`,
              buttons: ["OK"],
            });
            await successAlert.present();
          } catch (error) {
            console.error("Error archiving course:", error);
            const errorAlert = await alertController.create({
              header: "Error",
              message: "Hubo un error al archivar el curso.",
              buttons: ["OK"],
            });
            await errorAlert.present();
          }
        },
      },
    ],
  });
  await alert.present();
};

const reactivateCourse = async (course) => {
  const alert = await alertController.create({
    header: "Confirmar Reactivación",
    message: `¿Estás seguro de que quieres reactivar el curso "${course.name}"? Volverá a estar visible en la lista de cursos activos.`,
    buttons: [
      { text: "Cancelar", role: "cancel" },
      {
        text: "Reactivar",
        handler: async () => {
          try {
            await axios.patch(
              `/courses/${course.id}`,
              { exist: true },
              tokenHeader(),
            );
            archivedCourses.value = archivedCourses.value.filter(
              (c) => c.id !== course.id,
            );
            await fetchCourses();
            const successAlert = await alertController.create({
              header: "Éxito",
              message: `El curso "${course.name}" ha sido reactivado exitosamente.`,
              buttons: ["OK"],
            });
            await successAlert.present();
          } catch (error) {
            console.error("Error reactivating course:", error);
            const errorAlert = await alertController.create({
              header: "Error",
              message: "Hubo un error al reactivar el curso.",
              buttons: ["OK"],
            });
            await errorAlert.present();
          }
        },
      },
    ],
  });
  await alert.present();
};

// --- Area Management ---
const areas = ref([]);
const isCreateAreaModalOpen = ref(false);
const newArea = ref({ name: "" });
const isEditAreaModalOpen = ref(false);
const editedArea = ref({ id: null, name: "" });
const archivedAreas = ref([]);

const fetchAreas = async () => {
  try {
    const response = await axios.get(
      `/areas?instituteId=${usuario.value.institute.id}&exist=true`,
      tokenHeader(),
    );
    areas.value = response.data.sort((a, b) => a.name.localeCompare(b.name));
    allAreas.value = areas.value;
  } catch (error) {
    console.error("Error fetching areas:", error);
  }
};

const fetchArchivedAreas = async () => {
  try {
    isArchivedLoading.value.areas = true;
    const response = await axios.get(
      `/areas?instituteId=${usuario.value.institute.id}&exist=false`,
      tokenHeader(),
    );
    archivedAreas.value = response.data.sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    archivedLoaded.value.areas = true;
  } catch (error) {
    console.error("Error fetching archived areas:", error);
  } finally {
    isArchivedLoading.value.areas = false;
  }
};

const openCreateAreaModal = () => {
  newArea.value = {
    name: "",
    instituteId: usuario.value.institute.id,
    exist: true,
  };
  isCreateAreaModalOpen.value = true;
};

const closeCreateAreaModal = () => {
  isCreateAreaModalOpen.value = false;
};

const createArea = async () => {
  if (!newArea.value.name) {
    const alert = await alertController.create({
      header: "Error",
      message: "El nombre del área no puede estar vacío.",
      buttons: ["OK"],
    });
    await alert.present();
    return;
  }
  try {
    await axios.post("/areas", newArea.value, tokenHeader());
    closeCreateAreaModal();
    sectionViewMode.value.areas = "active";
    await fetchAreas();
    const alert = await alertController.create({
      header: "Éxito",
      message: "Área creada exitosamente.",
      buttons: ["OK"],
    });
    await alert.present();
  } catch (error) {
    console.error("Error creating area:", error);
    const alert = await alertController.create({
      header: "Error",
      message: "Hubo un error al crear el área.",
      buttons: ["OK"],
    });
    await alert.present();
  }
};

const openEditAreaModal = (area) => {
  editedArea.value = { ...area };
  isEditAreaModalOpen.value = true;
};

const closeEditAreaModal = () => {
  isEditAreaModalOpen.value = false;
};

const editArea = async () => {
  if (!editedArea.value.name) {
    const alert = await alertController.create({
      header: "Error",
      message: "El nombre del área no puede estar vacío.",
      buttons: ["OK"],
    });
    await alert.present();
    return;
  }
  try {
    await axios.patch(
      `/areas/${editedArea.value.id}`,
      {
        name: editedArea.value.name,
        instituteId: editedArea.value.institute.id,
      },
      tokenHeader(),
    );
    closeEditAreaModal();
    await fetchAreas();
    const alert = await alertController.create({
      header: "Éxito",
      message: "Área actualizada exitosamente.",
      buttons: ["OK"],
    });
    await alert.present();
  } catch (error) {
    console.error("Error updating area:", error);
    const alert = await alertController.create({
      header: "Error",
      message: "Hubo un error al actualizar el área.",
      buttons: ["OK"],
    });
    await alert.present();
  }
};

const archiveArea = async (area) => {
  const alert = await alertController.create({
    header: "Confirmar Archivación",
    message: `¿Estás seguro de que quieres archivar el área "${area.name}"? Los datos no se eliminarán pero dejarán de aparecer en las listas activas.`,
    buttons: [
      { text: "Cancelar", role: "cancel" },
      {
        text: "Archivar",
        handler: async () => {
          try {
            await axios.patch(
              `/areas/${area.id}`,
              {
                name: area.name,
                instituteId: usuario.value.institute.id,
                exist: false,
              },
              tokenHeader(),
            );
            areas.value = areas.value.filter((a) => a.id !== area.id);
            allAreas.value = areas.value;
            if (archivedLoaded.value.areas) {
              await fetchArchivedAreas();
            }
            const successAlert = await alertController.create({
              header: "Éxito",
              message: `El área "${area.name}" ha sido enviada al archivo/papelera.`,
              buttons: ["OK"],
            });
            await successAlert.present();
          } catch (error) {
            console.error("Error archiving area:", error);
            const errorAlert = await alertController.create({
              header: "Error",
              message: "Hubo un error al archivar el área.",
              buttons: ["OK"],
            });
            await errorAlert.present();
          }
        },
      },
    ],
  });
  await alert.present();
};

const reactivateArea = async (area) => {
  const alert = await alertController.create({
    header: "Confirmar Reactivación",
    message: `¿Estás seguro de que quieres reactivar el área "${area.name}"? Volverá a estar disponible para asignaciones y cursos activos.`,
    buttons: [
      { text: "Cancelar", role: "cancel" },
      {
        text: "Reactivar",
        handler: async () => {
          try {
            await axios.patch(
              `/areas/${area.id}`,
              {
                name: area.name,
                instituteId: usuario.value.institute.id,
                exist: true,
              },
              tokenHeader(),
            );
            archivedAreas.value = archivedAreas.value.filter(
              (a) => a.id !== area.id,
            );
            await fetchAreas();
            const successAlert = await alertController.create({
              header: "Éxito",
              message: `El área "${area.name}" ha sido reactivada exitosamente.`,
              buttons: ["OK"],
            });
            await successAlert.present();
          } catch (error) {
            console.error("Error reactivating area:", error);
            const errorAlert = await alertController.create({
              header: "Error",
              message: "Hubo un error al reactivar el área.",
              buttons: ["OK"],
            });
            await errorAlert.present();
          }
        },
      },
    ],
  });
  await alert.present();
};

// --- Period Management ---
const periods = ref([]);
const isCreatePeriodModalOpen = ref(false);
const newPeriod = ref({ name: "" });
const isEditPeriodModalOpen = ref(false);
const editedPeriod = ref({ id: null, name: "" });
const archivedPeriods = ref([]);

const fetchPeriods = async () => {
  try {
    const response = await axios.get(
      `/periods?instituteId=${usuario.value.institute.id}&exist=true`,
      tokenHeader(),
    );
    periods.value = sortPeriods(response.data);
  } catch (error) {
    console.error("Error fetching periods:", error);
  }
};

const fetchArchivedPeriods = async () => {
  try {
    isArchivedLoading.value.periods = true;
    const response = await axios.get(
      `/periods?instituteId=${usuario.value.institute.id}&exist=false`,
      tokenHeader(),
    );
    archivedPeriods.value = sortPeriods(response.data);
    archivedLoaded.value.periods = true;
  } catch (error) {
    console.error("Error fetching archived periods:", error);
  } finally {
    isArchivedLoading.value.periods = false;
  }
};

const openCreatePeriodModal = () => {
  newPeriod.value = {
    name: "",
    instituteId: usuario.value.institute.id,
  };
  isCreatePeriodModalOpen.value = true;
};

const closeCreatePeriodModal = () => {
  isCreatePeriodModalOpen.value = false;
};

const createPeriod = async () => {
  if (!newPeriod.value.name) {
    const alert = await alertController.create({
      header: "Error",
      message: "El nombre del periodo no puede estar vacío.",
      buttons: ["OK"],
    });
    await alert.present();
    return;
  }
  try {
    await axios.post("/periods", newPeriod.value, tokenHeader());
    closeCreatePeriodModal();
    sectionViewMode.value.periods = "active";
    await fetchPeriods();
    const alert = await alertController.create({
      header: "Éxito",
      message: "Periodo creado exitosamente.",
      buttons: ["OK"],
    });
    await alert.present();
  } catch (error) {
    console.error("Error creating period:", error);
    const alert = await alertController.create({
      header: "Error",
      message: "Hubo un error al crear el periodo.",
      buttons: ["OK"],
    });
    await alert.present();
  }
};

const openEditPeriodModal = (period) => {
  editedPeriod.value = {
    id: period.id,
    name: period.name,
    instituteId: period.institute.id,
  };
  isEditPeriodModalOpen.value = true;
};

const closeEditPeriodModal = () => {
  isEditPeriodModalOpen.value = false;
};

const editPeriod = async () => {
  if (!editedPeriod.value.name) {
    const alert = await alertController.create({
      header: "Error",
      message: "El nombre del periodo no puede estar vacío.",
      buttons: ["OK"],
    });
    await alert.present();
    return;
  }
  try {
    await axios.patch(
      `/periods/${editedPeriod.value.id}`,
      {
        name: editedPeriod.value.name,
        instituteId: editedPeriod.value.instituteId,
      },
      tokenHeader(),
    );
    closeEditPeriodModal();
    await fetchPeriods();
    const alert = await alertController.create({
      header: "Éxito",
      message: "Periodo actualizado exitosamente.",
      buttons: ["OK"],
    });
    await alert.present();
  } catch (error) {
    console.error("Error updating period:", error);
    const alert = await alertController.create({
      header: "Error",
      message: "Hubo un error al actualizar el periodo.",
      buttons: ["OK"],
    });
    await alert.present();
  }
};

const archivePeriod = async (period) => {
  const alert = await alertController.create({
    header: "Confirmar Archivación",
    message: `¿Estás seguro de que quieres archivar el periodo "${period.name}"? Sus notas, evaluaciones y datos históricos se preservarán intactos.`,
    buttons: [
      { text: "Cancelar", role: "cancel" },
      {
        text: "Archivar",
        handler: async () => {
          try {
            await axios.patch(
              `/periods/${period.id}`,
              {
                name: period.name,
                instituteId: period.institute?.id || usuario.value.institute.id,
                exist: false,
              },
              tokenHeader(),
            );
            periods.value = periods.value.filter((p) => p.id !== period.id);
            if (archivedLoaded.value.periods) {
              await fetchArchivedPeriods();
            }
            const successAlert = await alertController.create({
              header: "Éxito",
              message: `El periodo "${period.name}" ha sido enviado al archivo/papelera.`,
              buttons: ["OK"],
            });
            await successAlert.present();
          } catch (error) {
            console.error("Error archiving period:", error);
            const errorAlert = await alertController.create({
              header: "Error",
              message: "Hubo un error al archivar el periodo.",
              buttons: ["OK"],
            });
            await errorAlert.present();
          }
        },
      },
    ],
  });
  await alert.present();
};

const reactivatePeriod = async (period) => {
  const alert = await alertController.create({
    header: "Confirmar Reactivación",
    message: `¿Estás seguro de que quieres reactivar el periodo "${period.name}"? Volverá a estar activo para el ingreso de calificaciones.`,
    buttons: [
      { text: "Cancelar", role: "cancel" },
      {
        text: "Reactivar",
        handler: async () => {
          try {
            await axios.patch(
              `/periods/${period.id}`,
              {
                name: period.name,
                instituteId: period.institute?.id || usuario.value.institute.id,
                exist: true,
              },
              tokenHeader(),
            );
            archivedPeriods.value = archivedPeriods.value.filter(
              (p) => p.id !== period.id,
            );
            await fetchPeriods();
            const successAlert = await alertController.create({
              header: "Éxito",
              message: `El periodo "${period.name}" ha sido reactivado exitosamente.`,
              buttons: ["OK"],
            });
            await successAlert.present();
          } catch (error) {
            console.error("Error reactivating period:", error);
            const errorAlert = await alertController.create({
              header: "Error",
              message: "Hubo un error al reactivar el periodo.",
              buttons: ["OK"],
            });
            await errorAlert.present();
          }
        },
      },
    ],
  });
  await alert.present();
};

onMounted(async () => {
  usuario.value = usuarioGet();
  if (usuario.value) {
    await fetchCourses();
    await fetchAreas();
    await fetchPeriods();
  }
});
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM - GESTIÓN ACADÉMICA
   ========================================================================== */

.qz-academic-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-academic-content {
  --background: var(--qz-color-purple-bg, #efeefc);
}

.qz-academic-wrapper {
  display: flex;
  flex-direction: column;
}

/* 1. HERO HEADER PÚRPURA */
.qz-hero-header {
  background: linear-gradient(135deg, #6a5ae0 0%, #5345c7 50%, #4637b8 100%);
  padding: 24px 20px 28px 20px;
  color: #ffffff;
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;
  box-shadow: 0 12px 28px -4px rgba(106, 90, 224, 0.35);
}

.qz-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.qz-back-btn,
.qz-action-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.qz-back-btn:active,
.qz-action-btn:active {
  background: rgba(255, 255, 255, 0.35);
  transform: scale(0.95);
}

.qz-hero-status-pill {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(8px);
}

.qz-hero-titles {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-hero-badge-row {
  display: flex;
  align-items: center;
}

.qz-hero-tag {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  padding: 4px 10px;
  border-radius: 9999px;
  text-transform: uppercase;
}

.qz-hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: #ffffff;
}

.qz-hero-subtitle {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 400;
}

/* 2. CUERPO PRINCIPAL */
.qz-main-body {
  padding: 16px 16px 24px 16px;
}

.qz-academic-container {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* PESTAÑAS SEGMENT QUEEZY */
.qz-segment-wrap {
  margin-top: -8px;
  margin-bottom: 4px;
}

.qz-tabs-nav {
  display: flex;
  background: #ffffff;
  border-radius: 20px;
  padding: 6px;
  box-shadow: 0 4px 16px rgba(12, 9, 42, 0.04);
  border: 1px solid var(--qz-color-border, #e6e6e6);
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
}

.qz-tab-btn {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 10px;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: var(--qz-color-text-muted, #858494);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.qz-tab-btn ion-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.qz-tab-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-tab-count {
  font-size: 11px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 9999px;
  background: rgba(12, 9, 42, 0.06);
  color: inherit;
  line-height: 1;
  flex-shrink: 0;
}

.qz-tab-btn.is-active {
  background: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.35);
}

.qz-tab-btn.is-active .qz-tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* RESPONSIVE SEGMENT TABS */
@media (max-width: 600px) {
  .qz-tabs-nav {
    padding: 4px;
    gap: 4px;
    border-radius: 16px;
  }

  .qz-tab-btn {
    padding: 10px 6px;
    gap: 6px;
    font-size: 13px;
    border-radius: 12px;
  }

  .qz-tab-btn ion-icon {
    font-size: 16px;
  }

  .qz-tab-count {
    display: none !important;
  }
}

@media (max-width: 380px) {
  .qz-tabs-nav {
    padding: 3px;
    gap: 3px;
  }

  .qz-tab-btn {
    padding: 8px 3px;
    gap: 4px;
    font-size: 12px;
  }

  .qz-tab-btn ion-icon {
    font-size: 15px;
  }
}

/* SUB-FILTER SWITCHER: ACTIVOS VS PAPELERA / ARCHIVO */
.qz-subfilter-wrap {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.qz-subfilter-nav {
  display: flex;
  gap: 8px;
  background: #ffffff;
  border: 1px solid var(--qz-color-border, #e6e6e6);
  padding: 6px;
  border-radius: 9999px;
  box-shadow: 0 4px 14px rgba(12, 9, 42, 0.04);
}

.qz-subfilter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  color: var(--qz-color-text-muted, #858494);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.qz-subfilter-btn ion-icon {
  font-size: 17px;
}

.qz-subfilter-btn:hover {
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-subfilter-btn.is-active {
  background: #efeefc;
  color: var(--qz-color-purple-primary, #6a5ae0);
  box-shadow: 0 2px 8px rgba(106, 90, 224, 0.12);
}

.qz-subfilter-btn--archive.is-active {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
}

.qz-subfilter-label {
  font-size: 13px;
  font-weight: 700;
}

.qz-subfilter-pill {
  font-size: 11px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 9999px;
  background: rgba(106, 90, 224, 0.14);
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-subfilter-pill--muted {
  background: rgba(245, 158, 11, 0.18);
  color: #d97706;
}

/* BANNER INFORMATIVO ARCHIVO / PAPELERA */
.qz-archive-banner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: rgba(106, 90, 224, 0.05);
  border: 1.5px dashed rgba(106, 90, 224, 0.25);
  border-radius: 20px;
  padding: 16px 20px;
  margin-bottom: 22px;
}

.qz-archive-banner__icon {
  font-size: 26px;
  color: var(--qz-color-purple-primary, #6a5ae0);
  min-width: 26px;
  margin-top: 2px;
}

.qz-archive-banner__text {
  flex: 1;
}

.qz-archive-banner__title {
  font-size: 15px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  margin: 0 0 4px 0;
}

.qz-archive-banner__desc {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--qz-color-text-muted, #858494);
  line-height: 1.45;
  margin: 0;
}

/* BOTÓN ARCHIVAR EN TARJETAS ACTIVAS */
.qz-btn-archive {
  background: rgba(245, 158, 11, 0.08);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.qz-btn-archive:hover {
  background: #d97706;
  color: #ffffff;
  border-color: #d97706;
}

/* ESTADO DE CARGA DE PAPELERA */
.qz-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 44px 20px;
  color: var(--qz-color-text-muted, #858494);
  font-size: 14px;
  font-weight: 600;
}

.qz-empty-icon--muted {
  background: rgba(133, 132, 148, 0.12) !important;
  color: #858494 !important;
}

/* BOTÓN RÁPIDO DE ACCIÓN */
.qz-quick-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;
}

.qz-quick-btn--primary {
  background: linear-gradient(135deg, #6a5ae0 0%, #7c6ef2 100%);
  color: #ffffff;
  box-shadow: 0 8px 20px -2px rgba(106, 90, 224, 0.35);
}

.qz-quick-btn:active {
  transform: scale(0.985);
}

.qz-quick-btn__icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.qz-quick-btn__text {
  display: flex;
  flex-direction: column;
}

.qz-quick-btn__title {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.2px;
}

.qz-quick-btn__sub {
  font-size: 12px;
  opacity: 0.88;
  font-weight: 400;
  margin-top: 2px;
}

/* BLOQUES DE SECCIÓN */
.qz-section-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
}

.qz-section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.qz-section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-count-pill {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 9999px;
  background: var(--qz-color-purple-light, #faf9fe);
  color: var(--qz-color-purple-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.15);
}

.qz-count--muted {
  background: #f0f0f5;
  color: #858494;
  border-color: #e0e0e8;
}

/* GRILLA DE ITEMS */
.qz-items-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* CARD DE ITEM */
.qz-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid var(--qz-color-border, #e6e6e6);
  box-shadow: 0 4px 14px rgba(12, 9, 42, 0.04);
}

.qz-item-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  gap: 14px;
  transition: all 0.2s ease;
}

.qz-item-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(106, 90, 224, 0.08);
}

.qz-item-card--archived {
  opacity: 0.85;
  background: #fafafc;
}

/* ICON SQUIRCLES */
.qz-item-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.qz-icon--purple {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-icon--cyan {
  background: #e8f9fe;
  color: #00a8cc;
}

.qz-icon--gold {
  background: #fff6e7;
  color: #ffae33;
}

.qz-icon--muted {
  background: #f0f0f5;
  color: #858494;
}

/* DETALLES DE ITEM */
.qz-item-details {
  flex: 1;
  min-width: 0;
}

.qz-item-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.qz-meta-tag {
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
  font-weight: 500;
}

.qz-status-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  display: inline-block;
}

.qz-status--active {
  background: #eafbf1;
  color: #2cb67d;
}

.qz-status--archived {
  background: #f0f0f5;
  color: #858494;
}

/* ACCIONES DE ITEM */
.qz-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.qz-action-btn-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--qz-color-border, #e6e6e6);
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.qz-action-btn-circle:active {
  transform: scale(0.92);
}

.qz-btn-edit {
  color: #6a5ae0;
  background: #efeefc;
  border-color: rgba(106, 90, 224, 0.2);
}

.qz-btn-edit:hover {
  background: #e2e0fb;
}

.qz-btn-danger {
  color: #ff5656;
  background: #feecec;
  border-color: rgba(255, 86, 86, 0.2);
}

.qz-btn-danger:hover {
  background: #fdd8d8;
}

.qz-btn-pill-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 9999px;
  border: 1px solid transparent;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-btn-pill--success {
  background: #eafbf1;
  color: #2cb67d;
  border-color: rgba(44, 182, 125, 0.25);
}

.qz-btn-pill--success:active {
  transform: scale(0.95);
}

/* ESTADO VACÍO */
.qz-empty-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px dashed var(--qz-color-border, #e6e6e6);
  padding: 32px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.qz-empty-card--compact {
  padding: 16px 20px;
}

.qz-empty-icon-circle {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin-bottom: 4px;
}

.qz-empty-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-empty-desc {
  margin: 0;
  font-size: 13px;
  color: var(--qz-color-text-muted, #858494);
  max-width: 380px;
  line-height: 1.4;
}

.qz-btn-create-empty {
  margin-top: 8px;
  background: var(--qz-color-purple-primary, #6a5ae0);
  border: none;
  color: #ffffff;
  border-radius: 9999px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.qz-btn-create-empty:active {
  transform: scale(0.96);
}

/* ==========================================================================
   MODALES QUEEZY
   ========================================================================== */
.qz-session-modal {
  --border-radius: 24px;
  --max-width: 480px;
}

.qz-modal-large {
  --max-width: 520px;
}

.qz-modal-content {
  background: #ffffff;
  padding: 24px;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-sizing: border-box;
}

.qz-modal-header {
  display: flex;
  flex-direction: column;
  position: relative;
  gap: 4px;
}

.qz-modal-badge {
  font-size: 10px;
  font-weight: 800;
  color: var(--qz-color-purple-primary, #6a5ae0);
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.qz-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-modal-close-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--qz-color-purple-light, #faf9fe);
  border: 1px solid var(--qz-color-border, #e6e6e6);
  color: var(--qz-color-text-muted, #858494);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
}

.qz-modal-close-btn:active {
  transform: scale(0.95);
}

.qz-modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-input-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-form-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1.5px solid var(--qz-color-border, rgba(106, 90, 224, 0.15));
  font-size: 14px;
  font-family: inherit;
  color: var(--qz-color-text-main, #0c092a);
  background: var(--qz-color-purple-light, #faf9fe);
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.qz-form-input:focus {
  border-color: var(--qz-color-purple-primary, #6a5ae0);
  background: #ffffff;
}

/* TOGGLE GROUP */
.qz-toggle-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qz-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--qz-color-purple-light, #faf9fe);
  border: 1px solid var(--qz-color-border, rgba(106, 90, 224, 0.1));
}

.qz-toggle-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--qz-color-text-main, #0c092a);
}

/* CHECKLIST DE ÁREAS */
.qz-areas-selection-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-group-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-count-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  background: #efeefc;
  color: #6a5ae0;
}

.qz-areas-checklist {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 4px;
}

.qz-area-check-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--qz-color-purple-light, #faf9fe);
  border: 1px solid var(--qz-color-border, #e6e6e6);
  cursor: pointer;
  transition: all 0.18s ease;
  user-select: none;
}

.qz-area-check-row:hover {
  border-color: #6a5ae0;
}

.qz-area-check-row.is-selected {
  background: #efeefc;
  border-color: #6a5ae0;
}

.qz-check-icon {
  font-size: 20px;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qz-check-label {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-empty-notice {
  font-size: 12.5px;
  color: var(--qz-color-text-muted, #858494);
  background: var(--qz-color-purple-light, #faf9fe);
  padding: 12px;
  border-radius: 12px;
  text-align: center;
  line-height: 1.4;
}

.qz-modal-submit-btn {
  background: var(--qz-color-purple-primary, #6a5ae0);
  border: none;
  color: #ffffff;
  border-radius: 9999px;
  padding: 14px;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  margin-top: 6px;
  transition: transform 0.15s ease, background 0.2s ease;
}

.qz-modal-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qz-modal-submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

/* ==========================================================================
   ASIGNACIÓN ACADÉMICA (PLAN DE ESTUDIOS Y DOCENTES)
   ========================================================================== */
.qz-academic-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #efeefc;
  color: #6a5ae0;
  border: none;
  border-radius: 10px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 6px;
  transition: all 0.2s ease;
}

.qz-academic-pill-btn:hover {
  background: #6a5ae0;
  color: #ffffff;
}

.qz-btn-academic {
  background: #efeefc;
  color: #6a5ae0;
  border: 1px solid rgba(106, 90, 224, 0.2);
}

.qz-btn-academic:hover {
  background: #6a5ae0;
  color: #ffffff;
}

.qz-academic-modal {
  --background: #ffffff;
  --border-radius: 24px;
}

.qz-academic-modal-content {
  max-width: 680px;
  margin: 0 auto;
}

.qz-academic-bar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.qz-academic-year-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-academic-year-label {
  font-size: 12px;
  font-weight: 700;
  color: #858494;
}

.qz-select-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f4f3fd;
  border: 1.5px solid rgba(106, 90, 224, 0.2);
  border-radius: 12px;
  padding: 6px 12px;
}

.qz-year-native-select {
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 700;
  color: #6a5ae0;
  outline: none;
  cursor: pointer;
}

.qz-btn-add-course-area {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #6a5ae0;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-btn-add-course-area:hover {
  background: #5b4cc9;
  transform: translateY(-1px);
}

.qz-academic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.qz-academic-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 14px 16px;
  border: 1.5px solid rgba(106, 90, 224, 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
}

.qz-academic-card-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.qz-area-squircle-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.qz-academic-card-title-col {
  flex-grow: 1;
}

.qz-academic-area-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 700;
  color: #110d26;
}

.qz-academic-teacher-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 8px;
}

.qz-teacher--assigned {
  background: #dcfce7;
  color: #15803d;
}

.qz-teacher--none {
  background: #fee2e2;
  color: #b91c1c;
}

.qz-academic-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-btn-assign-action {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #efeefc;
  color: #6a5ae0;
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-btn-assign-action:hover {
  background: #6a5ae0;
  color: #ffffff;
}

.qz-btn-unlink-area {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  background: #fff1f2;
  color: #e11d48;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
}

.qz-btn-unlink-area:hover {
  background: #e11d48;
  color: #ffffff;
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  .qz-academic-page {
    --background: #110d26;
    background-color: #110d26;
  }

  .qz-academic-content {
    --background: #110d26;
  }

  .qz-academic-wrapper {
    background-color: #110d26;
  }

  .qz-hero-header {
    background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
  }

  .qz-card,
  .qz-item-card,
  .qz-empty-card,
  .qz-modal-content {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }

  .qz-item-card--archived {
    background: #181430;
  }

  .qz-subfilter-nav {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  }

  .qz-subfilter-btn {
    color: #9e9bb8;
  }

  .qz-subfilter-btn:hover {
    color: #ffffff;
  }

  .qz-subfilter-btn.is-active {
    background: #252048;
    color: #f7f7fd;
    border-color: #7c6ef2;
    box-shadow: 0 4px 12px rgba(124, 110, 242, 0.25);
  }

  .qz-subfilter-pill {
    background: rgba(124, 110, 242, 0.25);
    color: #c0b7ff;
  }

  .qz-subfilter-pill--muted {
    background: rgba(245, 158, 11, 0.25);
    color: #fbbf24;
  }

  .qz-archive-banner {
    background: #181430;
    border-color: rgba(124, 110, 242, 0.3);
  }

  .qz-archive-banner__icon {
    color: #a39bf0;
  }

  .qz-archive-banner__title {
    color: #f7f7fd;
  }

  .qz-archive-banner__desc {
    color: #9e9bb8;
  }

  .qz-btn-archive {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    border-color: rgba(245, 158, 11, 0.25);
  }

  .qz-btn-archive:hover {
    background: #f59e0b;
    color: #ffffff;
  }

  .qz-tabs-nav {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }

  .qz-tab-btn {
    color: #9e9bb8;
  }

  .qz-tab-count {
    background: rgba(255, 255, 255, 0.08);
    color: #9e9bb8;
  }

  .qz-tab-btn.is-active {
    background: #7c6ef2;
    color: #ffffff;
  }

  .qz-tab-btn.is-active .qz-tab-count {
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
  }

  .qz-section-title,
  .qz-item-name,
  .qz-empty-title,
  .qz-modal-title,
  .qz-input-label,
  .qz-toggle-text,
  .qz-check-label {
    color: #f7f7fd;
  }

  .qz-empty-desc,
  .qz-meta-tag,
  .qz-empty-notice {
    color: #9e9bb8;
  }

  .qz-count-pill,
  .qz-count-badge {
    background: #252048;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .qz-count--muted {
    background: #181430;
    color: #9e9bb8;
    border-color: rgba(255, 255, 255, 0.08);
  }

  .qz-action-btn-circle {
    background: #252048;
    border-color: rgba(255, 255, 255, 0.1);
    color: #f7f7fd;
  }

  .qz-icon--purple {
    background: #252048;
    color: #a39bf0;
  }

  .qz-icon--cyan {
    background: #172d38;
    color: #70d6f5;
  }

  .qz-icon--gold {
    background: #2e2519;
    color: #ffae33;
  }

  .qz-icon--muted,
  .qz-empty-icon-circle,
  .qz-modal-close-btn {
    background: #252048;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .qz-btn-edit {
    background: #252048;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .qz-btn-danger {
    background: rgba(255, 86, 86, 0.16);
    color: #ff5656;
    border-color: rgba(255, 86, 86, 0.25);
  }

  .qz-status--active {
    background: rgba(83, 223, 131, 0.16);
    color: #53df83;
  }

  .qz-status--archived {
    background: #252048;
    color: #9e9bb8;
  }

  .qz-btn-pill--success {
    background: rgba(83, 223, 131, 0.16);
    color: #53df83;
    border-color: rgba(83, 223, 131, 0.25);
  }

  .qz-form-input {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.14);
    color: #f7f7fd;
  }

  .qz-form-input:focus {
    background: #28214b !important;
    border-color: #7c6ef2 !important;
    color: #f7f7fd !important;
    box-shadow: 0 0 0 3px rgba(124, 110, 242, 0.25);
  }

  .qz-form-input::placeholder {
    color: #858494;
  }

  .qz-toggle-row,
  .qz-area-check-row {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .qz-area-check-row.is-selected {
    background: #2a2350;
    border-color: #7c6ef2;
  }

  .qz-check-icon {
    color: #a39bf0;
  }

  .qz-academic-modal {
    --background: #1d1838;
  }

  .qz-academic-modal-content {
    background: #1d1838;
  }

  .qz-select-pill {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .qz-year-native-select {
    background: #231d42;
    color: #f7f7fd;
  }

  .qz-academic-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 6px 20px -4px rgba(0, 0, 0, 0.35);
  }

  .qz-area-squircle-icon {
    background: #28214b;
    color: #a39bf0;
  }

  .qz-academic-area-title {
    color: #f7f7fd;
  }

  .qz-academic-year-label {
    color: #9e9bb8;
  }

  .qz-teacher--assigned {
    background: rgba(83, 223, 131, 0.18);
    color: #53df83;
  }

  .qz-teacher--none {
    background: rgba(255, 86, 86, 0.18);
    color: #ff8fa2;
  }

  .qz-btn-assign-action {
    background: #28214b;
    color: #a39bf0;
  }

  .qz-btn-assign-action:hover {
    background: #352b6a;
    color: #ffffff;
  }

  .qz-btn-unlink-area {
    background: rgba(225, 29, 72, 0.18);
    color: #fb7185;
  }

  .qz-btn-unlink-area:hover {
    background: #e11d48;
    color: #ffffff;
  }

  .qz-academic-pill-btn {
    background: #28214b;
    color: #a39bf0;
  }

  .qz-btn-academic {
    background: #28214b;
    color: #a39bf0;
    border-color: rgba(255, 255, 255, 0.1);
  }
}

:global(body.dark) .qz-academic-page,
:global(html.dark) .qz-academic-page,
:global(.dark) .qz-academic-page {
  --background: #110d26;
  background-color: #110d26;
}

:global(body.dark) .qz-academic-content,
:global(html.dark) .qz-academic-content,
:global(.dark) .qz-academic-content {
  --background: #110d26;
}

:global(body.dark) .qz-academic-wrapper,
:global(html.dark) .qz-academic-wrapper,
:global(.dark) .qz-academic-wrapper {
  background-color: #110d26;
}

:global(body.dark) .qz-hero-header,
:global(html.dark) .qz-hero-header,
:global(.dark) .qz-hero-header {
  background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
}

:global(body.dark) .qz-card,
:global(html.dark) .qz-card,
:global(.dark) .qz-card,
:global(body.dark) .qz-item-card,
:global(html.dark) .qz-item-card,
:global(.dark) .qz-item-card,
:global(body.dark) .qz-empty-card,
:global(html.dark) .qz-empty-card,
:global(.dark) .qz-empty-card,
:global(body.dark) .qz-modal-content,
:global(html.dark) .qz-modal-content,
:global(.dark) .qz-modal-content {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

:global(body.dark) .qz-item-card--archived,
:global(html.dark) .qz-item-card--archived,
:global(.dark) .qz-item-card--archived {
  background: #181430;
}

:global(body.dark) .qz-subfilter-nav,
:global(html.dark) .qz-subfilter-nav,
:global(.dark) .qz-subfilter-nav {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}

:global(body.dark) .qz-subfilter-btn,
:global(html.dark) .qz-subfilter-btn,
:global(.dark) .qz-subfilter-btn {
  color: #9e9bb8;
}

:global(body.dark) .qz-subfilter-btn:hover,
:global(html.dark) .qz-subfilter-btn:hover,
:global(.dark) .qz-subfilter-btn:hover {
  color: #ffffff;
}

:global(body.dark) .qz-subfilter-btn.is-active,
:global(html.dark) .qz-subfilter-btn.is-active,
:global(.dark) .qz-subfilter-btn.is-active {
  background: #252048;
  color: #f7f7fd;
  border-color: #7c6ef2;
  box-shadow: 0 4px 12px rgba(124, 110, 242, 0.25);
}

:global(body.dark) .qz-subfilter-pill,
:global(html.dark) .qz-subfilter-pill,
:global(.dark) .qz-subfilter-pill {
  background: rgba(124, 110, 242, 0.25);
  color: #c0b7ff;
}

:global(body.dark) .qz-subfilter-pill--muted,
:global(html.dark) .qz-subfilter-pill--muted,
:global(.dark) .qz-subfilter-pill--muted {
  background: rgba(245, 158, 11, 0.25);
  color: #fbbf24;
}

:global(body.dark) .qz-archive-banner,
:global(html.dark) .qz-archive-banner,
:global(.dark) .qz-archive-banner {
  background: #181430;
  border-color: rgba(124, 110, 242, 0.3);
}

:global(body.dark) .qz-archive-banner__icon,
:global(html.dark) .qz-archive-banner__icon,
:global(.dark) .qz-archive-banner__icon {
  color: #a39bf0;
}

:global(body.dark) .qz-archive-banner__title,
:global(html.dark) .qz-archive-banner__title,
:global(.dark) .qz-archive-banner__title {
  color: #f7f7fd;
}

:global(body.dark) .qz-archive-banner__desc,
:global(html.dark) .qz-archive-banner__desc,
:global(.dark) .qz-archive-banner__desc {
  color: #9e9bb8;
}

:global(body.dark) .qz-btn-archive,
:global(html.dark) .qz-btn-archive,
:global(.dark) .qz-btn-archive {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.25);
}

:global(body.dark) .qz-btn-archive:hover,
:global(html.dark) .qz-btn-archive:hover,
:global(.dark) .qz-btn-archive:hover {
  background: #f59e0b;
  color: #ffffff;
}

:global(body.dark) .qz-tabs-nav,
:global(html.dark) .qz-tabs-nav,
:global(.dark) .qz-tabs-nav {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-tab-btn,
:global(html.dark) .qz-tab-btn,
:global(.dark) .qz-tab-btn {
  color: #9e9bb8;
}

:global(body.dark) .qz-tab-count,
:global(html.dark) .qz-tab-count,
:global(.dark) .qz-tab-count {
  background: rgba(255, 255, 255, 0.08);
  color: #9e9bb8;
}

:global(body.dark) .qz-tab-btn.is-active,
:global(html.dark) .qz-tab-btn.is-active,
:global(.dark) .qz-tab-btn.is-active {
  background: #7c6ef2;
  color: #ffffff;
}

:global(body.dark) .qz-tab-btn.is-active .qz-tab-count,
:global(html.dark) .qz-tab-btn.is-active .qz-tab-count,
:global(.dark) .qz-tab-btn.is-active .qz-tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

:global(body.dark) .qz-section-title,
:global(html.dark) .qz-section-title,
:global(.dark) .qz-section-title,
:global(body.dark) .qz-item-name,
:global(html.dark) .qz-item-name,
:global(.dark) .qz-item-name,
:global(body.dark) .qz-empty-title,
:global(html.dark) .qz-empty-title,
:global(.dark) .qz-empty-title,
:global(body.dark) .qz-modal-title,
:global(html.dark) .qz-modal-title,
:global(.dark) .qz-modal-title,
:global(body.dark) .qz-input-label,
:global(html.dark) .qz-input-label,
:global(.dark) .qz-input-label,
:global(body.dark) .qz-toggle-text,
:global(html.dark) .qz-toggle-text,
:global(.dark) .qz-toggle-text,
:global(body.dark) .qz-check-label,
:global(html.dark) .qz-check-label,
:global(.dark) .qz-check-label {
  color: #f7f7fd;
}

:global(body.dark) .qz-empty-desc,
:global(html.dark) .qz-empty-desc,
:global(.dark) .qz-empty-desc,
:global(body.dark) .qz-meta-tag,
:global(html.dark) .qz-meta-tag,
:global(.dark) .qz-meta-tag,
:global(body.dark) .qz-empty-notice,
:global(html.dark) .qz-empty-notice,
:global(.dark) .qz-empty-notice {
  color: #9e9bb8;
}

:global(body.dark) .qz-count-pill,
:global(html.dark) .qz-count-pill,
:global(.dark) .qz-count-pill,
:global(body.dark) .qz-count-badge,
:global(html.dark) .qz-count-badge,
:global(.dark) .qz-count-badge {
  background: #252048;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .qz-count--muted,
:global(html.dark) .qz-count--muted,
:global(.dark) .qz-count--muted {
  background: #181430;
  color: #9e9bb8;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-action-btn-circle,
:global(html.dark) .qz-action-btn-circle,
:global(.dark) .qz-action-btn-circle {
  background: #252048;
  border-color: rgba(255, 255, 255, 0.1);
  color: #f7f7fd;
}

:global(body.dark) .qz-icon--purple,
:global(html.dark) .qz-icon--purple,
:global(.dark) .qz-icon--purple {
  background: #252048;
  color: #a39bf0;
}

:global(body.dark) .qz-icon--cyan,
:global(html.dark) .qz-icon--cyan,
:global(.dark) .qz-icon--cyan {
  background: #172d38;
  color: #70d6f5;
}

:global(body.dark) .qz-icon--gold,
:global(html.dark) .qz-icon--gold,
:global(.dark) .qz-icon--gold {
  background: #2e2519;
  color: #ffae33;
}

:global(body.dark) .qz-icon--muted,
:global(html.dark) .qz-icon--muted,
:global(.dark) .qz-icon--muted,
:global(body.dark) .qz-empty-icon-circle,
:global(html.dark) .qz-empty-icon-circle,
:global(.dark) .qz-empty-icon-circle,
:global(body.dark) .qz-modal-close-btn,
:global(html.dark) .qz-modal-close-btn,
:global(.dark) .qz-modal-close-btn {
  background: #252048;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .qz-btn-edit,
:global(html.dark) .qz-btn-edit,
:global(.dark) .qz-btn-edit {
  background: #252048;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .qz-btn-danger,
:global(html.dark) .qz-btn-danger,
:global(.dark) .qz-btn-danger {
  background: rgba(255, 86, 86, 0.16);
  color: #ff5656;
  border-color: rgba(255, 86, 86, 0.25);
}

:global(body.dark) .qz-status--active,
:global(html.dark) .qz-status--active,
:global(.dark) .qz-status--active {
  background: rgba(83, 223, 131, 0.16);
  color: #53df83;
}

:global(body.dark) .qz-status--archived,
:global(html.dark) .qz-status--archived,
:global(.dark) .qz-status--archived {
  background: #252048;
  color: #9e9bb8;
}

:global(body.dark) .qz-btn-pill--success,
:global(html.dark) .qz-btn-pill--success,
:global(.dark) .qz-btn-pill--success {
  background: rgba(83, 223, 131, 0.16);
  color: #53df83;
  border-color: rgba(83, 223, 131, 0.25);
}

:global(body.dark) .qz-form-input,
:global(html.dark) .qz-form-input,
:global(.dark) .qz-form-input {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.14);
  color: #f7f7fd;
}

:global(body.dark) .qz-form-input:focus,
:global(html.dark) .qz-form-input:focus,
:global(.dark) .qz-form-input:focus {
  background: #28214b !important;
  border-color: #7c6ef2 !important;
  color: #f7f7fd !important;
  box-shadow: 0 0 0 3px rgba(124, 110, 242, 0.25);
}

:global(body.dark) .qz-form-input::placeholder,
:global(html.dark) .qz-form-input::placeholder,
:global(.dark) .qz-form-input::placeholder {
  color: #858494;
}

:global(body.dark) .qz-toggle-row,
:global(html.dark) .qz-toggle-row,
:global(.dark) .qz-toggle-row,
:global(body.dark) .qz-area-check-row,
:global(html.dark) .qz-area-check-row,
:global(.dark) .qz-area-check-row {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .qz-area-check-row.is-selected,
:global(html.dark) .qz-area-check-row.is-selected,
:global(.dark) .qz-area-check-row.is-selected {
  background: #2a2350;
  border-color: #7c6ef2;
}

:global(body.dark) .qz-check-icon,
:global(html.dark) .qz-check-icon,
:global(.dark) .qz-check-icon {
  color: #a39bf0;
}

:global(body.dark) .qz-academic-modal,
:global(html.dark) .qz-academic-modal,
:global(.dark) .qz-academic-modal {
  --background: #1d1838;
}

:global(body.dark) .qz-academic-modal-content,
:global(html.dark) .qz-academic-modal-content,
:global(.dark) .qz-academic-modal-content {
  background: #1d1838;
}

:global(body.dark) .qz-select-pill,
:global(html.dark) .qz-select-pill,
:global(.dark) .qz-select-pill {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(body.dark) .qz-year-native-select,
:global(html.dark) .qz-year-native-select,
:global(.dark) .qz-year-native-select {
  background: #231d42;
  color: #f7f7fd;
}

:global(body.dark) .qz-academic-card,
:global(html.dark) .qz-academic-card,
:global(.dark) .qz-academic-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 6px 20px -4px rgba(0, 0, 0, 0.35);
}

:global(body.dark) .qz-area-squircle-icon,
:global(html.dark) .qz-area-squircle-icon,
:global(.dark) .qz-area-squircle-icon {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-academic-area-title,
:global(html.dark) .qz-academic-area-title,
:global(.dark) .qz-academic-area-title {
  color: #f7f7fd;
}

:global(body.dark) .qz-academic-year-label,
:global(html.dark) .qz-academic-year-label,
:global(.dark) .qz-academic-year-label {
  color: #9e9bb8;
}

:global(body.dark) .qz-teacher--assigned,
:global(html.dark) .qz-teacher--assigned,
:global(.dark) .qz-teacher--assigned {
  background: rgba(83, 223, 131, 0.18);
  color: #53df83;
}

:global(body.dark) .qz-teacher--none,
:global(html.dark) .qz-teacher--none,
:global(.dark) .qz-teacher--none {
  background: rgba(255, 86, 86, 0.18);
  color: #ff8fa2;
}

:global(body.dark) .qz-btn-assign-action,
:global(html.dark) .qz-btn-assign-action,
:global(.dark) .qz-btn-assign-action {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-btn-assign-action:hover,
:global(html.dark) .qz-btn-assign-action:hover,
:global(.dark) .qz-btn-assign-action:hover {
  background: #352b6a;
  color: #ffffff;
}

:global(body.dark) .qz-btn-unlink-area,
:global(html.dark) .qz-btn-unlink-area,
:global(.dark) .qz-btn-unlink-area {
  background: rgba(225, 29, 72, 0.18);
  color: #fb7185;
}

:global(body.dark) .qz-btn-unlink-area:hover,
:global(html.dark) .qz-btn-unlink-area:hover,
:global(.dark) .qz-btn-unlink-area:hover {
  background: #e11d48;
  color: #ffffff;
}

:global(body.dark) .qz-academic-pill-btn,
:global(html.dark) .qz-academic-pill-btn,
:global(.dark) .qz-academic-pill-btn {
  background: #28214b;
  color: #a39bf0;
}

:global(body.dark) .qz-btn-academic,
:global(html.dark) .qz-btn-academic,
:global(.dark) .qz-btn-academic {
  background: #28214b;
  color: #a39bf0;
  border-color: rgba(255, 255, 255, 0.1);
}
</style>
