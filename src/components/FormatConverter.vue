<template>
  <!-- 弹窗遮罩 -->
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>格式转换工具</h3>
        <button @click="closeModal" class="close-btn">×</button>
      </div>

      <div class="modal-body">
        <!-- 转换选项 -->
        <div class="conversion-options">
          <div
            class="option-card"
            :class="{ active: conversionType === 'epub-to-txt' }"
            @click="setConversionType('epub-to-txt')"
          >
            <div class="option-icon">📖</div>
            <div class="option-text">
              <h4>EPUB → TXT</h4>
              <p>将EPUB格式转换为TXT文本</p>
            </div>
          </div>

          <div
            class="option-card"
            :class="{ active: conversionType === 'txt-to-epub' }"
            @click="setConversionType('txt-to-epub')"
          >
            <div class="option-icon">📄</div>
            <div class="option-text">
              <h4>TXT → EPUB</h4>
              <p>将TXT文本转换为EPUB格式</p>
            </div>
          </div>
        </div>

        <!-- 文件选择区域 -->
        <div class="file-selection">
          <div
            class="file-input-area"
            @click="selectFile"
            :class="{ 'has-file': selectedFile }"
          >
            <div v-if="!selectedFile" class="file-placeholder">
              <div class="upload-icon">📁</div>
              <p>
                点击选择{{
                  conversionType === "epub-to-txt" ? "EPUB" : "TXT"
                }}文件
              </p>
            </div>
            <div v-else class="file-info">
              <div class="file-icon">📄</div>
              <div class="file-details">
                <p class="file-name">{{ selectedFile.name }}</p>
                <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- TXT转EPUB时的额外选项 -->
        <div v-if="conversionType === 'txt-to-epub'" class="epub-options">
          <div class="form-group">
            <label>书籍标题：</label>
            <input
              v-model="bookTitle"
              type="text"
              placeholder="请输入书籍标题"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>作者：</label>
            <input
              v-model="bookAuthor"
              type="text"
              placeholder="请输入作者名称"
              class="form-input"
            />
          </div>
        </div>

        <!-- 转换进度 -->
        <div v-if="isConverting" class="conversion-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <p class="progress-text">{{ progressText }}</p>
        </div>

        <!-- 转换结果 -->
        <div v-if="conversionResult" class="conversion-result">
          <div class="result-success">
            <div class="success-icon">✅</div>
            <p>转换完成！文件已保存到：</p>
            <p class="result-path">{{ conversionResult.outputPath }}</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary">取消</button>
        <button
          @click="startConversion"
          :disabled="!selectedFile || isConverting"
          class="btn btn-primary"
        >
          {{ isConverting ? "转换中..." : "开始转换" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { open, save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import JSZip from "jszip";
import Convert from "../utils/convert";

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["close"]);

// 响应式数据
const isVisible = computed(() => props.visible);
const conversionType = ref("epub-to-txt");
const selectedFile = ref(null);
const isConverting = ref(false);
const progress = ref(0);
const progressText = ref("");
const conversionResult = ref(null);
const bookTitle = ref("");
const bookAuthor = ref("");

/**
 * 设置转换类型
 */
function setConversionType(type) {
  conversionType.value = type;
  selectedFile.value = null;
  conversionResult.value = null;
}

/**
 * 选择文件
 */
async function selectFile() {
  try {
    const extensions =
      conversionType.value === "epub-to-txt" ? ["epub"] : ["txt"];
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: conversionType.value === "epub-to-txt" ? "EPUB文件" : "TXT文件",
          extensions,
        },
      ],
    });

    if (selected) {
      // 获取文件信息
      const fileName = selected.split("\\").pop() || selected.split("/").pop();

      // 通过Tauri后端获取文件大小
      let fileSize = 0;
      try {
        const fileBytes = await invoke("read_file_bytes", {
          filePath: selected,
        });
        fileSize = fileBytes.length;
      } catch (error) {
        console.warn("无法获取文件大小:", error);
      }

      selectedFile.value = {
        path: selected,
        name: fileName,
        size: fileSize,
      };

      // 如果是TXT转EPUB，自动填充书籍标题
      if (conversionType.value === "txt-to-epub") {
        bookTitle.value = fileName.replace(/\.[^/.]+$/, "");
      }

      conversionResult.value = null;
    }
  } catch (error) {
    console.error("选择文件失败:", error);
    alert("选择文件失败: " + error.message);
  }
}

