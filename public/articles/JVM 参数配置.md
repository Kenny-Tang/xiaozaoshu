# 32G内存Web应用JVM参数配置建议

对于32G内存的Web应用(如Tomcat、Spring Boot等)，以下是推荐的JVM参数配置方案：

## 基础配置方案 (G1垃圾回收器)

```bash
# 内存设置
-Xms24g -Xmx24g                # 堆内存初始和最大值(建议设为物理内存的70-75%)
-XX:MetaspaceSize=512m          # 元空间初始大小
-XX:MaxMetaspaceSize=512m       # 元空间最大大小
-XX:MaxDirectMemorySize=1g      # 直接内存限制

# G1垃圾回收器设置
-XX:+UseG1GC                   # 使用G1垃圾回收器(JDK9+默认)
-XX:MaxGCPauseMillis=200        # 目标最大GC暂停时间(毫秒)
-XX:G1NewSizePercent=30         # 新生代最小占比(堆的30%)
-XX:G1MaxNewSizePercent=50      # 新生代最大占比(堆的50%)
-XX:InitiatingHeapOccupancyPercent=45  # 触发并发GC周期的堆占用率阈值

# 其他优化
-XX:+AlwaysPreTouch            # 启动时预分配内存，避免运行时分配
-XX:+UseStringDeduplication    # 字符串去重
-XX:+DisableExplicitGC         # 禁止System.gc()调用
-XX:+HeapDumpOnOutOfMemoryError # OOM时生成堆转储
-XX:HeapDumpPath=/path/to/dumps # 堆转储文件路径

# 日志设置(可选)
-Xlog:gc*,gc+heap=debug:file=gc.log:time,uptime,level,tags:filecount=10,filesize=50m
```

## 备选配置方案 (Parallel GC)

如果更注重吞吐量而非延迟，可以使用Parallel GC：

```bash
# 内存设置
-Xms24g -Xmx24g
-XX:MetaspaceSize=512m
-XX:MaxMetaspaceSize=512m
-XX:MaxDirectMemorySize=1g

# Parallel GC设置
-XX:+UseParallelGC
-XX:+UseParallelOldGC
-XX:ParallelGCThreads=16        # GC线程数(建议等于CPU核心数)
-XX:NewRatio=2                  # 新生代与老年代比例(1:2)
-XX:SurvivorRatio=8             # Eden与Survivor区比例

# 其他优化
-XX:+AlwaysPreTouch
-XX:+DisableExplicitGC
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/path/to/dumps
```

## 配置说明

1. **堆内存分配**：
    - 分配24G(约75%物理内存)，剩余内存留给操作系统、非堆内存和其他进程
    - 设置相同Xms和Xmx避免堆动态调整

2. **G1 GC优化**：
    - 适合大内存、低延迟要求的Web应用
    - 设置合理的MaxGCPauseMillis目标
    - 调整新生代占比以适应Web应用特点

3. **元空间**：
    - 设置固定大小避免动态扩展
    - 监控实际使用情况调整大小

4. **其他建议**：
    - 根据实际CPU核心数调整ParallelGCThreads
    - 启用AlwaysPreTouch避免运行时内存分配延迟
    - 设置OOM时的堆转储便于问题诊断

## 监控与调整建议

1. 使用以下命令监控JVM状态：
   ```bash
   jstat -gc <pid> 1000
   jcmd <pid> VM.native_memory
   ```

2. 关注GC日志中的：
    - Full GC频率
    - 平均GC暂停时间
    - 内存晋升情况

3. 根据监控结果可能需要调整：
    - 如果频繁Full GC，可能需要增加堆大小或调整新生代比例
    - 如果GC暂停时间过长，可以尝试减小MaxGCPauseMillis
    - 如果元空间使用接近上限，适当增加MaxMetaspaceSize

实际应用中，建议先使用这些参数进行压力测试，然后根据具体表现进行微调。