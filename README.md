# xiaozaoshu
 
# Blog

添加 markdown 格式的文件转换为 html 的预览格式显示在网页，不再需要自己进行格式的转换

markdown 文章存放路径 `public/articles/`

写好后在 `public/links.json` 配置对应的文章显示

"name" : 左侧目录的显示名称

"path" : vue 用于路由的路径

"url" : markdown 文件的存放位置，会被读取后在页面中显示

```json
  {
	  "name": "服务发布策略",
	  "path": "/articles/application-deploy-strategy",
	  "url": "/articles/SnowflakeId.md",
	  "icon": "Document"
  }
```
