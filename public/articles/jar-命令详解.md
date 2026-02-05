# jar 命令详解（中文，实用示例）

`jar` 是 JDK 自带的工具，用来创建、查看、更新、解包 Java Archive（`.jar`）文件。它本质上是对 ZIP 格式的封装，额外支持 `META-INF/MANIFEST.MF`（清单）以及 Java 运行时相关的元数据。下面把常用选项、语法、示例、清单（Manifest）说明和常见坑一并列清楚，方便查阅。

在有些情况下, 我们需要修改jar中的某个配置文件, 但是又不具备重新编译打包的条件, 这时就可以使用jar命令来直接修改jar包中的文件. 非常的方便. 
使用 `jar -xf your.jar path/to/config.file` 解压出配置文件, 修改后再使用 `jar -uf your.jar path/to/config.file` 更新回去即可.

---

## 基本语法

```
jar <options> <jar-file> [manifest-file] [-C dir] files...
```

选项通常可以组合使用（例如 `cvf`）。常见组合：`cvf`、`tvf`、`xvf`、`uf` 等。

---

## 常用选项（及含义）

* `c` — create：创建新的 JAR 文件。
* `t` — list/table：列出 JAR 内的文件清单（不解包）。
* `x` — extract：解包（将 JAR 内容解压到当前目录）。
* `u` — update：更新已有 JAR（在已有 JAR 中添加/替换文件）。
* `v` — verbose：详细输出（显示处理的每个文件）。
* `f` — file：指定输出或操作的 JAR 文件名（通常与前面的操作连写，如 `cvf`）。
* `m` — manifest：使用指定的清单文件（通常写作 `cfm`，将 `manifest-file` 插入 JAR）。
* `e` — entry point：指定可执行 JAR 的主类（Main-Class），常与 `c` 一起用作 `cfe`。
* `0` — store only（数字零）：不压缩（store），仅打包（有利于快速构建或某些签名场景）。
* `C dir` — change to directory：进入 `dir`，再将后续指定的文件/目录加入 JAR，常用于确保条目路径正确（`-C` 后的目录参数有单独空格）。
* `M` — do not create a manifest file from default（不创建默认 `META-INF/MANIFEST.MF`）。
* `i` — generate index（用于创建 jar 索引，通常和 `-u` / `-c` 一起在库场合用 `-i`）。

> 注意：`jar` 的选项常组合在一起（例如 `jar cvf`），相当于 `-c -v -f`。

---

## 常见命令示例

1. **创建 JAR（最常见）**

```bash
# 在 classes 目录下把所有类打包到 myapp.jar
jar cvf myapp.jar -C classes .
```

2. **创建并指定 manifest（包含 Main-Class）**

```bash
# 使用 manifest.txt，并将 classes 目录打包入 myapp.jar
jar cfm myapp.jar manifest.txt -C classes .
# manifest.txt 示例见下方
```

3. **快速创建可执行 JAR（用 -e 指定主类）**

```bash
# 指定入口类 com.example.Main
jar cfe myapp.jar com.example.Main -C classes .
```

`cfe` 含义：`c`（create）`f`（file）`e`（entrypoint），`com.example.Main` 要写完全限定类名（包含包名）。

4. **查看 JAR 列表**

```bash
jar tf myapp.jar        # 简洁
jar tvf myapp.jar       # 详细（verbose）
```

5. **解包 JAR**

```bash
jar xvf myapp.jar       # 解出全部到当前目录
# 或只解出清单
jar xvf myapp.jar META-INF/MANIFEST.MF
```

6. **更新 JAR（在已有 JAR 中添加或替换文件）**

```bash
# 将 classes 中更新的文件加入到 myapp.jar
jar uf myapp.jar -C classes .
```

7. **只打包资源或不压缩**

```bash
jar c0f resources.jar -C resources .
# 这里 0 是零，表示 store（不压缩）
```

---

## Manifest（`META-INF/MANIFEST.MF`）详解

