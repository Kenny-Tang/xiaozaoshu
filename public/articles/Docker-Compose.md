# 🐳 Docker Compose

---

## 一、什么是 Docker Compose？

**Docker Compose** 是一个用于定义和运行多个 Docker 容器的工具。你只需用一个 `docker-compose.yml` 文件，描述好服务的配置，然后一条命令就可以启动整个系统。

### 适用场景：

* 需要运行多个服务（如 Web 服务 + 数据库 + 缓存）
* 希望用配置文件统一管理部署
* 开发、测试、部署环境一致性

---

## 二、安装 Docker Compose

### 1. 检查 Docker 是否已安装

```bash
docker -v
```

### 2. 检查 Docker Compose 是否集成（推荐使用 Docker Compose V2）

```bash
docker compose version
```

如果你看到版本号（如 `Docker Compose version v2.27.1`），说明已安装。

### 3. 手动安装（Linux 下，如果未集成）

```bash
mkdir -p ~/.docker/cli-plugins/
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose
docker compose version
```

---

## 三、Docker Compose 文件结构详解（`docker-compose.yml`）

一个典型的配置文件如下：

```yaml
version: "3.9"  # 指定Compose文件的语法版本

services:
  redis:
    image: redis:7.2
    container_name: xiaozaoshu-redis
    ports:
      - "16379:6379"
```
---

### 关键字段解释

| 字段            | 含义                              |
|---------------|---------------------------------|
| `version`     | `Compose` 文件版本                    |
| `services`    | 定义多个服务，每个服务类似一个 `docker run` 容器 |
| `image`       | 使用的镜像                           |
| `build`       | 指定 `Dockerfile` 构建镜像            |
| `ports`       | 端口映射：`宿主机:容器`                   |
| `volumes`     | 挂载卷（主机路径:容器路径）                  |
| `environment` | 设置环境变量                          |
| `depends_on`  | 设置服务间依赖关系                       |
| `networks`    | 指定服务所属网络（用于服务间通信）               |

**version**
---

> Docker Compose 文件的 语法版本（Compose File Format），用于指定当前 YAML 文件使用的是哪一套规则。

Compose 文件的版本取决于你所使用的：

1. **Docker Engine 的版本**
2. **Compose 的版本（V1 或 V2）**
3. **你需要使用的功能是否支持某个版本**

**Compose 版本历史速查**

| Version    | 新增特性                                                |
| ---------- | --------------------------------------------------- |
| 3.9        | 支持 `init` 字段（容器用 tini 初始化）                          |
| 3.8        | 支持 `profiles` 分组启动服务                                |
| 3.7        | 支持 `cpu_count`、`cpu_percent`                        |
| 3.4 \~ 3.6 | 添加 `configs`、`secrets`（Swarm）                       |
| 2.4        | 支持 `healthcheck.test`、`depends_on.condition`（V2 专属） |


- 查看 `Docker` 的版本命令 `docker version`
- 查看 `docker compose` 的版本命令 `docker compose version`

如果你使用的是 **Docker Compose V2**（Docker Desktop 2022+ 已默认内置），**Compose V2** 会自动使用当前 `Docker` 引擎支持的最新语法，无需手动指定。

***建议***
* **如果你使用的是 Docker Compose V2**（大多数用户），可以 **省略 `version`**。
* 如果你需要保持兼容性（比如部署在服务器上），建议使用 `version: "3.9"`。

**depends_on**
---
`depends_on` 的语法格式

```yaml
depends_on:
  - service1
  - service2
```

1. 表示：当前服务在启动之前，**必须先启动所依赖的服务容器**(service1, service2)。 
2. 但这并不意味着 `service1` 和 `service1` 服务已经“就绪”或“可用”！

`depends_on` **只控制容器的启动顺序**，**不会等待依赖服务“可用”或“健康”**：

* 它不检查数据库是否初始化完成
* 不判断端口是否监听成功
* 不检查健康状态（除非配合 `healthcheck`）


* 推荐组合用法：`depends_on` + `healthcheck` + 自定义延迟

为了确保服务真正就绪，推荐使用：

| 项目                      | 示例            |
| ----------------------- | ------------- |
| ✅ depends\_on           | 控制容器启动顺序      |
| ✅ healthcheck           | 设置服务就绪判定条件    |
| ✅ entrypoint/startup 脚本 | 延迟启动 / 等待端口探测 |


