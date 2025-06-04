<script setup>

defineProps({
  msg: String,
  title: String,
})
</script>

<template>
  <div class="card">
    <div><strong>{{ title }}</strong></div>
    <div><hr></div>
    <div class="question" v-html="msg"></div>
  </div>

</template>

<style scoped>
.card {
  text-align: left;
	padding: 1vi;
}
</style>

