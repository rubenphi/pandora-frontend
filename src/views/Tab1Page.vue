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
                      :style="{ opacity: member.hasReinforcement ? '0.6' : '1' }"
                    >
                      {{ area.promedio }}
                    </ion-chip>
                    <span v-if="member.hasReinforcement">
                      /
                      <ion-chip
                        slot="end"
                        :color="area.promedioReinf < 3.5 ? 'danger' : 'primary'"
                        style="opacity: 1; font-weight: bold"
                      >
                        {{ area.promedioReinf }}
                      </ion-chip>
                    </span>
                  </ion-item>

                  <!-- Dimensions -->
                  <div v-for="dimension in area.dimensiones" :key="dimension.id">
                    <ion-item-divider>
                      <ion-label>
                        {{ dimension.name }}
                        <ion-chip
                          size="small"
                          :color="parseFloat(dimension.promedio) < 3.5 ? 'danger' : 'success'"
                          :style="{ opacity: member.hasReinforcement ? '0.6' : '1' }"
                        >
                          {{ dimension.promedio }}
                        </ion-chip>
                        <span v-if="member.hasReinforcement">
                          /
                          <ion-chip
                            size="small"
                            :color="parseFloat(dimension.promedioReinf) < 3.5 ? 'danger' : 'success'"
                            style="opacity: 1; font-weight: bold"
                          >
                            {{ dimension.promedioReinf }}
                          </ion-chip>
                        </span>
                      </ion-label>
                    </ion-item-divider>

                    <!-- Regular Grades (Opaque if hasReinforcement) -->
                    <div :style="{ opacity: member.hasReinforcement ? '0.6' : '1' }">
                      <div v-for="nota in dimension.notas" :key="nota?.id">
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

                    <!-- Reinforcement Grades (Normal Opacity, only if hasReinforcement) -->
                    <div v-if="member.hasReinforcement">
                      <div v-for="nota in dimension.notasReinf" :key="nota?.id">
                        <ion-item>
                          <ion-icon :icon="easelOutline" slot="start" color="tertiary"></ion-icon>
                          <ion-label>
                            <h2>{{ nota?.gradableItem?.title }} (Refuerzo)</h2>
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
  IonItemDivider,
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
    IonItemDivider,
  },

  setup() {
    const usuario = ref();
    const adminOProfesor = ref();
    const finalPeriodo = ref(false);

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

        // Build Master List of Regular Gradable Items (excluding reinforcement)
        const masterItemsMap = new Map();
        allGrades.forEach((grade) => {
          const isReinforcement =
            grade.gradableItem?.lesson?.type === "reinforcement";
          if (!isReinforcement && grade.gradableItem && grade.gradableItem.id) {
            const uniqueKey = `${grade.gradableType}-${grade.gradableItem.id}`;
            if (!masterItemsMap.has(uniqueKey)) {
              masterItemsMap.set(uniqueKey, {
                id: grade.gradableItem.id,
                type: grade.gradableType,
                item: grade.gradableItem,
                classification: grade.classification,
              });
            }
          }
        });

        // Helper functions
        const formatGrade = (grade) => {
          if (!grade && grade !== 0) return 0;
          return Math.floor(grade * 10) / 10;
        };

        const getStudentGradeForItem = (studentGrades, item) => {
          return studentGrades.find(
            (g) => g.gradableType === item.type && g.gradableItem.id === item.id
          );
        };

        const mapToDisplayParamsWithMasterList = (
          studentGrades,
          masterList
        ) => {
          return masterList
            .map((masterItem) => {
              const foundGrade = getStudentGradeForItem(
                studentGrades,
                masterItem
              );
              if (foundGrade) {
                return {
                  id: foundGrade.id,
                  gradableItem: foundGrade.gradableItem,
                  gradableType: foundGrade.gradableType,
                  classification: foundGrade.classification,
                  grade: foundGrade.grade,
                  isPending: false,
                };
              } else {
                return {
                  id: `pending-${masterItem.type}-${masterItem.id}`,
                  gradableItem: masterItem.item,
                  gradableType: masterItem.type,
                  classification: masterItem.classification,
                  grade: null,
                  isPending: true,
                };
              }
            })
            .sort(
              (a, b) =>
                new Date(a.gradableItem.lesson.date) -
                new Date(b.gradableItem.lesson.date)
            );
        };

        const calculateAverageFromMasterList = (studentGrades, masterList) => {
          if (masterList.length === 0) return 0;
          let totalScore = 0;
          masterList.forEach((masterItem) => {
            const foundGrade = getStudentGradeForItem(
              studentGrades,
              masterItem
            );
            if (foundGrade) {
              totalScore += foundGrade.grade;
            }
          });
          return totalScore / masterList.length;
        };

        // Fetch reinforcements to identify students with reinforcement
        const reinforcementsResponse = await axios.get(
          `/reinforcement/by-context?courseId=${actualCurso.value.course.id}&areaId=&periodId=${periodoSelected.value}&year=${year.value}`,
          tokenHeader()
        );
        const reinforcementStudents = new Set(
          reinforcementsResponse.data.map((r) => r.student.id)
        );

        const processedMembers = miembros.value.map((miembro) => {
          const memberId = miembro.user.id;
          const memberName = `${miembro.user.name} ${miembro.user.lastName}`;
          const hasReinforcement = reinforcementStudents.has(memberId);

          const studentGrades = allGrades
            .filter((grade) => grade.user.id === memberId)
            .map((n) => ({ ...n, grade: formatGrade(n.grade) }));

          // Group items by area
          const areaMap = new Map();
          Array.from(masterItemsMap.values()).forEach((item) => {
            const areaId = item.item.lesson.area.id;
            const areaName = item.item.lesson.area.name;
            if (!areaMap.has(areaId)) {
              areaMap.set(areaId, {
                id: areaId,
                name: areaName,
                masterKnowledge: [],
                masterExecution: [],
                masterBehavior: [],
              });
            }
            const areaData = areaMap.get(areaId);
            if (item.classification === "knowledge")
              areaData.masterKnowledge.push(item);
            else if (item.classification === "execution")
              areaData.masterExecution.push(item);
            else if (item.classification === "behavior")
              areaData.masterBehavior.push(item);
          });

          const areas = Array.from(areaMap.values()).map((areaData) => {
            // --- REGULAR GRADES LOGIC ---
            const masterKnowledgeRegular = areaData.masterKnowledge.filter(
              (i) => i.item.lesson?.type !== "reinforcement"
            );
            const masterExecutionRegular = areaData.masterExecution.filter(
              (i) => i.item.lesson?.type !== "reinforcement"
            );
            const masterBehaviorRegular = areaData.masterBehavior.filter(
              (i) => i.item.lesson?.type !== "reinforcement"
            );

            const promSaberRegular = calculateAverageFromMasterList(
              studentGrades,
              masterKnowledgeRegular
            );
            const promHacerRegular = calculateAverageFromMasterList(
              studentGrades,
              masterExecutionRegular
            );
            const promSerRegular = calculateAverageFromMasterList(
              studentGrades,
              masterBehaviorRegular
            );

            const promedioFinalRegular =
              (promSaberRegular + promHacerRegular + promSerRegular) / 3;

            // --- REINFORCEMENT GRADES LOGIC (Only if hasReinforcement) ---
            let promSaberReinf = 0,
              promHacerReinf = 0,
              promSerReinf = 0,
              promedioFinalReinf = 0;

            if (hasReinforcement) {
              const masterKnowledgeReinf = areaData.masterKnowledge.filter(
                (i) => i.item.lesson?.type === "reinforcement"
              );
              const masterExecutionReinf = areaData.masterExecution.filter(
                (i) => i.item.lesson?.type === "reinforcement"
              );
              const masterBehaviorReinf = areaData.masterBehavior.filter(
                (i) => i.item.lesson?.type === "reinforcement"
              );

              promSaberReinf = calculateAverageFromMasterList(
                studentGrades,
                masterKnowledgeReinf
              );
              promHacerReinf = calculateAverageFromMasterList(
                studentGrades,
                masterExecutionReinf
              );
              promSerReinf = calculateAverageFromMasterList(
                studentGrades,
                masterBehaviorReinf
              );

              promedioFinalReinf =
                (promSaberReinf + promHacerReinf + promSerReinf) / 3;
            }

            // Build dimensions with regular/reinforcement split
            const dimensiones = [
              {
                id: "knowledge",
                name: "Saber",
                promedio: formatGrade(promSaberRegular).toFixed(1),
                notas: mapToDisplayParamsWithMasterList(
                  studentGrades,
                  masterKnowledgeRegular
                ),
                promedioReinf: hasReinforcement
                  ? formatGrade(promSaberReinf).toFixed(1)
                  : null,
                notasReinf: hasReinforcement
                  ? mapToDisplayParamsWithMasterList(
                      studentGrades,
                      areaData.masterKnowledge.filter(
                        (i) => i.item.lesson?.type === "reinforcement"
                      )
                    )
                  : [],
              },
              {
                id: "execution",
                name: "Hacer",
                promedio: formatGrade(promHacerRegular).toFixed(1),
                notas: mapToDisplayParamsWithMasterList(
                  studentGrades,
                  masterExecutionRegular
                ),
                promedioReinf: hasReinforcement
                  ? formatGrade(promHacerReinf).toFixed(1)
                  : null,
                notasReinf: hasReinforcement
                  ? mapToDisplayParamsWithMasterList(
                      studentGrades,
                      areaData.masterExecution.filter(
                        (i) => i.item.lesson?.type === "reinforcement"
                      )
                    )
                  : [],
              },
              {
                id: "behavior",
                name: "Ser",
                promedio: formatGrade(promSerRegular).toFixed(1),
                notas: mapToDisplayParamsWithMasterList(
                  studentGrades,
                  masterBehaviorRegular
                ),
                promedioReinf: hasReinforcement
                  ? formatGrade(promSerReinf).toFixed(1)
                  : null,
                notasReinf: hasReinforcement
                  ? mapToDisplayParamsWithMasterList(
                      studentGrades,
                      areaData.masterBehavior.filter(
                        (i) => i.item.lesson?.type === "reinforcement"
                      )
                    )
                  : [],
              },
            ];

            return {
              id: areaData.id,
              name: areaData.name,
              promedio: formatGrade(promedioFinalRegular).toFixed(1),
              promedioReinf: hasReinforcement
                ? formatGrade(promedioFinalReinf).toFixed(1)
                : null,
              dimensiones: dimensiones,
            };
          });

          return {
            userId: memberId,
            userName: memberName,
            hasReinforcement: hasReinforcement,
            areas: areas,
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
