<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button v-if="isAdminOrProfessor" @click="editMaterial()">
          Editar
        </ion-button>
      </ion-buttons>
      <ion-title class="ion-text-center">{{ material.title }}</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="toggleFont()">Aa</ion-button>
        <ion-button v-if="canExport" @click="exportToPdf()">
          <ion-icon :icon="downloadOutline"></ion-icon>
        </ion-button>
        <ion-button @click="dismissModal()">Cerrar</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <div v-if="material.content" v-html="material.content"></div>
    <div v-if="material.type === MaterialType.VIDEO">
      <video controls :src="material.url" style="width: 100%"></video>
    </div>
    <div v-else-if="material.type === MaterialType.IMAGE">
      <img :src="material.url" style="width: 100%" />
      <ion-button expand="full" @click="openInNewTab(material.url)"
        >Abrir en nueva pestaña</ion-button
      >
    </div>
    <div v-else-if="material.type === MaterialType.PDF">
      <ion-button expand="full" @click="openInNewTab(material.url)"
        >Abrir en nueva pestaña</ion-button
      >
      <iframe
        :src="material.url"
        style="width: 100%; height: 80vh"
        frameborder="0"
      ></iframe>
    </div>
    <div v-else-if="material.type === MaterialType.AUDIO">
      <audio controls :src="material.url" style="width: 100%"></audio>
    </div>
    <div
      v-else-if="
        material.type === MaterialType.TEXT_RICH ||
        material.type === MaterialType.TEXT_SHORT
      "
    >
      <!-- Content already displayed above, this block can be removed or kept for specific text formatting if needed -->
    </div>
    <div v-else>
      <br />
      <p>Tipo de material no soportado para visualización en el navegador.</p>
      <ion-button expand="full" @click="openInNewTab(material.url)"
        >Abrir</ion-button
      >
    </div>
  </ion-content>
</template>

<script>
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  modalController,
  alertController,
} from "@ionic/vue";
import { defineComponent, computed } from "vue";
import { useRouter } from "vue-router";
import { adminOprofesor } from "../globalService";
import { downloadOutline } from "ionicons/icons";
import { FileSharer } from "@byteowls/capacitor-filesharer";
import { Capacitor } from "@capacitor/core";

const MaterialType = {
  VIDEO: "VIDEO",
  PDF: "PDF",
  IMAGE: "IMAGE",
  AUDIO: "AUDIO",
  DOC: "DOC",
  TEXT_RICH: "TEXT_RICH",
  TEXT_SHORT: "TEXT_SHORT",
};

