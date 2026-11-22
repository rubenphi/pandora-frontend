<template>
  <ion-page class="ion-page qz-review-page">
    <!-- BARRA SUPERIOR FIJA QUEEZY (Permanece anclada sin cortarse) -->
    <ion-header class="ion-no-border qz-sticky-header">
      <div class="qz-hero-top">
        <!-- Botón Volver -->
        <button
          type="button"
          class="qz-back-btn"
          title="Regresar a la actividad"
          @click="goBack"
        >
          <ion-icon :icon="arrowBackOutline"></ion-icon>
        </button>

        <!-- Resumen en Píldoras Queezy -->
        <div class="qz-hero-pills">
          <span
            class="qz-summary-pill qz-pill--hide-mobile"
            :title="`${students.length} estudiantes en total`"
          >
            <ion-icon :icon="schoolOutline"></ion-icon>
            {{ students.length }}
            <span class="qz-pill-label-full">{{
              students.length === 1 ? "alumno" : "alumnos"
            }}</span>
          </span>
          <span
            class="qz-summary-pill qz-pill--physical"
            :title="`${physicalDeliveryCount} entregas físicas registradas`"
          >
            <ion-icon :icon="documentAttachOutline"></ion-icon>
            {{ physicalDeliveryCount }}
            <span class="qz-pill-label-full">en físico</span>
            <span class="qz-pill-label-short">fís.</span>
          </span>
          <span
            class="qz-summary-pill qz-pill--digital"
            :title="`${digitalDeliveryCount} evidencias digitales registradas`"
          >
            <ion-icon :icon="documentTextOutline"></ion-icon>
            {{ digitalDeliveryCount }}
            <span class="qz-pill-label-full">digital</span>
            <span class="qz-pill-label-short">dig.</span>
          </span>
          <span
            v-if="pendingDeliveryCount > 0"
            class="qz-summary-pill qz-pill--pending qz-pill--hide-mobile"
            :title="`${pendingDeliveryCount} alumnos sin entrega registrada`"
          >
            <ion-icon :icon="helpCircleOutline"></ion-icon>
            {{ pendingDeliveryCount }}
            <span class="qz-pill-label-full">sin entrega</span>
          </span>
        </div>

        <!-- Acciones Rápidas Superior -->
        <div class="qz-hero-actions">
          <button
            type="button"
            class="qz-action-btn"
            title="Importar / Exportar Excel"
            @click="presentImportExportOptions()"
          >
            <ion-icon :icon="documentOutline"></ion-icon>
          </button>
          <button
            type="button"
            class="qz-save-hero-btn"
            title="Guardar calificaciones"
            aria-label="Guardar calificaciones"
            @click="presentSaveOptions()"
            :disabled="isSaving"
          >
            <ion-spinner
              v-if="isSaving"
              name="crescent"
              class="qz-btn-spinner"
            ></ion-spinner>
            <ion-icon v-else :icon="saveOutline"></ion-icon>
          </button>
        </div>
      </div>
    </ion-header>

    <ion-content :fullscreen="true" class="qz-review-content">
      <div class="qz-page-wrapper">
        <!-- 1. BANNER HERO QUEEZY PÚRPURA -->
        <div class="qz-hero-banner">
          <div class="qz-hero-titles">
            <span class="qz-hero-tag">
              REVISIÓN DE ACTIVIDAD
              <template v-if="activityInfo.grade || activityInfo.area">
                ·
                {{
                  [activityInfo.grade, activityInfo.area]
                    .filter(Boolean)
                    .join(" - ")
                }}
              </template>
            </span>
            <h1 class="qz-hero-title">
              {{ activityInfo.topic || "Revisar Entregas y Calificaciones" }}
            </h1>
            <p class="qz-hero-subtitle">
              {{
                activityInfo.lessonTopic
                  ? `Lección: ${activityInfo.lessonTopic}`
                  : "Gestiona entregas en papel, evidencias digitales y calificaciones de los estudiantes"
              }}
            </p>
          </div>
        </div>

        <!-- 2. CUERPO PRINCIPAL -->
        <div class="qz-main-body">
          <div class="qz-container">
            <!-- BARRA DE ACCIÓN SUPERIOR: CALIFICACIÓN MASIVA -->
            <div class="qz-top-action-bar">
              <button
                type="button"
                class="qz-group-pill-btn qz-bulk-pill-btn"
                @click="openBulkModal"
                title="Asignar una calificación masiva a los estudiantes del curso"
              >
                <ion-icon :icon="flashOutline"></ion-icon>
                <span>Calificación Masiva del Curso</span>
              </button>
            </div>

            <!-- BARRA DE CABECERA DIRECTA SOBRE LA LISTA DE ESTUDIANTES -->
            <div class="qz-list-header-bar">
              <div
                class="qz-master-check-side"
                @click="toggleAllPhysical(!areAllDelivered)"
              >
                <div
                  class="qz-checkbox-cell"
                  :title="
                    areAllDelivered
                      ? 'Desmarcar todas las entregas en físico'
                      : 'Marcar todos con entrega en físico'
                  "
                  @click.stop="toggleAllPhysical(!areAllDelivered)"
                >
                  <ion-checkbox
                    :checked="areAllDelivered"
                    :indeterminate="isIndeterminateDelivered"
                    class="qz-round-checkbox"
                  ></ion-checkbox>
                </div>
                <span class="qz-master-check-label">
                  Marcar todos en físico
                  <span class="qz-master-check-sub">
                    ({{ deliveredCount }} de {{ students.length }})
                  </span>
                </span>
              </div>

              <div class="qz-list-header-right">
                <span class="qz-header-mode-tag qz-tag--delivery">
                  Entregas en físico
                </span>
              </div>
            </div>

            <!-- ── Single-criterion mode: flat list, Tab between students ── -->
            <single-criterion-student-list
              v-if="isSingleCriterion"
              :students="students"
              :criterion="criteria[0]"
              :modelValue="getAllFlat()"
              :criteria="criteria"
              :evaluation="evaluation"
              :isSaving="isSaving"
              :students-with-evidence="evidences"
              @update:modelValue="onAllFlatUpdate"
              @save="handleSaveSingleCriterion"
            >
              <template #row-prefix="{ student }">
                <div
                  class="qz-checkbox-cell"
                  :title="
                    hasDigitalEvidence(student.id)
                      ? 'Entrega digital registrada con anexo'
                      : hasPhysicalDelivery(student.id)
                      ? 'Desmarcar entrega en físico'
                      : 'Marcar entrega en físico'
                  "
                  @click.stop="handleStudentRowCheckbox(student)"
                >
                  <ion-checkbox
                    :checked="hasEvidence(student.id)"
                    class="qz-round-checkbox"
                  />
                </div>
              </template>
              <template #name-suffix="{ student }">
                <span
                  v-if="getTeamMembers(student.id).length > 1"
                  class="qz-team-badge"
                  :title="
                    'Trabajo en equipo con: ' +
                    getTeamMembers(student.id)
                      .filter((s) => Number(s.id) !== Number(student.id))
                      .map((s) => `${s.lastName || ''} ${s.name || ''}`.trim())
                      .join(', ')
                  "
                >
                  <ion-icon :icon="peopleOutline"></ion-icon>
                  Equipo ({{ getTeamMembers(student.id).length }})
                </span>
                <span
                  v-if="hasDigitalEvidence(student.id)"
                  class="qz-delivery-badge qz-badge--digital"
                  title="Evidencia digital (PDF / fotos) registrada"
                >
                  <ion-icon :icon="documentTextOutline"></ion-icon>
                  Digital
                </span>
                <span
                  v-else-if="hasPhysicalDelivery(student.id)"
                  class="qz-delivery-badge qz-badge--physical"
                  title="Trabajo entregado en físico (papel)"
                >
                  <ion-icon :icon="documentAttachOutline"></ion-icon>
                  Físico
                </span>
                <span
                  v-else
                  class="qz-delivery-badge qz-badge--pending"
                  title="Sin evidencia ni entrega física"
                >
                  <ion-icon :icon="helpCircleOutline"></ion-icon>
                  Sin entrega
                </span>
              </template>
              <template #row-suffix="{ student }">
                <div
                  v-if="getTeamMembers(student.id).length > 1"
                  class="qz-team-members-bar"
                  style="margin-bottom: 8px;"
                >
                  <ion-icon :icon="peopleOutline"></ion-icon>
                  <span class="qz-team-members-text">
                    <strong>Integrantes del equipo:</strong>
                    {{
                      getTeamMembers(student.id)
                        .map((s) => `${s.lastName || ''} ${s.name || ''}`.trim())
                        .join(', ')
                    }}
                  </span>
                </div>
                <evidence-uploader
                  :student-id="student.id"
                  :student="student"
                  :activity-id="activityId"
                  :institute-id="instituteId"
                  :all-students="students"
                  :default-group="getStudentCourseGroup(student.id)"
                  :shared-student-names="getSharedStudentNames(student.id)"
                  @evidence-changed="handleEvidenceChanged"
                  @evidence-bulk-changed="handleEvidenceBulkChanged"
                  @evidence-bulk-delete="handleEvidenceBulkDelete"
                />
              </template>
            </single-criterion-student-list>

            <!-- ── Multi-criterion mode: accordion per student ── -->
            <div v-else class="qz-accordion-container">
              <ion-accordion-group>
                <ion-accordion
                  v-for="student in students"
                  :key="student.id"
                  class="qz-student-accordion-item"
                  @ionChange="handleAccordionChange($event, student)"
                >
                  <div slot="header" class="qz-accordion-header-row">
                    <div
                      class="qz-checkbox-cell"
                      :title="
                        hasDigitalEvidence(student.id)
                          ? 'Entrega digital registrada con anexo'
                          : hasPhysicalDelivery(student.id)
                          ? 'Desmarcar entrega en físico'
                          : 'Marcar entrega en físico'
                      "
                      @click.stop="handleStudentRowCheckbox(student)"
                    >
                      <ion-checkbox
                        :checked="hasEvidence(student.id)"
                        class="qz-round-checkbox"
                      ></ion-checkbox>
                    </div>

                    <div class="qz-student-header-info">
                      <span class="qz-student-fullname">
                        {{ student.lastName }} {{ student.name }}
                      </span>
                      <div class="qz-student-badges">
                        <span
                          v-if="getTeamMembers(student.id).length > 1"
                          class="qz-team-badge"
                          :title="
                            'Trabajo en equipo con: ' +
                            getTeamMembers(student.id)
                              .filter((s) => Number(s.id) !== Number(student.id))
                              .map((s) =>
                                `${s.lastName || ''} ${s.name || ''}`.trim(),
                              )
                              .join(', ')
                          "
                        >
                          <ion-icon :icon="peopleOutline"></ion-icon>
                          Equipo ({{
                            getTeamMembers(student.id).length
                          }})
                        </span>
                        <span
                          v-if="hasDigitalEvidence(student.id)"
                          class="qz-delivery-badge qz-badge--digital"
                          title="Evidencia digital subida"
                        >
                          <ion-icon :icon="documentTextOutline"></ion-icon>
                          Digital
                        </span>
                        <span
                          v-else-if="hasPhysicalDelivery(student.id)"
                          class="qz-delivery-badge qz-badge--physical"
                          title="Entregado en físico (papel)"
                        >
                          <ion-icon :icon="documentAttachOutline"></ion-icon>
                          Físico
                        </span>
                        <span
                          v-else
                          class="qz-delivery-badge qz-badge--pending"
                          title="Sin entrega"
                        >
                          <ion-icon :icon="helpCircleOutline"></ion-icon>
                          Sin entrega
                        </span>
                      </div>
                    </div>

                    <div class="qz-student-grade-pill">
                      <span class="qz-grade-label">Nota:</span>
                      <span class="qz-grade-val">
                        {{
                          studentGrades[student.id] != null
                            ? studentGrades[student.id].toFixed(2)
                            : "N/A"
                        }}
                      </span>
                    </div>
                  </div>

                  <div class="qz-accordion-body-wrap" slot="content">
                    <div class="qz-accordion-body-inner">
                      <!-- Barra aclaratoria de integrantes del equipo al desplegar -->
                      <div
                        v-if="getTeamMembers(student.id).length > 1"
                        class="qz-team-members-bar"
                      >
                        <ion-icon :icon="peopleOutline"></ion-icon>
                        <span class="qz-team-members-text">
                          <strong>Integrantes del equipo:</strong>
                          {{
                            getTeamMembers(student.id)
                              .map((s) => `${s.lastName || ''} ${s.name || ''}`.trim())
                              .join(', ')
                          }}
                        </span>
                      </div>

                      <!-- Evidence uploader -->
                      <evidence-uploader
                        :student-id="student.id"
                        :student="student"
                        :activity-id="activityId"
                        :institute-id="instituteId"
                        :all-students="students"
                        :default-group="getStudentCourseGroup(student.id)"
                        :shared-student-names="
                          getSharedStudentNames(student.id)
                        "
                        @evidence-changed="handleEvidenceChanged"
                        @evidence-bulk-changed="handleEvidenceBulkChanged"
                        @evidence-bulk-delete="handleEvidenceBulkDelete"
                      />

                      <!-- Criterion sliders -->
                      <criterion-list
                        v-if="evaluation[student.id]"
                        :criteria="criteria"
                        :modelValue="getStudentFlat(student)"
                        @update:modelValue="
                          onStudentEvalUpdate($event, student)
                        "
                      />

                      <!-- Botones de Guardado: Equipo vs Individual -->
                      <div
                        v-if="getTeamMembers(student.id).length > 1"
                        class="qz-save-actions-group"
                      >
                        <button
                          type="button"
                          class="qz-save-student-btn qz-save-student-btn--team"
                          @click="saveTeamEvaluation(student)"
                          :disabled="isSaving"
                        >
                          <ion-icon :icon="peopleOutline"></ion-icon>
                          <span
                            >Guardar para el Equipo ({{
                              getTeamMembers(student.id).length
                            }})</span
                          >
                        </button>
                        <button
                          type="button"
                          class="qz-save-student-btn qz-save-individual-btn"
                          @click="saveSingleEvaluation(student)"
                          :disabled="isSaving"
                          :title="
                            'Guardar solo la calificación individual de ' +
                            (student.name || 'este estudiante')
                          "
                        >
                          <ion-icon :icon="personOutline"></ion-icon>
                          <span
                            >Solo para
                            {{
                              student.name
                                ? student.name.split(" ")[0]
                                : "este estudiante"
                            }}</span
                          >
                        </button>
                      </div>
                      <button
                        v-else
                        type="button"
                        class="qz-save-student-btn"
                        @click="saveSingleEvaluation(student)"
                        :disabled="isSaving"
                      >
                        <ion-icon :icon="saveOutline"></ion-icon>
                        <span>Guardar Evaluación</span>
                      </button>
                    </div>
                  </div>
                </ion-accordion>
              </ion-accordion-group>
            </div>
          </div>
        </div>
      </div>

      <!-- Import Excel Modal -->
      <ion-modal :is-open="showImportModal" @didDismiss="closeImportModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Importar Calificaciones</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeImportModal">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div
            class="upload-area"
            @dragover.prevent="importDragOver = true"
            @dragleave.prevent="importDragOver = false"
            @drop.prevent="handleImportDrop"
            @click="$refs.importFileInput.click()"
            :class="{ 'drag-over': importDragOver }"
          >
            <input
              type="file"
              ref="importFileInput"
              style="display: none"
              accept=".xlsx, .xls"
              @change="handleImportFileSelect"
            />
            <ion-icon :icon="cloudUploadOutline" class="upload-icon"></ion-icon>
            <p>Arrastra tu archivo Excel aquí o haz clic para seleccionarlo</p>
            <p v-if="importFileName">Archivo: {{ importFileName }}</p>
          </div>
          <ion-button
            expand="block"
            :disabled="!importFile"
            @click="processExcelImport"
          >
            Procesar Importación
          </ion-button>
        </ion-content>
      </ion-modal>

      <!-- Toasts -->
      <ion-toast
        :is-open="isSuccessToastOpen"
        :message="toastSuccessMessage"
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

      <!-- MODAL DE CALIFICACIÓN MASIVA DEL CURSO -->
      <ion-modal
        :is-open="showBulkModal"
        @didDismiss="closeBulkModal"
        class="qz-bulk-modal"
      >
        <div class="qz-bulk-modal-content">
          <div class="qz-bulk-modal-header">
            <div class="qz-bulk-modal-icon">
              <ion-icon :icon="flashOutline"></ion-icon>
            </div>
            <div class="qz-bulk-modal-titles">
              <h3 class="qz-bulk-modal-title">Calificación Masiva del Curso</h3>
              <p class="qz-bulk-modal-subtitle">
                Asigna un puntaje uniforme a todos los alumnos del curso ({{
                  students.length
                }})
              </p>
            </div>
            <button
              type="button"
              class="qz-modal-close-btn"
              @click="closeBulkModal"
            >
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>

          <div class="qz-bulk-modal-body">
            <!-- Puntajes por Criterio -->
            <div class="qz-bulk-section">
              <div class="qz-bulk-section-header-row">
                <label class="qz-bulk-section-label">
                  Define el puntaje a asignar para todos los alumnos:
                </label>
                <button
                  type="button"
                  class="qz-bulk-quick-btn"
                  @click="setBulkScoresToMax"
                  title="Asignar la nota máxima a todos los criterios"
                >
                  Puntaje máximo
                </button>
              </div>

              <div class="qz-bulk-criteria-list">
                <div
                  v-for="criterion in criteria"
                  :key="criterion.id"
                  class="qz-bulk-criterion-row"
                >
                  <div class="qz-bulk-criterion-info">
                    <span class="qz-bulk-criterion-name">{{
                      criterion.description
                    }}</span>
                    <span class="qz-bulk-criterion-max"
                      >Máx: {{ criterion.score }} pts</span
                    >
                  </div>
                  <div class="qz-bulk-input-wrap">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      :max="criterion.score"
                      v-model.number="bulkScores[criterion.id]"
                      class="qz-bulk-score-input"
                      :placeholder="String(criterion.score)"
                    />
                    <span class="qz-bulk-input-denom"
                      >/ {{ criterion.score }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer del modal -->
          <div class="qz-bulk-modal-footer">
            <button
              type="button"
              class="qz-bulk-confirm-btn"
              :disabled="students.length === 0 || isSaving"
              @click="applyBulkEvaluation"
            >
              <ion-icon :icon="flashOutline"></ion-icon>
              <span>
                Aplicar a todos los estudiantes ({{ students.length }})
              </span>
            </button>
            <button
              type="button"
              class="qz-bulk-cancel-btn"
              @click="closeBulkModal"
              :disabled="isSaving"
            >
              Cancelar
            </button>
          </div>
        </div>
      </ion-modal>

      <!-- ── MODAL DE ENTREGA EN FÍSICO (QUEEZY UI) ── -->
      <ion-modal
        :is-open="isPhysicalModalOpen"
        @didDismiss="closePhysicalModal"
        class="qz-physical-modal"
      >
        <div class="qz-physical-modal-content">
          <!-- Header -->
          <div class="qz-physical-modal-header">
            <div class="qz-physical-header-left">
              <div class="qz-physical-icon-wrap">
                <ion-icon :icon="documentAttachOutline"></ion-icon>
              </div>
              <div>
                <h3 class="qz-physical-title">Entrega en Físico</h3>
                <p class="qz-physical-sub">
                  Estudiante: <strong>{{ physicalModalStudent ? `${physicalModalStudent.lastName || ''} ${physicalModalStudent.name || ''}`.trim() : '' }}</strong>
                </p>
              </div>
            </div>
            <button type="button" class="qz-modal-close-btn" @click="closePhysicalModal">
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>

          <!-- Body -->
          <div class="qz-physical-modal-body">
            <span class="qz-physical-section-label">¿CÓMO ENTREGARON ESTE TRABAJO EN FÍSICO?</span>

            <!-- 1. Opción: Individual -->
            <div
              class="qz-delivery-card"
              :class="{ 'qz-delivery-card--active': physicalDeliveryMode === 'individual' }"
              @click="physicalDeliveryMode = 'individual'"
            >
              <div class="qz-delivery-card-radio">
                <span class="qz-radio-dot" v-if="physicalDeliveryMode === 'individual'"></span>
              </div>
              <div class="qz-delivery-card-info">
                <div class="qz-delivery-card-title-row">
                  <ion-icon :icon="personOutline"></ion-icon>
                  <strong>Entrega Individual</strong>
                  <span class="qz-badge-suggested">Por defecto</span>
                </div>
                <p class="qz-delivery-card-desc">
                  Marcar trabajo físico recibido únicamente para este estudiante.
                </p>
              </div>
            </div>

            <!-- 2. Opción: Equipo del curso (si tiene grupo activo) -->
            <div
              v-if="physicalCourseGroup"
              class="qz-delivery-card"
              :class="{ 'qz-delivery-card--active': physicalDeliveryMode === 'group' }"
              @click="physicalDeliveryMode = 'group'"
            >
              <div class="qz-delivery-card-radio">
                <span class="qz-radio-dot" v-if="physicalDeliveryMode === 'group'"></span>
              </div>
              <div class="qz-delivery-card-info">
                <div class="qz-delivery-card-title-row">
                  <ion-icon :icon="peopleOutline"></ion-icon>
                  <strong>Equipo: {{ physicalCourseGroup.name }}</strong>
                </div>
                <p class="qz-delivery-card-desc">
                  Integrantes ({{ physicalCourseGroupMembers.length }}):
                  {{ physicalCourseGroupMemberNames.join(', ') }}
                </p>
              </div>
            </div>

            <!-- 3. Opción: Pareja o Grupo Libre -->
            <div
              class="qz-delivery-card"
              :class="{ 'qz-delivery-card--active': physicalDeliveryMode === 'custom' }"
              @click="physicalDeliveryMode = 'custom'"
            >
              <div class="qz-delivery-card-radio">
                <span class="qz-radio-dot" v-if="physicalDeliveryMode === 'custom'"></span>
              </div>
              <div class="qz-delivery-card-info">
                <div class="qz-delivery-card-title-row">
                  <ion-icon :icon="personAddOutline"></ion-icon>
                  <strong>En Pareja o Grupo Libre</strong>
                </div>
                <p class="qz-delivery-card-desc">
                  Seleccionar compañeros específicos con quienes entregó este trabajo físico.
                </p>
              </div>
            </div>

            <!-- Selector de compañeros si es grupo libre -->
            <div v-if="physicalDeliveryMode === 'custom'" class="qz-custom-picker-section">
              <div class="qz-custom-search-wrap">
                <ion-icon :icon="searchOutline"></ion-icon>
                <input
                  type="text"
                  v-model="physicalSearchQuery"
                  placeholder="Buscar compañero de clase..."
                  class="qz-custom-search-input"
                />
              </div>

              <div class="qz-custom-members-list">
                <div
                  v-for="st in physicalFilteredStudents"
                  :key="st.id"
                  class="qz-custom-member-item"
                  :class="{
                    'qz-custom-member-item--self': physicalModalStudent && st.id === physicalModalStudent.id,
                    'qz-custom-member-item--selected': physicalCustomSelectedIds.has(st.id),
                  }"
                  @click="togglePhysicalCustomStudent(st.id)"
                >
                  <input
                    type="checkbox"
                    :checked="physicalCustomSelectedIds.has(st.id)"
                    :disabled="physicalModalStudent && st.id === physicalModalStudent.id"
                    class="qz-member-checkbox"
                    @click.stop
                    @change="togglePhysicalCustomStudent(st.id)"
                  />
                  <span class="qz-member-name">
                    {{ st.lastName || '' }} {{ st.name || '' }}
                    <small v-if="physicalModalStudent && st.id === physicalModalStudent.id" class="qz-self-badge">(Estudiante actual)</small>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="qz-physical-modal-footer">
            <button
              type="button"
              class="qz-btn qz-btn--cancel"
              @click="closePhysicalModal"
              :disabled="isSaving"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="qz-btn qz-btn--confirm"
              @click="confirmPhysicalDeliveryModal"
              :disabled="physicalTargetStudentIds.length === 0 || isSaving"
            >
              <ion-icon :icon="documentAttachOutline"></ion-icon>
              <span>
                {{
                  physicalTargetStudentIds.length === 1
                    ? 'Confirmar para 1 estudiante'
                    : `Confirmar para ${physicalTargetStudentIds.length} estudiantes en equipo`
                }}
              </span>
            </button>
          </div>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { tokenHeader, usuarioGet, basedeURL } from "../globalService";
