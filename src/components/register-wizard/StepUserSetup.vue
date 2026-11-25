<template>
  <div class="qz-wizard-step">
    <div class="qz-step-header">
      <div class="qz-badge-pill">
        <ion-icon :icon="personOutline"></ion-icon>
        <span>Paso 3 · Datos del usuario</span>
      </div>
      <h2 class="qz-step-title">Tus datos personales</h2>
      <p class="qz-step-subtitle">
        Completa tu información como docente administrador de la institución.
      </p>
    </div>

    <form class="qz-form" @submit.prevent="handleNext">
      <div class="qz-form-grid">
        <div class="qz-field-group">
          <label class="qz-field-label">
            Nombre <span class="qz-required">*</span>
          </label>
          <div
            class="qz-input-box"
            :class="{ 'qz-input-box--focused': focused === 'name' }"
          >
            <ion-icon :icon="personOutline" class="qz-input-icon"></ion-icon>
            <input
              v-model="localUser.name"
              type="text"
              placeholder="Tu nombre"
              class="qz-native-input"
              @focus="focused = 'name'"
              @blur="focused = null"
            />
          </div>
        </div>

        <div class="qz-field-group">
          <label class="qz-field-label">
            Apellido <span class="qz-required">*</span>
          </label>
          <div
            class="qz-input-box"
            :class="{ 'qz-input-box--focused': focused === 'lastName' }"
          >
            <ion-icon :icon="personOutline" class="qz-input-icon"></ion-icon>
            <input
              v-model="localUser.lastName"
              type="text"
              placeholder="Tu apellido"
              class="qz-native-input"
              @focus="focused = 'lastName'"
              @blur="focused = null"
            />
          </div>
        </div>
      </div>

      <div class="qz-field-group">
        <label class="qz-field-label">Correo electrónico</label>
        <div
          class="qz-input-box"
          :class="{ 'qz-input-box--focused': focused === 'email' }"
        >
          <ion-icon :icon="mailOutline" class="qz-input-icon"></ion-icon>
          <input
            v-model="localUser.email"
            type="email"
            placeholder="correo@institucion.edu (opcional)"
            class="qz-native-input"
            @focus="focused = 'email'"
            @blur="focused = null"
          />
        </div>
      </div>

      <div class="qz-form-grid">
        <div class="qz-field-group">
          <label class="qz-field-label">
            Código / Documento <span class="qz-required">*</span>
          </label>
          <div
            class="qz-input-box"
            :class="{ 'qz-input-box--focused': focused === 'code' }"
          >
            <ion-icon :icon="cardOutline" class="qz-input-icon"></ion-icon>
            <input
              v-model="localUser.code"
              type="text"
              placeholder="Documento o código"
              class="qz-native-input"
              @focus="focused = 'code'"
              @blur="focused = null"
            />
          </div>
        </div>

        <div class="qz-field-group">
          <label class="qz-field-label">Teléfono</label>
          <div
            class="qz-input-box"
            :class="{ 'qz-input-box--focused': focused === 'telephone' }"
          >
            <ion-icon :icon="callOutline" class="qz-input-icon"></ion-icon>
            <input
              v-model="localUser.telephone"
              type="tel"
              inputmode="numeric"
              placeholder="Solo dígitos (opcional)"
              class="qz-native-input"
              @focus="focused = 'telephone'"
              @blur="focused = null"
              @input="filterDigits"
            />
          </div>
        </div>
      </div>

      <div class="qz-field-group">
        <label class="qz-field-label">
          Contraseña <span class="qz-required">*</span>
        </label>
        <div
          class="qz-input-box"
          :class="{ 'qz-input-box--focused': focused === 'password' }"
        >
          <ion-icon :icon="lockClosedOutline" class="qz-input-icon"></ion-icon>
          <input
            v-model="localUser.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Crea una contraseña"
            class="qz-native-input"
            @focus="focused = 'password'"
            @blur="focused = null"
          />
          <button
            type="button"
            class="qz-eye-btn"
            @click="showPassword = !showPassword"
            aria-label="Mostrar u ocultar contraseña"
          >
            <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
          </button>
        </div>
      </div>

      <p v-if="errorMsg" class="qz-inline-error">{{ errorMsg }}</p>

      <div class="qz-step-actions">
        <button type="button" class="qz-btn-secondary" @click="$emit('back')">
          <ion-icon :icon="arrowBackOutline"></ion-icon>
          <span>Anterior</span>
        </button>
        <button type="submit" class="qz-btn-primary">
          <span>Siguiente</span>
          <ion-icon :icon="arrowForwardOutline"></ion-icon>
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { reactive, ref, watch } from "vue";
import { IonIcon } from "@ionic/vue";
import {
  arrowBackOutline,
  arrowForwardOutline,
  callOutline,
  cardOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
  personOutline,
} from "ionicons/icons";

export default {
  components: { IonIcon },
  props: {
    user: { type: Object, required: true },
  },
  emits: ["next", "back", "update:user"],
  setup(props, { emit }) {
    const localUser = reactive({ ...props.user });
    const focused = ref(null);
    const showPassword = ref(false);
    const errorMsg = ref("");

    watch(
      localUser,
      (val) => {
        emit("update:user", { ...val });
      },
      { deep: true }
    );

    const filterDigits = (e) => {
      localUser.telephone = e.target.value.replace(/\D/g, "");
    };

    const handleNext = () => {
      errorMsg.value = "";
      if (
        !localUser.name.trim() ||
        !localUser.lastName.trim() ||
        !localUser.code.trim() ||
        !localUser.password
      ) {
        errorMsg.value =
          "Completa los campos obligatorios: nombre, apellido, código y contraseña.";
        return;
      }
      if (
        localUser.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localUser.email.trim())
      ) {
        errorMsg.value = "El correo electrónico no tiene un formato válido.";
        return;
      }
      emit("next");
    };

    return {
      localUser,
      focused,
      showPassword,
      errorMsg,
      filterDigits,
      handleNext,
      arrowBackOutline,
      arrowForwardOutline,
      callOutline,
      cardOutline,
      eyeOffOutline,
      eyeOutline,
      lockClosedOutline,
      mailOutline,
      personOutline,
    };
  },
};
</script>
