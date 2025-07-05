<template>
  <div
    class="toc-overlay"
    :style="{
      '--bbc': theme.btnBgColor,
      '--bg': theme.backgroundColor,
      '--fc': theme.fontColor,
    }"
    v-show="isVisible"
    @click="$emit('close')"
  >
    <div class="toc-panel" @click.stop>
      <div class="toc-header">
        <h3>目录</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>

      <div class="toc-content">
        <div class="chapter-list" id="toc-view"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 目录组件
 * 显示章节列表，支持点击跳转
 */
defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  theme: {
    type: Object,
    default: () => ({
      backgroundColor: "white",
      fontColor: "black",
      btnBgColor: "white",
    }),
  },
});

const emit = defineEmits(["close"]);
</script>

<style>
.toc-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.toc-panel {
  width: 350px;
  height: 100vh;
  background-color: var(--bg);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  animation: slideInLeft 0.3s ease-out;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--fc);
  background-color: var(--bbc);
}

.toc-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--fc);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--fc);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.toc-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.chapter-list {
  display: flex;
  flex-direction: column;
}

.chapter-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.chapter-item a {
  padding: 0 20px;
  display: block;
  color: var(--fc);
  height: 30px;
  line-height: 30px;
}

#toc-view [aria-current="page"] {
  font-weight: bold;
  background: var(--bbc);
}

#toc-view [aria-expanded="false"] svg {
  transform: rotate(-90deg);
}

#toc-view [aria-expanded="false"] + [role="group"] {
  display: none;
}

/* 滚动条样式 */
.toc-content::-webkit-scrollbar {
  width: 6px;
}

.toc-content::-webkit-scrollbar-track {
  background: var(--bg);
}

.toc-content::-webkit-scrollbar-thumb {
  background: var(--fc);
  border-radius: 3px;
}

.toc-content::-webkit-scrollbar-thumb:hover {
  background: var(--fc);
}
</style>
