<template>
  <div class="qz-attendance-taker">
    <!-- Cargando -->
    <div v-if="loading" class="qz-card qz-state-card">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
      <p class="qz-state-text">Cargando estudiantes y asistencia...</p>
    </div>

    <!-- Sin estudiantes -->
    <div v-else-if="students.length === 0" class="qz-card qz-state-card">
      <div class="qz-empty-icon">
        <ion-icon :icon="peopleOutline"></ion-icon>
      </div>
      <h3 class="qz-empty-title">Sin estudiantes activos</h3>
      <p class="qz-state-text">
        No se encontraron estudiantes matriculados en este curso para el año
        {{ year }}.
      </p>
    </div>

    <template v-else>
      <!-- ================================================================
           PASO 1: SELECCIÓN DE MÉTODO (MARCADORES VS LLAMADO A LISTA)
           ================================================================ -->
      <section v-if="step === 'choose'" class="qz-choose-section">
        <!-- Banner si ya existe asistencia guardada -->
        <div v-if="existingSessionId" class="qz-saved-banner">
          <div class="qz-saved-banner-info">
            <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
            <div>
              <strong>Asistencia registrada</strong>
              <p>
                {{ summaryCounts.present }} presentes ·
                {{ summaryCounts.absent }} ausentes ·
                {{ summaryCounts.excused }} excusas ·
                {{ summaryCounts.late }} retardos ·
                {{ summaryCounts.early_exit }} salidas
              </p>
            </div>
          </div>
          <button
            type="button"
            class="qz-btn-banner-edit"
            @click="openListView('all')"
          >
            Ver / Editar lista
          </button>
        </div>

        <!-- Configuración de hora de cierre -->
        <div class="qz-card qz-time-card">
          <div class="qz-time-row">
            <div class="qz-time-label-col">
              <span class="qz-field-label">{{ closingTimeLabel }}</span>
              <span class="qz-time-hint">
                {{
                  scope === "lesson"
                    ? "Hora programada de finalización de esta clase"
                    : "Hora de cierre de la jornada escolar"
                }}
              </span>
            </div>
            <div class="qz-time-input-wrap">
              <ion-icon :icon="timeOutline" class="qz-time-icon"></ion-icon>
              <input
                v-model="closingTime"
                type="time"
                class="qz-time-input"
              />
            </div>
          </div>
        </div>

        <!-- Pregunta principal: ¿Cómo tomará la asistencia? -->
        <div class="qz-card qz-methods-card">
          <h3 class="qz-methods-title">¿Cómo deseas tomar la asistencia?</h3>
          <p class="qz-methods-subtitle">
            {{ students.length }} estudiantes en
            {{ courseName ? `Curso ${courseName}` : "este curso" }}
            <span v-if="lessonTopic"> · {{ lessonTopic }}</span>
          </p>

          <div class="qz-methods-grid">
            <button
              type="button"
              class="qz-method-btn qz-method--markers"
              @click="openScanner"
            >
              <div class="qz-method-icon qz-icon--purple">
                <ion-icon :icon="qrCodeOutline"></ion-icon>
              </div>
              <div class="qz-method-text">
                <h4>Usar Marcadores (Cámara)</h4>
                <p>
                  Escanea los marcadores de los estudiantes sin importar su
                  orientación y completa manualmente los faltantes.
                </p>
              </div>
              <ion-icon
                :icon="chevronForwardOutline"
                class="qz-method-arrow"
              ></ion-icon>
            </button>

            <button
              type="button"
              class="qz-method-btn qz-method--manual"
              @click="startSlider"
            >
              <div class="qz-method-icon qz-icon--cyan">
                <ion-icon :icon="listOutline"></ion-icon>
              </div>
              <div class="qz-method-text">
                <h4>Llamar estudiante por estudiante</h4>
                <p>
                  Desliza tarjeta por tarjeta marcando Presente, No asistió o
                  Excusa.
                </p>
              </div>
              <ion-icon
                :icon="chevronForwardOutline"
                class="qz-method-arrow"
              ></ion-icon>
            </button>
          </div>

          <button
            type="button"
            class="qz-btn-outline qz-btn-direct-list"
            @click="openListView('all')"
          >
            <ion-icon :icon="createOutline"></ion-icon>
            <span>Ir directo a la lista completa</span>
          </button>
        </div>
      </section>

      <!-- ================================================================
           PASO 2: SLIDER ESTUDIANTE POR ESTUDIANTE
           ================================================================ -->
      <section v-else-if="step === 'slider'" class="qz-slider-section">
        <div class="qz-slider-topbar">
          <button
            type="button"
            class="qz-chip-action"
            @click="step = 'choose'"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
            <span>Métodos</span>
          </button>

          <span class="qz-slider-counter">
            {{ sliderIndex + 1 }} / {{ students.length }}
          </span>

          <button
            type="button"
            class="qz-chip-action qz-chip-action--primary"
            @click="openListView('all')"
          >
            <span>Ver lista</span>
          </button>
        </div>

        <!-- Barra de progreso -->
        <div class="qz-progress-track">
          <div
            class="qz-progress-fill"
            :style="{
              width: `${Math.round(((sliderIndex + 1) / students.length) * 100)}%`,
            }"
          ></div>
        </div>

        <!-- Tarjeta Slider del Estudiante -->
        <div v-if="currentSliderStudent" class="qz-card qz-slider-card">
          <div class="qz-slider-avatar">
            {{ getInitials(currentSliderStudent) }}
          </div>

          <h2 class="qz-slider-name">
            {{ currentSliderStudent.lastName }} {{ currentSliderStudent.name }}
          </h2>
          <p v-if="currentSliderStudent.code" class="qz-slider-code">
            Código: {{ currentSliderStudent.code }}
          </p>

          <div
            v-if="recordsMap[currentSliderStudent.id]?.status"
            class="qz-current-status-pill"
            :class="`qz-status--${recordsMap[currentSliderStudent.id].status}`"
          >
            Estado actual:
            {{ statusLabels[recordsMap[currentSliderStudent.id].status] }}
          </div>
          <div v-else class="qz-current-status-pill qz-status--pending">
            Sin marcar aún
          </div>

          <!-- Botones: Presente, No asistió, Excusa -->
          <div class="qz-slider-actions">
            <button
              type="button"
              class="qz-slider-btn qz-sbtn--present"
              :class="{
                'is-selected':
                  recordsMap[currentSliderStudent.id]?.status === 'present',
              }"
              @click="markSliderStudent('present')"
            >
              <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              <span>Presente</span>
            </button>

            <button
              type="button"
              class="qz-slider-btn qz-sbtn--absent"
              :class="{
                'is-selected':
                  recordsMap[currentSliderStudent.id]?.status === 'absent',
              }"
              @click="markSliderStudent('absent')"
            >
              <ion-icon :icon="closeCircleOutline"></ion-icon>
              <span>No asistió</span>
            </button>

            <button
              type="button"
              class="qz-slider-btn qz-sbtn--excused"
              :class="{
                'is-selected':
                  recordsMap[currentSliderStudent.id]?.status === 'excused',
              }"
              @click="markSliderStudent('excused')"
            >
              <ion-icon :icon="documentTextOutline"></ion-icon>
              <span>Excusa</span>
            </button>
          </div>

          <!-- Navegación anterior / siguiente -->
          <div class="qz-slider-nav">
            <button
              type="button"
              class="qz-nav-btn"
              :disabled="sliderIndex === 0"
              @click="sliderIndex--"
            >
              <ion-icon :icon="chevronBackOutline"></ion-icon>
              <span>Anterior</span>
            </button>

            <button
              v-if="sliderIndex < students.length - 1"
              type="button"
              class="qz-nav-btn"
              @click="sliderIndex++"
            >
              <span>Siguiente</span>
              <ion-icon :icon="chevronForwardOutline"></ion-icon>
            </button>
            <button
              v-else
              type="button"
              class="qz-nav-btn qz-nav-btn--finish"
              @click="openListView('all')"
            >
              <span>Ir a revisar lista</span>
              <ion-icon :icon="chevronForwardOutline"></ion-icon>
            </button>
          </div>
        </div>
      </section>

      <!-- ================================================================
           PASO 3: LISTA EDITABLE (FALTANTES, RETARDOS, SALIDAS Y GUARDAR)
           ================================================================ -->
      <section v-else-if="step === 'list'" class="qz-list-section">
        <!-- Barra superior rápida -->
        <div class="qz-list-topbar">
          <button
            type="button"
            class="qz-chip-action"
            @click="step = 'choose'"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
            <span>Métodos</span>
          </button>

          <div class="qz-list-topbar-actions">
            <button
              type="button"
              class="qz-chip-action"
              @click="openScanner"
            >
              <ion-icon :icon="qrCodeOutline"></ion-icon>
              <span>Marcadores</span>
            </button>
            <button
              type="button"
              class="qz-chip-action"
              @click="startSlider"
            >
              <ion-icon :icon="listOutline"></ion-icon>
              <span>Slider</span>
            </button>
          </div>
        </div>

        <!-- Hora de cierre de jornada / fin de clase -->
        <div class="qz-card qz-time-card">
          <div class="qz-time-row">
            <div class="qz-time-label-col">
              <span class="qz-field-label">{{ closingTimeLabel }}</span>
              <span class="qz-time-hint">
                {{
                  scope === "lesson"
                    ? "Hora de finalización de la clase"
                    : "Hora de cierre de la jornada"
                }}
              </span>
            </div>
            <div class="qz-time-input-wrap">
              <ion-icon :icon="timeOutline" class="qz-time-icon"></ion-icon>
              <input
                v-model="closingTime"
                type="time"
                class="qz-time-input"
              />
            </div>
          </div>
        </div>

        <!-- Resumen y filtros -->
        <div class="qz-card qz-summary-card">
          <div class="qz-summary-pills">
            <button
              type="button"
              class="qz-sum-pill qz-sum--present"
              :class="{ 'is-active': listFilter === 'present' }"
              @click="toggleSummaryFilter('present')"
            >
              Presentes: {{ summaryCounts.present }}
            </button>
            <button
              v-if="summaryCounts.pending > 0"
              type="button"
              class="qz-sum-pill qz-sum--pending"
              :class="{ 'is-active': listFilter === 'pending' }"
              @click="toggleSummaryFilter('pending')"
            >
              Sin marcar: {{ summaryCounts.pending }}
            </button>
            <button
              type="button"
              class="qz-sum-pill qz-sum--absent"
              :class="{ 'is-active': listFilter === 'absent' }"
              @click="toggleSummaryFilter('absent')"
            >
              No asisten: {{ summaryCounts.absent }}
            </button>
            <button
              type="button"
              class="qz-sum-pill qz-sum--excused"
              :class="{ 'is-active': listFilter === 'excused' }"
              @click="toggleSummaryFilter('excused')"
            >
              Excusas: {{ summaryCounts.excused }}
            </button>
            <button
              type="button"
              class="qz-sum-pill qz-sum--late"
              :class="{ 'is-active': listFilter === 'late' }"
              @click="toggleSummaryFilter('late')"
            >
              Retardos: {{ summaryCounts.late }}
            </button>
            <button
              type="button"
              class="qz-sum-pill qz-sum--early_exit"
              :class="{ 'is-active': listFilter === 'early_exit' }"
              @click="toggleSummaryFilter('early_exit')"
            >
              Salidas: {{ summaryCounts.early_exit }}
            </button>
          </div>

          <div class="qz-filter-tabs">
            <button
              type="button"
              class="qz-filter-tab"
              :class="{ 'is-active': listFilter === 'all' }"
              @click="listFilter = 'all'"
            >
              Todos ({{ students.length }})
            </button>
            <button
              type="button"
              class="qz-filter-tab"
              :class="{ 'is-active': listFilter === 'pending' }"
              @click="listFilter = 'pending'"
            >
              Faltantes ({{ summaryCounts.pending }})
            </button>
            <button
              type="button"
              class="qz-filter-tab"
              :class="{ 'is-active': listFilter === 'novelties' }"
              @click="listFilter = 'novelties'"
            >
              Novedades ({{ noveltiesCount }})
            </button>
          </div>
        </div>

        <!-- Filas de estudiantes -->
        <div class="qz-roster-list">
          <div
            v-for="student in filteredStudents"
            :key="student.id"
            class="qz-card qz-student-row"
          >
            <div class="qz-student-row-top">
              <div class="qz-student-identity">
                <div class="qz-student-avatar">
                  {{ getInitials(student) }}
                </div>
                <div class="qz-student-text">
                  <h4 class="qz-student-name">
                    {{ student.lastName }} {{ student.name }}
                  </h4>
                  <div class="qz-student-badges">
                    <span
                      class="qz-mini-badge"
                      :class="`qz-status--${getRecord(student.id).status || 'pending'}`"
                    >
                      {{
                        getRecord(student.id).status
                          ? statusLabels[getRecord(student.id).status]
                          : "Sin marcar"
                      }}
                    </span>
                    <span
                      v-if="getRecord(student.id).scannedByMarker"
                      class="qz-mini-badge qz-badge--marker"
                    >
                      Marcador
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones de estado (Presente, No asiste, Excusa, Retardo, Salida) -->
            <div class="qz-status-buttons">
              <button
                type="button"
                class="qz-st-btn qz-st--present"
                :class="{ 'is-active': getRecord(student.id).status === 'present' }"
                @click="setStudentStatus(student.id, 'present')"
              >
                Presente
              </button>
              <button
                type="button"
                class="qz-st-btn qz-st--absent"
                :class="{ 'is-active': getRecord(student.id).status === 'absent' }"
                @click="setStudentStatus(student.id, 'absent')"
              >
                No asiste
              </button>
              <button
                type="button"
                class="qz-st-btn qz-st--excused"
                :class="{ 'is-active': getRecord(student.id).status === 'excused' }"
                @click="setStudentStatus(student.id, 'excused')"
              >
                Excusa
              </button>
              <button
                type="button"
                class="qz-st-btn qz-st--late"
                :class="{ 'is-active': getRecord(student.id).status === 'late' }"
                @click="setStudentStatus(student.id, 'late')"
              >
                Retardo
              </button>
              <button
                type="button"
                class="qz-st-btn qz-st--early_exit"
                :class="{
                  'is-active': getRecord(student.id).status === 'early_exit',
                }"
                @click="setStudentStatus(student.id, 'early_exit')"
              >
                Salida
              </button>
            </div>

            <!-- Hora de salida inesperada (obligatoria / visible si status === 'early_exit') -->
            <div
              v-if="getRecord(student.id).status === 'early_exit'"
              class="qz-event-time-row"
            >
              <span class="qz-event-time-label">
                <ion-icon :icon="timeOutline"></ion-icon>
                Hora de salida inesperada:
              </span>
              <input
                type="time"
                class="qz-time-input qz-time-input--sm"
                :value="getRecord(student.id).eventTime || ''"
                @input="setStudentEventTime(student.id, $event.target.value)"
              />
            </div>
          </div>
        </div>

        <!-- Aviso de cambios sin guardar / Error / Éxito -->
        <div v-if="hasUnsavedChanges" class="qz-unsaved-banner">
          Tienes cambios sin guardar. Pulsa <strong>Guardar Asistencia</strong>
          para registrar el llamado a lista.
        </div>
        <div v-if="saveError" class="qz-error-banner">{{ saveError }}</div>
        <div v-if="saveSuccess" class="qz-success-banner">{{ saveSuccess }}</div>

        <!-- Botón Guardar -->
        <button
          type="button"
          class="qz-btn-primary qz-btn-save"
          :disabled="saving"
          @click="saveAttendance"
        >
          <ion-spinner
            v-if="saving"
            name="crescent"
            class="qz-btn-spinner"
          ></ion-spinner>
          <ion-icon v-else :icon="saveOutline"></ion-icon>
          <span>{{ saving ? "Guardando..." : "Guardar Asistencia" }}</span>
        </button>
      </section>
    </template>

    <!-- ================================================================
         MODAL ESCÁNER DE MARCADORES (MatrixScanner)
         ================================================================ -->
    <ion-modal
      :is-open="isScannerOpen"
      @didDismiss="isScannerOpen = false"
      class="qz-scanner-modal"
    >
      <MatrixScanner
        v-if="isScannerOpen"
        ref="matrixScanner"
        :students="students"
        :options="['A', 'B', 'C', 'D']"
        submit-label="Confirmar asistencia"
        @scan-complete="onMarkersScanned"
        @scan-submit="onMarkersScanned"
        @scan-cancelled="isScannerOpen = false"
      />
    </ion-modal>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { IonIcon, IonSpinner, IonModal, alertController } from "@ionic/vue";
