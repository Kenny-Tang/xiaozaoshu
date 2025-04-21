搭建 Docker 私有化仓库是一个非常重要的实践，它能够帮助你安全地存储和管理 Docker 镜像，而无需将其发布到公共 Docker Hub。通过使用私有化仓库，你可以：

- 提高安全性：镜像存储在受控的环境中。
- 提升效率：在公司网络内传输镜像，速度更快。
- 实现自动化：配合 CI/CD 系统实现自动镜像管理。

## 1. 安装 Docker Registry
Docker Registry 是 Docker 官方提供的私有仓库解决方案。你可以通过以下命令快速安装：

```bash
docker pull registry:2.8.3
```
如果不指定版本将下载 Docker Registry 的最新版本。你也可以指定其他版本，例如 `registry:2.7.1`。
## 2. 启动 Docker Registry
使用以下命令启动 Docker Registry：

```bash
docker run -d --name docker-registry -v /data/docker-registry:/var/lib/registry -p 5000:5000 26b2eb03618e
```
- -d：后台运行容器。
- -p 5000:5000：将主机的 5000 端口映射到容器的 5000 端口。
- --name docker-registry：为容器命名为 my-registry。

 **参数说明**：

| 参数                                           | 作用                          |
|----------------------------------------------|-----------------------------|
| `-d`                                         | 后台运行容器。                     |
| `--name docker-registry`                     | 为容器命名为 my-registry。         |
| `-v /data/docker-registry:/var/lib/registry` | 映射主机的镜像数据存储目录               |
| `-p 5000:5000`                               | 将主机的 5000 端口映射到容器的 5000 端口。 |

## 3. 推送镜像到私有化仓库
将本地镜像推送到私有化仓库：

### 3.1 给镜像打标签：

```bash
docker tag 26b2eb03618e 172.16.118.102:5000/ng-mac:04171613
```

### 3.2 推送镜像到私有仓库：
```bash
docker push 172.16.118.102:5000/ng-mac:04171613
```
## 4. 从私有化仓库拉取镜像
```bash
[root@hera docker-registry]# docker pull 172.16.118.102:5000/ng-mac:04171613
Error response from daemon: Get "https://172.16.118.102:5000/v2/": http: server gave HTTP response to HTTPS client
```

默认使用的协议是 HTTPS，但私有化仓库默认使用 HTTP 协议，因此需要在 Docker 客户端配置中添加私有化仓库的地址和协议。

修改下配置 daemon.json 文件：
```bash
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "insecure-registries": ["172.16.118.102:5000"]
}
```

重启 Docker 服务：
```bash
systemctl daemon-reexec
systemctl restart docker
```

✅ 验证是否生效
```bash
curl http://172.16.118.102:5000/v2/
```
如果返回 {} 或空白，说明仓库正常工作。