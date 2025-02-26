# 题目描述：

一群大雁往南飞,给定一个字符串记录地面上的游客听到的大雁叫声,请给出叫声`最少`由几只大雁发出。

**具体的**

- 大雁发出的完整叫声为”quack“,因为有多只大雁同一时间嘎嘎作响,所以字符串中可能会混合多个”quack”

- 大雁会依次完整发出”quack”, 即字符串中q,u,a,c,k这5个字母按顺序完整存在才能计数为一只大雁如果不完整或者没有按顺序则不予计数。

- 如果字符串不是由q,u,a,ck字符组合而成,或者没有找到一只大雁,请返回-1

**输入描述**

一个字符串,包含大雁quack的叫声。1<=字符串长度<=1000,字符串中的字符只有`q,u,a,c,k`

**输出描述**

大雁的数量

**示例1**

输入

> quackquack

输出

>1

这个输入字符串正好包含两个完整的、连续的 "quack"。一只大雁可以发出这样的声音序列，所以最少需要 1 只大雁。

**示例2**

输入

> qaauucqckk

输出

>-1

这个输入字符串中的字符虽然都是 'q'、'u'、'a'、'c'、'k' 中的一个，但是它们的顺序不正确。没有一个完整的 "quack" 序列，因此返回 -1。


**示例3**

输入

>quacqkuackquack

输出

>2

这个输入字符串可以被解释为两只大雁的叫声交错：

- 第一只大雁：quack
- 第二只大雁：quackquack
- 第二只大雁发出了两次完整的 "quack"，而第一只大雁只发出了一次。

因此，最少需要 2 只大雁才能产生这样的叫声序列。

输入

>qququaauqccauqkkcauqqkcauuqkcaaukccakkck

输出

>5

这个输入字符串可以被解释为五只大雁的叫声交错。每只大雁至少完整发出了一次 "quack"。

# 解题思路
题目要求最少的数量

假设每只大雁叫完 `quack` 以后，还会接着叫，这样可以使得大雁数量最少

如果出现 `q`，但是没有大雁等待发出 `q` 这个音节，说明需要有一只新的大雁的叫声

使用一个 `List` 来记录每只大雁当等待发出的音节。遍历输入字符串，对每个字符进行处理：

- 检查是否有某只大雁正在等待发出当前音节，如果没有，且当前是 `q` 这个音节，这个就增加一只新的大雁来发出这个音节，否则视为异常
- 如果找到了匹配的大雁，更新这只大雁等待发出的音节。

# 源码
```java
package com.redjujubetree.huawei;

import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class AMain {

	private static List<Goose> list = new ArrayList<>();
	public static void main(String[] args) {
		try{
			Scanner scanner = new Scanner(System.in);
			String quacks = scanner.nextLine();
			for (int i = 0; i < quacks.length(); i++) {
				// 当前需要发生的音节
				char sound = quacks.charAt(i);
				// 下一个需要发出的音节
				Character nextSound = nextSound(sound);
				int i1 = hasWait(sound);
				if (i1 == -1) {
					// 需要增加大雁数量的情况
					if ('q' == sound) {
						list.add(new Goose('u'));
					} else {
						throw new IllegalArgumentException("-1");
					}
				} else {
					// 更新下一个需要发出的音节
					list.get(i1).sound = nextSound;
					// 如果当前音节是k，则表示该大雁已经发出了所有音节
					if ('k' == sound) {
						list.get(i1).complated = true;
					}
				}
			}
			System.out.println(list.stream().filter(goose -> goose.complated).count());
		} catch (Exception e) {
			System.out.println(-1);
		}

	}

	// 等待发出该音节的大雁
	private static int hasWait(char c) {
		for (int i = 0; i < list.size(); i++) {
			if (list.get(i).sound == c) {
				return i;
			}
		}
		return -1;
	}

	// 发出当前音节后，下一个可以发出的音节
	public static Character nextSound(char ch) {
		switch (ch) {
			case 'q':
				return 'u';
			case 'u':
				return 'a';
			case 'a':
				return 'c';
			case 'c':
				return 'k';
			case 'k':
				return 'q';
		}
		throw new IllegalArgumentException("-1");
	}
	private static class Goose {
		public char sound;
		public Boolean complated = false;
		public Goose(char sound) {
			this.sound = sound;
		}
	}
}

```
