<template>
  <ion-page class="ion-page qz-print-page">
    <ion-content :fullscreen="true" class="qz-print-content">
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
              <span class="qz-hero-tag">PAPELERÍA</span>
            </div>
            <div class="qz-hero-title-row">
              <div>
                <h1 class="qz-hero-title">Lista de Estudiantes</h1>
                <p class="qz-hero-subtitle">
                  Visualiza e imprime las listas oficiales por curso
                </p>
              </div>
              <button
                type="button"
                class="qz-hero-action-btn"
                title="Opciones de impresión"
                @click="showOptions"
              >
                <ion-icon :icon="printOutline"></ion-icon>
                <span>Imprimir / Exportar</span>
              </button>
            </div>
          </div>
        </header>

        <!-- 2. CUERPO PRINCIPAL -->
        <main class="qz-print-body">
          <!-- Banner de información y año -->
          <div class="qz-card qz-info-card">
            <div class="qz-info-left">
              <div class="qz-card-icon-squircle qz-icon--purple">
                <ion-icon :icon="schoolOutline"></ion-icon>
              </div>
              <div>
                <span class="qz-info-tag">AÑO LECTIVO</span>
                <h2 class="qz-info-title">{{ year || 'Año actual' }}</h2>
              </div>
            </div>
            <div class="qz-badge-container">
              <span class="qz-courses-count">
                {{ studentData.length }} {{ studentData.length === 1 ? 'Curso' : 'Cursos' }}
              </span>
            </div>
          </div>

          <!-- Estado vacío si no hay datos -->
          <div v-if="!studentData || studentData.length === 0" class="qz-card qz-state-card">
            <div class="qz-empty-icon">
              <ion-icon :icon="documentTextOutline"></ion-icon>
            </div>
            <h3 class="qz-empty-title">Sin datos para mostrar</h3>
            <p class="qz-state-text">
              No se recibieron estudiantes para generar la lista. Vuelve a papelería para seleccionar un curso.
            </p>
            <button type="button" class="qz-primary-btn" @click="goBack">
              <ion-icon :icon="arrowBackOutline"></ion-icon>
              <span>Regresar a Papelería</span>
            </button>
          </div>

          <!-- Contenedor imprimible y vista previa -->
          <div v-else id="printable-content" class="qz-print-preview-container">
            <div
              v-for="course in studentData"
              :key="course.id"
              class="qz-card qz-course-card"
            >
              <div class="qz-course-card-header">
                <div class="qz-course-title-group">
                  <div class="qz-card-icon-squircle qz-icon--cyan">
                    <ion-icon :icon="peopleOutline"></ion-icon>
                  </div>
                  <div>
                    <h2 class="qz-course-name">{{ course.name }}</h2>
                    <p class="qz-course-count">
                      {{ (course.students || []).length }} estudiantes registrados
                    </p>
                  </div>
                </div>
              </div>

              <div class="qz-table-wrapper">
                <table class="student-table qz-student-table">
                  <thead>
                    <tr>
                      <th class="qz-th-code">Código</th>
                      <th>Apellido</th>
                      <th>Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="student in course.students" :key="student.id">
                      <td class="qz-td-code">
                        <span class="underlined-digit">{{ String(student.code).substring(0, 1) }}</span>{{ String(student.code).substring(1) }}
                      </td>
                      <td class="qz-td-name">{{ student.lastName }}</td>
                      <td class="qz-td-name">{{ student.name }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonContent,
  IonIcon,
  actionSheetController,
  alertController,
} from '@ionic/vue';
import {
  arrowBackOutline,
  printOutline,
  schoolOutline,
  documentTextOutline,
  peopleOutline,
} from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { FileSharer } from '@byteowls/capacitor-filesharer';

// Scale factor: A4 (210mm) / thermal (80mm) ≈ 2.625
const THERMAL_SCALE = 2.6;

