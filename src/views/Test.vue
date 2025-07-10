<script setup lang="ts">

const resp = {
  status: 200,
  data: {
    list: [1,2,3],
    pageInfo: {
      page: 1,
      pageSize: 10,
    }
  }
}
 const {data: {list,pageInfo: {pageSize}}} = resp;
console.log(list);
console.log(pageSize)

</script>

<template>
  <div>
    <h1>Test Page</h1>
    <p>This is a test page to demonstrate Vue.js functionality.</p>
    <p>Here you can add your test components or logic.</p>
  </div>
</template>

<style scoped>

</style>