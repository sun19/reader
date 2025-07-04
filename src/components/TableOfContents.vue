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
        <div class="chapter-list">
          <div
            v-for="(chapter, index) in chapters"
            :key="index"
            class="chapter-item"
            :class="{ active: index === currentChapter }"
            @click="gotoChapter(index)"
          >
            <span class="chapter-number">{{ index + 1 }}</span>
            <span class="chapter-title">{{ chapter.label }}</span>
          </div>
        </div>
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
  chapters: {
    type: Array,
    default: () => [],
  },
  currentChapter: {
    type: Number,
    default: 0,
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

const emit = defineEmits(["close", "goto-chapter"]);

/**
 * 跳转到指定章节
 */
function gotoChapter(chapterIndex) {
  emit("goto-chapter", chapterIndex);
  emit("close");
}
</script>

<style scoped>
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
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-left: 3px solid transparent;
}

.chapter-item.active {
  background-color: var(--bbc);
  border-left-color: var(--fc);
}

.chapter-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: var(--bbc);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  color: var(--fc);
  margin-right: 12px;
  flex-shrink: 0;
}

.chapter-item.active .chapter-number {
  background-color: var(--fc);
  color: white;
}

.chapter-title {
  flex: 1;
  font-size: 14px;
  color: var(--fc);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-item.active .chapter-title {
  color: var(--fc);
  font-weight: 500;
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
