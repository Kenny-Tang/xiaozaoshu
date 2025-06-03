<script lang="ts" setup>
import { reactive } from 'vue'

// do not use same name with ref
const form = reactive({
  title: '',
  region: '',
  path: '/articles/',
  url: '/articles/',
  delivery: false,
  icon: 'Document',
  component: 'MdViewer',
  summary: '',
})

const onSubmit = () => {
  console.log('submit!')
}
</script>

<template>
  <el-form :model="form" label-width="auto" class="demo-form" style="width: 80%">
    <el-form-item label="文章标题" >
      <el-input v-model="form.title" />
    </el-form-item>
    <el-form-item label="文章访问路径">
      <el-input v-model="form.path" />
    </el-form-item>
    <el-form-item label="文章下载地址">
      <el-input v-model="form.url" />
    </el-form-item>
    <el-form-item label="显示使用图标">
      <el-select v-model="form.icon" placeholder="请选择文章连接图标">
        <el-option label="普通文档" value="Document" />
        <el-option label="Home图标" value="House" />
      </el-select>
    </el-form-item>
    <el-form-item label="显示预览组件">
      <el-select v-model="form.component" placeholder="请选择展示组件">
        <el-option label="Markdown预览" value="MdViewer" />
        <el-option label="PDF预览" value="PdfViewer" />
      </el-select>
    </el-form-item>
    <el-form-item label="概要" prop="summary">
      <el-input v-model="form.summary" type="textarea" rows="5"/>
    </el-form-item>
    <el-form-item class="demo-form_submit">
      <el-button type="primary" @click="onSubmit">Create</el-button>
      <el-button>Cancel</el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.demo-form {
  max-width: 600px;
  margin: 0 auto;
  width: 80%;
}
.demo-form_submit ::v-deep(.el-form-item__content) {
  display: flex;
  justify-content: center;
}
</style>