import {
  peopleOutline,
  qrCodeOutline,
  listOutline,
  createOutline,
  timeOutline,
  chevronForwardOutline,
  chevronBackOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  documentTextOutline,
  checkmarkOutline,
  saveOutline,
} from "ionicons/icons";
import axios from "axios";
import { tokenHeader } from "../globalService";
import MatrixScanner from "./MatrixScanner.vue";

const STATUS_LABELS = {
  present: "Presente",
  absent: "No asiste",
  excused: "Excusa",
  late: "Retardo",
  early_exit: "Salida",
};

export default {
  name: "AttendanceTaker",
  components: {
    IonIcon,
    IonSpinner,
    IonModal,
    MatrixScanner,
  },
  props: {
    courseId: { type: Number, required: true },
    courseName: { type: String, default: "" },
    year: { type: Number, required: true },
    scope: {
      type: String,
      default: "general",
      validator: (v) => ["general", "lesson"].includes(v),
    },
    lessonId: { type: Number, default: null },
    lessonTopic: { type: String, default: "" },
    initialDate: { type: String, default: "" },
  },
  emits: ["saved", "dirty-change"],
  setup(props, { emit }) {
    const getTodayIso = () => {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const getCurrentTimeHHMM = () => {
      const d = new Date();
      return `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes(),
      ).padStart(2, "0")}`;
    };

    const loading = ref(false);
    const saving = ref(false);
    const hasUnsavedChanges = ref(false);
    const saveError = ref("");
    const saveSuccess = ref("");
    const students = ref([]);
    const step = ref("choose"); // 'choose' | 'slider' | 'list'
    const isScannerOpen = ref(false);
    const sliderIndex = ref(0);
    const listFilter = ref("all"); // 'all' | 'pending' | 'novelties'
    const existingSessionId = ref(null);
    const closingTime = ref(props.scope === "lesson" ? "08:00" : "13:00");
    const attendanceDate = ref(props.initialDate || getTodayIso());

    // { [studentId]: { status: string|null, eventTime: string|null, scannedByMarker: boolean, note: string|null } }
    const recordsMap = ref({});

    const closingTimeLabel = computed(() =>
      props.scope === "lesson"
        ? "Hora de fin de la clase"
        : "Hora de cierre de la jornada",
    );

    const getRecord = (studentId) => {
      return (
        recordsMap.value[studentId] || {
          status: null,
          eventTime: null,
          scannedByMarker: false,
          note: null,
        }
      );
    };

    const currentSliderStudent = computed(
      () => students.value[sliderIndex.value] || null,
    );

    const summaryCounts = computed(() => {
      const counts = {
        present: 0,
        absent: 0,
        excused: 0,
        late: 0,
        early_exit: 0,
        pending: 0,
      };
      for (const s of students.value) {
        const st = recordsMap.value[s.id]?.status;
        if (st && counts[st] !== undefined) {
          counts[st] += 1;
        } else {
          counts.pending += 1;
        }
      }
      return counts;
    });

    const noveltiesCount = computed(
      () =>
        summaryCounts.value.absent +
        summaryCounts.value.excused +
        summaryCounts.value.late +
        summaryCounts.value.early_exit,
    );

    const toggleSummaryFilter = (filterKey) => {
      listFilter.value = listFilter.value === filterKey ? "all" : filterKey;
    };

    const filteredStudents = computed(() => {
      if (listFilter.value === "pending") {
        return students.value.filter((s) => !recordsMap.value[s.id]?.status);
      }
      if (listFilter.value === "novelties") {
        return students.value.filter((s) => {
          const st = recordsMap.value[s.id]?.status;
          return (
            st === "absent" ||
            st === "excused" ||
            st === "late" ||
            st === "early_exit"
          );
        });
      }
      if (listFilter.value !== "all") {
        return students.value.filter(
          (s) => recordsMap.value[s.id]?.status === listFilter.value,
        );
      }
      return students.value;
    });

    const getInitials = (student) => {
      if (!student) return "?";
      const first = (student.name || "").trim()[0] || "";
      const last = (student.lastName || "").trim()[0] || "";
      return (last + first).toUpperCase() || "?";
    };

    const loadData = async () => {
      if (!props.courseId || !props.year) return;
      loading.value = true;
      saveError.value = "";
      saveSuccess.value = "";
      existingSessionId.value = null;

      try {
        const rosterRes = await axios.get(
          `/courses/${props.courseId}/users?active=true&year=${props.year}`,
          tokenHeader(),
        );
        students.value = (rosterRes.data || [])
          .filter(
            (u) =>
              u.rol === "student" ||
              u.user?.rol === "student" ||
              u.rol === "user" ||
              u.user?.rol === "user",
          )
          .map((u) => u.user || u)
          .sort((a, b) => {
            const la = a.lastName || "";
            const lb = b.lastName || "";
            if (la !== lb) return la.localeCompare(lb);
            return (a.name || "").localeCompare(b.name || "");
          });

        const freshMap = {};
        for (const s of students.value) {
          freshMap[s.id] = {
            status: null,
            eventTime: null,
            scannedByMarker: false,
            note: null,
          };
        }

        // Consultar si ya existe sesión guardada para este curso/fecha/scope(/lesson)
        const params = {
          courseId: props.courseId,
          year: props.year,
          date: attendanceDate.value,
          scope: props.scope,
        };
        if (props.scope === "lesson" && props.lessonId) {
          params.lessonId = props.lessonId;
        }

        const sessionsRes = await axios.get("/attendance/sessions", {
          ...tokenHeader(),
          params,
        });
        const existing = (sessionsRes.data || [])[0];
        if (existing) {
          existingSessionId.value = existing.id;
          if (existing.closingTime) {
            closingTime.value = existing.closingTime;
          }
          for (const rec of existing.records || []) {
            const sid = rec.student?.id;
            if (sid && freshMap[sid]) {
              freshMap[sid] = {
                status: rec.status,
                eventTime: rec.eventTime || null,
                scannedByMarker: Boolean(rec.scannedByMarker),
                note: rec.note || null,
              };
            }
          }
        }

        recordsMap.value = freshMap;
        hasUnsavedChanges.value = false;
        emit("dirty-change", false);
        step.value = "choose";
      } catch (error) {
        console.error("Error cargando asistencia:", error);
      } finally {
        loading.value = false;
      }
    };

    const openScanner = () => {
      isScannerOpen.value = true;
    };

    const onMarkersScanned = (rawCodes) => {
      isScannerOpen.value = false;
      if (!rawCodes || rawCodes.length === 0) return;

      const updated = { ...recordsMap.value };
      for (const raw of rawCodes) {
        const key = String(raw).split(":")[0]?.trim();
        if (!key) continue;
        const student = students.value.find(
          (s) =>
            String(s.id) === key ||
            (s.code != null && String(s.code) === key),
        );
        if (student) {
          updated[student.id] = {
            ...(updated[student.id] || {}),
            status: "present",
            eventTime: null,
            scannedByMarker: true,
          };
        }
      }
      recordsMap.value = updated;
      hasUnsavedChanges.value = true;
      emit("dirty-change", true);

      const hasPending = students.value.some(
        (s) => !recordsMap.value[s.id]?.status,
      );
      openListView(hasPending ? "pending" : "all");
    };

    const startSlider = () => {
      const firstPendingIdx = students.value.findIndex(
        (s) => !recordsMap.value[s.id]?.status,
      );
      sliderIndex.value = firstPendingIdx >= 0 ? firstPendingIdx : 0;
      step.value = "slider";
    };

    const markSliderStudent = (status) => {
      const student = currentSliderStudent.value;
      if (!student) return;
      recordsMap.value = {
        ...recordsMap.value,
        [student.id]: {
          ...(recordsMap.value[student.id] || {}),
          status,
          eventTime: null,
          scannedByMarker: false,
        },
      };
      hasUnsavedChanges.value = true;
      emit("dirty-change", true);

      if (sliderIndex.value < students.value.length - 1) {
        sliderIndex.value += 1;
      } else {
        openListView("all");
      }
    };

    const openListView = (filter = "all") => {
      listFilter.value = filter;
      step.value = "list";
    };

    const setStudentStatus = (studentId, status) => {
      const prev = getRecord(studentId);
      let eventTime = prev.eventTime;
      if (status === "early_exit") {
        eventTime = eventTime || getCurrentTimeHHMM();
      } else {
        eventTime = null;
      }
      recordsMap.value = {
        ...recordsMap.value,
        [studentId]: {
          ...prev,
          status,
          eventTime,
        },
      };
      hasUnsavedChanges.value = true;
      emit("dirty-change", true);
    };

    const setStudentEventTime = (studentId, timeVal) => {
      const prev = getRecord(studentId);
      recordsMap.value = {
        ...recordsMap.value,
        [studentId]: {
          ...prev,
          eventTime: timeVal,
        },
      };
      hasUnsavedChanges.value = true;
      emit("dirty-change", true);
    };

    const saveAttendance = async () => {
      saveError.value = "";
      saveSuccess.value = "";

      if (!closingTime.value) {
        saveError.value =
          props.scope === "lesson"
            ? "Debes indicar la hora de fin de la clase."
            : "Debes indicar la hora de cierre de la jornada.";
        return;
      }

      // Validar que salidas inesperadas tengan hora
      const missingExitTime = students.value.find((s) => {
        const r = getRecord(s.id);
        return r.status === "early_exit" && !r.eventTime;
      });
      if (missingExitTime) {
        saveError.value = `Indica la hora de salida inesperada para ${missingExitTime.lastName} ${missingExitTime.name}.`;
        return;
      }

      // Si quedaron estudiantes sin marcar, por defecto los dejamos como 'absent' o pedimos marcar?
      // Para fluidez docente, si hay faltantes sin marcar tras usar marcadores, advertimos claramente:
      if (summaryCounts.value.pending > 0) {
        saveError.value = `Aún hay ${summaryCounts.value.pending} estudiante(s) sin marcar. Usa el filtro "Faltantes" para completar si no asiste o tiene excusa.`;
        listFilter.value = "pending";
        return;
      }

      saving.value = true;
      try {
        const records = students.value.map((s) => {
          const r = getRecord(s.id);
          return {
            studentId: s.id,
            status: r.status || "absent",
            eventTime: r.eventTime || null,
            scannedByMarker: Boolean(r.scannedByMarker),
            note: r.note || null,
          };
        });

        const payload = {
          scope: props.scope,
          date: attendanceDate.value,
          closingTime: closingTime.value,
          year: Number(props.year),
          courseId: Number(props.courseId),
          lessonId: props.scope === "lesson" ? Number(props.lessonId) : null,
          records,
        };

        const res = await axios.post(
          "/attendance/sessions",
          payload,
          tokenHeader(),
        );
        existingSessionId.value = res.data?.id || existingSessionId.value;
        hasUnsavedChanges.value = false;
        emit("dirty-change", false);
        saveSuccess.value = "Asistencia guardada correctamente.";
        emit("saved", res.data);
      } catch (error) {
        console.error("Error guardando asistencia:", error);
        const msg = error.response?.data?.message;
        saveError.value = Array.isArray(msg)
          ? msg.join(", ")
          : msg || "No se pudo guardar la asistencia.";
      } finally {
        saving.value = false;
      }
    };

    const handleBeforeUnload = (e) => {
      if (!hasUnsavedChanges.value) return;
      e.preventDefault();
      e.returnValue = "";
    };

    onBeforeRouteLeave(async () => {
      if (!hasUnsavedChanges.value) return true;
      const alert = await alertController.create({
        header: "Cambios sin guardar",
        message:
          "Tienes registros de asistencia sin guardar. Si sales ahora, se perderán los cambios.",
        buttons: [
          { text: "Seguir aquí", role: "cancel" },
          { text: "Salir sin guardar", role: "confirm" },
        ],
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();
      return role === "confirm";
    });

    watch(closingTime, () => {
      if (!loading.value && students.value.length > 0) {
        hasUnsavedChanges.value = true;
        emit("dirty-change", true);
      }
    });

    watch(
      () => [props.courseId, props.year, props.lessonId, props.initialDate],
      () => {
        if (props.initialDate) attendanceDate.value = props.initialDate;
        loadData();
      },
    );

    onMounted(() => {
      window.addEventListener("beforeunload", handleBeforeUnload);
      loadData();
    });

    onBeforeUnmount(() => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    });

    return {
      loading,
      saving,
      hasUnsavedChanges,
      saveError,
      saveSuccess,
      students,
      step,
      isScannerOpen,
      sliderIndex,
      listFilter,
      existingSessionId,
      closingTime,
      closingTimeLabel,
      recordsMap,
      statusLabels: STATUS_LABELS,
      currentSliderStudent,
      summaryCounts,
      noveltiesCount,
      filteredStudents,
      getRecord,
      getInitials,
      openScanner,
      onMarkersScanned,
      startSlider,
      markSliderStudent,
      openListView,
      toggleSummaryFilter,
      setStudentStatus,
      setStudentEventTime,
      saveAttendance,
      peopleOutline,
      qrCodeOutline,
      listOutline,
      createOutline,
      timeOutline,
      chevronForwardOutline,
      chevronBackOutline,
      arrowBackOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      documentTextOutline,
      checkmarkOutline,
      saveOutline,
    };
  },
};
</script>

<style scoped>
.qz-attendance-taker {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 18px;
  border: 1px solid rgba(106, 90, 224, 0.12);
  box-shadow: 0 6px 18px rgba(12, 9, 42, 0.05);
  box-sizing: border-box;
}

.qz-state-card {
  padding: 36px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}

.qz-empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.qz-empty-title {
  margin: 4px 0 0;
  font-size: 17px;
  font-weight: 800;
  color: #0c092a;
}

.qz-state-text {
  margin: 0;
  font-size: 13.5px;
  color: #858494;
}

/* BANNER EXISTENTE */
.qz-saved-banner {
  background: #eafbf1;
  border: 1.5px solid rgba(44, 182, 125, 0.35);
  border-radius: 18px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.qz-saved-banner-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #15803d;
}

.qz-saved-banner-info ion-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.qz-saved-banner-info strong {
  display: block;
  font-size: 14px;
}

.qz-saved-banner-info p {
  margin: 2px 0 0;
  font-size: 12px;
  opacity: 0.9;
}

.qz-btn-banner-edit {
  background: #16a34a;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
}

/* HORA DE CIERRE */
.qz-time-card {
  padding: 14px 16px;
}

.qz-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.qz-time-label-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.qz-field-label {
  font-size: 12px;
  font-weight: 800;
  color: #6a5ae0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qz-time-hint {
  font-size: 12px;
  color: #858494;
}

.qz-time-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f4f3fd;
  border: 1.5px solid rgba(106, 90, 224, 0.18);
  border-radius: 12px;
  padding: 6px 12px;
}

.qz-time-icon {
  color: #6a5ae0;
  font-size: 17px;
}

.qz-time-input {
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 700;
  color: #0c092a;
  outline: none;
  font-family: inherit;
}

.qz-time-input--sm {
  background: #f4f3fd;
  border: 1px solid rgba(106, 90, 224, 0.25);
  border-radius: 10px;
  padding: 5px 10px;
  font-size: 13px;
}

/* SELECCIÓN DE MÉTODO */
.qz-choose-section,
.qz-slider-section,
.qz-list-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-methods-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 800;
  color: #0c092a;
}

