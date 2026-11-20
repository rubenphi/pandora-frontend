<template>
  <ion-page class="ion-page qz-create-question-page">
    <ion-content :fullscreen="true" class="qz-create-question-content">
      <div class="qz-page-container">
        <!-- 1. BARRA SUPERIOR QUEEZY -->
        <header class="qz-top-bar">
          <button
            type="button"
            class="qz-circle-btn"
            title="Regresar"
            @click="handleBack"
          >
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </button>

          <h1 class="qz-top-title">
            {{ isEditing ? "Editar Pregunta" : "Nueva Pregunta" }}
          </h1>

          <div class="qz-top-actions">
            <button
              v-if="isEditing"
              type="button"
              class="qz-circle-btn qz-btn--delete"
              title="Eliminar pregunta permanentemente"
              @click="eliminarPreguntaHard"
            >
              <ion-icon :icon="trashOutline"></ion-icon>
            </button>
            <div v-else class="qz-placeholder-btn"></div>
          </div>
        </header>

        <!-- 2. TARJETA RESUMEN DEL CUESTIONARIO ASOCIADO -->
        <div v-if="quizDetails" class="qz-quiz-chip-card">
          <div class="qz-quiz-icon-box">
            <ion-icon :icon="helpCircleOutline"></ion-icon>
          </div>
          <div class="qz-quiz-info">
            <span class="qz-quiz-pre">CUESTIONARIO ASOCIADO</span>
            <h2 class="qz-quiz-name">
              {{
                quizDetails.title ||
                quizDetails.topic ||
                `Cuestionario #${quizIdForRedirect || cuestionario}`
              }}
            </h2>
            <span
              v-if="quizDetails.lesson?.topic || quizDetails.course?.name"
              class="qz-quiz-sub"
            >
              {{ quizDetails.lesson?.topic || quizDetails.course?.name }}
            </span>
          </div>
        </div>

        <!-- 3. FORMULARIO PRINCIPAL -->
        <form class="qz-form-container" @submit.prevent="crearPregunta">
          <!-- Banner de Error si existe -->
          <div v-if="error.estatus === 1" class="qz-error-banner">
            <ion-icon :icon="alertCircleOutline"></ion-icon>
            <span>{{ error.data }}</span>
          </div>

          <!-- TARJETA 1: IDENTIFICACIÓN Y PUNTAJE -->
          <div class="qz-form-card">
            <div class="qz-card-header">
              <div class="qz-field-icon qz-icon--purple">
                <ion-icon :icon="documentTextOutline"></ion-icon>
              </div>
              <div class="qz-card-header-texts">
                <label class="qz-field-label">Título e Identificación</label>
                <p class="qz-field-desc">
                  Nombre referencial u orden de la pregunta en la evaluación
                </p>
              </div>
            </div>

            <div class="qz-grid-fields">
              <div class="qz-input-group">
                <label class="qz-sub-label">Título / Posición</label>
                <div class="qz-input-wrap">
                  <input
                    type="text"
                    v-model="pregunta.title"
                    placeholder="Ej. Primera, Pregunta 1"
                    class="qz-text-input"
                    required
                  />
                </div>
              </div>

              <div class="qz-input-group">
                <label class="qz-sub-label">Valor en Puntos</label>
                <div class="qz-input-wrap qz-input-wrap--icon">
                  <ion-icon
                    :icon="starOutline"
                    class="qz-input-lead-icon"
                  ></ion-icon>
                  <input
                    type="number"
                    v-model="pregunta.points"
                    placeholder="Puntos (ej. 10)"
                    class="qz-text-input qz-input--has-icon"
                    required
                    min="0"
                    step="any"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- TARJETA 2: VISIBILIDAD Y DISPONIBILIDAD (Queezy Toggle Cards) -->
          <div class="qz-form-card">
            <div class="qz-card-header">
              <div class="qz-field-icon qz-icon--coral">
                <ion-icon :icon="optionsOutline"></ion-icon>
              </div>
              <div class="qz-card-header-texts">
                <label class="qz-field-label">Estado y Disponibilidad</label>
                <p class="qz-field-desc">
                  Controla la visualización y si los alumnos pueden responder ahora
                </p>
              </div>
            </div>

            <div class="qz-toggles-grid">
              <!-- Toggle Visible -->
              <div
                class="qz-toggle-card"
                :class="{ 'is-active': !!pregunta.visible }"
                @click="pregunta.visible = !pregunta.visible"
              >
                <div
                  class="qz-toggle-icon"
                  :class="pregunta.visible ? 'qz-tg--purple' : 'qz-tg--muted'"
                >
                  <ion-icon
                    :icon="pregunta.visible ? eyeOutline : eyeOffOutline"
                  ></ion-icon>
                </div>
                <div class="qz-toggle-texts">
                  <span class="qz-toggle-title">Visible</span>
                  <span class="qz-toggle-hint">
                    {{ pregunta.visible ? "Visible en lista" : "Oculta" }}
                  </span>
                </div>
                <div
                  class="qz-pill-switch"
                  :class="{ 'is-checked': !!pregunta.visible }"
                >
                  <div class="qz-pill-thumb"></div>
                </div>
              </div>

              <!-- Toggle Disponible -->
              <div
                class="qz-toggle-card"
                :class="{ 'is-active': !!pregunta.available }"
                @click="pregunta.available = !pregunta.available"
              >
                <div
                  class="qz-toggle-icon"
                  :class="pregunta.available ? 'qz-tg--green' : 'qz-tg--muted'"
                >
                  <ion-icon
                    :icon="
                      pregunta.available ? lockOpenOutline : lockClosedOutline
                    "
                  ></ion-icon>
                </div>
                <div class="qz-toggle-texts">
                  <span class="qz-toggle-title">Disponible</span>
                  <span class="qz-toggle-hint">
                    {{
                      pregunta.available ? "Abierta a responder" : "Bloqueada"
                    }}
                  </span>
                </div>
                <div
                  class="qz-pill-switch"
                  :class="{ 'is-checked': !!pregunta.available }"
                >
                  <div class="qz-pill-thumb"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- TARJETA 3: ENUNCIADO E IMAGEN -->
          <div class="qz-form-card">
            <div class="qz-card-header">
              <div class="qz-field-icon qz-icon--gold">
                <ion-icon :icon="createOutline"></ion-icon>
              </div>
              <div class="qz-card-header-texts">
                <label class="qz-field-label">Enunciado de la Pregunta</label>
                <p class="qz-field-desc">
                  Redacta el texto, formato enriquecido o fórmulas matemáticas
                </p>
              </div>
            </div>

            <!-- Tiptap Editor Wrapper -->
            <div class="qz-editor-container">
              <tiptap-editor v-model="pregunta.sentence" />
            </div>

            <!-- Zona de Imagen Ilustrativa -->
            <div class="qz-image-section">
              <label class="qz-sub-label">Imagen Ilustrativa (Opcional)</label>

              <!-- Vista previa si existe foto -->
              <div v-if="hasPhoto" class="qz-image-preview-card">
                <div class="qz-preview-frame">
                  <img
                    :src="src"
                    alt="Imagen de la pregunta"
                    class="qz-preview-img"
                  />
                </div>
                <div class="qz-preview-meta">
                  <span class="qz-meta-tag">IMAGEN ADJUNTA</span>
                  <p class="qz-meta-name">
                    {{ file?.name || "Foto cargada" }}
                  </p>
                  <div class="qz-preview-actions">
                    <label class="qz-action-btn-sm qz-btn-change">
                      <ion-icon :icon="cloudUploadOutline"></ion-icon>
                      <span>Cambiar</span>
                      <input
                        type="file"
                        accept="image/*"
                        class="qz-hidden-file-input"
                        @change="onFileChange"
                      />
                    </label>
                    <button
                      type="button"
                      class="qz-action-btn-sm qz-btn-remove"
                      @click="borrarFoto"
                    >
                      <ion-icon :icon="trashOutline"></ion-icon>
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Upload Dropzone si no hay foto -->
              <label v-else class="qz-upload-dropzone">
                <div class="qz-dropzone-icon">
                  <ion-icon :icon="imageOutline"></ion-icon>
                </div>
                <div class="qz-dropzone-text">
                  <span class="qz-dropzone-title"
                    >Toca para subir una imagen</span
                  >
                  <span class="qz-dropzone-sub">PNG, JPG o GIF hasta 5MB</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  class="qz-hidden-file-input"
                  @change="onFileChange"
                />
              </label>
            </div>
          </div>

          <!-- TARJETA 4: OPCIONES DE RESPUESTA QUEEZY -->
          <div class="qz-form-card">
            <div class="qz-card-header qz-card-header--options">
              <div class="qz-card-header-left">
                <div class="qz-field-icon qz-icon--cyan">
                  <ion-icon :icon="listOutline"></ion-icon>
                </div>
                <div class="qz-card-header-texts">
                  <label class="qz-field-label">Opciones de Respuesta</label>
                  <p class="qz-field-desc">
                    Marca con un toque cuál es la opción correcta
                  </p>
                </div>
              </div>
              <span class="qz-options-counter">
                {{ pregunta.options?.length || 0 }} opciones
              </span>
            </div>

            <!-- Lista de Opciones Queezy -->
            <div class="qz-options-list">
              <div
                v-for="(option, index) in pregunta.options"
                :key="index"
                class="qz-option-row"
                :class="{ 'is-correct': option.correct }"
              >
                <!-- Badge Identificador (A, B, C, D...) -->
                <div class="qz-opt-badge" :class="getOptionColorClass(index)">
                  {{ option.identifier }}
                </div>

                <!-- Input Enunciado Opción -->
                <div class="qz-opt-input-wrap">
                  <input
                    type="text"
                    v-model="option.sentence"
                    :placeholder="`Texto de la opción ${option.identifier}`"
                    class="qz-opt-input"
                    required
                  />
                </div>

                <!-- Botón / Chip de Selección Correcta -->
                <button
                  type="button"
                  class="qz-opt-check-btn"
                  :class="{ 'is-active': option.correct }"
                  :title="
                    option.correct
                      ? 'Respuesta correcta'
                      : 'Marcar como correcta'
                  "
                  @click="toggleOptionCorrect(option)"
                >
                  <ion-icon
                    :icon="option.correct ? checkmarkCircle : ellipseOutline"
                  ></ion-icon>
                  <span class="qz-check-text">
                    {{ option.correct ? "Correcta" : "Elegir" }}
                  </span>
                </button>

                <!-- Botón Eliminar Opción -->
                <button
                  type="button"
                  class="qz-opt-delete-btn"
                  title="Eliminar opción"
                  @click="removeOption(index)"
                  :disabled="pregunta.options.length <= 1"
                >
                  <ion-icon :icon="trashOutline"></ion-icon>
                </button>
              </div>
            </div>

            <!-- Botón Agregar Opción -->
            <button type="button" class="qz-add-option-btn" @click="addOption">
              <ion-icon :icon="addOutline"></ion-icon>
              <span>Agregar Otra Opción</span>
            </button>
          </div>

          <!-- BOTÓN GUARDAR FINAL -->
          <div class="qz-actions-footer">
            <button type="submit" class="qz-submit-btn" :disabled="saving">
              <ion-icon :icon="checkmarkOutline" v-if="!saving"></ion-icon>
              <span>{{
                saving
                  ? "Guardando..."
                  : isEditing
                  ? "Guardar Cambios"
                  : "Crear Pregunta"
              }}</span>
            </button>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  basedeURL,
  defaultFile,
  tokenHeader,
  usuarioGet,
  numerosOrdinales,
  getAlphabeticalIdentifier,
} from "../globalService";

