<script lang="ts" setup>
import { useRouter } from 'vue-router'
import EditArticle from "@/admin/components/EditArticle.vue";

const onSuccess = (data: string) => {
  console.log('onSuccess', data === 'success')
  if (data === 'success') {
    goDashboard();
  }
}
const router = useRouter()
function goDashboard() {
  router.push('/dashboard')
}
</script>

<template>
  <EditArticle :onSuccess="onSuccess"/>
</template>

<style scoped>

</style>

