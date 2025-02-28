<template>
  <el-container style="height: 100vh;">
		<!-- 侧边栏收起/展开按钮 -->
		<div class="toggle-button" @click="toggleSidebar">
		  <el-icon v-if="isCollapsed"><Expand /></el-icon>
		  <el-icon v-else><Fold /></el-icon>
		</div>
    <!-- 侧边栏 -->
    <el-aside :width="isCollapsed ? '0px' : '200px'" class="aside">
      <el-menu :default-active="activeMenu" router :collapse="isCollapsed">
        <el-menu-item v-for="link in links" :key="link.path" :index="link.path">
          <el-icon v-if="link.icon">
            <component :is="iconMap[link.icon]"></component>
          </el-icon>
          <template #title>{{ link.name }}</template>
        </el-menu-item>
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
// import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { Expand, Fold , Document, House} from '@element-plus/icons-vue';
import axios from 'axios';

const links = ref([]);
const route = useRoute();
const activeMenu = ref(route.path);
const isCollapsed = ref(true);

// 创建一个 **图标映射表**
const iconMap = {
	House: House,
	Document: Document
};
// Object.keys(ElementPlusIconsVue).forEach((key) => {
//   iconMap[key] = ElementPlusIconsVue[key];
// });

// 监听路由变化，确保菜单高亮
watch(route, (newRoute) => {
  activeMenu.value = newRoute.path;
});

// 加载 JSON 菜单数据并更新路由
onMounted(async () => {
  try {
    //const response = await fetch('/links.json'); // ✅ 从 public 目录加载
    //const response = await axios.get('/api/article/list');
    const response = await axios.get('/links.json');

    links.value = await response.data;
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
  background-color: #2c3e50;
  color: white;
  min-height: 100vh;
  position: relative;
  transition: width 0.3s ease-in-out;
}

.toggle-button {
  position: fixed;
  background: #1f2d3d;
  color: white;
  padding: 12px;
  border-radius: 50%;
  cursor: pointer;
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
