// main.js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import {
  ElContainer,
  ElAside,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElSubMenu,
  ElIcon,
  ElCard,
  ElRow,
  ElCol,
  ElTable,
  ElTableColumn,
  ElRadioGroup,
  ElRadioButton,
  ElMessage,
} from "element-plus";
import "element-plus/dist/index.css";

const app = createApp(App);

// 按需注册所有使用的组件
app
  .use(ElContainer)
  .use(ElAside)
  .use(ElMain)
  .use(ElMenu)
  .use(ElMenuItem)
  .use(ElSubMenu)
  .use(ElIcon)
  .use(ElCard)
  .use(ElRow)
  .use(ElCol)
  .use(ElTable)
  .use(ElTableColumn)
  .use(ElRadioGroup)
  .use(ElRadioButton);

app.use(router);
app.mount("#app");
