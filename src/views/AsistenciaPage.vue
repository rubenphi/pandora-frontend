<template>
  <ion-page class="ion-page qz-asistencia-page">
    <ion-content :fullscreen="true" class="qz-asistencia-content">
      <div class="qz-asistencia-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <header class="qz-hero-header">
          <div class="qz-hero-inner">
            <div class="qz-hero-top">
              <button
                type="button"
                class="qz-back-btn"
                title="Volver al panel"
                aria-label="Volver"
                @click="goBack"
              >
                <ion-icon :icon="arrowBackOutline"></ion-icon>
              </button>
              <span class="qz-hero-tag">ASISTENCIA</span>
            </div>

            <h1 class="qz-hero-title">Control de Asistencia</h1>
            <p class="qz-hero-subtitle">
              Registra la asistencia de la jornada o consulta llamados a lista
              anteriores
            </p>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-asistencia-body">
          <!-- Tabs Queezy -->
          <div class="qz-tabs-container">
            <button
              type="button"
              class="qz-tab-btn"
              :class="{ 'is-active': activeTab === 'take' }"
              @click="activeTab = 'take'"
            >
              <ion-icon :icon="checkmarkDoneOutline"></ion-icon>
              <span>Tomar Asistencia</span>
            </button>
            <button
              type="button"
              class="qz-tab-btn"
              :class="{ 'is-active': activeTab === 'history' }"
              @click="openHistoryTab"
            >
              <ion-icon :icon="timeOutline"></ion-icon>
              <span>Historial</span>
            </button>
          </div>

          <!-- ============================================================
               TAB 1: TOMAR ASISTENCIA GENERAL
               ============================================================ -->
          <template v-if="activeTab === 'take'">
            <section class="qz-card qz-filters-card">
              <div class="qz-filters-grid">
                <div class="qz-field-group">
                  <label class="qz-field-label">Año</label>
                  <div class="qz-select-wrapper">
                    <ion-icon
                      :icon="calendarOutline"
                      class="qz-field-icon"
                    ></ion-icon>
                    <ion-select
                      v-model="selectedYear"
                      interface="popover"
                      :interface-options="{ cssClass: 'qz-popover-filter' }"
                      class="qz-compact-select"
                    >
                      <ion-select-option
                        v-for="y in years"
                        :key="y"
                        :value="y"
                      >
                        {{ y }}
                      </ion-select-option>
                    </ion-select>
                  </div>
                </div>

                <QzDatePicker
                  v-model="selectedDate"
                  label="Fecha"
                  placeholder="Seleccionar fecha"
                  :clearable="false"
                />

                <div class="qz-field-group qz-field-full">
                  <label class="qz-field-label">Curso</label>
                  <div class="qz-select-wrapper">
                    <ion-icon
                      :icon="schoolOutline"
                      class="qz-field-icon"
                    ></ion-icon>
                    <ion-select
                      v-model="selectedCourseId"
                      interface="popover"
                      :interface-options="{ cssClass: 'qz-popover-filter' }"
                      placeholder="Selecciona un curso"
                      class="qz-compact-select"
                    >
                      <ion-select-option
                        v-for="c in courses"
                        :key="c.id"
                        :value="c.id"
                      >
                        Curso {{ c.name }}
                      </ion-select-option>
                    </ion-select>
                  </div>
                </div>
              </div>
            </section>

            <AttendanceTaker
              v-if="selectedCourseId && selectedYear"
              scope="general"
              :course-id="Number(selectedCourseId)"
              :course-name="selectedCourseName"
              :year="Number(selectedYear)"
              :initial-date="selectedDate"
              @saved="onSessionSaved"
              @dirty-change="isTakeDirty = $event"
            />
          </template>

          <!-- ============================================================
               TAB 2: HISTORIAL / CONSULTA DE LLAMADOS A LISTA
               ============================================================ -->
          <template v-else>
            <section class="qz-card qz-filters-card">
              <div class="qz-filters-grid">
                <div class="qz-field-group">
                  <label class="qz-field-label">Año</label>
                  <div class="qz-select-wrapper">
                    <ion-icon
                      :icon="calendarOutline"
                      class="qz-field-icon"
                    ></ion-icon>
                    <ion-select
                      v-model="historyYear"
                      interface="popover"
                      :interface-options="{ cssClass: 'qz-popover-filter' }"
                      class="qz-compact-select"
                      @ionChange="fetchHistory"
                    >
                      <ion-select-option
                        v-for="y in years"
                        :key="y"
                        :value="y"
                      >
                        {{ y }}
                      </ion-select-option>
                    </ion-select>
                  </div>
                </div>

                <div class="qz-field-group">
                  <label class="qz-field-label">Tipo</label>
                  <div class="qz-select-wrapper">
                    <ion-icon
                      :icon="layersOutline"
                      class="qz-field-icon"
                    ></ion-icon>
                    <ion-select
                      v-model="historyScope"
                      interface="popover"
                      :interface-options="{ cssClass: 'qz-popover-filter' }"
                      class="qz-compact-select"
                      @ionChange="fetchHistory"
                    >
                      <ion-select-option value="all">Todos</ion-select-option>
                      <ion-select-option value="general">
                        Jornada General
                      </ion-select-option>
                      <ion-select-option value="lesson">
                        Por Clase
                      </ion-select-option>
                    </ion-select>
                  </div>
                </div>

                <div class="qz-field-group">
                  <label class="qz-field-label">Curso</label>
                  <div class="qz-select-wrapper">
                    <ion-icon
                      :icon="schoolOutline"
                      class="qz-field-icon"
                    ></ion-icon>
                    <ion-select
                      v-model="historyCourseId"
                      interface="popover"
                      :interface-options="{ cssClass: 'qz-popover-filter' }"
                      class="qz-compact-select"
                      @ionChange="fetchHistory"
                    >
                      <ion-select-option :value="0">
                        Todos los cursos
                      </ion-select-option>
                      <ion-select-option
                        v-for="c in courses"
                        :key="c.id"
                        :value="c.id"
                      >
                        Curso {{ c.name }}
                      </ion-select-option>
                    </ion-select>
                  </div>
                </div>

                <QzDatePicker
                  v-model="historyDate"
                  label="Fecha (opcional)"
                  placeholder="Todas las fechas"
                  :clearable="true"
                  @change="fetchHistory"
                />
              </div>
            </section>

            <!-- Loading historial -->
            <div v-if="loadingHistory" class="qz-card qz-state-card">
              <ion-spinner name="crescent" color="primary"></ion-spinner>
              <p class="qz-state-text">Consultando asistencias guardadas...</p>
            </div>

            <!-- Empty historial -->
            <div
              v-else-if="historySessions.length === 0"
              class="qz-card qz-state-card"
            >
              <div class="qz-empty-icon">
                <ion-icon :icon="calendarOutline"></ion-icon>
              </div>
              <h3 class="qz-empty-title">Sin registros</h3>
              <p class="qz-state-text">
                No hay llamados a lista guardados para los filtros
                seleccionados.
              </p>
            </div>

            <!-- Lista de sesiones -->
            <div v-else class="qz-history-list">
              <div
                v-for="sess in historySessions"
                :key="sess.id"
                class="qz-card qz-history-card"
                @click="openSessionDetail(sess)"
              >
                <div class="qz-history-top">
                  <div class="qz-history-badges">
                    <span
                      class="qz-scope-badge"
                      :class="
                        sess.scope === 'lesson'
                          ? 'qz-scope--lesson'
                          : 'qz-scope--general'
                      "
                    >
                      {{
                        sess.scope === "lesson"
                          ? "Por Clase"
                          : "Jornada General"
                      }}
                    </span>
                    <span class="qz-date-badge">{{ sess.date }}</span>
                    <span v-if="sess.closingTime" class="qz-time-badge">
                      {{
                        sess.scope === "lesson" ? "Fin clase:" : "Cierre:"
                      }}
                      {{ sess.closingTime }}
                    </span>
                  </div>
                  <ion-icon
                    :icon="chevronForwardOutline"
                    class="qz-history-arrow"
                  ></ion-icon>
                </div>

                <h3 class="qz-history-title">
                  Curso {{ sess.course?.name || "—" }}
                  <span v-if="sess.lesson?.topic">
                    · {{ sess.lesson.topic }}
                  </span>
                </h3>

                <div class="qz-history-counts">
                  <span class="qz-hcount qz-hc--present">
                    Presentes: {{ countStatus(sess, "present") }}
                  </span>
                  <span class="qz-hcount qz-hc--absent">
                    No asisten: {{ countStatus(sess, "absent") }}
                  </span>
                  <span class="qz-hcount qz-hc--excused">
                    Excusas: {{ countStatus(sess, "excused") }}
                  </span>
                  <span
                    v-if="countStatus(sess, 'late') > 0"
                    class="qz-hcount qz-hc--late"
                  >
                    Retardos: {{ countStatus(sess, "late") }}
                  </span>
                  <span
                    v-if="countStatus(sess, 'early_exit') > 0"
                    class="qz-hcount qz-hc--early"
                  >
                    Salidas: {{ countStatus(sess, "early_exit") }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </main>
      </div>

      <!-- Modal Detalle y Edición de Sesión Guardada -->
      <ion-modal
        :is-open="isDetailModalOpen"
        :backdrop-dismiss="!isDetailDirty"
        @didDismiss="closeDetailModal"
        class="qz-detail-modal"
      >
        <div class="qz-detail-modal-wrap" v-if="selectedSession">
          <header class="qz-detail-header">
            <div>
              <span class="qz-detail-tag">
                {{
                  selectedSession.scope === "lesson"
                    ? "ASISTENCIA DE CLASE"
                    : "JORNADA GENERAL"
                }}
                · {{ selectedSession.date }}
              </span>
              <h3 class="qz-detail-title">
                Curso {{ selectedSession.course?.name }}
                <span v-if="selectedSession.lesson?.topic">
                  · {{ selectedSession.lesson.topic }}
                </span>
              </h3>
            </div>
            <button
              type="button"
              class="qz-detail-close"
              aria-label="Cerrar"
              @click="closeDetailModal"
            >
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </header>

          <div class="qz-detail-body">
            <AttendanceTaker
              :scope="selectedSession.scope"
              :course-id="Number(selectedSession.course?.id)"
              :course-name="selectedSession.course?.name || ''"
              :year="Number(selectedSession.year)"
              :lesson-id="
                selectedSession.lesson ? Number(selectedSession.lesson.id) : null
              "
              :lesson-topic="selectedSession.lesson?.topic || ''"
              :initial-date="selectedSession.date"
              @saved="onDetailSaved"
              @dirty-change="isDetailDirty = $event"
            />
          </div>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonModal,
  alertController,
  onIonViewWillEnter,
} from "@ionic/vue";
import {
  arrowBackOutline,
  calendarOutline,
  schoolOutline,
  todayOutline,
  checkmarkDoneOutline,
  timeOutline,
  layersOutline,
  chevronForwardOutline,
  closeOutline,
} from "ionicons/icons";
import axios from "axios";
import {
  tokenHeader,
  usuarioGet,
  currentServerYear,
} from "../globalService";
import AttendanceTaker from "../components/AttendanceTaker.vue";