.qz-methods-subtitle {
  margin: 0 0 16px;
  font-size: 13px;
  color: #858494;
}

.qz-methods-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-method-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  background: #f4f3fd;
  border: 1.5px solid rgba(106, 90, 224, 0.15);
  border-radius: 18px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-method-btn:hover {
  border-color: #6a5ae0;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(106, 90, 224, 0.12);
}

.qz-method-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
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

.qz-method-text {
  flex: 1;
}

.qz-method-text h4 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 800;
  color: #0c092a;
}

.qz-method-text p {
  margin: 0;
  font-size: 12.5px;
  color: #5a5772;
  line-height: 1.35;
}

.qz-method-arrow {
  font-size: 20px;
  color: #858494;
}

.qz-btn-outline {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #ffffff;
  color: #6a5ae0;
  border: 1.5px solid rgba(106, 90, 224, 0.22);
  border-radius: 14px;
  padding: 11px 16px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
}

.qz-btn-direct-list {
  margin-top: 14px;
}

/* SLIDER ESTUDIANTE POR ESTUDIANTE */
.qz-slider-topbar,
.qz-list-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.qz-list-topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-chip-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #ffffff;
  color: #6a5ae0;
  border: 1px solid rgba(106, 90, 224, 0.2);
  border-radius: 12px;
  padding: 7px 12px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
}

