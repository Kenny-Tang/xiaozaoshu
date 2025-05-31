
<template>
  <div class="home-view">
    <div class="custom-search">
      <el-input
          v-model="param.searchKey"
          style="width: 240px"
          placeholder="请输入搜索内容"
          clearable
      />
      <el-button type="primary" round style="margin-left: 20px" @click="queryHomeArticleList">搜索</el-button>
    </div>
    <el-collapse v-model="activeNames" @change="handleChange">
      <el-collapse-item
          v-for="item in param.records"
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
        <div style="display: flex; align-items: flex-start;">
          <el-image src="images/1871381602471264271.png" style="width: 100px; height: 100px;flex-shrink: 0;" />
          <div style="height: 100px; display: flex;flex-direction: column;justify-content: space-between; padding-left: 20px">
            <div>
              {{ item.summary }}
            </div>
            <div>
              <router-link :to="item.path" class="el-link">
                阅读全文
                <el-icon><DArrowRight /></el-icon>
              </router-link>
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

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
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import type { CollapseModelValue } from 'element-plus'
import api from '@/api/index.js';

let param = ref({
  searchKey: '',
  pageNum: 1,
  pageSize: 15,
  current: 1,
  total: 0,
  records: []
})

const  queryHomeArticleList = () => {
  console.log('查询参数:', param);
  api.blog.getHomeArticleList(param.value).then(res => {
    console.log('获取首页文章列表', res)
    param.value.total = res.total
    param.value.current = res.current
    param.value.records = res.records
    activeNames.value = res.records.map(item => item.title)
  })
}
onMounted(() => {
  queryHomeArticleList();
})

const handleCurrentChange = (val: number) => {
  param.value.pageNum = val;
  queryHomeArticleList();
}

const activeNames = ref(['1'])
const handleChange = (val: CollapseModelValue) => {
  console.log("handlechange " + val)
}
</script>

<style scoped>
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