export default {
  name: "AsistenciaPage",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonModal,
    AttendanceTaker,
  },
  setup() {
    const router = useRouter();
    const activeTab = ref("take"); // 'take' | 'history'
    const isTakeDirty = ref(false);
    const isDetailDirty = ref(false);

    const confirmDiscardChanges = async () => {
      const alert = await alertController.create({
        header: "Cambios sin guardar",
        message:
          "Tienes cambios en la asistencia sin guardar. ¿Seguro que deseas salir y perderlos?",
        buttons: [
          { text: "Seguir editando", role: "cancel" },
          { text: "Descartar y salir", role: "confirm" },
        ],
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();
      return role === "confirm";
    };
    const courses = ref([]);
    const selectedCourseId = ref(null);
    const years = ref([]);
    const selectedYear = ref(currentServerYear());

    const getTodayIso = () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const selectedDate = ref(getTodayIso());

    // Historial state
    const historyYear = ref(currentServerYear());
    const historyCourseId = ref(0);
    const historyScope = ref("all");
    const historyDate = ref("");
    const historySessions = ref([]);
    const loadingHistory = ref(false);
    const isDetailModalOpen = ref(false);
    const selectedSession = ref(null);

    const selectedCourseName = computed(() => {
      const c = courses.value.find(
        (item) => item.id === selectedCourseId.value,
      );
      return c ? c.name : "";
    });

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/admin/panel");
      }
    };

    const fetchHistory = async () => {
      loadingHistory.value = true;
      try {
        const params = {};
        if (historyYear.value) params.year = historyYear.value;
        if (historyCourseId.value && historyCourseId.value !== 0) {
          params.courseId = historyCourseId.value;
        }
        if (historyScope.value && historyScope.value !== "all") {
          params.scope = historyScope.value;
        }
        if (historyDate.value) {
          params.date = historyDate.value;
        }
        const res = await axios.get("/attendance/sessions", {
          ...tokenHeader(),
          params,
        });
        historySessions.value = res.data || [];
      } catch (error) {
        console.error("Error consultando historial de asistencia:", error);
        historySessions.value = [];
      } finally {
        loadingHistory.value = false;
      }
    };

    const openHistoryTab = async () => {
      if (activeTab.value === "take" && isTakeDirty.value) {
        const ok = await confirmDiscardChanges();
        if (!ok) return;
        isTakeDirty.value = false;
      }
      activeTab.value = "history";
      fetchHistory();
    };

    const onSessionSaved = () => {
      isTakeDirty.value = false;
      if (activeTab.value === "history") {
        fetchHistory();
      }
    };

    const countStatus = (sess, status) => {
      return (sess.records || []).filter((r) => r.status === status).length;
    };

    const openSessionDetail = (sess) => {
      isDetailDirty.value = false;
      selectedSession.value = sess;
      isDetailModalOpen.value = true;
    };

    const closeDetailModal = async () => {
      if (isDetailModalOpen.value && isDetailDirty.value) {
        const ok = await confirmDiscardChanges();
        if (!ok) return;
        isDetailDirty.value = false;
      }
      isDetailModalOpen.value = false;
      selectedSession.value = null;
    };

    const onDetailSaved = () => {
      isDetailDirty.value = false;
      fetchHistory();
    };

    onIonViewWillEnter(async () => {
      const curYear = currentServerYear();
      years.value = Array.from({ length: 10 }, (_, i) => curYear - i);
      selectedYear.value =
        JSON.parse(localStorage.getItem("year")) || curYear;
      historyYear.value = selectedYear.value;

      try {
        const usuario = usuarioGet();
        const instId = usuario?.institute?.id;
        const url = instId
          ? `/courses?instituteId=${instId}&exist=true`
          : "/courses";
        const res = await axios.get(url, tokenHeader());
        courses.value = (res.data || [])
          .filter((c) => c.exist !== false)
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!selectedCourseId.value && courses.value.length > 0) {
          const stored = JSON.parse(localStorage.getItem("courseSelected"));
          if (stored && courses.value.some((c) => c.id === stored.id)) {
            selectedCourseId.value = stored.id;
          } else {
            selectedCourseId.value = courses.value[0].id;
          }
        }
      } catch (error) {
        console.error("Error cargando cursos en asistencia:", error);
      }

      if (activeTab.value === "history") {
        fetchHistory();
      }
    });

    return {
      activeTab,
      courses,
      selectedCourseId,
      selectedCourseName,
      years,
      selectedYear,
      selectedDate,
      historyYear,
      historyCourseId,
      historyScope,
      historyDate,
      historySessions,
      loadingHistory,
      isDetailModalOpen,
      selectedSession,
      isTakeDirty,
      isDetailDirty,
      goBack,
      fetchHistory,
      openHistoryTab,
      onSessionSaved,
      countStatus,
      openSessionDetail,
      closeDetailModal,
      onDetailSaved,
      arrowBackOutline,
      calendarOutline,
      schoolOutline,
      todayOutline,
      checkmarkDoneOutline,
      timeOutline,
      layersOutline,
      chevronForwardOutline,
      closeOutline,
    };
  },
};
</script>

