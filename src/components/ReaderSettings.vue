<template>
  <div
    class="settings-overlay"
    :style="{
      '--bbc': currentTheme.btnBgColor,
      '--bg': currentTheme.backgroundColor,
      '--fc': currentTheme.fontColor,
    }"
    @click="$emit('close')"
  >
    <div class="settings-panel" @click.stop>
      <div class="settings-header">
        <h3>阅读设置</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>

      <div class="settings-content">
        <!-- 语速 -->
        <div class="setting-item">
          <label>语速</label>
          <input
            type="range"
            :value="currentData.ttsRate"
            min="0.5"
            max="3"
            step="0.1"
            class="range-input"
            @input="handleTtsRateChange($event.target.value)"
          />
          <span class="range-value">{{ currentData.ttsRate }}</span>
        </div>
        <!-- 语音 -->
        <div class="setting-item">
          <label>语音</label>
          <select
            :value="currentData.ttsVoiceIndex"
            @change="selectVoice($event.target.value)"
            class="font-select"
          >
            <option
              v-for="(voice, index) in Tts.getVoices()"
              :key="index"
              :value="index"
            >
              {{ voice.name }}
            </option>
          </select>
        </div>
        <!-- 分栏选择 -->
        <div class="setting-item">
          <label>分栏</label>
          <div class="theme-options">
            <button
              v-for="(column, index) in columns"
              @click="setColumn(index)"
              class="column-btn"
              :style="{
                borderColor:
                  currentTheme.maxColumnCount == column.columnCount
                    ? theme.btnBgColor
                    : 'transparent',
                color:
                  currentTheme.maxColumnCount == column.columnCount
                    ? theme.fontColor
                    : '',
              }"
            >
              <div>
                <span :class="column.class"></span>
              </div>
              {{ column.label }}
            </button>
          </div>
        </div>
        <!-- 字体大小 -->
        <div class="setting-item">
          <label>字体大小</label>
          <div class="font-size-controls">
            <button @click="decreaseFontSize" class="size-btn">A-</button>
            <span class="size-value">{{ currentTheme.fontSize }}px</span>
            <button @click="increaseFontSize" class="size-btn">A+</button>
          </div>
        </div>

        <!-- 行间距 -->
        <div class="setting-item">
          <label>行间距</label>
          <input
            type="range"
            :value="currentTheme.lineHeight"
            @input="updateLineHeight($event.target.value)"
            min="1.2"
            max="3"
            step="0.1"
            class="range-input"
          />
          <span class="range-value">{{ currentTheme.lineHeight }}</span>
        </div>

        <!-- 段落间距 -->
        <div class="setting-item">
          <label>段落间距</label>
          <input
            type="range"
            :value="currentTheme.paragraphSpacing"
            @input="updateParagraphSpacing($event.target.value)"
            min="0"
            max="2"
            step="0.1"
            class="range-input"
          />
          <span class="range-value">{{ currentTheme.paragraphSpacing }}</span>
        </div>

        <!-- 字体选择 -->
        <div class="setting-item">
          <label>字体</label>
          <select
            :value="currentTheme.fontFamily"
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
              v-for="(theme, index) in themes"
              @click="setTheme(index)"
              class="theme-btn"
              :style="{
                color: theme.fontColor,
                backgroundColor: theme.backgroundColor,
                borderColor: theme.btnBgColor,
              }"
            >
              {{ theme.label }}
              <span v-if="currentThemeIndex === index" class="checkmark"
                >✓</span
              >
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import StyleUtil from "../utils/styleUtil";
import Theme from "../utils/theme";
import Tts from "../utils/tts.js";
import TtsData from "../utils/ttsData.js";

// 组件属性
const props = defineProps({
  theme: Object,
});

// 组件事件
const emit = defineEmits(["update-theme", "close"]);

const themes = ref(Theme.getThemes());
const columns = ref([
  {
    label: "单栏",
    columnCount: 1,
    class: "material-symbols-light--list-alt-outline",
  },
  {
    label: "双栏",
    columnCount: 2,
    class: "material-symbols-light--two-pager-outline",
  },
]);

const currentThemeIndex = ref(StyleUtil.getThemeIndex());
const currentTheme = computed(() => props.theme);
const currentData = ref(TtsData.getTtsData());

/**
 * 字体大小控制
 */
function increaseFontSize() {
  const newSize = Math.min(currentTheme.value.fontSize + 2, 32);
  currentTheme.value.fontSize = newSize;
  emit("update-theme", currentTheme.value);
}

function decreaseFontSize() {
  const newSize = Math.max(currentTheme.value.fontSize - 2, 12);
  currentTheme.value.fontSize = newSize;
  emit("update-theme", currentTheme.value);
}

/**
 * 行间距更新
 */
function updateLineHeight(value) {
  currentTheme.value.lineHeight = parseFloat(value);
  emit("update-theme", currentTheme.value);
}

/**
 * 字体更新
 */
function updateFontFamily(family) {
  currentTheme.value.fontFamily = family;
  emit("update-theme", currentTheme.value);
}

/**
 * 主题设置
 */
function setTheme(index) {
  currentThemeIndex.value = index;
  const selectColor = Theme.getThemes()[index];
  currentTheme.value.backgroundColor = selectColor.backgroundColor;
  currentTheme.value.fontColor = selectColor.fontColor;
  currentTheme.value.btnBgColor = selectColor.btnBgColor;

  emit("update-theme", currentTheme.value);
}

/**
 * 列数设置
 */
function setColumn(index) {
  currentTheme.value.maxColumnCount = columns.value[index].columnCount;
  emit("update-theme", currentTheme.value);
}

/**
 * 段落间距更新
 */
function updateParagraphSpacing(value) {
  currentTheme.value.paragraphSpacing = parseFloat(value);
  emit("update-theme", currentTheme.value);
}

function selectVoice(index) {
  currentData.value.ttsVoiceIndex = index;
  const ttsData = {
    ttsVoiceIndex: index,
  };
  Tts.setUtterance(ttsData);
}

function handleTtsRateChange(value) {
  currentData.value.ttsRate = parseFloat(value);
  const ttsData = {
    ttsRate: parseFloat(value),
  };
  Tts.setUtterance(ttsData);
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
  color: var(--fc);
}

.settings-panel {
  background-color: var(--bg);
  border-radius: 12px;
  width: 600px;
  height: 80vh;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--fc);
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
  background-color: var(--bbc);
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-content {
  padding: 20px;
  height: calc(100% - 80px);
  overflow-y: auto;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--fc);
}

.font-size-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.size-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--fc);
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
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
  border: 1px solid var(--fc);
  border-radius: 6px;
  font-size: 14px;
}

.theme-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.theme-btn {
  width: 80px;
  padding: 6px;
  border: 2px solid var(--fc);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  text-align: center;
  transition: all 0.2s;
  position: relative;
}

.theme-btn:hover {
  transform: translateY(-2px);
}

.theme-icon {
  font-size: 20px;
}

.checkmark {
  position: absolute;
  top: 2px;
  left: 6px;
  font-size: 12px;
}

.column-btn {
  width: 80px;
  padding: 6px;
  border: 2px solid var(--fc);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  text-align: center;
  transition: all 0.2s;
  position: relative;
  color: var(--fc);
}
.column-btn:hover {
  transform: translateY(-2px);
}
</style>
