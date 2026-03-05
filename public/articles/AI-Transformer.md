> **Transformer 是从 RNN 序列模型体系中演化出来的，本质上是对“Attention 机制”的彻底强化与结构重构。**
# RNN（循环神经网络，Recurrent Neural Network） 时代（1990s–2014）

**RNN** 是一类专门用于处理**序列数据**的神经网络模型，比如：

* 📝 自然语言（文本）
* 🎙 语音信号
* 📈 时间序列数据
* 🎬 视频帧序列

它的核心特点是：**具有“记忆”能力**。
### RNN 核心思想
用 **`时间递归`** 处理序列。
> 当前输入 + 之前的隐藏状态 → 当前输出

数学表达：

&nbsp;&nbsp;&nbsp;&nbsp; $h_t = f(Wx_t + Uh_{t-1})$

&nbsp;&nbsp;&nbsp;&nbsp;  $y_t = g(Vh_t)$

其中：

* $x_t$：当前输入
* $h_{t-1}$：上一时刻的隐藏状态（记忆）
* $h_t$：当前隐藏状态
* $y_t$：当前输出
  
因为它有这样的结构：

```
        ┌─────────────┐
x_t →   │  神经网络单元 │ → y_t
        └─────↑───────┘
              │
           h_{t-1}
```

隐藏状态会不断“传递”下去，形成时间上的循环。

### 但存在严重问题：
> ❌ 梯度消失 / 梯度爆炸
<details>
  <summary>什么是梯度消失 / 梯度爆炸？</summary>

## “梯度”是什么？

在神经网络中，我们用：
$\theta = \theta - \eta \frac{\partial L}{\partial \theta}$

* $ \theta $：参数
* $ \eta $：学习率
* $ \frac{\partial L}{\partial \theta} $：梯度

梯度就是：

> “损失函数对参数的影响程度”


## 梯度消失（Vanishing Gradient）

在反向传播时：$\frac{\partial L}{\partial W} = 链式法则的连乘$

如果每一层的导数都 < 1，

比如：$0.5 × 0.5 × 0.5 × ... × 0.5$

多层相乘后 $≈ 0$

结果：

> 前面几层几乎收不到梯度信号

## 梯度爆炸（Exploding Gradient）

相反，如果：

$1.5 × 1.5 × 1.5 × ...$

就会：

$1.5^{50} ≈ 637621500$

结果：

* 梯度极大
* 参数剧烈震荡
* Loss 变成 NaN
* 训练崩溃
  
## 为什么会发生？

因为反向传播是：

$链式法则连续相乘$

层数越深：

* 小于1的数 → 趋近0
* 大于1的数 → 指数增长


## 总结

> 梯度消失是“信号衰减”
> 
> 梯度爆炸是“信号放大失控”
</details>
当序列很长时：

* 远距离信息难以保留
* 记忆能力下降

例如：

> 小明出生在北京...（中间100句话）...
> 他是哪里人？

普通 RNN 很难记住“北京”。

---

**为了解决这个问题，出现了**

### 1️⃣ LSTM（长短期记忆网络）

引入“门控机制”：

### 2️⃣ GRU（门控循环单元）

LSTM 的简化版本：

### 3️⃣ Transformer（当前主流）

👉 基于 Attention 机制
👉 不使用循环结构
👉 并行计算能力强


---

# Attention 的出现（2014）

2014 年，Dzmitry Bahdanau 提出 **Attention 机制**（用于机器翻译）。

### 核心改变

原来：

> 把整句话压缩成一个固定向量

Attention 改为：

> 在生成每个词时，对源句所有词“加权选择”

数学上：

$Attention(Q,K,V) = softmax(\frac{QK^T}{\sqrt{d}})V$

---

### 重要意义

Attention 让模型：

* 可以“回看”整个序列
* 缓解长距离问题
* 提升翻译效果

👉 但当时 **Attention 只是 RNN 的一个模块**。

---

# Self-Attention 的演化

接下来研究者意识到：

> 既然 Attention 这么好，那能不能让序列内部也互相注意？

于是提出：

## Self-Attention（自注意力）

* Query = Key = Value
* 每个 token 和所有 token 计算关系
* 建立全局依赖图

这一步是 Transformer 的直接前身。

---

# 真正的分水岭：2017 Transformer

标志性论文：

> **“Attention Is All You Need”**
> 作者：Ashish Vaswani 等
> 发布于 2017 年（NeurIPS）

###  核心创新

完全抛弃 RNN/CNN，提出：

1. **Self-Attention（自注意力）**
2. **Multi-Head Attention**
3. **Position Encoding**
4. **Encoder–Decoder 结构**

这就是 Transformer。

---
Transformer 不是凭空出现的。

它是从 RNN 序列建模体系中，通过 Attention 的不断强化，最终“推翻 RNN”而诞生的架构。

Transformer 是大模型时代真正的起点。
