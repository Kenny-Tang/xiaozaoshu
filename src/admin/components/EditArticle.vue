<script lang="ts" setup>
import {ref, onMounted, reactive, watch, nextTick} from "vue";
import api from '@/api/index.js'
import type {UploadFile, UploadRawFile} from 'element-plus'

const props = defineProps<{
  articleId: string
  onSuccess: (data: string) => void
}>();

const fileList = ref([] as any[])
let columnList = ref<{ id: string; title: string }[]>([]); // 专栏列表

const form = reactive({
  id: null, // 文章 ID
  articleFile: null as UploadRawFile | null,
  title: '',
  path: '/articles/',
  url: '/articles/',
  icon: 'Document',
  displayOrder: 1, // 展示顺序
  component: 'MdViewer',
  summary: '',
  columnId: null// 默认专栏
})
onMounted(() => {
  nextTick(() => {
    api.blog.getColumnInfoList().then(res => {
      console.log('获取专栏列表', res)
      columnList.value = res.map(({ id, title }) => ({ id, title }));
      if (res.length > 0) {
        form.columnId = res[0].id // 使用映射后字段
      }
    }).catch(err => {
      console.error('获取专栏列表失败', err)
    })
    loadArticle(props.articleId);
  });
});

const loadArticle = async(articleId: string) => {
  if (!articleId) return;
  try {
    const article = await api.blog.getArticleById(props.articleId);
    console.log('获取文章信息', article);
    form.id = article.id || null;
    form.title = article.title;
    form.path = article.path;
    form.url = article.url;
    form.icon = article.icon;
    form.component = article.component;
    form.summary = article.summary;
    form.columnId = article.columnId || null; // 如果没有专栏则设置为 null
    form.displayOrder = article.displayOrder || 1; // 设置展示顺序
  } catch (error) {
    console.error('获取文章信息失败', error);
  }
}
// 监听待编辑blog的变更
watch(() => props.articleId, (newId, oldId) => {
  if (newId == oldId) {
    console.log('监听到文章 ID 未变更', newId, oldId);
  }
  loadArticle(newId)
})

// 阻止 el-upload 自动上传
function dummyRequest({ file, onSuccess }: { file: any; onSuccess: (msg: string) => void }) {
  setTimeout(() => onSuccess('ok'), 0);
}


function handleFileChange(file: UploadFile, fileListNew: UploadFile[]) {
  form.articleFile = file.raw ?? null;
  fileList.value = fileListNew
}


function handleRemove(file: UploadFile, fileListNew: UploadFile[]) {
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
  formData.append('columnId', form.columnId || '') // 如果没有专栏则添加空字符串
  formData.append('id', form.id || '') // 如果有 ID 则添加到表单数据中
  formData.append('displayOrder', form.displayOrder.toString())

  api.blog.postArticle(formData)
      .then(res => {
        console.log('提交成功', res);
        props.onSuccess && props.onSuccess('success');
      })
      .catch(err => {
        console.error('提交失败', err);
      });
}

</script>

<template>
  <el-form :model="form" label-width="auto" class="demo-form" style="width: 100%; min-width: 400px;">
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
    <el-form-item label="展示顺序" >
      <el-input v-model="form.displayOrder" />
    </el-form-item>
    <el-form-item label="概要" prop="summary">
      <el-input v-model="form.summary" type="textarea" :rows='5'/>
    </el-form-item>
    <el-form-item class="demo-form_submit">
      <el-button type="primary" @click="onSubmit">Create</el-button>
      <el-button @click="onSuccess('cancel')">Cancel</el-button>
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

