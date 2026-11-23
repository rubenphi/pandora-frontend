<template>
  <div class="qz-featured-card">
    <div class="qz-featured-card__content">
      <span class="qz-featured-card__tag">{{ tag }}</span>
      <h3 class="qz-featured-card__title">{{ title }}</h3>
      <p class="qz-featured-card__subtitle">{{ subtitle }}</p>

      <div class="qz-featured-card__footer">
        <div class="qz-featured-card__info">
          <slot name="info">
            <span v-if="detail1" class="info-item">
              <span class="info-emoji">{{ emoji1 || '👥' }}</span>
              {{ detail1 }}
            </span>
            <span v-if="detail2" class="info-item">
              <span class="info-emoji">{{ emoji2 || '⚡' }}</span>
              {{ detail2 }}
            </span>
          </slot>
        </div>

        <button
          v-if="showButton"
          type="button"
          class="qz-featured-card__btn"
          :aria-label="buttonLabel"
          @click="$emit('action')"
        >
          <slot name="button-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" class="play-icon">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </slot>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "FeaturedQuizCard",
  props: {
    tag: {
      type: String,
      default: "MODO CLASE & TRABAJO EN EQUIPO",
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: "Conexión local activa para trabajo colaborativo",
    },
    detail1: {
      type: [String, Number],
      default: "",
    },
    emoji1: {
      type: String,
      default: "👥",
    },
    detail2: {
      type: [String, Number],
      default: "",
    },
    emoji2: {
      type: String,
      default: "📡",
    },
    showButton: {
      type: Boolean,
      default: true,
    },
    buttonLabel: {
      type: String,
      default: "Acción",
    },
  },
  emits: ["action"],
};
</script>

<style scoped>
.qz-featured-card {
  position: relative;
  background: linear-gradient(135deg, #6A5AE0 0%, #9087E5 100%);
  border-radius: var(--qz-radius-2xl, 32px);
  padding: 24px;
  color: #FFFFFF;
  box-shadow: 0 16px 32px -8px rgba(106, 90, 224, 0.45);
  overflow: hidden;
  box-sizing: border-box;
}

/* Decoraciones orgánicas con círculos concéntricos Queezy */
.qz-featured-card::before {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 170px;
  height: 170px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  pointer-events: none;
}

.qz-featured-card::after {
  content: '';
  position: absolute;
  bottom: -60px;
  left: 20%;
  width: 140px;
  height: 140px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  pointer-events: none;
}

.qz-featured-card__content {
  position: relative;
  z-index: 1;
}

.qz-featured-card__tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  padding: 5px 14px;
  border-radius: var(--qz-radius-full, 9999px);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.qz-featured-card__title {
  margin: 0 0 6px 0;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.3;
  color: #FFFFFF;
}

.qz-featured-card__subtitle {
  margin: 0 0 18px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.4;
  font-weight: 400;
}

.qz-featured-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qz-featured-card__info {
  display: flex;
  gap: 16px;
  font-size: 13px;
  font-weight: 600;
  color: #FFFFFF;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-emoji {
  font-size: 15px;
}

.qz-featured-card__btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #FFFFFF;
  color: var(--qz-color-purple-primary, #6A5AE0);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(12, 9, 42, 0.2);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
  flex-shrink: 0;
}

.qz-featured-card__btn:active {
  transform: scale(0.92);
}

.play-icon {
  width: 22px;
  height: 22px;
  margin-left: 2px;
}

/* Modo oscuro */
@media (prefers-color-scheme: dark) {
  body:not(.light) .qz-featured-card__btn {
    background: #241d42;
    color: #a39bf0;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.45);
  }
}

:global(body.dark) .qz-featured-card__btn,
:global(html.dark) .qz-featured-card__btn,
:global(.dark) .qz-featured-card__btn {
  background: #241d42;
  color: #a39bf0;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.45);
}
</style>
