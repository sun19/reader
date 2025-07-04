<template>
  <div
    class="reader-controls"
    :style="{
      '--bbc': theme.btnBgColor,
      '--bg': theme.backgroundColor,
      '--fc': theme.fontColor,
    }"
    :class="{ visible: isVisible }"
    @mouseenter="showControls"
    @mouseleave="hideControls"
  >
    <div class="control-group">
      <button
        @click="$emit('prev-chapter')"
        :disabled="currentChapter <= 0"
        class="control-btn arrow-btn"
        title="上一章"
      >
        <Icon icon="heroicons:chevron-left-16-solid" width="18" height="18" />
      </button>
    </div>

    <!-- 滑块进度条 -->
    <div class="progress-slider">
      <div class="progress-text">
        {{
          Math.round((currentProgress / Math.max(totalProgress - 1, 1)) * 100)
        }}%
      </div>
      <input
        type="range"
        :min="0"
        :max="totalProgress - 1"
        :value="currentProgress"
        @input="onProgressChange"
        @change="onProgressCommit"
        class="slider"
      />
    </div>

    <div class="control-group">
      <button
        @click="$emit('next-chapter')"
        :disabled="currentChapter >= totalChapters - 1"
        class="control-btn arrow-btn"
        title="下一章"
      >
        <Icon icon="heroicons:chevron-right-16-solid" width="18" height="18" />
      </button>
    </div>
  </div>

  <!-- 底部悬浮触发区域 -->
  <div class="hover-trigger" @mouseenter="showControls"></div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
// 组件属性
const props = defineProps({
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  currentChapter: {
    type: Number,
    default: 0,
  },
  totalChapters: {
    type: Number,
    default: 1,
  },
  theme: {
    type: Object,
    default: () => ({
      backgroundColor: "#ffffff",
      fontColor: "#333333",
      btnBgColor: "#f0f0f0",
    }),
  },
});

// 组件事件
const emit = defineEmits([
  "prev-chapter",
  "next-chapter",
  "goto-page",
  "goto-progress",
]);

// 控制栏显示状态
const isVisible = ref(false);
let hideTimer = null;

/**
 * 计算总进度（所有章节的总页数）
 */
const totalProgress = computed(() => {
  // 假设每章平均页数相同，这里简化计算
  // 实际应用中可能需要更精确的计算方式
  return props.totalChapters * props.totalPages;
});

/**
 * 计算当前进度位置
 */
const currentProgress = computed(() => {
  return props.currentChapter * props.totalPages + props.currentPage - 1;
});

/**
 * 显示控制栏
 */
function showControls() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  isVisible.value = true;
}

/**
 * 隐藏控制栏（延迟）
 */
function hideControls() {
  hideTimer = setTimeout(() => {
    isVisible.value = false;
  }, 300); // 300ms延迟
}

/**
 * 处理进度条拖动
 */
function onProgressChange(event) {
  const progress = parseInt(event.target.value);
  const targetChapter = Math.floor(progress / props.totalPages);
  const targetPage = (progress % props.totalPages) + 1;

  // 实时预览，但不提交
  emit("goto-progress", {
    chapter: Math.min(targetChapter, props.totalChapters - 1),
    page: Math.min(targetPage, props.totalPages),
    preview: true,
  });
}

/**
 * 处理进度条拖动完成
 */
function onProgressCommit(event) {
  const progress = parseInt(event.target.value);
  const targetChapter = Math.floor(progress / props.totalPages);
  const targetPage = (progress % props.totalPages) + 1;

  // 正式跳转
  emit("goto-progress", {
    chapter: Math.min(targetChapter, props.totalChapters - 1),
    page: Math.min(targetPage, props.totalPages),
    preview: false,
  });
}
</script>

<style scoped>
.reader-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 30px;
  background-color: var(--bg);
  border-top: 1px solid var(--fc);
  backdrop-filter: blur(10px);
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;
  z-index: 1000;
}

.reader-controls.visible {
  transform: translateY(0);
}

.hover-trigger {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  z-index: 999;
  pointer-events: auto;
}

.control-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.control-btn {
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  position: relative;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.arrow-btn {
  font-size: 18px;
  padding: 8px 12px;
  min-width: 44px;
}

.progress-slider {
  width: 100%;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--fc);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--fc);
  cursor: pointer;
  border: 2px solid var(--bg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  background: #0056b3;
  transform: scale(1.1);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--fc);
  cursor: pointer;
  border: 2px solid var(--bg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.slider::-moz-range-track {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--fc);
}

.progress-text {
  font-size: 11px;
  color: var(--fc);
  font-weight: 500;
}
</style>
