<script setup>
import BookShelf from "./components/BookShelf.vue";
</script>

<template>
  <div class="app">
    <BookShelf />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #f5f5f5;
  overflow: hidden; /* 防止滚动条 */
}

.app {
  height: 100vh;
  width: 100vw;
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: #1a1a1a;
    color: #fff;
  }
}
</style>
