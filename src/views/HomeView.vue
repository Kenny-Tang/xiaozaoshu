
<template>
  <div class="home-view">
    <div class="custom-search">
      <el-input
          v-model="param.searchKey"
          style="width: 240px"
          placeholder="请输入搜索内容"
          clearable
      />
      <el-button type="primary" round style="margin-left: 20px" @click="queryHomeArticleList()">搜索</el-button>
    </div>
    <el-collapse v-model="activeNames" @change="handleChange">
      <el-collapse-item
          v-for="item in panels"
          :key="item.name"
          :title="item.title"
          :name="item.title"
          :isActive="true"
      >
        <template #icon="{ isActive }">
          <span class="icon-ele">
            {{ isActive ? '展开' : '折叠' }}
          </span>
        </template>
        <div>
          {{ item.summary }}
        </div>
        <div>
          <router-link :to="item.path" class="el-link">
            阅读全文
            <el-icon><DArrowRight /></el-icon>
          </router-link>
        </div>
      </el-collapse-item>
    </el-collapse>

    <div class="pagination">
      <el-pagination background layout="prev, pager, next"
                     v-model:current-page="pageInfo.current"
                     size="large"
                     v-model:page-size="pageInfo.pageSize"
                     :total="pageInfo.total"
                     @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import type { CollapseModelValue } from 'element-plus'
import api from '@/api/index.js'

defineProps({
  url: String,
});

const panels = ref([])
let pageInfo = ref({
  current: 1,
  pageSize: 10,
  size: 10,
  total: 60,
})

let param = ref({
  searchKey: '',
  pageNum: 1,
  pageSize: 10
})

const  _getHomeArticleList = (param) => {
  console.log('查询参数:', param);
  api.blog.getHomeArticleList(param).then(res => {
    console.log('获取首页文章列表', res)
    pageInfo.value.total = res.total
    pageInfo.value.current = res.current
    pageInfo.value.pageSize = res.pageSize
    panels.value = res.records
    activeNames.value = res.records.map(item => item.title)
  })
}
onMounted(() => {
  _getHomeArticleList(param.value);
})

const handleCurrentChange = (val: number) => {
  param.value.pageNum = val;
  _getHomeArticleList(param.value);
}

const queryHomeArticleList = () => {
  _getHomeArticleList(param.value);
}



const activeNames = ref(['1'])
const handleChange = (val: CollapseModelValue) => {
  console.log("handlechange " + val)
}
</script>

<style scoped>
.home-view {
  margin: 10px;
}
.custom-search {
  display: flex; justify-content: right;
  margin: 0px 10px 10px 10px;
}
.icon-ele {
  margin: 0 8px 0 auto;
  color: #409eff;
}
.pagination {
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex; justify-content: center;
}
</style>