import JSZip from "jszip";
import {
  useToast,
  calculateFinalGrade,
  saveCriterionScore,
} from "../composables/useEvaluation";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  onIonViewWillEnter,
  IonAccordionGroup,
  IonAccordion,
  alertController,
  actionSheetController,
  loadingController,
  IonIcon,
  IonToast,
  IonCheckbox,
  IonModal,
  IonSpinner,
} from "@ionic/vue";
import {
  arrowBackOutline,
  saveOutline,
  checkmarkDoneOutline,
  closeOutline,
  attachOutline,
  documentOutline,
  cloudUploadOutline,
  downloadOutline,
  peopleOutline,
  documentAttachOutline,
  documentTextOutline,
  helpCircleOutline,
  schoolOutline,
  flashOutline,
  personOutline,
  personAddOutline,
  searchOutline,
  eyeOutline,
  trashOutline,
} from "ionicons/icons";
import * as XLSX from "xlsx-js-style";
import CriterionList from "../components/CriterionList.vue";
import SingleCriterionStudentList from "../components/SingleCriterionStudentList.vue";
import EvidenceUploader from "../components/EvidenceUploader.vue";

export default {
  name: "RevisarActividad",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonAccordionGroup,
    IonAccordion,
    IonIcon,
    IonToast,
    IonCheckbox,
    IonModal,
    IonSpinner,
    CriterionList,
    SingleCriterionStudentList,
    EvidenceUploader,
  },
  setup() {
    const mroute = useRoute();
    const router = useRouter();
    const activityId = mroute.params.id;
    const usuario = ref(null);
    const periodId = ref(null);
    const instituteId = ref(null);

    const students = ref([]);
    const courseGroups = ref([]);
    const criteria = ref([]);
    const evaluation = ref({}); // { studentId: { criterionId: { value, id } } }
    const studentGrades = ref({});
    const currentlyOpenStudentId = ref(null);
    const isSaving = ref(false);

    // ─── Evidences State ───────────────────────────────────────────────────
    const evidences = ref({}); // { [studentId]: ActivityEvidence }

    // ─── Modal Calificación Masiva ─────────────────────────────────────────
    const showBulkModal = ref(false);
    const bulkScores = ref({}); // { [criterionId]: number }

    // ─── Activity info for UI and Excel export ─────────────────────────────
    const activityInfo = ref({
      area: "",
      grade: "",
      topic: "",
      lessonTopic: "",
    });

    // ─── Excel Import refs ──────────────────────────────────────────────────
    const showImportModal = ref(false);
    const importFile = ref(null);
    const importFileName = ref("");
    const importDragOver = ref(false);
    const importFileInput = ref(null);

    const {
      isSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setSuccessToastOpen,
      setErrorToastOpen,
    } = useToast();

    const toastSuccessMessage = ref("Evaluación guardada correctamente");
    const showSuccessToast = (msg = "Evaluación guardada correctamente") => {
      toastSuccessMessage.value = msg;
      setSuccessToastOpen(true);
    };

    usuario.value = usuarioGet();

    // ─── Navigation ────────────────────────────────────────────────────────
    const goBack = () => {
      router.push(`/actividades/${activityId}`);
    };

    // ─── Delivery Checks & Counters ────────────────────────────────────────
    const hasPhysicalDelivery = (studentId) => {
      const url = evidences.value[studentId]?.pdfUrl;
      return Boolean(url && url.startsWith("PHYSICAL"));
    };

    const hasDigitalEvidence = (studentId) => {
      const url = evidences.value[studentId]?.pdfUrl;
      return Boolean(url && !url.startsWith("PHYSICAL"));
    };

    const hasEvidence = (studentId) => {
      return !!evidences.value[studentId];
    };

    const physicalDeliveryCount = computed(() => {
      return students.value.filter((s) => hasPhysicalDelivery(s.id)).length;
    });

    const digitalDeliveryCount = computed(() => {
      return students.value.filter((s) => hasDigitalEvidence(s.id)).length;
    });

    const pendingDeliveryCount = computed(() => {
      return students.value.filter(
        (s) => !hasPhysicalDelivery(s.id) && !hasDigitalEvidence(s.id),
      ).length;
    });

    const areAllPhysical = computed(() => {
      if (students.value.length === 0) return false;
      return students.value.every((s) => hasPhysicalDelivery(s.id));
    });

    const isIndeterminatePhysical = computed(() => {
      return !areAllPhysical.value && physicalDeliveryCount.value > 0;
    });

    const deliveredCount = computed(() => {
      return students.value.filter((s) => hasEvidence(s.id)).length;
    });

    const areAllDelivered = computed(() => {
      if (students.value.length === 0) return false;
      return students.value.every((s) => hasEvidence(s.id));
    });

    const isIndeterminateDelivered = computed(() => {
      return !areAllDelivered.value && deliveredCount.value > 0;
    });

    // ─── Delivery Actions ──────────────────────────────────────────────────
    const togglePhysicalDelivery = async (studentId, isChecked) => {
      const previous = evidences.value[studentId];

      // Optimistic update
      if (isChecked) {
        evidences.value = {
          ...evidences.value,
          [studentId]: {
            ...(previous || {}),
            studentId,
            activityId: parseInt(activityId, 10),
            pdfUrl: "PHYSICAL",
            filename: "Entrega en físico",
          },
        };
      } else {
        if (previous?.pdfUrl?.startsWith("PHYSICAL")) {
          const next = { ...evidences.value };
          delete next[studentId];
          evidences.value = next;
        }
      }

      try {
        await axios.post(
          "/activity-evidences/physical",
          {
            studentId,
            activityId: parseInt(activityId, 10),
            instituteId: instituteId.value || usuario.value?.institute?.id || 1,
            delivered: isChecked,
          },
          tokenHeader(),
        );
      } catch (err) {
        console.error("Error toggling physical delivery:", err);
        // Rollback
        if (previous) {
          evidences.value = { ...evidences.value, [studentId]: previous };
        } else {
          const next = { ...evidences.value };
          delete next[studentId];
          evidences.value = next;
        }
        setErrorToastOpen(true, "Error al actualizar la entrega en físico.");
      }
    };

    const toggleBulkPhysicalDelivery = async (
      studentIds,
      isChecked,
      isGroup = false,
      customSharedToken = null,
    ) => {
      if (!studentIds || studentIds.length === 0) return;
      const prevEvidences = { ...evidences.value };
      const nextEvidences = { ...evidences.value };
      const token = isGroup
        ? customSharedToken ||
          `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        : null;
      const sharedTag = isGroup ? `PHYSICAL_GROUP_${token}` : "PHYSICAL";
      const filename = isGroup
        ? "Entrega física en equipo"
        : "Entrega en físico";

      studentIds.forEach((sId) => {
        if (isChecked) {
          if (
            !nextEvidences[sId]?.pdfUrl ||
            nextEvidences[sId]?.pdfUrl.startsWith("PHYSICAL")
          ) {
            nextEvidences[sId] = {
              ...(nextEvidences[sId] || {}),
              studentId: sId,
              activityId: parseInt(activityId, 10),
              pdfUrl: sharedTag,
              filename,
            };
          }
        } else {
          if (nextEvidences[sId]?.pdfUrl?.startsWith("PHYSICAL")) {
            delete nextEvidences[sId];
          }
        }
      });
      evidences.value = nextEvidences;

      try {
        await axios.post(
          "/activity-evidences/physical-bulk",
          {
            studentIds,
            activityId: parseInt(activityId, 10),
            instituteId: instituteId.value || usuario.value?.institute?.id || 1,
            delivered: isChecked,
            isGroup,
            sharedToken: token || undefined,
          },
          tokenHeader(),
        );
        if (isGroup && isChecked) {
          await fetchAllEvidences(activityId);
        }
        showSuccessToast(
          isChecked
            ? isGroup
              ? `Entrega física registrada para el equipo (${studentIds.length} alumnos)`
              : "Entregas físicas registradas"
            : "Entregas físicas desmarcadas",
        );
      } catch (err) {
        console.error("Error in bulk physical delivery:", err);
        evidences.value = prevEvidences;
        setErrorToastOpen(
          true,
          "Error al actualizar la entrega física en bloque.",
        );
      }
    };

    const executeCourseGroupsPhysicalDelivery = async () => {
      // Filtrar estudiantes sin entrega digital
      const targetStudentIds = students.value
        .filter((s) => !hasDigitalEvidence(s.id))
        .map((s) => s.id);

      if (targetStudentIds.length === 0) {
        showSuccessToast("Todos los estudiantes ya cuentan con entrega.");
        return;
      }

      const assignedIds = new Set();
      const promises = [];

      // 1. Para cada equipo del curso activo:
      for (const group of courseGroups.value) {
        const groupMembers = (group.usersToGroup || [])
          .filter(
            (utg) =>
              utg.active === true ||
              utg.active === 1 ||
              utg.active === "true" ||
              utg.active === "1"
          )
          .map((utg) => Number(utg.user?.id || utg.userId))
          .filter((id) => targetStudentIds.includes(id));

        if (groupMembers.length > 0) {
          groupMembers.forEach((id) => assignedIds.add(id));
          // Generar token único identificando el equipo del curso
          const groupToken = `course_${group.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          promises.push(
            toggleBulkPhysicalDelivery(
              groupMembers,
              true,
              true,
              groupToken
            )
          );
        }
      }

      // 2. Estudiantes que no pertenecen a ningún equipo del curso:
      const ungroupedIds = targetStudentIds.filter((id) => !assignedIds.has(id));
      if (ungroupedIds.length > 0) {
        promises.push(toggleBulkPhysicalDelivery(ungroupedIds, true, false));
      }

      await Promise.all(promises);
      await fetchAllEvidences(activityId);
      showSuccessToast(
        "Entregas en físico registradas según los equipos de trabajo del curso."
      );
    };

    const toggleAllPhysical = async (isChecked) => {
      if (students.value.length === 0) return;

      if (!isChecked) {
        // Desmarcar todos los que están en físico
        const physicalStudents = students.value.filter((s) =>
          hasPhysicalDelivery(s.id)
        );
        if (physicalStudents.length === 0) return;

        const alert = await alertController.create({
          header: "Desmarcar entregas en físico",
          message:
            "¿Deseas desmarcar las entregas en físico de los estudiantes? Las evidencias digitales se conservarán intactas.",
          buttons: [
            { text: "Cancelar", role: "cancel" },
            {
              text: "Desmarcar en físico",
              role: "destructive",
              handler: async () => {
                const studentIds = physicalStudents.map((s) => s.id);
                await toggleBulkPhysicalDelivery(studentIds, false, false);
              },
            },
          ],
        });
        await alert.present();
        return;
      }

      // isChecked === true: Preguntar si es individual o con los equipos de trabajo del curso
      const availableCourseGroups =
        courseGroups.value && courseGroups.value.length > 0;

      if (availableCourseGroups) {
        const actionSheet = await actionSheetController.create({
          header: "Marcar todos en físico",
          subHeader:
            "¿La entrega en físico es individual o con los equipos de trabajo del curso?",
          buttons: [
            {
              text: "Individual (Cada estudiante por separado)",
              icon: personOutline,
              handler: async () => {
                const targetIds = students.value
                  .filter((s) => !hasDigitalEvidence(s.id))
                  .map((s) => s.id);
                if (targetIds.length > 0) {
                  await toggleBulkPhysicalDelivery(targetIds, true, false);
                }
              },
            },
            {
              text: `Con los equipos de trabajo del curso (${courseGroups.value.length} equipos)`,
              icon: peopleOutline,
              handler: async () => {
                await executeCourseGroupsPhysicalDelivery();
              },
            },
            {
              text: "Cancelar",
              icon: closeOutline,
              role: "cancel",
            },
          ],
        });
        await actionSheet.present();
      } else {
        const alert = await alertController.create({
          header: "Marcar todos en físico",
          message:
            "No hay equipos de trabajo registrados en este curso. Se marcarán todos los estudiantes sin evidencia digital como entrega física individual. ¿Deseas continuar?",
          buttons: [
            { text: "Cancelar", role: "cancel" },
            {
              text: "Marcar en físico",
              handler: async () => {
                const targetIds = students.value
                  .filter((s) => !hasDigitalEvidence(s.id))
                  .map((s) => s.id);
                if (targetIds.length > 0) {
                  await toggleBulkPhysicalDelivery(targetIds, true, false);
                }
              },
            },
          ],
        });
        await alert.present();
      }
    };

    // ─── Team / Group Delivery & Evaluation Helpers ─────────────────────────
    const getStudentCourseGroup = (studentId) => {
      if (!courseGroups.value || courseGroups.value.length === 0) return null;
      const targetGroup = courseGroups.value.find((g) => {
        const isGroupActive =
          g.active === true || g.active === 1 || g.active === "true";
        if (!isGroupActive) return false;
        return g.usersToGroup?.some((utg) => {
          const isMemberActive =
            utg.active === true ||
            utg.active === 1 ||
            utg.active === "true" ||
            utg.active === "1";
          const matchesId =
            Number(utg.user?.id || utg.userId) === Number(studentId);
          return matchesId && isMemberActive;
        });
      });

      if (!targetGroup) return null;

      // Return group with only active usersToGroup
      return {
        ...targetGroup,
        usersToGroup: (targetGroup.usersToGroup || []).filter((utg) => {
          const isMemberActive =
            utg.active === true ||
            utg.active === 1 ||
            utg.active === "true" ||
            utg.active === "1";
          return isMemberActive && (utg.user || utg.userId);
        }),
      };
    };

    const getLinkedTeammates = (studentId) => {
      const ev = evidences.value[studentId];
      if (!ev || !ev.pdfUrl || ev.pdfUrl === "PHYSICAL") return [];
      return students.value.filter(
        (s) =>
          Number(s.id) !== Number(studentId) &&
          evidences.value[s.id]?.pdfUrl === ev.pdfUrl,
      );
    };

    const getTeamMembers = (studentId) => {
      // Solo existe trabajo en equipo si hay una evidencia digital o física anexa vinculada a un grupo
      const linked = getLinkedTeammates(studentId);
      if (linked.length > 0) {
        const selfStudent = students.value.find(
          (s) => Number(s.id) === Number(studentId),
        );
        return [selfStudent, ...linked].filter(Boolean);
      }
      return [];
    };

    // ─── Modal Entrega en Físico State & Methods ────────────────────────────
    const isPhysicalModalOpen = ref(false);
    const physicalModalStudent = ref(null);
    const physicalDeliveryMode = ref("individual"); // 'individual' | 'group' | 'custom'
    const physicalCustomSelectedIds = ref(new Set());
    const physicalSearchQuery = ref("");

    const physicalCourseGroup = computed(() => {
      if (!physicalModalStudent.value) return null;
      return getStudentCourseGroup(physicalModalStudent.value.id);
    });

    const physicalCourseGroupMembers = computed(() => {
      if (!physicalCourseGroup.value?.usersToGroup) return [];
      const memberIds = physicalCourseGroup.value.usersToGroup
        .map((utg) => Number(utg.user?.id || utg.userId))
        .filter(Boolean);
      return students.value.filter((s) => memberIds.includes(Number(s.id)));
    });

    const physicalCourseGroupMemberNames = computed(() => {
      return physicalCourseGroupMembers.value.map(
        (m) => `${m.lastName || ""} ${m.name || ""}`.trim(),
      );
    });

    const physicalFilteredStudents = computed(() => {
      const q = (physicalSearchQuery.value || "").trim().toLowerCase();
      if (!q) return students.value;
      return students.value.filter((st) => {
        const full = `${st.name || ""} ${st.lastName || ""} ${st.code || ""}`.toLowerCase();
        return full.includes(q);
      });
    });

    const physicalTargetStudentIds = computed(() => {
      if (!physicalModalStudent.value) return [];
      const currentId = Number(physicalModalStudent.value.id);

      if (physicalDeliveryMode.value === "group" && physicalCourseGroup.value) {
        const ids = physicalCourseGroupMembers.value.map((m) => Number(m.id));
        if (!ids.includes(currentId)) ids.push(currentId);
        return ids;
      }

      if (physicalDeliveryMode.value === "custom") {
        const ids = Array.from(physicalCustomSelectedIds.value).map(Number);
        if (!ids.includes(currentId)) ids.push(currentId);
        return ids;
      }

      // Individual
      return [currentId];
    });

    const togglePhysicalCustomStudent = (sId) => {
      if (!physicalModalStudent.value) return;
      const numId = Number(sId);
      if (numId === Number(physicalModalStudent.value.id)) return; // Keep self selected
      const next = new Set(physicalCustomSelectedIds.value);
      if (next.has(numId)) {
        next.delete(numId);
      } else {
        next.add(numId);
      }
      physicalCustomSelectedIds.value = next;
    };

    const closePhysicalModal = () => {
      isPhysicalModalOpen.value = false;
      physicalModalStudent.value = null;
      physicalDeliveryMode.value = "individual";
      physicalCustomSelectedIds.value = new Set();
      physicalSearchQuery.value = "";
    };

    const confirmPhysicalDeliveryModal = async () => {
      const ids = physicalTargetStudentIds.value;
      if (!ids || ids.length === 0 || !physicalModalStudent.value) return;
      const studentId = physicalModalStudent.value.id;
      const isGroup = ids.length > 1;

      let customToken = null;
      if (physicalDeliveryMode.value === "group" && physicalCourseGroup.value) {
        customToken = `course_${physicalCourseGroup.value.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      } else if (physicalDeliveryMode.value === "custom" && isGroup) {
        customToken = `free_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }

      closePhysicalModal();

      if (isGroup) {
        await toggleBulkPhysicalDelivery(ids, true, true, customToken);
      } else {
        await togglePhysicalDelivery(studentId, true);
      }
    };

    const handleStudentRowCheckbox = async (student) => {
      // 1. Si cuenta con entrega digital con anexo:
      if (hasDigitalEvidence(student.id)) {
        const ev = evidences.value[student.id];
        const actionSheet = await actionSheetController.create({
          header: `Entrega Digital: ${student.name} ${student.lastName || ""}`,
          subHeader: `Archivo: ${ev?.filename || "Evidencia digital adjunta"}`,
          buttons: [
            {
              text: "Ver archivo adjunto",
              icon: eyeOutline,
              handler: () => {
                if (ev?.pdfUrl) {
                  let baseUrl = basedeURL() || "";
                  if (baseUrl && !baseUrl.endsWith("/")) baseUrl += "/";
                  window.open(baseUrl + ev.pdfUrl, "_blank");
                }
              },
            },
            {
              text: "Cambiar a entrega física",
              icon: documentAttachOutline,
              handler: async () => {
                await togglePhysicalDelivery(student.id, true);
              },
            },
            {
              text: "Eliminar entrega digital",
              icon: trashOutline,
              role: "destructive",
              handler: async () => {
                if (ev?.id) {
                  try {
                    await axios.delete(
                      `/activity-evidences/${ev.id}`,
                      tokenHeader()
                    );
                    const next = { ...evidences.value };
                    delete next[student.id];
                    evidences.value = next;
                    showSuccessToast("Entrega digital eliminada");
                  } catch (err) {
                    console.error("Error al eliminar evidencia:", err);
                    setErrorToastOpen(
                      true,
                      "No se pudo eliminar la entrega digital."
                    );
                  }
                }
              },
            },
            {
              text: "Cancelar",
              icon: closeOutline,
              role: "cancel",
            },
          ],
        });
        await actionSheet.present();
        return;
      }

      // 2. Si cuenta con entrega física (sin anexo):
      const isCurrentlyPhysical = hasPhysicalDelivery(student.id);

      if (isCurrentlyPhysical) {
        const ev = evidences.value[student.id];
        const isShared = ev?.pdfUrl && ev.pdfUrl.startsWith("PHYSICAL_GROUP_");
        const teammates = isShared ? getLinkedTeammates(student.id) : [];

        if (isShared && teammates.length > 0) {
          const actionSheet = await actionSheetController.create({
            header: `Entrega física de equipo (${teammates.length + 1} alumnos)`,
            subHeader:
              "¿Deseas retirar la entrega física solo para este estudiante o para todo el equipo?",
            buttons: [
              {
                text: `Solo para ${
                  student.name ? student.name.split(" ")[0] : "este estudiante"
                }`,
                icon: personOutline,
                handler: async () => {
                  await togglePhysicalDelivery(student.id, false);
                },
              },
              {
                text: `Para todo el equipo (${teammates.length + 1})`,
                icon: peopleOutline,
                role: "destructive",
                handler: async () => {
                  const allIds = [student.id, ...teammates.map((t) => t.id)];
                  await toggleBulkPhysicalDelivery(allIds, false, false);
                },
              },
              {
                text: "Cancelar",
                icon: closeOutline,
                role: "cancel",
              },
            ],
          });
          await actionSheet.present();
        } else {
          await togglePhysicalDelivery(student.id, false);
        }
      } else {
        // 3. Sin entrega: asumir entrega física
        if (students.value && students.value.length > 1) {
          physicalModalStudent.value = student;
          physicalDeliveryMode.value = "individual";
          physicalCustomSelectedIds.value = new Set([student.id]);
          physicalSearchQuery.value = "";
          isPhysicalModalOpen.value = true;
        } else {
          await togglePhysicalDelivery(student.id, true);
        }
      }
    };

    const saveTeamEvaluation = async (student) => {
      const allMembers = getTeamMembers(student.id);
      const teammates = allMembers.filter(
        (m) => Number(m.id) !== Number(student.id),
      );
      if (allMembers.length <= 1) {
        await saveSingleEvaluation(student);
        return;
      }

      const teamNames = allMembers
        .map((m) => `${m.lastName || ""} ${m.name || ""}`.trim())
        .join(", ");

      const alert = await alertController.create({
        header: "Guardar para el Equipo",
        message: `Esta nota se aplicará a:<br><br><b>${teamNames}</b><br><br>¿Deseas continuar?`,
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Confirmar",
            handler: async () => {
              await executeTeamEvaluation(student, allMembers, teammates);
            },
          },
        ],
      });
      await alert.present();
    };

    const executeTeamEvaluation = async (student, allMembers, teammates) => {
      isSaving.value = true;
      try {
        const studentScores = evaluation.value[student.id];
        if (studentScores) {
          teammates.forEach((tm) => {
            if (!evaluation.value[tm.id]) evaluation.value[tm.id] = {};
            for (const cId in studentScores) {
              if (!evaluation.value[tm.id][cId]) {
                evaluation.value[tm.id][cId] = { value: null, id: null };
              }
              evaluation.value[tm.id][cId].value = studentScores[cId].value;
            }
            updateGrade(tm);
          });
        }
        await Promise.all(allMembers.map((m) => saveEvaluation(m)));
        showSuccessToast(
          `Calificación guardada para todo el equipo (${allMembers.length} alumnos)`,
        );
        await fetchStudentCriterionScores(activityId);
      } catch (err) {
        console.error("Error guardando evaluación de equipo:", err);
      } finally {
        isSaving.value = false;
      }
    };

    const handleSaveSingleCriterion = async (student) => {
      const allMembers = getTeamMembers(student.id);
      const teammates = allMembers.filter(
        (m) => Number(m.id) !== Number(student.id),
      );
      if (teammates.length > 0) {
        const teamNames = allMembers
          .map((t) => `${t.lastName || ""} ${t.name || ""}`.trim())
          .join(", ");
        const alert = await alertController.create({
          header: "Guardar Calificación",
          message: `${student.name} pertenece a un equipo con ${
            teammates.length
          } compañero(s):<br><b>${teamNames}</b>.<br><br>¿Cómo deseas guardar la calificación?`,
          buttons: [
            { text: "Cancelar", role: "cancel" },
            {
              text: `Solo para ${
                student.name ? student.name.split(" ")[0] : "este estudiante"
              }`,
              handler: () => {
                saveSingleEvaluation(student);
              },
            },
            {
              text: `Para todo el equipo (${allMembers.length})`,
              handler: () => {
                executeTeamEvaluation(student, allMembers, teammates);
              },
            },
          ],
        });
        await alert.present();
      } else {
        saveSingleEvaluation(student);
      }
    };

    // ─── Modal Calificación Masiva Methods ───────────────────────────────────
    const openBulkModal = () => {
      const initial = {};
      criteria.value.forEach((c) => {
        initial[c.id] = c.score;
      });
      bulkScores.value = initial;
      showBulkModal.value = true;
    };

    const closeBulkModal = () => {
      showBulkModal.value = false;
    };

    const setBulkScoresToMax = () => {
      const updated = {};
      criteria.value.forEach((c) => {
        updated[c.id] = c.score;
      });
      bulkScores.value = updated;
    };

    const applyBulkEvaluation = async () => {
      const targetList = students.value;
      if (targetList.length === 0) return;

      isSaving.value = true;
      try {
        for (const student of targetList) {
          if (!evaluation.value[student.id]) {
            evaluation.value[student.id] = {};
          }
          for (const criterion of criteria.value) {
            const score = bulkScores.value[criterion.id];
            if (score !== undefined && score !== null && !isNaN(score)) {
              const clamped = Math.min(
                Math.max(Number(score), 0),
                criterion.score,
              );
              if (!evaluation.value[student.id][criterion.id]) {
                evaluation.value[student.id][criterion.id] = {
                  value: null,
                  id: null,
                };
              }
              evaluation.value[student.id][criterion.id].value = clamped;
            }
          }
          updateGrade(student);
        }

        await Promise.all(targetList.map((student) => saveEvaluation(student)));
        showSuccessToast(
          `Calificación masiva aplicada a todos los estudiantes (${targetList.length})`,
        );
        closeBulkModal();
        await fetchStudentCriterionScores(activityId);
      } catch (err) {
        console.error("Error aplicando evaluación masiva:", err);
        setErrorToastOpen(true, "Error al guardar calificaciones masivas.");
      } finally {
        isSaving.value = false;
      }
    };

    const handleEvidenceChanged = ({ studentId, evidence }) => {
      const next = { ...evidences.value };
      if (evidence) {
        next[studentId] = evidence;
      } else {
        delete next[studentId];
      }
      evidences.value = next;
    };

    const handleEvidenceBulkChanged = ({ studentIds, evidence }) => {
      const next = { ...evidences.value };
      (studentIds || []).forEach((id) => {
        if (evidence) {
          next[id] = { ...evidence, studentId: id };
        } else {
          delete next[id];
        }
      });
      evidences.value = next;
    };

    const handleEvidenceBulkDelete = ({ pdfUrl }) => {
      const next = { ...evidences.value };
      Object.keys(next).forEach((sId) => {
        if (next[sId]?.pdfUrl === pdfUrl) {
          delete next[sId];
        }
      });
      evidences.value = next;
    };

    const getSharedStudentNames = (studentId) => {
      const ev = evidences.value[studentId];
      if (!ev || !ev.pdfUrl || ev.pdfUrl === "PHYSICAL") return [];
      const names = [];
      for (const s of students.value) {
        const sEv = evidences.value[s.id];
        if (sEv && sEv.pdfUrl === ev.pdfUrl) {
          names.push(`${s.name || ""} ${s.lastName || ""}`.trim());
        }
      }
      return names;
    };

    // ─── Excel Import helpers ───────────────────────────────────────────────
    const closeImportModal = () => {
      showImportModal.value = false;
      importFile.value = null;
      importFileName.value = "";
      importDragOver.value = false;
    };

    const presentImportExportOptions = async () => {
      const actionSheet = await actionSheetController.create({
        header: "Opciones de Excel",
        buttons: [
          {
            text: "Importar calificaciones",
            icon: cloudUploadOutline,
            handler: () => {
              showImportModal.value = true;
            },
          },
          {
            text: "Exportar plantilla base",
            icon: downloadOutline,
            handler: () => {
              presentExportOptions();
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
            icon: closeOutline,
          },
        ],
      });
      await actionSheet.present();
    };

    const presentExportOptions = async () => {
      const actionSheet = await actionSheetController.create({
        header: "Formato de exportación",
        buttons: [
          {
            text: "Solo Excel",
            icon: documentOutline,
            handler: () => {
              exportBaseExcel();
            },
          },
          {
            text: "Zip completo",
            icon: documentOutline,
            handler: () => {
              exportZip();
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
            icon: closeOutline,
          },
        ],
      });
      await actionSheet.present();
    };

    const getExportFileName = () => {
      const a = activityInfo.value;
      return `calificar "${a.topic} - ${a.lessonTopic} - ${a.grade}"`;
    };

    const buildWorkbook = () => {
      const wsData = [];
      wsData.push(["Area", activityInfo.value.area]);
      wsData.push(["Grado", activityInfo.value.grade]);
      wsData.push(["Actividad", activityInfo.value.topic]);
      wsData.push([]);
      wsData.push([]);
      wsData.push([]);

      const ptsRow = new Array(criteria.value.length + 2).fill(null);
      criteria.value.forEach((c, i) => {
        ptsRow[i + 2] = `Pts: ${c.score}`;
      });
      wsData.push(ptsRow);

      const criteriaRow = new Array(criteria.value.length + 2).fill(null);
      criteria.value.forEach((c, i) => {
        criteriaRow[i + 2] = c.description;
      });
      wsData.push(criteriaRow);

      students.value.forEach((student) => {
        wsData.push([student.code, `${student.lastName} ${student.name}`]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [
        { wch: 15 },
        { wch: 30 },
        ...criteria.value.map(() => ({ wch: 15 })),
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
      return wb;
    };

    const exportBaseExcel = () => {
      const wb = buildWorkbook();
      XLSX.writeFile(wb, `${getExportFileName()}.xlsx`);
    };

    const exportZip = async () => {
      const zip = new JSZip();
      const fileName = getExportFileName();
      const wb = buildWorkbook();
      const xlsxData = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      zip.file(`${fileName}.xlsx`, xlsxData);

      const baseUrl = basedeURL();
      const evidenceFolder = zip.folder("evidencias");

      const fetchPromises = students.value.map(async (student) => {
        try {
          const response = await axios.get(
            `/activity-evidences/activity/${activityId}/student/${student.id}`,
            tokenHeader(),
          );
          if (
            response.data &&
            response.data.pdfUrl &&
            response.data.pdfUrl !== "PHYSICAL"
          ) {
            const fileUrl = baseUrl + response.data.pdfUrl;
            const fileResponse = await axios.get(fileUrl, {
              responseType: "arraybuffer",
            });
            const firstName = (student.name || "").split(/\s+/)[0];
            const lastName = (student.lastName || "").split(/\s+/)[0];
            const folderName = `${student.code}_${lastName}_${firstName}`;
            const ext = response.data.pdfUrl.split(".").pop() || "pdf";
            evidenceFolder.file(`${folderName}.${ext}`, fileResponse.data);
          }
        } catch (error) {
          console.error(
            `Error descargando evidencia de ${student.name}:`,
            error,
          );
        }
      });

      await Promise.all(fetchPromises);
      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    };

    const handleImportFileSelect = (event) => {
      const selected = event.target.files[0];
      if (selected && /\.(xlsx|xls)$/i.test(selected.name)) {
        importFile.value = selected;
        importFileName.value = selected.name;
      } else {
        alertController
          .create({
            header: "Error",
            message:
              "Por favor, seleccione un archivo Excel válido (.xlsx o .xls).",
            buttons: ["OK"],
          })
          .then((alert) => alert.present());
      }
    };

    const handleImportDrop = (event) => {
      importDragOver.value = false;
      const dropped = event.dataTransfer.files[0];
      if (dropped && /\.(xlsx|xls)$/i.test(dropped.name)) {
        importFile.value = dropped;
        importFileName.value = dropped.name;
      } else {
        alertController
          .create({
            header: "Error",
            message:
              "Por favor, arrastre un archivo Excel válido (.xlsx o .xls).",
            buttons: ["OK"],
          })
          .then((alert) => alert.present());
      }
    };

    const cleanExcelCode = (raw) => {
      if (raw == null) return "";
      return String(raw).replace(/[.,]/g, "").trim();
    };

    const processExcelImport = async () => {
      if (!importFile.value) return;

      try {
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsArrayBuffer(importFile.value);
        });

        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const range = XLSX.utils.decode_range(worksheet["!ref"]);

        const STUDENT_START_ROW = 8;
        const CRITERIA_ROW = 7;
        const CRITERIA_START_COL = 2;

        const studentCodes = [];
        for (let r = STUDENT_START_ROW; r <= range.e.r; r++) {
          const cellAddress = { r, c: 0 };
          const cell = worksheet[XLSX.utils.encode_cell(cellAddress)];
          if (cell && cell.v != null && String(cell.v).trim() !== "") {
            studentCodes.push({
              raw: String(cell.v).trim(),
              clean: cleanExcelCode(cell.v),
              excelRow: r + 1,
            });
          }
        }

        if (studentCodes.length === 0) {
          alertController
            .create({
              header: "Error",
              message:
                "No se encontraron códigos de estudiantes en la columna A (desde la fila 9).",
              buttons: ["OK"],
            })
            .then((alert) => alert.present());
          return;
        }

        const criterionNames = [];
        for (let c = CRITERIA_START_COL; c <= range.e.c; c++) {
          const cellAddress = { r: CRITERIA_ROW, c };
          const cell = worksheet[XLSX.utils.encode_cell(cellAddress)];
          if (cell && cell.v != null && String(cell.v).trim() !== "") {
            criterionNames.push({
              name: String(cell.v).trim(),
              excelCol: c,
            });
          }
        }

        if (criterionNames.length === 0) {
          alertController
            .create({
              header: "Error",
              message:
                "No se encontraron nombres de criterios en la fila 8 (desde la columna C).",
              buttons: ["OK"],
            })
            .then((alert) => alert.present());
          return;
        }

        const criteriaMismatches = [];
        const matchedCriteria = [];

        for (const excelC of criterionNames) {
          const found = criteria.value.find(
            (c) => c.description === excelC.name,
          );
          if (found) {
            matchedCriteria.push({
              criterion: found,
              excelCol: excelC.excelCol,
            });
          } else {
            criteriaMismatches.push(excelC.name);
          }
        }

        if (criteriaMismatches.length > 0) {
          const message = `
            <p><b>No se puede continuar.</b> Los siguientes nombres de criterios en el Excel no coinciden con los criterios de la actividad:</p>
            <ul>${criteriaMismatches
              .map((n) => `<li>"${n}"</li>`)
              .join("")}</ul>
            <p>Verifique que los nombres en el Excel sean idénticos a los criterios configurados.</p>
          `;
          await alertController
            .create({
              header: "Discordancia de Criterios",
              message,
              buttons: ["OK"],
            })
            .then((alert) => alert.present());
          return;
        }

        const codeToExcelRow = new Map();
        for (const entry of studentCodes) {
          codeToExcelRow.set(entry.clean, entry.excelRow);
        }

        const notInExcel = [];
        const foundStudents = [];

        for (const student of students.value) {
          const cleanedCode = cleanExcelCode(student.code);
          const excelRow = codeToExcelRow.get(cleanedCode);
          if (excelRow != null) {
            foundStudents.push({ student, excelRow });
          } else {
            notInExcel.push(
              `${student.code} - ${student.lastName} ${student.name}`,
            );
          }
        }

        if (foundStudents.length === 0) {
          alertController
            .create({
              header: "Error",
              message:
                "Ningún estudiante de la lista fue encontrado en el archivo Excel.",
              buttons: ["OK"],
            })
            .then((alert) => alert.present());
          return;
        }

        if (notInExcel.length > 0) {
          const alert = await alertController.create({
            header: "Estudiantes no encontrados en Excel",
            message: `
              <p>Los siguientes estudiantes de la lista no aparecen en el Excel:</p>
              <ul>${notInExcel.map((s) => `<li>${s}</li>`).join("")}</ul>
              <p>¿Desea continuar solo con los ${
                foundStudents.length
              } estudiantes encontrados en el Excel?</p>
            `,
            buttons: [
              { text: "Cancelar", role: "cancel" },
              { text: "Continuar", role: "confirm" },
            ],
          });
          await alert.present();
          const { role } = await alert.onDidDismiss();
          if (role !== "confirm") return;
        }

        const studentsWithExisting = foundStudents.filter(({ student }) => {
          return matchedCriteria.some(({ criterion }) => {
            const entry = evaluation.value[student.id]?.[criterion.id];
            return entry && entry.value !== null;
          });
        });

        let overwriteMode = "skip";

        if (studentsWithExisting.length > 0) {
          const namesList = studentsWithExisting
            .map(({ student }) => `${student.lastName} ${student.name}`)
            .join(", ");

          const alert = await alertController.create({
            header: "Valores existentes",
            message: `
              <p>Los siguientes estudiantes ya tienen calificaciones:</p>
              <p><b>${namesList}</b></p>
              <p>¿Qué desea hacer con estos estudiantes?</p>
            `,
            buttons: [
              { text: "Cancelar todo", role: "cancel" },
              {
                text: "Omitir (mantener existentes)",
                handler: () => {
                  overwriteMode = "skip";
                },
              },
              {
                text: "Sobrescribir",
                handler: () => {
                  overwriteMode = "overwrite";
                },
              },
            ],
          });
          await alert.present();
          const { role } = await alert.onDidDismiss();
          if (role === "cancel") return;
        }

        const violations = [];
        for (const { student, excelRow } of foundStudents) {
          for (const { criterion, excelCol } of matchedCriteria) {
            const cellAddress = { r: excelRow - 1, c: excelCol };
            const cell = worksheet[XLSX.utils.encode_cell(cellAddress)];
            let value = null;

            if (cell && cell.v != null) {
              value = typeof cell.v === "number" ? cell.v : parseFloat(cell.v);
              if (isNaN(value)) value = null;
            }

            if (value !== null && value > criterion.score) {
              violations.push({
                student: `${student.lastName} ${student.name}`,
                criterion: criterion.description,
                value,
                max: criterion.score,
              });
            }
          }
        }

        if (violations.length > 0) {
          const rows = violations
            .map(
              (v) =>
                `<li><b>${v.student}</b> - ${v.criterion}: <b>${v.value}</b> (máx: ${v.max})</li>`,
            )
            .join("");
          const alert = await alertController.create({
            header: "Valores fuera de rango",
            message: `
              <p>Los siguientes valores superan el puntaje máximo del criterio:</p>
              <ul>${rows}</ul>
              <p>Corrija el archivo e intente de nuevo.</p>
            `,
            buttons: ["OK"],
          });
          await alert.present();
          return;
        }

        let importedCount = 0;
        for (const { student, excelRow } of foundStudents) {
          if (overwriteMode === "skip") {
            const hasAnyValue = matchedCriteria.some(({ criterion }) => {
              const entry = evaluation.value[student.id]?.[criterion.id];
              return entry && entry.value !== null;
            });
            if (hasAnyValue) continue;
          }

          for (const { criterion, excelCol } of matchedCriteria) {
            const cellAddress = { r: excelRow - 1, c: excelCol };
            const cell = worksheet[XLSX.utils.encode_cell(cellAddress)];
            let value = null;

            if (cell && cell.v != null) {
              value = typeof cell.v === "number" ? cell.v : parseFloat(cell.v);
              if (isNaN(value)) value = null;
            }

            if (
              evaluation.value[student.id] &&
              evaluation.value[student.id][criterion.id]
            ) {
              evaluation.value[student.id][criterion.id].value = value;
            }
          }

          updateGrade(student);
          importedCount++;
        }

        closeImportModal();
        await alertController
          .create({
            header: "Importación exitosa",
            message: `Se importaron calificaciones para ${importedCount} de ${foundStudents.length} estudiantes encontrados.`,
            buttons: ["OK"],
          })
          .then((alert) => alert.present());
      } catch (error) {
        console.error("Error procesando Excel:", error);
        alertController
          .create({
            header: "Error",
            message:
              "Ocurrió un error al procesar el archivo Excel. Verifique que el formato sea correcto.",
            buttons: ["OK"],
          })
          .then((alert) => alert.present());
      }
    };

    // ─── Helpers for CriterionList v-model ───────────────────────────────────
    const getStudentFlat = (student) => {
      const flat = {};
      if (!evaluation.value[student.id]) return flat;
      for (const cId in evaluation.value[student.id]) {
        flat[cId] = evaluation.value[student.id][cId]?.value ?? null;
      }
      return flat;
    };

    const onStudentEvalUpdate = (newFlat, student) => {
      if (!evaluation.value[student.id]) return;
      for (const cId in newFlat) {
        if (evaluation.value[student.id][cId] !== undefined) {
          evaluation.value[student.id][cId].value = newFlat[cId];
        }
      }
      updateGrade(student);
    };

    // ─── Single-criterion mode helpers ───────────────────────────────────────
    const isSingleCriterion = computed(() => criteria.value.length === 1);

    const getAllFlat = () => {
      const result = {};
      for (const student of students.value) {
        result[student.id] = getStudentFlat(student);
      }
      return result;
    };

    const onAllFlatUpdate = (newAllFlat) => {
      for (const studentId in newAllFlat) {
        const student = students.value.find((s) => s.id == studentId);
        if (student) onStudentEvalUpdate(newAllFlat[studentId], student);
      }
    };

    // ─── Data fetching ────────────────────────────────────────────────────────
    const fetchActivityDetails = async () => {
      evaluation.value = {};
      studentGrades.value = {};

      try {
        const response = await axios.get(
          `/activities/${activityId}`,
          tokenHeader(),
        );

        const courseId = response.data.lesson.course.id;
        const year = response.data.lesson.year;
        const lessonType = response.data.lesson.type;
        const lessonId = response.data.lesson.id;

        periodId.value = response.data.lesson.period.id;
        instituteId.value = response.data.institute.id;

        activityInfo.value = {
          area: response.data.lesson.area?.name || "",
          grade: response.data.lesson.course?.name || "",
          topic: response.data.title || "",
          lessonTopic: response.data.lesson.topic || "",
        };

        await fetchCriteria(activityId);

        if (lessonType === "reinforcement") {
          await fetchReinforcementStudents(lessonId);
        } else {
          await fetchStudents(courseId, year);
        }

        await fetchCourseGroups(courseId, year);
        await fetchStudentCriterionScores(activityId);
        await fetchAllEvidences(activityId);
      } catch (error) {
        console.error("Error in fetchActivityDetails:", error.message || error);
      }
    };

    const fetchCourseGroups = async (courseId, year) => {
      if (!courseId) return;
      try {
        const res = await axios.get(
          `/courses/${courseId}/groups?year=${year}&active=true`,
          tokenHeader(),
        );
        courseGroups.value = res.data || [];
      } catch (err) {
        console.warn("Could not fetch course groups:", err);
        courseGroups.value = [];
      }
    };

    const fetchAllEvidences = async (actId) => {
      try {
        const res = await axios.get(
          `/activity-evidences/activity/${actId}`,
          tokenHeader(),
        );
        const map = {};
        (res.data || []).forEach((ev) => {
          if (ev.studentId) {
            map[ev.studentId] = ev;
          }
        });
        evidences.value = map;
      } catch (err) {
        console.error("Error fetching all activity evidences:", err);
      }
    };

    const fetchStudentCriterionScores = async (actId) => {
      try {
        const response = await axios.get(
          `/student-criterion-scores/getAll?activityId=${actId}`,
          tokenHeader(),
        );
        response.data.forEach((score) => {
          if (evaluation.value[score.student.id]) {
            evaluation.value[score.student.id][score.criterion.id] = {
              value: score.score,
              id: score.id,
            };
          }
        });
        students.value.forEach((student) => updateGrade(student));
      } catch (error) {
        console.error(
          "Error in fetchStudentCriterionScores:",
          error.message || error,
        );
      }
    };

    const fetchStudents = async (courseId, year) => {
      try {
        const response = await axios.get(
          `/courses/${courseId}/users?active=true&year=${year}`,
          tokenHeader(),
        );
        const allStudents = response.data
          .filter((user) => user.rol === "student")
          .map((user) => user.user);

        students.value = allStudents.sort((a, b) => {
          const lastNameA = a.lastName || "";
          const lastNameB = b.lastName || "";
          if (lastNameA !== lastNameB)
            return lastNameA.localeCompare(lastNameB);
          return (a.name || "").localeCompare(b.name || "");
        });

        students.value.forEach((student) => {
          studentGrades.value[student.id] = null;
          if (!evaluation.value[student.id]) {
            evaluation.value[student.id] = {};
            criteria.value.forEach((criterion) => {
              evaluation.value[student.id][criterion.id] = {
                value: null,
                id: null,
              };
            });
          }
        });
      } catch (error) {
        console.error("Error in fetchStudents:", error.message || error);
      }
    };

    const fetchReinforcementStudents = async (lessonId) => {
      try {
        const response = await axios.get(
          `/reinforcement/lesson/${lessonId}`,
          tokenHeader(),
        );
        const reinforcementStudents = response.data.map((r) => r.student);

        students.value = reinforcementStudents.sort((a, b) => {
          const lastNameA = a.lastName || "";
          const lastNameB = b.lastName || "";
          if (lastNameA !== lastNameB)
            return lastNameA.localeCompare(lastNameB);
          return (a.name || "").localeCompare(b.name || "");
        });

        students.value.forEach((student) => {
          studentGrades.value[student.id] = null;
          if (!evaluation.value[student.id]) {
            evaluation.value[student.id] = {};
            criteria.value.forEach((criterion) => {
              evaluation.value[student.id][criterion.id] = {
                value: null,
                id: null,
              };
            });
          }
        });
      } catch (error) {
        console.error(
          "Error in fetchReinforcementStudents:",
          error.message || error,
        );
      }
    };

    const fetchCriteria = async (actId) => {
      try {
        const response = await axios.get(
          `/criteria?activityId=${actId}`,
          tokenHeader(),
        );
        criteria.value = response.data.sort((a, b) => a.id - b.id);
      } catch (error) {
        console.error("Error in fetchCriteria:", error.message || error);
      }
    };

    // ─── Grade helpers ────────────────────────────────────────────────────────
    const updateGrade = (student) => {
      studentGrades.value[student.id] = calculateFinalGrade(
        student.id,
        evaluation.value,
        criteria.value,
      );
    };

    const handleAccordionChange = (event, student) => {
      if (event.detail.checked) {
        currentlyOpenStudentId.value = student.id;
        updateGrade(student);
      } else {
        currentlyOpenStudentId.value = null;
      }
    };

    // ─── Save helpers ─────────────────────────────────────────────────────────
    const saveEvaluation = async (student) => {
      try {
        for (const criterionId in evaluation.value[student.id]) {
          const entry = evaluation.value[student.id][criterionId];
          if (entry.value !== null) {
            const payload = {
              studentId: student.id,
              criterionId: parseInt(criterionId, 10),
              score: entry.value,
              instituteId: usuario.value.institute.id,
              activityId: parseInt(activityId, 10),
            };
            const savedData = await saveCriterionScore(entry.id, payload);
            if (!entry.id && savedData?.id) {
              evaluation.value[student.id][criterionId].id = savedData.id;
            }
          }
        }
      } catch (error) {
        const message =
          error.response?.data?.message ||
          `Error guardando evaluación para ${student.name}`;
        setErrorToastOpen(true, message);
        throw new Error(message);
      }
    };

    const saveSingleEvaluation = async (student) => {
      isSaving.value = true;
      try {
        await saveEvaluation(student);
        showSuccessToast(
          `Evaluación guardada para ${student.lastName} ${student.name}`,
        );
        await fetchStudentCriterionScores(activityId);
      } catch (error) {
        console.error(`Fallo al guardar la evaluacion para ${student.name}`);
      } finally {
        isSaving.value = false;
      }
    };

    const saveAllEvaluations = async () => {
      isSaving.value = true;
      try {
        await Promise.all(
          students.value.map((student) => saveEvaluation(student)),
        );
        showSuccessToast("Todas las evaluaciones han sido guardadas");
        await fetchStudentCriterionScores(activityId);
      } catch (error) {
        console.error("Una o más evaluaciones fallaron al guardar.", error);
      } finally {
        isSaving.value = false;
      }
    };

    const presentSaveOptions = async () => {
      const actionSheet = await actionSheetController.create({
        header: "Opciones de Guardado",
        buttons: [
          {
            text: "Solo Guardar Evaluaciones",
            icon: saveOutline,
            handler: async () => {
              await saveAllEvaluations();
            },
          },
          {
            text: "Guardar y Registrar Notas Oficiales",
            icon: checkmarkDoneOutline,
            handler: () => {
              presentConfirmAlert();
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
            icon: closeOutline,
          },
        ],
      });
      await actionSheet.present();
    };

    const registerAllGrades = async () => {
      const allPromises = [];

      for (const student of students.value) {
        const criterionPromises = criteria.value.map(async (criterion) => {
          const entry = evaluation.value[student.id]?.[criterion.id];
          if (!entry) return;
          const score = entry.value === null ? 0 : entry.value;

          const payload = {
            studentId: student.id,
            criterionId: criterion.id,
            score,
            instituteId: usuario.value.institute.id,
            activityId: parseInt(activityId, 10),
          };

          try {
            const savedData = await saveCriterionScore(entry.id, payload);
            entry.value = score;
            if (!entry.id && savedData?.id) {
              entry.id = savedData.id;
            }
          } catch (error) {
            console.error("Error saving criterion score", error);
            entry.value = score;
          }
        });

        const studentGradePromise = Promise.all(criterionPromises).then(
          async () => {
            const finalGrade = calculateFinalGrade(
              student.id,
              evaluation.value,
              criteria.value,
            );
            const validFinalGrade =
              finalGrade != null && !isNaN(finalGrade) ? finalGrade : 0;
            const payloadFinalGrade = {
              userId: student.id,
              gradableId: parseInt(activityId, 10),
              gradableType: "activity",
              periodId: periodId.value,
              gradeType: "regular",
              grade: parseFloat(validFinalGrade.toFixed(2)),
              instituteId: instituteId.value,
            };
            studentGrades.value[student.id] = validFinalGrade;
            try {
              await axios.post("/grades", payloadFinalGrade, tokenHeader());
            } catch (error) {
              console.error(
                `Error registrando nota final para ${student.name}:`,
                error,
              );
            }
          },
        );

        allPromises.push(studentGradePromise);
      }

      await Promise.all(allPromises);
    };

    const presentConfirmAlert = async () => {
      const studentsWithMissing = getStudentsWithMissingCriteria();
      let message =
        "¿Estás seguro de que deseas registrar las notas para todos los estudiantes? Esta acción registrará las notas en el consolidado del periodo.";

      if (studentsWithMissing.length > 0) {
        message +=
          "<br><br><b>¡Advertencia!</b> Los siguientes estudiantes tienen criterios sin evaluar. Sus notas se registrarán con 0 en esos criterios:<br>";
        message += "<ul>";
        studentsWithMissing.forEach((name) => {
          message += `<li>${name}</li>`;
        });
        message += "</ul>";
      }

      const alert = await alertController.create({
        header: "Confirmar Registro",
        message,
        buttons: [
          { text: "Cancelar", role: "cancel", cssClass: "secondary" },
          {
            text: "Registrar",
            role: "confirm",
          },
        ],
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();

      if (role === "confirm") {
        const loading = await loadingController.create({
          message: "Registrando notas...",
          spinner: "crescent",
        });
        await loading.present();

        try {
          await registerAllGrades();
          await loading.dismiss();
          presentSuccessAlert();
        } catch (error) {
          await loading.dismiss();
          setErrorToastOpen(true, "Error al registrar las notas: " + error);
        }
      }
    };

    const presentSuccessAlert = async () => {
      const alert = await alertController.create({
        header: "Registro Exitoso",
        message:
          "Las notas se han registrado exitosamente para todos los estudiantes.",
        buttons: ["OK"],
      });
      await alert.present();
    };

    const getStudentsWithMissingCriteria = () => {
      const studentsWithMissing = [];
      students.value.forEach((student) => {
        const hasMissing = criteria.value.some(
          (criterion) =>
            evaluation.value[student.id]?.[criterion.id]?.value === null,
        );
        if (hasMissing) {
          studentsWithMissing.push(student.name + " " + student.lastName);
        }
      });
      return studentsWithMissing;
    };

    onIonViewWillEnter(async () => {
      await fetchActivityDetails();
    });

    return {
      activityId,
      students,
      criteria,
      evaluation,
      arrowBackOutline,
      saveOutline,
      checkmarkOutline: checkmarkDoneOutline,
      saveEvaluation,
      saveSingleEvaluation,
      saveAllEvaluations,
      presentSaveOptions,
      handleAccordionChange,
      currentlyOpenStudentId,
      fetchStudentCriterionScores,
      registerAllGrades,
      presentConfirmAlert,
      isSaving,
      isSuccessToastOpen,
      setSuccessToastOpen,
      isErrorToastOpen,
      errorMessage,
      setErrorToastOpen,
      toastSuccessMessage,
      showSuccessToast,
      studentGrades,
      updateGrade,
      usuario,
      instituteId,
      attachOutline,
      evidences,
      handleEvidenceChanged,
      hasEvidence,
      hasPhysicalDelivery,
      hasDigitalEvidence,
      physicalDeliveryCount,
      digitalDeliveryCount,
      pendingDeliveryCount,
      areAllPhysical,
      isIndeterminatePhysical,
      deliveredCount,
      areAllDelivered,
      isIndeterminateDelivered,
      togglePhysicalDelivery,
      toggleBulkPhysicalDelivery,
      toggleAllPhysical,
      getLinkedTeammates,
      getTeamMembers,
      saveTeamEvaluation,
      executeTeamEvaluation,
      handleSaveSingleCriterion,
      handleStudentRowCheckbox,
      showBulkModal,
      bulkScores,
      openBulkModal,
      closeBulkModal,
      setBulkScoresToMax,
      applyBulkEvaluation,
      getStudentFlat,
      onStudentEvalUpdate,
      isSingleCriterion,
      getAllFlat,
      onAllFlatUpdate,
      showImportModal,
      importFile,
      importFileName,
      importDragOver,
      importFileInput,
      closeImportModal,
      handleImportFileSelect,
      handleImportDrop,
      processExcelImport,
      presentImportExportOptions,
      presentExportOptions,
      exportBaseExcel,
      exportZip,
      activityInfo,
      goBack,
      documentOutline,
      cloudUploadOutline,
      downloadOutline,
      peopleOutline,
      documentAttachOutline,
      documentTextOutline,
      helpCircleOutline,
      schoolOutline,
      closeOutline,
      flashOutline,
      personOutline,
      personAddOutline,
      searchOutline,
      isPhysicalModalOpen,
      physicalModalStudent,
      physicalDeliveryMode,
      physicalCustomSelectedIds,
      physicalSearchQuery,
      physicalCourseGroup,
      physicalCourseGroupMembers,
      physicalCourseGroupMemberNames,
      physicalFilteredStudents,
      physicalTargetStudentIds,
      togglePhysicalCustomStudent,
      closePhysicalModal,
      confirmPhysicalDeliveryModal,
      courseGroups,
      getStudentCourseGroup,
      getSharedStudentNames,
      handleEvidenceBulkChanged,
      handleEvidenceBulkDelete,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   PÁGINA Y CONTENEDOR GENERAL (QUEEZY THEME)
   ========================================================================== */
.qz-review-page {
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-review-content {
  --background: transparent;
}

.qz-page-wrapper {
  display: flex;
  flex-direction: column;
}

/* ==========================================================================
   BARRA SUPERIOR FIJA QUEEZY (Sticky Header)
   ========================================================================== */
.qz-sticky-header {
  position: sticky;
  top: 0;
  width: 100%;
  padding-top: max(8px, env(safe-area-inset-top));
  padding-bottom: 24px;
  background: linear-gradient(
    180deg,
    #6a5ae0 0%,
    #6d5ee1 60%,
    rgba(106, 90, 224, 0.85) 85%,
    rgba(106, 90, 224, 0) 100%
  );
  flex-shrink: 0;
  z-index: 100;
  border: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
  outline: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  margin-bottom: -22px;
  pointer-events: none;
}

.qz-sticky-header::after {
  display: none !important;
  content: none !important;
}

.qz-hero-top {
  max-width: 820px;
  margin: 0 auto;
  padding: 4px 16px 2px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  pointer-events: auto;
}

/* Botón Volver */
.qz-back-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: var(--qz-radius-full, 9999px);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
}

.qz-back-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
}

/* Píldoras de resumen */
.qz-hero-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  justify-content: center;
  overflow-x: auto;
  scrollbar-width: none;
}

.qz-hero-pills::-webkit-scrollbar {
  display: none;
}

.qz-summary-pill {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 5px 11px;
  font-size: 12px;
  font-weight: 700;
  backdrop-filter: blur(4px);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.qz-pill--physical {
  background: rgba(255, 255, 255, 0.95);
  color: var(--ion-color-primary, #6a5ae0);
  border-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qz-pill--digital {
  background: rgba(112, 214, 245, 0.32);
  color: #ffffff;
  border-color: rgba(112, 214, 245, 0.6);
}

.qz-pill--pending {
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.85);
  border-color: rgba(255, 255, 255, 0.2);
}

.qz-pill-label-short {
  display: none;
}

.qz-pill-label-full {
  display: inline;
}

/* Acciones en Cabecera */
.qz-hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.qz-action-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: var(--qz-radius-full, 9999px);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
}

.qz-action-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
}

.qz-save-hero-btn {
  background: #ffffff;
  color: var(--ion-color-primary, #6a5ae0);
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  outline: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  flex-shrink: 0;
}

.qz-save-hero-btn:active:not(:disabled) {
  transform: scale(0.92);
}

.qz-save-hero-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.qz-save-hero-btn ion-icon {
  font-size: 20px;
}

.qz-btn-spinner {
  width: 18px;
  height: 18px;
  color: var(--ion-color-primary, #6a5ae0);
}

/* ==========================================================================
   BANNER HERO QUEEZY PÚRPURA
   ========================================================================== */
.qz-hero-banner {
  background: linear-gradient(180deg, #6a5ae0 0%, #7668e3 40%, #efeefc 100%);
  padding: 16px 20px 24px 20px;
  flex-shrink: 0;
  margin-top: 0;
}

.qz-hero-titles {
  max-width: 820px;
  margin: 0 auto;
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
  margin: 4px 0 6px 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: clamp(20px, 3.2vw, 28px);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.4px;
  word-break: break-word;
}

.qz-hero-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

/* ==========================================================================
   CUERPO PRINCIPAL
   ========================================================================== */
.qz-main-body {
  flex: 1;
  padding: 8px 16px 72px 16px;
}

.qz-container {
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ==========================================================================
   BARRA DE ACCIÓN SUPERIOR Y CABECERA DE LISTA
   ========================================================================== */
.qz-top-action-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 4px;
}

.qz-group-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 16px;
  border-radius: var(--qz-radius-full, 9999px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  border: 1.5px solid rgba(106, 90, 224, 0.25);
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  transition: all 0.15s ease;
  white-space: nowrap;
}

.qz-group-pill-btn:active {
  transform: scale(0.96);
}

.qz-bulk-pill-btn {
  background: linear-gradient(135deg, #6a5ae0 0%, #5647c9 100%);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 3px 10px rgba(106, 90, 224, 0.25);
}

.qz-bulk-pill-btn:hover {
  background: linear-gradient(135deg, #5b4bd3 0%, #4b3bb8 100%);
}

.qz-bulk-pill-btn:active {
  transform: scale(0.96);
}

/* CABECERA DIRECTA SOBRE LA LISTA DE ESTUDIANTES */
.qz-list-header-bar {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: var(--qz-radius-md, 14px);
  padding: 6px 12px;
  box-shadow: 0 1px 4px rgba(12, 9, 42, 0.04);
  border: 1px solid var(--qz-color-border, #e6e6e6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.qz-master-check-side {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.qz-master-check-label {
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12.5px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.qz-master-check-sub {
  font-size: 11px;
  font-weight: 500;
  color: var(--qz-color-text-muted, #858494);
}

.qz-list-header-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.qz-header-mode-tag {
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 9999px;
  white-space: nowrap;
}

.qz-tag--delivery {
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.2);
}

.qz-tag--group {
  background: #fff8e1;
  color: #f57c00;
  border: 1px solid rgba(245, 124, 0, 0.25);
}

.qz-round-checkbox {
  --size: 20px;
  --checkbox-background-checked: var(--ion-color-primary, #6a5ae0);
  --border-color: rgba(106, 90, 224, 0.35);
  --border-color-checked: var(--ion-color-primary, #6a5ae0);
  --border-radius: 6px;
}

/* ==========================================================================
   BADGES DE ESTADO DE ENTREGA
   ========================================================================== */
.qz-delivery-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: var(--qz-radius-full, 9999px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.qz-badge--digital {
  background: var(--qz-color-cyan-bg, #e8f9fe);
  color: #0288d1;
  border: 1px solid rgba(2, 136, 209, 0.22);
}

.qz-badge--physical {
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.22);
}

.qz-badge--pending {
  background: rgba(133, 132, 148, 0.1);
  color: var(--qz-color-text-muted, #858494);
  border: 1px solid rgba(133, 132, 148, 0.18);
}

.qz-team-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: var(--qz-radius-full, 9999px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2px;
  white-space: nowrap;
  background: #fff8e1;
  color: #f57c00;
  border: 1px solid rgba(245, 124, 0, 0.3);
}

.qz-checkbox-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  flex-shrink: 0;
  cursor: pointer;
}

.qz-checkbox-cell .qz-round-checkbox {
  pointer-events: none;
}

/* ==========================================================================
   MULTI-CRITERIO: ACCORDION LIST
   ========================================================================== */
.qz-accordion-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-student-accordion-item {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: var(--qz-radius-md, 14px);
  border: 1.5px solid var(--qz-color-border, #e6e6e6);
  margin-bottom: 6px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(12, 9, 42, 0.03);
  transition: all 0.2s ease;
}

.qz-student-accordion-item:hover {
  border-color: rgba(106, 90, 224, 0.3);
}

.qz-accordion-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  width: 100%;
}

.qz-student-header-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.qz-student-fullname {
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-student-badges {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.qz-student-grade-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--ion-color-primary, #6a5ae0);
  background: var(--qz-color-purple-bg, #efeefc);
  padding: 3px 9px;
  border-radius: 9999px;
  white-space: nowrap;
}

.qz-grade-label {
  font-size: 0.74rem;
  opacity: 0.85;
}

.qz-accordion-body-wrap {
  background: var(--qz-color-card-bg, #ffffff);
  border-top: 1px dashed rgba(106, 90, 224, 0.15);
}

.qz-accordion-body-inner {
  padding: 8px 12px 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-team-members-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff8e1;
  border: 1px solid rgba(245, 124, 0, 0.28);
  border-radius: var(--qz-radius-md, 12px);
  padding: 6px 12px;
  color: #c76700;
  font-size: 11.5px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  line-height: 1.35;
}

.qz-team-members-bar ion-icon {
  font-size: 16px;
  color: #f57c00;
  flex-shrink: 0;
}

.qz-team-members-text {
  flex: 1;
}

.qz-team-members-text strong {
  color: #9c4d00;
  margin-right: 4px;
}

.qz-save-student-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 32px;
  padding: 6px 14px;
  border-radius: var(--qz-radius-full, 9999px);
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  border: none;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  box-shadow: 0 2px 8px rgba(106, 90, 224, 0.2);
  transition: all 0.15s ease;
}

.qz-save-student-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.qz-save-student-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.qz-save-actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.qz-save-student-btn--team {
  flex: 1.4;
  background: linear-gradient(135deg, #6a5ae0 0%, #5647c9 100%);
}

.qz-save-individual-btn {
  flex: 1;
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1.5px solid rgba(106, 90, 224, 0.25);
  box-shadow: none;
}

.qz-save-individual-btn:hover {
  background: #e5e2fb;
}

/* ==========================================================================
   MODAL DE CALIFICACIÓN MASIVA
   ========================================================================== */
.qz-bulk-modal {
  --width: 92%;
  --max-width: 520px;
  --height: auto;
  --max-height: 90vh;
  --border-radius: var(--qz-radius-xl, 22px);
  --box-shadow: 0 16px 48px rgba(12, 9, 42, 0.22);
}

.qz-bulk-modal-content {
  background: var(--qz-color-card-bg, #ffffff);
  border-radius: var(--qz-radius-xl, 22px);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-bulk-modal-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #efeefc 0%, #e6e3fb 100%);
  border-bottom: 1px solid rgba(106, 90, 224, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.qz-bulk-modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.25);
}

.qz-bulk-modal-titles {
  flex: 1;
}

.qz-bulk-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-bulk-modal-subtitle {
  margin: 2px 0 0 0;
  font-size: 11.5px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-modal-close-btn {
  background: rgba(106, 90, 224, 0.1);
  border: none;
  color: var(--ion-color-primary, #6a5ae0);
  border-radius: var(--qz-radius-full, 9999px);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
}

.qz-modal-close-btn:hover {
  background: rgba(106, 90, 224, 0.2);
}

.qz-bulk-modal-body {
  padding: 18px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-bulk-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-bulk-section-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-bulk-section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-bulk-quick-btn {
  background: var(--qz-color-purple-bg, #efeefc);
  color: var(--ion-color-primary, #6a5ae0);
  border: 1px solid rgba(106, 90, 224, 0.25);
  border-radius: var(--qz-radius-full, 9999px);
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.qz-bulk-quick-btn:hover {
  background: #e2dffa;
}

.qz-bulk-criteria-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fbfaff;
  border: 1px solid rgba(106, 90, 224, 0.12);
  border-radius: var(--qz-radius-md, 14px);
  padding: 10px 12px;
}

.qz-bulk-criterion-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
}

.qz-bulk-criterion-row:not(:last-child) {
  border-bottom: 1px dashed rgba(106, 90, 224, 0.12);
  padding-bottom: 8px;
}

.qz-bulk-criterion-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.qz-bulk-criterion-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-bulk-criterion-max {
  font-size: 10.5px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-bulk-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1.5px solid var(--qz-color-border, #e6e6e6);
  border-radius: 10px;
  padding: 3px 8px;
  transition: border-color 0.15s ease;
}

.qz-bulk-input-wrap:focus-within {
  border-color: var(--ion-color-primary, #6a5ae0);
}

.qz-bulk-score-input {
  width: 54px;
  font-size: 13.5px;
  font-weight: 700;
  text-align: right;
  border: none;
  outline: none;
  color: var(--qz-color-text-main, #0c092a);
  background: transparent;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-bulk-input-denom {
  font-size: 11px;
  color: var(--qz-color-text-muted, #858494);
  font-weight: 600;
}

.qz-bulk-modal-footer {
  padding: 12px 20px 16px 20px;
  border-top: 1px solid var(--qz-color-border, #e6e6e6);
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
}

.qz-bulk-confirm-btn {
  flex: 1;
  height: 40px;
  border-radius: var(--qz-radius-full, 9999px);
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  border: none;
  font-size: 12.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.25);
  transition: all 0.15s ease;
}

.qz-bulk-confirm-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.qz-bulk-confirm-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.qz-bulk-cancel-btn {
  height: 40px;
  padding: 0 16px;
  border-radius: var(--qz-radius-full, 9999px);
  background: transparent;
  color: var(--qz-color-text-muted, #858494);
  border: 1.5px solid var(--qz-color-border, #e6e6e6);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.qz-bulk-cancel-btn:hover {
  background: #f5f4fa;
}

/* ==========================================================================
   MODAL DE IMPORTACIÓN EXCEL
   ========================================================================== */
.upload-area {
  border: 2px dashed var(--ion-color-primary, #6a5ae0);
  border-radius: var(--qz-radius-lg, 18px);
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  background-color: var(--qz-color-purple-bg, #efeefc);
}

.upload-area.drag-over {
  border-color: #0288d1;
  background-color: #e8f9fe;
}

.upload-icon {
  font-size: 3.5rem;
  color: var(--ion-color-primary, #6a5ae0);
}

.upload-area p {
  color: var(--qz-color-text-main, #0c092a);
  margin-top: 10px;
  font-size: 14px;
}

/* ==========================================================================
   RESPONSIVIDAD
   ========================================================================== */
@media (max-width: 600px) {
  .qz-hero-top {
    gap: 6px;
    padding: 4px 10px 2px 10px;
    align-items: center;
  }
  .qz-back-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    aspect-ratio: 1 / 1;
    border-radius: var(--qz-radius-full, 9999px);
    flex-shrink: 0;
  }
  .qz-hero-actions {
    gap: 6px;
    flex-shrink: 0;
  }
  .qz-action-btn,
  .qz-save-hero-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    aspect-ratio: 1 / 1;
    border-radius: var(--qz-radius-full, 9999px);
    flex-shrink: 0;
    font-size: 18px;
  }
  .qz-hero-pills {
    gap: 4px;
    min-width: 0;
    flex: 1;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .qz-hero-pills::-webkit-scrollbar {
    display: none;
  }
  .qz-pill--hide-mobile {
    display: none !important;
  }
  .qz-summary-pill {
    padding: 3px 8px;
    font-size: 11px;
    gap: 3px;
    flex-shrink: 0;
  }
  .qz-summary-pill ion-icon {
    font-size: 13px;
  }
  .qz-pill-label-full {
    display: none;
  }
  .qz-pill-label-short {
    display: inline;
  }
  .qz-top-action-bar {
    justify-content: stretch;
  }
  .qz-group-pill-btn {
    width: 100%;
    justify-content: center;
  }
  .qz-list-header-bar {
    padding: 6px 10px;
  }
  .qz-master-check-label {
    font-size: 11.5px;
  }
  .qz-header-mode-tag {
    font-size: 9.5px;
    padding: 2px 7px;
  }
}

/* ==========================================================================
   MODAL DE ENTREGA EN FÍSICO (QUEEZY UI)
   ========================================================================== */
.qz-physical-modal {
  --width: 94%;
  --max-width: 460px;
  --height: 85%;
  --max-height: 600px;
  --border-radius: var(--qz-radius-lg, 20px);
}

.qz-physical-modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-radius: var(--qz-radius-lg, 20px);
  overflow: hidden;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-physical-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #faf9fd;
  border-bottom: 1px solid var(--qz-color-border, #eee);
}

.qz-physical-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qz-physical-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(106, 90, 224, 0.12);
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.qz-physical-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-physical-sub {
  margin: 2px 0 0 0;
  font-size: 11.5px;
  color: var(--qz-color-text-muted, #858494);
}

.qz-physical-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-physical-section-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--qz-color-text-muted, #858494);
  margin-bottom: 2px;
}

.qz-delivery-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 11px 13px;
  border-radius: 12px;
  border: 1.5px solid var(--qz-color-border, #eef0f5);
  background: #ffffff;
  cursor: pointer;
  transition: all 0.18s ease;
}

.qz-delivery-card:hover {
  border-color: rgba(106, 90, 224, 0.4);
  background: #fbfbfe;
}

.qz-delivery-card--active {
  border-color: var(--ion-color-primary, #6a5ae0);
  background: rgba(106, 90, 224, 0.04);
}

.qz-delivery-card-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid #bbb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  flex-shrink: 0;
}

.qz-delivery-card--active .qz-delivery-card-radio {
  border-color: var(--ion-color-primary, #6a5ae0);
}

.qz-radio-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--ion-color-primary, #6a5ae0);
}

.qz-delivery-card-info {
  flex: 1;
}

.qz-delivery-card-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--qz-color-text-main, #0c092a);
  margin-bottom: 2px;
}

.qz-delivery-card-title-row ion-icon {
  font-size: 16px;
  color: var(--ion-color-primary, #6a5ae0);
}

.qz-badge-suggested {
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 9999px;
  background: #ede7f6;
  color: #5e35b1;
  margin-left: auto;
}

.qz-delivery-card-desc {
  margin: 0;
  font-size: 11px;
  color: var(--qz-color-text-muted, #858494);
  line-height: 1.35;
}

.qz-custom-picker-section {
  border: 1px solid var(--qz-color-border, #eef0f5);
  border-radius: 12px;
  padding: 10px;
  background: #fbfbfe;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-custom-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid var(--qz-color-border, #e0e2ec);
  border-radius: 8px;
  padding: 6px 10px;
}

.qz-custom-search-wrap ion-icon {
  font-size: 16px;
  color: #858494;
}

.qz-custom-search-input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 12px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-custom-members-list {
  max-height: 140px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qz-custom-member-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s ease;
  font-size: 11.5px;
}

.qz-custom-member-item:hover {
  background: rgba(106, 90, 224, 0.06);
}

.qz-custom-member-item--selected {
  background: rgba(106, 90, 224, 0.08);
}

.qz-member-checkbox {
  accent-color: var(--ion-color-primary, #6a5ae0);
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.qz-self-badge {
  color: var(--ion-color-primary, #6a5ae0);
  font-weight: 700;
  margin-left: 4px;
}

.qz-physical-modal-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid var(--qz-color-border, #eee);
  background: #faf9fd;
}

.qz-physical-modal-footer .qz-btn--confirm {
  flex: 1;
  height: 40px;
  border-radius: var(--qz-radius-full, 9999px);
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  border: none;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.25);
  transition: all 0.15s ease;
}

.qz-physical-modal-footer .qz-btn--confirm:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.qz-physical-modal-footer .qz-btn--cancel {
  height: 40px;
  padding: 0 16px;
  border-radius: var(--qz-radius-full, 9999px);
  background: transparent;
  color: var(--qz-color-text-muted, #858494);
  border: 1.5px solid var(--qz-color-border, #e6e6e6);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
</style>