import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import TiptapEditor from "../components/TiptapEditor.vue";

import {
  IonPage,
  IonContent,
  IonIcon,
  onIonViewWillEnter,
  alertController,
} from "@ionic/vue";

import {
  arrowBackOutline,
  trashOutline,
  checkmarkOutline,
  checkmarkCircle,
  ellipseOutline,
  cloudUploadOutline,
  imageOutline,
  addOutline,
  starOutline,
  documentTextOutline,
  optionsOutline,
  eyeOutline,
  eyeOffOutline,
  lockOpenOutline,
  lockClosedOutline,
  createOutline,
  listOutline,
  helpCircleOutline,
  alertCircleOutline,
} from "ionicons/icons";

export default {
  name: "CrearPregunta",
  components: {
    IonPage,
    IonContent,
    IonIcon,
    TiptapEditor,
  },

  setup() {
    const basedeUrl = basedeURL();
    const router = useRouter();
    const mroute = useRoute();
    const { cuestionario, id } = mroute.params;

    const isEditing = computed(() => id !== undefined);
    const saving = ref(false);
    const quizDetails = ref(null);
    const quizIdForRedirect = ref(null);

    const src = ref(defaultFile("thumbnail"));
    const file = ref({ name: "" });
    const reader = ref();

    const pregunta = ref({
      id: 0,
      title: "",
      sentence: "",
      points: "",
      visible: true,
      available: true,
      exist: true,
      options: [],
    });

    const error = ref({
      estatus: 0,
      data: "",
    });

    const hasPhoto = computed(() => {
      return (
        !!pregunta.value.photo &&
        src.value &&
        !src.value.includes("default")
      );
    });

    const handleError = (err) => {
      console.error("Error:", err);
      const msg = err.response?.data?.message || "Ocurrió un error inesperado.";
      localStorage.setItem("error", msg);
      if (error.value) {
        error.value.estatus = 1;
        error.value.data = msg;
      }
    };

    const getOrdinalTitle = (index) => {
      if (index >= 0 && index < numerosOrdinales.length) {
        return numerosOrdinales[index];
      }
      return `Pregunta ${index + 1}`;
    };

    const getOptionColorClass = (index) => {
      const colors = [
        "qz-badge--purple",
        "qz-badge--coral",
        "qz-badge--gold",
        "qz-badge--cyan",
        "qz-badge--green",
        "qz-badge--orange",
      ];
      return colors[index % colors.length];
    };

    onIonViewWillEnter(async () => {
      tokenHeader();

      if (id !== undefined) {
        // Modo Edición
        try {
          const response = await axios.get("/questions/" + id);
          const data = response.data;
          pregunta.value = {
            ...data,
            visible:
              data.visible === true ||
              data.visible === 1 ||
              data.visible === "true" ||
              data.visible === "1",
            available:
              data.available === true ||
              data.available === 1 ||
              data.available === "true" ||
              data.available === "1",
            quizId: data.quiz?.id || data.quizId,
            instituteId:
              data.institute?.id ||
              data.instituteId ||
              usuarioGet()?.institute?.id,
            options: data.options || [],
          };
          quizIdForRedirect.value = data.quiz?.id;
          quizDetails.value = data.quiz || null;

          if (!pregunta.value.photo) {
            pregunta.value.photo = null;
            src.value = defaultFile("thumbnail");
          } else if (pregunta.value.photo.startsWith("data:")) {
            src.value = pregunta.value.photo;
          } else {
            src.value = basedeUrl + pregunta.value.photo;
          }
        } catch (err) {
          handleError(err);
        }
      }

      if (cuestionario !== undefined) {
        // Modo Creación
        let nextQuestionIndex = 0;
        try {
          const quizResponse = await axios.get(`/quizzes/${cuestionario}`);
          quizDetails.value = quizResponse.data;
          nextQuestionIndex = quizResponse.data.questions?.length || 0;
        } catch (e) {
          console.error("Error fetching quiz for question count:", e);
        }

        pregunta.value = {
          title: getOrdinalTitle(nextQuestionIndex),
          sentence:
            "<h6><strong>Crea tu pregunta</strong></h6><p>En esta sección puedes redactar el enunciado de la pregunta.</p>",
          quizId: parseInt(cuestionario, 10),
          instituteId: usuarioGet().institute?.id,
          points: "",
          visible: true,
          available: true,
          exist: true,
          options: [
            {
              identifier: getAlphabeticalIdentifier(0),
              sentence: "",
              correct: true,
              instituteId: usuarioGet().institute?.id,
              exist: true,
            },
            {
              identifier: getAlphabeticalIdentifier(1),
              sentence: "",
              correct: false,
              instituteId: usuarioGet().institute?.id,
              exist: true,
            },
          ],
        };

        src.value = defaultFile("thumbnail");
      }
    });

    const addOption = () => {
      const newIndex = pregunta.value.options.length;
      pregunta.value.options.push({
        identifier: getAlphabeticalIdentifier(newIndex),
        sentence: "",
        correct: false,
        instituteId: usuarioGet().institute?.id,
        exist: true,
      });
    };

    const toggleOptionCorrect = (selectedOption) => {
      pregunta.value.options.forEach((opt) => {
        opt.correct = opt === selectedOption;
      });
    };

    const removeOption = async (index) => {
      if (pregunta.value.options.length <= 1) {
        const warn = await alertController.create({
          header: "Atención",
          message: "La pregunta debe tener al menos una opción.",
          buttons: ["Entendido"],
        });
        await warn.present();
        return;
      }

      const alert = await alertController.create({
        header: "Confirmar eliminación",
        message: "¿Estás seguro de que quieres eliminar esta opción?",
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Eliminar",
            role: "destructive",
            handler: async () => {
              const optionToRemove = pregunta.value.options[index];
              if (optionToRemove.id) {
                try {
                  await axios.delete(`/options/${optionToRemove.id}`);
                } catch (err) {
                  console.error("Error deleting option:", err);
                  handleError(err);
                  return;
                }
              }
              pregunta.value.options.splice(index, 1);
              pregunta.value.options.forEach((opt, idx) => {
                opt.identifier = getAlphabeticalIdentifier(idx);
              });
            },
          },
        ],
      });
      await alert.present();
    };

    const handleBack = () => {
      if (cuestionario) {
        router.push(`/cuestionario/${cuestionario}`);
      } else if (id && quizIdForRedirect.value) {
        router.push(`/pregunta/${id}`);
      } else if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/admin/cuestionarios");
      }
    };

    const onFileChange = (e) => {
      const selected = e.target.files?.[0];
      if (!selected) return;
      file.value = selected;
      pregunta.value.photo = selected;
      reader.value = new FileReader();
      reader.value.onload = function () {
        src.value = reader.value.result;
      };
      reader.value.readAsDataURL(selected);
    };

    const borrarFoto = async () => {
      const alert = await alertController.create({
        header: "Confirmar eliminación",
        message:
          "¿Estás seguro de que quieres eliminar la imagen de esta pregunta?",
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Eliminar",
            role: "destructive",
            handler: () => {
              pregunta.value.photo = null;
              file.value = { name: "" };
              src.value = defaultFile("thumbnail");
            },
          },
        ],
      });
      await alert.present();
    };

    const eliminarPreguntaHard = async () => {
      const alert = await alertController.create({
        header: "Confirmar eliminación",
        message:
          "¿Estás seguro de que quieres eliminar permanentemente esta pregunta?",
        buttons: [
          { text: "Cancelar", role: "cancel" },
          {
            text: "Eliminar",
            role: "destructive",
            handler: async () => {
              try {
                await axios.delete(`/questions/${id}`);
                localStorage.setItem(
                  "error",
                  "Pregunta eliminada exitosamente.",
                );
                if (quizIdForRedirect.value) {
                  router.push(`/cuestionario/${quizIdForRedirect.value}`);
                } else {
                  router.push("/admin/cuestionarios");
                }
              } catch (err) {
                handleError(err);
              }
            },
          },
        ],
      });
      await alert.present();
    };

    const crearPregunta = async () => {
      saving.value = true;
      error.value.estatus = 0;
      error.value.data = "";

      delete pregunta.value.institute;
      delete pregunta.value.quiz;

      const currentOptions = Array.isArray(pregunta.value.options)
        ? [...pregunta.value.options]
        : [];
      delete pregunta.value.options;
      delete pregunta.value.createdAt;
      delete pregunta.value.updatedAt;

      const rawSentence = pregunta.value.sentence || "";
      if (
        pregunta.value.points === "" ||
        pregunta.value.points === null ||
        pregunta.value.points === undefined ||
        rawSentence ===
          "<h6><strong>Crea tu pregunta</strong></h6><p>En esta sección puedes redactar el enunciado de la pregunta.</p>"
      ) {
        error.value.estatus = 1;
        error.value.data = "Debe añadir un enunciado y el valor en puntos.";
        saving.value = false;
        pregunta.value.options = currentOptions;
        return;
      }

      if (cuestionario === undefined && id === undefined) {
        error.value.estatus = 1;
        error.value.data =
          "No se puede crear una pregunta sin un cuestionario asociado. Verifique la URL.";
        saving.value = false;
        pregunta.value.options = currentOptions;
        return;
      }

      const tryCrearPregunta = async () => {
        try {
          const formData = new FormData();
          const allowedQuestionFields = [
            "title",
            "sentence",
            "points",
            "visible",
            "available",
            "exist",
            "quizId",
            "instituteId",
          ];

          allowedQuestionFields.forEach((field) => {
            if (
              pregunta.value[field] !== null &&
              pregunta.value[field] !== undefined
            ) {
              if (
                field === "visible" ||
                field === "available" ||
                field === "exist"
              ) {
                formData.append(
                  field,
                  pregunta.value[field] ? "true" : "false"
                );
              } else {
                formData.append(field, pregunta.value[field]);
              }
            }
          });

          // Manejo seguro del campo photo para no enviar objetos o rutas no deseadas
          if (
            pregunta.value.photo instanceof File ||
            pregunta.value.photo instanceof Blob
          ) {
            formData.append("photo", pregunta.value.photo);
          } else if (
            pregunta.value.photo === null ||
            pregunta.value.photo === "null"
          ) {
            formData.append("photo", "null");
          } else if (
            typeof pregunta.value.photo === "string" &&
            pregunta.value.photo.trim() !== ""
          ) {
            formData.append("photo", pregunta.value.photo);
          }

          let questionId = id;
          if (cuestionario !== undefined) {
            const response = await axios.post("/questions", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            questionId = response.data.id;
            localStorage.setItem(
              "error",
              response.data.message || "Pregunta creada exitosamente.",
            );
          } else if (id !== undefined) {
            const response = await axios.patch(
              "/questions/" + id,
              formData,
              {
                headers: { "Content-Type": "multipart/form-data" },
              },
            );
            localStorage.setItem(
              "error",
              response.data.message || "Pregunta actualizada exitosamente.",
            );
          }

          // Procesar las opciones con payload limpio
          if (questionId) {
            // CRÍTICO: Primero procesamos las opciones que quedan en 'false'
            // para que en la BD se desmarque la opción correcta anterior.
            // Al final se actualiza la opción que quedó en 'true', evitando que el backend
            // lance la excepción "Cannot mark two answer options as correct".
            const sortedOptions = [...currentOptions].sort((a, b) => {
              if (Boolean(a.correct) === Boolean(b.correct)) return 0;
              return a.correct ? 1 : -1;
            });

            for (const option of sortedOptions) {
              const cleanOption = {
                sentence: option.sentence,
                correct: Boolean(option.correct),
                identifier: option.identifier,
                questionId: Number(questionId),
                instituteId: Number(
                  option.instituteId ||
                    usuarioGet()?.institute?.id ||
                    pregunta.value.instituteId,
                ),
                exist: option.exist !== undefined ? Boolean(option.exist) : true,
              };

              if (option.id) {
                await axios.patch(`/options/${option.id}`, cleanOption);
              } else {
                await axios.post("/options", [cleanOption]);
              }
            }
          }

          if (cuestionario !== undefined) {
            router.push("/pregunta/" + questionId);
          } else if (id !== undefined) {
            router.push("/pregunta/" + id);
          }
        } catch (err) {
          pregunta.value.options = currentOptions;
          if (
            err.response?.status === 409 &&
            err.response?.data?.message === "Este registro ya existe."
          ) {
            try {
              await axios.get("/questions/reset/index");
              await tryCrearPregunta();
            } catch (resetError) {
              handleError(resetError);
            }
          } else {
            handleError(err);
          }
        } finally {
          saving.value = false;
        }
      };

      await tryCrearPregunta();
    };

    return {
      id,
      cuestionario,
      isEditing,
      saving,
      quizDetails,
      quizIdForRedirect,
      pregunta,
      error,
      src,
      file,
      hasPhoto,
      handleBack,
      crearPregunta,
      eliminarPreguntaHard,
      addOption,
      toggleOptionCorrect,
      removeOption,
      onFileChange,
      borrarFoto,
      getOptionColorClass,
      arrowBackOutline,
      trashOutline,
      checkmarkOutline,
      checkmarkCircle,
      ellipseOutline,
      cloudUploadOutline,
      imageOutline,
      addOutline,
      starOutline,
      documentTextOutline,
      optionsOutline,
      eyeOutline,
      eyeOffOutline,
      lockOpenOutline,
      lockClosedOutline,
      createOutline,
      listOutline,
      helpCircleOutline,
      alertCircleOutline,
    };
  },
};
</script>

