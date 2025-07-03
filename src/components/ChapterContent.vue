<template>
  <div class="chapter-content" :style="contentStyle" ref="contentRef">
    <h2 class="chapter-title">{{ chapterTitle }}</h2>
    <div class="chapter-text" v-html="formattedContent"></div>
    <div class="page-info">
      第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
    </div>
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
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
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
  console.log(props.content);
  // 将换行符转换为段落
  return props.content
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => `<p>${line.trim()}</p>`)
    .join("");
});
</script>

<style scoped>
.chapter-content {
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
  min-height: calc(100vh - 120px);
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
}

.chapter-text :deep(p) {
  margin-bottom: 1em;
  text-indent: 2em;
}

.page-info {
  position: absolute;
  bottom: 20px;
  right: 40px;
  font-size: 12px;
  color: #999;
}

@media (max-width: 768px) {
  .chapter-content {
    padding: 20px;
  }

  .chapter-title {
    font-size: 20px;
  }

  .page-info {
    right: 20px;
  }
}
</style>
