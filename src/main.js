import { createApp } from "vue";
import App from "./App.vue";
import { createRouter, createWebHistory } from "vue-router";

// 导入组件
import BookShelf from "./components/BookShelf.vue";
import ReaderView from "./components/ReaderView.vue";

// 定义路由
const routes = [
  { path: "/", component: BookShelf },
  { path: "/reader/:bookId", component: ReaderView, props: true },
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App).use(router).mount("#app");
