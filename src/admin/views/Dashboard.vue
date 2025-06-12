
<script lang="ts" setup>
import {onMounted, ref, nextTick, computed} from "vue";
import api from '@/api/index.js';
import EditArticle from "@/admin/components/EditArticle.vue";
import {Edit} from '@element-plus/icons-vue';

const editId = ref('')
const dialogControl = ref({
  visible: false,
  showEditor: true,
  articleId: '',
  editKey: 0
})
let columnList = ref<{ id: string; title: string }[]>([]); // 专栏列表
// 构建 columnId => columnTitle 的映射表
const columnMap = computed(() => {
  const map = new Map<string, string>();
  columnList.value.forEach(col => {
    map.set(col.id, col.title);
  });
  return map;
});
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
    tableData.value = res.records.map((article: any) => {
      return {
        id: article.id,
        title: article.title,
        url: article.url,
        path: article.path,
        updateTime: article.updateTime,
        summary: article.summary,
        displayOrder: article.displayOrder || 1,
        columnName: columnMap.value.get(article.columnId) || '默认专栏',
      };
    });
  })
}
onMounted(() => {
  api.blog.getColumnInfoList().then(res => {
    columnList.value = res;
  }).catch(err => {
    console.error('获取专栏列表失败', err)
  })
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
        <el-table-column prop="columnName" label="标题" width="120" />
        <el-table-column prop="displayOrder" label="展示顺序" width="80" align="center" />
        <el-table-column prop="path" label="Router" width="120" />
        <el-table-column prop="url" label="URL" width="120" />
        <el-table-column prop="updateTime" label="更新时间" width="120" />
        <el-table-column prop="summary" label="文章简介" width="700" />
        <el-table-column fixed="right" label="" width="120">
          <template #default="scope">
            <el-button link type="primary" size="small">
              Detail
            </el-button>
            <el-button type="primary" :icon="Edit" @click="editArticle(scope.row.id)" circle>
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
  padding: 0 30px;
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



