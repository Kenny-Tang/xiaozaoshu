# Role
你是一名资深前端工程师，擅长 Vue.js (Vue 3 + Composition API)、Axios 调用接口和现代前端架构。
输出的代码必须可直接运行，结构清晰，可维护。

# Objective
目标：
为以下接口列表生成完整的前端功能模块，包括：
- 列表查询显示
- 异常处理和用户提示
- 与后端接口正确对接（使用 Axios 或 Fetch）

# Context & Constraints
1. 前端框架：Vue 3 + Composition API
2. UI 组件库：Element Plus
3. 数据接口已存在，不允许修改接口
4. 每个功能模块单独组件化
5. 异常处理：接口失败要提示用户
6. 代码风格：TypeScript，可复用

# Input
后端接口信息：
1. GET http://localhost:18955/sync/selectTPList → 查询列表，返回 JSON{"msg":"操作成功","code":200,"data":[{"id":"1965349872148287488","projectName":"MacosTest","centerName":"谭建伟的基地","documentStoragePath":"/Users/kenny/Documents/lnsoft/bidFiles","storageAvailableSpace":"0 GB","serverName":"kenny.local","isSynced":"1","isDeleted":"0","lastSyncTime":"2025-09-09 17:43:47","createTime":"2025-09-09 17:41:38","updateTime":"2025-09-09 17:43:47"}]}

其他信息：
- 列表需要分页
- 表单需要基础验证（必填字段、数据类型）

# Output Specification
输出要求：
1. 为每个接口生成 Vue 组件，包括模板 (template)、脚本 (script setup) 和样式 (style)
2. 列表组件支持分页和刷新
3. 表单组件支持新增/修改，含基础验证
4. 删除操作包含确认提示
5. Axios 调用封装在 `services/api.ts`，统一管理接口

# Validation
请在输出前自检：
- 是否严格按照接口调用
- 是否支持异常提示
- 是否符合 Vue 3 + Composition API
- 是否包含必要的分页、表单验证和确认提示



# Role
你是一名资深前端工程师，精通 Vue 3 + Composition API + TypeScript，并熟悉 Element Plus 组件库。
请直接生成可运行代码，模块化、结构清晰、可维护。

# Objective
目标：
生成一个完整的 Vue 前端查询模块，实现以下功能：
1. 列表查询显示（支持分页）
2. 与后端接口正确对接（使用 Axios 封装）

# Context & Constraints
1. Vue 3 + Composition API + TypeScript
2. UI 组件库：Element Plus
3. 后端接口已存在，不允许修改接口
4. 每个功能模块单独组件化
5. Axios 调用统一封装在 `services/api.ts`
6. 异常处理：接口失败需提示用户
7. 列表分页、表单验证必须实现

# Input
后端接口信息：
- GET http://localhost:18955/sync/selectTPList → 查询列表，返回 JSON{"msg":"操作成功","code":200,"data":[{"id":"1965349872148287488","projectName":"MacosTest","centerName":"谭建伟的基地","documentStoragePath":"/Users/kenny/Documents/lnsoft/bidFiles","storageAvailableSpace":"0 GB","serverName":"kenny.local","isSynced":"1","isDeleted":"0","lastSyncTime":"2025-09-09 17:43:47","createTime":"2025-09-09 17:41:38","updateTime":"2025-09-09 17:43:47"}]}

其他要求：
- 样式可使用默认 Element Plus 样式
- 组件文件命名：`TenderEvaluationCenterProjectList.vue`（列表）
- 如果生成新组件，请保持完整 `<template>、<script setup lang="ts">、<style>` 结构

# Output Specification
1. 直接生成可运行 Vue 组件代码块，使用 ```vue 包裹
2. 列表组件支持分页和刷新
3. 表单组件支持新增和修改，并含基础验证
4. 删除操作包含单条和批量删除确认提示
5. Axios 调用统一封装在 `services/api.ts`，请生成该文件内容
6. 不要输出多余文字，只返回代码

# Validation
请在输出前自检：
- 是否严格按照接口调用
- 是否符合 Vue 3 + Composition API + TypeScript
- Axios 封装是否完整

