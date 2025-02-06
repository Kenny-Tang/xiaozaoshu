<template>
  <div class="flex flex-row h-screen">
    <!-- 左侧导航栏 -->
    <nav class="w-64 bg-gray-800 text-white p-4 flex-shrink-0">
      <h1 class="text-2xl font-bold mb-4">导航栏</h1>
      <ul>
        <li class="mb-2"><a href="#" class="hover:text-gray-400">首页</a></li>
        <li class="mb-2"><a href="#" class="hover:text-gray-400">关于我们</a></li>
        <li class="mb-2"><a href="#" class="hover:text-gray-400">服务</a></li>
        <li class="mb-2"><a href="#" class="hover:text-gray-400">联系我们</a></li>
      </ul>
    </nav>

    <!-- 右侧主内容区域 -->
    <main class="flex-1 bg-gray-100 p-6 overflow-auto">
      <h2 class="text-3xl font-semibold mb-4">主内容区域</h2>
      <p>这里是主内容区域，可以根据需要添加更多内容。</p>
    </main>
  </div>
</template>

<script>
export default {
  name: "LayoutComponent",
};
</script>

<style scoped>
nav {
  min-width: 200px;
}
</style>
