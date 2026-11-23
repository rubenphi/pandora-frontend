<template>
  <ion-page class="ion-page qz-papeleria-page">
    <ion-content class="qz-papeleria-content">
      <div class="qz-papeleria-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <div class="qz-hero-header">
          <div class="qz-hero-inner">
            <div class="qz-hero-top-row">
              <button class="qz-back-btn" @click="router.push('/admin/panel')">
                <ion-icon :icon="arrowBackOutline"></ion-icon>
              </button>
              <span class="qz-hero-tag">ADMINISTRACIÓN</span>
            </div>
            <h1 class="qz-hero-title">Papelería y Formatos</h1>
            <p class="qz-hero-subtitle">
              Genera e imprime listas de asistencia, hojas de respuestas OMR y carnés para tus cursos
            </p>
          </div>
        </div>

        <div class="qz-papeleria-body">
          <!-- 2. TARJETA DE CONFIGURACIÓN DE FILTROS -->
          <div class="qz-config-card">
            <div class="qz-card-header-row">
              <div class="qz-step-badge">1</div>
              <div>
                <h3 class="qz-step-title">Selección de Curso y Año</h3>
                <p class="qz-step-desc">Elige el año lectivo y el curso que deseas imprimir</p>
              </div>
            </div>

            <div class="qz-filters-grid">
              <!-- Selector de Año -->
              <div class="qz-field-group">
                <label class="qz-field-label">Año Lectivo</label>
                <div class="qz-select-wrapper">
                  <ion-icon :icon="calendarOutline" class="qz-field-icon"></ion-icon>
                  <ion-select
                    v-model="selectedYear"
                    interface="popover"
                    class="qz-compact-select"
                    :interface-options="{ cssClass: 'qz-popover-filter' }"
                    @ionChange="onYearChange($event)"
                  >
                    <ion-select-option v-for="y in years" :key="y" :value="y">
                      {{ y }}
                    </ion-select-option>
                  </ion-select>
                </div>
              </div>

              <!-- Selector de Curso -->
              <div class="qz-field-group">
                <label class="qz-field-label">Curso Destino</label>
                <div class="qz-select-wrapper">
                  <ion-icon :icon="schoolOutline" class="qz-field-icon"></ion-icon>
                  <ion-select
                    v-model="selectedCourseId"
                    interface="popover"
                    class="qz-compact-select"
                    :interface-options="{ cssClass: 'qz-popover-filter' }"
                    @ionChange="onCourseChange($event)"
                  >
                    <ion-select-option :value="-1">Todos los Cursos</ion-select-option>
                    <ion-select-option v-for="c in availableCourses" :key="c.id" :value="c.id">
                      Curso {{ c.name }}
                    </ion-select-option>
                  </ion-select>
                </div>
              </div>
            </div>

            <!-- Resumen Informativo de Estudiantes -->
            <div class="qz-selection-summary" v-if="!loadingStudents">
              <div class="qz-summary-stat">
                <ion-icon :icon="peopleOutline"></ion-icon>
                <span>
                  <strong>{{ totalSelectedStudents }}</strong> estudiantes listos para generar
                </span>
              </div>
              <div class="qz-summary-stat" v-if="selectedCourseId === -1">
                <ion-icon :icon="libraryOutline"></ion-icon>
                <span><strong>{{ availableCourses.length }}</strong> cursos seleccionados</span>
              </div>
            </div>

            <div class="qz-loading-indicator" v-else>
              <ion-spinner name="crescent" color="primary"></ion-spinner>
              <span>Cargando estudiantes del curso...</span>
            </div>
          </div>

          <!-- 3. CATÁLOGO DE FORMATOS DISPONIBLES -->
          <div class="qz-formats-section">
            <div class="qz-card-header-row">
              <div class="qz-step-badge">2</div>
              <div>
                <h3 class="qz-step-title">Selecciona el Formato a Imprimir</h3>
                <p class="qz-step-desc">Elige la opción que necesitas generar</p>
              </div>
            </div>

            <div class="qz-formats-grid">
              <!-- Formato 1: Lista de Asistencia / Estudiantes -->
              <div class="qz-format-card" :class="{ 'qz-card--disabled': totalSelectedStudents === 0 }">
                <div class="qz-format-top">
                  <div class="qz-format-icon-squircle qz-icon--purple">
                    <ion-icon :icon="clipboardOutline"></ion-icon>
                  </div>
                  <span class="qz-format-tag">PDF / IMPRESIÓN</span>
                </div>
                <h4 class="qz-format-name">Lista de Estudiantes y Asistencia</h4>
                <p class="qz-format-desc">
                  Listado oficial con nombres, códigos de estudiante y cuadrícula para control de asistencia o firmas físicas.
                </p>
                <button
                  class="qz-format-btn qz-btn--purple"
                  :disabled="loadingStudents || totalSelectedStudents === 0"
                  @click="generatePrintableList"
                >
                  <ion-icon :icon="printOutline"></ion-icon>
                  <span>Generar Lista</span>
                </button>
              </div>

              <!-- Formato 2: Hojas de Respuestas OMR -->
              <div class="qz-format-card" :class="{ 'qz-card--disabled': totalSelectedStudents === 0 }">
                <div class="qz-format-top">
                  <div class="qz-format-icon-squircle qz-icon--cyan">
                    <ion-icon :icon="documentTextOutline"></ion-icon>
                  </div>
                  <span class="qz-format-tag">OMR ESCÁNER</span>
                </div>
                <h4 class="qz-format-name">Hojas de Respuestas OMR</h4>
                <p class="qz-format-desc">
                  Plantillas escaneables de burbujas personalizadas con el código y nombre del estudiante para evaluaciones y encuestas.
                </p>
                <button
                  class="qz-format-btn qz-btn--cyan"
                  :disabled="loadingStudents || totalSelectedStudents === 0"
                  @click="generatePrintableSheet"
                >
                  <ion-icon :icon="scanOutline"></ion-icon>
                  <span>Generar Hojas OMR</span>
                </button>
              </div>

              <!-- Formato 3: Marcadores QR -->
              <div class="qz-format-card" :class="{ 'qz-card--disabled': totalSelectedStudents === 0 }">
                <div class="qz-format-top">
                  <div class="qz-format-icon-squircle qz-icon--gold">
                    <ion-icon :icon="qrCodeOutline"></ion-icon>
                  </div>
                  <span class="qz-format-tag">CARNÉS & QR</span>
                </div>
                <h4 class="qz-format-name">Marcadores de Respuestas QR</h4>
                <p class="qz-format-desc">
                  Tarjetas imprimibles con código QR individual de estudiante para actividades dinámicas y escaneo rápido en clase.
                </p>
                <button
                  class="qz-format-btn qz-btn--gold"
                  :disabled="loadingStudents || totalSelectedStudents === 0"
                  @click="generatePrintableQr"
                >
                  <ion-icon :icon="qrCodeOutline"></ion-icon>
                  <span>Generar Marcadores QR</span>
                </button>
              </div>

              <!-- Formato 4: Exportación CSV -->
              <div class="qz-format-card" :class="{ 'qz-card--disabled': totalSelectedStudents === 0 }">
                <div class="qz-format-top">
                  <div class="qz-format-icon-squircle qz-icon--green">
                    <ion-icon :icon="downloadOutline"></ion-icon>
                  </div>
                  <span class="qz-format-tag">DATOS & EXCEL</span>
                </div>
                <h4 class="qz-format-name">Exportar Base de Datos (CSV)</h4>
                <p class="qz-format-desc">
                  Descarga de estudiantes en formato CSV compatible con Excel, Google Sheets y sistemas de lectura ZipGrade.
                </p>
                <button
                  class="qz-format-btn qz-btn--green"
                  :disabled="loadingStudents || totalSelectedStudents === 0"
                  @click="downloadCSV"
                >
                  <ion-icon :icon="downloadOutline"></ion-icon>
                  <span>Descargar CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  IonSpinner,
  IonSelect,
  IonSelectOption,
  alertController,
  onIonViewWillEnter,
} from "@ionic/vue";
import {
  arrowBackOutline,
  calendarOutline,
  schoolOutline,
  peopleOutline,
  libraryOutline,
  clipboardOutline,
  documentTextOutline,
  qrCodeOutline,
  downloadOutline,
  printOutline,
  scanOutline,
} from "ionicons/icons";
import axios from "axios";
import { tokenHeader, usuarioGet } from "../globalService";

