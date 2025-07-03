<template>
  <div class="reader-view" :class="{ 'dark-mode': isDarkMode }">
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
    <div class="reader-content" ref="contentArea">
      <ChapterContent
        :content="currentContent"
        :chapter-title="currentChapterTitle"
        :font-size="fontSize"
        :line-height="lineHeight"
        :font-family="fontFamily"
        :background-color="backgroundColor"
        :text-color="textColor"
        :paragraph-spacing="paragraphSpacing"
      />
      <div class="progress">{{ currentPage }}/{{ totalPages }}</div>
    </div>

    <!-- 底部控制栏 -->
    <ReaderControls
      :current-page="currentPage"
      :total-pages="totalPages"
      :current-chapter="currentChapter"
      :total-chapters="totalChapters"
      @prev-chapter="prevChapter"
      @next-chapter="nextChapter"
      @goto-page="gotoPage"
      @goto-progress="handleProgressChange"
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
      :paragraph-spacing="paragraphSpacing"
      @update-font-size="updateFontSize"
      @update-line-height="updateLineHeight"
      @update-font-family="updateFontFamily"
      @update-background="updateBackground"
      @update-text-color="updateTextColor"
      @toggle-dark-mode="toggleDarkMode"
      @update-paragraph-spacing="updateParagraphSpacing"
      @close="showSettings = false"
    />

    <!-- 目录面板 -->
    <TableOfContents
      :is-visible="showToc"
      :chapters="chapters"
      :current-chapter="currentChapter"
      @close="showToc = false"
      @goto-chapter="gotoChapter"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import ChapterContent from "./ChapterContent.vue";
import ReaderControls from "./ReaderControls.vue";
import ReaderSettings from "./ReaderSettings.vue";
// 导入设置管理工具
import { loadSettings, saveSettings } from "../utils/settingsManager.js";
// 导入页面计算工具
import {
  calculateTotalPages,
  getPageContent,
  getDefaultOptions,
} from "../utils/pageCalculator.js";
import { Icon } from "@iconify/vue";
import TableOfContents from "./TableOfContents.vue";

const route = useRoute();
const router = useRouter();

// 响应式数据
const currentBook = ref(null);
const bookContent = ref("");
const chapters = ref([]);
const currentChapter = ref(0);
const currentPage = ref(1);
const showSettings = ref(false);
const contentArea = ref(null);

// 获取当前窗口实例
const appWindow = getCurrentWindow();

// 阅读设置 - 从全局设置加载
const settings = ref(loadSettings());
const fontSize = computed(() => settings.value.fontSize);
const lineHeight = computed(() => settings.value.lineHeight);
const fontFamily = computed(() => settings.value.fontFamily);
const backgroundColor = computed(() => settings.value.backgroundColor);
const textColor = computed(() => settings.value.textColor);
const paragraphSpacing = computed(() => settings.value.paragraphSpacing);
const isDarkMode = computed(() => settings.value.isDarkMode);

// 容器尺寸
const containerSize = ref({ width: 800, height: 600 });

// 计算属性
const totalChapters = computed(() => chapters.value.length);