.qz-chip-action--primary {
  background: #6a5ae0;
  color: #ffffff;
  border-color: #6a5ae0;
}

.qz-slider-counter {
  font-size: 13px;
  font-weight: 800;
  color: #6a5ae0;
}

.qz-progress-track {
  height: 8px;
  background: rgba(106, 90, 224, 0.14);
  border-radius: 9999px;
  overflow: hidden;
}

.qz-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6a5ae0 0%, #9087e5 100%);
  border-radius: 9999px;
  transition: width 0.25s ease;
}

.qz-slider-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 26px 20px;
}

.qz-slider-avatar {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  background: #efeefc;
  color: #6a5ae0;
  font-size: 24px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.qz-slider-name {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 800;
  color: #0c092a;
}

.qz-slider-code {
  margin: 0 0 10px;
  font-size: 12.5px;
  color: #858494;
}

.qz-current-status-pill {
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 9999px;
  margin-bottom: 18px;
}

.qz-slider-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
  margin-bottom: 18px;
}

.qz-slider-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 16px;
  border: 2px solid transparent;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.qz-slider-btn ion-icon {
  font-size: 24px;
}

.qz-sbtn--present {
  background: #eafbf1;
  color: #16a34a;
}
.qz-sbtn--present.is-selected {
  background: #16a34a;
  color: #ffffff;
}

