<template>
  <div class="layout-container">
    <!-- 左侧导航栏 -->
    <nav :class="['sidebar', { collapsed: isCollapsed }]">
      <button class="toggle-btn" @click="toggleSidebar" aria-label="Toggle sidebar">
        <i class="fa" :class="isCollapsed ? 'fa-star' : 'fa-arrow-left'"></i>
      </button>
      <!-- <h1 class="title" v-if="!isCollapsed">导航栏</h1> -->
      <ul v-if="!isCollapsed">
        <li><RouterLink to="/">Home</RouterLink></li>
        <li><RouterLink to="/about">Vue Anki</RouterLink></li>
        <!-- 动态加载菜单项 -->
        <li v-for="link in links" :key="link.path">
          <RouterLink :to="link.path">{{ link.name }}</RouterLink>
        </li>
      </ul>
    </nav>

    <!-- 右侧主内容区域 -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script>
import { RouterLink, RouterView } from 'vue-router';

export default {
  name: "LayoutComponent",
  data() {
    return {
      isCollapsed: false,
      links: []
    };
  },
  async created() {
    try {
      this.links = await import('@/assets/links.json').then(module => module.default);
    } catch (error) {
      console.error('Failed to load links:', error);
    }
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
    }
  }
};
</script>

<style>
:root {
  --sidebar-bg: #2d3748;
  --sidebar-text: white;
  --sidebar-hover: #a0aec0;
}

html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.layout-container {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
  max-width: 100%;
  position: fixed;
  top: 0;
  left: 0;
}

.sidebar {
  width: 200px;
  background-color: var(--sidebar-bg);
  color: var(--sidebar-text);
  padding: 10px;
  box-sizing: border-box;
  transition: width 0.3s ease, padding 0.3s ease;
  flex-shrink: 0;
  position: relative;
}

.sidebar.collapsed {
  width: 60px;
  padding: 10px 5px;
}

.sidebar .title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar li {
  margin-bottom: 10px;
}

.sidebar a {
  color: var(--sidebar-text);
  text-decoration: none;
}

.sidebar a:hover {
  color: var(--sidebar-hover);
}

.main-content {
  flex: 1;
  background-color: #f7fafc;
  padding: 20px;
  overflow: auto;
  box-sizing: border-box;
  min-width: 0;
}

.main-content h2 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 20px;
}

img {
  max-width: 100%;
  max-height: 100%;
  display: block;
  margin: 0 auto;
}

.toggle-btn {
  background-color: var(--sidebar-bg);
  color: var(--sidebar-text);
  border: none;
  padding: 10px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  text-align: center;
  font-size: 16px;
  border-radius: 50%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s, transform 0.3s;
  position: absolute;
  top: 10px;
  right: -20px;
  z-index: 1;
}

.toggle-btn:hover {
  background-color: #4a5568;
  transform: translateY(-2px);
}

.toggle-btn:active {
  transform: translateY(1px);
}

.toggle-btn i {
  margin-right: 0;
}

@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }

  .sidebar.collapsed {
    width: 40px;
  }

  .toggle-btn {
    right: -15px;
  }
}
</style>