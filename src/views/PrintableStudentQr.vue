<template>
  <ion-page class="ion-page qz-print-page">
    <ion-content
      :fullscreen="true"
      class="qz-print-content"
      :force-overscroll="false"
    >
      <div class="qz-print-wrapper">
        <!-- 1. CABECERA HERO QUEEZY -->
        <header class="qz-hero-header">
          <div class="qz-hero-inner">
            <div class="qz-hero-top">
              <button
                type="button"
                class="qz-back-btn"
                title="Volver a papelería"
                aria-label="Volver"
                @click="goBack"
              >
                <ion-icon :icon="arrowBackOutline"></ion-icon>
              </button>
              <span class="qz-hero-tag">PAPELERÍA & MARCADORES</span>
            </div>

            <div class="qz-hero-title-row">
              <div>
                <h1 class="qz-hero-title">Marcadores de Respuestas</h1>
                <p class="qz-hero-subtitle">
                  Tarjetas de rotación de 4 opciones (A, B, C, D) para escaneo rápido
                </p>
              </div>

              <button
                type="button"
                class="qz-hero-action-btn"
                :disabled="allStudents.length === 0"
                title="Imprimir todos los marcadores"
                @click="() => printAllQrs()"
              >
                <ion-icon :icon="printOutline"></ion-icon>
                <span>Imprimir Todos</span>
              </button>
            </div>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-print-body">
          <!-- Tarjeta de información del formato rotativo -->
          <section class="qz-card qz-info-card">
            <div class="qz-card-header-row">
              <div class="qz-card-icon-squircle qz-icon--gold">
                <ion-icon :icon="matrixMarkerOutline"></ion-icon>
              </div>
              <div class="qz-card-header-info">
                <h2 class="qz-info-title">Formato Rotativo (4 Opciones)</h2>
                <p class="qz-info-subtitle">
                  Cada estudiante responde girando su tarjeta: <strong>A</strong> arriba, <strong>B</strong> derecha, <strong>C</strong> abajo, <strong>D</strong> izquierda.
                </p>
              </div>
            </div>

            <!-- Resumen de rotaciones -->
            <div class="qz-rotations-summary">
              <div class="qz-rotation-item">
                <span class="qz-rot-letter">A</span>
                <span class="qz-rot-label">Arriba</span>
              </div>
              <div class="qz-rot-divider"></div>
              <div class="qz-rotation-item">
                <span class="qz-rot-letter">B</span>
                <span class="qz-rot-label">Derecha</span>
              </div>
              <div class="qz-rot-divider"></div>
              <div class="qz-rotation-item">
                <span class="qz-rot-letter">C</span>
                <span class="qz-rot-label">Abajo</span>
              </div>
              <div class="qz-rot-divider"></div>
              <div class="qz-rotation-item">
                <span class="qz-rot-letter">D</span>
                <span class="qz-rot-label">Izquierda</span>
              </div>
            </div>
          </section>

          <!-- Encabezado del listado -->
          <div class="qz-list-header">
            <span class="qz-list-title">Estudiantes disponibles</span>
            <span class="qz-count-pill">{{ allStudents.length }}</span>
          </div>

          <!-- Estado vacío si no hay estudiantes -->
          <div v-if="allStudents.length === 0" class="qz-card qz-state-card">
            <div class="qz-empty-icon">
              <ion-icon :icon="peopleOutline"></ion-icon>
            </div>
            <h3 class="qz-empty-title">Sin estudiantes seleccionados</h3>
            <p class="qz-state-text">
              No se encontraron estudiantes para generar marcadores. Regresa a papelería y selecciona al menos un curso.
            </p>
            <button type="button" class="qz-primary-btn" @click="goBack">
              <ion-icon :icon="arrowBackOutline"></ion-icon>
              <span>Regresar a Papelería</span>
            </button>
          </div>

          <!-- Listado de estudiantes en tarjetas Queezy -->
          <div v-else class="qz-students-grid">
            <div
              v-for="student in allStudents"
              :key="student.id"
              class="qz-card qz-student-card"
              @click="openSingleStudentQr(student)"
            >
              <div class="qz-student-left">
                <div class="qz-card-icon-squircle qz-icon--purple">
                  <ion-icon :icon="personOutline"></ion-icon>
                </div>
                <div class="qz-student-info">
                  <h3 class="qz-student-name">
                    {{ student.lastName }} {{ student.name }}
                  </h3>
                  <div class="qz-student-meta">
                    <span v-if="student.code" class="qz-student-code">Cód. {{ student.code }}</span>
                    <span v-if="student.courseName" class="qz-student-course">
                      {{ student.courseName }}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="qz-view-sheet-btn"
                title="Ver marcador individual"
                aria-label="Ver marcador individual"
              >
                <ion-icon :icon="eyeOutline"></ion-icon>
                <span>Ver tarjeta</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      <!-- MODAL DE MARCADOR INDIVIDUAL -->
      <ion-modal
        :is-open="isStudentModalOpen"
        @didDismiss="closeStudentModal"
        class="qz-marker-modal"
      >
        <div class="qz-modal-wrap">
          <header class="qz-modal-header">
            <div class="qz-modal-header-info">
              <span class="qz-modal-tag">TARJETA DE RESPUESTA</span>
              <h2 class="qz-modal-title">
                {{ selectedStudent?.lastName }} {{ selectedStudent?.name }}
              </h2>
            </div>
            <button
              type="button"
              class="qz-modal-close-btn"
              title="Cerrar ventana"
              @click="closeStudentModal"
            >
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </header>

          <div class="qz-modal-body" v-if="selectedStudent">
            <!-- Instrucción de rotación -->
            <div class="qz-modal-instruccion">
              <p class="qz-instruccion-text">
                Para responder se rota la hoja según la opción elegida:
              </p>
              <div class="qz-modal-pills">
                <span class="qz-rot-badge"><strong>A</strong> Arriba</span>
                <span class="qz-rot-badge"><strong>B</strong> Derecha</span>
                <span class="qz-rot-badge"><strong>C</strong> Abajo</span>
                <span class="qz-rot-badge"><strong>D</strong> Izquierda</span>
              </div>
            </div>

            <!-- Vista previa del marcador -->
            <div class="qz-marker-preview-box">
              <img
                v-if="singleMarkerPreviewUrl"
                :src="singleMarkerPreviewUrl"
                class="qz-marker-preview-img"
                alt="Vista previa del marcador"
              />
              <div v-else class="qz-marker-loading">
                <ion-spinner name="crescent" class="qz-modal-spinner"></ion-spinner>
                <span>Generando tarjeta...</span>
              </div>
            </div>

            <!-- Acciones del modal -->
            <div class="qz-modal-actions">
              <button
                type="button"
                class="qz-modal-btn qz-btn--secondary"
                @click="printAllQrsForStudent(selectedStudent)"
              >
                <ion-icon :icon="printOutline"></ion-icon>
                <span>Imprimir Opciones</span>
              </button>
              <button
                type="button"
                class="qz-modal-btn qz-btn--primary"
                @click="printQrItem(selectedStudent)"
              >
                <ion-icon :icon="downloadOutline"></ion-icon>
                <span>Descargar Tarjeta</span>
              </button>
            </div>
          </div>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonIcon,
  IonModal,
  IonSpinner,
  actionSheetController,
  alertController,
} from "@ionic/vue";
import {
  printOutline,
  arrowBackOutline,
  peopleOutline,
  personOutline,
  eyeOutline,
  downloadOutline,
  closeOutline,
} from "ionicons/icons";
import { matrixMarkerOutline } from "../utils/customIcons";
import { ref, computed, onMounted } from "vue";
import { FileSharer } from "@byteowls/capacitor-filesharer";
import { Capacitor } from "@capacitor/core";
import { markGridForId, GRID_SIZE } from "../utils/matrixPattern";
import router from "../router";

