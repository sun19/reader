<template>
  <div
    class="custom-titlebar"
    :style="{
      '--bbc': theme.btnBgColor,
      '--bg': theme.backgroundColor,
      '--fc': theme.fontColor,
    }"
  >
    <slot></slot>
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
</template>

<script setup>
import { ref } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import StyleUtil from "../utils/styleUtil.js";

// 获取当前窗口实例
const appWindow = getCurrentWindow();
const theme = ref(StyleUtil.getStyle());
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
</script>

<style scoped>
.custom-titlebar {
  margin-top: 10px;
}

.control-btn {
  background-color: var(--bbc);
  color: var(--fc);
}
</style>
