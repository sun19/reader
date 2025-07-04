<template>
  <div class="foliate-reader" ref="readerContainer">
    <!-- 添加加载状态显示 -->
    <div v-if="isLoading" class="loading-indicator">
      正在加载书籍...
    </div>
    <!-- foliate-view 将通过 JavaScript 动态创建 -->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { invoke } from "@tauri-apps/api/core";
// 导入 foliate-js
import "../lib/foliate-js/view.js";

/**
 * 组件属性定义
 */
const props = defineProps({
  bookFile: {
    type: [File, String],
    required: true,
  },
  theme: {
    type: Object,
    default: () => ({}),
  },
  currentLocation: {
    type: String,
    default: "",
  },
});

/**
 * 组件事件定义
 */
const emit = defineEmits([
  "location-changed",
  "book-loaded",
  "book-error",
  "progress-changed",
]);

// 组件引用
const readerContainer = ref(null);
const foliateView = ref(null);

// 当前书籍对象
const currentBook = ref(null);

// 添加加载状态
const isLoading = ref(false);

/**
 * 组件挂载时初始化 foliate-view
 */
onMounted(async () => {
  try {
    // 等待 DOM 完全准备
    await nextTick();
    
    // 确保容器存在
    if (!readerContainer.value) {
      throw new Error("容器元素未找到");
    }
    
    // 创建 foliate-view 元素
    const view = document.createElement("foliate-view");
    
    // 设置基本样式
    view.style.width = "100%";
    view.style.height = "100%";
    view.style.display = "block";
    view.style.overflow = "hidden";
    
    readerContainer.value.appendChild(view);
    foliateView.value = view;
    
    console.log("foliate-view 元素创建成功:", view);

    // 等待元素完全挂载到 DOM
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 监听事件
    setupEventListeners(view);

    // 如果有书籍文件，延迟加载以确保 DOM 准备完成
    if (props.bookFile) {
      await new Promise(resolve => setTimeout(resolve, 200));
      await loadBook(props.bookFile);
    }
  } catch (error) {
    console.error("初始化 foliate-view 失败:", error);
    isLoading.value = false;
    emit("book-error", error);
  }
});

/**
 * 设置事件监听器
 */
function setupEventListeners(view) {
  // 监听位置变化事件
  view.addEventListener("relocate", onLocationChange);

  // 监听其他事件
  view.addEventListener("load", onBookLoaded);
  view.addEventListener("error", onBookError);
  
  // 添加更多事件监听
  view.addEventListener("ready", () => {
    console.log("foliate-view ready");
    isLoading.value = false;
  });
  
  view.addEventListener("book-loading", () => {
    console.log("book loading started");
    isLoading.value = true;
  });
  
  // 监听渲染相关事件
  view.addEventListener("render", () => {
    console.log("foliate-view render event");
  });
  
  view.addEventListener("rendered", () => {
    console.log("foliate-view rendered event");
    isLoading.value = false;
  });
}

/**
 * 加载书籍文件（改进版）
 */
async function loadBook(file) {
  try {
    if (!foliateView.value) {
      throw new Error("foliate-view 未初始化");
    }

    isLoading.value = true;
    let bookBlob;

    if (file instanceof File) {
      bookBlob = file;
    } else if (typeof file === "string") {
      console.log("正在读取文件:", file);
      const fileBytes = await invoke("read_file_bytes", { filePath: file });
      console.log("文件读取完成，大小:", fileBytes.length);

      const mimeType = getMimeType(file);
      console.log("文件类型:", mimeType);

      bookBlob = new Blob([new Uint8Array(fileBytes)], { type: mimeType });

      const fileName = file.split(/[\\\/]/).pop();
      Object.defineProperty(bookBlob, "name", {
        value: fileName,
        writable: false,
      });
      
      console.log("Blob 创建完成:", {
        size: bookBlob.size,
        type: bookBlob.type,
        name: bookBlob.name
      });
    } else {
      throw new Error("不支持的文件类型");
    }

    // 确保 foliate-view 完全准备好
    await waitForViewReady();
    
    console.log("正在打开书籍...");
    await foliateView.value.open(bookBlob);
    console.log("书籍打开成功");
    
    currentBook.value = foliateView.value.book;
    console.log("当前书籍对象:", currentBook.value);

    // 等待内容加载完成
    await waitForContentReady();
    
    // 应用当前主题
    applyTheme(props.theme);

    // 如果有保存的位置，跳转到该位置
    if (props.currentLocation) {
      await goToLocation(props.currentLocation);
    }
    
    isLoading.value = false;
    onBookLoaded();
  } catch (error) {
    console.error("加载书籍失败:", error);
    isLoading.value = false;
    emit("book-error", error);
  }
}

/**
 * 等待 foliate-view 准备就绪
 */