export default {
  name: "PrintableStudentQr",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    IonModal,
    IonSpinner,
  },
  setup() {
    const studentData = ref([]);
    const isStudentModalOpen = ref(false);
    const selectedStudent = ref(null);
    const singleMarkerPreviewUrl = ref("");
    const qrsPerPage = ref(6);

    // Rango fijo a 4 opciones canónicas (A, B, C, D)
    const optionRange = computed(() => ["A", "B", "C", "D"]);

    const allStudents = computed(() => {
      if (!studentData.value || studentData.value.length === 0) return [];
      if (studentData.value.length === 1)
        return studentData.value[0]?.students || [];
      return studentData.value.flatMap((c) =>
        (c.students || []).map((s) => ({ ...s, courseName: c.name }))
      );
    });

    onMounted(() => {
      let data = window.history.state?.studentData;
      if (!data) {
        try {
          const stored = sessionStorage.getItem("pandora_printable_studentData");
          if (stored) data = JSON.parse(stored);
        } catch (e) {
          console.error("Error al leer sessionStorage en PrintableStudentQr:", e);
        }
      }
      if (data) {
        studentData.value = data;
      }
    });

    const goBack = () => {
      router.push("/admin/papeleria");
    };

    const openSingleStudentQr = async (student) => {
      selectedStudent.value = student;
      singleMarkerPreviewUrl.value = "";
      isStudentModalOpen.value = true;
      try {
        singleMarkerPreviewUrl.value = await drawMarkerToDataURL(
          student.id,
          optionRange.value,
          `Nombre: ${student.lastName} ${student.name}`,
          180
        );
      } catch (e) {
        console.error("Error generando vista previa:", e);
      }
    };

    const closeStudentModal = () => {
      isStudentModalOpen.value = false;
      selectedStudent.value = null;
      singleMarkerPreviewUrl.value = "";
    };

    // Dibuja el marcador 6x6 del alumno en un canvas y devuelve un PNG.
    const drawMarkerToDataURL = (
      studentId,
      letters,
      footerText,
      cellPx = 64
    ) => {
      return new Promise((resolve, reject) => {
        try {
          const grid = markGridForId(studentId);
          const markerSize = GRID_SIZE * cellPx;
          const pad = 56;
          const footerHeight = 90;
          const canvas = document.createElement("canvas");
          canvas.width = markerSize + pad * 2;
          canvas.height = markerSize + pad * 2 + footerHeight;
          const ctx = canvas.getContext("2d");

          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              if (grid[r][c] === 1) {
                ctx.fillStyle = "black";
                ctx.fillRect(
                  pad + c * cellPx,
                  pad + r * cellPx,
                  cellPx,
                  cellPx
                );
              }
            }
          }

          const cx = canvas.width / 2;
          const my = pad + markerSize / 2;
          ctx.fillStyle = "black";
          ctx.font = "bold 30px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const letterPos = [
            { text: letters[0] || "", x: cx, y: pad / 2 },
            { text: letters[1] || "", x: canvas.width - pad / 2, y: my },
            { text: letters[2] || "", x: cx, y: pad + markerSize + pad / 2 },
            { text: letters[3] || "", x: pad / 2, y: my },
          ];
          for (const p of letterPos) {
            if (p.text) ctx.fillText(p.text, p.x, p.y);
          }

          ctx.font = "bold 16px sans-serif";
          ctx.fillText(footerText || "", cx, canvas.height - footerHeight / 2);

          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          reject(e);
        }
      });
    };

    const buildQrPdfDocument = async (studentsList, range, perPage) => {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        unit: "mm",
        format: "legal",
        orientation: "portrait",
      });

      const pageWidth = 215.9;
      const pageHeight = 355.6;

      // Resolución balanceada para máxima nitidez y rendimiento instantáneo
      const cellPx = perPage === 1 ? 140 : perPage === 2 ? 100 : 70;

      for (let i = 0; i < studentsList.length; i++) {
        const student = studentsList[i];
        const slot = i % perPage;

        if (i > 0 && slot === 0) {
          pdf.addPage("legal", "portrait");
        }

        const dataUrl = await drawMarkerToDataURL(
          student.id,
          range,
          `Nombre: ${student.lastName} ${student.name}`,
          cellPx
        );

        if (perPage === 1) {
          const cardW = 180;
          const cardH = cardW * 1.126;
          const x = (pageWidth - cardW) / 2;
          const y = (pageHeight - cardH) / 2;
          pdf.setDrawColor(220, 220, 220);
          pdf.rect(x - 2, y - 2, cardW + 4, cardH + 4);
          pdf.addImage(dataUrl, "PNG", x, y, cardW, cardH, undefined, "FAST");
        } else if (perPage === 2) {
          const cardW = 145;
          const cardH = cardW * 1.126;
          const x = (pageWidth - cardW) / 2;
          const gapY = (pageHeight - cardH * 2) / 3;
          const y = gapY + slot * (cardH + gapY);
          pdf.setDrawColor(220, 220, 220);
          pdf.rect(x - 2, y - 2, cardW + 4, cardH + 4);
          pdf.addImage(dataUrl, "PNG", x, y, cardW, cardH, undefined, "FAST");
        } else {
          // 6 por página: 2 columnas x 3 filas
          const col = slot % 2;
          const row = Math.floor(slot / 2);
          const cardW = 94;
          const cardH = cardW * 1.126;
          const gapX = 10;
          const marginX = (pageWidth - (cardW * 2 + gapX)) / 2;
          const x = marginX + col * (cardW + gapX);
          const gapY = (pageHeight - cardH * 3) / 4;
          const y = gapY + row * (cardH + gapY);
          pdf.setDrawColor(220, 220, 220);
          pdf.rect(x - 1, y - 1, cardW + 2, cardH + 2);
          pdf.addImage(dataUrl, "PNG", x, y, cardW, cardH, undefined, "FAST");
        }
      }

      return pdf;
    };

    const presentOutputOptions = async (students, range) => {
      const loading = await alertController.create({
        header: "Generando PDF",
        message: "Creando tarjetas con jsPDF...",
        backdropDismiss: false,
      });
      await loading.present();

      try {
        const perPage = qrsPerPage.value;
        const pdf = await buildQrPdfDocument(students, range, perPage);
        await loading.dismiss();

        if (Capacitor.isNativePlatform()) {
          try {
            const base64Data = pdf.output("datauristring").split(",")[1];
            await FileSharer.share({
              filename: `Marcadores_${Date.now()}.pdf`,
              contentType: "application/pdf",
              base64Data: base64Data,
            });
          } catch (e) {
            const msg = (e?.message || "").toLowerCase();
            const isCancel =
              msg.includes("cancelled") ||
              msg.includes("user_cancelled") ||
              msg.includes("dismiss") ||
              msg.includes("user back") ||
              msg.includes("back button");

            if (!isCancel) {
              console.error("Error sharing PDF:", e);
              const errorAlert = await alertController.create({
                header: "Error",
                message: "Hubo un problema al compartir el PDF.",
                buttons: ["OK"],
              });
              await errorAlert.present();
            }
          }
        } else {
          const actionSheet = await actionSheetController.create({
            header: "Opciones de Salida",
            buttons: [
              {
                text: "Vista Previa / Imprimir PDF",
                icon: printOutline,
                handler: () => {
                  const blobUrl = pdf.output("bloburl");
                  window.open(blobUrl, "_blank");
                },
              },
              {
                text: "Descargar PDF",
                icon: downloadOutline,
                handler: () => {
                  pdf.save("Marcadores_estudiantes.pdf");
                },
              },
              { text: "Cancelar", role: "cancel" },
            ],
          });
          await actionSheet.present();
        }
      } catch (e) {
        console.error("Error generating QR PDF:", e);
        await loading.dismiss();
        const errAlert = await alertController.create({
          header: "Error",
          message: "No se pudo generar el documento PDF.",
          buttons: ["OK"],
        });
        await errAlert.present();
      }
    };

    const printAllQrs = async (targetStudents = null) => {
      const studentsToPrint = targetStudents || allStudents.value;
      const actionSheet = await actionSheetController.create({
        header: "Seleccione formato por página",
        buttons: [
          {
            text: "6 por página",
            handler: () => {
              qrsPerPage.value = 6;
              presentOutputOptions(studentsToPrint, optionRange.value);
            },
          },
          {
            text: "2 por página",
            handler: () => {
              qrsPerPage.value = 2;
              presentOutputOptions(studentsToPrint, optionRange.value);
            },
          },
          {
            text: "1 por página",
            handler: () => {
              qrsPerPage.value = 1;
              presentOutputOptions(studentsToPrint, optionRange.value);
            },
          },
          { text: "Cancelar", role: "cancel" },
        ],
      });
      await actionSheet.present();
    };

    const printAllQrsForStudent = (student) => printAllQrs([student]);

    const shareQrImage = async (student) => {
      const loading = await alertController.create({
        header: "Generando Marcador",
        message: "Espere un momento...",
        backdropDismiss: false,
      });
      await loading.present();

      try {
        const labelText = `Nombre: ${student.lastName} ${student.name}`;
        const dataUrl = await drawMarkerToDataURL(
          student.id,
          optionRange.value,
          labelText,
          220
        );
        const base64Content = dataUrl.split(",")[1];
        const filename = `Marcador_${student.lastName}.png`;

        if (Capacitor.isNativePlatform()) {
          await FileSharer.share({
            filename: filename,
            contentType: "image/png",
            base64Data: base64Content,
          });
        } else {
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = filename;
          link.click();
        }
      } catch (e) {
        const msg = (e?.message || "").toLowerCase();
        const isCancel =
          msg.includes("cancelled") ||
          msg.includes("user_cancelled") ||
          msg.includes("dismiss") ||
          msg.includes("user back") ||
          msg.includes("back button");

        if (!isCancel) {
          console.error("Error generating single marker image:", e);
          const errorAlert = await alertController.create({
            header: "Error",
            message:
              "No se pudo generar el marcador individual. " + (e?.message || ""),
            buttons: ["OK"],
          });
          await errorAlert.present();
        }
      } finally {
        await loading.dismiss();
      }
    };

    const printQrItem = (student) => shareQrImage(student);

    return {
      allStudents,
      isStudentModalOpen,
      selectedStudent,
      singleMarkerPreviewUrl,
      openSingleStudentQr,
      closeStudentModal,
      goBack,
      optionRange,
      printOutline,
      arrowBackOutline,
      peopleOutline,
      personOutline,
      eyeOutline,
      downloadOutline,
      closeOutline,
      matrixMarkerOutline,
      printAllQrs,
      printAllQrsForStudent,
      printQrItem,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM: MARCADORES DE RESPUESTA
   ========================================================================== */

.qz-print-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-print-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-print-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;
  padding-bottom: 60px;
}

