# 线程安全
当多个线程同时访问同一个对象时，如果不考虑这些线程的调度和执行，也不需要其他额外的操作，得到的结果都是我们期望的结果，则可以认为这个对象是线程安全的。
## 哪些对象是线程安全的
1. 不可变量 Immutable
   被final 声明的对象只要在构造的时候没有出现 this 逃逸这个对象就可以说是线程安全的。
   1.1 对于基本数据类型，定义时声明为 final 即可
   1.2 对于对象数据类型，需要自己保证；如：String、Integer等对象

2. 局部变量
   由于局部变量不可能被多线程访问，所以肯定是线程安全的。
## 线程安全的实现方法
### 互斥同步
1. synchronized
2. ReentrantLock
   与synchronized 相比，增加了一些高级的功能
    - 等待可中断
    - 实现了公平锁
    - 锁绑定多个条件

推荐优先使用 synchronized 关键字

- synchronized 语法简单
- Lock 需要自己释放锁，需要在finally中释放，synchronized 锁的释放是有jvm 来保证的
- 经过十几年的优化，synchronized 的性能差距和Lock已经变得很小，在绝大部分情况下都在一个可以接受的范围内。
### 非阻塞同步
借助于硬件指令
- 测试并设置 Test-and-Set
- 获取并增加 Fetch-and-Increase
- 交换 Swap
- 比较并交换 Compare-and-Swap（CAS 会有ABA问题产生）
- 加载链接/条件存储 Load-link / Store-Conditional

JDK 5 之后 在sun.misc.Unsafe 中提供了这些方法，这些方法会被编译成平台相关的指令。

# 锁优化
## 适应性自旋
如果一个线程请求了正在被其他线程访问的资源，多尝试几次，如果能获得锁，则认为下次大概率也会获得锁，增加下次尝试的次数，如果没有获得可能认为下次大概率也不能获得，可以直接阻塞线程。
## 锁消除
如果即时编译器检测到一段同步代码不可能存在锁竞争的情况，则会将锁去掉
## 锁粗化
如果一段代码频繁的操作加锁和解锁，加锁和解锁的性能消耗超过了代码本身，这个时候可以考虑把锁的范围扩大一下，减少加锁和解锁的次数。
## 轻量级锁
<div class="table-wrapper"><table style="width: 800px" border="1" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td rowspan="2" valign="top" width="76">
<p><strong>锁状态</strong></p>
</td>
<td colspan="3" valign="top" width="160">
<p align="center">25 bit</p>
</td>
<td rowspan="2" valign="top" width="120">
<p align="center">4bit</p>
</td>
<td valign="top" width="120">
<p>1bit</p>
</td>
<td valign="top" width="110">
<p>2bit</p>
</td>
</tr>
<tr>
<td colspan="2" valign="top" width="70">
<p>23bit</p>
</td>
<td valign="top" width="80">
<p>2bit</p>
</td>
<td valign="top" width="120">
<p>是否是偏向锁</p>
</td>
<td valign="top" width="110">
<p>锁标志位</p>
</td>
</tr>
<tr>
<td valign="top" width="105">
<p>轻量级锁</p>
</td>
<td colspan="5" valign="top" width="390">
<p>指向栈中锁记录的指针</p>
</td>
<td valign="top" width="110">
<p>00</p>
</td>
</tr>
<tr>
<td valign="top" width="105">
<p>重量级锁</p>
</td>
<td colspan="5" valign="top" width="390">
<p>指向互斥量（重量级锁）的指针</p>
</td>
<td valign="top" width="110">
<p>10</p>
</td>
</tr>
<tr>
<td valign="top" width="105">
<p>GC标记</p>
</td>
<td colspan="5" valign="top" width="390">
<p>空</p>
</td>
<td valign="top" width="110">
<p>11</p>
</td>
</tr>
<tr>
<td valign="top" width="105">
<p>偏向锁</p>
</td>
<td valign="top" width="70">
<p>线程ID</p>
</td>
<td colspan="2" valign="top" width="80">
<p>Epoch</p>
</td>
<td valign="top" width="120">
<p>对象分代年龄</p>
</td>
<td valign="top" width="120">
<p>1</p>
</td>
<td valign="top" width="110">
<p>01</p>
</td>
</tr>
<tr>
<td valign="top" width="105">
<p>无锁</p>
</td>
<td colspan="3" valign="top" width="150">
<p>对象的hashCode</p>
</td>
<td valign="top" width="120">
<p>对象分代年龄</p>
</td>
<td valign="top" width="120">
<p>0</p>
</td>
<td valign="top" width="110">
<p>01</p>
</td>
</tr>
</tbody>
</table></div>

锁的状态总共有四种：无锁状态、偏向锁、轻量级锁和重量级锁。随着锁的竞争，锁可以从偏向锁升级到轻量级锁，再升级的重量级锁（但是锁的升级是单向的，也就是说只能从低到高升级，不会出现锁的降级）

加锁过程：
1. 检查当前有没有锁  如果 锁状态 为 01 表示没有 拷贝一份锁记录Lock Record 在栈帧中
2. 虚拟机将使用CAS操作尝试将对象的Mark Word更新为指向Lock Record的指针，并将Lock record里的owner指针指向object mark word。如果更新成功，则执行步骤（3），否则执行步骤（4）。
3. 如果这个更新动作成功了，那么这个线程就拥有了该对象的锁，并且对象Mark Word的锁标志位设置为“00”，即表示此对象处于轻量级锁定状态；
4. 如果这个更新操作失败了，虚拟机首先会检查对象的Mark Word是否指向当前线程的栈帧，如果是就说明当前线程已经拥有了这个对象的锁，那就可以直接进入同步块继续执行。
   否则说明多个线程竞争锁，轻量级锁就要膨胀为重量级锁，锁标志的状态值变为“10”，Mark Word中存储的就是指向重量级锁（互斥量）的指针，后面等待锁的线程也要进入阻塞状态。
   而当前线程便尝试使用自旋来获取锁，自旋就是为了不让线程阻塞，而采用循环去获取锁的过程。
## 偏向锁
偏向锁中的偏， 指的是偏心的意思，他会偏向于第一个获得它的线程，如果在接下来的执行过程中，该锁一直没有被其他线程获取，则持有偏向锁的线程永远不需要进行同步。

1. 访问Mark Word中偏向锁的标识是否设置成1，锁标志位是否为01——确认为可偏向状态。
2. 如果为可偏向状态，则测试线程ID是否指向当前线程，如果是，进入步骤（5），否则进入步骤（3）。
3. 如果线程ID并未指向当前线程，则通过CAS操作竞争锁。如果竞争成功，则将Mark Word中线程ID设置为当前线程ID，然后执行（5）；如果竞争失败，执行（4）。
4. 如果CAS获取偏向锁失败，则表示有竞争。当到达全局安全点（safepoint）时获得偏向锁的线程被挂起，偏向锁升级为轻量级锁，然后被阻塞在安全点的线程继续往下执行同步代码。
5. 执行同步代码。

- 计算过hash 的对象无法进入偏向状态
- 当一个对象处于偏向状态，收到了计算hash 的请求，会立马撤销偏向状态，并且锁会被升级为重量锁。