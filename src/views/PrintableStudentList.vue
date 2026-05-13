<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin/gestionar/usuarios"></ion-back-button>
        </ion-buttons>
        <ion-title>Lista de Estudiantes</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="showOptions">
            <ion-icon slot="icon-only" :icon="printOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div id="printable-content">
        <h1 class="ion-text-center">Lista de Estudiantes - {{ year }}</h1>
        <div v-for="course in studentData" :key="course.id">
          <h2>{{ course.name }}</h2>
          <table class="student-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Apellido</th>
                <th>Nombre</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in course.students" :key="student.id">
                <td>
                  <span class="underlined-digit">{{ student.code.substring(0, 1) }}</span>{{ student.code.substring(1) }}
                </td>
                <td>{{ student.lastName }}</td>
                <td>{{ student.name }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  actionSheetController,
  alertController,
} from '@ionic/vue';
import { printOutline } from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { FileSharer } from '@byteowls/capacitor-filesharer';

// Scale factor: A4 (210mm) / thermal (80mm) ≈ 2.625
const THERMAL_SCALE = 2.6;

export default {
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
  },
  setup() {
    const studentData = ref([]);
    const year = ref(null);


    onMounted(() => {
      if (window.history.state.studentData) {
        studentData.value = window.history.state.studentData;
        year.value = window.history.state.year;
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
            { text: '📄 Tamaño Carta / A4', handler: () => generatePDF('letter') },
            { text: '🖨️ Térmica 80mm',      handler: () => generatePDF('thermal') },
            { text: 'Cancelar', role: 'cancel' },
          ],
        });
        await sheet.present();
      } else {
        // On web: offer print preview OR PDF download
        const sheet = await actionSheetController.create({
          header: 'Opciones de impresión',
          buttons: [
            { text: '🖨️ Imprimir Carta / A4',     handler: () => printWeb('letter') },
            { text: '🖨️ Imprimir Térmica 80mm',    handler: () => printWeb('thermal') },
            { text: '📥 Descargar PDF Carta / A4', handler: () => generatePDF('letter') },
            { text: '📥 Descargar PDF 80mm',       handler: () => generatePDF('thermal') },
            { text: 'Cancelar', role: 'cancel' },
          ],
        });
        await sheet.present();
      }
    };

    return {
      studentData,
      year,
      showOptions,
      printOutline,
    };
  },
};
</script>

<style>
.student-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}
.student-table th,
.student-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
.underlined-digit {
  text-decoration: underline;
}
</style>