* 实用补充：常见健康检查方式

```yaml
services:
  db:
    image: mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 3s
      retries: 5
```

然后 web 服务通过 `wait-for-it.sh` 或 `sleep` 等方式延迟启动。

---

## 四、Docker Compose 常用命令速查表

| 命令                       | 功能说明             | 示例                                    |
| ------------------------ | ---------------- | ------------------------------------- |
| `docker compose up`      | 构建并启动所有服务        | `docker compose up`                   |
| `docker compose up -d`   | 后台运行（detach 模式）  | ✅ 推荐用于开发                              |
| `docker compose down`    | 停止并删除所有容器、网络、匿名卷 | `docker compose down`                 |
| `docker compose stop`    | 停止服务，但不删除容器      | `docker compose stop`                 |
| `docker compose start`   | 启动已停止的服务容器       | `docker compose start`                |
| `docker compose restart` | 重启所有服务           | `docker compose restart`              |
| `docker compose build`   | 手动构建服务镜像         | `docker compose build`                |
| `docker compose pull`    | 拉取最新镜像           | `docker compose pull`                 |
| `docker compose push`    | 推送镜像到远程仓库        | `docker compose push`                 |
| `docker compose ps`      | 查看服务容器状态         | `docker compose ps`                   |
| `docker compose logs`    | 查看日志             | `docker compose logs redis`           |
| `docker compose logs -f` | 实时追踪日志           | `docker compose logs -f app`          |
| `docker compose exec`    | 在容器中执行命令（支持交互）   | `docker compose exec redis redis-cli` |
| `docker compose run`     | 启动一个一次性容器运行命令    | `docker compose run app npm install`  |
| `docker compose config`  | 查看合并后的配置（调试用）    | `docker compose config`               |
| `docker compose top`     | 查看容器的进程信息        | `docker compose top`                  |

---

***docker compose up***
---

执行此命令，`Docker` 会在当前目录下查找：

  - docker-compose.yml（默认）
  - 也支持 docker-compose.yaml（扩展名不同）

如果你用的是默认名称，上述命令就可以直接使用，无需任何参数。

你可以自定义文件名，比如 `myapp-compose.yml`，然后使用 `-f` 指定：

> docker compose -f myapp-compose.yml up

甚至可以组合多个文件：

> docker compose -f docker-compose.yml -f docker-compose.override.yml up

这在区分**开发 / 测试 / 生产环境**时非常有用。

**常见用法建议:**

| 文件名                           | 用途          |
| ----------------------------- | ----------- |
| `docker-compose.yml`          | 默认配置，推荐统一使用 |
| `docker-compose.override.yml` | 默认自动合并（可选）  |
| `docker-compose.prod.yml`     | 生产环境配置      |
| `docker-compose.dev.yml`      | 本地开发配置      |
| `docker-compose.test.yml`     | 测试环境配置      |

---

## 五、实战案例

**示例：部署一个 Spring Boot + MySQL + Redis 应用**

### 项目结构

```
xiaozaoshu/
├── docker-compose.yml
├── mysql/
│   └── init.d/
│       ├── 01_sys_config.sql
│       └── 02_sys_data.sql
├── app/
│   ├── Dockerfile
│   └── jar/
│       └── spring-demo.jar
```

#### `app/Dockerfile`

```Dockerfile
FROM openjdk:8-jdk-alpine
COPY jar/spring-demo.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### `docker-compose.yml`

```yaml