Manifest 是一个文本文件，关键字段（每行 `Name: Value`），必须以空行结尾。最常用字段：

* `Manifest-Version: 1.0`（通常必需）
* `Main-Class: com.example.Main` — 指定可执行 JAR 的入口类（运行 `java -jar myapp.jar` 时使用）。
* `Class-Path: lib/a.jar lib/b.jar` — 相对路径列出运行时依赖的 JAR（空格分隔）。
* `Sealed: true` / `Name: ...` — 更细粒度的封包控制（用于包封装/安全）。

**示例 `manifest.txt`:**

```
Manifest-Version: 1.0
Main-Class: com.example.Main
Class-Path: lib/dependency1.jar lib/dependency2.jar

# 注意最后必须有一个空行（回车），否则某些 JVM 可能读取失败
```

要把这个 manifest 放进 JAR：`jar cfm myapp.jar manifest.txt -C classes .`

---

## 可执行 JAR：两种方式

1. 在 `MANIFEST.MF` 写 `Main-Class`，然后 `java -jar myapp.jar`。
2. 不写 `Main-Class`，但运行时用 `java -cp myapp.jar com.example.Main`（这种不是 `-jar` 模式，`Class-Path` manifest 不生效）。

---

## 与 zip 的区别

* `.jar` 是 `.zip` 格式（压缩容器），但 `jar` 提供对 `META-INF/MANIFEST.MF`、索引（`-i`）和运行时元数据的支持。
* `jar` 工具更适合 Java 类和库管理，能方便地设置 `Main-Class` 与 `Class-Path`。

---

## 签名与安全

* JAR 签名不是由 `jar` 工具完成的（`jarsigner` 用于签名/验证）。签名会在 `META-INF` 下生成 `.SF` 和 `.RSA/.DSA` 等文件。
* 签名后的 JAR 在更新时需要重新签名。

---

## 常见问题与排查

* **运行 `java -jar` 报 `no main manifest attribute`**：说明 `MANIFEST.MF` 中没有 `Main-Class`，需要创建或使用 `jar cfe`/`cfm` 指定。
* **Main-Class 指定了但运行报 ClassNotFoundException**：检查 jar 内是否确实包含对应的 `.class`（并且包路径正确），用 `jar tf` 验证。
* **manifest 无效/被覆盖**：使用 `jar cfm` 时，`manifest-file` 的内容会作为 JAR 的清单；若使用 `-M` 将阻止生成默认清单。更新 JAR（`u`）可能不会替换 manifest，注意操作顺序。
* **Class-Path 无效**：`Class-Path` 是相对于执行位置或 JAR 所在位置的相对路径，注意路径写法和空格分隔。
* **签名失效（更新 JAR 后）**：对签名 JAR 做 `jar uf` 会破坏签名；修改后需重新签名。

---

## 进阶提示

* 打包第三方库时，通常保持每个库为独立 JAR（放到 `lib/` 并在 `Manifest` 中用 `Class-Path` 指定），或者使用构建工具（Maven/Gradle）制作 uber-jar / fat-jar（将所有依赖合并到一个 JAR）。
* 对于模块化（Java 9+）项目，`module-info.class` 放在类路径或模块路径上；jar 本身不需要额外选项，但构建/运行方式可能不同（`--module-path` 等）。
* 若需要可重复构建（reproducible builds），可以使用 `-0`（不压缩）或对时间戳做统一处理（这超出 `jar` 本身范畴，通常由构建工具控制）。

---

## 典型命令速查表

```
jar cf my.jar files...        # 创建 my.jar
jar cvf my.jar files...       # 创建并显示详细过程
jar cfm my.jar mf.txt files.. # 创建并使用 mf.txt 作为 manifest
jar cfe my.jar MainClass files... # 创建并指定入口类
jar tf my.jar                 # 列出 my.jar 内容
jar tfv my.jar                # 详细列出
jar xvf my.jar                # 解包
jar uf my.jar files...        # 更新已有 jar（添加或替换）
jar c0f my.jar files...       # 不压缩地创建
```
