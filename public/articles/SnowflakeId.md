
# Snowflake Algorithm

雪花算法（Snowflake Algorithm）是一种分布式唯一 ID 生成算法，由 Twitter 提出。它生成的 ID 是 64 位整数，通常用于数据库主键或分布式系统中唯一标识符。

雪花算法 ID 结构
一个典型的 64 位 Snowflake ID 分为以下部分：
- 符号位 (1 bit): 固定为 0，表示正数。
- 时间戳部分 (41 bits): 当前时间戳的毫秒值，相对于自定义起始时间的偏移量。
- 机器 ID (10 bits): 用于标识生成 ID 的节点（数据中心+机器）。
- 序列号 (12 bits): 用于同一毫秒内生成多个 ID。

基于Twitter的Snowflake算法实现分布式高效有序ID生产黑科技(sequence)——升级版Snowflake

SnowFlake的结构如下(每部分用-分开):<br>
0 - 0000000000 0000000000 0000000000 0000000000 0 - 00000 - 00000 - 000000000

1位标识，由于long基本类型在Java中是带符号的，最高位是符号位，正数是0，负数是1，所以id一般是正数，最高位是0


41位时间截(毫秒级)，注意，41位时间截不是存储当前时间的时间截，而是存储时间截的差值（当前时间截 - 开始时间截)
得到的值），这里的的开始时间截，一般是我们的id生成器开始使用的时间，由我们程序来指定的（如下 EPOCH 属性）。
41位的时间截，可以使用69年，年T = (1L << 41) / (1000L * 60 * 60 * 24 * 365) = 69

10位的数据机器位，可以部署在1024个节点，包括5位dataCenterId和5位workerId

12位序列，毫秒内的计数，12位的计数顺序号支持每个节点每毫秒(同一机器，同一时间截)产生4096个ID序号

加起来刚好64位，为一个Long型。

SnowFlake的优点是，整体上按照时间自增排序，并且整个分布式系统内不会产生ID碰撞(由数据中心ID和机器ID作区分)，
并且效率较高，经测试，SnowFlake每秒能够产生26万ID左右。

特性：

1. 解决跨毫秒起始值每次为0开始的情况（避免末尾必定为偶数，而不便于取余使用问题）<p>
2. 解决高并发场景中获取时间戳性能问题<p>
3. 支撑根据JVM_PID计算workerId

以下是 Java 实现代码：