export default {
  name: "PapeleriaPage",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonSpinner,
    IonSelect,
    IonSelectOption,
  },
  setup() {
    const router = useRouter();
    const usuario = ref(usuarioGet() || {});
    const selectedYear = ref(new Date().getFullYear());
    const years = ref([]);
    const availableCourses = ref([]);
    const selectedCourseId = ref(-1); // -1: Todos los cursos
    const loadingStudents = ref(false);
    const preparedCoursesData = ref([]);

    // Generar últimos 3 años y próximos 2 años
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 3; y <= currentYear + 2; y++) {
      years.value.push(y);
    }

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet() || {};
      tokenHeader();
      await fetchCourses();
      await loadStudentsForSelection();
    });

    const fetchCourses = async () => {
      try {
        const response = await axios.get(
          `/courses?instituteId=${usuario.value.institute?.id}&exist=true`,
          tokenHeader()
        );
        availableCourses.value = response.data
          .filter((c) => c.id !== 0)
          .sort((a, b) => parseInt(a.name) - parseInt(b.name));
      } catch (error) {
        console.error("Error al cargar cursos para papelería:", error);
      }
    };

    const loadStudentsForSelection = async () => {
      loadingStudents.value = true;
      preparedCoursesData.value = [];

      try {
        const targetCourses =
          selectedCourseId.value === -1
            ? availableCourses.value
            : availableCourses.value.filter((c) => c.id === selectedCourseId.value);

        const promises = targetCourses.map(async (course) => {
          try {
            const res = await axios.get(
              `/courses/${course.id}/users?active=true&year=${selectedYear.value}`,
              tokenHeader()
            );
            const users = res.data.map((item) => item.user);
            const rawStudents = users.filter(
              (u) => u.rol === "student" || u.rol === "user"
            );

            // Sanitizar cada estudiante a datos planos y ligeros (evita proxies y objetos circulares de TypeORM)
            const students = rawStudents.map((u) => ({
              id: u.id,
              code: u.code ? String(u.code) : "",
              name: u.name ? String(u.name) : "",
              lastName: u.lastName ? String(u.lastName) : "",
              email: u.email ? String(u.email) : "",
              rol: u.rol || "student",
            }));

            // Ordenar alfabéticamente por apellido
            students.sort((a, b) => {
              const lastA = a.lastName || "";
              const lastB = b.lastName || "";
              return lastA.localeCompare(lastB);
            });

            return {
              id: course.id,
              name: course.name,
              students,
            };
          } catch (err) {
            console.error(`Error cargando estudiantes del curso ${course.name}:`, err);
            return {
              id: course.id,
              name: course.name,
              students: [],
            };
          }
        });

        const results = await Promise.all(promises);
        preparedCoursesData.value = results.filter((c) => c.students.length > 0);
      } catch (error) {
        console.error("Error al cargar datos para papelería:", error);
      } finally {
        loadingStudents.value = false;
      }
    };

    const onYearChange = async (event) => {
      if (event && event.detail && event.detail.value !== undefined) {
        selectedYear.value = event.detail.value;
      }
      await loadStudentsForSelection();
    };

    const onCourseChange = async (event) => {
      if (event && event.detail && event.detail.value !== undefined) {
        selectedCourseId.value = event.detail.value;
      }
      await loadStudentsForSelection();
    };

    const onYearOrCourseChange = async () => {
      await loadStudentsForSelection();
    };

    const totalSelectedStudents = computed(() => {
      return preparedCoursesData.value.reduce(
        (total, course) => total + (course.students?.length || 0),
        0
      );
    });

    const checkStudentsOrAlert = async () => {
      if (totalSelectedStudents.value === 0) {
        const alert = await alertController.create({
          header: "Sin Estudiantes",
          message:
            "El curso o selección actual no tiene estudiantes matriculados en el año seleccionado.",
          buttons: ["Entendido"],
        });
        await alert.present();
        return false;
      }
      return true;
    };

    // Navegación segura hacia los componentes de impresión
    const navigateToPrintable = async (routeName) => {
      if (!(await checkStudentsOrAlert())) return;

      const plainData = JSON.parse(JSON.stringify(preparedCoursesData.value));
      const yearVal = selectedYear.value;

      try {
        sessionStorage.setItem("pandora_printable_studentData", JSON.stringify(plainData));
        sessionStorage.setItem("pandora_printable_year", String(yearVal));
      } catch (err) {
        console.warn("No se pudo guardar en sessionStorage:", err);
      }

      // Si los datos son masivos (>80 estudiantes), no saturamos el history.state
      // para evitar QuotaExceededError o advertencias de push/replace State
      const totalStudents = totalSelectedStudents.value;
      const statePayload =
        totalStudents <= 80
          ? { studentData: plainData, year: yearVal }
          : { year: yearVal };

      try {
        await router.push({
          name: routeName,
          state: statePayload,
        });
      } catch (err) {
        console.warn("Fallo router.push con state, realizando fallback limpio:", err);
        await router.push({ name: routeName });
      }
    };

    // 1. Generar Lista de Estudiantes
    const generatePrintableList = async () => {
      await navigateToPrintable("PrintableStudentList");
    };

    // 2. Generar Hojas de Respuestas OMR
    const generatePrintableSheet = async () => {
      await navigateToPrintable("PrintableStudentSheet");
    };

    // 3. Generar Marcadores QR
    const generatePrintableQr = async () => {
      await navigateToPrintable("PrintableStudentQr");
    };

    // 4. Descargar CSV
    const downloadCSV = async () => {
      if (!(await checkStudentsOrAlert())) return;

      let csvContent = '"ROLLNO","NAME","CLASS","EMAILID","PHONENO"\r\n';
      const year = selectedYear.value;

      preparedCoursesData.value.forEach((course) => {
        course.students.forEach((student) => {
          const rollNo = student.code ? String(student.code).substring(1) : "";
          const name = `${student.lastName} ${student.name}`;
          const className = `${course.name}-${year}`;
          const email = student.email || "";
          const phoneNo = "";
          const row = `"${rollNo}","${name}","${className}","${email}","${phoneNo}"`;
          csvContent += row + "\r\n";
        });
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const filename =
        selectedCourseId.value === -1
          ? `estudiantes_todos_los_cursos_${year}.csv`
          : `estudiantes_curso_${preparedCoursesData.value[0]?.name || "curso"}_${year}.csv`;

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    return {
      router,
      selectedYear,
      years,
      availableCourses,
      selectedCourseId,
      loadingStudents,
      totalSelectedStudents,
      onYearChange,
      onCourseChange,
      onYearOrCourseChange,
      generatePrintableList,
      generatePrintableSheet,
      generatePrintableQr,
      downloadCSV,
      // Iconos
      arrowBackOutline,
      calendarOutline,
      schoolOutline,
      peopleOutline,
      libraryOutline,
      clipboardOutline,
      documentTextOutline,
      qrCodeOutline,
      downloadOutline,
      printOutline,
      scanOutline,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM: PAPELERÍA Y FORMATOS
   ========================================================================== */

.qz-papeleria-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-papeleria-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-papeleria-wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 70px;
  box-sizing: border-box;
}

/* 1. HERO HEADER */
.qz-hero-header {
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  padding: 40px 24px 32px;
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(106, 90, 224, 0.2);
}

.qz-hero-top-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.qz-back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.qz-back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.qz-hero-tag {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 5px 12px;
  border-radius: 20px;
  backdrop-filter: blur(8px);
}

.qz-hero-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}

.qz-hero-subtitle {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
  line-height: 1.4;
  max-width: 650px;
}

/* 2. CUERPO DE CONTENIDO */
.qz-papeleria-body {
  padding: 24px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* CARDS DE PASO */
.qz-config-card,
.qz-formats-section {
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(106, 90, 224, 0.06);
  border: 1px solid rgba(106, 90, 224, 0.08);
}

.qz-card-header-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.qz-step-badge {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #efeefc;
  color: #6a5ae0;
  font-weight: 800;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qz-step-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #110d26;
}

.qz-step-desc {
  margin: 3px 0 0;
  font-size: 13px;
  color: #858494;
}

/* FILTROS COMPACTOS QUEEZY */
.qz-filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 18px;
}

@media (max-width: 600px) {
  .qz-filters-grid {
    grid-template-columns: 1fr;
  }
}

.qz-field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.qz-field-label {
  font-size: 11.5px;
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
  padding: 0 10px 0 38px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.qz-select-wrapper:hover,
.qz-select-wrapper:focus-within {
  border-color: #6a5ae0;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.12);
}

.qz-field-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
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
  color: #110d26;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-compact-select::part(container) {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}

.qz-compact-select::part(text) {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #110d26;
}

.qz-compact-select::part(icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6a5ae0;
  opacity: 0.75;
  font-size: 17px;
}

/* RESUMEN DE SELECCIÓN */
.qz-selection-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 14px;
  color: #166534;
  font-size: 13px;
}

.qz-summary-stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qz-summary-stat ion-icon {
  font-size: 17px;
  color: #22c55e;
}

.qz-loading-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #efeefc;
  border-radius: 14px;
  color: #6a5ae0;
  font-size: 13px;
  font-weight: 600;
}

/* FORMATS GRID */
.qz-formats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 18px;
}

