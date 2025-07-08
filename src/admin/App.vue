<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
