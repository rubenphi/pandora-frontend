<template>
  <ion-page class="ion-page qz-pregunta-result-page">
    <ion-content
      :fullscreen="true"
      class="qz-result-content"
      :force-overscroll="false"
    >
      <!-- 1. CABECERA HERO PÚRPURA QUEEZY (Sin Podio) -->
      <div class="qz-hero-section">
        <!-- Barra Superior: Navegación y Acciones -->
        <div class="qz-hero-top">
          <button
            type="button"
            class="qz-circle-btn"
            title="Volver al Cuestionario"
            @click="goToCuestionario"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </button>

          <!-- Pill Central de Estado -->
          <div class="qz-header-pill">
            <ion-icon :icon="sparklesOutline" class="qz-pill-icon"></ion-icon>
            <span>RESULTADOS DE PREGUNTA</span>
          </div>

          <!-- Acciones de la Cabecera -->
          <div class="qz-hero-actions">
            <!-- Ver Enunciado de la Pregunta -->
            <button
              type="button"
              class="qz-circle-btn"
              title="Ver Enunciado de la Pregunta"
              @click="goToPregunta"
            >
              <ion-icon :icon="helpCircleOutline"></ion-icon>
            </button>

            <!-- Alternar Orden (Alfabético / Llegada) -->
            <button
              v-if="admin"
              type="button"
              class="qz-circle-btn"
              :class="{ 'is-active': ordenActual === 'nombre' }"
              :title="
                ordenActual === 'nombre'
                  ? 'Ordenado por Nombre (Clic para orden de llegada)'
                  : 'Orden de Llegada (Clic para ordenar por nombre)'
              "
              @click="toggleOrden"
            >
              <ion-icon :icon="swapVerticalOutline"></ion-icon>
            </button>

            <!-- Refrescar Respuestas -->
            <button
              type="button"
              class="qz-circle-btn"
              :class="{ 'is-loading': isReloading }"
              :disabled="isReloading"
              title="Refrescar Respuestas"
              @click="reloadAnswers(true)"
            >
              <ion-icon
                :icon="refreshOutline"
                :class="{ 'qz-spin-icon': isReloading }"
              ></ion-icon>
            </button>
          </div>
        </div>

        <!-- Título y Metadatos de la Pregunta -->
        <div class="qz-hero-titles">
          <span class="qz-hero-tag">
            {{ pregunta.quiz?.topic || "EVALUACIÓN EN LÍNEA" }}
          </span>
          <h1 class="qz-hero-title">
            {{ pregunta.title || "Cargando pregunta..." }}
          </h1>
          <p
            v-if="pregunta.sentence"
            class="qz-hero-subtitle"
            v-html="cleanSentence(pregunta.sentence)"
          ></p>
        </div>

        <!-- Tarjetas Estadísticas de la Pregunta (Grid de 3 métricas) -->
        <!-- Se muestran cuando hay estadísticas reales disponibles (Docente o Pregunta Cerrada) -->
        <div v-if="admin || pregunta.available === false" class="qz-stats-grid">
          <div class="qz-stat-box">
            <span class="qz-stat-value">{{ respuestas.length }}</span>
            <span class="qz-stat-label">Respuestas</span>
          </div>

          <div class="qz-stat-box qz-stat--success">
            <span class="qz-stat-value">{{ countCorrectas }}</span>
            <span class="qz-stat-label">Aciertos</span>
          </div>

          <div class="qz-stat-box qz-stat--danger">
            <span class="qz-stat-value">{{ countIncorrectas }}</span>
            <span class="qz-stat-label">Fallos</span>
          </div>
        </div>
      </div>

      <!-- 2. CUERPO: LISTA DE RESPUESTAS O ESTADO DE ESPERA -->
      <div class="qz-sheet-section">
        <!-- VISTA DE RESULTADOS (Admin o Pregunta Cerrada) -->
        <div v-if="admin || pregunta.available === false" class="qz-sheet-container">
          <div class="qz-sheet-header">
            <div class="qz-sheet-title-wrap">
              <h2 class="qz-sheet-title">Registro de Respuestas</h2>
              <span class="qz-sheet-badge">
                {{ ordenActual === "nombre" ? "Por Nombre" : "Orden de llegada" }}
              </span>
            </div>
            <span class="qz-sheet-count">
              {{ respuestas.length }}
              {{ respuestas.length === 1 ? "registro" : "registros" }}
            </span>
          </div>

          <!-- Empty State si no hay respuestas -->
          <div v-if="respuestas.length === 0" class="qz-empty-card">
            <div class="qz-empty-icon-wrap">
              <ion-icon :icon="timeOutline"></ion-icon>
            </div>
            <h3 class="qz-empty-title">Esperando respuestas</h3>
            <p class="qz-empty-text">
              Aún no se han recibido respuestas de los estudiantes para esta
              pregunta.
            </p>
          </div>

          <!-- Lista de Tarjetas de Respuesta -->
          <div v-else class="qz-responses-list">
            <div
              v-for="(respuesta, index) in respuestas"
              :key="respuesta.id || index"
              class="qz-response-card"
              :class="{
                'qz-card--correct': respuesta.points > 0,
                'qz-card--wrong': respuesta.points <= 0,
                'qz-card--own': isOwnAnswer(respuesta),
              }"
            >
              <!-- Avatar / Squircle de Participante -->
              <div
                class="qz-user-avatar"
                :class="getAvatarColorClass(index)"
              >
                {{ getInitials(respuesta) }}
              </div>

              <!-- Información del Participante y Opción Elegida -->
              <div class="qz-participant-info">
                <div class="qz-name-row">
                  <h3 class="qz-participant-name">
                    {{ getParticipantName(respuesta) }}
                  </h3>

                  <!-- Badge de Orden (#1, #2...) -->
                  <span class="qz-order-pill">
                    #{{ index + 1 }}
                  </span>
                </div>

                <!-- Detalle de la opción respondida -->
                <div class="qz-option-block">
                  <template v-if="canViewAnswer(respuesta)">
                    <div class="qz-option-badge-row">
                      <span
                        v-if="respuesta.option?.identifier"
                        class="qz-option-chip"
                        :class="respuesta.points > 0 ? 'is-correct' : 'is-wrong'"
                      >
                        Opción {{ respuesta.option.identifier }}
                      </span>
                      <span
                        v-if="!admin && isOwnAnswer(respuesta)"
                        class="qz-own-badge"
                      >
                        Tu respuesta
                      </span>
                    </div>

                    <!-- Fila aparte para que el texto de la opción sea totalmente visible -->
                    <div
                      v-if="respuesta.option?.sentence"
                      class="qz-option-sentence-box"
                      v-html="respuesta.option.sentence"
                    ></div>
                  </template>

                  <!-- Si no puede ver la opción (por ser de otro compañero o pregunta aún abierta) -->
                  <template v-else>
                    <div class="qz-option-badge-row">
                      <template v-if="isOwnAnswer(respuesta)">
                        <span class="qz-option-chip is-locked">Tu respuesta enviada</span>
                        <span class="qz-option-locked-hint">
                          Visible al cerrar la pregunta
                        </span>
                      </template>
                      <template v-else>
                        <span class="qz-option-chip is-locked">Respuesta privada</span>
                        <span class="qz-option-peer-hint">
                          Oculta por privacidad
                        </span>
                      </template>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Badge de Puntos / Estado -->
              <div class="qz-score-badge-wrap">
                <div
                  v-if="respuesta.points > 0"
                  class="qz-points-badge qz-badge--success"
                >
                  <ion-icon :icon="happyOutline"></ion-icon>
                  <span>+{{ respuesta.points }}</span>
                </div>
                <div
                  v-else
                  class="qz-points-badge qz-badge--danger"
                >
                  <ion-icon :icon="sadOutline"></ion-icon>
                  <span>{{ respuesta.points }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Botón para estudiantes para regresar al cuestionario tras ver resultados -->
          <div v-if="!admin" class="qz-student-footer-actions">
            <button
              type="button"
              class="qz-action-pill-btn qz-btn--primary"
              title="Volver al cuestionario"
              @click="goToCuestionario"
            >
              <ion-icon :icon="gridOutline"></ion-icon>
              <span>Volver al Cuestionario</span>
            </button>
          </div>
        </div>

        <!-- VISTA DE ESPERA PARA ESTUDIANTES (Pregunta aún abierta / en curso) -->
        <div v-else class="qz-waiting-container">
          <div class="qz-waiting-card">
            <div
              class="qz-waiting-icon-wrap"
              :class="{ 'is-answered': haRespondido }"
            >
              <ion-icon
                :icon="haRespondido ? mailOutline : timeOutline"
              ></ion-icon>
            </div>

            <h2 class="qz-waiting-title">
              {{ haRespondido ? "¡Tu respuesta ha sido enviada!" : "Pregunta en Curso" }}
            </h2>

            <p class="qz-waiting-text">
              <template v-if="haRespondido">
                Tu respuesta para <strong>{{ pregunta.title }}</strong> ha sido enviada al docente.
                Por motivos de equidad y para evitar ventajas entre compañeros, los aciertos y los puntos obtenidos se revelarán una vez se cierre la pregunta.
              </template>
              <template v-else>
                Esta pregunta aún se encuentra abierta para participación. Todavía no has enviado tu respuesta.
              </template>
            </p>

            <div class="qz-waiting-meta">
              <div class="qz-waiting-pill">
                <ion-icon :icon="lockClosedOutline"></ion-icon>
                <span>Resultados y puntos bloqueados hasta el cierre</span>
              </div>
              <div class="qz-responses-count-pill">
                <ion-icon :icon="peopleOutline"></ion-icon>
                <span>{{ respuestas.length }} {{ respuestas.length === 1 ? 'estudiante ha' : 'estudiantes han' }} respondido</span>
              </div>
            </div>

            <div class="qz-waiting-actions">
              <button
                v-if="!haRespondido"
                type="button"
                class="qz-action-pill-btn qz-btn--primary"
                @click="goToPregunta"
              >
                <ion-icon :icon="paperPlaneOutline"></ion-icon>
                <span>Ir a responder ahora</span>
              </button>

              <button
                type="button"
                class="qz-action-pill-btn"
                :class="haRespondido ? 'qz-btn--primary' : 'qz-btn--secondary'"
                title="Volver al cuestionario"
                @click="goToCuestionario"
              >
                <ion-icon :icon="gridOutline"></ion-icon>
                <span>Volver al Cuestionario</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 3. ACCIONES DOCENTE / ADMIN FLOTANTES INFERIORES -->
        <div v-if="admin" class="qz-admin-actions-bar">
          <!-- Cerrar Pregunta / Asignar Bonus -->
          <button
            type="button"
            class="qz-action-pill-btn qz-btn--primary"
            title="Cerrar pregunta para mostrar resultados"
            @click="bonus"
          >
            <ion-icon :icon="lockClosedOutline"></ion-icon>
            <span>Cerrar Pregunta</span>
          </button>

          <!-- Escáner QR OMR -->
          <button
            type="button"
            class="qz-action-pill-btn qz-btn--secondary"
            title="Lector OMR / QR"
            @click="goToQr"
          >
            <ion-icon :icon="qrCodeOutline"></ion-icon>
            <span>Escáner QR</span>
          </button>

          <!-- Eliminar Todas las Respuestas -->
          <button
            type="button"
            class="qz-action-pill-btn qz-btn--danger"
            title="Reiniciar y eliminar respuestas"
            @click="presentDeleteAllAlert"
          >
            <ion-icon :icon="trashOutline"></ion-icon>
            <span>Reiniciar</span>
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import router from "../router";
import axios from "axios";
import { tokenHeader, adminOprofesor, usuarioGet } from "../globalService";

import {
  arrowBackOutline,
  refreshOutline,
  sparklesOutline,
  swapVerticalOutline,
  lockClosedOutline,
  trashOutline,
  qrCodeOutline,
  happyOutline,
  sadOutline,
  timeOutline,
  mailOutline,
  peopleOutline,
  paperPlaneOutline,
  gridOutline,
  helpCircleOutline,
} from "ionicons/icons";

import {
  onIonViewDidEnter,
  IonPage,
  IonContent,
  IonIcon,
  alertController,
  toastController,
} from "@ionic/vue";

export default {
  name: "PreguntaResult",
  components: {
    IonPage,
    IonContent,
    IonIcon,
  },
  setup() {
    const usuario = usuarioGet();
    const admin = adminOprofesor();
    const mroute = useRoute();
    const grupoUsuario = ref();
    const { id } = mroute.params;
    const respuestas = ref([]);
    const pregunta = ref({ title: "Cargando...", points: 0 });
    const ordenActual = ref("llegada");
    const isReloading = ref(false);

    const getQuestionId = () => mroute.params?.id || id;

    // Estadísticas calculadas
    const countCorrectas = computed(() => {
      return respuestas.value.filter((r) => r.points > 0).length;
    });

    const countIncorrectas = computed(() => {
      return respuestas.value.filter((r) => r.points <= 0).length;
    });

    const isQuestionOpen = computed(() => pregunta.value?.available !== false);

    const haRespondido = computed(() => {
      if (!respuestas.value || respuestas.value.length === 0) return false;
      return respuestas.value.some((r) => {
        if (pregunta.value.quiz?.quizType === "group") {
          return (
            r.group &&
            grupoUsuario.value?.id &&
            r.group.id === grupoUsuario.value.id
          );
        }
        return r.user && usuario?.id && r.user.id === usuario.id;
      });
    });

    const goToPregunta = () => {
      const qId = getQuestionId();
      router.push(`/pregunta/${qId}`);
    };

    // Limpieza de etiquetas HTML para el subtítulo del hero
    const cleanSentence = (html) => {
      if (!html) return "";
      const div = document.createElement("div");
      div.innerHTML = html;
      return div.textContent || div.innerText || "";
    };

    // Limpieza segura de strings (elimina "undefined" o "null" accidentales)
    const cleanString = (val) => {
      if (!val) return "";
      const str = String(val).trim();
      if (str.toLowerCase() === "undefined" || str.toLowerCase() === "null") return "";
      return str;
    };

    // Nombre de visualización según modalidad
    const getParticipantName = (respuesta) => {
      if (!respuesta) return "Desconocido";
      if (pregunta.value.quiz?.quizType === "group" || respuesta.group) {
        const groupName = cleanString(respuesta.group?.name);
        if (groupName) return groupName;
        if (pregunta.value.quiz?.quizType === "group") return "Grupo Desconocido";
      }
      if (respuesta.user) {
        const first = cleanString(respuesta.user.name);
        const last = cleanString(respuesta.user.lastName);
        const fullName = `${first} ${last}`.trim();
        if (fullName) return fullName;
        const username = cleanString(respuesta.user.username);
        if (username) return username;
        const email = cleanString(respuesta.user.email);
        if (email) return email;
        if (respuesta.user.code) return `Estudiante ${respuesta.user.code}`;
      }
      if (respuesta.group) {
        return cleanString(respuesta.group.name) || "Grupo Desconocido";
      }
      return "Estudiante";
    };

    // Helper para iniciales de grupos
    const getGroupInitials = (groupName) => {
      const cleaned = cleanString(groupName).replace(/undefined|null/gi, "").trim();
      if (!cleaned) return "GP";
      const groupMatch = cleaned.match(/^([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s*[-_]?\s*(\d+)/i);
      if (groupMatch) {
        const letter = groupMatch[1].charAt(0).toUpperCase();
        const num = groupMatch[2];
        return `${letter}${num}`;
      }
      const parts = cleaned.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      }
      return cleaned.substring(0, 2).toUpperCase();
    };

    // Iniciales para el avatar: Primer carácter del nombre y primer carácter del apellido
    const getInitials = (itemOrName) => {
      if (!itemOrName) return "?";

      // 1. Si se pasa el objeto de respuesta o usuario
      if (typeof itemOrName === "object") {
        if (itemOrName.group?.name) {
          return getGroupInitials(itemOrName.group.name);
        }
        if (itemOrName.user) {
          const first = cleanString(itemOrName.user.name);
          const last = cleanString(itemOrName.user.lastName);
          const firstInitial = first ? first.charAt(0) : "";
          const lastInitial = last ? last.charAt(0) : "";

          if (firstInitial && lastInitial) {
            return (firstInitial + lastInitial).toUpperCase();
          }
          if (firstInitial) {
            return first.substring(0, 2).toUpperCase();
          }
          if (lastInitial) {
            return last.substring(0, 2).toUpperCase();
          }
        }
        return getInitials(getParticipantName(itemOrName));
      }

      // 2. Si se pasa como string (fallback)
      const cleaned = cleanString(itemOrName).replace(/undefined|null/gi, "").trim();
      if (!cleaned) return "?";

      const groupMatch = cleaned.match(/^([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s*[-_]?\s*(\d+)/i);
      if (groupMatch) {
        const letter = groupMatch[1].charAt(0).toUpperCase();
        const num = groupMatch[2];
        return `${letter}${num}`;
      }

      const parts = cleaned.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        const firstInitial = parts[0].charAt(0);
        const lastInitial = parts[parts.length - 1].charAt(0);
        return (firstInitial + lastInitial).toUpperCase();
      }
      if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      return "?";
    };

    // Colores pastel para los avatares Queezy
    const getAvatarColorClass = (index) => {
      const colors = [
        "qz-avatar--purple",
        "qz-avatar--cyan",
        "qz-avatar--pink",
        "qz-avatar--gold",
      ];
      return colors[index % colors.length];
    };

    const isOwnAnswer = (respuesta) => {
      if (!respuesta) return false;
      if (pregunta.value.quiz?.quizType === "group" || respuesta.group) {
        return Boolean(
          respuesta.group &&
          grupoUsuario.value?.id &&
          respuesta.group.id === grupoUsuario.value.id
        );
      }
      return Boolean(
        respuesta.user && usuario?.id && respuesta.user.id === usuario.id
      );
    };

    // Control de privacidad de la respuesta elegida
    const canViewAnswer = (respuesta) => {
      if (admin) return true;
      // Para estudiantes: Solo pueden ver la opción si es su propia respuesta Y la pregunta está cerrada
      if (pregunta.value?.available !== false) return false;
      return isOwnAnswer(respuesta);
    };

    // Ordenamiento por Nombre o por Llegada
    const toggleOrden = () => {
      if (ordenActual.value === "llegada") {
        ordenarPorNombre();
        ordenActual.value = "nombre";
      } else {
        ordenarPorLlegada();
        ordenActual.value = "llegada";
      }
    };

    const ordenarPorNombre = () => {
      respuestas.value.sort((a, b) => {
        if (pregunta.value.quiz?.quizType === "individual") {
          const nameA = getParticipantName(a);
          const nameB = getParticipantName(b);
          return nameA.localeCompare(nameB);
        } else if (pregunta.value.quiz?.quizType === "group") {
          const nameA = a.group?.name || "";
          const nameB = b.group?.name || "";
          const regex = /(\D+)(\d+)/;
          const [, textA, numberA] = nameA.match(regex) || [null, nameA, 0];
          const [, textB, numberB] = nameB.match(regex) || [null, nameB, 0];
          const textComparison = textA.localeCompare(textB);
          if (textComparison !== 0) return textComparison;
          return parseInt(numberA, 10) - parseInt(numberB, 10);
        }
        return 0;
      });
    };

    const ordenarPorLlegada = () => {
      respuestas.value.sort((a, b) => {
        if (a.id && b.id && typeof a.id === "number" && typeof b.id === "number") {
          return a.id - b.id;
        }
        return 0;
      });
    };

    const groupAnswerCount = ref({});
    const calcularRespuestasPorGrupo = () => {
      const counts = {};
      for (const respuesta of respuestas.value) {
        if (respuesta.group && respuesta.group.id) {
          counts[respuesta.group.id] = (counts[respuesta.group.id] || 0) + 1;
        }
      }
      groupAnswerCount.value = counts;
    };

    const reloadAnswers = async (manual = false) => {
      if (isReloading.value) return;
      isReloading.value = true;
      const qId = getQuestionId();

      try {
        tokenHeader();

        // 1. Refrescar datos y estado de la pregunta (esencial si fue cerrada para que el estudiante vea las respuestas)
        if (qId) {
          try {
            const questionResponse = await axios.get(
              `/questions/${qId}`,
              tokenHeader()
            );
            if (questionResponse.data) {
              pregunta.value = questionResponse.data;
            }
          } catch (err) {
            console.warn("No se pudo refrescar detalles de la pregunta:", err);
          }
        }

        // 2. Si es estudiante y no tiene grupo cargado, cargarlo
        if (!adminOprofesor() && usuario?.id && !grupoUsuario.value) {
          try {
            const groupsResponse = await axios.get(
              `/users/${usuario.id}/groups`,
              tokenHeader()
            );
            grupoUsuario.value = groupsResponse.data?.filter(
              (g) => g.active
            )[0]?.group;
          } catch (e) {
            console.warn("No se pudo refrescar grupo:", e);
          }
        }

        // 3. Refrescar las respuestas de los participantes
        if (qId) {
          const response = await axios.get(
            `/questions/${qId}/answers`,
            tokenHeader()
          );
          respuestas.value = response.data || [];
          calcularRespuestasPorGrupo();
          if (ordenActual.value === "nombre") {
            ordenarPorNombre();
          } else {
            ordenarPorLlegada();
          }
        }

        if (manual) {
          const toast = await toastController.create({
            message: "Respuestas actualizadas",
            duration: 1500,
            color: "success",
            position: "top",
          });
          await toast.present();
        }
      } catch (e) {
        console.error("Error al refrescar respuestas:", e);
        if (manual) {
          const toast = await toastController.create({
            message: "Error al actualizar respuestas",
            duration: 2500,
            color: "danger",
            position: "top",
          });
          await toast.present();
        }
      } finally {
        setTimeout(() => {
          isReloading.value = false;
        }, 400);
      }
    };

    const presentDeleteAllAlert = async () => {
      const alert = await alertController.create({
        header: "Confirmar Eliminación",
        message:
          "¿Estás seguro de que quieres eliminar TODAS las respuestas a esta pregunta? Los estudiantes podrán responder nuevamente.",
        buttons: [
          {
            text: "Cancelar",
            role: "cancel",
          },
          {
            text: "Eliminar Todo",
            role: "destructive",
            handler: () => {
              deleteAllAnswers();
            },
          },
        ],
      });
      await alert.present();
    };

    const deleteAllAnswers = async () => {
      try {
        const qId = getQuestionId();
        await axios.delete(`/answers/question/${qId}`, tokenHeader());
        respuestas.value = [];
        calcularRespuestasPorGrupo();
      } catch (error) {
        console.error("Error al eliminar las respuestas:", error);
      }
    };

    const goToCuestionario = () => {
      const quizId = pregunta.value?.quiz?.id || pregunta.value?.quizId;
      if (quizId) {
        router.push(`/cuestionario/${quizId}`);
      } else {
        router.back();
      }
    };

    const goBack = () => {
      goToCuestionario();
    };

    const goToQr = () => {
      const qId = getQuestionId();
      router.push("/qr-preguntas/" + qId);
    };

    const bonus = async () => {
      try {
        const qId = getQuestionId();
        await axios.post(`/answers/question/${qId}/bonus`, {}, tokenHeader());
        router.push("/pregunta/" + qId);
      } catch (err) {
        console.error("Error al cerrar pregunta:", err);
      }
    };

    onIonViewDidEnter(async () => {
      await reloadAnswers(false);
    });

    return {
      admin,
      id,
      usuario,
      pregunta,
      respuestas,
      grupoUsuario,
      groupAnswerCount,
      ordenActual,
      countCorrectas,
      countIncorrectas,
      isQuestionOpen,
      haRespondido,
      isReloading,
      goToPregunta,
      cleanSentence,
      getParticipantName,
      getInitials,
      getAvatarColorClass,
      canViewAnswer,
      isOwnAnswer,
      toggleOrden,
      reloadAnswers,
      presentDeleteAllAlert,
      goBack,
      goToCuestionario,
      goToQr,
      bonus,
      arrowBackOutline,
      refreshOutline,
      sparklesOutline,
      swapVerticalOutline,
      lockClosedOutline,
      trashOutline,
      qrCodeOutline,
      happyOutline,
      sadOutline,
      timeOutline,
      mailOutline,
      peopleOutline,
      paperPlaneOutline,
      gridOutline,
      helpCircleOutline,
    };
  },
};
</script>

<style scoped>
/* ==========================================================================
   1. PÁGINA Y HERO HEADER PÚRPURA QUEEZY
   ========================================================================== */
.qz-pregunta-result-page {
  --background: var(--qz-color-purple-bg, #efeefc);
  background-color: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-result-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  --keyboard-offset: 0px !important;
  --padding-bottom: 0px;
}

/* Cabecera Hero Púrpura */
.qz-hero-section {
  background: linear-gradient(180deg, #6a5ae0 0%, #7667e8 100%);
  padding: calc(env(safe-area-inset-top, 0px) + 16px) 20px 32px;
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;
  box-shadow: 0 10px 24px -4px rgba(106, 90, 224, 0.28);
  color: #ffffff;
}

.qz-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Botones circulares translúcidos */
.qz-circle-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.qz-circle-btn ion-icon {
  pointer-events: none;
}

.qz-circle-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.3);
}

.qz-circle-btn.is-active {
  background: #ffffff;
  color: var(--qz-color-purple-primary, #6a5ae0);
  border-color: #ffffff;
  box-shadow: 0 4px 12px rgba(12, 9, 42, 0.15);
}

.qz-circle-btn.is-loading {
  opacity: 0.85;
  cursor: wait;
}

.qz-spin-icon {
  animation: qz-spin 0.8s linear infinite;
}

@keyframes qz-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.qz-hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* Pill central */
.qz-header-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.38);
  padding: 6px 14px;
  border-radius: var(--qz-radius-full, 9999px);
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.qz-pill-icon {
  font-size: 14px;
  color: #ffae33;
}

/* Título Hero */
.qz-hero-titles {
  margin-top: 18px;
  text-align: center;
}

.qz-hero-tag {
  display: block;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.82);
  margin-bottom: 6px;
}

.qz-hero-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.35;
}

.qz-hero-subtitle {
  margin: 8px auto 0;
  max-width: 480px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Grid de Estadísticas de la Pregunta */
.qz-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 24px;
}

.qz-stat-box {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: var(--qz-radius-lg, 20px);
  padding: 12px 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.qz-stat-value {
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.2;
}

.qz-stat-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.82);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-top: 2px;
}

.qz-stat--success .qz-stat-value {
  color: #53df83;
}

.qz-stat--danger .qz-stat-value {
  color: #ff8fa2;
}

.qz-stat--pending .qz-stat-value {
  color: #ffda55;
  font-size: 16px;
}

.qz-stat--warning .qz-stat-value {
  color: #ffb067;
  font-size: 16px;
}

/* ==========================================================================
   2. HOJA DE RESULTADOS (QUEEZY SHEET)
   ========================================================================== */
.qz-sheet-section {
  max-width: 680px;
  margin: -16px auto 0;
  padding: 0 16px 120px;
  position: relative;
  z-index: 5;
}

.qz-sheet-container {
  background: #ffffff;
  border-radius: var(--qz-radius-2xl, 32px);
  border: 1.5px solid rgba(230, 230, 230, 0.7);
  box-shadow: 0 12px 32px -4px rgba(106, 90, 224, 0.12),
    0 2px 6px -1px rgba(12, 9, 42, 0.04);
  padding: 24px 20px;
  box-sizing: border-box;
}

.qz-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1.5px solid #f0eefb;
}

