<template>
  <div class="book-card" @click="$emit('click')">
    <!-- 书籍封面 -->
    <div class="book-cover">
      <img
        v-if="book.coverUrl"
        :src="book.coverUrl"
        :alt="book.title"
        class="cover-image"
      />
      <div v-else class="default-cover">
        <span class="cover-text">{{ book.title }}</span>
      </div>

      <!-- 进度条 -->
      <div v-if="book.progress > 0" class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: book.progress + '%' }"
        ></div>
      </div>
    </div>

    <!-- 书籍信息 -->
    <div class="book-info">
      <h3 class="book-title" :title="book.title">{{ book.title }}</h3>
      <p class="book-author" :title="book.author">{{ book.author }}</p>
    </div>

    <!-- 操作按钮 -->
    <div class="book-actions">
      <button
        @click.stop="$emit('remove', book.id)"
        class="remove-btn"
        title="移除书籍"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup>
// 定义props
const props = defineProps({
  book: {
    type: Object,
    required: true,
  },
});

// 定义事件
defineEmits(["click", "remove"]);
</script>

<style scoped>
.book-card {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.book-cover {
  position: relative;
  width: 100%;
  height: 160px;
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

.cover-text {
  font-size: 16px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.2);
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s;
}

.book-info {
  padding: 12px;
}

.book-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  margin: 0;
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.book-card:hover .book-actions {
  opacity: 1;
}

.remove-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  color: #dc3545;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  line-height: 20px;
  text-align: center;
  padding: 0;
  box-sizing: border-box;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background-color: #dc3545;
  color: white;
}

@media (prefers-color-scheme: dark) {
  .book-card {
    background-color: #2d2d2d;
  }

  .book-title {
    color: #fff;
  }

  .book-author {
    color: #ccc;
  }
}
</style>
