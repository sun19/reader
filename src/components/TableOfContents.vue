<template>
  <div class="toc-overlay" v-show="isVisible" @click="$emit('close')">
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
            <span class="chapter-title">{{ chapter.title }}</span>
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
    default: false
  },
  chapters: {
    type: Array,
    default: () => []
  },
  currentChapter: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['close', 'goto-chapter']);

/**
 * 跳转到指定章节
 */
function gotoChapter(chapterIndex) {
  emit('goto-chapter', chapterIndex);
  emit('close');
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
  background-color: white;
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
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.toc-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #e9ecef;
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

.chapter-item:hover {
  background-color: #f8f9fa;
}

.chapter-item.active {
  background-color: #e3f2fd;
  border-left-color: #2196f3;
}

.chapter-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: #e9ecef;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-right: 12px;
  flex-shrink: 0;
}

.chapter-item.active .chapter-number {
  background-color: #2196f3;
  color: white;
}

.chapter-title {
  flex: 1;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-item.active .chapter-title {
  color: #1976d2;
  font-weight: 500;
}

/* 暗色模式 */
.dark-mode .toc-panel {
  background-color: #2d2d2d;
  color: #e0e0e0;
}

.dark-mode .toc-header {
  background-color: #1a1a1a;
  border-bottom-color: #444;
}

.dark-mode .toc-header h3 {
  color: #e0e0e0;
}

.dark-mode .close-btn {
  color: #ccc;
}

.dark-mode .close-btn:hover {
  background-color: #404040;
}

.dark-mode .chapter-item:hover {
  background-color: #404040;
}

.dark-mode .chapter-item.active {
  background-color: #1e3a5f;
}

.dark-mode .chapter-number {
  background-color: #404040;
  color: #ccc;
}

.dark-mode .chapter-item.active .chapter-number {
  background-color: #2196f3;
  color: white;
}

.dark-mode .chapter-title {
  color: #e0e0e0;
}

.dark-mode .chapter-item.active .chapter-title {
  color: #64b5f6;
}

/* 滚动条样式 */
.toc-content::-webkit-scrollbar {
  width: 6px;
}

.toc-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.toc-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.toc-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.dark-mode .toc-content::-webkit-scrollbar-track {
  background: #404040;
}

.dark-mode .toc-content::-webkit-scrollbar-thumb {
  background: #666;
}

.dark-mode .toc-content::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>