<template>
  <div>
    <Toolbar
        style="border-bottom: 1px solid #ccc"
        :editor="editorRef"
        :default-config="toolbarConfig"
        :mode="mode"
    />
    <Editor
        v-model="html"
        :default-config="editorConfig"
        :mode="mode"
        @onCreated="handleCreated"
    />
  </div>
</template>

<script setup>
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { ref, onBeforeUnmount } from 'vue'

const editorRef = ref(null)
const html = ref('<p>请输入内容</p>')

const mode = 'default' // 或 'simple'

// 工具栏配置（默认即可，已包含常用项，如表格、标题、颜色、图片等）
const toolbarConfig = {}

// 编辑器配置
const editorConfig = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      server: '/api/upload', // 修改为你的上传接口
      fieldName: 'file',
      customInsert(res, insertFn) {
        // 示例：res.url 是你后端返回的图片地址
        insertFn(res.url)
      },
    },
  },
}

// 创建回调
function handleCreated(editor) {
  editorRef.value = editor
}

// 卸载清理
onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.destroy()
  }
})
</script>
