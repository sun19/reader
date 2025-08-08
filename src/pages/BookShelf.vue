<template>
  <div
    class="bookshelf"
    :style="{
      '--bbc': theme.btnBgColor,
      '--bg': theme.backgroundColor,
      '--fc': theme.fontColor,
    }"
  >
    <!-- 自定义顶部任务栏 -->
    <div class="custom-titlebar">
      <div class="titlebar-content">
        <!-- 搜索框 -->
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索我的书库"
            class="search-input"
          />
          <i class="search-icon">🔍</i>
        </div>

        <!-- 操作按钮组 -->
        <div class="action-buttons">
          <button @click="showFormatConverter" class="format-btn control-btn">
            <div class="heroicons--arrow-path-solid"></div>
            <div>格式转换</div>
          </button>
          <button @click="addBookDirectly" class="add-btn control-btn">
            + 书籍
          </button>
        </div>
      </div>

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
        <button @click="closeWindow" class="control-btn close-btn" title="关闭">
          <span class="heroicons--x-mark-16-solid"></span>
        </button>
      </div>
    </div>

    <!-- 书籍网格容器 -->
    <div class="books-container">
      <!-- 书籍网格 -->
      <div class="books-grid" v-if="filteredBooks.length > 0">
        <BookCard
          v-for="book in filteredBooks"
          :key="book.id"
          :book="book"
          @click="openBook(book)"
          @remove="removeBook"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📚</div>
        <p class="empty-text">将 (epub,mobi) 文件</p>
        <p class="empty-text">拖到此处，或者添加本地书籍</p>
      </div>
    </div>

    <!-- 格式转换弹窗 -->
    <FormatConverter
      :visible="isFormatConverterVisible"
      @close="hideFormatConverter"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import BookCard from "../components/BookCard.vue";
import FormatConverter from "../components/FormatConverter.vue";
import { useRouter } from "vue-router";
import StyleUtil from "../utils/styleUtil";
import BookData from "../utils/book";

// 响应式数据
const books = ref([]);
const searchQuery = ref("");
const theme = ref(StyleUtil.getStyle());
const isFormatConverterVisible = ref(false);

// 获取当前窗口实例
const appWindow = getCurrentWindow();

// 计算属性 - 过滤书籍
const filteredBooks = computed(() => {
  if (!searchQuery.value) return books.value;
  return books.value.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

/**
 * 加载书库
 */
async function loadLibrary() {
  try {
    const libraryData = BookData.getBooks();
    books.value = libraryData || [];
  } catch (error) {
    console.error("加载书库失败:", error);
  }
}

/**
 * 直接添加书籍
 */
async function addBookDirectly() {
  try {
    // 直接打开文件选择对话框
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "电子书",
          extensions: ["epub", "mobi"],
        },
      ],
    });

    if (selected) {
      // 从文件路径提取书名
      const fileName = selected.split("\\").pop() || selected.split("/").pop();
      const bookTitle = fileName.replace(/\.[^/.]+$/, ""); // 去掉扩展名

      const bookData = {
        title: bookTitle,
        author: "未知作者",
        file_path: selected,
      };

      // 直接添加到书库
      const newBook = await invoke("get_book_info", { bookData });
      books.value.push(newBook);
      BookData.addBook(newBook);
    }
  } catch (error) {
    console.error("添加书籍失败:", error);
    alert("添加书籍失败: " + error);
  }
}

/**
 * 移除书籍
 */
async function removeBook(bookId) {
  try {
    BookData.removeBook(bookId);
    books.value = books.value.filter((book) => book.id !== bookId);
  } catch (error) {
    console.error("移除书籍失败:", error);
  }
}

/**
 * 打开书籍
 */
const router = useRouter();
function openBook(book) {
  try {
    // 导航到阅读页面，传递书籍ID
    router.push(`/reader/${book.id}`);
  } catch (error) {
    console.error("导航到阅读页面失败:", error);
  }
}

// 组件挂载时加载书库
onMounted(() => {
  loadLibrary();
});

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

/**
 * 显示格式转换弹窗
 */
function showFormatConverter() {
  isFormatConverterVisible.value = true;
}

/**
 * 隐藏格式转换弹窗
 */
function hideFormatConverter() {
  isFormatConverterVisible.value = false;
}
</script>

<style scoped>
.bookshelf {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg);
  color: var(--fc);
}

.bookshelf .control-btn {
  background-color: var(--bbc);
  color: var(--fc);
}

.custom-titlebar {
  margin-top: 10px;
}
/* 书籍容器 */
.books-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  margin: 4px 0;
  font-size: 14px;
}

.format-btn {
  background-color: var(--bbc);
  color: var(--fc);
  display: flex;
  align-items: center;
  line-height: 14px;
}

.format-btn .heroicons--arrow-path-solid {
  width: 14px;
  height: 14px;
  display: inline-block;
  margin-right: 4px;
}

.search-input {
  height: 30px;
  border-radius: 6px;
}
</style>