.qz-sbtn--absent {
  background: #fff1f2;
  color: #e11d48;
}
.qz-sbtn--absent.is-selected {
  background: #e11d48;
  color: #ffffff;
}

.qz-sbtn--excused {
  background: #fff6e7;
  color: #d97706;
}
.qz-sbtn--excused.is-selected {
  background: #d97706;
  color: #ffffff;
}

.qz-slider-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}

.qz-nav-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f4f3fd;
  color: #0c092a;
  border: none;
  border-radius: 12px;
  padding: 11px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.qz-nav-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.qz-nav-btn--finish {
  background: #6a5ae0;
  color: #ffffff;
}

/* LISTA Y RESUMEN */
.qz-summary-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
}

.qz-summary-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.qz-sum-pill {
  font-size: 11.5px;
  font-weight: 700;
  padding: 5px 11px;
  border-radius: 9999px;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.qz-sum-pill:hover {
  filter: brightness(0.96);
}

.qz-sum-pill.is-active {
  border-color: currentColor;
  box-shadow: 0 2px 8px rgba(12, 9, 42, 0.12);
  transform: translateY(-1px);
}

.qz-sum--present,
.qz-status--present {
  background: #eafbf1;
  color: #16a34a;
}

.qz-sum--pending,
.qz-status--pending {
  background: #f0f0f5;
  color: #858494;
}

.qz-sum--absent,
.qz-status--absent {
  background: #fff1f2;
  color: #e11d48;
}

.qz-sum--excused,
.qz-status--excused {
  background: #fff6e7;
  color: #d97706;
}

.qz-sum--late,
.qz-status--late {
  background: #e8f9fe;
  color: #0284c7;
}

.qz-sum--early_exit,
.qz-status--early_exit {
  background: #f3e8ff;
  color: #7e22ce;
}

.qz-badge--marker {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-filter-tabs {
  display: flex;
  gap: 6px;
  background: #f4f3fd;
  padding: 4px;
  border-radius: 12px;
}

.qz-filter-tab {
  flex: 1;
  border: none;
  background: transparent;
  color: #858494;
  border-radius: 10px;
  padding: 8px 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.qz-filter-tab.is-active {
  background: #ffffff;
  color: #6a5ae0;
  box-shadow: 0 2px 6px rgba(106, 90, 224, 0.12);
}

.qz-roster-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-student-row {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-student-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qz-student-avatar {
  width: 38px;
  height: 38px;
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

.qz-student-name {
  margin: 0 0 4px;
  font-size: 14.5px;
  font-weight: 700;
  color: #0c092a;
}

.qz-student-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.qz-mini-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
}

.qz-status-buttons {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

@media (max-width: 520px) {
  .qz-status-buttons {
    grid-template-columns: repeat(3, 1fr);
  }
}

.qz-st-btn {
  border: 1px solid rgba(133, 132, 148, 0.22);
  background: #f9f9ff;
  color: #5a5772;
  border-radius: 10px;
  padding: 7px 4px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.qz-st--present.is-active {
  background: #16a34a;
  color: #ffffff;
  border-color: #16a34a;
}
.qz-st--absent.is-active {
  background: #e11d48;
  color: #ffffff;
  border-color: #e11d48;
}
.qz-st--excused.is-active {
  background: #d97706;
  color: #ffffff;
  border-color: #d97706;
}
.qz-st--late.is-active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}
.qz-st--early_exit.is-active {
  background: #7e22ce;
  color: #ffffff;
  border-color: #7e22ce;
}

.qz-event-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #f3e8ff;
  border: 1px solid rgba(126, 34, 206, 0.25);
  border-radius: 12px;
  padding: 8px 12px;
  flex-wrap: wrap;
}

.qz-event-time-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #6b21a8;
}

.qz-unsaved-banner {
  background: #fff6e7;
  border: 1.5px solid rgba(245, 158, 11, 0.4);
  color: #b45309;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
}

.qz-error-banner {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #be123c;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
}

.qz-success-banner {
  background: #eafbf1;
  border: 1px solid rgba(44, 182, 125, 0.35);
  color: #15803d;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 700;
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
}

.qz-btn-primary:disabled {
  opacity: 0.55;
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
  body:not(.light) .qz-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
  }
  body:not(.light) .qz-empty-title,
  body:not(.light) .qz-methods-title,
  body:not(.light) .qz-method-text h4,
  body:not(.light) .qz-slider-name,
  body:not(.light) .qz-student-name {
    color: #f7f7fd;
  }
  body:not(.light) .qz-state-text,
  body:not(.light) .qz-time-hint,
  body:not(.light) .qz-methods-subtitle,
  body:not(.light) .qz-method-text p,
  body:not(.light) .qz-slider-code {
    color: #9e9bb8;
  }
  body:not(.light) .qz-field-label,
  body:not(.light) .qz-slider-counter,
  body:not(.light) .qz-time-icon {
    color: #b5a9ff;
  }
  body:not(.light) .qz-time-input-wrap,
  body:not(.light) .qz-time-input--sm,
  body:not(.light) .qz-method-btn,
  body:not(.light) .qz-filter-tabs,
  body:not(.light) .qz-nav-btn {
    background: #241d42;
    border-color: rgba(255, 255, 255, 0.1);
    color: #f7f7fd;
  }
  body:not(.light) .qz-time-input {
    color: #ffffff;
  }
  body:not(.light) .qz-empty-icon,
  body:not(.light) .qz-slider-avatar,
  body:not(.light) .qz-student-avatar,
  body:not(.light) .qz-icon--purple,
  body:not(.light) .qz-badge--marker {
    background: #2b2254;
    color: #b5a9ff;
  }
  body:not(.light) .qz-icon--cyan {
    background: rgba(112, 214, 245, 0.2);
    color: #70d6f5;
  }
  body:not(.light) .qz-btn-outline,
  body:not(.light) .qz-chip-action {
    background: #2b2254;
    color: #b5a9ff;
    border-color: rgba(181, 169, 255, 0.28);
  }
  body:not(.light) .qz-chip-action--primary,
  body:not(.light) .qz-nav-btn--finish {
    background: #6a5ae0;
    color: #ffffff;
  }
  body:not(.light) .qz-filter-tab {
    color: #9e9bb8;
  }
  body:not(.light) .qz-filter-tab.is-active {
    background: #2b2254;
    color: #ffffff;
  }
  body:not(.light) .qz-st-btn {
    background: #241d42;
    border-color: rgba(255, 255, 255, 0.1);
    color: #c7c3e0;
  }
  body:not(.light) .qz-saved-banner,
  body:not(.light) .qz-success-banner {
    background: rgba(83, 223, 131, 0.15);
    border-color: rgba(83, 223, 131, 0.35);
    color: #53df83;
  }
  body:not(.light) .qz-saved-banner-info {
    color: #53df83;
  }
  body:not(.light) .qz-event-time-row {
    background: rgba(168, 85, 247, 0.16);
    border-color: rgba(168, 85, 247, 0.35);
  }
  body:not(.light) .qz-event-time-label {
    color: #d8b4fe;
  }
  body:not(.light) .qz-unsaved-banner {
    background: rgba(245, 158, 11, 0.16);
    border-color: rgba(245, 158, 11, 0.38);
    color: #fcd34d;
  }
  body:not(.light) .qz-error-banner {
    background: rgba(225, 29, 72, 0.18);
    border-color: rgba(225, 29, 72, 0.35);
    color: #fda4af;
  }
}

:global(body.dark) .qz-card,
:global(html.dark) .qz-card,
:global(.dark) .qz-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
}
:global(body.dark) .qz-empty-title,
:global(html.dark) .qz-empty-title,
:global(.dark) .qz-empty-title,
:global(body.dark) .qz-methods-title,
:global(html.dark) .qz-methods-title,
:global(.dark) .qz-methods-title,
:global(body.dark) .qz-method-text h4,
:global(html.dark) .qz-method-text h4,
:global(.dark) .qz-method-text h4,
:global(body.dark) .qz-slider-name,
:global(html.dark) .qz-slider-name,
:global(.dark) .qz-slider-name,
:global(body.dark) .qz-student-name,
:global(html.dark) .qz-student-name,
:global(.dark) .qz-student-name {
  color: #f7f7fd;
}
:global(body.dark) .qz-state-text,
:global(html.dark) .qz-state-text,
:global(.dark) .qz-state-text,
:global(body.dark) .qz-time-hint,
:global(html.dark) .qz-time-hint,
:global(.dark) .qz-time-hint,
:global(body.dark) .qz-methods-subtitle,
:global(html.dark) .qz-methods-subtitle,
:global(.dark) .qz-methods-subtitle,
:global(body.dark) .qz-method-text p,
:global(html.dark) .qz-method-text p,
:global(.dark) .qz-method-text p,
:global(body.dark) .qz-slider-code,
:global(html.dark) .qz-slider-code,
:global(.dark) .qz-slider-code {
  color: #9e9bb8;
}
:global(body.dark) .qz-field-label,
:global(html.dark) .qz-field-label,
:global(.dark) .qz-field-label,
:global(body.dark) .qz-slider-counter,
:global(html.dark) .qz-slider-counter,
:global(.dark) .qz-slider-counter,
:global(body.dark) .qz-time-icon,
:global(html.dark) .qz-time-icon,
:global(.dark) .qz-time-icon {
  color: #b5a9ff;
}
:global(body.dark) .qz-time-input-wrap,
:global(html.dark) .qz-time-input-wrap,
:global(.dark) .qz-time-input-wrap,
:global(body.dark) .qz-time-input--sm,
:global(html.dark) .qz-time-input--sm,
:global(.dark) .qz-time-input--sm,
:global(body.dark) .qz-method-btn,
:global(html.dark) .qz-method-btn,
:global(.dark) .qz-method-btn,
:global(body.dark) .qz-filter-tabs,
:global(html.dark) .qz-filter-tabs,
:global(.dark) .qz-filter-tabs,
:global(body.dark) .qz-nav-btn,
:global(html.dark) .qz-nav-btn,
:global(.dark) .qz-nav-btn {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.1);
  color: #f7f7fd;
}
:global(body.dark) .qz-time-input,
:global(html.dark) .qz-time-input,
:global(.dark) .qz-time-input {
  color: #ffffff;
}
:global(body.dark) .qz-empty-icon,
:global(html.dark) .qz-empty-icon,
:global(.dark) .qz-empty-icon,
:global(body.dark) .qz-slider-avatar,
:global(html.dark) .qz-slider-avatar,
:global(.dark) .qz-slider-avatar,
:global(body.dark) .qz-student-avatar,
:global(html.dark) .qz-student-avatar,
:global(.dark) .qz-student-avatar,
:global(body.dark) .qz-icon--purple,
:global(html.dark) .qz-icon--purple,
:global(.dark) .qz-icon--purple,
:global(body.dark) .qz-badge--marker,
:global(html.dark) .qz-badge--marker,
:global(.dark) .qz-badge--marker {
  background: #2b2254;
  color: #b5a9ff;
}
:global(body.dark) .qz-icon--cyan,
:global(html.dark) .qz-icon--cyan,
:global(.dark) .qz-icon--cyan {
  background: rgba(112, 214, 245, 0.2);
  color: #70d6f5;
}
:global(body.dark) .qz-btn-outline,
:global(html.dark) .qz-btn-outline,
:global(.dark) .qz-btn-outline,
:global(body.dark) .qz-chip-action,
:global(html.dark) .qz-chip-action,
:global(.dark) .qz-chip-action {
  background: #2b2254;
  color: #b5a9ff;
  border-color: rgba(181, 169, 255, 0.28);
}
:global(body.dark) .qz-chip-action--primary,
:global(html.dark) .qz-chip-action--primary,
:global(.dark) .qz-chip-action--primary,
:global(body.dark) .qz-nav-btn--finish,
:global(html.dark) .qz-nav-btn--finish,
:global(.dark) .qz-nav-btn--finish {
  background: #6a5ae0;
  color: #ffffff;
}
:global(body.dark) .qz-filter-tab,
:global(html.dark) .qz-filter-tab,
:global(.dark) .qz-filter-tab {
  color: #9e9bb8;
}
:global(body.dark) .qz-filter-tab.is-active,
:global(html.dark) .qz-filter-tab.is-active,
:global(.dark) .qz-filter-tab.is-active {
  background: #2b2254;
  color: #ffffff;
}
:global(body.dark) .qz-st-btn,
:global(html.dark) .qz-st-btn,
:global(.dark) .qz-st-btn {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.1);
  color: #c7c3e0;
}
:global(body.dark) .qz-saved-banner,
:global(html.dark) .qz-saved-banner,
:global(.dark) .qz-saved-banner,
:global(body.dark) .qz-success-banner,
:global(html.dark) .qz-success-banner,
:global(.dark) .qz-success-banner {
  background: rgba(83, 223, 131, 0.15);
  border-color: rgba(83, 223, 131, 0.35);
  color: #53df83;
}
:global(body.dark) .qz-saved-banner-info,
:global(html.dark) .qz-saved-banner-info,
:global(.dark) .qz-saved-banner-info {
  color: #53df83;
}
:global(body.dark) .qz-event-time-row,
:global(html.dark) .qz-event-time-row,
:global(.dark) .qz-event-time-row {
  background: rgba(168, 85, 247, 0.16);
  border-color: rgba(168, 85, 247, 0.35);
}
:global(body.dark) .qz-event-time-label,
:global(html.dark) .qz-event-time-label,
:global(.dark) .qz-event-time-label {
  color: #d8b4fe;
}
:global(body.dark) .qz-unsaved-banner,
:global(html.dark) .qz-unsaved-banner,
:global(.dark) .qz-unsaved-banner {
  background: rgba(245, 158, 11, 0.16);
  border-color: rgba(245, 158, 11, 0.38);
  color: #fcd34d;
}
:global(body.dark) .qz-error-banner,
:global(html.dark) .qz-error-banner,
:global(.dark) .qz-error-banner {
  background: rgba(225, 29, 72, 0.18);
  border-color: rgba(225, 29, 72, 0.35);
  color: #fda4af;
}
</style>