const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const generateNativePdfFromHtml = async (pdf, htmlContent, isCalligraphy) => {
  const marginX = 20; // 20mm margins
  const pageWidth = 215.9; // Letter width in mm
  const pageHeight = 279.4; // Letter height in mm
  const maxContentWidth = pageWidth - (marginX * 2); // 175.9 mm
  const bottomMargin = 25; // page breaks at 254.4 mm
  
  let currentY = 30; // start y coordinate
  let fontLoaded = false;

  // Helper to ensure page breaks
  const checkPageBreak = (neededHeight) => {
    if (currentY + neededHeight > pageHeight - bottomMargin) {
      pdf.addPage("letter", "portrait");
      if (isCalligraphy && fontLoaded) {
        pdf.setFont("caligrafia", "normal");
      } else {
        pdf.setFont("helvetica", "normal");
      }
      currentY = 25; // Top margin on new page
      return true;
    }
    return false;
  };

  // Try to load calligraphy font if active
  if (isCalligraphy) {
    try {
      const response = await fetch("/resources/caligrafia.ttf");
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const base64Font = arrayBufferToBase64(buffer);
        pdf.addFileToVFS("caligrafia.ttf", base64Font);
        pdf.addFont("caligrafia.ttf", "caligrafia", "normal");
        pdf.setFont("caligrafia", "normal");
        fontLoaded = true;
      }
    } catch (e) {
      console.error("Failed to load calligraphy font for native PDF:", e);
    }
  }

  if (!fontLoaded) {
    pdf.setFont("helvetica", "normal");
  }

  // Draw Header
  pdf.setFontSize(isCalligraphy && fontLoaded ? 14 : 10);
  pdf.setTextColor(100, 116, 139); // slate-400
  pdf.text("Material de Apoyo", marginX, 15);
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.setLineWidth(0.5);
  pdf.line(marginX, 17, pageWidth - marginX, 17);

  // Title is drawn dynamically in the caller function before adding pages, so we don't draw it here.

  // Parse HTML content
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const children = Array.from(doc.body.childNodes);

  for (const node of children) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (!text) continue;

      if (fontLoaded && isCalligraphy) {
        pdf.setFont("caligrafia", "normal");
        pdf.setFontSize(20);
      } else {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
      }
      pdf.setTextColor(30, 41, 59); // slate-700

      const lineHeight = fontLoaded && isCalligraphy ? 12 : 6;
      const lines = pdf.splitTextToSize(text, maxContentWidth);

      for (const line of lines) {
        checkPageBreak(lineHeight);
        pdf.text(line, marginX, currentY);
        currentY += lineHeight;
      }
      currentY += 2;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      if (tagName === "p" || tagName === "div") {
        const text = node.innerText || node.textContent || "";
        if (!text.trim()) continue;

        if (fontLoaded && isCalligraphy) {
          pdf.setFont("caligrafia", "normal");
          pdf.setFontSize(20);
        } else {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(11);
        }
        pdf.setTextColor(30, 41, 59);

        const lineHeight = fontLoaded && isCalligraphy ? 12 : 6;
        const lines = pdf.splitTextToSize(text, maxContentWidth);

        for (const line of lines) {
          checkPageBreak(lineHeight);
          pdf.text(line, marginX, currentY);
          currentY += lineHeight;
        }
        currentY += fontLoaded && isCalligraphy ? 6 : 4; // spacing after block
      } else if (tagName.startsWith("h") && tagName.length === 2) {
        const level = parseInt(tagName.charAt(1), 10);
        const text = node.innerText || node.textContent || "";
        if (!text.trim()) continue;

        let fontSize = 12;
        let lineHeight = 6;
        let bottomSpace = 4;

        if (fontLoaded && isCalligraphy) {
          if (level === 1) { fontSize = 32; lineHeight = 16; bottomSpace = 8; }
          else if (level === 2) { fontSize = 28; lineHeight = 14; bottomSpace = 7; }
          else { fontSize = 24; lineHeight = 12; bottomSpace = 6; }
          pdf.setFont("caligrafia", "normal");
        } else {
          if (level === 1) { fontSize = 22; lineHeight = 9; bottomSpace = 6; }
          else if (level === 2) { fontSize = 18; lineHeight = 8; bottomSpace = 5; }
          else { fontSize = 14; lineHeight = 7; bottomSpace = 4; }
          pdf.setFont("helvetica", "bold");
        }
        pdf.setFontSize(fontSize);
        pdf.setTextColor(15, 23, 42); // slate-900

        const lines = pdf.splitTextToSize(text, maxContentWidth);
        currentY += 2;
        checkPageBreak(lineHeight);

        for (const line of lines) {
          checkPageBreak(lineHeight);
          pdf.text(line, marginX, currentY);
          currentY += lineHeight;
        }
        currentY += bottomSpace;
      } else if (tagName === "ul" || tagName === "ol") {
        const listItems = Array.from(node.querySelectorAll("li"));
        let index = 1;
        const bulletSymbol = tagName === "ul" ? "• " : "";

        for (const li of listItems) {
          const text = li.innerText || li.textContent || "";
          if (!text.trim()) continue;

          if (fontLoaded && isCalligraphy) {
            pdf.setFont("caligrafia", "normal");
            pdf.setFontSize(20);
          } else {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(11);
          }
          pdf.setTextColor(30, 41, 59);

          const prefix = tagName === "ul" ? bulletSymbol : `${index}. `;
          const fullText = prefix + text;
          const lineHeight = fontLoaded && isCalligraphy ? 12 : 6;
          const lines = pdf.splitTextToSize(fullText, maxContentWidth - 6);

          for (let l = 0; l < lines.length; l++) {
            checkPageBreak(lineHeight);
            const indentX = l === 0 ? marginX : marginX + 6;
            pdf.text(lines[l], indentX, currentY);
            currentY += lineHeight;
          }
          index++;
        }
        currentY += 4;
      } else if (tagName === "hr") {
        checkPageBreak(5);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.5);
        pdf.line(marginX, currentY + 2, pageWidth - marginX, currentY + 2);
        currentY += 6;
      } else if (tagName === "img") {
        const src = node.getAttribute("src");
        if (src) {
          try {
            const absoluteSrc = src.startsWith("http") ? src : (window.location.origin + (src.startsWith("/") ? "" : "/") + src);
            const response = await fetch(absoluteSrc);
            const blob = await response.blob();
            const base64 = await new Promise((res, rej) => {
              const r = new FileReader();
              r.onloadend = () => res(r.result);
              r.onerror = rej;
              r.readAsDataURL(blob);
            });

            const img = new Image();
            img.src = base64;
            await new Promise((resolve) => {
              img.onload = resolve;
            });

            let imgWidth = img.width * 0.264583;
            let imgHeight = img.height * 0.264583;

            if (imgWidth > maxContentWidth) {
              const ratio = maxContentWidth / imgWidth;
              imgWidth = maxContentWidth;
              imgHeight = imgHeight * ratio;
            }

            checkPageBreak(imgHeight + 10);
            pdf.addImage(base64, "PNG", marginX, currentY, imgWidth, imgHeight, undefined, "FAST");
            currentY += imgHeight + 6;
          } catch (e) {
            console.error("Error drawing image natively in PDF:", e);
          }
        }
      }
    }
  }
};

