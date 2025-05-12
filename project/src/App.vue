<template>
  <el-container>
    <!-- 侧边导航栏 -->
    <el-aside width="200px">
      <Sidebar />
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script>
import Sidebar from "./components/Siderbar.vue";

export default {
  name: "App",
  components: {
    Sidebar,
  },
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>
