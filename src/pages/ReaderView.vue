<template>
  <div
    class="reader-view"
    :style="{
      '--bbc': theme.btnBgColor,
      '--bg': theme.backgroundColor,
      '--fc': theme.fontColor,
    }"
  >
    <!-- 自定义顶部任务栏 -->
    <div class="custom-titlebar">
      <!-- 操作按钮组 -->
      <div class="action-buttons">
        <button @click="goBack" class="control-btn">
          <span class="heroicons--chevron-left-solid"></span>
        </button>
        <!-- 添加目录按钮 -->
        <button @click="toggleToc" class="control-btn" title="目录">
          <span class="heroicons--list-bullet-20-solid" />
        </button>
        <!-- 新增朗读按钮 -->
        <button
          @click="toggleReading"
          class="control-btn"
          :title="playState === PLAY_STATE[0] ? '暂停朗读' : '开始朗读'"
        >
          <span
            :class="
              playState === PLAY_STATE[0]
                ? 'heroicons--pause-20-solid'
                : 'heroicons--play-20-solid'
            "
          />
        </button>
        <button @click="stopTts" class="control-btn" title="停止朗读">
          <span class="heroicons--stop-20-solid"></span>
        </button>
        <button @click="toggleSettings" class="control-btn">
          <span class="heroicons--cog-6-tooth-solid"></span>
        </button>
      </div>
      <h1 class="book-title">
        {{ currentBook?.title || "未知书籍" }}
      </h1>
      <!-- 窗口控制按钮 -->
      <div class="window-controls">
        <button
          @click="minimizeWindow"
          class="control-btn minimize-btn"
          title="最小化"
        >
          <span class="heroicons--minus-16-solid"></span>
        </button>
        <button
          @click="toggleMaximize"
          class="control-btn maximize-btn"
          title="最大化/还原"
        >
          <span class="heroicons--stop"></span>
        </button>
        <button @click="closeWindow" class="control-btn" title="关闭">
          <span class="heroicons--x-mark-16-solid"></span>
        </button>
      </div>
    </div>

    <!-- 阅读内容区域 -->
    <div class="reader-content foliate-viewer" ref="contentArea" animated></div>

    <!-- 设置面板 -->
    <ReaderSettings
      v-if="showSettings"
      :theme="theme"
      @update-theme="updateTheme"
      @close="showSettings = false"
    />

    <!-- 目录面板 -->
    <TableOfContents
      :is-visible="showToc"
      :theme="theme"
      @close="showToc = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import ReaderSettings from "../components/ReaderSettings.vue";
import TableOfContents from "../components/TableOfContents.vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import StyleUtil from "../utils/styleUtil.js";
import Tts from "../utils/tts.js";
import BookData from "../utils/book";
import { open } from "../libs/reader.js";

const route = useRoute();
const router = useRouter();

// 响应式数据
const currentBook = ref(null);
const showSettings = ref(false);
const contentArea = ref(null);
const theme = ref(StyleUtil.getStyle());
const PLAY_STATE = ["SPEAKING", "PAUSED", "STOPPED"];
const playState = ref(PLAY_STATE[2]);
// 获取当前窗口实例
const appWindow = getCurrentWindow();

// 朗读相关
function toggleReading() {
  if (playState.value === PLAY_STATE[1]) {
    console.log("play");
    Tts.resumeSpeak();
    playState.value = PLAY_STATE[0];
  } else if (playState.value === PLAY_STATE[0]) {
    console.log("pause");
    Tts.pause();
    playState.value = PLAY_STATE[1];
  } else {
    console.log("play");
    Tts.init(window.ttsHere, window.ttsNext, window.ttsPrev);
    Tts.speak();
    playState.value = PLAY_STATE[0];
  }
}

function stopTts() {
  Tts.stop();
  playState.value = PLAY_STATE[2];
}

// 添加目录显示状态
const showToc = ref(false);

/**
 * 切换目录显示
 */
function toggleToc() {
  showToc.value = !showToc.value;
}

/**
 * 设置相关方法 - 修改为保存到全局设置
 */
function toggleSettings() {
  showSettings.value = !showSettings.value;
}

function updateTheme(newTheme) {
  theme.value = newTheme;
  StyleUtil.setStyle(newTheme);
  window.setStyle(theme.value);
}

/**
 * 加载书籍（修改后的版本）
 */
async function loadBook() {
  try {
    const bookId = route.params.bookId;
    const book = BookData.getBookById(bookId);
    currentBook.value = book;
    if (currentBook.value.file_path)
      open(currentBook.value, theme.value).catch((e) => console.error(e));
  } catch (error) {
    console.error("加载书籍失败:", error);
  }
}

/**
 * 返回书架
 */
function goBack() {
  router.push("/");
}

/**
 * 最小化窗口
 */
async function minimizeWindow() {
  try {
    await appWindow.minimize();
  } catch (error) {
    console.error("最小化窗口失败:", error);
  }
}

/**
 * 最大化/还原窗口
 */
async function toggleMaximize() {
  try {
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
  } catch (error) {
    console.error("切换窗口状态失败:", error);
  }
}

/**
 * 关闭窗口
 */
async function closeWindow() {
  try {
    await appWindow.close();
  } catch (error) {
    console.error("关闭窗口失败:", error);
  }
}

// 生命周期
onMounted(async () => {
  await loadBook();
});

// 在组件卸载
onUnmounted(() => {});
</script>

<style scoped>
.custom-titlebar {
  margin-top: 10px;
}

.reader-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg);
  color: var(--fc);
  transition: all 0.3s ease;
}

.control-btn {
  background-color: var(--bbc);
  color: var(--fc);
}

.progress {
  font-size: 12px;
  color: var(--fc);
  position: absolute;
  bottom: 6px;
  left: 20px;
}

.book-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--fc);
  margin: 0;
  text-align: center;
  line-height: 40px;
  flex: 1;
}

.reader-content {
  flex: 1;
  overflow: hidden;
  transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
}

/* 翻页动画效果 */
.reader-content::v-deep(foliate-paginator) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 页面切换时的淡入淡出效果 */
.reader-content::v-deep(foliate-paginator[flow="scrolled"]) {
  transition: scroll-position 0.3s ease-in-out;
}

/* 触摸翻页时的平滑效果 */
.reader-content::v-deep(.foliate-view) {
  transition: transform 0.3s ease-out;
}

/* 翻页时的阴影效果 */
.reader-content::v-deep(foliate-paginator)::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  transition: box-shadow 0.3s ease-in-out;
  z-index: 10;
}

.reader-content::v-deep(foliate-paginator):hover::before {
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1);
}
</style>
