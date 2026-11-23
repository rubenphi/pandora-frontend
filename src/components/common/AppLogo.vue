<template>
  <!-- 
    ======================================================================
    📦 APP LOGO & BRAND IDENTITY COMPONENT (PANDORA)
    ======================================================================
    📍 Ubicación: src/components/common/AppLogo.vue
    🎯 Propósito: Fuente única de la verdad para el logo, isotipo y nombre
                 de la aplicación.
    
    👉 NOTA PARA EL EQUIPO / DESARROLLADORES:
       Si la empresa o el logo cambian en el futuro, solo necesitas
       modificar este archivo. Todo el frontend consumirá el nuevo diseño.
       
       Paleta actual (Queezy DNA):
       - Púrpura principal: #6A5AE0
       - Púrpura profundo: #5A33D6
       - Púrpura suave:   #9087E5
       - Acento Coral:     #FF8FA2
       - Destello Oro:     #FFAE33
    ======================================================================
  -->
  <div :class="['app-logo', `app-logo--${variant}`, `app-logo--${size}`, `app-logo--${theme}`]">
    <!-- Isotipo: Caja de Pandora estilizada en Squircle Queezy -->
    <div class="app-logo__badge" :style="{ width: badgeSize + 'px', height: badgeSize + 'px' }">
      <svg
        :width="iconSize"
        :height="iconSize"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="app-logo__icon"
      >
        <defs>
          <!-- Degradado de la cara frontal izquierda -->
          <linearGradient id="pandoraLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#7C72E5" />
            <stop offset="100%" stop-color="#5A33D6" />
          </linearGradient>

          <!-- Degradado de la cara frontal derecha -->
          <linearGradient id="pandoraRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6A5AE0" />
            <stop offset="100%" stop-color="#4638B8" />
          </linearGradient>

          <!-- Degradado de la tapa superior abierta -->
          <linearGradient id="pandoraTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" dest-color="#B8B2F6" stop-color="#9087E5" />
            <stop offset="100%" stop-color="#6A5AE0" />
          </linearGradient>

          <!-- Brillo / Energía dorada emergiendo de la caja (curiosidad/conocimiento) -->
          <radialGradient id="energyGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFAE33" stop-opacity="1" />
            <stop offset="60%" stop-color="#FF8FA2" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#6A5AE0" stop-opacity="0" />
          </radialGradient>
        </defs>

        <!-- Destellos mágicos Queezy saliendo de la Caja -->
        <circle cx="50" cy="30" r="14" fill="url(#energyGlow)" opacity="0.85" />
        <circle cx="50" cy="24" r="3.5" fill="#FFAE33" />
        <circle cx="36" cy="20" r="2.2" fill="#FF8FA2" />
        <circle cx="64" cy="22" r="2.8" fill="#70D6F5" />

        <!-- Base Isométrica de la Caja de Pandora -->
        <!-- Cara Izquierda -->
        <path
          d="M20 44 L50 60 V88 L20 72 Z"
          fill="url(#pandoraLeftGrad)"
        />
        <!-- Cara Derecha -->
        <path
          d="M50 60 L80 44 V72 L50 88 Z"
          fill="url(#pandoraRightGrad)"
        />

        <!-- Interior iluminado / contenido de la caja -->
        <path
          d="M50 35 L76 47 L50 59 L24 47 Z"
          fill="#432CB8"
        />
        <path
          d="M50 38 L72 48 L50 56 L28 48 Z"
          fill="url(#energyGlow)"
          opacity="0.9"
        />

        <!-- Tapa de la caja (abierta hacia arriba/atrás estilo isométrico) -->
        <path
          d="M50 16 L76 28 L50 40 L24 28 Z"
          fill="url(#pandoraTopGrad)"
          stroke="#EFEEFC"
          stroke-width="1.5"
          stroke-linejoin="round"
        />

        <!-- Detalle de cerradura / insignia central en coral -->
        <circle cx="50" cy="62" r="3" fill="#FF8FA2" />
      </svg>
    </div>

    <!-- Texto de la Marca: Nombre y Subtítulo opcional -->
    <div v-if="showText" class="app-logo__text">
      <h1 class="app-logo__title">{{ brandName }}</h1>
      <span v-if="tagline" class="app-logo__subtitle">{{ tagline }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "AppLogo",
  props: {
    // Tamaño del isotipo: 'sm' (44px), 'md' (64px), 'lg' (88px), 'xl' (110px)
    size: {
      type: String,
      default: "md",
      validator: (val) => ["sm", "md", "lg", "xl"].includes(val),
    },
    // Si se muestra el texto junto al isotipo
    showText: {
      type: Boolean,
      default: true,
    },
    // Orientación: 'vertical' (ideal para Login/Splash) o 'horizontal' (ideal para Headers)
    variant: {
      type: String,
      default: "vertical",
      validator: (val) => ["vertical", "horizontal"].includes(val),
    },
    // Tema de color de texto: 'light' (para fondos claros) o 'purple' (para fondos morados/splash)
    theme: {
      type: String,
      default: "light",
      validator: (val) => ["light", "purple"].includes(val),
    },
    // Nombre de marca personalizable (facilita rebrandings rápidos)
    brandName: {
      type: String,
      default: "PANDORA",
    },
    // Subtítulo o lema
    tagline: {
      type: String,
      default: "Quiz & Learning",
    },
  },
  computed: {
    badgeSize() {
      switch (this.size) {
        case "sm":
          return 44;
        case "md":
          return 64;
        case "lg":
          return 88;
        case "xl":
          return 110;
        default:
          return 64;
      }
    },
    iconSize() {
      return Math.round(this.badgeSize * 0.76);
    },
  },
};
</script>

