<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button
            v-if="curso"
            :href="'/cuestionarios/' + curso + '/' + area"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
          <ion-button v-if="id" :href="'/cuestionario/' + cuestionario.id">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="crearCuestionario">
            <ion-icon :icon="checkmarkOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Cuestionario</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="cuestionario != null" :fullscreen="true">
        <ion-list>
          <ion-item v-if="error.estatus == 1">
            <ion-label color="danger">{{ error.data }}</ion-label>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Fecha</ion-label>
            <ion-input v-model="cuestionario.date" type="date"></ion-input>
          </ion-item>

          <ion-item>
      <ion-select v-model="cuestionario.periodId" label="Periodo" placeholder="Periodo">
        <ion-select-option
          v-for="periodo in periodos"
          :key="periodo.id"
          :value="periodo.id"
        >
          {{ periodo.name }}
        </ion-select-option>
      </ion-select>
    </ion-item>

          <ion-item>
            <ion-label position="stacked">Tema</ion-label>
            <ion-input v-model="cuestionario.topic" type="text"></ion-input>
          </ion-item>
          <ion-item
            class="ion-text-center"
            v-if="id && cuestionario.exist == true"
            button
            color="danger"
            @click="borrarCuestionario(0)"
          >
            <ion-label>Borrar Cuestionario</ion-label>
          </ion-item>
          <ion-item
            class="ion-text-center"
            v-if="id && cuestionario.exist == false"
            button
            color="success"
            @click="borrarCuestionario(1)"
          >
            <ion-label>Recuperar Cuestionario</ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>
<script>
import axios from "axios";
import { ref } from "vue";
import { useRoute } from "vue-router";
import router from "../router";

import { usuarioGet, tokenHeader } from "../globalService";
import {
  onIonViewWillEnter,
  IonLabel,
  IonItem,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonIcon,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonButtons,
} from "@ionic/vue";

import {
  arrowBackOutline,
  checkmarkOutline,
  trashOutline,
} from "ionicons/icons";

export default {
  components: {
    IonButton,
    IonButtons,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
  IonSelectOption
  },
  setup() {
    const mroute = useRoute();
    const { curso } = mroute.params;
    const { area } = mroute.params;
    const { id } = mroute.params;
    const periodos = ref(
      JSON.parse(localStorage.getItem("periodos"))
    );
    const cuestionario = ref({
      courseId: 0,
    });
    const error = ref({
      estatus: 0,
      data: "",
    });

    let usuario = usuarioGet();

    onIonViewWillEnter(async () => {
      tokenHeader();
      if (id != undefined) {
        await axios.get("/lessons/" + id).then((response) => {
          cuestionario.value.date = response.data.date.substring(0, 10);
          cuestionario.value.topic = response.data.topic;
          cuestionario.value.periodId = response.data.period.id;
          cuestionario.value.courseId = response.data.course.id;
          cuestionario.value.areaId = response.data.area.id;
          cuestionario.value.instituteId = response.data.institute.id;
          cuestionario.value.year = response.data.year;
          cuestionario.value.exist = response.data.exist;

        });
      }
      if (curso != undefined && area != undefined) {
        cuestionario.value = {
          date: "",
          topic: "",
          courseId: "",
          year: 0,
          areaId: "",
          periodId: "",
          instituteId: "",
          exist: true
        };
      }
    });

    return {
      borrarCuestionario(valor) {
        cuestionario.value.exist = valor;
        this.crearCuestionario();
      },
      async crearCuestionario() {
        if (cuestionario.value.date == "" || cuestionario.value.tema == "") {
          error.value.estatus = 1;
          error.value.data = "Debe seleccionar una fecha y añadir el tema";
        } else if (curso != undefined) {

          cuestionario.value.courseId = parseInt(curso, 10);
          cuestionario.value.areaId = parseInt(area, 10);
          cuestionario.value.instituteId = parseInt(usuario.institute.id, 10);
          cuestionario.value.year = new Date().getFullYear();


         

          await axios
            .post("/lessons", cuestionario.value)
            .then((response) => {

              router.push("/cuestionarios/" + curso + "/" + area);
              localStorage.setItem("error", response.data.message);
            })
            .catch((response) => {
              localStorage.setItem("error", response.message);
              error.value.estatus = 1;
              error.value.data = "Error: no se pudo añadir el cuestionario";
            });
        } else if (id != undefined) {
          await axios
            .patch("/lessons/" + id, cuestionario.value)
            .then((response) => {
              localStorage.setItem("lessonSelected", JSON.stringify(response.data));
              if (cuestionario.value.exist == true) {
                router.push("/cuestionario/" + id);
              } else {
                router.push(
                  "/cuestionarios/" +
                    cuestionario.value.courseId +
                    "/" +
                    cuestionario.value.areaId
                );
              }
              localStorage.setItem("error", response.data.message);
            })
            .catch((response) => {
              localStorage.setItem("error", response.message);
              error.value.estatus = 1;
              error.value.data = "Error: no se pudo actualizar el cuestionario";
            });
        }
      },
      area,
      arrowBackOutline,
      trashOutline,
      curso,
      id,
      usuario,
      periodos,
      error,
      cuestionario,
      checkmarkOutline,
    };
  },
};
</script>