.qz-format-card {
  background: #ffffff;
  border: 1.5px solid rgba(106, 90, 224, 0.1);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: all 0.25s ease;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.03);
}

.qz-format-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(106, 90, 224, 0.12);
  border-color: rgba(106, 90, 224, 0.3);
}

.qz-card--disabled {
  opacity: 0.6;
  filter: grayscale(0.5);
  pointer-events: none;
}

.qz-format-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.qz-format-icon-squircle {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.qz-icon--purple {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-icon--cyan {
  background: #e0f7fa;
  color: #00acc1;
}

.qz-icon--gold {
  background: #fff8e1;
  color: #ffb300;
}

.qz-icon--green {
  background: #e8f5e9;
  color: #2e7d32;
}

.qz-format-tag {
  font-size: 10px;
  font-weight: 800;
  color: #858494;
  background: #f4f3fd;
  padding: 4px 8px;
  border-radius: 8px;
  letter-spacing: 0.5px;
}

.qz-format-name {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  color: #110d26;
  line-height: 1.3;
}

.qz-format-desc {
  margin: 0 0 18px;
  font-size: 13px;
  color: #858494;
  line-height: 1.45;
  flex-grow: 1;
}

.qz-format-btn {
  border: none;
  border-radius: 14px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  color: #ffffff;
}

.qz-btn--purple {
  background: #6a5ae0;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.3);
}

.qz-btn--purple:hover:not(:disabled) {
  background: #5b4cc9;
  transform: translateY(-2px);
}

.qz-btn--cyan {
  background: #00acc1;
  box-shadow: 0 4px 12px rgba(0, 172, 193, 0.3);
}

.qz-btn--cyan:hover:not(:disabled) {
  background: #0097a7;
  transform: translateY(-2px);
}

.qz-btn--gold {
  background: #f59e0b;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.qz-btn--gold:hover:not(:disabled) {
  background: #d97706;
  transform: translateY(-2px);
}

.qz-btn--green {
  background: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.qz-btn--green:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-2px);
}

.qz-format-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* ==========================================================================
   DARK MODE
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  .qz-papeleria-page {
    --background: #110d26;
    background-color: #110d26;
  }
  .qz-hero-header {
    background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
  }
  .qz-config-card,
  .qz-formats-section {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  }
  .qz-step-badge {
    background: #2b2254;
    color: #b5a9ff;
  }
  .qz-step-title {
    color: #ffffff;
  }
  .qz-step-desc {
    color: #a49fc4;
  }
  .qz-field-label {
    color: #b5a9ff;
  }
  .qz-select-wrapper {
    background: #241d42;
    border-color: rgba(255, 255, 255, 0.12);
  }
  .qz-select-wrapper:hover,
  .qz-select-wrapper:focus-within {
    background: #2a2250;
    border-color: #8c7ef8;
    box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.2);
  }
  .qz-field-icon {
    color: #b5a9ff;
  }
  .qz-compact-select {
    --color: #ffffff;
    color: #ffffff;
  }
  .qz-compact-select::part(text) {
    color: #ffffff;
  }
  .qz-compact-select::part(icon) {
    color: #b5a9ff;
  }
  .qz-selection-summary {
    background: rgba(34, 197, 94, 0.12);
    border-color: rgba(34, 197, 94, 0.25);
    color: #86efac;
  }
  .qz-loading-indicator {
    background: #2b2254;
    color: #b5a9ff;
  }
  .qz-format-card {
    background: #231d42;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .qz-format-name {
    color: #ffffff;
  }
  .qz-format-desc {
    color: #a49fc4;
  }
  .qz-format-tag {
    background: #2e2659;
    color: #c4beea;
  }
  .qz-icon--purple {
    background: #2e2659;
    color: #a594fd;
  }
  .qz-icon--cyan {
    background: rgba(0, 172, 193, 0.2);
    color: #4dd0e1;
  }
  .qz-icon--gold {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
  }
  .qz-icon--green {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
  }
}

