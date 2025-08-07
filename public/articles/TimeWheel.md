
# TimeWheel（时间轮）

时间轮是一种高效的定时器数据结构，被广泛应用在各种系统中，比如Netty、Kafka等。

以下是时间轮的原理、实现方式、优缺点以及实际应用。

时间轮的主要特点：

1. 高效的时间复杂度
2. 适合大量定时任务
3. 内存使用相对固定
4. 适合短时间范围的定时任务

我需要从以下几个方面来解释：

1. 基本原理和概念
2. 数据结构设计
3. 核心算法
4. 代码实现示例
5. 优缺点分析
6. 实际应用场景

## 1. 基本原理

### 概念图解

```
时间轮示意图（8个槽位，每个槽位代表1秒）:
     0   1   2   3   4   5   6   7
   ┌───┬───┬───┬───┬───┬───┬───┬───┐
   │ A │   │ B │   │   │ C │   │   │
   │   │   │   │   │   │   │   │   │
   └───┴───┴───┴───┴───┴───┴───┴───┘
     ↑
   当前指针

任务A: 延迟0秒执行
任务B: 延迟2秒执行  
任务C: 延迟5秒执行
```

### 核心思想

* **环形数组**：使用固定大小的环形数组作为"轮子"
* **时间槽**：每个数组元素代表一个时间槽
* **指针推进**：定时器推进指针，扫描当前时间槽
* **任务链表**：每个时间槽维护一个任务链表

## 2. 数据结构设计

### Java 实现

```java
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class TimeWheel {
    
    /**
     * 时间轮任务
     */
    public static class TimerTask {
        private final long delayMs;        // 延迟时间(毫秒)
        private final Runnable task;       // 任务内容
        private volatile TimerTaskEntry entry; // 任务条目
        
        public TimerTask(long delayMs, Runnable task) {
            this.delayMs = delayMs;
            this.task = task;
        }
        
        public void run() {
            task.run();
        }
        
        // getter/setter...
    }
    
    /**
     * 任务链表节点
     */
    public static class TimerTaskEntry {
        private volatile TimerTaskEntry next;
        private volatile TimerTaskEntry prev;
        private final TimerTask timerTask;
        private final long expirationMs;   // 到期时间
        
        public TimerTaskEntry(TimerTask timerTask, long expirationMs) {
            this.timerTask = timerTask;
            this.expirationMs = expirationMs;
            this.next = null;
            this.prev = null;
            timerTask.entry = this;
        }
    }
    
    /**
     * 时间槽（双向链表）
     */
    public static class TimerTaskList {
        private final AtomicInteger taskCounter;
        private final TimerTaskEntry root;
        private final ReentrantReadWriteLock.ReadLock readLock;
        private final ReentrantReadWriteLock.WriteLock writeLock;
        
        public TimerTaskList(AtomicInteger taskCounter) {
            this.taskCounter = taskCounter;
            this.root = new TimerTaskEntry(null, -1L);
            this.root.next = root;
            this.root.prev = root;
            
            ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
            this.readLock = rwLock.readLock();
            this.writeLock = rwLock.writeLock();
        }
        
        /**
         * 添加任务到链表
         */
        public void add(TimerTaskEntry entry) {
            writeLock.lock();
            try {
                TimerTaskEntry tail = root.prev;
                entry.next = root;
                entry.prev = tail;
                tail.next = entry;
                root.prev = entry;
                taskCounter.incrementAndGet();
            } finally {
                writeLock.unlock();
            }
        }
        
        /**
         * 移除任务
         */
        public void remove(TimerTaskEntry entry) {
            writeLock.lock();
            try {
                entry.next.prev = entry.prev;
                entry.prev.next = entry.next;
                entry.next = null;
                entry.prev = null;
                taskCounter.decrementAndGet();
            } finally {
                writeLock.unlock();
            }
        }
        
        /**
         * 清空并返回所有任务
         */
        public List<TimerTaskEntry> flush() {
            List<TimerTaskEntry> entries = new ArrayList<>();
            writeLock.lock();
            try {
                TimerTaskEntry entry = root.next;
                while (entry != root) {
                    TimerTaskEntry next = entry.next;
                    remove(entry);
                    entries.add(entry);
                    entry = next;
                }
            } finally {
                writeLock.unlock();
            }
            return entries;
        }
    }
}
```

## 3. 核心算法实现