/* 1. CABECERA HERO PÚRPURA */
.qz-hero-header {
  background: linear-gradient(135deg, #6a5ae0 0%, #7c6ef2 100%);
  padding: calc(env(safe-area-inset-top, 0px) + 16px) 20px 28px;
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;
  box-shadow: 0 10px 24px -4px rgba(106, 90, 224, 0.28);
  color: #ffffff;
}

.qz-hero-inner {
  max-width: 820px;
  margin: 0 auto;
}

.qz-hero-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.qz-back-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-back-btn:hover {
  background: rgba(255, 255, 255, 0.32);
}

.qz-back-btn:active {
  transform: scale(0.92);
}

.qz-hero-tag {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.18);
  padding: 4px 10px;
  border-radius: 10px;
}

.qz-hero-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.qz-hero-title {
  margin: 0;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.3px;
}

.qz-hero-subtitle {
  margin: 4px 0 0;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
}

.qz-hero-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.qz-hero-action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.32);
  transform: translateY(-1px);
}

.qz-hero-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 2. CUERPO PRINCIPAL */
.qz-print-body {
  padding: 20px 16px 24px;
  max-width: 820px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 18px 20px;
  border: 1px solid rgba(106, 90, 224, 0.12);
  box-shadow: 0 6px 18px rgba(12, 9, 42, 0.05);
  box-sizing: border-box;
}