async function waitForViewReady() {
  return new Promise((resolve) => {
    if (foliateView.value && foliateView.value.isConnected) {
      resolve();
    } else {
      const checkReady = () => {
        if (foliateView.value && foliateView.value.isConnected) {
          resolve();
        } else {
          setTimeout(checkReady, 50);
        }
      };
      checkReady();
    }
  });
}

/**
 * 等待内容准备就绪
 */
async function waitForContentReady() {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 50; // 最多等待 2.5 秒
    
    const checkContent = () => {
      attempts++;
      
      // 检查是否有渲染器和内容
      if (foliateView.value?.renderer && currentBook.value) {
        console.log("内容准备就绪");
        resolve();
      } else if (attempts >= maxAttempts) {
        console.warn("等待内容超时，继续执行");
        resolve();
      } else {
        setTimeout(checkContent, 50);
      }
    };
    
    checkContent();
  });
}

/**
 * 根据文件扩展名获取 MIME 类型
 */
function getMimeType(filePath) {
  const extension = filePath.split(".").pop().toLowerCase();

  const mimeTypes = {
    epub: "application/epub+zip",
    mobi: "application/x-mobipocket-ebook",
    azw: "application/vnd.amazon.ebook",
    azw3: "application/vnd.amazon.ebook",
    fb2: "application/x-fictionbook+xml",
    cbz: "application/vnd.comicbook+zip",
    pdf: "application/pdf",
  };

  return mimeTypes[extension] || "application/octet-stream";
}

/**
 * 位置变化事件处理
 */
function onLocationChange(event) {
  const location = event.detail;
  emit("location-changed", location);

  // 计算阅读进度
  if (currentBook.value) {
    const progress = calculateProgress(location);
    emit("progress-changed", progress);
  }
}

/**
 * 书籍加载完成事件处理
 */
function onBookLoaded(event) {
  const bookInfo = {
    title: currentBook.value?.metadata?.title || "未知标题",
    author: currentBook.value?.metadata?.creator || "未知作者",
    toc: currentBook.value?.toc || [],
    sections: currentBook.value?.sections || [],
  };
  emit("book-loaded", bookInfo);
}

/**
 * 书籍加载错误事件处理
 */
function onBookError(event) {
  emit("book-error", event.detail);
}

/**
 * 应用主题设置（改进版）
 */
function applyTheme(theme) {
  if (!foliateView.value || !theme) return;

  try {
    // 等待渲染器准备好
    if (foliateView.value.renderer) {
      const style = {
        fontSize: `${theme.fontSize}px`,
        fontFamily: theme.fontFamily,
        lineHeight: theme.lineHeight,
        color: theme.fontColor,
        backgroundColor: theme.backgroundColor,
        margin: `${theme.margin}px`,
        "--paragraph-spacing": `${theme.paragraphSpacing}px`,
      };

      // 应用样式到 foliate-view
      Object.assign(foliateView.value.style, style);
      
      // 如果有渲染器，也应用到渲染器
      if (foliateView.value.renderer.setStyles) {
        foliateView.value.renderer.setStyles(style);
      }
    }
  } catch (error) {
    console.warn("应用主题失败:", error);
  }
}

/**
 * 跳转到指定位置
 */
async function goToLocation(location) {
  if (foliateView.value) {
    await foliateView.value.goTo(location);
  }
}

/**
 * 计算阅读进度
 */
function calculateProgress(location) {
  if (!currentBook.value || !location) return 0;

  // 这里需要根据 foliate-js 的 API 来计算进度
  // 具体实现取决于 location 对象的结构
  return 0;
}

/**
 * 获取当前位置
 */
function getCurrentLocation() {
  return foliateView.value?.location || null;
}

/**
 * 获取目录
 */
function getTableOfContents() {
  return currentBook.value?.toc || [];
}

/**
 * 搜索文本
 */
async function searchText(query) {
  if (!foliateView.value || !currentBook.value) return [];

  try {
    // 使用 foliate-js 的搜索功能
    const results = await foliateView.value.search(query);
    return results;
  } catch (error) {
    console.error("搜索失败:", error);
    return [];
  }
}

// 暴露方法和引用给父组件
defineExpose({
  loadBook,
  goToLocation,
  getCurrentLocation,
  getTableOfContents,
  searchText,
  foliateView,
});
</script>

<style scoped>
.foliate-reader {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  /* 确保容器有明确的尺寸 */
  min-height: 400px;
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  color: #666;
  z-index: 10;
}

/* 确保 foliate-view 正确显示 */
:deep(foliate-view) {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
  overflow: hidden !important;
  /* 确保有明确的尺寸 */
  min-height: 400px !important;
}

/* 确保内容区域可见 */
:deep(foliate-view iframe),
:deep(foliate-view webview) {
  width: 100% !important;
  height: 100% !important;
  border: none !important;
  background: white !important;
}
</style>
