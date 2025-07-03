<template>
  <div class="settings-overlay" @click="$emit('close')">
    <div class="settings-panel" @click.stop>
      <div class="settings-header">
        <h3>阅读设置</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>

      <div class="settings-content">
        <!-- 字体大小 -->
        <div class="setting-item">
          <label>字体大小</label>
          <div class="font-size-controls">
            <button @click="decreaseFontSize" class="size-btn">A-</button>
            <span class="size-value">{{ fontSize }}px</span>
            <button @click="increaseFontSize" class="size-btn">A+</button>
          </div>
        </div>

        <!-- 行间距 -->
        <div class="setting-item">
          <label>行间距</label>
          <input
            type="range"
            :value="lineHeight"
            @input="updateLineHeight($event.target.value)"
            min="1.2"
            max="3"
            step="0.1"
            class="range-input"
          />
          <span class="range-value">{{ lineHeight }}</span>
        </div>

        <!-- 段落间距 -->
        <div class="setting-item">
          <label>段落间距</label>
          <input
            type="range"
            :value="paragraphSpacing"
            @input="updateParagraphSpacing($event.target.value)"
            min="12"
            max="30"
            step="1"
            class="range-input"
          />
          <span class="range-value">{{ paragraphSpacing }}</span>
        </div>

        <!-- 字体选择 -->
        <div class="setting-item">
          <label>字体</label>
          <select
            :value="fontFamily"
            @change="updateFontFamily($event.target.value)"
            class="font-select"
          >
            <option value="Microsoft YaHei">微软雅黑</option>
            <option value="SimSun">宋体</option>
            <option value="KaiTi">楷体</option>
            <option value="SimHei">黑体</option>
          </select>
        </div>

        <!-- 主题选择 -->
        <div class="setting-item">
          <label>主题</label>
          <div class="theme-options">
            <button
              @click="setTheme('#ffffff', '#333333')"
              class="theme-btn light"
              :class="{ active: backgroundColor === '#ffffff' }"
            >
              日间
            </button>
            <button
              @click="setTheme('#f5f5dc', '#333333')"
              class="theme-btn sepia"
              :class="{ active: backgroundColor === '#f5f5dc' }"
            >
              护眼
            </button>
            <button
              @click="setTheme('#1a1a1a', '#e0e0e0')"
              class="theme-btn dark"
              :class="{ active: backgroundColor === '#1a1a1a' }"
            >
              夜间
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 组件属性
const props = defineProps({
  fontSize: Number,
  lineHeight: Number,
  fontFamily: String,
  backgroundColor: String,
  textColor: String,
  isDarkMode: Boolean,
  paragraphSpacing: Number,
});

// 组件事件
const emit = defineEmits([
  "update-font-size",
  "update-line-height",
  "update-font-family",
  "update-background",
  "update-text-color",
  "toggle-dark-mode",
  "update-paragraph-spacing",
  "close",
]);

/**
 * 字体大小控制
 */
function increaseFontSize() {
  const newSize = Math.min(props.fontSize + 2, 32);
  emit("update-font-size", newSize);
}

function decreaseFontSize() {
  const newSize = Math.max(props.fontSize - 2, 12);
  emit("update-font-size", newSize);
}

/**
 * 行间距更新
 */
function updateLineHeight(value) {
  emit("update-line-height", parseFloat(value));
}

/**
 * 字体更新
 */
function updateFontFamily(family) {
  emit("update-font-family", family);
}

/**
 * 主题设置
 */
function setTheme(bgColor, textColor) {
  emit("update-background", bgColor);
  emit("update-text-color", textColor);
}

/**
 * 段落间距更新
 */
function updateParagraphSpacing(value) {
  emit("update-paragraph-spacing", parseFloat(value));
}
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-panel {
  background-color: white;
  border-radius: 12px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.settings-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background-color: #f0f0f0;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background-color: #e0e0e0;
}

.settings-content {
  padding: 20px;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.font-size-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.size-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.size-btn:hover {
  background-color: #f0f0f0;
}

.size-value {
  min-width: 50px;
  text-align: center;
  font-weight: 500;
}

.range-input {
  width: 100%;
  margin-right: 10px;
}

.range-value {
  min-width: 40px;
  text-align: center;
  font-weight: 500;
}

.font-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.theme-options {
  display: flex;
  gap: 10px;
}

.theme-btn {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.theme-btn.light {
  background-color: #ffffff;
  color: #333333;
}

.theme-btn.sepia {
  background-color: #f5f5dc;
  color: #333333;
}

.theme-btn.dark {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

.theme-btn.active {
  border-color: #007bff;
}

.theme-btn:hover {
  transform: translateY(-2px);
}
</style>
