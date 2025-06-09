**MySQL** 做双主，遇到的这个错误：

```
Could not execute Update_rows event on table ... Error_code: 1032
```

是 **MySQL 主从复制时的经典错误之一**，通常表示：

> 从库试图应用主库上的某条更新语句，但 **在从库中找不到这条记录**。

---

## ❗ 错误分析（Error_code: 1032）

这是 MySQL 的错误代码 `1032`：

> **Error 1032 (HY000): Can't find record in 'your_table'**

这通常发生在以下情况：

- 主库执行了 `UPDATE` 一行记录
- 这个 `UPDATE` 被写进 binlog
- 从库执行这个 `UPDATE` 时，发现**这条记录在从库不存在**（可能被删了，或同步中丢了）

---

## 🧩 常见原因

1. **从库数据和主库不一致**（最常见 ✅）
2. **从库某些表被手动更改或删除了数据**
3. **多线程复制 + 并发下的事务顺序问题**
4. **主库使用了 `ROW` 格式 binlog，但从库表结构不一致**
5. **从库 IO 线程或 SQL 线程之前中断，某些日志未完整应用**

---

## 🛠️ 解决方案

### ✅ 方法 1：跳过错误（应急用）

```sql
STOP SLAVE;
SET GLOBAL sql_slave_skip_counter = 1;
START SLAVE;
```

然后再执行：
```sql
SHOW SLAVE STATUS\G
```
看 `Seconds_Behind_Master` 是否恢复。

> ⚠️ 注意：这个方法**只是跳过一个错误事件**，**可能会导致数据进一步不一致**，**仅用于临时处理**。

---

### ✅ 方法 2：重新同步这张表（推荐）

适合你这种只某一张表数据不同步的情况。

**步骤如下：**

#### （1）在主库导出这张表
```bash
mysqldump -u root -p --single-transaction --skip-lock-tables your_database your_table > your_table.sql
```

#### （2）在从库导入这张表（覆盖）
```bash
mysql -u root -p your_database < your_table.sql
```

#### （3）重新启动复制
```sql
START SLAVE;
```

---

### ✅ 方法 3：彻底重做从库（如果不止一张表）

如果数据已经严重不一致，可以考虑：

1. **停止从库复制**
2. **重新用 `mysqldump` 或 `xtrabackup` 从主库做一次完整的备份**
3. **在从库恢复数据**
4. **重新设定主从**

---

## 🔎 小贴士：看错误详情

建议你执行：
```sql
SHOW SLAVE STATUS\G
```

重点看这几项：

- `Last_Error`（错误内容）
- `Relay_Log_File`、`Relay_Log_Pos`（出错位置）
- `Retrieved_Gtid_Set` 和 `Executed_Gtid_Set`（如果用 GTID）

---