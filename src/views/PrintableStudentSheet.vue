<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button
            default-href="/admin/gestionar/usuarios"
          ></ion-back-button>
        </ion-buttons>
        <ion-title>Hojas de Respuesta</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="printSheets">
            <ion-icon :icon="printOutline"></ion-icon>
            Imprimir todas
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding" :fullscreen="true">
      <ion-list v-if="allStudents.length > 0">
        <ion-list-header>
          <ion-label>Estudiantes</ion-label>
        </ion-list-header>
        <ion-item
          v-for="student in allStudents"
          :key="student.id"
          @click="openStudentSheetModal(student)"
          button
        >
          <ion-label>{{ student.lastName }} {{ student.name }}</ion-label>
        </ion-item>
      </ion-list>
      <div v-else>
        <p>No hay estudiantes para mostrar.</p>
      </div>

      <ion-modal :is-open="isModalOpen" @didDismiss="isModalOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button slot="start" @click="downloadSheet"
                >Descargar</ion-button
              >
            </ion-buttons>
            <ion-buttons slot="end">
              <ion-button slot="end" @click="isModalOpen = false"
                >Cerrar</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="modal-sheet-wrapper" v-if="selectedStudent">
            <AnswerSheet
              ref="answerSheetRef"
              :student="selectedStudent"
              :course-name="courseName"
              class="responsive-answer-sheet-modal"
            />
          </div>
        </ion-content>
      </ion-modal>
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
  IonList,
  IonItem,
  IonLabel,
  IonListHeader,
  IonModal,
  alertController,
  actionSheetController,
} from "@ionic/vue";
import { printOutline } from "ionicons/icons";
import { onMounted, ref, computed } from "vue";
import AnswerSheet from "@/components/AnswerSheet.vue";
import { FileSharer } from "@byteowls/capacitor-filesharer";
import { Capacitor } from "@capacitor/core";
import html2pdf from "html2pdf.js";

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
    IonList,
    IonItem,
    IonLabel,
    IonListHeader,
    IonModal,
    AnswerSheet,
  },
  setup() {
    const studentData = ref([]);
    const year = ref(null);
    const isModalOpen = ref(false);
    const selectedStudent = ref(null);
    const answerSheetRef = ref(null);

    const courseName = computed(() => studentData.value[0]?.name);

    onMounted(async () => {
      if (window.history.state.studentData) {
        const data = window.history.state.studentData;
        if (data[0] && data[0].students) {
          data[0].students.sort((a, b) => {
            const nameA = (a.lastName + " " + a.name).toLowerCase();
            const nameB = (b.lastName + " " + b.name).toLowerCase();
            return nameA.localeCompare(nameB);
          });
        }
        studentData.value = data;
        year.value = window.history.state.year;
      }
    });

    const generateSheetContentHTML = () => {
      const students = studentData.value[0]?.students || [];
      const course = courseName.value || "";

      // --- Configuración de Dimensiones y Posicionamiento ---
      // Nuevas dimensiones de la imagen (en píxeles).
      const newImageWidth = 3313;
      const newImageHeight = 4919;

      // El factor de escala se calcula para que la nueva imagen quepa en el espacio de la grilla.
      const scale = 0.0843;

      const generateSheetCode = (student) => {
        const originalCode = student.code || "";
        const name = student.name || "";
        const lastName = student.lastName || "";

        const originalImageWidth = 3313;
        const originalImageHeight = 3520;

        const nameTopPercent = (60 / originalImageHeight) * 100;
        const nameLeftPercent = (600 / originalImageWidth) * 100;
        const nameWidthPercent = (2934 / originalImageWidth) * 100;
        const nameHeightPercent = (114 / originalImageHeight) * 100;
        const nameFontSizePx = 120;

        const courseTopPercent = (400 / originalImageHeight) * 100;
        const courseLeftPercent = (600 / originalImageWidth) * 100;
        const courseWidthPercent = (1883 / originalImageWidth) * 100;
        const courseHeightPercent = (161 / originalImageHeight) * 100;
        const courseFontSizePx = 180;

        const digitsTopPercent = (850 / originalImageHeight) * 100;
        const digitsLeftPercent = (640 / originalImageWidth) * 100;
        const digitsWidthPercent = (1350 / originalImageWidth) * 100;
        const digitsHeightPercent = (95 / originalImageHeight) * 100;

        const matrixTopPercent = (980 / originalImageHeight) * 100;
        const matrixLeftPercent = (670 / originalImageWidth) * 100;
        const matrixWidthPercent = (1303 / originalImageWidth) * 100;
        const matrixHeightPercent = (950 / originalImageHeight) * 100;
        const matrixGapPx = 20;

        let formattedCode = String(originalCode).replace(/\D/g, "");
        formattedCode = formattedCode.padStart(10, "0").slice(0, 10);

        const matrix = Array.from({ length: 10 }, () => Array(10).fill(0));
        for (let col = 0; col < 10; col++) {
          const digit = parseInt(formattedCode[col], 10);
          if (!isNaN(digit)) {
            const rowIndex = digit === 0 ? 9 : digit - 1;
            if (rowIndex >= 0 && rowIndex < 10) {
              matrix[rowIndex][col] = 1;
            }
          }
        }

        let cellsHTML = "";
        for (let r = 0; r < 10; r++) {
          for (let c = 0; c < 10; c++) {
            const filled =
              matrix[r][c] === 1
                ? "background: black; border-radius: 50%;"
                : "";
            cellsHTML += `<div class="grid-cell" style="width: 100%; height: 100%; box-sizing: border-box; ${filled}"></div>`;
          }
        }

        const domain = window.location.origin;

        return `
      <div class="image-wrapper">
        <img src="${domain}/hoja50.jpg" crossorigin="anonymous" alt="Hoja OMR" style="display: block; width: 100%; height: 100%;" />
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;">
          
          <!-- Nombre del Estudiante -->
          <div style="position: absolute; left: ${nameLeftPercent}%; top: ${nameTopPercent}%; width: ${nameWidthPercent}%; height: ${nameHeightPercent}%;
               font-size: ${nameFontSizePx}px; line-height: 1; color: black; font-family: Arial, sans-serif;
               white-space: nowrap; overflow: hidden; display: flex; align-items: center;">
            ${lastName} ${name}
          </div>

          <!-- Nombre del Curso -->
          ${
            course
              ? `
            <div style="position: absolute; left: ${courseLeftPercent}%; top: ${courseTopPercent}%; width: ${courseWidthPercent}%; height: ${courseHeightPercent}%;
                 font-size: ${courseFontSizePx}px; line-height: 1; color: black; font-family: Arial, sans-serif;
                 white-space: nowrap; overflow: hidden; display: flex; align-items: center;">
              ${course}
            </div>
          `
              : ""
          }

          <!-- Dígitos del Código -->
          <div style="position: absolute; left: ${digitsLeftPercent}%; top: ${digitsTopPercent}%; width: ${digitsWidthPercent}%; height: ${digitsHeightPercent}%;
                      display: flex; align-items: center; justify-content: space-between;">
             ${
               formattedCode
                 ? formattedCode
                     .split("")
                     .map(
                       (digit) => `
               <div style="flex: 1; height: 100%; 
                           display: flex; align-items: center; justify-content: center;
                           font-size: 110px; font-weight: bold; color: black; font-family: Arial, sans-serif; line-height: 1;">
                 ${digit}
               </div>`
                     )
                     .join("")
                 : ""
             }
          </div>
        </div>

        <!-- Matriz de Burbujas -->
        <div style="position: absolute; left: ${matrixLeftPercent}%; top: ${matrixTopPercent}%; width: ${matrixWidthPercent}%; height: ${matrixHeightPercent}%;
             display: grid; grid-template-columns: repeat(10, 1fr); grid-template-rows: repeat(10, 1fr);
             gap: ${matrixGapPx}px; z-index: 50; pointer-events: none;">
          ${cellsHTML}
        </div>
      </div>
    `;
      };

      let pagesHTML = "";
      for (let i = 0; i < students.length; i += 6) {
        const pageStudents = students.slice(i, i + 6);
        let sheetsHTML = "";

        pageStudents.forEach((student) => {
          sheetsHTML += `
        <div class="grid-item">
          ${generateSheetCode(student)}
        </div>
      `;
        });

        pagesHTML += `
      <div class="print-page">
        <div class="grid-container">
          ${sheetsHTML}
        </div>
      </div>
    `;
      }
      return {
        pagesHTML,
        newImageHeight,
        newImageWidth,
        scale,
      };
    };

    const generateStyles = (newImageWidth, newImageHeight, scale) => {
      return `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        @page {
          size: legal;
          margin: 0;
        }
        
        .print-page {
          page-break-after: always;
          width: 216mm;
          height: 330mm;
          overflow: hidden;
          position: relative;
        }
        
        .print-page:last-child {
          page-break-after: auto;
        }
        
        .grid-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(3, 1fr);
          width: 100%;
          height: 100%;
        }
        
        .grid-item {
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
        
        /* Styles for student code digits in print */
        .student-code-digit-text {
          font-size: 180px; /* Default font size for print */
        }

       .image-wrapper {
          position: relative;
          width: ${newImageWidth}px;
          height: ${newImageHeight}px;
          user-select: none;
          transform: scale(${scale});
          transform-origin: top left;
          overflow: hidden;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .student-code-digit-text {
            font-size: 180px; /* Ensure consistent font size for print */
          }
        }
      `;
    };

    const generatePrintHTML = () => {
      const { pagesHTML, newImageWidth, newImageHeight, scale } =
        generateSheetContentHTML();
      const css = generateStyles(newImageWidth, newImageHeight, scale);

      return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hojas de Respuesta</title>
      <style>${css}</style>
    </head>
    <body>
      ${pagesHTML}
    </body>
    </html>
  `;
    };

    const processPDF = async (action) => {
      // 1. Convert background image to Base64 to ensure it renders without loading issues
      const getBase64ImageFromUrl = async (imageUrl) => {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const domain = window.location.origin;
      const bgImageBase64 = await getBase64ImageFromUrl(`${domain}/hoja50.jpg`);

      // 2. Generate HTML (we'll replace the image source manually)
      let { pagesHTML, newImageWidth, newImageHeight, scale } =
        generateSheetContentHTML();

      // Replace the image url with the base64 data
      // The original src was: src="${domain}/hoja50.jpg"
      // or src="/hoja50.jpg" depending on how it was generated
      const originalSrcRegex = new RegExp(`${domain}/hoja50.jpg`, "g");
      const relativeSrcRegex = /src="\/hoja50.jpg"/g;

      pagesHTML = pagesHTML.replace(originalSrcRegex, `${bgImageBase64}`);
      pagesHTML = pagesHTML.replace(
        relativeSrcRegex,
        `src="${bgImageBase64}"`
      );

      const css = generateStyles(newImageWidth, newImageHeight, scale);

      // 3. Create a detached container (matches the working Android implementation)
      // We do NOT append this to the body, avoiding z-index/viewport issues.
      const element = document.createElement("div");
      element.innerHTML = `
        <style>${css}</style>
        ${pagesHTML}
      `;

      // html2pdf options
      const opt = {
        margin: 0,
        filename: "hojas_respuesta.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          // Remove scroll options that might conflict with detached elements
        },
        jsPDF: { unit: "mm", format: "legal", orientation: "portrait" },
      };

      const worker = html2pdf().from(element).set(opt);

      if (action === "save") {
        await worker.save();
      } else if (action === "base64") {
        return await worker.outputPdf("datauristring");
      }
    };

    const printSheets = async () => {
      if (Capacitor.isNativePlatform()) {
        const loading = await alertController.create({
          header: "Generando PDF",
          message:
            "Por favor espere mientras se genera el archivo para imprimir...",
          backdropDismiss: false,
        });
        await loading.present();

        try {
          const pdfDataUri = await processPDF("base64");
          const base64Data = pdfDataUri.split(",")[1];
          const filename = `hojas_respuesta_${Date.now()}.pdf`;

          await FileSharer.share({
            filename: filename,
            contentType: "application/pdf",
            base64Data: base64Data,
          });
        } catch (error) {
          if (
            error?.message &&
            !error.message.toLowerCase().includes("cancel") &&
            !error.message.toLowerCase().includes("dismiss")
          ) {
            console.error("Error generating/sharing PDF:", error);
            const errorAlert = await alertController.create({
              header: "Error",
              message: "Hubo un error al generar o compartir el archivo.",
              buttons: ["OK"],
            });
            await errorAlert.present();
          }
        } finally {
          await loading.dismiss();
        }
      } else {
        // Web Platform - Show Action Sheet
        const actionSheet = await actionSheetController.create({
          header: "Opciones de Impresión",
          buttons: [
            {
              text: "Imprimir / Vista Previa",
              icon: printOutline,
              handler: () => {
                const printWindow = window.open("", "_blank");
                if (printWindow) {
                  printWindow.document.write(generatePrintHTML());
                  printWindow.document.close();

                  // Esperar a que las imágenes se carguen antes de permitir imprimir
                  printWindow.onload = () => {
                    setTimeout(() => {
                      printWindow.focus();
                    }, 500);
                  };
                }
              },
            },
            {
              text: "Descargar PDF",
              icon: null,
              handler: async () => {
                const loading = await alertController.create({
                  header: "Generando PDF",
                  message: "Espere mientras se descarga el archivo...",
                  backdropDismiss: false,
                });
                await loading.present();
                try {
                  await processPDF("save");
                } catch (e) {
                  console.error("Error downloading PDF", e);
                  const errorAlert = await alertController.create({
                    header: "Error",
                    message: "Hubo un error al descargar el PDF.",
                    buttons: ["OK"],
                  });
                  await errorAlert.present();
                } finally {
                  await loading.dismiss();
                }
              },
            },
            {
              text: "Cancelar",
              role: "cancel",
            },
          ],
        });
        await actionSheet.present();
      }
    };

    const allStudents = computed(() => {
      return studentData.value[0]?.students || [];
    });

    const openStudentSheetModal = (student) => {
      selectedStudent.value = student;
      isModalOpen.value = true;
    };

    const downloadSheet = async () => {
      // Acceder a la instancia del componente hijo
      const componentInstance = answerSheetRef.value;
      if (!componentInstance) return;

      const imgSrc = componentInstance.generatedImageSrc;

      if (!imgSrc) {
        const alert = await alertController.create({
          header: "Espere un momento",
          message:
            "La imagen se está generando. Por favor intente nuevamente en unos segundos.",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      const filename = `hoja_respuesta_${selectedStudent.value.code}.png`;

      if (Capacitor.isNativePlatform()) {
        try {
          // Extraer la parte base64 (remover "data:image/png;base64,")
          const base64Data = imgSrc.split(",")[1];
          await FileSharer.share({
            filename: filename,
            contentType: "image/png",
            base64Data: base64Data,
          });
        } catch (error) {
          // Ignorar errores de cancelación por parte del usuario
          if (
            error?.message &&
            !error.message.toLowerCase().includes("cancel") &&
            !error.message.toLowerCase().includes("dismiss")
          ) {
            console.error("Error al compartir el archivo:", error);
          }
        }
      } else {
        // Lógica para web (descarga normal)
        const link = document.createElement("a");
        link.download = filename;
        link.href = imgSrc;
        link.click();
      }
    };

    return {
      allStudents,
      year,
      courseName,
      printSheets,
      printOutline,
      isModalOpen,
      selectedStudent,
      openStudentSheetModal,
      answerSheetRef,
      downloadSheet,
    };
  },
};

</script>

<style>
@media print {
  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .print-page {
    page-break-after: always;
    width: 216mm;
    height: 330mm;
    overflow: hidden;
  }
  ion-header,
  ion-content {
    display: none;
  }
  #printable-area {
    display: block;
  }
}

@page {
  size: legal;
  margin: 0;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
}

.grid-item {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.grid-item .answer-sheet {
  transform: scale(0.1044);
  transform-origin: top left;
}

@media screen {
  #printable-area {
    background: #f0f0f0;
    padding: 20px;
  }
  .print-page {
    width: 216mm;
    height: 330mm;
    margin: 20px auto;
    border: 1px dashed #ccc;
  }

  .student-name-text {
    font-size: 2.8vw !important; /* Default font size for smaller screens */
  }

  .student-code-digit-text {
    font-size: 2.8vw !important; /* Default font size for smaller screens */
  }

  @media (min-width: 768px) {
    /* Adjust for tablets and larger screens */
    .student-name-text {
      font-size: 1.5vw !important; /* Example: Smaller font size on desktop */
    }

    .student-code-digit-text {
      font-size: 1.5vw !important; /* Example: Smaller font size on desktop */
    }
  }

  @media (min-width: 1024px) {
    /* Adjust for desktops */
    .student-name-text {
      font-size: 0.7vw !important; /* Example: Smaller font size on desktop */
    }

    .student-code-digit-text {
      font-size: 0.7vw !important; /* Example: Smaller font size on desktop */
    }
  }
}

.modal-sheet-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.responsive-answer-sheet-modal {
  width: 90%; /* Adjust as needed for modal size */
  height: auto;
  max-height: 90%;
}
</style>