/* TARJETA INFORMATIVA */
.qz-info-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-card-header-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.qz-card-icon-squircle {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.qz-icon--gold {
  background: #fff8e6;
  color: #f5a623;
}

.qz-icon--purple {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-card-header-info {
  flex: 1;
}

.qz-info-title {
  margin: 0;
  font-size: 16.5px;
  font-weight: 800;
  color: #0c092a;
}

.qz-info-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: #858494;
  line-height: 1.4;
}

/* RESUMEN DE ROTACIONES */
.qz-rotations-summary {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #f4f3fd;
  border-radius: 16px;
  padding: 12px 14px;
  gap: 8px;
}

.qz-rotation-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.qz-rot-letter {
  font-size: 16px;
  font-weight: 800;
  color: #6a5ae0;
}

.qz-rot-label {
  font-size: 11px;
  font-weight: 600;
  color: #858494;
  text-transform: uppercase;
}

.qz-rot-divider {
  width: 1px;
  height: 28px;
  background: rgba(106, 90, 224, 0.16);
}

/* LIST HEADER */
.qz-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  padding: 0 4px;
}

.qz-list-title {
  font-size: 13.5px;
  font-weight: 800;
  color: #0c092a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qz-count-pill {
  background: #efeefc;
  color: #6a5ae0;
  font-size: 12px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 12px;
}