// 修改totalPages计算属性
const totalPages = computed(() => {
  if (!currentChapterContent.value) return 1;

  // 获取页面计算选项 - 使用保存的设置和动态容器尺寸
  const options = {
    ...getDefaultOptions(),
    fontSize: fontSize.value,
    lineHeight: lineHeight.value,
    paragraphSpacing: paragraphSpacing.value,
    pageWidth: containerSize.value.width,
    pageHeight: containerSize.value.height,
    padding: 20,
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

  // 获取页面计算选项 - 使用保存的设置和动态容器尺寸
  const options = {
    ...getDefaultOptions(),
    fontSize: fontSize.value,
    lineHeight: lineHeight.value,
    paragraphSpacing: paragraphSpacing.value,
    pageWidth: containerSize.value.width,
    pageHeight: containerSize.value.height,
    padding: 20,
  };

  return getPageContent(
    currentChapterContent.value,
    currentPage.value,
    options
  );
});

/**
 * 获取容器实际尺寸
 */
function updateContainerSize() {
  if (contentArea.value) {
    const rect = contentArea.value.getBoundingClientRect();
    containerSize.value = {
      width: rect.width || 800,
      height: rect.height || 600,
    };
  }
}

/**
 * 切换目录显示
 */
function toggleToc() {
  showToc.value = !showToc.value;
}

/**
 * 跳转到指定章节
 */
function gotoChapter(chapterIndex) {
  currentChapter.value = chapterIndex;
  currentPage.value = 1;
  saveProgress();
}

/**
 * 设置相关方法 - 修改为保存到全局设置
 */
function toggleSettings() {
  showSettings.value = !showSettings.value;
}
function updateFontSize(size) {
  settings.value.fontSize = size;
  saveSettings(settings.value);
}

function updateParagraphSpacing(size) {
  settings.value.paragraphSpacing = size;
  saveSettings(settings.value);
}

function updateLineHeight(height) {
  settings.value.lineHeight = height;
  saveSettings(settings.value);
}

function updateFontFamily(family) {
  settings.value.fontFamily = family;
  saveSettings(settings.value);
}

function updateBackground(color) {
  settings.value.backgroundColor = color;
  saveSettings(settings.value);
}

function updateTextColor(color) {
  settings.value.textColor = color;
  saveSettings(settings.value);
}

function toggleDarkMode() {
  settings.value.isDarkMode = !settings.value.isDarkMode;
  if (settings.value.isDarkMode) {
    settings.value.backgroundColor = "#1a1a1a";
    settings.value.textColor = "#e0e0e0";
  } else {
    settings.value.backgroundColor = "#ffffff";
    settings.value.textColor = "#333333";
  }
  saveSettings(settings.value);
}

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
    saveProgress();
  } else {
    prevChapter();
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    saveProgress();
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
 * 返回书架
 */
function goBack() {
  saveProgress();
  router.push("/");
}

// 添加目录显示状态
const showToc = ref(false);

// 键盘事件处理 - 添加目录快捷键
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
    case "t":
    case "T":
      // 按T键打开/关闭目录
      toggleToc();
      break;
    case "Escape":
      // ESC键关闭目录和设置
      showToc.value = false;
      showSettings.value = false;
      break;
  }
}
// 鼠标滚轮事件
function handleWheel(event) {
  // 向上滚动
  if (event.deltaY < 0) {
    prevPage();
  } else {
    nextPage();
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

// 窗口大小变化监听
function handleResize() {
  updateContainerSize();
}

/**
 * 处理进度条跳转
 */
function handleProgressChange(data) {
  if (!data.preview) {
    // 正式跳转
    currentChapter.value = data.chapter;
    currentPage.value = data.page;
    saveProgress();
  }
  // 预览模式可以在这里添加预览逻辑
}

// 生命周期
onMounted(async () => {
  await loadBook();
  document.addEventListener("keydown", handleKeyPress);
  window.addEventListener("resize", handleResize);
  // 监听鼠标滚轮事件
  window.addEventListener("wheel", handleWheel);

  // 等待DOM渲染完成后获取容器尺寸
  await nextTick();
  updateContainerSize();
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyPress);
  window.removeEventListener("resize", handleResize);
  // 监听鼠标滚轮事件
  window.removeEventListener("wheel", handleWheel);
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
  padding: 10px 20px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress {
  font-size: 12px;
  color: #888;
  position: absolute;
  bottom: 6px;
  left: 20px;
}
.dark-mode .reader-header {
  background-color: #2d2d2d;
  border-bottom-color: #444;
}
.toc-btn,
.back-btn,
.settings-btn {
  padding: 6px 10px;
  border: none;
  background-color: #bababa;
  cursor: pointer;
  font-size: 12px;
  margin-right: 10px;
  display: flex;
  border-radius: 6px;
  align-items: center;
  justify-content: center;
  -webkit-app-region: no-drag;
}

.book-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin: 0;
  text-align: center;
  line-height: 40px;
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