<style scoped>
.qz-asistencia-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-asistencia-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-asistencia-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;
  padding-bottom: 70px;
}

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
  gap: 12px;
  margin-bottom: 12px;
}

.qz-back-btn {
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
}

.qz-hero-tag {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.9px;
  padding: 5px 12px;
  border-radius: 9999px;
  backdrop-filter: blur(6px);
}

.qz-hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
}

.qz-hero-subtitle {
  margin: 4px 0 0;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
}

.qz-asistencia-body {
  padding: 20px 16px 24px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* TABS */
.qz-tabs-container {
  display: flex;
  gap: 8px;
  background: #ffffff;
  padding: 6px;
  border-radius: 16px;
  border: 1px solid rgba(106, 90, 224, 0.1);
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.06);
}

.qz-tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 12px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: #858494;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-tab-btn.is-active {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 16px;
  border: 1px solid rgba(106, 90, 224, 0.12);
  box-shadow: 0 6px 18px rgba(12, 9, 42, 0.05);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.qz-filters-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

@media (max-width: 520px) {
  .qz-filters-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.qz-field-full {
  grid-column: 1 / -1;
}

.qz-field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  max-width: 100%;
}

.qz-field-label {
  font-size: 11px;
  font-weight: 700;
  color: #6a5ae0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qz-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #f4f3fd;
  border: 1.5px solid rgba(106, 90, 224, 0.15);
  border-radius: 12px;
  height: 42px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 0 10px 0 36px;
  box-sizing: border-box;
  overflow: hidden;
}