/* ESTADO VACÍO */
.qz-state-card {
  text-align: center;
  padding: 36px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.qz-empty-icon {
  font-size: 48px;
  color: #6a5ae0;
  margin-bottom: 4px;
}

.qz-empty-title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: #0c092a;
}

.qz-state-text {
  margin: 0 auto 16px;
  max-width: 440px;
  font-size: 13.5px;
  color: #858494;
}

.qz-primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 14px;
  border: none;
  background: #6a5ae0;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;
}

.qz-primary-btn:hover {
  background: #5a4ad0;
}

/* GRID DE ESTUDIANTES */
.qz-students-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qz-student-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 18px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.qz-student-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(12, 9, 42, 0.08);
}

.qz-student-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.qz-student-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.qz-student-name {
  margin: 0;
  font-size: 14.5px;
  font-weight: 700;
  color: #0c092a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-student-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #858494;
}

.qz-student-code {
  font-weight: 600;
}

.qz-student-course {
  background: #efeefc;
  color: #6a5ae0;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 11px;
}

.qz-view-sheet-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid rgba(106, 90, 224, 0.2);
  background: #efeefc;
  color: #6a5ae0;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.qz-view-sheet-btn:hover {
  background: #6a5ae0;
  color: #ffffff;
}

/* ==========================================================================
   MODAL DE MARCADOR
   ========================================================================== */

