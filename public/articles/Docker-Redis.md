
# Docker Install Redis

---
**拉取镜像**
> docker pull redis:7.2

## 方法一：使用 `docker run` 命令快速启动 Redis 容器

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7.2
```

### 参数说明：

* `-d`：后台运行容器
* `--name redis`：容器名
* `-p 6379:6379`：将宿主机的 6379 端口映射到容器的 6379 端口
* `redis:7.2`：使用指定版本镜像，如 `redis:7.2`）

---

## 方法二：使用 Docker Compose 安装 Redis（推荐用于开发环境）

创建一个 `docker-compose.yml` 文件：

```yaml
version: '3'
services:
  redis:
    image: redis:7.2
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - ./data:/data
    command: ["redis-server", "--appendonly", "yes"]
```

然后执行：

```bash
docker-compose up -d
```

---

## 验证是否成功运行

```bash
docker ps
```

然后你可以连接 Redis：

```bash
docker exec -it redis redis-cli
```

输出：

```
127.0.0.1:6379>
```

---

## 如果需要设置 Redis 密码

可以通过修改启动命令来添加密码：

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis \
  redis-server --requirepass yourpassword
```

---

## 📁 数据持久化（可选）

挂载数据目录，避免容器删除后数据丢失：

```bash
-v /your/host/path:/data
```

Redis 容器默认会把数据保存在 `/data`，你可以将其映射到本地目录。

---

## 官方镜像页面（更多选项）：

[https://hub.docker.com/\_/redis](https://hub.docker.com/_/redis)

---

需要我帮你写一个含密码、持久化、以及客户端测试的 Redis Compose 文件吗？
