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
        <!-- 在线TTS配置 -->
        <div class="setting-item">
          <label>语音引擎</label>
          <div class="tts-engine-options">
            <button
              @click="setTtsEngine(false)"
              class="tts-engine-btn"
              :style="{
                borderColor: !currentData.useOnlineTts
                  ? currentTheme.btnBgColor
                  : 'transparent',
                color: !currentData.useOnlineTts ? currentTheme.fontColor : '',
              }"
            >
              本地TTS
            </button>
            <button
              @click="setTtsEngine(true)"
              class="tts-engine-btn"
              :style="{
                borderColor: currentData.useOnlineTts
                  ? currentTheme.btnBgColor
                  : 'transparent',
                color: currentData.useOnlineTts ? currentTheme.fontColor : '',
              }"
            >
              在线TTS
            </button>
          </div>
        </div>

        <!-- 在线TTS配置选择 -->
        <div v-if="currentData.useOnlineTts" class="setting-item">
          <label>在线TTS服务</label>
          <div class="online-tts-config">
            <select
              :value="currentData.onlineTtsConfig?.id || ''"
              @change="selectOnlineTtsConfig($event.target.value)"
              class="font-select"
            >
              <option value="">请选择在线TTS服务</option>
              <option
                v-for="config in onlineTtsConfigs"
                :key="config.id"
                :value="config.id"
              >
                {{ config.name }}
              </option>
            </select>
            <button @click="showImportConfig" class="import-btn">
              导入配置
            </button>
            <button
              v-if="currentData.onlineTtsConfig"
              @click="removeCurrentConfig"
              class="remove-btn"
            >
              删除配置
            </button>
          </div>
        </div>

        <!-- 在线TTS语速 -->
        <div v-if="currentData.useOnlineTts" class="setting-item">
          <label>语速</label>
          <input
            type="range"
            :value="currentData.speakSpeed"
            min="0"
            max="10"
            step="1"
            class="range-input"
            @input="handleOnlineTtsSpeedChange($event.target.value)"
          />
          <span class="range-value">{{ currentData.speakSpeed }}</span>
        </div>

        <!-- 本地TTS语音选择 -->
        <div v-if="!currentData.useOnlineTts" class="setting-item">
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

        <!-- 本地TTS语速 -->
        <div v-if="!currentData.useOnlineTts" class="setting-item">
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
        <!-- 翻页动画 -->
        <div class="setting-item">
          <label>翻页动画</label>
          <div class="animation-options">
            <button
              v-for="animation in animations"
              @click="setPageAnimation(animation.value)"
              class="animation-btn"
              :style="{
                borderColor:
                  currentTheme.pageAnimation == animation.value
                    ? theme.btnBgColor
                    : 'transparent',
                color:
                  currentTheme.pageAnimation == animation.value
                    ? theme.fontColor
                    : '',
              }"
            >
              {{ animation.label }}
            </button>
          </div>
        </div>
        <!-- 在设置面板的HTML结构中添加 -->
        <div class="setting-item">
          <label class="setting-label">正则表达式高亮</label>
          <div class="setting-control">
            <button
              class="control-btn"
              :class="{ active: regexSettings.enabled }"
              @click="toggleRegexHighlight"
            >
              {{ regexSettings.enabled ? "已启用" : "已禁用" }}
            </button>
          </div>
        </div>
        <div class="setting-item" v-if="regexSettings.enabled">
          <label class="setting-label">正则表达式</label>
          <div class="setting-control">
            <input
              type="text"
              v-model="regexSettings.pattern"
              placeholder="输入正则表达式"
              class="regex-input"
              @input="updateRegexSettings"
            />
          </div>
        </div>

        <div class="setting-item" v-if="regexSettings.enabled">
          <label class="setting-label">高亮颜色</label>
          <div class="setting-control">
            <input
              type="color"
              v-model="regexSettings.highlightColor"
              class="color-input"
              @input="updateRegexSettings"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 导入配置对话框 -->
    <div
      v-if="showImportDialog"
      class="import-dialog-overlay"
      @click="showImportDialog = false"
    >
      <div class="import-dialog" @click.stop>
        <div class="import-dialog-header">
          <h3>导入在线TTS配置</h3>
          <button @click="showImportDialog = false" class="close-btn">×</button>
        </div>
        <div class="import-dialog-content">
          <textarea
            v-model="importConfigText"
            placeholder="请粘贴JSON配置..."
            class="config-textarea"
          ></textarea>
          <div class="import-dialog-actions">
            <button @click="showImportDialog = false" class="cancel-btn">
              取消
            </button>
            <button @click="importConfig" class="confirm-btn">导入</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 在script setup部分添加
import { computed, ref, onMounted } from "vue";
import StyleUtil from "../utils/styleUtil";
import Theme from "../utils/theme";
import Tts from "../utils/tts.js";
import TtsData from "../utils/ttsData.js";

// 添加在线TTS配置
const onlineTtsConfigs = ref([]);
const showImportDialog = ref(false);
const importConfigText = ref("");