:global(body.dark) .qz-papeleria-page,
:global(html.dark) .qz-papeleria-page,
:global(.dark) .qz-papeleria-page {
  --background: #110d26;
  background-color: #110d26;
}

:global(body.dark) .qz-hero-header,
:global(html.dark) .qz-hero-header,
:global(.dark) .qz-hero-header {
  background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
}

:global(body.dark) .qz-config-card,
:global(html.dark) .qz-config-card,
:global(.dark) .qz-config-card,
:global(body.dark) .qz-formats-section,
:global(html.dark) .qz-formats-section,
:global(.dark) .qz-formats-section {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

:global(body.dark) .qz-step-badge,
:global(html.dark) .qz-step-badge,
:global(.dark) .qz-step-badge {
  background: #2b2254;
  color: #b5a9ff;
}

:global(body.dark) .qz-step-title,
:global(html.dark) .qz-step-title,
:global(.dark) .qz-step-title {
  color: #ffffff;
}

:global(body.dark) .qz-step-desc,
:global(html.dark) .qz-step-desc,
:global(.dark) .qz-step-desc {
  color: #a49fc4;
}

:global(body.dark) .qz-field-label,
:global(html.dark) .qz-field-label,
:global(.dark) .qz-field-label {
  color: #b5a9ff;
}

:global(body.dark) .qz-select-wrapper,
:global(html.dark) .qz-select-wrapper,
:global(.dark) .qz-select-wrapper {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(body.dark) .qz-select-wrapper:hover,
:global(html.dark) .qz-select-wrapper:hover,
:global(.dark) .qz-select-wrapper:hover,
:global(body.dark) .qz-select-wrapper:focus-within,
:global(html.dark) .qz-select-wrapper:focus-within,
:global(.dark) .qz-select-wrapper:focus-within {
  background: #2a2250;
  border-color: #8c7ef8;
  box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.2);
}

:global(body.dark) .qz-field-icon,
:global(html.dark) .qz-field-icon,
:global(.dark) .qz-field-icon {
  color: #b5a9ff;
}

:global(body.dark) .qz-compact-select,
:global(html.dark) .qz-compact-select,
:global(.dark) .qz-compact-select {
  --color: #ffffff;
  color: #ffffff;
}

:global(body.dark) .qz-compact-select::part(text),
:global(html.dark) .qz-compact-select::part(text),
:global(.dark) .qz-compact-select::part(text) {
  color: #ffffff;
}

:global(body.dark) .qz-compact-select::part(icon),
:global(html.dark) .qz-compact-select::part(icon),
:global(.dark) .qz-compact-select::part(icon) {
  color: #b5a9ff;
}

:global(body.dark) .qz-selection-summary,
:global(html.dark) .qz-selection-summary,
:global(.dark) .qz-selection-summary {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.25);
  color: #86efac;
}

