<template>
  <el-container>
    <!-- 侧边栏 -->
   
    <el-aside :width="isCollapsed ? '40px' : '200px'" class="aside">
      <!-- 侧边栏收起/展开按钮 -->
      <div class="toggle-button" @click="toggleSidebar">
        <div  v-if="isCollapsed" class="toggle-button-expand">
          <el-icon  :size="20"><Expand /></el-icon>
        </div>
        <div  v-else="isCollapsed"class="toggle-button-fold">
          <el-icon :size="20"><Fold /></el-icon>
        </div>
      </div> 
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
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import * as userService from '@/api/modules/user.js'
import MenuItem from './components/MenuItem.vue';
const route = useRoute();
const activeMenu = ref(route.path);
const isCollapsed = ref(false);
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
.aside {
  background-color: inherit;
  color: white;
  min-height: 100vh;
  position: relative;
  transition: width 0.3s ease-in-out;
}

.toggle-button {
  cursor: pointer;
}

.toggle-button-expand {
  display: flex;
  justify-content: flex-end;
  background: unset;
  color: #0e0d0d;
  padding-bottom: 20px;
  padding-top: 20px;
  padding-left: 20px;
  transition: background 0.3s;
  z-index: 1000;
}

.toggle-button-fold {
  display: flex;
  justify-content: flex-end;
  background: unset;
  color: #0e0d0d;
  padding-bottom: 20px;
  padding-top: 20px;
  padding-right: 20px;
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