.qz-sheet-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qz-sheet-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-sheet-badge {
  background-color: var(--qz-color-purple-bg, #efeefc);
  color: var(--qz-color-purple-primary, #6a5ae0);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.qz-sheet-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--qz-color-text-muted, #858494);
}

/* Lista de Tarjetas de Respuesta */
.qz-responses-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qz-response-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background-color: #ffffff;
  border: 1.5px solid var(--qz-color-border, #e6e6e6);
  border-radius: var(--qz-radius-xl, 24px);
  padding: 14px 16px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(12, 9, 42, 0.02);
}

.qz-response-card:hover {
  border-color: #d1cbfa;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(106, 90, 224, 0.08);
}

.qz-card--correct {
  border-color: rgba(83, 223, 131, 0.35);
}

.qz-card--wrong {
  border-color: rgba(255, 86, 86, 0.3);
}

.qz-card--own {
  border-color: var(--qz-color-purple-primary, #6a5ae0);
  background-color: rgba(106, 90, 224, 0.04);
}

/* Avatares Queezy con colores pastel */
.qz-user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);
}

.qz-avatar--purple {
  background-color: #efeefc;
  color: #6a5ae0;
}

.qz-avatar--cyan {
  background-color: #e8f9fe;
  color: #0099cc;
}

.qz-avatar--pink {
  background-color: #fff0f3;
  color: #e05675;
}

.qz-avatar--gold {
  background-color: #fff6e7;
  color: #d48806;
}

/* Información del participante */
.qz-participant-info {
  flex: 1;
  min-width: 0;
}

.qz-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.qz-participant-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-order-pill {
  font-size: 11px;
  font-weight: 700;
  color: #858494;
  background-color: #f4f3fb;
  padding: 2px 7px;
  border-radius: 9999px;
  flex-shrink: 0;
}

/* Bloque y fila de la opción */
.qz-option-block {
  margin-top: 6px;
  width: 100%;
}

.qz-option-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.qz-own-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  background-color: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.qz-option-chip {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  flex-shrink: 0;
  text-transform: uppercase;
}

.qz-option-chip.is-correct {
  background-color: #eafbf1;
  color: #2e7d32;
}

.qz-option-chip.is-wrong {
  background-color: #feecec;
  color: #d32f2f;
}

.qz-option-chip.is-locked {
  background-color: #f0f0f5;
  color: #858494;
}

/* Fila aparte con su propio espacio para enunciados largos */
.qz-option-sentence-box {
  margin-top: 8px;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--qz-color-text-main, #0c092a);
  background: var(--qz-color-card-sub, #f8f8fd);
  border: 1px solid var(--qz-color-border, #e9e8f7);
  border-radius: 12px;
  padding: 8px 12px;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  width: 100%;
  box-sizing: border-box;
}

.qz-option-sentence-box p {
  margin: 0;
}

.qz-option-sentence-box img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin-top: 6px;
}

.qz-option-locked-hint,
.qz-option-peer-hint {
  font-style: italic;
  font-size: 12px;
  color: var(--qz-color-text-muted, #858494);
}

/* Badges de puntuación */
.qz-score-badge-wrap {
  flex-shrink: 0;
}

.qz-points-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: var(--qz-radius-md, 16px);
  font-size: 13px;
  font-weight: 700;
}

.qz-badge--success {
  background-color: #eafbf1;
  color: #2e7d32;
  border: 1px solid rgba(83, 223, 131, 0.3);
}

.qz-badge--danger {
  background-color: #feecec;
  color: #d32f2f;
  border: 1px solid rgba(255, 86, 86, 0.3);
}

/* ==========================================================================
   3. ESTADOS DE ESPERA Y EMPTY CARDS
   ========================================================================== */
.qz-empty-card,
.qz-waiting-card {
  background: #ffffff;
  border-radius: var(--qz-radius-2xl, 32px);
  border: 1.5px dashed #c4d0fb;
  padding: 40px 24px;
  text-align: center;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.06);
}

.qz-empty-icon-wrap,
.qz-waiting-icon-wrap {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: #efeefc;
  color: var(--qz-color-purple-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.qz-empty-title,
.qz-waiting-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0c092a);
}

.qz-empty-text,
.qz-waiting-text {
  margin: 0 auto;
  max-width: 440px;
  font-size: 14px;
  color: var(--qz-color-text-muted, #858494);
  line-height: 1.5;
}

.qz-waiting-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #fff6e7;
  color: #d48806;
  border: 1px solid #ffe7ba;
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
}

.qz-waiting-icon-wrap.is-answered {
  background: #efeefc;
  color: var(--qz-color-purple-primary, #6a5ae0);
}

.qz-waiting-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}

.qz-responses-count-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #efeefc;
  color: var(--qz-color-purple-primary, #6a5ae0);
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
}

.qz-waiting-actions {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.qz-student-footer-actions {
  margin-top: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ==========================================================================
   4. BARRA DE ACCIONES DOCENTE INFERIOR
   ========================================================================== */
.qz-admin-actions-bar {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.qz-action-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 20px;
  border-radius: var(--qz-radius-lg, 20px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(12, 9, 42, 0.06);
}

.qz-action-pill-btn:active {
  transform: translateY(2px);
}

.qz-btn--primary {
  background-color: var(--qz-color-purple-primary, #6a5ae0);
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(106, 90, 224, 0.35);
}

.qz-btn--secondary {
  background-color: #ffffff;
  color: var(--qz-color-purple-primary, #6a5ae0);
  border: 1.5px solid var(--qz-color-purple-primary, #6a5ae0);
}

.qz-btn--danger {
  background-color: #feecec;
  color: var(--qz-color-red-wrong, #ff5656);
  border: 1.5px solid rgba(255, 86, 86, 0.4);
}
</style>
