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
          <Icon icon="heroicons:home-20-solid" width="18" height="18" />
        </button>
        <!-- 添加目录按钮 -->
        <button @click="toggleToc" class="control-btn" title="目录">
          <Icon icon="heroicons:list-bullet-20-solid" width="18" height="18" />
        </button>
        <!-- 新增朗读按钮 -->
        <button
          @click="toggleReading"
          class="control-btn"
          :title="playState === PLAY_STATE[0] ? '暂停朗读' : '开始朗读'"
        >
          <Icon
            :icon="
              playState === PLAY_STATE[0]
                ? 'heroicons:pause-20-solid'
                : 'heroicons:play-20-solid'
            "
            width="18"
            height="18"
          />
        </button>
        <button @click="stopTts" class="control-btn" title="停止朗读">
          <Icon icon="heroicons:stop-20-solid" width="18" height="18" />
        </button>
        <button @click="toggleSettings" class="control-btn">
          <Icon icon="heroicons:cog-6-tooth-solid" width="18" height="18" />
        </button>
      </div>
      <h1 class="book-title">
        {{ currentBook?.title + currentChapterTitle || "未知书籍" }}
      </h1>
      <!-- 窗口控制按钮 -->
      <div class="window-controls">
        <button
          @click="minimizeWindow"
          class="control-btn minimize-btn"
          title="最小化"
        >
          <Icon icon="heroicons:minus-16-solid" width="18" height="18" />
        </button>
        <button
          @click="toggleMaximize"
          class="control-btn maximize-btn"
          title="最大化/还原"
        >
          <Icon icon="heroicons:stop" width="18" height="18" />
        </button>
        <button @click="closeWindow" class="control-btn close-btn" title="关闭">
          <Icon icon="heroicons:x-mark-16-solid" width="18" height="18" />
        </button>
      </div>
    </div>

    <!-- 阅读内容区域 -->
    <div class="reader-content foliate-viewer" ref="contentArea"></div>

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
import { invoke } from "@tauri-apps/api/core";
import ReaderSettings from "../components/ReaderSettings.vue";
import TableOfContents from "../components/TableOfContents.vue";
import { Icon } from "@iconify/vue";
import StyleUtil from "../utils/styleUtil.js";
import Tts from "../utils/tts.js";
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
const spendArr = ["慢", "", "1.0", "1.5", "2.0", "", "快"];

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
}

/**
 * 加载书籍（修改后的版本）
 */
async function loadBook() {
  try {
    const bookId = route.params.bookId;
    const book = await invoke("get_book", { bookId });
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
}
</style>
