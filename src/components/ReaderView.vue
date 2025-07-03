<template>
  <div class="reader-view" :class="{ 'dark-mode': isDarkMode }">
    <!-- 自定义顶部任务栏 -->
    <div class="custom-titlebar">
      <div class="titlebar-content">
        <!-- 操作按钮组 -->
        <div class="action-buttons">
          <button @click="goBack" class="back-btn">← 返回书架</button>
          <h1 class="book-title">{{ currentBook?.title || "未知书籍" }}</h1>
          <button @click="toggleSettings" class="settings-btn">⚙️</button>
        </div>
      </div>

      <!-- 窗口控制按钮 -->
      <div class="window-controls">
        <button
          @click="minimizeWindow"
          class="control-btn minimize-btn"
          title="最小化"
        >
          −
        </button>
        <button
          @click="toggleMaximize"
          class="control-btn maximize-btn"
          title="最大化/还原"
        >
          □
        </button>
        <button @click="closeWindow" class="control-btn close-btn" title="关闭">
          ×
        </button>
      </div>
    </div>
    <!-- 顶部标题栏 -->
    <div class="reader-header"></div>

    <!-- 阅读内容区域 -->
    <div class="reader-content" ref="contentArea">
      <ChapterContent
        :content="currentContent"
        :chapter-title="currentChapterTitle"
        :font-size="fontSize"
        :line-height="lineHeight"
        :font-family="fontFamily"
        :background-color="backgroundColor"
        :text-color="textColor"
      />
    </div>

    <!-- 底部控制栏 -->
    <ReaderControls
      :current-page="currentPage"
      :total-pages="totalPages"
      :current-chapter="currentChapter"
      :total-chapters="totalChapters"
      @prev-page="prevPage"
      @next-page="nextPage"
      @prev-chapter="prevChapter"
      @next-chapter="nextChapter"
      @goto-page="gotoPage"
    />

    <!-- 设置面板 -->
    <ReaderSettings
      v-if="showSettings"
      :font-size="fontSize"
      :line-height="lineHeight"
      :font-family="fontFamily"
      :background-color="backgroundColor"
      :text-color="textColor"
      :is-dark-mode="isDarkMode"
      @update-font-size="updateFontSize"
      @update-line-height="updateLineHeight"
      @update-font-family="updateFontFamily"
      @update-background="updateBackground"
      @update-text-color="updateTextColor"
      @toggle-dark-mode="toggleDarkMode"
      @close="showSettings = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import ChapterContent from "./ChapterContent.vue";
import ReaderControls from "./ReaderControls.vue";
import ReaderSettings from "./ReaderSettings.vue";

const route = useRoute();
const router = useRouter();

// 响应式数据
const currentBook = ref(null);
const bookContent = ref("");
const chapters = ref([]);
const currentChapter = ref(0);
const currentPage = ref(1);
const showSettings = ref(false);

// 获取当前窗口实例
const appWindow = getCurrentWindow();

// 阅读设置
const fontSize = ref(16);
const lineHeight = ref(1.8);
const fontFamily = ref("Microsoft YaHei");
const backgroundColor = ref("#ffffff");
const textColor = ref("#333333");
const isDarkMode = ref(false);

// 计算属性
const totalChapters = computed(() => chapters.value.length);
// 在script setup部分添加导入
import {
  calculateTotalPages,
  getPageContent,
  getDefaultOptions,
} from "../utils/pageCalculator.js";

// 修改totalPages计算属性
const totalPages = computed(() => {
  if (!currentChapterContent.value) return 1;

  // 获取页面计算选项
  const options = {
    ...getDefaultOptions(),
    fontSize: fontSize.value,
    lineHeight: lineHeight.value,
    // 这里可以根据实际容器尺寸动态获取
    pageWidth: 800,
    pageHeight: 600,
    padding: 40,
  };

  return calculateTotalPages(currentChapterContent.value, options);
});

const currentChapterTitle = computed(() => {
  return chapters.value[currentChapter.value]?.title || "第一章";
});

const currentChapterContent = computed(() => {
  return chapters.value[currentChapter.value]?.content || "";
});

const currentContent = computed(() => {
  if (!currentChapterContent.value) return "";

  // 获取页面计算选项
  const options = {
    ...getDefaultOptions(),
    fontSize: fontSize.value,
    lineHeight: lineHeight.value,
    // 这里可以根据实际容器尺寸动态获取
    pageWidth: 800,
    pageHeight: 600,
    padding: 40,
  };

  return getPageContent(
    currentChapterContent.value,
    currentPage.value,
    options
  );
});

