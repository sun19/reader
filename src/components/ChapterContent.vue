<template>
  <div class="chapter-content" :style="contentStyle" ref="contentRef">
    <div class="chapter-text" v-html="formattedContent"></div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

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
  fontSize: {
    type: Number,
    default: 16,
  },
  lineHeight: {
    type: Number,
    default: 1.8,
  },
  fontFamily: {
    type: String,
    default: "Microsoft YaHei",
  },
  backgroundColor: {
    type: String,
    default: "#ffffff",
  },
  textColor: {
    type: String,
    default: "#333333",
  },
  paragraphSpacing: {
    type: Number,
    default: 16,
  },
});

const contentRef = ref(null);

// 计算样式
const contentStyle = computed(() => ({
  fontSize: `${props.fontSize}px`,
  lineHeight: props.lineHeight,
  fontFamily: props.fontFamily,
  backgroundColor: props.backgroundColor,
  color: props.textColor,
}));

// 格式化内容
const formattedContent = computed(() => {
  if (!props.content) return "";
  // 将换行符转换为段落，并动态设置段落间距
  return props.content
    .split("\n")
    .filter((line) => line.trim())
    .map(
      (line) =>
        `<p style="margin-bottom: ${
          props.paragraphSpacing
        }px;">${line.trim()}</p>`
    )
    .join("");
});
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
}

.chapter-title {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.chapter-text {
  text-align: justify;
  text-indent: 2em;
  height: 100%;
  overflow: hidden;
}

.chapter-text :deep(p) {
  text-indent: 2em;
  /* margin-bottom 样式已通过 v-html 动态设置，此处不再需要 */
}
</style>