.qz-marker-modal {
  --border-radius: 24px;
  --max-width: 520px;
}

.qz-modal-wrap {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 24px;
  overflow: hidden;
  max-height: 90vh;
}

.qz-modal-header {
  background: linear-gradient(135deg, #6a5ae0 0%, #7c6ef2 100%);
  padding: 18px 20px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-modal-header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.qz-modal-tag {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
}

.qz-modal-title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: #ffffff;
}

.qz-modal-close-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-radius: 50%;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
}

.qz-modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  overflow-y: auto;
}

.qz-modal-instruccion {
  width: 100%;
  background: #f4f3fd;
  border-radius: 16px;
  padding: 12px 14px;
  box-sizing: border-box;
}

.qz-instruccion-text {
  margin: 0 0 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: #0c092a;
}

.qz-modal-pills {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  flex-wrap: wrap;
}

.qz-rot-badge {
  background: #ffffff;
  border: 1px solid rgba(106, 90, 224, 0.15);
  border-radius: 10px;
  padding: 4px 8px;
  font-size: 11.5px;
  color: #6a5ae0;
}

.qz-rot-badge strong {
  font-weight: 800;
}

/* CAJA DE VISTA PREVIA */
.qz-marker-preview-box {
  width: 250px;
  height: 280px;
  background: #ffffff;
  border: 1.5px solid rgba(106, 90, 224, 0.16);
  border-radius: 18px;
  box-shadow: 0 6px 20px rgba(12, 9, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 10px;
  box-sizing: border-box;
}

.qz-marker-preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.qz-marker-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #858494;
  font-size: 13px;
  font-weight: 600;
}

.qz-modal-spinner {
  --color: #6a5ae0;
}

/* BOTONES DE ACCIÓN DEL MODAL */
.qz-modal-actions {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 4px;
}

.qz-modal-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 14px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qz-btn--primary {
  background: #6a5ae0;
  border: none;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.35);
}

.qz-btn--primary:hover {
  background: #5a4ad0;
}

.qz-btn--secondary {
  background: #efeefc;
  border: 1.5px solid rgba(106, 90, 224, 0.2);
  color: #6a5ae0;
}

