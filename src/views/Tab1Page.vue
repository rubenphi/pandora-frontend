<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Perfil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Grupo</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-card>
        <ion-card-header>
          <ion-card-title>Datos generales</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <strong>Usuario:</strong>
          {{ usuario?.code }} <br />
          <strong>Email:</strong>
          {{ usuario?.email }} <br />
          <strong>Nombres:</strong>
          {{ usuario?.name }} <br />
          <strong>Apellidos:</strong>
          {{ usuario?.lastName }} <br />
          <strong>institución:</strong>: {{ usuario?.institute?.name }} <br />
          <strong> Curso:</strong> {{ actualCurso?.name }} <br />
        </ion-card-content>
        <ion-card>
          <ion-card-header>
            <ion-card-title>Grupo actual </ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <strong>Nombre del Grupo:</strong> {{ grupoUsuario?.name }} <br />
            <strong>Integrantes:</strong>
            <ul>
              <li v-for="miembro in miembros" :key="miembro?.id">
                {{ miembro?.user?.name + " " + miembro?.user?.lastName }}
              </li>
            </ul>
          </ion-card-content>
          <ion-button fill="clear" @click="presentModal" id="open-modal">
            Cambiar de grupo&nbsp;
            <ion-icon :icon="swapHorizontalOutline"></ion-icon>
          </ion-button>
        </ion-card>
      </ion-card>
      <ion-list>
        <ion-item>
          <ion-label>
            <h2>Notas</h2>
          </ion-label>

          <ion-select
            v-model="periodoSelected"
            placeholder="Seleccione el periodo"
          >
            <ion-select-option
              v-for="periodo in periodos"
              :key="periodo?.id"
              :value="periodo?.id"
            >
              {{ periodo?.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <div v-for="area in notas" :key="area.id">
          <ion-item>
            <ion-label>
              <h3>{{ area?.name }}</h3>
            </ion-label>
          </ion-item>
          <div v-for="nota in area?.notas" :key="nota?.id">
            <ion-item v-if="nota?.period?.id == periodoSelected">
              <ion-icon :icon="easelOutline" slot="start"></ion-icon>
              <ion-label>
                <h2>{{ nota?.lesson?.topic }}</h2>

                <p v-if="nota?.grade < 3" style="color: #bf9494">
                  {{ nota?.grade }}
                </p>
                <p v-else>{{ nota?.grade }}</p>
              </ion-label>
            </ion-item>
          </div>
        </div>
      </ion-list>

      <ion-modal
        ref="modal"
        trigger="open-modal"
        :breakpoints="[0.3, 0.5, 1]"
        :initial-breakpoint="0.5"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="cancel()">Cancelar</ion-button>
            </ion-buttons>
            <ion-title style="text-align: center">Cambio De Grupo</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" @click="confirm()"
                >Confirmar</ion-button
              >
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-select
              label="Seleccione el nuevo grupo"
              v-model="grupo"
              placeholder="Seleccion el nuevo grupo"
            >
              <ion-select-option
                v-for="grupo in grupos"
                :key="grupo.id"
                :value="grupo.id"
              >
                {{ grupo.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label color="medium" position="floating"
              >Código de autorización</ion-label
            >
            <ion-input
              placeholder="Código de autorización"
              v-model="code"
            ></ion-input>
          </ion-item>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>
<script>
import {
  easelOutline,
  personOutline,
  swapHorizontalOutline,
} from "ionicons/icons";
import axios from "axios";
import { ref } from "vue";
import {
  periodosGet,
  selectedYear,
  tokenHeader,
  usuarioGet,
} from "../globalService";
import {
  onIonViewWillEnter,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonModal,
  IonItem,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonInput,
  IonLabel,
  IonList,
} from "@ionic/vue";

export default {
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonModal,
    IonItem,
    IonButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonInput,
    IonLabel,
    IonList,
  },

  setup() {
    const usuario = ref();

    const cursosUsuario = ref();
    const periodos = ref();
    const periodoSelected = ref();
    const actualCurso = ref();
    const year = ref();
    const grupo = ref();
    const modal = ref();
    const code = ref();

    const grupoUsuario = ref();
    const notas = ref([]);

    const grupos = ref([]);

    const miembros = ref([]);
    const cancel = () => modal.value.$el.dismiss(null, "cancel");

    const confirm = () => {
      let data = {
        groupId: grupo.value,
        userId: usuario.value.id,
        code: code.value,
        year: parseInt(year.value, 10),
        active: true,
      };

      axios.post(`/users/${usuario.value.id}/groups`, data).then(() => {
        modal.value.$el.dismiss(data, "confirm");
        //refresh page
        location.reload();
      });
    };

    onIonViewWillEnter(async () => {
      usuario.value = usuarioGet();
      periodos.value = periodosGet();
      if (Array.isArray(periodos.value)) {
        periodos.value.sort((a, b) => a.name.localeCompare(b.name));
      }

      cursosUsuario.value = JSON.parse(localStorage.getItem("cursosUsuario"));
      actualCurso.value = cursosUsuario.value.find(
        (curso) => curso.year == localStorage.getItem("year")
      );
      year.value = Number.isNaN(parseInt(localStorage.getItem("year"), 10))
        ? selectedYear()
        : parseInt(localStorage.getItem("year"), 10);

      tokenHeader();
      await axios
        .get(`/grades?userId=${usuario.value.id}&year=${year.value}`)
        .then((response) => {
          const notasByArea = response.data.reduce((acc, nota) => {
            delete nota.area;
            nota.grade = nota.grade.toFixed(1);
            const area = nota.lesson.area;
            const areaIndex = acc.findIndex((a) => a.id === area.id);
            if (areaIndex === -1) {
              acc.push({
                name: area.name,
                id: area.id,
                notas: [nota],
              });
            } else {
              acc[areaIndex].notas.push(nota);
            }
            return acc;
          }, []);

          //ordenar notas por fecha las más antigua primero

          notas.value = notasByArea.map((area) => {
            return {
              ...area,
              notas: area.notas.sort((a, b) => {
                return new Date(a.lesson.date) - new Date(b.lesson.date);
              }),
            };
          });
        });

      await axios.get(`/users/${usuario.value.id}/groups`).then((response) => {
        grupoUsuario.value =
          response.data.filter((g) => g.active)[0]?.group ?? null;
      });

      if (grupoUsuario.value?.id) {
        await axios
          .get(`/groups/${grupoUsuario.value.id}/${year.value}/users`)
          .then((response) => {
            miembros.value = response.data;
          });
      }

      await axios
        .get(`/groups?courseId=${actualCurso.value.id}`)
        .then((response) => {
          grupos.value = response.data;

          if (grupoUsuario.value) {
            grupos.value = grupos.value.filter((grupo) => {
              return grupo.id != grupoUsuario.value.id ?? false;
            });
          }
        });
    });

    return {
      grupoUsuario,
      grupos,
      grupo,
      code,
      year,
      usuario,
      personOutline,
      miembros,
      modal,
      presentModal() {},
      swapHorizontalOutline,
      cancel,
      confirm,
      actualCurso,
      notas,
      easelOutline,
      periodos,
      periodoSelected,
    };
  },
};
</script>