:global(body.dark) .qz-loading-indicator,
:global(html.dark) .qz-loading-indicator,
:global(.dark) .qz-loading-indicator {
  background: #2b2254;
  color: #b5a9ff;
}

:global(body.dark) .qz-format-card,
:global(html.dark) .qz-format-card,
:global(.dark) .qz-format-card {
  background: #231d42;
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-format-name,
:global(html.dark) .qz-format-name,
:global(.dark) .qz-format-name {
  color: #ffffff;
}

:global(body.dark) .qz-format-desc,
:global(html.dark) .qz-format-desc,
:global(.dark) .qz-format-desc {
  color: #a49fc4;
}

:global(body.dark) .qz-format-tag,
:global(html.dark) .qz-format-tag,
:global(.dark) .qz-format-tag {
  background: #2e2659;
  color: #c4beea;
}

:global(body.dark) .qz-icon--purple,
:global(html.dark) .qz-icon--purple,
:global(.dark) .qz-icon--purple {
  background: #2e2659;
  color: #a594fd;
}

:global(body.dark) .qz-icon--cyan,
:global(html.dark) .qz-icon--cyan,
:global(.dark) .qz-icon--cyan {
  background: rgba(0, 172, 193, 0.2);
  color: #4dd0e1;
}

:global(body.dark) .qz-icon--gold,
:global(html.dark) .qz-icon--gold,
:global(.dark) .qz-icon--gold {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

:global(body.dark) .qz-icon--green,
:global(html.dark) .qz-icon--green,
:global(.dark) .qz-icon--green {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}
</style>
