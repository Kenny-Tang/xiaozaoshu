
# Docker Install MySQL

## 下载镜像

```shell
docker pull mysql:5.7
```
这个标签通常指向 5.7 系列的最新稳定版本。


## 创建挂载的目录
```bash
# 存储数据库数据
mkdir -p /Users/kenny/docker/mysql/data  
# 存储日志文件
mkdir -p /Users/kenny/docker/mysql/log 
# 存储自定义配置
mkdir -p /Users/kenny/docker/mysql/conf   
```

**⚠️ 权限提醒（重要）**

确保挂载目录及子目录权限足够，否则 MySQL 容器可能无法初始化数据库，或者无法加载配置文件

在 `Mac` 中， macOS 默认允许 `~/` 路径共享，无需额外设置


---

下面我们来用 `docker` 安装并运行 **MySQL 5.7**，挂载这些目录，推荐使用如下命令：

## Docker 安装 MySQL 5.7
1. 创建网络
```shell
docker network create docker-backend-network
```
我们的服务将运行在这个网络中，确保容器间可以互相通信。

2. 启动容器
```bash
docker run -d \
  --name mysql57 \
  --network docker-backend-network \
  -p 3306:3306 \
  -v /Users/kenny/docker/mysql/data:/var/lib/mysql \
  -v /Users/kenny/docker/mysql/log:/var/log/mysql \
  -v /Users/kenny/docker/mysql/conf:/etc/mysql/conf.d \
  -e MYSQL_ROOT_PASSWORD=YourStrongPassword \
  --restart unless-stopped \
  mysql:5.7
```

### 参数解释：

| 参数                           | 说明              |
| ---------------------------- | --------------- |
| `--name mysql57`             | 容器名称            |
| `--network docker-backend-network` | 指定容器网络        |
| `-p 3306:3306`               | 映射端口            |
| `-v /Users/kenny/docker/...`               | 挂载主机目录到容器       |
| `-e MYSQL_ROOT_PASSWORD=xxx` | 设置 root 密码      |
| `--restart unless-stopped`   | 随 Docker 启动自动重启 |
| `mysql:5.7`                  | 使用的镜像版本         |

---

## 查看容器日志与状态

查看运行日志：

```bash
docker logs -f mysql57
```

查看状态：

```bash
docker ps -a
```


## 可选：配置文件
### 自定义配置文件

你可以在 `/Users/kenny/docker/mysql/conf/my.cnf` 中添加自定义配置，例如：

```ini
[mysqld]
server-id=1
# 字符集设置
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# 最大连接数
max_connections=200

# 启用 binlog（日后主从同步可用）
log-bin=mysql-bin

# 设置 SQL 模式
sql_mode=STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION

# 慢查询日志
slow_query_log=1
long_query_time=2
slow_query_log_file=/var/log/mysql/mysql-slow.log
```

该文件会自动被容器挂载并生效（路径：`/etc/mysql/conf.d/my.cnf`）。

修改完成后重启容器使配置生效，`docker restart mysql57`。

### 验证

**验证下文件有没有正确挂载**，进入容器查看配置文件是否正确挂载：

```bash
docker exec -it mysql57 bash

cat /etc/mysql/conf.d/my.cnf 
```

使用 `DBeaver` ( 或者 `Navicat` ) 连接数据查询设置是否正确：

```sql
-- 检查字符集设置
SHOW VARIABLES LIKE 'character_set_server';  -- utf8mb4
SHOW VARIABLES LIKE 'collation_server'; -- utf8mb4_unicode_ci
```
---

文件有内容，`SQL` 查询结果正确，说明配置文件配置成功。