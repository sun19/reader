<template>
  <div
    class="book-card"
    :style="{
      '--bbc': theme.btnBgColor,
      '--bg': theme.backgroundColor,
      '--fc': theme.fontColor,
    }"
    @click="$emit('click', book)"
  >
    <!-- 书籍封面 -->
    <div class="book-cover">
      <img
        v-if="book.cover_data || book.cover_url"
        :src="book.cover_data || book.cover_url"
        :alt="book.title"
        class="cover-image"
        @error="handleImageError"
      />
      <div v-else class="default-cover">
        <span class="book-icon">📖</span>
      </div>
    </div>

    <!-- 书籍信息 -->
    <div class="book-info">
      <h3 class="book-title" :title="book.title">{{ book.title }}</h3>
      <p class="book-author" :title="book.author">{{ book.author }}</p>
    </div>

    <!-- 阅读进度 -->
    <div class="read-progress">
      {{ book.reading_percentage }}
    </div>

    <!-- 移除按钮 -->
    <button
      class="remove-btn"
      @click.stop="$emit('remove', book.id)"
      title="移除书籍"
    >
      <span class="heroicons--x-mark-16-solid"></span>
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import StyleUtil from "../utils/styleUtil";
// 组件属性
defineProps({
  book: {
    type: Object,
    required: true,
  },
});

// 组件事件
defineEmits(["click", "remove"]);
const theme = ref(StyleUtil.getStyle());
/**
 * 处理图片加载错误
 */
function handleImageError(event) {
  // 图片加载失败时隐藏图片，显示默认封面
  event.target.style.display = "none";
}
</script>

<style scoped>
.book-card {
  position: relative;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.book-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.book-cover {
  width: 100%;
  height: 160px;
  position: relative;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-cover {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-icon {
  font-size: 48px;
  color: white;
}

.book-info {
  padding: 6px;
}

.book-title {
  font-size: 12px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  font-size: 12px;
  color: #666;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.read-progress {
  position: absolute;
  top: 10px;
  left: 0;
  width: 60px;
  height: 20px;
  background-color: var(--bbc);
  padding: 0 10px;
  line-height: 20px;
  border-radius: 0 10px 10px 0;
  color: var(--fc);
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.book-card:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background-color: #e74c3c;
}

@media (prefers-color-scheme: dark) {
  .book-card {
    background: #2d2d2d;
    color: #fff;
  }

  .book-title {
    color: #fff;
  }

  .book-author {
    color: #ccc;
  }

  .progress-bar {
    background-color: #444;
  }
}
</style>