// 在onMounted中加载在线TTS配置
onMounted(() => {
  onlineTtsConfigs.value = TtsData.getOnlineTtsConfigs();
  // 加载正则表达式设置
  regexSettings.value = RegexSettings.getSettings();
});

// 添加TTS引擎切换方法
function setTtsEngine(useOnline) {
  currentData.value.useOnlineTts = useOnline;
  if (!useOnline) {
    currentData.value.onlineTtsConfig = null;
  }
  TtsData.setTtsData(currentData.value);
}

// 添加在线TTS配置选择方法
function selectOnlineTtsConfig(configId) {
  const config = onlineTtsConfigs.value.find((c) => c.id == configId);
  currentData.value.onlineTtsConfig = config;
  TtsData.setTtsData(currentData.value);
}

// 添加在线TTS语速控制方法
function handleOnlineTtsSpeedChange(value) {
  currentData.value.speakSpeed = parseInt(value);
  TtsData.setTtsData(currentData.value);
}

// 显示导入配置对话框
function showImportConfig() {
  importConfigText.value = "";
  showImportDialog.value = true;
}

// 导入配置
function importConfig() {
  try {
    const config = JSON.parse(importConfigText.value);

    if (config.id && config.name && config.url) {
      TtsData.importOnlineTtsConfig(config);
      onlineTtsConfigs.value = TtsData.getOnlineTtsConfigs();
      showImportDialog.value = false;
    } else {
      alert("配置格式不正确，请确保包含id、name和url字段");
    }
  } catch (error) {
    alert("配置格式错误，请检查JSON格式");
  }
}

// 删除当前配置
function removeCurrentConfig() {
  if (currentData.value.onlineTtsConfig) {
    if (confirm("确定要删除当前配置吗？")) {
      TtsData.removeOnlineTtsConfig(currentData.value.onlineTtsConfig.id);
      onlineTtsConfigs.value = TtsData.getOnlineTtsConfigs();
      currentData.value.onlineTtsConfig = null;
      TtsData.setTtsData(currentData.value);
    }
  }
}

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

// 新增翻页动画选项
const animations = ref([
  {
    label: "无动画",
    value: "none",
  },
  {
    label: "平移",
    value: "translate",
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

/**
 * 翻页动画设置
 */
function setPageAnimation(animation) {
  currentTheme.value.pageAnimation = animation;
  emit("update-theme", currentTheme.value);
}

import RegexSettings from "../utils/regexSettings.js";

// 添加正则表达式设置状态
const regexSettings = ref(RegexSettings.getSettings());

// 添加正则表达式相关方法
const toggleRegexHighlight = () => {
  regexSettings.value.enabled = !regexSettings.value.enabled;
  updateRegexSettings();
};

const updateRegexSettings = () => {
  RegexSettings.updateSettings(regexSettings.value);
  // 通知阅读器重新应用高亮
  if (globalThis.reader) {
    globalThis.reader.applyRegexHighlight();
  }
};
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
  width: 700px;
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

.animation-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.animation-btn {
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

.animation-btn:hover {
  transform: translateY(-2px);
}

/* 在线TTS相关样式 */
.tts-engine-options {
  display: flex;
  gap: 10px;
}

.tts-engine-btn {
  padding: 8px 16px;
  border: 2px solid var(--fc);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  color: var(--fc);
}

.tts-engine-btn:hover {
  transform: translateY(-1px);
}

.online-tts-config {
  display: flex;
  gap: 10px;
  align-items: center;
}

.import-btn,
.remove-btn {
  padding: 8px 12px;
  border: 1px solid var(--fc);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  background-color: var(--bbc);
  color: var(--fc);
  width: 100px;
}

.import-btn:hover,
.remove-btn:hover {
  opacity: 0.8;
}

.remove-btn {
  background-color: #ff4444;
  border-color: #ff4444;
}

.import-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.import-dialog {
  background-color: var(--bg);
  border-radius: 8px;
  width: 500px;
  max-width: 90vw;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.import-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--fc);
}

.import-dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.import-dialog-content {
  padding: 20px;
}

.config-textarea {
  width: 100%;
  height: 200px;
  padding: 12px;
  border: 1px solid var(--fc);
  border-radius: 6px;
  background-color: var(--bg);
  color: var(--fc);
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
}

.import-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.cancel-btn,
.confirm-btn {
  padding: 8px 16px;
  border: 1px solid var(--fc);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn {
  background-color: transparent;
  color: var(--fc);
}

.confirm-btn {
  background-color: var(--bbc);
  color: var(--fc);
}

.cancel-btn:hover,
.confirm-btn:hover {
  opacity: 0.8;
}

.regex-input {
  width: 100%;
  height: 40px;
  padding: 6px 8px;
  border: 1px solid var(--fc);
  border-radius: 4px;
  background-color: var(--bg);
  color: var(--fc);
  font-size: 14px;
}

.color-input {
  width: 50px;
  height: 32px;
  border: 1px solid var(--fc);
  border-radius: 4px;
  background-color: var(--bg);
  cursor: pointer;
}
</style>