<style scoped>
.app-logo {
  display: inline-flex;
  align-items: center;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  user-select: none;
}

.app-logo--vertical {
  flex-direction: column;
  text-align: center;
  gap: 12px;
}

.app-logo--horizontal {
  flex-direction: row;
  text-align: left;
  gap: 14px;
}

/* Squircle contenedor del icono */
.app-logo__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  border-radius: 26px;
  box-shadow: 0 10px 24px -2px rgba(106, 90, 224, 0.18), 0 2px 6px rgba(12, 9, 42, 0.04);
  border: 2px solid rgba(255, 255, 255, 0.8);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
}

.app-logo:hover .app-logo__badge {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 14px 28px -2px rgba(106, 90, 224, 0.28);
}

.app-logo--sm .app-logo__badge {
  border-radius: 14px;
}

.app-logo--md .app-logo__badge {
  border-radius: 20px;
}

.app-logo--lg .app-logo__badge {
  border-radius: 28px;
}

.app-logo--xl .app-logo__badge {
  border-radius: 36px;
}

/* Tipografía de la marca */
.app-logo__text {
  display: flex;
  flex-direction: column;
}

.app-logo__title {
  margin: 0;
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-weight: 800;
  letter-spacing: 1.5px;
  line-height: 1.1;
  color: var(--qz-color-text-main, #0C092A);
}

.app-logo--sm .app-logo__title {
  font-size: 18px;
  letter-spacing: 1px;
}

.app-logo--md .app-logo__title {
  font-size: 24px;
}

.app-logo--lg .app-logo__title {
  font-size: 30px;
}

.app-logo--xl .app-logo__title {
  font-size: 38px;
}

.app-logo__subtitle {
  font-size: 13px;
  font-weight: 600;
  color: var(--qz-color-text-muted, #858494);
  margin-top: 3px;
  letter-spacing: 0.3px;
}

.app-logo--sm .app-logo__subtitle {
  font-size: 11px;
}

/* Variante tema Púrpura (para Splash o fondos oscuros) */
.app-logo--purple .app-logo__badge {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

.app-logo--purple .app-logo__title {
  color: #FFFFFF;
}

.app-logo--purple .app-logo__subtitle {
  color: rgba(255, 255, 255, 0.85);
}

/* Modo oscuro para versión estándar */
@media (prefers-color-scheme: dark) {
  body:not(.light) .app-logo:not(.app-logo--purple) .app-logo__badge {
    background: #241d42;
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 24px -2px rgba(0, 0, 0, 0.5);
  }

  body:not(.light) .app-logo:not(.app-logo--purple) .app-logo__title {
    color: #f7f7fd;
  }

  body:not(.light) .app-logo:not(.app-logo--purple) .app-logo__subtitle {
    color: #9e9bb8;
  }
}

:global(body.dark) .app-logo:not(.app-logo--purple) .app-logo__badge,
:global(html.dark) .app-logo:not(.app-logo--purple) .app-logo__badge,
:global(.dark) .app-logo:not(.app-logo--purple) .app-logo__badge {
  background: #241d42;
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 24px -2px rgba(0, 0, 0, 0.5);
}

:global(body.dark) .app-logo:not(.app-logo--purple) .app-logo__title,
:global(html.dark) .app-logo:not(.app-logo--purple) .app-logo__title,
:global(.dark) .app-logo:not(.app-logo--purple) .app-logo__title {
  color: #f7f7fd;
}

:global(body.dark) .app-logo:not(.app-logo--purple) .app-logo__subtitle,
:global(html.dark) .app-logo:not(.app-logo--purple) .app-logo__subtitle,
:global(.dark) .app-logo:not(.app-logo--purple) .app-logo__subtitle {
  color: #9e9bb8;
}
</style>
