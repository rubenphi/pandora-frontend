<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin/gestionar/usuarios"></ion-back-button>
        </ion-buttons>
        <ion-title>Lista de Estudiantes para Imprimir</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="printList">
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
              <tr v-for="student in course.students" :key="student.id" >
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
} from '@ionic/vue';
import { printOutline } from 'ionicons/icons';
import { ref, onMounted } from 'vue';


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
    

    const printList = () => {
      const printContent = document.getElementById('printable-content');
      if (printContent) {
        const contentToPrint = printContent.innerHTML;
        const printFrame = document.createElement('iframe');

        printFrame.style.position = 'absolute';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';

        document.body.appendChild(printFrame);

        const frameDoc = printFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Lista de Estudiantes</title>
            <style>
              body {
                font-family: sans-serif;
              }
              .student-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              .student-table th, .student-table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              .student-table th {
              }
              .underlined-digit {
                text-decoration: underline;
              }
              .no-group {
                color: grey;
                font-style: italic;
              }
              h1, h2 {
                text-align: center;
              }
            </style>
          </head>
          <body>
            ${contentToPrint}
          </body>
          </html>
        `);
        frameDoc.close();

        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();

        // Clean up the iframe after printing
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      }
    };

    return {
      studentData,
      year,
      printList,
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
.student-table th, .student-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
.student-table th {
}
.underlined-digit {
  text-decoration: underline;
}

</style>
