<template>
  <ion-modal :is-open="isOpen" @didDismiss="emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>Generar Cuestionario</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="emit('close')">Cerrar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-item>
        <ion-label>Tipo de Cuestionario</ion-label>
        <ion-select
          v-model="questionnaireType"
          @ionChange="generateQuestionnaire"
        >
          <ion-select-option value="fixed">Opciones Fijas</ion-select-option>
          <ion-select-option value="variable"
            >Opciones Variables</ion-select-option
          >
          <ion-select-option value="answers"
            >Solo Respuestas Correctas</ion-select-option
          >
          <ion-select-option value="csv">CSV (Claves)</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-button expand="block" @click="exportData" class="ion-margin-top">
        <ion-icon slot="start" :icon="downloadOutline"></ion-icon>
        Exportar
      </ion-button>
      <ion-button expand="block" @click="printView" fill="outline">
        <ion-icon slot="start" :icon="printOutline"></ion-icon>
        Imprimir
      </ion-button>

      <div
        id="printable-content"
        class="ion-padding-top"
        v-if="questionnaireType !== 'csv'"
      >
        <div v-html="generatedHtml"></div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script>
import { ref, watch } from "vue";
import { defineComponent } from "vue";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonIcon,
} from "@ionic/vue";
import { downloadOutline, printOutline } from "ionicons/icons";
export default defineComponent({
  name: "CuestionarioGeneratorModal",
  components: {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonIcon,
  },
  props: {
    isOpen: Boolean,
    questions: Array,
    title: String,
    lessonData: Object, // New prop for lesson data
  },
  setup(props, { emit }) {
    const questionnaireType = ref("variable");
    const generatedHtml = ref("");
    const localQuestions = ref([]);

    // Deep copy questions prop to avoid mutation issues
    watch(
      () => props.questions,
      (newQuestions) => {
        if (newQuestions) {
          localQuestions.value = JSON.parse(JSON.stringify(newQuestions));
        }
      },
      { immediate: true }
    );

    const generateQuestionnaire = () => {
      if (!localQuestions.value || localQuestions.value.length === 0) {
        generatedHtml.value = "";
        return;
      }

      let htmlOutput = `<h2>${props.lessonData.topic} - ${props.title}</h2><h3>Grado: ${props.lessonData.course.name}</h3>`;
      const type = questionnaireType.value;

      if (type === "fixed") {
        htmlOutput += `<p>Responda la pregunta 1 a la ${localQuestions.value.length} teniendo como opciones de respuesta las siguientes:</p>`;
        htmlOutput += `<div class="fixed-options-container">`;
        localQuestions.value[0].options
          .sort((a, b) => a.identifier.localeCompare(b.identifier))
          .forEach((opt) => {
            htmlOutput += `<div class="fixed-option-item">${opt.identifier}. ${opt.sentence}</div>`;
          });
        htmlOutput += `</div>`;
      }

      localQuestions.value.forEach((question, index) => {
        let processedSentence = question.sentence;

        // If the sentence starts with <p>, remove only the opening and closing <p> tags
        if (
          processedSentence.trim().startsWith("<p>") &&
          processedSentence.trim().endsWith("</p>")
        ) {
          processedSentence = processedSentence.trim().slice(3, -4);
        }

        // If the sentence starts with any heading tag (h1-h6), replace it with <strong>
        processedSentence = processedSentence.replace(
          /^<h([1-6])>(.*?)<\/h\1>/i,
          "<strong>$2</strong>"
        );

        htmlOutput += `<p><strong>${
          index + 1
        }. ${processedSentence}</strong><br>`;

        if (type === "variable") {
          question.options.forEach((opt) => {
            let processedOptionSentence = opt.sentence;
            if (
              processedOptionSentence.trim().startsWith("<p>") &&
              processedOptionSentence.trim().endsWith("</p>")
            ) {
              processedOptionSentence = processedOptionSentence
                .trim()
                .slice(3, -4);
            }
            processedOptionSentence = processedOptionSentence.replace(
              /^<h([1-6])>(.*?)<\/h\1>/i,
              "<strong>$2</strong>"
            );
            htmlOutput += `&nbsp;&nbsp;&nbsp;${opt.identifier}. ${processedOptionSentence}<br>`;
          });
        }

        if (type === "answers") {
          const correct = question.options.find((opt) => opt.correct);
          if (correct) {
            let processedCorrectSentence = correct.sentence;
            if (
              processedCorrectSentence.trim().startsWith("<p>") &&
              processedCorrectSentence.trim().endsWith("</p>")
            ) {
              processedCorrectSentence = processedCorrectSentence
                .trim()
                .slice(3, -4);
            }
            processedCorrectSentence = processedCorrectSentence.replace(
              /^<h([1-6])>(.*?)<\/h\1>/i,
              "<strong>$2</strong>"
            );
            htmlOutput += `&nbsp;&nbsp;&nbsp;${correct.identifier}. ${processedCorrectSentence}<br>`;
          }
        }

        htmlOutput += `</p>`;
      });

      generatedHtml.value = htmlOutput;
    };

    const exportData = () => {
      if (questionnaireType.value === "csv") {
        generateAnswerKeyCsv();
      } else {
        printView(); // Use printView for PDF generation
      }
    };

    const generateAnswerKeyCsv = () => {
      let csvContent = '"Q No","KEY"\n';

      localQuestions.value.forEach((question, index) => {
        const correctOption = question.options.find((option) => option.correct);
        csvContent += `"${index + 1}","${
          correctOption ? correctOption.identifier : ""
        }"\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${props.title}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const printView = () => {
      const printWindow = window.open("", "", "height=600,width=800");
      printWindow.document.write(
        `<html><head><title>${props.lessonData.course.name}:${props.lessonData.topic} - ${props.title}</title>`
      );
      printWindow.document.write(
        `<style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.4; }
          #printable-content { column-count: 2; column-gap: 20px; }
          #printable-content p { break-inside: avoid-column; }
          .fixed-options-container { display: flex; flex-wrap: wrap; gap: 10px; }
          .fixed-option-item { flex: 1 1 calc(50% - 10px); box-sizing: border-box; }
        </style>`
      );
      printWindow.document.write("</head><body>");
      printWindow.document.write(
        `<div id="printable-content">${generatedHtml.value}</div>`
      );
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
      printWindow.onload = function () {
        printWindow.print();
        printWindow.close();
      };
    };

    watch(
      () => props.isOpen,
      (newVal) => {
        if (newVal) {
          generateQuestionnaire();
        }
      }
    );

    return {
      questionnaireType,
      generatedHtml,
      generateQuestionnaire,
      exportData,
      printView,
      downloadOutline,
      printOutline,
      emit, // Make emit available in the template
    };
  },
});
</script>

<style scoped>
#printable-content {
  column-count: 2;
  column-gap: 20px;
}

#printable-content p {
  break-inside: avoid-column;
}

.fixed-options-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px; /* Espacio entre las opciones */
}

.fixed-option-item {
  flex: 1 1 calc(50% - 10px); /* Dos columnas con espacio */
  box-sizing: border-box;
  /* Puedes añadir más estilos aquí si quieres bordes, padding, etc. */
}
</style>