export default defineComponent({
  name: "MaterialModal",
  props: {
    material: Object,
  },
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
  },
  setup(props) {
    const router = useRouter();
    const isAdminOrProfessor = adminOprofesor();

    const dismissModal = () => {
      modalController.dismiss();
    };

    const openInNewTab = (url) => {
      window.open(url, "_blank");
    };

    const editMaterial = () => {
      dismissModal(); // Close the modal first
      router.push(
        `/crear/material/${props.material.lesson.id}/${props.material.id}`
      );
    };

    const toggleFont = () => {
      const modal = document.querySelector('ion-modal');
      modal.classList.toggle('font-caligrafia');
    };

    const canExport = computed(() => {
      const type = props.material?.type;
      return (
        type === MaterialType.TEXT_RICH ||
        type === MaterialType.TEXT_SHORT ||
        type === MaterialType.IMAGE ||
        type === MaterialType.PDF ||
        type === MaterialType.DOC
      );
    });

    const exportToPdf = async () => {
      if (!props.material) return;

      const type = props.material.type;

      // Case 1: Already a PDF or DOC - Download or share original file directly
      if (type === MaterialType.PDF || type === MaterialType.DOC) {
        const loading = await alertController.create({
          header: "Descargando archivo",
          message: "Por favor espere...",
          backdropDismiss: false,
        });
        await loading.present();

        try {
          const url = props.material.url;
          const response = await fetch(url);
          if (!response.ok) throw new Error("No se pudo descargar el archivo original.");
          const blob = await response.blob();

          const fileExtension = url.split('.').pop().split('?')[0] || (type === MaterialType.PDF ? "pdf" : "docx");
          const sanitizedTitle = props.material.title
            ? props.material.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
            : "documento";
          const filename = `${sanitizedTitle}.${fileExtension}`;

          if (Capacitor.isNativePlatform()) {
            const base64Data = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result.split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });

            await FileSharer.share({
              filename: filename,
              contentType: blob.type || "application/octet-stream",
              base64Data: base64Data,
            });
          } else {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
          }
        } catch (err) {
          console.error("Error exporting original file:", err);
          const errorAlert = await alertController.create({
            header: "Error",
            message: "Hubo un error al descargar o compartir el archivo.",
            buttons: ["OK"],
          });
          await errorAlert.present();
        } finally {
          await loading.dismiss();
        }
        return;
      }

      // Case 2: IMAGE - Render image natively scaled to Letter size
      if (type === MaterialType.IMAGE) {
        const loading = await alertController.create({
          header: "Generando PDF",
          message: "Por favor espere...",
          backdropDismiss: false,
        });
        await loading.present();

        try {
          const url = props.material.url;
          const response = await fetch(url);
          if (!response.ok) throw new Error("No se pudo descargar la imagen original.");
          const blob = await response.blob();
          
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const { jsPDF } = await import("jspdf");
          const pdf = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });
          const pageWidthMm = 215.9;
          const pageHeightMm = 279.4;
          const margin = 20;
          const maxW = pageWidthMm - (margin * 2);
          const maxH = pageHeightMm - (margin * 2) - 20;

          // Draw Header
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(100, 116, 139);
          pdf.text("Material de Apoyo", margin, 15);
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.5);
          pdf.line(margin, 17, pageWidthMm - margin, 17);

          // Get image dimensions to scale it properly
          const img = new Image();
          img.src = base64Data;
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          let imgWidth = img.width * 0.264583;
          let imgHeight = img.height * 0.264583;

          if (imgWidth > maxW) {
            const ratio = maxW / imgWidth;
            imgWidth = maxW;
            imgHeight = imgHeight * ratio;
          }
          if (imgHeight > maxH) {
            const ratio = maxH / imgHeight;
            imgHeight = maxH;
            imgWidth = imgWidth * ratio;
          }

          const x = margin + (maxW - imgWidth) / 2;
          const y = 25 + (maxH - imgHeight) / 2;

          pdf.addImage(base64Data, "PNG", x, y, imgWidth, imgHeight, undefined, "FAST");

          const sanitizedTitle = props.material.title
            ? props.material.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
            : "imagen";
          const filename = `material_${sanitizedTitle}_${Date.now()}.pdf`;

          if (Capacitor.isNativePlatform()) {
            await FileSharer.share({
              filename: filename,
              contentType: "application/pdf",
              base64Data: pdf.output("datauristring").split(",")[1],
            });
          } else {
            pdf.save(filename);
          }
        } catch (e) {
          console.error("Error creating image PDF:", e);
          const errorAlert = await alertController.create({
            header: "Error",
            message: "Hubo un error al generar el PDF de la imagen.",
            buttons: ["OK"],
          });
          await errorAlert.present();
        } finally {
          await loading.dismiss();
        }
        return;
      }

      // Case 3: TEXT_RICH or TEXT_SHORT - Native HTML to jsPDF vector rendering
      const loading = await alertController.create({
        header: "Generando PDF",
        message: "Generando documento nativo, por favor espere...",
        backdropDismiss: false,
      });
      await loading.present();

      try {
        const isCalligraphy = document.querySelector('ion-modal')?.classList.contains('font-caligrafia');

        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });

        // Add helper metadata / title property dynamically inside generateNativePdfFromHtml
        await generateNativePdfFromHtml(pdf, props.material.content || "", isCalligraphy);

        // Draw title dynamically on the first page
        pdf.setPage(1);
        let titleFontSize = 22;
        let titleLineHeight = 9;
        const fontLoaded = isCalligraphy && pdf.getFont().fontName === "caligrafia";
        
        if (isCalligraphy && fontLoaded) {
          titleFontSize = 28;
          titleLineHeight = 14;
        }
        
        pdf.setFontSize(titleFontSize);
        pdf.setTextColor(15, 23, 42); // slate-900
        if (!fontLoaded) {
          pdf.setFont("helvetica", "bold");
        }

        const docTitleLines = pdf.splitTextToSize(props.material.title || "Material", 175.9);
        let titleY = 25;
        for (const line of docTitleLines) {
          pdf.text(line, 20, titleY);
          titleY += titleLineHeight;
        }

        const sanitizedTitle = props.material.title
          ? props.material.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
          : "material";
        const filename = `material_${sanitizedTitle}_${Date.now()}.pdf`;

        if (Capacitor.isNativePlatform()) {
          const pdfOutput = pdf.output("datauristring");
          const base64Data = pdfOutput.split(",")[1];
          await FileSharer.share({
            filename: filename,
            contentType: "application/pdf",
            base64Data: base64Data,
          });
        } else {
          pdf.save(filename);
        }
      } catch (error) {
        console.error("Error generating native PDF from HTML:", error);
        const errorAlert = await alertController.create({
          header: "Error",
          message: "Hubo un error al generar el PDF nativo.",
          buttons: ["OK"],
        });
        await errorAlert.present();
      } finally {
        await loading.dismiss();
      }
    };

    return {
      dismissModal,
      openInNewTab,
      MaterialType,
      isAdminOrProfessor,
      editMaterial,
      toggleFont,
      downloadOutline,
      canExport,
      exportToPdf,
    };
  },
});
</script>
