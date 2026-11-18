<template>
  <div
    class="qz-cat-card"
    :style="{ '--cat-bg': bgColor, '--cat-color': textColor }"
    @click="$emit('click')"
  >
    <div class="qz-cat-card__icon-box">
      <slot name="icon">
        <span class="default-emoji">{{ emoji || '🎯' }}</span>
      </slot>
    </div>

    <div class="qz-cat-card__info">
      <h4 class="qz-cat-card__name">{{ name }}</h4>
      <p class="qz-cat-card__count">{{ count }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "CategoryCard",
  props: {
    name: {
      type: String,
      required: true,
    },
    count: {
      type: [String, Number],
      default: "",
    },
    bgColor: {
      type: String,
      default: "#EFEEFC",
    },
    textColor: {
      type: String,
      default: "#6A5AE0",
    },
    emoji: {
      type: String,
      default: "🎯",
    },
  },
  emits: ["click"],
};
</script>

<style scoped>
.qz-cat-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: #FFFFFF;
  border-radius: var(--qz-radius-xl, 24px);
  padding: 18px;
  min-height: 120px;
  border: 1px solid rgba(230, 230, 230, 0.6);
  box-shadow: 0 4px 16px rgba(12, 9, 42, 0.04);
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  box-sizing: border-box;
}

.qz-cat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(106, 90, 224, 0.12);
  border-color: rgba(106, 90, 224, 0.2);
}

.qz-cat-card:active {
  transform: scale(0.97);
}

.qz-cat-card__icon-box {
  width: 48px;
  height: 48px;
  border-radius: var(--qz-radius-md, 16px);
  background-color: var(--cat-bg, #EFEEFC);
  color: var(--cat-color, #6A5AE0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.default-emoji {
  line-height: 1;
}

.qz-cat-card__info {
  margin-top: 14px;
}

.qz-cat-card__name {
  font-family: var(--qz-font-family, 'Rubik', sans-serif);
  font-size: 15px;
  font-weight: 700;
  color: var(--qz-color-text-main, #0C092A);
  margin: 0 0 4px 0;
}

.qz-cat-card__count {
  font-size: 12px;
  font-weight: 500;
  color: var(--qz-color-text-muted, #858494);
  margin: 0;
}
</style>