services:
  redis:
    image: redis:7.2
    container_name: xiaozaoshu-redis
    networks:
      - docker-backend-network
    ports:
      - "16379:6379"
    command: ["redis-server", "--requirepass", "${REDIS_PASSWORD}"]

  # Nacos config
  nacos:
    image: xiaozaoshu-nacos:v1
    container_name: xiaozaoshu-nacos
    networks:
      - docker-backend-network
    ports:
      - "18848:8848"
      - "9848:9848"
    environment:
      - MODE=standalone
    volumes:
      - ./nacos/data:/home/nacos/data  # ✅ 数据.久化
    depends_on:
      - mysql
    restart: unless-stopped

  # MySQL config
  mysql:
    image: mysql:5.7
    container_name: xiaozaoshu-mysql
    networks:
      - docker-backend-network
    ports:
      - "13306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}  # 从 .env 读取密码
    volumes:
      - ./mysql/data:/var/lib/mysql         # 数据持久化
      - ./mysql/log:/var/log/mysql           # 日志挂载
      - ./mysql/conf:/etc/mysql/conf.d       # 自定义配置
      - ./mysql/init.d:/docker-entrypoint-initdb.d  # 初始化脚本（*.sql） 脚本会按照文件名称排序后一次执行
    restart: unless-stopped

  xiaozaoshu-system:
    image: xiaozaoshu-system-shanghai:v1
    container_name: xiaozaoshu-system
    networks:
      - docker-backend-network
    extra_hosts:
      - "test-xiaozaoshu.com.cn:192.168.2.100"
    ports:
      - "8181:8181"
    environment:
      NACOS_PASSWORD: 123@Qwe
      NACOS_HOST: test-xiaozaoshu.com.cn
      NACOS_PORT: 18848
    depends_on:
      - nacos
    entrypoint: ["/wait-for-nacos.sh"]
    command: ["java", "-jar", "app.jar"]
    restart: unless-stopped

networks:
  docker-backend-network:
    external: true


```
由于 Docker 的 docker-entrypoint-initdb.d/ 目录中脚本是按照 文件名字典序（ASCII 排序） 自动执行的，需要通过 `重命名文件` 的方式来确保执行顺序。

#### 启动项目

```bash
docker compose up -d
```

项目将自动启动：

* Spring Boot 应用运行在 `test-xiaozaoshu.com.cn:8181`
* MySQL 在 `localhost:13306`
* Redis 在 `localhost:16379`

---

## 六、进阶用法

### 1. `.env` 配置环境变量

可以写在 `.env` 文件中：

```env
MYSQL_ROOT_PASSWORD=123456
```

然后在 compose 文件中使用：

```yaml
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}  # 从 .env 读取密码
```

---

### 2. 多个 Compose 文件组合部署（如：测试环境）

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up
```

---

### 3. 自动重启策略

```yaml
restart: unless-stopped
```

---

## 七、常见问题排查

- 启动依赖问题

`depends-on` 只能保证顺序启动，不能保证nacos 已经可以启动完成可以正常提供服务了，所以增加了 `wait-for-nacos.sh`，监测nacos服务的状态。
>entrypoint: ["/wait-for-nacos.sh", "java", "-jar", "app.jar"]

最初使用上述配置编写`Dockerfile`，可能被**忽略或合并不当**，导致直接逃过了监测，直接启动应用，所以在镜像中不要定义默认的 `ENTRYPOINT`，或 **用 Compose 的 `command` 明确指定启动命令**。

> entrypoint: ["/wait-for-nacos.sh"]<br />
> command: ["java", "-jar", "app.jar"]

在 **Linux** 或 **macOS** 下，环境变量名称（即变量名）**不能以点号 (`.`) 开头，也不能包含点号**，这是 POSIX 标准规定的。

- 环境变量名规则问题
  * 只能包含：`字母`、`数字`、`下划线`（不能包含`.`）
  * 必须以 **字母或下划线** 开头
  * 变量名区分大小写

**以下变量名是非法的：**

> nacos.password=abc        # 错误：包含点号

**正确做法（示例）：**

你可以用下划线 `_` 代替点号：
>  NACOS_PASSWORD: 1234qweR

Spring Boot 支持将 `NACOS_PASSWORD` 映射为配置属性 `nacos.password`。

例如你可以在 Spring Boot 中这样读取：

```yaml
nacos:
  password: ${NACOS_PASSWORD}
```

---
## 八、卸载 Docker Compose

如果是手动安装的，可以删除：

```bash
rm ~/.docker/cli-plugins/docker-compose
```

---

## 九、总结

| 优势   | 说明                           |
| ---- | ---------------------------- |
| 简洁   | 一份配置文件，统一管理多个服务              |
| 可移植  | `docker-compose.yml` 可轻松复制部署 |
| 跨平台  | 支持 Linux / Windows / macOS   |
| 适合开发 | 快速启动开发环境，模拟微服务系统             |
