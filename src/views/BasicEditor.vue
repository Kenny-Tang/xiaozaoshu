<template>
  <div style="margin: 10px">
    <Editor id="tinydemo" v-model="fileStr" :init='init'></Editor>
  </div>
</template>

<script lang="ts" setup>
import {ref} from  'vue';
import tinymce from 'tinymce/tinymce'; //tinymce核心文件
import Editor from '@tinymce/tinymce-vue';
import 'tinymce/models/dom'; // 引入dom模块。从 Tinymce6，开始必须有此模块导入
import 'tinymce/skins/ui/oxide/skin.css'//样式
import 'tinymce/themes/silver'; //默认主题
import 'tinymce/icons/default'; //引入编辑器图标icon，不引入则不显示对应图标
import 'tinymce/models/dom'; // 引入dom模块。从 Tinymce6，开始必须有此模块导入
import 'tinymce/themes/silver'; //默认主题
import 'tinymce/icons/default'; //引入编辑器图标icon，不引入则不显示对应图标
import 'tinymce/plugins/advlist'; //高级列表
import 'tinymce/plugins/anchor'; //锚点
import 'tinymce/plugins/autolink'; //自动链接
import 'tinymce/plugins/autoresize'; //编辑器高度自适应,注：plugins里引入此插件时，Init里设置的height将失效
import 'tinymce/plugins/autosave'; //自动存稿
import 'tinymce/plugins/charmap'; //特殊字符
import 'tinymce/plugins/code'; //编辑源码
import 'tinymce/plugins/codesample'; //代码示例
import 'tinymce/plugins/directionality'; //文字方向
import 'tinymce/plugins/emoticons'; //表情
import 'tinymce/plugins/fullscreen'; //全屏
import 'tinymce/plugins/help'; //帮助
import 'tinymce/plugins/image'; //插入编辑图片
import 'tinymce/plugins/importcss'; //引入css
import 'tinymce/plugins/insertdatetime'; //插入日期时间
import 'tinymce/plugins/link'; //超链接
import 'tinymce/plugins/lists'; //列表插件
import 'tinymce/plugins/media'; //插入编辑媒体
import 'tinymce/plugins/nonbreaking'; //插入不间断空格
import 'tinymce/plugins/pagebreak'; //插入分页符
import 'tinymce/plugins/preview'; //预览
import 'tinymce/plugins/quickbars'; //快速工具栏
import 'tinymce/plugins/save'; //保存
import 'tinymce/plugins/searchreplace'; //查找替换
import 'tinymce/plugins/table'; //表格
import 'tinymce/plugins/visualblocks'; //显示元素范围
import 'tinymce/plugins/visualchars'; //显示不可见字符
import 'tinymce/plugins/wordcount'; //字数统计

const init = {
  selector: '#tinydemo',
  language: "zh_CN",
  language_url: '/tinymce/langs/zh_CN.js',
  promotion: false,
  branding: false,
  plugins: `codesample preview searchreplace autolink directionality
    visualblocks visualchars image link media template table
    charmap pagebreak nonbreaking anchor insertdatetime advlist
    lists wordcount autosave`,
  toolbar: `preview codesample code forecolor backcolor styles directionality fontfamily fontsize searchreplace image  media link alignleft aligncenter alignright template charmap pagebreak nonbreaking anchor
    insertdatetime advlist lists wordcount autosave`,
  table_toolbar: 'tableprops tableinsertrowbefore tableinsertcolbefore tabledelete | tableheaderrow',

  // ✅ 插入表格时启用表头
  table_default_attributes: {
    border: '1'
  },
  table_default_styles: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  table_header_type: 'section', // 默认为 section，启用 <thead>

  // ✅ 插入表格时自动包含 <thead>
  table_default_options: {
    headerRows: 1,
    headerColumns: 0
  },
}

tinymce.init({})

const fileStr=ref('');

</script>