<style scoped>
.qz-create-question-page {
  background-color: var(--qz-color-purple-bg, #efeefc);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.qz-create-question-content {
  --background: var(--qz-color-purple-bg, #efeefc);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
}

.qz-page-container {
  max-width: 580px;
  margin: 0 auto;
  padding: 16px 16px 28px 16px;
}

/* 1. BARRA SUPERIOR */
.qz-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.qz-top-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0c092a;
  text-align: center;
  letter-spacing: -0.3px;
}

.qz-circle-btn {
  width: 42px;
  height: 42px;
  border-radius: var(--qz-radius-full, 9999px);
  background: #ffffff;
  border: 1px solid #eceaf9;
  color: #0c092a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.06);
  transition: transform 0.15s ease, background 0.15s ease;
}

.qz-circle-btn:active {
  transform: scale(0.92);
  background: #f4f3fd;
}

.qz-btn--delete {
  color: #ff5656;
  border-color: #ffeaea;
  background: #ffffff;
}

.qz-btn--delete:active {
  background: #ffeaea;
}

.qz-placeholder-btn {
  width: 42px;
  height: 42px;
}

/* 2. CHIP / TARJETA DE CUESTIONARIO ASOCIADO */
.qz-quiz-chip-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  box-shadow: 0 4px 14px rgba(106, 90, 224, 0.05);
  border: 1px solid rgba(106, 90, 224, 0.06);
}

