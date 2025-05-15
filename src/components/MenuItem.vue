<template>
  <!-- 有子菜单时，使用 el-sub-menu -->
  <el-sub-menu v-if="menu.children && menu.children.length" :index="menu.path">
    <template #title>
      <el-icon v-if="menu.icon">
        <component :is="icons[menu.icon]" />
      </el-icon>
      <span>{{ menu.title }}</span>
    </template>
    <MenuItem v-for="child in menu.children" :key="child.path" :menu="child" />
  </el-sub-menu>

  <!-- 无子菜单时，使用 el-menu-item -->
  <el-menu-item v-else :index="menu.path">
    <el-icon v-if="menu.icon">
      <component :is="icons[menu.icon]" />
    </el-icon>
    <span>{{ menu.title }}</span>
  </el-menu-item>
</template>

<script setup>
import { defineProps } from "vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue"; // 引入所有 Element Plus 图标

defineProps({
  menu: Object,
});

// 存储图标
const icons = ElementPlusIconsVue;
</script>
