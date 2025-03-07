# 首页内容

文章存放路径： 
    
    /usr/local/nginx-teamdoc/dist/articles

图片存放路径： 

    /usr/local/nginx-teamdoc/dist/images

文档目录配置文件： 
    
    /usr/local/nginx-teamdoc/dist/links.json

目录配置格式

```json
{
    "path": "",
    "title": "202501",
    "icon": "Folder",
    "children": [{
        "title": "标书复用",
        "path": "/articles/bid-reuse",
        "url": "/articles/标书复用.md",
        "icon": "Document",
        "component": "MdViewer"
    }]
}
```
重启服务：

    docker restart fd45ed8a559c064959a95af69dc71f55e1caebb9e53eae226d5ec0dff2879b72
