<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button
            default-href="/admin/gestionar/usuarios"
          ></ion-back-button>
        </ion-buttons>
        <ion-title>QR de Respuestas</ion-title>
        <ion-buttons slot="end" v-if="configConfirmed">
          <ion-button @click="() => printAllQrs()" :disabled="isRangeTooBig">
            <ion-icon :icon="printOutline" slot="start"></ion-icon>
            Imprimir todos
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- si se cancela el modal se regresa a /admin/gestionar/usuarios -->
      <ion-modal :is-open="!configConfirmed" @didDismiss="cancelConfig">
        <ion-header>
          <ion-toolbar>
            <ion-title>Configurar Opciones</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <p>Seleccione el rango de letras para las opciones de respuesta.</p>
          <ion-item>
            <ion-label>Primera opción</ion-label>
            <ion-select v-model="startLetter">
              <ion-select-option v-for="l in alphabet" :key="l" :value="l">{{
                l
              }}</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label>Última opción</ion-label>
            <ion-select v-model="endLetter">
              <ion-select-option
                v-for="l in filteredEndAlphabet"
                :key="l"
                :value="l"
                >{{ l }}</ion-select-option
              >
            </ion-select>
          </ion-item>
          <ion-button
            expand="block"
            class="ion-margin-top"
            @click="confirmConfig"
            :disabled="startLetter === endLetter"
          >
            Siguiente
          </ion-button>
        </ion-content>
      </ion-modal>

      <div v-if="configConfirmed">
        <ion-list v-if="allStudents.length > 0">
          <ion-list-header>
            <ion-label
              >Estudiantes (Rango: {{ startLetter }} -
              {{ endLetter }})</ion-label
            >
          </ion-list-header>
          <ion-item
            v-for="student in allStudents"
            :key="student.id"
            button
            @click="openSingleStudentQr(student)"
          >
            <ion-label>{{ student.lastName }} {{ student.name }}</ion-label>
          </ion-item>
        </ion-list>
        <div v-else class="ion-text-center ion-padding">
          <p>No hay estudiantes disponibles.</p>
        </div>
      </div>

      <!-- Single Student QRs Modal -->
      <ion-modal
        :is-open="isStudentModalOpen"
        @didDismiss="isStudentModalOpen = false"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="printAllQrsForStudent(selectedStudent)"
                >Todos</ion-button
              >
            </ion-buttons>
            <ion-title class="ion-text-center"
              >{{ selectedStudent?.lastName }}
              {{ selectedStudent?.name }}</ion-title
            >
            <ion-buttons slot="end">
              <ion-button @click="isStudentModalOpen = false"
                >Cerrar</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div v-if="selectedStudent">
            <p class="ion-text-center">
              Seleccione una opción para descargar el QR individual o imprima
              todas las opciones juntas.
            </p>
            <ion-list>
              <ion-item v-for="letter in optionRange" :key="letter">
                <ion-label>Opción {{ letter }}</ion-label>
                <ion-button
                  slot="end"
                  fill="clear"
                  @click="printQrItem(selectedStudent, letter)"
                >
                  <ion-icon :icon="printOutline" slot="icon-only"></ion-icon>
                </ion-button>
              </ion-item>
            </ion-list>
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
  IonSelect,
  IonSelectOption,
  actionSheetController,
  alertController,
} from "@ionic/vue";
import { printOutline } from "ionicons/icons";
import { ref, computed, onMounted } from "vue";
import { FileSharer } from "@byteowls/capacitor-filesharer";
import { Capacitor } from "@capacitor/core";
import html2pdf from "html2pdf.js";
import QRCode from "qrcode";
import router from "../router";

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
    IonSelect,
    IonSelectOption,
  },
  setup() {
    const studentData = ref([]);
    const configConfirmed = ref(false);
    const startLetter = ref("A");
    const endLetter = ref("D");
    const isStudentModalOpen = ref(false);
    const selectedStudent = ref(null);
    const qrsPerPage = ref(6);

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    const filteredEndAlphabet = computed(() => {
      const idx = alphabet.indexOf(startLetter.value);
      return alphabet.slice(idx + 1);
    });

    const optionRange = computed(() => {
      const startIdx = alphabet.indexOf(startLetter.value);
      const endIdx = alphabet.indexOf(endLetter.value);
      return alphabet.slice(startIdx, endIdx + 1);
    });

    const isRangeTooBig = computed(() => {
      return optionRange.value.length > 4;
    });

    const allStudents = computed(() => {
      return studentData.value[0]?.students || [];
    });

    onMounted(() => {
      if (window.history.state && window.history.state.studentData) {
        studentData.value = window.history.state.studentData;
      }
    });

    const confirmConfig = async () => {
      configConfirmed.value = true;
      if (isRangeTooBig.value) {
        const alert = await alertController.create({
          header: "Advertencia",
          message:
            "El rango escogido es muy grande, solo podrá imprimir los QR estudiante por estudiante",
          buttons: ["OK"],
        });
        await alert.present();
      }
    };

    const openSingleStudentQr = (student) => {
      selectedStudent.value = student;
      isStudentModalOpen.value = true;
    };

    const cancelConfig = () => {
      router.push("/admin/gestionar/usuarios");
    };

    const generatePdfContent = async (studentsList, range) => {
      const perPage = qrsPerPage.value;
      const columns = perPage === 6 ? 2 : 1;

      const styles = `
        <style>
          .print-page { page-break-after: always; width: 216mm;  padding: 5px; background: white; box-sizing: border-box; display: flex; flex-wrap: wrap; justify-content: space-around; align-content: flex-start; }
          .qr-box { border: 1px solid #eee; padding: 2px; text-align: center; width: ${
            columns === 2 ? "45%" : "90%"
          }; margin-bottom: 5px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; }
          .qr-img { width: 100%; max-width: ${
            perPage === 2 ? "145mm" : "90mm"
          }; height: auto; display: block; }
          .qr-txt { font-size: ${
            perPage === 2 ? "13pt" : "10pt"
          }; font-family: sans-serif; font-weight: light; margin-top: 5mm; text-align: center; color: black; line-height: 1.2; width: 100%; }
        </style>
      `;

      let html = styles;
      let currentIdx = 0;
      for (let i = 0; i < studentsList.length; i++) {
        const student = studentsList[i];
        for (const letter of range) {
          if (currentIdx % perPage === 0) {
            if (currentIdx > 0) html += "</div>";
            html += '<div class="print-page">';
          }

          const qrValue = `${student.code}:${letter}`;
          const dataUrl = await QRCode.toDataURL(qrValue, {
            width: 900,
            margin: 1,
            errorCorrectionLevel: "high",
          });

          html += `
             <div class="qr-box">
               <img src="${dataUrl}" class="qr-img" />
               <p class="qr-txt">Código: ${student.lastName} ${student.name} || Opción: ${letter}</p>
             </div>
           `;
          currentIdx++;
        }
      }
      if (currentIdx > 0) html += "</div>";
      return html;
    };

    const processQrPDF = async (htmlContent, action) => {
      const element = document.createElement("div");
      element.innerHTML = htmlContent;

      // Use a fixed, reliable scale. Scale 2 is good for quality.
      const scale = 1;

      const opt = {
        margin: 0,
        filename: "QRs_estudiantes.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: scale, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "legal", orientation: "portrait" },
      };

      const worker = html2pdf().from(element).set(opt);

      if (action === "save") {
        await worker.save();
      } else if (action === "base64") {
        return await worker.outputPdf("datauristring");
      }
    };

    const presentOutputOptions = async (students, range) => {
      const loading = await alertController.create({
        header: "Preparando Contenido",
        message: "Generando códigos QR, esto puede tardar...",
        backdropDismiss: false,
      });
      await loading.present();

      try {
        const htmlContent = await generatePdfContent(students, range);
        await loading.dismiss(); // Dismiss after content is ready

        if (Capacitor.isNativePlatform()) {
          const nativeLoading = await alertController.create({
            header: "Generando PDF",
            message: "Por favor espere...",
            backdropDismiss: false,
          });
          await nativeLoading.present();
          try {
            const pdfDataUri = await processQrPDF(htmlContent, "base64");
            const base64Data = pdfDataUri.split(",")[1];
            await FileSharer.share({
              filename: `QRs_${Date.now()}.pdf`,
              contentType: "application/pdf",
              base64Data: base64Data,
            });
          } catch (e) {
            if (
              e?.message &&
              !e.message.toLowerCase().includes("cancel") &&
              !e.message.toLowerCase().includes("dismiss")
            ) {
              const errorAlert = await alertController.create({
                header: "Error",
                message: "Hubo un problema al compartir el PDF.",
                buttons: ["OK"],
              });
              await errorAlert.present();
            }
          } finally {
            await nativeLoading.dismiss();
          }
        } else {
          // Web platform action sheet
          const actionSheet = await actionSheetController.create({
            header: "Opciones de Salida",
            buttons: [
              {
                text: "Vista Previa / Imprimir",
                icon: printOutline,
                handler: () => {
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head><title>Imprimir QRs</title></head>
                        <body>${htmlContent}</body>
                      </html>`);
                    printWindow.document.close();
                    printWindow.focus();
                  }
                },
              },
              {
                text: "Descargar PDF",
                handler: async () => {
                  const downloadLoading = await alertController.create({
                    header: "Generando PDF",
                    message: "Descargando...",
                    backdropDismiss: false,
                  });
                  await downloadLoading.present();
                  try {
                    await processQrPDF(htmlContent, "save");
                  } catch (e) {
                    console.error("Error downloading PDF:", e);
                  } finally {
                    await downloadLoading.dismiss();
                  }
                },
              },
              { text: "Cancelar", role: "cancel" },
            ],
          });
          await actionSheet.present();
        }
      } catch (e) {
        console.error("Error preparing QR content:", e);
        await loading.dismiss();
        const errAlert = await alertController.create({
          header: "Error",
          message: "No se pudo preparar el contenido para imprimir.",
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
          { text: "Cancelar", role: "cancel" },
        ],
      });
      await actionSheet.present();
    };

    const printAllQrsForStudent = (student) => printAllQrs([student]);

    const shareQrImage = async (student, letter) => {
      const loading = await alertController.create({
        header: "Generando QR",
        message: "Espere un momento...",
        backdropDismiss: false,
      });
      await loading.present();

      try {
        const qrValue = `${student.code}:${letter}`;
        const labelText = `Código: ${student.lastName} ${student.name} || Opción: ${letter}`;

        // Generate QR on an internal canvas
        const canvas = document.createElement("canvas");
        const qrSize = 1000;
        const padding = 60;
        const footerHeight = 120;

        canvas.width = qrSize;
        canvas.height = qrSize + footerHeight;
        const ctx = canvas.getContext("2d");

        // White background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR
        const qrCanvas = document.createElement("canvas");
        await QRCode.toCanvas(qrCanvas, qrValue, {
          width: qrSize - padding,
          margin: 2,
          errorCorrectionLevel: "high",
        });
        ctx.drawImage(qrCanvas, padding / 2, padding / 2);

        // Draw text
        ctx.fillStyle = "black";
        ctx.font = "bold 30px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(labelText, canvas.width / 2, qrSize + footerHeight / 2);

        const dataUrl = canvas.toDataURL("image/png");
        const base64Content = dataUrl.split(",")[1];
        const filename = `QR_${student.lastName}_${letter}.png`;

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
        console.error("Error generating single QR image:", e);
        const msg = (e.message || "").toLowerCase();
        if (
          msg.includes("user canceled") ||
          msg.includes("user cancelled") ||
          msg.includes("cancelado")
        ) {
          console.log("User canceled share");
        } else {
          const errorAlert = await alertController.create({
            header: "Error",
            message:
              "No se pudo generar el QR individual. " + (e.message || ""),
            buttons: ["OK"],
          });
          await errorAlert.present();
        }
      } finally {
        await loading.dismiss();
      }
    };

    const printQrItem = (student, letter) => shareQrImage(student, letter);

    return {
      isRangeTooBig,
      configConfirmed,
      startLetter,
      endLetter,
      cancelConfig,
      alphabet,
      filteredEndAlphabet,
      confirmConfig,
      allStudents,
      isStudentModalOpen,
      selectedStudent,
      openSingleStudentQr,
      optionRange,
      printOutline,
      printAllQrs,
      printAllQrsForStudent,
      printQrItem,
    };
  },
};
</script>

<style scoped>
.qrs-preview-container {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.qr-preview-item {
  border: 1px solid var(--ion-color-light);
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  background: var(--ion-background-color);
}
.qr-container-printable {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.qr-image {
  width: 250px;
  height: 250px;
  max-width: 100%;
}
.qr-footer {
  margin-top: 8px;
  font-size: 0.9rem;
  font-weight: bold;
}
</style>