```java
public class HashedWheelTimer {
    private final long tickDuration;      // 每个时间槽的时间跨度
    private final int wheelSize;          // 时间轮大小
    private final long interval;          // tickDuration * wheelSize
    private final TimerTaskList[] wheel;  // 时间轮数组
    private final AtomicInteger taskCounter;
    
    private volatile long currentTime;     // 当前时间
    private final ExecutorService taskExecutor; // 任务执行器
    private final ScheduledExecutorService wheelExecutor; // 时间轮推进器
    
    public HashedWheelTimer(long tickDuration, int wheelSize) {
        this.tickDuration = tickDuration;
        this.wheelSize = wheelSize;
        this.interval = tickDuration * wheelSize;
        this.wheel = new TimerTaskList[wheelSize];
        this.taskCounter = new AtomicInteger(0);
        this.currentTime = System.currentTimeMillis();
        
        // 初始化时间槽
        for (int i = 0; i < wheelSize; i++) {
            wheel[i] = new TimerTaskList(taskCounter);
        }
        
        this.taskExecutor = Executors.newCachedThreadPool();
        this.wheelExecutor = Executors.newSingleThreadScheduledExecutor();
        
        // 启动时间轮
        startWheel();
    }
    
    /**
     * 添加定时任务
     */
    public void addTask(TimerTask timerTask) {
        long expiration = currentTime + timerTask.delayMs;
        
        if (timerTask.delayMs < tickDuration) {
            // 立即执行
            taskExecutor.submit(timerTask::run);
        } else {
            // 添加到时间轮
            addToWheel(timerTask, expiration);
        }
    }
    
    /**
     * 将任务添加到时间轮
     */
    private void addToWheel(TimerTask timerTask, long expiration) {
        long relativeTime = expiration - currentTime;
        
        if (relativeTime < interval) {
            // 在当前时间轮范围内
            int slotIndex = (int) ((expiration / tickDuration) % wheelSize);
            TimerTaskList slot = wheel[slotIndex];
            TimerTaskEntry entry = new TimerTaskEntry(timerTask, expiration);
            slot.add(entry);
        } else {
            // 超出当前时间轮范围，需要多层时间轮或重新调度
            // 这里简化处理，实际应该有层级时间轮
            scheduleForLater(timerTask, expiration);
        }
    }
    
    /**
     * 启动时间轮
     */
    private void startWheel() {
        wheelExecutor.scheduleAtFixedRate(() -> {
            try {
                tick();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }, tickDuration, tickDuration, TimeUnit.MILLISECONDS);
    }
    
    /**
     * 时间轮前进一个刻度
     */
    private void tick() {
        currentTime += tickDuration;
        int slotIndex = (int) ((currentTime / tickDuration) % wheelSize);
        TimerTaskList currentSlot = wheel[slotIndex];
        
        // 获取当前槽位的所有任务
        List<TimerTaskEntry> entries = currentSlot.flush();
        
        for (TimerTaskEntry entry : entries) {
            if (entry.expirationMs <= currentTime) {
                // 任务到期，执行
                taskExecutor.submit(entry.timerTask::run);
            } else {
                // 任务未到期，重新添加到时间轮
                addToWheel(entry.timerTask, entry.expirationMs);
            }
        }
    }
    
    /**
     * 处理超出当前轮范围的任务
     */
    private void scheduleForLater(TimerTask timerTask, long expiration) {
        long delay = expiration - System.currentTimeMillis();
        wheelExecutor.schedule(() -> addTask(timerTask), delay, TimeUnit.MILLISECONDS);
    }
    
    /**
     * 关闭时间轮
     */
    public void shutdown() {
        wheelExecutor.shutdown();
        taskExecutor.shutdown();
    }
}
```

## 4. 层级时间轮（Hierarchical Timing Wheels）