.qz-field-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #6a5ae0;
  pointer-events: none;
  z-index: 2;
}

.qz-compact-select {
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: #0c092a;
}

.qz-compact-select::part(container),
.qz-compact-select::part(text),
.qz-compact-select::part(icon) {
  display: flex;
  align-items: center;
}

.qz-date-input {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  border: none;
  background: transparent;
  font-size: 13.5px;
  font-weight: 600;
  color: #0c092a;
  outline: none;
  font-family: inherit;
}

.qz-clear-date-btn {
  border: none;
  background: rgba(106, 90, 224, 0.15);
  color: #6a5ae0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

/* HISTORIAL */
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

.qz-history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-history-card {
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qz-history-card:hover {
  transform: translateY(-1px);
  border-color: rgba(106, 90, 224, 0.35);
  box-shadow: 0 10px 22px rgba(106, 90, 224, 0.1);
}

.qz-history-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.qz-history-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.qz-scope-badge,
.qz-date-badge,
.qz-time-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 9999px;
}

.qz-scope--general {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-scope--lesson {
  background: #e8f9fe;
  color: #0284c7;
}

.qz-date-badge {
  background: #f4f3fd;
  color: #0c092a;
}

.qz-time-badge {
  background: #fff6e7;
  color: #d97706;
}

.qz-history-arrow {
  font-size: 18px;
  color: #858494;
}

.qz-history-title {
  margin: 0;
  font-size: 15.5px;
  font-weight: 800;
  color: #0c092a;
}

.qz-history-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.qz-hcount {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
}

.qz-hc--present {
  background: #eafbf1;
  color: #16a34a;
}
.qz-hc--absent {
  background: #fff1f2;
  color: #e11d48;
}
.qz-hc--excused {
  background: #fff6e7;
  color: #d97706;
}
.qz-hc--late {
  background: #e8f9fe;
  color: #0284c7;
}
.qz-hc--early {
  background: #f3e8ff;
  color: #7e22ce;
}

/* MODAL DETALLE */
.qz-detail-modal {
  --background: var(--qz-color-purple-bg, #efeefc);
}

.qz-detail-modal-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  color: #ffffff;
}

.qz-detail-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
  background: rgba(255, 255, 255, 0.2);
  padding: 3px 10px;
  border-radius: 9999px;
  margin-bottom: 6px;
}

.qz-detail-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #ffffff;
}