/**
 * 加载书籍内容
 */
async function loadBook() {
  try {
    const bookId = route.params.bookId;
    if (!bookId) return;

    // 获取书籍信息
    const book = await invoke("get_book", { bookId });
    currentBook.value = book;

    // 读取文件内容
    const content = await invoke("read_book_content", {
      filePath: book.file_path,
    });
    bookContent.value = content;

    // 解析章节
    parseChapters(content);

    // 恢复阅读进度
    const progress = await invoke("get_reading_progress", { bookId });
    if (progress) {
      currentChapter.value = progress.chapter || 0;
      currentPage.value = progress.page || 1;
    }
  } catch (error) {
    console.error("加载书籍失败:", error);
  }
}

/**
 * 解析章节
 */
function parseChapters(content) {
  // 简单的章节分割逻辑，可根据实际需要优化
  const chapterRegex = /第[一二三四五六七八九十\d]+[章折]+[^\n]*/g;
  const matches = content.match(chapterRegex) || [];

  if (matches.length === 0) {
    // 如果没有找到章节标记，整本书作为一章
    chapters.value = [
      {
        title: "正文",
        content: content,
      },
    ];
    return;
  }

  const chapterList = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const startIndex = content.indexOf(match, lastIndex);
    const nextMatch = matches[index + 1];
    const endIndex = nextMatch
      ? content.indexOf(nextMatch, startIndex + 1)
      : content.length;

    chapterList.push({
      title: match.trim(),
      content: content.substring(startIndex, endIndex).trim(),
    });

    lastIndex = endIndex;
  });

  chapters.value = chapterList;
}

/**
 * 翻页控制
 */
function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  } else {
    prevChapter();
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  } else {
    nextChapter();
  }
}

function prevChapter() {
  if (currentChapter.value > 0) {
    currentChapter.value--;
    currentPage.value = 1;
    saveProgress();
  }
}

function nextChapter() {
  if (currentChapter.value < totalChapters.value - 1) {
    currentChapter.value++;
    currentPage.value = 1;
    saveProgress();
  }
}

function gotoPage(page) {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value));
}

/**
 * 保存阅读进度
 */
async function saveProgress() {
  try {
    await invoke("save_reading_progress", {
      bookId: currentBook.value.id,
      chapter: currentChapter.value,
      page: currentPage.value,
    });
  } catch (error) {
    console.error("保存进度失败:", error);
  }
}

/**
 * 设置相关方法
 */
function toggleSettings() {
  showSettings.value = !showSettings.value;
}

function updateFontSize(size) {
  fontSize.value = size;
}

function updateLineHeight(height) {
  lineHeight.value = height;
}

function updateFontFamily(family) {
  fontFamily.value = family;
}

function updateBackground(color) {
  backgroundColor.value = color;
}

function updateTextColor(color) {
  textColor.value = color;
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  if (isDarkMode.value) {
    backgroundColor.value = "#1a1a1a";
    textColor.value = "#e0e0e0";
  } else {
    backgroundColor.value = "#ffffff";
    textColor.value = "#333333";
  }
}

/**
 * 返回书架
 */
function goBack() {
  saveProgress();
  router.push("/");
}

// 键盘事件处理
function handleKeyPress(event) {
  switch (event.key) {
    case "ArrowLeft":
      prevPage();
      break;
    case "ArrowRight":
      nextPage();
      break;
    case "ArrowUp":
      prevChapter();
      break;
    case "ArrowDown":
      nextChapter();
      break;
  }
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
onMounted(() => {
  loadBook();
  document.addEventListener("keydown", handleKeyPress);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyPress);
  saveProgress();
});
</script>

<style scoped>
.reader-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
  transition: all 0.3s ease;
}

.reader-view.dark-mode {
  background-color: #1a1a1a;
}

.reader-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark-mode .reader-header {
  background-color: #2d2d2d;
  border-bottom-color: #444;
}

.back-btn,
.settings-btn {
  padding: 8px 16px;
  border: none;
  background-color: #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.back-btn:hover,
.settings-btn:hover {
  background-color: #e0e0e0;
}

.dark-mode .back-btn,
.dark-mode .settings-btn {
  background-color: #404040;
  color: #e0e0e0;
}

.dark-mode .back-btn:hover,
.dark-mode .settings-btn:hover {
  background-color: #505050;
}

.book-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  text-align: center;
  flex: 1;
}

.dark-mode .book-title {
  color: #e0e0e0;
}

.reader-content {
  flex: 1;
  overflow: hidden;
}
</style>
