
<script lang="ts" setup>
import {onMounted, ref, nextTick} from "vue";
import api from '@/api/index.js';
import EditArticle from "@/admin/components/EditArticle.vue";
import { ElMessage } from 'element-plus';

const editId = ref('')
const dialogControl = ref({
  visible: false,
  showEditor: true,
  articleId: '',
  editKey: 0
})
const tableData = ref([]);

const editArticle = async (newId: string) => {
  editId.value = newId;
  handleDialogOpen();
  await nextTick(); // 等待 dialog 渲染
}

const onSuccess = (data: string) => {
  console.log('onSuccess', data === 'success')
  if (data === 'success') {
    queryHomeArticleList();
  }
  handleDialogClose();
  nextTick(); // 等待 dialog 渲染
}
const  queryHomeArticleList = () => {
  console.log('查询参数:', param);
  api.blog.getHomeArticleList(param.value).then((res: any) => {
    param.value.total = res.total
    param.value.current = res.current
    tableData.value = res.records
  })
}
onMounted(() => {
  queryHomeArticleList();
});

const handleCurrentChange = (val: number) => {
  param.value.pageNum = val;
  queryHomeArticleList();
}

let param = ref({
  searchKey: '',
  pageNum: 1,
  pageSize: 10,
  current: 1,
  total: 0,
  records: []
})

// 处理对话框打开
const handleDialogOpen = () => {
  dialogControl.value.visible = true
  dialogControl.value.showEditor = true;
  dialogControl.value.editKey++;
}
// 处理对话框关闭
const handleDialogClose = () => {
  dialogControl.value.visible = false
  dialogControl.value.showEditor = false;
}
</script>

<template>
  <div class="dashboard">
    <div class="custom-search">
      <el-input
          v-model="param.searchKey"
          style="width: 240px"
          placeholder="请输入搜索内容"
          clearable
      />
      <el-button type="primary" round style="margin-left: 20px" @click="queryHomeArticleList">搜索</el-button>
    </div>
    <div>
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="id" label="ID" width="120" />
        <el-table-column prop="title" label="标题" width="120" />
        <el-table-column prop="displayOrder" label="展示顺序" width="60" />

        <el-table-column prop="url" label="URL" width="120" />
        <el-table-column prop="path" label="Router" width="120" />
        <el-table-column prop="summary" label="文章简介" width="600" />
        <el-table-column fixed="right" label="" width="120" show-overflow-tooltip>
          <template #default="scope">
            <el-button link type="primary" size="small">
              Detail
            </el-button>
            <el-button link type="primary" size="small" @click="editArticle(scope.row.id)">
              Edit
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pagination">
      <el-pagination background layout="prev, pager, next"
                     v-model:current-page="param.current"
                     size="large"
                     v-model:page-size="param.pageSize"
                     :total="param.total"
                     @current-change="handleCurrentChange"
      />
    </div>
  </div>

  <div>
    <el-dialog v-model="dialogControl.visible" title="Tips" width="60%" draggable>
        <EditArticle
            v-if="dialogControl.showEditor"
            :key="dialogControl.editKey"
            :articleId="editId"
            :onSuccess="onSuccess"
            @close="handleDialogClose"
        />
    </el-dialog>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 0 20px;
}
.custom-search {
  display: flex; justify-content: right;
  margin: 0 10px 10px 10px;
}

.pagination {
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex; justify-content: center;
}
</style>



