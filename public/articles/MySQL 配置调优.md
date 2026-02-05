在 **MySQL 5.7** 的**生产环境**中，默认配置偏保守，**16 GB 内存**的服务器一般需要做一轮**基础调优**，重点目标是：
 **提高缓存命中率、减少磁盘 IO、避免 OOM、保证稳定性**

按 **“必调 → 常调 → 场景调优”** 并给出一套 **16 GB 内存的通用生产模板 + 原因说明**。

---

## 一、必须调整（生产环境几乎必改）

### InnoDB Buffer Pool（最重要）

**innodb_buffer_pool_size**
这是最重要的参数，InnoDB 缓冲池用于缓存数据和索引。
```ini
innodb_buffer_pool_size = 10G
```
建议设置为物理内存的 60-70%（16G × 0.625 = 10G），为操作系统和其他进程预留足够内存。

**innodb_buffer_pool_instances**
```ini
innodb_buffer_pool_instances = 8
```
当 buffer pool 大于 1G 时，建议分成多个实例以减少竞争，通常设置为 8 或与 CPU 核心数相当。

---

### 日志文件大小（避免频繁刷盘）

```ini
innodb_log_file_size = 1G
innodb_log_files_in_group = 2
innodb_log_buffer_size = 64M
```

 说明：

* 总 redo ≈ 2G（适合写入型 OLTP）
* 太小 → checkpoint 频繁，IO 抖动
* 改动后**需要删除旧 ib_logfile*** 再启动

---

###  Flush 策略（性能 vs 安全）

```ini
innodb_flush_log_at_trx_commit = 1
sync_binlog = 1
```

 建议：

* **金融/交易系统**：必须 `1`
* **可接受少量数据丢失**：

  ```ini
  innodb_flush_log_at_trx_commit = 2
  sync_binlog = 0
  ```
- 1：最安全，每次事务提交都刷新到磁盘（推荐生产环境）
- 2：每秒刷新一次，性能更好但可能丢失 1 秒数据
- 0：性能最好但最不安全


  性能能提升明显（10–30%）

---

### I/O 线程数（SSD / 云盘）

```ini
innodb_read_io_threads = 8
innodb_write_io_threads = 8
```

 SSD / 云盘推荐 8
 HDD 可降到 4

---

## 二、连接 & 内存保护（防 OOM）

### 最大连接数（非常重要）

```ini
max_connections = 300
```

 **不要盲目调大**
每个连接都会消耗内存（排序、join buffer 等）

---

### 临时表 & 排序内存（避免磁盘临时表）

```ini
tmp_table_size = 128M
max_heap_table_size = 128M

sort_buffer_size = 4M
join_buffer_size = 4M
```

 原则：

* **这些是“每连接内存”**
* 不要配置成 64M / 128M，否则高并发直接 OOM

---

## 三、表 & 文件句柄（高并发表必调）

### 表缓存

```ini
table_open_cache = 4096
table_definition_cache = 4096
```

 多表系统（微服务、分库分表）很重要
 可通过 `Open_tables` 判断是否需要继续调大

---

### 文件打开数

```ini
open_files_limit = 65535
```

⚠️ 同时要改系统限制：

```bash
ulimit -n 65535
```

---

## 四、字符集 & SQL 行为（强烈建议）

### 字符集（防乱码 & emoji）

```ini
character-set-server = utf8mb4
collation-server = utf8mb4_general_ci
```

---

### SQL 严格模式（生产必开）

```ini
sql_mode = STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION
```

 防止脏数据悄悄写入

---

## 五、慢 SQL & 诊断（必须开启）

###  慢查询日志

```ini
slow_query_log = ON
slow_query_log_file = /data/mysql/slow.log
long_query_time = 1
log_queries_not_using_indexes = ON
```

 排查性能瓶颈**唯一可靠手段**

---

## 六、Binlog（主从 / 备份场景）

### Binlog 基本配置

```ini
server-id = 1
log_bin = mysql-bin
binlog_format = ROW
expire_logs_days = 7
```

 ROW 模式最安全
 7 天一般够备份 + 回滚

---

## 七、16G 内存完整推荐示例（可直接用）

```ini
[mysqld]
# 基础
user = mysql
port = 3306
server-id = 1

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_general_ci

# InnoDB
innodb_buffer_pool_size = 10G
innodb_buffer_pool_instances = 8
innodb_log_file_size = 1G
innodb_log_files_in_group = 2
innodb_log_buffer_size = 64M
innodb_flush_log_at_trx_commit = 1

innodb_read_io_threads = 8
innodb_write_io_threads = 8

# 连接
max_connections = 300

# 内存控制
tmp_table_size = 128M
max_heap_table_size = 128M
sort_buffer_size = 4M
join_buffer_size = 4M

# 表缓存
table_open_cache = 4096
table_definition_cache = 4096
open_files_limit = 65535

# Binlog
log_bin = mysql-bin
binlog_format = ROW
sync_binlog = 1
expire_logs_days = 7

# 慢查询
slow_query_log = ON
slow_query_log_file = /data/mysql/slow.log
long_query_time = 1
log_queries_not_using_indexes = ON

# SQL 行为
sql_mode = STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION
```