.qz-btn--secondary:hover {
  background: #e4e1fb;
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */

@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-print-page,
  body:not(.light) .qz-print-content,
  body:not(.light) .qz-marker-modal,
  body:not(.light) .qz-modal-wrap {
    --background: #120f24;
    background-color: #120f24;
  }

  body:not(.light) .qz-hero-header,
  body:not(.light) .qz-modal-header {
    background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
  }

  body:not(.light) .qz-hero-tag,
  body:not(.light) .qz-modal-tag {
    background: rgba(255, 255, 255, 0.1);
    color: #b5a9ff;
  }

  body:not(.light) .qz-card {
    background: #1d1838;
    border-color: rgba(181, 169, 255, 0.12);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
  }

  body:not(.light) .qz-info-title,
  body:not(.light) .qz-empty-title,
  body:not(.light) .qz-student-name,
  body:not(.light) .qz-list-title,
  body:not(.light) .qz-instruccion-text {
    color: #f7f7fd;
  }

  body:not(.light) .qz-info-subtitle,
  body:not(.light) .qz-state-text,
  body:not(.light) .qz-student-meta,
  body:not(.light) .qz-rot-label {
    color: #a5a3b9;
  }

  body:not(.light) .qz-rotations-summary,
  body:not(.light) .qz-modal-instruccion {
    background: #241d42;
  }

  body:not(.light) .qz-rot-letter {
    color: #b5a9ff;
  }

  body:not(.light) .qz-rot-divider {
    background: rgba(181, 169, 255, 0.16);
  }

  body:not(.light) .qz-count-pill,
  body:not(.light) .qz-icon--purple,
  body:not(.light) .qz-student-course,
  body:not(.light) .qz-rot-badge,
  body:not(.light) .qz-view-sheet-btn,
  body:not(.light) .qz-btn--secondary {
    background: #2b2254;
    color: #b5a9ff;
    border-color: rgba(181, 169, 255, 0.2);
  }

  body:not(.light) .qz-icon--gold {
    background: #3b2e1e;
    color: #fbbf24;
  }

  body:not(.light) .qz-marker-preview-box {
    background: #ffffff; /* El marcador siempre debe tener fondo blanco para contraste */
    border-color: rgba(181, 169, 255, 0.2);
  }
}

:global(body.dark) .qz-print-page,
:global(body.dark) .qz-print-content,
:global(body.dark) .qz-marker-modal,
:global(body.dark) .qz-modal-wrap,
:global(html.dark) .qz-print-page,
:global(html.dark) .qz-print-content,
:global(html.dark) .qz-marker-modal,
:global(html.dark) .qz-modal-wrap,
:global(.dark) .qz-print-page,
:global(.dark) .qz-print-content,
:global(.dark) .qz-marker-modal,
:global(.dark) .qz-modal-wrap,
:global(:root[data-theme="dark"]) .qz-print-page,
:global(:root[data-theme="dark"]) .qz-print-content,
:global(:root[data-theme="dark"]) .qz-marker-modal,
:global(:root[data-theme="dark"]) .qz-modal-wrap {
  --background: #120f24;
  background-color: #120f24;
}

:global(body.dark) .qz-hero-header,
:global(body.dark) .qz-modal-header,
:global(html.dark) .qz-hero-header,
:global(html.dark) .qz-modal-header,
:global(.dark) .qz-hero-header,
:global(.dark) .qz-modal-header,
:global(:root[data-theme="dark"]) .qz-hero-header,
:global(:root[data-theme="dark"]) .qz-modal-header {
  background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
}

:global(body.dark) .qz-hero-tag,
:global(body.dark) .qz-modal-tag,
:global(html.dark) .qz-hero-tag,
:global(html.dark) .qz-modal-tag,
:global(.dark) .qz-hero-tag,
:global(.dark) .qz-modal-tag,
:global(:root[data-theme="dark"]) .qz-hero-tag,
:global(:root[data-theme="dark"]) .qz-modal-tag {
  background: rgba(255, 255, 255, 0.1);
  color: #b5a9ff;
}

:global(body.dark) .qz-card,
:global(html.dark) .qz-card,
:global(.dark) .qz-card,
:global(:root[data-theme="dark"]) .qz-card {
  background: #1d1838;
  border-color: rgba(181, 169, 255, 0.12);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
}

:global(body.dark) .qz-info-title,
:global(body.dark) .qz-empty-title,
:global(body.dark) .qz-student-name,
:global(body.dark) .qz-list-title,
:global(body.dark) .qz-instruccion-text,
:global(html.dark) .qz-info-title,
:global(html.dark) .qz-empty-title,
:global(html.dark) .qz-student-name,
:global(html.dark) .qz-list-title,
:global(html.dark) .qz-instruccion-text,
:global(.dark) .qz-info-title,
:global(.dark) .qz-empty-title,
:global(.dark) .qz-student-name,
:global(.dark) .qz-list-title,
:global(.dark) .qz-instruccion-text,
:global(:root[data-theme="dark"]) .qz-info-title,
:global(:root[data-theme="dark"]) .qz-empty-title,
:global(:root[data-theme="dark"]) .qz-student-name,
:global(:root[data-theme="dark"]) .qz-list-title,
:global(:root[data-theme="dark"]) .qz-instruccion-text {
  color: #f7f7fd;
}

