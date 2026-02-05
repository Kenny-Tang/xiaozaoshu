# MySQL 5.7 生产环境配置优化指南 (16G内存)

MySQL 5.7 安装后，默认配置通常不适合生产环境。以下是针对 16G 内存服务器的关键配置调整建议：

## 核心内存配置


## 日志和事务配置

**innodb_log_file_size**
```ini
innodb_log_file_size = 512M
```
较大的 redo log 可以减少检查点频率，提高写入性能，但会增加崩溃恢复时间。

**innodb_log_buffer_size**
```ini
innodb_log_buffer_size = 16M
```
事务日志缓冲区，默认 16M 通常足够。

**innodb_flush_log_at_trx_commit**
```ini
innodb_flush_log_at_trx_commit = 2
```
- 1：最安全，每次事务提交都刷新到磁盘（推荐生产环境）
- 2：每秒刷新一次，性能更好但可能丢失 1 秒数据
- 0：性能最好但最不安全

## 连接和线程配置

**max_connections**
```ini
max_connections = 500
```
根据实际并发需求调整，避免设置过大导致内存耗尽。

**thread_cache_size**
```ini
thread_cache_size = 64
```
缓存线程以便重用，减少创建/销毁开销。

**max_allowed_packet**
```ini
max_allowed_packet = 64M
```
控制单个数据包大小，处理大字段或批量插入时需要调整。

## 查询缓存（慎用）

MySQL 5.7 的查询缓存在高并发场景下可能成为瓶颈：
```ini
query_cache_type = 0
query_cache_size = 0
```
建议关闭，使用应用层缓存（如 Redis）替代。

## 临时表和排序配置

**tmp_table_size / max_heap_table_size**
```ini
tmp_table_size = 64M
max_heap_table_size = 64M
```
控制内存临时表大小，超过后会转为磁盘临时表。

**sort_buffer_size**
```ini
sort_buffer_size = 2M
```
每个需要排序的连接分配的缓冲区，不要设置过大（会话级别）。

**read_rnd_buffer_size**
```ini
read_rnd_buffer_size = 4M
```
用于排序后读取行。

## 表和文件配置

**table_open_cache**
```ini
table_open_cache = 4096
```
缓存打开的表定义，根据表数量调整。

**open_files_limit**
```ini
open_files_limit = 65535
```
系统级别的打开文件限制。

**innodb_open_files**
```ini
innodb_open_files = 4096
```
InnoDB 可以同时打开的表文件数。

## 性能优化配置

**innodb_flush_method**
```ini
innodb_flush_method = O_DIRECT
```
避免双重缓冲，直接 I/O 写入磁盘。

**innodb_file_per_table**
```ini
innodb_file_per_table = 1
```
每个表使用独立表空间文件，便于管理和回收空间。

**innodb_io_capacity / innodb_io_capacity_max**
```ini
innodb_io_capacity = 2000
innodb_io_capacity_max = 4000
```
根据磁盘 IOPS 能力调整（SSD 可设置更高，如 4000/8000）。

## 二进制日志配置

**log_bin**
```ini
log_bin = mysql-bin
server_id = 1
binlog_format = ROW
expire_logs_days = 7
max_binlog_size = 500M
```
启用二进制日志用于复制和备份恢复。

## 慢查询日志

```ini
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
log_queries_not_using_indexes = 1
```
记录执行时间超过 2 秒的查询，便于性能分析。

## 字符集配置

```ini
character_set_server = utf8mb4
collation_server = utf8mb4_unicode_ci
```
推荐使用 utf8mb4 支持完整的 Unicode 字符。

## 完整配置示例 (my.cnf)

```ini
[mysqld]
# 基础配置
port = 3306
datadir = /var/lib/mysql
socket = /var/lib/mysql/mysql.sock
pid_file = /var/run/mysqld/mysqld.pid
user = mysql

# 字符集
character_set_server = utf8mb4
collation_server = utf8mb4_unicode_ci

# 内存配置
innodb_buffer_pool_size = 10G
innodb_buffer_pool_instances = 8
innodb_log_buffer_size = 16M

# 日志配置
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 1
innodb_flush_method = O_DIRECT

# 连接配置
max_connections = 500
max_allowed_packet = 64M
thread_cache_size = 64

# 查询缓存（关闭）
query_cache_type = 0
query_cache_size = 0

# 临时表和排序
tmp_table_size = 64M
max_heap_table_size = 64M
sort_buffer_size = 2M
read_rnd_buffer_size = 4M

# 表缓存
table_open_cache = 4096
open_files_limit = 65535
innodb_open_files = 4096

# InnoDB 配置
innodb_file_per_table = 1
innodb_io_capacity = 2000
innodb_io_capacity_max = 4000

# 二进制日志
log_bin = mysql-bin
server_id = 1
binlog_format = ROW
expire_logs_days = 7
max_binlog_size = 500M

# 慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
log_queries_not_using_indexes = 1

# 安全配置
sql_mode = STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION
```

## 配置后的检查步骤

1. **重启 MySQL 服务**
   ```bash
   systemctl restart mysqld
   ```

2. **验证配置生效**
   ```sql
   SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
   SHOW VARIABLES LIKE 'max_connections';
   ```

3. **监控内存使用**
   ```bash
   top -u mysql
   ```

4. **检查错误日志**
   ```bash
   tail -f /var/log/mysqld.log
   ```

这些配置是生产环境的基础优化，具体参数还需根据实际业务负载、读写比例、并发量等因素进行微调和持续优化。