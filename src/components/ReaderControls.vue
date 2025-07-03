<template>
  <div class="reader-controls">
    <div class="control-group">
      <button 
        @click="$emit('prev-chapter')"
        :disabled="currentChapter <= 0"
        class="control-btn"
      >
        上一章
      </button>
      <button 
        @click="$emit('prev-page')"
        :disabled="currentPage <= 1 && currentChapter <= 0"
        class="control-btn"
      >
        上一页
      </button>
    </div>
    
    <div class="progress-info">
      <span class="chapter-info">
        {{ currentChapter + 1 }} / {{ totalChapters }}
      </span>
      <div class="page-input">
        <input 
          v-model.number="pageInput"
          @keyup.enter="gotoPage"
          type="number"
          :min="1"
          :max="totalPages"
          class="page-number"
        />
        <span class="page-total">/ {{ totalPages }}</span>
      </div>
    </div>
    
    <div class="control-group">
      <button 
        @click="$emit('next-page')"
        :disabled="currentPage >= totalPages && currentChapter >= totalChapters - 1"
        class="control-btn"
      >
        下一页
      </button>
      <button 
        @click="$emit('next-chapter')"
        :disabled="currentChapter >= totalChapters - 1"
        class="control-btn"
      >
        下一章
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

// 组件属性
const props = defineProps({
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  },
  currentChapter: {
    type: Number,
    default: 0
  },
  totalChapters: {
    type: Number,
    default: 1
  }
});

// 组件事件
defineEmits([
  'prev-page',
  'next-page', 
  'prev-chapter',
  'next-chapter',
  'goto-page'
]);

const pageInput = ref(props.currentPage);

// 监听当前页变化
watch(() => props.currentPage, (newPage) => {
  pageInput.value = newPage;
});

/**
 * 跳转到指定页面
 */
function gotoPage() {
  const page = Math.max(1, Math.min(pageInput.value, props.totalPages));
  pageInput.value = page;
  $emit('goto-page', page);
}
</script>

<style scoped>
.reader-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 30px;
  background-color: white;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.control-group {
  display: flex;
  gap: 10px;
}

.control-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.control-btn:hover:not(:disabled) {
  background-color: #f0f0f0;
  border-color: #ccc;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.chapter-info {
  font-size: 12px;
  color: #666;
}

.page-input {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-number {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.page-total {
  font-size: 14px;
  color: #666;
}

@media (max-width: 768px) {
  .reader-controls {
    padding: 10px 15px;
  }
  
  .control-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>