export default {
  name: 'PrintableStudentList',
  components: {
    IonPage,
    IonContent,
    IonIcon,
  },
  setup() {
    const router = useRouter();
    const studentData = ref([]);
    const year = ref(null);

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/admin/papeleria');
      }
    };

    onMounted(() => {
      let data = window.history.state?.studentData;
      let yr = window.history.state?.year;

      if (!data) {
        try {
          const stored = sessionStorage.getItem("pandora_printable_studentData");
          if (stored) data = JSON.parse(stored);
          const storedYear = sessionStorage.getItem("pandora_printable_year");
          if (storedYear) yr = parseInt(storedYear, 10);
        } catch (e) {
          console.error("Error al leer sessionStorage en PrintableStudentList:", e);
        }
      }

      if (data) {
        studentData.value = data;
        year.value = yr;
      }
    });

    // ─── HTML generators ────────────────────────────────────────────────────

    const buildTableHTML = (course) => {
      const rows = (course.students || [])
        .map(
          (s) => `
          <tr>
            <td><span class="underlined-digit">${String(s.code).substring(0, 1)}</span>${String(s.code).substring(1)}</td>
            <td>${s.lastName}</td>
            <td>${s.name}</td>
          </tr>`
        )
        .join('');
      return `
        <h2>${course.name}</h2>
        <table class="student-table">
          <thead><tr><th>Código</th><th>Apellido</th><th>Nombre</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    };

    const buildBodyHTML = () =>
      `<h1 style="text-align:center;">Lista de Estudiantes - ${year.value || ''}</h1>` +
      studentData.value.map(buildTableHTML).join('');

    // ─── Styles ──────────────────────────────────────────────────────────────

    const letterStyles = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; padding: 15mm; }
      h1 { font-size: 18pt; text-align: center; margin-bottom: 8mm; }
      h2 { font-size: 14pt; margin: 6mm 0 3mm; }
      .student-table { width: 100%; border-collapse: collapse; margin-bottom: 8mm; }
      .student-table th, .student-table td { border: 1px solid #ddd; padding: 5px 8px; text-align: left; font-size: 11pt; }
      .student-table th { background: #f5f5f5; font-weight: bold; }
      .underlined-digit { text-decoration: underline; }
    `;

    const thermalStyles = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family:  Arial, sans-serif; padding: 5mm; width: 210mm; font-weight: bold;}
      h1 { font-size: ${10 * THERMAL_SCALE}pt; text-align: center; margin-bottom: 4mm; }
      h2 { font-size: ${9 * THERMAL_SCALE}pt; margin: 4mm 0 2mm; }
      .student-table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; }
      .student-table th, .student-table td { border: 1px solid #aaa; padding: 3px 5px; text-align: left; font-size: ${8 * THERMAL_SCALE}pt; }
      .student-table th { font-weight: bold; }
      .underlined-digit { text-decoration: underline; }
    `;

    const buildFullHTML = (css) => `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"><style>${css}</style></head>
        <body>${buildBodyHTML()}</body>
      </html>`;

    // ─── PDF generation (sequential, mobile-safe) ─────────────────────────

    const generatePDF = async (format) => {
      const isThermal = format === 'thermal';
      const css = isThermal ? thermalStyles : letterStyles;
      const pdfFormat = 'a4'; // always A4 canvas; thermal just scales fonts
      const courseName = (studentData.value[0]?.name || 'lista').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `lista_estudiantes_${courseName}_${isThermal ? '80mm' : 'carta'}.pdf`;

      const loading = await alertController.create({
        header: 'Generando PDF',
        message: 'Por favor espere...',
        backdropDismiss: false,
      });
      await loading.present();

      try {
        const { jsPDF } = await import('jspdf');
        const { default: html2canvas } = await import('html2canvas');

        // Build a container with full HTML
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
        tempContainer.innerHTML = `<style>${css}</style>${buildBodyHTML()}`;
        document.body.appendChild(tempContainer);

        const isNative = Capacitor.isNativePlatform();
        const canvasScale = isNative ? 1 : 2;

        const canvas = await html2canvas(tempContainer, {
          scale: canvasScale,
          useCORS: true,
          logging: false,
          allowTaint: false,
          backgroundColor: '#ffffff',
        });

        document.body.removeChild(tempContainer);

        const pdf = new jsPDF({ unit: 'mm', format: pdfFormat, orientation: 'portrait' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();

        // Slice the canvas into page-sized chunks to handle multi-page content
        const pxPerMm = canvas.width / pageW;
        const pageHeightPx = pageH * pxPerMm;
        const totalPages = Math.ceil(canvas.height / pageHeightPx);

        for (let i = 0; i < totalPages; i++) {
          const srcY = i * pageHeightPx;
          const srcH = Math.min(pageHeightPx, canvas.height - srcY);

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = srcH;
          const ctx = pageCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

          const imgData = pageCanvas.toDataURL('image/jpeg', isNative ? 0.85 : 0.95);
          const imgH = (srcH / canvas.width) * pageW;

          if (i > 0) pdf.addPage(pdfFormat, 'portrait');
          pdf.addImage(imgData, 'JPEG', 0, 0, pageW, imgH, undefined, 'FAST');

          // Free page canvas
          pageCanvas.width = 0;
          pageCanvas.height = 0;
          await new Promise((r) => setTimeout(r, 30));
        }

        if (isNative) {
          const base64 = pdf.output('datauristring').split(',')[1];
          await FileSharer.share({
            filename,
            contentType: 'application/pdf',
            base64Data: base64,
          });
        } else {
          pdf.save(filename);
        }
      } catch (e) {
        const msg = (e?.message || '').toLowerCase();
        const isCancel =
          msg.includes('cancelled') ||
          msg.includes('user_cancelled') ||
          msg.includes('dismiss') ||
          msg.includes('user back') ||
          msg.includes('back button');
        if (!isCancel) {
          console.error('Error generating PDF:', e);
          const errAlert = await alertController.create({
            header: 'Error',
            message: 'Hubo un error al generar el PDF.',
            buttons: ['OK'],
          });
          await errAlert.present();
        }
      } finally {
        await loading.dismiss();
      }
    };

    // ─── Web print (iframe) ───────────────────────────────────────────────

    const printWeb = (format) => {
      const isThermal = format === 'thermal';
      const css = isThermal
        ? `
          @page { size: 80mm auto; margin: 5mm; }
          body { font-family: "Courier New", monospace; width: 72mm; margin: 0; padding: 0; font-size: 9pt; line-height: 1.3; }
          h1 { font-size: 11pt; text-align: center; margin-bottom: 3mm; }
          h2 { font-size: 9pt; margin: 3mm 0 1mm; }
          .student-table { width: 100%; border-collapse: collapse; margin-bottom: 3mm; }
          .student-table th, .student-table td { border: 1px solid #aaa; padding: 2px 4px; font-size: 8pt; }
          .underlined-digit { text-decoration: underline; }
        `
        : `
          body { font-family: Arial, sans-serif; padding: 10mm; }
          h1 { font-size: 16pt; text-align: center; margin-bottom: 6mm; }
          h2 { font-size: 13pt; margin: 5mm 0 2mm; }
          .student-table { width: 100%; border-collapse: collapse; margin-bottom: 6mm; }
          .student-table th, .student-table td { border: 1px solid #ddd; padding: 5px 8px; text-align: left; font-size: 10pt; }
          .student-table th { background: #f5f5f5; }
          .underlined-digit { text-decoration: underline; }
        `;

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(buildFullHTML(css));
      printWindow.document.close();
      printWindow.onload = () => setTimeout(() => printWindow.focus(), 300);
    };

    // ─── Option menus ─────────────────────────────────────────────────────

    const showOptions = async () => {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // On native: only PDF export (shared via FileSharer)
        const sheet = await actionSheetController.create({
          header: 'Exportar lista como PDF',
          buttons: [
            { text: 'Tamaño Carta / A4', handler: () => generatePDF('letter') },
            { text: 'Térmica 80mm',      handler: () => generatePDF('thermal') },
            { text: 'Cancelar', role: 'cancel' },
          ],
        });
        await sheet.present();
      } else {
        // On web: offer print preview OR PDF download
        const sheet = await actionSheetController.create({
          header: 'Opciones de impresión',
          buttons: [
            { text: 'Imprimir Carta / A4',     handler: () => printWeb('letter') },
            { text: 'Imprimir Térmica 80mm',    handler: () => printWeb('thermal') },
            { text: 'Descargar PDF Carta / A4', handler: () => generatePDF('letter') },
            { text: 'Descargar PDF 80mm',       handler: () => generatePDF('thermal') },
            { text: 'Cancelar', role: 'cancel' },
          ],
        });
        await sheet.present();
      }
    };

    return {
      studentData,
      year,
      goBack,
      showOptions,
      arrowBackOutline,
      printOutline,
      schoolOutline,
      documentTextOutline,
      peopleOutline,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   QUEEZY DESIGN SYSTEM: LISTA DE ESTUDIANTES IMPRIMIBLE
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
  padding-bottom: 70px;
}

/* 1. CABECERA HERO PÚRPURA QUEEZY */
.qz-hero-header {
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  padding: max(20px, env(safe-area-inset-top)) 20px 26px;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(106, 90, 224, 0.2);
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
  transition: all 0.2s ease;
}

.qz-back-btn:hover {
  background: rgba(255, 255, 255, 0.28);
  transform: translateY(-1px);
}

.qz-hero-tag {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.9px;
  padding: 5px 12px;
  border-radius: 9999px;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
}

.qz-hero-title-row {
  display: flex;
  align-items: flex-end;
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

.qz-hero-action-btn:hover {
  background: rgba(255, 255, 255, 0.32);
  transform: translateY(-1px);
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
  gap: 14px;
}

.qz-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 16px 20px;
  border: 1px solid rgba(106, 90, 224, 0.12);
  box-shadow: 0 6px 18px rgba(12, 9, 42, 0.05);
  box-sizing: border-box;
}

/* TARJETA DE INFORMACIÓN */
.qz-info-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.qz-info-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.qz-card-icon-squircle {
  width: 46px;
  height: 46px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.qz-icon--purple {
  background-color: #efeefc;
  color: #6a5ae0;
}

.qz-icon--cyan {
  background-color: #e8f9fe;
  color: #00a8cc;
}

.qz-info-tag {
  font-size: 10.5px;
  font-weight: 800;
  color: #6a5ae0;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.qz-info-title {
  margin: 2px 0 0;
  font-size: 18px;
  font-weight: 800;
  color: #0c092a;
}

.qz-badge-container {
  display: flex;
  align-items: center;
}

.qz-courses-count {
  background: #efeefc;
  color: #6a5ae0;
  font-size: 12px;
  font-weight: 800;
  padding: 6px 14px;
  border-radius: 9999px;
  border: 1px solid rgba(106, 90, 224, 0.16);
}

/* ESTADO VACÍO */
.qz-state-card {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.qz-empty-icon {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: #efeefc;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.qz-empty-title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: #0c092a;
}

.qz-state-text {
  margin: 0 0 8px;
  font-size: 13.5px;
  color: #858494;
  max-width: 440px;
}

.qz-primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 42px;
  padding: 0 20px;
  border: none;
  border-radius: 13px;
  background: linear-gradient(135deg, #6a5ae0 0%, #8275f0 100%);
  color: #ffffff;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(106, 90, 224, 0.28);
  transition: all 0.2s ease;
}

.qz-primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(106, 90, 224, 0.36);
}

/* CONTENEDOR DE CURSOS */
.qz-print-preview-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qz-course-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-course-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-course-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qz-course-name {
  margin: 0;
  font-size: 17.5px;
  font-weight: 800;
  color: #0c092a;
}

.qz-course-count {
  margin: 3px 0 0;
  font-size: 12.5px;
  font-weight: 500;
  color: #858494;
}

/* TABLA QUEEZY */
.qz-table-wrapper {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid rgba(106, 90, 224, 0.12);
}

.qz-student-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0;
}

.qz-student-table th {
  background: #f4f3fd;
  color: #6a5ae0;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 12px 14px;
  border-bottom: 1.5px solid rgba(106, 90, 224, 0.15);
  text-align: left;
}

.qz-student-table td {
  padding: 11px 14px;
  font-size: 13.5px;
  color: #0c092a;
  border-bottom: 1px solid rgba(106, 90, 224, 0.08);
}

.qz-student-table tbody tr:last-child td {
  border-bottom: none;
}

.qz-student-table tbody tr:hover {
  background: #faf9fe;
}

.qz-th-code {
  width: 120px;
}

.qz-td-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  color: #6a5ae0;
}

.underlined-digit {
  text-decoration: underline;
  font-weight: 800;
}

.qz-td-name {
  font-weight: 500;
}

/* ==========================================================================
   MODO OSCURO (DARK MODE)
   ========================================================================== */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-print-page,
  body:not(.light) .qz-print-content {
    --background: #120f24;
    background-color: #120f24;
  }

  body:not(.light) .qz-hero-header {
    background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
  }

  body:not(.light) .qz-hero-tag {
    background: rgba(255, 255, 255, 0.12);
    color: #b5a9ff;
    border: 1px solid rgba(181, 169, 255, 0.28);
  }

  body:not(.light) .qz-card {
    background: #1d1838;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  body:not(.light) .qz-info-tag {
    color: #b5a9ff;
  }

  body:not(.light) .qz-info-title,
  body:not(.light) .qz-empty-title,
  body:not(.light) .qz-course-name {
    color: #f7f7fd;
  }

  body:not(.light) .qz-courses-count,
  body:not(.light) .qz-empty-icon,
  body:not(.light) .qz-icon--purple {
    background: #2b2254;
    color: #b5a9ff;
    border-color: rgba(181, 169, 255, 0.2);
  }

  body:not(.light) .qz-icon--cyan {
    background: rgba(112, 214, 245, 0.16);
    color: #70d6f5;
  }

  body:not(.light) .qz-course-count,
  body:not(.light) .qz-state-text {
    color: #9e9bb8;
  }

  body:not(.light) .qz-table-wrapper {
    border-color: rgba(255, 255, 255, 0.08);
  }

  body:not(.light) .qz-student-table th {
    background: #241d42;
    color: #b5a9ff;
    border-color: rgba(255, 255, 255, 0.1);
  }

  body:not(.light) .qz-student-table td {
    color: #f7f7fd;
    border-color: rgba(255, 255, 255, 0.06);
  }

  body:not(.light) .qz-student-table tbody tr:hover {
    background: #241d42;
  }

  body:not(.light) .qz-td-code {
    color: #b5a9ff;
  }
}

:global(body.dark) .qz-print-page,
:global(body.dark) .qz-print-content,
:global(html.dark) .qz-print-page,
:global(html.dark) .qz-print-content,
:global(.dark) .qz-print-page,
:global(.dark) .qz-print-content,
:global(:root[data-theme="dark"]) .qz-print-page,
:global(:root[data-theme="dark"]) .qz-print-content {
  --background: #120f24;
  background-color: #120f24;
}

:global(body.dark) .qz-hero-header,
:global(html.dark) .qz-hero-header,
:global(.dark) .qz-hero-header,
:global(:root[data-theme="dark"]) .qz-hero-header {
  background: linear-gradient(135deg, #1d1838 0%, #29204d 100%);
}

:global(body.dark) .qz-hero-tag,
:global(html.dark) .qz-hero-tag,
:global(.dark) .qz-hero-tag,
:global(:root[data-theme="dark"]) .qz-hero-tag {
  background: rgba(255, 255, 255, 0.12);
  color: #b5a9ff;
  border: 1px solid rgba(181, 169, 255, 0.28);
}

:global(body.dark) .qz-card,
:global(html.dark) .qz-card,
:global(.dark) .qz-card,
:global(:root[data-theme="dark"]) .qz-card {
  background: #1d1838;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

:global(body.dark) .qz-info-tag,
:global(html.dark) .qz-info-tag,
:global(.dark) .qz-info-tag,
:global(:root[data-theme="dark"]) .qz-info-tag {
  color: #b5a9ff;
}

:global(body.dark) .qz-info-title,
:global(html.dark) .qz-info-title,
:global(.dark) .qz-info-title,
:global(:root[data-theme="dark"]) .qz-info-title,
:global(body.dark) .qz-empty-title,
:global(html.dark) .qz-empty-title,
:global(.dark) .qz-empty-title,
:global(:root[data-theme="dark"]) .qz-empty-title,
:global(body.dark) .qz-course-name,
:global(html.dark) .qz-course-name,
:global(.dark) .qz-course-name,
:global(:root[data-theme="dark"]) .qz-course-name {
  color: #f7f7fd;
}

:global(body.dark) .qz-courses-count,
:global(html.dark) .qz-courses-count,
:global(.dark) .qz-courses-count,
:global(:root[data-theme="dark"]) .qz-courses-count,
:global(body.dark) .qz-empty-icon,
:global(html.dark) .qz-empty-icon,
:global(.dark) .qz-empty-icon,
:global(:root[data-theme="dark"]) .qz-empty-icon,
:global(body.dark) .qz-icon--purple,
:global(html.dark) .qz-icon--purple,
:global(.dark) .qz-icon--purple,
:global(:root[data-theme="dark"]) .qz-icon--purple {
  background: #2b2254;
  color: #b5a9ff;
  border-color: rgba(181, 169, 255, 0.2);
}

:global(body.dark) .qz-icon--cyan,
:global(html.dark) .qz-icon--cyan,
:global(.dark) .qz-icon--cyan,
:global(:root[data-theme="dark"]) .qz-icon--cyan {
  background: rgba(112, 214, 245, 0.16);
  color: #70d6f5;
}

:global(body.dark) .qz-course-count,
:global(html.dark) .qz-course-count,
:global(.dark) .qz-course-count,
:global(:root[data-theme="dark"]) .qz-course-count,
:global(body.dark) .qz-state-text,
:global(html.dark) .qz-state-text,
:global(.dark) .qz-state-text,
:global(:root[data-theme="dark"]) .qz-state-text {
  color: #9e9bb8;
}

:global(body.dark) .qz-table-wrapper,
:global(html.dark) .qz-table-wrapper,
:global(.dark) .qz-table-wrapper,
:global(:root[data-theme="dark"]) .qz-table-wrapper {
  border-color: rgba(255, 255, 255, 0.08);
}

:global(body.dark) .qz-student-table th,
:global(html.dark) .qz-student-table th,
:global(.dark) .qz-student-table th,
:global(:root[data-theme="dark"]) .qz-student-table th {
  background: #241d42;
  color: #b5a9ff;
  border-color: rgba(255, 255, 255, 0.1);
}

:global(body.dark) .qz-student-table td,
:global(html.dark) .qz-student-table td,
:global(.dark) .qz-student-table td,
:global(:root[data-theme="dark"]) .qz-student-table td {
  color: #f7f7fd;
  border-color: rgba(255, 255, 255, 0.06);
}

:global(body.dark) .qz-student-table tbody tr:hover,
:global(html.dark) .qz-student-table tbody tr:hover,
:global(.dark) .qz-student-table tbody tr:hover,
:global(:root[data-theme="dark"]) .qz-student-table tbody tr:hover {
  background: #241d42;
}

:global(body.dark) .qz-td-code,
:global(html.dark) .qz-td-code,
:global(.dark) .qz-td-code,
:global(:root[data-theme="dark"]) .qz-td-code {
  color: #b5a9ff;
}
</style>
