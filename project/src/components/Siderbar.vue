<template>
  <el-menu
    router
    :default-active="$route.path"
    class="el-menu-vertical"
    background-color="#545c64"
    text-color="#fff"
    active-text-color="#ffd04b"
  >
    <el-menu-item index="/overview">
      <el-icon><School /></el-icon>
      <span>总览页面</span>
    </el-menu-item>
    <el-sub-menu index="/detail">
      <template #title>
        <el-icon><Notebook /></el-icon>
        <span>详情页面</span>
      </template>
      <el-menu-item index="/detail/buildingA">
        <el-icon><Location /></el-icon>
        <span>A栋教学楼</span>
      </el-menu-item>
      <el-menu-item index="/detail/buildingB">
        <el-icon><Location /></el-icon>
        <span>B栋教学楼</span>
      </el-menu-item>
      <el-menu-item index="/detail/buildingC">
        <el-icon><Location /></el-icon>
        <span>C栋教学楼</span>
      </el-menu-item>
      <el-menu-item index="/detail/buildingD">
        <el-icon><Location /></el-icon>
        <span>D栋教学楼</span>
      </el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script lang="ts" setup>
import { School, Location, Tools, Notebook } from "@element-plus/icons-vue";
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<style scoped>
.el-menu-vertical {
  position: fixed;
  height: 100vh;
  border-right: none;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 200px;
}
</style>