```java
/**
 * 层级时间轮实现
 */
public class HierarchicalTimeWheel {
    private final long tickMs;
    private final int wheelSize;
    private final long startMs;
    private final AtomicInteger taskCounter;
    private final DelayQueue<TimerTaskList> delayQueue;
    private final TimerTaskList[] buckets;
    private long currentTimeMs;
    
    // 上层时间轮
    private volatile HierarchicalTimeWheel overflowWheel;
    
    public HierarchicalTimeWheel(long tickMs, int wheelSize, long startMs, 
                                AtomicInteger taskCounter, DelayQueue<TimerTaskList> delayQueue) {
        this.tickMs = tickMs;
        this.wheelSize = wheelSize;
        this.startMs = startMs;
        this.taskCounter = taskCounter;
        this.delayQueue = delayQueue;
        this.currentTimeMs = startMs - (startMs % tickMs);
        
        this.buckets = new TimerTaskList[wheelSize];
        for (int i = 0; i < wheelSize; i++) {
            buckets[i] = new TimerTaskList(taskCounter);
        }
    }
    
    /**
     * 添加任务到层级时间轮
     */
    public boolean add(TimerTaskEntry timerTaskEntry) {
        long expiration = timerTaskEntry.expirationMs;
        long delayMs = expiration - currentTimeMs;
        
        if (expiration < currentTimeMs + tickMs) {
            // 已过期
            return false;
        } else if (delayMs < interval()) {
            // 在当前层范围内
            long virtualId = expiration / tickMs;
            int bucketIndex = (int) (virtualId % wheelSize);
            TimerTaskList bucket = buckets[bucketIndex];
            bucket.add(timerTaskEntry);
            
            // 设置过期时间
            if (bucket.setExpiration(virtualId * tickMs)) {
                delayQueue.offer(bucket);
            }
            return true;
        } else {
            // 添加到上层时间轮
            if (overflowWheel == null) {
                addOverflowWheel();
            }
            return overflowWheel.add(timerTaskEntry);
        }
    }
    
    /**
     * 推进时间轮
     */
    public void advanceClock(long timeMs) {
        if (timeMs >= currentTimeMs + tickMs) {
            currentTimeMs = timeMs - (timeMs % tickMs);
            if (overflowWheel != null) {
                overflowWheel.advanceClock(currentTimeMs);
            }
        }
    }
    
    private long interval() {
        return tickMs * wheelSize;
    }
    
    private synchronized void addOverflowWheel() {
        if (overflowWheel == null) {
            overflowWheel = new HierarchicalTimeWheel(
                interval(),
                wheelSize,
                currentTimeMs,
                taskCounter,
                delayQueue
            );
        }
    }
}
```

## 5. 使用示例

```java
public class TimeWheelExample {
    public static void main(String[] args) throws InterruptedException {
        HashedWheelTimer timer = new HashedWheelTimer(100, 512); // 100ms刻度，512个槽位
        
        // 添加不同延迟的任务
        timer.addTask(new TimerTask(1000, () -> 
            System.out.println("Task 1 executed at: " + System.currentTimeMillis())));
        
        timer.addTask(new TimerTask(2500, () -> 
            System.out.println("Task 2 executed at: " + System.currentTimeMillis())));
        
        timer.addTask(new TimerTask(5000, () -> 
            System.out.println("Task 3 executed at: " + System.currentTimeMillis())));
        
        // 让程序运行一段时间
        Thread.sleep(10000);
        
        timer.shutdown();
    }
}
```

## 6. 时间复杂度分析

| 操作     | 时间复杂度        |
|--------|--------------|
| 添加任务   | O(1)         |
| 删除任务   | O(1)         |
| 执行到期任务 | O(m) m为到期任务数 |

## 7. 优缺点分析

### 优点

* **高效性**：O(1)的添加和删除操作
* **内存可控**：内存使用量相对固定
* **适合高并发**：锁竞争少
* **批量处理**：可以批量处理到期任务

### 缺点

* **精度限制**：受时间槽粒度限制
* **内存占用**：即使没有任务也要维护所有槽位
* **长延迟处理**：需要层级时间轮或其他机制

## 8. 实际应用

### Netty 中的 HashedWheelTimer

```java
// Netty 使用示例
HashedWheelTimer timer = new HashedWheelTimer(100, TimeUnit.MILLISECONDS, 512);

Timeout timeout = timer.newTimeout(new TimerTask() {
    @Override
    public void run(Timeout timeout) throws Exception {
        System.out.println("Task executed");
    }
}, 5, TimeUnit.SECONDS);

// 可以取消任务
timeout.cancel();
```

### Kafka 中的时间轮

Kafka 使用层级时间轮来处理延迟操作，如延迟生产、延迟拉取等。

时间轮是一种非常高效的定时器实现，特别适合需要处理大量定时任务的场景。通过合理的参数配置和层级设计，可以在保证性能的同时支持各种时间范围的定时需求。