.qz-detail-close {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.qz-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* MODO OSCURO */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-asistencia-page,
  body:not(.light) .qz-asistencia-content,
  body:not(.light) .qz-detail-modal,
  body:not(.light) .qz-detail-modal-wrap {
    --background: #120f24;
    background-color: #120f24;
  }
  body:not(.light) .qz-hero-header,
  body:not(.light) .qz-detail-header {
    background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
  }
  body:not(.light) .qz-hero-tag {
    background: rgba(255, 255, 255, 0.12);
    color: #b5a9ff;
    border: 1px solid rgba(181, 169, 255, 0.28);
  }
  body:not(.light) .qz-tabs-container,
  body:not(.light) .qz-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
  }
  body:not(.light) .qz-tab-btn {
    color: #9e9bb8;
  }
  body:not(.light) .qz-tab-btn.is-active {
    background: #2b2254;
    color: #b5a9ff;
  }
  body:not(.light) .qz-field-label,
  body:not(.light) .qz-field-icon {
    color: #b5a9ff;
  }
  body:not(.light) .qz-select-wrapper {
    background: #241d42;
    border-color: rgba(255, 255, 255, 0.12);
  }
  body:not(.light) .qz-compact-select,
  body:not(.light) .qz-compact-select::part(text),
  body:not(.light) .qz-date-input,
  body:not(.light) .qz-empty-title,
  body:not(.light) .qz-history-title {
    color: #ffffff;
  }
  body:not(.light) .qz-compact-select::part(icon) {
    color: #b5a9ff;
  }
  body:not(.light) .qz-empty-icon,
  body:not(.light) .qz-scope--general {
    background: #2b2254;
    color: #b5a9ff;
  }
  body:not(.light) .qz-date-badge {
    background: #241d42;
    color: #f7f7fd;
  }
  body:not(.light) .qz-state-text,
  body:not(.light) .qz-history-arrow {
    color: #9e9bb8;
  }
}

