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
          <strong> Curso:</strong> {{ actualCurso?.course?.name }} <br />
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
      <ion-list v-if="!finalPeriodo && !adminOProfesor">
        <ion-item>
          <ion-label>
            <h2>Notas del Grupo</h2>
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

        <!-- Accordion for each group member -->
        <ion-accordion-group>
          <ion-accordion
            v-for="member in groupMembersWithGrades"
            :key="member.userId"
          >
            <ion-item slot="header">
              <ion-label>{{ member.userName }}</ion-label>
            </ion-item>
            <div class="ion-padding" slot="content">
              <ion-list>
                <div v-for="area in member.areas" :key="area.id">
                  <ion-item>
                    <ion-label>
                      <h3>{{ area?.name }}</h3>
                    </ion-label>
                    <ion-chip
                      slot="end"
                      :color="area.promedio < 3.5 ? 'danger' : 'primary'"
                    >
                      {{ area.promedio }}
                    </ion-chip>
                  </ion-item>
                  <div v-for="nota in area?.notas" :key="nota?.id">
                    <ion-item>
                      <ion-icon :icon="easelOutline" slot="start"></ion-icon>
                      <ion-label>
                        <h2>{{ nota?.gradableItem?.title || nota.title }}</h2>
                        <p
                          v-if="nota.grade && nota.grade < 3.5"
                          style="color: #bf9494"
                        >
                          {{ nota.grade }}
                        </p>
                        <p v-else-if="nota.grade">{{ nota.grade }}</p>
                        <p v-else>Pendiente</p>
                      </ion-label>
                    </ion-item>
                  </div>
                </div>
              </ion-list>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </ion-list>
      <ion-card v-else>
        <ion-card-header>
          <ion-card-title>Acceso Restringido</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          En épocas finales del curso, el acceso al perfil de estudiante está
          restringido.
        </ion-card-content>
      </ion-card>

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
import { ref, watch } from "vue";
import {
  adminOprofesor,
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
  IonAccordion,
  IonAccordionGroup,
  IonChip,
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
    IonAccordion,
    IonAccordionGroup,
    IonChip,
  },

  setup() {
    const usuario = ref();
    const adminOProfesor = ref();
    const finalPeriodo = ref(true);

    const cursosUsuario = ref([]);
    const periodos = ref();
    const periodoSelected = ref();
    const actualCurso = ref({});
    const year = ref();
    const grupo = ref();
    const modal = ref();
    const code = ref();

    const grupoUsuario = ref();
    const groupMembersWithGrades = ref([]);

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
        location.reload();
      });
    };

    onIonViewWillEnter(async () => {
      adminOProfesor.value = adminOprofesor();
      periodoSelected.value = localStorage.getItem("periodoSelected")
        ? parseInt(localStorage.getItem("periodoSelected"), 10)
        : null;
      year.value = Number.isNaN(parseInt(localStorage.getItem("year"), 10))
        ? selectedYear()
        : parseInt(localStorage.getItem("year"), 10);

      usuario.value = usuarioGet();
      periodos.value = periodosGet();
      if (Array.isArray(periodos.value)) {
        periodos.value.sort((a, b) => a.name.localeCompare(b.name));
      }

      cursosUsuario.value = (
        await axios.get(`/users/${usuario.value.id}/courses`)
      ).data;

      actualCurso.value = cursosUsuario.value.find((curso) => curso.active);

      tokenHeader();

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

      const getGradesForGroup = async () => {
        if (
          !actualCurso.value?.course?.id ||
          !periodoSelected.value ||
          miembros.value.length === 0
        ) {
          groupMembersWithGrades.value = [];
          return;
        }

        const allGradesUrl = `/grades?courseId=${actualCurso.value.course.id}&periodId=${periodoSelected.value}&year=${year.value}`;
        const allGradesResponse = await axios.get(allGradesUrl);
        const allGrades = allGradesResponse.data;

        const liveGradableItemsMap = new Map();
        allGrades.forEach((grade) => {
          liveGradableItemsMap.set(grade.gradableItem.id, grade.gradableItem);
        });
        const liveGradableItems = Array.from(liveGradableItemsMap.values());

        const processedMembers = miembros.value.map((miembro) => {
          const memberId = miembro.user.id;
          const memberName = `${miembro.user.name} ${miembro.user.lastName}`;

          const studentGrades = allGrades
            .filter((grade) => grade.user.id === memberId)
            .map((n) => ({
              ...n,
              grade: parseFloat(n.grade.toFixed(1)),
            }));

          const areas = liveGradableItems.reduce((acc, actividad) => {
            const notaExistente = studentGrades.find(
              (n) => n.gradableItem.id === actividad.id
            );

            const itemParaMostrar = {
              id: actividad.id,
              title: actividad.title,
              gradableItem: actividad,
              grade: notaExistente ? notaExistente.grade : null,
            };

            const area = actividad.lesson.area;
            const areaIndex = acc.findIndex((a) => a.id === area.id);

            if (areaIndex === -1) {
              acc.push({
                name: area.name,
                id: area.id,
                notas: [itemParaMostrar],
              });
            } else {
              acc[areaIndex].notas.push(itemParaMostrar);
            }
            return acc;
          }, []);

          const areasConPromedioYSort = areas.map((area) => {
            const liveGradableItemsInArea = liveGradableItems.filter(
              (item) => item.lesson.area.id === area.id
            );

            const studentGradesInArea = studentGrades.filter(
              (grade) => grade.gradableItem.lesson.area.id === area.id
            );

            const sumaTotalArea = studentGradesInArea.reduce(
              (acc, nota) => acc + nota.grade,
              0
            );

            const promedioArea =
              liveGradableItemsInArea.length > 0
                ? (sumaTotalArea / liveGradableItemsInArea.length).toFixed(2)
                : (0).toFixed(2);

            const notasOrdenadas = area.notas.sort(
              (a, b) =>
                new Date(a.gradableItem.lesson.date) -
                new Date(b.gradableItem.lesson.date)
            );

            return {
              ...area,
              promedio: promedioArea,
              notas: notasOrdenadas,
            };
          });

          return {
            userId: memberId,
            userName: memberName,
            areas: areasConPromedioYSort,
          };
        });

        groupMembersWithGrades.value = processedMembers;
      };

      watch(periodoSelected, getGradesForGroup);

      if (!periodoSelected.value && periodos.value?.length > 0) {
        periodoSelected.value = periodos.value[0].id;
      } else {
        await getGradesForGroup();
      }

      await axios
        .get(`/groups?courseId=${actualCurso.value.course.id}`)
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
      cursosUsuario,
      actualCurso,

      adminOProfesor,
      finalPeriodo,
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
      groupMembersWithGrades,
      easelOutline,
      periodos,
      periodoSelected,
    };
  },
};
</script>