/**
 * 开始转换
 */
async function startConversion() {
  if (!selectedFile.value) return;

  isConverting.value = true;
  progress.value = 0;
  conversionResult.value = null;

  try {
    if (conversionType.value === "epub-to-txt") {
      await convertEpubToTxt();
    } else {
      await convertTxtToEpub();
    }
  } catch (error) {
    console.error("转换失败:", error);
    alert("转换失败: " + error.message);
  } finally {
    isConverting.value = false;
  }
}

/**
 * EPUB转TXT
 */
async function convertEpubToTxt() {
  progressText.value = "正在读取EPUB文件...";
  progress.value = 20;

  try {
    // 通过Tauri后端读取EPUB文件
    const fileBytes = await invoke("read_file_bytes", {
      filePath: selectedFile.value.path,
    });

    progressText.value = "正在解析EPUB内容...";
    progress.value = 40;

    // 使用JSZip解析EPUB文件
    const zip = new JSZip();
    const epubZip = await zip.loadAsync(new Uint8Array(fileBytes));

    // 查找OPF文件
    const containerXml = await epubZip
      .file("META-INF/container.xml")
      .async("text");
    const opfPath = extractOpfPath(containerXml);

    if (!opfPath) {
      throw new Error("无法找到OPF文件");
    }

    progressText.value = "正在提取文本内容...";
    progress.value = 60;

    // 读取OPF文件获取章节列表
    const opfContent = await epubZip.file(opfPath).async("text");
    const chapterFiles = extractChapterFiles(opfContent, opfPath);

    // 提取所有章节的文本内容
    let txtContent = "";
    for (const chapterFile of chapterFiles) {
      try {
        const chapterContent = await epubZip.file(chapterFile).async("text");
        const textContent = extractTextFromHtml(chapterContent);
        txtContent += textContent + "\n\n";
      } catch (error) {
        console.warn(`无法读取章节文件 ${chapterFile}:`, error);
      }
    }

    progressText.value = "正在保存TXT文件...";
    progress.value = 80;

    // 选择保存位置
    const outputPath = await save({
      filters: [
        {
          name: "TXT文件",
          extensions: ["txt"],
        },
      ],
      defaultPath: selectedFile.value.name.replace(/\.epub$/i, ".txt"),
    });

    if (outputPath) {
      // 将内容写入文件（通过创建Blob和下载）
      await saveTextFile(outputPath, txtContent);

      progress.value = 100;
      progressText.value = "转换完成！";

      conversionResult.value = {
        outputPath,
      };
    }
  } catch (error) {
    throw new Error(`EPUB转换失败: ${error.message}`);
  }
}

/**
 * TXT转EPUB
 */
