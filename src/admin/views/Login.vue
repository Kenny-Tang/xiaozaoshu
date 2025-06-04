<script setup>
import { useRouter } from 'vue-router'
import {ref, onMounted, reactive} from "vue";
import api from '@/api/index.js'

const fileList = reactive([]) // 上传文件列表
let columnList = ref([]) // 专栏列表

// do not use same name with ref
const form = reactive({
  articleFile: null,
  title: '',
  path: '/articles/',
  url: '/articles/',
  icon: 'Document',
  component: 'MdViewer',
  summary: '',
  columnId: null// 默认专栏
})

onMounted(() => {
  api.blog.getColumnInfoList().then(res => {
    console.log('获取专栏列表', res)
    columnList.value = res.map(
      item => ({
        id: item.id,
        title: item.title
      })
    )
    if (res.length > 0) {
      form.columnId = res[0].columnId // 默认选择第一个专栏
    }
  }).catch(err => {
    console.error('获取专栏列表失败', err)
  })
})

// 阻止 el-upload 自动上传
function dummyRequest({ file, onSuccess }) {
  setTimeout(() => onSuccess('ok'), 0)
}

function handleFileChange(file, fileListNew) {
  form.articleFile = file.raw
  fileList.value = fileListNew
}


function handleRemove(file, fileListNew) {
  form.articleFile = null
  fileList.value = fileListNew
}

function resetForm() {
  form.title = ''
  form.path = '/articles/'
  form.url = '/articles/'
  form.icon = 'Document'
  form.component = 'MdViewer'
  form.summary = ''
  form.articleFile = null
  fileList.value = []
}


// 提交表单
function onSubmit() {
  if (!form.articleFile) {
    alert("请上传文章文件")
    return
  }

  const formData = new FormData()
  formData.append('articleFile', form.articleFile)
  formData.append('title', form.title)
  formData.append('path', form.path)
  formData.append('url', form.url)
  formData.append('icon', form.icon)
  formData.append('component', form.component)
  formData.append('summary', form.summary)
  formData.append('columnId', form.columnId)

  api.blog.postArticle(formData)
      .then(res => {
        console.log('提交成功', res)
        resetForm()
      })
      .catch(err => {
        console.error('提交失败', err)
      })
}

const router = useRouter()
function goDashboard() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="login-page">
    <h2>登录后台</h2>
    <button @click="goDashboard">登录</button>
  </div>
  <el-form :model="form" label-width="auto" class="demo-form" style="width: 80%">
    <el-form-item label="上传文章文件">
      <el-upload
          ref="uploadRef"
          :file-list="fileList"
          :limit="1"
          :auto-upload="false"
          :http-request="dummyRequest"
          :on-change="handleFileChange"
          :on-remove="handleRemove"
          accept=".md,.txt,.pdf"
      >
        <el-button type="primary">选择文件</el-button>
<!--        <template #tip>-->
<!--          <div class="el-upload__tip">只能上传 1 个文件</div>-->
<!--        </template>-->
      </el-upload>
    </el-form-item>
    <el-form-item label="所属专栏">
      <el-select v-model="form.columnId" placeholder="请选择文章专栏">
        <el-option v-for="item in columnList" :label="item.title" :value="item.id" />
      </el-select>
    </el-form-item>
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
      <el-input v-model="form.summary" type="textarea" :rows='5'/>
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