:global(body.dark) .qz-info-subtitle,
:global(body.dark) .qz-state-text,
:global(body.dark) .qz-student-meta,
:global(body.dark) .qz-rot-label,
:global(html.dark) .qz-info-subtitle,
:global(html.dark) .qz-state-text,
:global(html.dark) .qz-student-meta,
:global(html.dark) .qz-rot-label,
:global(.dark) .qz-info-subtitle,
:global(.dark) .qz-state-text,
:global(.dark) .qz-student-meta,
:global(.dark) .qz-rot-label,
:global(:root[data-theme="dark"]) .qz-info-subtitle,
:global(:root[data-theme="dark"]) .qz-state-text,
:global(:root[data-theme="dark"]) .qz-student-meta,
:global(:root[data-theme="dark"]) .qz-rot-label {
  color: #a5a3b9;
}

:global(body.dark) .qz-rotations-summary,
:global(body.dark) .qz-modal-instruccion,
:global(html.dark) .qz-rotations-summary,
:global(html.dark) .qz-modal-instruccion,
:global(.dark) .qz-rotations-summary,
:global(.dark) .qz-modal-instruccion,
:global(:root[data-theme="dark"]) .qz-rotations-summary,
:global(:root[data-theme="dark"]) .qz-modal-instruccion {
  background: #241d42;
}

:global(body.dark) .qz-rot-letter,
:global(html.dark) .qz-rot-letter,
:global(.dark) .qz-rot-letter,
:global(:root[data-theme="dark"]) .qz-rot-letter {
  color: #b5a9ff;
}

:global(body.dark) .qz-rot-divider,
:global(html.dark) .qz-rot-divider,
:global(.dark) .qz-rot-divider,
:global(:root[data-theme="dark"]) .qz-rot-divider {
  background: rgba(181, 169, 255, 0.16);
}

:global(body.dark) .qz-count-pill,
:global(body.dark) .qz-icon--purple,
:global(body.dark) .qz-student-course,
:global(body.dark) .qz-rot-badge,
:global(body.dark) .qz-view-sheet-btn,
:global(body.dark) .qz-btn--secondary,
:global(html.dark) .qz-count-pill,
:global(html.dark) .qz-icon--purple,
:global(html.dark) .qz-student-course,
:global(html.dark) .qz-rot-badge,
:global(html.dark) .qz-view-sheet-btn,
:global(html.dark) .qz-btn--secondary,
:global(.dark) .qz-count-pill,
:global(.dark) .qz-icon--purple,
:global(.dark) .qz-student-course,
:global(.dark) .qz-rot-badge,
:global(.dark) .qz-view-sheet-btn,
:global(.dark) .qz-btn--secondary,
:global(:root[data-theme="dark"]) .qz-count-pill,
:global(:root[data-theme="dark"]) .qz-icon--purple,
:global(:root[data-theme="dark"]) .qz-student-course,
:global(:root[data-theme="dark"]) .qz-rot-badge,
:global(:root[data-theme="dark"]) .qz-view-sheet-btn,
:global(:root[data-theme="dark"]) .qz-btn--secondary {
  background: #2b2254;
  color: #b5a9ff;
  border-color: rgba(181, 169, 255, 0.2);
}

:global(body.dark) .qz-icon--gold,
:global(html.dark) .qz-icon--gold,
:global(.dark) .qz-icon--gold,
:global(:root[data-theme="dark"]) .qz-icon--gold {
  background: #3b2e1e;
  color: #fbbf24;
}

:global(body.dark) .qz-marker-preview-box,
:global(html.dark) .qz-marker-preview-box,
:global(.dark) .qz-marker-preview-box,
:global(:root[data-theme="dark"]) .qz-marker-preview-box {
  background: #ffffff;
  border-color: rgba(181, 169, 255, 0.2);
}
</style>