.qz-quiz-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: #efeefc;
  color: var(--ion-color-primary, #6a5ae0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.qz-quiz-info {
  flex: 1;
  min-width: 0;
}

.qz-quiz-pre {
  display: block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: #858494;
  text-transform: uppercase;
}

.qz-quiz-name {
  margin: 1px 0 0 0;
  font-size: 14px;
  font-weight: 800;
  color: #0c092a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-quiz-sub {
  display: block;
  font-size: 11px;
  color: #858494;
  margin-top: 1px;
}

/* 3. FORMULARIO Y TARJETAS */
.qz-form-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qz-error-banner {
  background: #ffeaea;
  border: 1px solid #ff8fa2;
  color: #ff5656;
  border-radius: 16px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.qz-error-banner ion-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.qz-form-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 6px 18px rgba(106, 90, 224, 0.06);
  border: 1px solid rgba(106, 90, 224, 0.04);
}

.qz-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.qz-card-header--options {
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.qz-card-header-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.qz-field-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.qz-icon--purple {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-icon--coral {
  background: #ffeaea;
  color: #ff7562;
}

.qz-icon--gold {
  background: #fff3da;
  color: #e59800;
}

.qz-icon--cyan {
  background: #e2f6fc;
  color: #0582ca;
}

.qz-card-header-texts {
  flex: 1;
}

.qz-field-label {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: #0c092a;
  margin-bottom: 2px;
}

.qz-field-desc {
  margin: 0;
  font-size: 11px;
  color: #858494;
  line-height: 1.35;
}

.qz-options-counter {
  font-size: 11px;
  font-weight: 800;
  color: #6a5ae0;
  background: #efeefc;
  padding: 4px 10px;
  border-radius: var(--qz-radius-full, 9999px);
  letter-spacing: 0.3px;
}

.qz-sub-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #49465f;
  margin-bottom: 6px;
}

/* INPUTS DE TEXTO */
.qz-grid-fields {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 12px;
}

.qz-input-group {
  display: flex;
  flex-direction: column;
}

.qz-input-wrap {
  position: relative;
  width: 100%;
}

.qz-text-input {
  width: 100%;
  background: #f9f9fe;
  border: 2px solid #eceaf9;
  border-radius: 16px;
  padding: 12px 14px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 14px;
  font-weight: 600;
  color: #0c092a;
  outline: none;
  transition: border-color 0.15s ease, background 0.15s ease;
  box-sizing: border-box;
}

.qz-text-input:focus {
  border-color: var(--ion-color-primary, #6a5ae0);
  background: #ffffff;
}

.qz-text-input::placeholder {
  color: #b8b6cb;
  font-weight: 400;
}

.qz-input-wrap--icon .qz-input-lead-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 17px;
  color: #e59800;
  pointer-events: none;
}

.qz-text-input.qz-input--has-icon {
  padding-left: 36px;
}

/* TOGGLES GRID */
.qz-toggles-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.qz-toggle-card {
  background: #f9f9fe;
  border: 2px solid #eceaf9;
  border-radius: 18px;
  padding: 12px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  user-select: none;
  transition: all 0.15s ease;
}

.qz-toggle-card:active {
  transform: scale(0.97);
}

.qz-toggle-card.is-active {
  background: #f4f3fd;
  border-color: var(--ion-color-primary, #6a5ae0);
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.08);
}

.qz-toggle-icon {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
}

.qz-tg--purple {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-tg--green {
  background: #e4f9ec;
  color: #10b981;
}

.qz-tg--muted {
  background: #eceaf9;
  color: #9d9bb0;
}

.qz-toggle-texts {
  flex: 1;
  min-width: 0;
}

.qz-toggle-title {
  display: block;
  font-size: 13px;
  font-weight: 800;
  color: #0c092a;
  line-height: 1.2;
}

.qz-toggle-hint {
  display: block;
  font-size: 10.5px;
  color: #858494;
  margin-top: 2px;
}

/* CUSTOM PILL SWITCH */
.qz-pill-switch {
  width: 38px;
  height: 22px;
  background: #dcd9ee;
  border-radius: 9999px;
  position: relative;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.qz-pill-thumb {
  width: 18px;
  height: 18px;
  background: #ffffff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.qz-pill-switch.is-checked {
  background: var(--ion-color-primary, #6a5ae0);
}

.qz-pill-switch.is-checked .qz-pill-thumb {
  transform: translateX(16px);
}

/* EDITOR TIPTAP */
.qz-editor-container {
  margin-bottom: 20px;
}

/* IMAGEN DE LA PREGUNTA */
.qz-image-section {
  display: flex;
  flex-direction: column;
}

.qz-hidden-file-input {
  display: none;
}

.qz-upload-dropzone {
  border: 2px dashed #cfcbe8;
  background: #f9f9fe;
  border-radius: 18px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.qz-upload-dropzone:hover,
.qz-upload-dropzone:active {
  border-color: #6a5ae0;
  background: #efeefc;
}

.qz-dropzone-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #ffffff;
  color: #6a5ae0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(106, 90, 224, 0.1);
}

.qz-dropzone-title {
  display: block;
  font-size: 13.5px;
  font-weight: 700;
  color: #0c092a;
}

.qz-dropzone-sub {
  display: block;
  font-size: 11px;
  color: #858494;
  margin-top: 2px;
}

.qz-image-preview-card {
  background: #f9f9fe;
  border: 1.5px solid #eceaf9;
  border-radius: 18px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.qz-preview-frame {
  width: 80px;
  height: 80px;
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
  flex-shrink: 0;
  border: 1px solid #e1def5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qz-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qz-preview-meta {
  flex: 1;
  min-width: 0;
}

.qz-meta-tag {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #6a5ae0;
  text-transform: uppercase;
}

.qz-meta-name {
  margin: 2px 0 8px 0;
  font-size: 13px;
  font-weight: 700;
  color: #0c092a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qz-preview-actions {
  display: flex;
  gap: 8px;
}

.qz-action-btn-sm {
  padding: 6px 12px;
  border-radius: var(--qz-radius-full, 9999px);
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 11.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  border: none;
  transition: transform 0.12s ease;
}

.qz-action-btn-sm:active {
  transform: scale(0.94);
}

.qz-btn-change {
  background: #efeefc;
  color: #6a5ae0;
}

.qz-btn-remove {
  background: #ffeaea;
  color: #ff5656;
}

/* 4. OPCIONES DE RESPUESTA QUEEZY */
.qz-options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.qz-option-row {
  background: #f9f9fe;
  border: 2px solid #eceaf9;
  border-radius: 18px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.15s ease;
}

.qz-option-row.is-correct {
  border-color: #10b981;
  background: #f0fdf4;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.12);
}

.qz-opt-badge {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: #ffffff;
  flex-shrink: 0;
}

.qz-badge--purple {
  background: #6a5ae0;
}

.qz-badge--coral {
  background: #ff7562;
}

.qz-badge--gold {
  background: #e59800;
}

.qz-badge--cyan {
  background: #0582ca;
}

.qz-badge--green {
  background: #10b981;
}

.qz-badge--orange {
  background: #ff8533;
}

.qz-opt-input-wrap {
  flex: 1;
  min-width: 0;
}

.qz-opt-input {
  width: 100%;
  border: none;
  background: transparent;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13.5px;
  font-weight: 600;
  color: #0c092a;
  outline: none;
  padding: 6px 0;
}

.qz-opt-input::placeholder {
  color: #b8b6cb;
  font-weight: 400;
}

.qz-opt-check-btn {
  background: #eceaf9;
  color: #858494;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 6px 10px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.qz-opt-check-btn.is-active {
  background: #10b981;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.qz-opt-check-btn ion-icon {
  font-size: 15px;
}

.qz-opt-delete-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #ff8fa2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.qz-opt-delete-btn:hover:not(:disabled) {
  background: #ffeaea;
  color: #ff5656;
}

.qz-opt-delete-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qz-add-option-btn {
  width: 100%;
  background: #efeefc;
  color: #6a5ae0;
  border: 1.5px dashed #cfcbe8;
  border-radius: 16px;
  padding: 12px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 13.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.qz-add-option-btn:active {
  background: #e2e0fb;
  transform: scale(0.985);
}

.qz-add-option-btn ion-icon {
  font-size: 18px;
}

/* 5. BOTÓN DE ACCIÓN FINAL */
.qz-actions-footer {
  margin-top: 6px;
}

.qz-submit-btn {
  width: 100%;
  background: var(--ion-color-primary, #6a5ae0);
  color: #ffffff;
  border: none;
  border-radius: var(--qz-radius-full, 9999px);
  padding: 15px 20px;
  font-family: var(--qz-font-family, "Rubik", sans-serif);
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(106, 90, 224, 0.28);
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.qz-submit-btn:active {
  transform: scale(0.985);
  box-shadow: 0 4px 12px rgba(106, 90, 224, 0.2);
}

.qz-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.qz-submit-btn ion-icon {
  font-size: 18px;
}

@media (max-width: 400px) {
  .qz-grid-fields {
    grid-template-columns: 1fr;
  }

  .qz-toggles-grid {
    grid-template-columns: 1fr;
  }
}
</style>
