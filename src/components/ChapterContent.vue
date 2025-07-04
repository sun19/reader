<template>
  <div
    class="chapter-content"
    :style="{
      '--bbc': theme.btnBgColor,
      '--bg': theme.backgroundColor,
      '--fc': theme.fontColor,
      '--fontSize': theme.fontSize,
      '--lh': theme.lineHeight,
      '--ff': theme.fontFamily,
      '--ps': theme.paragraphSpacing,
    }"
    ref="contentRef"
  >
    <div class="chapter-text" v-html="formattedContent"></div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from "vue";
// 组件属性
const props = defineProps({
  content: {
    type: String,
    default: "",
  },
  chapterTitle: {
    type: String,
    default: "",
  },
  theme: {
    type: Object,
    default: () => ({}),
  },
  paragraphSpacing: {
    type: Number,
    default: 16,
  },
  // 新增：当前朗读的段落索引
  currentReadingParagraph: {
    type: Number,
    default: -1,
  },
});

// 事件发射
const emit = defineEmits(["paragraph-click"]);

const contentRef = ref(null);

/**
 * 处理段落点击
 */
function handleParagraphClick(event) {
  const paragraphIndex = parseInt(
    event.target.getAttribute("data-paragraph-index")
  );
  if (!isNaN(paragraphIndex)) {
    emit("paragraph-click", paragraphIndex);
  }
}

// 格式化内容 - 添加段落点击事件和高亮样式
const formattedContent = computed(() => {
  if (!props.content) return "";

  return props.content
    .split("\n")
    .filter((line) => line.trim())
    .map((line, index) => {
      const isHighlighted = index === props.currentReadingParagraph;
      const highlightClass = isHighlighted ? "reading-highlight" : "";

      return `<p class="paragraph ${highlightClass}" 
                 data-paragraph-index="${index}" 
                 style="margin-bottom: ${
                   props.theme.paragraphSpacing
                 }px; cursor: pointer;" onclick=${handleParagraphClick}>
                ${line.trim()}
              </p>`;
    })
    .join("");
});

/**
 * 添加段落点击事件监听
 */
function addParagraphClickListeners() {
  nextTick(() => {
    if (!contentRef.value) return;
    const paragraphElements = contentRef.value.querySelectorAll(".paragraph");
    paragraphElements.forEach((element) => {
      element.removeEventListener("click", handleParagraphClick);
      element.addEventListener("click", handleParagraphClick);
    });
  });
}

/**
 * 移除段落点击事件监听
 */
function removeParagraphClickListeners() {
  if (!contentRef.value) return;

  const paragraphElements = contentRef.value.querySelectorAll(".paragraph");
  paragraphElements.forEach((element) => {
    element.removeEventListener("click", handleParagraphClick);
  });
}

// 监听内容变化，重新添加事件监听
watch(
  () => props.content,
  () => {
    // removeParagraphClickListeners();
    // addParagraphClickListeners();
  },
  { immediate: true }
);

// 监听朗读段落变化，滚动到高亮段落
watch(
  () => props.currentReadingParagraph,
  (newIndex) => {
    if (newIndex >= 0) {
      nextTick(() => {
        const highlightedElement =
          contentRef.value?.querySelector(".reading-highlight");
        if (highlightedElement) {
          highlightedElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      });
    }
  }
);
</script>

<style scoped>
.chapter-content {
  padding: 30px;
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0 auto;
  position: relative;
  transition: all 0.3s ease;
  background-color: var(--bg);
  color: var(--fc);
  font-size: var(--fontSize) px;
  line-height: var(--lh);
  font-family: var(--ff);
}

.chapter-text {
  text-align: justify;
  text-indent: 2em;
  height: 100%;
  overflow: hidden;
}

.chapter-text :deep(p) {
  text-indent: 2em;
  transition: background-color 0.3s ease;
}

/* 朗读高亮样式 */
.chapter-text :deep(.reading-highlight) {
  background-color: #fff3cd !important;
  border-left: 4px solid #ffc107;
  padding-left: 12px;
  margin-left: -16px;
  box-shadow: 0 2px 4px rgba(255, 193, 7, 0.2);
}

/* 段落悬停效果 */
.chapter-text :deep(.paragraph:hover) {
  background-color: #f8f9fa;
  transition: background-color 0.2s ease;
}
</style>