async function convertTxtToEpub() {
  progressText.value = "正在读取TXT文件...";
  progress.value = 20;

  try {
    // 通过Tauri后端读取TXT文件
    const fileBytes = await invoke("read_file_bytes", {
      filePath: selectedFile.value.path,
    });

    progressText.value = "正在检测文件编码...";
    progress.value = 30;

    // 检测文件编码
    const detectedEncoding = Convert.detectEncoding(fileBytes);

    // 使用检测到的编码解码文本
    const txtContent = Convert.decodeText(fileBytes, detectedEncoding);

    progressText.value = "正在生成EPUB结构...";
    progress.value = 50;

    // 将TXT内容转换为HTML并分章节
    const chapters = Convert.splitTextIntoChapters(txtContent);

    // 创建EPUB结构
    const zip = new JSZip();

    // 添加mimetype文件
    zip.file("mimetype", "application/epub+zip");

    // 添加META-INF/container.xml
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    zip.folder("META-INF").file("container.xml", containerXml);

    // 创建OEBPS文件夹
    const oebps = zip.folder("OEBPS");

    // 添加content.opf（传入章节信息）
    const contentOpf = Convert.generateContentOpf(
      bookTitle.value || "未知标题",
      bookAuthor.value || "未知作者",
      chapters
    );
    oebps.file("content.opf", contentOpf);

    // 添加toc.ncx（传入章节信息）
    const tocNcx = Convert.generateTocNcx(
      bookTitle.value || "未知标题",
      chapters
    );
    oebps.file("toc.ncx", tocNcx);

    progressText.value = "正在生成章节文件...";
    progress.value = 70;

    // 为每个章节创建HTML文件
    chapters.forEach((chapter, index) => {
      const chapterHtml = Convert.generateChapterHtml(
        chapter.title,
        chapter.content
      );
      oebps.file(`chapter${index + 1}.xhtml`, chapterHtml);
    });

    progressText.value = "正在创建EPUB文件...";
    progress.value = 90;

    // 生成EPUB文件
    const epubBlob = await zip.generateAsync({ type: "blob" });

    // 选择保存位置
    const outputPath = await save({
      filters: [
        {
          name: "EPUB文件",
          extensions: ["epub"],
        },
      ],
      defaultPath: selectedFile.value.name.replace(/\.txt$/i, ".epub"),
    });

    if (outputPath) {
      // 保存EPUB文件
      await saveBinaryFile(outputPath, epubBlob);

      progress.value = 100;
      progressText.value = "转换完成！";

      conversionResult.value = {
        outputPath,
      };
    }
  } catch (error) {
    throw new Error(`TXT转换失败: ${error.message}`);
  }
}

/**
 * 从container.xml中提取OPF文件路径
 */
function extractOpfPath(containerXml) {
  const match = containerXml.match(/full-path="([^"]+)"/);
  return match ? match[1] : null;
}

/**
 * 从OPF文件中提取章节文件列表
 */
function extractChapterFiles(opfContent, opfPath) {
  const basePath = opfPath.substring(0, opfPath.lastIndexOf("/") + 1);
  const files = [];

  // 简单的正则匹配，实际项目中应该使用XML解析器
  const manifestMatches = opfContent.matchAll(
    /<item[^>]+href="([^"]+\.x?html?)"[^>]*>/g
  );
  for (const match of manifestMatches) {
    files.push(basePath + match[1]);
  }

  return files;
}

/**
 * 从HTML中提取纯文本
 */
function extractTextFromHtml(html) {
  // 移除HTML标签，保留文本内容
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 保存文本文件
 */
async function saveTextFile(filePath, content) {
  // 创建Blob并触发下载
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filePath.split("\\").pop() || filePath.split("/").pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 保存二进制文件
 */
async function saveBinaryFile(filePath, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filePath.split("\\").pop() || filePath.split("/").pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 关闭弹窗
 */
function closeModal() {
  emit("close");
  // 重置状态
  selectedFile.value = null;
  isConverting.value = false;
  progress.value = 0;
  conversionResult.value = null;
  bookTitle.value = "";
  bookAuthor.value = "";
}
</script>

<style scoped>
.modal-overlay {
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

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.conversion-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.option-card {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-card:hover {
  border-color: #007bff;
}

.option-card.active {
  border-color: #007bff;
  background-color: #f8f9ff;
}

.option-icon {
  font-size: 24px;
}

.option-text h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.option-text p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.file-selection {
  margin-bottom: 24px;
}

.file-input-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.file-input-area:hover {
  border-color: #007bff;
  background-color: #f8f9ff;
}

.file-input-area.has-file {
  border-style: solid;
  border-color: #28a745;
  background-color: #f8fff9;
}

.file-placeholder .upload-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.file-placeholder p {
  margin: 0;
  color: #666;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.file-icon {
  font-size: 24px;
}

.file-name {
  margin: 0 0 4px 0;
  font-weight: 500;
  color: #333;
}

.file-size {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.epub-options {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
}

.conversion-progress {
  margin-bottom: 24px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s;
}

.progress-text {
  margin: 0;
  font-size: 14px;
  color: #666;
  text-align: center;
}

.conversion-result {
  margin-bottom: 24px;
}

.result-success {
  padding: 16px;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  text-align: center;
}

.success-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.result-success p {
  margin: 4px 0;
  color: #155724;
}

.result-path {
  font-family: monospace;
  font-size: 12px;
  background-color: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}
</style>