SnowflakeIdGenerator
```java
public class SnowflakeIdGenerator {

	private static final Logger logger = LoggerFactory.getLogger(SnowflakeIdGenerator.class);
	/**
	 * 时间起始标记点，作为基准，一般取系统的最近时间（一旦确定不能变动）
	 */
	private static final long EPOCH = 1577808000000L;
	/**
	 * 机器标识位数
	 */
	private final long workerIdBits = 6L;
	private final long datacenterIdBits = 4L;
	private final long maxWorkerId = -1L ^ (-1L << workerIdBits);
	private final long maxDatacenterId = -1L ^ (-1L << datacenterIdBits);
	/**
	 * 毫秒内自增位
	 */
	private final long sequenceBits = 12L;
	private final long workerIdShift = sequenceBits;
	private final long datacenterIdShift = sequenceBits + workerIdBits;
	/**
	 * 时间戳左移动位
	 */
	private final long timestampLeftShift = sequenceBits + workerIdBits + datacenterIdBits;
	private final long sequenceMask = -1L ^ (-1L << sequenceBits);

	private final long workerId;

	/**
	 * 数据标识 ID 部分
	 */
	private final long datacenterId;
	/**
	 * 并发控制
	 */
	private long sequence = 0L;
	/**
	 * 上次生产 ID 时间戳
	 */
	private long lastTimestamp = -1L;
	/**
	 * IP 地址
	 */
	private InetAddress inetAddress;

	public SnowflakeIdGenerator(InetAddress inetAddress) {
		this.inetAddress = inetAddress;
		this.datacenterId = getDatacenterId(maxDatacenterId);
		this.workerId = getMaxWorkerId(datacenterId, maxWorkerId);
		initLog();
	}

	private void initLog() {
		if (logger.isDebugEnabled()) {
			logger.debug("Initialization Sequence datacenterId:" + this.datacenterId + " workerId:" + this.workerId);
		}
	}

	/**
	 * 有参构造器
	 *
	 * @param workerId     工作机器 ID
	 * @param datacenterId 序列号
	 */
	public SnowflakeIdGenerator(long workerId, long datacenterId) {
		isFalse(workerId > maxWorkerId || workerId < 0,
				String.format("worker Id can't be greater than %d or less than 0", maxWorkerId));
		isFalse(datacenterId > maxDatacenterId || datacenterId < 0,
				String.format("datacenter Id can't be greater than %d or less than 0", maxDatacenterId));
		this.workerId = workerId;
		this.datacenterId = datacenterId;
		initLog();
	}

	/**
	 * 获取 maxWorkerId
	 */
	protected long getMaxWorkerId(long datacenterId, long maxWorkerId) {
		StringBuilder mpid = new StringBuilder();
		mpid.append(datacenterId);
		String name = ManagementFactory.getRuntimeMXBean().getName();
		if (!isBlank(name)) {
			/*
			 * GET jvmPid
			 */
			mpid.append(name.split("@")[0]);
		}
		/*
		 * MAC + PID 的 hashcode 获取16个低位
		 */
		return (mpid.toString().hashCode() & 0xffff) % (maxWorkerId + 1);
	}

	public static void main(String[] args) throws UnknownHostException {
		InetAddress localHost = InetAddress.getLocalHost();
		SnowflakeIdGenerator snowflakeIdGenerator1 = new SnowflakeIdGenerator(localHost);
		String pre = "";
		for (int i = 0; i < 100; i++) {
			pre += " ";
			System.out.print(pre);
			System.out.println(snowflakeIdGenerator1.nextId());
		}
	}

	public static boolean isBlank(String cs) {
		if (cs != null) {
			int length = cs.length();
			for (int i = 0; i < length; i++) {
				if (!Character.isWhitespace(cs.charAt(i))) {
					return false;
				}
			}
		}
		return true;
	}

	/**
	 * 数据标识id部分
	 */
	protected long getDatacenterId(long maxDatacenterId) {
		long id = 0L;
		try {
			if (null == this.inetAddress) {
				this.inetAddress = InetAddress.getLocalHost();
			}
			NetworkInterface network = NetworkInterface.getByInetAddress(this.inetAddress);
			if (null == network) {
				id = 1L;
			} else {
				byte[] mac = network.getHardwareAddress();
				if (null != mac) {
					id = ((0x000000FF & (long) mac[mac.length - 2]) | (0x0000FF00 & (((long) mac[mac.length - 1]) << 8))) >> 6;
					id = id % (maxDatacenterId + 1);
				}
			}
		} catch (Exception e) {
			logger.warn(" getDatacenterId: " + e.getMessage());
		}
		return id;
	}

	/**
	 * 获取下一个 ID
	 *
	 * @return 下一个 ID
	 */
	public synchronized long nextId() {
		long timestamp = timeGen();
		//闰秒
		if (timestamp < lastTimestamp) {
			long offset = lastTimestamp - timestamp;
			if (offset <= 5) {
				try {
					wait(offset << 1);
					timestamp = timeGen();
					if (timestamp < lastTimestamp) {
						throw new RuntimeException(String.format("Clock moved backwards.  Refusing to generate id for %d milliseconds", offset));
					}
				} catch (Exception e) {
					throw new RuntimeException(e);
				}
			} else {
				throw new RuntimeException(String.format("Clock moved backwards.  Refusing to generate id for %d milliseconds", offset));
			}
		}

		if (lastTimestamp == timestamp) {
			// 相同毫秒内，序列号自增
			sequence = (sequence + 1) & sequenceMask;
			if (sequence == 0) {
				// 同一毫秒的序列数已经达到最大
				timestamp = tilNextMillis(lastTimestamp);
			}
		} else {
			// 不同毫秒内，序列号置为 1 - 2 随机数
			sequence = ThreadLocalRandom.current().nextLong(1, 3);
		}

		lastTimestamp = timestamp;

		// 时间戳部分 | 数据中心部分 | 机器标识部分 | 序列号部分
		return ((timestamp - EPOCH) << timestampLeftShift)
				| (datacenterId << datacenterIdShift)
				| (workerId << workerIdShift)
				| sequence;
	}

	protected long tilNextMillis(long lastTimestamp) {
		long timestamp = timeGen();
		while (timestamp <= lastTimestamp) {
			timestamp = timeGen();
		}
		return timestamp;
	}

	protected long timeGen() {
		return SystemClock.currentTimeMillis();
	}

	private static void isFalse(boolean expression, String message, Object... params) {
		isTrue(!expression, message, params);
	}

	private static void isTrue(boolean expression, String message, Object... params) {
		if (!expression) {
			throw  new RuntimeException(String.format(message, params));
		}
	}

	/**
	 * 反解id的时间戳部分
	 */
	public static long parseIdTimestamp(long id) {
		// timestampLeftShift
		return (id>>22)+ EPOCH;
	}
}
```
解决高并发场景中获取时间戳性能问题 

SystemClock

```java
public class SystemClock {

    private final long period;
    private final AtomicLong now;

    private SystemClock(long period) {
        this.period = period;
        this.now = new AtomicLong(System.currentTimeMillis());
        scheduleClockUpdating();
    }

    private static SystemClock instance() {
        return InstanceHolder.INSTANCE;
    }

    public static long currentTimeMillis() {
        return instance()._currentTimeMillis();
    }

    public static String nowDate() {
        return new Timestamp(instance()._currentTimeMillis()).toString();
    }

    private void scheduleClockUpdating() {
        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(runnable -> {
            Thread thread = new Thread(runnable, "System Clock");
            thread.setDaemon(true);
            return thread;
        });
        scheduler.scheduleAtFixedRate(() -> now.set(System.currentTimeMillis()), period, period, TimeUnit.MILLISECONDS);
    }

    private long _currentTimeMillis() {
        return now.get();
    }

    private static class InstanceHolder {
        public static final SystemClock INSTANCE = new SystemClock(1);
    }
}
```