:global(body.dark) .qz-asistencia-page,
:global(body.dark) .qz-asistencia-content,
:global(body.dark) .qz-detail-modal,
:global(body.dark) .qz-detail-modal-wrap,
:global(html.dark) .qz-asistencia-page,
:global(html.dark) .qz-asistencia-content,
:global(html.dark) .qz-detail-modal,
:global(html.dark) .qz-detail-modal-wrap,
:global(.dark) .qz-asistencia-page,
:global(.dark) .qz-asistencia-content,
:global(.dark) .qz-detail-modal,
:global(.dark) .qz-detail-modal-wrap {
  --background: #120f24;
  background-color: #120f24;
}
:global(body.dark) .qz-hero-header,
:global(body.dark) .qz-detail-header,
:global(html.dark) .qz-hero-header,
:global(html.dark) .qz-detail-header,
:global(.dark) .qz-hero-header,
:global(.dark) .qz-detail-header {
  background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
}
:global(body.dark) .qz-hero-tag,
:global(html.dark) .qz-hero-tag,
:global(.dark) .qz-hero-tag {
  background: rgba(255, 255, 255, 0.12);
  color: #b5a9ff;
  border: 1px solid rgba(181, 169, 255, 0.28);
}
:global(body.dark) .qz-tabs-container,
:global(html.dark) .qz-tabs-container,
:global(.dark) .qz-tabs-container,
:global(body.dark) .qz-card,
:global(html.dark) .qz-card,
:global(.dark) .qz-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
}
:global(body.dark) .qz-tab-btn,
:global(html.dark) .qz-tab-btn,
:global(.dark) .qz-tab-btn {
  color: #9e9bb8;
}
:global(body.dark) .qz-tab-btn.is-active,
:global(html.dark) .qz-tab-btn.is-active,
:global(.dark) .qz-tab-btn.is-active {
  background: #2b2254;
  color: #b5a9ff;
}
:global(body.dark) .qz-field-label,
:global(html.dark) .qz-field-label,
:global(.dark) .qz-field-label,
:global(body.dark) .qz-field-icon,
:global(html.dark) .qz-field-icon,
:global(.dark) .qz-field-icon {
  color: #b5a9ff;
}
:global(body.dark) .qz-select-wrapper,
:global(html.dark) .qz-select-wrapper,
:global(.dark) .qz-select-wrapper {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.12);
}
:global(body.dark) .qz-compact-select,
:global(html.dark) .qz-compact-select,
:global(.dark) .qz-compact-select,
:global(body.dark) .qz-compact-select::part(text),
:global(html.dark) .qz-compact-select::part(text),
:global(.dark) .qz-compact-select::part(text),
:global(body.dark) .qz-date-input,
:global(html.dark) .qz-date-input,
:global(.dark) .qz-date-input,
:global(body.dark) .qz-empty-title,
:global(html.dark) .qz-empty-title,
:global(.dark) .qz-empty-title,
:global(body.dark) .qz-history-title,
:global(html.dark) .qz-history-title,
:global(.dark) .qz-history-title {
  color: #ffffff;
}
:global(body.dark) .qz-compact-select::part(icon),
:global(html.dark) .qz-compact-select::part(icon),
:global(.dark) .qz-compact-select::part(icon) {
  color: #b5a9ff;
}
:global(body.dark) .qz-empty-icon,
:global(html.dark) .qz-empty-icon,
:global(.dark) .qz-empty-icon,
:global(body.dark) .qz-scope--general,
:global(html.dark) .qz-scope--general,
:global(.dark) .qz-scope--general {
  background: #2b2254;
  color: #b5a9ff;
}
:global(body.dark) .qz-date-badge,
:global(html.dark) .qz-date-badge,
:global(.dark) .qz-date-badge {
  background: #241d42;
  color: #f7f7fd;
}
:global(body.dark) .qz-state-text,
:global(html.dark) .qz-state-text,
:global(.dark) .qz-state-text,
:global(body.dark) .qz-history-arrow,
:global(html.dark) .qz-history-arrow,
:global(.dark) .qz-history-arrow {
  color: #9e9bb8;
}
</style>
