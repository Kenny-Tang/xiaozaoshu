Docker 安装 Nacos 是一种常见的部署方式，适合快速搭建开发或测试环境。下面是使用 Docker 安装 Nacos 的完整步骤，适用于 **单机模式** 部署（适合本地开发或小型项目）。

---

## 🐳 Docker 安装 Nacos（单机模式）

### ✅ 前提条件

* 已安装 Docker 和 Docker Compose（可选但推荐）
* 需要 MySQL 数据库（可选，如果不使用嵌入式数据库）

---

### 💡 方法一：快速运行（不带 MySQL）

```bash
docker run -d --name nacos-standalone \
  -e MODE=standalone \
  -p 8848:8848 \
  nacos/nacos-server:v2.5.1
```

访问 Nacos 控制台：

```
http://localhost:8848/nacos
默认账号：nacos
默认密码：nacos
```

---

### 💡 方法二：使用 MySQL 和 Docker Compose（推荐）

#### 1. 创建 `docker-compose.yml`

```yaml
version: '3'
services:
  nacos:
    image: nacos/nacos-server
    container_name: nacos
    environment:
      - MODE=standalone
      - SPRING_DATASOURCE_PLATFORM=mysql
      - MYSQL_SERVICE_HOST=your_mysql_host
      - MYSQL_SERVICE_PORT=3306
      - MYSQL_SERVICE_DB_NAME=nacos_config
      - MYSQL_SERVICE_USER=nacos
      - MYSQL_SERVICE_PASSWORD=nacos123
    ports:
      - "8848:8848"
    restart: always
```

#### 2. 准备数据库

在你的 MySQL 中执行初始化 SQL 脚本（[官方 SQL 脚本](https://github.com/alibaba/nacos/blob/develop/distribution/conf/nacos-mysql.sql)）创建 `nacos_config` 数据库和表结构。

#### 3. 启动服务

```bash
docker-compose up -d
```

---

### 📌 默认控制台信息

* 控制台地址：[http://localhost:8848/nacos/](http://localhost:8848/nacos/)
* 用户名：`nacos`
* 密码：`nacos`

---

### 📎 相关端口说明

| 端口        | 用途         |
| --------- | ---------- |
| 8848      | Nacos 控制台  |
| 9848/9849 | 服务健康检查（可选） |

---

### ❗注意事项

* 如果部署在生产环境，请使用外部数据库并配置持久化卷。
* 建议在生产环境中启用集群模式、高可用 MySQL、Nginx 负载均衡等。
* 默认配置文件可以通过挂载方式覆盖，或者使用自定义环境变量进行设置。

---

## 🧭 Nacos 健康检查方式

### 🔹 1. 查看容器运行状态

```bash
docker ps
```

输出中应该有你的服务容器（比如 nacos），状态为 `Up`。

---

### 🔹 2. 检查首页是否正常响应（简单有效）

```bash
curl -I http://localhost:8848/nacos/
```

返回应该类似于：

```
HTTP/1.1 200 OK
...
```

只要返回 200 就表示服务正常。


或者写成 shell 脚本：

```bash
if curl -s --head http://localhost:8848/nacos/ | grep "200 OK" > /dev/null
then
  echo "✅ Nacos is running"
else
  echo "❌ Nacos is down"
fi
```

---


输出应该包含 `succeeded` 或 `Connected`。

---

### 🔹 3. 检查 Nacos 注册服务接口（进阶）

如果你部署了服务，可以通过 API 查询注册服务列表：

```bash
curl -s "http://localhost:8848/nacos/v1/ns/service/list?pageNo=1&pageSize=10"
```

这个接口能正常返回，说明 Nacos Naming 正常。

---

### 🔹 4. 使用 Nacos 自带的 Prometheus 健康接口（1.x 没有）

如果你用的是 **Nacos 2.x 版本并开启了监控模块**，可能存在 `/actuator/health`：

```bash
curl http://localhost:8848/nacos/actuator/health
```
返回类似如下内容
```
{"status":"UP"}
```

## 通过NGINX代理控制台
因为NGINX 和 Nacos 部署在同一台服务器上，且都是通过 Docker 部署的，这里我将服务部署同一个Docker 网络中。

### 1. 创建 Docker 网络

```bash
docker network create docker-backend-network
```
### 2. 运行 Nacos
```bash
docker run -d --name nacos-standalone \
  -e MODE=standalone \
  --network docker-backend-network \
  --restart unless-stopped \
  -p 8848:8848 -p 9848:9848 -p 9849:9849 \
  nacos/nacos-server:v2.5.1
```

### 3. 运行 Nginx
```bash
docker run \
-p 80:80 -p 443:443 \
--name nginx-xiaozaoshu-ssl \
--restart unless-stopped \
--network docker-backend-network \
-v /usr/local/nginx/conf/nginx.conf:/etc/nginx/nginx.conf \
-v /usr/local/nginx/conf/conf.d:/etc/nginx/conf.d \
-v /usr/local/nginx/log:/var/log/nginx \
-v /usr/local/nginx/html:/usr/share/nginx/html \
-v /usr/local/nginx/certs:/etc/nginx/certs:ro \
-d nginx:1.27.3-perl
```

## 项目启动

### 启动 user-service
```bash
docker run --name user-service \
  --network docker-backend-network \
  -p 8081:8081 \
  --restart unless-stopped \
  user-service:0.1
```
### 启动 api-gateway
```bash
docker run --name api-gateway \
  --network docker-backend-network \
  -p 8080:8080 \
  --restart unless-stopped \
  api-gateway:0.1
```