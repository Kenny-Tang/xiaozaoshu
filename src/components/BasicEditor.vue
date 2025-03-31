<template>
    <div>
      <!-- Toolbar -->
      <div ref="toolbarRef" class="toolbar-container"></div>
  
      <!-- Editor -->
      <div ref="editorRef" class="editor-container"></div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, onBeforeUnmount } from 'vue'
  import { createEditor, createToolbar } from '@wangeditor/editor'  // 引入编辑器和工具栏
  import '@wangeditor/editor/dist/css/style.css' // 引入编辑器的样式
  
  export default {
  setup() {
    const editorRef = ref(null) // 编辑器容器的引用
    const toolbarRef = ref(null) // 工具栏容器的引用
    let editor = null // 编辑器实例
    let toolbar = null // 工具栏实例

    onMounted(() => {
      // 初始化编辑器
      editor = createEditor({
        selector: editorRef.value,  // 将编辑器绑定到这个容器
        mode: 'default',  // 编辑器模式
        config: {
          placeholder: '请输入内容...', // 编辑器的占位符
          onChange(editor) {
            console.log(editor.getHtml()) // 获取编辑器内容
          },
        },
      })

      // 初始化工具栏
      toolbar = createToolbar({
        selector: toolbarRef.value,  // 将工具栏绑定到这个容器
        editor,  // 将编辑器与工具栏连接
        config: {
          toolbar: [
            'bold', 'italic', 'underline', '|',  // 工具栏按钮配置
            'head', 'font', 'align', '|',
            'link', 'image', 'list', 'table', '|',
            'undo', 'redo',
          ],
        },
      })
    })

    onBeforeUnmount(() => {
      if (editor) {
        editor.destroy()  // 清理编辑器实例
      }
      if (toolbar) {
        toolbar.destroy()  // 清理工具栏实例
      }
    })

    return {
      editorRef,
      toolbarRef,
    }
  },
}

  </script>
  
  <style scoped>
  /* 编辑器和工具栏的样式 */
  .editor-container {
    border: 1px solid #ccc;
    min-height: 300px;
    padding: 10px;
  }
  
  .toolbar-container {
    margin-bottom: 10px;
  }
  </style>
  