<template>
  <div class="common-layout">
    <el-container class="top-container">
      <el-header class="custom-header">
        <!-- 侧边栏收起/展开按钮 -->
        <div class="toggle-button" @click="toggleSidebar">
          <div  v-if="isCollapsed"><el-icon :size="20"><Expand /></el-icon></div>
          <div  v-else="isCollapsed"><el-icon :size="20"><Fold /></el-icon></div>
        </div>
      </el-header>
      <el-container>
        <!-- 侧边栏 -->
        <el-aside :width="isCollapsed ? '0px' : '200px'" class="aside">

          <!-- 菜单 -->
          <el-menu :default-active="activeMenu" router :collapse="isCollapsed">
            <MenuItem v-for="item in menuData" :key="item.path" :menu="item" />
          </el-menu>
        </el-aside>
        <el-container>
          <el-main>
            <router-view></router-view>
          </el-main>
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import {Expand, Fold} from '@element-plus/icons-vue';
import * as userService from '@/api/modules/user.js'
import MenuItem from './components/MenuItem.vue';
import {loadDynamicRoutes} from "@/router/index.js";
const route = useRoute();
const activeMenu = ref(route.path);
const isCollapsed = ref(true);
// 模拟菜单数据（支持无限嵌套）
const menuData = ref([]);
// 监听路由变化，确保菜单高亮
watch(route, (newRoute) => {
  activeMenu.value = newRoute.path;
});

// 加载 JSON 菜单数据并更新路由
onMounted(async () => {
  try {
    const respMenu = await userService.getLinks();
    menuData.value = respMenu;
    await loadDynamicRoutes(respMenu)
  } catch (error) {
    console.error('Failed to load links:', error);
  }
});

// 切换侧边栏状态
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<style scoped>
.custom-header {
  padding: 0 !important;
}
.aside {
  background-color: transparent;
  min-height: 100vh;
  position: relative;
  transition: width 0.3s ease-in-out;
}

.toggle-button {
  cursor: pointer;
  display: flex;
  width: 180px;
  background: unset;
  color: #0e0d0d;
  padding-bottom: 15px;
  padding-top: 15px;
  padding-left: 20px;
  transition: background 0.3s;
  z-index: 1000;
}

.toggle-button:hover {
  background: #409eff;
}

.toggle-button el-icon {
  font-size: 24px;
}
</style>
